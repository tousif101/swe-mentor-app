/**
 * Custom assertion helpers for Detox E2E tests
 */

export async function assertCheckInComplete() {
  await expect(element(by.text('Check-in Complete!'))).toBeVisible()
  await element(by.text('OK')).tap()
}

export async function assertOnHomeScreen() {
  await expect(element(by.text('Welcome'))).toBeVisible()
}

export async function assertOnJournalScreen() {
  await expect(element(by.text('Journal'))).toBeVisible()
}

export async function assertChangesSaved() {
  await expect(element(by.text('Changes Saved!'))).toBeVisible()
  await element(by.text('OK')).tap()
}

export async function assertCelebrationModal() {
  await expect(element(by.text('Great work today!'))).toBeVisible()
  await element(by.text(/Close|Done|OK/)).tap()
}

export async function assertMorningCheckInCompleted() {
  await expect(
    element(by.id('morning-check-in-completed'))
  ).toBeVisible()
}

export async function assertEveningCheckInCompleted() {
  await expect(
    element(by.id('evening-check-in-completed'))
  ).toBeVisible()
}

export async function assertTextVisible(text: string, timeout = 3000) {
  await waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout)
}

export async function assertElementVisible(id: string, timeout = 3000) {
  await waitFor(element(by.id(id)))
    .toBeVisible()
    .withTimeout(timeout)
}

export async function assertElementNotVisible(id: string) {
  await expect(element(by.id(id))).not.toBeVisible()
}
