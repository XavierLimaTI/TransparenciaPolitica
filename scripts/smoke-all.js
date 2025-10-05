// smoke-all.js - run basic smoke tests: csv-parse, government-api quick test, server debug fetch
const { spawnSync } = require('child_process');
const path = require('path');

function run(cmd, args, label) {
  console.log('\n=== Running:', label, '=>', cmd, args.join(' '));
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (res.status !== 0) { console.error(`\n*** ${label} FAILED with code ${res.status}`); process.exit(res.status); }
}

// 1. csv unit tests
run('node', [path.resolve(__dirname, 'test-csv-unit.js')], 'CSV Unit Tests');
// 2. csv parse smoke
run('node', [path.resolve(__dirname, 'test-csv-parse.js')], 'CSV Parse Smoke');
// 3. government-api quick test
run('node', [path.resolve(__dirname, 'test-government-api.js')], 'Government API Quick Test');
// 4. server-side debug fetch
run('node', [path.resolve(__dirname, 'debug-fetch.js')], 'Server Debug Fetch');

console.log('\n✅ All smoke checks passed');
