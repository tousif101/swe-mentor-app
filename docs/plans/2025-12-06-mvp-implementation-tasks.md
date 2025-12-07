# SWE Mentor MVP - Implementation Tasks

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build MVP with onboarding, journaling, AI mentor, and metrics across web and mobile.

**Architecture:** Supabase (Auth, Postgres, Edge Functions) + Next.js web + Expo mobile + GPT-4 via LangChain with LangSmith tracing. Mobile for input, web for analytics.

**Tech Stack:** Next.js 16, Expo 54, Supabase, LangChain, GPT-4, pgvector, TypeScript

---

## Phase Overview

```
Phase 1: Foundation (Backend)     ──┬── Can run in PARALLEL
Phase 2: Foundation (Frontend)    ──┘

Phase 3: Auth (Backend + Frontend) ── Sequential (depends on Phase 1-2)

Phase 4: Onboarding ──┬── Can run in PARALLEL after Phase 3
Phase 5: Journaling ──┤
Phase 6: AI Mentor  ──┘

Phase 7: Metrics ── Sequential (depends on Phase 5-6 data)

Phase 8: Mobile Sync ── Can start after Phase 3, parallel with 4-7

Phase 9: Polish & Deploy ── Final
```

---

## Team Assignment Matrix

| Phase | Backend Dev | Frontend Dev (Web) | Mobile Dev | QA |
|-------|-------------|-------------------|------------|-----|
| 1 | ✅ Primary | - | - | - |
| 2 | - | ✅ Primary | ✅ Primary | - |
| 3 | ✅ Support | ✅ Primary | ✅ Primary | - |
| 4 | ✅ Support | ✅ Primary | ✅ Parallel | ✅ Write tests |
| 5 | ✅ Primary | ✅ Primary | ✅ Parallel | ✅ Write tests |
| 6 | ✅ Primary | ✅ Primary | ✅ Parallel | ✅ Write tests |
| 7 | ✅ Support | ✅ Primary | ✅ View only | ✅ Write tests |
| 8 | - | - | ✅ Primary | ✅ Write tests |
| 9 | ✅ All | ✅ All | ✅ All | ✅ All |

---

# Phase 1: Foundation (Backend)

## Task 1.1: Initialize Supabase

**Assignee:** Backend Dev
**Estimate:** 30 min
**Dependencies:** None
**Parallel:** Can run with Task 2.1, 2.2

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/.gitignore`
- Create: `.env.local.example`

**Step 1: Install Supabase CLI**

```bash
brew install supabase/tap/supabase
supabase --version
```

Expected: Version number displayed

**Step 2: Initialize Supabase in project**

```bash
cd /Users/tousif/Documents/projects/swe-mentor-app
supabase init
```

Expected: Creates `supabase/` directory with `config.toml`

**Step 3: Create environment example file**

Create `.env.local.example`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI (GPT-4 + LangSmith)
OPENAI_API_KEY=your-openai-key
LANGCHAIN_API_KEY=your-langsmith-key
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=swe-mentor-dev
```

**Step 4: Start local Supabase**

```bash
supabase start
```

Expected: Local services start, outputs API URL and keys

**Step 5: Commit**

```bash
git add supabase/ .env.local.example
git commit -m "chore: initialize supabase local development"
```

**Acceptance Criteria:**
- [ ] `supabase start` runs without errors
- [ ] Local Studio accessible at http://localhost:54323
- [ ] API accessible at http://localhost:54321
- [ ] `.env.local.example` documents all required env vars

---

## Task 1.2: Create Database Schema Migration

**Assignee:** Backend Dev
**Estimate:** 45 min
**Dependencies:** Task 1.1
**Parallel:** None

**Files:**
- Create: `supabase/migrations/20251206000001_initial_schema.sql`

**Step 1: Create migration file**

Create `supabase/migrations/20251206000001_initial_schema.sql`:

