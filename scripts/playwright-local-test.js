const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ARTIFACTS_DIR = path.resolve(process.cwd(), 'artifacts', 'playwright');
const OUT_DIR = path.resolve(process.cwd(), 'artifacts');
const URL = 'http://127.0.0.1:8001/';

async function run() {
  if (!fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    // When dist is not present, skip smoke tests gracefully (useful for forks/partial checkouts)
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
    console.log('dist directory not found — skipping Playwright local test');
    process.exit(0);
  }

  fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });

  const logs = [];
  let browser;

  try {
    console.log('Starting playwright-local-test.js');
    browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    page.on('console', (msg) => {
      try { logs.push({ type: msg.type(), text: msg.text() }); } catch (e) {}
      try { fs.appendFileSync(path.join(ARTIFACTS_DIR, 'console.log'), `[console:${msg.type()}] ${msg.text()}\n`); } catch (e) {}
    });

    page.on('pageerror', (err) => {
      try { logs.push({ type: 'pageerror', text: err.message }); } catch (e) {}
    });

    page.on('request', req => logs.push({ type: 'request', method: req.method(), url: req.url() }));
    page.on('response', res => logs.push({ type: 'response', status: res.status(), url: res.url() }));
    page.on('requestfailed', req => logs.push({ type: 'requestfailed', method: req.method(), url: req.url(), error: req.failure() && req.failure().errorText }));

    await page.goto(URL, { waitUntil: 'load', timeout: 30000 });
    // allow background activity to settle
    await page.waitForTimeout(1500);

    // try an additional route that often exists in this project
    try { await page.goto(new URL('candidatos.html', URL).toString(), { waitUntil: 'networkidle', timeout: 15000 }); } catch (e) { /* ignore */ }

    // capture artifacts
    const screenshotPath = path.join(ARTIFACTS_DIR, 'screenshot.png');
    const htmlPath = path.join(ARTIFACTS_DIR, 'page.html');
    const logsJsonPath = path.join(ARTIFACTS_DIR, 'console.json');

    try { await page.screenshot({ path: screenshotPath, fullPage: false }); } catch (e) { console.error('screenshot failed', e && e.message); }
    try { const html = await page.content(); fs.writeFileSync(htmlPath, html); } catch (e) { console.error('writing html failed', e && e.message); }
    try { fs.writeFileSync(logsJsonPath, JSON.stringify(logs, null, 2)); } catch (e) { console.error('writing logs failed', e && e.message); }

    console.log('PLAYWRIGHT_OK');
    console.log('SCREENSHOT:' + screenshotPath);
    console.log('HTML:' + htmlPath);
    console.log('LOGS_JSON:' + logsJsonPath);
    process.exit(0);
  } catch (err) {
    console.error('PLAYWRIGHT_ERROR', err && (err.message || err));
    // try to write best-effort diagnostic artifacts
    try { fs.writeFileSync(path.join(OUT_DIR, 'playwright-error.txt'), String(err.stack || err)); } catch (e) {}
    try { fs.writeFileSync(path.join(ARTIFACTS_DIR, 'console.json'), JSON.stringify(logs, null, 2)); } catch (e) {}
    try { if (browser) await browser.close(); } catch (e) {}
    process.exit(2);
  } finally {
    try { if (browser) await browser.close(); } catch (e) {}
  }
}

run().catch(err => {
  console.error('Uncaught error in playwright-local-test.js', err && err.stack);
  process.exit(2);
});
