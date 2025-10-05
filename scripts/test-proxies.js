// Test both proxy implementations: proxy-light and proxy-express
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function fetchUrl(url, timeout = 10000) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8').slice(0,1000) }));
    });
    req.on('error', (e) => resolve({ error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'timeout' }); });
  });
}

async function runProxy(command, args, label, port = 3001) {
  console.log(`Starting ${label} -> ${command} ${args.join(' ')}`);
  const proc = spawn(command, args, { cwd: path.resolve(__dirname,'..'), stdio: ['ignore','inherit','inherit'] });
  // wait for health to respond
  const url = `http://localhost:${port}/health`;
  for (let i=0;i<30;i++) {
    await wait(500);
    const r = await fetchUrl(url).catch(()=>({ error: 'fetchfail' }));
    if (r && (r.status === 200 || r.body)) { console.log(`${label} health ok`); break; }
    if (i===29) { console.error(`${label} did not start`); proc.kill(); return { ok:false }; }
  }

  // test despesas
  const despesas = await fetchUrl(`http://localhost:${port}/despesas?pagina=1&itens=1`);
  console.log(`${label} /despesas ->`, despesas && (despesas.status || despesas.error));
  // test camara
  const camara = await fetchUrl(`http://localhost:${port}/camara/deputados?itens=1`);
  console.log(`${label} /camara ->`, camara && (camara.status || camara.error));

  proc.kill();
  return { ok: true };
}

(async ()=>{
  try {
    const light = await runProxy('node', ['server/proxy-light.js'], 'proxy-light', 3001);
    const express = await runProxy('node', ['server/proxy-express.js'], 'proxy-express', 3001);
    if (!light.ok || !express.ok) process.exit(2);
    console.log('Both proxies tested OK');
    process.exit(0);
  } catch (e) { console.error('Test proxies failed', e); process.exit(3); }
})();
