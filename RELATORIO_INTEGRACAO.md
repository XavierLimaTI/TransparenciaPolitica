# Relatório de Integração Frontend ↔ Backend

Data: 2025-10-06

## Objetivo
Documentar como o frontend e backend do projeto se integram, validar pontos críticos, e listar recomendações e passos de QA.

## Componentes principais
- `lib/government-api.js` — Abstração das chamadas às APIs oficiais (Câmara, Senado, Portal da Transparência). Suporta proxy (`setProxy`) e parse/uso de CSV local.
- `api-integration.js` — Loader compatível Node/Browser que expõe `GovernmentAPI` globalmente quando necessário; também contém um stub mínimo usado em tests.
- `lib/politica-app.js` — Classe central do frontend que gerencia estado, chamadas à API (`window.governmentAPI`) e expõe hooks públicos (ex: `onLocalDespesasApplied`).
- `lib/views.js` — Helpers de renderização DOM (renderCandidatos, renderVotacoes, modais, controles de upload).
- `tests/e2e/*` — Testes Playwright que pré-carregam fixtures e exercitam fluxos críticos (ingest, portal-key, candidatos, votacao).
- `.github/workflows/ci.yml` — Workflow CI com etapas unit + e2e, agora endurecido para instalar browsers e esperar fixtures.

---

## Fluxo de integração (alto nível)

1. O frontend chama métodos do `window.governmentAPI` para obter dados (ex.: `searchDeputados`, `getDespesasPorParlamentar`).
2. `GovernmentAPI` resolve as chamadas via `fetch` para as APIs oficiais. Em `localhost`, utiliza um CORS proxy de desenvolvimento quando necessário.
3. Para testes/offline, `governmentAPI.loadDespesasFromCSV(text)` parseia CSV e `governmentAPI.useLocalDespesas(array)` injeta dados locais, emitindo `localDespesasUsed`.
4. `PoliticaApp` escuta `localDespesasUsed` e chama `onLocalDespesasApplied(count)`, re-renderizando views.
5. O CI inicia um static server, aguarda fixture `tests/fixtures/despesas.csv`, instala Playwright browsers e executa os E2E.

Exemplo ASCII simples:

```
[Browser/Frontend] --fetch--> [GovernmentAPI wrapper] --http--> [Câmara/Senado/Portal]
        |                                  /
        |-- useLocalDespesas (CSV) ------/
        |                                  
        |-- events: localDespesasUsed --> [PoliticaApp views update]
```

---

## Verificações realizadas
- Testes unitários (Jest) executados localmente: ✅ todos verdes.
- Testes E2E (Playwright) executados localmente com fixture: ✅ todos verdes.
- CI workflow modificado para reduzir falsos negativos (instalação de browsers, espera por fixture, retries de Playwright): mudanças aplicadas.

---

## Riscos identificados
1. Dependência de chave do Portal (`portalKey`) para acesso a `/despesas` em produção — sem chave, `getDespesasPorParlamentar` retornará `{ error: 'API_KEY_MISSING' }`.
2. Em alguns ambientes Node sem `fetch` global, é necessário polyfill (`node-fetch`) se `lib/government-api.js` for executado fora do browser em contextos real.
3. Possíveis formatos CSV inesperados (colunas, separadores) que não são cobertos por todos os parsers — recomenda-se ampliar testes de parsing.
4. Alguns erros são silenciados em try/catch; recomenda-se enviar logs críticos para um serviço de observabilidade em produção.

---

## Recomendações imediatas
- Documentar como configurar `portalKey` e `proxyBase` (variáveis de ambiente / arquivo de configuração do proxy).
- Adicionar polyfill condicional de `fetch` para ambientes Node (ex.: `global.fetch = require('node-fetch')` em scripts de integração).
- Criar 1 teste de integração que verifique explicitamente o caminho CSV -> `useLocalDespesas` -> evento -> `PoliticaApp.onLocalDespesasApplied`.
- Configurar upload de `playwright-report` no CI (já adicionado) e revisar artefatos quando testes falharem.

---

## Passos de QA manuais (rápido)
1. `npm ci`
2. `npx http-server -c-1 -p 8000` (ou `node scripts/_tiny_server.js`)
3. Abrir `http://localhost:8000` e verificar carregamento.
4. Ativar modo dev: `http://localhost:8000/?dev=1` ou `localStorage.setItem('DEV_LOAD','1')` e recarregar.
5. Clicar em "Carregar dados locais" (botão dev) e confirmar banner "Usando dados locais".
6. Abrir modal de candidato e clicar "Ver gastos"; confirmar lista/CSV disponível.

---

## Próximos passos que posso executar
- Adicionar teste Playwright que valida evento `localDespesasUsed` (automatizar passo QA #5).
- Adicionar documentação de configuração do Portal e do Proxy em `DEV.md`.

---

Relatório gerado pelo time de engenharia — disponível para commit no repositório.
