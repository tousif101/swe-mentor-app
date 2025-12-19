# Vercel Pro vs Railway: AI Mentor Chatbot Comparison

**Created:** 2025-12-17
**Context:** Infrastructure decision for LangChain AI Mentor integration

## Quick Recommendation

**For your use case: Railway wins on cost, Vercel wins on convenience**
- **Railway**: $5-15/month for prototype, better long-term economics
- **Vercel Pro**: $20/month but zero configuration, perfect Next.js integration

---

## Detailed Comparison

### Architecture Difference (CRITICAL)

| Aspect | Vercel | Railway |
|--------|--------|---------|
| **Execution Model** | Serverless functions (short-lived) | Long-lived containers (always-on) |
| **Cold Starts** | Yes (1-3 seconds) | No (instant response) |
| **Connection Persistence** | No | Yes (WebSockets, DB connections) |
| **Timeout Limits** | 60-300s (Pro), 900s (Enterprise) | Unlimited |
| **Database Calls** | Over public internet | Private network (faster) |

**What this means for the AI Mentor:**
- Railway: Agent runs in container that stays awake, database queries ~50ms faster
- Vercel: Each request spins up new function, but scales automatically

---

### Pricing Comparison

#### Vercel Pro ($20/user/month)
```
Base: $20/month
+ 1TB bandwidth (included)
+ 1,000 GB-hours compute (included)
+ 400 build hours/month

100 users scenario:
- Base: $20
- AI API calls: $8-15 (GPT-4o-mini)
- Bandwidth: $0 (within 1TB)
Total: ~$28-35/month
```

#### Railway (Usage-based, $5 minimum)
```
Pricing model:
- $20 per vCPU/month (prorated per second)
- $10 per GB RAM/month
- $0.25 per GB storage

Typical AI API setup:
- 1 vCPU, 2GB RAM = ~$40/month if always on
- Enable "sleep after 10min" = ~$10-15/month
- AI API calls: $8-15 (same as Vercel)
Total: ~$18-30/month

BUT: Can run multiple services (API + DB + Redis) for same price
```

---

### Real Costs by Scale

| Users | Vercel Pro | Railway | Winner |
|-------|-----------|---------|--------|
| **100** | $28-35/mo | $18-30/mo | Railway by $5-15 |
| **1,000** | $60-90/mo | $40-60/mo | Railway by $20-30 |
| **10,000** | $300-500/mo | $150-250/mo | Railway by ~50% |

---

### Feature Comparison

#### Development Experience

**Vercel Pro:**
- Push to GitHub → Auto-deploy (zero config)
- Preview deployments for every PR
- Perfect Next.js integration
- Built-in analytics
- Edge functions globally distributed
- Serverless constraints (timeouts, cold starts)

**Railway:**
- Push to GitHub → Auto-deploy (zero config)
- Preview deployments
- Works with any framework (Next.js, Express, FastAPI)
- Run database on same network (huge performance boost)
- No timeout limits
- Slightly more config needed vs Vercel

#### For AI Streaming Specifically

**Vercel Pro:**
- Vercel AI SDK handles streaming beautifully
- Built-in SSE support
- 60-300s timeout (usually enough for AI)
- Cold starts add 1-3s latency occasionally

**Railway:**
- Unlimited streaming duration
- No cold starts (instant response)
- Persistent connections (great for WebSockets)
- Need to implement SSE manually (or use Vercel AI SDK still)

---

### Database Integration

**Vercel + Supabase:**
```
API Route (Vercel AWS)
    ↓ (public internet, ~50-100ms)
Supabase Postgres (Supabase AWS)
```

**Railway + Railway Postgres:**
```
API Container (Railway)
    ↓ (private network, ~5-10ms)
Postgres Container (Railway)
```

**Result:** Railway's DB queries are 5-10x faster

---

## Deployment Options

