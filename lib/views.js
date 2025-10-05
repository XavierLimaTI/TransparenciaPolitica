// Views helpers for PoliticaApp (Node + Browser compatible)
const uiHelpers = require('./ui-helpers');
// Each function takes an app instance and optionally uses the DOM if present.

function renderCandidatos(app, doc) {
    const documentLocal = doc || (typeof document !== 'undefined' ? document : (global && global.document));
    if (!documentLocal) return;
    const grid = documentLocal.getElementById('candidatosGrid');
    if (!grid) return;
  // Clear previous content
    grid.innerHTML = '';
  const start = (app.currentPage - 1) * app.pageSize;
  const end = start + app.pageSize;
  const pageItems = (app.candidatosFiltrados || []).slice(start, end);

    // pageItems length available for logic; removed debug logs in final polish
    pageItems.forEach(candidato => {
    const card = documentLocal.createElement('div');
    card.className = 'candidato-card bg-white rounded-lg shadow-lg overflow-hidden';

    const rel = documentLocal.createElement('div'); rel.className = 'relative';
    const img = documentLocal.createElement('img'); img.src = candidato.foto || ''; img.alt = candidato.nome || ''; img.className = 'w-full h-48 object-cover';
    const favBtn = documentLocal.createElement('button');
    favBtn.className = 'favorite-btn absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md transition-all';
    favBtn.dataset.id = String(candidato.id);
    if (app.favoritos && app.favoritos.includes(candidato.id)) { favBtn.classList.add('bg-yellow-400'); favBtn.classList.add('text-white'); }
    const favIcon = documentLocal.createElement('i'); favIcon.className = 'fas fa-star'; favBtn.appendChild(favIcon);
    rel.appendChild(img); rel.appendChild(favBtn);

    const body = documentLocal.createElement('div'); body.className = 'p-6';
    const head = documentLocal.createElement('div'); head.className = 'flex items-center justify-between mb-2';
    const h3 = documentLocal.createElement('h3'); h3.className = 'text-xl font-bold text-gray-900'; h3.textContent = candidato.nome || '';
    const badge = documentLocal.createElement('span'); badge.className = 'px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full'; badge.textContent = candidato.partido || '';
    head.appendChild(h3); head.appendChild(badge);

    const meta = documentLocal.createElement('div'); meta.className = 'flex items-center text-gray-600 mb-3'; meta.innerHTML = `<i class="fas fa-map-marker-alt mr-2"></i><span>${candidato.estado || ''}</span><span class="mx-2">•</span><span>${candidato.cargo || ''}</span>`;

    const ideol = documentLocal.createElement('div'); ideol.className = 'mb-4'; ideol.innerHTML = `<span class="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full mr-2">${candidato.ideologia || ''}</span>`;

    const foot = documentLocal.createElement('div'); foot.className = 'flex justify-between items-center';
    const detailsBtn = documentLocal.createElement('button'); detailsBtn.className = 'text-blue-600 hover:text-blue-800 font-medium transition-colors'; detailsBtn.dataset.candidato = String(candidato.id); detailsBtn.textContent = 'Ver detalhes →';
    const votes = documentLocal.createElement('div'); votes.className = 'text-sm text-gray-500'; votes.textContent = String((candidato.votacoes || []).length) + ' votações';
    foot.appendChild(detailsBtn); foot.appendChild(votes);

    body.appendChild(head); body.appendChild(meta); body.appendChild(ideol); body.appendChild(foot);

    card.appendChild(rel); card.appendChild(body);
    grid.appendChild(card);

    // wire favorite click to app.toggleFavorito if present
        favBtn.addEventListener('click', (e) => {
            try { if (app && typeof app.toggleFavorito === 'function') app.toggleFavorito(candidato.id); } catch (err) { /* ignore */ }
            e.preventDefault();
        });

    // wire details button
        detailsBtn.addEventListener('click', () => {
            try { if (app && typeof app.showCandidatoDetails === 'function') app.showCandidatoDetails(candidato.id); else if (typeof window !== 'undefined' && typeof window.politicaApp !== 'undefined' && typeof window.politicaApp.showCandidatoDetails === 'function') window.politicaApp.showCandidatoDetails(candidato.id); }
            catch (err) { /* ignore */ }
        });
  });

        // atualizar paginação
        renderPagination(app, documentLocal);
}

