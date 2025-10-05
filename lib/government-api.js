// GovernmentAPI module (Node + Browser compatible)
// Exporta GovernmentAPI e DataUpdater

const csvParser = (function() {
    try {
        if (typeof module !== 'undefined' && module.exports) return require('./csv-parser');
    } catch (e) {}
    return (typeof window !== 'undefined' && window.parseDespesasCSV) ? { parseDespesasCSV: window.parseDespesasCSV } : null;
})();

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

    setProxy(baseUrl) { this.proxyBase = baseUrl; }
    setPortalKey(key) { this.portalKey = key; }

    getCacheKey(endpoint, params) { return `${endpoint}_${JSON.stringify(params)}`; }
    setCache(key, data) { this.cache.set(key, { data, timestamp: Date.now() }); }
    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.timestamp > this.cacheTimeout) { this.cache.delete(key); return null; }
        return cached.data;
    }

    async fetchData(base, endpoint, params = {}) {
        const cacheKey = this.getCacheKey(endpoint, params);
        const cached = this.getCache(cacheKey);
        if (cached) { console.log(`Cache hit: ${cacheKey}`); return cached; }

        try {
            if (typeof window !== 'undefined' && typeof window.showGlobalSpinner === 'function') {
                try { window.showGlobalSpinner(`Carregando ${endpoint}...`); } catch (e) {}
            }
            const url = new URL(`${this.baseURLs[base]}${endpoint}`);
            Object.keys(params).forEach(key => { if (params[key]) url.searchParams.append(key, params[key]); });

            let fetchUrl = url.toString();
            if (typeof window !== 'undefined' && window.location && !this.proxyBase) {
                const host = window.location.hostname;
                if (host === 'localhost' || host === '127.0.0.1') {
                    try { fetchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(fetchUrl)}`; console.warn('Development CORS proxy active.'); } catch (e) { console.warn('Failed to enable dev CORS proxy:', e); }
                }
            }

            const response = await fetch(fetchUrl, { method: 'GET', headers: this.headers });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            this.setCache(cacheKey, data);
            if (typeof window !== 'undefined' && typeof window.hideGlobalSpinner === 'function') { try { window.hideGlobalSpinner(); } catch (e) {} }
            return data;
        } catch (error) {
            if (typeof window !== 'undefined' && typeof window.hideGlobalSpinner === 'function') { try { window.hideGlobalSpinner(); } catch (e) {} }
            console.error(`Error fetching ${endpoint}:`, error);
            return null;
        }
    }

    async fetchPortal(endpoint, params = {}) {
        let url;
        const headers = Object.assign({}, this.headers);

        if (this.proxyBase) {
            url = new URL(`${this.proxyBase}${endpoint}`);
        } else {
            if (!this.portalKey) { console.warn('Portal da Transparência API key not set.'); return { error: 'API_KEY_MISSING' }; }
            url = new URL(`https://api.portaldatransparencia.gov.br/api-de-dados${endpoint}`);
            headers['chave-api-dados'] = this.portalKey;
        }

        Object.keys(params).forEach(k => { if (params[k] !== undefined && params[k] !== null) url.searchParams.append(k, params[k]); });

        const maxAttempts = 3; let attempt = 0;
        while (attempt < maxAttempts) {
            attempt++;
            try {
                if (typeof window !== 'undefined' && typeof window.showGlobalSpinner === 'function') { try { window.showGlobalSpinner('Consultando Portal da Transparência...'); } catch (e) {} }
                const response = await fetch(url.toString(), { method: 'GET', headers });
                if (response.status === 429) {
                    const retryAfter = response.headers.get('Retry-After');
                    const wait = retryAfter ? parseInt(retryAfter, 10) * 1000 : (500 * attempt);
                    await new Promise(r => setTimeout(r, wait));
                    continue;
                }
                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`Portal API error ${response.status}: ${text}`);
                }
                const data = await response.json();
                if (typeof window !== 'undefined' && typeof window.hideGlobalSpinner === 'function') { try { window.hideGlobalSpinner(); } catch (e) {} }
                return data;
            } catch (err) {
                if (typeof window !== 'undefined' && typeof window.hideGlobalSpinner === 'function') { try { window.hideGlobalSpinner(); } catch (e) {} }
                console.error(`Portal fetch attempt ${attempt} error:`, err);
                if (attempt >= maxAttempts) return null;
                const backoff = 300 * Math.pow(2, attempt);
                await new Promise(r => setTimeout(r, backoff));
            }
        }
        return null;
    }

    async getDeputadosAtuais() {
        const data = await this.fetchData('camara', '/deputados', { ordem: 'ASC', ordenarPor: 'nome' });
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

    async getDeputado(id) {
        if (!id) return null;
        const data = await this.fetchData('camara', `/deputados/${id}`);
        if (!data || !data.dados) return null;
        const d = data.dados;
        return {
            id: d.id,
            nome: d.nomeCivil || (d.ultimoStatus && d.ultimoStatus.nome) || d.nome,
            partido: d.ultimoStatus ? d.ultimoStatus.siglaPartido : d.siglaPartido || '',
            estado: d.ultimoStatus ? d.ultimoStatus.siglaUf : d.siglaUf || '',
            foto: (d.ultimoStatus && d.ultimoStatus.urlFoto) || d.urlFoto || null,
            email: d.email || (d.ultimoStatus && d.ultimoStatus.email) || null,
            cpf: d.cpf || null,
            dataNascimento: d.dataNascimento || null,
            situacao: d.ultimoStatus ? d.ultimoStatus.escolaridade : null,
            raw: d
        };
    }

    async getDeputadosPage(page = 1, pageSize = 20) {
        const data = await this.fetchData('camara', '/deputados', { ordem: 'ASC', ordenarPor: 'nome', itens: pageSize, pagina: page });
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

    async searchDeputados(params = {}) {
        const { page = 1, pageSize = 20, nome, uf, partido, ordenarPor } = params;
        const query = { itens: pageSize, pagina: page };
        if (nome) query.nome = nome; if (uf) query.siglaUf = uf; if (partido) query.siglaPartido = partido; if (ordenarPor) query.ordenarPor = ordenarPor;
        try {
            const url = new URL(`${this.baseURLs.camara}/deputados`);
            Object.keys(query).forEach(k => { if (query[k] !== undefined && query[k] !== null) url.searchParams.append(k, query[k]); });
            const response = await fetch(url.toString(), { method: 'GET', headers: this.headers });
            if (!response.ok) return { results: [], meta: { page, pageSize, total: null, hasMore: false } };
            const data = await response.json();
            const results = (data && data.dados ? data.dados : []).map(deputado => ({
                id: deputado.id, nome: deputado.nome, partido: deputado.siglaPartido, estado: deputado.siglaUf, foto: deputado.urlFoto, email: deputado.email, cargo: 'Deputado Federal', ideologia: this.classificarIdeologia(deputado.siglaPartido), dataNascimento: deputado.dataNascimento, situacao: 'Exercício'
            }));
            const totalHeader = response.headers.get('X-Total-Count') || response.headers.get('x-total-count') || null;
            const total = totalHeader ? parseInt(totalHeader, 10) : null;
            const hasMore = results.length >= pageSize;
            return { results, meta: { page, pageSize, total, hasMore } };
        } catch (err) { console.error('searchDeputados error', err); return { results: [], meta: { page, pageSize, total: null, hasMore: false } }; }
    }

    async getSenadoresAtuais() {
        let data = await this.fetchData('senado', '/senador');
        if (!data || !data.ListaParlamentarEmExercicio) {
            try { data = await this.fetchData('senado', '/senador/listaParlamentarEmExercicio'); } catch (e) {}
        }
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

    async getVotacoesCamara(limit = 20) {
        const data = await this.fetchData('camara', '/votacoes', { ordem: 'DESC', ordenarPor: 'dataHoraRegistro', itens: limit });
        if (!data || !data.dados) return [];
        return data.dados.map(votacao => ({ id: votacao.id, materia: votacao.siglaOrgao || 'Votação', descricao: votacao.descricao || 'Descrição não disponível', data: votacao.dataHoraRegistro, resultado: votacao.aprovacao ? 'Aprovada' : 'Rejeitada', importancia: this.classificarImportancia(votacao.siglaOrgao), votos: { 'a favor': votacao.secoes && votacao.secoes[0] && votacao.secoes[0].totalVotosSimulacao || 0, 'contra': votacao.secoes && votacao.secoes[0] && votacao.secoes[0].totalVotosNaoSimulacao || 0, 'abstencao': votacao.secoes && votacao.secoes[0] && votacao.secoes[0].totalVotosAbstencaoSimulacao || 0 } }));
    }

    async getDetalhesVotacao(idVotacao) {
        const data = await this.fetchData('camara', `/votacoes/${idVotacao}`);
        if (!data || !data.dados) return null;
        const votacao = data.dados;
        const votosData = await this.fetchData('camara', `/votacoes/${idVotacao}/votos`);
        return {
            id: votacao.id,
            materia: votacao.siglaOrgao || 'Votação',
            descricao: votacao.descricao || 'Descrição não disponível',
            data: votacao.dataHoraRegistro,
            resultado: votacao.aprovacao ? 'Aprovada' : 'Rejeitada',
            importancia: this.classificarImportancia(votacao.siglaOrgao),
            votos: { 'a favor': votosData && votosData.dados ? votosData.dados.filter(v => v.tipoVoto === 'Sim').length : 0, 'contra': votosData && votosData.dados ? votosData.dados.filter(v => v.tipoVoto === 'Não').length : 0, 'abstencao': votosData && votosData.dados ? votosData.dados.filter(v => v.tipoVoto === 'Abstenção').length : 0 },
            votosIndividuais: votosData && votosData.dados ? votosData.dados.map(v => ({ deputadoId: v.deputado_id, nome: v.deputado_nome, partido: v.deputado_siglaPartido, voto: this.traduzirVoto(v.tipoVoto) })) : []
        };
    }

    async getProposicoesRecentes(limit = 10) {
        const data = await this.fetchData('camara', '/proposicoes', { ordem: 'DESC', ordenarPor: 'id', itens: limit });
        if (!data || !data.dados) return [];
        return data.dados.map(prop => ({ id: prop.id, tipo: prop.siglaTipo, numero: prop.numero, ano: prop.ano, ementa: prop.ementa, autor: prop.deputados && prop.deputados[0] ? prop.deputados[0].nome : 'Autor não identificado', partido: prop.deputados && prop.deputados[0] ? prop.deputados[0].siglaPartido : '', situacao: prop.descricaoSituacao, dataApresentacao: prop.dataApresentacao }));
    }

    async getHistoricoVotosDeputado(idDeputado, limit = 50) {
        const data = await this.fetchData('camara', `/deputados/${idDeputado}/votos`, { ordem: 'DESC', ordenarPor: 'dataHoraRegistro', itens: limit });
        if (!data || !data.dados) return [];
        return data.dados.map(voto => ({ idVotacao: voto.idVotacao, materia: voto.siglaOrgao || 'Votação', descricao: voto.descricaoVotacao || 'Descrição não disponível', data: voto.dataHoraRegistro, voto: this.traduzirVoto(voto.tipoVoto), importancia: this.classificarImportancia(voto.siglaOrgao) }));
    }

    async getDespesasPorParlamentar(params = {}) {
        if (this._localDespesas && Array.isArray(this._localDespesas) && this._localDespesas.length > 0) {
            let results = this._localDespesas;
            if (params.cpf) {
                const cpfNorm = String(params.cpf).replace(/\D/g, '');
                results = results.filter(d => (d.cnpjCpf || '').toString().replace(/\D/g, '').includes(cpfNorm));
            } else if (params.nome) {
                const nomeLower = String(params.nome).toLowerCase();
                results = results.filter(d => (d.favorecido || d.descricao || '').toString().toLowerCase().includes(nomeLower));
            }
            const pagina = Math.max(1, parseInt(params.pagina || params.page || 1, 10));
            const itens = Math.max(1, parseInt(params.itens || params.pageSize || 10, 10));
            const start = (pagina - 1) * itens;
            const pageItems = results.slice(start, start + itens);
            return pageItems;
        }
        const query = {};
        if (params.cpf) query.cpf = params.cpf;
        if (params.nome) query.nome = params.nome;
        if (params.pagina) query.pagina = params.pagina;
        if (params.itens) query.itens = params.itens;
        if (params.ano) query.ano = params.ano;
        if (params.mes) query.mes = params.mes;
        const data = await this.fetchPortal('/despesas', query);
        if (!data) return null; if (data.error === 'API_KEY_MISSING') return { error: 'API_KEY_MISSING' };
        let items = [];
        if (Array.isArray(data)) items = data; else if (data.lista) items = data.lista; else if (data.dados) items = data.dados; else if (data.length) items = data; else items = [data];
        const normalized = items.map(it => ({ dataDocumento: it.dataDocumento || it.data || it.dataEmissao || null, descricao: it.descricao || it.historico || it.tipo || '', valor: it.valor || it.valorDocumento || it.valorPagamento || 0, favorecido: it.favorecido || it.nomeFavorecido || it.nome || '', cnpjCpf: it.cpfCnpj || it.cpf || it.cnpj || null, origem: it.orgao || it.unidade || null, detalhe: it }));
        return normalized;
    }

    loadDespesasFromCSV(text) {
        try {
            if (typeof module !== 'undefined' && module.exports) {
                try { const parser = require('../lib/csv-parser'); if (parser && typeof parser.parseDespesasCSV === 'function') return parser.parseDespesasCSV(text); } catch (e) {}
            }
            if (typeof window !== 'undefined' && window.parseDespesasCSV) return window.parseDespesasCSV(text);
        } catch (err) {}
        if (!text) return [];
        if (csvParser && typeof csvParser.parseDespesasCSV === 'function') return csvParser.parseDespesasCSV(text);
        // fallback simple parser
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return [];
        const headerLine = lines[0];
        const delimiter = headerLine.indexOf(';') !== -1 ? ';' : (headerLine.indexOf(',') !== -1 ? ',' : '\t');
        function splitLine(line) { const parts = []; let cur = ''; let inQuotes = false; for (let i=0;i<line.length;i++){const ch=line[i]; if (ch==='"'){ if (inQuotes && line[i+1]==='"') { cur+='"'; i++; continue; } inQuotes=!inQuotes; continue;} if (!inQuotes && ch===delimiter) { parts.push(cur.trim()); cur=''; continue;} cur+=ch;} parts.push(cur.trim()); return parts; }
        const header = headerLine.split(delimiter).map(h=>h.trim().toLowerCase());
        const rows = lines.slice(1).map(line=>{ const parts=splitLine(line); const obj={}; for(let i=0;i<header.length;i++) obj[header[i]] = parts[i] || ''; return obj; });
        const normalized = rows.map(r=>({ dataDocumento: r.data || r.datadoc || r.data_documento || null, descricao: r.descricao || r.historico || r.tipo || '', valor: Number(String(r.valor || r.valor_documento || r.valor_pagamento || '0').replace(/\./g,'').replace(/,/g,'.').replace(/[^0-9\-\.]/g,''))||0, favorecido: r.favorecido || r.nome || r.nome_favorecido || r.fornecedor || '', cnpjCpf: r.cpf || r.cnpj || r.cpfcnpj || null, origem: r.orgao || r.unidade || null, detalhe: r }));
        return normalized;
    }

    useLocalDespesas(despesasArray) {
        this._localDespesas = Array.isArray(despesasArray) ? despesasArray : [];
        // Emit event for browser environments
        try {
            if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(new CustomEvent('localDespesasUsed', { detail: { count: this._localDespesas.length } }));
            }
        } catch (e) {}
        // Also support Node test harnesses that may simulate global event listeners
        try {
            if (typeof global !== 'undefined') {
                if (typeof global.dispatchEvent === 'function') {
                    global.dispatchEvent({ type: 'localDespesasUsed', detail: { count: this._localDespesas.length } });
                } else if (global._events && Array.isArray(global._events['localDespesasUsed'])) {
                    (global._events['localDespesasUsed'] || []).forEach(fn => { try { fn({ type: 'localDespesasUsed', detail: { count: this._localDespesas.length } }); } catch(_){} });
                }
            }
        } catch (e) {}
    }

    classificarIdeologia(partido) { const ideologias = { 'PT':'Centro-esquerda','PSOL':'Esquerda','PDT':'Centro-esquerda','PSDB':'Centro-direita','MDB':'Centro','PL':'Direita','PP':'Direita','PSD':'Centro-direita','REDE':'Centro-esquerda','CIDADANIA':'Centro','PV':'Centro-esquerda','PODE':'Centro-direita','REPUBLICANOS':'Direita','PSC':'Direita','AVANTE':'Centro','PATRIOTA':'Direita','PROS':'Centro-esquerda','SOLIDARIEDADE':'Centro-direita','NOVO':'Direita','PCDOB':'Esquerda' }; return ideologias[partido] || 'Centro'; }

    classificarImportancia(orgao) { const orgaosImportantes = ['PLEN','CCJC','CFT','CAE','CCJ']; return orgaosImportantes.includes(orgao) ? 'Alta' : 'Média'; }
    traduzirVoto(voto) { const traducao = { 'Sim':'A favor','Não':'Contra','Abstenção':'Abstenção','Sim, com ressalva':'A favor','Não, com ressalva':'Contra','Obstrução':'Contra' }; return traducao[voto] || voto; }

    async carregarDadosCompletos() {
        try {
            const [deputados, senadores] = await Promise.all([ this.getDeputadosAtuais(), this.getSenadoresAtuais() ]);
            const votacoes = await this.getVotacoesCamara(15);
            const proposicoes = await this.getProposicoesRecentes(10);
            return { parlamentares: [...deputados, ...senadores], votacoes, proposicoes, ultimaAtualizacao: new Date().toISOString() };
        } catch (error) { console.error('Erro ao carregar dados:', error); return null; }
    }

    async atualizarDados() {
        console.log('Carregando dados dos parlamentares...');
        const dados = await this.carregarDadosCompletos();
        if (dados) {
            try { if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') window.dispatchEvent(new CustomEvent('dadosAtualizados', { detail: dados })); } catch (e) { console.warn('Não foi possível emitir evento dadosAtualizados:', e); }
            try { if (typeof localStorage !== 'undefined') { localStorage.setItem('dadosPoliticos', JSON.stringify(dados)); if (dados.ultimaAtualizacao) localStorage.setItem('ultimaAtualizacao', dados.ultimaAtualizacao); } } catch (e) { console.warn('Falha ao salvar dados em localStorage:', e); }
            console.log('Dados atualizados com sucesso!');
            return dados;
        }
        return null;
    }
}

class DataUpdater {
    constructor(api) { this.api = api; this.updateInterval = 30 * 60 * 1000; this.isUpdating = false; }
    start() { this.update(); setInterval(()=>this.update(), this.updateInterval); }
    async update() { if (this.isUpdating) return; this.isUpdating = true; try { const dados = await this.api.atualizarDados(); if (dados) this.atualizarInterface(dados); } catch (e) { console.error('Erro na atualização:', e); } finally { this.isUpdating = false; } }
    atualizarInterface(dados) {
        const totalParlamentares = document.getElementById('totalParlamentares'); const totalVotacoes = document.getElementById('totalVotacoes'); const ultimaAtualizacao = document.getElementById('ultimaAtualizacao');
        if (totalParlamentares) totalParlamentares.textContent = dados.parlamentares.length;
        if (totalVotacoes) totalVotacoes.textContent = dados.votacoes.length;
        if (ultimaAtualizacao) ultimaAtualizacao.textContent = new Date(dados.ultimaAtualizacao).toLocaleString('pt-BR');
        this.mostrarIndicadorAtualizacao();
    }
    mostrarIndicadorAtualizacao() {
        let indicador = document.getElementById('indicadorAtualizacao');
        if (!indicador) { indicador = document.createElement('div'); indicador.id = 'indicadorAtualizacao'; indicador.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity'; indicador.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Dados atualizados!'; document.body.appendChild(indicador); }
        indicador.style.opacity = '1'; setTimeout(()=>{ indicador.style.opacity='0'; }, 3000);
    }
}

// Exports
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GovernmentAPI, DataUpdater };
}

if (typeof window !== 'undefined') {
    window.GovernmentAPI = GovernmentAPI;
    window.DataUpdater = DataUpdater;
}
