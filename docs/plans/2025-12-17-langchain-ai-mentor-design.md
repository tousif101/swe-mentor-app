# LangChain AI Mentor Integration Design

**Created:** 2025-12-17
**Status:** Complete - Ready for Implementation

## Overview

Design for integrating LangChain and LangGraph into the SWE Mentor mobile app to provide:
- Real-time AI mentor chat with RAG over journal entries
- Full user context awareness (profile, check-ins, streaks, focus areas)
- Cross-session memory (remembers facts across conversations)
- Overnight analysis for pattern detection and insight generation

## Technology Choices

| Component | Choice | Reasoning |
|-----------|--------|-----------|
| AI Framework | LangChain + LangGraph JS | Full Node.js support, persistence, streaming |
| Runtime | Next.js API Routes | Already have it, serverless, full LangGraph support |
| Vector Store | Supabase pgvector | Already integrated, co-located with data |
| Checkpoints | PostgresSaver | Native LangGraph persistence to Supabase |
| Scheduled Jobs | Vercel Cron | Zero new infra, upgrade to Trigger.dev if needed |
| LLM | TBD (GPT-4 / Claude) | Configurable per agent |

## Mentoring Style

The AI mentor uses an adaptive approach:
- **Socratic** - Probing questions to guide insights
- **Direct Coach** - Actionable advice based on detected patterns
- **Adaptive** - Adjusts style based on user's mood/energy level

Custom "super prompt" will encode coaching levels and context injection.

---

## Section 1: Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        MOBILE APP                                │
│                   (Expo + React Native)                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTPS + SSE streaming
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                            │
├─────────────────────────────────────────────────────────────────┤
│  POST /api/mentor/chat     → MentorAgent (streaming response)   │
│  GET  /api/mentor/history  → Conversation list                  │
│  POST /api/analysis/run    → AnalysisAgent (cron-triggered)     │
│  GET  /api/insights        → Generated insights for user        │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LANGGRAPH LAYER                             │
├────────────────────────┬────────────────────────────────────────┤
│     MentorAgent        │           AnalysisAgent                │
│  ┌──────────────────┐  │        ┌──────────────────┐            │
│  │ Tools:           │  │        │ Tools:           │            │
│  │ - searchJournals │  │        │ - fetchCheckIns  │            │
│  │ - getCheckIns    │  │        │ - detectPatterns │            │
│  │ - getUserProfile │  │        │ - generateInsight│            │
│  │ - loadMemories   │  │        │ - saveInsight    │            │
│  │ - saveMemory     │  │        └──────────────────┘            │
│  └──────────────────┘  │                                        │
├────────────────────────┴────────────────────────────────────────┤
│  PostgresSaver (checkpoints)  │  MemoryStore (cross-session)    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   SUPABASE POSTGRES                              │
├─────────────────────────────────────────────────────────────────┤
│  journal_entries    │ check_ins      │ user_memories (NEW)      │
│  (+ embeddings)     │ user_streaks   │ insights (NEW)           │
│  conversations      │ profiles       │ langgraph_checkpoints    │
│  messages           │                │                          │
└─────────────────────────────────────────────────────────────────┘
```

**Key points:**
- Mobile calls Next.js API (existing web app becomes the AI backend)
- LangGraph handles agent orchestration, tool calling, and state
- PostgresSaver persists conversation checkpoints to Supabase
- Two new tables: `user_memories` (cross-session facts) and `insights` (generated analysis)

---

## Section 2: Data Models

### New Tables

```sql
-- Cross-session memories (facts the mentor learns about you)
create table public.user_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  category text not null,        -- 'goal', 'preference', 'context', 'insight'
  content text not null,         -- "Preparing for promotion review in Q1"
  source_conversation_id uuid references public.conversations,
  confidence float default 1.0,  -- For decay/updates over time
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Generated insights from overnight analysis
create table public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  insight_type text not null,    -- 'weekly_summary', 'pattern', 'recommendation'
  title text not null,
  content text not null,
  data jsonb,                    -- Supporting data (charts, stats)
  period_start date,
  period_end date,
  read_at timestamptz,           -- Track if user has seen it
  created_at timestamptz default now()
);

-- RLS Policies
alter table public.user_memories enable row level security;
alter table public.insights enable row level security;

create policy "Users can CRUD own memories" on public.user_memories
  for all using (auth.uid() = user_id);

create policy "Users can read own insights" on public.insights
  for select using (auth.uid() = user_id);

