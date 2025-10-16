const fs = require('fs');
const path = require('path');
function loadJSON(p){
  try{ const txt = fs.readFileSync(p,'utf8'); return JSON.parse(txt); } catch(e){ return {__error: String(e)}; }
}
(function(){
  const root = path.join(__dirname, '..');
  const indexPath = path.join(root, 'resources', 'data', 'index.json');
  const manifestPath = path.join(root, 'resources', 'data', 'manifest.json');
  const samplePath = path.join(root, 'resources', 'data', 'despesas.json');
  console.log('Checking files under', root);
  const idx = loadJSON(indexPath);
  const mani = loadJSON(manifestPath);
  const sample = loadJSON(samplePath);
  console.log('index.json ->', idx.__error ? ('ERROR: '+idx.__error) : (`datasets=${Array.isArray(idx.datasets)?idx.datasets.length: 'unknown'}`));
  console.log('manifest.json ->', mani.__error ? ('ERROR: '+mani.__error) : (`files=${Array.isArray(mani.files)?mani.files.length: 'unknown'}`));
  console.log('despesas.json ->', sample.__error ? ('ERROR: '+sample.__error) : (`records=${Array.isArray(sample)?sample.length:'not-array'}`));
  // quick sanity: does manifest include despesas.json entry?
  if (!mani.__error && Array.isArray(mani.files)){
    const found = mani.files.find(f => (f.json||'').endsWith('/despesas.json') || (f.csv||'') === 'despesas.json');
    console.log('manifest includes despesas.json?', !!found);
  }
  // does index reference datasets array?
  if (!idx.__error && Array.isArray(idx.datasets)){
    const months = idx.datasets.slice(0,5).map(d => d.month).filter(Boolean);
    console.log('sample months (up to 5):', months.join(', '));
  }
})();
