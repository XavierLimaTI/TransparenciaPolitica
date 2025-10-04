// Quick script to test DB integration
const db = require('../server/db');

function run() {
  console.log('DB path:', db.DB_PATH);
  try {
    db.init();
    console.log('Initial key:', db.getPortalKey());
    db.setPortalKey('TEST_KEY_123');
    console.log('After set:', db.getPortalKey());
    db.unsetPortalKey();
    console.log('After unset:', db.getPortalKey());
    console.log('Datasets:', db.listDatasets());
    console.log('OK');
  } catch (e) {
    console.error('DB test failed:', e && e.message);
    process.exitCode = 1;
  }
}

run();
