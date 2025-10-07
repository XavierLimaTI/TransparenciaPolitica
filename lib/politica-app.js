// PoliticaApp extracted for Node testing and modular use.
// This file exports the PoliticaApp class (CommonJS) and attaches it to window when available.

const views = (typeof require !== 'undefined') ? (() => { try { return require('./views'); } catch(e) { return null; } })() : (typeof window !== 'undefined' ? window.Views : null);

class PoliticaApp {
    constructor() {
        this.candidatosFiltrados = [...(typeof candidatos !== 'undefined' ? candidatos : (typeof window !== 'undefined' && window.candidatos) || [])];
        this.votacoesFiltradas = [...(typeof votacoes !== 'undefined' ? votacoes : (typeof window !== 'undefined' && window.votacoes) || [])];
        this.favoritos = (typeof localStorage !== 'undefined' && localStorage.getItem) ? JSON.parse(localStorage.getItem('favoritos') || '[]') : [];
        this.currentPage = 1;
        this.pageSize = (typeof localStorage !== 'undefined' && localStorage.getItem) ? parseInt(localStorage.getItem('pageSize'), 10) || 6 : 6;
        this.viewMode = (typeof localStorage !== 'undefined' && localStorage.getItem) ? localStorage.getItem('viewMode') || 'grid' : 'grid';
        this.init();
    }

    async loadMoreFromAPI(pageSize = 20) {
        if (typeof window === 'undefined' || !window.governmentAPI) return;
        this.serverPage = this.serverPage || 1;
        this.serverHasMore = this.serverHasMore === undefined ? true : this.serverHasMore;

        if (!this.serverHasMore) return;

        try {
            const nextPage = this.serverPage + 1;
            const loadBtn = (typeof document !== 'undefined') ? document.getElementById('loadMoreBtn') : null;
            if (loadBtn) { loadBtn.disabled = true; loadBtn.textContent = 'Carregando...'; }

            const deputies = await window.governmentAPI.getDeputadosPage(nextPage, pageSize);
            if (deputies && deputies.length > 0) {
                if (typeof candidatos !== 'undefined') {
                    candidatos.push(...deputies);
                } else if (window.candidatos) {
                    window.candidatos.push(...deputies);
                }
                this.candidatosFiltrados = [...this.candidatosFiltrados, ...deputies];
                if (views && typeof views.renderCandidatos === 'function') views.renderCandidatos(this); else this.renderCandidatos();
                this.serverPage = nextPage;
                if (deputies.length < pageSize) this.serverHasMore = false;
            } else {
                this.serverHasMore = false;
            }
        } catch (err) {
            console.error('Erro ao carregar mais deputados:', err);
        } finally {
            const loadBtn2 = (typeof document !== 'undefined') ? document.getElementById('loadMoreBtn') : null;
            if (loadBtn2) {
                if (!this.serverHasMore) { loadBtn2.style.display = 'none'; }
                else { loadBtn2.disabled = false; loadBtn2.textContent = 'Carregar mais'; }
            }
        }
    }

    updateLoadMoreUI() {
        const loadBtn = (typeof document !== 'undefined') ? document.getElementById('loadMoreBtn') : null;
        if (!loadBtn) return;
        if (this.serverHasMore === false) {
            loadBtn.style.display = 'none';
        } else {
            loadBtn.style.display = '';
            loadBtn.disabled = false;
            loadBtn.textContent = 'Carregar mais';
        }
    }

