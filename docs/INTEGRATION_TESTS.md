# Integration Tests Documentation

This document describes how to use and run integration tests for the API adapters.

## Overview

The project includes adapters for the official Brazilian government APIs:
- **Câmara dos Deputados** (Chamber of Deputies)
- **Senado Federal** (Federal Senate)

## Running Tests

### Unit Tests (Mocked)

The standard unit tests use mocked network calls and can be run without internet access:

```bash
npm run test:unit
```

These tests verify:
- Data normalization functions
- Money parsing (Brazilian currency format: R$ 1.234,56)
- API response handling

### Integration Tests (Live APIs)

To test against the real government APIs, you need:
1. Internet access to the public APIs
2. Environment variables configured

```bash
# Set environment variables
export BASE_URL_CAMARA='https://dadosabertos.camara.leg.br/api/v2'
export BASE_URL_SENADO='https://legis.senado.leg.br/dadosabertos'

# Run integration tests
npm run test:integration
```

**Note**: The live tests (`*.live.test.js`) are skipped by default in the regular test suite.

## Adapter Usage Examples

### Câmara dos Deputados Adapter

```javascript
const camara = require('./lib/adapters/camara');

// Fetch deputies
const deputados = await camara.fetchDeputados({ 
  itens: 30,  // Number of items
  pagina: 1   // Page number (optional)
});

// Fetch expenses for a specific deputy
const despesas = await camara.fetchDespesasDeputado(deputadoId, {
  itens: 10,
  mes: 1,     // Month (optional)
  ano: 2024   // Year (optional)
});

// Parse Brazilian currency format
const valor = camara.parseBrazilianMoney('R$ 1.234,56');
// Returns: 1234.56
```

### Senado Federal Adapter

```javascript
const senado = require('./lib/adapters/senado');

// Fetch senators
const senadores = await senado.fetchSenadores({
  itens: 81  // Number of items
});
```

## Data Normalization

Both adapters normalize the API responses to a consistent format:

### Deputy/Senator Format
```javascript
{
  id: number,
  nome: string,
  partido: string,
  estado: string,
  foto: string (URL),
  email: string,
  cargo: 'Deputado' | 'Senador',
  raw: object  // Original API response
}
```

### Expense Format
```javascript
{
  id: number,
  fornecedor: string,
  data: string (ISO date),
  tipo: string,
  valor: number,  // Parsed from Brazilian format
  raw: object     // Original API response
}
```

## Configuration

### Cache TTL

Configure the cache time-to-live via environment variable:

```bash
export CACHE_DEFAULT_TTL_MS=3600000  # 1 hour in milliseconds
```

### API Base URLs

Override the default API endpoints:

```bash
export BASE_URL_CAMARA='https://dadosabertos.camara.leg.br/api/v2'
export BASE_URL_SENADO='https://legis.senado.leg.br/dadosabertos'
```

## Troubleshooting

### Network Errors

If you see `ENOTFOUND` errors, check:
1. Internet connection is available
2. DNS can resolve the API domains
3. No firewall blocking the connections

### Timeout Errors

The integration tests have a 30-second timeout. If tests timeout:
1. Check your internet connection speed
2. The government APIs might be slow or down
3. Try running tests during off-peak hours

### Mock vs Live Tests

- **Mocked tests** (`*.integration.test.js`): Always run, use Jest mocks
- **Live tests** (`*.live.test.js`): Skipped unless environment variables are set

## Admin Endpoints

The project includes protected admin endpoints for cache and webhook management.

### Generate Admin Token

**Windows (PowerShell):**
```powershell
.\scripts\generate-admin-token.ps1
```

This will:
1. Generate a secure random token
2. Save it to `.env` file
3. Display the token for your records

**Linux/macOS (Bash):**
```bash
# Generate a secure random token
openssl rand -base64 32 | tr -d "=+/" | tr -d '\n' > /tmp/token.txt
echo "ADMIN_TOKEN=$(cat /tmp/token.txt)" >> .env
echo "Generated token: $(cat /tmp/token.txt)"
rm /tmp/token.txt
```

### Using Admin Endpoints

All admin endpoints require the `x-admin-token` header with your generated token.

#### List Cache Keys
```bash
curl -H "x-admin-token: YOUR_TOKEN" http://localhost:3001/admin/cache
```

Response:
```json
{
  "keys": [
    {
      "key": "deputado:123",
      "storedAt": 1234567890,
      "expiresAt": 1234571490
    }
  ],
  "count": 1
}
```

#### Clear All Cache
```bash
curl -X POST -H "x-admin-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3001/admin/cache/clear
```

Response:
```json
{
  "ok": true,
  "cleared": "all"
}
```

#### Clear Cache by Prefix
```bash
curl -X POST -H "x-admin-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prefix":"deputado:"}' \
  http://localhost:3001/admin/cache/clear
```

Response:
```json
{
  "ok": true,
  "clearedPrefix": "deputado:",
  "count": 5
}
```

#### List Recent Webhook Events
```bash
curl -H "x-admin-token: YOUR_TOKEN" http://localhost:3001/admin/webhooks?limit=50
```

Response:
```json
{
  "count": 100,
  "events": [
    {
      "receivedAt": "2024-01-01T12:00:00.000Z",
      "event": {
        "type": "update",
        "resource": "deputado",
        "id": 123
      }
    }
  ]
}
```

### Webhook Cache Invalidation

When webhooks are received, the system automatically invalidates relevant cache entries:

- **Deputado updates**: Invalidates `deputado:{id}` and `deputado:{id}:despesas`
- **Senador updates**: Invalidates `senador:{id}`
- **Votação updates**: Invalidates `votacao:{id}`
- **Create/delete events**: Invalidates list caches (`deputados:list`, `senadores:list`)

Example webhook payload:
```json
{
  "type": "update",
  "resource": "deputado",
  "id": 123
}
```

### Running the Webhook Server

Start the webhook receiver:
```bash
npm run start:webhooks
```

The server listens on port 3002 by default (configurable via `WEBHOOK_PORT`).

Configure webhook signature verification:
```bash
export WEBHOOK_SECRET=your-webhook-secret
```

## API Documentation

For more details on the official APIs:

- [Câmara dos Deputados API](https://dadosabertos.camara.leg.br/swagger/api.html)
- [Senado Federal API](https://legis.senado.leg.br/dadosabertos/docs/)
