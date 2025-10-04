# Comandos úteis do projeto (Windows PowerShell)

Abaixo está uma lista dos comandos mais úteis para desenvolver, rodar e administrar o projeto localmente.

Observação: execute os comandos no diretório do projeto:

```powershell
Set-Location -LiteralPath 'h:\TransparenciaPolitica'
```

## Instalação e build

- Instalar dependências (uma vez):

```powershell
npm install --no-audit --no-fund
```

- Build (gera `dist/` com assets e datasets):

```powershell
npm run build
```

- Servir a build (preview):

```powershell
npm run preview
# ou
npx http-server ./dist -p 8000
```

- Servir os arquivos do repositório na raiz (dev server simples):

```powershell
npm run dev:npm
# ou
npx http-server -c-1 -p 8000
```

## Proxy local (Portal da Transparência)

- Iniciar proxy local (Express):

```powershell
npm run start-proxy
# (inicia server/proxy.js na porta 3001)
```

- Definir a chave do Portal no proxy (persistida server-side):

```powershell
node scripts/post-proxy-key.js "SUA_CHAVE_AQUI"
```

- Remover a chave do proxy:

```powershell
node scripts/unset-proxy-key.js
```

- Verificar proxy (fluxo set/unset/probe):

```powershell
node scripts/verify-proxy.js
```

### Usar armazenamento local (DB)

O proxy agora pode persistir a chave e metadados em um banco local. Duas opções:

- JSON (fallback, padrão): o proxy grava em `server/db.json` automaticamente.
- SQLite (opcional): utilize `better-sqlite3` para um DB local mais robusto.

Ativar SQLite (se você instalou `better-sqlite3`):

```powershell
$env:USE_DB = 'true'
node server/proxy.js
```

Para migrar manualmente uma chave existente de `server/portal_key.json` para o novo armazenamento:

```powershell
node scripts/migrate-key-to-db.js
```


### Endpoints úteis do proxy

- Listar arquivos de dataset disponíveis no servidor (resources/data):

```powershell
curl http://localhost:3001/data-files
```

- Extrair um ZIP já presente em `resources/data` no servidor (POST JSON body: { "path": "20250101_Despesas.zip" }):

```powershell
curl -X POST http://localhost:3001/extract-zip -H "Content-Type: application/json" -d '{"path":"20250101_Despesas.zip"}'
```

## Download e gerenciamento de datasets

- Baixar manualmente um arquivo do Portal (segue redirects):

```powershell
node scripts/download_portal_datasets.js <URL_DO_PORTAL_ZIP_OU_CSV>
```

- Buscar automaticamente alguns datasets (aceita um argumento opcional max):

```powershell
# Ex.: baixar até 20
node scripts/scrape_and_download_portal_datasets.js 20
```

- Os datasets são gravados em `resources/data/`. Durante o build, esses arquivos são copiados para `dist/resources/data/` e um `manifest.json` é gerado para que o frontend os descubra.

## PowerShell helper scripts

- `scripts/start-all.ps1` — inicia proxy e servidor de preview (node + npx http-server)
- `scripts/stop-all.ps1` — tenta parar processos node/npx encontrados
- `scripts/update-data.ps1` — executa o scraper (aceita argumento max) e roda `npm run build`

Por exemplo:

```powershell
.\scripts\start-all.ps1
.\scripts\update-data.ps1 20
.\scripts\stop-all.ps1
```

## Testes

- Teste rápido (smoke test do parser):

```powershell
npm test
# executa scripts/test-csv-parse.js (smoke parser)
```

- Testes unitários (Jest):

```powershell
npm run test:unit
```

## Despesas, drilldown e comandos relacionados

Os recursos de despesas e drilldown são acessados pela UI (abra um candidato e clique em "Ver gastos"). Abaixo seguem comandos e ações úteis para testar e operar esse fluxo localmente.

- Iniciar proxy local (insere header do Portal da Transparência):

