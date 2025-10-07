// Simple persistent cache with configurable TTL
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, 'cache.json');
const DEFAULT_TTL_MS = Number(process.env.CACHE_DEFAULT_TTL_MS || 1000 * 60 * 60); // 1 hour

let logger;
try {
  logger = require('./logger');
} catch (e) {
  // Logger not available, use no-op
  logger = {
    log: () => {},
    increment: () => {}
  };
}

let store = {};

// Load cache from disk on initialization
try {
  const content = fs.readFileSync(CACHE_FILE, 'utf8');
  store = JSON.parse(content || '{}');
} catch (e) {
  store = {};
}

function _now() {
  return Date.now();
}

function _persist() {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2));
  } catch (e) {
    logger.log('warn', 'cache.persist.failed', { err: String(e) });
  }
}

function get(key) {
  const entry = store[key];
  if (!entry) return null;
  
  if (entry.expiresAt && entry.expiresAt < _now()) {
    delete store[key];
    _persist();
    logger.increment('cache.miss.expired', 1);
    return null;
  }
  
  logger.increment('cache.hit', 1);
  return entry.data;
}

function set(key, data, ttlMs = DEFAULT_TTL_MS) {
  const expiresAt = ttlMs ? _now() + ttlMs : null;
  store[key] = {
    data,
    expiresAt,
    storedAt: _now()
  };
  _persist();
  logger.increment('cache.set', 1);
  return true;
}

function invalidate(key) {
  if (store[key]) {
    delete store[key];
    _persist();
    logger.increment('cache.invalidate', 1);
    return true;
  }
  return false;
}

function invalidatePrefix(prefix) {
  if (!prefix) return 0;
  const keys = Object.keys(store);
  let removed = 0;
  keys.forEach(k => {
    if (k.startsWith(prefix)) {
      delete store[k];
      removed++;
    }
  });
  if (removed) {
    _persist();
    logger.increment('cache.invalidate.prefix', removed);
  }
  return removed;
}

function clear() {
  store = {};
  _persist();
  logger.increment('cache.clear', 1);
}

module.exports = {
  get,
  set,
  invalidate,
  invalidatePrefix,
  clear,
  CACHE_FILE,
  DEFAULT_TTL_MS
};