### Option 1: Full Vercel (Simplest)
```
$20/month Vercel Pro
+ Supabase Free or Pro ($25/mo)
= $20-45/month

Pros: Zero config, best DX
Cons: Higher cost at scale
```

### Option 2: Railway for Everything (Cheapest)
```
$5-15/month Railway (API + Postgres + Redis on same network)

Pros: Best cost, fastest DB queries
Cons: Need to configure Postgres yourself
```

### Option 3: Hybrid - Vercel + Supabase (Recommended for MVP)
```
Vercel Pro $20/mo (Frontend + API routes)
+ Supabase Free ($0) or Pro ($25/mo)
= $20-45/month

Why: Best of both worlds
- Vercel handles Next.js beautifully
- Supabase handles DB + Auth + Storage
- No need to learn Railway
```

### Option 4: Hybrid - Railway API + Vercel Frontend (Cost-optimized)
```
Railway $10-15/mo (API routes only with sleep mode)
+ Vercel Hobby $0 (Frontend hosting)
+ Supabase Free ($0)
= $10-15/month

Why: Cheapest while keeping Vercel's frontend hosting
```

---

## Analysis for AI Mentor Use Case

### Our Specific Requirements

| Requirement | Vercel Impact | Railway Impact |
|-------------|---------------|----------------|
| **Real-time chat streaming** | 60s timeout sufficient | No timeout, better |
| **RAG queries (pgvector)** | ~50-100ms per query | ~5-10ms per query |
| **Cross-session memory loads** | Cold start + query time | Instant + fast query |
| **Overnight analysis jobs** | 300s max (need batching) | Unlimited (process all users) |
| **PostgresSaver checkpoints** | Works but slower | Works, faster |

### Timeout Analysis for Our Agents

**MentorAgent (real-time chat):**
- RAG search: ~100ms
- User context load: ~100ms
- Memory load: ~100ms
- LLM streaming: 5-30s typically
- **Total: 5-35s** → Vercel's 60s is fine

**AnalysisAgent (overnight batch):**
- Fetch user's week of check-ins: ~200ms
- Pattern detection (LLM): ~10-30s
- Insight generation (LLM): ~10-30s
- Save insights: ~100ms
- **Per user: 20-60s** → Vercel needs batching, Railway handles all

### Database Query Impact

With our data models:
```
user_memories table     → Queried every chat message
journal_entries + RAG   → Vector similarity search
check_ins              → Loaded for context
insights               → Written during analysis
langgraph_checkpoints  → Read/write every turn
```

**Estimated queries per chat message: 5-8**
- Vercel: 5-8 × 50ms = 250-400ms overhead
- Railway: 5-8 × 5ms = 25-40ms overhead

**Difference: Railway is ~10x faster for DB-heavy operations**

---

## Recommendation for SWE Mentor App

### Phase 1: MVP (Now)
**Use Vercel Pro + Supabase**
- You already have Next.js
- Zero config deployment
- 60s timeout is enough for chat
- Batch overnight analysis (process 5 users per cron trigger)

### Phase 2: Scale (100+ active users)
**Migrate AI routes to Railway**
- Keep Vercel for frontend
- Move `/api/mentor/*` and `/api/analysis/*` to Railway
- Get faster DB queries and unlimited timeouts
- Cost savings kick in

### Phase 3: Growth (1000+ users)
**Full Railway or dedicated infrastructure**
- Consider Railway Postgres (co-located)
- Or keep Supabase if auth/realtime features needed

---

## Migration Path

```
MVP (Vercel)
    ↓ When you hit timeout limits or $50+/mo
Hybrid (Vercel frontend + Railway API)
    ↓ When you need DB co-location
Full Railway (or keep hybrid)
```

**Migration effort: ~1 week** to move API routes to Express on Railway

---

## Decision

For the MVP: **Vercel Pro + Supabase** (Option 3)

Rationale:
1. Already have Next.js infrastructure
2. 60s timeout handles chat streaming
3. Batch overnight jobs to stay within limits
4. Revisit when hitting scale/cost triggers
