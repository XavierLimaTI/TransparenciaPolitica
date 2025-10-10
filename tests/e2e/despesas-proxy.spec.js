const { test, expect } = require('@playwright/test');

test.setTimeout(45000);

test('proxy /health and /despesas smoke test', async ({ request }) => {
  // check health
  const health = await request.get('http://localhost:3001/health');
  expect(health.ok()).toBeTruthy();
  const healthJson = await health.json();
  expect(healthJson).toHaveProperty('status');

  // call /despesas with minimal params
  const resp = await request.get('http://localhost:3001/despesas?itens=1');
  // Acceptable outcomes:
  // - 200 with array of results
  // - 401 or 502 if portal key missing or upstream failed
  if (resp.status() === 200) {
    const data = await resp.json();
    expect(Array.isArray(data)).toBeTruthy();
  } else if (resp.status() === 401 || resp.status() === 502) {
    // fallback behaviour: report but don't fail the test in offline runs
    const body = await resp.json().catch(() => ({}));
    expect(body).toBeTruthy();
  } else {
    // other statuses are unexpected but we assert OK flag for debug
    expect(resp.ok()).toBeTruthy();
  }
});
