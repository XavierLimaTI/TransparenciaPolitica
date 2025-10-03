// We require the api-integration.js in a way that avoids executing DOM handlers.
// The file registers GovernmentAPI on window in browser, but in node require it exports the class.
const maybeExport = require('../api-integration.js');
const GovernmentAPI = typeof maybeExport === 'function' ? maybeExport : (global && global.GovernmentAPI) || maybeExport.GovernmentAPI;

describe('GovernmentAPI local despesas fallback', () => {
  let api;
  beforeEach(() => {
    api = new GovernmentAPI();
  });

  test('useLocalDespesas and getDespesasPorParlamentar pagination', async () => {
    const sample = [];
    for (let i = 0; i < 25; i++) {
      sample.push({ favorecido: `Fornecedor ${i}`, cpfCnpj: `0000000000${i}`, valor: i * 10, dataDocumento: `2025-01-${(i%30)+1}` });
    }
    api.useLocalDespesas(sample);

    const page1 = await api.getDespesasPorParlamentar({ pagina: 1, itens: 10 });
    expect(Array.isArray(page1)).toBe(true);
    expect(page1.length).toBe(10);

    const page3 = await api.getDespesasPorParlamentar({ pagina: 3, itens: 10 });
    expect(page3.length).toBe(5);
  });

  test('filter by nome', async () => {
    const sample = [
      { favorecido: 'Acme Ltda', cpfCnpj: '111' },
      { favorecido: 'Beta SA', cpfCnpj: '222' },
      { favorecido: 'Acme Serviços', cpfCnpj: '333' }
    ];
    api.useLocalDespesas(sample);
    const res = await api.getDespesasPorParlamentar({ nome: 'acme' });
    expect(res.length).toBe(2);
  });
});