-- LangGraph checkpoint table (auto-created by PostgresSaver)
-- Schema: langgraph_checkpoints (thread_id, checkpoint, metadata, created_at)
```

### Embedding Strategy for RAG

| Table | What Gets Embedded | When | Vector Column |
|-------|-------------------|------|---------------|
| `journal_entries` | `content` field | On create/update | `embedding vector(1536)` |
| `check_ins` | Combined: `daily_goal + quick_win + blocker` | On completion | Add new column |

**Embedding trigger (Edge Function or API):**
```typescript
// On journal entry create/update
const embedding = await openai.embeddings.create({
  model: "text-embedding-3-small",
  input: entry.content
});
await supabase.from('journal_entries')
  .update({ embedding: embedding.data[0].embedding })
  .eq('id', entry.id);
```

### Memory Categories

| Category | Example | Use Case |
|----------|---------|----------|
| `goal` | "Working toward senior engineer promotion" | Long-term coaching context |
| `preference` | "Prefers morning deep work" | Personalized advice |
| `context` | "Has 1:1 with manager every Thursday" | Timely reminders |
| `insight` | "Often blocked by unclear requirements" | Pattern-based coaching |
| `fact` | "Uses Python primarily, learning Go" | Technical context |

### Existing Tables Used

| Table | How Agent Uses It |
|-------|------------------|
| `profiles` | Role, target_role, focus_areas for personalization |
| `check_ins` | Recent goals, blockers, energy levels for context |
| `user_streaks` | Gamification data, streak-aware encouragement |
| `journal_entries` | RAG source for semantic search |
| `conversations` | Conversation threading |
| `messages` | Chat history within conversation |

---

## Section 3: MentorAgent Design

### Flow

```
User Message
    │
    ▼
┌─────────────────┐
│ Load Context    │ ← getUserProfile, getRecentCheckIns, loadMemories
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ RAG Search      │ ← searchJournals (if message needs historical context)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build Prompt    │ ← System prompt + user context + RAG results + history
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ LLM Generate    │ ← Stream response tokens
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Extract Memory  │ ← saveMemory (if new fact learned about user)
└────────┬────────┘
         │
         ▼
Response streamed to mobile
```

### Tools

| Tool | Purpose | When Called |
|------|---------|-------------|
| `searchJournals` | RAG over journal entries | User asks about past work |
| `getRecentCheckIns` | Last 7 days of check-ins | Always (context) |
| `getUserProfile` | Profile, role, focus areas | Always (context) |
| `loadMemories` | Cross-session facts | Always (personalization) |
| `saveMemory` | Store new fact learned | When user shares something memorable |
| `getCurrentStreak` | Streak data | For encouragement/gamification |
| `getRecentInsights` | Read AnalysisAgent insights | Reference in conversation |

### System Prompt Structure

```typescript
const systemPrompt = `
You are a senior engineering mentor for {user.name}.

## User Context
- Current Role: {user.role}
- Target Role: {user.target_role}
- Focus Areas: {user.focus_areas.join(', ')}
- Current Streak: {streak.current_streak} days
- Energy Today: {todayCheckIn?.energy_level || 'unknown'}

## What You Know About Them
{memories.map(m => `- ${m.content}`).join('\n')}

## Recent Activity
{recentCheckIns.map(c => `- ${c.check_in_date}: Goal="${c.daily_goal}", Win="${c.quick_win}", Blocker="${c.blocker}"`).join('\n')}

## Recent Insights (from Analysis)
{insights.map(i => `- ${i.title}: ${i.content.slice(0, 100)}...`).join('\n')}

## Your Approach
- Use Socratic questioning to guide them to insights
- When you detect patterns, give direct actionable advice
- Adapt your tone to their energy level (supportive when low, challenging when high)
- Reference their past work and insights when relevant

## Relevant Past Entries (RAG)
{ragResults.map(r => `- ${r.created_at}: ${r.content.slice(0, 200)}...`).join('\n')}
`;
```

### Conversation Threading

- Each conversation gets a `thread_id` for LangGraph checkpointing
- `thread_id` = `conversation.id` from Supabase
- PostgresSaver persists state between messages
- User can have multiple conversations (like ChatGPT)

---

## Section 4: AnalysisAgent Design

### Flow

```
Cron triggers /api/analysis/run (daily at 2am)
    │
    ▼
┌─────────────────┐
│ Get Users Batch │ ← Users who need analysis (last run > 24h ago)
└────────┬────────┘
         │
    For each user:
         │
         ▼
