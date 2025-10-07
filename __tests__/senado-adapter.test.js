const senado = require('../lib/adapters/senado');

test('senado adapter normalizes senador list', () => {
  const fake = { ListaParlamentarEmExercicio: { Parlamentares: { Parlamentar: [ { IdentificacaoParlamentar: { CodigoParlamentar: 5, NomeParlamentar: 'Beltrano', SiglaPartidoParlamentar: 'MDB', UfParlamentar: 'RJ' } } ] } } };
  const out = senado.normalizeSenadoresApiResponse(fake);
  expect(Array.isArray(out)).toBe(true);
  expect(out[0]).toMatchObject({ id: 5, nome: 'Beltrano', partido: 'MDB', estado: 'RJ' });
});
