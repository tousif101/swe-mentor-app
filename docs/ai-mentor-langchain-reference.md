# AI Mentor Chat — LangChain JS Reference

> Complete research summary for building the SWE Mentor AI Chat feature.
> Covers LangChain JS (agents, tools, middleware, memory, streaming), Deep Agents SDK,
> career ladder data, onboarding gaps, DB readiness, and the 3-layer prompt system.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Recommended Packages](#recommended-packages)
3. [createAgent vs createDeepAgent — When to Use Each](#createagent-vs-createdeepagent)
4. [Model Selection — Claude via LangChain](#model-selection)
5. [The `createAgent` API](#the-createagent-api)
6. [Deep Agents SDK — Where It Fits](#deep-agents-sdk)
7. [Tools for the Mentor Agent](#tools-for-the-mentor-agent)
8. [3-Layer Prompt System](#3-layer-prompt-system)
9. [4 Adaptive Coaching Modes](#4-adaptive-coaching-modes)
10. [Memory Strategy](#memory-strategy)
11. [Middleware Stack](#middleware-stack)
12. [Streaming to React Native](#streaming-to-react-native)
13. [Structured Output](#structured-output)
14. [RAG — Personal Context Retrieval](#rag--personal-context-retrieval)
15. [Career Ladder Data & Onboarding Integration](#career-ladder-data--onboarding-integration)
16. [Database Readiness Audit](#database-readiness-audit)
17. [Onboarding Flow — Current State & Gaps](#onboarding-flow--current-state--gaps)
18. [MCP Integration Options](#mcp-integration-options)
19. [Multi-Agent Patterns (Future)](#multi-agent-patterns-future)
20. [Key Decisions & Trade-offs](#key-decisions--trade-offs)
21. [Implementation Sequence](#implementation-sequence)
22. [Quick Reference: Imports](#quick-reference-imports)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Mobile App (Expo/RN)                          │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────────────────┐  │
│  │ MentorScreen │──│ useMentor hook │──│ SSE/fetch to backend API │  │
│  │ (Chat UI)    │  │ (or useStream) │  │                          │  │
│  └──────────────┘  └────────────────┘  └────────────┬─────────────┘  │
└─────────────────────────────────────────────────────┼────────────────┘
                                                      │
┌─────────────────────────────────────────────────────┼────────────────┐
│                   Backend (Next.js API Route)        │                │
│  ┌──────────────────────────────────────────────────▼──────────────┐ │
│  │                    LangChain Agent (createAgent)                 │ │
│  │                                                                 │ │
│  │  Model: ChatAnthropic (claude-sonnet-4-5)                       │ │
│  │                                                                 │ │
│  │  Middleware:                                                     │ │
│  │    - summarizationMiddleware (context window management)        │ │
│  │    - dynamicSystemPromptMiddleware (user-adaptive persona)      │ │
│  │    - modelCallLimitMiddleware (cost control)                    │ │
│  │                                                                 │ │
│  │  Tools:                                                         │ │
│  │    - search_user_context (RAG over check-ins/journals/goals)   │ │
│  │    - get_progress_summary (stats from daily_metrics)            │ │
│  │    - get_career_goals (profile + focus areas)                   │ │
│  │    - get_career_ladder (company-specific level expectations)    │ │
│  │    - save_advice (persist recommendations to Store)             │ │
│  │                                                                 │ │
│  │  Checkpointer: PostgresSaver (Supabase Postgres)                │ │
│  │  Store: Long-term memory (career prefs, past advice)            │ │
│  └──────────────────────────────────────────┬──────────────────────┘ │
│                                             │                        │
│  ┌──────────────────────────────────────────▼──────────────────────┐ │
│  │                        Supabase                                  │ │
│  │  profiles | check_ins | conversations | messages                 │ │
│  │  document_embeddings | career_matrices | level_definitions       │ │
│  │  daily_metrics | user_streaks                                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘

  ┌────────────────────────────────────────────────────────────────────┐
  │  Deep Agent (createDeepAgent) — OFFLINE PIPELINE                   │
  │  Used for: Career ladder scraping, bulk data import, deep analysis │
  │  NOT used for: Real-time chat (too expensive, too slow)            │
  │  Tools: write_todos, task (subagents), filesystem, shell           │
  └────────────────────────────────────────────────────────────────────┘
```

---

## Recommended Packages

Install in `apps/web/`:

```bash
npm install langchain @langchain/core @langchain/anthropic @langchain/langgraph @langchain/textsplitters zod
```

| Package | Purpose | Why |
|---------|---------|-----|
| `langchain` | `createAgent`, `createMiddleware`, `tool`, message types | Core framework — single import for agent loop |
| `@langchain/core` | Base abstractions (messages, runnables) | Required peer dependency |
| `@langchain/anthropic` | `ChatAnthropic` for Claude models | Best reasoning for mentoring; prompt caching support |
| `@langchain/langgraph` | Graph runtime, `StateSchema`, `MemorySaver`, `Command` | Agent execution engine + checkpointing |
| `@langchain/textsplitters` | `RecursiveCharacterTextSplitter` | RAG document chunking for check-ins/journals |
| `zod` | Schema validation | Already in our stack; used for tools + structured output |

### Optional / Future

| Package | Purpose | When to Add |
|---------|---------|-------------|
| `@langchain/langgraph-checkpoint-postgres` | `PostgresSaver` | Moving from dev (`MemorySaver`) to production |
| `@langchain/langgraph-sdk` | `useStream` React hook | If we switch from custom SSE to LangGraph server |
| `deepagents` | `createDeepAgent` for complex pipelines | Career ladder scraping pipeline, deep career analysis |
| `@langchain/mcp-adapters` | `MultiServerMCPClient` | If we expose career tools as MCP servers |

---

## createAgent vs createDeepAgent

### Comparison

| Capability | `createAgent` | `createDeepAgent` |
|---|---|---|
| Tool calling loop (ReAct) | Yes | Yes |
| Parallel tool calls | Yes | Yes |
| Structured output | Yes | Yes |
| Middleware | Yes | Yes (richer set) |
| **Built-in planning (`write_todos`)** | No | Yes |
| **Virtual filesystem (ls, read, write, edit, glob, grep)** | No | Yes |
| **Subagent spawning (`task` tool)** | No | Yes |
| **Context window offloading** | No | Yes (auto at 20K tokens) |
| **Pluggable filesystem backends** | No | Yes (memory, disk, store, sandbox) |
| **Long-term memory (AGENTS.md)** | No | Yes |
| **Human-in-the-loop interrupts** | No | Yes |
| **Cost per invocation** | Lower | Higher (planning, summarization, subagent overhead) |
| **Latency** | Lower | Higher |

### Decision Matrix for Our App

| Use Case | Best Choice | Why |
|----------|-------------|-----|
| **Real-time mentor chat** | `createAgent` | Low latency, simple tool calls, conversational |
| **Career ladder scraping** | `createDeepAgent` | Multi-step pipeline, parallel subagents per source, planning |
| **Deep career analysis** | `createDeepAgent` | Complex research across multiple data sources |
| **Weekly summary generation** | `createAgent` | Single tool call + structured output |
| **Onboarding personalization** | `createAgent` | Quick lookup, no planning needed |

**Bottom line**: `createAgent` for all user-facing features. `createDeepAgent` only for offline backend pipelines.

---

## Model Selection

### Why Claude (Anthropic) over GPT-4o

| Factor | Claude (sonnet-4-5) | GPT-4o-mini |
|--------|---------------------|-------------|
| Mentoring tone | Excellent — nuanced, empathetic | Good but more formulaic |
| Prompt caching | Explicit `cache_control` — 90% cost savings on system prompt | Implicit only |
| Structured output | Native provider API + tool-calling fallback | Native JSON mode |
| Tool calling | Full support, parallel calls | Full support |
| Context window | 200K tokens | 128K tokens |
| Cost (input) | $3/M tokens (cached: $0.30/M) | $0.15/M tokens |
| Cost (output) | $15/M tokens | $0.60/M tokens |

**Recommendation**: `claude-sonnet-4-5` primary, `claude-haiku-4-5` for summarization middleware (cheap, fast).

### Prompt Caching (Cost Optimization)

Cache the long system prompt (mentor persona + career ladder knowledge) for ~90% savings:

```typescript
import { SystemMessage } from "@langchain/core/messages";

const agent = createAgent({
  model: "anthropic:claude-sonnet-4-5",
  systemPrompt: new SystemMessage({
    content: [
      {
        type: "text",
        text: MENTOR_SYSTEM_PROMPT,           // Short instructions (~500 tokens)
      },
      {
        type: "text",
        text: CAREER_MENTORING_KNOWLEDGE,     // Large reference text (~5K tokens)
        cache_control: { type: "ephemeral" }, // Cache this block (5 min TTL)
      },
    ],
  }),
  tools: [...],
});
```

---

## The `createAgent` API

`createAgent()` from `"langchain"` builds a LangGraph-based agent that loops: **model call → tool selection → tool execution → repeat until done**.

### Full Configuration

```typescript
import { createAgent } from "langchain";
import { MemorySaver } from "@langchain/langgraph";

const agent = createAgent({
  model: "anthropic:claude-sonnet-4-5",
  tools: [searchUserContext, getProgressSummary, getCareerGoals, getCareerLadder],
  systemPrompt: MENTOR_SYSTEM_PROMPT,
  middleware: [summarization, dynamicPrompt, modelCallLimit, handleToolErrors],
  checkpointer: new MemorySaver(), // Dev; PostgresSaver in prod
  stateSchema: MentorStateSchema,
  name: "career_mentor",
});
```

### Invocation

```typescript
// Simple invoke
const result = await agent.invoke(
  { messages: [{ role: "user", content: "How did I do this week?" }] },
  { configurable: { thread_id: conversationId } }
);

// Streaming
const stream = await agent.stream(
  { messages: [{ role: "user", content: userMessage }] },
  { configurable: { thread_id: conversationId }, streamMode: "messages" }
);
```

---

## Deep Agents SDK

### Where It Fits

The `deepagents` package (`createDeepAgent`) is built on top of LangChain and adds planning, filesystem, and subagent capabilities. **Not for the chat UI — for backend pipelines.**

### Career Ladder Scraping Pipeline (Primary Use Case)

```typescript
import { createDeepAgent } from "deepagents";

const scraper = createDeepAgent({
  model: "anthropic:claude-sonnet-4-5",
  system: "You scrape and normalize career ladder data from public sources.",
  tools: [fetchUrl, parseHtml, saveToSupabase],
  subagents: [
    {
      name: "dropbox_scraper",
      description: "Scrape Dropbox career framework",
      system_prompt: "Extract level definitions from Dropbox's career framework HTML.",
      tools: [fetchUrl, parseHtml],
    },
    {
      name: "etsy_scraper",
      description: "Scrape Etsy engineering ladder",
      system_prompt: "Extract level definitions from Etsy's engineering ladder HTML.",
      tools: [fetchUrl, parseHtml],
    },
    // ... more per-source subagents
  ],
});

// The deep agent will:
// 1. Use write_todos to plan scraping steps
// 2. Spawn subagents in parallel for each source
// 3. Normalize data using filesystem tools
// 4. Save structured results to Supabase
```

### Deep Career Analysis (Future Feature)

```typescript
const analyzer = createDeepAgent({
  model: "anthropic:claude-sonnet-4-5",
  system: "Analyze a user's career trajectory and create a comprehensive development plan.",
  tools: [fetchUserData, fetchLadderData, generateReport],
  // Uses write_todos to plan analysis steps
  // Uses filesystem to build and iterate on the report
  // Result: multi-page career development plan
});
```

### Key Deep Agent Built-in Tools

| Tool | What It Does | Our Use |
|------|-------------|---------|
| `write_todos` | Task planning and tracking | Scraping pipeline step management |
| `task` | Spawn subagents with isolated context | Parallel scraping of different sources |
| `read_file` / `write_file` | Virtual filesystem I/O | Store intermediate scraping results |
| `edit_file` | String-based file editing | Normalize scraped data |
| `glob` / `grep` | File search | Search across scraped ladders |

### Filesystem Backends

| Backend | Best For |
|---------|----------|
| `StateBackend` (default) | Ephemeral scraping scratch work |
| `StoreBackend` | Cross-thread persistent ladder data |
| `FilesystemBackend` | Local dev with disk I/O |

---

## Tools for the Mentor Agent

### Recommended Tool Set

| Tool | Purpose | When Agent Uses It |
|------|---------|-------------------|
| `search_user_context` | RAG search over check-ins, journals, goals | "How did my week go?", "What patterns do you see?" |
| `get_progress_summary` | Aggregated stats from `daily_metrics` + `user_streaks` | "Am I on track?", "Show my streak" |
| `get_career_goals` | User's focus areas, target role, current role from `profiles` | "What should I work on?", career advice |
| `get_career_ladder` | Company-specific level expectations from `career_matrices` | "What do I need for promotion?", level-specific coaching |
| `get_recent_checkins` | Last N check-ins with energy, wins, blockers | "What's been blocking me?", energy patterns |
| `save_advice` | Persist a recommendation to long-term Store | After giving significant advice |

### Tool Definition Pattern

```typescript
import { tool } from "langchain";
import * as z from "zod";

const getCareerLadder = tool(
  async ({ companyName, levelCode }, config) => {
    const userId = config.context.userId;

    // 1. Try user's company match
    const { data: ladder } = await supabase
      .from("career_matrices")
      .select("*, level_definitions(*)")
      .ilike("company_name", `%${companyName}%`)
      .single();

    if (ladder) return JSON.stringify(ladder);

    // 2. Fall back to template based on company size
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_size")
      .eq("id", userId)
      .single();

    const templateName = profile?.company_size === "5000+" ? "FAANG" : "Startup";
    const { data: template } = await supabase
      .from("career_matrices")
      .select("*, level_definitions(*)")
      .eq("company_name", `Generic ${templateName}`)
      .single();

    return JSON.stringify(template);
  },
  {
    name: "get_career_ladder",
    description: "Get career progression framework for a company. Returns level expectations, promotion criteria, and scope definitions.",
    schema: z.object({
      companyName: z.string().describe("Company name to look up"),
      levelCode: z.string().optional().describe("Specific level to focus on (e.g., IC4, L5)"),
    }),
  }
);
```

### Tool Access to Runtime Context

```typescript
const myTool = tool(
  async (input, config) => {
    const userId = config.context.userId;                         // User context
    const prefs = await config.store?.get(["users", userId], "preferences"); // Long-term memory
    config.writer?.("Searching your check-ins...");               // Stream updates
    return result;
  },
  { name: "my_tool", description: "...", schema: z.object({...}) }
);
```

---

## 3-Layer Prompt System

### Layer 1 — Base Coaching Framework

Universal principles that apply regardless of level:

```typescript
const BASE_COACHING_PROMPT = `
You are a career mentor for software engineers. Follow these principles:

1. DIAGNOSE before advising — ask clarifying questions before giving advice
2. Be TACTICAL not theoretical — give specific, actionable guidance
3. Teach the "WHY" — explain reasoning behind advice
4. Always end with a CONCRETE NEXT STEP — something they can do this week
5. Reference THEIR DATA — use "You mentioned..." or "Looking at your recent check-ins..."
6. Never invent details — only reference information explicitly provided in user context
7. Make output "screenshottable" — something they could show their manager

User Context:
- Current Level: {{currentRole}}
- Target Level: {{targetRole}}
- Focus Areas: {{focusAreas}}
- Company: {{companyName}} ({{companySize}})
- Career Ladder: {{ladderSource}} — {{isVerified ? "verified company ladder" : "template-based"}}
`;
```

### Layer 2 — Level-Specific Playbooks

```typescript
const LEVEL_PLAYBOOKS: Record<string, string> = {
  "software_engineer_1→software_engineer_2": `
    Focus: PR skills, debugging tactics, technical communication, project execution.
    Key gaps to probe: Code review quality, task estimation, asking for help effectively.
    Common blockers: Impostor syndrome, not knowing when to escalate, scope creep on tasks.
  `,
  "software_engineer_2→senior_engineer": `
    Focus: System design, influence without authority, technical leadership, mentoring.
    Key gaps to probe: Design doc quality, cross-team collaboration, owning ambiguous problems.
    Common blockers: Doing IC work instead of multiplying, not making decisions visible.
  `,
  "senior_engineer→staff_engineer": `
    Focus: Org-wide impact, technical strategy, sponsorship, setting technical direction.
    Key gaps to probe: Writing strategy docs, building consensus across teams, sponsor relationships.
    Common blockers: Staying in comfort zone, not working on the right problems, visibility gaps.
  `,
  "INTERN→software_engineer_1": `
    Focus: Return offer tactics — making impact, building relationships, showing reliability.
    Key gaps to probe: Project progress, mentor relationship, team integration, end-of-internship presentation.
    Common blockers: Fear of asking questions, not communicating blockers early, scope management.
  `,
};
```

### Layer 3 — Tactical Execution Guides

Specific scripts and templates engineers can use immediately:

```typescript
const TACTICAL_GUIDES = {
  pr_description: "Format: What → Why → How → Testing → Screenshots",
  blocker_escalation: "Script: 'I've been stuck on X for Y hours. I've tried A, B, C. I think the next step is D but I need help with E.'",
  impact_communication: "Template: 'I [action] which [metric] by [amount] for [audience].'",
  design_doc: "Structure: Context → Goals → Non-goals → Options → Recommendation → Risks",
  brag_doc_entry: "Format: [Date] [What you did] [Impact] [Who saw it] [Evidence link]",
};
```

---

## 4 Adaptive Coaching Modes

Mode detection based on energy levels and conversation signals:

| Mode | Trigger | Approach | Tone |
|------|---------|----------|------|
| **Supportive Coach** | energy ≤ 2, frustration signals | Acknowledge → Normalize → Explore → Small wins → One tiny next step | Warm, avoids toxic positivity |
| **Socratic Mentor** | High energy + seeking direction | 5 question types: Clarification, Assumptions, Evidence, Implications, Alternatives | Curious, the user does cognitive work |
| **Direct Consultant** | Analyzing blockers, needs specific help | Data-first, blunt, specific scripts and templates | Professional, direct |
| **Exploratory** | Open-ended, "messy middle" moments | Pattern-detection, open questions, reframing | Thoughtful, spacious |

### Implementation via Dynamic System Prompt

```typescript
dynamicSystemPromptMiddleware((state, runtime) => {
  const messages = state.messages;
  const lastUserMsg = messages.findLast(m => m.role === "user");
  const energyLevel = runtime.context?.latestEnergyLevel;

  let mode = "socratic"; // default
  if (energyLevel && energyLevel <= 2) mode = "supportive";
  else if (lastUserMsg?.content?.match(/stuck|blocked|help|how do I/i)) mode = "direct";
  else if (lastUserMsg?.content?.match(/thinking about|wondering|what if/i)) mode = "exploratory";

  return `${BASE_COACHING_PROMPT}\n\nCOACHING MODE: ${mode}\n${MODE_INSTRUCTIONS[mode]}`;
});
```

---

## Memory Strategy

### Short-term Memory (Conversation Thread)

```typescript
// Dev
import { MemorySaver } from "@langchain/langgraph";
const checkpointer = new MemorySaver();

// Production (Supabase Postgres)
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
const checkpointer = PostgresSaver.fromConnString(process.env.SUPABASE_DB_URL);
await checkpointer.setup();
```

### Long-term Memory (Cross-conversation Store)

```typescript
import { InMemoryStore } from "@langchain/langgraph";
const store = new InMemoryStore();

// Namespace pattern for our app:
// users/{userId}/preferences  — career goals, coaching style preference
// users/{userId}/career_plan  — current development plan
// users/{userId}/past_advice  — significant advice given (deduplication)
// users/{userId}/patterns     — detected behavioral patterns
```

---

## Middleware Stack

### Recommended Stack

```typescript
const agent = createAgent({
  model: "anthropic:claude-sonnet-4-5",
  tools: [...],
  middleware: [
    // 1. Compress old messages when nearing token limits
    summarizationMiddleware({
      trigger: { tokenCount: 80_000 },
      keep: 10,
      model: "anthropic:claude-haiku-4-5",
    }),

    // 2. Adapt system prompt based on coaching mode + user context
    dynamicSystemPromptMiddleware(buildMentorPrompt),

    // 3. Cost protection
    modelCallLimitMiddleware({ runLimit: 10 }),
    toolCallLimitMiddleware({ runLimit: 15 }),

    // 4. Resilience
    modelRetryMiddleware(),
    toolRetryMiddleware(),

    // 5. Tool error handling
    handleToolErrors,
  ],
});
```

### Custom Rate Limit Middleware

```typescript
const rateLimitCheck = createMiddleware({
  name: "RateLimitCheck",
  beforeModel: async (state, config) => {
    const userId = config.context?.userId;
    const { data } = await supabase.rpc("check_and_increment_chat_usage", {
      p_user_id: userId,
    });
    if (!data?.[0]?.allowed) throw new Error("RATE_LIMIT_EXCEEDED");
    return state;
  },
});
```

---

## Streaming to React Native

### Backend (Next.js API Route)

```typescript
// apps/web/src/app/api/mentor/chat/route.ts
export async function POST(req: Request) {
  const { message, conversationId, userId } = await req.json();

  const stream = await agent.stream(
    { messages: [{ role: "user", content: message }] },
    { configurable: { thread_id: conversationId }, context: { userId }, streamMode: "messages" }
  );

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const [chunk, metadata] of stream) {
        if (chunk.content) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: chunk.content })}\n\n`));
        }
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
```

### Frontend (React Native — Custom SSE)

```typescript
const response = await fetch(`${API_URL}/api/mentor/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ message, conversationId, userId }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const text = decoder.decode(value);
  // Parse SSE lines → extract tokens → update message state
}
```

**Decision**: Custom SSE for v1. Evaluate `useStream` hook + LangGraph server later.

---

## Structured Output

For specific flows (weekly summary, goal review), not every response:

```typescript
const CareerAdvice = z.object({
  summary: z.string().describe("2-3 sentence career insight"),
  actionItems: z.array(z.object({
    task: z.string(),
    priority: z.enum(["high", "medium", "low"]),
    timeframe: z.string(),
  })),
  encouragement: z.string(),
});
```

---

## RAG — Personal Context Retrieval

### Pipeline

```
User's check-ins/journals/goals
  → RecursiveCharacterTextSplitter (chunk 500 chars, 50 overlap)
  → Embed with text-embedding-3-small
  → Store in document_embeddings (Supabase pgvector)
  → match_documents() RPC for similarity search
```

### Document Indexing

```typescript
async function indexCheckIn(checkIn: CheckIn) {
  const content = formatCheckInForEmbedding(checkIn);
  const chunks = await splitter.splitText(content);

  for (const chunk of chunks) {
    const embedding = await embedText(chunk);
    await supabase.from("document_embeddings").upsert({
      user_id: checkIn.user_id,
      source_type: "check_in",
      source_id: checkIn.id,
      content: chunk,
      embedding,
      metadata: { date: checkIn.created_at, type: checkIn.check_in_type, energy_level: checkIn.energy_level },
    });
  }
}
```

---

## Career Ladder Data & Onboarding Integration

### Available Data Sources (Researched & Extracted)

| Source | Levels | Status | Data Quality |
|--------|--------|--------|-------------|
| **Dropbox** | IC1-IC7 (7 levels) | Extracted — `docs/career-ladder-research.json` | Excellent (5 pillars, 15+ dimensions) |
| **Etsy** | Engineer I → Principal (8 levels) | Extracted | Excellent (5 competencies × 5 tiers) |
| **Sarah Drasner / career-ladders.dev** | 6 IC levels + Tech Lead | Extracted | Good (tech/leadership/collab per level) |
| **Engineering Ladders (Fioranelli)** | 4 tracks × 5 axes | Extracted | Good (Developer, Tech Lead, TPM, EM) |
| **Progression.fyi** | 75+ company directory | URL index extracted | URLs for future scraping |
| **GitLab** | Staff, Principal, Distinguished | Blocked (auth redirect) | Manual extraction needed |
| **Patreon** | — | Domain dead (DNS not found) | Unavailable |
| **CircleCI** | P1-P6 | Google Sheets (manual export) | Good |

### Database Schema for Career Ladders

```sql
-- New tables needed
CREATE TABLE career_matrices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('public', 'user_uploaded', 'template')),
  source_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE level_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matrix_id UUID NOT NULL REFERENCES career_matrices(id) ON DELETE CASCADE,
  level_code TEXT NOT NULL,         -- IC3, L5, P4, INTERN, etc.
  level_name TEXT NOT NULL,         -- "Senior Engineer"
  level_order INT NOT NULL,         -- For sorting
  scope JSONB,                      -- { team: true, cross_team: true, ... }
  technical_expectations TEXT[],
  leadership_expectations TEXT[],
  collaboration_expectations TEXT[],
  visibility_expectations TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_matrices_company ON career_matrices(company_name);
CREATE INDEX idx_levels_matrix ON level_definitions(matrix_id);
```

### Smart Matching During Onboarding

```typescript
async function getBestMatchingLadder(companyName: string, companySize: string) {
  // 1. Exact match
  const { data: exact } = await supabase
    .from("career_matrices")
    .select("*, level_definitions(*)")
    .eq("company_name", companyName)
    .single();
  if (exact) return exact;

  // 2. Fuzzy match
  const { data: fuzzy } = await supabase
    .from("career_matrices")
    .select("*, level_definitions(*)")
    .ilike("company_name", `%${companyName}%`)
    .limit(1)
    .single();
  if (fuzzy) return fuzzy;

  // 3. Template fallback
  const template = companySize === "5000+" ? "Generic FAANG"
    : companySize === "<200" ? "Generic Startup" : "Generic Midsize";
  return await supabase.from("career_matrices")
    .select("*, level_definitions(*)").eq("company_name", template).single();
}
```

### Intern → Return Offer Track

Add a specialized level:

```json
{
  "level_code": "INTERN",
  "level_name": "Software Engineering Intern",
  "technical_expectations": [
    "Complete assigned tasks with guidance",
    "Write clean code that passes review",
    "Ask clarifying questions before coding"
  ],
  "leadership_expectations": [
    "Show eagerness to learn",
    "Communicate blockers early (after 30min of trying)",
    "Take notes in meetings"
  ],
  "visibility_expectations": [
    "Present work at end of internship",
    "Document learnings in wiki",
    "Show impact of your work to skip-level"
  ]
}
```

---

## Database Readiness Audit

### What Exists vs What's Missing

| Table / Feature | Status | Notes |
|-----------------|--------|-------|
| `profiles` | **Exists** | Has role, target_role, focus_areas |
| `check_ins` | **Exists** | Has ai_feedback field (unused), morning/evening data |
| `user_streaks` | **Exists** | Streak tracking for accountability |
| `user_notification_settings` | **Exists** | Push tokens, reminder times |
| `conversations` | **In types only — NO migration** | Need to create table |
| `messages` | **In types only — NO migration** | Need to create table |
| `daily_metrics` | **In types only — NO migration** | Rate limiting depends on this |
| `journal_entries` | **In types only — NO migration** | RAG source data |
| `document_embeddings` | **NOT in schema** | Need pgvector extension + table |
| `career_matrices` | **NOT in schema** | Need new table for ladder data |
| `level_definitions` | **NOT in schema** | Need new table for level expectations |
| `pgvector` extension | **NOT enabled** | Required for RAG |
| `check_and_increment_chat_usage` RPC | **NOT created** | Required for rate limiting |
| `match_documents` RPC | **NOT created** | Required for RAG search |

### Required Migrations (in order)

```
Migration 1: conversations + messages tables + RLS
Migration 2: daily_metrics table + indexes
Migration 3: pgvector extension + document_embeddings table + IVFFLAT index
Migration 4: check_and_increment_chat_usage + match_documents RPCs
Migration 5: career_matrices + level_definitions tables
Migration 6: journal_entries table (if not already handled)
```

---

## Onboarding Flow — Current State & Gaps

### Current 3-Step Flow

1. **ProfileScreen** → Collects: name, current role, target role
2. **ReminderSetupScreen** → Collects: morning/evening times, timezone
3. **ReadyScreen** → Auto-generates focus areas from role transition, saves everything

### What the Mentor Currently Has Access To

- Current role (5 levels: SE1, SE2, Senior, Staff, Principal)
- Target role
- Focus areas (3-4 auto-generated from role transition)
- Check-in entries (daily reflections with energy, wins, blockers)
- Conversation history

### What's Missing for Personalized Mentoring

| Field | Impact | Priority |
|-------|--------|----------|
| **Company name** | Enables company-specific ladder matching | **High** — add to onboarding |
| **Company size** | Template selection (FAANG vs Startup) | **High** — add to onboarding |
| **Team/domain** | Backend, frontend, infra, ML | Medium — could infer from check-ins |
| **Years at current level** | Urgency of promotion timeline | Medium |
| **Intern track** | Return offer coaching | **High** — add role option |
| **Manager relationship** | Context for advice | Low — learn through chat |
| **Learning style** | Coaching mode preference | Low — auto-detect from interactions |

### Recommended Onboarding Additions

```
Step 1 (existing): Name, Current Role, Target Role
Step 1b (NEW):     Company Name (autocomplete against career_matrices)
                   Company Size (dropdown: <50, 50-200, 200-1000, 1000-5000, 5000+)
                   → Show "We have [Company]'s actual career ladder!" if match found
Step 2 (existing): Reminder times
Step 3 (existing): Focus areas + save
```

**Profile schema additions needed:**

```sql
ALTER TABLE profiles ADD COLUMN company_name TEXT;
ALTER TABLE profiles ADD COLUMN company_size TEXT CHECK (company_size IN ('<50', '50-200', '200-1000', '1000-5000', '5000+'));
ALTER TABLE profiles ADD COLUMN career_matrix_id UUID REFERENCES career_matrices(id);
```

**Role enum update needed** — add `intern` option:

```sql
-- Update CHECK constraint to include intern
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('intern', 'software_engineer_1', 'software_engineer_2', 'senior_engineer', 'staff_engineer', 'principal_engineer'));
```

---

## MCP Integration Options

Already configured in `.mcp.json`: Supabase MCP, Playwright MCP.

Not needed for v1. Add later for external career data tools.

---

## Multi-Agent Patterns (Future)

| Pattern | Use Case | When |
|---------|----------|------|
| **Skills** | Specialized prompts: resume review, interview prep, career planning | Phase 2 |
| **Router** | Classify intent → route to specialized agent | Phase 3 |
| **Handoffs** | Escalation from general advice to deep-dive | Phase 3 |

**v1**: Single agent with good tools + strong 3-layer prompt.

---

## Key Decisions & Trade-offs

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Model | Claude Sonnet 4.5 | Best mentoring tone + prompt caching |
| Agent framework | `createAgent` for chat | Low latency, simple, sufficient |
| Deep agents | Scraping pipeline only | Too expensive/slow for real-time chat |
| Checkpointer | `MemorySaver` → `PostgresSaver` | Dev first, Supabase Postgres in prod |
| Streaming | Custom SSE | Works with Next.js, no extra infra |
| Structured output | Only for specific flows | Mentor should feel conversational |
| Coaching modes | 4 modes via dynamic system prompt | Adapts to user energy + intent |
| Career ladders | DB-backed with smart matching | Company-specific when available, templates as fallback |

---

## Implementation Sequence

### Phase 0: Database Migrations (Pre-requisite)
1. Create `conversations` + `messages` tables
2. Create `daily_metrics` table
3. Enable pgvector + create `document_embeddings`
4. Create `check_and_increment_chat_usage` + `match_documents` RPCs
5. Create `career_matrices` + `level_definitions` tables
6. Add `company_name`, `company_size`, `career_matrix_id` to `profiles`
7. Add `intern` to role enum

### Phase 1: Backend Foundation
1. Install LangChain packages in `apps/web/`
2. Create `apps/web/src/lib/langchain/`:
   - `config.ts` — model + agent setup
   - `tools.ts` — mentor tools
   - `middleware.ts` — summarization, dynamic prompt, rate limit, error handling
   - `prompts.ts` — 3-layer prompt system + 4 coaching modes
3. Create `/api/mentor/chat` route with SSE streaming
4. Test with curl

### Phase 2: Career Ladder Seeding
1. Seed career ladder data from `docs/career-ladder-research.json` (Dropbox, Etsy, Drasner, Fioranelli)
2. Create generic templates (FAANG, Startup, Midsize)
3. Add intern template
4. Build `get_career_ladder` tool
5. Optional: Build deep agent scraping pipeline for additional sources

### Phase 3: RAG Pipeline
1. Create embedding utility
2. Build indexing pipeline for check-ins and journal entries
3. Add background indexing (Supabase trigger or cron)
4. Test retrieval quality

### Phase 4: Mobile — Onboarding Updates
1. Add company name + company size to ProfileScreen
2. Add smart matching UI ("We have your company's ladder!")
3. Add intern role option
4. Update `roleMapping.ts` with intern focus areas

### Phase 5: Mobile — Chat UI
1. Update `useMentor` hook for SSE streaming
2. Build chat components (ChatBubble, ChatInput, TypingIndicator, etc.)
3. Wire up MentorScreen (replace InsightsScreen)
4. Update navigation

### Phase 6: Polish
1. Conversation history screen
2. Markdown rendering in chat bubbles
3. Haptic feedback
4. Brag doc builder tool
5. Weekly summary structured output

---

## Quick Reference: Imports

```typescript
// Core
import { createAgent, createMiddleware, tool } from "langchain";
import { SystemMessage, HumanMessage, AIMessage, ToolMessage } from "langchain";

// Anthropic
import { ChatAnthropic } from "@langchain/anthropic";

// LangGraph
import { MemorySaver, InMemoryStore, Command, StateSchema, MessagesValue } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

// Built-in middleware
import {
  summarizationMiddleware, dynamicSystemPromptMiddleware,
  modelCallLimitMiddleware, toolCallLimitMiddleware,
  modelFallbackMiddleware, modelRetryMiddleware, toolRetryMiddleware,
} from "langchain";

// Deep Agents (scraping pipeline only)
import { createDeepAgent } from "deepagents";

// Text splitting (for RAG)
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// Schema
import * as z from "zod";
```

---

## Data Files

| File | Contents |
|------|----------|
| `docs/career-ladder-research.json` | Extracted career data: Dropbox (IC1-IC7), Etsy (8 levels), Drasner (6 levels), Fioranelli (4 tracks), 75+ Progression.fyi URLs |
| `docs/plans/2025-12-20-mobile-ai-chat-roadmap.md` | Original chat roadmap with UI components, hook patterns, API route design |
| `docs/ai-mentor-langchain-reference.md` | This file |
