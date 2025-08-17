# 🚀 SWE Mentor App - AI-Powered Career Development for Software Engineers

A comprehensive coaching and mentoring companion designed to help software engineers track their daily work, receive AI-powered mentorship, and measure progress against career advancement ladders. The system captures work activities through multiple channels (web, mobile, SMS), provides intelligent insights, and helps engineers identify gaps to reach senior-level positions.

## ✨ What's Been Implemented

### 🏗️ Core Architecture
- **Monorepo Structure**: Organized with `apps/web`, `apps/mobile`, and `packages/` for shared code
- **Next.js Web App**: Full-stack application with API routes and modern React components
- **Expo Mobile App**: React Native mobile application for on-the-go journaling
- **Supabase Backend**: Managed PostgreSQL with real-time features and authentication
- **AI Integration**: LangChain + LangGraph + OpenAI for intelligent mentorship

### 📱 Implemented Features

#### Web Application (`/apps/web`)
- **Dashboard** (`/dashboard`) - Career progress tracking and analytics placeholders
- **Journal Management** (`/journal`) - Daily work logging and reflection interface
- **Check-in System** (`/check-in`) - Structured daily/weekly check-ins (5 questions)
- **AI Mentor** (`/mentor`) - Chat interface for Socratic questioning and guidance
- **Authentication** (`/login`) - Supabase OAuth + Magic Link integration

#### API Endpoints (Fully Implemented)
- **Journal API** (`/api/journal`) - Create and manage work entries with validation
- **Search API** (`/api/search`) - Vector-powered semantic search through journal entries
- **AI Mentor API** (`/api/agent/mentor`) - LangGraph-powered mentorship sessions
- **Career Ladders** (`/api/ladders/upload-json`) - Upload custom career frameworks
- **SMS Integration** (`/api/webhooks/twilio-sms`) - SMS-based journaling with signature validation

#### Mobile Application (`/apps/mobile`)
- Home screen with check-in cards and quick actions
- Progressive check-in flow (5 questions)
- Basic mentor chat interface
- Search functionality across journal entries

### 🧠 AI & Intelligence Features
- **LangGraph Workflows**: Multi-step agent pipeline (clarifier → mentor → summarizer)
- **Security Sentinel**: Guards against prompt injection and data exfiltration
- **OpenAI Integration**: GPT-5 for reasoning, GPT-4 for summarization/classification
- **Vector Embeddings**: Semantic search with pgvector and OpenAI embeddings
- **Memory Retrieval**: Time-weighted search across journal entries and digests

### 📊 Tech Stack
- **Language**: TypeScript (Node 20+)
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Mobile**: Expo (React Native) with EAS
- **Backend**: Next.js API routes on Vercel
- **Auth + DB**: Managed Supabase (Postgres + Auth + Realtime) with pgvector
- **Vector/RAG**: LangChain JS + LangGraph JS + OpenAI SDK
- **LLMs**: GPT-5 for reasoning, GPT-4 for summarization/classification
- **SMS/Voice**: Twilio (webhooks to Next.js)
- **Testing**: Jest + Testing Library (web), Playwright (e2e), Supertest (API)
- **Monorepo**: pnpm workspaces

## 🚧 What Still Needs to Be Done

### Immediate Priorities
1. **Database Schema Completion**: Finish Supabase database setup with all career framework tables
2. **Environment Configuration**: Set up all required environment variables for production
3. **Career Framework Integration**: Complete the built-in Twilio career ladder functionality
4. **Dashboard Visualization**: Implement the actual charts (radar, trend, heatmap) - currently placeholders
5. **Authentication Polish**: Complete OAuth flow and user onboarding experience

### Medium-Term Features
1. **PDF Framework Upload**: Allow users to upload custom career frameworks from PDFs
2. **Progress Tracking System**: Implement competency scoring and gap analysis calculations
3. **SMS Reminder System**: Complete Twilio integration for daily check-in reminders
4. **Real-time Dashboard Updates**: Live progress updates and notifications
5. **Mobile Offline Support**: Offline journaling with sync capabilities
6. **Digest Generation**: Automated daily/weekly/monthly summary generation

### Advanced Features (Future)
1. **Voice Input**: Voice-to-text journaling capabilities
2. **Team Analytics**: Manager insights and team progress tracking
3. **Integration APIs**: Connect with GitHub, Jira, Slack for automatic activity capture
4. **Advanced AI Agents**: Gap analysis agent, summarizer agent improvements
5. **Export/Reporting**: Progress reports and portfolio generation

## Project Structure

