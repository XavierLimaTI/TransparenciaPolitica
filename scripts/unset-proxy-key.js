(async () => {
  try {
    const argv = process.argv.slice(2);
    const admin = argv[0] || process.env.PROXY_ADMIN || null;
    const headers = { 'Content-Type': 'application/json' };
    if (admin) headers['x-proxy-admin'] = admin;
    const res = await fetch('http://localhost:3001/unset-key', { method: 'POST', headers });
    console.log('status', res.status);
    console.log(await res.text());
  } catch (err) {
    console.error('error', err);
  }
})();
