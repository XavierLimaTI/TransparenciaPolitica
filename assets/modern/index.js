// Modernized frontend loader: progressive enhancement for existing index.html
// - Keeps existing app/app.js and inline behaviors as fallback
// - Adds dataset manifest listing and binds demo controls

// Idempotency guard: avoid double-binding when injected multiple times
if (!window.__pt_modern_loaded) {
  window.__pt_modern_loaded = true;

  async function fetchJson(url){ const r = await fetch(url); if (!r.ok) throw new Error('fetch failed ' + r.status); return await r.json(); }

  function safeText(s){ const d = document.createTextNode(String(s === undefined || s === null ? '' : s)); const span = document.createElement('span'); span.appendChild(d); return span; }

  async function initModern() {
    try {
      // dataset index binding
      const idxEl = document.getElementById('datasets-index');
      if (idxEl) {
        try {
          const idx = await fetchJson('/resources/data/index.json');
          idxEl.innerHTML = '';
          if (idx && Array.isArray(idx.datasets)) {
            const list = document.createElement('div');
            idx.datasets.forEach(ds => {
              const card = document.createElement('div'); card.className = 'card mb-2';
              const h = document.createElement('div'); h.className = 'font-medium'; h.appendChild(safeText(ds.month || ds.label || 'desconhecido'));
              const ul = document.createElement('ul'); ul.className = 'small mt-2';
              (ds.files || []).slice(0,10).forEach(f => { const li = document.createElement('li'); const a = document.createElement('a'); a.href='#'; a.textContent = f; a.addEventListener('click', (e)=>{ e.preventDefault(); loadAndShowJson(a, f); }); li.appendChild(a); ul.appendChild(li); });
              card.appendChild(h); card.appendChild(ul); list.appendChild(card);
            });
            idxEl.appendChild(list);
          } else idxEl.textContent = 'Índice vazio';
        } catch(e) { idxEl.textContent = 'Índice não disponível'; }
      }

      // wire demo button
      const demoBtn = document.getElementById('loadDemoBtn');
      if (demoBtn) demoBtn.addEventListener('click', async () => {
        try {
          const resp = await fetch('/resources/data/despesas.csv.json');
          if (!resp.ok) alert('Demo não encontrada: ' + resp.status);
          const data = await resp.json();
          if (window.governmentAPI && typeof window.governmentAPI.useLocalDespesas === 'function') window.governmentAPI.useLocalDespesas(data.rows || data);
          alert('Demo carregada: ' + ((data.rows && data.rows.length) || (Array.isArray(data) && data.length) || 'desconhecido'));
        } catch (e) { alert('Erro ao carregar demo: ' + e.message); }
      });

    } catch (err) { try { console && console.debug && console.debug('initModern error', err); } catch(e){} }
  }

  // small helper to show JSON in panel
  async function loadAndShowJson(anchor, label) {
    const target = document.getElementById('dataPanel') || document.createElement('div');
    try {
      const r = await fetch(anchor.dataset.path || anchor.href || label);
      if (!r.ok) { alert('Erro: ' + r.status); return; }
      const j = await r.json();
      const rows = Array.isArray(j) ? j : (j.rows || []);
      let html = '<table class="table"><thead><tr>' + (rows[0] ? Object.keys(rows[0]).map(c=>`<th>${c}</th>`).join('') : '<th>sem dados</th>') + '</tr></thead><tbody>';
      rows.slice(0,50).forEach(row => { html += '<tr>' + (Object.keys(row).map(k=>`<td>${String(row[k]===undefined?'':row[k])}</td>`).join('')) + '</tr>'; });
      html += '</tbody></table>';
      target.id = 'dataPanel'; target.className = 'max-w-7xl mx-auto p-6';
      target.innerHTML = '<h3 class="text-lg font-semibold mb-2">' + label + '</h3>' + html;
      const main = document.getElementById('appMain'); if (main && !document.getElementById('dataPanel')) main.parentNode.insertBefore(target, main.nextSibling);
    } catch (e) { alert('Erro ao carregar JSON: ' + e.message); }
  }

  // Initialize when DOM ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') initModern(); else document.addEventListener('DOMContentLoaded', initModern);

  // Charts initialization (mirrors original inline behavior)
  function initCharts() {
    try {
      if (typeof echarts === 'undefined') return;
      const partidoEl = document.getElementById('partidoChart');
      const votacoesEl = document.getElementById('votacoesChart');
      if (partidoEl) {
        const partidoChart = echarts.init(partidoEl);
        const partidoOption = {
          tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
          legend: { orient: 'vertical', left: 'left', textStyle: { fontSize: 12 } },
          series: [{ name: 'Candidatos', type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false, label: { show: false }, emphasis: { label: { show: true, fontSize: '18', fontWeight: 'bold' } }, labelLine: { show: false }, data: [ {value:2,name:'PT'},{value:1,name:'PSDB'},{value:1,name:'MDB'},{value:1,name:'PSOL'},{value:1,name:'PL'},{value:1,name:'PDT'} ] }]
        };
        try { partidoChart.setOption(partidoOption); } catch(e) { /* ignore */ }
      }
      if (votacoesEl) {
        const votacoesChart = echarts.init(votacoesEl);
        const votacoesOption = {
          tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
          legend: { data: ['A favor','Contra','Abstenção'], textStyle: { fontSize: 12 } },
          grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
          xAxis: { type: 'category', data: ['PEC Bandidagem','Reforma Tributária','Marco Startups'], axisLabel: { fontSize: 10, rotate: 45 } },
          yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
          series: [ { name: 'A favor', type: 'bar', stack: 'total', data: [350,380,420], itemStyle:{color:'#22C55E'} }, { name:'Contra', type:'bar', stack:'total', data:[120,90,30], itemStyle:{color:'#EF4444'} }, { name:'Abstenção', type:'bar', stack:'total', data:[15,15,35], itemStyle:{color:'#6B7280'} } ]
        };
        try { votacoesChart.setOption(votacoesOption); } catch(e) { /* ignore */ }
        window.addEventListener && window.addEventListener('resize', function(){ try { partidoEl && echarts.getInstanceByDom(partidoEl) && echarts.getInstanceByDom(partidoEl).resize(); votacoesEl && echarts.getInstanceByDom(votacoesEl) && echarts.getInstanceByDom(votacoesEl).resize(); } catch(e){} });
      }
    } catch (e) { try { console && console.debug && console.debug('initCharts failed', e); } catch(e){} }
  }

  // mobile menu helper
  function bindMobileMenu(){ try { const btn = document.querySelector('.mobile-menu-btn'); if (!btn) return; btn.addEventListener('click', ()=>{ const mob = document.querySelector('.mobile-menu'); if (mob) mob.classList.toggle('hidden'); }); } catch(e){} }

  // Run charts and bindings after init
  try { if (document.readyState === 'complete' || document.readyState === 'interactive') { initCharts(); bindMobileMenu(); } else { document.addEventListener('DOMContentLoaded', ()=>{ initCharts(); bindMobileMenu(); }); } } catch(e){}

}
