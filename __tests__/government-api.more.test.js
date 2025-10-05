const { GovernmentAPI } = require('../lib/government-api');

describe('GovernmentAPI additional unit tests', () => {
  beforeEach(() => {
    // Ensure window host is not localhost so fetchData doesn't enable dev CORS proxy
    global.window = { location: { hostname: 'example.com' } };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
    delete global.window;
  });

  test('getDeputadosAtuais maps response to simplified objects', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ dados: [{ id: 10, nome: 'Fulano', siglaPartido: 'PT', siglaUf: 'SP', urlFoto: 'http://x', email: 'a@b', dataNascimento: '1990-01-01' }] }) });
    const api = new GovernmentAPI();
    const res = await api.getDeputadosAtuais();
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].id).toBe(10);
    expect(res[0].cargo).toBe('Deputado Federal');
  });

  test('getDeputado returns detailed object or null if not found', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ dados: { id: 5, nomeCivil: 'Joao', urlFoto: 'http://f', email: 'e' } } ) });
    const api = new GovernmentAPI();
    const d = await api.getDeputado(5);
    expect(d).toBeTruthy();
    expect(d.nome).toBe('Joao');

    const d2 = await api.getDeputado(null);
    expect(d2).toBeNull();
  });

  test('getSenadoresAtuais tries fallback route when first response missing', async () => {
    const api = new GovernmentAPI();
    // mock fetchData directly: first call (senador) returns empty, second returns the list
    const calls = [];
    api.fetchData = jest.fn().mockImplementation(async (base, endpoint) => {
      calls.push(endpoint);
      if (endpoint.includes('listaParlamentarEmExercicio')) {
        return { ListaParlamentarEmExercicio: { Parlamentares: { Parlamentar: [ { IdentificacaoParlamentar: { CodigoParlamentar: 1, NomeParlamentar: 'Senador X', SiglaPartidoParlamentar: 'ABC', UfParlamentar: 'RJ', UrlFotoParlamentar: '', EmailParlamentar: '' , DataNascimentoParlamentar: '1970-01-01' } } ] } } };
      }
      return {};
    });
    const sen = await api.getSenadoresAtuais();
    expect(Array.isArray(sen)).toBe(true);
    expect(sen[0].nome).toContain('Senador X');
  });

  test('getVotacoesCamara returns mapped votacoes', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ dados: [ { id: 99, siglaOrgao: 'PLEN', descricao: 'Teste', dataHoraRegistro: '2025-01-01', aprovacao: true, secoes: [ { totalVotosSimulacao: 10, totalVotosNaoSimulacao: 2, totalVotosAbstencaoSimulacao: 1 } ] } ] }) });
    const api = new GovernmentAPI();
    const vs = await api.getVotacoesCamara(1);
    expect(Array.isArray(vs)).toBe(true);
    expect(vs[0].resultado).toBe('Aprovada');
    expect(vs[0].votos['a favor']).toBe(10);
  });

  test('getDetalhesVotacao aggregates votos individuais', async () => {
    // mock two fetch calls: first for votacao details, second for votos list
    const api = new GovernmentAPI();
    api.fetchData = jest.fn().mockImplementation(async (base, endpoint) => {
      if (String(endpoint).includes('/votacoes/') && !String(endpoint).includes('/votos')) {
        return { dados: { id: 123, siglaOrgao: 'PLEN', descricao: 'D', dataHoraRegistro: '2025-01-01', aprovacao: true } };
      }
      if (String(endpoint).includes('/votos')) {
        return { dados: [ { tipoVoto: 'Sim', deputado_id: 1, deputado_nome: 'A', deputado_siglaPartido: 'PT' }, { tipoVoto: 'Não', deputado_id: 2, deputado_nome: 'B', deputado_siglaPartido: 'PSDB' } ] };
      }
      return null;
    });
    const det = await api.getDetalhesVotacao(123);
    expect(det).toBeTruthy();
    expect(Array.isArray(det.votosIndividuais)).toBe(true);
    expect(det.votosIndividuais.length).toBe(2);
  });

  test('getDespesasPorParlamentar normalizes portal response formats', async () => {
    // simulate portal returning object with lista
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ lista: [ { data: '2025-01-02', descricao: 'Compra', valor: 100, favorecido: 'X' } ] }) });
    const api = new GovernmentAPI();
    api.setPortalKey('FAKE');
    const res = await api.getDespesasPorParlamentar({ nome: 'X' });
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].favorecido).toBe('X');
  });

  test('fetchData caches responses to avoid duplicate fetches', async () => {
    let calls = 0;
    global.fetch = jest.fn().mockImplementation(async () => { calls++; return { ok: true, json: async () => ({ dados: [] }) }; });
    const api = new GovernmentAPI();
    const a1 = await api.fetchData('camara', '/deputados', { itens: 10 });
    const a2 = await api.fetchData('camara', '/deputados', { itens: 10 });
    expect(calls).toBe(1);
    expect(a1).toEqual(a2);
  });

  test('fetchPortal with proxyBase uses proxy url', async () => {
    let seenUrl = null;
    global.fetch = jest.fn().mockImplementation(async (u) => { seenUrl = String(u); return { ok: true, json: async ()=> ({ dados: [] }) }; });
    const api = new GovernmentAPI();
    api.setProxy('http://localhost:3001');
    const data = await api.fetchPortal('/despesas', {});
    expect(seenUrl).toContain('http://localhost:3001/despesas');
    expect(data).toBeDefined();
  });
});
