const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let portalKey = process.env.PORTAL_API_KEY || null;

app.post('/set-key', (req, res) => {
  const { key } = req.body || {};
  if (!key) return res.status(400).json({ error: 'missing_key' });
  portalKey = key;
  return res.json({ ok: true });
});

// Proxy despesas endpoint
app.get('/despesas', async (req, res) => {
  if (!portalKey) return res.status(401).json({ error: 'API_KEY_MISSING', message: 'Portal API key not configured on proxy' });

  try {
    const base = 'https://api.portaldatransparencia.gov.br/api-de-dados/despesas';
    const url = new URL(base);
    Object.keys(req.query || {}).forEach(k => url.searchParams.append(k, req.query[k]));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json', 'chave-api-dados': portalKey }
    });

    const text = await response.text();
    res.status(response.status).send(text);
  } catch (err) {
    console.error('Proxy error', err);
    res.status(500).json({ error: 'proxy_error', detail: String(err) });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Portal proxy server listening on http://localhost:${PORT}`));
