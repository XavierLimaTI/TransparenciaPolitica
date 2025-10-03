(async () => {
  try {
    const argv = process.argv.slice(2);
    const key = argv[0] || process.env.PROXY_KEY || 'TEST_KEY';
    const admin = argv[1] || process.env.PROXY_ADMIN || null;

    const headers = { 'Content-Type': 'application/json' };
    if (admin) headers['x-proxy-admin'] = admin;

    const res = await fetch('http://localhost:3001/set-key', {
      method: 'POST',
      headers,
      body: JSON.stringify({ key })
    });
    const txt = await res.text();
    console.log('status', res.status);
    console.log(txt);
  } catch (err) {
    console.error('error', err);
  }
})();
