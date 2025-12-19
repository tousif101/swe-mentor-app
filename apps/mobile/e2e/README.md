# Detox E2E Tests

End-to-end tests for the SWE Mentor mobile app using [Detox](https://wix.github.io/Detox/).

## Why Detox?

Detox provides several advantages over Maestro for this project:

- **Synchronized Testing**: Automatically waits for React Native to be idle (no flaky timeouts)
- **Network Mocking**: Can mock Supabase API calls for testing offline/error scenarios
- **Internal State Access**: Can test React components, navigation state, and app internals
- **TypeScript Integration**: Type-safe tests with full IDE autocomplete
- **Code Reuse**: Share helpers, utilities, and page objects across tests
- **Better Debugging**: Full stack traces, screenshots, and video recordings on failure
- **CI/CD Ready**: Mature tooling for continuous integration pipelines

## Setup

### Prerequisites

1. **Node.js** 18+ installed
2. **Xcode** installed (for iOS testing)
3. **iOS Simulator** installed

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install --save-dev detox jest @types/jest ts-jest --legacy-peer-deps
```

### Build the App

Before running tests, build the app for testing:

```bash
# Build release version (recommended - faster)
npm run e2e:build:ios

# OR build debug version (for debugging)
npm run e2e:build:ios:debug
```

**Note**: The first build will take 5-10 minutes. Subsequent builds are faster.

## Running Tests

### Quick Start

```bash
# Run all E2E tests
npm run e2e:test:ios

# Run specific test file
npx detox test -c ios.sim.release e2e/morning-check-in.test.ts

# Run tests with specific test name pattern
npx detox test -c ios.sim.release --testNamePattern="should complete morning check-in"
```

### Test Suites

Run specific test suites:

```bash
# Authentication & Onboarding
npx detox test -c ios.sim.release e2e/authentication.test.ts

# Check-in Flows
npx detox test -c ios.sim.release e2e/morning-check-in.test.ts
npx detox test -c ios.sim.release e2e/evening-check-in.test.ts

# Journal Features
npx detox test -c ios.sim.release e2e/journal-edit-flow.test.ts
npx detox test -c ios.sim.release e2e/journal-filter-search.test.ts

# Home Page
npx detox test -c ios.sim.release e2e/home-page-cards.test.ts

# Full Journey
npx detox test -c ios.sim.release e2e/full-user-journey.test.ts
```

## Test Files

| File | Description | Converted From |
|------|-------------|----------------|
| `authentication.test.ts` | Full signup/login flow + onboarding | onboarding.yaml, login-onboarding.yaml |
| `morning-check-in.test.ts` | Morning check-in input with focus areas and goals | morning-check-in.yaml |
| `evening-check-in.test.ts` | Evening reflection with all answer types (yes/partially/no) | evening-check-in.yaml |
| `journal-edit-flow.test.ts` | Edit check-ins from journal, verify changes persist | journal-edit-flow.yaml |
| `journal-filter-search.test.ts` | Filter by tags, search entries, test empty states | journal-filter-search.yaml |
| `home-page-cards.test.ts` | Hero card, week progress, stats, continue card | home-page-cards.yaml |
| `full-user-journey.test.ts` | Complete E2E flow: Login → Check-ins → Journal → Search | full-user-journey.yaml |

## Test Helpers

Helpers are located in `e2e/helpers/`:

```typescript
// Authentication
import { loginAsTestUser, signupNewUser, logout } from './helpers'

// Navigation
import { navigateToHome, navigateToJournal, startMorningCheckIn } from './helpers'

// Assertions
import { assertCheckInComplete, assertChangesSaved, assertOnHomeScreen } from './helpers'

// Utilities
import { generateTestEmail, clearText, tapWhenVisible } from './helpers'
```

### Example Usage

```typescript
describe('My Test', () => {
  beforeEach(async () => {
    await device.reloadReactNative()
    await loginAsTestUser('test@example.com', 'password')
  })

  it('should complete check-in', async () => {
    await startMorningCheckIn()

    await element(by.text('System Design')).tap()
    await element(by.id('daily-goal-input')).typeText('My goal')
    await element(by.text('Save Changes')).tap()

    await assertCheckInComplete()
  })
})
```

## Environment Variables

Set test credentials via environment variables:

```bash
export TEST_EMAIL="your-test@example.com"
export TEST_PASSWORD="yourpassword"

npm run e2e:test:ios
```

Or create a `.env.test` file (add to `.gitignore`):

```
TEST_EMAIL=test@example.com
TEST_PASSWORD=TestPassword123
```

## Debugging Tests

### Enable Verbose Logging

```bash
npx detox test -c ios.sim.release --loglevel verbose
```

### Take Screenshots

Screenshots are automatically taken on test failure. Manually take screenshots:

```typescript
await device.takeScreenshot('my-screenshot')
```

### Record Video

```bash
npx detox test -c ios.sim.release --record-videos all
```

Videos are saved to `artifacts/` directory.

### Run Single Test

```bash
# Run specific test by name
npx detox test -c ios.sim.release --testNamePattern="should login with existing account"
```

### Debug Mode

```bash
# Build debug version
npm run e2e:build:ios:debug

# Run tests with debugger
npx detox test -c ios.sim.debug --inspect
```

## Troubleshooting

### "Cannot boot simulator" Error

```bash
# List available simulators
xcrun simctl list devices

# Update .detoxrc.js with your simulator name
```

### "App binary not found" Error

```bash
# Rebuild the app
npm run e2e:build:ios
```

### Tests are Flaky

Detox should NOT be flaky due to automatic synchronization. If you see flakiness:

1. Check for race conditions in your app code
2. Ensure testIDs are stable and unique
3. Avoid using arbitrary timeouts - let Detox wait automatically

### Simulator Not Closing

```bash
# Kill all simulators
killall Simulator

# Clean Detox cache
npx detox clean-framework-cache && npx detox build-framework-cache
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Build iOS app
        run: npm run e2e:build:ios

      - name: Run E2E tests
        run: npm run e2e:test:ios

      - name: Upload artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: detox-artifacts
          path: artifacts/
```

## Best Practices

### 1. Use Test IDs

Always prefer `testID` over text matching:

```tsx
// Good - stable selector
<View testID="hero-card">

// Avoid - text might change
<Text>Welcome back, John!</Text>
```

```typescript
// Good
await element(by.id('hero-card')).tap()

// Avoid
await element(by.text('Welcome back, John!')).tap()
```

### 2. Avoid Arbitrary Waits

Let Detox synchronize automatically:

```typescript
// Good - Detox waits for element
await expect(element(by.text('Welcome'))).toBeVisible()

// Avoid - arbitrary timeout
await new Promise(resolve => setTimeout(resolve, 3000))
```

### 3. Reuse Helpers

Don't duplicate test setup logic:

```typescript
// Good
await loginAsTestUser(email, password)

// Avoid - duplicating login logic in every test
await element(by.text('Sign in')).tap()
await element(by.id('email-input')).typeText(email)
// ... etc
```

### 4. Use Page Object Pattern

For complex screens, create page objects:

```typescript
class JournalScreen {
  async navigateTo() {
    await element(by.id('journal-tab')).tap()
  }

  async searchFor(query: string) {
    await element(by.id('journal-search-input')).typeText(query)
  }

  async selectFilter(tag: string) {
    await element(by.text(`#${tag}`)).tap()
  }
}
```

### 5. Clean State Between Tests

```typescript
beforeEach(async () => {
  await device.reloadReactNative() // Fresh app state
  await loginAsTestUser(email, password)
})
```

## Comparison: Detox vs Maestro

| Feature | Detox | Maestro |
|---------|-------|---------|
| **Test Language** | TypeScript | YAML |
| **Synchronization** | Automatic | Manual timeouts |
| **Network Mocking** | ✅ Yes | ❌ No |
| **Code Reuse** | ✅ Full TypeScript | ⚠️ Limited |
| **Debugging** | ✅ Stack traces, debugger | ⚠️ Black box |
| **Type Safety** | ✅ Full | ❌ None |
| **Learning Curve** | Medium | Low |
| **Setup Time** | High (prebuild) | Low (works with Expo Go) |
| **CI/CD Maturity** | ✅ Excellent | ⚠️ Good |
| **Test Reliability** | ✅ Very high | ⚠️ Can be flaky |

**Recommendation**: Use Detox for production apps requiring reliable, maintainable test suites. Use Maestro for quick prototypes or demos.

## Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Expo + Detox Guide](https://docs.expo.dev/build-reference/e2e-tests/)

## Contributing

When adding new tests:

1. Create test file in `e2e/` directory
2. Use TypeScript for type safety
3. Follow existing test structure and naming
4. Add test description to this README
5. Reuse helpers where possible
6. Ensure tests are deterministic (no random data without seeding)
7. Add testIDs to components as needed
