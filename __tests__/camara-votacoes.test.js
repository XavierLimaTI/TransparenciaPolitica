const camara = require('../lib/adapters/camara');

test('camara adapter normalizes votacoes list', () => {
  const fake = { dados: [ { id: 10, siglaOrgao: 'PLEN', descricao: 'Votação de teste', dataHoraRegistro: '2025-01-01T12:00:00' } ] };
  const out = camara.normalizeVotacoesApiResponse(fake);
  expect(Array.isArray(out)).toBe(true);
  expect(out[0]).toMatchObject({ id: 10, materia: 'PLEN', descricao: 'Votação de teste' });
});
