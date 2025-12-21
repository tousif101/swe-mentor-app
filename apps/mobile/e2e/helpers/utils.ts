/**
 * Utility functions for Detox E2E tests
 */

/**
 * Generate a unique test email using timestamp
 */
export function generateTestEmail(): string {
  const timestamp = Date.now()
  return `testuser+${timestamp}@example.com`
}

/**
 * Default test credentials
 */
export const TEST_CREDENTIALS = {
  email: process.env.TEST_EMAIL || 'testing@gmail.com',
  password: process.env.TEST_PASSWORD || 'Testingthisapp123',
  name: 'Test User',
}

/**
 * Wait for element and tap
 */
export async function tapWhenVisible(matcher: Detox.NativeMatcher, timeout = 3000) {
  await waitFor(element(matcher))
    .toBeVisible()
    .withTimeout(timeout)
  await element(matcher).tap()
}

/**
 * Type text and dismiss keyboard
 */
export async function typeTextAndDismiss(matcher: Detox.NativeMatcher, text: string) {
  await element(matcher).typeText(text)
  // Dismiss keyboard by tapping return or done
  await element(matcher).tapReturnKey()
}

/**
 * Scroll to element and tap
 */
export async function scrollToAndTap(
  scrollViewMatcher: Detox.NativeMatcher,
  elementMatcher: Detox.NativeMatcher
) {
  await waitFor(element(elementMatcher))
    .toBeVisible()
    .whileElement(scrollViewMatcher)
    .scroll(200, 'down')

  await element(elementMatcher).tap()
}

/**
 * Clear text input
 */
export async function clearText(matcher: Detox.NativeMatcher) {
  await element(matcher).clearText()
}

/**
 * Reload React Native app
 */
export async function reloadApp() {
  await device.reloadReactNative()
}

/**
 * Take screenshot for debugging
 */
export async function takeScreenshot(name: string) {
  await device.takeScreenshot(name)
}
