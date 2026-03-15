# Command Reference — Every Command in Execution Order

> Raw commands from actual E2E test sessions. Copy-paste ready.

---

## Phase 1: Environment Setup

```bash
# Set tool paths (run at start of every session)
export PATH="$PATH:$HOME/.maestro/bin"
export JAVA_HOME=/opt/homebrew/opt/openjdk@17

# Verify prerequisites
maestro --version                          # Expected: 2.3.0+
ls apps/mobile/maestro/*.yaml              # Flows exist?
ls apps/mobile/maestro/.env                # Credentials exist?
```

## Phase 2: Simulator Boot

```bash
# Find best available simulator
UDID=$(xcrun simctl list devices available | grep "iPhone 17 Pro" | head -1 | grep -oE '[A-F0-9-]{36}')
if [ -z "$UDID" ]; then
  UDID=$(xcrun simctl list devices available | grep "iPhone" | head -1 | grep -oE '[A-F0-9-]{36}')
fi
echo "UDID: $UDID"

# Boot (safe to re-run — already-booted returns error but no harm)
xcrun simctl boot $UDID

# Verify it's booted
xcrun simctl list devices | grep Booted
```

## Phase 3: Dev Server Start

```bash
# Kill any previous Expo instance
lsof -ti:8081 | xargs kill 2>/dev/null
sleep 1

# Start Expo (MUST use subshell to unset CI, MUST use offline mode)
cd apps/mobile
rm -f /tmp/swe-mentor-metro.log
(unset CI; EXPO_OFFLINE=1 npx expo start --port 8081 --offline > /tmp/swe-mentor-metro.log 2>&1) &
EXPO_PID=$!
echo "Expo PID: $EXPO_PID"

# Poll for readiness (up to 60 seconds)
for i in $(seq 1 30); do
  if grep -q "Waiting on\|Bundling complete\|Metro waiting" /tmp/swe-mentor-metro.log 2>/dev/null; then
    echo "Expo ready!"
    break
  fi
  sleep 2
  echo "Waiting... ($i)"
done
```

## Phase 4: App Load

```bash
# Open app in Expo Go via deep link
xcrun simctl openurl booted "exp://localhost:8081"

# Wait for bundle (20s for first load, 10s for subsequent)
sleep 20
```

## Phase 5: Dev Menu Dismissal

```bash
# Write temp flow to dismiss native dev menu
cat > /tmp/dismiss-devmenu.yaml << 'FLOW'
appId: host.exp.Exponent
---
- tapOn:
    point: "50%,93%"
- runFlow:
    when:
      visible: "Reload"
    commands:
      - tapOn:
          point: "50%,20%"
FLOW

maestro test /tmp/dismiss-devmenu.yaml
```

## Phase 6: Verify App State

```bash
# Take screenshot
xcrun simctl io booted screenshot /tmp/sim-ready.png

# Read screenshot with LLM to confirm correct screen
# (In CLI: use Read tool on the PNG file)
```

## Phase 7: Context Analysis

```bash
# What changed on this branch?
git diff main...HEAD --stat
git diff main...HEAD -- apps/mobile/src/screens/

# What flows exist?
ls apps/mobile/maestro/*.yaml

# What screens exist?
find apps/mobile/src/screens -name "*.tsx" | sort

# What Detox tests exist for reference?
ls apps/mobile/e2e/*.test.ts 2>/dev/null
```

## Phase 8: Run Flows

```bash
# Load credentials
source apps/mobile/maestro/.env

# Run single flow
maestro test \
  -e TEST_EMAIL=$TEST_EMAIL \
  -e TEST_PASSWORD=$TEST_PASSWORD \
  apps/mobile/maestro/01-login.yaml

# Run all flows sequentially
for flow in apps/mobile/maestro/[0-9]*.yaml; do
  echo "=== $(basename $flow) ==="
  maestro test \
    -e TEST_EMAIL=$TEST_EMAIL \
    -e TEST_PASSWORD=$TEST_PASSWORD \
    "$flow" 2>&1
  echo "---"
done

# Run ad-hoc inline flow
cat > /tmp/custom-flow.yaml << 'FLOW'
appId: host.exp.Exponent
---
- tapOn:
    id: "some-element"
- takeScreenshot: custom-screenshot
FLOW
maestro test /tmp/custom-flow.yaml
```

