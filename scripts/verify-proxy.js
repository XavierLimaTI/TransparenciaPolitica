(async () => {
  // Ensure fetch exists in Node environments
  if (typeof fetch === 'undefined') {
    try {
      global.fetch = require('node-fetch');
    } catch (e) {
      console.error('Global fetch is not available and node-fetch could not be loaded. Please run this script with Node 18+ or install node-fetch.');
      process.exit(1);
    }
  }

  const argv = process.argv.slice(2);
  const key = argv[0] || process.env.PROXY_KEY || 'VERIFY_KEY';
  const admin = argv[1] || process.env.PROXY_ADMIN || null;
  const headers = { 'Content-Type': 'application/json' };
  if (admin) headers['x-proxy-admin'] = admin;

  async function doProbe() {
    try {
      const res = await fetch('http://localhost:3001/despesas?pagina=1&itens=1');
      return { status: res.status, text: await res.text() };
    } catch (err) {
      return { error: String(err) };
    }
  }

  console.log('1) initial probe');
  console.log(await doProbe());

  console.log('\n2) set-key');
  try {
    const res = await fetch('http://localhost:3001/set-key', { method: 'POST', headers, body: JSON.stringify({ key }) });
    console.log('status', res.status, 'body', await res.text());
  } catch (err) { console.error('set-key error', err); }

  console.log('\n3) probe after set-key');
  console.log(await doProbe());

  console.log('\n4) unset-key');
  try {
    const res = await fetch('http://localhost:3001/unset-key', { method: 'POST', headers });
    console.log('status', res.status, 'body', await res.text());
  } catch (err) { console.error('unset-key error', err); }

  console.log('\n5) final probe');
  console.log(await doProbe());
})();
