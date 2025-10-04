// Lightweight proxy using native Node.js APIs (no express) for local development
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const DATA_DIR = path.resolve(__dirname);
const KEY_FILE = path.join(DATA_DIR, 'portal_key.json');
const PORT = process.env.PORT || 3001;

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function sendJSON(res, status, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(s);
}

async function forwardFetch(targetUrl, req, extraHeaders = {}) {
  const headers = { Accept: 'application/json', ...extraHeaders };
  try {
    const init = { method: req.method, headers };
    const resp = await fetch(targetUrl, init);
    const text = await resp.text();
    return { status: resp.status, headers: resp.headers, body: text };
  } catch (err) {
    return { error: String(err) };
  }
}

const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,x-proxy-admin',
    });
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  try {
    if (pathname === '/health' && req.method === 'GET') {
      let keyPresent = false;
      try { if (fs.existsSync(KEY_FILE)) { const p = JSON.parse(fs.readFileSync(KEY_FILE,'utf8')||'{}'); if (p && p.key) keyPresent = true; } } catch(e){}
      return sendJSON(res, 200, { status: 'ok', portalKey: keyPresent });
    }

    if (pathname === '/set-key' && req.method === 'POST') {
      const body = await readBody(req);
      let parsed = {};
      try { parsed = JSON.parse(body || '{}'); } catch (e) { return sendJSON(res, 400, { error: 'invalid_json' }); }
      const key = parsed.key;
      if (!key) return sendJSON(res, 400, { error: 'missing_key' });
      try { fs.writeFileSync(KEY_FILE, JSON.stringify({ key }, null, 2), 'utf8'); } catch (e) { return sendJSON(res, 500, { error: 'persist_failed', detail: String(e) }); }
      return sendJSON(res, 200, { ok: true });
    }

    if (pathname === '/unset-key' && req.method === 'POST') {
      try { if (fs.existsSync(KEY_FILE)) fs.unlinkSync(KEY_FILE); } catch (e) { /* ignore */ }
      return sendJSON(res, 200, { ok: true });
    }

    // Proxy despesas
    if (pathname === '/despesas' && req.method === 'GET') {
      let portalKey = null;
      try { if (fs.existsSync(KEY_FILE)) { const p = JSON.parse(fs.readFileSync(KEY_FILE,'utf8')||'{}'); portalKey = p && p.key; } } catch(e){}
      if (!portalKey) return sendJSON(res, 401, { error: 'API_KEY_MISSING', message: 'Portal API key not configured on proxy' });

      const base = 'https://api.portaldatransparencia.gov.br/api-de-dados/despesas';
      const target = new URL(base);
      for (const [k,v] of url.searchParams) target.searchParams.append(k, v);

      const out = await forwardFetch(target.toString(), req, { 'chave-api-dados': portalKey });
      if (out.error) return sendJSON(res, 502, { error: 'proxy_error', detail: out.error });
      res.writeHead(out.status, { 'Content-Type': out.headers.get('content-type') || 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(out.body);
    }

    // Dev-forward for camara and senado
    if (pathname.startsWith('/camara')) {
      const targetBase = 'https://dadosabertos.camara.leg.br/api/v2';
      const suffix = pathname.replace(/^\/camara/, '') || '' + url.search;
      const target = targetBase + suffix + url.search;
      const out = await forwardFetch(target, req);
      if (out.error) return sendJSON(res, 502, { error: 'proxy_error', detail: out.error });
      res.writeHead(out.status, { 'Content-Type': out.headers.get('content-type') || 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(out.body);
    }

    if (pathname.startsWith('/senado')) {
      const targetBase = 'https://legis.senado.leg.br/dadosabertos';
      const suffix = pathname.replace(/^\/senado/, '') || '' + url.search;
      const target = targetBase + suffix + url.search;
      const out = await forwardFetch(target, req);
      if (out.error) return sendJSON(res, 502, { error: 'proxy_error', detail: out.error });
      res.writeHead(out.status, { 'Content-Type': out.headers.get('content-type') || 'application/json', 'Access-Control-Allow-Origin': '*' });
      return res.end(out.body);
    }

    // data-files listing
    if (pathname === '/data-files' && req.method === 'GET') {
      try {
        const dataDir = path.resolve(__dirname, '..', 'resources', 'data');
        if (!fs.existsSync(dataDir)) return sendJSON(res, 200, { files: [] });
        function walk(dir, base = '') {
          const out = [];
          for (const f of fs.readdirSync(dir)) {
            const p = path.join(dir, f);
            const stat = fs.statSync(p);
            if (stat.isDirectory()) out.push(...walk(p, path.join(base, f)));
            else out.push(path.join(base, f).replace(/\\/g, '/'));
          }
          return out;
        }
        const files = walk(dataDir, '');
        return sendJSON(res, 200, { files });
      } catch (e) { return sendJSON(res, 500, { error: 'internal', detail: String(e) }); }
    }

    // default: not found
    return sendJSON(res, 404, { error: 'not_found' });
  } catch (err) {
    console.error('proxy-light error', err);
    return sendJSON(res, 500, { error: 'internal', detail: String(err) });
  }
});

server.listen(PORT, () => console.log(`Proxy-light listening on http://localhost:${PORT}`));
