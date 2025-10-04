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
            foto: "resources/politician-avatars.svg",
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
            foto: "resources/politician-avatars.svg",
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
            foto: "resources/politician-avatars.svg",
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
            foto: "resources/politician-avatars.svg",
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
            foto: "resources/politician-avatars.svg",
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
            foto: "resources/politician-avatars.svg",
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
            const resp = await window.governmentAPI.searchDeputados({ page, pageSize, nome, uf: estado, partido, ordenarPor });
            // normalize response shape: support both array and {results,meta}
            let results = [];
            let meta = { page, pageSize, total: null, hasMore: false };

            if (Array.isArray(resp)) {
                results = resp;
                meta = { page, pageSize, total: null, hasMore: results.length >= pageSize };
            } else if (resp && resp.results) {
                results = resp.results;
                meta = Object.assign(meta, resp.meta || {});
            }

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
            // update server paging flags
            this.serverPage = page;
            this.serverHasMore = !!meta.hasMore;

            // update UI counts if meta.total is present
            if (meta.total !== null && document.getElementById('totalCandidatos')) {
                document.getElementById('totalCandidatos').textContent = String(meta.total);
            }

            // update result count
            if (document.getElementById('resultCount')) {
                document.getElementById('resultCount').textContent = String(this.candidatosFiltrados.length);
            }

            this.renderCandidatos();
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
                    // keep last loaded despesas for CSV download and chart details
                    try { window.__lastDespesasLoaded = despesas; } catch (e) { /* ignore */ }
                    list.innerHTML = despesas.map(d => `
                        <div class="p-3 border rounded-lg">
                            <div class="flex justify-between">
                                <div class="text-sm font-medium">${d.favorecido || d.descricao}</div>
                                <div class="text-sm text-gray-600">${d.dataDocumento || ''}</div>
                            </div>
                            <div class="text-sm text-gray-700">Valor: R$ ${Number(d.valor || 0).toLocaleString('pt-BR')}</div>
                        </div>
                    `).join('');

                    // Add CSV download button
                    try {
                        if (!document.getElementById('downloadDespesasBtn')) {
                            const dlBtn = document.createElement('button');
                            dlBtn.id = 'downloadDespesasBtn';
                            dlBtn.className = 'mt-3 ml-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700';
                            dlBtn.textContent = 'Baixar CSV';
                            dlBtn.addEventListener('click', () => {
                                const rows = (window.__lastDespesasLoaded || []).map(r => ({
                                    data: r.dataDocumento || '',
                                    descricao: r.descricao || '',
                                    favorecido: r.favorecido || '',
                                    valor: r.valor || 0
                                }));
                                if (rows.length === 0) return alert('Nenhuma despesa para baixar.');
                                const header = Object.keys(rows[0]).join(',') + '\n';
                                const csv = header + rows.map(r => `${String(r.data).replace(/,/g,'')},"${String(r.descricao).replace(/"/g,'""')}","${String(r.favorecido).replace(/"/g,'""')}",${Number(r.valor).toFixed(2)}`).join('\n');
                                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `despesas_${(new Date()).toISOString().slice(0,10)}.csv`;
                                document.body.appendChild(a);
                                a.click();
                                setTimeout(() => { try { document.body.removeChild(a); URL.revokeObjectURL(url); } catch (e) {} }, 500);
                            });

                            // Insert next to load more button if present
                            const loadMoreBtnEl = document.getElementById('loadMoreDespesasBtn');
                            if (loadMoreBtnEl && loadMoreBtnEl.parentNode) {
                                loadMoreBtnEl.parentNode.insertBefore(dlBtn, loadMoreBtnEl.nextSibling);
                            } else {
                                list.parentNode.insertBefore(dlBtn, list);
                            }
                        }
                    } catch (err) { console.warn('Erro ao criar botão download', err); }

                    // Render a small summary chart if ECharts is available
                    try {
                        // Aggregate by favorecido and sum values
                        const agg = {};
                        (despesas || []).forEach(d => {
                            const key = (d.favorecido || d.descricao || 'Outros').trim();
                            const val = Number(d.valor || 0) || 0;
                            agg[key] = (agg[key] || 0) + val;
                        });

                        const items = Object.keys(agg).map(k => ({ nome: k, valor: agg[k] }));
                        items.sort((a, b) => b.valor - a.valor);
                        const top = items.slice(0, 6);

                        // create chart container
                        let chartEl = document.getElementById('gastosChart');
                        if (!chartEl) {
                            chartEl = document.createElement('div');
                            chartEl.id = 'gastosChart';
                            chartEl.style.width = '100%';
                            chartEl.style.height = '220px';
                            list.parentNode.insertBefore(chartEl, list);
                        }

                        if (window.echarts) {
                            const chart = window.echarts.init(chartEl);
                            const names = top.map(t => t.nome);
                            const vals = top.map(t => Math.round(t.valor * 100) / 100);
                            const option = {
                                tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
                                xAxis: { type: 'category', data: names, axisLabel: { interval: 0, rotate: 30 } },
                                yAxis: { type: 'value', axisLabel: { formatter: value => 'R$ ' + Number(value).toLocaleString('pt-BR') } },
                                series: [{ type: 'bar', data: vals, itemStyle: { color: '#f59e0b' } }]
                            };
                            chart.setOption(option);

                            // Add click handler to drilldown into monthly series for a favorecido
                            chart.on('click', async (params) => {
                                try {
                                    const favorecido = params.name;
                                    // aggregate monthly series from current despesas
                                    const despesas = window.__lastDespesasLoaded || [];
                                    const byMonth = {};
                                    despesas.forEach(d => {
                                        const key = favorecido;
                                        if ((d.favorecido || d.descricao || '').toString().includes(favorecido)) {
                                            const dt = new Date(d.dataDocumento || d.data || d.dataDocumento || Date.now());
                                            const monthKey = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
                                            byMonth[monthKey] = (byMonth[monthKey] || 0) + Number(d.valor || 0);
                                        }
                                    });

                                    const months = Object.keys(byMonth).sort();
                                    const series = months.map(m => Math.round((byMonth[m] || 0) * 100)/100);

                                    // create modal with a small chart
                                    const modalHtml = `<div style="max-width:800px;min-width:320px;background:white;padding:16px;border-radius:8px;">
                                        <h3 style="font-size:18px;margin-bottom:8px;">Gastos de ${favorecido} por mês</h3>
                                        <div id="drillChart" style="width:100%;height:300px"></div>
                                        <div style="text-align:right;margin-top:8px;"><button id="closeDrill" style="padding:6px 10px;background:#ef4444;color:white;border-radius:6px;border:none;">Fechar</button></div>
                                    </div>`;

                                    createModal(modalHtml);
                                    setTimeout(() => {
                                        const el = document.getElementById('drillChart');
                                        if (!el) return;
                                        const c = window.echarts.init(el);
                                        c.setOption({
                                            tooltip: { trigger: 'axis' },
                                            xAxis: { type: 'category', data: months },
                                            yAxis: { type: 'value', axisLabel: { formatter: v => 'R$ ' + Number(v).toLocaleString('pt-BR') } },
                                            series: [{ type: 'line', data: series, smooth: true }]
                                        });
                                        const closeBtn = document.getElementById('closeDrill');
                                        if (closeBtn) closeBtn.addEventListener('click', () => { const m = document.querySelector('.modal-root'); if (m) m.remove(); });
                                    }, 80);
                                } catch (err) { console.warn('drilldown error', err); }
                            });
                        }
                    } catch (err) {
                        console.warn('Erro ao renderizar gráfico de gastos', err);
                    }

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
                <input id="proxyAdminInput" class="w-full border px-3 py-2 rounded mb-3" placeholder="Token admin para proxy (opcional)" />
                <div id="proxySaveStatus" class="text-sm text-gray-600 mb-3" style="min-height:1.25rem"></div>
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

        // Add Save to proxy button
        const saveProxyBtn = document.createElement('button');
        saveProxyBtn.className = 'mt-3 px-4 py-2 bg-green-600 text-white rounded';
        saveProxyBtn.textContent = 'Salvar na proxy local';
        modal.querySelector('div').appendChild(saveProxyBtn);

        // Add Remove from proxy button
        const removeProxyBtn = document.createElement('button');
        removeProxyBtn.className = 'mt-3 ml-2 px-4 py-2 bg-red-600 text-white rounded';
        removeProxyBtn.textContent = 'Remover chave da proxy';
        modal.querySelector('div').appendChild(removeProxyBtn);

        removeProxyBtn.addEventListener('click', async () => {
            const confirmed = confirm('Remover a chave da proxy? Esta ação irá apagar a chave persistida localmente.');
            if (!confirmed) return;
            const admin = document.getElementById('proxyAdminInput').value.trim();
            const statusEl = document.getElementById('proxySaveStatus');
            statusEl.textContent = 'Removendo chave da proxy...';
            try {
                const headers = { 'Content-Type': 'application/json' };
                if (admin) headers['x-proxy-admin'] = admin;
                const res = await fetch('http://localhost:3001/unset-key', {
                    method: 'POST',
                    headers
                });
                if (!res.ok) {
                    const text = await res.text();
                    let msg = text;
                    try { const j = JSON.parse(text); msg = j && (j.message || j.error) ? (j.message || j.error) : JSON.stringify(j); } catch (e) {}
                    statusEl.textContent = 'Erro: ' + (msg || res.statusText || res.status);
                    return;
                }
                // clear local storage and notify
                localStorage.removeItem('portal_api_key');
                statusEl.textContent = 'Chave removida.';
                try { const ev = new CustomEvent('proxyKeyRemoved'); window.dispatchEvent(ev); } catch(e){}
                setTimeout(() => { try { document.body.removeChild(modal); } catch (e) {} }, 700);
            } catch (err) {
                console.error('Erro removendo chave da proxy:', err);
                statusEl.textContent = 'Não foi possível contatar a proxy.';
            }
        });

        saveProxyBtn.addEventListener('click', async () => {
            const v = document.getElementById('portalKeyInput').value.trim();
            const admin = document.getElementById('proxyAdminInput').value.trim();
            const statusEl = document.getElementById('proxySaveStatus');
            if (!v) return statusEl.textContent = 'Informe a chave antes de salvar na proxy.';
            statusEl.textContent = 'Enviando para proxy...';
            try {
                const headers = { 'Content-Type': 'application/json' };
                if (admin) headers['x-proxy-admin'] = admin;
                const res = await fetch('http://localhost:3001/set-key', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ key: v })
                });
                if (!res.ok) {
                    const text = await res.text();
                    // Try to parse JSON message or show text
                    let msg = text;
                    try { const j = JSON.parse(text); msg = j && (j.message || j.error) ? (j.message || j.error) : JSON.stringify(j); } catch (e) {}
                    statusEl.textContent = 'Erro: ' + (msg || res.statusText || res.status);
                    console.error('Erro ao salvar na proxy', res.status, msg);
                    return;
                }
                // Configure client to use proxy
                localStorage.setItem('portal_api_key', v);
                if (window.governmentAPI && typeof window.governmentAPI.setProxy === 'function') {
                    window.governmentAPI.setProxy('http://localhost:3001');
                }
                statusEl.textContent = 'Chave enviada com sucesso. Configurando...';
                // Dispatch a global event so UI can react (e.g. auto-open gastos)
                try {
                    const ev = new CustomEvent('proxyKeySaved', { detail: { key: v } });
                    window.dispatchEvent(ev);
                } catch (e) { console.warn('Could not dispatch proxyKeySaved', e); }
                // brief delay so user sees success message
                setTimeout(() => {
                    try { document.body.removeChild(modal); } catch (e) {}
                    alert('Chave enviada para proxy local e proxy configurada.');
                }, 700);
            } catch (err) {
                console.error('Erro salvando na proxy:', err);
                statusEl.textContent = 'Não foi possível conectar à proxy local. Verifique se está rodando em http://localhost:3001';
            }
        });
            // If a proxy key is saved elsewhere in the app, we can auto-trigger the gastos flow
            window.addEventListener('proxyKeySaved', () => {
                try {
                    const btn = document.getElementById('verGastosBtn');
                    if (btn && !btn.disabled) {
                        btn.click();
                    }
                } catch (e) { /* ignore */ }
            });
    }
}

