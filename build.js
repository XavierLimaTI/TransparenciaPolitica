const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const outdir = path.resolve(__dirname, 'dist');

function copy(src, dest) {
  try {
    if (!fs.existsSync(src)) return;
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      for (const file of fs.readdirSync(src)) {
        copy(path.join(src, file), path.join(dest, file));
      }
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      // Try copyFileSync, but be resilient to transient FS errors on Windows
      try {
        fs.copyFileSync(src, dest);
      } catch (err) {
        // retry once
        try {
          fs.copyFileSync(src, dest);
        } catch (err2) {
          try {
            // fallback to streaming copy
            const data = fs.readFileSync(src);
            fs.writeFileSync(dest, data);
          } catch (err3) {
            console.warn('Warning: failed to copy', src, '->', dest, err3 && err3.message);
            return; // skip this file
          }
        }
      }
    }
  } catch (e) {
    console.warn('Warning in copy():', src, dest, e && e.message);
  }
}

(async () => {
  // Clean dist
  // Clean dist (robust): try rmSync first, fallback to manual recursive delete to avoid ENOTEMPTY on some Windows setups
  function removeDirRecursiveSync(dir) {
    if (!fs.existsSync(dir)) return;
    try {
      fs.rmSync(dir, { recursive: true, force: true });
      return;
    } catch (err) {
      // fallback: walk and remove files/dirs
      try {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const p = path.join(dir, entry);
          const stat = fs.lstatSync(p);
          if (stat.isDirectory()) {
            removeDirRecursiveSync(p);
          } else {
            try { fs.unlinkSync(p); } catch (e) {}
          }
        }
        try { fs.rmdirSync(dir); } catch (e) {}
      } catch (e) {
        // give up silently
      }
    }
  }

  removeDirRecursiveSync(outdir);
  fs.mkdirSync(outdir, { recursive: true });

  // Bundle JS
  // Prefer src/index.js, but fall back to main.js for small PRs or branches
  // that don't include a src/ directory. This avoids esbuild failing the
  // whole job when only docs/workflows were changed.
  let entry = path.join(__dirname, 'src', 'index.js');
  if (!fs.existsSync(entry)) {
    // fallback to root-level main.js (older layout)
    const fallback = path.join(__dirname, 'main.js');
    if (fs.existsSync(fallback)) {
      console.log('build.js: src/index.js not found; using fallback main.js');
      entry = fallback;
    } else {
      console.warn('build.js: neither src/index.js nor main.js found; attempting to build anyway and letting esbuild error if needed');
      entry = path.join(__dirname, 'src', 'index.js');
    }
  } else {
    console.log('build.js: using entry', entry);
  }
  await esbuild.build({
    entryPoints: [entry],
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
    // For index.html, generate a production-ready variant that loads the bundle
    if (f === 'index.html') {
      const src = path.join(__dirname, f);
      if (fs.existsSync(src)) {
        let html = fs.readFileSync(src, 'utf8');
  // Replace the dynamic injection script block (script that builds `files` array and appends scripts)
  // Match a <script> tag that contains the `var files = [...]` array and the appendChild logic.
  html = html.replace(/<script>[\s\S]*?var\s+files\s*=\s*\[[\s\S]*?\];[\s\S]*?document\.body\.appendChild\(s\);[\s\S]*?<\/script>/, '<script src="main.js"></script>');
  // Remove the cache-bust helper block if present (not needed for production)
  html = html.replace(/<script>[\s\S]*?window\.__cacheBust[\s\S]*?<\/script>/, '');
        fs.writeFileSync(path.join(outdir, f), html, 'utf8');
        continue;
      }
    }
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

  // For static previews, create a top-level /datasets-index endpoint by
  // copying resources/data/index.json to dist/datasets-index (no extension).
  // The frontend first tries to fetch /datasets-index (provided by the
  // development proxy). Providing this file makes static servers like
  // http-server behave like the proxy for previewing the datasets index.
  try {
    const indexSrc = path.join(dataDest, 'index.json');
    const indexDest = path.join(outdir, 'datasets-index');
    if (fs.existsSync(indexSrc)) {
      fs.copyFileSync(indexSrc, indexDest);
      console.log('Wrote static datasets-index for preview at', indexDest);
    }
  } catch (e) {
    // non-fatal
  }

  // Create a safe fallback for despesas.json expected by the dev-loader
  try {
    const ingestedDir = path.join(dataDest, 'ingested');
    const candidates = [
      path.join(ingestedDir, 'despesas.json'),
      path.join(ingestedDir, 'despesas.csv.json'),
      path.join(ingestedDir, 'despesas-ingested.json')
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        const target = path.join(dataDest, 'despesas.json');
        fs.copyFileSync(c, target);
        console.log('Copied fallback despesas.json from', c, 'to', target);
        break;
      }
    }
  } catch (e) {
    // non-fatal
  }

  // Copy api-integration.js so pages that include it directly keep working
  copy(path.join(__dirname, 'api-integration.js'), path.join(outdir, 'api-integration.js'));

  console.log('Build finished. Files written to', outdir);
})();
