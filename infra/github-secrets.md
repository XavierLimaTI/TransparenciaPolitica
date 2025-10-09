# GitHub Secrets — template e comandos

Este arquivo lista os secrets usados pelos workflows e scripts do projeto e dá comandos `gh` e PowerShell para adicioná-los de forma segura.

## Lista de secrets (nomes exatos)

- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- S3_BUCKET
- AWS_REGION
- PORTAL_API_KEY
- PROXY_ADMIN_TOKEN
- METRICS_URL
- RESYNC_ENDPOINT
- SLACK_WEBHOOK_URL (opcional)
- ENABLE_S3_UPLOAD (opcional — definir 'true' para ativar upload para S3 nos workflows)

## Valores de exemplo (NUNCA com chaves reais)

```text
AWS_ACCESS_KEY_ID=AKIAEXEMPLO
AWS_SECRET_ACCESS_KEY=EXEMPLOSECRET
S3_BUCKET=meu-bucket-de-dados
AWS_REGION=sa-east-1
PORTAL_API_KEY=abcdef0123456789
PROXY_ADMIN_TOKEN=changeme-local-token
METRICS_URL=https://collector.example/push
RESYNC_ENDPOINT=https://example.com/resync
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T/ID/SECRET
ENABLE_S3_UPLOAD=true
```

## Como adicionar via interface do GitHub

1. Vá em: repo → Settings → Secrets and variables → Actions → New repository secret
2. Cole o nome (por ex. `PORTAL_API_KEY`) e o valor. Salve.

## Como adicionar via `gh` CLI (PowerShell)

Requer: `gh` autenticado (gh auth login)

```powershell
# exemplo para adicionar AWS access key
gh secret set AWS_ACCESS_KEY_ID --body 'AKIA...' --repo XavierLimaTI/TransparenciaPolitica
gh secret set AWS_SECRET_ACCESS_KEY --body 'SECRET' --repo XavierLimaTI/TransparenciaPolitica
gh secret set S3_BUCKET --body 'meu-bucket-de-dados' --repo XavierLimaTI/TransparenciaPolitica
gh secret set AWS_REGION --body 'sa-east-1' --repo XavierLimaTI/TransparenciaPolitica
gh secret set PORTAL_API_KEY --body 'SUA_PORTAL_KEY' --repo XavierLimaTI/TransparenciaPolitica
gh secret set PROXY_ADMIN_TOKEN --body 'TOKEN_SECRETO' --repo XavierLimaTI/TransparenciaPolitica
gh secret set METRICS_URL --body 'https://collector.example/push' --repo XavierLimaTI/TransparenciaPolitica
gh secret set RESYNC_ENDPOINT --body 'https://example.com/resync' --repo XavierLimaTI/TransparenciaPolitica
gh secret set SLACK_WEBHOOK_URL --body 'https://hooks.slack.com/services/T/ID/SECRET' --repo XavierLimaTI/TransparenciaPolitica
```

## Como testar localmente antes de expor em produção

- Expor webhook local com ngrok (requer ngrok instalado):

```powershell
ngrok http 3002
# copie a URL pública fornecida por ngrok
# e use: gh secret set RESYNC_ENDPOINT --body 'https://abcd1234.ngrok.io/resync' --repo ...
```

- Teste rápido do webhook (PowerShell):

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:3002/resync' -Method Post -ContentType 'application/json' -Body (ConvertTo-Json @{ start = '2025-10-01'; dry = $true })
```

- Teste do metrics-exporter:

```powershell
Invoke-RestMethod -Uri 'http://127.0.0.1:9101/increment' -Method Post -ContentType 'application/json' -Body (ConvertTo-Json @{ metric='monthly_success'; value=1 })
Invoke-RestMethod -Uri 'http://127.0.0.1:9101/metrics' -Method Get
```

## Como disparar o workflow manualmente

- Pelo GitHub UI: Actions → selecione `monthly-download` → Run workflow → preencha inputs.

- Via `gh` CLI (se o workflow tem `workflow_dispatch`):

```powershell
gh workflow run monthly-download.yml --repo XavierLimaTI/TransparenciaPolitica
# para ver runs: gh run list --repo XavierLimaTI/TransparenciaPolitica
```

## Boas práticas

- Use um bucket de testes (não aplicar mudanças de lifecycle em buckets de produção sem revisão).
- Prefira `gh secret` ou a UI em vez de commitar chaves em arquivos.
- Use profiles AWS e IAM com permissão mínima (veja `docs/iam-s3-policy.md`).

- A variável `ENABLE_S3_UPLOAD` controla se o workflow mensal fará upload para S3. Por padrão o workflow foi projetado para usar artifacts do GitHub Actions como fallback (mais seguro/sem custos). Defina `ENABLE_S3_UPLOAD=true` apenas se você configurou corretamente `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET` e revisou a política de lifecycle.

- Não comite arquivos grandes (zips/CSV/JSON de dados) no repositório. O fluxo padrão é manter os artefatos localmente e enviar para um bucket S3 quando explicitamente habilitado.

### Executar localmente

Exemplo rápido em PowerShell para baixar e extrair um mês (substitua `PORTAL_KEY_AQUI` se tiver uma chave):

```powershell
$env:PORTAL_API_KEY='PORTAL_KEY_AQUI'
node scripts/download_portal_monthly.js --start=2025-10-01 --end=2025-10-01 --type=despesas --extract
```

Baixar vários meses (ex.: últimos 3 meses) em loop:

```powershell
$env:PORTAL_API_KEY='PORTAL_KEY_AQUI'
$dates = @('2025-08-01','2025-09-01','2025-10-01')
foreach ($d in $dates) { node scripts/download_portal_monthly.js --start=$d --end=$d --type=despesas --extract }
```

Depois de extrair, rodar a ingestão para gerar os JSONs e atualizar o manifest:

```powershell
node scripts/ingest-datasets.js
```

Observações:

- Se não tiver `PORTAL_API_KEY`, o downloader ainda pode funcionar para arquivos públicos, mas alguns endpoints do Portal podem exigir o header `chave-api-dados`.
- Os arquivos baixados ficam em `resources/data/despesas/` e os JSONs gerados em `resources/data/ingested/`.

