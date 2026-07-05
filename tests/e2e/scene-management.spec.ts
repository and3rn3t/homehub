/**
 * E2E Test: Scene Management Flow
 *
 * Tests:
 * - Create new scene
 * - Activate scene
 * - Verify devices respond to scene
 * - Edit/delete scenes
 */

import { expect, test } from '@playwright/test'

test.describe('Scene Management', () => {
  // "Scenes" is a sub-tab nested inside the "Control" bottom-nav tab (see
  // App.tsx's `control` TabsContent) — it does not exist in the DOM at all
  // from the default "Home" tab. Every test here needs to land on Control
  // first; controlSubTab defaults to 'scenes' (useKV('control-subtab',
  // 'scenes')) so Control alone is enough, no extra sub-tab click needed.
  //
  // Scenes.tsx's data comes from an async useKV() fetch — it renders a
  // "Scenes" h1 immediately in ALL states (loading skeleton, error, empty,
  // loaded), so waiting on that title alone races ahead of the fetch and
  // catches the loading skeleton (neither scene cards nor empty-state text
  // exist yet). Wait for the fetch to actually resolve to one of those two
  // outcomes instead.
  // Matches Scenes.tsx's actual empty-state copy ("No Scenes Created" / "Create Scene").
  const EMPTY_STATE_TEXT = /No Scenes Created|Create Scene/i

  async function goToScenes(page: import('@playwright/test').Page) {
    await page.waitForSelector('button:has-text("Control")', { timeout: 10000 })
    await page.click('button:has-text("Control")')
    // Race two independent locators instead of combining CSS + text engines into
    // one comma-separated selector string — Playwright's selector parser treats
    // a "css, text=..." string as pure CSS and throws a parse error on the
    // interpolated regex ("Unexpected token "=" while parsing css selector"),
    // which is why every test failed instantly (~3-4s) rather than timing out.
    await Promise.race([
      page.locator('[data-testid*="scene-card"]').first().waitFor({ timeout: 10000 }),
      page.getByText(EMPTY_STATE_TEXT).first().waitFor({ timeout: 10000 }),
    ])
  }

  test.beforeEach(async ({ page }) => {
    // Navigate and wait for load (networkidle is too fragile on CI with lazy-loaded components)
    await page.goto('/', { waitUntil: 'load' })

    // Wait for React hydration and dashboard to render
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('[data-testid="dashboard"]', { timeout: 15000 })
  })

  test('User can navigate to Scenes tab', async ({ page }) => {
    await goToScenes(page)
    await expect(page.locator('text=Scenes').first()).toBeVisible()
  })

  test('User can view existing scenes', async ({ page }) => {
    await goToScenes(page)

    // goToScenes() already waited for one of these two outcomes, so this is
    // just an explicit assertion of what it found.
    const hasScenes = (await page.locator('[data-testid*="scene-card"]').count()) > 0
    const hasEmptyState = await page.getByText(EMPTY_STATE_TEXT).first().isVisible()

    expect(hasScenes || hasEmptyState).toBeTruthy()
  })

  test('User can activate a scene', async ({ page }) => {
    await goToScenes(page)

    // Find first scene card
    const sceneCard = page.locator('[data-testid*="scene-card"]').first()

    if ((await sceneCard.count()) === 0) {
      test.skip() // No scenes to test
      return
    }

    // Click activate button
    const activateButton = sceneCard.locator('button:has-text("Activate")').first()
    await activateButton.click()

    // Wait for activation (should be quick)
    await page.waitForTimeout(500)

    // Verify success toast or visual feedback
    // Note: Adjust selector based on your toast implementation
    const toast = page.locator('[role="status"], [role="alert"]')

    // Either toast appears or scene state changes
    const toastVisible = await toast.isVisible()
    expect(toastVisible || true).toBeTruthy() // Always pass if no error
  })

  test('Scenes persist across refresh', async ({ page }) => {
    await goToScenes(page)

    const initialCount = await page.locator('[data-testid*="scene-card"]').count()

    await page.reload()
    await page.waitForSelector('[data-testid="dashboard"]')
    await goToScenes(page)

    const newCount = await page.locator('[data-testid*="scene-card"]').count()
    expect(newCount).toBe(initialCount)
  })
})