```sql
-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text,
  avatar_url text,
  role text default 'software_engineer_1' check (role in (
    'software_engineer_1',
    'software_engineer_2',
    'senior_engineer',
    'staff_engineer',
    'principal_engineer'
  )),
  target_role text check (target_role in (
    'software_engineer_1',
    'software_engineer_2',
    'senior_engineer',
    'staff_engineer',
    'principal_engineer'
  )),
  focus_areas text[] default '{}',
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Journal entries table
create table public.journal_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles on delete cascade not null,
  title text,
  content text not null,
  tags text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Mentor conversations table
create table public.conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles on delete cascade not null,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chat messages table
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references public.conversations on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Daily metrics table (aggregated)
create table public.daily_metrics (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles on delete cascade not null,
  date date not null,
  entries_count int default 0,
  tags_used text[] default '{}',
  mentor_messages int default 0,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.journal_entries enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.daily_metrics enable row level security;

-- RLS Policies: Users can only access their own data

-- Profiles policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Journal entries policies
create policy "Users can view own entries"
  on public.journal_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on public.journal_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on public.journal_entries for delete
  using (auth.uid() = user_id);

-- Conversations policies
create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- Messages policies
create policy "Users can view own messages"
  on public.messages for select
  using (
    auth.uid() = (
      select user_id from public.conversations
      where id = messages.conversation_id
    )
  );

create policy "Users can insert own messages"
  on public.messages for insert
  with check (
    auth.uid() = (
      select user_id from public.conversations
      where id = messages.conversation_id
    )
  );

-- Daily metrics policies
create policy "Users can view own metrics"
  on public.daily_metrics for select
  using (auth.uid() = user_id);

create policy "Users can insert own metrics"
  on public.daily_metrics for insert
  with check (auth.uid() = user_id);

create policy "Users can update own metrics"
  on public.daily_metrics for update
  using (auth.uid() = user_id);

-- Indexes for performance
create index idx_journal_entries_user_id on public.journal_entries(user_id);
create index idx_journal_entries_created_at on public.journal_entries(created_at desc);
create index idx_conversations_user_id on public.conversations(user_id);
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_daily_metrics_user_date on public.daily_metrics(user_id, date);

-- Function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on auth signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger update_journal_entries_updated_at
  before update on public.journal_entries
  for each row execute procedure public.update_updated_at();

create trigger update_conversations_updated_at
  before update on public.conversations
  for each row execute procedure public.update_updated_at();
```

**Step 2: Apply migration**

```bash
supabase db reset
```

Expected: Migration applies successfully

**Step 3: Verify tables in Studio**

Open http://localhost:54323 → Table Editor
Expected: All 5 tables visible with correct columns

**Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat(db): add initial schema with profiles, journals, conversations, messages, metrics"
```

**Acceptance Criteria:**
- [ ] All 5 tables created (profiles, journal_entries, conversations, messages, daily_metrics)
- [ ] RLS enabled on all tables
- [ ] RLS policies prevent cross-user data access
- [ ] Trigger auto-creates profile on user signup
- [ ] Indexes created for query performance

---

## Task 1.3: Generate TypeScript Database Types

**Assignee:** Backend Dev
**Estimate:** 15 min
**Dependencies:** Task 1.2
**Parallel:** None

**Files:**
- Create: `packages/shared/src/database.types.ts`
- Modify: `packages/shared/src/index.ts`

**Step 1: Generate types from Supabase**

```bash
supabase gen types typescript --local > packages/shared/src/database.types.ts
```

**Step 2: Export types from shared package**

Add to `packages/shared/src/index.ts`:

```typescript
// Database types
export type { Database } from './database.types';
export type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from './database.types';

