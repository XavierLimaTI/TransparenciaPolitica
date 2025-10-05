CONTRIBUTING / DEV - Política Transparente Brasil

Este documento reúne instruções práticas para desenvolver, testar e contribuir com o projeto localmente e no CI.

1) Ambiente e instalação

- Requisitos mínimos:
  - Node.js v18+
  - npm (vem com Node)
  - (opcional) Python para servidor HTTP: python -m http.server

# CONTRIBUTING / DEV - Política Transparente Brasil

Este documento reúne instruções práticas para desenvolver, testar e contribuir com o projeto localmente e no CI.

1. Ambiente e instalação

- Requisitos mínimos:
  - Node.js v18+
  - npm (vem com Node)
  - (opcional) Python para servidor HTTP: `python -m http.server`

- Instalar dependências (rápido e reprodutível):

```powershell
# na raiz do projeto
npm ci --include=dev
```

1. Servidor local (desenvolvimento)

- Usar http-server (npx) ou Python:

```powershell
npx http-server -c-1 -p 8000
# ou
python -m http.server 8000
```

- Abra no navegador: [http://localhost:8000](http://localhost:8000)

1. Carregar dados locais / CSV

- O projeto já possui fallback local em `resources/data/`.
- Há helpers expostos no browser:
  - `window.governmentAPI` — API de dados
  - `window.initPoliticaApp()` — inicializador async (pode usar `await` no console)

- Exemplo no Console do navegador para carregar um CSV e inicializar a UI:

```javascript
await window.initPoliticaApp();
const res = await fetch('/resources/data/despesas.csv');
const text = await res.text();
const parsed = window.governmentAPI.loadDespesasFromCSV(text);
window.governmentAPI.useLocalDespesas(parsed);
await window.politicaApp.init?.();
```

- Para forçar placeholder E2E (inject) em qualquer ambiente abra:
  - `http://localhost:8000/candidatos.html?e2eTest=1`

1. Testes unitários (Jest)

```powershell
# rodar todos os unit tests
npm test
# rodar apenas jest
npm run test:unit
```

1. Testes E2E (Playwright)

- Instalar browsers (se necessário):

```powershell
npx playwright install --with-deps
```

- Rodar todos os e2e localmente (recomendo um worker para debug):

```powershell
npx playwright test tests/e2e --reporter=list --workers=1
```

- Rodar um spec específico:

```powershell
npx playwright test tests/e2e/portal-key.spec.js --reporter=list --workers=1
```

1. Páginas e fixtures de teste

- Arquivos de suporte para Playwright estão em `scripts/playwright/test-pages/`.
- Testes devem usar essas páginas quando possível para evitar dependência de APIs externas.

1. CI (GitHub Actions)

- O workflow principal está em `.github/workflows/ci.yml`.
- Notas importantes:
  - DevDependencies são instaladas no job (via `npm ci --include=dev`).
  - Há um passo de debug que imprime versões e status de `@playwright/test` antes de rodar os testes.
  - Removemos a instalação fallback do `@playwright/test` depois de runs estáveis.

1. Scripts úteis

- Ingest / ingest local: `npm run ingest` (veja `scripts/` para helpers)
- Start proxy (dev): `npm run start-proxy` (usa `server/proxy.js`)
- Playwright helper runner: `npm run test:playwright` (pode existir um runner custom)

1. Monitoramento de CI (opcional)

- Temos scripts em `scripts/github/` para listar runs e baixar logs.
- Para usá-los defina `GITHUB_TOKEN` no ambiente e execute:

```powershell
$env:GITHUB_TOKEN = 'ghp_xxx...'  # use token com scopes repo
node scripts/github/ci-monitor.js
node scripts/github/download-run-logs.js <run-id>
```

1. Estilo de commits e PRs (curto)

- Use mensagens claras, por exemplo:
  - feat:, fix:, test:, ci:, docs:, refactor:
- Prefira PRs pequenos e com descrição do que muda e por quê.

1. Problemas comuns

- "Cannot find module '@playwright/test'" — certifique-se de que `npm ci --include=dev` foi executado; o CI contém passos para exibir o status do pacote.
- Erros de CORS ao chamar APIs externas em localhost — a API usa fallback para CORS em dev; considerar usar o proxy (`npm run start-proxy`) para testes integrados.

1. Contribuindo

- Abra uma issue descrevendo o problema antes de PRs maiores.
- Para pequenas correções faça um branch, commit e PR apontando para `main`.

---

Se quiser, eu faço um `CONTRIBUTING.md` menor/mais formal ou adiciono uma seção `DEV.md` com comandos resumidos. Diga se prefere versão curta ou detalhada.
