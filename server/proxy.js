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
  db.init();
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
          // only set in DB if not already present
          const existing = db.getPortalKey();
          if (!existing) {
            db.setPortalKey(parsed.key);
            console.log('Migrated portal_key.json into DB store');
          }
        }
      } catch (e) {
        console.warn('Failed to migrate portal_key.json:', e && e.message);
      }
    }
  }
} catch (e) {
  // ignore
}

// Load persisted key if present (DB first, then file)
let portalKey = process.env.PORTAL_API_KEY || null;
try {
  if (db) {
    const key = db.getPortalKey();
    if (key) portalKey = key;
  } else if (fs.existsSync(KEY_FILE)) {
    const raw = fs.readFileSync(KEY_FILE, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    if (parsed && parsed.key) portalKey = parsed.key;
  }
} catch (err) {
  console.warn('Could not load persisted portal key:', err && err.message);
}

// Optional admin token to protect the /set-key endpoint
const ADMIN_TOKEN = process.env.PROXY_ADMIN_TOKEN || null;

app.post('/set-key', (req, res) => {
  // If admin token configured, require header x-proxy-admin
  if (ADMIN_TOKEN) {
    const provided = req.get('x-proxy-admin');
    if (!provided || provided !== ADMIN_TOKEN) {
      return res.status(403).json({ error: 'forbidden', message: 'invalid admin token' });
    }
  }

  const { key } = req.body || {};
  if (!key) return res.status(400).json({ error: 'missing_key' });
  portalKey = key;

  // persist to DB or disk (best-effort)
  try {
    if (db) {
      db.setPortalKey(portalKey);
    } else {
      fs.writeFileSync(KEY_FILE, JSON.stringify({ key: portalKey }, null, 2), { encoding: 'utf8' });
    }
  } catch (err) {
    console.warn('Could not persist portal key:', err && err.message);
  }

  return res.json({ ok: true });
});

// Unset / remove persisted key
app.post('/unset-key', (req, res) => {
  if (ADMIN_TOKEN) {
    const provided = req.get('x-proxy-admin');
    if (!provided || provided !== ADMIN_TOKEN) {
      return res.status(403).json({ error: 'forbidden', message: 'invalid admin token' });
    }
  }

  portalKey = null;
  try {
    if (db) {
      db.unsetPortalKey();
    }
    if (fs.existsSync(KEY_FILE)) fs.unlinkSync(KEY_FILE);
  } catch (err) {
    console.warn('Could not remove persisted portal key:', err && err.message);
  }

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

// Development proxy for Câmara dos Deputados and Senado to avoid CORS in local preview
app.use('/camara', async (req, res) => {
  try {
    const targetBase = 'https://dadosabertos.camara.leg.br/api/v2';
    const targetUrl = targetBase + req.originalUrl.replace(/^\/camara/, '');
    const response = await fetch(targetUrl, { method: req.method, headers: { Accept: 'application/json' } });
    const text = await response.text();
    res.status(response.status).set('content-type', response.headers.get('content-type') || 'application/json').send(text);
  } catch (err) {
    console.error('Camara proxy error', err);
    res.status(500).json({ error: 'proxy_error', detail: String(err) });
  }
});

app.use('/senado', async (req, res) => {
  try {
    const targetBase = 'https://legis.senado.leg.br/dadosabertos';
    const targetUrl = targetBase + req.originalUrl.replace(/^\/senado/, '');
    const response = await fetch(targetUrl, { method: req.method, headers: { Accept: 'application/json' } });
    const text = await response.text();
    res.status(response.status).set('content-type', response.headers.get('content-type') || 'application/json').send(text);
  } catch (err) {
    console.error('Senado proxy error', err);
    res.status(500).json({ error: 'proxy_error', detail: String(err) });
  }
});

// List dataset files under resources/data
app.get('/data-files', (req, res) => {
  try {
    const dataDir = path.resolve(__dirname, '..', 'resources', 'data');
    if (!fs.existsSync(dataDir)) return res.json({ files: [] });
    function walk(dir, base = '') {
      const out = [];
      for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
          out.push(...walk(p, path.join(base, f)));
        } else {
          out.push(path.join(base, f).replace(/\\\\/g, '/'));
        }
      }
      return out;
    }
    const files = walk(dataDir, '');
    return res.json({ files });
  } catch (err) {
    console.error('data-files error', err);
    return res.status(500).json({ error: 'internal' });
  }
});

// Extract a ZIP present under resources/data on the server.
// Body: { path: '20250101_Despesas.zip' }
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
    // Use PowerShell Expand-Archive on Windows when available
    const { execSync } = require('child_process');
    try {
      execSync(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${absZip.replace(/\\'/g, "''")}' -DestinationPath '${extractDir.replace(/\\'/g, "''")}' -Force"`, { stdio: 'ignore' });
    } catch (e) {
      // Fallback: try node's built-in unzip via adm-zip if installed, or unzip command
      try {
        execSync(`unzip -o "${absZip}" -d "${extractDir}"`, { stdio: 'ignore' });
      } catch (e2) {
        console.error('Extraction failed', e, e2);
        return res.status(500).json({ error: 'extract_failed', detail: String(e) });
      }
    }

    // After extraction, scan for CSV files and record metadata
    try {
      const csvFiles = [];
      function walkForCsv(dir) {
        for (const f of fs.readdirSync(dir)) {
          const p = path.join(dir, f);
          const st = fs.statSync(p);
          if (st.isDirectory()) walkForCsv(p);
          else if (f.toLowerCase().endsWith('.csv')) csvFiles.push(p);
        }
      }
      walkForCsv(extractDir);
      for (const csv of csvFiles) {
        // count lines (simple)
        try {
          const data = fs.readFileSync(csv, 'utf8');
          const rows = data.split(/\r?\n/).filter(Boolean).length;
          const rel = path.relative(path.resolve(__dirname, '..', 'resources', 'data'), csv).replace(/\\\\/g, '/');
          if (db) db.upsertDataset(rel, 1, rows);
        } catch (e) {
          console.warn('Could not ingest CSV', csv, e && e.message);
        }
      }
    } catch (e) {
      console.warn('Post-extract ingestion failed', e && e.message);
    }

    return res.json({ ok: true, extractedTo: extractDir });
  } catch (err) {
    console.error('extract-zip error', err);
    return res.status(500).json({ error: 'internal' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Portal proxy server listening on http://localhost:${PORT}`));

// Admin endpoints
app.get('/admin/key', (req, res) => {
  if (ADMIN_TOKEN) {
    const provided = req.get('x-proxy-admin');
    if (!provided || provided !== ADMIN_TOKEN) return res.status(403).json({ error: 'forbidden', message: 'invalid admin token' });
  }
  try {
    const keyPresent = !!portalKey;
    return res.json({ keyPresent });
  } catch (e) {
    return res.status(500).json({ error: 'internal' });
  }
});

app.get('/admin/datasets', (req, res) => {
  if (ADMIN_TOKEN) {
    const provided = req.get('x-proxy-admin');
    if (!provided || provided !== ADMIN_TOKEN) return res.status(403).json({ error: 'forbidden', message: 'invalid admin token' });
  }
  try {
    if (!db) return res.json({ datasets: [] });
    const d = db.listDatasets();
    return res.json({ datasets: d });
  } catch (e) {
    return res.status(500).json({ error: 'internal' });
  }
});

app.post('/admin/dataset/delete', (req, res) => {
  if (ADMIN_TOKEN) {
    const provided = req.get('x-proxy-admin');
    if (!provided || provided !== ADMIN_TOKEN) return res.status(403).json({ error: 'forbidden', message: 'invalid admin token' });
  }
  try {
    const { path: p, deleteFiles } = req.body || {};
    if (!p) return res.status(400).json({ error: 'missing_path' });
    if (!db) return res.status(400).json({ error: 'no_db' });
    // remove metadata
    db.deleteDataset(p);
    // optionally remove files from resources/data
    if (deleteFiles) {
      const abs = path.resolve(__dirname, '..', 'resources', 'data', p);
      if (abs.startsWith(path.resolve(__dirname, '..', 'resources', 'data'))) {
        try {
          if (fs.existsSync(abs)) fs.unlinkSync(abs);
        } catch (e) {
          console.warn('Could not delete file', abs, e && e.message);
        }
      }
    }
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'internal' });
  }
});

// Admin: scan resources/data and ingest CSV metadata into DB
app.post('/admin/ingest', (req, res) => {
  if (ADMIN_TOKEN) {
    const provided = req.get('x-proxy-admin');
    if (!provided || provided !== ADMIN_TOKEN) return res.status(403).json({ error: 'forbidden', message: 'invalid admin token' });
  }
  try {
    if (!db) return res.status(400).json({ error: 'no_db' });
    const dataDir = path.resolve(__dirname, '..', 'resources', 'data');
    function walk(dir) {
      const out = [];
      for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        const st = fs.statSync(p);
        if (st.isDirectory()) out.push(...walk(p));
        else if (f.toLowerCase().endsWith('.csv')) out.push(p);
      }
      return out;
    }
    if (!fs.existsSync(dataDir)) return res.json({ ok: true, ingested: 0 });
    const csvs = walk(dataDir);
    let count = 0;
    for (const csv of csvs) {
      try {
        const data = fs.readFileSync(csv, 'utf8');
        const rows = data.split(/\r?\n/).filter(Boolean).length;
        const rel = path.relative(dataDir, csv).replace(/\\/g, '/');
        db.upsertDataset(rel, 1, rows);
        count++;
      } catch (e) {
        console.warn('Ingest failed for', csv, e && e.message);
      }
    }
    return res.json({ ok: true, ingested: count });
  } catch (e) {
    return res.status(500).json({ error: 'internal' });
  }
});

// Simple health endpoint
app.get('/health', (req, res) => {
  try {
    if (!portalKey) return res.status(200).json({ status: 'ok', portalKey: false });
    return res.status(200).json({ status: 'ok', portalKey: true });
  } catch (e) {
    return res.status(500).json({ status: 'error' });
  }
});