// Convenience type aliases
export type Profile = Tables<'profiles'>;
export type JournalEntry = Tables<'journal_entries'>;
export type Conversation = Tables<'conversations'>;
export type Message = Tables<'messages'>;
export type DailyMetrics = Tables<'daily_metrics'>;
```

**Step 3: Verify types compile**

```bash
cd packages/shared && npx tsc --noEmit
```

Expected: No errors

**Step 4: Commit**

```bash
git add packages/shared/
git commit -m "feat(types): generate supabase database types"
```

**Acceptance Criteria:**
- [ ] Types generated without errors
- [ ] Types exported from shared package
- [ ] TypeScript compilation succeeds

---

## Task 1.4: Install Supabase Dependencies

**Assignee:** Backend Dev
**Estimate:** 15 min
**Dependencies:** Task 1.1
**Parallel:** Can run with Task 1.2, 1.3

**Files:**
- Modify: `package.json` (root)
- Modify: `apps/web/package.json`
- Modify: `apps/mobile/package.json`

**Step 1: Install root dependencies**

```bash
npm install @supabase/supabase-js
```

**Step 2: Install web dependencies**

```bash
cd apps/web
npm install @supabase/ssr
```

**Step 3: Install mobile dependencies**

```bash
cd apps/mobile
npm install @react-native-async-storage/async-storage
```

**Step 4: Commit**

```bash
git add package.json package-lock.json apps/web/package.json apps/mobile/package.json
git commit -m "chore: install supabase dependencies"
```

**Acceptance Criteria:**
- [ ] @supabase/supabase-js installed at root
- [ ] @supabase/ssr installed in web app
- [ ] @react-native-async-storage/async-storage installed in mobile

---

# Phase 2: Foundation (Frontend)

## Task 2.1: Create Supabase Client Utilities (Web)

**Assignee:** Frontend Dev (Web)
**Estimate:** 30 min
**Dependencies:** Task 1.4
**Parallel:** Can run with Task 2.2

**Files:**
- Create: `apps/web/src/lib/supabase/client.ts`
- Create: `apps/web/src/lib/supabase/server.ts`
- Create: `apps/web/src/lib/supabase/middleware.ts`
- Create: `apps/web/.env.local`

**Step 1: Create browser client**

Create `apps/web/src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@swe-mentor/shared'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Step 2: Create server client**

Create `apps/web/src/lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@swe-mentor/shared'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component - ignore
          }
        },
      },
    }
  )
}
```

**Step 3: Create middleware helper**

Create `apps/web/src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@swe-mentor/shared'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login (except public routes)
  const publicRoutes = ['/', '/login', '/signup', '/auth/callback']
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route ||
    request.nextUrl.pathname.startsWith('/auth/')
  )

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/journal'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

**Step 4: Create local env file**

Copy `.env.local.example` to `apps/web/.env.local` and fill in local values from `supabase status`

**Step 5: Commit**

```bash
git add apps/web/src/lib/
git commit -m "feat(web): add supabase client utilities"
```

**Acceptance Criteria:**
- [ ] Browser client creates successfully
- [ ] Server client creates successfully
- [ ] Middleware handles auth redirects
- [ ] TypeScript compiles without errors

---

## Task 2.2: Create Supabase Client (Mobile)

**Assignee:** Mobile Dev
**Estimate:** 30 min
**Dependencies:** Task 1.4
**Parallel:** Can run with Task 2.1

**Files:**
- Create: `apps/mobile/src/lib/supabase.ts`
- Create: `apps/mobile/.env`

**Step 1: Create mobile supabase client**

Create `apps/mobile/src/lib/supabase.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@swe-mentor/shared'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
```

**Step 2: Create env file**

Create `apps/mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Step 3: Update App.tsx to test connection**

Temporarily add to `apps/mobile/App.tsx` to verify:

```typescript
import { useEffect } from 'react'
import { supabase } from './src/lib/supabase'

// Inside App component:
useEffect(() => {
  supabase.auth.getSession().then(({ data, error }) => {
    console.log('Supabase connected:', !error)
  })
}, [])
```

**Step 4: Commit**

```bash
git add apps/mobile/src/lib/ apps/mobile/.env
git commit -m "feat(mobile): add supabase client"
```

**Acceptance Criteria:**
- [ ] Supabase client initializes without errors
- [ ] AsyncStorage configured for session persistence
- [ ] Connection test logs success

---

# Phase 3: Authentication

## Task 3.1: Create Auth Callback Route (Web)

**Assignee:** Frontend Dev (Web)
**Estimate:** 20 min
**Dependencies:** Task 2.1
**Parallel:** None

**Files:**
- Create: `apps/web/src/app/auth/callback/route.ts`

**Step 1: Create OAuth callback handler**

Create `apps/web/src/app/auth/callback/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/journal'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Check if user needs onboarding
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        if (profile && !profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
```

**Step 2: Commit**

```bash
git add apps/web/src/app/auth/
git commit -m "feat(auth): add OAuth callback route"
```

**Acceptance Criteria:**
- [ ] Callback exchanges code for session
- [ ] Redirects to onboarding if not completed
- [ ] Redirects to journal if onboarding complete
- [ ] Handles errors gracefully

---

