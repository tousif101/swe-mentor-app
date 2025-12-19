/**
 * Authentication helpers for Detox E2E tests
 */

export async function loginAsTestUser(email: string, password: string) {
  // Navigate to login from welcome screen
  await element(by.text('I already have an account')).tap()

  // Wait for login screen
  await expect(element(by.text('Welcome back'))).toBeVisible()

  // Enter email
  await element(by.id('email-input')).typeText(email)

  // Enter password
  await element(by.id('password-input')).typeText(password)

  // Tap sign in (this will dismiss keyboard)
  await element(by.id('sign-in-button')).tap()

  // Wait for HomeScreen to appear (bypasses intermediate loading states)
  await waitFor(element(by.id('home-screen')))
    .toBeVisible()
    .withTimeout(20000)

  // Confirm greeting is visible
  await waitFor(element(by.id('home-greeting')))
    .toBeVisible()
    .withTimeout(5000)
}

export async function signupNewUser(email: string, password: string, name: string) {
  // Tap "Get Started" button on welcome screen
  await element(by.text('Get Started')).tap()

  // Wait for signup screen
  await expect(element(by.text('Create an account'))).toBeVisible()

  // Enter email
  await element(by.id('email-input')).typeText(email)

  // Enter password
  await element(by.id('password-input')).typeText(password)

  // Confirm password
  await element(by.id('confirm-password-input')).typeText(password)

  // Tap create account
  await element(by.id('create-account-button')).tap()

  // Wait for profile setup or email confirmation
  await waitFor(element(by.text('Set up your profile')))
    .toBeVisible()
    .withTimeout(10000)

  // Complete profile setup
  await completeProfileSetup(name)
}

export async function completeProfileSetup(name: string) {
  // Enter name
  await element(by.id('name-input')).typeText(name)

  // Select role (Software Engineer 2)
  await element(by.id('role-selector')).tap()
  await element(by.text('Software Engineer 2')).tap()

  // Tap continue
  await element(by.id('continue-button')).tap()

  // Wait for ready screen
  await expect(element(by.text(`Welcome, ${name}!`))).toBeVisible()

  // Start first entry
  await element(by.text('Start Your First Entry')).tap()

  // Wait for home screen
  await waitFor(element(by.text('Welcome')))
    .toBeVisible()
    .withTimeout(5000)
}

export async function logout() {
  // Navigate to profile/settings (implementation depends on your app)
  // This is a placeholder - adjust based on your navigation structure
  await element(by.id('profile-tab')).tap()
  await element(by.id('logout-button')).tap()

  // Confirm logout if there's a confirmation dialog
  await element(by.text('Logout')).tap()

  // Wait for welcome screen
  await expect(element(by.text('Get Started'))).toBeVisible()
}