```
repo/
├── package.json (pnpm workspaces + scripts)
├── .npmrc (auto-install-peers=true)
├── .editorconfig, .gitignore, .prettierrc, .eslintrc.js
├── .env.example (all required keys)
├── tsconfig.json (base config)
├── jest.config.js (multi-project setup)
├── playwright.config.ts (e2e config)
├── apps/
│   ├── web/ (Next.js 14 App Router)
│   │   ├── package.json (Next.js + Supabase + Tailwind + AI deps)
│   │   ├── tailwind.config.ts (custom design tokens)
│   │   ├── next.config.js (transpile backend package)
│   │   ├── app/
│   │   │   ├── layout.tsx (root layout with Tailwind)
│   │   │   ├── page.tsx (landing with navigation cards)
│   │   │   ├── globals.css (CSS custom properties)
│   │   │   ├── login/page.tsx (Supabase OAuth + Magic Link)
│   │   │   ├── dashboard/page.tsx (radar/trend/heatmap placeholders)
│   │   │   ├── journal/page.tsx (list + "New Entry" modal)
│   │   │   ├── check-in/page.tsx (daily/weekly 5 questions)
│   │   │   ├── mentor/page.tsx (chat UI with citations)
│   │   │   └── api/
│   │   │       ├── journal/route.ts (POST with validation)
│   │   │       ├── search/route.ts (POST vector search)
│   │   │       ├── agent/mentor/route.ts (LangGraph integration)
│   │   │       ├── ladders/upload-json/route.ts (competency upload)
│   │   │       └── webhooks/twilio-sms/route.ts (signature validation)
│   │   ├── docs/tailwind-tokens.md (design system reference)
│   │   └── __tests__/ (API unit tests with mocks)
│   └── mobile/ (Expo React Native)
│       ├── package.json (Expo + React Navigation + Supabase)
│       ├── app.json (Expo config with deep linking)
│       ├── App.tsx (navigation setup)
│       ├── src/
│       │   ├── screens/
│       │   │   ├── HomeScreen.tsx (check-in card + quick actions)
│       │   │   ├── CheckInScreen.tsx (5-question flow)
│       │   │   ├── MentorScreen.tsx (basic chat)
│       │   │   └── SearchScreen.tsx (search list)
│       │   └── lib/supabase.ts (expo-secure-store integration)
├── packages/
│   ├── backend/ (server-only libraries)
│   │   ├── package.json (LangChain + OpenAI + Supabase + Twilio)
│   │   ├── prompts/
│   │   │   ├── security/
│   │   │   │   ├── sentinel.yaml (guards against injection/exfiltration)
│   │   │   │   └── auditor.yaml (code security review)
│   │   │   ├── mentor.yaml (Socratic questioning)
│   │   │   ├── summarizer.yaml (daily/weekly/monthly digests)
│   │   │   ├── clarifier.yaml (improve entry quality)
│   │   │   └── gap_analysis.yaml (competency weaknesses)
│   │   ├── lib/
│   │   │   ├── supabase.ts (admin + client helpers)
│   │   │   ├── embeddings.ts (OpenAI embeddings + chunking)
│   │   │   ├── retriever.ts (vector search with time weighting)
│   │   │   ├── security.ts (sentinel invoker + secret scrubber)
│   │   │   ├── twilio.ts (signature validation)
│   │   │   └── ladder.ts (gap analysis calculations)
│   │   ├── agents/
│   │   │   ├── graph.ts (LangGraph: clarifier → mentor → summarizer)
│   │   │   └── tools.ts (fetch_memory, fetch_ladder_gap, log_insight)
│   │   ├── db/migrations/0001_init.sql (complete schema + RLS)
│   │   └── __tests__/ (unit tests with mocks)
│   └── ui/ (shared React components)
│       ├── package.json (CVA + Tailwind utilities)
│       └── src/
│           ├── components/Button.tsx (CVA variants: solid/soft/ghost/outline)
│           ├── utils.ts (cn utility for class merging)
│           └── index.ts (exports)
└── tests/e2e/ (Playwright integration tests)
    ├── mentor_flow.spec.ts (agent calls + security blocking)
    └── digests.spec.ts (entry → digest generation)
```

## 🏃‍♂️ How to Run Locally

### Prerequisites
- Node.js 18+ and pnpm installed
- Supabase account and project
- OpenAI API key
- Twilio account (optional, for SMS features)

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd coaching-app
pnpm install
```

### 2. Environment Setup
Create `.env.local` files in both `apps/web` and `apps/mobile`:

**Required Environment Variables:**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-key

# Twilio Configuration (Optional)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_MESSAGING_SID=your-messaging-sid

# App Configuration
APP_BASE_URL=http://localhost:3000
```

### 3. Supabase Database Setup
1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Enable the `vector` extension in SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Run the migration file: `packages/backend/db/migrations/0001_init.sql`
4. Configure OAuth providers (Google recommended) in Authentication settings

### 4. Start Development Servers

**Web Application:**
```bash
pnpm dev:web
# Runs on http://localhost:3000
```

**Mobile Application:**
```bash
pnpm dev:mobile
# Starts Expo development server
# Scan QR code with Expo Go app
```

