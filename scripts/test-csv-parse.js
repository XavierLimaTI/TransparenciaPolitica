// Simple smoke test: load api-integration.js, export GovernmentAPI, and run loadDespesasFromCSV
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const filePath = path.resolve(__dirname, '..', 'api-integration.js');
const src = fs.readFileSync(filePath, 'utf8');

// Prepare a sandbox with minimal browser globals the file expects
const sandbox = {
  console,
  window: {},
  document: {
    addEventListener: function() {},
    getElementById: function() { return null; },
    querySelector: function() { return null; }
  },
  fetch: global.fetch,
  URL: global.URL,
  localStorage: { setItem() {} },
  module: {},
  exports: {}
};
vm.createContext(sandbox);

// Append an export to the loaded source so we can retrieve the class
const wrapped = `${src}\n\nmodule.exports = GovernmentAPI;`;

try {
  vm.runInContext(wrapped, sandbox);
} catch (err) {
  console.error('Error evaluating api-integration.js in VM:', err);
  process.exit(2);
}

const GovernmentAPI = sandbox.module.exports || sandbox.exports;
if (!GovernmentAPI) {
  console.error('GovernmentAPI not found after evaluating file');
  process.exit(2);
}

const api = new GovernmentAPI();

const sampleCSV = 'data;descricao;valor;nome\n2024-01-10;"Compra, grande";1.234,56;Fornecedor A\n2024-02-02;Servico;789,00;Fornecedor B';

const out = api.loadDespesasFromCSV(sampleCSV);
console.log('Parsed', Array.isArray(out) ? out.length : 0, 'items');
console.log(out.slice(0, 2));

if (!Array.isArray(out) || out.length < 1) process.exit(1);
process.exit(0);
