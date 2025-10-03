async function loadManifest() {
  try {
    const r = await fetch('/resources/data/manifest.json');
    if (!r.ok) return document.getElementById('datasets').textContent = 'Nenhum dataset disponível.';
    const m = await r.json();
    const container = document.getElementById('datasets');
    container.innerHTML = '';
    m.files.forEach(f => {
      if (!f || f.endsWith('manifest.json')) return;
      const d = document.createElement('div');
      d.style.marginBottom = '8px';
      const btn = document.createElement('button');
      btn.textContent = 'Pré-visualizar';
      btn.style.marginRight = '8px';
      btn.addEventListener('click', async () => {
        const p = await fetch('/resources/data/' + f);
        const txt = await p.text();
        document.getElementById('preview').textContent = txt.split(/\r?\n/).slice(0,50).join('\n');
      });
      const loadBtn = document.createElement('button');
      loadBtn.textContent = 'Carregar no app';
      loadBtn.style.marginRight = '8px';
      loadBtn.addEventListener('click', async () => {
        const p = await fetch('/resources/data/' + f);
        const txt = await p.text();
        if (window.opener && window.opener.governmentAPI && typeof window.opener.governmentAPI.loadDespesasFromCSV === 'function') {
          const parsed = window.opener.governmentAPI.loadDespesasFromCSV(txt);
          window.opener.governmentAPI.useLocalDespesas(parsed);
          alert('Carregado ' + parsed.length + ' registros no app (janela anterior).');
        } else {
          alert('Abra a aplicação em outra aba e tente novamente para carregar no app.');
        }
      });
      d.textContent = f + ' ';
      d.appendChild(btn);
      d.appendChild(loadBtn);
      container.appendChild(d);
    });
  } catch (e) {
    document.getElementById('datasets').textContent = 'Erro ao carregar manifest.';
  }
}

loadManifest();
