const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Simple downloader that follows redirects and writes to resources/data
// Usage: node scripts/download_portal_datasets.js <url1> <url2> ...

async function download(url, dest) {
    return new Promise((resolve, reject) => {
        const uri = new URL(url);
        const mod = uri.protocol === 'https:' ? https : http;
        const opts = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; TransparenciaBot/1.0)'
            }
        };
        const req = mod.get(uri, opts, res => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                // follow redirect
                return resolve(download(res.headers.location, dest));
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

async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error('Provide one or more URLs to download. Example:\n  node scripts/download_portal_datasets.js https://portaldatransparencia.gov.br/download-de-dados/despesas/20250101');
        process.exit(2);
    }

    const outDir = path.resolve(__dirname, '..', 'resources', 'data');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    for (const url of args) {
        try {
            const u = new URL(url);
            const basename = path.basename(u.pathname) || 'download';
            const dest = path.join(outDir, basename + (u.search ? encodeURIComponent(u.search) : ''));
            console.log('Downloading', url, '->', dest);
            const saved = await download(url, dest);
            console.log('Saved to', saved);
        } catch (err) {
            console.error('Error downloading', url, err.message || err);
        }
    }
}

main();
