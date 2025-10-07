// Adapter helpers for Senado (normalização de respostas)
function normalizeSenadoresApiResponse(data) {
  if (!data) return [];
  const lista = data.ListaParlamentarEmExercicio || data.parlamentares || data || {};
  const items = lista.Parlamentares ? lista.Parlamentares.Parlamentar : (lista || []);
  return (items || []).map(s => ({
    id: (s.IdentificacaoParlamentar && s.IdentificacaoParlamentar.CodigoParlamentar) || s.id || null,
    nome: (s.IdentificacaoParlamentar && s.IdentificacaoParlamentar.NomeParlamentar) || s.nome || '',
    partido: (s.IdentificacaoParlamentar && s.IdentificacaoParlamentar.SiglaPartidoParlamentar) || s.partido || '',
    estado: (s.IdentificacaoParlamentar && s.IdentificacaoParlamentar.UfParlamentar) || s.uf || '',
    foto: s.IdentificacaoParlamentar && s.IdentificacaoParlamentar.UrlFotoParlamentar || null,
    email: s.IdentificacaoParlamentar && s.IdentificacaoParlamentar.EmailParlamentar || s.email || null,
    dataNascimento: s.IdentificacaoParlamentar && s.IdentificacaoParlamentar.DataNascimentoParlamentar || s.dataNascimento || null,
    cargo: 'Senador',
    raw: s
  }));
}

module.exports = { normalizeSenadoresApiResponse };

