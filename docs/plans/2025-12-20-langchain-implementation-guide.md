# LangChain Implementation Guide for SWE Mentor App

> Comprehensive reference for implementing LangChain with RAG, rate limiting, and Supabase integration.

## Table of Contents

1. [Installation](#1-installation)
2. [Core Configuration](#2-core-configuration)
3. [Database Schema for AI](#3-database-schema-for-ai)
4. [Embeddings Setup](#4-embeddings-setup)
5. [Vector Store with Supabase/PGVector](#5-vector-store-with-supabasepgvector)
6. [RAG Implementation](#6-rag-implementation)
7. [Custom Tools for Journal & Progress](#7-custom-tools-for-journal--progress)
8. [Rate Limiting (20 chats/day)](#8-rate-limiting-20-chatsday)
9. [Agent Creation](#9-agent-creation)
10. [Memory & Chat History](#10-memory--chat-history)
11. [Complete Implementation Example](#11-complete-implementation-example)
12. [Business Economics](#12-business-economics)

---

## 1. Installation

```bash
# Core LangChain packages
npm install langchain @langchain/core

# Anthropic integration (for Claude models)
npm install @langchain/anthropic

# OpenAI integration (for embeddings)
npm install @langchain/openai

# Community integrations (includes Supabase vector store)
npm install @langchain/community

# Text splitters for document chunking
npm install @langchain/textsplitters

# LangGraph for agent state management
npm install @langchain/langgraph

# Supabase client
npm install @supabase/supabase-js
```

**Requirements:** Node.js 20+

---

## 2. Core Configuration

### Environment Variables

```env
# LLM Provider
ANTHROPIC_API_KEY=your-anthropic-key

# Embeddings Provider
OPENAI_API_KEY=your-openai-key

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Initialize Models

```typescript
// lib/langchain/config.ts
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

// Chat model for conversation - GPT-4o-mini is 20-25x cheaper than Claude Sonnet!
// Cost: ~$0.15/1M input, $0.60/1M output
export const chatModel = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 1024,
});

// For complex reasoning tasks only (optional)
export const advancedModel = new ChatOpenAI({
  model: "gpt-4o", // Use sparingly - 17x more expensive than mini
  temperature: 0.5,
});

// Embeddings model for RAG
export const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small", // 1536 dimensions, very cost-effective
  // Cost: ~$0.02/1M tokens
});
```

---

## 3. Database Schema for AI

### Your Existing Tables (Reference)

Based on your Supabase schema:

| Table | Key Fields | Use in RAG |
|-------|------------|------------|
| `journal_entries` | user_id, title, content, tags, created_at | Primary content for RAG |
| `check_ins` | user_id, check_in_type, daily_goal, quick_win, blocker, energy_level | Progress tracking |
| `goals` | user_id, goal_type, title, description, status | Goal context |
| `conversations` | user_id, title | Chat history |
| `messages` | conversation_id, role, content | Message history |
| `daily_metrics` | user_id, date, mentor_messages | Rate limiting |

### New Tables Needed

```sql
-- Migration: Create embeddings table for vector search
CREATE EXTENSION IF NOT EXISTS vector;

-- Document embeddings for RAG
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('journal_entry', 'check_in', 'goal')),
  source_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- For text-embedding-3-small
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for vector similarity search
CREATE INDEX ON document_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for filtering by user
CREATE INDEX ON document_embeddings(user_id);

-- RLS policies
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own embeddings"
  ON document_embeddings FOR ALL
  USING (auth.uid() = user_id);
```

---

## 4. Embeddings Setup

### Text Splitter for Chunking

```typescript
// lib/langchain/splitter.ts
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,      // Characters per chunk
  chunkOverlap: 200,    // Overlap between chunks for context
});

// Split a journal entry
export async function splitJournalEntry(content: string, metadata: Record<string, unknown>) {
  const docs = await textSplitter.createDocuments(
    [content],
    [metadata]
  );
  return docs;
}
```

### Generate Embeddings

```typescript
// lib/langchain/embeddings.ts
import { embeddings } from "./config";

export async function generateEmbedding(text: string): Promise<number[]> {
  const vector = await embeddings.embedQuery(text);
  return vector;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const vectors = await embeddings.embedDocuments(texts);
  return vectors;
}
```

---

## 5. Vector Store with Supabase/PGVector

### Option A: Direct Supabase Integration

```typescript
// lib/langchain/vectorStore.ts
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@supabase/supabase-js";
import { embeddings } from "./config";

const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Create vector store instance
export const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabaseClient,
  tableName: "document_embeddings",
  queryName: "match_documents", // Supabase function name
});

// Add documents to vector store
export async function addDocuments(
  userId: string,
  sourceType: "journal_entry" | "check_in" | "goal",
  sourceId: string,
  content: string,
  metadata: Record<string, unknown> = {}
) {
  const docs = await splitJournalEntry(content, {
    user_id: userId,
    source_type: sourceType,
    source_id: sourceId,
    ...metadata,
  });

  await vectorStore.addDocuments(docs);
}

// Search for similar documents
export async function searchSimilar(
  userId: string,
  query: string,
  k: number = 5
) {
  const results = await vectorStore.similaritySearch(query, k, {
    filter: { user_id: userId },
  });
  return results;
}
```

### Option B: Custom PGVector with RPC

Create a Supabase function for vector search:

```sql
-- Supabase function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_count int DEFAULT 5,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    de.id,
    de.content,
    de.metadata,
    1 - (de.embedding <=> query_embedding) AS similarity
  FROM document_embeddings de
  WHERE (filter_user_id IS NULL OR de.user_id = filter_user_id)
  ORDER BY de.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

```typescript
// lib/langchain/vectorSearch.ts
import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "./embeddings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function searchDocuments(
  userId: string,
  query: string,
  matchCount: number = 5
) {
  // Generate embedding for query
  const queryEmbedding = await generateEmbedding(query);

  // Search using Supabase RPC
  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    filter_user_id: userId,
  });

  if (error) throw error;
  return data;
}
```

---

## 6. RAG Implementation

### Retriever Setup

```typescript
// lib/langchain/retriever.ts
import { vectorStore } from "./vectorStore";

// Convert vector store to retriever
export const retriever = vectorStore.asRetriever({
  k: 5, // Number of documents to retrieve
  filter: (doc) => doc.metadata.user_id === currentUserId,
});

// Custom retriever with user context
export function createUserRetriever(userId: string, k: number = 5) {
  return vectorStore.asRetriever({
    k,
    filter: { user_id: userId },
  });
}
```

### RAG Chain

```typescript
// lib/langchain/ragChain.ts
import { ChatAnthropic } from "@langchain/anthropic";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { searchDocuments } from "./vectorSearch";

const MENTOR_SYSTEM_PROMPT = `You are a supportive SWE Mentor helping software engineers grow in their careers.
You have access to the user's journal entries, check-ins, and goals to provide personalized guidance.

Use the following context from their past entries to inform your response:

{context}

Guidelines:
- Be encouraging but realistic
- Reference specific details from their history when relevant
- Help them identify patterns in their work
- Suggest actionable next steps
- Keep responses concise but helpful

Current date: {date}`;

const ragPrompt = PromptTemplate.fromTemplate(`
${MENTOR_SYSTEM_PROMPT}

User: {question}
`);

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.7,
});

export async function askMentor(
  userId: string,
  question: string
): Promise<string> {
  // 1. Retrieve relevant documents
  const relevantDocs = await searchDocuments(userId, question, 5);

  // 2. Format context from retrieved documents
  const context = relevantDocs
    .map((doc: { content: string; similarity: number }) =>
      `[Relevance: ${(doc.similarity * 100).toFixed(1)}%]\n${doc.content}`
    )
    .join("\n\n---\n\n");

  // 3. Generate response with RAG context
  const chain = RunnableSequence.from([
    ragPrompt,
    model,
    new StringOutputParser(),
  ]);

  const response = await chain.invoke({
    context: context || "No previous entries found.",
    date: new Date().toLocaleDateString(),
    question,
  });

  return response;
}
```

---

## 7. Custom Tools for Journal & Progress

### Define Tools with Zod

```typescript
// lib/langchain/tools.ts
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Tool: Get recent journal entries
export const getJournalEntries = tool(
  async ({ userId, limit, tags }) => {
    let query = supabase
      .from("journal_entries")
      .select("id, title, content, tags, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tags && tags.length > 0) {
      query = query.contains("tags", tags);
    }

    const { data, error } = await query;
    if (error) throw error;

    return JSON.stringify(data, null, 2);
  },
  {
    name: "get_journal_entries",
    description: "Retrieve the user's recent journal entries, optionally filtered by tags",
    schema: z.object({
      userId: z.string().uuid().describe("The user's UUID"),
      limit: z.number().min(1).max(20).default(5).describe("Maximum entries to return"),
      tags: z.array(z.string()).optional().describe("Filter by specific tags"),
    }),
  }
);

// Tool: Get weekly progress summary
export const getWeeklyProgress = tool(
  async ({ userId, weeksAgo }) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeksAgo * 7) - 7);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - (weeksAgo * 7));

    // Get check-ins for the week
    const { data: checkIns } = await supabase
      .from("check_ins")
      .select("*")
      .eq("user_id", userId)
      .gte("check_in_date", startDate.toISOString().split("T")[0])
      .lt("check_in_date", endDate.toISOString().split("T")[0])
      .order("check_in_date", { ascending: true });

    // Get goals for the week
    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .eq("goal_type", "weekly")
      .gte("start_date", startDate.toISOString().split("T")[0])
      .lt("end_date", endDate.toISOString().split("T")[0]);

    // Get journal entries for the week
    const { data: journals } = await supabase
      .from("journal_entries")
      .select("id, title, tags, created_at")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString());

    return JSON.stringify({
      week: weeksAgo === 0 ? "current" : `${weeksAgo} week(s) ago`,
      checkIns: checkIns || [],
      goals: goals || [],
      journalCount: journals?.length || 0,
      summary: {
        totalCheckIns: checkIns?.length || 0,
        morningCheckIns: checkIns?.filter(c => c.check_in_type === "morning").length || 0,
        eveningCheckIns: checkIns?.filter(c => c.check_in_type === "evening").length || 0,
        goalsCompleted: goals?.filter(g => g.status === "completed").length || 0,
        avgEnergyLevel: checkIns?.length
          ? (checkIns.reduce((sum, c) => sum + (c.energy_level || 0), 0) / checkIns.length).toFixed(1)
          : null,
      },
    }, null, 2);
  },
  {
    name: "get_weekly_progress",
    description: "Get a summary of the user's weekly progress including check-ins, goals, and journal entries",
    schema: z.object({
      userId: z.string().uuid().describe("The user's UUID"),
      weeksAgo: z.number().min(0).max(12).default(0).describe("0 for current week, 1 for last week, etc."),
    }),
  }
);

// Tool: Get monthly progress summary
export const getMonthlyProgress = tool(
  async ({ userId, monthsAgo }) => {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsAgo);
    startDate.setDate(1);

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Get streaks
    const { data: streaks } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get all check-ins for the month
    const { data: checkIns } = await supabase
      .from("check_ins")
      .select("*")
      .eq("user_id", userId)
      .gte("check_in_date", startDate.toISOString().split("T")[0])
      .lt("check_in_date", endDate.toISOString().split("T")[0]);

    // Get goals
    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .or(`goal_type.eq.monthly,goal_type.eq.quarterly`)
      .gte("created_at", startDate.toISOString());

    // Get journal entries
    const { data: journals } = await supabase
      .from("journal_entries")
      .select("id, title, tags")
      .eq("user_id", userId)
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString());

    // Aggregate tags
    const tagCounts: Record<string, number> = {};
    journals?.forEach(j => {
      j.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return JSON.stringify({
      month: startDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      streaks,
      summary: {
        totalCheckIns: checkIns?.length || 0,
        totalJournalEntries: journals?.length || 0,
        goalsCreated: goals?.length || 0,
        goalsCompleted: goals?.filter(g => g.status === "completed").length || 0,
        topTags: Object.entries(tagCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5),
        avgEnergyLevel: checkIns?.length
          ? (checkIns.reduce((sum, c) => sum + (c.energy_level || 0), 0) / checkIns.length).toFixed(1)
          : null,
        completionRate: checkIns?.length
          ? ((checkIns.filter(c => c.goal_completed === "yes").length / checkIns.length) * 100).toFixed(1) + "%"
          : "N/A",
      },
    }, null, 2);
  },
  {
    name: "get_monthly_progress",
    description: "Get a comprehensive monthly progress report including streaks, goals, and patterns",
    schema: z.object({
      userId: z.string().uuid().describe("The user's UUID"),
      monthsAgo: z.number().min(0).max(6).default(0).describe("0 for current month, 1 for last month, etc."),
    }),
  }
);

// Tool: Search journal entries with RAG
export const searchJournals = tool(
  async ({ userId, query, limit }) => {
    const results = await searchDocuments(userId, query, limit);
    return JSON.stringify(results, null, 2);
  },
  {
    name: "search_journals",
    description: "Semantically search through the user's journal entries and check-ins",
    schema: z.object({
      userId: z.string().uuid().describe("The user's UUID"),
      query: z.string().describe("The search query - can be a question or topic"),
      limit: z.number().min(1).max(10).default(5).describe("Maximum results to return"),
    }),
  }
);

// Export all tools
export const mentorTools = [
  getJournalEntries,
  getWeeklyProgress,
  getMonthlyProgress,
  searchJournals,
];
```

---

## 8. Rate Limiting (20 chats/day)

### Database: Track Usage

```sql
-- Add to daily_metrics or create new table
-- Using existing daily_metrics table which has mentor_messages column

-- Function to check and increment usage
CREATE OR REPLACE FUNCTION check_and_increment_chat_usage(
  p_user_id uuid,
  p_daily_limit int DEFAULT 20
)
RETURNS TABLE (
  allowed boolean,
  current_count int,
  remaining int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_current_count int;
BEGIN
  -- Get or create today's metric
  INSERT INTO daily_metrics (user_id, date, mentor_messages)
  VALUES (p_user_id, v_today, 0)
  ON CONFLICT (user_id, date) DO NOTHING;

  -- Get current count
  SELECT mentor_messages INTO v_current_count
  FROM daily_metrics
  WHERE user_id = p_user_id AND date = v_today;

  -- Check if under limit
  IF v_current_count < p_daily_limit THEN
    -- Increment count
    UPDATE daily_metrics
    SET mentor_messages = mentor_messages + 1
    WHERE user_id = p_user_id AND date = v_today;

    RETURN QUERY SELECT
      true AS allowed,
      v_current_count + 1 AS current_count,
      p_daily_limit - v_current_count - 1 AS remaining;
  ELSE
    RETURN QUERY SELECT
      false AS allowed,
      v_current_count AS current_count,
      0 AS remaining;
  END IF;
END;
$$;
```

### TypeScript Rate Limiter

```typescript
// lib/langchain/rateLimiter.ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DAILY_CHAT_LIMIT = 20;

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  remaining: number;
  resetAt: Date;
}

export async function checkRateLimit(userId: string): Promise<RateLimitResult> {
  const { data, error } = await supabase.rpc("check_and_increment_chat_usage", {
    p_user_id: userId,
    p_daily_limit: DAILY_CHAT_LIMIT,
  });

  if (error) throw error;

  const result = data[0];

  // Calculate reset time (midnight UTC)
  const resetAt = new Date();
  resetAt.setUTCHours(24, 0, 0, 0);

  return {
    allowed: result.allowed,
    currentCount: result.current_count,
    remaining: result.remaining,
    resetAt,
  };
}

export async function getRemainingChats(userId: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("daily_metrics")
    .select("mentor_messages")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  const used = data?.mentor_messages || 0;
  return Math.max(0, DAILY_CHAT_LIMIT - used);
}

// Middleware for rate limiting
export class RateLimitError extends Error {
  constructor(
    public remaining: number,
    public resetAt: Date
  ) {
    super(`Rate limit exceeded. Resets at ${resetAt.toISOString()}`);
    this.name = "RateLimitError";
  }
}

export async function withRateLimit<T>(
  userId: string,
  fn: () => Promise<T>
): Promise<T> {
  const rateLimit = await checkRateLimit(userId);

  if (!rateLimit.allowed) {
    throw new RateLimitError(rateLimit.remaining, rateLimit.resetAt);
  }

  return fn();
}
```

### Usage in API Route

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { withRateLimit, RateLimitError, getRemainingChats } from "@/lib/langchain/rateLimiter";
import { askMentor } from "@/lib/langchain/ragChain";

export async function POST(req: NextRequest) {
  try {
    const { userId, message } = await req.json();

    const response = await withRateLimit(userId, () =>
      askMentor(userId, message)
    );

    const remaining = await getRemainingChats(userId);

    return NextResponse.json({
      response,
      rateLimitInfo: {
        remaining,
        limit: 20,
      },
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          remaining: error.remaining,
          resetAt: error.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }
    throw error;
  }
}
```

---

## 9. Agent Creation

### Create Agent with Tools

```typescript
// lib/langchain/agent.ts
import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { mentorTools } from "./tools";

const model = new ChatOpenAI({
  model: "gpt-4o-mini", // Cost-effective: ~$0.15/1M input, $0.60/1M output
  temperature: 0.7,
});

const SYSTEM_PROMPT = `You are a supportive and insightful SWE Mentor helping software engineers grow in their careers.

Your capabilities:
- Access the user's journal entries, check-ins, and goals
- Provide weekly and monthly progress summaries
- Search through their past entries to find relevant context
- Identify patterns and provide personalized advice

Personality:
- Encouraging but realistic
- Action-oriented - always suggest concrete next steps
- Empathetic - acknowledge challenges while focusing on growth
- Concise - respect the user's time

Important:
- Always use the available tools to gather context before responding
- Reference specific entries or patterns when giving advice
- Help users see their progress over time
- Keep responses focused and actionable`;

// Create the agent
export const mentorAgent = createAgent({
  model,
  tools: mentorTools,
  systemPrompt: SYSTEM_PROMPT,
  checkpointer: new MemorySaver(), // Enable conversation memory
});

// Invoke the agent
export async function chat(
  userId: string,
  message: string,
  threadId: string
) {
  const result = await mentorAgent.invoke(
    {
      messages: [{ role: "user", content: message }],
    },
    {
      configurable: {
        thread_id: threadId,
        user_id: userId, // Pass userId for tools
      },
    }
  );

  return result.messages[result.messages.length - 1].content;
}
```

### Agent with Tool Call Limits

```typescript
// lib/langchain/agentWithLimits.ts
import { createAgent, toolCallLimitMiddleware } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { mentorTools } from "./tools";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
});

export const mentorAgentWithLimits = createAgent({
  model,
  tools: mentorTools,
  systemPrompt: SYSTEM_PROMPT,
  middleware: [
    // Limit total tool calls per conversation turn
    toolCallLimitMiddleware({
      runLimit: 5,  // Max 5 tool calls per message
    }),
    // Limit specific expensive tools
    toolCallLimitMiddleware({
      toolName: "search_journals",
      runLimit: 2,  // Max 2 RAG searches per message
    }),
  ],
});
```

---

## 10. Memory & Chat History

### Short-term Memory (Conversation)

```typescript
// lib/langchain/memory.ts
import { MemorySaver } from "@langchain/langgraph";
import { ChatMessageHistory } from "@langchain/community/stores/message/in_memory";

// In-memory for development
export const memoryCheckpointer = new MemorySaver();

// For production, use a persistent store
// import { SupabaseCheckpointer } from "@langchain/community/checkpointers/supabase";
```

### Supabase-backed Chat History

```typescript
// lib/langchain/chatHistory.ts
import { createClient } from "@supabase/supabase-js";
import {
  HumanMessage,
  AIMessage,
  BaseMessage
} from "@langchain/core/messages";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
) {
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role,
    content,
  });
  if (error) throw error;
}

