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
import { RateLimitError } from "@/lib/langchain/errors";
import { validateAuth, AuthError } from "@/lib/langchain/auth";

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

          // Save the full assistant response
          if (fullResponse) {
            await supabaseClient.from("messages").insert({
              conversation_id: conversationId!,
              role: "assistant",
              content: fullResponse,
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
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: err.message,
          remaining: err.remaining,
          resetAt: err.resetAt.toISOString(),
        },
        { status: 429 }
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
    const limit = 50; // Match the RPC limit
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