┌─────────────────┐
│ Fetch Data      │ ← All check-ins from period (week/month)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Pattern Detect  │ ← LLM analyzes: blockers, energy, goals, wins
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate Insight│ ← Create summary, recommendations, trends
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save to DB      │ ← Insert into `insights` table
└─────────────────┘
```

### Insight Types

| Type | Frequency | What it contains |
|------|-----------|------------------|
| `weekly_summary` | Every Sunday | Week recap, wins, challenges, patterns |
| `pattern` | When detected | "You're most productive on Tuesdays" |
| `recommendation` | When relevant | "Consider blocking morning time for deep work" |
| `streak_milestone` | On achievement | "7-day streak! Here's what changed..." |
| `blocker_trend` | When recurring | "Unclear requirements blocked you 4x this month" |

### Example Insight Output

```json
{
  "insight_type": "weekly_summary",
  "title": "Week of Dec 9-15 Summary",
  "content": "You completed 5 of 7 daily goals this week. Your wins centered around system design work. Energy dipped mid-week (avg 3.2 vs 4.1 last week). Main blocker: waiting on code reviews.",
  "data": {
    "goals_completed": 5,
    "goals_total": 7,
    "avg_energy": 3.2,
    "top_focus_area": "system-design",
    "recurring_blocker": "code-reviews"
  },
  "period_start": "2024-12-09",
  "period_end": "2024-12-15"
}
```

### Tools

| Tool | Purpose |
|------|---------|
| `fetchCheckIns` | Get check-ins for date range |
| `fetchJournalEntries` | Get journal entries for date range |
| `getUserProfile` | Profile context |
| `getPreviousInsights` | Compare to last week |
| `saveInsight` | Write to insights table |

### Batch Processing (Vercel Timeout Handling)

Since Vercel has 60s timeout on Pro plan:
- Process 3-5 users per cron invocation
- Track `last_analysis_at` per user
- Cron runs every 15 minutes overnight
- All users processed within ~2 hours

---

## Section 5: API Design

### Endpoints Overview

```
/api/mentor/
├── POST /chat              → Stream chat response
├── GET  /conversations     → List user's conversations
├── POST /conversations     → Create new conversation
├── GET  /conversations/[id]→ Get conversation with messages
└── DELETE /conversations/[id] → Delete conversation

/api/insights/
├── GET  /                  → List user's insights
├── GET  /[id]              → Get single insight
├── PATCH /[id]/read        → Mark as read

/api/analysis/
└── POST /run               → Trigger analysis (cron only, secured)
```

### POST /api/mentor/chat

**Request:**
```typescript
{
  conversation_id: string;      // Existing or new UUID
  message: string;              // User's message (max 5000 chars)
}

// Headers
Authorization: Bearer <supabase_jwt>
```

**Response (SSE Stream):**
```typescript
// Stream events
data: {"type": "token", "content": "Let"}
data: {"type": "token", "content": " me"}
data: {"type": "tool_call", "tool": "searchJournals", "status": "running"}
data: {"type": "tool_result", "tool": "searchJournals", "found": 3}
data: {"type": "token", "content": "..."}
data: {"type": "done", "message_id": "uuid", "usage": {"messages_remaining": 12}}

// Error events
data: {"type": "error", "code": "RATE_LIMITED", "message": "Rate limit exceeded"}
data: {"type": "error", "code": "CONVERSATION_LIMIT", "message": "Start a new conversation"}
```

**Mobile client code (React Native):**
```typescript
const streamChat = async (conversationId: string, message: string) => {
  const response = await fetch(`${API_URL}/api/mentor/chat`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ conversation_id: conversationId, message }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

    for (const line of lines) {
      const event = JSON.parse(line.slice(6));

      switch (event.type) {
        case 'token':
          appendToMessage(event.content);
          break;
        case 'done':
          setMessagesRemaining(event.usage.messages_remaining);
          break;
        case 'error':
          handleError(event);
          break;
      }
    }
  }
};
```

### GET /api/insights

**Request:**
```
GET /api/insights?type=weekly_summary&unread=true&limit=10
Authorization: Bearer <supabase_jwt>
```

**Response:**
```json
{
  "insights": [
    {
      "id": "uuid",
      "insight_type": "weekly_summary",
      "title": "Week of Dec 9-15",
      "content": "You completed 5 of 7 goals...",
      "data": { "goals_completed": 5, "avg_energy": 3.2 },
      "read_at": null,
      "created_at": "2024-12-15T02:00:00Z"
    }
  ],
  "unread_count": 3
}
```

### Vercel Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/analysis/run",
      "schedule": "*/15 2-4 * * *"
    }
  ]
}
```

