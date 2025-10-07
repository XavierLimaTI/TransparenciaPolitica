// ...new file...
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'logs.jsonl');
const METRICS_FILE = path.join(__dirname, 'metrics.json');

let metrics = {};
try { metrics = JSON.parse(fs.readFileSync(METRICS_FILE, 'utf8') || '{}'); } catch (e) { metrics = {}; }

function _appendLog(obj) {
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(obj) + '\n');
  } catch (e) { /* ignore logging failure */ }
}

function log(level, message, meta = {}) {
  const entry = { ts: new Date().toISOString(), level, message, meta };
  _appendLog(entry);
}

function increment(key, n = 1) {
  metrics[key] = (metrics[key] || 0) + n;
  try { fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2)); } catch (e) { /* ignore */ }
}

function getMetrics() {
  return metrics;
}

module.exports = { log, increment, getMetrics, LOG_FILE, METRICS_FILE };
// ...new file...