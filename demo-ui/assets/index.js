const MANIFEST_URL = '/resources/data/manifest.json';

// Utility functions
async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Fetch failed: ${r.status}`);
  return await r.json();
}

function el(id) {
  return document.getElementById(id);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// State management
let currentManifest = null;
let currentDataset = null;
let currentLabel = null;

// Load manifest
async function loadManifest() {
  try {
    const manifest = await fetchJson(MANIFEST_URL);
    currentManifest = manifest;
    return manifest;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Manifest not found', e);
    }
    return null;
  }
}

// Render manifest list with filter
function renderManifest(manifest, filter = '') {
  const container = el('datasetsList');
  container.innerHTML = '';
  
  if (!manifest || !Array.isArray(manifest.files)) {
    container.innerHTML = '<div class="text-sm text-slate-600 p-2">Manifest não disponível. Execute <code>npm run verify:data</code>.</div>';
    return;
  }
  
  const files = manifest.files.filter(f => {
    if (!f) return false;
    const label = (typeof f === 'string') ? f : (f.csv || f.json || '');
    if (!filter) return true;
    return label.toLowerCase().includes(filter.toLowerCase());
  });
  
  if (files.length === 0) {
    container.innerHTML = '<div class="text-sm text-slate-600 p-2">Nenhum arquivo encontrado</div>';
    return;
  }
  
  files.forEach(f => {
    const label = (typeof f === 'string') ? f : (f.csv || f.json || JSON.stringify(f));
    const path = (typeof f === 'string') 
      ? `/resources/data/${f}` 
      : (f.json ? `/resources/${f.json.replace(/^\/+/, '')}` : `/resources/data/${f.csv || ''}`);
    
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = label;
    a.dataset.path = path;
    a.className = 'fade-in';
    
    a.addEventListener('click', async (e) => {
      e.preventDefault();
      // Remove active class from all
      container.querySelectorAll('a').forEach(link => link.classList.remove('active'));
      a.classList.add('active');
      await openDataset(path, label);
    });
    
    container.appendChild(a);
  });
}

// Open and display dataset
async function openDataset(path, label) {
  const title = el('datasetTitle');
  const info = el('datasetInfo');
  const meta = el('datasetMeta');
  const preview = el('previewPanel');
  const charts = el('chartsPanel');
  const wrapper = el('previewTableWrapper');
  
  try {
    // Show loading state
    meta.classList.remove('hidden');
    title.textContent = label;
    info.innerHTML = `<span class="spinner"></span> Carregando...`;
    preview.classList.remove('hidden');
    charts.classList.add('hidden');
    wrapper.innerHTML = '<div class="text-center p-8"><span class="spinner"></span></div>';
    
    // Fetch data
    const data = await fetchJson(path);
    const rows = Array.isArray(data) ? data : (data.rows || []);
    const size = rows.length;
    
    // Update info
    info.innerHTML = `<span class="text-emerald-600 font-medium">${size.toLocaleString()}</span> registros • ${path}`;
    
    // Store current dataset
    currentDataset = rows;
    currentLabel = label;
    
    // Render preview table
    const sampleSize = Number(el('sampleSize').value || 25);
    wrapper.innerHTML = renderTable(rows.slice(0, sampleSize));
    
    // Try to render charts
    try {
      renderCharts(rows);
    } catch (e) {
      charts.classList.add('hidden');
    }
    
    // Setup download button
    el('downloadBtn').onclick = () => downloadJson(rows, label);
    el('openRawBtn').onclick = () => window.open(path, '_blank');
    
  } catch (e) {
    wrapper.innerHTML = `<div class="text-red-600 p-4">Erro ao carregar: ${escapeHtml(e.message)}</div>`;
    info.textContent = 'Erro';
  }
}

// Render table with data
function renderTable(rows) {
  if (!rows || rows.length === 0) {
    return '<div class="text-sm text-slate-600 p-4">Sem dados disponíveis</div>';
  }
  
  const cols = Object.keys(rows[0]);
  const fragment = document.createDocumentFragment();
  const table = document.createElement('table');
  table.className = 'table';
  
  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  cols.forEach(col => {
    const th = document.createElement('th');
    th.textContent = col;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create body
  const tbody = document.createElement('tbody');
  rows.forEach(row => {
    const tr = document.createElement('tr');
    cols.forEach(col => {
      const td = document.createElement('td');
      const value = row[col];
      td.textContent = value === undefined || value === null ? '' : String(value);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  
  fragment.appendChild(table);
  
  // Convert to HTML string
  const div = document.createElement('div');
  div.appendChild(fragment);
  return div.innerHTML;
}

// Render charts
function renderCharts(rows) {
  const area = el('chartArea');
  const chartsPanel = el('chartsPanel');
  
  if (!area || !rows || rows.length === 0) {
    area.innerHTML = '<div class="text-sm text-slate-600">Sem dados para visualização</div>';
    return;
  }
  
  // Find numeric columns
  const sample = rows[0];
  const numericCols = Object.keys(sample).filter(k => typeof sample[k] === 'number');
  
  if (numericCols.length === 0) {
    area.innerHTML = '<div class="text-sm text-slate-600">Nenhuma coluna numérica detectada</div>';
    chartsPanel.classList.add('hidden');
    return;
  }
  
  // Use first numeric column
  const col = numericCols[0];
  const valueMap = {};
  
  rows.forEach(r => {
    const val = r[col] || 0;
    valueMap[val] = (valueMap[val] || 0) + 1;
  });
  
  // Prepare chart data (limit to top 50)
  const sortedEntries = Object.entries(valueMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50);
  
  const seriesData = sortedEntries.map(([name, value]) => ({
    name: String(name),
    value: value
  }));
  
  // Initialize chart
  const chart = echarts.init(area);
  chart.setOption({
    title: {
      text: `Distribuição: ${col}`,
      left: 'center',
      textStyle: { fontSize: 14 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      show: false
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: true,
        position: 'outer',
        formatter: '{b}: {d}%'
      },
      data: seriesData
    }]
  });
  
  chartsPanel.classList.remove('hidden');
}

// Download dataset as JSON
function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace(/[^a-z0-9.\-_]/gi, '_') + '.json';
  document.body.appendChild(a);
  a.click();
  
  setTimeout(() => {
    try {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      // Ignore cleanup errors
    }
  }, 500);
}

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize application
async function init() {
  try {
    // Load manifest
    const manifest = await loadManifest();
    renderManifest(manifest);
    
    // Setup event listeners
    el('refreshBtn').addEventListener('click', async () => {
      const filter = el('searchInput').value || '';
      const newManifest = await loadManifest();
      renderManifest(newManifest, filter);
    });
    
    // Debounced search
    const debouncedSearch = debounce((value) => {
      renderManifest(currentManifest, value);
    }, 300);
    
    el('searchInput').addEventListener('input', (e) => {
      debouncedSearch(e.target.value || '');
    });
    
    // Sample size change
    el('sampleSize').addEventListener('change', () => {
      if (currentDataset && currentLabel) {
        const wrapper = el('previewTableWrapper');
        const sampleSize = Number(el('sampleSize').value || 25);
        wrapper.innerHTML = renderTable(currentDataset.slice(0, sampleSize));
      }
    });
    
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Init error:', e);
    }
    const container = el('datasetsList');
    if (container) {
      container.innerHTML = `<div class="text-red-600 text-sm p-2">Erro: ${escapeHtml(e.message)}</div>`;
    }
  }
}

// Start app
init();