// Estado global da aplicação
const appState = {
    api: null,
    candidatosReais: [],
    votacoesReais: [],
    loading: false,
    usingRealData: false
};

// Função para mostrar loading spinner
function showLoadingSpinner(text = 'Carregando dados...') {
    let spinner = document.getElementById('globalLoadingSpinner');
    if (!spinner) {
        spinner = document.createElement('div');
        spinner.id = 'globalLoadingSpinner';
        spinner.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:white;padding:24px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.15);text-align:center;';
        spinner.innerHTML = `
            <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mb-3"></div>
            <div id="loadingText" style="color:#1e3a8a;font-weight:600;">${text}</div>
        `;
        document.body.appendChild(spinner);
    } else {
        document.getElementById('loadingText').textContent = text;
        spinner.style.display = 'block';
    }
}

function hideLoadingSpinner() {
    const spinner = document.getElementById('globalLoadingSpinner');
    if (spinner) spinner.style.display = 'none';
}

// Função para carregar dados reais da API
async function carregarDadosReais() {
    if (!appState.api || appState.loading) return false;
    
    appState.loading = true;
    showLoadingSpinner('Carregando deputados e senadores...');
    
    try {
        console.log('🔄 Iniciando carregamento de dados reais...');
        
        // Carregar deputados (primeira página para começar)
        showLoadingSpinner('Carregando deputados...');
        const deputados = await appState.api.getDeputadosPage(1, 30);
        console.log('✅ Deputados carregados:', deputados.length);
        
        // Carregar senadores
        showLoadingSpinner('Carregando senadores...');
        const senadores = await appState.api.getSenadoresAtuais();
        console.log('✅ Senadores carregados:', senadores.length);
        
        // Combinar e atualizar array de candidatos
        appState.candidatosReais = [...deputados, ...senadores];
        
        // Limpar array original e adicionar dados reais
        candidatos.length = 0;
        candidatos.push(...appState.candidatosReais);
        
        // Carregar votações recentes
        showLoadingSpinner('Carregando votações recentes...');
        const votacoesRecentes = await appState.api.getVotacoesCamara(20);
        console.log('✅ Votações carregadas:', votacoesRecentes.length);
        
        appState.votacoesReais = votacoesRecentes;
        votacoes.length = 0;
        votacoes.push(...votacoesRecentes);
        
        appState.usingRealData = true;
        hideLoadingSpinner();
        
        // Mostrar notificação de sucesso
        mostrarNotificacao('✅ Dados reais carregados com sucesso!', 'success');
        
        console.log('🎉 Total de parlamentares:', candidatos.length);
        console.log('🎉 Total de votações:', votacoes.length);
        
        // Disparar evento para que outras partes da app saibam que dados foram atualizados
        window.dispatchEvent(new CustomEvent('dadosAtualizados', {
            detail: { candidatos: candidatos, votacoes: votacoes }
        }));
        
        return true;
    } catch (error) {
        console.error('❌ Erro ao carregar dados reais:', error);
        hideLoadingSpinner();
        mostrarNotificacao('⚠️ Erro ao carregar dados reais. Usando dados de demonstração.', 'warning');
        return false;
    } finally {
        appState.loading = false;
    }
}

