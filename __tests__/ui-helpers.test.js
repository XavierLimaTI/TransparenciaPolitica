const fs = require('fs');
const path = require('path');
// jsdom / whatwg-url expects TextEncoder in some Node environments
if (typeof global.TextEncoder === 'undefined') {
  try { global.TextEncoder = require('util').TextEncoder; } catch (e) { /* ignore */ }
}
if (typeof global.TextDecoder === 'undefined') {
  try { global.TextDecoder = require('util').TextDecoder; } catch (e) { /* ignore */ }
}
const { JSDOM } = require('jsdom');

const uiHelpers = require('../lib/ui-helpers');

describe('ui-helpers', () => {
  let dom;
  let document;

  beforeEach(() => {
    // ensure a non-opaque origin so localStorage and URL work
    dom = new JSDOM(`<!doctype html><html><body></body></html>`, { url: 'http://localhost' });
    document = dom.window.document;
    global.document = document;
    global.window = dom.window;
    // provide minimal localStorage
    global.localStorage = dom.window.localStorage;
    // polyfill URL.createObjectURL and revoke in jsdom environment
    if (!global.window.URL.createObjectURL) global.window.URL.createObjectURL = () => 'blob:fake';
    if (!global.window.URL.revokeObjectURL) global.window.URL.revokeObjectURL = () => {};
    // simple Blob shim if missing
    if (typeof global.Blob === 'undefined') {
      global.Blob = function Blob(parts, opts) { this.parts = parts; this.type = opts && opts.type; };
    }
  });

  afterEach(() => {
    delete global.document;
    delete global.window;
    try { localStorage.clear(); } catch (e) {}
    delete global.localStorage;
  });

  test('createModal injects modal into document', () => {
    const content = `<div class="test-modal">hello</div>`;
    uiHelpers.createModal(content, document);
    const modal = document.querySelector('.fixed.inset-0') || document.querySelector('.modal-root');
    // our createModal uses class 'fixed inset-0 bg-black' — check for the element
    const found = document.body.querySelector('div');
    expect(found).toBeTruthy();
    expect(found.innerHTML).toContain('hello');
  });

  test('createDownloadButtonForDespesas generates CSV and triggers download', () => {
    const rows = [ { data: '2020-01-01', descricao: 'Teste', favorecido: 'Fulano', valor: 123.45 } ];
    const getRows = () => rows;
    const btn = uiHelpers.createDownloadButtonForDespesas(getRows, document);
    expect(btn).toBeTruthy();
    // Simulate click: we cannot observe file download, but we can ensure no exception thrown when clicked
    expect(() => btn.click()).not.toThrow();
  });

  test('createPortalKeyModal attaches inputs and save works', async () => {
    uiHelpers.createPortalKeyModal(null, document);
    const input = document.getElementById('portalKeyInput');
    expect(input).toBeTruthy();
    input.value = 'SOMEKEY';
    const saveBtn = document.getElementById('portalKeySave');
    expect(saveBtn).toBeTruthy();
    // wait for handler to be attached (createPortalKeyModal uses setTimeout)
    await new Promise(r => setTimeout(r, 60));
    // click save
    expect(() => saveBtn.click()).not.toThrow();
    // key should be stored in localStorage
    expect(localStorage.getItem('portal_api_key')).toBe('SOMEKEY');
  });
});
