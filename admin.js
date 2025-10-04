async function loadManifest() {
  try {
    // Show key status
    try {
      const k = await fetch('/admin/key');
      if (k.ok) {
        const jk = await k.json();
        const s = document.createElement('div');
        s.textContent = 'Chave configurada: ' + (jk.keyPresent ? 'Sim' : 'Não');
        s.style.marginBottom = '12px';
        document.getElementById('datasets').appendChild(s);
      }
    } catch (e) {
      // ignore
    }

    const r = await fetch('/admin/datasets');
    if (!r.ok) return document.getElementById('datasets').textContent = 'Nenhum dataset disponível.';
    const j = await r.json();
    const list = j.datasets || [];
    const container = document.getElementById('datasets');
    container.innerHTML = '';
    if (list.length === 0) container.textContent = 'Nenhum dataset registrado.';
    list.forEach(item => {
      const d = document.createElement('div');
      d.style.marginBottom = '8px';
      d.textContent = item.path + ' — rows: ' + (item.row_count || 0) + ' — updated: ' + (item.updated_at || '');
      const del = document.createElement('button');
      del.textContent = 'Remover metadata';
      del.style.marginLeft = '8px';
      del.addEventListener('click', async () => {
        if (!confirm('Remover metadata para ' + item.path + '?')) return;
        await fetch('/admin/dataset/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: item.path, deleteFiles: false }) });
        loadManifest();
      });
      const delFile = document.createElement('button');
      delFile.textContent = 'Remover arquivo';
      delFile.style.marginLeft = '8px';
      delFile.addEventListener('click', async () => {
        if (!confirm('Remover arquivo e metadata para ' + item.path + '?')) return;
        await fetch('/admin/dataset/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path: item.path, deleteFiles: true }) });
        loadManifest();
      });
      d.appendChild(del);
      d.appendChild(delFile);
      container.appendChild(d);
    });
  } catch (e) {
    document.getElementById('datasets').textContent = 'Erro ao carregar datasets.';
  }
}

loadManifest();

// Admin token handling
let ADMIN_TOKEN = null;
document.getElementById('saveToken').addEventListener('click', () => {
  ADMIN_TOKEN = document.getElementById('adminToken').value || null;
  alert('Token salvo na sessão (não persistido).');
});

async function authFetch(url, opts = {}) {
  opts.headers = opts.headers || {};
  if (ADMIN_TOKEN) opts.headers['x-proxy-admin'] = ADMIN_TOKEN;
  return fetch(url, opts);
}

document.getElementById('setKey').addEventListener('click', async () => {
  const k = prompt('Cole sua chave do Portal da Transparência:');
  if (!k) return;
  await authFetch('/set-key', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: k }) });
  alert('Chave enviada ao proxy.');
});

document.getElementById('unsetKey').addEventListener('click', async () => {
  if (!confirm('Remover a chave do proxy?')) return;
  await authFetch('/unset-key', { method: 'POST' });
  alert('Chave removida.');
});
