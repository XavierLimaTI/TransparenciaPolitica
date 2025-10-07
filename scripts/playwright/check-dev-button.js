const { chromium } = require('playwright');
const fs = require('fs');
const http = require('http');
const path = require('path');

async function startTinyServer(port=8000) {
  return new Promise((resolve, reject) => {
    const srv = http.createServer((req, res) => {
      let reqPath = req.url.split('?')[0];
      if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
      let f = path.join(process.cwd(), reqPath);
      fs.stat(f, (e, st) => {
        if (e) { res.statusCode = 404; res.end('Not found'); return; }
        if (st.isDirectory()) {
          const idx = path.join(f, 'index.html');
          return fs.stat(idx, (ei, _sti) => {
            if (ei) { res.statusCode = 404; res.end('Not found'); return; }
            res.setHeader('Access-Control-Allow-Origin', '*');
            fs.createReadStream(idx).pipe(res);
          });
        }
        res.setHeader('Access-Control-Allow-Origin', '*');
        fs.createReadStream(f).pipe(res);
      });
    });
    srv.listen(port, () => resolve(srv));
    srv.on('error', reject);
  });
}

async function check(url, launchOptions={}) {
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage();
  try {
    console.log('Visiting', url);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // wait a short time for scripts to run
    await page.waitForTimeout(500);
    const hasBtnEl = await page.$('#devLoadFixtureBtn');
    const hasBtn = !!hasBtnEl;
    console.log('devLoadFixtureBtn present:', hasBtn);
    if (hasBtn) {
      // try clicking it to trigger loadLocalFixture
      try {
        await hasBtnEl.click();
        console.log('Clicked dev button');
        // wait for potential console logs / network activity
        await page.waitForTimeout(1000);
      } catch (e) {
        console.warn('Click failed:', e && e.message);
      }
    }
    // also test calling window.loadLocalFixture directly
    try {
      const ok = await page.evaluate(async () => {
        if (typeof window.loadLocalFixture === 'function') {
          try { return await window.loadLocalFixture(); } catch (e) { return false; }
        }
        return null;
      });
      console.log('window.loadLocalFixture() returned:', ok);
    } catch (e) {
      console.warn('Eval loadLocalFixture failed:', e && e.message);
    }
  } finally {
    await browser.close();
  }
}

(async () => {
  const base = 'http://localhost:8000';
  let srv = null;
  try {
    srv = await startTinyServer(8000);
    console.log('tiny server started on 8000');
  // existing localhost behavior
  await check(`${base}/?dev=1`);
  await check(base);

  // simulate non-local hostname mapped to 127.0.0.1 using host-resolver-rules
  const simulatedHost = 'example.local';
  const launchOptions = { args: [`--host-resolver-rules=MAP ${simulatedHost} 127.0.0.1`] };
  console.log('Simulating non-local hostname', simulatedHost);
  await check(`http://${simulatedHost}:8000/?dev=1`, launchOptions);
  await check(`http://${simulatedHost}:8000`, launchOptions);
    process.exit(0);
  } catch (e) {
    console.error('Error during check:', e);
  try { if (srv) srv.close(); } catch (er) { void er; }
    process.exit(2);
  } finally {
  try { if (srv) srv.close(); } catch (e) { void e; }
  }
})();
