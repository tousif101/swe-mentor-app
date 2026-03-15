# Lessons Learned — Hard-Won Knowledge from E2E Testing

> Every lesson here was discovered through failure. Each entry documents what went wrong, why, and the fix. Essential reading before building a generalized E2E testing system.

---

## Expo Go + Maestro Compatibility

### 1. `launchApp` Kills the Dev Server Connection

**What happened:** Using `launchApp: { clearState: true }` in Maestro force-restarts Expo Go, wiping its cached connection to the Metro bundler. The app lands on the Expo Go home screen ("Recently opened") instead of the app.

**Fix:** Never use `launchApp` in flows. Pre-load the app using `xcrun simctl openurl booted "exp://localhost:8081"` before running Maestro flows.

### 2. `openLink` Doesn't Work for Expo Deep Links

**What happened:** `openLink: "exp://localhost:8081"` in Maestro reports COMPLETED but the app stays on the Expo Go home screen. The command doesn't actually navigate.

**Fix:** Use `xcrun simctl openurl` from the shell before Maestro starts. Within flows, handle the "Recently opened" screen by tapping the app name.

### 3. Dev Menu is Invisible to Maestro

**What happened:** The Expo Go developer menu appears as a native iOS bottom sheet. Maestro's accessibility tree cannot see any of its text ("Continue", "Go Home", etc.). `tapOn: "Continue"` fails with "element not found".

**Fix:** Use coordinate taps. The "Continue" button is at approximately `point: "50%,93%"`. After dismissing, if a "Reload" text appears (different menu variant), tap outside at `point: "50%,20%"`.

### 4. `CI=""` Crashes Expo

**What happened:** Setting `CI=""` (empty string) causes Expo's `getenv` library to throw `GetEnv.NoBoolean` — it can't parse an empty string as a boolean.

**Fix:** Use `(unset CI; npx expo start ...)` in a subshell. `unset` removes the variable entirely, which getenv handles correctly.

### 5. Expo Interactive Prompts Block Non-TTY

**What happened:** Without `--offline`, Expo detects a non-TTY environment, enters CI mode, then fails when it needs user input for dependency resolution.

**Fix:** Always use `EXPO_OFFLINE=1 npx expo start --offline`. This skips network checks and dependency validation entirely.

---

## Maestro Syntax Gotchas

### 6. `assertVisible` Does NOT Support `timeout`

**What happened:** Writing `assertVisible: { id: "screen", timeout: 5000 }` causes Maestro to fail with "unknown property: timeout". We had this error across 47 occurrences in 12 files.

**Fix:** Use `extendedWaitUntil` instead:
```yaml
- extendedWaitUntil:
    visible:
      id: "screen-id"
    timeout: 5000
```

### 7. `hideKeyboard` Fails on Custom Inputs

**What happened:** Maestro's `hideKeyboard` command fails with "Couldn't hide the keyboard" on some screens, particularly after autocomplete inputs or custom text fields.

**Fix:** Tap on a non-interactive area of the screen instead:
```yaml
- tapOn:
    point: "50%,15%"
```

### 8. Autocorrect Mangles Test Input

**What happened:** Typing "Full journey E2E test" resulted in "Full journey E2E testY" — iOS autocorrect changed "test" to "testY".

**Mitigation:** Add `hideKeyboard` immediately after `inputText` to dismiss autocorrect suggestions before they apply. Or tap the input field again to dismiss the suggestion bar.

---

## iOS System Dialogs

### 9. "Save Password?" Dialog Blocks Flow

**What happened:** After first login, iOS shows a system dialog asking to save the password. Maestro can see the "Not Now" text but the flow doesn't handle it, causing subsequent taps to fail.

**Fix:** Add a conditional handler after every login:
```yaml
- runFlow:
    when:
      visible: "Not Now"
    commands:
      - tapOn: "Not Now"
```

### 10. Error Overlay Blocks All Interaction

**What happened:** A React Native console error overlay (red screen) appears and blocks all Maestro interactions with the underlying screen. The `profile-screen` testID is behind the overlay.

