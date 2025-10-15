#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function safeReadJson(p) {
  try {
    if (!fs.existsSync(p)) return null;
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function summarize(jestJson) {
  const out = {
    numTotalTests: jestJson?.numTotalTests || 0,
    numPassedTests: jestJson?.numPassedTests || 0,
    numFailedTests: jestJson?.numFailedTests || 0,
    numPendingTests: jestJson?.numPendingTests || 0,
    numRuntimeErrorTestSuites: jestJson?.numRuntimeErrorTestSuites || 0,
    failedSuites: []
  };

  if (Array.isArray(jestJson?.testResults)) {
    for (const tr of jestJson.testResults) {
      if (tr.status && tr.status !== 'passed') {
        const failures = [];
        if (Array.isArray(tr.assertionResults)) {
          for (const ar of tr.assertionResults) {
            if (ar.status && ar.status !== 'passed') {
              failures.push({
                fullName: ((ar.ancestorTitles || []).concat([ar.title || ''])).join(' > '),
                failureMessage: (Array.isArray(ar.failureMessages) && ar.failureMessages[0]) ? String(ar.failureMessages[0]).replace(/\r?\n/g, ' ') : '<no message>'
              });
            }
          }
        }
        out.failedSuites.push({
          file: tr.name || tr.testFilePath || '<unknown file>',
          status: tr.status,
          failures: failures.slice(0, 10)
        });
      }
    }
  }
  // Sort by number of failures desc
  out.failedSuites.sort((a,b) => (b.failures?.length || 0) - (a.failures?.length || 0));
  // Only keep top 10 suites
  out.failedSuites = out.failedSuites.slice(0, 10);
  return out;
}

function main() {
  const inPath = process.argv[2] || path.join('artifacts', 'jest-output.json');
  const outPath = process.argv[3] || path.join('artifacts', 'jest-summary.json');

  const j = safeReadJson(inPath);
  if (!j) {
    const fallback = { error: 'jest-output.json not found or invalid', path: inPath };
    try { fs.mkdirSync(path.dirname(outPath), { recursive: true }); } catch(e) {}
    fs.writeFileSync(outPath, JSON.stringify(fallback, null, 2), 'utf8');
    console.log('Wrote jest-summary (fallback):', outPath);
    console.log(JSON.stringify(fallback, null, 2));
    process.exit(0);
  }

  const summary = summarize(j);
  try { fs.mkdirSync(path.dirname(outPath), { recursive: true }); } catch(e) {}
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');
  console.log('Wrote jest-summary:', outPath);
  console.log(JSON.stringify(summary, null, 2));
}

main();
