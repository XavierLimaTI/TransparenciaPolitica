#!/usr/bin/env node
const { spawn } = require('child_process');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function formatYYYYMM01(date) {
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    return `${y}${m}01`;
}

async function download(url, dest, attempts = 5) {
    // exponential backoff with jitter
    for (let i = 1; i <= attempts; i++) {
        try {
            await doDownload(url, dest);
            return dest;
        } catch (err) {
            const last = i === attempts;
            const base = 500; // base ms
            const wait = Math.min(30000, Math.round(base * Math.pow(2, i - 1))); // cap at 30s
            const jitter = Math.round(Math.random() * 300);
            if (last) {
                console.error(`Download failed (final attempt ${i}) for ${url}: ${err.message}`);
                throw err;
            }
            console.warn(`Download failed (attempt ${i}) for ${url}: ${err.message}. Retrying in ${wait + jitter}ms...`);
            await new Promise(r => setTimeout(r, wait + jitter));
        }
    }
}

function doDownload(url, dest) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const mod = u.protocol === 'https:' ? https : http;
        const opts = { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TransparenciaBot/1.0)' } };
        // if PORTAL_API_KEY is set in env, include it for Portal da Transparência requests
        try {
            const portalKey = process.env.PORTAL_API_KEY || process.env.PORTAL_KEY || process.env.PORTAL_API;
            if (portalKey && u.hostname && u.hostname.indexOf('portaldatransparencia') !== -1) {
                opts.headers['chave-api-dados'] = portalKey;
            }
        } catch (e) { /* ignore */ }
        const req = mod.get(u, opts, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(doDownload(res.headers.location, dest));
            }
            if (res.statusCode !== 200) return reject(new Error('Request failed ' + res.statusCode));
            const file = fs.createWriteStream(dest);
            res.pipe(file);
            file.on('finish', () => file.close(() => resolve(dest)));
            file.on('error', reject);
        });
        req.on('error', reject);
    });
}

function mkdirp(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

async function main() {
    const argv = require('minimist')(process.argv.slice(2));
    const dry = !!argv['dry-run'] || !!argv.dry;
    const extract = !!argv.extract;
    let AdmZip = null;
    if (extract) {
        try { AdmZip = require('adm-zip'); } catch (e) { console.error('adm-zip not installed. Install or remove --extract flag.'); process.exit(2); }
    }
    const rate = Number(argv.rate || 0); // downloads per minute, 0 = no rate limit
    const maxAttempts = Number(argv.attempts || argv.a || 5);
    // defaults: last 12 months
    const now = new Date();
    const defaultEnd = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultStart = new Date(defaultEnd.getFullYear(), defaultEnd.getMonth() - 11, 1);

    const start = argv.start ? new Date(argv.start) : defaultStart;
    const end = argv.end ? new Date(argv.end) : defaultEnd;
    const type = argv.type || 'despesas'; // other types exist on the portal

    const outDir = path.resolve(__dirname, '..', 'resources', 'data', type);
    mkdirp(outDir);
    const checkpointFile = path.join(outDir, '.checkpoint.json');
    let checkpoint = {};
    try { checkpoint = JSON.parse(fs.readFileSync(checkpointFile, 'utf8')); } catch (e) { checkpoint = {}; }

    const failures = [];
    for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d.setMonth(d.getMonth() + 1)) {
        const token = formatYYYYMM01(d);
        const url = `https://portaldatransparencia.gov.br/download-de-dados/${type}/${token}`;
        const dest = path.join(outDir, `${token}_${type}.zip`);
        if (checkpoint[token] && fs.existsSync(dest)) { console.log('Checkpoint: exists, skipping', dest); continue; }
        const urlInfo = { url, dest, token };
        if (dry) { console.log('[dry-run] would download', urlInfo); continue; }
        try {
            console.log('Downloading', url);
            await download(url, dest, maxAttempts);
            // update checkpoint
            checkpoint[token] = { downloadedAt: (new Date()).toISOString(), file: path.basename(dest) };
            fs.writeFileSync(checkpointFile, JSON.stringify(checkpoint, null, 2));
            if (extract) {
                try {
                    console.log('Extracting', dest);
                    const zip = new AdmZip(dest);
                    const extractTo = path.join(outDir, token);
                    mkdirp(extractTo);
                    zip.extractAllTo(extractTo, true);
                    console.log('Extracted to', extractTo);
                } catch (e) { console.error('Extraction error for', dest, e.message || e); }
            }
            console.log('Saved', dest);
        } catch (err) {
            console.error('Failed to download', url, err.message || err);
            failures.push({ token, url, error: (err && err.message) || String(err) });
        }
        // rate limit handling
        if (rate > 0) {
            const delayMs = Math.ceil(60000 / rate);
            await new Promise(r => setTimeout(r, delayMs));
        }
    }

    // write failures summary if any
    if (failures.length > 0) {
        const errFile = path.join(outDir, 'download_errors.json');
        try {
            fs.writeFileSync(errFile, JSON.stringify({ failures, generatedAt: (new Date()).toISOString() }, null, 2));
            console.error(`Download completed with ${failures.length} failures. See ${errFile}`);
        } catch (e) {
            console.error('Failed to write error summary file', e && e.message);
        }
        // exit with non-zero unless explicitly tolerated
        const tolerate = process.env.TOLERATE_DOWNLOAD_ERRORS === '1' || process.env.TOLERATE_DOWNLOAD_ERRORS === 'true';
        if (!tolerate) {
            process.exitCode = 2;
            throw new Error('Some downloads failed; see download_errors.json');
        } else {
            console.warn('TOLERATE_DOWNLOAD_ERRORS is set — continuing despite download failures');
        }
    }
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