**Fix:** Handle it conditionally:
```yaml
- runFlow:
    when:
      visible: "Dismiss"
    commands:
      - tapOn: "Dismiss"
```

---

## Supabase / Database

### 11. Manual SQL Insert Creates Broken Auth Users

**What happened:** Inserting directly into `auth.users` with `crypt('password', gen_salt('bf'))` creates a user record that Supabase Auth doesn't recognize. Login attempts return 500 errors.

**Why:** Supabase Auth has internal tables and metadata that need to be populated alongside the `auth.users` row. A raw INSERT skips this.

**Fix:** Always create test users via the Supabase Admin API:
```bash
curl -X POST "http://127.0.0.1:54321/auth/v1/admin/users" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY" \
  -d '{"email":"...", "password":"...", "email_confirm": true}'
```

### 12. Profile Constraint Violations

**What happened:** Inserting a profile with `company_size: "small"` fails — the column has a CHECK constraint limiting values to `'<50', '50-200', '200-1000', '1000-5000', '5000+'`. Similarly, `role: "engineer"` fails — must be one of the enum values.

**Fix:** Always check table constraints before inserting test data. Query `information_schema.check_constraints` or read the migration files.

### 13. `current_role` vs `role` Column Name

**What happened:** Tried to INSERT with `current_role` column — doesn't exist. The column is just `role`.

**Fix:** Read the actual migration or use `\d profiles` to check column names before writing queries.

---

## State Management

### 14. Flows Assume Welcome Screen but User is Already Logged In

**What happened:** Running `01-login.yaml` fails because the test user was already logged in from a previous session. The flow expects `welcome-screen` but sees `home-screen`.

**Fix options:**
1. Always run logout before login flows
2. Add a pre-check: if already on home-screen, skip to logout first
3. Use the full journey flow (12) which handles the complete lifecycle

### 15. Check-In State Affects Flow Behavior

**What happened:** The morning check-in flow creates a check-in, which changes the home screen's hero card from "morning" to "evening" state. Running the morning check-in flow again fails because the button now says different text.

**Fix:** Be aware of stateful flows. Either:
- Run flows in the correct order (morning before evening)
- Reset DB state between runs
- Use conditional selectors that handle both states

---

## Performance

### 16. First Load Takes 20+ Seconds

**What happened:** Setting `timeout: 5000` for the initial screen assertion fails because the JS bundle hasn't finished loading yet.

**Fix:** Use longer timeouts for initial screen loads:
- First screen after app open: `timeout: 30000`
- Navigation between screens: `timeout: 5000`
- Element appearance after action: `timeout: 3000`

### 17. Screenshots Add Latency

**What happened:** Taking screenshots via `xcrun simctl io booted screenshot` adds ~1 second per screenshot. With 12 flows and multiple screenshots each, this adds up.

**Mitigation:** Only take screenshots at key verification points, not after every action. Use Maestro's `takeScreenshot` (faster) rather than `xcrun simctl` when possible.

---

## Generalizing for Any App

### What Needs to Be Configurable

| Setting | Our Value | Generalized |
|---------|-----------|-------------|
| `appId` | `host.exp.Exponent` | App bundle ID |
| Deep link URL | `exp://localhost:8081` | App's URL scheme |
| Dev server command | `npx expo start --offline` | `npm run dev` / `flutter run` / etc. |
| Readiness signal | "Waiting on" in logs | App-specific ready string |
| Dev menu handling | Coordinate tap at 50%,93% | Per-framework dismissal |
| Credentials loading | `source .env` + `-e` flags | Configurable env/secrets |
| DB verification | Supabase SQL | Any DB client |
| Screenshot analysis | LLM multimodal | Same — model-agnostic |

### What's Already Generic

- Simulator boot/shutdown (`xcrun simctl`)
- Screenshot capture (`xcrun simctl io`)
- YAML flow execution (Maestro)
- Visual analysis (LLM reads images)
- Log analysis (grep for error patterns)
- Retry/recovery logic (decision tree)
- Report generation (markdown template)
