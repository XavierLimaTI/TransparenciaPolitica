const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, '..', 'resources', 'data', 'manifest.json');
const outPath = path.join(__dirname, '..', 'resources', 'data', 'index.json');

function monthFromCsv(csv) {
  // Try to find a YYYYMMDD pattern in the csv path
  const m = csv.match(/(20\d{6})/);
  if (m) {
    const s = m[1];
    return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  }
  // fallback: use generic tag
  return 'unknown';
}

function makeIndex(manifest) {
  const byMonth = new Map();
  (manifest.files || []).forEach(f => {
    const month = monthFromCsv(f.csv || '');
    const rel = (f.json || '').replace(/^\/resources\//, '');
    if (!byMonth.has(month)) byMonth.set(month, new Set());
    if (rel) byMonth.get(month).add(rel.replace(/^resources\//, '').replace(/^\//, ''));
  });
  const datasets = Array.from(byMonth.entries()).map(([month, set]) => ({
    month,
    files: Array.from(set)
  }));
  // sort by month desc (unknown last)
  datasets.sort((a,b)=>{
    if (a.month === 'unknown') return 1;
    if (b.month === 'unknown') return -1;
    return b.month.localeCompare(a.month);
  });
  return { datasets };
}

function main(){
  if (!fs.existsSync(manifestPath)){
    console.error('manifest.json not found at', manifestPath);
    process.exit(2);
  }
  const raw = fs.readFileSync(manifestPath, 'utf8');
  let manifest;
  try { manifest = JSON.parse(raw); } catch(e){
    console.error('failed to parse manifest.json', e.message);
    process.exit(3);
  }
  const index = makeIndex(manifest);
  fs.writeFileSync(outPath, JSON.stringify(index, null, 2)+'\n', 'utf8');
  console.log('Wrote', outPath);
}

if (require.main === module) main();
