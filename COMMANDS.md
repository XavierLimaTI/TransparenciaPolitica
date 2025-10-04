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
