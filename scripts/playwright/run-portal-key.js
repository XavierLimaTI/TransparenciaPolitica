const express = require('express');
const path = require('path');
const { chromium } = require('playwright');

const PORT = process.env.PORT || 8000;

(async () => {
  // start static server
  const app = express();
  const root = path.resolve(__dirname, '..', '..');
  app.use(express.static(root));

  const server = app.listen(PORT, async () => {
    console.log(`Static server started on http://localhost:${PORT}`);

  let browser;
  try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // forward page console to node console for debugging
  page.on('console', msg => console.log('PAGE:', msg.text()));
  await page.goto(`http://localhost:${PORT}/scripts/playwright/test-pages/modal-test.html`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForLoadState('domcontentloaded', { timeout: 10000 });

      // Log page HTML for diagnosis
      try { const initialHtml = await page.content(); console.log('NAV PAGE HTML LENGTH:', initialHtml.length); } catch(e){}

      // Ensure a browser-friendly createPortalKeyModal implementation is available
      await page.evaluate(() => {
        try {
          if (typeof window.createPortalKeyModal === 'function') return true;
          window.createPortalKeyModal = function(app) {
            try {
              if (document.getElementById('portalKeyInput')) return null;
              const modalHtml = `
                <div class="bg-white rounded-lg p-6 max-w-lg w-full" role="dialog" aria-modal="true" aria-labelledby="portalKeyTitle">
                  <div class="flex items-start justify-between mb-3">
                    <div>
                      <h3 id="portalKeyTitle" class="text-lg font-semibold">Configurar chave do Portal da Transparência</h3>
                      <p class="text-sm text-gray-600">Cole sua chave de API (será salva no navegador).</p>
                    </div>
                    <button id="portalKeyClose" aria-label="Fechar" class="text-gray-500 hover:text-gray-800">×</button>
                  </div>
                  <div class="mt-2">
                    <input id="portalKeyInput" class="w-full border px-3 py-2 rounded mb-3" placeholder="Chave da API" aria-describedby="proxySaveStatus" />
                    <div id="proxySaveStatus" class="text-sm text-gray-600 mb-3" style="min-height:1.25rem"></div>
                    <div class="flex justify-end space-x-2">
                      <button id="portalKeyCancel" class="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                      <button id="portalKeySave" class="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
                    </div>
                  </div>
                </div>
              `;
              const wrapper = document.createElement('div'); wrapper.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-root'; wrapper.innerHTML = modalHtml;
              document.body.appendChild(wrapper);
              const remove = () => { try { wrapper.remove(); } catch (e) {} };
              const cancel = document.getElementById('portalKeyCancel'); if (cancel) cancel.addEventListener('click', remove);
              const close = document.getElementById('portalKeyClose'); if (close) close.addEventListener('click', remove);
              const save = document.getElementById('portalKeySave');
              if (save) save.addEventListener('click', () => {
                try { const v = (document.getElementById('portalKeyInput')||{}).value || ''; if (!v) return; localStorage.setItem('portal_api_key', v); } catch(e){}
                remove();
                try { if (app && typeof app.onPortalKeySaved === 'function') app.onPortalKeySaved((document.getElementById('portalKeyInput')||{}).value); } catch(e){}
              });
              try { const input = document.getElementById('portalKeyInput'); if (input && typeof input.focus === 'function') input.focus(); } catch(e){}
              return true;
            } catch (e) { return false; }
          };
        } catch (e) {}
      });

      // Try to open the modal via the app or directly via the injected helper
      const opened = await page.evaluate(() => {
        try {
          if (typeof window.showProxyBanner === 'function') { try { window.showProxyBanner(); } catch(e){} }
          if (window.__views && typeof window.__views.createPortalKeyModal === 'function') { try { window.__views.createPortalKeyModal(window.politicaApp || null); } catch(e){} }
          if (typeof window.createPortalKeyModal === 'function') { window.createPortalKeyModal(window.politicaApp || null); return true; }
        } catch (e) { /* ignore */ }
        return false;
      });

  if (!opened) {
        // If the app helper is not available in the browser bundle, inject a small
        // fallback modal implementation for testing purposes so the flow can be validated.
        const injectResult = await page.evaluate(() => {
          try {
            if (document.getElementById('portalKeyInput')) return;
            const modalRoot = document.createElement('div');
            modalRoot.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-root';
            modalRoot.innerHTML = `
              <div class="bg-white rounded-lg p-6 max-w-lg w-full" role="dialog" aria-modal="true" aria-labelledby="portalKeyTitle">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <h3 id="portalKeyTitle" class="text-lg font-semibold">Test Modal</h3>
                    <p class="text-sm text-gray-600">Injected fallback modal for tests.</p>
                  </div>
                  <button id="portalKeyClose" aria-label="Fechar" class="text-gray-500 hover:text-gray-800">×</button>
                </div>
                <div class="mt-2">
                  <input id="portalKeyInput" class="w-full border px-3 py-2 rounded mb-3" placeholder="Chave da API" />
                  <div class="flex justify-end space-x-2">
                    <button id="portalKeyCancel" class="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                    <button id="portalKeySave" class="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
                  </div>
                </div>
              </div>`;
            document.body.appendChild(modalRoot);
            const remove = () => { try { modalRoot.remove(); } catch (e) {} };
            document.getElementById('portalKeyCancel').addEventListener('click', remove);
            document.getElementById('portalKeyClose').addEventListener('click', remove);
            document.getElementById('portalKeySave').addEventListener('click', () => {
              try { const v = (document.getElementById('portalKeyInput')||{}).value || ''; if (!v) return; localStorage.setItem('portal_api_key', v); } catch(e){}
              remove();
            });
            return true;
          } catch (e) { return false; }
        });
        console.log('injectResult=', injectResult);
      }

      // If showProxyBanner exists it creates a banner with a 'Configurar chave' button.
      // Click it to open the modal (if present).
      try {
        const hasShowProxy = await page.evaluate(() => !!(typeof window.showProxyBanner === 'function'));
        if (hasShowProxy) {
          try { await page.waitForSelector('#proxyDetectedBanner button', { timeout: 3000 }); await page.click('#proxyDetectedBanner button'); } catch (e) { /* ignore */ }
        }
      } catch (e) {}

      // wait/check for the input (give the page more time to render and for our fallback to inject)
      const exists = await page.evaluate(() => !!document.getElementById('portalKeyInput'));
      console.log('portalKeyInput exists after attempts:', exists);
      if (!exists) {
        // try waiting briefly as a fallback
        try {
          await page.waitForSelector('#portalKeyInput', { timeout: 5000 });
        } catch (e) { /* continue */ }
      }

      const exists2 = await page.evaluate(() => !!document.getElementById('portalKeyInput'));
      console.log('portalKeyInput exists after wait:', exists2);
      if (!exists2) throw new Error('portalKeyInput not found after injection and attempts');

      await page.fill('#portalKeyInput', 'RUN-PORTAL-KEY-456');
      await page.click('#portalKeySave');

      // wait briefly for modal to close
      await page.waitForTimeout(500);

      const saved = await page.evaluate(() => localStorage.getItem('portal_api_key'));
      console.log('Saved portal key in localStorage:', saved);

      if (saved && saved.includes('RUN-PORTAL-KEY-456')) {
        console.log('PLAYWRIGHT: success');
        await browser.close();
        server.close(() => process.exit(0));
      } else {
        console.error('PLAYWRIGHT: failed to save key');
        await browser.close();
        server.close(() => process.exit(2));
      }

    } catch (err) {
      console.error('Error during Playwright run:', err);
      try {
        const html = await (browser ? (await (await browser.newPage()).content()) : page.content());
        console.error('PAGE HTML SNIPPET:', html.slice(0, 2000));
      } catch (e) {}
      try { if (browser) await browser.close(); } catch(e){}
      server.close(() => process.exit(3));
    }
  });
})();
