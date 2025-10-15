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

## DEV - quickstart (Windows PowerShell)

Resumo rápido com comandos essenciais para desenvolvimento e testes locais.

1) Instalar dependências

```powershell
npm ci
```

2) Gerar artefatos CJS usados pelos testes (pretest)

O repositório mantém fontes ESM em `src/`. Para compatibilidade com a suíte atual de testes (Jest) há um passo que gera artefatos CJS usados por testes e por consumidores legados.

```powershell
# roda automaticamente via npm test (pretest)
npm run pretest
# ou manualmente
node scripts/build-test-cjs.js
```

3) Rodar testes unitários (Jest)

```powershell
npm test
# rodar apenas unit tests
npm run test:unit
```

4) Regenerar `lib/` compat (quando atualizar APIs ESM)

```powershell
node scripts/sync-src-to-lib-cjs.js
```

5) Gerar a distribuição (bundle JS + copiar resources + gerar CSS Tailwind)

```powershell
npm run build
```

Observações:
- `npm run build` agora gera também um arquivo `dist/datasets-index` (cópia de `dist/resources/data/index.json`) para facilitar previews com servidores estáticos (ex.: `npx http-server ./dist -p 8001`).
- Se preferir comportamento dinâmico (rota `/datasets-index`, fallback S3, webhook endpoints), rode o proxy `npm run start-proxy` ou `node server/proxy-light.js`.

6) Previews e proxy

- Servidor estático (preview rápido):

```powershell
npx http-server ./dist -p 8001
# abra http://127.0.0.1:8001
```

- Proxy de desenvolvimento (recomendado para comportamento dinâmico):

```powershell
npm run start-proxy
# ou
node server/proxy-light.js
```

7) Ingestão de dados (Portal da Transparência)

```powershell
# Defina a chave do portal (se tiver)
$env:PORTAL_API_KEY = 'SUA_CHAVE_AQUI'

# Baixe um mês e extraia
node scripts/download_portal_monthly.js --start=2025-09-01 --end=2025-09-01 --type=despesas --extract --attempts=3

# Ingerir os CSVs gerados
npm run ingest
```

8) Debug rápido

- Se a UI mostrar "Carregar dados locais" e der erro 404 em `/datasets-index`, rode `npm run build` antes de `http-server`, ou use o proxy.

---

Se quiser, eu posso também:
- Adicionar instruções para Linux/macOS
- Incluir passos para regenerar `lib/` e remover temporariamente as compatibility wrappers (plano de migração)
- Atualizar o `README.md` com um link/trecho deste `DEV.md` (atualmente já há uma nota curta)

## Inspecionar artifacts gerados pelo CI (GitHub Actions)

Quando a pipeline roda no GitHub Actions, os artefatos (por exemplo `smoke-artifacts`, `dist`, `coverage-lcov`) são enviados e ficam disponíveis na página do run. Para inspecionar os artifacts:

- Pelo navegador: abra a página do run (Actions → run do PR) e procure a seção "Artifacts"; clique para baixar.

- Pela linha de comando (requer `gh` CLI autenticada):

```powershell
# listar runs recentes do PR (substitua <owner>/<repo> se necessário)
gh run list --repo XavierLimaTI/TransparenciaPolitica

# baixar o artifact chamado 'smoke-artifacts' do run mais recente
gh run download <run-id> --name smoke-artifacts --repo XavierLimaTI/TransparenciaPolitica -D .\artifacts-download

# inspecionar o conteúdo baixado
Get-ChildItem .\artifacts-download -Recurse | Select-Object FullName, Length
```

Se o workflow já inclui um arquivo de sanity (`artifacts/ci-sanity.txt`) ele será pequeno e fácil de abrir no editor para confirmar que o Jest rodou naquele job.


