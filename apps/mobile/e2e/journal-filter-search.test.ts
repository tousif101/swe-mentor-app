/**
 * Detox E2E Test: Journal Filter and Search
 * Tests filtering by tags and searching journal entries
 *
 * Converted from: .maestro/journal-filter-search.yaml
 * Prerequisites: Must have multiple check-ins with different focus areas
 */

import {
  loginAsTestUser,
  navigateToJournal,
  clearText,
  TEST_CREDENTIALS,
} from './helpers'

describe('Journal Filter and Search', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true })
  })

  beforeEach(async () => {
    await device.reloadReactNative()
    await loginAsTestUser(TEST_CREDENTIALS.email, TEST_CREDENTIALS.password)
    await navigateToJournal()

    // Wait for entries to load
    await waitFor(element(by.id(/day-card-.*/)))
      .toBeVisible()
      .withTimeout(5000)
  })

  it('should display search bar and filter chips', async () => {
    // Verify search bar is visible
    await expect(element(by.id('journal-search-input'))).toBeVisible()

    // Verify filter chips are visible
    await expect(element(by.text('All'))).toBeVisible()
    await expect(element(by.id(/filter-chip-.*/)).atIndex(0)).toBeVisible()
  })

  it('should filter entries by focus area tag', async () => {
    // Tap on system-design filter chip
    await element(by.text('#system-design')).tap()

    // Verify chip is selected
    await expect(element(by.id('filter-chip-system-design-selected'))).toBeVisible()

    // Verify filtered results message
    await expect(element(by.text(/entries match|entry matches/))).toBeVisible()

    // Verify only system-design entries are shown
    await expect(element(by.text('#system-design'))).toBeVisible()

    // Clear filter
    await element(by.text('All')).tap()

    // All entries should be visible again
    await expect(element(by.text(/entries match/))).not.toBeVisible()
  })

  it('should search for entries by text', async () => {
    // Tap search input
    await element(by.id('journal-search-input')).tap()

    // Type search query
    await element(by.id('journal-search-input')).typeText('Detox')

    // Should show filtered results
    await expect(element(by.text(/Detox/))).toBeVisible()

    // Results count should update
    await expect(element(by.text(/entries match|entry matches/))).toBeVisible()

    // Clear search
    await clearText(by.id('journal-search-input'))

    // All entries should return
    await expect(element(by.text(/entries match/))).not.toBeVisible()
  })

  it('should combine search and filter', async () => {
    // Select a filter chip
    await element(by.text('#ownership')).tap()

    // Verify filter is applied
    await expect(element(by.id('filter-chip-ownership-selected'))).toBeVisible()

    // Add search query
    await element(by.id('journal-search-input')).tap()
    await element(by.id('journal-search-input')).typeText('test')

    // Should show entries matching BOTH filter and search
    await expect(element(by.text(/test/))).toBeVisible()
    await expect(element(by.text('#ownership'))).toBeVisible()

    // Clear filters
    await clearText(by.id('journal-search-input'))
    await element(by.text('All')).tap()
  })

  it('should show empty state when no results found', async () => {
    // Search for non-existent text
    await element(by.id('journal-search-input')).tap()
    await element(by.id('journal-search-input')).typeText('xyzabc123nonexistent')

    // Should show "no results" empty state
    await expect(element(by.text(/No entries found|No results/))).toBeVisible()

    // Should show "Clear filters" button
    await expect(element(by.text(/Clear filters|Show all/))).toBeVisible()

    // Clear and return to all entries
    await element(by.text(/Clear filters|Show all/)).tap()
    await expect(element(by.id(/day-card-.*/))).toBeVisible()
  })

  it('should filter by tapping hashtag in entry', async () => {
    // Tap hashtag within an entry
    await element(by.id('hashtag-system-design')).atIndex(0).tap()

    // Should automatically filter by that tag
    await expect(element(by.id('filter-chip-system-design-selected'))).toBeVisible()

    // Should show filtered results
    await expect(element(by.text(/entries match/))).toBeVisible()
  })

  it('should persist filter selection when navigating away and back', async () => {
    // Apply filter
    await element(by.text('#system-design')).tap()
    await expect(element(by.id('filter-chip-system-design-selected'))).toBeVisible()

    // Navigate to Home
    await element(by.id('home-tab')).tap()
    await expect(element(by.text('Welcome'))).toBeVisible()

    // Navigate back to Journal
    await element(by.id('journal-tab')).tap()

    // Filter should still be applied
    await expect(element(by.id('filter-chip-system-design-selected'))).toBeVisible()
    await expect(element(by.text(/entries match/))).toBeVisible()
  })

  it('should show all entries when "All" filter is selected', async () => {
    // First apply a filter
    await element(by.text('#system-design')).tap()
    await expect(element(by.text(/entries match/))).toBeVisible()

    // Tap "All" to clear filter
    await element(by.text('All')).tap()

    // Should show all entries (no filter message)
    await expect(element(by.text(/entries match/))).not.toBeVisible()

    // All filter chips should be deselected
    await expect(element(by.id('filter-chip-system-design-selected'))).not.toExist()
  })

  it('should handle case-insensitive search', async () => {
    // Create a check-in with specific text (assume "Detox" exists in entries)
    await element(by.id('journal-search-input')).tap()
    await element(by.id('journal-search-input')).typeText('detox')

    // Should find entries with "Detox" (different case)
    await expect(element(by.text(/Detox/))).toBeVisible()

    // Clear and try uppercase
    await clearText(by.id('journal-search-input'))
    await element(by.id('journal-search-input')).typeText('DETOX')

    // Should still find the entry
    await expect(element(by.text(/Detox/))).toBeVisible()
  })
})
