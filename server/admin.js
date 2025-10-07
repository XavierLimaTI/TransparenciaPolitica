const express = require('express');
const router = express.Router();
const cache = require('./cache');
const logger = require('./logger');

function requireAdminToken(req, res, next) {
  const token = process.env.ADMIN_TOKEN || '';
  const provided = req.headers['x-admin-token'] || req.query.admin_token || '';
  if (!token) return res.status(403).json({ error: 'ADMIN_TOKEN not configured on server' });
  if (!provided || provided !== token) return res.status(401).json({ error: 'invalid admin token' });
  next();
}

router.get('/admin/cache', requireAdminToken, (req, res) => {
  try {
    const dataPath = cache.CACHE_FILE;
    const fs = require('fs');
    const store = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, 'utf8') || '{}') : {};
    const keys = Object.keys(store).map(k => ({ key: k, storedAt: store[k].storedAt, expiresAt: store[k].expiresAt }));
    res.json({ keys });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

router.post('/admin/cache/clear', requireAdminToken, express.json(), (req, res) => {
  const { prefix } = req.body || {};
  try {
    if (prefix) {
      const removed = cache.invalidatePrefix(prefix);
      return res.json({ ok: true, removed });
    } else {
      cache.clear();
      return res.json({ ok: true, cleared: 'all' });
    }
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.get('/admin/webhooks', requireAdminToken, (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs');
    const file = path.join(__dirname, 'webhooks.json');
    const events = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8') || '[]') : [];
    return res.json({ count: events.length, last: events.slice(-50) });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

router.get('/admin/metrics', requireAdminToken, (req, res) => {
  try {
    const m = logger.getMetrics();
    return res.json({ metrics: m });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});


module.exports = router;
module.exports = router;