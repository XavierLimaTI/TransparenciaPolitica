const { test, expect } = require('@playwright/test');

test('portal key flow', async ({ page }) => {
  await page.goto('http://localhost:8000/scripts/playwright/test-pages/modal-test.html');

  // Ensure the test page exposes the helper and open the modal
  await page.evaluate(() => {
    if (typeof window.createPortalKeyModal === 'function') window.createPortalKeyModal();
  });

  const input = page.locator('#portalKeyInput');
  const saveButton = page.locator('#portalKeySave');
  await expect(saveButton).toBeVisible();
  await input.fill('E2E-KEY-123');
  await saveButton.click();

  // assert saved and modal removed
  const saved = await page.evaluate(() => localStorage.getItem('portal_api_key'));
  expect(saved).toBe('E2E-KEY-123');
  const modal = await page.locator('[role="dialog"]');
  await expect(modal).not.toBeVisible();
});
