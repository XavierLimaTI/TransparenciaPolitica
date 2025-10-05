#!/usr/bin/env node
// Download GitHub Actions run logs ZIP to a local file.
// Usage (PowerShell):
//   $Env:GITHUB_TOKEN = 'ghp_xxx'; node scripts\github\download-run-logs.js --owner XavierLimaTI --repo TransparenciaPolitica --run 123456 --out ./run-123456-logs.zip

const https = require('https');
const fs = require('fs');
const path = require('path');

function usage() {
  console.log('\nUsage: node scripts/github/download-run-logs.js --owner <owner> --repo <repo> --run <run_id> [--out <file>]');
  console.log('Example (PowerShell):');
  console.log("  $Env:GITHUB_TOKEN = 'ghp_xxx'; node scripts\\github\\download-run-logs.js --owner XavierLimaTI --repo TransparenciaPolitica --run 123456 --out ./run-123456-logs.zip\n");
}

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx+1];
}

const owner = getArg('--owner');
const repo = getArg('--repo');
const runId = getArg('--run');
let out = getArg('--out');
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!owner || !repo || !runId) {
  usage();
  process.exit(1);
}
if (!token) {
  console.error('ERROR: GITHUB_TOKEN environment variable required.');
  process.exit(1);
}

if (!out) out = `./run-${runId}-logs.zip`;
out = path.resolve(out);

const options = {
  hostname: 'api.github.com',
  path: `/repos/${owner}/${repo}/actions/runs/${runId}/logs`,
  method: 'GET',
  headers: {
    'User-Agent': 'download-run-logs-script',
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`
  }
};

function followAndDownload(url, outPath) {
  const parsed = new URL(url);
  const reqOptions = {
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    method: 'GET',
    headers: {
      'User-Agent': 'download-run-logs-script',
      'Accept': 'application/zip',
      'Authorization': `Bearer ${token}`
    }
  };
  const req = https.request(reqOptions, res => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      // follow redirect
      return followAndDownload(res.headers.location, outPath);
    }
    if (res.statusCode !== 200) {
      console.error('Failed to download logs. Status:', res.statusCode);
      res.pipe(process.stdout);
      process.exit(2);
    }
    const ws = fs.createWriteStream(outPath);
    res.pipe(ws);
    ws.on('finish', () => {
      console.log(`Saved logs to ${outPath}`);
      console.log('You can unzip the file (e.g., Windows Explorer or `tar -xf <file>`).');
    });
  });
  req.on('error', err => {
    console.error('Request error:', err);
    process.exit(3);
  });
  req.end();
}

console.log(`Requesting logs for run ${runId}...`);
const req = https.request(options, res => {
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    // api returns a redirect to the actual ZIP location
    followAndDownload(res.headers.location, out);
  } else if (res.statusCode === 200) {
    // direct body is zip
    const ws = fs.createWriteStream(out);
    res.pipe(ws);
    ws.on('finish', () => console.log(`Saved logs to ${out}`));
  } else {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
      console.error('Failed to obtain logs:', res.statusCode, body);
      process.exit(2);
    });
  }
});
req.on('error', err => { console.error('Request error:', err); process.exit(3); });
req.end();
