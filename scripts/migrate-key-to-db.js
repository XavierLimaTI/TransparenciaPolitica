// Migrate server/portal_key.json into server DB (json store or sqlite) if available
const fs = require('fs');
const path = require('path');
const KEY_FILE = path.resolve(__dirname, '..', 'server', 'portal_key.json');
try {
  const db = require('../server/db');
  db.init();
  if (!fs.existsSync(KEY_FILE)) {
    console.log('No portal_key.json found; nothing to migrate');
    process.exit(0);
  }
  const raw = fs.readFileSync(KEY_FILE, 'utf8');
  const parsed = JSON.parse(raw || '{}');
  if (parsed && parsed.key) {
    const existing = db.getPortalKey();
    if (!existing) {
      db.setPortalKey(parsed.key);
      console.log('Migrated key into DB');
      process.exit(0);
    } else {
      console.log('DB already has a key; no action taken');
      process.exit(0);
    }
  } else {
    console.log('portal_key.json did not contain a key');
    process.exit(0);
  }
} catch (e) {
  console.error('Migration failed:', e && e.message);
  process.exit(1);
}
