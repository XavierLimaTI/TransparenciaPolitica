const fs = require('fs');
const path = require('path');

// Load the GovernmentAPI class from source (evaluate in node context)
const vm = require('vm');

describe('GovernmentAPI.searchDeputados', () => {

  beforeAll(() => {
    const code = fs.readFileSync(path.resolve(__dirname, '..', 'api-integration.js'), 'utf8');
    const sandbox = { module: {}, console, fetch: undefined, window: {},
      // Provide URL and a fuller document mock for VM
      URL: URL,
      document: {
        addEventListener: () => {},
        querySelector: () => ({ appendChild: () => {} }),
        querySelectorAll: () => [],
        getElementById: () => ({ addEventListener: () => {}, value: '', textContent: '' }),
        createElement: (tag) => ({ tagName: tag, style: {}, appendChild: () => {}, addEventListener: () => {} }),
        body: { appendChild: () => {} }
      }
    };
    vm.createContext(sandbox);
    // Provide a fake fetch which will be replaced per test
    sandbox.fetch = async () => ({ ok: true, json: async () => ({ dados: [] }), headers: { get: () => null } });
    vm.runInContext(code + '\nmodule.exports = GovernmentAPI;', sandbox);
  // module exported to sandbox.module.exports for tests that re-evaluate later
  });

  test('returns results and meta shape when remote responds', async () => {
    // mock fetch to return a fake payload and headers
    const mockData = { dados: [ { id: 1, nome: 'Teste', siglaPartido: 'PT', siglaUf: 'SP', urlFoto: '' } ] };

    const sandbox = { module: {}, console, fetch: undefined, window: {}, URL: URL,
      document: { addEventListener: () => {}, querySelector: () => ({ appendChild: () => {} }), querySelectorAll: () => [], getElementById: () => ({ addEventListener: () => {}, value: '', textContent: '' }), createElement: () => ({ appendChild: () => {} }), body: { appendChild: () => {} } }
    };
    sandbox.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mockData, headers: { get: () => '1' } });
    vm.createContext(sandbox);
    // re-evaluate class with mocked fetch
    const code = fs.readFileSync(path.resolve(__dirname, '..', 'api-integration.js'), 'utf8');
    vm.runInContext(code + '\nmodule.exports = GovernmentAPI;', sandbox);
  const GovernmentAPI2 = sandbox.module.exports;

    const api = new GovernmentAPI2();
    const resp = await api.searchDeputados({ page: 1, pageSize: 10 });
    expect(resp).toBeDefined();
    expect(Array.isArray(resp.results)).toBe(true);
    expect(resp.results.length).toBe(1);
    expect(resp.meta).toBeDefined();
    expect(resp.meta.page).toBe(1);
  });
});