// Função para mostrar notificações
function mostrarNotificacao(mensagem, tipo = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `position:fixed;top:24px;right:24px;z-index:9998;padding:16px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);max-width:400px;animation:slideIn 0.3s ease;`;
    
    const colors = {
        success: 'background:#10b981;color:white;',
        warning: 'background:#f59e0b;color:white;',
        error: 'background:#ef4444;color:white;',
        info: 'background:#3b82f6;color:white;'
    };
    
    notification.style.cssText += colors[tipo] || colors.info;
    notification.textContent = mensagem;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Inicializar aplicação quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inicializando aplicação...');
    
    // Inicializar GovernmentAPI se disponível
    if (window.GovernmentAPI) {
        try {
            appState.api = new window.GovernmentAPI();
            window.governmentAPI = appState.api; // Manter compatibilidade
            console.log('✅ GovernmentAPI inicializada');
        } catch (e) {
            console.warn('⚠️ Falha ao inicializar GovernmentAPI:', e);
        }
    }
    
    // Detectar e configurar proxy local
    if (appState.api) {
        try {
            const probe = await fetch('http://localhost:3001/despesas?pagina=1&itens=1', {
                method: 'GET',
                signal: AbortSignal.timeout(2000)
            });
            
            if (probe && probe.status !== 404) {
                appState.api.setProxy('http://localhost:3001');
                console.log('✅ Proxy local detectado e configurado: http://localhost:3001');
                
                // Mostrar banner de proxy
                showProxyBanner();
            }
        } catch (e) {
            console.log('ℹ️ Proxy local não detectado (normal se não estiver rodando)');
        }
    }
    
    // Carregar dados reais se habilitado
    if (USE_REAL_DATA && appState.api) {
        await carregarDadosReais();
    }
    
    // Inicializar aplicação principal
    window.politicaApp = new PoliticaApp();
});

