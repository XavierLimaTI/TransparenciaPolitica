// Simple logger and metrics module
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'logs.jsonl');
const METRICS_FILE = path.join(__dirname, 'metrics.json');

let metrics = {};

// Load existing metrics on initialization
try {
  const content = fs.readFileSync(METRICS_FILE, 'utf8');
  metrics = JSON.parse(content || '{}');
} catch (e) {
  metrics = {};
}

function _appendLog(obj) {
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(obj) + '\n');
  } catch (e) {
    // Ignore logging failure to prevent cascade errors
  }
}

function _persistMetrics() {
  try {
    fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
  } catch (e) {
    // Ignore write errors
  }
}

function log(level, message, meta = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    meta
  };
  _appendLog(entry);
  
  // Also log to console for debugging
  if (level === 'error' || level === 'warn') {
    console.error(`[${level.toUpperCase()}] ${message}`, meta);
  }
}

function increment(key, n = 1) {
  metrics[key] = (metrics[key] || 0) + n;
  _persistMetrics();
}

function getMetrics() {
  return { ...metrics };
}

function resetMetrics() {
  metrics = {};
  _persistMetrics();
}

module.exports = {
  log,
  increment,
  getMetrics,
  resetMetrics,
  LOG_FILE,
  METRICS_FILE
};
