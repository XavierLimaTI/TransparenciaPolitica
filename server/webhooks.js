const http = require('http');
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cache = require('./cache');
const logger = require('./logger');

const app = express();
app.use(express.json());

const WEBHOOK_FILE = path.join(__dirname, 'webhooks.json');

function saveEvent(e) {
  try {
    const arr = fs.existsSync(WEBHOOK_FILE) ? JSON.parse(fs.readFileSync(WEBHOOK_FILE,'utf8')||'[]') : [];
    arr.push(Object.assign({receivedAt: new Date().toISOString()}, e));
    fs.writeFileSync(WEBHOOK_FILE, JSON.stringify(arr.slice(-500), null, 2));
  } catch (err) {
    logger.log('error','webhook.save.failed',{err:String(err)});
  }
}

function verifyHmac(reqBody, headerSig) {
  const secret = process.env.WEBHOOK_SECRET || '';
  if (!secret) return true; // if not configured, skip verification (documented)
  if (!headerSig) return false;
  const payload = JSON.stringify(reqBody);
  const computed = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return computed === headerSig;
}

app.post('/webhooks/receive', (req, res) => {
  const payload = req.body || {};
  const sig = req.headers['x-hub-signature-256'] || req.headers['x-signature'] || '';

  if (!verifyHmac(payload, sig)) {
    logger.log('warn','webhook.invalid.signature',{provided:sig});
    return res.status(401).json({ error: 'invalid signature' });
  }

  saveEvent({ headers: req.headers, payload });

  try {
    const t = (payload.type || payload.event || '').toString().toLowerCase();
    // deputado / parlamentar updates
    if (t.includes('deputado') || t.includes('parlamentar')) {
      const id = payload.id || payload.deputadoId || payload.matricula;
      if (id) {
        const pref = `deputado:${id}`;
        const removed = cache.invalidatePrefix(pref);
        logger.log('info','webhook.invalidate',{prefix:pref,removed});
        logger.increment('webhook.received',1);
      } else {
        const removed = cache.invalidatePrefix('deputado:');
        logger.log('info','webhook.invalidate.prefix',{removed});
      }
    } else if (t.includes('despesa')) {
      const id = payload.deputadoId || payload.id;
      if (id) {
        const pref = `deputado:${id}:despesas`;
        const removed = cache.invalidatePrefix(pref);
        logger.log('info','webhook.invalidate',{prefix:pref,removed});
      }
    } else if (payload.prefix) {
      const removed = cache.invalidatePrefix(payload.prefix);
      logger.log('info','webhook.invalidate',{prefix:payload.prefix,removed});
    } else {
      // generic fallback: record only, do not flush whole cache by default
      logger.log('info','webhook.ignored',{type: t});
    }
  } catch (err) {
    logger.log('error','webhook.invalidate.failed',{err:String(err)});
  }

  res.json({ ok: true });
});

app.get('/health', (req, res) => res.json({ ok: true }));

if (require.main === module) {
  const port = Number(process.env.WEBHOOKS_PORT || 3002);
  app.listen(port, () => logger.log('info','webhooks.started',{port}));
}

module.exports = app;