---

## Section 6: Security & Safety

### Authentication Flow

```
Mobile App
    │
    │ 1. User logs in via Supabase Auth
    ▼
┌─────────────────┐
│ Supabase Auth   │ → Returns JWT (access_token)
└────────┬────────┘
         │
         │ 2. JWT included in all API requests
         ▼
┌─────────────────┐
│ Next.js API     │ → Validates JWT, extracts user_id
└────────┬────────┘
         │
         │ 3. All DB queries scoped to user_id
         ▼
┌─────────────────┐
│ Supabase DB     │ → RLS enforces user can only see own data
└─────────────────┘
```

### Conversation & Token Limits

**Per-conversation message limits to control token burn:**

```typescript
const LIMITS = {
  free: {
    maxConversationMessages: 15,
    maxMessageLength: 500,
    messagesPerHour: 20,
    messagesPerDay: 50,
    tokensPerDay: 10_000,
  },
  pro: {
    maxConversationMessages: 50,
    maxMessageLength: 2000,
    messagesPerHour: 100,
    messagesPerDay: 500,
    tokensPerDay: 100_000,
  },
  unlimited: {
    maxConversationMessages: 200,
    maxMessageLength: 5000,
    messagesPerHour: 500,
    messagesPerDay: 2000,
    tokensPerDay: 1_000_000,
  },
};
```

**Validation before every message:**

```typescript
async function validateRequest(conversationId: string, userId: string, message: string) {
  const [usage, messageCount] = await Promise.all([
    getUserUsage(userId),
    getConversationMessageCount(conversationId),
  ]);

  const limits = LIMITS[usage.tier];

  // Check conversation limit
  if (messageCount >= limits.maxConversationMessages) {
    throw new AppError(
      `Conversation limit reached (${limits.maxConversationMessages} messages). Start a new conversation.`,
      'CONVERSATION_LIMIT'
    );
  }

  // Check message length
  if (message.length > limits.maxMessageLength) {
    throw new AppError(
      `Message too long. Max ${limits.maxMessageLength} characters.`,
      'MESSAGE_TOO_LONG'
    );
  }

  // Check daily token budget
  if (usage.tokens_used_today >= limits.tokensPerDay) {
    throw new AppError(
      'Daily limit reached. Resets at midnight or upgrade for more.',
      'DAILY_LIMIT'
    );
  }

  return { limits, usage, messagesRemaining: limits.maxConversationMessages - messageCount };
}
```

### Token Usage Tracking

```sql
-- User usage tracking table
create table public.user_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null unique,
  tier text default 'free',
  tokens_used_today int default 0,
  tokens_used_month int default 0,
  messages_today int default 0,
  last_reset_at timestamptz default now(),
  created_at timestamptz default now()
);

-- RLS
alter table public.user_usage enable row level security;
create policy "Users can read own usage" on public.user_usage
  for select using (auth.uid() = user_id);

-- Daily reset (pg_cron)
select cron.schedule('reset-daily-usage', '0 0 * * *', $$
  update public.user_usage
  set tokens_used_today = 0, messages_today = 0, last_reset_at = now()
  where last_reset_at < current_date;
$$);
```

### Prompt Injection Prevention (4 Layers)

**Layer 1: Detection**
```typescript
const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instructions/gi,
  /disregard\s+(previous|above|all)/gi,
  /you\s+are\s+now/gi,
  /system\s*:/gi,
  /\[INST\]/gi,
  /\[SYSTEM\]/gi,
  /<<SYS>>/gi,
  /<\|im_start\|>/gi,
  /jailbreak/gi,
  /DAN\s*mode/gi,
];

function detectInjectionAttempt(input: string): boolean {
  return INJECTION_PATTERNS.some(pattern => pattern.test(input));
}
```

