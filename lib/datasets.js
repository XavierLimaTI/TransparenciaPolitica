(function(){
  // Datasets loader helper
  const Datasets = {
    async fetchJSON(url) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
      } catch (e) {
        console.warn('fetchJSON failed for', url, e);
        return null;
      }
    },

    async loadManifest() {
      return await Datasets.fetchJSON('resources/data/manifest.json');
    },

    async loadLocalDespesas() {
      const manifest = await Datasets.loadManifest();
      if (!manifest || !manifest['despesas']) return null;
      const despesasFiles = manifest['despesas'] || [];
      // choose largest or the first
      const file = despesasFiles[0];
      if (!file) return null;
      const json = await Datasets.fetchJSON(file.path || file);
      if (!json) return null;
      if (window.governmentAPI && typeof window.governmentAPI.useLocalDespesas === 'function') {
        window.governmentAPI.useLocalDespesas(json);
      } else {
        console.warn('governmentAPI.useLocalDespesas not available');
      }
      return json;
    }
  };

  if (typeof window !== 'undefined') window.Datasets = Datasets;
  if (typeof module !== 'undefined' && module.exports) module.exports = Datasets;
})();
