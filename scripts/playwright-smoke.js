// playwright-smoke.js
// Headless run to capture console and network for candidatos.html
const { chromium } = require('playwright');

(async () => {
  console.log('Starting Playwright smoke...');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    try {
      console.log(`[console:${msg.type()}] ${msg.text()}`);
    } catch (e) { console.log('[console] error reading message', e); }
  });

  page.on('requestfinished', request => {
    const r = request.response();
    const status = r ? r.status() : 'no-response';
    console.log('[request]', request.method(), request.url(), status);
  });

  page.on('requestfailed', request => {
    console.log('[requestfailed]', request.method(), request.url(), request.failure() && request.failure().errorText);
  });

  try {
    await page.goto('http://localhost:8000/candidatos.html', { waitUntil: 'networkidle' });
    // wait a bit for background fetches
    await page.waitForTimeout(3000);
    // capture some content
    const title = await page.title();
    console.log('Page title:', title);
  } catch (err) {
    console.error('Playwright error:', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
