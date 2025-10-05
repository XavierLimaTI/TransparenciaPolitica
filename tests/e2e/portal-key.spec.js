const { test, expect } = require('@playwright/test');

test('portal key flow', async ({ page }) => {
  await page.goto('http://localhost:8000/scripts/playwright/test-pages/modal-test.html');
  const button = await page.locator('button');
  await expect(button).toBeVisible();
  await button.click();
  // simple assertion: modal should open
  const modal = await page.locator('[role="dialog"]');
  await expect(modal).toBeVisible();
});
