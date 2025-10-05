#!/usr/bin/env node
// CI monitor for GitHub Actions (minimal, no external deps)
// Usage (PowerShell):
//   $Env:GITHUB_TOKEN = 'ghp_xxx'; node scripts\github\ci-monitor.js --owner XavierLimaTI --repo TransparenciaPolitica --workflow ci.yml --limit 10
// Or set GITHUB_TOKEN in your environment and run the command without inline assignment.

const https = require('https');

function usage() {
  console.log('\nUsage: node scripts/github/ci-monitor.js --owner <owner> --repo <repo> [--workflow <workflow.yml>] [--limit <n>]');
  console.log('Example (PowerShell):');
  console.log("  $Env:GITHUB_TOKEN = 'ghp_xxx'; node scripts\\github\\ci-monitor.js --owner XavierLimaTI --repo TransparenciaPolitica --workflow ci.yml --limit 10\n");
}

function getArg(name, def) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return def;
  return process.argv[idx+1];
}

const owner = getArg('--owner');
const repo = getArg('--repo');
const workflow = getArg('--workflow', 'ci.yml');
const limit = parseInt(getArg('--limit', '10'), 10) || 10;
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;

if (!owner || !repo) {
  usage();
  process.exit(1);
}

if (!token) {
  console.error('ERROR: GITHUB_TOKEN environment variable is required.');
  usage();
  process.exit(1);
}

function apiGet(path) {
  const options = {
    hostname: 'api.github.com',
    path,
    method: 'GET',
    headers: {
      'User-Agent': 'ci-monitor-script',
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${token}`
    }
  };
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', d => body += d);
      res.on('end', () => {
        try {
          const json = JSON.parse(body || '{}');
          if (res.statusCode >= 400) return reject({ status: res.statusCode, body: json });
          resolve(json);
        } catch (err) { reject(err); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

(async function main(){
  try {
    console.log(`Querying workflow runs for ${owner}/${repo} (workflow=${workflow}) ...`);
    const runsPath = `/repos/${owner}/${repo}/actions/workflows/${encodeURIComponent(workflow)}/runs?per_page=${limit}`;
    const runsRes = await apiGet(runsPath);
    const runs = runsRes.workflow_runs || [];
    if (!runs.length) {
      console.log('No runs found.');
      return;
    }

    for (const run of runs) {
      console.log('\n=== Run ' + run.id + ' ===');
      console.log(`Event: ${run.event}  Conclusion: ${run.conclusion}  Status: ${run.status}`);
      console.log(`Created: ${run.created_at}  Updated: ${run.updated_at}`);
      console.log(`URL: ${run.html_url}`);

      // fetch jobs for the run
      const jobsPath = `/repos/${owner}/${repo}/actions/runs/${run.id}/jobs`;
      try {
        const jobsRes = await apiGet(jobsPath);
        const jobs = jobsRes.jobs || [];
        for (const job of jobs) {
          console.log(`  - Job: ${job.name} | status=${job.status} | conclusion=${job.conclusion} | started_at=${job.started_at} | completed_at=${job.completed_at}`);
        }
      } catch (err) {
        console.error('  Failed to fetch jobs for run', run.id, err && err.status ? `status=${err.status}` : err);
      }
    }
  } catch (err) {
    console.error('Error querying GitHub API:', err && err.status ? `status=${err.status}` : err);
    if (err && err.body && err.body.message) console.error('Message:', err.body.message);
    process.exit(2);
  }
})();
