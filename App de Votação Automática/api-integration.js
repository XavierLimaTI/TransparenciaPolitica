// Integração com APIs Oficiais do Governo Brasileiro
// Câmara dos Deputados e Senado Federal

class GovernmentAPI {
    constructor() {
        this.baseURLs = {
            camara: 'https://dadosabertos.camara.leg.br/api/v2',
            senado: 'https://legis.senado.leg.br/dadosabertos'
        };
        
        this.headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }

    // Sistema de cache para otimizar requisições
    getCacheKey(endpoint, params) {
        return `${endpoint}_${JSON.stringify(params)}`;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheTimeout) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    // Método genérico para requisições
    async fetchData(base, endpoint, params = {}) {
        const cacheKey = this.getCacheKey(endpoint, params);
        const cached = this.getCache(cacheKey);
        
        if (cached) {
            console.log(`Cache hit: ${cacheKey}`);
            return cached;
        }

        try {
            const url = new URL(`${this.baseURLs[base]}${endpoint}`);
            Object.keys(params).forEach(key => {
                if (params[key]) url.searchParams.append(key, params[key]);
            });

            console.log(`Fetching: ${url.toString()}`);
            
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: this.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.setCache(cacheKey, data);
            
            return data;
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return null;
        }
    }

    // Buscar deputados atuais
    async getDeputadosAtuais() {
        const data = await this.fetchData('camara', '/deputados', {
            ordem: 'ASC',
            ordenarPor: 'nome'
        });

        if (!data || !data.dados) return [];

        return data.dados.map(deputado => ({
            id: deputado.id,
            nome: deputado.nome,
            partido: deputado.siglaPartido,
            estado: deputado.siglaUf,
            foto: deputado.urlFoto,
            email: deputado.email,
            cargo: 'Deputado Federal',
            ideologia: this.classificarIdeologia(deputado.siglaPartido),
            dataNascimento: deputado.dataNascimento,
            situacao: 'Exercício'
        }));
    }

    // Buscar senadores atuais
    async getSenadoresAtuais() {
        const data = await this.fetchData('senado', '/senador');
        
        if (!data || !data.ListaParlamentarEmExercicio || !data.ListaParlamentarEmExercicio.Parlamentares) return [];

        return data.ListaParlamentarEmExercicio.Parlamentares.Parlamentar.map(senador => ({
            id: senador.IdentificacaoParlamentar.CodigoParlamentar,
            nome: senador.IdentificacaoParlamentar.NomeParlamentar,
            partido: senador.IdentificacaoParlamentar.SiglaPartidoParlamentar,
            estado: senador.IdentificacaoParlamentar.UfParlamentar,
            foto: senador.IdentificacaoParlamentar.UrlFotoParlamentar,
            email: senador.IdentificacaoParlamentar.EmailParlamentar,
            cargo: 'Senador',
            ideologia: this.classificarIdeologia(senador.IdentificacaoParlamentar.SiglaPartidoParlamentar),
            dataNascimento: senador.IdentificacaoParlamentar.DataNascimentoParlamentar,
            situacao: 'Exercício'
        }));
    }

    // Buscar votações recentes da Câmara
    async getVotacoesCamara(limit = 20) {
        const data = await this.fetchData('camara', '/votacoes', {
            ordem: 'DESC',
            ordenarPor: 'dataHoraRegistro',
            itens: limit
        });

        if (!data || !data.dados) return [];

        return data.dados.map(votacao => ({
            id: votacao.id,
            materia: votacao.siglaOrgao || 'Votação',
            descricao: votacao.descricao || 'Descrição não disponível',
            data: votacao.dataHoraRegistro,
            resultado: votacao.aprovacao ? 'Aprovada' : 'Rejeitada',
            importancia: this.classificarImportancia(votacao.siglaOrgao),
            votos: {
                'a favor': votacao.secoes && votacao.secoes[0] && votacao.secoes[0].totalVotosSimulacao || 0,
                'contra': votacao.secoes && votacao.secoes[0] && votacao.secoes[0].totalVotosNaoSimulacao || 0,
                'abstencao': votacao.secoes && votacao.secoes[0] && votacao.secoes[0].totalVotosAbstencaoSimulacao || 0
            }
        }));
    }