export async function getConversationHistory(
  conversationId: string,
  limit: number = 20
): Promise<BaseMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content)
  );
}

export async function getOrCreateConversation(
  userId: string,
  title?: string
): Promise<string> {
  // Try to get existing active conversation
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (existing) return existing.id;

  // Create new conversation
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      title: title || "New Chat",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}
```

### Message Summarization for Long Conversations

```typescript
// lib/langchain/summarize.ts
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage } from "@langchain/core/messages";

const summaryModel = new ChatOpenAI({
  model: "gpt-4o-mini", // Same model, cheap enough for summarization too
  temperature: 0,
});

export async function summarizeConversation(
  messages: BaseMessage[]
): Promise<string> {
  if (messages.length < 10) {
    return ""; // No need to summarize short conversations
  }

  const messagesText = messages
    .map((m) => `${m._getType()}: ${m.content}`)
    .join("\n");

  const response = await summaryModel.invoke([
    {
      role: "system",
      content: "Summarize this conversation in 2-3 sentences, focusing on key topics discussed and any action items.",
    },
    {
      role: "user",
      content: messagesText,
    },
  ]);

  return response.content as string;
}
```

---

## 11. Complete Implementation Example

### Full API Route

```typescript
// app/api/mentor/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAgent } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { MemorySaver } from "@langchain/langgraph";
import { mentorTools } from "@/lib/langchain/tools";
import { withRateLimit, RateLimitError, getRemainingChats } from "@/lib/langchain/rateLimiter";
import { saveMessage, getConversationHistory, getOrCreateConversation } from "@/lib/langchain/chatHistory";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Well-crafted system prompt makes GPT-4o-mini perform excellently for mentoring
const SYSTEM_PROMPT = `You are an expert SWE Mentor with 15+ years of experience helping software engineers grow in their careers.

## Your Role
You provide personalized, actionable guidance based on the engineer's actual work history, goals, and challenges.

## Available Tools
You have access to tools that let you:
- Read their journal entries (reflections, learnings, challenges)
- Get weekly/monthly progress summaries (check-ins, goals, patterns)
- Semantically search their past entries for relevant context

## Response Guidelines
1. **Always gather context first** - Use tools to understand their situation before responding
2. **Be specific** - Reference actual entries, dates, and patterns you found
3. **Be actionable** - Every response should include 1-2 concrete next steps
4. **Be concise** - Respect their time, aim for 2-3 paragraphs max
5. **Be encouraging but honest** - Celebrate wins, address challenges directly

## Tone
- Supportive peer mentor, not lecturing professor
- Direct and practical, not vague or generic
- Empathetic but focused on solutions`;

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.7,
});

