// Sistema de Política Brasileira - JavaScript Principal

// Flag para usar dados reais ou simulados
const USE_REAL_DATA = true;

// Dados simulados para fallback ou demonstração
const candidatos = [
    {
        id: 1,
        nome: "João Silva",
        partido: "PT",
        estado: "SP",
        cargo: "Deputado Federal",
        foto: "resources/politician-avatars.png",
        votacoes: [
            { materia: "PEC da Bandidagem", voto: "Contra", data: "2024-03-15", importancia: "Alta" },
            { materia: "Reforma Tributária", voto: "A favor", data: "2024-02-20", importancia: "Alta" },
            { materia: "Marco Legal das Startups", voto: "A favor", data: "2024-01-10", importancia: "Média" }
        ],
        projetos: ["Educação Digital", "Saúde Pública 4.0", "Transparência na Gestão"],
        ideologia: "Centro-esquerda"
    },
    {
        id: 2,
        nome: "Maria Santos",
        partido: "PSDB",
        estado: "RJ",
        cargo: "Senadora",
        foto: "resources/politician-avatars.png",
        votacoes: [
            { materia: "PEC da Bandidagem", voto: "A favor", data: "2024-03-15", importancia: "Alta" },
            { materia: "Reforma Tributária", voto: "A favor", data: "2024-02-20", importancia: "Alta" },
            { materia: "Privatização dos Correios", voto: "A favor", data: "2024-01-25", importancia: "Média" }
        ],
        projetos: ["Reforma Administrativa", "Modernização do Estado", "Inovação Tecnológica"],
        ideologia: "Centro-direita"
    },
    {
        id: 3,
        nome: "Carlos Oliveira",
        partido: "MDB",
        estado: "MG",
        cargo: "Deputado Federal",
        foto: "resources/politician-avatars.png",
        votacoes: [
            { materia: "PEC da Bandidagem", voto: "Abstenção", data: "2024-03-15", importancia: "Alta" },
            { materia: "Reforma Tributária", voto: "A favor", data: "2024-02-20", importancia: "Alta" },
            { materia: "Crédito Consignado", voto: "A favor", data: "2024-02-05", importancia: "Baixa" }
        ],
        projetos: ["Desenvolvimento Regional", "Agricultura Familiar", "Infraestrutura"],
        ideologia: "Centro"
    },
    {
        id: 4,
        nome: "Ana Costa",
        partido: "PSOL",
        estado: "BA",
        cargo: "Deputada Federal",
        foto: "resources/politician-avatars.png",
        votacoes: [
            { materia: "PEC da Bandidagem", voto: "Contra", data: "2024-03-15", importancia: "Alta" },
            { materia: "Reforma Tributária", voto: "Contra", data: "2024-02-20", importancia: "Alta" },
            { materia: "Auditoria da Dívida", voto: "A favor", data: "2024-01-15", importancia: "Média" }
        ],
        projetos: ["Reforma Urbana", "Direitos Humanos", "Sustentabilidade Ambiental"],
        ideologia: "Esquerda"
    },
    {
        id: 5,
        nome: "Roberto Lima",
        partido: "PL",
        estado: "RS",
        cargo: "Senador",
        foto: "resources/politician-avatars.png",
        votacoes: [
            { materia: "PEC da Bandidagem", voto: "A favor", data: "2024-03-15", importancia: "Alta" },
            { materia: "Reforma Tributária", voto: "Contra", data: "2024-02-20", importancia: "Alta" },
            { materia: "Porte de Armas", voto: "A favor", data: "2024-02-10", importancia: "Média" }
        ],
        projetos: ["Segurança Pública", "Liberdade Econômica", "Valores Tradicionais"],
        ideologia: "Direita"
    },
    {
        id: 6,
        nome: "Lucia Ferreira",
        partido: "PDT",
        estado: "PE",
        cargo: "Deputada Federal",
        foto: "resources/politician-avatars.png",
        votacoes: [
            { materia: "PEC da Bandidagem", voto: "Contra", data: "2024-03-15", importancia: "Alta" },
            { materia: "Reforma Tributária", voto: "A favor", data: "2024-02-20", importancia: "Alta" },
            { materia: "Trabalho Verde", voto: "A favor", data: "2024-01-20", importancia: "Média" }
        ],
        projetos: ["Trabalho Digno", "Economia Solidária", "Educação Técnica"],
        ideologia: "Centro-esquerda"
    }
];