## Task 3.2: Create Login Page (Web)

**Assignee:** Frontend Dev (Web)
**Estimate:** 45 min
**Dependencies:** Task 3.1
**Parallel:** Can run with Task 3.3

**Files:**
- Create: `apps/web/src/app/(auth)/login/page.tsx`
- Create: `apps/web/src/app/(auth)/login/actions.ts`
- Create: `apps/web/src/app/(auth)/layout.tsx`

**Step 1: Create auth layout**

Create `apps/web/src/app/(auth)/layout.tsx`:

```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  )
}
```

**Step 2: Create login actions**

Create `apps/web/src/app/(auth)/login/actions.ts`:

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/journal')
}

export async function loginWithGoogle() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}
```

**Step 3: Create login page**

Create `apps/web/src/app/(auth)/login/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login, loginWithGoogle } from './actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    const result = await loginWithGoogle()
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl gradient-bg mx-auto mb-4 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">SW</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="text-gray-400 mt-2">Sign in to continue your journey</p>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Google OAuth */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-white text-gray-900 font-semibold flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-gray-500 text-sm">or</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>

      {/* Email form */}
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-primary-500 focus:outline-none text-white"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Password</label>
          <input
            type="password"
            name="password"
            required
            className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-primary-500 focus:outline-none text-white"
            placeholder="••••••••"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl gradient-bg font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {/* Sign up link */}
      <p className="text-center text-gray-400">
        Don't have an account?{' '}
        <Link href="/signup" className="text-primary-400 hover:text-primary-300">
          Sign up
        </Link>
      </p>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add apps/web/src/app/\(auth\)/
git commit -m "feat(auth): add login page with email and Google OAuth"
```

**Acceptance Criteria:**
- [ ] Login form displays correctly
- [ ] Email/password login works
- [ ] Google OAuth redirects correctly
- [ ] Error messages display properly
- [ ] Loading states work
- [ ] Styling matches design system

---

## Task 3.3: Create Signup Page (Web)

**Assignee:** Frontend Dev (Web)
**Estimate:** 30 min
**Dependencies:** Task 3.1
**Parallel:** Can run with Task 3.2

**Files:**
- Create: `apps/web/src/app/(auth)/signup/page.tsx`
- Create: `apps/web/src/app/(auth)/signup/actions.ts`

**Step 1: Create signup actions**

Create `apps/web/src/app/(auth)/signup/actions.ts`:

```typescript
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: error.message }
  }

  redirect('/onboarding')
}
```

**Step 2: Create signup page**

Create `apps/web/src/app/(auth)/signup/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from './actions'
import { loginWithGoogle } from '../login/actions'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    const result = await loginWithGoogle()
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl gradient-bg mx-auto mb-4 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">SW</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="text-gray-400 mt-2">Start your engineering growth journey</p>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Google OAuth */}
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-white text-gray-900 font-semibold flex items-center justify-center gap-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-800" />
        <span className="text-gray-500 text-sm">or</span>
        <div className="flex-1 h-px bg-gray-800" />
      </div>

      {/* Email form */}
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-primary-500 focus:outline-none text-white"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Password</label>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-primary-500 focus:outline-none text-white"
            placeholder="••••••••"
          />
          <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl gradient-bg font-semibold text-white disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {/* Login link */}
      <p className="text-center text-gray-400">
        Already have an account?{' '}
        <Link href="/login" className="text-primary-400 hover:text-primary-300">
          Sign in
        </Link>
      </p>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add apps/web/src/app/\(auth\)/signup/
git commit -m "feat(auth): add signup page"
```

**Acceptance Criteria:**
- [ ] Signup form displays correctly
- [ ] Account creation works
- [ ] Redirects to onboarding after signup
- [ ] Password validation (min 8 chars)
- [ ] Error handling works

---

## Task 3.4: Create Middleware for Auth Protection (Web)

**Assignee:** Frontend Dev (Web)
**Estimate:** 15 min
**Dependencies:** Task 2.1
**Parallel:** None

**Files:**
- Create: `apps/web/src/middleware.ts`

**Step 1: Create middleware**

Create `apps/web/src/middleware.ts`:

```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Step 2: Commit**

```bash
git add apps/web/src/middleware.ts
git commit -m "feat(auth): add middleware for route protection"
```

