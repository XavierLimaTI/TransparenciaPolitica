// debug-fetch.js - server-side diagnostics for API endpoints
const https = require('https');
const http = require('http');

function fetchUrl(url, _opts = {}) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: 10000 }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ url, status: res.statusCode, headers: res.headers, body: body.slice(0, 1000) });
      });
    });
    req.on('error', (err) => resolve({ url, error: err.message }));
    req.on('timeout', () => { req.destroy(); resolve({ url, error: 'timeout' }); });
  });
}

(async () => {
  console.log('Running server-side fetch diagnostics...');
  const targets = [
    'https://dadosabertos.camara.leg.br/api/v2/deputados?itens=5&pagina=1',
    'https://legis.senado.leg.br/dadosabertos/senador/lista',
    'http://localhost:3001/despesas?pagina=1&itens=1'
  ];

  for (const t of targets) {
    try {
      const r = await fetchUrl(t);
      if (r.error) {
        console.log('ERROR', t, r.error);
      } else {
        console.log('\n---');
        console.log('URL:', r.url);
        console.log('Status:', r.status);
        const ct = (r.headers && (r.headers['content-type'] || r.headers['Content-Type'])) || '(none)';
        console.log('Content-Type:', ct);
        console.log('Body (first 1000 chars):\n', (r.body || '').replace(/\n/g, '\\n').slice(0, 1000));
        // If headers undefined, print whole response for debugging
        if (!r.headers) console.log('Full response object:', JSON.stringify(r));
      }
    } catch (err) {
      console.error('Fetch failed for', t, err);
    }
  }
})();
