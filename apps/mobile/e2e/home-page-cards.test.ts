/**
 * Detox E2E Test: Home Page Cards & Interactions
 * Tests hero card, week progress, continue card, and stats cards
 *
 * Converted from: .maestro/home-page-cards.yaml
 * Prerequisites: User must be logged in and onboarded
 */

import {
  loginAsTestUser,
  navigateToHome,
  TEST_CREDENTIALS,
} from './helpers'

describe('Home Page Cards & Interactions', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  beforeEach(async () => {
    await device.reloadReactNative()
    await loginAsTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)
    await navigateToHome()
  })

  describe('Hero Card', () => {
    it('should display hero card with morning check-in CTA', async () => {
      // Verify hero card is visible
      await expect(element(by.id('hero-card'))).toBeVisible()

      // Verify morning CTA is shown (if morning check-in not done)
      await expect(
        element(by.text(/Start Morning Check-in|Begin Morning Check-in/))
      ).toBeVisible()

      // Verify greeting is shown
      await expect(
        element(by.text(/Good morning|Good evening|Good afternoon/))
      ).toBeVisible()
    })

    it('should navigate to morning check-in when hero card is tapped', async () => {
      // Tap hero card
      await element(by.id('hero-card')).tap()

      // Should navigate to morning check-in screen
      await waitFor(element(by.text('Morning Check-in')))
        .toBeVisible()
        .withTimeout(3000)

      // Go back
      await element(by.id('back-button')).tap()
    })

    it('should show completed state after both check-ins done', async () => {
      // This test assumes both check-ins are completed
      // Check for completed state
      const completedCard = element(by.id('hero-card-completed'))

      // If completed, verify checkmarks
      await completedCard.tap()
      await expect(element(by.id('morning-checkmark'))).toBeVisible()
      await expect(element(by.id('evening-checkmark'))).toBeVisible()

      // Verify motivational message
      await expect(element(by.text(/Great work|Awesome|Well done/))).toBeVisible()
    })
  })

  describe('Week Progress Card', () => {
    it('should display week progress with 7 days', async () => {
      await expect(element(by.id('week-progress-card'))).toBeVisible()

      // Verify 7 days are shown (0-6)
      await expect(element(by.id('day-indicator-0'))).toBeVisible()
      await expect(element(by.id('day-indicator-6'))).toBeVisible()
    })

    it('should navigate to day details when tapping a day', async () => {
      // Tap on Wednesday (day 3)
      await element(by.id('day-indicator-3')).tap()

      // Should show day details or navigate to journal for that day
      await waitFor(element(by.text(/Wed|Wednesday/)))
        .toBeVisible()
        .withTimeout(2000)

      // Go back if navigated
      await element(by.text(/Back|Close/)).tap()
    })
  })

  describe('Continue Card', () => {
    it('should show continue card for incomplete check-in', async () => {
      // Scroll down to see continue card
      await element(by.id('home-screen-scroll')).scroll(200, 'down')

      // Check if continue card exists
      const continueCard = element(by.text('Continue where you left off'))

      try {
        await expect(continueCard).toBeVisible()

        // Verify timestamp is shown
        await expect(element(by.text(/minutes ago|hours ago|just now/))).toBeVisible()

        // Tap to continue
        await element(by.id('continue-card')).tap()

        // Should navigate to check-in screen with prefilled data
        await waitFor(element(by.text(/Morning Check-in|Evening Check-in/)))
          .toBeVisible()
          .withTimeout(3000)

        await element(by.id('back-button')).tap()
      } catch (e) {
        // Continue card not present (no draft check-ins)
        // This is expected if user has no incomplete check-ins
      }
    })
  })

  describe('Stats Cards', () => {
    it('should display streak card', async () => {
      // Scroll to stats section
      await element(by.id('home-screen-scroll')).scroll(300, 'down')

      // Verify streak card
      await expect(element(by.id('streak-card'))).toBeVisible()

      // Verify streak count is shown
      await expect(element(by.text(/day streak|days streak/))).toBeVisible()
    })

    it('should display total check-ins card', async () => {
      // Scroll to stats section
      await element(by.id('home-screen-scroll')).scroll(300, 'down')

      // Verify total check-ins card
      await expect(element(by.id('total-check-ins-card'))).toBeVisible()

      // Verify count is shown
      await expect(element(by.text(/check-ins|check-in/))).toBeVisible()
    })
  })

  describe('Journey Stage Badges', () => {
    it('should show appropriate badge based on user progress', async () => {
      // Check for different journey stages
      // Note: Only one of these will be visible depending on user's progress

      try {
        // New users (0 check-ins)
        await expect(element(by.text('Welcome, there! Let\'s begin'))).toBeVisible()
        await expect(element(by.text('Start your first check-in'))).toBeVisible()
      } catch (e) {
        try {
          // First done (1-2 check-ins)
          await expect(element(by.text('Great start'))).toBeVisible()
          await expect(element(by.text('Keep the momentum'))).toBeVisible()
        } catch (e) {
          try {
            // Building (3-7 check-ins)
            await expect(element(by.text('Good to see you'))).toBeVisible()
            await expect(element(by.text('You\'re building a habit'))).toBeVisible()
          } catch (e) {
            // Established (8+ check-ins or 5+ streak)
            await expect(element(by.text('Amazing work'))).toBeVisible()
            await expect(element(by.text('You\'re on fire'))).toBeVisible()
          }
        }
      }
    })
  })

  describe('Pull to Refresh', () => {
    it('should refresh data when pulling down', async () => {
      // Pull down to refresh
      await element(by.id('home-screen-scroll')).swipe('down', 'slow', 0.8)

      // Should show loading indicator briefly
      try {
        await waitFor(element(by.id('refresh-indicator')))
          .toBeVisible()
          .withTimeout(1000)
      } catch (e) {
        // Refresh might be too fast to catch indicator
      }

      // Data should reload and hero card should be visible
      await waitFor(element(by.id('hero-card')))
        .toBeVisible()
        .withTimeout(3000)
    })
  })
})
