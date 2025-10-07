const camara = require('../lib/adapters/camara');

test('camara adapter normalizes deputado list', () => {
  const fake = { dados: [ { id: 1, nome: 'Fulano', siglaPartido: 'PT', siglaUf: 'SP' } ] };
  const out = camara.normalizeDeputadosApiResponse(fake);
  expect(Array.isArray(out)).toBe(true);
  expect(out[0]).toMatchObject({ id: 1, nome: 'Fulano', partido: 'PT', estado: 'SP' });
});
