// Data synchronization service
// Fetches data from government APIs and stores in local db.json
const fs = require('fs');
const path = require('path');
const camara = require('../lib/adapters/camara');
const senado = require('../lib/adapters/senado');

const DB_FILE = path.join(__dirname, 'db.json');
const LOCK_FILE = path.join(__dirname, 'sync.lock');

// Parse command line arguments
const args = process.argv.slice(2);
const isOnce = args.includes('--once');
const intervalArg = args.find(a => a.startsWith('--interval='));
const interval = intervalArg ? Number(intervalArg.split('=')[1]) : null;

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
  
  try {
    // Fetch deputies (limited to avoid overwhelming the API)
    console.log('Fetching deputados...');
    const deputados = await camara.fetchDeputados({ itens: 30 });
    console.log(`Fetched ${deputados.length} deputados`);
    
    // Fetch senators
    console.log('Fetching senadores...');
    const senadores = await senado.fetchSenadores();
    console.log(`Fetched ${senadores.length} senadores`);
    
    // Combine data
    const data = {
      deputados,
      senadores,
      lastSync: new Date().toISOString()
    };
    
    // Write to db.json
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    console.log(`Data synchronized successfully at ${data.lastSync}`);
    
    return true;
  } catch (error) {
    console.error('Sync error:', error);
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

module.exports = { syncData };