const checkpointer = new MemorySaver();

const agent = createAgent({
  model,
  tools: mentorTools,
  systemPrompt: SYSTEM_PROMPT,
  checkpointer,
});

export async function POST(req: NextRequest) {
  try {
    const { userId, message, conversationId: existingConversationId } = await req.json();

    // Validate user
    const { data: user, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check rate limit and invoke agent
    const response = await withRateLimit(userId, async () => {
      // Get or create conversation
      const conversationId = existingConversationId ||
        await getOrCreateConversation(userId);

      // Save user message
      await saveMessage(conversationId, "user", message);

      // Get conversation history for context
      const history = await getConversationHistory(conversationId, 10);

      // Invoke agent
      const result = await agent.invoke(
        {
          messages: [
            ...history.map(m => ({
              role: m._getType() === "human" ? "user" : "assistant",
              content: m.content as string,
            })),
            { role: "user", content: message },
          ],
        },
        {
          configurable: {
            thread_id: conversationId,
            user_id: userId,
          },
        }
      );

      // Extract assistant response
      const assistantMessage = result.messages[result.messages.length - 1];
      const responseContent = assistantMessage.content as string;

      // Save assistant message
      await saveMessage(conversationId, "assistant", responseContent);

      // Update conversation timestamp
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      return {
        response: responseContent,
        conversationId,
      };
    });

    const remaining = await getRemainingChats(userId);

    return NextResponse.json({
      ...response,
      rateLimitInfo: {
        remaining,
        limit: 20,
      },
    });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: "Daily chat limit reached",
          message: "You've used all 20 chats for today. Come back tomorrow!",
          remaining: 0,
          resetAt: error.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    console.error("Mentor chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

// GET: Check remaining chats
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const remaining = await getRemainingChats(userId);

  return NextResponse.json({
    remaining,
    limit: 20,
    resetAt: new Date(new Date().setUTCHours(24, 0, 0, 0)).toISOString(),
  });
}
```

### Index Documents on Create/Update

```typescript
// lib/langchain/indexing.ts
import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "./embeddings";
import { textSplitter } from "./splitter";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function indexJournalEntry(
  userId: string,
  entryId: string,
  title: string,
  content: string,
  tags: string[]
) {
  // Delete existing embeddings for this entry
  await supabase
    .from("document_embeddings")
    .delete()
    .eq("source_id", entryId);

  // Prepare content for embedding
  const fullContent = `Title: ${title}\n\nTags: ${tags.join(", ")}\n\n${content}`;

  // Split into chunks
  const chunks = await textSplitter.splitText(fullContent);

  // Generate embeddings and insert
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i]);

    await supabase.from("document_embeddings").insert({
      user_id: userId,
      source_type: "journal_entry",
      source_id: entryId,
      content: chunks[i],
      embedding,
      metadata: {
        title,
        tags,
        chunk_index: i,
        total_chunks: chunks.length,
      },
    });
  }
}