// Função para criar banner de proxy
function showProxyBanner() {
    if (document.getElementById('proxyDetectedBanner')) return;
    const b = document.createElement('div');
    b.id = 'proxyDetectedBanner';
    b.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:60;background:#0f766e;color:white;padding:8px 12px;border-radius:6px;box-shadow:0 4px 12px rgba(0,0,0,0.12);';
    b.innerHTML = `<span style="margin-right:10px;">✅ Proxy local detectado</span>`;
    
    const btn = document.createElement('button');
    btn.textContent = 'Configurar chave';
    btn.className = 'px-3 py-1 bg-white text-teal-700 rounded mr-2';
    btn.addEventListener('click', () => createPortalKeyModal());
    
    const close = document.createElement('button');
    close.textContent = '×';
    close.style.cssText = 'background:transparent;color:white;border:none;font-size:18px;cursor:pointer;';
    close.addEventListener('click', () => b.remove());
    
    b.appendChild(btn);
    b.appendChild(close);
    document.body.appendChild(b);
    
    // Auto-hide depois de 12s
    setTimeout(() => b.remove(), 12000);
}

// Global spinner utilities (small, unobtrusive)
function ensureGlobalSpinner() {
    if (document.getElementById('globalSpinner')) return;
    const s = document.createElement('div');
    s.id = 'globalSpinner';
    s.style.position = 'fixed';
    s.style.left = '50%';
    s.style.top = '10%';
    s.style.transform = 'translateX(-50%)';
    s.style.zIndex = '9999';
    s.style.display = 'none';
    s.innerHTML = `<div style="background:#fff;padding:8px 12px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,0.12);display:flex;align-items:center;gap:10px;font-family:Inter, sans-serif;font-size:14px;"><div style="width:18px;height:18px;border:3px solid #c7d2fe;border-top-color:#4f46e5;border-radius:50%;animation:spin 1s linear infinite"></div><div id="globalSpinnerMsg">Carregando...</div></div>`;
    document.body.appendChild(s);
    // Add simple keyframe for spin
    const style = document.createElement('style');
    style.innerHTML = `@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`;
    document.head.appendChild(style);
}

