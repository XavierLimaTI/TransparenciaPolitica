const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.resolve(__dirname, 'data.db');
let db;

function init() {
  if (db) return db;
  // ensure directory exists
  try { fs.mkdirSync(path.dirname(DB_PATH), { recursive: true }); } catch (e) {}

  const Database = require('better-sqlite3');
  db = new Database(DB_PATH);

  // initialize schema
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

  return db;
}

function getPortalKey() {
  init();
  const row = db.prepare('SELECT key FROM portal_keys WHERE id = 1').get();
  return row ? row.key : null;
}

function setPortalKey(key) {
  init();
  const exists = db.prepare('SELECT 1 FROM portal_keys WHERE id = 1').get();
  if (exists) {
    db.prepare('UPDATE portal_keys SET key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1').run(key);
  } else {
    db.prepare('INSERT INTO portal_keys (id, key) VALUES (1, ?)').run(key);
  }
}

function unsetPortalKey() {
  init();
  db.prepare('DELETE FROM portal_keys WHERE id = 1').run();
}

function listDatasets() {
  init();
  return db.prepare('SELECT path, extracted, row_count, updated_at FROM datasets ORDER BY path').all();
}

function upsertDataset(pathname, extracted = 0, row_count = 0) {
  init();
  db.prepare('INSERT INTO datasets (path, extracted, row_count) VALUES (?, ?, ?) ON CONFLICT(path) DO UPDATE SET extracted = excluded.extracted, row_count = excluded.row_count, updated_at = CURRENT_TIMESTAMP').run(pathname, extracted, row_count);
}

module.exports = { init, getPortalKey, setPortalKey, unsetPortalKey, listDatasets, upsertDataset, DB_PATH };
