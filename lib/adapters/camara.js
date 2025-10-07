// Adapter for Câmara dos Deputados API
// https://dadosabertos.camara.leg.br/swagger/api.html

const DEFAULT_BASE = 'https://dadosabertos.camara.leg.br/api/v2';

async function _fetch(path, opts = {}) {
  const base = process.env.BASE_URL_CAMARA || DEFAULT_BASE;
  const url = `${base}${path}`;
  
  // Support both browser and Node.js environments
  const fetchImpl = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default;
  
  const res = await fetchImpl(url, opts);
  if (!res.ok) {
    throw new Error(`Camara API error ${res.status} ${url}`);
  }
  return res.json();
}

function normalizeDeputado(raw) {
  if (!raw) return null;
  
  // API v2 returns structure with 'dados' for some routes
  const d = raw.dados || raw;
  
  return {
    id: d.id || Number(d.codigo) || null,
    nome: d.nome || d.nomeParlamentar || d.nomeCivil || null,
    partido: d.siglaPartido || d.partido || null,
    estado: d.siglaUf || d.sigla_uf || d.estado || null,
    foto: d.urlFoto || d.url_foto || null,
    email: d.email || null,
    cargo: d.role || 'Deputado',
    raw: d
  };
}

function parseBrazilianMoney(value) {
  if (value == null) return 0;
  const s = String(value).trim();
  
  // Remove currency symbols and spaces
  const clean = s.replace(/[^\d,.-]/g, '');
  
  // If contains both '.' and ',' assume '.' is thousand separator and ',' is decimal
  if (clean.indexOf('.') !== -1 && clean.indexOf(',') !== -1) {
    return Number(clean.replace(/\./g, '').replace(',', '.'));
  }
  
  // If only comma -> decimal separator
  if (clean.indexOf(',') !== -1 && clean.indexOf('.') === -1) {
    return Number(clean.replace(',', '.'));
  }
  
  return Number(clean);
}

function normalizeDespesaItem(raw) {
  const d = raw || {};
  const valor = parseBrazilianMoney(d.valor || d.vl || d.valorLiquido || d.vlLiquido);
  
  return {
    id: d.id || null,
    fornecedor: d.fornecedor || d.nomeFornecedor || null,
    data: d.data || d.dataDocumento || null,
    tipo: d.tipo || d.descricao || null,
    valor,
    raw: d
  };
}

async function fetchDeputados(params = {}) {
  const q = new URLSearchParams(params).toString();
  const payload = await _fetch(`/deputados?${q}`);
  const items = payload.dados || payload.items || [];
  return items.map(normalizeDeputado);
}

async function fetchDespesasDeputado(deputadoId, params = {}) {
  // Endpoint: /deputados/{id}/despesas
  const q = new URLSearchParams(params).toString();
  const payload = await _fetch(`/deputados/${deputadoId}/despesas?${q}`);
  const items = payload.dados || payload.items || [];
  return items.map(normalizeDespesaItem);
}

module.exports = {
  normalizeDeputado,
  normalizeDespesaItem,
  parseBrazilianMoney,
  fetchDeputados,
  fetchDespesasDeputado
};
