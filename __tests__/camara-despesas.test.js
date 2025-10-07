const camara = require('../lib/adapters/camara');

test('camara adapter normalizes despesas list', () => {
  const fake = [ { dataDocumento: '2025-01-01', descricao: 'Compra', valor: '1.234,56', favorecido: 'Loja X', cpfCnpj: '12345678901' } ];
  const out = camara.normalizeDespesasApiResponse(fake);
  expect(Array.isArray(out)).toBe(true);
  expect(out[0]).toMatchObject({ descricao: 'Compra', favorecido: 'Loja X' });
  expect(out[0].valor).toBeGreaterThan(0);
});
