// puppeteer-smoke.js
const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting Puppeteer smoke...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => {
    try { console.log('[console]', msg.type(), msg.text()); } catch (e) { console.log('[console] error', e); }
  });

  page.on('response', resp => {
    try { console.log('[response]', resp.status(), resp.url()); } catch (e) { }
  });

  page.on('requestfailed', req => {
    console.log('[requestfailed]', req.method(), req.url(), req.failure() && req.failure().errorText);
  });

  try {
    await page.goto('http://localhost:8000/candidatos.html', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForTimeout(3000);
    const title = await page.title();
    console.log('Page title:', title);
  } catch (err) {
    console.error('Puppeteer error:', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
