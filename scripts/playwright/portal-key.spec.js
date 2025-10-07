const { test, expect } = require('@playwright/test');

// Smoke E2E: abrir modal de portal key, salvar e validar localStorage

test('portal key modal opens and saves key', async ({ page }) => {
  // abrir app
  await page.goto('http://localhost:8000/candidatos.html');

  // expor helper se necessário

  // try to open via public API
  if (await page.evaluate(() => !!window.showProxyBanner)) {
    await page.evaluate(() => window.showProxyBanner && window.showProxyBanner());
  } else if (await page.evaluate(() => !!(window.__views && window.__views.createPortalKeyModal))) {
    await page.evaluate(() => window.__views.createPortalKeyModal(window.politicaApp || null));
  } else {
    // fallback: inject the helper from lib/ui-helpers.js by adding a small script that calls createPortalKeyModal if available
  await page.addScriptTag({ path: '/lib/ui-helpers.js' });
  await page.evaluate(() => { try { if (window.createPortalKeyModal) window.createPortalKeyModal(window.politicaApp || null); } catch (e) { void e; } });
  }

  // aguardar input do modal
  const input = page.locator('#portalKeyInput');
  await expect(input).toBeVisible({ timeout: 2000 });

  // digitar chave e salvar
  await input.fill('TEST-PLAYWRIGHT-KEY-123');
  await page.click('#portalKeySave');

  // esperar o modal desaparecer
  await expect(input).toBeHidden({ timeout: 2000 });

  // checar localStorage
  const saved = await page.evaluate(() => localStorage.getItem('portal_api_key'));
  expect(saved).toBe('TEST-PLAYWRIGHT-KEY-123');
});
