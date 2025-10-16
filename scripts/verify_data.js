#!/usr/bin/env node
// scripts/verify_data.js
// Baixa data/manifest.json (via gh-pages) e testa amostralmente alguns arquivos

const https = require('https');
const { promisify } = require('util');
const { pipeline } = require('stream');
const streamPipeline = promisify(pipeline);

function getJson(url){
  return new Promise((res, rej) => {
    https.get(url, (r) => {
      const { statusCode } = r;
      if(statusCode !== 200){
        rej(new Error('Status '+statusCode+' for '+url));
        r.resume();
        return;
      }
      let data='';
      r.on('data', c => data+=c);
      r.on('end', () => {
        try{ res(JSON.parse(data)); } catch(e){ rej(e) }
      });
    }).on('error', rej);
  });
}

async function head(url){
  return new Promise((res, rej) => {
    const req = https.request(url, { method: 'HEAD' }, (r)=>{
      res({ statusCode: r.statusCode, headers: r.headers });
    });
    req.on('error', rej);
    req.end();
  });
}

async function main(){
  const base = process.env.PAGES_BASE || 'https://XavierLimaTI.github.io/TransparenciaPolitica';
  const manifestUrl = base + '/data/manifest.json';
  console.log('Fetching manifest:', manifestUrl);
  let manifest;
  try{
    manifest = await getJson(manifestUrl);
  }catch(e){
    console.error('Failed to fetch manifest:', e.message);
    process.exit(2);
  }
  if(!Array.isArray(manifest.files)){
    console.error('Manifest missing files array');
    process.exit(2);
  }
  console.log('Manifest files count:', manifest.files.length);
  // amostra: testar 5 arquivos (ou todos se <5)
  const sample = manifest.files.slice(0,5);
  for(const f of sample){
    const name = (f.name||f).replace(/^\/+/, '');
    const url = base + '/data/' + name;
    try{
      const h = await head(url);
      console.log(name, '=>', h.statusCode, 'content-type:', h.headers['content-type']);
    }catch(e){
      console.error('Error fetching', url, e.message);
    }
  }
  console.log('Sample check complete');
}

main().catch(e=>{ console.error(e); process.exit(1) });
