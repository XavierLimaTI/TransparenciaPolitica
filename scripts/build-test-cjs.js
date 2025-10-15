const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'lib');
const outDir = path.join(__dirname, '..', 'test-build', 'lib');

if (!fs.existsSync(srcDir)) {
  console.warn('src/lib directory not found, skipping test build (this is OK for some CI jobs)');
  // Do not fail the process; tests may still run against committed CJS in lib/
  process.exitCode = 0;
  return;
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const entries = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'))
  .map(f => path.join(srcDir, f));

if (entries.length === 0) {
  console.warn('No entry files found in src/lib, skipping esbuild (nothing to build)');
  process.exitCode = 0;
  return;
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
