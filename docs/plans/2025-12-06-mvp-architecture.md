# SWE Mentor App - MVP Architecture Plan

> Senior engineer's approach to building the MVP with Supabase, LangChain/LangSmith, and GPT-4.

---

## Decisions Made

| Decision | Choice |
|----------|--------|
| **Auth** | Email + Google OAuth |
| **Mobile vs Web** | Parallel dev - Mobile for input, Web for viewing/analytics |
| **LLM** | GPT-4 via LangChain + LangSmith |
| **Hosting** | TBD (leaning Vercel + Supabase Cloud) |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
├─────────────────────┬───────────────────────────────────────────┤
│   Next.js Web App   │         Expo Mobile App                   │
│   (apps/web)        │         (apps/mobile)                     │
│   📊 View & Analyze │         📝 Input & Quick Access           │
└─────────┬───────────┴───────────────────┬───────────────────────┘
          │                               │
          ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend-as-a-Service)              │
├─────────────────────────────────────────────────────────────────┤
│  Auth  │  Postgres DB  │  Edge Functions  │  Realtime  │ Storage│
│ (Google)│  (pgvector)  │   (AI calls)     │  (sync)    │        │
└────────┴───────────────┴────────┬─────────┴────────────┴────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI LAYER (LangChain + LangSmith)             │
├─────────────────────────────────────────────────────────────────┤
│     GPT-4      │  Vector Store (pgvector)  │  LangSmith Tracing │
└────────────────┴───────────────────────────┴────────────────────┘
```

### Platform Responsibilities

| Platform | Primary Use | Features |
|----------|-------------|----------|
| **Mobile** | Daily input | Journal entries, quick mentor chat, tag on-the-go |
| **Web** | Analysis & deep work | Metrics dashboard, charts, detailed insights, long mentor sessions |

---

## Phase 1: Local Development Setup

### 1.1 Supabase Local Setup

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Initialize in project root
supabase init

# Start local Supabase (Postgres, Auth, Storage, Edge Functions)
supabase start
```

**Creates:**
```
swe-mentor-app/
├── supabase/
│   ├── config.toml          # Local config
│   ├── migrations/          # Database migrations
│   ├── functions/           # Edge Functions (Deno)
│   └── seed.sql             # Test data
```

**Local URLs:**
- Studio: http://localhost:54323
- API: http://localhost:54321
- DB: postgresql://postgres:postgres@localhost:54322/postgres

### 1.2 Environment Variables

```bash
# .env.local (web + shared)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-key>

# AI (GPT-4 + LangSmith)
OPENAI_API_KEY=<your-openai-key>
LANGCHAIN_API_KEY=<langsmith-key>
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=swe-mentor-dev
```

### 1.3 Package Installation

```bash
# Root - shared dependencies
npm install @supabase/supabase-js

# Web app
cd apps/web
npm install @supabase/ssr langchain @langchain/openai ai

# Mobile app
cd apps/mobile
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

---

## Phase 2: Database Schema (Supabase Postgres)

### 2.1 Core Tables

```sql
-- supabase/migrations/001_initial_schema.sql

-- Users (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users primary key,
  email text not null,
  name text,
  role text default 'software_engineer_1',
  avatar_url text,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Journal Entries
create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  title text,
  content text not null,
  tags text[] default '{}',
  embedding vector(1536),  -- For semantic search
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Mentor Conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  title text,
  created_at timestamptz default now()
);

-- Chat Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- User Metrics (aggregated daily)
create table public.daily_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles not null,
  date date not null,
  entries_count int default 0,
  tags_used text[] default '{}',
  mentor_messages int default 0,
  unique(user_id, date)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.journal_entries enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.daily_metrics enable row level security;

-- RLS Policies (users can only access their own data)
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can CRUD own entries" on public.journal_entries
  for all using (auth.uid() = user_id);

create policy "Users can CRUD own conversations" on public.conversations
  for all using (auth.uid() = user_id);

create policy "Users can CRUD own messages" on public.messages
  for all using (
    auth.uid() = (select user_id from public.conversations where id = conversation_id)
  );
