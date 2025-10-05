// unit tests for csv parsing heuristics (no-jest)
const assert = require('assert');
const path = require('path');
const parserPath = path.resolve(__dirname, '..', 'lib', 'csv-parser.js');
let parser;
try { parser = require(parserPath); } catch (e) { console.error('Failed to load csv-parser:', e); process.exit(2); }

function run() {
  console.log('Running CSV unit tests...');
  // Test 1: semicolon delimiter and quoted comma
  const sample1 = 'data;descricao;valor;nome\n2024-01-10;"Compra, grande";1.234,56;Fornecedor A';
  const out1 = parser.parseDespesasCSV(sample1);
  assert(Array.isArray(out1), 'out1 should be array');
  assert(out1.length === 1, 'out1 length');
  assert(out1[0].favorecido === 'Fornecedor A', 'favorecido');
  assert(out1[0].valor === 1234.56 || Math.abs(out1[0].valor - 1234.56) < 0.001, 'valor parsed');

  // Test 2: comma delimiter
  const sample2 = 'data,descricao,valor,nome\n2024-01-10,"Compra",1000.00,Fornecedor B';
  const out2 = parser.parseDespesasCSV(sample2);
  assert(out2.length === 1, 'out2 length');

  // Test 3: missing values
  const sample3 = 'data;descricao;valor;nome\n;;;',
  out3 = parser.parseDespesasCSV(sample3);
  assert(Array.isArray(out3), 'out3 is array');

  console.log('✅ CSV unit tests passed');
}

try { run(); process.exit(0); } catch (e) { console.error('❌ CSV unit tests failed', e); process.exit(3); }