**Layer 2: Sanitization**
```typescript
function sanitizeUserInput(input: string): string {
  if (detectInjectionAttempt(input)) {
    logSecurityEvent('injection_attempt', { input: input.slice(0, 100) });
  }

  return input
    .replace(/\0/g, '')                    // Null bytes
    .replace(/[\x00-\x1F\x7F]/g, '')       // Control chars
    .replace(/```/g, '` ` `')              // Code fence escape
    .slice(0, 5000)
    .trim();
}
```

**Layer 3: Role Separation**
```typescript
// NEVER interpolate user content into system prompt
function buildSecureMessages(systemPrompt: string, userMessage: string, history: Message[]) {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: '[VERIFIED USER CONTEXT]\n' + getUserContext() },
    ...history.map(m => ({
      role: m.role,
      content: m.role === 'user' ? sanitizeUserInput(m.content) : m.content
    })),
    { role: 'user', content: sanitizeUserInput(userMessage) }
  ];
}
```

**Layer 4: Output Validation**
```typescript
function validateLLMResponse(response: string): string {
  const LEAK_PATTERNS = [/api[_-]?key/gi, /secret/gi, /SUPABASE_/gi, /OPENAI_/gi];

  if (LEAK_PATTERNS.some(p => p.test(response))) {
    logSecurityEvent('potential_leak', { response: response.slice(0, 100) });
    return "I encountered an error. Please try again.";
  }
  return response;
}
```

### SQL Injection Prevention

```typescript
// ALWAYS use Supabase client (parameterized queries)
// NEVER string interpolation

const searchJournals = tool(
  async ({ query }: { query: string }) => {
    // Validate and sanitize
    const sanitized = query
      .replace(/[^\w\s-]/g, ' ')  // Remove special SQL chars
      .slice(0, 200)
      .trim();

    if (!sanitized) return [];

    // Supabase handles SQL safely
    const { data } = await supabase
      .from('journal_entries')
      .select('id, content, created_at')
      .eq('user_id', userId)           // Always scope to user
      .textSearch('content', sanitized)
      .limit(5);

    return data || [];
  },
  {
    name: 'searchJournals',
    schema: z.object({
      query: z.string().max(200)
    })
  }
);
```

### Input Validation (Zod)

```typescript
import { z } from 'zod';

const ChatRequestSchema = z.object({
  conversation_id: z.string().uuid(),
  message: z.string()
    .min(1, 'Message required')
    .max(5000, 'Message too long')
    .refine(val => !detectInjectionAttempt(val), 'Invalid content'),
});

// In API route
export async function POST(req: Request) {
  const body = await req.json();
  const validated = ChatRequestSchema.safeParse(body);

  if (!validated.success) {
    return Response.json(
      { error: validated.error.issues[0].message },
      { status: 400 }
    );
  }
  // Use validated.data safely
}
```

### Rate Limiting

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(50, '1 h'),
  analytics: true,
});

async function checkRateLimit(userId: string) {
  const { success, remaining, reset } = await ratelimit.limit(userId);

  if (!success) {
    throw new AppError(
      `Rate limited. Try again in ${Math.ceil((reset - Date.now()) / 1000)}s`,
      'RATE_LIMITED',
      429
    );
  }

  return { remaining };
}
```

### Error Handling (No Info Leakage)

```typescript
class AppError extends Error {
  constructor(
    public userMessage: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(userMessage);
  }
}

function handleError(error: unknown): Response {
  // Log full error internally
  console.error('Error:', error);

  if (error instanceof AppError) {
    return Response.json(
      { error: error.userMessage, code: error.code },
      { status: error.statusCode }
    );
  }

  // Never expose internal errors
  return Response.json(
    { error: 'Something went wrong. Please try again.', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}
```

### Security Summary

| Threat | Protection |
|--------|------------|
| **Token burn** | 15-20 msg/conversation limit, daily token budgets, tier-based limits |
| **Prompt injection** | Detection → Sanitization → Role separation → Output validation |
| **SQL injection** | Parameterized queries only, input sanitization, Zod validation |
| **Rate abuse** | Per-hour, per-day, per-conversation limits with Upstash |
| **Data leakage** | RLS policies, user-scoped queries, output scanning |
| **Error leakage** | Generic messages to users, internal logging only |
| **Auth bypass** | JWT validation on every request, service role key server-only |

---

## Implementation Notes

### Dependencies to Add

```bash
# In apps/web
npm install @langchain/langgraph @langchain/core @langchain/openai
npm install @langchain/langgraph-checkpoint-postgres
npm install @langchain/community  # For Supabase vector store
```

### Environment Variables

```bash
# AI
OPENAI_API_KEY=
ANTHROPIC_API_KEY=           # If using Claude
LANGCHAIN_API_KEY=           # For LangSmith tracing
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=swe-mentor

# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # For server-side operations

# Rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Cron security
CRON_SECRET=                 # Verify Vercel cron requests
```

### New Files to Create