**Acceptance Criteria:**
- [ ] Unauthenticated users redirected to /login
- [ ] Authenticated users redirected away from /login, /signup
- [ ] Public routes accessible without auth
- [ ] Session refreshed on each request

---

## Task 3.5: Create Auth Tests

**Assignee:** QA
**Estimate:** 1 hour
**Dependencies:** Task 3.1-3.4
**Parallel:** None

**Files:**
- Create: `apps/web/src/__tests__/auth/login.test.tsx`
- Create: `apps/web/src/__tests__/auth/signup.test.tsx`

**Step 1: Install testing dependencies**

```bash
cd apps/web
npm install -D @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom
```

**Step 2: Create login tests**

Create `apps/web/src/__tests__/auth/login.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '@/app/(auth)/login/page'

// Mock the actions
jest.mock('@/app/(auth)/login/actions', () => ({
  login: jest.fn(),
  loginWithGoogle: jest.fn(),
}))

describe('Login Page', () => {
  it('renders login form', () => {
    render(<LoginPage />)

    expect(screen.getByText('Welcome back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument()
    expect(screen.getByText('Continue with Google')).toBeInTheDocument()
  })

  it('shows error message when login fails', async () => {
    const { login } = require('@/app/(auth)/login/actions')
    login.mockResolvedValue({ error: 'Invalid credentials' })

    render(<LoginPage />)

    fireEvent.change(screen.getByPlaceholderText('you@example.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByText('Sign in'))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('disables button while loading', async () => {
    render(<LoginPage />)

    fireEvent.click(screen.getByText('Continue with Google'))

    expect(screen.getByText('Continue with Google')).toBeDisabled()
  })
})
```

**Step 3: Create signup tests**

Create `apps/web/src/__tests__/auth/signup.test.tsx`:

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignupPage from '@/app/(auth)/signup/page'

jest.mock('@/app/(auth)/signup/actions', () => ({
  signup: jest.fn(),
}))
jest.mock('@/app/(auth)/login/actions', () => ({
  loginWithGoogle: jest.fn(),
}))

describe('Signup Page', () => {
  it('renders signup form', () => {
    render(<SignupPage />)

    expect(screen.getByText('Create your account')).toBeInTheDocument()
    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument()
  })

  it('validates password length', () => {
    render(<SignupPage />)

    const passwordInput = screen.getByPlaceholderText('••••••••')
    expect(passwordInput).toHaveAttribute('minLength', '8')
  })
})
```

**Step 4: Run tests**

```bash
npm test
```

Expected: All tests pass

**Step 5: Commit**

```bash
git add apps/web/src/__tests__/
git commit -m "test(auth): add login and signup page tests"
```

**Acceptance Criteria:**
- [ ] Login page renders correctly
- [ ] Error messages display on failed login
- [ ] Loading states work correctly
- [ ] Signup page validates password length
- [ ] All tests pass

---

# Phase 4: Onboarding

## Task 4.1: Create Onboarding Page (Web)

**Assignee:** Frontend Dev (Web)
**Estimate:** 1.5 hours
**Dependencies:** Task 3.4
**Parallel:** Can run with Task 5.1, 6.1

**Files:**
- Create: `apps/web/src/app/(protected)/onboarding/page.tsx`
- Create: `apps/web/src/app/(protected)/onboarding/actions.ts`
- Create: `apps/web/src/app/(protected)/layout.tsx`

**Step 1: Create protected layout**

Create `apps/web/src/app/(protected)/layout.tsx`:

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return <>{children}</>
}
```

**Step 2: Create onboarding actions**

Create `apps/web/src/app/(protected)/onboarding/actions.ts`:

```typescript
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const name = formData.get('name') as string
  const role = formData.get('role') as string
  const targetRole = formData.get('targetRole') as string
  const focusAreas = formData.getAll('focusAreas') as string[]

  const { error } = await supabase
    .from('profiles')
    .update({
      name,
      role,
      target_role: targetRole,
      focus_areas: focusAreas,
      onboarding_completed: true,
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  redirect('/journal')
}
```

**Step 3: Create onboarding page**

