
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, 'data.db');
const JSON_PATH = process.env.JSON_DB_PATH || path.resolve(__dirname, 'db.json');

let impl = null; // will hold the implementation (sqlite or json)

function ensureDir(p) {
  try { fs.mkdirSync(path.dirname(p), { recursive: true }); } catch (e) {}
}

function init() {
  if (impl) return impl;

  // try SQLite first
  try {
    const Database = require('better-sqlite3');
    ensureDir(DB_PATH);
    const db = new Database(DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS portal_keys (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        key TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS datasets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE,
        extracted INTEGER DEFAULT 0,
        row_count INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    impl = {
      type: 'sqlite',
      getPortalKey: () => {
        const row = db.prepare('SELECT key FROM portal_keys WHERE id = 1').get();
        return row ? row.key : null;
      },
      setPortalKey: (key) => {
        const exists = db.prepare('SELECT 1 FROM portal_keys WHERE id = 1').get();
        if (exists) db.prepare('UPDATE portal_keys SET key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(key);
        else db.prepare('INSERT INTO portal_keys (id, key) VALUES (1, ?)').run(key);
      },
      unsetPortalKey: () => db.prepare('DELETE FROM portal_keys WHERE id = 1').run(),
      listDatasets: () => db.prepare('SELECT path, extracted, row_count, updated_at FROM datasets ORDER BY path').all(),
      upsertDataset: (pathname, extracted = 0, row_count = 0) => {
        db.prepare('INSERT INTO datasets (path, extracted, row_count) VALUES (?, ?, ?) ON CONFLICT(path) DO UPDATE SET extracted = excluded.extracted, row_count = excluded.row_count, updated_at = CURRENT_TIMESTAMP').run(pathname, extracted, row_count);
      }
    };

    return impl;
  } catch (e) {
    // fallback to JSON file store
    try {
      ensureDir(JSON_PATH);
      if (!fs.existsSync(JSON_PATH)) fs.writeFileSync(JSON_PATH, JSON.stringify({ portal_key: null, datasets: {} }, null, 2), 'utf8');
    } catch (err) {
      throw new Error('Could not initialize JSON DB: ' + (err && err.message));
    }

    function read() {
      try {
        const raw = fs.readFileSync(JSON_PATH, 'utf8');
        return JSON.parse(raw || '{}');
      } catch (err) {
        return { portal_key: null, datasets: {} };
      }
    }

    function write(obj) {
      const tmp = JSON_PATH + '.tmp';
      fs.writeFileSync(tmp, JSON.stringify(obj, null, 2), 'utf8');
      fs.renameSync(tmp, JSON_PATH);
    }

    impl = {
      type: 'json',
      getPortalKey: () => {
        const o = read();
        return o.portal_key || null;
      },
      setPortalKey: (key) => {
        const o = read();
        o.portal_key = key;
        write(o);
      },
      unsetPortalKey: () => {
        const o = read();
        o.portal_key = null;
        write(o);
      },
      listDatasets: () => {
        const o = read();
        return Object.keys(o.datasets || {}).map(k => ({ path: k, extracted: o.datasets[k].extracted || 0, row_count: o.datasets[k].row_count || 0, updated_at: o.datasets[k].updated_at || null }));
      },
      upsertDataset: (pathname, extracted = 0, row_count = 0) => {
        const o = read();
        o.datasets = o.datasets || {};
        o.datasets[pathname] = { extracted: extracted ? 1 : 0, row_count: row_count || 0, updated_at: new Date().toISOString() };
        write(o);
      }
    };

    return impl;
  }
}

function getPortalKey() { init(); return impl.getPortalKey(); }
function setPortalKey(k) { init(); return impl.setPortalKey(k); }
function unsetPortalKey() { init(); return impl.unsetPortalKey(); }
function listDatasets() { init(); return impl.listDatasets(); }
function upsertDataset(p, e = 0, r = 0) { init(); return impl.upsertDataset(p, e, r); }
function deleteDataset(p) { init(); if (impl.type === 'sqlite') { const Database = require('better-sqlite3'); const db = new Database(DB_PATH); db.prepare('DELETE FROM datasets WHERE path = ?').run(p); } else { const o = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8') || '{}'); if (o.datasets) { delete o.datasets[p]; fs.writeFileSync(JSON_PATH, JSON.stringify(o, null, 2), 'utf8'); } } }

module.exports = { init, getPortalKey, setPortalKey, unsetPortalKey, listDatasets, upsertDataset, deleteDataset, DB_PATH, JSON_PATH };

