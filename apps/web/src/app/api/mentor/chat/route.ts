import { NextRequest, NextResponse } from "next/server";
import { AIMessageChunk, HumanMessage } from "@langchain/core/messages";

import { createMentorAgent, mentorTools } from "@/lib/langchain";
import {
  createDynamicPrompt,
  checkRateLimit,
  summarizationHook,
  MODEL_CALL_LIMIT,
  TOOL_CALL_LIMIT,
} from "@/lib/langchain/middleware";
import { RateLimitError, ThrottleError } from "@/lib/langchain/errors";
import { validateAuth, AuthError } from "@/lib/langchain/auth";
import {
  checkThrottle,
  classifyTopic,
  validateOutput,
  DAILY_RATE_LIMIT,
  OFF_TOPIC_RESPONSE,
} from "@/lib/langchain/safety";

// ---------------------------------------------------------------------------
// Off-topic response handler — streams canned response without invoking agent
// ---------------------------------------------------------------------------

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@swe-mentor/shared";

async function handleOffTopicResponse(
  supabaseClient: SupabaseClient<Database>,
  userId: string,
  userMessage: string,
  providedConversationId?: string
) {
  // Resolve or create conversation
  let conversationId = providedConversationId;
  let conversationReady = !!providedConversationId;
  if (!conversationId) {
    conversationId = crypto.randomUUID();
    const { error: convErr } = await supabaseClient.from("conversations").insert({
      id: conversationId,
      user_id: userId,
    });
    if (convErr) {
      console.error("[mentor/chat] Failed to create off-topic conversation", convErr);
    } else {
      conversationReady = true;
    }
  }

  // Save user message and canned response for audit trail (best-effort — stream proceeds regardless)
  if (conversationReady) {
    const { error: msgErr } = await supabaseClient.from("messages").insert([
      { conversation_id: conversationId, role: "user" as const, content: userMessage },
      { conversation_id: conversationId, role: "assistant" as const, content: OFF_TOPIC_RESPONSE },
    ]);
    if (msgErr) {
      console.error("[mentor/chat] Failed to save off-topic messages", msgErr);
    }
  }

  // Stream canned response as SSE tokens
  const encoder = new TextEncoder();
  const words = OFF_TOPIC_RESPONSE.split(" ");
  const stream = new ReadableStream({
    async start(controller) {
      for (const word of words) {
        const token = word + " ";
        const data = JSON.stringify({ token, conversationId });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// Create agent with dynamic prompt and summarization hook
const agent = createMentorAgent({
  tools: mentorTools,
  prompt: createDynamicPrompt(),
  preModelHook: summarizationHook,
});

export async function POST(request: NextRequest) {
  try {
    const { user, supabaseClient } = await validateAuth(request);

    const body = await request.json();
    const { message, conversationId: providedConversationId } = body as {
      message?: string;
      conversationId?: string;
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    const MAX_MESSAGE_LENGTH = 4000;
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { error: `message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` },
        { status: 400 }
      );
    }

    // Throttle check (rapid-fire protection)
    const throttleResult = checkThrottle(user.id);
    if (!throttleResult.allowed) {
      throw new ThrottleError(throttleResult.retryAfterMs);
    }

    // Topic classification — off-topic messages get a canned response without consuming rate limit
    const topicResult = classifyTopic(message);
    if (!topicResult.onTopic) {
      return handleOffTopicResponse(supabaseClient, user.id, message, providedConversationId);
    }

    // Rate limit check (before agent invocation)
    await checkRateLimit(supabaseClient, user.id);

    // Resolve or create conversation
    let conversationId = providedConversationId;
    if (conversationId) {
      // Verify the conversation belongs to the authenticated user
      const { data: conv, error: convErr } = await supabaseClient
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("user_id", user.id)
        .single();
      if (convErr || !conv) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
    } else {
      conversationId = crypto.randomUUID();
      const { error: convErr } = await supabaseClient
        .from("conversations")
        .insert({
          id: conversationId,
          user_id: user.id,
        });
      if (convErr) {
        throw new Error(`Failed to create conversation: ${convErr.message}`);
      }
    }

    // Save user message
    const { error: msgErr } = await supabaseClient.from("messages").insert({
      conversation_id: conversationId,
      role: "user",
      content: message,
    });
    if (msgErr) {
      throw new Error(`Failed to save message: ${msgErr.message}`);
    }

    // Stream the response as SSE
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const eventStream = agent.stream(
            { messages: [new HumanMessage(message)] },
            {
              streamMode: "messages",
              configurable: {
                userId: user.id,
                supabaseClient,
                thread_id: conversationId,
              },
              recursionLimit: MODEL_CALL_LIMIT + TOOL_CALL_LIMIT,
            }
          );

          for await (const event of await eventStream) {
            // streamMode "messages" yields [message, metadata] tuples
            const [msg] = event as [unknown, unknown];

            if (
              msg instanceof AIMessageChunk &&
              typeof msg.content === "string" &&
              msg.content.length > 0
            ) {
              fullResponse += msg.content;
              const data = JSON.stringify({
                token: msg.content,
                conversationId,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }

          // Send done signal
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));

          // Validate and save the full assistant response.
          // NOTE: Tokens were already streamed to the client above. This post-hoc
          // validation sanitizes the DB copy only. The system prompt boundaries are
          // the primary defense for real-time output; buffering would break streaming UX.
          if (fullResponse) {
            const { safe, sanitized } = validateOutput(fullResponse);
            if (!safe) {
              console.warn("[mentor/chat] Output validation failed — saving sanitized version");
            }
            await supabaseClient.from("messages").insert({
              conversation_id: conversationId!,
              role: "assistant",
              content: safe ? fullResponse : sanitized,
            });
          }

          controller.close();
        } catch (err) {
          console.error("[mentor/chat stream error]", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "An error occurred. Please try again." })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ThrottleError) {
      return NextResponse.json(
        { error: err.message, retryAfterMs: err.retryAfterMs },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(err.retryAfterMs / 1000)) },
        }
      );
    }
    if (err instanceof RateLimitError) {
      const retryAfterSecs = Math.max(1, Math.ceil((err.resetAt.getTime() - Date.now()) / 1000));
      return NextResponse.json(
        {
          error: err.message,
          remaining: err.remaining,
          resetAt: err.resetAt.toISOString(),
        },
        {
          status: 429,
          headers: { "Retry-After": String(retryAfterSecs) },
        }
      );
    }
    console.error("[mentor/chat POST]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabaseClient } = await validateAuth(request);

    // Get today's metrics for the user
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabaseClient
      .from("daily_metrics")
      .select("mentor_messages")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    // Compute reset time (midnight UTC tomorrow)
    const now = new Date();
    const resetAt = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
    );

    const currentCount = data?.mentor_messages ?? 0;
    const limit = DAILY_RATE_LIMIT;
    const remaining = Math.max(0, limit - currentCount);

    return NextResponse.json({
      remaining,
      limit,
      resetAt: resetAt.toISOString(),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error("[mentor/chat GET]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