Create `apps/web/src/app/(protected)/onboarding/page.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { completeOnboarding } from './actions'

const ROLES = [
  { value: 'software_engineer_1', label: 'Software Engineer I', description: 'Entry level, learning fundamentals' },
  { value: 'software_engineer_2', label: 'Software Engineer II', description: 'Independent contributor' },
  { value: 'senior_engineer', label: 'Senior Engineer', description: 'Technical leadership, mentoring' },
  { value: 'staff_engineer', label: 'Staff Engineer', description: 'Cross-team impact, architecture' },
  { value: 'principal_engineer', label: 'Principal Engineer', description: 'Org-wide technical strategy' },
]

const FOCUS_AREAS = [
  { value: 'coding', label: 'Coding', icon: '💻' },
  { value: 'system_design', label: 'System Design', icon: '🏗️' },
  { value: 'communication', label: 'Communication', icon: '💬' },
  { value: 'leadership', label: 'Leadership', icon: '👥' },
  { value: 'debugging', label: 'Debugging', icon: '🔍' },
  { value: 'testing', label: 'Testing', icon: '✅' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [focusAreas, setFocusAreas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.set('name', name)
    formData.set('role', role)
    formData.set('targetRole', targetRole)
    focusAreas.forEach(area => formData.append('focusAreas', area))

    const result = await completeOnboarding(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  function toggleFocusArea(area: string) {
    setFocusAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${
                s <= step ? 'gradient-bg' : 'bg-gray-800'
              }`}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm mb-6">
            {error}
          </div>
        )}

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">What's your name?</h1>
              <p className="text-gray-400 mt-2">This is how your mentor will address you</p>
            </div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3.5 rounded-xl bg-gray-800 border border-gray-700 focus:border-primary-500 focus:outline-none text-white text-lg"
              autoFocus
            />
            <button
              onClick={() => setStep(2)}
              disabled={!name.trim()}
              className="w-full py-4 rounded-2xl gradient-bg font-semibold text-white disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 2: Current Role */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">What's your current role?</h1>
              <p className="text-gray-400 mt-2">We'll tailor advice to your level</p>
            </div>
            <div className="space-y-3">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`w-full p-4 rounded-xl text-left transition-colors ${
                    role === r.value
                      ? 'bg-primary-600/20 border-2 border-primary-500'
                      : 'bg-gray-800/50 border-2 border-transparent hover:border-gray-700'
                  }`}
                >
                  <p className="font-medium text-white">{r.label}</p>
                  <p className="text-sm text-gray-400 mt-1">{r.description}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-2xl glass text-gray-300"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!role}
                className="flex-1 py-4 rounded-2xl gradient-bg font-semibold text-white disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Target Role */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">What's your target role?</h1>
              <p className="text-gray-400 mt-2">Where do you want to be?</p>
            </div>
            <div className="space-y-3">
              {ROLES.filter(r =>
                ROLES.findIndex(x => x.value === r.value) >=
                ROLES.findIndex(x => x.value === role)
              ).map(r => (
                <button
                  key={r.value}
                  onClick={() => setTargetRole(r.value)}
                  className={`w-full p-4 rounded-xl text-left transition-colors ${
                    targetRole === r.value
                      ? 'bg-primary-600/20 border-2 border-primary-500'
                      : 'bg-gray-800/50 border-2 border-transparent hover:border-gray-700'
                  }`}
                >
                  <p className="font-medium text-white">{r.label}</p>
                  <p className="text-sm text-gray-400 mt-1">{r.description}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 rounded-2xl glass text-gray-300"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!targetRole}
                className="flex-1 py-4 rounded-2xl gradient-bg font-semibold text-white disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Focus Areas */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">What do you want to improve?</h1>
              <p className="text-gray-400 mt-2">Select all that apply</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {FOCUS_AREAS.map(area => (
                <button
                  key={area.value}
                  onClick={() => toggleFocusArea(area.value)}
                  className={`p-4 rounded-xl text-center transition-colors ${
                    focusAreas.includes(area.value)
                      ? 'bg-primary-600/20 border-2 border-primary-500'
                      : 'bg-gray-800/50 border-2 border-transparent hover:border-gray-700'
                  }`}
                >
                  <span className="text-2xl">{area.icon}</span>
                  <p className="font-medium text-white mt-2">{area.label}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-4 rounded-2xl glass text-gray-300"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={focusAreas.length === 0 || loading}
                className="flex-1 py-4 rounded-2xl gradient-bg font-semibold text-white disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Get Started'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add apps/web/src/app/\(protected\)/
git commit -m "feat(onboarding): add multi-step onboarding flow"
```

**Acceptance Criteria:**
- [ ] 4-step onboarding flow works
- [ ] Progress bar updates correctly
- [ ] Role selection filters target roles appropriately
- [ ] Focus areas can be multi-selected
- [ ] Profile updates in database on completion
- [ ] Redirects to journal after completion

---

# Phase 5: Journaling

## Task 5.1: Create Journal List Page (Web)

**Assignee:** Frontend Dev (Web)
**Estimate:** 1 hour
**Dependencies:** Task 3.4
**Parallel:** Can run with Task 4.1, 6.1

**Files:**
- Create: `apps/web/src/app/(protected)/journal/page.tsx`
- Create: `apps/web/src/app/(protected)/journal/components/EntryCard.tsx`

[Task details continue...]

---

## Task 5.2: Create Journal Entry Form (Web)

**Files:**
- Create: `apps/web/src/app/(protected)/journal/new/page.tsx`
- Create: `apps/web/src/app/(protected)/journal/new/actions.ts`
- Create: `apps/web/src/app/(protected)/journal/components/TagInput.tsx`

[Task details continue...]

---

# Phase 6: AI Mentor

## Task 6.1: Install LangChain Dependencies

**Assignee:** Backend Dev
**Estimate:** 15 min
**Dependencies:** Task 1.4
**Parallel:** Can run with Task 4.1, 5.1

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install packages**

```bash
cd apps/web
npm install langchain @langchain/openai @langchain/community ai
```

**Step 2: Commit**

```bash
git add apps/web/package.json apps/web/package-lock.json
git commit -m "chore: install langchain dependencies"
```

---

## Task 6.2: Create Mentor Chat API Route (Web)

**Assignee:** Backend Dev
**Estimate:** 1 hour
**Dependencies:** Task 6.1
**Parallel:** None

**Files:**
- Create: `apps/web/src/app/api/chat/route.ts`

**Step 1: Create chat route**

Create `apps/web/src/app/api/chat/route.ts`:

```typescript
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'edge'

const SYSTEM_PROMPT = `You are a senior engineering mentor using the Socratic method.

Your approach:
- Ask probing questions rather than giving direct answers
- Help the user discover insights themselves
- Be encouraging but push for depth
- Reference their past work when relevant
- Tailor advice to their current role and target role

User context:
- Name: {name}
- Current role: {role}
- Target role: {targetRole}
- Focus areas: {focusAreas}

Recent journal context:
{recentEntries}

Remember: Guide, don't tell. Ask "why" and "how" questions. Help them think critically.`

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages, conversationId } = await req.json()

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role, target_role, focus_areas')
    .eq('id', user.id)
    .single()

  // Get recent journal entries for context
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('title, content, tags, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const recentEntries = entries
    ?.map(e => `- ${e.title || 'Untitled'} (${e.tags?.join(', ')}): ${e.content?.slice(0, 200)}...`)
    .join('\n') || 'No recent entries'

  // Build system prompt with context
  const systemPrompt = SYSTEM_PROMPT
    .replace('{name}', profile?.name || 'Engineer')
    .replace('{role}', profile?.role || 'software_engineer_1')
    .replace('{targetRole}', profile?.target_role || 'senior_engineer')
    .replace('{focusAreas}', profile?.focus_areas?.join(', ') || 'general growth')
    .replace('{recentEntries}', recentEntries)

  // Initialize model
  const model = new ChatOpenAI({
    model: 'gpt-4-turbo',
    temperature: 0.7,
    streaming: true,
  })

  // Convert messages to LangChain format
  const langchainMessages = [
    new SystemMessage(systemPrompt),
    ...messages.map((m: { role: string; content: string }) =>
      m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
    ),
  ]

  // Stream response
  const stream = await model.stream(langchainMessages)

  // Save user message to database
  if (conversationId) {
    const userMessage = messages[messages.length - 1]
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: userMessage.content,
    })
  }

  // Return streaming response
  const encoder = new TextEncoder()
  let fullResponse = ''

  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.content as string
        fullResponse += text
        controller.enqueue(encoder.encode(text))
      }

      // Save assistant response to database
      if (conversationId) {
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: fullResponse,
        })
      }

      controller.close()
    },
  })

  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
