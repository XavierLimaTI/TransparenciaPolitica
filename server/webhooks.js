const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FILE = path.join(__dirname, 'webhooks.json');

let cache;
let logger;

try {
  cache = require('./cache');
} catch (e) {
  cache = null;
}

try {
  logger = require('./logger');
} catch (e) {
  logger = {
    log: () => {},
    increment: () => {}
  };
}

function loadEvents() {
  try { if (!fs.existsSync(FILE)) return []; const raw = fs.readFileSync(FILE, 'utf8'); return JSON.parse(raw || '[]'); } catch (e) { console.warn('loadEvents error', e); return []; }
}

function saveEvent(ev) {
  try {
    const arr = loadEvents();
    arr.push({ receivedAt: new Date().toISOString(), event: ev });
    // Keep only last 500 events
    const limited = arr.slice(-500);
    fs.writeFileSync(FILE, JSON.stringify(limited, null, 2), 'utf8');
  } catch (e) {
    logger.log('error', 'webhook.save.failed', { err: String(e) });
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
      logger.log('warn', 'webhook.invalid.signature', { provided: sig });
      res.status(401).json({ error: 'invalid_signature' });
      return;
    }
    
    const event = req.body || JSON.parse(payload || '{}');
    saveEvent(event);
    
    // Invalidate cache intelligently based on event type
    if (cache) {
      try {
        const type = (event.type || event.event || '').toString().toLowerCase();
        
        // Handle deputado/parlamentar updates
        if (type.includes('deputado') || type.includes('parlamentar')) {
          const id = event.id || event.deputadoId || event.matricula;
          if (id) {
            const prefix = `deputado:${id}`;
            const removed = cache.invalidatePrefix(prefix);
            logger.log('info', 'webhook.invalidate', { prefix, removed });
            logger.increment('webhook.received', 1);
          } else {
            // Fallback: clear all deputado-related caches
            const removed = cache.invalidatePrefix('deputado:');
            logger.log('info', 'webhook.invalidate.prefix.all.deputado', { removed });
          }
        }
        // Handle despesa updates
        else if (type.includes('despesa')) {
          const id = event.deputadoId || event.id;
          if (id) {
            const prefix = `deputado:${id}:despesas`;
            const removed = cache.invalidatePrefix(prefix);
            logger.log('info', 'webhook.invalidate', { prefix, removed });
          }
        }
        // Generic: support prefix field
        else if (event.prefix) {
          const removed = cache.invalidatePrefix(event.prefix);
          logger.log('info', 'webhook.invalidate', { prefix: event.prefix, removed });
        }
      } catch (err) {
        logger.log('error', 'webhook.invalidate.failed', { err: String(err) });
      }
    }
    
    res.status(200).json({ ok: true });
  } catch (e) {
    logger.log('error', 'webhook.handler.error', { err: String(e) });
    try {
      res.status(500).json({ error: 'server_error' });
    } catch (__) {
      void __;
    }
  }
}

// If run directly, start a small Express server
if (require.main === module) {
  const express = require('express');
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.post('/webhooks/receive', webhookHandler);
  // lightweight health endpoint for CI readiness checks
  app.get('/health', (req, res) => res.json({ ok: true }));
  const port = Number(process.env.WEBHOOKS_PORT || 3002);
  app.listen(port, () => {
    console.log(`Webhook receiver listening on port ${port}`);
    logger.log('info', 'webhooks.started', { port });
  });
}

module.exports = { webhookHandler, saveEvent, loadEvents };