function renderPagination(app, doc) {
    const documentLocal = doc || (typeof document !== 'undefined' ? document : (global && global.document));
    if (!documentLocal) return;
    const container = documentLocal.getElementById('paginationControls');
    if (!container) return;

  const totalItems = (app.candidatosFiltrados || []).length;
  const totalPages = Math.max(1, Math.ceil(totalItems / app.pageSize));
  container.innerHTML = '';

    const nav = documentLocal.createElement('nav');
    nav.className = 'flex items-center space-x-2';

    const prev = documentLocal.createElement('button');
    prev.className = 'px-3 py-2 text-gray-500 hover:text-gray-700';
    prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prev.disabled = app.currentPage === 1;
  prev.addEventListener('click', () => app.setPage(app.currentPage - 1));
  nav.appendChild(prev);

  const maxButtons = 7;
  let startPage = Math.max(1, app.currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);
  if (endPage - startPage + 1 < maxButtons) startPage = Math.max(1, endPage - maxButtons + 1);

    for (let p = startPage; p <= endPage; p++) {
        const btn = documentLocal.createElement('button');
        btn.className = 'px-4 py-2 rounded-lg ' + (p === app.currentPage ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100');
        btn.textContent = String(p);
        btn.setAttribute('aria-label', `Página ${p} de ${totalPages}`);
        if (p === app.currentPage) btn.setAttribute('aria-current', 'page');
        btn.addEventListener('click', () => app.setPage(p));
        nav.appendChild(btn);
    }

    const next = documentLocal.createElement('button');
    next.className = 'px-3 py-2 text-gray-500 hover:text-gray-700';
    next.innerHTML = '<i class="fas fa-chevron-right"></i>';
  next.disabled = app.currentPage === totalPages;
  next.addEventListener('click', () => app.setPage(app.currentPage + 1));
  nav.appendChild(next);

    container.appendChild(nav);
}

function renderVotacoes(app) {
  if (typeof document === 'undefined') return;
  const grid = document.getElementById('votacoesGrid');
  if (!grid) return;
  grid.innerHTML = (app.votacoesFiltradas || []).map(votacao => `
            <div class="votacao-card bg-white rounded-lg shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex-1">
                        <h3 class="text-xl font-bold text-gray-900 mb-2">${votacao.materia}</h3>
                        <p class="text-gray-600 mb-3">${votacao.descricao}</p>
                        <div class="flex items-center text-sm text-gray-500 mb-3">
                            <i class="fas fa-calendar mr-2"></i>
                            <span>${new Date(votacao.data).toLocaleDateString('pt-BR')}</span>
                            <span class="mx-2">•</span>
                            <span class="px-2 py-1 ${votacao.importancia === 'Alta' ? 'bg-red-100 text-red-800' : votacao.importancia === 'Média' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'} text-xs font-medium rounded-full">${votacao.importancia} importância</span>
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-4 mb-4">
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600">${votacao.votos['a favor']}</div>
                        <div class="text-sm text-gray-500">A favor</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-red-600">${votacao.votos.contra}</div>
                        <div class="text-sm text-gray-500">Contra</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl font-bold text-gray-600">${votacao.votos.abstencao}</div>
                        <div class="text-sm text-gray-500">Abstenção</div>
                    </div>
                </div>
                <div class="flex justify-between items-center">
                    <div class="text-sm">
                        <span class="font-medium">Resultado:</span>
                        <span class="ml-2 px-2 py-1 ${votacao.resultado === 'Aprovada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs font-medium rounded-full">${votacao.resultado}</span>
                    </div>
                    <button class="text-blue-600 hover:text-blue-800 font-medium transition-colors" data-votacao="${votacao.id}">
                        Ver votos por candidato →
                    </button>
                </div>
            </div>
        `).join('');
}

function renderDashboard(app) {
  if (typeof document === 'undefined') return;
  const stats = document.getElementById('dashboardStats');
  if (!stats) return;
  const totalCandidatos = (typeof candidatos !== 'undefined') ? candidatos.length : (app.candidatosFiltrados || []).length;
  const totalVotacoes = (typeof votacoes !== 'undefined') ? votacoes.length : (app.votacoesFiltradas || []).length;
  const favoritosCount = app.favoritos ? app.favoritos.length : 0;
  stats.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-blue-600 mb-2">${totalCandidatos}</div>
                    <div class="text-gray-600">Candidatos Cadastrados</div>
                </div>
                <div class="bg-white rounded-lg shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-green-600 mb-2">${totalVotacoes}</div>
                    <div class="text-gray-600">Votações Analisadas</div>
                </div>
                <div class="bg-white rounded-lg shadow-lg p-6 text-center">
                    <div class="text-3xl font-bold text-yellow-600 mb-2">${favoritosCount}</div>
                    <div class="text-gray-600">Seus Favoritos</div>
                </div>
            </div>
        `;
}

function createModal(app, content, doc) {
    const documentLocal = doc || (typeof document !== 'undefined' ? document : (global && global.document));
    if (!documentLocal) return;
    const modal = documentLocal.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = content;
    documentLocal.body.appendChild(modal);
    const close = modal.querySelector('.close-modal');
    if (close) close.addEventListener('click', () => { try { documentLocal.body.removeChild(modal); } catch (e) {} });
    modal.addEventListener('click', (e) => { if (e.target === modal) { try { documentLocal.body.removeChild(modal); } catch (e) {} } });
}

module.exports = { renderCandidatos, renderPagination, renderVotacoes, renderDashboard, createModal, showCandidatoDetails, showVotacaoDetails, criarFooterControles };

// Additional UI helpers delegated from main.js / PoliticaApp
function showCandidatoDetails(app, id, doc) {
    const documentLocal = doc || (typeof document !== 'undefined' ? document : (global && global.document));
    if (!documentLocal) return;
    const candidato = (typeof candidatos !== 'undefined' ? candidatos : (app && app.candidatosFiltrados) || []).find(c => c.id == id);
    if (!candidato) return;

    const html = `
                        <div class="bg-white rounded-lg max-w-4xl mx-auto p-8">
                                <div class="flex items-start justify-between mb-6">
                                        <div class="flex items-center">
                                                <img src="${candidato.foto}" alt="${candidato.nome}" class="w-20 h-20 rounded-full object-cover mr-4">
                                                <div>
                                                        <h2 class="text-2xl font-bold text-gray-900">${candidato.nome}</h2>
                                                        <p class="text-gray-600">${candidato.partido} • ${candidato.estado} • ${candidato.cargo}</p>
                                                        <span class="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full mt-2">${candidato.ideologia}</span>
                                                </div>
                                        </div>
                                        <button class="close-modal text-gray-400 hover:text-gray-600">
                                                <i class="fas fa-times text-xl"></i>
                                        </button>
                                </div>

                                <div class="mb-8">
                                        <h3 class="text-lg font-semibold mb-4">Principais Projetos e Promessas</h3>
                                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                ${candidato.projetos && candidato.projetos.map(projeto => `
                                                        <div class="bg-blue-50 rounded-lg p-4">
                                                                <div class="text-blue-800 font-medium">${projeto}</div>
                                                        </div>
                                                `).join('') || ''}
                                        </div>
                                </div>

                                <div>
                                        <h3 class="text-lg font-semibold mb-4">Histórico de Votações</h3>
                                        <div class="space-y-4">
                                                ${candidato.votacoes && candidato.votacoes.map(votacao => `
                                                        <div class="border rounded-lg p-4">
                                                                <div class="flex justify-between items-start mb-2">
                                                                        <h4 class="font-medium">${votacao.materia}</h4>
                                                                        <span class="px-2 py-1 ${votacao.voto === 'A favor' ? 'bg-green-100 text-green-800' : votacao.voto === 'Contra' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'} text-xs font-medium rounded-full">${votacao.voto}</span>
                                                                </div>
                                                                <div class="text-sm text-gray-600">
                                                                        <span>${new Date(votacao.data).toLocaleDateString('pt-BR')}</span>
                                                                        <span class="mx-2">•</span>
                                                                        <span class="${votacao.importancia === 'Alta' ? 'text-red-600' : votacao.importancia === 'Média' ? 'text-yellow-600' : 'text-green-600'} font-medium">${votacao.importancia} importância</span>
                                                                </div>
                                                        </div>
                                                `).join('') || ''}
                                        </div>
                                </div>
                                <div class="mt-6">
                                        <h3 class="text-lg font-semibold mb-3">Gastos e Despesas</h3>
                                        <div class="mb-4">
                                                <button id="verGastosBtn" class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">Ver gastos</button>
                                                <span id="gastosStatus" class="ml-3 text-sm text-gray-600"></span>
                                        </div>
                                        <div id="gastosList" class="space-y-2 max-h-64 overflow-y-auto"></div>
                                </div>
                        </div>
                `;

    createModal(app, html, documentLocal);

    // setup gastos button
    setTimeout(() => {
    const verBtn = documentLocal.getElementById('verGastosBtn');
    const status = documentLocal.getElementById('gastosStatus');
    const list = documentLocal.getElementById('gastosList');
        if (!verBtn) return;

        verBtn.addEventListener('click', async () => {
            status.textContent = 'Carregando...';
            list.innerHTML = '';
            verBtn.disabled = true;

            try {
                const key = (window.governmentAPI && window.governmentAPI.portalKey) || localStorage.getItem('portal_api_key');
                if (!key && window.governmentAPI && typeof window.governmentAPI.loadDespesasFromCSV === 'function') {
                    // try to auto-load any local CSVs
                    // best-effort: trigger event so main app may handle it
                    try { window.dispatchEvent && window.dispatchEvent(new CustomEvent('localDespesasUsed', { detail: { count: 0 } })); } catch (e) {}
                }

                if (!window.governmentAPI || typeof window.governmentAPI.getDespesasPorParlamentar !== 'function') {
                    status.textContent = 'Integração não disponível.';
                    verBtn.disabled = false;
                    return;
                }

                // attempt to fetch despesas
                const despesas = await window.governmentAPI.getDespesasPorParlamentar({ nome: candidato.nome, pagina: 1, itens: 10 });
                if (!despesas) {
                    status.textContent = 'Erro ao buscar despesas.';
                    verBtn.disabled = false;
                    return;
                }

                status.textContent = '';
                window.__lastDespesasLoaded = despesas;
        list.innerHTML = (despesas || []).map(d => `
                        <div class="p-3 border rounded-lg">
                                <div class="flex justify-between">
                                        <div class="text-sm font-medium">${d.favorecido || d.descricao}</div>
                                        <div class="text-sm text-gray-600">${d.dataDocumento || ''}</div>
                                </div>
                                <div class="text-sm text-gray-700">Valor: R$ ${Number(d.valor || 0).toLocaleString('pt-BR')}</div>
                        </div>
                `).join('');

                // add download button
                if (!document.getElementById('downloadDespesasBtn')) {
                    const dlBtn = document.createElement('button');
                    dlBtn.id = 'downloadDespesasBtn';
                    dlBtn.className = 'mt-3 ml-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';
                    dlBtn.textContent = 'Baixar CSV';
                    dlBtn.addEventListener('click', () => {
                        const rows = (window.__lastDespesasLoaded || []).map(r => ({ data: r.dataDocumento || '', descricao: r.descricao || '', favorecido: r.favorecido || '', valor: r.valor || 0 }));
                        if (rows.length === 0) return alert('Nenhuma despesa para baixar.');
                        const header = Object.keys(rows[0]).join(',') + '\n';
                        const csv = header + rows.map(r => `${String(r.data).replace(/,/g,'')} ,"${String(r.descricao).replace(/"/g,'""')}","${String(r.favorecido).replace(/"/g,'""')}",${Number(r.valor).toFixed(2)}`).join('\n');
                        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url; a.download = `despesas_${(new Date()).toISOString().slice(0,10)}.csv`;
                        document.body.appendChild(a); a.click(); setTimeout(() => { try { document.body.removeChild(a); URL.revokeObjectURL(url); } catch (e) {} }, 500);
                    });
                    list.parentNode.insertBefore(dlBtn, list.nextSibling);
                }

            } catch (err) {
                console.error('Erro ao obter despesas:', err);
                status.textContent = 'Erro ao obter despesas.';
                verBtn.disabled = false;
            }
        });
    }, 50);
}

function showVotacaoDetails(app, id) {
    if (typeof document === 'undefined') return;
    const votacao = (typeof votacoes !== 'undefined' ? votacoes : (app && app.votacoesFiltradas) || []).find(v => v.id == id);
    if (!votacao) return;

    const votosPorCandidato = (typeof candidatos !== 'undefined' ? candidatos : (app && app.candidatosFiltrados) || []).map(candidato => {
        const votoDoCandidato = candidato.votacoes && candidato.votacoes.find(v => v.materia === votacao.materia);
        return { nome: candidato.nome, partido: candidato.partido, voto: votoDoCandidato ? votoDoCandidato.voto : 'Não votou' };
    });

    const html = `
                <div class="bg-white rounded-lg max-w-6xl mx-auto p-8">
                        <div class="flex items-start justify-between mb-6">
                                <div>
                                        <h2 class="text-2xl font-bold text-gray-900 mb-2">${votacao.materia}</h2>
                                        <p class="text-gray-600 mb-4">${votacao.descricao}</p>
                                        <div class="flex items-center text-sm text-gray-500">
                                                <i class="fas fa-calendar mr-2"></i>
                                                <span>${new Date(votacao.data).toLocaleDateString('pt-BR')}</span>
                                                <span class="mx-2">•</span>
                                                <span class="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">${votacao.resultado}</span>
                                        </div>
                                </div>
                                <button class="close-modal text-gray-400 hover:text-gray-600">
                                        <i class="fas fa-times text-xl"></i>
                                </button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div class="text-center bg-green-50 rounded-lg p-4">
                                        <div class="text-3xl font-bold text-green-600 mb-2">${votacao.votos['a favor']}</div>
                                        <div class="text-gray-600">Votos a favor</div>
                                </div>
                                <div class="text-center bg-red-50 rounded-lg p-4">
                                        <div class="text-3xl font-bold text-red-600 mb-2">${votacao.votos.contra}</div>
                                        <div class="text-gray-600">Votos contra</div>
                                </div>
                                <div class="text-center bg-gray-50 rounded-lg p-4">
                                        <div class="text-3xl font-bold text-gray-600 mb-2">${votacao.votos.abstencao}</div>
                                        <div class="text-gray-600">Abstenções</div>
                                </div>
                        </div>
                        <div>
                                <h3 class="text-lg font-semibold mb-4">Votos por Candidato</h3>
                                <div class="space-y-2 max-h-96 overflow-y-auto">
                                        ${votosPorCandidato.map(voto => `
                                                <div class="flex justify-between items-center p-3 border rounded-lg">
                                                        <div>
                                                                <div class="font-medium">${voto.nome}</div>
                                                                <div class="text-sm text-gray-600">${voto.partido}</div>
                                                        </div>
                                                        <span class="px-3 py-1 ${voto.voto === 'A favor' ? 'bg-green-100 text-green-800' : voto.voto === 'Contra' ? 'bg-red-100 text-red-800' : voto.voto === 'Abstenção' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'} text-sm font-medium rounded-full">${voto.voto}</span>
                                                </div>
                                        `).join('')}
                                </div>
                        </div>
                </div>
        `;

    createModal(app, html);
}

function criarFooterControles() {
    if (typeof document === 'undefined') return;
    try {
        const footerHelp = document.createElement('div');
        footerHelp.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:40;display:flex;gap:8px;align-items:center;';
        const docsLink = document.createElement('a');
        docsLink.href = 'server/PROXY_README.md'; docsLink.target = '_blank'; docsLink.style.cssText = 'background:#111827;color:#fff;padding:6px 8px;border-radius:6px;text-decoration:none;font-size:12px;'; docsLink.textContent = '📖 Docs Proxy';
        const rmBtn = document.createElement('button'); rmBtn.textContent = 'Remover chave'; rmBtn.className = 'px-3 py-1 bg-red-600 text-white rounded text-sm';
        rmBtn.addEventListener('click', async () => {
            const admin = prompt('Token admin para proxy (se configurado):') || '';
            if (!confirm('Remover a chave persistida na proxy?')) return;
            try {
                const headers = { 'Content-Type': 'application/json' }; if (admin) headers['x-proxy-admin'] = admin;
                const res = await fetch('http://localhost:3001/unset-key', { method: 'POST', headers });
                if (!res.ok) { alert('Erro: ' + await res.text()); return; }
                alert('✅ Chave removida da proxy.');
            } catch (err) { console.error('Erro ao remover chave:', err); alert('❌ Não foi possível contactar a proxy.'); }
        });

        // Upload CSV
        const uploadLabel = document.createElement('label'); uploadLabel.className = 'px-3 py-1 bg-blue-600 text-white rounded text-sm cursor-pointer'; uploadLabel.textContent = 'Carregar CSV';
        const uploadInput = document.createElement('input'); uploadInput.type = 'file'; uploadInput.accept = '.csv,text/csv'; uploadInput.style.display = 'none'; uploadLabel.appendChild(uploadInput);
        uploadInput.addEventListener('change', async (ev) => {
            const f = ev.target.files?.[0]; if (!f) return; try { const txt = await f.text(); if (window.governmentAPI?.loadDespesasFromCSV) { const parsed = window.governmentAPI.loadDespesasFromCSV(txt); window.governmentAPI.useLocalDespesas(parsed); alert(`✅ CSV carregado: ${parsed.length} registros`); } else { alert('❌ Função de parsing não disponível.'); } } catch (err) { console.error('Erro ao processar CSV', err); alert('❌ Erro ao processar o CSV.'); }
        });

        footerHelp.appendChild(docsLink); footerHelp.appendChild(rmBtn); footerHelp.appendChild(uploadLabel); document.body.appendChild(footerHelp);
    } catch (e) { console.warn('Erro ao criar footer:', e); }
}

async function initDatasetLoaderUI() {
    if (typeof document === 'undefined') return;
    try {
        const resp = await fetch('/resources/data/manifest.json');
        if (!resp.ok) return;
        const manifest = await resp.json();
        const footer = document.querySelector('footer') || document.body;
        const container = document.createElement('div'); container.id = 'dataset-loader'; container.style.padding = '8px'; container.style.fontSize = '13px';
        container.innerHTML = `
                        <label style="margin-right:8px;">Datasets locais:</label>
                        <select id="datasetSelect" style="min-width:300px;padding:4px"></select>
                        <button id="loadDatasetBtn" style="margin-left:8px;padding:6px 10px">Carregar</button>
                        <button id="clearLocalDatasetBtn" style="margin-left:6px;padding:6px 8px">Limpar</button>
                        <span id="datasetStatus" style="margin-left:12px"></span>
                `;
        footer.appendChild(container);
        const select = container.querySelector('#datasetSelect'); const loadBtn = container.querySelector('#loadDatasetBtn'); const clearBtn = container.querySelector('#clearLocalDatasetBtn'); const status = container.querySelector('#datasetStatus');

        (manifest.files || []).forEach(f => {
            if (!f) return; let csvPath, jsonPath, label;
            if (typeof f === 'string') { if (f === 'manifest.json' || f.endsWith('/manifest.json')) return; csvPath = f; jsonPath = '/resources/data/' + f; label = f; }
            else if (typeof f === 'object') { csvPath = f.csv || ''; jsonPath = f.json || ('/resources/data/' + (f.csv || '')); label = f.csv || f.json || JSON.stringify(f); }
            else return;
            const opt = document.createElement('option'); opt.value = jsonPath; opt.dataset.csv = csvPath; opt.textContent = label; select.appendChild(opt);
        });

        loadBtn.addEventListener('click', async () => {
            const url = select.value; if (!url) return; status.textContent = 'Carregando...';
            try {
                const r = await fetch(url); if (!r.ok) throw new Error('Fetch failed ' + r.status); const text = await r.text();
                let parsed;
                try { const maybe = JSON.parse(text); if (maybe && Array.isArray(maybe.rows)) parsed = maybe.rows; else if (Array.isArray(maybe)) parsed = maybe; else parsed = window.governmentAPI.loadDespesasFromCSV ? window.governmentAPI.loadDespesasFromCSV(text) : []; } catch (e) { parsed = window.governmentAPI.loadDespesasFromCSV ? window.governmentAPI.loadDespesasFromCSV(text) : []; }
                window.governmentAPI.useLocalDespesas(parsed); status.textContent = `Carregado ${parsed.length} registros.`;
            } catch (err) { console.error('Erro ao carregar dataset', err); status.textContent = 'Erro ao carregar dataset.'; }
        });

        clearBtn.addEventListener('click', () => { window.governmentAPI.useLocalDespesas([]); const st = document.getElementById('datasetStatus'); if (st) st.textContent = 'Despesas locais limpas.'; });

        // auto-load first despesas if present
        try {
            const options = Array.from(select.options); const found = options.find(o => (o.dataset.csv || '').toLowerCase().endsWith('despesas.csv')) || options.find(o => o.textContent.toLowerCase().includes('despesas'));
            if (found) { setTimeout(() => { try { select.value = found.value; loadBtn.click(); } catch (e) {} }, 300); }
        } catch (e) {}

    } catch (err) { /* ignore */ }
}

function showProxyBanner() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('proxyDetectedBanner')) return;
    const b = document.createElement('div'); b.id = 'proxyDetectedBanner'; b.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:60;background:#0f766e;color:white;padding:8px 12px;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.12);';
    b.innerHTML = `<span style="margin-right:10px;">✅ Proxy local detectado</span>`;
    const btn = document.createElement('button'); btn.textContent = 'Configurar chave'; btn.className = 'px-3 py-1 bg-white text-teal-700 rounded mr-2'; btn.addEventListener('click', () => uiHelpers.createPortalKeyModal());
    const close = document.createElement('button'); close.textContent = '×'; close.style.cssText = 'background:transparent;color:white;border:none;font-size:18px;cursor:pointer;'; close.addEventListener('click', () => b.remove());
    b.appendChild(btn); b.appendChild(close); document.body.appendChild(b); setTimeout(() => b.remove(), 12000);
}

function showLocalDataBanner() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('localDataBanner')) return;
    const b = document.createElement('div'); b.id = 'localDataBanner'; b.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:60;background:#92400e;color:white;padding:8px 12px;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.12);';
    b.innerHTML = `<span style="margin-right:10px;">⚠️ Usando dados locais (CSV) — não são dados oficiais</span>`;
    const btn = document.createElement('button'); btn.textContent = 'Carregar dados remotos'; btn.className = 'px-3 py-1 bg-white text-orange-700 rounded mr-2'; btn.addEventListener('click', async () => { try { const ok = await (window.carregarDadosReais ? window.carregarDadosReais() : Promise.resolve(false)); if (ok) { const el = document.getElementById('localDataBanner'); if (el) el.remove(); } else alert('Não foi possível carregar dados remotos. Verifique a conexão ou a chave do Portal.'); } catch (e) { console.error('Erro ao tentar carregar dados remotos via banner:', e); alert('Erro ao tentar carregar dados remotos. Veja o console.'); } });
    const close = document.createElement('button'); close.textContent = '×'; close.style.cssText = 'background:transparent;color:white;border:none;font-size:18px;cursor:pointer;margin-left:8px;'; close.addEventListener('click', () => b.remove());
    b.appendChild(btn); b.appendChild(close); document.body.appendChild(b); setTimeout(() => { try { const el = document.getElementById('localDataBanner'); if (el) el.remove(); } catch (e) {} }, 25000);
}

module.exports = Object.assign(module.exports, { showCandidatoDetails, showVotacaoDetails, criarFooterControles, initDatasetLoaderUI, showProxyBanner, showLocalDataBanner });
