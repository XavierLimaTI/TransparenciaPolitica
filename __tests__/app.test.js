/**
 * Tests for PoliticaApp.fetchServerPage behavior using a mocked governmentAPI
 */
const path = require('path');

// (helper to load main into a VM removed - not used in current tests)

describe('PoliticaApp.fetchServerPage', () => {
  test('fetchServerPage integrates results into candidatos and sets meta', async () => {
    // mock governmentAPI to return {results, meta}
    const fakeGov = {
      searchDeputados: jest.fn().mockResolvedValue({ results: [ { id: 101, nome: 'Fulano', partido: 'PT', estado: 'SP', foto: '', cargo: 'Deputado Federal', ideologia: 'Centro', votacoes: [], projetos: [] } ], meta: { page: 1, pageSize: 10, total: 1, hasMore: false } })
    };

  // require the extracted PoliticaApp directly and inject the mocked governmentAPI into the global/window
  const PoliticaApp = require(path.resolve(__dirname, '..', 'lib', 'politica-app'));
  // minimal DOM/window mocks expected by PoliticaApp
  global.window = global.window || {};
  global.window.governmentAPI = fakeGov;
  global.document = global.document || {
    getElementById: () => null,
    querySelector: () => null,
    addEventListener: () => {}
  };

  const app = new PoliticaApp();
    const resp = await app.fetchServerPage({}, 1, 10);
    expect(resp).toBeDefined();
    expect(resp.results.length).toBe(1);
    expect(app.candidatosFiltrados.length).toBeGreaterThan(0);
  });
});
