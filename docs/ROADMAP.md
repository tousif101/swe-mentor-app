# SWE Mentor App - Development Roadmap

**Last Updated:** 2025-12-17

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
- [x] Reminder setup screen (morning/evening times)
- [x] Progress bar component (3 steps)
- [x] `user_notification_settings` table + RLS

### Phase 4: Main App Navigation (Complete)
- [x] Bottom tab navigator (Home, Journal, Insights, Profile)
- [x] Placeholder screens for all tabs
- [x] Profile tab with settings menu + sign out
- [x] Dark theme with purple accents

### Phase 5: Daily Check-in Flow (Complete)
- [x] `check_ins` table (morning/evening entries)
- [x] `user_streaks` table (gamification)
- [x] Morning check-in screen (focus area, daily goal)
- [x] Evening check-in screen (goal status, win, blocker, energy, tomorrow)
- [x] Home screen with today's check-in status
- [x] Current streak display
- [x] Streak celebration animation (confetti on milestones)

### Phase 6: Glassmorphism Polish (Complete)
- [x] Design system documentation
- [x] HeroCard - softer gradient, icon float animation, glass shine
- [x] StreakCelebration - fire pulse, sequential dot animations
- [x] ContinueCard component (for incomplete check-ins)
- [x] Confetti component (milestone celebrations: 7, 30, 100 days)
- [x] WeekProgress - glass border, animated fill
- [x] InsightsPreview - purple-tinted glass border
- [x] HomeScreen - ambient glow background
- [x] PR #9 created

---

## Current Focus: Journal Entries List

Design complete - ready for implementation.

### Features
- [x] Design document created (`docs/plans/2025-12-17-journal-entries-list-design.md`)
- [ ] Day-card component (collapsed/expanded)
- [ ] Search bar with debounced input
- [ ] Hashtag filter chips (auto-generated from focus areas)
- [ ] Empty states (no entries, no results)
- [ ] Group check-ins by day (morning + evening)
- [ ] Pull-to-refresh
- [ ] Loading skeletons

### Design Decisions
- Timeline feed of day-cards, newest first
- Each day shows morning + evening grouped together
- Focus area becomes hashtag (e.g., #system-design)
- Search + filter always visible at top
- Tap card to expand, see full details
- Gentle "Evening not logged" for partial days (no guilt)

---

## Upcoming Features (Priority Order)

### 1. Home Screen Polish
- [ ] "Continue where you left off" card for incomplete check-ins
- [ ] Wire up ContinueCard to actual partial check-in detection

### 2. Insights Screen - Real Data
- [ ] Replace placeholder with actual stats
- [ ] Total check-ins count
- [ ] Current/longest streak display
- [ ] Focus area breakdown
- [ ] Energy level trends
- [ ] Weekly/monthly completion rate

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

- Calendar view for journal navigation
- SMS journaling (Twilio integration)
- Quarterly/yearly goal setting
- Team features (manager view)
- Web app check-ins
- Export data (PDF reports)
- AI-extracted hashtags from check-in text
- User-entered custom tags

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
- Glassmorphism Design System: `docs/plans/2025-12-16-glassmorphism-design-system.md`
- Glassmorphism Implementation: `docs/plans/2025-12-16-glassmorphism-polish-implementation.md`
- Journal Entries List: `docs/plans/2025-12-17-journal-entries-list-design.md`
- Architecture: `docs/plans/2025-12-06-mvp-architecture.md`

---

## Session Log

### 2025-12-17
- Completed glassmorphism polish implementation (PR #9)
  - HeroCard animations (float, shine, softer gradient)
  - StreakCelebration animations (fire pulse, sequential dots)
  - New ContinueCard and Confetti components
  - Glass borders on WeekProgress and InsightsPreview
  - Ambient glow on HomeScreen
- Fixed HomeScreen indentation syntax error
- Created feature branch and PR for glassmorphism work
- Designed Journal Entries List feature (brainstorming session)
  - Day-card with collapsed/expanded states
  - Search + hashtag filtering
  - Auto-generated tags from focus_area
  - Empty states design

### 2025-12-14
- Fixed Supabase env var issue (hardcoded workaround)
- Added Reminder Setup screen to onboarding
- Added bottom tab navigation with 4 tabs
- Created `user_notification_settings` table
- PR #7 merged

### Next Session
- Implement Journal Entries List (use design doc)
- Wire up ContinueCard to detect partial check-ins
- Start Insights screen real data