const votacoes = [
    {
        id: 1,
        materia: "PEC da Bandidagem",
        descricao: "Proposta de Emenda Constitucional que endurece penas para crimes violentos e limita recursos processuais",
        data: "2024-03-15",
        resultado: "Aprovada",
    votos: { "a favor": 350, contra: 120, abstencao: 15 },
        importancia: "Alta",
        impacto: "Altera fundamentos do Código Penal e processual penal"
    },
    {
        id: 2,
        materia: "Reforma Tributária",
        descricao: "Redesign completo do sistema tributário nacional, unificando tributos e simplificando a cobrança",
        data: "2024-02-20",
        resultado: "Aprovada",
    votos: { "a favor": 380, contra: 90, abstencao: 15 },
        importancia: "Alta",
        impacto: "Mudança estrutural na arrecadação e distribuição de recursos"
    },
    {
        id: 3,
        materia: "Marco Legal das Startups",
        descricao: "Criação de marco regulatório favorável ao desenvolvimento de empresas inovadoras",
        data: "2024-01-10",
        resultado: "Aprovada",
    votos: { "a favor": 420, contra: 30, abstencao: 35 },
        importancia: "Média",
        impacto: "Incentivo ao ecossistema de inovação e empreendedorismo"
    }
];

// Sistema de busca e filtros
class PoliticaApp {
    constructor() {
        this.candidatosFiltrados = [...candidatos];
        this.votacoesFiltradas = [...votacoes];
        this.favoritos = JSON.parse(localStorage.getItem('favoritos') || '[]');
        this.currentPage = 1;
        this.pageSize = parseInt(localStorage.getItem('pageSize'), 10) || 6; // itens por página
        this.viewMode = localStorage.getItem('viewMode') || 'grid';
        this.init();
    }

    // Carregamento incremental (load more) a partir da API
    async loadMoreFromAPI(pageSize = 20) {
        if (!window.governmentAPI) return;
        this.serverPage = this.serverPage || 1;
        this.serverHasMore = this.serverHasMore === undefined ? true : this.serverHasMore;

        if (!this.serverHasMore) return;

        try {
            const nextPage = this.serverPage + 1;
            // UI: set loading
            const loadBtn = document.getElementById('loadMoreBtn');
            if (loadBtn) {
                loadBtn.disabled = true;
                loadBtn.textContent = 'Carregando...';
            }

            const deputies = await window.governmentAPI.getDeputadosPage(nextPage, pageSize);
            if (deputies && deputies.length > 0) {
                // anexar aos dados locais
                if (typeof candidatos !== 'undefined') {
                    candidatos.push(...deputies);
                } else if (window.candidatos) {
                    window.candidatos.push(...deputies);
                }

                // atualizar view
                this.candidatosFiltrados = [...this.candidatosFiltrados, ...deputies];
                this.renderCandidatos();
                this.serverPage = nextPage;
                // If returned less than pageSize, assume no more
                if (deputies.length < pageSize) this.serverHasMore = false;
            } else {
                this.serverHasMore = false;
            }
        } catch (err) {
            console.error('Erro ao carregar mais deputados:', err);
        } finally {
            // restore UI
            const loadBtn2 = document.getElementById('loadMoreBtn');
            if (loadBtn2) {
                if (!this.serverHasMore) {
                    loadBtn2.style.display = 'none';
                } else {
                    loadBtn2.disabled = false;
                    loadBtn2.textContent = 'Carregar mais';
                }
            }
        }
    }