    async fetchServerPage({ nome, estado, partido, ordenarPor } = {}, page = 1, pageSize = 20) {
        if (typeof window === 'undefined' || !window.governmentAPI) return null;
        try {
            const resp = await window.governmentAPI.searchDeputados({ page, pageSize, nome, uf: estado, partido, ordenarPor });
            let results = [];
            let meta = { page, pageSize, total: null, hasMore: false };

            if (Array.isArray(resp)) {
                results = resp;
                meta = { page, pageSize, total: null, hasMore: results.length >= pageSize };
            } else if (resp && resp.results) {
                results = resp.results;
                meta = Object.assign(meta, resp.meta || {});
            }

            if (page === 1) {
                if (typeof candidatos !== 'undefined') { candidatos.length = 0; candidatos.push(...results); }
                else if (window.candidatos) { window.candidatos.length = 0; window.candidatos.push(...results); }
                this.candidatosFiltrados = [...results];
            } else {
                if (typeof candidatos !== 'undefined') candidatos.push(...results);
                else if (window.candidatos) window.candidatos.push(...results);
                this.candidatosFiltrados = [...this.candidatosFiltrados, ...results];
            }

            this.currentPage = page;
            this.serverPage = page;
            this.serverHasMore = !!meta.hasMore;

            if (meta.total !== null && typeof document !== 'undefined' && document.getElementById('totalCandidatos')) {
                document.getElementById('totalCandidatos').textContent = String(meta.total);
            }

            if (typeof document !== 'undefined' && document.getElementById('resultCount')) {
                document.getElementById('resultCount').textContent = String(this.candidatosFiltrados.length);
            }

            if (views && typeof views.renderCandidatos === 'function') views.renderCandidatos(this); else this.renderCandidatos();
            this.updateLoadMoreUI();

            return { results, meta };
        } catch (err) {
            console.error('fetchServerPage error', err);
            return null;
        }
    }

    init() {
        this.setupEventListeners();
        this.renderInitialContent();
        this.initAnimations();
    }

    // Public hook invoked when local despesas were applied (CSV fallback).
    // This method centralizes behavior to update UI after governmentAPI.useLocalDespesas()
    onLocalDespesasApplied(_count) {
        try {
            // ensure internal state reflects any newly available candidatos/votacoes
            // re-render core views
            if (typeof window !== 'undefined') {
                if (typeof this.renderCandidatos === 'function') {
                    try { this.renderCandidatos(); } catch (e) { void e; }
                }
                if (typeof this.updateLoadMoreUI === 'function') {
                    try { this.updateLoadMoreUI(); } catch (e) { void e; }
                }
                // notify UI helpers if present
            }
        } catch (e) {
            try { this.updateLoadMoreUI(); } catch (e) { void e; }
            console.warn('onLocalDespesasApplied failed', e);
        }
    }

