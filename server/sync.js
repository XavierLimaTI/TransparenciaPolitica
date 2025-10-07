#!/usr/bin/env node
// Lightweight synchronizer: calls api.atualizarDados() periodically and saves to server/db.json
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');
const LOCK_PATH = path.join(__dirname, 'sync.lock');

async function writeDB(obj) {
  try { fs.writeFileSync(DB_PATH, JSON.stringify(obj, null, 2), 'utf8'); } catch (e) { console.error('Failed to write DB:', e); }
}

function isLocked() {
  try { return fs.existsSync(LOCK_PATH); } catch (e) { return false; }
}

function lock() { try { fs.writeFileSync(LOCK_PATH, String(process.pid), 'utf8'); } catch (e) { void e; } }
function unlock() { try { if (fs.existsSync(LOCK_PATH)) fs.unlinkSync(LOCK_PATH); } catch (e) { void e; } }

async function runOnce(api) {
  if (!api || typeof api.atualizarDados !== 'function') throw new Error('API must implement atualizarDados()');
  if (isLocked()) throw new Error('Sync already running (lock present)');
  lock();
  try {
    const dados = await api.atualizarDados();
    if (dados) {
      const now = new Date().toISOString();
      const out = { ultimaAtualizacao: now, dados };
      await writeDB(out);
      console.log('Sync completed:', now);
      return out;
    }
    console.warn('Sync did not return data');
    return null;
  } finally { unlock(); }
}

async function main() {
  const args = process.argv.slice(2);
  const once = args.includes('--once');
  const intervalArgIndex = args.indexOf('--interval');
  const interval = intervalArgIndex !== -1 && args[intervalArgIndex + 1] ? parseInt(args[intervalArgIndex + 1], 10) : (30 * 60 * 1000);

  // Try to load GovernmentAPI from lib
  let API = null;
  try { const mod = require('../lib/government-api'); API = new mod.GovernmentAPI(); } catch (e) { console.warn('Could not load GovernmentAPI, provide a mock via require path or run with --once and a script.'); }

  if (once) {
    try { await runOnce(API); process.exit(0); } catch (e) { console.error('Sync failed:', e); process.exit(2); }
  }

  // Interval loop
  console.log('Starting sync loop with interval', interval);
  setInterval(async () => {
    try { await runOnce(API); } catch (e) { console.error('Scheduled sync error:', e); }
  }, interval);
}

if (require.main === module) main().catch(e => { console.error('Fatal sync error:', e); process.exit(1); });

module.exports = { runOnce, isLocked, lock, unlock };
