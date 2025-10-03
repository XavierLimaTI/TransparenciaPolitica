const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const KEY_FILE = path.resolve(__dirname, 'portal_key.json');

// Load persisted key if present
let portalKey = process.env.PORTAL_API_KEY || null;
try {
  if (fs.existsSync(KEY_FILE)) {
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

  // persist to disk (best-effort)
  try {
    fs.writeFileSync(KEY_FILE, JSON.stringify({ key: portalKey }, null, 2), { encoding: 'utf8' });
  } catch (err) {
    console.warn('Could not persist portal key to disk:', err && err.message);
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
    if (fs.existsSync(KEY_FILE)) fs.unlinkSync(KEY_FILE);
  } catch (err) {
    console.warn('Could not remove persisted portal key file:', err && err.message);
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

    return res.json({ ok: true, extractedTo: extractDir });
  } catch (err) {
    console.error('extract-zip error', err);
    return res.status(500).json({ error: 'internal' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Portal proxy server listening on http://localhost:${PORT}`));