```powershell
npm run start-proxy
# ou
node server/proxy.js
```

- Servir a aplicação (dev):

```powershell
npx http-server -c-1 -p 8000
# abra http://localhost:8000/candidatos.html
```

- Salvar uma chave do Portal diretamente na proxy (útil para testes automáticos):

```powershell
node scripts/post-proxy-key.js "SUA_CHAVE_AQUI"
```

- Smoke E2E (inicia proxy + servidor e checa páginas básicas):

```powershell
npm run smoke:e2e
```

- Smoke parser (rápido):

```powershell
npm test
```

- Exportar despesas carregadas (via UI):

  - Abra um candidato → Ver gastos → clicar em "Baixar CSV" (botão no modal).

- Exportar DB / snapshot:

```powershell
node scripts/export-db-to-json.js
```

- Git & release local (tag):

```powershell
# Commit
git add -A
git commit -m "feat: melhorias despesas, drilldown, spinner e testes"
# Criar tag local
git tag v1.1.0
# Enviar para o remoto (se desejar)
git push origin main
git push origin v1.1.0
```

## Admin / UI

- Página admin para gerenciar datasets (pré-visualizar / carregar no app):

  - Após build + preview: abra `http://localhost:8000/admin.html`.
  - A página lista arquivos presentes em `dist/resources/data/` a partir do `manifest.json`.

## Debug e inspeção

- Verificar processo Node e conexões (PowerShell):

```powershell
Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue | Format-Table -AutoSize
Write-Host '--- processes (node) ---'
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Select-Object ProcessId,CommandLine | Format-Table -AutoSize
```

- Parar um processo por Id (ex.: 12345):

```powershell
Stop-Process -Id 12345
```

## Observações finais

- Se você preferir não usar o proxy, faça upload manual dos CSVs via a UI do app (footer) ou coloque os arquivos em `resources/data/` e faça `npm run build` para que fiquem disponíveis na versão `dist/`.
- Arquivos ZIP podem ser extraídos pelo proxy com o endpoint `/extract-zip` ou manualmente; o navegador não descompacta automaticamente.
- Se quiser mais automações, posso (a) migrar a extração de ZIPs para uma biblioteca Node (cross-platform), (b) adicionar mais testes de parser, ou (c) produzir instruções para deploy/CI.

## Exportar DB

- Para exportar o estado atual do DB (SQLite ou JSON fallback) para um arquivo legível `server/db.json.export` execute:

```powershell
node scripts/export-db-to-json.js
```

Isso cria um snapshot dos metadados (`portal_key` e `datasets`) útil para backup ou inspeção.

## Nota sobre migração para SQLite

- Durante esta sessão o projeto detectou um arquivo `server/db.json` e o migrou automaticamente para SQLite (quando `better-sqlite3` está instalado). Como precaução o arquivo original foi renomeado para `server/db.json.migrated`.

- Estado atual recomendado: usar SQLite como fonte de verdade local (mais robusto). O proxy já tenta `better-sqlite3` primeiro e só usa o fallback JSON se SQLite não estiver disponível.

### Como reverter para JSON-only (desaconselhado para dados maiores)

1. Pare o proxy.

2. Apague ou mova `server/data.db` e `server/db.json.migrated` (ou renomeie para `server/db.json` se quiser restaurar o backup).

3. Reinicie o proxy; ele voltará a usar `server/db.json`.

- Como habilitar SQLite (se ainda não instalado):
  - No Windows a forma mais simples é usar WSL/Ubuntu e instalar Node ali, depois executar `npm install` no projeto; outra alternativa é instalar as Visual Studio Build Tools + Python e rodar `npm i better-sqlite3` no PowerShell. Se quiser, eu documentarei o passo a passo no seu ambiente.

Se precisar, eu removo o arquivo `server/db.json.migrated` (após seu OK) ou deixo como backup permanente.
