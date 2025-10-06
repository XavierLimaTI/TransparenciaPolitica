# DEV - quickstart

Resumo rápido com comandos essenciais para desenvolvimento local.

 1. Instalação

 ```powershell
 npm ci --include=dev
 ```

 1. Iniciar servidor estático

 ```powershell
 # usando npx http-server
 npx http-server -c-1 -p 8000
 # ou python
 python -m http.server 8000
 ```

 1. Testes unitários

 ```powershell
 npm test
 ```

 1. Testes E2E (Playwright)

 ```powershell
 # instalar browsers (uma vez)
 npx playwright install --with-deps

 # rodar todos os e2e
 npx playwright test tests/e2e --reporter=list --workers=1
 ```

 1. Carregar dados locais (no browser Console)

 ```javascript
 await window.initPoliticaApp();
 const res = await fetch('/resources/data/despesas.csv');
 const text = await res.text();
 const parsed = window.governmentAPI.loadDespesasFromCSV(text);
 window.governmentAPI.useLocalDespesas(parsed);
 await window.politicaApp.init?.();
 ```

 1. Scripts úteis

`npm run ingest` - ingest datasets scripts
`npm run start-proxy` - inicia proxy local


