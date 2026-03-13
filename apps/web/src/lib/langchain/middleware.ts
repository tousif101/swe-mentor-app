import { ChatAnthropic } from "@langchain/anthropic";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import type { BaseMessage, BaseMessageLike } from "@langchain/core/messages";
import type { LangGraphRunnableConfig } from "@langchain/langgraph";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@swe-mentor/shared";

import { getSupabaseClient, getUserId } from "./utils";
import { buildSystemPrompt, detectCoachingMode } from "./prompts";
import type { CoachingMode } from "./prompts";
import { RateLimitError } from "./errors";

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

  const summaryMessage = new SystemMessage(
    `[Conversation summary of earlier messages]\n${summaryResponse.content}`
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
  return async (
    state: { messages: BaseMessage[] },
    config: LangGraphRunnableConfig
  ): Promise<BaseMessageLike[]> => {
    const supabase = getSupabaseClient(config);
    const userId = getUserId(config);

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, role, target_role, focus_areas, company_name, company_size")
      .eq("id", userId)
      .single();

    // Get latest energy level from most recent check-in
    const { data: lastCheckIn } = await supabase
      .from("check_ins")
      .select("energy_level")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

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
    const systemPrompt = buildSystemPrompt(
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

    return [new SystemMessage(systemPrompt), ...state.messages];
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
  supabaseClient: SupabaseClient<Database>
): Promise<{ remaining: number; currentCount: number }> {
  const { data, error } = await supabaseClient.rpc(
    "check_and_increment_chat_usage"
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
export function wrapToolExecution<T>(
  fn: (input: T, config: LangGraphRunnableConfig) => Promise<string>
): (input: T, config: LangGraphRunnableConfig) => Promise<string> {
  return async (input: T, config: LangGraphRunnableConfig): Promise<string> => {
    try {
      return await fn(input, config);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unknown error occurred";
      return JSON.stringify({
        error: true,
        message: `Tool execution failed: ${message}. Please try a different approach.`,
      });
    }
  };
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
