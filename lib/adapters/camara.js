// Adapter helpers para a Câmara dos Deputados (normalização de respostas)
function normalizeDeputadosApiResponse(data) {
  if (!data) return [];
  const items = data.dados || data.ListaDeputados || data || [];
  return (items || []).map(deputado => ({
    id: deputado.id || deputado.Id || (deputado.IdentificacaoParlamentar && deputado.IdentificacaoParlamentar.CodigoParlamentar) || null,
    nome: deputado.nome || deputado.nomeParlamentar || deputado.NomeParlamentar || (deputado.IdentificacaoParlamentar && deputado.IdentificacaoParlamentar.NomeParlamentar) || '',
    partido: deputado.siglaPartido || deputado.partido || (deputado.ultimoStatus && deputado.ultimoStatus.siglaPartido) || '',
    estado: deputado.siglaUf || deputado.uf || (deputado.ultimoStatus && deputado.ultimoStatus.siglaUf) || '',
    foto: deputado.urlFoto || deputado.urlFotoParlamentar || (deputado.ultimoStatus && deputado.ultimoStatus.urlFoto) || null,
    email: deputado.email || (deputado.ultimoStatus && deputado.ultimoStatus.email) || null,
    dataNascimento: deputado.dataNascimento || deputado.DataNascimento || null,
    cargo: 'Deputado Federal',
    raw: deputado
  }));
}

function normalizeVotacoesApiResponse(data) {
  if (!data) return [];
  const items = data.dados || data.votacoes || data || [];
  return (items || []).map(v => ({
    id: v.id || v.Id || v.codigo || null,
    materia: v.siglaOrgao || v.materia || v.orgao || 'Votação',
    descricao: v.descricao || v.ementa || '',
    data: v.dataHoraRegistro || v.data || null,
    resultado: (v.aprovacao === true) ? 'Aprovada' : (v.resultado || null),
    raw: v
  }));
}


// Normalize despesas response shape (portal or CSV fallback normalized objects)
function normalizeDespesasApiResponse(data) {
  if (!data) return [];
  const items = Array.isArray(data) ? data : (data.lista || data.dados || data || []);
  return (items || []).map(it => ({
    dataDocumento: it.dataDocumento || it.data || it.dataEmissao || null,
    descricao: it.descricao || it.historico || it.tipo || '',
    // Parse values like '1.234,56' (Brazilian) or '1234.56' (US). Remove non-numeric except . , - then
    // if both '.' and ',' present assume '.' thousands and ',' decimal -> remove dots and replace comma with dot
    // otherwise replace comma with dot
    valor: (function() {
      const raw = it.valor || it.valorDocumento || it.valorPagamento || 0;
      let s = String(raw).trim();
      s = s.replace(/[^0-9\-,.]/g, '');
      if (s.indexOf(',') > -1 && s.indexOf('.') > -1) {
        s = s.replace(/\./g, '').replace(/,/g, '.');
      } else if (s.indexOf(',') > -1) {
        s = s.replace(/,/g, '.');
      }
      const n = Number(s);
      return Number.isFinite(n) ? n : 0;
    })(),
    favorecido: it.favorecido || it.nomeFavorecido || it.nome || it.fornecedor || '',
    cnpjCpf: it.cpfCnpj || it.cpf || it.cnpj || null,
    origem: it.orgao || it.unidade || null,
    raw: it
  }));
}

module.exports = { normalizeDeputadosApiResponse, normalizeVotacoesApiResponse, normalizeDespesasApiResponse };
