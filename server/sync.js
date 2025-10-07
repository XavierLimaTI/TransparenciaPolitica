// Data synchronization service
// Fetches data from government APIs and stores in local db.json
const fs = require('fs');
const path = require('path');
const camara = require('../lib/adapters/camara');
const senado = require('../lib/adapters/senado');

const DB_FILE = path.join(__dirname, 'db.json');
const LOCK_FILE = path.join(__dirname, 'sync.lock');

let logger;
let cache;

try {
  logger = require('./logger');
} catch (e) {
  logger = {
    log: () => {},
    increment: () => {}
  };
}

try {
  cache = require('./cache');
} catch (e) {
  cache = null;
}

// Circuit breaker state
let failures = 0;
const FAILURE_THRESHOLD = Number(process.env.SYNC_FAILURE_THRESHOLD || 5);
const COOLDOWN_MS = Number(process.env.SYNC_COOLDOWN_MS || 1000 * 60 * 5);
let lastFailureAt = 0;

// Circuit breaker state
let failures = 0;
const FAILURE_THRESHOLD = Number(process.env.SYNC_FAILURE_THRESHOLD || 5);
const COOLDOWN_MS = Number(process.env.SYNC_COOLDOWN_MS || 1000 * 60 * 5);
let lastFailureAt = 0;

// Parse command line arguments
const args = process.argv.slice(2);
const isOnce = args.includes('--once');
const intervalArg = args.find(a => a.startsWith('--interval='));
const interval = intervalArg ? Number(intervalArg.split('=')[1]) : null;

// Retry with exponential backoff and circuit breaker
async function withRetry(fn, opts = {}) {
  const retries = Number(opts.retries ?? 3);
  const baseDelay = Number(opts.baseDelay ?? 500);
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    // Check circuit breaker
    if (failures >= FAILURE_THRESHOLD && (Date.now() - lastFailureAt) < COOLDOWN_MS) {
      const err = new Error('circuit-breaker-open');
      logger.log('warn', 'sync.circuit_breaker.open', { failures, cooldown: COOLDOWN_MS });
      throw err;
    }
    
    try {
      const start = Date.now();
      const result = await fn();
      const duration = Date.now() - start;
      
      logger.increment('sync.fetch.success', 1);
      logger.increment('sync.duration_ms', duration);
      failures = 0; // Reset on success
      
      return result;
    } catch (err) {
      failures++;
      lastFailureAt = Date.now();
      logger.increment('sync.fetch.error', 1);
      logger.log('warn', 'sync.fetch.error', { err: String(err), attempt });
      
      if (attempt === retries) {
        throw err;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function acquireLock() {
  if (fs.existsSync(LOCK_FILE)) {
    const lockTime = fs.statSync(LOCK_FILE).mtime.getTime();
    const age = Date.now() - lockTime;
    
    // If lock is older than 30 minutes, assume stale and remove
    if (age > 30 * 60 * 1000) {
      console.warn('Removing stale lock file');
      fs.unlinkSync(LOCK_FILE);
    } else {
      console.log('Another sync is already running');
      return false;
    }
  }
  
  fs.writeFileSync(LOCK_FILE, String(process.pid));
  return true;
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  } catch (e) {
    // Ignore errors
  }
}

async function syncData() {
  console.log('Starting data synchronization...');
  logger.log('info', 'sync.start');
  
  try {
    // Fetch deputies (limited to avoid overwhelming the API)
    console.log('Fetching deputados...');
    const deputados = await withRetry(
      () => camara.fetchDeputados({ itens: 30 }),
      { retries: 4, baseDelay: 500 }
    );
    console.log(`Fetched ${deputados.length} deputados`);
    
    // Fetch senators
    console.log('Fetching senadores...');
    const senadores = await withRetry(
      () => senado.fetchSenadores(),
      { retries: 4, baseDelay: 500 }
    );
    console.log(`Fetched ${senadores.length} senadores`);
    
    // Combine data
    const data = {
      deputados,
      senadores,
      lastSync: new Date().toISOString()
    };
    
    // Write to db.json
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    
    // Update cache if available
    if (cache) {
      const ttl = Number(process.env.DEPUTADOS_TTL_MS || 1000 * 60 * 60);
      cache.set('deputados:all', deputados, ttl);
      cache.set('senadores:all', senadores, ttl);
    }
    
    console.log(`Data synchronized successfully at ${data.lastSync}`);
    logger.log('info', 'sync.finish', {
      deputados: deputados.length,
      senadores: senadores.length
    });
    
    return true;
  } catch (error) {
    console.error('Sync error:', error);
    logger.log('error', 'sync.failed', { err: String(error) });
    return false;
  }
}

async function run() {
  if (!await acquireLock()) {
    process.exit(1);
  }
  
  try {
    if (isOnce) {
      // Run once and exit
      await syncData();
    } else if (interval) {
      // Run periodically
      console.log(`Running sync every ${interval}ms`);
      await syncData();
      setInterval(syncData, interval);
    } else {
      console.log('Usage: node sync.js [--once | --interval=<ms>]');
      console.log('Example: node sync.js --once');
      console.log('Example: node sync.js --interval=3600000  (1 hour)');
    }
  } finally {
    if (isOnce) {
      releaseLock();
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT, cleaning up...');
  releaseLock();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, cleaning up...');
  releaseLock();
  process.exit(0);
});

// Run if executed directly
if (require.main === module) {
  run();
}

module.exports = { syncData, withRetry };
