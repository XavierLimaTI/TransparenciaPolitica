# Phase 2 Implementation - Advanced Features

This document details the Phase 2 implementation including webhook invalidation, cache management, retry logic with circuit-breaker, and admin endpoints.

## Features Implemented

### 1. Webhook Cache Invalidation

The system now supports automatic cache invalidation via webhooks. When data is updated in external systems, they can send webhook notifications to invalidate cached entries.

**Endpoint:** `POST /webhooks/receive`

**Payload Examples:**

```json
{
  "type": "deputado.update",
  "id": 123
}
```

This invalidates all cache entries starting with `deputado:123`.

```json
{
  "type": "despesa.update",
  "deputadoId": 123
}
```

This invalidates cache entries starting with `deputado:123:despesas`.

```json
{
  "prefix": "deputado:123"
}
```

Generic prefix-based invalidation.

**Security:** Webhooks can be secured with HMAC SHA256 signatures using the `WEBHOOK_SECRET` environment variable. The signature should be sent in the `x-hub-signature-256` header.

### 2. Enhanced Cache System

The cache system (`server/cache.js`) now includes:

- **TTL-based expiration** - Entries expire after a configurable time
- **Prefix-based invalidation** - `invalidatePrefix(prefix)` to clear multiple related entries
- **Metrics tracking** - Cache hits, misses, and invalidations are logged
- **Persistent storage** - Cache survives server restarts

### 3. Retry Logic with Circuit Breaker

The sync service (`server/sync.js`) implements robust error handling:

- **Exponential backoff retry** - Retries failed requests with increasing delays
- **Circuit breaker** - Stops making requests after multiple failures to prevent cascading failures
- **Configurable thresholds** - `SYNC_FAILURE_THRESHOLD` and `SYNC_COOLDOWN_MS`
- **Metrics collection** - Tracks success/failure rates and response times

### 4. Logging and Metrics

New logging system (`server/logger.js`) provides:

- **Structured JSON logs** - Written to `server/logs.jsonl`
- **Metrics tracking** - Counters for various operations
- **Persistent metrics** - Stored in `server/metrics.json`

### 5. Admin Endpoints

Protected admin endpoints for monitoring and management:

- `GET /admin/cache` - List cache keys and metadata
- `POST /admin/cache/clear` - Clear cache (all or by prefix)
- `GET /admin/webhooks` - View recent webhook events
- `GET /admin/metrics` - View system metrics
- `POST /admin/metrics/reset` - Reset metrics

**Authentication:** All admin endpoints require the `ADMIN_TOKEN` header.

## Environment Variables

Create a `.env` file based on `.env.example`:

```bash
# Admin token for protected endpoints (generate a secure random string)
ADMIN_TOKEN=your-secure-token-here

# Webhook secret for HMAC verification
WEBHOOK_SECRET=your-webhook-secret

# Government API base URLs
BASE_URL_CAMARA=https://dadosabertos.camara.leg.br/api/v2
BASE_URL_SENADO=https://legis.senado.leg.br/dadosabertos

# Sync configuration
SYNC_FAILURE_THRESHOLD=5
SYNC_COOLDOWN_MS=300000

# Server ports
PORT=3001
WEBHOOKS_PORT=3002
```

## Provisioning Secrets

### For Local Development

1. **Generate ADMIN_TOKEN** (PowerShell):
```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$token = [Convert]::ToBase64String($bytes).Replace('=','').Replace('+','-').Replace('/','_')
"ADMIN_TOKEN=$token" | Out-File -Encoding UTF8 -Append .env
Write-Host "Generated token: $token"
```

2. **Set environment variables**:
```powershell
$env:ADMIN_TOKEN = "your-token"
$env:WEBHOOK_SECRET = "your-secret"
```

### For GitHub Actions CI

1. Go to **Settings → Secrets and variables → Actions**
2. Add the following repository secrets:
   - `ADMIN_TOKEN` - Your admin token
   - `WEBHOOK_SECRET` - Your webhook secret
   - `BASE_URL_CAMARA` - Câmara API URL
   - `BASE_URL_SENADO` - Senado API URL

The integration tests workflow (`.github/workflows/integration.yml`) will automatically use these secrets.

### For Production Deployment

Set environment variables in your hosting platform:

**Vercel:**
```bash
vercel env add ADMIN_TOKEN
vercel env add WEBHOOK_SECRET
```

**Heroku:**
```bash
heroku config:set ADMIN_TOKEN=your-token
heroku config:set WEBHOOK_SECRET=your-secret
```

## Running Services

### Start Webhook Receiver
```bash
node server/webhooks.js
# or
npm run start:webhooks
```

### Start Proxy with Admin Endpoints
```bash
node server/proxy.js
# or
npm run start-proxy
```

### Run Sync Once
```bash
node server/sync.js --once
# or
npm run start:sync
```

### Run Sync Continuously
```bash
node server/sync.js --interval=3600000  # Every hour
```

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests (requires live APIs)
```bash
npm run test:integration
```

### Test Webhook Invalidation

**PowerShell:**
```powershell
Invoke-RestMethod -Uri 'http://localhost:3002/webhooks/receive' `
  -Method Post `
  -Body (ConvertTo-Json @{ type='deputado.update'; id=123 }) `
  -ContentType 'application/json'
```

**Bash/curl:**
```bash
curl -X POST http://localhost:3002/webhooks/receive \
  -H "Content-Type: application/json" \
  -d '{"type":"deputado.update","id":123}'
```

### Test Admin Endpoints

```powershell
$token = $env:ADMIN_TOKEN
Invoke-RestMethod -Uri 'http://localhost:3001/admin/metrics' `
  -Headers @{ 'x-admin-token' = $token }
```

## Monitoring

### View Logs
```bash
# Real-time log tail
Get-Content server/logs.jsonl -Wait -Tail 50

# Parse JSON logs
Get-Content server/logs.jsonl | ConvertFrom-Json | Format-Table
```

### View Metrics
```bash
Get-Content server/metrics.json | ConvertFrom-Json
```

### View Recent Webhooks
```bash
Get-Content server/webhooks.json | ConvertFrom-Json
```

## Architecture Overview

```
┌─────────────┐      Webhooks       ┌──────────────┐
│  External   │ ───────────────────> │   Webhooks   │
│   System    │   (invalidation)     │   Service    │
└─────────────┘                      └──────┬───────┘
                                            │
                                            ▼
┌─────────────┐                      ┌──────────────┐
│   Client    │ ───── API Calls ───> │  Proxy/API   │
│  Browser    │ <──── Response ────  │   Server     │
└─────────────┘                      └──────┬───────┘
                                            │
                    ┌───────────────────────┼────────────────┐
                    ▼                       ▼                ▼
             ┌──────────┐          ┌──────────┐      ┌──────────┐
             │  Cache   │          │  Logger  │      │   Sync   │
             │  System  │          │ & Metrics│      │ Service  │
             └──────────┘          └──────────┘      └─────┬────┘
                                                            │
                                                            ▼
                                                   ┌─────────────────┐
                                                   │  Government     │
                                                   │  APIs (Câmara   │
                                                   │  & Senado)      │
                                                   └─────────────────┘
```

## Next Steps

- Set up alerting for circuit breaker events
- Migrate cache to Redis for distributed deployments
- Add database migration scripts for SQLite/PostgreSQL
- Implement admin UI dashboard
- Configure Prometheus/Grafana for metrics visualization
