const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

function fetchText(url) {
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https:') ? https : http;
        mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        }).on('error', reject);
    });
}

function followAndDownload(url, dest) {
    return new Promise((resolve, reject) => {
        try {
            const u = new URL(url);
            const mod = u.protocol === 'https:' ? https : http;
            const req = mod.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    return resolve(followAndDownload(res.headers.location, dest));
                }
                if (res.statusCode !== 200) return reject(new Error('Request failed ' + res.statusCode));
                const file = fs.createWriteStream(dest);
                res.pipe(file);
                file.on('finish', () => file.close(() => resolve(dest)));
                file.on('error', reject);
            });
            req.on('error', reject);
        } catch (err) {
            reject(err);
        }
    });
}

(async function main() {
    const base = 'https://portaldatransparencia.gov.br/download-de-dados';
    console.log('Fetching index:', base);
    const res = await fetchText(base).catch(err => { console.error('Fetch failed', err.message); process.exit(2); });
    if (res.status >= 400) {
        console.error('Index returned status', res.status); process.exit(2);
    }
    const body = res.body;
    // find hrefs
    const hrefs = new Set();
    const re = /href\s*=\s*"([^"]+)"/gi;
    let m;
    while ((m = re.exec(body)) !== null) {
        const href = m[1];
        if (!href) continue;
        // accept links under /download-de-dados or full URLs to portaldatransparencia
        if (href.includes('/download-de-dados/')) {
            let full = href.startsWith('http') ? href : ('https://portaldatransparencia.gov.br' + href);
            hrefs.add(full.split('#')[0]);
        }
    }

    const candidates = Array.from(hrefs).slice(0, 20);
    console.log('Found', candidates.length, 'candidate links (showing up to 20).');

    const outDir = path.resolve(__dirname, '..', 'resources', 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const maxArg = parseInt(process.argv[2], 10) || 6;
    let count = 0;
    for (const url of candidates) {
        if (count >= maxArg) break; // limit
        try {
            const parsed = new URL(url);
            const name = path.basename(parsed.pathname) || ('download_' + count);
            const destBase = path.join(outDir, name);
            const dest = destBase; // we'll rename if needed
            console.log('Trying', url);
            await followAndDownload(url, dest);
            // inspect file header
            const header = fs.readFileSync(dest).slice(0, 4).toString('hex');
            if (header.startsWith('504b0304')) {
                // zip -> rename with .zip
                const newName = dest + '.zip';
                fs.renameSync(dest, newName);
                console.log('Saved ZIP:', newName);
                // try extract
                try {
                    const extractDir = dest + '_extracted';
                    if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir);
                    // Use PowerShell Expand-Archive on Windows if available
                    const { execSync } = require('child_process');
                    execSync(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${newName}' -DestinationPath '${extractDir}' -Force"`, { stdio: 'ignore' });
                    console.log('Extracted to', extractDir);
                } catch (e) {
                    console.warn('Extraction failed (continue):', e.message);
                }
            } else if (header.startsWith('3c3f786d') || header.startsWith('3c21')) {
                // looks like XML/HTML - keep with .html
                const newName = dest + '.html';
                fs.renameSync(dest, newName);
                console.log('Saved HTML (not dataset):', newName);
            } else {
                // assume CSV or other
                const newName = dest + '.csv';
                fs.renameSync(dest, newName);
                console.log('Saved file:', newName);
            }
            count++;
        } catch (err) {
            console.warn('Failed to download', url, err.message || err);
        }
    }

    console.log('Done. Downloaded', count, 'items (attempted up to 6).');
})();
