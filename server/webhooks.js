const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE = path.join(__dirname, 'webhooks.json');

// Lazy-load cache to avoid circular dependency
let cache = null;
function getCache() {
  if (!cache) {
    try {
      cache = require('./cache');
    } catch (e) {
      console.warn('Could not load cache module:', e && e.message);
    }
  }
  return cache;
}

function loadEvents() {
  try { if (!fs.existsSync(FILE)) return []; const raw = fs.readFileSync(FILE, 'utf8'); return JSON.parse(raw || '[]'); } catch (e) { console.warn('loadEvents error', e); return []; }
}

function saveEvent(ev) {
  try { const arr = loadEvents(); arr.push({ receivedAt: new Date().toISOString(), event: ev }); fs.writeFileSync(FILE, JSON.stringify(arr, null, 2), 'utf8'); } catch (e) { console.error('saveEvent error', e); }
}

// Invalidate cache based on webhook event
function invalidateCacheForEvent(event) {
  const c = getCache();
  if (!c || !c.invalidate) return;
  
  try {
    // Determine what cache keys to invalidate based on event type and data
    const eventType = event.type || event.action || '';
    const resource = event.resource || event.entity || '';
    
    // Example: if event indicates deputado update, invalidate deputado caches
    if (eventType.includes('update') || eventType.includes('change')) {
      if (resource === 'deputado' && event.id) {
        c.invalidate(`deputado:${event.id}`);
        c.invalidate(`deputado:${event.id}:despesas`);
        console.log(`Cache invalidated for deputado ${event.id}`);
      } else if (resource === 'senador' && event.id) {
        c.invalidate(`senador:${event.id}`);
        console.log(`Cache invalidated for senador ${event.id}`);
      } else if (resource === 'votacao' && event.id) {
        c.invalidate(`votacao:${event.id}`);
        console.log(`Cache invalidated for votacao ${event.id}`);
      }
    }
    
    // Invalidate list caches on create/delete events
    if (eventType.includes('create') || eventType.includes('delete')) {
      if (resource === 'deputado') {
        c.invalidate('deputados:list');
        console.log('Cache invalidated for deputados list');
      } else if (resource === 'senador') {
        c.invalidate('senadores:list');
        console.log('Cache invalidated for senadores list');
      }
    }
  } catch (e) {
    console.warn('Cache invalidation error:', e && e.message);
  }
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
    
    // Invalidate relevant cache entries
    invalidateCacheForEvent(event);
    
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
