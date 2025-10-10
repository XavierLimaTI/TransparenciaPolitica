const { test, expect } = require('@playwright/test');

// Skip this whole file when no PORTAL_KEY is provided in the environment.
test.skip(!process.env.PORTAL_KEY, 'Skipping portal-backed despesas test because PORTAL_KEY is not set');

test('proxy /despesas returns data when portal key is configured', async ({ request }) => {
  const proxyBase = process.env.PROXY_BASE || 'http://127.0.0.1:3001';
  const url = `${proxyBase.replace(/\/$/, '')}/despesas?itens=1`;
  const res = await request.get(url);
  expect(res.status()).toBe(200);
  let body = null;
  try { body = await res.json(); } catch (e) { body = null; }
  expect(body).not.toBeNull();
  // Assert we got an array or an object that includes an array-like payload
  if (Array.isArray(body)) {
    expect(body.length).toBeGreaterThan(0);
  } else if (body && typeof body === 'object') {
    const possible = body.data || body.items || body.results || body.rows;
    if (Array.isArray(possible)) expect(possible.length).toBeGreaterThan(0);
  } else {
    // If format is unexpected, at least ensure non-empty body
    expect(body).toBeDefined();
  }
});
