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
} catch (e) {
    // ignore
}

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
    try { if (_uiHelpers && typeof _uiHelpers.createPortalKeyModal === 'function') window.createPortalKeyModal = _uiHelpers.createPortalKeyModal; } catch (e) {}

    // Expose a GovernmentAPI instance for quick console/dev use
    try {
        if (typeof window.GovernmentAPI === 'function' && !window.governmentAPI) {
            try { window.governmentAPI = new window.GovernmentAPI(); } catch (e) { /* ignore */ }
        }
    } catch (e) {}

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
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                // try to initialize, but don't block if errors happen
                (async () => { try { await window.initPoliticaApp(); } catch (e) {} })();
            } else {
                document.addEventListener('DOMContentLoaded', function() { (async () => { try { await window.initPoliticaApp(); } catch (e) {} })(); });
            }
        }
    } catch (e) { /* ignore */ }

    // Auto-load local CSVs in development or when served from localhost
    try {
        (async () => {
            const isLocalHost = typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
            const isDevEnv = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development');
            if (!isLocalHost && !isDevEnv) return;
            if (!window.governmentAPI || typeof window.governmentAPI.loadDespesasFromCSV !== 'function' || typeof window.governmentAPI.useLocalDespesas !== 'function') return;
            try {
                const path = '/resources/data/despesas.csv';
                const resp = await fetch(path);
                if (!resp.ok) { console.warn('Auto-load CSV: arquivo não encontrado em', path); return; }
                const txt = await resp.text();
                const parsed = window.governmentAPI.loadDespesasFromCSV(txt);
                window.governmentAPI.useLocalDespesas(parsed);
                console.log('Auto-loaded local despesas:', Array.isArray(parsed) ? parsed.length : 'unknown');
                try { window.showLocalDataBanner && window.showLocalDataBanner(); } catch (e) {}
            } catch (err) {
                console.warn('Falha ao auto-carregar CSV local:', err);
            }
        })();
    } catch (e) { /* ignore */ }
}
 