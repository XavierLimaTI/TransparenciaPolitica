// Adapter for Senado Federal API
// https://legis.senado.leg.br/dadosabertos/

const DEFAULT_BASE = process.env.BASE_URL_SENADO || 'https://legis.senado.leg.br/dadosabertos';
const xml2js = require('xml2js');

async function _fetch(path, opts = {}) {
  const base = process.env.BASE_URL_SENADO || DEFAULT_BASE;
  const url = `${base}${path}`;
  const fetchImpl = (typeof fetch !== 'undefined') ? fetch : (await import('node-fetch')).default;
  const res = await fetchImpl(url, opts);
  if (!res.ok) throw new Error(`Senado API error ${res.status} ${url}`);
  const text = await res.text();
  const contentType = (res.headers && (res.headers.get && res.headers.get('content-type'))) || '';
  // se XML, parsear para objeto
  if (contentType.includes('xml') || text.trim().startsWith('<')) {
    const parsed = await xml2js.parseStringPromise(text, { explicitArray: false, mergeAttrs: true, trim: true });
    return parsed;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    // fallback: retorno raw text
    return text;
  }
}

function normalizeSenador(raw) {
  if (!raw) return null;
  const s = raw.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || raw || {};
  // se vier como array/objeto, normalizar para campos esperados
  const item = Array.isArray(s) ? s[0] : s;
  return {
    id: item.Matricula || item.matricula || item.identificacao || item.id || null,
    nome: item.NomeParlamentar || item.nome || item.nomeParlamentar || null,
    partido: item.SiglaPartido || item.Partido || item.partido || null,
    estado: item.Uf || item.SiglaUF || item.siglaUF || item.uf || null,
    foto: item.Foto || item.foto || null,
    cargo: 'Senador',
    raw: item
  };
}

async function fetchSenadores(params = {}) {
  const q = new URLSearchParams(params).toString();
  // endpoint que retorna XML costuma ser /senador/lista/atual
  const payload = await _fetch(`/senador/lista/atual?${q}`);
  // payload pode ser objeto resultante do xml2js ou JSON já estruturado
  const lista = payload.ListaParlamentarEmExercicio || payload;
  let items = lista?.Parlamentares?.Parlamentar || [];
  if (!items) items = [];
  if (!Array.isArray(items)) items = [items];
  return items.map(normalizeSenador);
}

module.exports = {
  normalizeSenador,
  fetchSenadores
};