```

### 2.2 Enable pgvector for Semantic Search

```sql
-- Enable vector extension
create extension if not exists vector;

-- Create embedding index for fast similarity search
create index on public.journal_entries
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
```

---

## Phase 3: Authentication Flow

### 3.1 Supabase Client Setup

**packages/shared/src/supabase.ts:**
```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'  // Generated types

export const createSupabaseClient = (url: string, key: string) =>
  createClient<Database>(url, key)
```

**apps/web/src/lib/supabase/server.ts:**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### 3.2 Auth Pages Structure

```
apps/web/src/app/
├── (auth)/
│   ├── login/page.tsx       # Email/password + OAuth
│   ├── signup/page.tsx      # Registration
│   └── callback/route.ts    # OAuth callback
├── (protected)/
│   ├── layout.tsx           # Auth check wrapper
│   ├── onboarding/page.tsx  # Post-signup flow
│   ├── journal/page.tsx     # Journaling
│   ├── mentor/page.tsx      # AI chat
│   └── metrics/page.tsx     # Dashboard
```

---

## Phase 4: LangChain + LangSmith Setup

### 4.1 AI Mentor Architecture

```
User Message
    │
    ▼
┌─────────────────────────────────────┐
│  LangChain Pipeline                 │
├─────────────────────────────────────┤
│ 1. Retrieve user context            │
│    - Profile (role, goals)          │
│    - Recent journal entries         │
│    - Conversation history           │
│                                     │
│ 2. Semantic search (pgvector)       │
│    - Find relevant past entries     │
│                                     │
│ 3. Build prompt with context        │
│    - System: Socratic mentor        │
│    - User context injection         │
│                                     │
│ 4. Stream response (Claude)         │
└─────────────────────────────────────┘
    │
    ▼
LangSmith Tracing (debug, evaluate, monitor)
```

### 4.2 Mentor Edge Function

**supabase/functions/mentor-chat/index.ts:**
```typescript
import { ChatOpenAI } from '@langchain/openai'
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase'

const model = new ChatOpenAI({
  model: 'gpt-4-turbo',
  temperature: 0.7,
})

const systemPrompt = `You are a senior engineering mentor using Socratic questioning.
You know the user's role: {role}, their recent work: {context}.
Ask probing questions. Don't give answers directly - guide them to insights.
Be encouraging but push for depth.`

Deno.serve(async (req) => {
  const { message, conversationId, userId } = await req.json()

  // 1. Get user profile
  const profile = await getProfile(userId)

  // 2. Semantic search for relevant context
  const relevantEntries = await vectorStore.similaritySearch(message, 3)

  // 3. Get conversation history
  const history = await getConversationHistory(conversationId)

  // 4. Build and stream response
  const response = await model.stream([
    { role: 'system', content: systemPrompt.replace('{role}', profile.role)... },
    ...history,
    { role: 'user', content: message }
  ])

  // 5. Return streaming response
  return new Response(response.toReadableStream())
})
```

### 4.3 LangSmith Integration

```typescript
// Automatic tracing with env vars
process.env.LANGCHAIN_TRACING_V2 = 'true'
process.env.LANGCHAIN_PROJECT = 'swe-mentor'

// All LangChain calls automatically traced
// View at: https://smith.langchain.com
```

**LangSmith gives you:**
- Full conversation traces
- Latency monitoring
- Token usage tracking
- Prompt versioning
- Evaluation datasets

---

## Phase 5: MVP Features Implementation

### 5.1 Onboarding Flow

**Steps:**
1. Sign up (email/OAuth)
2. Name + avatar
3. Current role selection (SWE1 → Principal)
4. Target role selection
5. Focus areas (coding, system design, leadership, etc.)
6. Complete → redirect to journal

**Key files:**
```
apps/web/src/app/(protected)/onboarding/
├── page.tsx              # Multi-step form
├── steps/
│   ├── ProfileStep.tsx   # Name, avatar
│   ├── RoleStep.tsx      # Current + target role
│   └── FocusStep.tsx     # Areas to improve
└── actions.ts            # Server actions to save
```

### 5.2 Journaling

**Features:**
- Daily entry with rich text
- Hashtag tagging (#coding, #review, #meeting)
- Auto-save drafts
- Calendar view of past entries
- Search (full-text + semantic)

**Key files:**
```
apps/web/src/app/(protected)/journal/
├── page.tsx              # Entry list + calendar
├── new/page.tsx          # New entry form
├── [id]/page.tsx         # View/edit entry
└── components/
    ├── EntryEditor.tsx   # Rich text + tags
    ├── TagInput.tsx      # Hashtag autocomplete
    └── EntryCard.tsx     # List item display
