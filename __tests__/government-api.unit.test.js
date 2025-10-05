const { GovernmentAPI } = require('../lib/government-api');

describe('GovernmentAPI unit tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  test('searchDeputados returns results and meta', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ dados: [{ id: 1, nome: 'Teste', siglaPartido: 'PT', siglaUf: 'SP', urlFoto: '' }] }),
      headers: { get: () => '1' }
    });

    const api = new GovernmentAPI();
    const resp = await api.searchDeputados({ page: 1, pageSize: 10 });
    expect(resp).toBeDefined();
    expect(Array.isArray(resp.results)).toBe(true);
    expect(resp.results.length).toBe(1);
    expect(resp.meta).toBeDefined();
    expect(resp.meta.page).toBe(1);
  });

  test('fetchPortal retries on 429 and eventually returns data', async () => {
    let calls = 0;
    global.fetch = jest.fn().mockImplementation(async () => {
      calls += 1;
      if (calls === 1) return { status: 429, headers: { get: () => null }, ok: false, text: async () => 'rate limited' };
      return { status: 200, ok: true, json: async () => ({ dados: [] }), headers: { get: () => null } };
    });

    const api = new GovernmentAPI();
    api.setPortalKey('FAKEKEY');
    const data = await api.fetchPortal('/despesas', {});
    expect(data).toBeDefined();
    expect(Array.isArray(data.dados) || Array.isArray(data)).toBe(true);
    expect(calls).toBeGreaterThanOrEqual(2);
  });

  test('getDespesasPorParlamentar returns paginated results from local despesas', async () => {
    const api = new GovernmentAPI();
    const sample = [];
    for (let i = 0; i < 25; i++) sample.push({ favorecido: `Fornecedor ${i}`, cnpjCpf: `0000000000${i}`, valor: i * 10, dataDocumento: `2025-01-${(i%30)+1}` });
    api.useLocalDespesas(sample);

    const page1 = await api.getDespesasPorParlamentar({ pagina: 1, itens: 10 });
    expect(Array.isArray(page1)).toBe(true);
    expect(page1.length).toBe(10);

    const page3 = await api.getDespesasPorParlamentar({ pagina: 3, itens: 10 });
    expect(page3.length).toBe(5);
  });
});
