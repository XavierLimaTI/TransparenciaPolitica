const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE = path.join(__dirname, 'webhooks.json');

function loadEvents() {
  try { if (!fs.existsSync(FILE)) return []; const raw = fs.readFileSync(FILE, 'utf8'); return JSON.parse(raw || '[]'); } catch (e) { console.warn('loadEvents error', e); return []; }
}

function saveEvent(ev) {
  try { const arr = loadEvents(); arr.push({ receivedAt: new Date().toISOString(), event: ev }); fs.writeFileSync(FILE, JSON.stringify(arr, null, 2), 'utf8'); } catch (e) { console.error('saveEvent error', e); }
}

function verifySignature(secret, payload, signature) {
  if (!secret) return true; // no secret configured
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return hmac === signature;
}

// Express-compatible handler
function webhookHandler(req, res) {
  try {
    const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const sig = (req.headers['x-hub-signature-256'] || req.headers['x-signature'] || '').replace(/^sha256=/, '');
    const secret = process.env.WEBHOOK_SECRET || null;
    if (!verifySignature(secret, payload, sig)) {
      res.status(401).json({ error: 'invalid_signature' }); return;
    }
    const event = req.body || JSON.parse(payload || '{}');
    saveEvent(event);
    res.status(200).json({ ok: true });
  } catch (e) { console.error('webhook handler error', e); try { res.status(500).json({ error: 'server_error' }); } catch (__) { void __; } }
}

// If run directly, start a small Express server
if (require.main === module) {
  const express = require('express');
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.post('/webhooks/receive', webhookHandler);
  // lightweight health endpoint for CI readiness checks
  app.get('/health', (req, res) => res.json({ ok: true }));
  const port = process.env.WEBHOOK_PORT || 3002;
  app.listen(port, () => console.log('Webhook receiver listening on port', port));
}

module.exports = { webhookHandler, saveEvent, loadEvents };
