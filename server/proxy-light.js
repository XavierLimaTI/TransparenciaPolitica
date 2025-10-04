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
  // prefer global fetch if available (Node 18+). If not present, fail fast.
  const fetchFn = (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') ? globalThis.fetch : null;
  if (!fetchFn) return { error: 'fetch_not_available' };

  const headers = Object.assign({}, extraHeaders || {});
  // copy some incoming headers that are useful (but omit Host)
  try {
    for (const h of ['accept', 'content-type', 'user-agent']) {
      const v = req.headers && req.headers[h];
      if (v) headers[h] = v;
    }
  } catch (e) {}

  const init = { method: req.method, headers };
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const body = await readBody(req);
      if (body) init.body = body;
    }

    const resp = await fetchFn(targetUrl, init);
    const text = await resp.text();
    return { status: resp.status, headers: resp.headers, body: text };
  } catch (err) {
    console.error('forwardFetch error', targetUrl, err && err.message);
    return { error: String(err) };
  }
}

function loadLocalDespesasRows() {
  try {
    const manifestPath = path.resolve(__dirname, '..', 'resources', 'data', 'manifest.json');
    if (!fs.existsSync(manifestPath)) return null;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8') || '{}');
    if (!manifest || !Array.isArray(manifest.files)) return null;
    // find an entry that references despesas.csv or has 'despesas' in filename
    const candidate = manifest.files.find(f => {
      const v = typeof f === 'string' ? f : (f.csv || f.json || '');
      return v.toLowerCase().includes('despesas');
    });
    if (!candidate) return null;
    let jsonPath;
    if (typeof candidate === 'string') jsonPath = path.resolve(__dirname, '..', 'resources', 'data', candidate);
    else jsonPath = path.resolve(__dirname, '..', candidate.json ? candidate.json.replace(/^\//,'') : ('resources/data/ingested/' + (candidate.csv.replace(/\//g,'__') + '.json')));
    // if json path doesn't exist, try ingested folder
    if (!fs.existsSync(jsonPath)) {
      const ingestedDir = path.resolve(__dirname, '..', 'resources', 'data', 'ingested');
      const files = fs.existsSync(ingestedDir) ? fs.readdirSync(ingestedDir) : [];
      const found = files.find(fn => fn.toLowerCase().includes('despesas'));
      if (!found) return null;
      jsonPath = path.join(ingestedDir, found);
    }
    if (!fs.existsSync(jsonPath)) return null;
    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8') || '{}');
    // content may be { source, count, rows } or an array
    if (Array.isArray(content)) return content;
    if (content && Array.isArray(content.rows)) return content.rows;
    // if content has top-level array-like properties, attempt to guess
    return null;
  } catch (e) {
    console.warn('loadLocalDespesasRows failed', e && e.message);
    return null;
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

      const base = 'https://api.portaldatransparencia.gov.br/api-de-dados/despesas';
      const target = new URL(base);
      for (const [k,v] of url.searchParams) target.searchParams.append(k, v);

      // If we have a portalKey try upstream first
      if (portalKey) {
        const out = await forwardFetch(target.toString(), req, { 'chave-api-dados': portalKey });
        if (!out.error && out.status && out.status < 400) {
          res.writeHead(out.status, { 'Content-Type': out.headers.get('content-type') || 'application/json', 'Access-Control-Allow-Origin': '*' });
          return res.end(out.body);
        }
        // If upstream returned 401/403 or other auth error, fall back to local ingested CSV
        if (out.error || (out.status && (out.status === 401 || out.status === 403))) {
          console.warn('Upstream despesas failed, falling back to local ingested data', out && out.status, out && out.error);
        }
      }

      // Fallback: serve from local ingested JSON if available
      const rows = loadLocalDespesasRows();
      if (!rows) return sendJSON(res, portalKey ? 502 : 401, { error: portalKey ? 'upstream_failed' : 'API_KEY_MISSING', message: 'No local data available' });

      // Apply basic filtering and pagination
      let results = rows;
      const q = Object.fromEntries(url.searchParams.entries());
      if (q.cpf) {
        const cpfNorm = String(q.cpf).replace(/\D/g, '');
        results = results.filter(d => (d.cnpjCpf || '').toString().replace(/\D/g, '').includes(cpfNorm));
      } else if (q.nome) {
        const nome = String(q.nome).toLowerCase();
        results = results.filter(d => (d.favorecido || d.descricao || '').toString().toLowerCase().includes(nome));
      }

      const pagina = Math.max(1, parseInt(q.pagina || q.page || '1', 10));
      const itens = Math.max(1, parseInt(q.itens || q.pageSize || '10', 10));
      const start = (pagina - 1) * itens;
      const pageItems = results.slice(start, start + itens);

      return sendJSON(res, 200, pageItems);
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
