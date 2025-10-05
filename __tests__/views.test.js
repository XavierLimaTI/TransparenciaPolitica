const fs = require('fs');
const path = require('path');
// jsdom depends on TextEncoder/TextDecoder in some Node versions; ensure globals exist
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = global.TextEncoder || TextEncoder;
global.TextDecoder = global.TextDecoder || TextDecoder;
const { JSDOM } = require('jsdom');

describe('views module', () => {
  let window, document, views, app;

  beforeEach(() => {
    const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>');
    window = dom.window;
    document = window.document;
    // expose global symbols expected by views early so module sees the jsdom document
    global.document = document;
    global.window = window;
    // load the views module via require from workspace
    views = require('../lib/views');

    // small app stub
    app = {
      currentPage: 1,
      pageSize: 3,
      candidatosFiltrados: [
        { id: 1, nome: 'A', partido: 'PT', estado: 'SP', cargo: 'Deputado', foto: '', votacoes: [], projetos: [], ideologia: '' },
        { id: 2, nome: 'B', partido: 'PSDB', estado: 'RJ', cargo: 'Senador', foto: '', votacoes: [], projetos: [], ideologia: '' },
        { id: 3, nome: 'C', partido: 'MDB', estado: 'MG', cargo: 'Deputado', foto: '', votacoes: [], projetos: [], ideologia: '' },
        { id: 4, nome: 'D', partido: 'PL', estado: 'RS', cargo: 'Deputado', foto: '', votacoes: [], projetos: [], ideologia: '' }
      ],
      favoritos: [],
      setPage(p) { this.currentPage = p; },
      toggleFavorito(id) { const i = this.favoritos.indexOf(id); if (i > -1) this.favoritos.splice(i,1); else this.favoritos.push(id); }
    };

    // ensure DOM elements exist
    const candidatosGrid = document.createElement('div'); candidatosGrid.id = 'candidatosGrid'; document.body.appendChild(candidatosGrid);
    const pagination = document.createElement('div'); pagination.id = 'paginationControls'; document.body.appendChild(pagination);
    const votacoesGrid = document.createElement('div'); votacoesGrid.id = 'votacoesGrid'; document.body.appendChild(votacoesGrid);
    const dashboard = document.createElement('div'); dashboard.id = 'dashboardStats'; document.body.appendChild(dashboard);

  // no debug logs

    global.candidatos = app.candidatosFiltrados;
    global.votacoes = [];
  });

  afterEach(() => {
    delete global.document;
    delete global.window;
    delete require.cache[require.resolve('../lib/views')];
  });

  test('renderCandidatos renders page items and favorite buttons', () => {
    views.renderCandidatos(app, document);
    const grid = document.getElementById('candidatosGrid');
    expect(grid.innerHTML).toContain('candidato-card');
    // pageSize 3 => should render 3 items on first page
    expect(grid.querySelectorAll('.candidato-card').length).toBe(3);
  });

  test('renderPagination creates page buttons and navigation', () => {
    views.renderPagination(app, document);
    const container = document.getElementById('paginationControls');
    expect(container.querySelectorAll('button').length).toBeGreaterThan(0);
    // simulate clicking page 2
    const btn = Array.from(container.querySelectorAll('button')).find(b => b.textContent.trim() === '2');
    if (btn) btn.click();
    expect(app.currentPage).toBe(2);
  });

  test('showCandidatoDetails opens modal with Ver gastos button', (done) => {
    views.showCandidatoDetails(app, 1, document);
    setTimeout(() => {
      const modal = document.querySelector('.modal-root') || document.querySelector('div.fixed');
      expect(modal).toBeTruthy();
      const verBtn = document.getElementById('verGastosBtn');
      expect(verBtn).toBeTruthy();
      done();
    }, 60);
  });
});
