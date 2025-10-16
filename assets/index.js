(function(){
  function elt(tag, text){ const e=document.createElement(tag); if(text) e.textContent=text; return e }
  const out=document.getElementById('datasets');
  const info=document.getElementById('manifest-loading');
  function listFiles(manifest){
    info.style.display='none';
    const files=manifest.files || (manifest.rows? [{name:manifest.source, count:manifest.count}]:[]);
    if(Array.isArray(files) && files.length){
      files.forEach(f => { let li=document.createElement('li'); let name=(f.name||f).replace(/^\/+/, ''); let a=document.createElement('a'); a.href='./data/'+name; a.textContent = name + (f.count? (' — '+f.count+' rows') : ''); a.target='_blank'; li.appendChild(a); out.appendChild(li); });
    } else { out.appendChild(elt('li','Nenhum dataset encontrado.')) }
  }
  fetch('./data/manifest.json').then(r=>r.json()).then(listFiles).catch(_=>fetch('./data/index.json').then(r=>r.json()).then(listFiles).catch(e=>{ info.textContent='Não foi possível carregar manifest/index: '+(e&&e.message||e); }))
})();