export async function indexCheckIn(
  userId: string,
  checkInId: string,
  checkIn: {
    check_in_type: string;
    daily_goal?: string;
    quick_win?: string;
    blocker?: string;
    energy_level?: number;
    focus_area?: string;
  }
) {
  // Delete existing
  await supabase
    .from("document_embeddings")
    .delete()
    .eq("source_id", checkInId);

  // Format check-in as text
  const parts = [
    `Check-in Type: ${checkIn.check_in_type}`,
    checkIn.focus_area && `Focus Area: ${checkIn.focus_area}`,
    checkIn.daily_goal && `Daily Goal: ${checkIn.daily_goal}`,
    checkIn.quick_win && `Quick Win: ${checkIn.quick_win}`,
    checkIn.blocker && `Blocker: ${checkIn.blocker}`,
    checkIn.energy_level && `Energy Level: ${checkIn.energy_level}/5`,
  ].filter(Boolean);

  const content = parts.join("\n");
  const embedding = await generateEmbedding(content);

  await supabase.from("document_embeddings").insert({
    user_id: userId,
    source_type: "check_in",
    source_id: checkInId,
    content,
    embedding,
    metadata: {
      check_in_type: checkIn.check_in_type,
      energy_level: checkIn.energy_level,
    },
  });
}
```

### Supabase Edge Function Trigger (Optional)

```sql
-- Trigger to auto-index on insert/update
CREATE OR REPLACE FUNCTION trigger_index_journal_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Edge Function to index
  PERFORM
    net.http_post(
      url := current_setting('app.settings.edge_function_url') || '/index-document',
      body := jsonb_build_object(
        'type', 'journal_entry',
        'id', NEW.id,
        'user_id', NEW.user_id,
        'content', NEW.content,
        'title', NEW.title,
        'tags', NEW.tags
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_journal_entry_change
  AFTER INSERT OR UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_index_journal_entry();
```

---

## Quick Reference

### Key Imports

```typescript
// Models - Using OpenAI for cost-effectiveness
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

// Core
import { tool } from "@langchain/core/tools";
import { PromptTemplate } from "@langchain/core/prompts";

// Agent
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";

// Vector Store
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

// Text Splitting
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
```

### Model Options & Pricing

| Model | Input (per 1M) | Output (per 1M) | Use Case |
|-------|----------------|-----------------|----------|
| **`gpt-4o-mini`** | **$0.15** | **$0.60** | **Main chat, tools - RECOMMENDED** |
| `gpt-4o` | $2.50 | $10.00 | Complex reasoning (use sparingly) |
| `claude-sonnet-4.5` | $3.00 | $15.00 | Alternative for complex tasks |
| `text-embedding-3-small` | $0.02 | - | Embeddings (1536 dims) - RECOMMENDED |
| `text-embedding-3-large` | $0.13 | - | High-quality embeddings (3072 dims) |

### Cost Estimate for SWE Mentor

With 20 chats/day limit and average ~500 tokens per exchange:

| Component | Tokens/chat | Daily Cost (20 chats) | Monthly Cost |
|-----------|-------------|----------------------|--------------|
| Chat (gpt-4o-mini) | ~1000 | ~$0.015 | ~$0.45 |
| RAG embeddings | ~500 | ~$0.0002 | ~$0.006 |
| **Total per user** | - | **~$0.02** | **~$0.50** |

### Cost Optimization Tips

1. **Use gpt-4o-mini** - It's excellent for mentoring with good prompts (20x cheaper than Sonnet)
2. Use `text-embedding-3-small` - Sufficient quality for journal/check-in search
3. Limit RAG results to 5 documents
4. Cache frequently accessed data (weekly/monthly summaries)
5. Use tool call limits to prevent runaway API calls
6. Consider response token limits (maxTokens: 500-1000)

---

## 12. Business Economics

### Revenue & Cost Analysis

**Pricing:** $25/user/month

| Metric | 100 Users | 500 Users | 1,000 Users |
|--------|-----------|-----------|-------------|
| **Monthly Revenue** | $2,500 | $12,500 | $25,000 |
| **AI Costs (LangChain)** | $50 | $250 | $500 |
| **Supabase Pro** | $25 | $25 | $75 |
| **Vercel Pro** | $20 | $20 | $150 |
| **Domain/Misc** | $5 | $5 | $10 |
| **Total Costs** | **$100** | **$300** | **$735** |
| **Net Profit** | **$2,400** | **$12,200** | **$24,265** |
| **Profit Margin** | **96%** | **97.6%** | **97%** |

### Break-Even Analysis

| Cost Component | Monthly Cost | Users to Cover |
|----------------|--------------|----------------|
| AI (LangChain) | $0.50/user | Built into price |
| Supabase Pro | $25 | 1 user |
| Vercel Pro | $20 | 1 user |
| Domain/Misc | $5 | 1 user |
| **Total Fixed Costs** | **$50** | **2 users** |

**Break-even point: 2 users** (just covers fixed costs)

At 4 users, you're profitable and covering all infrastructure with margin.

### Scaling Cost Assumptions

- **AI costs scale linearly** with users ($0.50/user/month)
- **Supabase Pro**: Free tier handles ~500 users, Pro ($25) handles thousands
- **Vercel Pro**: Free tier may work for 100 users, Pro ($20) for growth
- At 1,000+ users: Consider Supabase Team ($599/mo) for dedicated resources

### Cost Per User Breakdown

| Component | Per User/Month |
|-----------|----------------|
| GPT-4o-mini (20 chats × 1000 tokens) | $0.45 |
| Embeddings (RAG queries) | $0.01 |
| Vector storage (Supabase) | $0.02 |
| Infra overhead | $0.02 |
| **Total** | **~$0.50** |

### Key Insights

1. **96% profit margin** at 100 users - AI costs are very low with GPT-4o-mini
2. **$2,400/month profit** from just 100 paying users
3. **$24,000+/month** is achievable at 1,000 users
4. **Main risk**: User churn, not infrastructure costs
5. **Upsell opportunity**: Offer 50 chats/day tier at $49/month

---

## Documentation Links

- [LangChain JS Quickstart](https://docs.langchain.com/oss/javascript/langchain/quickstart)
- [LangChain RAG Tutorial](https://docs.langchain.com/oss/javascript/langchain/rag)
- [LangChain Tools](https://docs.langchain.com/oss/javascript/langchain/tools)
- [LangChain Agents](https://docs.langchain.com/oss/javascript/langchain/agents)
- [Supabase Vector Store](https://docs.langchain.com/oss/javascript/integrations/vectorstores/index)
- [LangGraph Persistence](https://docs.langchain.com/oss/javascript/langgraph/persistence)
- [Short-term Memory](https://docs.langchain.com/oss/javascript/langchain/short-term-memory)