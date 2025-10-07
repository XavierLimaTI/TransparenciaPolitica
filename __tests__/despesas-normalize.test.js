const { GovernmentAPI } = require('../lib/government-api');

test('normalizeDespesaItem via CSV fallback produces consistent shape', () => {
  const api = new GovernmentAPI();
  const csv = 'data,descricao,valor,favorecido,cpf\n2024-01-01,Compra,1.234,Joao,12345678900';
  const parsed = api.loadDespesasFromCSV(csv);
  expect(Array.isArray(parsed)).toBe(true);
  expect(parsed[0]).toHaveProperty('valor');
  expect(typeof parsed[0].valor).toBe('number');
  expect(parsed[0]).toHaveProperty('favorecido', 'Joao');
});

test('getDespesasPorParlamentar uses local despesas when set', async () => {
  const api = new GovernmentAPI();
  api.useLocalDespesas([{ favorecido: 'X', valor: 100 }, { favorecido: 'Y', valor: 200 }]);
  const results = await api.getDespesasPorParlamentar({ nome: 'X' });
  expect(Array.isArray(results)).toBe(true);
  expect(results.length).toBeGreaterThanOrEqual(1);
  expect(results[0]).toHaveProperty('favorecido');
});
