const fs = require('fs');
const path = require('path');
const { GovernmentAPI } = require('../lib/government-api');

const CACHE_PATH = path.join(__dirname, '..', 'server', 'cache.json');

afterEach(() => { try { if (fs.existsSync(CACHE_PATH)) fs.unlinkSync(CACHE_PATH); } catch (e) { void e; } });

test('fetchData writes to persistent cache and uses it on next call', async () => {
  const api = new GovernmentAPI();
  const fakeData = { dados: [{ id: 1 }] };
  const originalFetch = global.fetch;
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => fakeData });

  const data1 = await api.fetchData('camara', '/test-endpoint', { itens: 10 });
  expect(data1).toEqual(fakeData);
  // cache file should exist
  expect(fs.existsSync(CACHE_PATH)).toBe(true);

  // now mock fetch to throw, but fetchData should return cached data
  global.fetch.mockRejectedValue(new Error('network down'));
  const data2 = await api.fetchData('camara', '/test-endpoint', { itens: 10 });
  expect(data2).toEqual(fakeData);
  // restore
  global.fetch = originalFetch;
});