    // Buscar detalhes de uma votação específica
    async getDetalhesVotacao(idVotacao) {
        const data = await this.fetchData('camara', `/votacoes/${idVotacao}`);
        
        if (!data || !data.dados) return null;

        const votacao = data.dados;
        
        // Buscar votos individuais
        const votosData = await this.fetchData('camara', `/votacoes/${idVotacao}/votos`);
        
        return {
            id: votacao.id,
            materia: votacao.siglaOrgao || 'Votação',
            descricao: votacao.descricao || 'Descrição não disponível',
            data: votacao.dataHoraRegistro,
            resultado: votacao.aprovacao ? 'Aprovada' : 'Rejeitada',
            importancia: this.classificarImportancia(votacao.siglaOrgao),
            votos: {
                'a favor': votosData && votosData.dados ? votosData.dados.filter(v => v.tipoVoto === 'Sim').length : 0,
                'contra': votosData && votosData.dados ? votosData.dados.filter(v => v.tipoVoto === 'Não').length : 0,
                'abstencao': votosData && votosData.dados ? votosData.dados.filter(v => v.tipoVoto === 'Abstenção').length : 0
            },
            votosIndividuais: votosData && votosData.dados ? votosData.dados.map(v => ({
                deputadoId: v.deputado_id,
                nome: v.deputado_nome,
                partido: v.deputado_siglaPartido,
                voto: this.traduzirVoto(v.tipoVoto)
            })) : []
        };
    }

    // Buscar proposições recentes
    async getProposicoesRecentes(limit = 10) {
        const data = await this.fetchData('camara', '/proposicoes', {
            ordem: 'DESC',
            ordenarPor: 'id',
            itens: limit
        });

        if (!data || !data.dados) return [];

        return data.dados.map(prop => ({
            id: prop.id,
            tipo: prop.siglaTipo,
            numero: prop.numero,
            ano: prop.ano,
            ementa: prop.ementa,
            autor: prop.deputados && prop.deputados[0] ? prop.deputados[0].nome : 'Autor não identificado',
            partido: prop.deputados && prop.deputados[0] ? prop.deputados[0].siglaPartido : '',
            situacao: prop.descricaoSituacao,
            dataApresentacao: prop.dataApresentacao
        }));
    }

    // Buscar histórico de votos de um deputado
    async getHistoricoVotosDeputado(idDeputado, limit = 50) {
        const data = await this.fetchData('camara', `/deputados/${idDeputado}/votos`, {
            ordem: 'DESC',
            ordenarPor: 'dataHoraRegistro',
            itens: limit
        });

        if (!data || !data.dados) return [];

        return data.dados.map(voto => ({
            idVotacao: voto.idVotacao,
            materia: voto.siglaOrgao || 'Votação',
            descricao: voto.descricaoVotacao || 'Descrição não disponível',
            data: voto.dataHoraRegistro,
            voto: this.traduzirVoto(voto.tipoVoto),
            importancia: this.classificarImportancia(voto.siglaOrgao)
        }));
    }

    // Métodos auxiliares
    classificarIdeologia(partido) {
        const ideologias = {
            'PT': 'Centro-esquerda',
            'PSOL': 'Esquerda',
            'PDT': 'Centro-esquerda',
            'PSDB': 'Centro-direita',
            'MDB': 'Centro',
            'PL': 'Direita',
            'PP': 'Direita',
            'PSD': 'Centro-direita',
            'REDE': 'Centro-esquerda',
            'CIDADANIA': 'Centro',
            'PV': 'Centro-esquerda',
            'PODE': 'Centro-direita',
            'REPUBLICANOS': 'Direita',
            'PSC': 'Direita',
            'AVANTE': 'Centro',
            'PATRIOTA': 'Direita',
            'PROS': 'Centro-esquerda',
            'SOLIDARIEDADE': 'Centro-direita',
            'NOVO': 'Direita',
            'PCDOB': 'Esquerda'
        };
        
        return ideologias[partido] || 'Centro';
    }

    classificarImportancia(orgao) {
        const orgaosImportantes = ['PLEN', 'CCJC', 'CFT', 'CAE', 'CCJ'];
        return orgaosImportantes.includes(orgao) ? 'Alta' : 'Média';
    }

    traduzirVoto(voto) {
        const traducao = {
            'Sim': 'A favor',
            'Não': 'Contra',
            'Abstenção': 'Abstenção',
            'Sim, com ressalva': 'A favor',
            'Não, com ressalva': 'Contra',
            'Obstrução': 'Contra'
        };
        
        return traducao[voto] || voto;
    }