function showGlobalSpinner(msg) {
    try {
        ensureGlobalSpinner();
        const s = document.getElementById('globalSpinner');
        if (!s) return;
        const msgEl = document.getElementById('globalSpinnerMsg');
        if (msg && msgEl) msgEl.textContent = msg;
        s.style.display = '';
    } catch (e) { console.warn(e); }
}

function hideGlobalSpinner() {
    try { const s = document.getElementById('globalSpinner'); if (s) s.style.display = 'none'; } catch (e) {}
}

// Função para criar controles do footer
function criarFooterControles() {
    try {
        const footerHelp = document.createElement('div');
        footerHelp.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:40;display:flex;gap:8px;align-items:center;';
        
        // Link para docs
        const docsLink = document.createElement('a');
        docsLink.href = 'server/PROXY_README.md';
        docsLink.target = '_blank';
        docsLink.style.cssText = 'background:#111827;color:#fff;padding:6px 8px;border-radius:6px;text-decoration:none;font-size:12px;';
        docsLink.textContent = '📖 Docs Proxy';
        
        // Botão remover chave
        const rmBtn = document.createElement('button');
        rmBtn.textContent = 'Remover chave';
        rmBtn.className = 'px-3 py-1 bg-red-600 text-white rounded text-sm';
        rmBtn.addEventListener('click', async () => {
            const admin = prompt('Token admin para proxy (se configurado):') || '';
            if (!confirm('Remover a chave persistida na proxy?')) return;
            try {
                const headers = { 'Content-Type': 'application/json' };
                if (admin) headers['x-proxy-admin'] = admin;
                const res = await fetch('http://localhost:3001/unset-key', { method: 'POST', headers });
                if (!res.ok) {
                    alert('Erro: ' + await res.text());
                    return;
                }
                alert('✅ Chave removida da proxy.');
            } catch (err) {
                console.error('Erro ao remover chave:', err);
                alert('❌ Não foi possível contactar a proxy.');
            }
        });
        
        // Upload CSV
        const uploadLabel = document.createElement('label');
        uploadLabel.className = 'px-3 py-1 bg-blue-600 text-white rounded text-sm cursor-pointer';
        uploadLabel.textContent = 'Carregar CSV';
        const uploadInput = document.createElement('input');
        uploadInput.type = 'file';
        uploadInput.accept = '.csv,text/csv';
        uploadInput.style.display = 'none';
        uploadLabel.appendChild(uploadInput);
        uploadInput.addEventListener('change', async (ev) => {
            const f = ev.target.files?.[0];
            if (!f) return;
            try {
                const txt = await f.text();
                if (window.governmentAPI?.loadDespesasFromCSV) {
                    const parsed = window.governmentAPI.loadDespesasFromCSV(txt);
                    window.governmentAPI.useLocalDespesas(parsed);
                    alert(`✅ CSV carregado: ${parsed.length} registros`);
                } else {
                    alert('❌ Função de parsing não disponível.');
                }
            } catch (err) {
                console.error('Erro ao processar CSV', err);
                alert('❌ Erro ao processar o CSV.');
            }
        });
        
        footerHelp.appendChild(docsLink);
        footerHelp.appendChild(rmBtn);
        footerHelp.appendChild(uploadLabel);
        document.body.appendChild(footerHelp);
    } catch (e) {
        console.warn('Erro ao criar footer:', e);
    }
}

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

