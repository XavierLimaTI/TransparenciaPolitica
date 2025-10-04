const fs = require('fs');
const path = require('path');
const vm = require('vm');

describe('loadDespesasFromCSV', () => {
  let loadFn;
  beforeAll(() => {
    const code = fs.readFileSync(path.resolve(__dirname, '..', 'api-integration.js'), 'utf8');
    const sandbox = { module: {}, console, window: {}, document: { addEventListener: () => {} }, fetch: async () => ({ ok: true, json: async () => ({}) }) };
    vm.createContext(sandbox);
    vm.runInContext(code + '\nmodule.exports = { loadDespesasFromCSV: GovernmentAPI.prototype.loadDespesasFromCSV };', sandbox);
    loadFn = sandbox.module.exports.loadDespesasFromCSV;
  });

  test('parses a small CSV with semicolons', () => {
    const csv = `data;descricao;valor;favorecido;cpf\n2024-01-01;Compra de materiais;1234,56;Fulano;12345678900`;
    const rows = loadFn(csv);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBe(1);
    expect(rows[0].favorecido).toContain('Fulano');
    expect(rows[0].valor).toBeCloseTo(1234.56, 2);
  });
});
