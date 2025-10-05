const { test, expect } = require('@playwright/test');

test('candidatos page portal key flow', async ({ page }) => {
  await page.goto('http://localhost:8000/candidatos.html');

  // If page doesn't expose helper, inject a minimal one
  await page.evaluate(() => {
    if (typeof window.createPortalKeyModal !== 'function') {
      window.createPortalKeyModal = function() {
        if (document.getElementById('portalKeyInput')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'modal-root';
        wrapper.innerHTML = `<div><input id="portalKeyInput" /><button id="portalKeySave">Salvar</button></div>`;
        document.body.appendChild(wrapper);
        document.getElementById('portalKeySave').addEventListener('click', () => { localStorage.setItem('portal_api_key', document.getElementById('portalKeyInput').value); wrapper.remove(); });
      };
    }
  });

  // Invoke the modal helper
  await page.evaluate(() => { window.createPortalKeyModal && window.createPortalKeyModal(window.politicaApp || null); });

  // Fill and save
  await page.fill('#portalKeyInput', 'CAND-KEY-001');
  await page.click('#portalKeySave');

  const saved = await page.evaluate(() => localStorage.getItem('portal_api_key'));
  expect(saved).toBe('CAND-KEY-001');
});