    // Buscar página no servidor aplicando filtros (server-side pagination)
    // Utility to update load more UI based on serverHasMore
    updateLoadMoreUI() {
        const loadBtn = document.getElementById('loadMoreBtn');
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
        if (!window.governmentAPI) return null;
        try {
            const results = await window.governmentAPI.searchDeputados({ page, pageSize, nome, uf: estado, partido, ordenarPor });
            // Replace or append depending on page
            if (page === 1) {
                if (typeof candidatos !== 'undefined') {
                    candidatos.length = 0;
                    candidatos.push(...results);
                } else if (window.candidatos) {
                    window.candidatos.length = 0;
                    window.candidatos.push(...results);
                }
                this.candidatosFiltrados = [...results];
            } else {
                if (typeof candidatos !== 'undefined') candidatos.push(...results);
                else if (window.candidatos) window.candidatos.push(...results);
                this.candidatosFiltrados = [...this.candidatosFiltrados, ...results];
            }

            this.currentPage = page;
            this.renderCandidatos();
            return results;
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

    setupEventListeners() {
        // Busca principal
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Filtros
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e.target.dataset.filter));
        });

        // Ordenação
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => this.handleSort(e.target.value));
        }

        // Navegação
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-page]')) {
                e.preventDefault();
                this.navigateToPage(e.target.dataset.page);
            }
            
            if (e.target.matches('[data-candidato]')) {
                this.showCandidatoDetails(e.target.dataset.candidato);
            }

            if (e.target.matches('[data-votacao]')) {
                this.showVotacaoDetails(e.target.dataset.votacao);
            }

            if (e.target.matches('.favorite-btn')) {
                this.toggleFavorito(e.target.dataset.id);
            }
        });
    }

    handleSearch(query) {
        if (!query) {
            this.candidatosFiltrados = [...candidatos];
        } else {
            this.candidatosFiltrados = candidatos.filter(c => 
                c.nome.toLowerCase().includes(query.toLowerCase()) ||
                c.partido.toLowerCase().includes(query.toLowerCase()) ||
                c.estado.toLowerCase().includes(query.toLowerCase()) ||
                c.cargo.toLowerCase().includes(query.toLowerCase())
            );
        }
        this.renderCandidatos();
    }

    handleFilter(filterType) {
        // Atualizar botões ativos
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filterType}"]`).classList.add('active');

        // Aplicar filtros
        switch(filterType) {
            case 'todos':
                this.candidatosFiltrados = [...candidatos];
                break;
            case 'favoritos':
                this.candidatosFiltrados = candidatos.filter(c => this.favoritos.includes(c.id));
                break;
            case 'deputados':
                this.candidatosFiltrados = candidatos.filter(c => c.cargo.includes('Deputado'));
                break;
            case 'senadores':
                this.candidatosFiltrados = candidatos.filter(c => c.cargo.includes('Senador'));
                break;
        }
        this.renderCandidatos();
    }

    handleSort(sortBy) {
        this.candidatosFiltrados.sort((a, b) => {
            switch(sortBy) {
                case 'nome':
                    return a.nome.localeCompare(b.nome);
                case 'partido':
                    return a.partido.localeCompare(b.partido);
                case 'estado':
                    return a.estado.localeCompare(b.estado);
                default:
                    return 0;
            }
        });
        this.renderCandidatos();
    }

    toggleFavorito(id) {
        const candidatoId = parseInt(id);
        const index = this.favoritos.indexOf(candidatoId);
        
        if (index > -1) {
            this.favoritos.splice(index, 1);
        } else {
            this.favoritos.push(candidatoId);
        }
        
        localStorage.setItem('favoritos', JSON.stringify(this.favoritos));
        this.renderCandidatos();
    }

    renderInitialContent() {
        if (document.getElementById('candidatosGrid')) {
            this.renderCandidatos();
        }
        if (document.getElementById('votacoesGrid')) {
            this.renderVotacoes();
        }
        if (document.getElementById('dashboardStats')) {
            this.renderDashboard();
        }
    }

    renderCandidatos() {
        const grid = document.getElementById('candidatosGrid');
        if (!grid) return;
        // Paginação: calcular slice
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const pageItems = this.candidatosFiltrados.slice(start, end);

        grid.innerHTML = pageItems.map(candidato => `
            <div class="candidato-card bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <div class="relative">
                    <img src="${candidato.foto}" alt="${candidato.nome}" class="w-full h-48 object-cover">
                    <button class="favorite-btn absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md transition-all ${this.favoritos.includes(candidato.id) ? 'bg-yellow-400 text-white' : 'text-gray-400 hover:text-yellow-500'}" data-id="${candidato.id}">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-xl font-bold text-gray-900">${candidato.nome}</h3>
                        <span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">${candidato.partido}</span>
                    </div>
                    <div class="flex items-center text-gray-600 mb-3">
                        <i class="fas fa-map-marker-alt mr-2"></i>
                        <span>${candidato.estado}</span>
                        <span class="mx-2">•</span>
                        <span>${candidato.cargo}</span>
                    </div>
                    <div class="mb-4">
                        <span class="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full mr-2">${candidato.ideologia}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <button class="text-blue-600 hover:text-blue-800 font-medium transition-colors" data-candidato="${candidato.id}">
                            Ver detalhes →
                        </button>
                        <div class="text-sm text-gray-500">
                            ${candidato.votacoes.length} votações
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        // Atualizar paginação se houver container
        this.renderPagination();
    }

    setPage(page) {
        const totalPages = Math.max(1, Math.ceil(this.candidatosFiltrados.length / this.pageSize));
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        this.currentPage = page;
        this.renderCandidatos();
    }

    setPageSize(size) {
        this.pageSize = size;
        this.currentPage = 1;
        localStorage.setItem('pageSize', String(size));
        this.renderCandidatos();
    }

    renderPagination() {
        const container = document.getElementById('paginationControls');
        if (!container) return;

        const totalItems = this.candidatosFiltrados.length;
        const totalPages = Math.max(1, Math.ceil(totalItems / this.pageSize));

        // Limpar
        container.innerHTML = '';

        const nav = document.createElement('nav');
        nav.className = 'flex items-center space-x-2';

        const prev = document.createElement('button');
        prev.className = 'px-3 py-2 text-gray-500 hover:text-gray-700';
        prev.innerHTML = '<i class="fas fa-chevron-left"></i>';
        prev.disabled = this.currentPage === 1;
        prev.addEventListener('click', () => this.setPage(this.currentPage - 1));
        nav.appendChild(prev);

        // páginas (limitar a mostrar até 7 páginas de forma simples)
        const maxButtons = 7;
        let startPage = Math.max(1, this.currentPage - Math.floor(maxButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxButtons - 1);
        if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        for (let p = startPage; p <= endPage; p++) {
            const btn = document.createElement('button');
            btn.className = 'px-4 py-2 rounded-lg ' + (p === this.currentPage ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100');
            btn.textContent = String(p);
            btn.setAttribute('aria-label', `Página ${p} de ${totalPages}`);
            if (p === this.currentPage) {
                btn.setAttribute('aria-current', 'page');
            }
            btn.addEventListener('click', () => this.setPage(p));
            nav.appendChild(btn);
        }

        const next = document.createElement('button');
        next.className = 'px-3 py-2 text-gray-500 hover:text-gray-700';
        next.innerHTML = '<i class="fas fa-chevron-right"></i>';
        next.disabled = this.currentPage === totalPages;
        next.addEventListener('click', () => this.setPage(this.currentPage + 1));
        nav.appendChild(next);

        container.appendChild(nav);
    }

    renderVotacoes() {
        const grid = document.getElementById('votacoesGrid');
        if (!grid) return;

        grid.innerHTML = this.votacoesFiltradas.map(votacao => `
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

    renderDashboard() {
        const stats = document.getElementById('dashboardStats');
        if (!stats) return;

        const totalCandidatos = candidatos.length;
        const totalVotacoes = votacoes.length;
        const favoritosCount = this.favoritos.length;

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

    showCandidatoDetails(id) {
        const candidato = candidatos.find(c => c.id == id);
        if (!candidato) return;

        // Criar modal ou navegar para página de detalhes
        this.createModal(`
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
                        ${candidato.projetos.map(projeto => `
                            <div class="bg-blue-50 rounded-lg p-4">
                                <div class="text-blue-800 font-medium">${projeto}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div>
                    <h3 class="text-lg font-semibold mb-4">Histórico de Votações</h3>
                    <div class="space-y-4">
                        ${candidato.votacoes.map(votacao => `
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
                        `).join('')}
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
        `);

        // Wire up gastos button after modal is created
        setTimeout(async () => {
            const verBtn = document.getElementById('verGastosBtn');
            const status = document.getElementById('gastosStatus');
            const list = document.getElementById('gastosList');

            if (!verBtn) return;

            verBtn.addEventListener('click', async () => {
                status.textContent = 'Carregando...';
                list.innerHTML = '';
                verBtn.disabled = true;

                // Check stored key
                const key = localStorage.getItem('portal_api_key');
                if (!key) {
                    status.textContent = 'Chave do Portal não configurada.';
                    // create small modal to configure key
                    createPortalKeyModal();
                    return;
                }

                // ensure GovernmentAPI knows the key
                if (window.governmentAPI && typeof window.governmentAPI.setPortalKey === 'function') {
                    window.governmentAPI.setPortalKey(key);
                }

                try {
                    if (!window.governmentAPI || typeof window.governmentAPI.getDespesasPorParlamentar !== 'function') {
                        status.textContent = 'Integração não disponível.';
                        return;
                    }

                    // Try to get CPF via Câmara API for more precise Portal query
                    let queryParams = { pagina: 1, itens: 10 };
                    try {
                        if (window.governmentAPI && typeof window.governmentAPI.getDeputado === 'function') {
                            const detalhes = await window.governmentAPI.getDeputado(candidato.id);
                            if (detalhes && detalhes.cpf) {
                                queryParams.cpf = detalhes.cpf;
                            } else {
                                queryParams.nome = candidato.nome;
                            }
                        } else {
                            queryParams.nome = candidato.nome;
                        }
                    } catch (err) {
                        // fallback to nome
                        queryParams.nome = candidato.nome;
                    }

                    const despesas = await window.governmentAPI.getDespesasPorParlamentar(queryParams);

                    if (!despesas) {
                        status.textContent = 'Erro ao buscar despesas. Tente novamente em alguns segundos.';
                        verBtn.disabled = false;
                        return;
                    }

                    if (despesas.error === 'API_KEY_MISSING') {
                        status.textContent = 'Chave do Portal não configurada.';
                        return;
                    }

                    if (Array.isArray(despesas) && despesas.length === 0) {
                        status.textContent = 'Nenhuma despesa encontrada.';
                        verBtn.disabled = false;
                        return;
                    }

                    status.textContent = '';
                    // set page attribute for pagination
                    list.dataset.despesasPage = '1';
                    list.innerHTML = despesas.map(d => `
                        <div class="p-3 border rounded-lg">
                            <div class="flex justify-between">
                                <div class="text-sm font-medium">${d.favorecido || d.descricao}</div>
                                <div class="text-sm text-gray-600">${d.dataDocumento || ''}</div>
                            </div>
                            <div class="text-sm text-gray-700">Valor: R$ ${Number(d.valor || 0).toLocaleString('pt-BR')}</div>
                        </div>
                    `).join('');

                    // add load more button if not present
                    if (!document.getElementById('loadMoreDespesasBtn')) {
                        const moreBtn = document.createElement('button');
                        moreBtn.id = 'loadMoreDespesasBtn';
                        moreBtn.className = 'mt-3 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300';
                        moreBtn.textContent = 'Carregar mais despesas';
                        moreBtn.addEventListener('click', async () => {
                            const current = parseInt(list.dataset.despesasPage || '1', 10);
                            const next = current + 1;
                            status.textContent = 'Carregando...';
                            moreBtn.disabled = true;
                            try {
                                const more = await window.governmentAPI.getDespesasPorParlamentar({ nome: candidato.nome, pagina: next, itens: 10 });
                                if (!more || more.length === 0) {
                                    status.textContent = 'Sem mais despesas.';
                                    moreBtn.disabled = true;
                                    return;
                                }
                                list.dataset.despesasPage = String(next);
                                list.innerHTML += more.map(d => `
                                    <div class="p-3 border rounded-lg">
                                        <div class="flex justify-between">
                                            <div class="text-sm font-medium">${d.favorecido || d.descricao}</div>
                                            <div class="text-sm text-gray-600">${d.dataDocumento || ''}</div>
                                        </div>
                                        <div class="text-sm text-gray-700">Valor: R$ ${Number(d.valor || 0).toLocaleString('pt-BR')}</div>
                                    </div>
                                `).join('');
                                status.textContent = '';
                                moreBtn.disabled = false;
                            } catch (err) {
                                console.error('Erro ao carregar mais despesas:', err);
                                status.textContent = 'Erro ao carregar mais despesas. Tente novamente.';
                                moreBtn.disabled = false;
                            }
                        });

                        list.parentNode.insertBefore(moreBtn, list.nextSibling);
                    }
                } catch (err) {
                    console.error('Erro ao obter despesas:', err);
                    status.textContent = 'Erro ao obter despesas.';
                }
            });
        }, 50);
    }

    showVotacaoDetails(id) {
        const votacao = votacoes.find(v => v.id == id);
        if (!votacao) return;

        const votosPorCandidato = candidatos.map(candidato => {
            const votoDoCandidato = candidato.votacoes.find(v => v.materia === votacao.materia);
            return {
                nome: candidato.nome,
                partido: candidato.partido,
                voto: votoDoCandidato ? votoDoCandidato.voto : 'Não votou'
            };
        });

        this.createModal(`
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
        `);
    }

    createModal(content) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = content;
        
        document.body.appendChild(modal);

        // Event listeners para fechar modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    navigateToPage(page) {
        // Simular navegação - em um app real, usaríamos rotas
        console.log(`Navegando para: ${page}`);
        // window.location.href = `${page}.html`;
    }

    initAnimations() {
        // Animações de entrada
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observar elementos para animação
        document.querySelectorAll('.candidato-card, .votacao-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // Small modal to configure Portal da Transparência API key
    createPortalKeyModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-lg w-full">
                <h3 class="text-lg font-semibold mb-3">Configurar chave do Portal da Transparência</h3>
                <p class="text-sm text-gray-600 mb-3">Cole sua chave de API (será salva no navegador).</p>
                <input id="portalKeyInput" class="w-full border px-3 py-2 rounded mb-3" placeholder="Chave da API" />
                <div class="flex justify-end space-x-2">
                    <button id="portalKeyCancel" class="px-4 py-2 bg-gray-200 rounded">Cancelar</button>
                    <button id="portalKeySave" class="px-4 py-2 bg-blue-600 text-white rounded">Salvar</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('portalKeyCancel').addEventListener('click', () => document.body.removeChild(modal));
        document.getElementById('portalKeySave').addEventListener('click', () => {
            const v = document.getElementById('portalKeyInput').value.trim();
            if (!v) return;
            localStorage.setItem('portal_api_key', v);
            if (window.governmentAPI && typeof window.governmentAPI.setPortalKey === 'function') {
                window.governmentAPI.setPortalKey(v);
            }
            document.body.removeChild(modal);
            alert('Chave salva. Retorne ao candidato e clique em Ver gastos novamente.');
        });
    }
}

// Inicializar aplicação quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    if (window.GovernmentAPI) {
        // create a global instance to reuse
        try { window.governmentAPI = new window.GovernmentAPI(); } catch (e) { console.warn('GovernmentAPI init failed', e); }
    }
    if (USE_REAL_DATA && window.governmentAPI) {
        // Tentar carregar dados reais primeiro
        try {
            const governmentAPI = new window.GovernmentAPI();
            const dadosReais = await governmentAPI.carregarDadosCompletos();
            
            if (dadosReais) {
                console.log('Dados reais carregados com sucesso!');
                // Mutate existing arrays so references in the app keep working
                try {
                    // candidatos is a const array defined as fallback; clear and push
                    if (Array.isArray(window.candidatos) || typeof candidatos !== 'undefined') {
                        // Use local candidatos variable if present, otherwise window.candidatos
                        const targetCandidatos = (typeof candidatos !== 'undefined') ? candidatos : window.candidatos || [];
                        targetCandidatos.length = 0;
                        if (Array.isArray(dadosReais.parlamentares)) {
                            targetCandidatos.push(...dadosReais.parlamentares);
                        }
                    }

                    if (Array.isArray(window.votacoes) || typeof votacoes !== 'undefined') {
                        const targetVotacoes = (typeof votacoes !== 'undefined') ? votacoes : window.votacoes || [];
                        targetVotacoes.length = 0;
                        if (Array.isArray(dadosReais.votacoes)) {
                            targetVotacoes.push(...dadosReais.votacoes);
                        }
                    }

                    // Enriquecer histórico de votos para deputados
                    for (let i = 0; i < (typeof candidatos !== 'undefined' ? candidatos.length : 0); i++) {
                        const candidato = candidatos[i];
                        if (!candidato) continue;
                        if (candidato.cargo && candidato.cargo.toLowerCase().includes('deputado')) {
                            try {
                                const historico = await governmentAPI.getHistoricoVotosDeputado(candidato.id, 10);
                                candidato.votacoes = historico || candidato.votacoes || [];
                            } catch (err) {
                                // keep existing votacoes on error
                            }
                        }
                    }
                } catch (err) {
                    console.error('Erro ao aplicar dados reais:', err);
                }
            }
        } catch (error) {
            console.log('Usando dados simulados:', error.message);
        }
    }
    
    window.politicaApp = new PoliticaApp();
});

// Funções utilitárias
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

function getVotoColor(voto) {
    const colors = {
        'A favor': 'text-green-600 bg-green-100',
        'Contra': 'text-red-600 bg-red-100',
        'Abstenção': 'text-gray-600 bg-gray-100',
        'Não votou': 'text-yellow-600 bg-yellow-100'
    };
    return colors[voto] || 'text-gray-600 bg-gray-100';
}