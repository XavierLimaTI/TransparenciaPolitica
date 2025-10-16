const MANIFEST_URL = '/resources/data/manifest.json';

async function fetchJson(url){
  const r = await fetch(url);
  if (!r.ok) throw new Error('fetch failed ' + r.status);
  return await r.json();
}

function el(id){ return document.getElementById(id); }

async function loadManifest(){
  try{
    const manifest = await fetchJson(MANIFEST_URL);
    return manifest;
  }catch(e){
    console.warn('manifest not found', e);
    return null;
  }
}

function renderManifest(manifest, filter){
  const container = el('datasetsList');
  container.innerHTML = '';
  if (!manifest || !Array.isArray(manifest.files)) { container.textContent = 'Manifest não disponível.'; return; }
  const files = manifest.files.slice().filter(f => { if (!f) return false; const label = (typeof f === 'string') ? f : (f.csv || f.json || ''); if (!filter) return true; return label.toLowerCase().includes(filter.toLowerCase()); });
  if (files.length === 0) { container.textContent = 'Nenhum arquivo encontrado'; return; }
  files.forEach(f => {
    const label = (typeof f === 'string') ? f : (f.csv || f.json || JSON.stringify(f));
    const a = document.createElement('a'); a.href = '#'; a.textContent = label; a.dataset.path = (typeof f === 'string') ? ('/resources/data/'+f) : (f.json ? ('/resources/'+f.json.replace(/^\/*/,'') ) : ('/resources/data/'+(f.csv||'') ));
    a.addEventListener('click', async (e) => { e.preventDefault(); await openDataset(a.dataset.path, label); });
    container.appendChild(a);
  });
}

async function openDataset(path, label){
  const title = el('datasetTitle'); const info = el('datasetInfo'); const meta = el('datasetMeta'); const preview = el('previewPanel'); const charts = el('chartsPanel');
  try{
    meta.classList.remove('hidden');
    title.textContent = label;
    info.textContent = path;
    preview.classList.remove('hidden');
    charts.classList.add('hidden');
    el('previewTableWrapper').innerHTML = 'Carregando...';
    const data = await fetchJson(path);
    const size = (Array.isArray(data) && data.length) || (data && data.rows && data.rows.length) || 0;
    el('datasetInfo').textContent = `Registros: ${size}`;
    // normalize
    const rows = Array.isArray(data) ? data : (data.rows || []);
    el('previewTableWrapper').innerHTML = renderTable(rows.slice(0, Number(el('sampleSize').value || 25)));
    // enable charts if numeric
    try{ renderCharts(rows); } catch(e) { charts.classList.add('hidden'); }
    // setup download
    el('downloadBtn').onclick = () => { const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = label.replace(/[^a-z0-9\.\-_]/gi,'_') + '.json'; document.body.appendChild(a); a.click(); setTimeout(()=>{ try{ document.body.removeChild(a); URL.revokeObjectURL(url); } catch(e){} },500); };
    el('openRawBtn').onclick = () => { window.open(path, '_blank'); };
  }catch(e){ el('previewTableWrapper').innerHTML = 'Erro ao carregar: ' + (e.message || e); }
}

function renderTable(rows){
  if (!rows || rows.length === 0) return '<div class="text-sm text-slate-600">Sem dados</div>';
  const cols = Object.keys(rows[0]);
  let html = '<table class="table"><thead><tr>' + cols.map(c=>`<th>${c}</th>`).join('') + '</tr></thead><tbody>';
  for (let r of rows){ html += '<tr>' + cols.map(c=>`<td>${String(r[c]===undefined?'':r[c])}</td>`).join('') + '</tr>'; }
  html += '</tbody></table>';
  return html;
}

function renderCharts(rows){
  const area = el('chartArea'); if (!area) return; if (!rows || rows.length === 0) { area.innerHTML = 'Sem dados para gráficos'; return; }
  // pick up first numeric field
  const sample = rows[0]; const numericCols = Object.keys(sample).filter(k => typeof sample[k] === 'number');
  if (numericCols.length === 0) { area.innerHTML = 'Nenhuma coluna numérica detectada para visualização.'; return; }
  const col = numericCols[0];
  const map = {};
  for (const r of rows){ const v = r[col] || 0; map[v] = (map[v] || 0) + 1; }
  const chart = echarts.init(area);
  const series = Object.keys(map).slice(0,50).map(k=>({ name: String(k), value: map[k] }));
  chart.setOption({ tooltip: { trigger: 'item' }, series: [{ type: 'pie', radius: '60%', data: series }] });
  document.getElementById('chartsPanel').classList.remove('hidden');
}

async function init(){
  const manifest = await loadManifest();
  renderManifest(manifest);
  el('refreshBtn').addEventListener('click', async ()=>{ const f = el('searchInput').value||''; renderManifest(await loadManifest(), f); });
  el('searchInput').addEventListener('input', (e)=>{ const v = e.target.value || ''; renderManifest(manifest, v); });
  el('sampleSize').addEventListener('change', ()=>{ const label = el('datasetTitle').textContent; if (label) { const a = Array.from(document.querySelectorAll('#datasetsList a')).find(x=>x.textContent===label); if (a) openDataset(a.dataset.path, label); } });
}

init().catch(e=>{ console.error(e); document.getElementById('datasetsList').textContent = 'Erro: ' + e.message; });
