import { ChatAnthropic } from "@langchain/anthropic";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import type { BaseMessage, BaseMessageLike } from "@langchain/core/messages";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@swe-mentor/shared";

import { getSupabaseClient, getUserId } from "./utils";
import { buildSystemPrompt, detectCoachingMode, augmentForSuspiciousInput } from "./prompts";
import type { CoachingMode } from "./prompts";
import { RateLimitError } from "./errors";
import { detectInjectionPatterns } from "./safety";

// ---------------------------------------------------------------------------
// 1. Summarization middleware config
// ---------------------------------------------------------------------------

const summarizationModel = new ChatAnthropic({
  model: "claude-haiku-4-5-20251001",
  maxTokens: 1000,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
});

const SUMMARIZATION_THRESHOLD = 20; // message count threshold
const KEEP_RECENT_MESSAGES = 10;

/**
 * Summarize older messages when the conversation exceeds the threshold.
 * Used as a preModelHook: receives state, returns state update with
 * llmInputMessages trimmed/summarized.
 */
export async function summarizationHook(
  state: { messages: BaseMessage[]; llmInputMessages: BaseMessage[] },
  _config: LangGraphRunnableConfig
): Promise<{
  messages?: BaseMessage[];
  llmInputMessages?: BaseMessage[];
}> {
  const messages = state.llmInputMessages ?? state.messages;

  if (messages.length <= SUMMARIZATION_THRESHOLD) {
    return {};
  }

  const toSummarize = messages.slice(0, -KEEP_RECENT_MESSAGES);
  const toKeep = messages.slice(-KEEP_RECENT_MESSAGES);

  // Only summarize human/AI messages (skip tool messages for summary input)
  const conversationText = toSummarize
    .filter(
      (m) =>
        m.getType() === "human" ||
        (m.getType() === "ai" && typeof m.content === "string")
    )
    .map((m) => `${m.getType() === "human" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");

  if (!conversationText.trim()) {
    return {};
  }

  const summaryResponse = await summarizationModel.invoke([
    new SystemMessage(
      "Summarize this conversation concisely, preserving key career context, " +
        "advice given, and action items. Keep it under 200 words."
    ),
    new HumanMessage(conversationText),
  ]);

  const summaryText =
    typeof summaryResponse.content === "string"
      ? summaryResponse.content
      : summaryResponse.content
          .filter((c): c is { type: "text"; text: string } => typeof c === "object" && "type" in c && c.type === "text")
          .map((c) => c.text)
          .join("");

  const summaryMessage = new SystemMessage(
    `[Conversation summary of earlier messages]\n${summaryText}`
  );

  return { llmInputMessages: [summaryMessage, ...toKeep] };
}

// ---------------------------------------------------------------------------
// 2. Dynamic system prompt
// ---------------------------------------------------------------------------

/**
 * Returns a prompt function for createReactAgent's `prompt` parameter.
 * Fetches user profile, detects coaching mode, and builds a personalized
 * system prompt on every model call.
 */
export function createDynamicPrompt() {
  // Cache profile and energy per invocation to avoid N+1 fetches during tool-calling turns
  let cachedUserId: string | null = null;
  let cachedProfile: Awaited<ReturnType<typeof fetchProfileAndEnergy>> | null = null;

  async function fetchProfileAndEnergy(supabase: SupabaseClient<Database>, userId: string) {
    const [profileResult, checkInResult] = await Promise.all([
      supabase
        .from("profiles")
        .select("name, role, target_role, focus_areas, company_name, company_size")
        .eq("id", userId)
        .single(),
      supabase
        .from("check_ins")
        .select("energy_level")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single(),
    ]);
    return { profile: profileResult.data, lastCheckIn: checkInResult.data };
  }

  return async (
    state: { messages: BaseMessage[] },
    config: LangGraphRunnableConfig
  ): Promise<BaseMessageLike[]> => {
    const supabase = getSupabaseClient(config);
    const userId = getUserId(config);

    // Reuse cached data within the same invocation (same userId)
    if (cachedUserId !== userId || !cachedProfile) {
      cachedProfile = await fetchProfileAndEnergy(supabase, userId);
      cachedUserId = userId;
    }

    const { profile, lastCheckIn } = cachedProfile;

    // Detect coaching mode from the last user message
    const lastUserMessage = [...state.messages]
      .reverse()
      .find((m) => m.getType() === "human");

    const lastMessageContent =
      lastUserMessage && typeof lastUserMessage.content === "string"
        ? lastUserMessage.content
        : "";

    const energyLevel = lastCheckIn?.energy_level ?? null;
    const mode: CoachingMode = detectCoachingMode(lastMessageContent, energyLevel);

    // Build system prompt (falls back gracefully if profile is null)
    let systemPrompt = buildSystemPrompt(
      {
        name: profile?.name ?? null,
        role: profile?.role ?? null,
        target_role: profile?.target_role ?? null,
        focus_areas: profile?.focus_areas ?? null,
        company_name: profile?.company_name ?? null,
        company_size: profile?.company_size ?? null,
      },
      mode
    );

    // Detect injection patterns and harden if suspicious
    const { suspicious } = detectInjectionPatterns(lastMessageContent);
    if (suspicious) {
      systemPrompt = augmentForSuspiciousInput(systemPrompt);
    }

    // Wrap only the last human message in <user_message> tags to establish trust boundary.
    // Only the newest message needs wrapping — historical messages were already processed.
    const lastHumanIdx = state.messages.map((m, i) => ({ m, i }))
      .reverse()
      .find(({ m }) => m.getType() === "human")?.i;
    const wrappedMessages = state.messages.map((m, i) => {
      if (i === lastHumanIdx && typeof m.content === "string") {
        // Strip any user-injected tag markers to prevent boundary escape
        const safeContent = m.content.replace(/<\/?user_message>/gi, "");
        return new HumanMessage(`<user_message>${safeContent}</user_message>`);
      }
      return m;
    });

    return [new SystemMessage(systemPrompt), ...wrappedMessages];
  };
}

// ---------------------------------------------------------------------------
// 3. Rate limit check
// ---------------------------------------------------------------------------

/**
 * Compute the next midnight UTC as reset time.
 */
function getNextMidnightUTC(): Date {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return tomorrow;
}

/**
 * Check rate limit by calling the check_and_increment_chat_usage RPC.
 * Throws RateLimitError if the user has exceeded their daily limit.
 *
 * Called once before agent invocation (not on every model call).
 */
export async function checkRateLimit(
  supabaseClient: SupabaseClient<Database>,
  userId: string
): Promise<{ remaining: number; currentCount: number }> {
  const { data, error } = await supabaseClient.rpc(
    "check_and_increment_chat_usage",
    { p_user_id: userId }
  );

  if (error) {
    throw new Error(`Rate limit check failed: ${error.message}`);
  }

  // RPC returns a TABLE — data is an array
  const result = (data as unknown as Array<{
    allowed: boolean;
    current_count: number;
    remaining: number;
  }>)?.[0];

  if (!result) {
    throw new Error("Rate limit RPC returned no data");
  }

  if (!result.allowed) {
    throw new RateLimitError(result.remaining, getNextMidnightUTC());
  }

  return { remaining: result.remaining, currentCount: result.current_count };
}

// ---------------------------------------------------------------------------
// 4. Tool error handling
// ---------------------------------------------------------------------------

/**
 * Wraps a tool call function so that failures return a graceful error
 * ToolMessage instead of crashing the agent.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function wrapToolExecution<T extends (...args: any[]) => Promise<string>>(
  fn: T
): T {
  const wrapped = async (...args: Parameters<T>): Promise<string> => {
    try {
      return await fn(...args);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      return JSON.stringify({
        error: true,
        message: `Tool execution failed: ${message}. Please try a different approach.`,
      });
    }
  };
  return wrapped as T;
}

// ---------------------------------------------------------------------------
// 5. Limits
// ---------------------------------------------------------------------------

/** Max model calls per single agent invocation. */
export const MODEL_CALL_LIMIT = 10;

/** Max tool calls per single agent invocation. */
export const TOOL_CALL_LIMIT = 15;

// ---------------------------------------------------------------------------
// 6. Assembled middleware config
// ---------------------------------------------------------------------------

/**
 * Middleware configuration for the mentor agent.
 *
 * Since createReactAgent doesn't support a middleware array directly,
 * this exports individual pieces that the API route composes:
 *
 * Order of execution:
 * 1. summarizationHook → preModelHook (trims old messages)
 * 2. dynamicPrompt → prompt param (injects personalized system prompt)
 * 3. checkRateLimit → called before agent.stream() in API route
 * 4. MODEL_CALL_LIMIT / TOOL_CALL_LIMIT → recursionLimit on agent config
 * 5. wrapToolExecution → wraps individual tool functions for error handling
 */
export const mentorMiddleware = {
  /** Use as createReactAgent's preModelHook */
  summarizationHook,
  /** Call createDynamicPrompt() and use result as createReactAgent's prompt */
  createDynamicPrompt,
  /** Call before agent.stream() in the API route */
  checkRateLimit,
  /** Wrap tool functions for graceful error handling */
  wrapToolExecution,
  /** Max model calls per invocation (use as recursionLimit) */
  modelCallLimit: MODEL_CALL_LIMIT,
  /** Max tool calls per invocation */
  toolCallLimit: TOOL_CALL_LIMIT,
} as const;
