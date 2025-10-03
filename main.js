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
        this.pageSize = 6; // itens por página
        this.init();
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
            </div>
        `);
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
}

// Inicializar aplicação quando DOM estiver carregado
document.addEventListener('DOMContentLoaded', async () => {
    if (USE_REAL_DATA && window.GovernmentAPI) {
        // Tentar carregar dados reais primeiro
        try {
            const governmentAPI = new window.GovernmentAPI();
            const dadosReais = await governmentAPI.carregarDadosCompletos();
            
            if (dadosReais) {
                console.log('Dados reais carregados com sucesso!');
                // Substituir dados simulados pelos reais
                window.candidatos = dadosReais.parlamentares;
                window.votacoes = dadosReais.votacoes;
                
                // Adicionar histórico de votos para cada parlamentar
                for (let candidato of window.candidatos) {
                    if (candidato.cargo === 'Deputado Federal') {
                        const historico = await governmentAPI.getHistoricoVotosDeputado(candidato.id, 10);
                        candidato.votacoes = historico;
                    } else {
                        // Para senadores, usar dados simulados por enquanto
                        candidato.votacoes = [
                            { materia: "PEC da Bandidagem", voto: "A favor", data: "2024-03-15", importancia: "Alta" },
                            { materia: "Reforma Tributária", voto: "Contra", data: "2024-02-20", importancia: "Alta" }
                        ];
                    }
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