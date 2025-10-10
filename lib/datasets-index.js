// Simple client to fetch /datasets-index and render a small list into #datasets-index
(function(){
  async function fetchIndex(){
    // Try primary endpoint first
    try{
      const r = await fetch('/datasets-index');
      if (r && r.ok) return await r.json();
    }catch(e){ /* ignore and try fallback */ }

    // Fallback to local static index file (useful when running without proxy)
    try{
      const r2 = await fetch('/resources/data/index.json');
      if (r2 && r2.ok) return await r2.json();
    }catch(e){ /* ignore */ }

    return null;
  }

  function renderIndex(data){
    if (!data || !Array.isArray(data.datasets)) return;
    const container = document.getElementById('datasets-index');
    if (!container) return;
    container.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'space-y-2';
    data.datasets.slice().reverse().forEach(d => {
      const li = document.createElement('li');
      li.className = 'p-3 border rounded bg-white';
      li.innerHTML = `<strong>${d.month}</strong> — ${d.files.length} files`;
      ul.appendChild(li);
    });
    container.appendChild(ul);
  }

  window.addEventListener('load', async ()=>{
    const idx = await fetchIndex();
    renderIndex(idx);
  });
})();
