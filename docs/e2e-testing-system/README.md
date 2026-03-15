# Autonomous E2E Testing System — Reference Architecture

> Documenting every step, command, prompt, and decision pattern used in our AI-driven iOS E2E testing workflow. Goal: generalize this into a standalone application that can test any mobile app.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Infrastructure Setup](#infrastructure-setup)
3. [App Lifecycle Management](#app-lifecycle-management)
4. [Flow Authoring Patterns](#flow-authoring-patterns)
5. [Test Execution Engine](#test-execution-engine)
6. [Visual Analysis (Screenshot Inspection)](#visual-analysis)
7. [Database Verification](#database-verification)
8. [Log Analysis](#log-analysis)
9. [Failure Handling & Recovery](#failure-handling--recovery)
10. [Context-Aware Test Selection](#context-aware-test-selection)
11. [Reporting](#reporting)
12. [Prompts & Decision Logic](#prompts--decision-logic)

---

## System Overview

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  AI Orchestrator │────▶│  Maestro CLI  │────▶│  iOS Simulator  │
│  (Claude/LLM)   │     │  (YAML flows) │     │  (Expo Go app)  │
└────────┬────────┘     └──────────────┘     └─────────────────┘
         │                                           │
         │  ┌──────────────┐                         │
         ├─▶│  Screenshot   │◀── xcrun simctl io ────┘
         │  │  Analysis     │
         │  └──────────────┘
         │  ┌──────────────┐
         ├─▶│  DB Verify    │◀── Supabase MCP / SQL
         │  └──────────────┘
         │  ┌──────────────┐
         └─▶│  Metro Logs   │◀── /tmp/swe-mentor-metro.log
            └──────────────┘
```

### Core Components

| Component | Tool | Purpose |
|-----------|------|---------|
| Simulator control | `xcrun simctl` | Boot, shutdown, screenshot, open URLs |
| UI automation | Maestro CLI 2.3.0 | Tap, type, assert, screenshot via YAML |
| Dev server | Expo CLI (`npx expo start`) | Serve JS bundle to Expo Go |
| Visual inspection | LLM multimodal (Read PNG) | Analyze screenshots for UI issues |
| DB verification | Supabase MCP / SQL | Verify data was persisted correctly |
| Log analysis | Metro bundler logs | Catch runtime errors, warnings |

---

## Infrastructure Setup

### Prerequisites Check

```bash
# 1. Maestro installed and on PATH?
export PATH="$PATH:$HOME/.maestro/bin"
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
maestro --version
# Expected: 2.3.0 or higher

# 2. Test flows exist?
ls apps/mobile/maestro/*.yaml
# Expected: numbered YAML files (01-login.yaml, 02-onboarding.yaml, etc.)

# 3. Test credentials exist?
ls apps/mobile/maestro/.env
# Expected: file with TEST_EMAIL and TEST_PASSWORD
```

### Installation (if missing)

```bash
# Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# Java 17 (required by Maestro)
brew install openjdk@17
```

### Environment Variables

```bash
# apps/mobile/maestro/.env
TEST_EMAIL=e2e-tester@test.com
TEST_PASSWORD=TestPass123!
```

**Key constraint:** Never hardcode credentials in commands or YAML flows. Always load from `.env` and pass via `-e` flags.

---

## App Lifecycle Management

### Step 1: Boot Simulator

```bash
# Find simulator UDID (prefer specific device, fall back to any iPhone)
UDID=$(xcrun simctl list devices available | grep "iPhone 17 Pro" | head -1 | grep -oE '[A-F0-9-]{36}')
if [ -z "$UDID" ]; then
  UDID=$(xcrun simctl list devices available | grep "iPhone" | head -1 | grep -oE '[A-F0-9-]{36}')
fi

# Boot (idempotent — already-booted is fine)
xcrun simctl boot $UDID
```

**Decision:** Prefer a specific device model for deterministic screen sizes. Fall back gracefully.

### Step 2: Start Dev Server

```bash
# Kill any existing Expo process on port 8081
lsof -ti:8081 | xargs kill 2>/dev/null
sleep 1

# Start Expo in offline mode (critical for non-interactive environments)
cd apps/mobile
rm -f /tmp/swe-mentor-metro.log
(unset CI; EXPO_OFFLINE=1 npx expo start --port 8081 --offline > /tmp/swe-mentor-metro.log 2>&1) &
EXPO_PID=$!
echo "Expo PID: $EXPO_PID"
```

**Critical flags:**
- `unset CI` — Expo's `getenv` library crashes on empty string CI values
- `EXPO_OFFLINE=1` — Skips dependency validation and network checks
- `--offline` — Prevents interactive prompts in non-TTY environments
- `--port 8081` — Explicit port for deterministic URLs

### Step 3: Poll for Readiness

```bash
for i in $(seq 1 30); do
  if grep -q "Waiting on\|Bundling complete\|Metro waiting" /tmp/swe-mentor-metro.log 2>/dev/null; then
    echo "Expo ready!"
    break
  fi
  sleep 2
  echo "Waiting... ($i)"
done
```

**Pattern:** Poll log file every 2 seconds for up to 60 seconds. Look for known "ready" strings.

### Step 4: Load App in Simulator

```bash
xcrun simctl openurl booted "exp://localhost:8081"
sleep 20  # Wait for JS bundle to download and render
```

**Why `openurl` instead of `launchApp`?** Maestro's `launchApp` with `clearState: true` force-restarts Expo Go, wiping its connection to the dev server. Using `xcrun simctl openurl` opens the deep link directly.

**Why 20 second wait?** First load requires bundling the entire JS bundle. Subsequent loads are faster due to caching.

### Step 5: Dismiss Dev Menu

The Expo Go developer menu is a **native iOS bottom sheet** that Maestro's accessibility tree cannot see. Text like "Continue" or "Go Home" is invisible to element selectors.

```yaml
# dismiss-devmenu.yaml
appId: host.exp.Exponent
---
# Tap "Continue" button at bottom of dev menu sheet
- tapOn:
    point: "50%,93%"
# If "Reload" button appeared (different menu variant), tap outside it
- runFlow:
    when:
      visible: "Reload"
    commands:
      - tapOn:
          point: "50%,20%"
```

**Key insight:** Coordinate taps (`point: "50%,93%"`) work on native elements invisible to Maestro's text/ID selectors. The percentages are relative to screen dimensions, making them device-independent.

### Step 6: Verify App State

```bash
xcrun simctl io booted screenshot /tmp/sim-ready.png
```

Then visually inspect the PNG with the LLM to confirm the app is on the expected screen.

### Cleanup

```bash
# Kill Expo dev server
kill $EXPO_PID 2>/dev/null
# or: lsof -ti:8081 | xargs kill 2>/dev/null

# Shutdown simulator
xcrun simctl shutdown $UDID || true

# Clean temp files
rm -f /tmp/swe-mentor-metro.log /tmp/dismiss-devmenu.yaml /tmp/sim-ready.png
```

---

## Flow Authoring Patterns

### Standard Flow Preamble

Every flow that starts from scratch needs this preamble to handle 3 edge cases:

```yaml
appId: host.exp.Exponent
---
# 1. Dismiss Expo Go dev menu if it appears
- runFlow:
    when:
      visible: "SDK version"
    commands:
      - tapOn:
          point: "50%,93%"
      - runFlow:
          when:
            visible: "Reload"
          commands:
            - tapOn:
                point: "50%,20%"

# 2. Re-open app from Expo Go home screen if needed
- runFlow:
    when:
      visible: "Recently opened"
    commands:
      - tapOn: "SWE Mentor"
      - waitForAnimationToEnd

# 3. Dismiss dev menu again after re-open
- runFlow:
    when:
      visible: "SDK version"
    commands:
      - tapOn:
          point: "50%,93%"
      - runFlow:
          when:
            visible: "Reload"
          commands:
            - tapOn:
                point: "50%,20%"
```

### Login Sequence

```yaml
# Wait for welcome screen (up to 30s for cold start)
- extendedWaitUntil:
    visible:
      id: "welcome-screen"
    timeout: 30000

# Navigate to login
- tapOn:
    id: "sign-in-link"
- extendedWaitUntil:
    visible: "Welcome back"
    timeout: 5000

# Enter credentials
- tapOn:
    id: "email-input"
- inputText: ${TEST_EMAIL}
- tapOn:
    id: "password-input"
- inputText: ${TEST_PASSWORD}
- hideKeyboard
- tapOn:
    id: "sign-in-button"

# Handle iOS "Save Password?" system dialog
- runFlow:
    when:
      visible: "Not Now"
    commands:
      - tapOn: "Not Now"

# Verify login success
- extendedWaitUntil:
    visible:
      id: "home-screen"
    timeout: 15000
- takeScreenshot: login-success
```

### Maestro Syntax Rules (Learned the Hard Way)

| Pattern | Correct | Wrong |
|---------|---------|-------|
| Wait with timeout | `extendedWaitUntil: { visible: { id: "x" }, timeout: 5000 }` | `assertVisible: { id: "x", timeout: 5000 }` |
| Conditional action | `runFlow: { when: { visible: "text" }, commands: [...] }` | No built-in if/else |
| Credential injection | `inputText: ${VAR_NAME}` with `-e VAR=val` flag | Hardcoded in YAML |
| Native elements | `tapOn: { point: "50%,93%" }` | `tapOn: "Continue"` (invisible) |
| App launch | Pre-load with `xcrun simctl openurl` | `launchApp` (breaks Expo Go) |

### Flow Naming Convention

```
01-login.yaml          # Authentication
02-onboarding.yaml     # First-time user flow
03-morning-check-in.yaml
04-evening-check-in.yaml
05-home-screen.yaml
06-journal-view-edit.yaml
07-journal-search-filter.yaml
08-profile-settings.yaml
09-navigation-tabs.yaml
10-insights.yaml
11-logout.yaml
12-full-journey.yaml   # Comprehensive smoke test (all screens)
```

Numbered prefix ensures execution order. `12-full-journey.yaml` is the "run everything" smoke test.

---

## Test Execution Engine

### Run Single Flow

```bash
export PATH="$PATH:$HOME/.maestro/bin"
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
source apps/mobile/maestro/.env

maestro test \
  -e TEST_EMAIL=$TEST_EMAIL \
  -e TEST_PASSWORD=$TEST_PASSWORD \
  apps/mobile/maestro/01-login.yaml
```

### Run All Flows

```bash
for flow in apps/mobile/maestro/[0-9]*.yaml; do
  echo "Running: $flow"
  maestro test \
    -e TEST_EMAIL=$TEST_EMAIL \
    -e TEST_PASSWORD=$TEST_PASSWORD \
    "$flow"
done
```

### Run Ad-Hoc Flow (Inline YAML)

For one-off actions like logging out or dismissing dialogs:

```bash
cat > /tmp/adhoc-flow.yaml << 'FLOW'
appId: host.exp.Exponent
---
- tapOn:
    id: "profile-tab"
- tapOn:
    id: "sign-out-button"
- extendedWaitUntil:
    visible:
      id: "welcome-screen"
    timeout: 10000
FLOW
maestro test /tmp/adhoc-flow.yaml
```

**Pattern:** Write temp YAML to `/tmp/`, run it, clean up after. Useful for recovery actions.

### State Management Between Flows

**Problem:** Each flow assumes a starting state (usually welcome screen). If a previous flow leaves the app logged in, the next flow fails.

**Current approach:** Each flow includes its own login preamble. The `12-full-journey.yaml` flow chains all actions in sequence with a final logout.

**Better approach (for generalized app):** Track app state between flows. Before running a flow, check current screen and navigate to the required starting state.

---

## Visual Analysis

### How We Analyze Screenshots

After each flow, screenshots are read by the LLM as images. The analysis checks for:

#### Layout Issues
- **Cut off elements** — text or buttons partially outside screen bounds
- **Overlapping text** — labels colliding with other elements
- **Keyboard occlusion** — input fields or buttons hidden behind keyboard
- **Safe area violations** — content behind notch or home indicator

#### Color/Theme Issues
- **Wrong background** — light mode when dark mode expected (or vice versa)
- **Missing gradients** — flat color where gradient should be
- **Low contrast** — text unreadable against background
- **Inconsistent theme** — mixed light/dark elements

#### Missing Elements
- **Buttons not rendered** — expected CTA missing
- **Cards/sections absent** — data containers not showing
- **Icons missing** — placeholder boxes instead of icons
- **Loading states stuck** — spinner that never resolves

#### Content Correctness
- **Placeholder text** — "Lorem ipsum" or "TODO" visible
- **Wrong data** — incorrect user name, role, or stats
- **Empty states** — "No data" when data should exist
- **Error messages** — red error UI that shouldn't be there

#### Alignment/Spacing
- **Off-center elements** — visually misaligned
- **Inconsistent padding** — uneven spacing between cards
- **Scroll issues** — content cut off at bottom with no scroll indicator

### Screenshot Commands

```bash
# Take screenshot via simulator
xcrun simctl io booted screenshot /tmp/screen.png

# Maestro takes screenshots within flows
- takeScreenshot: descriptive-name
# Saved to current working directory as descriptive-name.png

# Find Maestro debug screenshots (on failure)
ls -t ~/.maestro/tests/YYYY-MM-DD_HHMMSS/*.png
```

### Visual Inspection Prompt Pattern

When reading a screenshot, the LLM evaluates:

```
1. Is this the expected screen? (check title, layout)
2. Are all expected elements present? (buttons, cards, text)
3. Any visual defects? (overlaps, cut-offs, wrong colors)
4. Is the data correct? (user name, role, stats match test user)
5. Any error states visible? (red banners, error overlays, console errors)
```

---

## Database Verification

### Setup

Test user is created via Supabase admin API (not manual SQL inserts):

```bash
# Create test user via admin API
curl -X POST "http://127.0.0.1:54321/auth/v1/admin/users" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "e2e-tester@test.com",
    "password": "TestPass123!",
    "email_confirm": true,
    "user_metadata": { "name": "E2E Tester" }
  }'
```

**Why admin API, not SQL INSERT?** Direct `INSERT INTO auth.users` creates malformed records that cause 500 errors on authentication. The admin API handles password hashing, metadata, and internal Supabase auth tables correctly.

### Verification Queries

```sql
-- Get test user ID
SELECT id FROM auth.users WHERE email = 'e2e-tester@test.com';

-- Verify profile data
SELECT id, name, role, target_role, company_name, company_size, onboarding_completed
FROM profiles WHERE id = '<test-user-id>';

-- Verify check-ins were created
SELECT id, check_in_type, energy_level, focus_area, daily_goal, created_at
FROM check_ins
WHERE user_id = '<test-user-id>'
ORDER BY created_at DESC LIMIT 5;

-- Verify streak was updated
SELECT current_streak, longest_streak, last_check_in_date
FROM user_streaks WHERE user_id = '<test-user-id>';

-- Verify conversations (for chat flows)
SELECT id, created_at FROM conversations
WHERE user_id = '<test-user-id>'
ORDER BY created_at DESC LIMIT 3;
```

### DB State Expectations Per Flow

| Flow | Expected DB Changes |
|------|-------------------|
| 01-login | No changes (reads only) |
| 02-onboarding | `profiles` row created/updated with role, target_role |
| 03-morning-check-in | New `check_ins` row with `check_in_type='morning'` |
| 04-evening-check-in | New `check_ins` row with `check_in_type='evening'` |
| 08-profile-settings | `profiles` updated with new settings |
| 11-logout | No changes (session cleared client-side) |

---

## Log Analysis

### Metro Bundler Logs

```bash
# Check for errors (excluding known noise)
grep -i "error\|warn\|reject\|fatal" /tmp/swe-mentor-metro.log \
  | grep -v "node_modules\|deprecated\|DEP0\|ExperimentalWarning"
```

### What We Look For

| Pattern | Severity | Action |
|---------|----------|--------|
| `Unhandled promise rejection` | High | Find the async call missing .catch() |
| `RenderError` / `Invariant Violation` | High | Component crash — check props/state |
| `Network request failed` | Medium | Backend unreachable or wrong URL |
| `useFocusEffect async` | Low (known) | Pre-existing — async in useEffect |
| `expo-notifications` warnings | Ignore | Expected on simulator |
| `Deprecation warning` | Low | Note for future cleanup |

### Maestro Debug Artifacts

On failure, Maestro saves debug output to:
```
~/.maestro/tests/YYYY-MM-DD_HHMMSS/
├── screenshot-❌-timestamp-(flow-name).png   # State at failure
├── maestro.log                                # Full Maestro log
└── hierarchy.json                             # UI accessibility tree
```

The failure screenshot is the most useful — read it to see what the app was showing when the assertion failed.

---

## Failure Handling & Recovery

### Decision Tree

```
Flow failed
  ├── Assertion failed (element not visible)
  │   ├── Screenshot shows wrong screen → App navigated unexpectedly
  │   │   └── Check: Is user logged in? Is there a modal/overlay?
  │   ├── Screenshot shows error overlay → Runtime error
  │   │   └── Action: Read error, check metro logs, fix code
  │   ├── Screenshot shows loading state → Timeout too short
  │   │   └── Action: Increase timeout or add waitForAnimationToEnd
  │   └── Screenshot shows correct screen but wrong ID → testID missing
  │       └── Action: Add testID prop to component
  ├── Tap failed (element not found)
  │   ├── Keyboard is covering element → Need hideKeyboard first
  │   ├── Element is off-screen → Need scroll first
  │   └── Text changed → Update selector
  └── Input failed
      └── Keyboard didn't appear → Tap input field first
```

### Common Recovery Actions

```yaml
# Dismiss error overlay
- runFlow:
    when:
      visible: "Dismiss"
    commands:
      - tapOn: "Dismiss"

# Dismiss keyboard by tapping above it
- tapOn:
    point: "50%,15%"

# Handle "Save Password?" iOS dialog
- runFlow:
    when:
      visible: "Not Now"
    commands:
      - tapOn: "Not Now"

# Navigate back if on wrong screen
- tapOn: "Back"

# Force logout to reset state
- tapOn:
    id: "profile-tab"
- tapOn:
    id: "sign-out-button"
```

### Retry Strategy

1. Flow fails → Read screenshot + metro logs
2. Categorize: UI bug / logic bug / data bug / infra bug
3. If fixable: fix code, hot-reload happens automatically
4. Re-run ONLY the failed flow
5. If fails again after 2 attempts: log as unresolved, continue

---

## Context-Aware Test Selection

### How We Decide What to Test

Before running flows, the AI reads:

```bash
# 1. What changed on this branch?
git diff main...HEAD --stat

# 2. Which screens exist?
find apps/mobile/src/screens -name "*.tsx"

# 3. Which flows exist?
ls apps/mobile/maestro/*.yaml

# 4. Which Detox tests exist (coverage reference)?
ls apps/mobile/e2e/*.test.ts
```

### Prioritization Logic

```
IF branch changes mobile screens:
  1. Run flows for changed screens FIRST
  2. Run full journey (12-full-journey.yaml) for regression
  3. Generate new flows for screens with no coverage

IF branch changes backend only:
  1. Run login flow (auth still works?)
  2. Run navigation regression (all screens render?)
  3. Run profile + logout (full lifecycle)
  4. Skip screen-specific flows (no UI changes)

IF branch changes both:
  1. Run changed-screen flows
  2. Run full journey
  3. Verify DB state for data-changing flows
```

### Gap Detection

```
For each screen in src/screens/:
  Check if a matching maestro/*.yaml flow exists
  If not → Flag as untested, optionally generate flow
```

---

## Reporting

### Verification Report Template

```markdown
# iOS E2E Verification — <Feature Name>

**Date:** YYYY-MM-DD
**Branch:** <branch-name>
**Simulator:** <device-name> (iOS <version>)

## Flows Run

| # | Flow | Status | Screenshot |
|---|------|--------|------------|
| 1 | Login | Pass | login-success.png |
| 2 | Home | Pass | regression-01-home.png |

## Issues Found & Fixed

- **[UI]** Keyboard occludes save button → added hideKeyboard
- **[Data]** Check-in not persisted → fixed Supabase query

## Pre-existing Issues (Not Regressions)

- useFocusEffect async error in MainTabNavigator
- Push notification warnings on simulator

## DB Verification

- profiles table: Verified (role, company fields correct)
- check_ins table: Verified (morning/evening entries created)

## Metro Log Errors

- None (excluding known warnings)
```

---

## Prompts & Decision Logic

### The Master Prompt (Skill File)

The entire E2E testing workflow is encoded as a "skill" — a structured prompt that tells the AI exactly what to do. Key sections:

1. **Prerequisites Check** — Verify tools are installed
2. **Boot Simulator** — Find device, boot it
3. **Start Dev Server** — Expo with offline flags
4. **Dismiss Dev Menu** — Coordinate taps for native sheet
5. **Read Context** — git diff, file listing, coverage gaps
6. **Run Flows** — Execute YAML flows with credentials
7. **After Each Flow** — Screenshot analysis, metro logs, DB verify
8. **Handle Failures** — Decision tree, categorize, fix, retry
9. **Generate Report** — Structured markdown summary
10. **Cleanup** — Kill processes, shutdown sim, remove temp files

### Key Decision Points for the AI

| Decision | Input | Logic |
|----------|-------|-------|
| Which device? | `xcrun simctl list` | Prefer specific model, fall back to any |
| Is Expo ready? | `/tmp/metro.log` | Poll for "Waiting on" or "Bundling complete" |
| Is app loaded? | Screenshot | Read PNG, check for expected screen |
| Which flows to run? | `git diff` | Changed screens first, then regression |
| Is this a regression? | Screenshot + branch changes | Bug exists on main? → pre-existing |
| Should I fix this? | Error category | UI/logic: fix. Infra: log. Pre-existing: skip |
| Is the test passing? | Maestro exit code + screenshot | Exit 0 AND screenshot shows correct state |

### Generalizing This System

To build this for any app, you need:

1. **App config** — How to build/serve, what port, what simulator
2. **Flow library** — YAML flows per screen/feature (or auto-generated)
3. **Test user setup** — Credentials, seed data, DB state
4. **Screen registry** — Map of screen names to testIDs and expected elements
5. **Visual expectations** — What each screen should look like (reference screenshots or descriptions)
6. **DB schema** — What tables to verify, what changes each flow should produce
7. **Known issues list** — Pre-existing bugs to exclude from failure reports
8. **Recovery playbook** — Common failure patterns and how to recover
