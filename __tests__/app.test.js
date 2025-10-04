/**
 * Tests for PoliticaApp.fetchServerPage behavior using a mocked governmentAPI
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load main.js into a sandbox to extract PoliticaApp
function loadMainWithMocks(mocks = {}) {
  const code = fs.readFileSync(path.resolve(__dirname, '..', 'main.js'), 'utf8');
  // Provide a minimal document mock with the methods main.js expects
  const minimalDocument = {
    addEventListener: () => {},
    querySelector: () => ({ appendChild: () => {} }),
    querySelectorAll: () => ({ forEach: () => {} }),
    getElementById: (id) => ({
      id,
      textContent: '',
      addEventListener: () => {},
      appendChild: () => {},
      innerHTML: '',
      style: {},
      dataset: {}
    }),
    createElement: (tag) => ({
      tagName: tag,
      className: '',
      style: {},
      appendChild: () => {},
      addEventListener: () => {},
      setAttribute: () => {},
      getAttribute: () => null,
      innerHTML: '',
      textContent: '',
      disabled: false
    }),
    body: { appendChild: () => {} }
  };

  const sandbox = Object.assign({ window: {}, document: minimalDocument, console, localStorage: { getItem: () => null, setItem: () => null }, module: {} }, mocks);
  // Provide IntersectionObserver and URL to sandbox
  sandbox.IntersectionObserver = class {
    constructor(cb, opts) { this.cb = cb; }
    observe() {}
    disconnect() {}
  };
  sandbox.URL = URL;
  vm.createContext(sandbox);
  vm.runInContext(code + '\nmodule.exports = PoliticaApp;', sandbox);
  return sandbox.module.exports;
}

describe('PoliticaApp.fetchServerPage', () => {
  test('fetchServerPage integrates results into candidatos and sets meta', async () => {
    // mock governmentAPI to return {results, meta}
    const fakeGov = {
      searchDeputados: jest.fn().mockResolvedValue({ results: [ { id: 101, nome: 'Fulano', partido: 'PT', estado: 'SP', foto: '', cargo: 'Deputado Federal', ideologia: 'Centro', votacoes: [], projetos: [] } ], meta: { page: 1, pageSize: 10, total: 1, hasMore: false } })
    };

  const PoliticaApp = loadMainWithMocks({ window: { governmentAPI: fakeGov }, module: {} });

    const app = new PoliticaApp();
    const resp = await app.fetchServerPage({}, 1, 10);
    expect(resp).toBeDefined();
    expect(resp.results.length).toBe(1);
    expect(app.candidatosFiltrados.length).toBeGreaterThan(0);
  });
});
