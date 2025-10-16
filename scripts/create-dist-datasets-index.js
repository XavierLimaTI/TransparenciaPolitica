const fs = require('fs');
const path = require('path');
(async function(){
  try {
    const src = path.join(__dirname, '..', 'resources', 'data', 'index.json');
    const destDir = path.join(__dirname, '..', 'dist');
    const dest = path.join(destDir, 'datasets-index');
    if (!fs.existsSync(src)) { console.error('Source index.json not found at', src); process.exit(2); }
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    const content = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dest, content, 'utf8');
    console.log('Wrote static datasets-index for preview at', dest);
    process.exit(0);
  } catch (err) {
    console.error('Failed to create dist datasets-index:', err);
    process.exit(1);
  }
})();