    setupEventListeners() {
        const searchInput = (typeof document !== 'undefined') ? document.getElementById('searchInput') : null;
        if (searchInput) { searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value)); }

        const filterButtons = (typeof document !== 'undefined') ? document.querySelectorAll('.filter-btn') : [];
        (filterButtons || []).forEach(btn => { btn.addEventListener('click', (e) => this.handleFilter(e.target.dataset.filter)); });

        const sortSelect = (typeof document !== 'undefined') ? document.getElementById('sortSelect') : null;
        if (sortSelect) { sortSelect.addEventListener('change', (e) => this.handleSort(e.target.value)); }

        if (typeof document !== 'undefined') {
            document.addEventListener('click', (e) => {
                if (e.target.matches('[data-page]')) { e.preventDefault(); this.navigateToPage(e.target.dataset.page); }
                if (e.target.matches('[data-candidato]')) { this.showCandidatoDetails(e.target.dataset.candidato); }
                if (e.target.matches('[data-votacao]')) { this.showVotacaoDetails(e.target.dataset.votacao); }
                if (e.target.matches('.favorite-btn')) { this.toggleFavorito(e.target.dataset.id); }
            });
        }
    }

    handleSearch(query) {
        if (!query) { this.candidatosFiltrados = [...candidatos]; }
        else { this.candidatosFiltrados = candidatos.filter(c => c.nome.toLowerCase().includes(query.toLowerCase()) || c.partido.toLowerCase().includes(query.toLowerCase()) || c.estado.toLowerCase().includes(query.toLowerCase()) || c.cargo.toLowerCase().includes(query.toLowerCase())); }
        if (views && typeof views.renderCandidatos === 'function') views.renderCandidatos(this); else this.renderCandidatos();
    }

    handleFilter(filterType) {
        if (typeof document !== 'undefined') document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        if (typeof document !== 'undefined') document.querySelector(`[data-filter="${filterType}"]`).classList.add('active');
        switch(filterType) {
            case 'todos': this.candidatosFiltrados = [...candidatos]; break;
            case 'favoritos': this.candidatosFiltrados = candidatos.filter(c => this.favoritos.includes(c.id)); break;
            case 'deputados': this.candidatosFiltrados = candidatos.filter(c => c.cargo.includes('Deputado')); break;
            case 'senadores': this.candidatosFiltrados = candidatos.filter(c => c.cargo.includes('Senador')); break;
        }
        if (views && typeof views.renderCandidatos === 'function') views.renderCandidatos(this); else this.renderCandidatos();
    }

    handleSort(sortBy) {
        this.candidatosFiltrados.sort((a,b) => { switch(sortBy){ case 'nome': return a.nome.localeCompare(b.nome); case 'partido': return a.partido.localeCompare(b.partido); case 'estado': return a.estado.localeCompare(b.estado); default: return 0; } });
        if (views && typeof views.renderCandidatos === 'function') views.renderCandidatos(this); else this.renderCandidatos();
    }

    toggleFavorito(id) {
        const candidatoId = parseInt(id);
        const index = this.favoritos.indexOf(candidatoId);
        if (index > -1) this.favoritos.splice(index,1); else this.favoritos.push(candidatoId);
        if (typeof localStorage !== 'undefined') localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
        if (views && typeof views.renderCandidatos === 'function') views.renderCandidatos(this); else this.renderCandidatos();
    }

    renderInitialContent() {
        if (typeof document !== 'undefined') {
            if (document.getElementById('candidatosGrid')) this.renderCandidatos();
            if (document.getElementById('votacoesGrid')) this.renderVotacoes();
            if (document.getElementById('dashboardStats')) this.renderDashboard();
        }
    }

    renderCandidatos() {
        if (typeof document === 'undefined') return;
        const grid = document.getElementById('candidatosGrid'); if (!grid) return;
        const start = (this.currentPage - 1) * this.pageSize; const end = start + this.pageSize;
        const pageItems = this.candidatosFiltrados.slice(start, end);
    grid.innerHTML = pageItems.map(_candidato => `...RENDER_TRUNCATED...`).join('');
        this.renderPagination();
    }

    // The remaining methods are copied as-is but may reference DOM functions available in main.js
    setPage(page) { const totalPages = Math.max(1, Math.ceil(this.candidatosFiltrados.length / this.pageSize)); if (page < 1) page = 1; if (page > totalPages) page = totalPages; this.currentPage = page; this.renderCandidatos(); }
    setPageSize(size) { this.pageSize = size; this.currentPage = 1; if (typeof localStorage !== 'undefined') localStorage.setItem('pageSize', String(size)); this.renderCandidatos(); }
    renderPagination() { /* ...existing code in main.js handles pagination rendering for browser; tests do not rely on full HTML here */ }
    renderVotacoes() { /* omitted for brevity in this extracted module; browser uses main.js implementation */ }
    renderDashboard() { /* omitted */ }
    showCandidatoDetails(_id) { /* omitted */ }
    showVotacaoDetails(_id) { /* omitted */ }
    createModal(content) { if (typeof document !== 'undefined') { const modal = document.createElement('div'); modal.className = 'fixed inset-0'; modal.innerHTML = content; document.body.appendChild(modal); } }
    navigateToPage(page) { console.log(`Navegando para: ${page}`); }
    initAnimations() { /* dom animations omitted for headless tests */ }
    createPortalKeyModal() { /* omitted */ }
}

// Export for Node and attach to window if available
if (typeof module !== 'undefined' && module.exports) module.exports = PoliticaApp;
if (typeof window !== 'undefined') window.PoliticaApp = PoliticaApp;
