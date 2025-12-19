# Maestro E2E Tests

End-to-end tests for the SWE Mentor mobile app using [Maestro](https://maestro.mobile.dev/).

## Setup

1. Install Maestro CLI:
   ```bash
   brew install maestro
   ```

2. Start the Expo app:
   ```bash
   npx expo start
   ```

3. Open in iOS Simulator or Android Emulator

## Running Tests

### Quick Start - Full User Journey
```bash
# Run complete end-to-end flow (login → check-ins → journal)
maestro test .maestro/full-user-journey.yaml \
  -e TEST_EMAIL=your-test@example.com \
  -e TEST_PASSWORD=yourpassword
```

### Run All Tests
```bash
maestro test .maestro/
```

### Authentication & Onboarding
```bash
# Full signup flow with new account
maestro test .maestro/onboarding.yaml

# Login with existing account
maestro test .maestro/login-onboarding.yaml \
  -e TEST_EMAIL=your-test@example.com \
  -e TEST_PASSWORD=yourpassword
```

### Check-in Flows
```bash
# Test morning check-in
maestro test .maestro/morning-check-in.yaml

# Test evening check-in with different answer types
maestro test .maestro/evening-check-in.yaml
```

### Journal Features
```bash
# Test editing check-ins from journal
maestro test .maestro/journal-edit-flow.yaml

# Test filtering and searching
maestro test .maestro/journal-filter-search.yaml
```

### Home Page
```bash
# Test all home page cards and interactions
maestro test .maestro/home-page-cards.yaml
```

### Run Specific Test Suite
```bash
# Run all journal tests
maestro test .maestro/journal-*.yaml

# Run all check-in tests
maestro test .maestro/*-check-in.yaml
```

## Test Files

### Master Suite
| File | Description |
|------|-------------|
| `full-user-journey.yaml` | **Complete E2E flow**: Login → Home → Check-ins → Journal → Search |

### Authentication & Onboarding
| File | Description |
|------|-------------|
| `onboarding.yaml` | Full signup flow with new account + onboarding |
| `login-onboarding.yaml` | Login with existing account + onboarding |

### Check-in Flows
| File | Description |
|------|-------------|
| `morning-check-in.yaml` | Complete morning check-in with focus area and goals |
| `evening-check-in.yaml` | Complete evening reflection with all answer types |

### Journal Features
| File | Description |
|------|-------------|
| `journal-edit-flow.yaml` | Edit existing check-ins from journal and verify changes |
| `journal-filter-search.yaml` | Filter by tags, search entries, and test empty states |

### Home Page
| File | Description |
|------|-------------|
| `home-page-cards.yaml` | Hero card, week progress, stats, continue card interactions |

## Debugging Tests

### Run with verbose output
```bash
maestro test .maestro/morning-check-in.yaml --debug-output
```

### Take screenshots on failure
```bash
maestro test .maestro/journal-edit-flow.yaml --include-screenshots
```

### Run in headless mode (for CI)
```bash
maestro test .maestro/ --format junit --output test-results.xml
```

## Best Practices

1. **Start with a fresh state**: Reset the app or use a test account
2. **Run tests in order**: Onboarding → Morning → Evening → Journal
3. **Check test data**: Ensure you have check-ins before running journal tests
4. **Use test IDs**: Components should have stable `testID` props for reliable selectors
5. **Handle timing**: Use `extendedWaitUntil` for async operations

## Notes

- Tests use Expo Go app ID (`host.exp.Exponent`)
- For development builds, update `appId` to your bundle identifier
- Signup test generates unique emails using `${maestro.timestamp}`
- Element IDs with `*` are pattern matchers (e.g., `day-card-*` matches any day card)
- Tests assume English locale for text matching

## Future: Detox Setup

For more comprehensive E2E testing with better React Native integration, consider setting up Detox:

1. Install expo-dev-client for custom native builds
2. Configure Detox with Jest
3. Create native iOS/Android test targets

See: https://docs.expo.dev/develop/development-builds/introduction/
