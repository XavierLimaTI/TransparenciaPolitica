const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const outdir = path.resolve(__dirname, 'dist');

function copy(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copy(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

(async () => {
  // Clean dist
  if (fs.existsSync(outdir)) {
    fs.rmSync(outdir, { recursive: true, force: true });
  }
  fs.mkdirSync(outdir, { recursive: true });

  // Bundle JS
  await esbuild.build({
    entryPoints: ['main.js'],
    bundle: true,
    minify: true,
    sourcemap: false,
    target: ['es2018'],
    outfile: path.join(outdir, 'main.js'),
  });

  // Copy HTML files
  const htmlFiles = ['index.html', 'candidatos.html', 'votacoes.html', 'sobre.html'];
  // admin page for dataset management
  htmlFiles.push('admin.html');
  for (const f of htmlFiles) {
    copy(path.join(__dirname, f), path.join(outdir, f));
  }

  // Copy resources folder
  copy(path.join(__dirname, 'resources'), path.join(outdir, 'resources'));

  // Copy resources/data (datasets) and generate manifest
  const dataSrc = path.join(__dirname, 'resources', 'data');
  const dataDest = path.join(outdir, 'resources', 'data');
  if (fs.existsSync(dataSrc)) {
    copy(dataSrc, dataDest);
    // generate manifest
    const files = [];
    function walkDir(dir, base) {
      for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) {
          walkDir(p, path.join(base, f));
        } else {
          files.push(path.join(base, f).replace(/\\\\/g, '/'));
        }
      }
    }
    walkDir(dataDest, '');
    fs.writeFileSync(path.join(dataDest, 'manifest.json'), JSON.stringify({ files }, null, 2), 'utf8');
  }

  // Copy api-integration.js so pages that include it directly keep working
  copy(path.join(__dirname, 'api-integration.js'), path.join(outdir, 'api-integration.js'));

  console.log('Build finished. Files written to', outdir);
})();
