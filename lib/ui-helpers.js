// UI helper functions extracted from main.js for easier testing and separation
// Minimal, safe helpers used by main.js. Keep browser-safe guards.
function createModal(content, doc) {
  const documentLocal = doc || (typeof document !== 'undefined' ? document : (global && global.document));
  if (!documentLocal) return null;
  const modal = documentLocal.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-root';
  modal.innerHTML = content;
  documentLocal.body.appendChild(modal);
  try {
    const close = modal.querySelector('.close-modal');
  if (close) close.addEventListener('click', () => { try { documentLocal.body.removeChild(modal); } catch (e) { void e; } });
  } catch (e) { void e; }
  modal.addEventListener('click', (e) => { if (e.target === modal) { try { documentLocal.body.removeChild(modal); } catch (e) { void e; } } });
  return modal;
}

function createDownloadButtonForDespesas(getRowsFn, doc) {
  const documentLocal = doc || (typeof document !== 'undefined' ? document : (global && global.document));
  if (!documentLocal) return null;
  if (documentLocal.getElementById('downloadDespesasBtn')) return documentLocal.getElementById('downloadDespesasBtn');

  const dlBtn = documentLocal.createElement('button');
  dlBtn.id = 'downloadDespesasBtn';
  dlBtn.className = 'mt-3 ml-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';
  dlBtn.textContent = 'Baixar CSV';
  dlBtn.addEventListener('click', () => {
    const rows = (typeof getRowsFn === 'function' ? getRowsFn() : []) || [];
    if (rows.length === 0) return alert('Nenhuma despesa para baixar.');
    const header = Object.keys(rows[0]).join(',') + '\n';
    const csv = header + rows.map(r => `${String(r.data || '').replace(/,/g,'')},"${String(r.descricao||'').replace(/"/g,'""')}","${String(r.favorecido||'').replace(/"/g,'""')}",${Number(r.valor||0).toFixed(2)}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = documentLocal.createElement('a');
    a.href = url;
    a.download = `despesas_${(new Date()).toISOString().slice(0,10)}.csv`;
    documentLocal.body.appendChild(a);
    a.click();
  setTimeout(() => { try { documentLocal.body.removeChild(a); URL.revokeObjectURL(url); } catch (e) { void e; } }, 500);
  });
  return dlBtn;
}

module.exports = { createModal, createDownloadButtonForDespesas };

// Create portal key modal helper
function createPortalKeyModal(app, doc) {
  const documentLocal = doc || (typeof document !== 'undefined' ? document : (global && global.document));
  if (!documentLocal) return null;
  const modalHtml = `
    <div class="bg-white rounded-lg p-6 max-w-lg w-full" role="dialog" aria-modal="true" aria-labelledby="portalKeyTitle">
      <div class="flex items-start justify-between mb-3">
        <div>
          <h3 id="portalKeyTitle" class="text-lg font-semibold">Configurar chave do Portal da Transparência</h3>
          <p class="text-sm text-gray-600">Cole sua chave de API (será salva no navegador).</p>
        </div>
        <button id="portalKeyClose" aria-label="Fechar" class="text-gray-500 hover:text-gray-800">×</button>
      </div>
      <div class="mt-2">
        <label for="portalKeyInput" class="sr-only">Chave da API</label>
        <input id="portalKeyInput" class="w-full border px-3 py-2 rounded mb-3" placeholder="Chave da API" aria-describedby="proxySaveStatus" />
        <label for="proxyAdminInput" class="sr-only">Token admin proxy (opcional)</label>
        <input id="proxyAdminInput" class="w-full border px-3 py-2 rounded mb-3" placeholder="Token admin para proxy (opcional)" />
        <div id="proxySaveStatus" class="text-sm text-gray-600 mb-3" style="min-height:1.25rem"></div>
        <div class="flex justify-end space-x-2">
          <button id="portalKeyCancel" class="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
          <button id="portalKeySave" class="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
        </div>
      </div>
    </div>
  `;

  const modal = createModal(modalHtml, documentLocal);
  setTimeout(() => {
    const cancel = documentLocal.getElementById('portalKeyCancel');
    const close = documentLocal.getElementById('portalKeyClose');
    const save = documentLocal.getElementById('portalKeySave');
    const input = documentLocal.getElementById('portalKeyInput');

  const removeModal = () => { try { const m = documentLocal.querySelector('.modal-root'); if (m) m.remove(); } catch (e) { void e; } };

    if (cancel) cancel.addEventListener('click', removeModal);
    if (close) close.addEventListener('click', removeModal);

    // focus the input for better UX
  try { if (input && typeof input.focus === 'function') input.focus(); } catch (e) { void e; }

    if (save) save.addEventListener('click', async () => {
      const v = (documentLocal.getElementById('portalKeyInput') || {}).value || '';
      const key = v.trim();
      if (!key) return;
  try { localStorage.setItem('portal_api_key', key); } catch (e) { void e; }
      if (window.governmentAPI && typeof window.governmentAPI.setPortalKey === 'function') window.governmentAPI.setPortalKey(key);
      removeModal();
      // prefer calling optional callback on app to avoid alert() in tests
  try { if (app && typeof app.onPortalKeySaved === 'function') app.onPortalKeySaved(key); } catch (e) { void e; }
    });
  }, 40);
  return modal;
}

module.exports = Object.assign(module.exports, { createPortalKeyModal });
