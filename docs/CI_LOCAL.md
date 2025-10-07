# Reproduzir o CI localmente — Guia detalhado

Este documento descreve como reproduzir localmente, em um ambiente Windows (PowerShell), os passos essenciais que a workflow do GitHub Actions executa para os testes E2E com Playwright.

Objetivo
- Iniciar um servidor estático (porta 8000)
- Iniciar o proxy local (porta 3001)
- Iniciar o receptor de webhooks (porta 3002)
- Rodar o sync inicial que popula `server/db.json`
- Executar os testes Playwright exportando as mesmas variáveis de ambiente usadas em CI

Pré-requisitos
- Node.js 18+ instalado
- npm disponível
- PowerShell (Windows) — os comandos abaixo foram testados em PowerShell
- (Opcional) Playwright browsers serão instalados na primeira execução

Passos rápidos

1. Abrir PowerShell e posicionar na raiz do repositório

```powershell
Set-Location -LiteralPath 'h:\TransparenciaPolitica'
```

2. Instalar dependências

```powershell
npm install --no-audit --no-fund
```

3. Iniciar serviços (estático, proxy, webhooks)

- Iniciar servidor estático (http-server via npm script)

```powershell
npm run dev:npm
```

- Iniciar proxy (script npm) — ou usar proxy leve

```powershell
npm run start-proxy
# ou
# node server/proxy-light.js
```

- Iniciar receptor de webhooks

```powershell
npm run start:webhooks
# ou
# node server/webhooks.js
```

4. Rodar sync inicial (opcional mas recomendado)

```powershell
npm run start:sync
```

5. Executar Playwright com as mesmas variáveis de ambiente do CI

```powershell
$env:BASE_URL='http://127.0.0.1:8000'; $env:PROXY_BASE='http://127.0.0.1:3001'; $env:WEBHOOKS_BASE='http://127.0.0.1:3002'
# Se você tiver PORTAL_KEY
# $env:PORTAL_KEY='sua_chave_aqui'

npx playwright test tests/e2e --reporter=list
```

Dicas e troubleshooting

- Healthchecks: O workflow usa checagens de /health no proxy e nos webhooks antes de iniciar os testes. Localmente, aguarde alguns segundos após iniciar cada serviço ou verifique manualmente:

```powershell
(Invoke-WebRequest -UseBasicParsing -Uri http://127.0.0.1:3001/health).StatusCode
(Invoke-WebRequest -UseBasicParsing -Uri http://127.0.0.1:3002/health).StatusCode
```

- Se Playwright falhar ao instalar browsers, execute `npx playwright install --with-deps`.
- Logs: se estiver usando os scripts do workflow que redirecionam logs para `.proxy.log` e `.webhooks.log`, verifique esses arquivos para mensagens de erro.

Extração do relatório Playwright (artefato HTML)

Quando CI gera o relatório HTML (self-contained), o arquivo `.github/artifacts/index.html` embute um ZIP base64. Para extrair localmente o ZIP e ler `report.json` use o script PowerShell abaixo (ou o script `ci-local.ps1` incluído neste repositório):

```powershell
$html = Get-Content -Path .github\artifacts\index.html -Raw
$m = [regex]::Match($html, 'playwrightReportBase64"[^>]*>data:application/zip;base64,([^<]+)<\/script>')
if(-not $m.Success){ Write-Error 'Base64 tag not found'; exit 1 }
$b64 = $m.Groups[1].Value
$bytes = [Convert]::FromBase64String($b64)
$outZip = '.github\artifacts\playwright-report.zip'
[IO.File]::WriteAllBytes($outZip, $bytes)
Expand-Archive -LiteralPath $outZip -DestinationPath '.github\artifacts\playwright-report'
```

Resultados comuns

- Testes pulados (skipped): geralmente indicam falta da `PORTAL_KEY` no ambiente local/CI.
- Falhas por timeout: aumentar `--timeout` no comando Playwright ou inspecionar logs do proxy/webhooks.

---

Se preferir que eu gere um script automatizado (PowerShell) para executar todos esses passos e coletar logs/relatórios no final, posso criar `scripts/ci-local.ps1` — quer que eu gere o script agora?
