const fs = require('fs');const fs = require('fs');

const path = require('path');const path = require('path');

const { chromium } = require('playwright');const { chromium } = require('playwright');



(async () => {(async () => {

  const artifactsDir = path.resolve(process.cwd(), 'artifacts', 'playwright');  const url = 'http://127.0.0.1:8001/';

  try { fs.mkdirSync(artifactsDir, { recursive: true }); } catch (e) {}  const outDir = path.resolve(__dirname, '..', 'artifacts');

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  if (!fs.existsSync(path.resolve(process.cwd(), 'dist'))) {  const screenshotPath = path.join(outDir, 'screenshot.png');

    console.log('dist directory not found — skipping Playwright local test');  const logsPath = path.join(outDir, 'console-logs.json');

    process.exit(0);  const htmlSnippetPath = path.join(outDir, 'page-snippet.html');

  }

  const logs = [];

  console.log('Starting playwright-local-test.js');  try {

  const browser = await chromium.launch();    const browser = await chromium.launch();

  const context = await browser.newContext();    const page = await browser.newPage();

  const page = await context.newPage();

    page.on('console', (msg) => {

  // collect console and network logs      try { logs.push({ type: msg.type(), text: msg.text() }); } catch (e) {}

  const logs = [];    });

  page.on('console', msg => {    page.on('pageerror', (err) => {

    const line = `[console:${msg.type()}] ${msg.text()}`;      try { logs.push({ type: 'pageerror', text: err.message }); } catch (e) {}

    logs.push(line);    });

    console.log(line);

  });    await page.goto(url, { waitUntil: 'load', timeout: 30000 });

  page.on('request', req => logs.push(`[request] ${req.method()} ${req.url()}`));    // wait a bit for any async work

  page.on('response', res => logs.push(`[response] ${res.status()} ${res.url()}`));    await page.waitForTimeout(1500);

  page.on('requestfailed', req => logs.push(`[requestfailed] ${req.method()} ${req.url()} - ${req.failure() && req.failure().errorText}`));

    await page.screenshot({ path: screenshotPath, fullPage: true });

  try {    const content = await page.content();

    await page.goto('http://127.0.0.1:8001/', { waitUntil: 'networkidle', timeout: 30000 });

    // try a common route    fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2));

    try { await page.goto('http://127.0.0.1:8001/candidatos.html', { waitUntil: 'networkidle', timeout: 15000 }); } catch (e) { /* ignore */ }    fs.writeFileSync(htmlSnippetPath, content.slice(0, 5000));



    // wait briefly for background activity    console.log('PLAYWRIGHT_OK');

    await page.waitForTimeout(1500);    console.log('SCREENSHOT:' + screenshotPath);

    console.log('LOGS:' + logsPath);

    // write logs    console.log('HTML_SNIPPET:' + htmlSnippetPath);

    fs.writeFileSync(path.join(artifactsDir, 'console.log'), logs.join('\n'));    console.log('CONSOLE_LOGS_JSON_START');

    console.log(JSON.stringify(logs, null, 2));

    // capture screenshot and HTML    console.log('CONSOLE_LOGS_JSON_END');

    const screenshotPath = path.join(artifactsDir, 'screenshot.png');

    const htmlPath = path.join(artifactsDir, 'page.html');    await browser.close();

    try { await page.screenshot({ path: screenshotPath, fullPage: false }); } catch (e) { console.error('screenshot failed', e && e.message); }    process.exit(0);

    try { const html = await page.content(); fs.writeFileSync(htmlPath, html); } catch (e) { console.error('writing html failed', e && e.message); }  } catch (err) {

    console.error('PLAYWRIGHT_ERROR', err && err.message ? err.message : err);

    console.log('Playwright smoke completed, artifacts written to', artifactsDir);    try { fs.writeFileSync(logsPath, JSON.stringify(logs, null, 2)); } catch (e) {}

    await browser.close();    process.exit(2);

    process.exit(0);  }

  } catch (err) {})();

    console.error('Playwright error:', err && err.stack);
    try {
      const html = await page.content();
      fs.writeFileSync(path.join(artifactsDir, 'page-onerror.html'), html);
    } catch (e) {}
    try { await page.screenshot({ path: path.join(artifactsDir, 'screenshot-onerror.png') }); } catch(e){}
    try { fs.writeFileSync(path.join(artifactsDir, 'console-error.log'), logs.join('\n')); } catch(e){}
    try { await browser.close(); } catch(e){}
    process.exit(2);
  }
})();