```
apps/web/
├── src/
│   ├── app/api/
│   │   ├── mentor/
│   │   │   ├── chat/route.ts           # POST - streaming chat
│   │   │   └── conversations/
│   │   │       ├── route.ts            # GET/POST conversations
│   │   │       └── [id]/route.ts       # GET/DELETE conversation
│   │   ├── insights/
│   │   │   ├── route.ts                # GET insights list
│   │   │   └── [id]/
│   │   │       ├── route.ts            # GET single insight
│   │   │       └── read/route.ts       # PATCH mark as read
│   │   └── analysis/
│   │       └── run/route.ts            # POST cron trigger
│   └── lib/
│       ├── agents/
│       │   ├── mentor-agent.ts         # MentorAgent definition
│       │   ├── analysis-agent.ts       # AnalysisAgent definition
│       │   └── tools/
│       │       ├── search-journals.ts
│       │       ├── get-check-ins.ts
│       │       ├── get-user-profile.ts
│       │       ├── load-memories.ts
│       │       ├── save-memory.ts
│       │       └── get-insights.ts
│       ├── security/
│       │   ├── sanitize.ts             # Input sanitization
│       │   ├── validate.ts             # Zod schemas
│       │   └── rate-limit.ts           # Upstash rate limiting
│       └── langchain/
│           ├── checkpointer.ts         # PostgresSaver setup
│           └── embeddings.ts           # Embedding generation

supabase/
└── migrations/
    ├── YYYYMMDD_create_user_memories.sql
    ├── YYYYMMDD_create_insights.sql
    ├── YYYYMMDD_create_user_usage.sql
    └── YYYYMMDD_add_check_in_embeddings.sql
```

---

## Implementation Roadmap

### Phase 1: Foundation (Database + Setup)
- [ ] Create migration: `user_memories` table
- [ ] Create migration: `insights` table
- [ ] Create migration: `user_usage` table
- [ ] Create migration: Add embedding column to `check_ins`
- [ ] Enable pgvector extension (if not already)
- [ ] Install LangChain dependencies
- [ ] Set up environment variables
- [ ] Set up Upstash Redis for rate limiting

### Phase 2: MentorAgent (Real-time Chat)
- [ ] Create PostgresSaver checkpointer
- [ ] Implement MentorAgent tools (RAG, context, memories)
- [ ] Create `/api/mentor/chat` streaming endpoint
- [ ] Implement security middleware (auth, rate limit, validation)
- [ ] Implement prompt injection protection
- [ ] Create conversation CRUD endpoints
- [ ] Test streaming from mobile app

### Phase 3: AnalysisAgent (Overnight Jobs)
- [ ] Implement AnalysisAgent tools
- [ ] Create `/api/analysis/run` endpoint
- [ ] Set up Vercel cron job
- [ ] Implement batch processing for timeout handling
- [ ] Create insight generation logic
- [ ] Create `/api/insights` endpoints
- [ ] Test insight generation

### Phase 4: Mobile Integration
- [ ] Create MentorScreen with chat UI
- [ ] Implement SSE streaming client
- [ ] Create InsightsScreen to display generated insights
- [ ] Add conversation history screen
- [ ] Handle rate limit / conversation limit UX
- [ ] Add loading states and error handling

### Phase 5: Polish & Security Audit
- [ ] LangSmith tracing setup
- [ ] Security review (injection, SQL, auth)
- [ ] Load testing rate limits
- [ ] Token usage monitoring
- [ ] Error tracking setup

---

## Summary

This design provides:

1. **MentorAgent** - Real-time AI chat with:
   - RAG over journal entries
   - Full user context (profile, check-ins, streaks)
   - Cross-session memory
   - Socratic + coaching style (adaptive)
   - 15-20 message conversation limits

2. **AnalysisAgent** - Overnight batch processing:
   - Weekly summaries
   - Pattern detection
   - Recommendations
   - Saved to `insights` table

3. **Security** - Production-ready protections:
   - 4-layer prompt injection defense
   - SQL injection prevention
   - Tier-based rate limiting
   - Token budget tracking
   - No info leakage in errors

4. **Infrastructure** - Built on existing stack:
   - Next.js API routes (no new services)
   - Supabase Postgres + pgvector
   - Vercel Cron for overnight jobs
   - LangSmith for observability

**Estimated implementation: 2-3 weeks**

---

## Related Documents

- [Vercel vs Railway Comparison](./2025-12-17-vercel-vs-railway-comparison.md)
- [MVP Architecture](./2025-12-06-mvp-architecture.md)
- [Roadmap](../ROADMAP.md)
