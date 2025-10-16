// Minimal app to list datasets and view JSON files in a table
(function(){
  function el(id) { return document.getElementById(id); }

  function create(tag, cls) { const d = document.createElement(tag); if (cls) d.className = cls; return d; }

  async function fetchJson(path) {
    const r = await fetch(path);
    if (!r.ok) throw new Error('fetch failed ' + r.status);
    return await r.json();
  }

  function renderIndex(idx) {
    const container = el('datasets-index');
    container.innerHTML = '';
    if (!idx || !Array.isArray(idx.datasets)) { container.textContent = 'Índice inválido'; return; }
    const list = create('div');
    idx.datasets.forEach(ds => {
      const card = create('div', 'p-3 mb-2 border rounded bg-white');
      const h = create('div', 'font-medium'); h.textContent = ds.month || 'unknown';
      const ul = create('ul', 'list-disc ml-6 mt-2');
      (ds.files || []).forEach(f => {
        const li = create('li');
          const a = create('a'); a.href = '#'; a.textContent = f;
          // normalize path so we don't end up with /resources/data/data/...
          function normalizeResourcePath(p){
            if (!p) return p;
            if (p.startsWith('/resources')) return p;
            if (p.startsWith('resources')) return '/' + p;
            if (p.startsWith('data/')) return '/resources/' + p; // data/ingested/... -> /resources/data/ingested/...
            return '/resources/data/' + p.replace(/^\/*/, '');
          }
          a.dataset.path = normalizeResourcePath(f);
        a.addEventListener('click', async (e) => { e.preventDefault(); loadAndShowJson(a.dataset.path); });
        li.appendChild(a); ul.appendChild(li);
      });
      card.appendChild(h); card.appendChild(ul); list.appendChild(card);
    });
    container.appendChild(list);
  }

  async function loadAndShowJson(path) {
    try {
      const data = await fetchJson(path);
      showTable(data, path);
    } catch (err) {
      alert('Erro ao carregar: ' + err.message);
    }
  }

  function showTable(data, title) {
    const main = el('appMain') || document.body;
    let panel = el('dataPanel');
    if (!panel) {
      panel = create('div'); panel.id = 'dataPanel'; panel.className = 'max-w-7xl mx-auto p-6';
      main.parentNode.insertBefore(panel, main.nextSibling);
    }
    panel.innerHTML = '';
    const h = create('h3', 'text-lg font-semibold mb-2'); h.textContent = title;
    panel.appendChild(h);

    // if array of objects, render table
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
      const table = create('table', 'min-w-full border-collapse');
      const thead = create('thead'); const thtr = create('tr');
      const cols = Object.keys(data[0]);
      cols.forEach(c => { const th = create('th', 'px-2 py-1 text-left bg-gray-100 border'); th.textContent = c; thtr.appendChild(th); });
      thead.appendChild(thtr); table.appendChild(thead);
      const tbody = create('tbody');
      data.slice(0,200).forEach(row => { const tr = create('tr'); cols.forEach(c => { const td = create('td', 'px-2 py-1 border'); td.textContent = row[c] === undefined ? '' : String(row[c]); tr.appendChild(td); }); tbody.appendChild(tr); });
      table.appendChild(tbody);
      panel.appendChild(table);
      if (data.length > 200) {
        const note = create('div', 'mt-2 text-sm text-gray-600'); note.textContent = `Mostrando 200 de ${data.length} registros. Para exportar todos, use o botão Baixar.`; panel.appendChild(note);
      }
    } else if (Array.isArray(data)) {
      const pre = create('pre'); pre.textContent = JSON.stringify(data, null, 2); panel.appendChild(pre);
    } else {
      const pre = create('pre'); pre.textContent = JSON.stringify(data, null, 2); panel.appendChild(pre);
    }
  }

  async function init() {
    try {
      const idx = await fetchJson('/resources/data/index.json');
      renderIndex(idx);
    } catch (err) {
      const container = el('datasets-index'); if (container) container.textContent = 'Não foi possível carregar o índice: ' + err.message;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
