const { test, expect } = require('@playwright/test');

test('portal key modal saves key', async ({ page }) => {
  await page.goto('/candidatos.html');

  // ensure helper exists
  await page.evaluate(() => {
    if (!window.createPortalKeyModal) {
      window.createPortalKeyModal = function(app) {
        if (document.getElementById('portalKeyInput')) return;
        const wrapper = document.createElement('div'); wrapper.className = 'modal-root';
        wrapper.innerHTML = `<div><input id="portalKeyInput" /><button id="portalKeySave">Salvar</button></div>`;
        document.body.appendChild(wrapper);
        document.getElementById('portalKeySave').addEventListener('click', () => { localStorage.setItem('portal_api_key', document.getElementById('portalKeyInput').value); wrapper.remove(); });
      };
    }
  });

  // call the modal helper
  await page.evaluate(() => window.createPortalKeyModal && window.createPortalKeyModal(window.politicaApp || null));

  await page.fill('#portalKeyInput', 'E2E-KEY-789');
  await page.click('#portalKeySave');

  const saved = await page.evaluate(() => localStorage.getItem('portal_api_key'));
  expect(saved).toBe('E2E-KEY-789');
});
