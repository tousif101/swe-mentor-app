# SWE Mentor App - Development Roadmap

**Last Updated:** 2025-12-14

## Overview

This document tracks completed features, current work, and planned features for the SWE Mentor mobile app.

---

## Completed Features

### Phase 1: Foundation (Complete)
- [x] Monorepo setup (npm workspaces)
- [x] Expo 54 + NativeWind 4 mobile app
- [x] Next.js 16 + Tailwind v4 web app
- [x] Shared TypeScript package
- [x] Supabase integration

### Phase 2: Authentication (Complete)
- [x] Web login/signup pages
- [x] Mobile auth screens (Welcome, Login, Signup)
- [x] Magic link authentication
- [x] OAuth ready (Google, GitHub)
- [x] Session management with token refresh

### Phase 3: Onboarding (Complete)
- [x] Profile setup (name, role, target role)
- [x] Focus areas calculation based on role gap
- [x] **Reminder setup screen** (morning/evening times)
- [x] Progress bar component (3 steps)
- [x] `user_notification_settings` table + RLS

### Phase 4: Main App Navigation (Complete)
- [x] Bottom tab navigator (Home, Journal, Insights, Profile)
- [x] Placeholder screens for all tabs
- [x] Profile tab with settings menu + sign out
- [x] Dark theme with purple accents

---

## Current Focus: Daily Check-in Flow

### Database Tables Needed
- [x] `check_ins` table (morning/evening entries)
- [x] `user_streaks` table (gamification)

### Morning Check-in Screen
- [x] Greeting based on time of day
- [x] Focus area selector (chips from user's focus_areas)
- [x] "What would make today a win?" text input
- [x] Save to `check_ins` table with type='morning'
- [x] Update streak on completion

### Evening Check-in Screen
- [x] Goal completion selector (Yes / Partially / No)
- [x] Quick win text input
- [x] Conditional: blocker input (if not "yes")
- [x] Energy/mood rating (1-5)
- [x] Tomorrow carry-over input
- [ ] Streak celebration animation

### Home Screen Updates
- [x] Show today's check-in status
- [x] Morning/Evening quick action buttons → navigate to check-in
- [x] Current streak display
- [ ] "Continue where you left off" if incomplete

---

## Upcoming Features (Priority Order)

### 1. Journal Entries List
- [ ] List view of past check-ins
- [ ] Filter by date range, type (morning/evening)
- [ ] Search entries by keyword
- [ ] Expandable entry cards

### 2. Streaks & Progress
- [ ] Current streak counter on Home
- [ ] Longest streak tracking
- [ ] Weekly completion rate
- [ ] Streak milestone celebrations (7, 30, 100 days)

### 3. Profile Settings
- [ ] Edit profile (name, role, target role)
- [ ] Change reminder times
- [ ] Notification preferences
- [ ] Account settings (email, password)

### 4. Push Notifications
- [ ] Expo push notification setup
- [ ] Morning reminder at user's chosen time
- [ ] Evening reminder at user's chosen time
- [ ] Streak reminders (don't break your streak!)

### 5. AI Mentor Chat
- [ ] Chat interface
- [ ] Socratic questioning prompts
- [ ] Context from recent check-ins
- [ ] Career advice based on focus areas

### 6. Voice Input
- [ ] Speech-to-text for check-in fields
- [ ] Microphone button on input fields
- [ ] Transcription preview before save

### 7. Advanced Insights
- [ ] Weekly summary generation
- [ ] Monthly progress report
- [ ] Focus area improvement tracking
- [ ] AI-generated recommendations

---

## Deferred / Future

- SMS journaling (Twilio integration)
- Quarterly/yearly goal setting
- Team features (manager view)
- Web app check-ins
- Export data (PDF reports)

---

## Technical Debt

- [ ] Fix env var loading in Expo (currently hardcoded)
- [ ] Re-enable babel caching after fix
- [ ] Add comprehensive test coverage
- [ ] Set up CI/CD pipeline

---

## Design References

- Style Guide: `docs/style-guide.md`
- Daily Check-in Design: `docs/plans/2025-12-14-daily-checkin-reminders-design.md`
- Architecture: `docs/plans/2025-12-06-mvp-architecture.md`

---

## Session Log

### 2025-12-14
- Fixed Supabase env var issue (hardcoded workaround)
- Added Reminder Setup screen to onboarding
- Added bottom tab navigation with 4 tabs
- Created `user_notification_settings` table
- PR #7 merged

### Next Session
- Create `check_ins` and `user_streaks` tables
- Build Morning Check-in screen
- Build Evening Check-in screen
- Wire up Home screen quick actions
