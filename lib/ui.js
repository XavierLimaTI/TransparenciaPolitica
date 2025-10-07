(function(){
  // UI helpers (UMD-like) - attaches to window.UI
  const UI = {
    init() {
      // Update badge when local despesas are used
      try {
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
          window.addEventListener('localDespesasUsed', (_e) => {
            const count = _e && _e.detail && _e.detail.count ? _e.detail.count : null;
            UI.setLocalDataBadge(true, count);
            UI.showLocalDataBanner(count);
          });
          window.addEventListener('dadosAtualizados', (_ev) => {
            UI.setLocalDataBadge(false);
            UI.hideLocalDataBanner();
          });
        }
      } catch (e) { console.warn('UI.init event wiring failed', e); }

      UI.setupReloadButton();
    },

    setLocalDataBadge(active, count) {
      const badge = document.getElementById('localDataBadge');
      if (!badge) return;
      if (active) {
        badge.style.display = '';
        badge.textContent = count ? `Dados locais (${count})` : 'Dados locais';
        badge.classList.add('badge-local-active');
      } else {
        badge.style.display = 'none';
        badge.classList.remove('badge-local-active');
      }
    },

    showLocalDataBanner(count) {
      if (!document.body) return;
      let b = document.getElementById('localDataBanner');
      if (!b) {
        b = document.createElement('div');
        b.id = 'localDataBanner';
        b.className = 'local-data-banner fixed top-0 left-0 right-0 bg-yellow-200 text-black text-center py-2 z-50';
        document.body.appendChild(b);
      }
      b.textContent = count ? `Aplicando dados locais (${count} despesas). Alguns recursos remotos podem não estar disponíveis.` : 'Aplicando dados locais. Alguns recursos remotos podem não estar disponíveis.';
      b.style.display = '';
    },

    hideLocalDataBanner() {
      const b = document.getElementById('localDataBanner');
      if (b) b.style.display = 'none';
    },

    setupReloadButton() {
      const btn = document.getElementById('reloadRealDataBtn');
      if (!btn) return;
      btn.addEventListener('click', async (_e) => {
        btn.disabled = true;
        btn.textContent = 'Tentando carregar...';
        try {
          if (window.governmentAPI && typeof window.governmentAPI.atualizarDados === 'function') {
            await window.governmentAPI.atualizarDados();
          } else {
            // dispatch an event for other code to handle
            if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new CustomEvent('attemptLoadRealData'));
          }
        } catch (err) {
          console.warn('reloadRealData failed', err);
        } finally {
          btn.disabled = false;
          btn.textContent = 'Tentar carregar dados reais';
        }
      });
    }
  };

  if (typeof window !== 'undefined') window.UI = UI;
  if (typeof module !== 'undefined' && module.exports) module.exports = UI;
})();
