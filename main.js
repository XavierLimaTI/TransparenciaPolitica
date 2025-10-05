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

    try { if (PoliticaApp && document && document.readyState === 'complete') { window.politicaApp = new PoliticaApp(); } } catch (e) { /* ignore */ }
}
 