    // Método para buscar todos os dados necessários
    async carregarDadosCompletos() {
        console.log('Carregando dados dos parlamentares...');
        
        try {
            // Buscar deputados e senadores em paralelo
            const [deputados, senadores] = await Promise.all([
                this.getDeputadosAtuais(),
                this.getSenadoresAtuais()
            ]);

            console.log(`Encontrados ${deputados.length} deputados e ${senadores.length} senadores`);

            // Buscar votações
            console.log('Carregando votações...');
            const votacoes = await this.getVotacoesCamara(15);

            // Buscar proposições
            console.log('Carregando proposições...');
            const proposicoes = await this.getProposicoesRecentes(10);

            return {
                parlamentares: [...deputados, ...senadores],
                votacoes,
                proposicoes,
                ultimaAtualizacao: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            return null;
        }
    }

    // Método para atualizar dados periodicamente
    async atualizarDados() {
        console.log('Atualizando dados...');
        const dados = await this.carregarDadosCompletos();
        
        if (dados) {
            // Emitir evento de atualização
            window.dispatchEvent(new CustomEvent('dadosAtualizados', {
                detail: dados
            }));
            
            // Salvar no localStorage
            localStorage.setItem('dadosPoliticos', JSON.stringify(dados));
            localStorage.setItem('ultimaAtualizacao', dados.ultimaAtualizacao);
            
            console.log('Dados atualizados com sucesso!');
            return dados;
        }
        
        return null;
    }
}

// Sistema de atualização automática
class DataUpdater {
    constructor(api) {
        this.api = api;
        this.updateInterval = 30 * 60 * 1000; // 30 minutos
        this.isUpdating = false;
    }

    start() {
        console.log('Iniciando atualização automática...');
        
        // Atualizar imediatamente
        this.update();
        
        // Configurar intervalo
        setInterval(() => {
            this.update();
        }, this.updateInterval);
    }

    async update() {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        
        try {
            const dados = await this.api.atualizarDados();
            
            if (dados) {
                // Atualizar interface
                this.atualizarInterface(dados);
            }
        } catch (error) {
            console.error('Erro na atualização:', error);
        } finally {
            this.isUpdating = false;
        }
    }

    atualizarInterface(dados) {
        // Atualizar contadores
        const totalParlamentares = document.getElementById('totalParlamentares');
        const totalVotacoes = document.getElementById('totalVotacoes');
        const ultimaAtualizacao = document.getElementById('ultimaAtualizacao');

        if (totalParlamentares) {
            totalParlamentares.textContent = dados.parlamentares.length;
        }
        
        if (totalVotacoes) {
            totalVotacoes.textContent = dados.votacoes.length;
        }
        
        if (ultimaAtualizacao) {
            ultimaAtualizacao.textContent = new Date(dados.ultimaAtualizacao).toLocaleString('pt-BR');
        }

        // Mostrar indicador de atualização
        this.mostrarIndicadorAtualizacao();
    }

    mostrarIndicadorAtualizacao() {
        // Criar ou atualizar indicador
        let indicador = document.getElementById('indicadorAtualizacao');
        
        if (!indicador) {
            indicador = document.createElement('div');
            indicador.id = 'indicadorAtualizacao';
            indicador.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity';
            indicador.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Dados atualizados!';
            document.body.appendChild(indicador);
        }
        
        indicador.style.opacity = '1';
        
        setTimeout(() => {
            indicador.style.opacity = '0';
        }, 3000);
    }
}

// Inicialização
let governmentAPI;
let dataUpdater;

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', async function() {
    governmentAPI = new GovernmentAPI();
    dataUpdater = new DataUpdater(governmentAPI);
    
    // Adicionar indicadores de carregamento
    adicionarIndicadoresCarregamento();
    
    // Event listener para atualização manual
    const btnAtualizar = document.getElementById('btnAtualizar');
    if (btnAtualizar) {
        btnAtualizar.addEventListener('click', () => {
            dataUpdater.update();
        });
    }
    
    // Iniciar atualização automática
    dataUpdater.start();
});

function adicionarIndicadoresCarregamento() {
    // Adicionar indicador de status de conexão
    const nav = document.querySelector('nav');
    if (nav) {
        const statusDiv = document.createElement('div');
        statusDiv.className = 'flex items-center space-x-2 text-sm';
        statusDiv.innerHTML = `
            <div class="flex items-center space-x-1">
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Dados Oficiais</span>
            </div>
            <button id="btnAtualizar" class="text-blue-600 hover:text-blue-800">
                <i class="fas fa-sync-alt"></i>
            </button>
        `;
        nav.querySelector('.hidden.md\\:block').appendChild(statusDiv);
    }
}

// Exportar para uso em outros módulos
window.GovernmentAPI = GovernmentAPI;
window.DataUpdater = DataUpdater;