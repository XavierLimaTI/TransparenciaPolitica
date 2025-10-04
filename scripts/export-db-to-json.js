const fs = require('fs');
const path = require('path');
const db = require('../server/db');

(async function main(){
  try {
    const impl = db.init();
    const outPath = path.resolve(__dirname, '..', 'server', 'db.json.export');
    const data = { portal_key: null, datasets: {} };
    if (impl && impl.type === 'sqlite') {
      data.portal_key = db.getPortalKey();
      const list = db.listDatasets();
      for (const it of list) {
        data.datasets[it.path] = { extracted: it.extracted, row_count: it.row_count, updated_at: it.updated_at };
      }
    } else {
      // fallback: try to read existing JSON
      const p = path.resolve(__dirname, '..', 'server', 'db.json');
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf8');
        Object.assign(data, JSON.parse(raw || '{}'));
      }
    }
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('Exported DB to', outPath);
  } catch (e) {
    console.error('Export failed:', e && e.message);
    process.exit(1);
  }
})();
