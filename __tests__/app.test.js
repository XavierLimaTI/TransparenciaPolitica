/**
 * Tests for PoliticaApp.fetchServerPage behavior using a mocked governmentAPI
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load main.js into a sandbox to extract PoliticaApp
function loadMainWithMocks(mocks = {}) {
  const code = fs.readFileSync(path.resolve(__dirname, '..', 'main.js'), 'utf8');
  // do not require modules from Node directly; load them into the VM so they bind to sandbox.window
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

  const sandbox = Object.assign({ window: {}, document: minimalDocument, console, localStorage: { getItem: () => null, setItem: () => null }, module: { exports: {} } }, mocks);
  // normalize module to always have exports (caller may pass module: {} in mocks)
  sandbox.module = sandbox.module || {};
  if (!Object.prototype.hasOwnProperty.call(sandbox.module, 'exports')) sandbox.module.exports = {};
  // provide a shim for require that executes files in the VM context and supports recursion
  sandbox.require = function(relPath) {
    const abs = path.resolve(__dirname, '..', relPath);
    // simple cache to avoid re-evaluating same module repeatedly
    sandbox.__moduleCache = sandbox.__moduleCache || {};
    if (sandbox.__moduleCache[abs]) return sandbox.__moduleCache[abs].exports;

    const code = fs.readFileSync(abs, 'utf8');
    // prepare a module wrapper and module object specific to this file
    const moduleObj = { exports: {} };
    sandbox.module = moduleObj;
    sandbox.exports = moduleObj.exports;
    // prepare a per-file require resolver so relative requires resolve against the module's folder
    const moduleDir = path.dirname(abs);
    sandbox.__requireForFile = function(reqPath) {
      if (!reqPath) return require(reqPath);
      if (reqPath.startsWith('.') || reqPath.startsWith('..')) {
        const resolved = path.resolve(moduleDir, reqPath);
        return sandbox.require(resolved);
      }
      // non-relative: fall back to Node's require
      return require(reqPath);
    };
    // run the module code wrapped so it receives __requireForFile as require, and module, exports
    const wrapper = `(function(require,module,exports){\n${code}\n})(__requireForFile,module,exports);`;
    try {
      vm.runInContext(wrapper, sandbox);
    } catch (e) {
      // fallback to Node require if running in VM fails
      return require(abs);
    }
    sandbox.__moduleCache[abs] = moduleObj;
    return moduleObj.exports;
  };
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