## Phase 9: Post-Flow Analysis

```bash
# Read flow screenshots (saved to working directory)
# Use LLM Read tool on: login-success.png, journey-01-home.png, etc.

# Check Maestro failure screenshots
ls -t ~/.maestro/tests/$(date +%Y-%m-%d)_*/screenshot-*.png | head -5

# Check metro logs for errors
grep -i "error\|warn\|reject\|fatal" /tmp/swe-mentor-metro.log \
  | grep -v "node_modules\|deprecated\|DEP0\|ExperimentalWarning"

# Verify DB state (via Supabase MCP or psql)
# SELECT * FROM check_ins WHERE user_id = '<id>' ORDER BY created_at DESC LIMIT 5;
# SELECT * FROM profiles WHERE id = '<id>';
```

## Phase 10: Recovery Commands

```bash
# Force logout (when user is stuck logged in)
cat > /tmp/force-logout.yaml << 'FLOW'
appId: host.exp.Exponent
---
- tapOn:
    id: "profile-tab"
- extendedWaitUntil:
    visible:
      id: "profile-screen"
    timeout: 5000
- tapOn:
    id: "sign-out-button"
- extendedWaitUntil:
    visible:
      id: "welcome-screen"
    timeout: 10000
FLOW
maestro test /tmp/force-logout.yaml

# Dismiss error overlay
cat > /tmp/dismiss-error.yaml << 'FLOW'
appId: host.exp.Exponent
---
- runFlow:
    when:
      visible: "Dismiss"
    commands:
      - tapOn: "Dismiss"
FLOW
maestro test /tmp/dismiss-error.yaml

# Dismiss keyboard (when hideKeyboard fails)
cat > /tmp/dismiss-kb.yaml << 'FLOW'
appId: host.exp.Exponent
---
- tapOn:
    point: "50%,15%"
FLOW
maestro test /tmp/dismiss-kb.yaml

# Take debug screenshot at any point
xcrun simctl io booted screenshot /tmp/debug-$(date +%H%M%S).png
```

## Phase 11: Cleanup

```bash
# Kill Expo
kill $EXPO_PID 2>/dev/null
# or: lsof -ti:8081 | xargs kill 2>/dev/null

# Shutdown simulator
xcrun simctl shutdown $UDID || true

# Clean temp files
rm -f /tmp/swe-mentor-metro.log \
      /tmp/dismiss-devmenu.yaml \
      /tmp/sim-ready.png \
      /tmp/force-logout.yaml \
      /tmp/dismiss-error.yaml \
      /tmp/dismiss-kb.yaml \
      /tmp/custom-flow.yaml \
      /tmp/debug-*.png
```

---

## Supabase Test User Setup Commands

```bash
# Get service role key from local Supabase
SERVICE_KEY=$(npx supabase status --output json 2>/dev/null | jq -r '.SERVICE_ROLE_KEY')
SUPABASE_URL="http://127.0.0.1:54321"

# Create test user via admin API (NOT via SQL insert)
curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "apikey: ${SERVICE_KEY}" \
  -d '{
    "email": "e2e-tester@test.com",
    "password": "TestPass123!",
    "email_confirm": true,
    "user_metadata": { "name": "E2E Tester" }
  }'

# Get user ID
USER_ID=$(curl -s "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "apikey: ${SERVICE_KEY}" \
  | jq -r '.users[] | select(.email=="e2e-tester@test.com") | .id')

echo "Test user ID: $USER_ID"

# Set up profile (required for app to skip onboarding)
# Use Supabase MCP execute_sql or:
curl -s -X POST "${SUPABASE_URL}/rest/v1/profiles" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d "{
    \"id\": \"${USER_ID}\",
    \"email\": \"e2e-tester@test.com\",
    \"name\": \"E2E Tester\",
    \"role\": \"software_engineer_1\",
    \"target_role\": \"senior_engineer\",
    \"onboarding_completed\": true,
    \"company_name\": \"Test Corp\",
    \"company_size\": \"50-200\"
  }"
```

### Profile Table Constraints (Must Match)

```
role CHECK:         'intern', 'software_engineer_1', 'software_engineer_2',
                    'senior_engineer', 'staff_engineer', 'principal_engineer'
target_role CHECK:  same as role
company_size CHECK: '<50', '50-200', '200-1000', '1000-5000', '5000+'
```