```

### 5.3 AI Mentor

**Features:**
- Conversational chat UI
- Context-aware (knows your entries, role, goals)
- Socratic questioning style
- Conversation history
- Suggested prompts

**Key files:**
```
apps/web/src/app/(protected)/mentor/
├── page.tsx              # Chat interface
├── [conversationId]/page.tsx
└── components/
    ├── ChatMessages.tsx  # Message list
    ├── ChatInput.tsx     # Input + send
    └── SuggestedPrompts.tsx
```

### 5.4 Basic Metrics

**Features:**
- Journaling streak
- Entries per week/month
- Tag frequency distribution
- Mentor session count
- Progress toward goals

**Key files:**
```
apps/web/src/app/(protected)/metrics/
├── page.tsx              # Dashboard
└── components/
    ├── StreakCard.tsx
    ├── ActivityChart.tsx
    ├── TagCloud.tsx
    └── ProgressBars.tsx
```

---

## Phase 6: Mobile App Sync

### 6.1 Shared Logic

Move business logic to `packages/shared`:
```
packages/shared/src/
├── types/                # Database types
├── hooks/
│   ├── useAuth.ts        # Auth state
│   ├── useJournal.ts     # Journal CRUD
│   └── useMentor.ts      # Chat logic
└── api/
    ├── journal.ts        # Supabase queries
    └── mentor.ts         # Edge function calls
```

### 6.2 Mobile-Specific

```
apps/mobile/
├── app/                  # Expo Router (if using)
│   ├── (auth)/
│   ├── (tabs)/
│   │   ├── index.tsx     # Home/Journal
│   │   ├── mentor.tsx    # Chat
│   │   └── metrics.tsx   # Stats
│   └── _layout.tsx
└── components/           # Mobile-specific UI
```

---

## Implementation Order (Recommended)

| Phase | Focus | Effort |
|-------|-------|--------|
| **1** | Supabase setup + Auth + Profiles | 1-2 days |
| **2** | Onboarding flow (web) | 1 day |
| **3** | Journal CRUD + UI | 2-3 days |
| **4** | LangChain mentor + Edge Function | 2-3 days |
| **5** | Metrics dashboard | 1-2 days |
| **6** | Mobile app sync | 2-3 days |
| **7** | Polish + testing | 2-3 days |

**Total MVP estimate: 2-3 weeks**

---

## Files to Create/Modify

### New Directories
- `supabase/` - Database migrations, edge functions
- `apps/web/src/lib/supabase/` - Client utilities
- `apps/web/src/app/(auth)/` - Auth pages
- `apps/web/src/app/(protected)/` - App features

### Key New Files
- `supabase/migrations/001_initial_schema.sql`
- `supabase/functions/mentor-chat/index.ts`
- `apps/web/src/lib/supabase/server.ts`
- `apps/web/src/lib/supabase/client.ts`
- `packages/shared/src/database.types.ts` (generated)

---

## Next Steps (When Ready to Implement)

1. **Phase 1**: Set up Supabase locally + run migrations
2. **Phase 2**: Add auth (Email + Google OAuth) to both web and mobile
3. **Phase 3**: Build onboarding flow (web + mobile in parallel)
4. **Phase 4**: Journal feature with real-time sync
5. **Phase 5**: LangChain mentor with GPT-4 + LangSmith tracing
6. **Phase 6**: Metrics dashboard (web-focused)
7. **Phase 7**: Polish, test, deploy
