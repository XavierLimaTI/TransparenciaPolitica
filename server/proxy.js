const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const KEY_FILE = path.resolve(__dirname, 'portal_key.json');

// DB integration (optional)
let db = null;
try {
  db = require('./db');
  if (db && typeof db.init === 'function') db.init();
} catch (e) {
  console.warn('Could not initialize DB module:', e && e.message);
  db = null;
}

// Auto-migrate existing portal_key.json into DB/json store on startup (best-effort)
try {
  if (db) {
    const fileKeyExists = fs.existsSync(KEY_FILE);
    if (fileKeyExists) {
      try {
        const raw = fs.readFileSync(KEY_FILE, 'utf8');
        const parsed = JSON.parse(raw || '{}');
        if (parsed && parsed.key) {
          const existing = db.getPortalKey && db.getPortalKey();
          if (!existing) {
            db.setPortalKey && db.setPortalKey(parsed.key);
            console.log('Migrated portal_key.json into DB store');
          }
        }
      } catch (e) {
        console.warn('Failed to migrate portal_key.json:', e && e.message);
      }
    }
  }
} catch (e) {}

// Load persisted key if present (DB first, then file)
let portalKey = process.env.PORTAL_API_KEY || null;
try {
  if (db && typeof db.getPortalKey === 'function') {
    const key = db.getPortalKey();
    if (key) portalKey = key;
  } else if (fs.existsSync(KEY_FILE)) {
    const raw = fs.readFileSync(KEY_FILE, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    if (parsed && parsed.key) portalKey = parsed.key;
  }
} catch (err) { console.warn('Could not load persisted portal key:', err && err.message); }

// Optional admin token to protect admin endpoints
const ADMIN_TOKEN = process.env.PROXY_ADMIN_TOKEN || null;

// Helper to persist portal key
function persistPortalKey(key) {
  try {
    if (db && typeof db.setPortalKey === 'function') db.setPortalKey(key);
    else fs.writeFileSync(KEY_FILE, JSON.stringify({ key }, null, 2), { encoding: 'utf8' });
  } catch (e) { console.warn('Could not persist portal key:', e && e.message); }
}

app.post('/set-key', (req, res) => {
  if (ADMIN_TOKEN) {
    const provided = req.get('x-proxy-admin');
    if (!provided || provided !== ADMIN_TOKEN) return res.status(403).json({ error: 'forbidden', message: 'invalid admin token' });
  }
  const { key } = req.body || {};
  if (!key) return res.status(400).json({ error: 'missing_key' });
  portalKey = key;
  persistPortalKey(portalKey);
  return res.json({ ok: true });
});

app.post('/unset-key', (req, res) => {
  if (ADMIN_TOKEN) {
    const provided = req.get('x-proxy-admin');
    if (!provided || provided !== ADMIN_TOKEN) return res.status(403).json({ error: 'forbidden', message: 'invalid admin token' });
  }
  portalKey = null;
  try { if (db && typeof db.unsetPortalKey === 'function') db.unsetPortalKey(); if (fs.existsSync(KEY_FILE)) fs.unlinkSync(KEY_FILE); } catch (e) {}
  return res.json({ ok: true });
});

// Despesas endpoint: try upstream with key, fallback to ingested JSON
app.get('/despesas', async (req, res) => {
  const fetchFn = (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') ? globalThis.fetch : null;
  const base = 'https://api.portaldatransparencia.gov.br/api-de-dados/despesas';
  const target = new URL(base);
  Object.keys(req.query || {}).forEach(k => target.searchParams.append(k, req.query[k]));

  if (portalKey && fetchFn) {
    try {
      const r = await fetchFn(target.toString(), { headers: { 'chave-api-dados': portalKey } });
      if (r.ok) {
        const body = await r.text();
        res.header('Content-Type', r.headers.get('content-type') || 'application/json');
        return res.status(r.status).send(body);
      }
      console.warn('Upstream despesas failed with status', r.status);
    } catch (err) { console.warn('Upstream despesas fetch error', err && err.message); }
  }

  // Fallback to local ingested JSON
  try {
    const ingestedDir = path.resolve(__dirname, '..', 'resources', 'data', 'ingested');
    if (!fs.existsSync(ingestedDir)) return res.status(portalKey ? 502 : 401).json({ error: portalKey ? 'upstream_failed' : 'API_KEY_MISSING', message: 'No local data available' });
    const files = fs.readdirSync(ingestedDir);
    const found = files.find(fn => fn.toLowerCase().includes('despesas'));
    if (!found) return res.status(portalKey ? 502 : 401).json({ error: portalKey ? 'upstream_failed' : 'API_KEY_MISSING', message: 'No local data available' });
    const jsonPath = path.join(ingestedDir, found);
    const content = JSON.parse(fs.readFileSync(jsonPath, 'utf8') || '[]');
    let results = Array.isArray(content) ? content : (content.rows || []);
    // filters
    if (req.query.cpf) {
      const cpfNorm = String(req.query.cpf).replace(/\D/g, '');
      results = results.filter(d => (d.cnpjCpf || '').toString().replace(/\D/g, '').includes(cpfNorm));
    } else if (req.query.nome) {
      const nome = String(req.query.nome).toLowerCase();
      results = results.filter(d => (d.favorecido || d.descricao || '').toString().toLowerCase().includes(nome));
    }
    const pagina = Math.max(1, parseInt(req.query.pagina || req.query.page || '1', 10));
    const itens = Math.max(1, parseInt(req.query.itens || req.query.pageSize || '10', 10));
    const start = (pagina - 1) * itens;
    const pageItems = results.slice(start, start + itens);
    return res.json(pageItems);
  } catch (e) { return res.status(500).json({ error: 'internal', detail: String(e) }); }
});

// Forwards for camara and senado
app.use('/camara', async (req, res) => {
  try {
    const targetBase = 'https://dadosabertos.camara.leg.br/api/v2';
    const suffix = req.path || '/';
    const target = new URL(targetBase + suffix);
    Object.keys(req.query || {}).forEach(k => target.searchParams.append(k, req.query[k]));
    const fetchFn = (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') ? globalThis.fetch : require('node-fetch');
    const r = await fetchFn(target.toString(), { method: req.method, headers: { 'accept': 'application/json' } });
    const body = await r.text();
    res.header('Content-Type', r.headers.get('content-type') || 'application/json');
    return res.status(r.status).send(body);
  } catch (e) { return res.status(502).json({ error: 'proxy_error', detail: String(e) }); }
});

app.use('/senado', async (req, res) => {
  try {
    const targetBase = 'https://legis.senado.leg.br/dadosabertos';
    const suffix = req.path || '/';
    const target = new URL(targetBase + suffix);
    Object.keys(req.query || {}).forEach(k => target.searchParams.append(k, req.query[k]));
    const fetchFn = (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') ? globalThis.fetch : require('node-fetch');
    const r = await fetchFn(target.toString(), { method: req.method, headers: { 'accept': 'application/json' } });
    const body = await r.text();
    res.header('Content-Type', r.headers.get('content-type') || 'application/json');
    return res.status(r.status).send(body);
  } catch (e) { return res.status(502).json({ error: 'proxy_error', detail: String(e) }); }
});

app.get('/data-files', (req, res) => {
  try {
    const dataDir = path.resolve(__dirname, '..', 'resources', 'data');
    if (!fs.existsSync(dataDir)) return res.json({ files: [] });
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
    return res.json({ files });
  } catch (e) { return res.status(500).json({ error: 'internal', detail: String(e) }); }
});

// Extract zip (kept from original)
app.post('/extract-zip', (req, res) => {
  const body = req.body || {};
  const zipPath = body.path;
  if (!zipPath) return res.status(400).json({ error: 'missing_path' });
  const dataDir = path.resolve(__dirname, '..', 'resources', 'data');
  const absZip = path.join(dataDir, zipPath);
  if (!absZip.startsWith(dataDir)) return res.status(400).json({ error: 'invalid_path' });
  if (!fs.existsSync(absZip)) return res.status(404).json({ error: 'not_found' });
  const extractDir = absZip + '_extracted';
  try {
    const { execSync } = require('child_process');
    try {
      execSync(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${absZip.replace(/\\'/g, "''")}' -DestinationPath '${extractDir.replace(/\\'/g, "''")}' -Force"`, { stdio: 'ignore' });
    } catch (e) {
      try { execSync(`unzip -o "${absZip}" -d "${extractDir}"`, { stdio: 'ignore' }); } catch (e2) { console.error('Extraction failed', e, e2); return res.status(500).json({ error: 'extract_failed', detail: String(e) }); }
    }
    try {
      const csvFiles = [];
      function walkForCsv(dir) { for (const f of fs.readdirSync(dir)) { const p = path.join(dir, f); const st = fs.statSync(p); if (st.isDirectory()) walkForCsv(p); else if (f.toLowerCase().endsWith('.csv')) csvFiles.push(p); } }
      walkForCsv(extractDir);
      for (const csv of csvFiles) {
        try {
          const data = fs.readFileSync(csv, 'utf8');
          const rows = data.split(/\r?\n/).filter(Boolean).length;
          const rel = path.relative(path.resolve(__dirname, '..', 'resources', 'data'), csv).replace(/\\/g, '/');
          if (db && typeof db.upsertDataset === 'function') db.upsertDataset(rel, 1, rows);
        } catch (e) { console.warn('Could not ingest CSV', csv, e && e.message); }
      }
    } catch (e) { console.warn('Post-extract ingestion failed', e && e.message); }
    return res.json({ ok: true, extractedTo: extractDir });
  } catch (err) { console.error('extract-zip error', err); return res.status(500).json({ error: 'internal' }); }
});

// Admin endpoints (kept)
app.get('/admin/key', (req, res) => {
  if (ADMIN_TOKEN) { const provided = req.get('x-proxy-admin'); if (!provided || provided !== ADMIN_TOKEN) return res.status(403).json({ error: 'forbidden', message: 'invalid admin token' }); }
  try { const keyPresent = !!portalKey; return res.json({ keyPresent }); } catch (e) { return res.status(500).json({ error: 'internal' }); }
});

app.get('/admin/datasets', (req, res) => {
  if (ADMIN_TOKEN) { const provided = req.get('x-proxy-admin'); if (!provided || provided !== ADMIN_TOKEN) return res.status(403).json({ error: 'forbidden', message: 'invalid admin token' }); }
  try { if (!db) return res.json({ datasets: [] }); const d = db.listDatasets && db.listDatasets(); return res.json({ datasets: d }); } catch (e) { return res.status(500).json({ error: 'internal' }); }
});

app.post('/admin/dataset/delete', (req, res) => {
  if (ADMIN_TOKEN) { const provided = req.get('x-proxy-admin'); if (!provided || provided !== ADMIN_TOKEN) return res.status(403).json({ error: 'forbidden', message: 'invalid admin token' }); }
  try {
    const { path: p, deleteFiles } = req.body || {};
    if (!p) return res.status(400).json({ error: 'missing_path' });
    if (!db) return res.status(400).json({ error: 'no_db' });
    db.deleteDataset && db.deleteDataset(p);
    if (deleteFiles) {
      const abs = path.resolve(__dirname, '..', 'resources', 'data', p);
      if (abs.startsWith(path.resolve(__dirname, '..', 'resources', 'data'))) {
        try { if (fs.existsSync(abs)) fs.unlinkSync(abs); } catch (e) { console.warn('Could not delete file', abs, e && e.message); }
      }
    }
    return res.json({ ok: true });
  } catch (e) { return res.status(500).json({ error: 'internal' }); }
});

app.post('/admin/ingest', (req, res) => {
  if (ADMIN_TOKEN) { const provided = req.get('x-proxy-admin'); if (!provided || provided !== ADMIN_TOKEN) return res.status(403).json({ error: 'forbidden', message: 'invalid admin token' }); }
  try {
    if (!db) return res.status(400).json({ error: 'no_db' });
    const dataDir = path.resolve(__dirname, '..', 'resources', 'data');
    function walk(dir) { const out = []; for (const f of fs.readdirSync(dir)) { const p = path.join(dir, f); const st = fs.statSync(p); if (st.isDirectory()) out.push(...walk(p)); else if (f.toLowerCase().endsWith('.csv')) out.push(p); } return out; }
    if (!fs.existsSync(dataDir)) return res.json({ ok: true, ingested: 0 });
    const csvs = walk(dataDir);
    let count = 0;
    for (const csv of csvs) {
      try { const data = fs.readFileSync(csv, 'utf8'); const rows = data.split(/\r?\n/).filter(Boolean).length; const rel = path.relative(dataDir, csv).replace(/\\/g, '/'); db.upsertDataset && db.upsertDataset(rel, 1, rows); count++; } catch (e) { console.warn('Ingest failed for', csv, e && e.message); }
    }
    return res.json({ ok: true, ingested: count });
  } catch (e) { return res.status(500).json({ error: 'internal' }); }
});

app.get('/health', (req, res) => {
  try { return res.status(200).json({ status: 'ok', portalKey: !!portalKey }); } catch (e) { return res.status(500).json({ status: 'error' }); }
});

// Mount admin endpoints (uses ADMIN_TOKEN env var)
try {
  const adminRouter = require('./admin');
  app.use(adminRouter);
} catch (e) {
  console.warn('Could not load admin routes:', e && e.message);
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Portal proxy server listening on http://localhost:${PORT}`));