```

**Step 2: Add environment variable**

Add to `.env.local`:
```
OPENAI_API_KEY=your-api-key
```

**Step 3: Commit**

```bash
git add apps/web/src/app/api/
git commit -m "feat(mentor): add streaming chat API with GPT-4"
```

**Acceptance Criteria:**
- [ ] API authenticates user
- [ ] Injects user profile context into prompt
- [ ] Includes recent journal entries in context
- [ ] Streams response correctly
- [ ] Saves messages to database
- [ ] Handles errors gracefully

---

## Task 6.3: Create Mentor Chat UI (Web)

**Assignee:** Frontend Dev (Web)
**Estimate:** 1.5 hours
**Dependencies:** Task 6.2
**Parallel:** None

**Files:**
- Create: `apps/web/src/app/(protected)/mentor/page.tsx`
- Create: `apps/web/src/app/(protected)/mentor/components/ChatMessages.tsx`
- Create: `apps/web/src/app/(protected)/mentor/components/ChatInput.tsx`

[Task details continue...]

---

# Phase 7: Metrics Dashboard

## Task 7.1: Create Metrics Page (Web)

**Assignee:** Frontend Dev (Web)
**Estimate:** 2 hours
**Dependencies:** Task 5.1, Task 6.3
**Parallel:** None

[Task details continue...]

---

# Phase 8: Mobile Sync

## Task 8.1: Set Up Expo Router

**Assignee:** Mobile Dev
**Estimate:** 30 min
**Dependencies:** Task 3.5
**Parallel:** Can run with Phase 4-7

[Task details continue...]

---

# Test Plan Summary

## Unit Tests

| Area | Test File | Coverage |
|------|-----------|----------|
| Auth | `__tests__/auth/login.test.tsx` | Login form, errors, loading |
| Auth | `__tests__/auth/signup.test.tsx` | Signup form, validation |
| Onboarding | `__tests__/onboarding/page.test.tsx` | Multi-step flow |
| Journal | `__tests__/journal/entry-form.test.tsx` | Form submission, tags |
| Mentor | `__tests__/mentor/chat.test.tsx` | Message display, input |
| Metrics | `__tests__/metrics/dashboard.test.tsx` | Data display |

## Integration Tests

| Area | Test File | Coverage |
|------|-----------|----------|
| Auth Flow | `__tests__/integration/auth.test.ts` | Signup → Onboarding → Journal |
| Journal CRUD | `__tests__/integration/journal.test.ts` | Create, Read, Update, Delete |
| Mentor Chat | `__tests__/integration/mentor.test.ts` | Send message, receive response |
| Data Sync | `__tests__/integration/sync.test.ts` | Web ↔ Mobile data consistency |

## E2E Tests (Playwright)

| Flow | Test File | Steps |
|------|-----------|-------|
| New User | `e2e/new-user.spec.ts` | Signup → Onboarding → First entry → First chat |
| Returning User | `e2e/returning-user.spec.ts` | Login → Journal → Mentor → Metrics |
| Mobile Web | `e2e/mobile-viewport.spec.ts` | All flows on mobile viewport |

---

# Definition of Done

Each task is complete when:

- [ ] Code written and compiles
- [ ] Unit tests pass
- [ ] Integration tests pass (if applicable)
- [ ] Manually tested in browser/device
- [ ] Code reviewed (if team)
- [ ] Committed with descriptive message
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Accessibility basics (keyboard nav, labels)
- [ ] Responsive on mobile viewport

---

# Appendix: Commands Reference

```bash
# Start local development
supabase start                    # Start local Supabase
npm run dev:web                   # Start Next.js
npm run dev:mobile                # Start Expo

# Database
supabase db reset                 # Reset and re-run migrations
supabase gen types typescript     # Regenerate types

# Testing
npm test                          # Run unit tests
npm run test:e2e                  # Run Playwright tests

# Build
npm run build:web                 # Build Next.js
npm run typecheck                 # TypeScript check
npm run lint                      # ESLint

# Git
git add . && git commit -m "..."  # Commit changes
git push origin feature/...       # Push branch
```
