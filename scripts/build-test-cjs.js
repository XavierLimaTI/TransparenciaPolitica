const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'lib');
const outDir = path.join(__dirname, '..', 'test-build', 'lib');

if (!fs.existsSync(srcDir)) {
  console.error('src/lib directory not found, skipping test build');
  process.exit(0);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const entries = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'))
  .map(f => path.join(srcDir, f));

if (entries.length === 0) {
  console.log('No entry files found in src/lib, skipping esbuild');
  process.exit(0);
}

esbuild.build({
  entryPoints: entries,
  outdir: outDir,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: ['node14'],
  sourcemap: false,
}).then(() => {
  console.log('Test CJS build finished ->', outDir);
}).catch(err => {
  console.error('esbuild error', err);
  process.exit(1);
});
