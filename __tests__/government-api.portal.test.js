const { GovernmentAPI } = require('../lib/government-api');

describe('GovernmentAPI portal and fallback tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  test('fetchPortal returns API_KEY_MISSING when portal key not set and no proxy', async () => {
    const api = new GovernmentAPI();
    // ensure no portal key and no proxy
    api.portalKey = undefined; api.proxyBase = undefined;
    const res = await api.fetchPortal('/despesas', {});
    expect(res).toBeDefined();
    expect(res.error).toBe('API_KEY_MISSING');
  });

  test('fetchPortal returns null on repeated fetch failures', async () => {
    let calls = 0;
    global.fetch = jest.fn().mockImplementation(async () => { calls++; throw new Error('network fail'); });
    const api = new GovernmentAPI(); api.setPortalKey('FAKE');
    const res = await api.fetchPortal('/despesas', {});
    expect(res).toBeNull();
    expect(calls).toBeGreaterThanOrEqual(3);
  });

  test('loadDespesasFromCSV parses simple CSV fallback', () => {
    const api = new GovernmentAPI();
    const csv = 'data,descricao,valor,favorecido\n2025-01-01,Compra,123.45,Fornecedor X\n2025-01-02,Serviço,67,Outro';
    const parsed = api.loadDespesasFromCSV(csv);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
    expect(parsed[0].favorecido).toContain('Fornecedor X');
  });
});