// Dataset loader UI: fetches /resources/data/manifest.json and exposes a small selector in the footer
async function initDatasetLoaderUI() {
    try {
        const resp = await fetch('/resources/data/manifest.json');
        if (!resp.ok) return;
        const manifest = await resp.json();
        const footer = document.querySelector('footer') || document.body;
        const container = document.createElement('div');
        container.id = 'dataset-loader';
        container.style.padding = '8px';
        container.style.fontSize = '13px';
        container.innerHTML = `
            <label style="margin-right:8px;">Datasets locais:</label>
            <select id="datasetSelect" style="min-width:300px;padding:4px"></select>
            <button id="loadDatasetBtn" style="margin-left:8px;padding:6px 10px">Carregar</button>
            <button id="clearLocalDatasetBtn" style="margin-left:6px;padding:6px 8px">Limpar</button>
            <span id="datasetStatus" style="margin-left:12px"></span>
        `;
        footer.appendChild(container);

        const select = container.querySelector('#datasetSelect');
        const loadBtn = container.querySelector('#loadDatasetBtn');
        const clearBtn = container.querySelector('#clearLocalDatasetBtn');
        const status = container.querySelector('#datasetStatus');

        manifest.files.forEach(f => {
            if (!f || f === 'manifest.json' || f.endsWith('/manifest.json')) return;
            const opt = document.createElement('option');
            opt.value = '/resources/data/' + f;
            opt.textContent = f;
            select.appendChild(opt);
        });

        loadBtn.addEventListener('click', async () => {
            const url = select.value;
            if (!url) return;
            status.textContent = 'Carregando...';
            try {
                const r = await fetch(url);
                if (!r.ok) throw new Error('Fetch failed ' + r.status);
                const text = await r.text();
                if (url.toLowerCase().endsWith('.zip')) {
                    status.textContent = 'Arquivo ZIP detectado: extraia localmente e carregue o CSV.';
                    return;
                }
                const parsed = window.governmentAPI.loadDespesasFromCSV(text);
                window.governmentAPI.useLocalDespesas(parsed);
                status.textContent = `Carregado ${parsed.length} registros.`;
            } catch (err) {
                console.error('Erro ao carregar dataset', err);
                status.textContent = 'Erro ao carregar dataset.';
            }
        });

        clearBtn.addEventListener('click', () => {
            window.governmentAPI.useLocalDespesas([]);
            status.textContent = 'Despesas locais limpas.';
        });
    } catch (err) {
        // noop
    }
}

// Initialize dataset loader when page has loaded
// Initialize dataset loader and app when page has loaded
document.addEventListener('DOMContentLoaded', async () => {
    try { initDatasetLoaderUI(); } catch (e) { /* ignore */ }

    // Instantiate the main application that controls candidates/votacoes
    try {
        // create app instance and expose globally for page scripts
        window.politicaApp = new PoliticaApp();

        // If governmentAPI already exists, fetch the first server page so the
        // candidates page uses server-side pagination/search immediately.
        if (window.governmentAPI) {
            try {
                await window.politicaApp.fetchServerPage({}, 1, window.politicaApp.pageSize);
            } catch (err) {
                console.warn('Initial server fetch failed:', err);
            }
        } else {
            // Wait for data updater to emit dadosAtualizados (fires when GovernmentAPI finishes loading)
            const onDados = async () => {
                if (window.governmentAPI) {
                    try { await window.politicaApp.fetchServerPage({}, 1, window.politicaApp.pageSize); } catch(e) { /* ignore */ }
                }
            };
            window.addEventListener('dadosAtualizados', onDados, { once: true });
        }
    } catch (err) {
        console.warn('PoliticaApp init failed', err);
    }
});