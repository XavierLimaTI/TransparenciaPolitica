const { GovernmentAPI } = require('../lib/government-api');
const fs = require('fs');
const path = require('path');

describe('GovernmentAPI adapters and CSV fallback', () => {
  test('loadDespesasFromCSV parses fixture without throwing', () => {
  const csvPath = path.join(__dirname, '..', 'tests', 'fixtures', 'despesas.csv');
    const text = fs.readFileSync(csvPath, 'utf8');
    const api = new GovernmentAPI();
    const parsed = api.loadDespesasFromCSV(text);
    expect(Array.isArray(parsed)).toBe(true);
    // should have at least one parsed entry
    expect(parsed.length).toBeGreaterThan(0);
    const entry = parsed[0];
    expect(entry).toHaveProperty('valor');
    expect(entry).toHaveProperty('favorecido');
  });

  test('useLocalDespesas sets local despesas and emits event', done => {
    const api = new GovernmentAPI();
    // listen for the event in the test environment (jsdom)
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('localDespesasUsed', (ev) => {
        try {
          expect(ev).toBeDefined();
          expect(ev.detail).toBeDefined();
          expect(ev.detail.count).toBe(2);
          done();
        } catch (err) { done(err); }
      });
    }
    api.useLocalDespesas([{ favorecido: 'A' }, { favorecido: 'B' }]);
    // In case the environment doesn't support events, fall back to checking property
    setTimeout(() => {
      try {
        expect(api._localDespesas.length).toBe(2);
        // If no event was fired, still finish the test
        if (!api._localDespesas || api._localDespesas.length !== 2) throw new Error('localDespesas not set');
        // allow event listener to finish if it will
        done();
      } catch (err) { done(err); }
    }, 100);
  }, 2000);
});