### 5. Verify Setup
1. Visit `http://localhost:3000`
2. Test login/signup functionality
3. Create a journal entry
4. Try the AI mentor chat
5. Check the dashboard (charts will be placeholders for now)

### 6. Development Commands
```bash
# Run all tests
pnpm test

# Run end-to-end tests
pnpm test:e2e

# Type checking across all packages
pnpm typecheck

# Lint all code
pnpm lint

# Build all apps
pnpm build
```

## 🔑 Key Features

### For Software Engineers
- **Daily Work Tracking**: Log accomplishments, blockers, and learnings through multiple channels
- **AI-Powered Mentorship**: Get Socratic guidance on technical challenges and career development
- **Career Progression Tracking**: Measure progress against industry career ladders (starting with Twilio)
- **Intelligent Knowledge Base**: Searchable history of decisions, solutions, and learnings
- **Multi-Channel Input**: Web, mobile, or SMS entry options for maximum flexibility
- **Real-time Insights**: AI-generated insights and suggestions based on your work patterns

### For Engineering Managers
- **Team Development Insights**: Understanding of team challenges and growth opportunities
- **Career Framework Management**: Framework-based progression tracking for direct reports
- **Knowledge Retention**: Capture and preserve team learnings and institutional knowledge
- **Automated Reporting**: Regular digests and progress updates for performance reviews

### 🛡️ Security & Privacy
- **Row-Level Security**: Users can only access their own data through database policies
- **OAuth Authentication**: Secure login via Supabase with multiple provider options
- **Data Encryption**: All sensitive data encrypted at rest and in transit
- **AI Safety**: Prompt injection prevention, output scrubbing, and cost controls
- **Webhook Security**: Cryptographic signature validation for all external integrations

### 🔍 AI & Intelligence
- **Multi-Model AI**: GPT-5 for complex reasoning, GPT-4 for summarization and classification
- **Vector Search**: Semantic search through work history using OpenAI embeddings and pgvector
- **LangGraph Workflows**: Multi-step agent pipelines (clarifier → mentor → summarizer)
- **Context-Aware Mentorship**: AI mentor that understands your work history and career goals
- **Automated Insights**: Daily, weekly, and monthly AI-generated summaries and recommendations
- **Security-First AI**: Built-in guards against prompt injection and data exfiltration

## 📊 API Endpoints

### Authentication Required
All API routes require valid Supabase session tokens in the Authorization header.

### Core Endpoints
- `POST /api/journal` - Create journal entries with automatic embedding generation
- `POST /api/search` - Vector search across user's journal entries and digests
- `POST /api/agent/mentor` - Chat with AI mentor using LangGraph workflows
- `POST /api/ladders/upload-json` - Upload custom career competency frameworks
- `POST /api/webhooks/twilio-sms` - Handle incoming SMS messages with signature validation

## 🧪 Testing Strategy

### Unit Tests (Jest)
- **API Validation**: Request/response schema validation with Zod
- **Security Functions**: Sentinel detection and secret scrubbing
- **Vector Search**: Memory retrieval and context filtering
- **Twilio Integration**: Webhook signature validation

### Integration Tests (Playwright)
- **Complete User Flows**: Registration → journaling → mentor interaction → progress tracking
- **AI Safety**: End-to-end security validation for AI interactions
- **Multi-Platform**: Web and mobile authentication flows

### API Tests (Supertest)
- **Journal Pipeline**: Entry creation → embedding → search retrieval
- **Webhook Security**: Signature verification and error handling
- **Real-time Features**: Database updates and live synchronization

## 🚀 Deployment

### Web App (Vercel)
```bash
# Deploy to production
vercel --prod
```

### Mobile App (Expo EAS)
```bash
# Build for app stores
cd apps/mobile
eas build --platform all
```

### Environment Variables
Ensure all production environment variables are configured in your deployment platform:
- Supabase URLs and keys
- OpenAI API key
- Twilio credentials (for SMS features)
- App base URL for webhooks

## 🤝 Contributing

1. **Fork & Clone**: Fork the repository and clone your copy
2. **Setup Environment**: Follow the local development setup guide
3. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
4. **Develop & Test**: Make changes and ensure all tests pass
5. **Lint & Type Check**: Run `pnpm lint` and `pnpm typecheck`
6. **Commit Changes**: Use conventional commit format
7. **Push & PR**: Push to your fork and open a Pull Request

### Development Guidelines
- **Security First**: Validate all inputs, never log secrets
- **Type Safety**: Use TypeScript strict mode across all packages
- **Testing**: Write tests for new features and maintain coverage
- **Documentation**: Update README for architectural changes

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support & Feedback

- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join conversations in GitHub Discussions
- **Documentation**: Comprehensive architecture details in `architecture.md`

---

**Built with ❤️ for software engineers who want to accelerate their career growth through AI-powered insights and structured reflection.**