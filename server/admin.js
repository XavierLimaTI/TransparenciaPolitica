// Admin endpoints for cache, metrics, and webhooks management
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

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
    increment: () => {},
    getMetrics: () => ({})
  };
}

// Admin token middleware
function requireAdminToken(req, res, next) {
  const token = process.env.ADMIN_TOKEN || '';
  const provided = req.headers['x-admin-token'] || req.query.admin_token || '';
  
  if (!token) {
    return res.status(403).json({
      error: 'ADMIN_TOKEN not configured on server'
    });
  }
  
  if (!provided || provided !== token) {
    return res.status(401).json({
      error: 'invalid admin token'
    });
  }
  
  next();
}

// Get cache keys and metadata
router.get('/admin/cache', requireAdminToken, (req, res) => {
  try {
    if (!cache) {
      return res.status(503).json({ error: 'cache module not available' });
    }
    
    const dataPath = cache.CACHE_FILE;
    const store = fs.existsSync(dataPath)
      ? JSON.parse(fs.readFileSync(dataPath, 'utf8') || '{}')
      : {};
    
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

// Clear cache (all or by prefix)
router.post('/admin/cache/clear', requireAdminToken, express.json(), (req, res) => {
  try {
    if (!cache) {
      return res.status(503).json({ error: 'cache module not available' });
    }
    
    const { prefix } = req.body || {};
    
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

// Get recent webhooks
router.get('/admin/webhooks', requireAdminToken, (req, res) => {
  try {
    const file = path.join(__dirname, 'webhooks.json');
    const events = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, 'utf8') || '[]')
      : [];
    
    // Return last 50 events
    return res.json({
      count: events.length,
      last: events.slice(-50)
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// Get metrics
router.get('/admin/metrics', requireAdminToken, (req, res) => {
  try {
    const metrics = logger.getMetrics();
    return res.json({ metrics });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// Reset metrics
router.post('/admin/metrics/reset', requireAdminToken, (req, res) => {
  try {
    if (logger.resetMetrics) {
      logger.resetMetrics();
      return res.json({ ok: true, reset: true });
    }
    return res.status(503).json({ error: 'resetMetrics not available' });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

module.exports = router;
