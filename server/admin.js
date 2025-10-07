// Admin endpoints protected by ADMIN_TOKEN
const express = require('express');
const router = express.Router();
const cache = require('./cache');
const fs = require('fs');
const path = require('path');

// Middleware to verify admin token
function requireAdminToken(req, res, next) {
  const token = process.env.ADMIN_TOKEN || '';
  const provided = req.headers['x-admin-token'] || req.query.admin_token || '';
  
  if (!token) {
    return res.status(403).json({ error: 'ADMIN_TOKEN not configured on server' });
  }
  
  if (!provided || provided !== token) {
    return res.status(401).json({ error: 'invalid admin token' });
  }
  
  next();
}

// GET /admin/cache - List all cache keys with metadata
router.get('/admin/cache', requireAdminToken, (req, res) => {
  try {
    const dataPath = cache.CACHE_FILE;
    const store = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, 'utf8') || '{}') : {};
    
    const keys = Object.keys(store).map(k => ({
      key: k,
      storedAt: store[k].storedAt,
      expiresAt: store[k].expiresAt
    }));
    
    res.json({ keys, count: keys.length });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /admin/cache/clear - Clear cache (all or by prefix)
router.post('/admin/cache/clear', requireAdminToken, express.json(), (req, res) => {
  const { prefix } = req.body || {};
  
  try {
    if (prefix) {
      // Invalidate by prefix
      const dataPath = cache.CACHE_FILE;
      const store = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, 'utf8') || '{}') : {};
      
      let cleared = 0;
      Object.keys(store).forEach(k => {
        if (k.startsWith(prefix)) {
          delete store[k];
          cleared++;
        }
      });
      
      fs.writeFileSync(dataPath, JSON.stringify(store, null, 2));
      return res.json({ ok: true, clearedPrefix: prefix, count: cleared });
    } else {
      // Clear all
      cache.clear();
      return res.json({ ok: true, cleared: 'all' });
    }
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// GET /admin/webhooks - List recent webhook events
router.get('/admin/webhooks', requireAdminToken, (req, res) => {
  try {
    const file = path.join(__dirname, 'webhooks.json');
    const events = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8') || '[]') : [];
    
    const limit = parseInt(req.query.limit || '50', 10);
    const recent = events.slice(-limit);
    
    return res.json({ count: events.length, events: recent });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

module.exports = router;
