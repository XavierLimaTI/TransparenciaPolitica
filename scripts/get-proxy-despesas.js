(async () => {
  try {
    const res = await fetch('http://localhost:3001/despesas?pagina=1&itens=1');
    console.log('status', res.status);
    const txt = await res.text();
    console.log(txt);
  } catch (err) {
    console.error('error', err);
  }
})();
