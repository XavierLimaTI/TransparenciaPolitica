const fs = require('fs');
const path = require('path');
const { runOnce, isLocked, unlock } = require('../server/sync');

const DB_PATH = path.join(__dirname, '..', 'server', 'db.json');

afterEach(() => { try { if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH); } catch (e) { void e; } unlock(); });

test('runOnce writes db.json when API returns data', async () => {
  const api = { atualizarDados: async () => ({ test: 'ok' }) };
  expect(isLocked()).toBe(false);
  const out = await runOnce(api);
  expect(out).toBeTruthy();
  expect(fs.existsSync(DB_PATH)).toBe(true);
  const content = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  expect(content).toHaveProperty('dados');
});
