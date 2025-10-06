const path = require('path');
const fs = require('fs');

// Polyfill for Node environments where TextEncoder/Decoder may be missing
try {
  const { TextEncoder, TextDecoder } = require('util');
  if (typeof global.TextEncoder === 'undefined') global.TextEncoder = TextEncoder;
  if (typeof global.TextDecoder === 'undefined') global.TextDecoder = TextDecoder;
} catch (e) { /* ignore */ }

describe('integração local despesas (Jest)', () => {
  test('government-api parses CSV e PoliticaApp reage ao evento localDespesasUsed', async () => {
  const { GovernmentAPI } = require(path.resolve(__dirname, '..', 'lib', 'government-api'));
  const PoliticaApp = require(path.resolve(__dirname, '..', 'lib', 'politica-app'));

    // preparar ambiente: document mínimo e window-like global
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(`<!doctype html><html><body></body></html>`);
    global.window = dom.window;
    global.document = dom.window.document;

  const api = new GovernmentAPI();
  // expose on window so event dispatch & consumers see it
  global.window.governmentAPI = api;
  // carregar fixture CSV (localizado em tests/fixtures)
  const csv = fs.readFileSync(path.resolve(__dirname, '..', 'tests', 'fixtures', 'despesas.csv'), 'utf8');
    const rows = api.loadDespesasFromCSV(csv);
    expect(Array.isArray(rows)).toBeTruthy();

    // espionagem: substituir PoliticaApp.onLocalDespesasApplied
    const app = new PoliticaApp();
    // expose app on the window so browser-like listeners can access it
    global.window.politicaApp = app;

    let calledCount = null;
    app.onLocalDespesasApplied = function(count) { calledCount = count; };

    // attach a window listener that mirrors main.js behavior: call app.onLocalDespesasApplied
    global.window.addEventListener('localDespesasUsed', (ev) => {
      try { const cnt = ev && ev.detail && typeof ev.detail.count === 'number' ? ev.detail.count : null; app.onLocalDespesasApplied(cnt); } catch(e) {}
    });

    // injetar dados locais e disparar o fluxo
    api.useLocalDespesas(rows);

  // permitir que eventos microtask sejam processados
  await new Promise((r) => setTimeout(r, 0));

    expect(calledCount !== null).toBeTruthy();
    expect(typeof calledCount).toBe('number');
    expect(calledCount).toBe(rows.length);
  });
});
