// Data synchronization service
// Fetches data from government APIs and stores in local db.json
const fs = require('fs');
const path = require('path');
const logger = require('./logger');
const adapters = require('../lib/adapters'); // assumed index exporting camara/senado adapters
const cache = require('./cache');

let failures = 0;
const FAILURE_THRESHOLD = Number(process.env.SYNC_FAILURE_THRESHOLD || 5);
const COOLDOWN_MS = Number(process.env.SYNC_COOLDOWN_MS || 1000 * 60 * 5);

let lastFailureAt = 0;

async function withRetry(fn, opts = {}) {
  const retries = Number(opts.retries ?? 3);
  const baseDelay = Number(opts.baseDelay ?? 500);
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (failures >= FAILURE_THRESHOLD && (Date.now() - lastFailureAt) < COOLDOWN_MS) {
      throw new Error('circuit-breaker-open');
    }
    try {
      const start = Date.now();
      const result = await fn();
      const dur = Date.now() - start;
      logger.increment('sync.fetch.success',1);
      logger.increment('sync.duration_ms', dur);
      failures = 0;
      return result;
    } catch (err) {
      failures++;
      lastFailureAt = Date.now();
      logger.increment('sync.fetch.error',1);
      logger.log('warn','sync.fetch.error',{err:String(err),attempt});
      if (attempt === retries) throw err;
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function runOnce() {
  logger.log('info','sync.start');
  try {
    // exemplo: atualizar lista de deputados e armazenar no cache
    const deputados = await withRetry(() => adapters.camara.fetchDeputados({itens: 100}), { retries: 4, baseDelay: 500 });
    cache.set('deputados:all', deputados, Number(process.env.DEPUTADOS_TTL_MS || 1000*60*60));
    // senadores
    const senadores = await withRetry(() => adapters.senado.fetchSenadores({itens: 100}), { retries: 4, baseDelay: 500 });
    cache.set('senadores:all', senadores, Number(process.env.SENADORES_TTL_MS || 1000*60*60));
    logger.log('info','sync.finish',{deputados:deputados.length,senadores:senadores.length});
  } catch (err) {
    logger.log('error','sync.failed',{err:String(err)});
    throw err;
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--once')) {
    runOnce().catch(e => {
      console.error('sync failed', e && e.message);
      process.exit(1);
    });
  } else {
    // simple scheduler loop (interval configurable)
    const intervalMs = Number(process.env.SYNC_INTERVAL_MS || 1000 * 60 * 30);
    (async () => {
      while (true) {
        try { await runOnce(); } catch(e) { /* logged by runOnce */ }
        await new Promise(r => setTimeout(r, intervalMs));
      }
    })();
  }
}

module.exports = { runOnce, withRetry };
