const fs = require('fs');
const path = require('path');

const CACHE_PATH = path.join(__dirname, 'cache.json');
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

let memory = new Map();

function loadFromDisk() {
  try {
    if (!fs.existsSync(CACHE_PATH)) return;
    const raw = fs.readFileSync(CACHE_PATH, 'utf8');
    const obj = JSON.parse(raw || '{}');
    Object.keys(obj).forEach(k => {
      memory.set(k, obj[k]);
    });
  } catch (e) { console.warn('cache load error', e); }
}

function persistToDisk() {
  try {
    const obj = {};
    memory.forEach((v, k) => { obj[k] = v; });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) { console.warn('cache persist error', e); }
}

function get(key) {
  const record = memory.get(key);
  if (!record) return null;
  if (Date.now() - (record.timestamp || 0) > (record.ttl || DEFAULT_TTL)) {
    memory.delete(key);
    try { persistToDisk(); } catch (e) { void e; }
    return null;
  }
  return record.data;
}

function set(key, data, ttl = DEFAULT_TTL) {
  memory.set(key, { data, timestamp: Date.now(), ttl });
  try { persistToDisk(); } catch (e) { void e; }
}

// initialize
loadFromDisk();

module.exports = { get, set, CACHE_PATH };
