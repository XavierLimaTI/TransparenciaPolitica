API Integration Plan — TransparenciaPolitica

Summary
- Implement adapters for Brazilian open data sources: Câmara, Senado, Portal da Transparência, and TSE.
- Start with Câmara (no API key required) to provide deputies, pagination, details, votações.

Câmara (Dados Abertos)
- Base: https://dadosabertos.camara.leg.br/api/v2/
- Useful endpoints:
  - /deputados?pagina={page}&itens={pageSize}&nome={nome}&siglaUf={uf}&siglaPartido={partido}
  - /deputados/{id}
  - /votacoes
  - /votacoes/{id}/votos
  - /proposicoes
- Authentication: none.
- Rate limits: not strictly documented; respect polite usage and caching.

Portal da Transparência
- Base: https://api.portaldatransparencia.gov.br/api-de-dados/
- Useful endpoints: /despesas, /orgaos, /doadores, /contratos, etc.
- Authentication: required. Register via Gov.br to obtain API key (token delivered via email). Header required (Portal documentation).
- Rate limits: 400 req/min (06:00-23:59), 700 req/min (00:00-05:59), restricted APIs lower.

Senado
- Base: https://legis.senado.leg.br/dadosabertos/
- Endpoints: /senador/lista?formato=json, /senador/{id}
- Authentication: none.

TSE / Data Lake
- Portals: https://dadosabertos.tse.jus.br/ and https://apidatalake.tse.jus.br/
- Datasets: results by municipality, candidate, historical data; often provided as dataset CSV/JSON files or via data-lake API.
- Authentication: generally not required for public datasets.

Proposed client API (to add/extend in `api-integration.js`)
- camara.listDeputados({ page, pageSize, nome, uf, partido }) -> { items, total, page, pageSize }
- camara.getDeputado(id) -> objeto normalizado
- camara.searchDeputados(params)
- portal.getDespesas(params) -> requires key; implement header injection and error handling
- senado.listSenadores()
- tse.getResultadosEleicao(params)

Error handling and quality
- Implement caching (in-memory/localStorage) and retry/backoff for 429/5xx.
- Timeouts (10s) on fetch.
- Normalizers to adapt different sources to a unified shape for the UI.

Next steps
1. Add camara client functions (done in `api-integration.js`).
2. Create small Node test script to verify Câmara endpoints from the dev environment.
3. Implement Portal client once API key is available (or show instructions to register).
4. Optionally add tests and usage examples.
