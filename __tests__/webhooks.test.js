const fs = require('fs');
const path = require('path');
const { webhookHandler, loadEvents } = require('../server/webhooks');

const FILE = path.join(__dirname, '..', 'server', 'webhooks.json');

afterEach(() => { try { if (fs.existsSync(FILE)) fs.unlinkSync(FILE); } catch (e) { void e; } });

function makeReq(body, headers = {}) { return { body, headers }; }
function makeRes() {
  const r = {};
  r.statusCode = 200;
  r.body = null;
  r.status = function (code) { this.statusCode = code; return this; };
  r.json = function (obj) { this.body = obj; };
  return r;
}

test('webhookHandler saves event and returns ok', () => {
  const req = makeReq({ test: 'ok' }, {});
  const res = makeRes();
  webhookHandler(req, res);
  expect(res.statusCode).toBe(200);
  expect(res.body).toEqual({ ok: true });
  const events = loadEvents();
  expect(Array.isArray(events)).toBe(true);
  expect(events.length).toBe(1);
  expect(events[0].event).toEqual({ test: 'ok' });
});
