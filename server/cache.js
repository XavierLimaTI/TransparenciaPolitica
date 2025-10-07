// Simple persistent cache with configurable TTL
const fs = require('fs');
const path = require('path');

const CACHE_FILE = path.join(__dirname, 'cache.json');
const DEFAULT_TTL_MS = Number(process.env.CACHE_DEFAULT_TTL_MS || 1000 * 60 * 60); // 1 hour

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
    // Ignore write errors
  }
}

function get(key) {
  const entry = store[key];
  if (!entry) return null;
  
  if (entry.expiresAt && entry.expiresAt < _now()) {
    delete store[key];
    _persist();
    return null;
  }
  
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
  return true;
}

function invalidate(key) {
  if (store[key]) {
    delete store[key];
    _persist();
    return true;
  }
  return false;
}

function clear() {
  store = {};
  _persist();
}

module.exports = {
  get,
  set,
  invalidate,
  clear,
  CACHE_FILE,
  DEFAULT_TTL_MS
};
