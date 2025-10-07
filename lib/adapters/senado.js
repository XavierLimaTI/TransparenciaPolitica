// Adapter for Senado Federal API
// https://legis.senado.leg.br/dadosabertos/docs/

const DEFAULT_BASE = 'https://legis.senado.leg.br/dadosabertos';

async function _fetch(path, opts = {}) {
  const base = process.env.BASE_URL_SENADO || DEFAULT_BASE;
  const url = `${base}${path}`;
  
  // Support both browser and Node.js environments
  let fetchImpl;
  if (typeof fetch !== 'undefined') {
    fetchImpl = fetch;
  } else {
    // Node.js environment
    fetchImpl = require('node-fetch');
  }
  
  const res = await fetchImpl(url, opts);
  if (!res.ok) {
    throw new Error(`Senado API error ${res.status} ${url}`);
  }
  return res.json();
}

function normalizeSenador(raw) {
  if (!raw) return null;
  
  const s = raw.dados || raw;
  
  return {
    id: s.id || s.matricula || null,
    nome: s.nome || s.nomeParlamentar || null,
    partido: s.partido || s.siglaPartido || null,
    estado: s.uf || s.siglaUf || null,
    foto: s.foto || null,
    cargo: 'Senador',
    raw: s
  };
}

async function fetchSenadores(params = {}) {
  const q = new URLSearchParams(params).toString();
  const payload = await _fetch(`/senador/lista/atual?${q}`);
  const items = payload.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
  return items.map(normalizeSenador);
}

module.exports = {
  normalizeSenador,
  fetchSenadores
};
