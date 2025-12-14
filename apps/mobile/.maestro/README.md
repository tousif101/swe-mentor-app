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

### Full Signup + Onboarding Flow
```bash
maestro test .maestro/onboarding.yaml
```

### Login + Onboarding (existing account)
```bash
maestro test .maestro/login-onboarding.yaml \
  -e TEST_EMAIL=your-test@example.com \
  -e TEST_PASSWORD=yourpassword
```

## Test Files

| File | Description |
|------|-------------|
| `onboarding.yaml` | Full signup flow with new account + onboarding |
| `login-onboarding.yaml` | Login with existing account + onboarding |

## Notes

- Tests use Expo Go app ID (`host.exp.Exponent`)
- For development builds, update `appId` to your bundle identifier
- Signup test generates unique emails using `${maestro.timestamp}`

## Future: Detox Setup

For more comprehensive E2E testing with better React Native integration, consider setting up Detox:

1. Install expo-dev-client for custom native builds
2. Configure Detox with Jest
3. Create native iOS/Android test targets

See: https://docs.expo.dev/develop/development-builds/introduction/
