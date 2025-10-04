const fs = require('fs');
const path = require('path');
const { parseDespesasCSV } = require('../lib/csv-parser');

const dataDir = path.resolve(__dirname, '..', 'resources', 'data');
const outDir = path.join(dataDir, 'ingested');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function isCsv(f) {
  const n = f.toLowerCase();
  return n.endsWith('.csv');
}

function walk(dir) {
  const out = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

(async () => {
  console.log('Scanning', dataDir);
  if (!fs.existsSync(dataDir)) {
    console.error('No data dir found:', dataDir);
    process.exit(1);
  }

  const files = walk(dataDir).filter(f => isCsv(f));
  const manifest = { files: [] };

  for (const f of files) {
    try {
      const rel = path.relative(dataDir, f).replace(/\\/g, '/');
      console.log('Ingesting', rel);
      const txt = fs.readFileSync(f, 'utf8');
      const parsed = parseDespesasCSV(txt);
      const outName = rel.replace(/\//g, '__').replace(/[^a-z0-9_.-]/gi, '_') + '.json';
      const outPath = path.join(outDir, outName);
      fs.writeFileSync(outPath, JSON.stringify({ source: rel, count: parsed.length, rows: parsed }, null, 2), 'utf8');
      manifest.files.push({ csv: rel, json: '/resources/data/ingested/' + outName, count: parsed.length });
    } catch (e) {
      console.warn('Failed to ingest', f, e && e.message);
    }
  }

  fs.writeFileSync(path.join(dataDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Ingest complete. Manifest entries:', manifest.files.length);
})();
