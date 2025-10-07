// Minimal main.js: require the extracted PoliticaApp and attach lightweight shims.
// This file intentionally contains only small helpers and exports the class for
// Node-based tests (Jest). Larger browser-only UI code remains in other files.

const _views = (typeof require !== 'undefined') ? (() => { try { return require('./lib/views'); } catch (e) { return (typeof window !== 'undefined' ? window.Views : null); } })() : (typeof window !== 'undefined' ? window.Views : null);
const _uiHelpers = (typeof require !== 'undefined') ? (() => { try { return require('./lib/ui-helpers'); } catch (e) { return (typeof window !== 'undefined' ? window.UIHelpers : null); } })() : (typeof window !== 'undefined' ? window.UIHelpers : null);

let PoliticaApp = null;
try {
    if (typeof module !== 'undefined' && module.exports) {
        PoliticaApp = require('./lib/politica-app');
    }
} catch (e) { void e; }

if (!PoliticaApp && typeof window !== 'undefined' && window.PoliticaApp) PoliticaApp = window.PoliticaApp;

// Export for Node tests
if (typeof module !== 'undefined' && module.exports) module.exports = PoliticaApp;

// Attach minimal shims to window so browser code can call them without crashing
if (typeof window !== 'undefined') {
    window.showProxyBanner = window.showProxyBanner || function() { if (_views && _views.showProxyBanner) return _views.showProxyBanner(); };
    window.showLocalDataBanner = window.showLocalDataBanner || function() { if (_views && _views.showLocalDataBanner) return _views.showLocalDataBanner(); };
    window.initDatasetLoaderUI = window.initDatasetLoaderUI || function() { if (_views && _views.initDatasetLoaderUI) return _views.initDatasetLoaderUI(); };
    window.carregarDadosReais = window.carregarDadosReais || async function() { return false; };
    window.mostrarNotificacao = window.mostrarNotificacao || function(msg, type) { console.log('notificacao:', type, msg); };
    window.showLoadingSpinner = window.showLoadingSpinner || function(){};
    window.hideLoadingSpinner = window.hideLoadingSpinner || function(){};
    // expose createPortalKeyModal if ui helpers available
    try { if (_uiHelpers && typeof _uiHelpers.createPortalKeyModal === 'function') window.createPortalKeyModal = _uiHelpers.createPortalKeyModal; } catch (e) { void e; }

    // Expose a GovernmentAPI instance for quick console/dev use
    try {
        if (typeof window.GovernmentAPI === 'function' && !window.governmentAPI) {
            try { window.governmentAPI = new window.GovernmentAPI(); } catch (e) { void e; }
        }
    } catch (e) { void e; }

    // Provide an async initializer that can be awaited from the console safely
    window.initPoliticaApp = window.initPoliticaApp || (async function() {
        if (window.politicaApp) return window.politicaApp;
        if (typeof PoliticaApp === 'function') {
            try {
                window.politicaApp = new PoliticaApp();
                if (typeof window.politicaApp.init === 'function') await window.politicaApp.init();
            } catch (e) {
                console.error('Falha ao inicializar PoliticaApp:', e);
            }
            return window.politicaApp;
        }
        throw new Error('PoliticaApp não disponível');
    });

    // Ensure we initialize after DOM is ready — either immediately or on DOMContentLoaded
    try {
        if (typeof document !== 'undefined') {
            // Auto-load local CSVs only when dev hooks are explicitly enabled.
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                // try to initialize, but don't block if errors happen
                (async () => { try { await window.initPoliticaApp(); } catch (e) { void e; } })();
            } else {
                document.addEventListener('DOMContentLoaded', function() { (async () => { try { await window.initPoliticaApp(); } catch (e) { void e; } })(); });
            }
        }
    } catch (e) { void e; }

    // Auto-load local CSVs only when dev hooks are explicitly enabled.
    try {
        (async () => {
            const isDevHookEnabled = (() => {
                try {
                    const hostname = (window && window.location && window.location.hostname) || '';
                    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
                    // feature flag via query param ?dev=1
                    try { const sp = new URLSearchParams(window.location.search); if (sp.get('dev') === '1') return true; } catch (e) { void e; }
                    // feature flag via localStorage
                    try { if (typeof localStorage !== 'undefined' && localStorage.getItem && localStorage.getItem('DEV_LOAD') === '1') return true; } catch (e) { void e; }
                } catch (e) { void e; }
                return false;
            })();
            if (!isDevHookEnabled) return;
            if (!window.governmentAPI || typeof window.governmentAPI.loadDespesasFromCSV !== 'function' || typeof window.governmentAPI.useLocalDespesas !== 'function') return;
            // Try deterministic test fixture first (useful during dev and e2e)
            const candidates = ['/tests/fixtures/despesas.csv', '/tests/fixtures/despesas.csv.txt', '/resources/data/despesas.csv'];
            for (const path of candidates) {
                try {
                    const resp = await fetch(path);
                    if (!resp || !resp.ok) { console.warn('Auto-load CSV: not found or not ok at', path); continue; }
                    const txt = await resp.text();
                    // simple heuristic: file should have CSV header-like content
                    if (typeof txt !== 'string' || txt.trim().length === 0) { console.warn('Auto-load CSV: empty file at', path); continue; }
                    const parsed = window.governmentAPI.loadDespesasFromCSV(txt);
                    window.governmentAPI.useLocalDespesas(parsed);
                    console.log('Auto-loaded local despesas from', path, ':', Array.isArray(parsed) ? parsed.length : 'unknown');
                    try { window.showLocalDataBanner && window.showLocalDataBanner(); } catch (e) { void e; }
                    return;
                } catch (err) {
                    console.warn('Auto-load CSV attempt failed for', path, err);
                    continue;
                }
            }
            console.warn('Auto-load CSV: no candidate files found for local environment');
        })();
    } catch (e) { void e; }

    // Expose a helper for dev to load the fixture manually from the console
    try {
        window.loadLocalFixture = window.loadLocalFixture || (async function() {
            if (!window.governmentAPI || typeof window.governmentAPI.loadDespesasFromCSV !== 'function' || typeof window.governmentAPI.useLocalDespesas !== 'function') {
                console.warn('governmentAPI or parsing functions not available yet');
                return false;
            }
            const candidates = ['/tests/fixtures/despesas.csv', '/tests/fixtures/despesas.csv.txt', '/resources/data/despesas.csv'];
            for (const path of candidates) {
                try {
                    const resp = await fetch(path);
                    if (!resp || !resp.ok) { console.warn('loadLocalFixture: not found at', path); continue; }
                    const txt = await resp.text();
                    const parsed = window.governmentAPI.loadDespesasFromCSV(txt);
                    window.governmentAPI.useLocalDespesas(parsed);
                    console.log('loadLocalFixture: loaded', Array.isArray(parsed) ? parsed.length : 'unknown', 'records from', path);
                    return true;
                } catch (err) {
                    console.warn('loadLocalFixture attempt failed for', path, err);
                    continue;
                }
            }
            console.warn('loadLocalFixture: no fixture found');
            return false;
        });
    } catch (e) { /* ignore */ }

    // Dev-only UI helper: small button to manually load fixture when running on localhost
    // or when a feature flag is present. This avoids exposing the button in production
    // while keeping an easy override for debugging or CI scenarios.
    try {
        (function(){
            const isLocalHost = typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
            const isDevEnv = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development');
            // feature flag overrides: ?dev=1 or localStorage.DEV_LOAD === '1'
            let featureFlag = false;
            try {
                if (typeof window !== 'undefined' && window.location && window.location.search) {
                    const sp = new URLSearchParams(window.location.search);
                    if (sp.get('dev') === '1') featureFlag = true;
                }
            } catch (e) { /* ignore */ }
            try {
                if (!featureFlag && typeof localStorage !== 'undefined') {
                    if (localStorage.getItem && localStorage.getItem('DEV_LOAD') === '1') featureFlag = true;
                }
            } catch (e) { /* ignore */ }

            if (!isLocalHost && !isDevEnv && !featureFlag) return;
            if (typeof document === 'undefined') return;
            if (document.getElementById('devLoadFixtureBtn')) return;
            const btn = document.createElement('button');
            btn.id = 'devLoadFixtureBtn';
            btn.textContent = 'Carregar dados locais';
            btn.style.position = 'fixed';
            btn.style.right = '12px';
            btn.style.bottom = '12px';
            btn.style.zIndex = '9999';
            btn.style.padding = '8px 12px';
            btn.style.background = '#111827';
            btn.style.color = '#fff';
            btn.style.border = 'none';
            btn.style.borderRadius = '6px';
            btn.style.boxShadow = '0 6px 18px rgba(0,0,0,0.15)';
            btn.style.cursor = 'pointer';
            btn.addEventListener('click', async () => {
                try {
                    btn.disabled = true; btn.textContent = 'Carregando...';
                    const ok = await window.loadLocalFixture();
                    if (!ok) window.mostrarNotificacao && window.mostrarNotificacao('Nenhuma fixture encontrada.', 'warn');
                    else window.mostrarNotificacao && window.mostrarNotificacao('Fixture carregada.', 'success');
                } catch (err) {
                    console.error('devLoadFixtureBtn error', err);
                    window.mostrarNotificacao && window.mostrarNotificacao('Erro ao carregar fixture', 'error');
                } finally { btn.disabled = false; btn.textContent = 'Carregar dados locais'; }
            });
            document.body.appendChild(btn);
        })();
    } catch (e) { /* ignore */ }

    // Ensure UI updates when local despesas are applied.
    try {
        window.addEventListener && window.addEventListener('localDespesasUsed', async (ev) => {
            // initialize app if needed
            try { await window.initPoliticaApp(); } catch (e) { void e; }
            const count = ev && ev.detail && typeof ev.detail.count === 'number' ? ev.detail.count : null;
            try {
                const app = window.politicaApp;
                if (app && typeof app.onLocalDespesasApplied === 'function') {
                    try { app.onLocalDespesasApplied(count); } catch (e) { void e; }
                } else if (app) {
                    // fallback: try the older approach
                    try { app.renderCandidatos && app.renderCandidatos(); } catch (e) { void e; }
                    try { app.updateLoadMoreUI && app.updateLoadMoreUI(); } catch (e) { void e; }
                }
            } catch (e) { /* ignore */ }

            // If a candidate details modal with gastos is open, trigger its load button so despesas appear
            try {
                if (typeof document !== 'undefined') {
                    const verBtn = document.getElementById('verGastosBtn');
                    if (verBtn && !verBtn.disabled) {
                        try { verBtn.click(); } catch (e) { void e; }
                    }
                }
            } catch (e) { void e; }
        });
    } catch (e) { /* ignore */ }
}
 