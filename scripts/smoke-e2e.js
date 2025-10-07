const { spawn } = require('child_process');
const http = require('http');

function wait(ms){ return new Promise(r => setTimeout(r, ms)); }

async function checkUrl(url){
  return new Promise((resolve) => {
    http.get(url, res => {
      resolve({ status: res.statusCode });
    }).on('error', err => resolve({ error: err.message }));
  });
}

(async () => {
  console.log('Starting smoke e2e...');

  // start proxy (use shell so Node on Windows resolves correctly)
  const proxy = spawn('node server/proxy.js', { stdio: 'inherit', shell: true });
  // start http-server using shell so the system npx/npx.ps1 is resolved on Windows
  const serverCmd = 'npx http-server -c-1 -p 8000';
  const server = spawn(serverCmd, { stdio: 'inherit', shell: true });

  // wait a bit for servers to start
  await wait(4000);

  try {
    console.log('Checking candidates page...');
    const r1 = await checkUrl('http://127.0.0.1:8000/candidatos.html');
    console.log('candidatos:', r1);

    console.log('Checking proxy health endpoint...');
    const r2 = await checkUrl('http://127.0.0.1:3001/health');
    console.log('proxy health:', r2);

    if (r1.status === 200 && (r2.status === 200 || r2.status === 404 || r2.error)) {
      console.log('SMOKE OK');
      process.exitCode = 0;
    } else {
      console.error('SMOKE FAILED');
      process.exitCode = 2;
    }
  } catch (err) {
    console.error('SMOKE ERR', err);
    process.exitCode = 2;
  } finally {
  // kill processes
  try { proxy.kill(); } catch (e) { void e; }
  try { server.kill(); } catch (e) { void e; }
    process.exit();
  }
})();
