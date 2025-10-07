# Quick Start Guide - Phase 2 Features

This guide provides quick instructions for using the new Phase 2 integration features.

## Prerequisites

- Node.js v18+
- Internet access (for live API tests)
- PowerShell (Windows) or Bash (Linux/macOS)

## 1. Initial Setup

```bash
# Install dependencies
npm ci

# Copy environment template
cp .env.example .env
```

## 2. Generate Admin Token

### Windows (PowerShell)
```powershell
.\scripts\generate-admin-token.ps1
```

### Linux/macOS (Bash)
```bash
openssl rand -base64 32 | tr -d "=+/" | tr -d '\n' > /tmp/token.txt
echo "ADMIN_TOKEN=$(cat /tmp/token.txt)" >> .env
cat /tmp/token.txt  # Save this token!
rm /tmp/token.txt
```

## 3. Run Integration Tests

### Windows (PowerShell)
```powershell
# Set environment variables
$env:BASE_URL_CAMARA = 'https://dadosabertos.camara.leg.br/api/v2'
$env:BASE_URL_SENADO = 'https://legis.senado.leg.br/dadosabertos'

# Run integration tests
npm run test:integration
```

### Linux/macOS (Bash)
```bash
# Run with environment variables inline
BASE_URL_CAMARA='https://dadosabertos.camara.leg.br/api/v2' \
BASE_URL_SENADO='https://legis.senado.leg.br/dadosabertos' \
npm run test:integration
```

### Expected Output

**In sandbox/restricted network environment:**
```
FAIL  __tests__/adapters.camara.live.test.js
  ● FetchError: getaddrinfo ENOTFOUND dadosabertos.camara.leg.br

Test Suites: 2 failed, 2 total
Tests:       3 failed, 2 passed, 5 total
```
This is **expected** if network access is restricted. The test framework is working correctly.

**With internet access:**
```
PASS __tests__/adapters.camara.live.test.js
PASS __tests__/adapters.senado.live.test.js

Test Suites: 2 passed, 2 total
Tests:       5 passed, 5 total
```

## 4. Start Services

### Start Main Proxy Server (with Admin API)
```bash
# Set admin token from .env or directly
export ADMIN_TOKEN=your-token-here
export PORT=3001

# Start server
npm run start-proxy
```

Server runs at: `http://localhost:3001`

### Start Webhook Receiver
```bash
# Optional: set webhook secret
export WEBHOOK_SECRET=your-secret-here
export WEBHOOK_PORT=3002

# Start webhook server
npm run start:webhooks
```

Server runs at: `http://localhost:3002`

## 5. Use Admin Endpoints

All admin endpoints require the `x-admin-token` header.

### List Cache Keys
```bash
curl -H "x-admin-token: YOUR_TOKEN" \
  http://localhost:3001/admin/cache
```

### Clear All Cache
```bash
curl -X POST \
  -H "x-admin-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  http://localhost:3001/admin/cache/clear
```

### Clear Cache by Prefix
```bash
curl -X POST \
  -H "x-admin-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prefix":"deputado:"}' \
  http://localhost:3001/admin/cache/clear
```

### View Webhook Events
```bash
curl -H "x-admin-token: YOUR_TOKEN" \
  http://localhost:3001/admin/webhooks
```

## 6. Send Test Webhook

```bash
# Send update event (will invalidate cache)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "type": "update",
    "resource": "deputado",
    "id": 123
  }' \
  http://localhost:3002/webhooks/receive
```

This will:
1. Save the event to `server/webhooks.json`
2. Automatically invalidate cache for `deputado:123`
3. Invalidate cache for `deputado:123:despesas`

## 7. Run Unit Tests

```bash
# Run all unit tests
npm run test:unit

# Expected: 39/40 passing (1 pre-existing failure)
```

## 8. Test Cache System

```javascript
const cache = require('./server/cache');

// Set a value with 1-hour TTL
cache.set('test:key', { data: 'value' }, 3600000);

// Get value
const data = cache.get('test:key');
console.log(data); // { data: 'value' }

// Invalidate
cache.invalidate('test:key');

// Clear all
cache.clear();
```

## Troubleshooting

### Integration Tests Fail with ENOTFOUND
**Cause:** No network access or DNS resolution issues  
**Solution:** Tests are working correctly; this is expected in restricted environments

### Admin Endpoints Return 401
**Cause:** Missing or incorrect admin token  
**Solution:** Regenerate token with `.\scripts\generate-admin-token.ps1`

### Admin Endpoints Return 403
**Cause:** `ADMIN_TOKEN` not set on server  
**Solution:** Set environment variable and restart server

### Cache Not Invalidating on Webhook
**Cause:** Check webhook event format  
**Solution:** Ensure event has `type`, `resource`, and `id` fields

## Quick Reference

| Task | Command |
|------|---------|
| Install deps | `npm ci` |
| Generate token | `.\scripts\generate-admin-token.ps1` |
| Run unit tests | `npm run test:unit` |
| Run integration tests | `npm run test:integration` |
| Start proxy server | `npm run start-proxy` |
| Start webhook server | `npm run start:webhooks` |
| Start sync once | `npm run start:sync` |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Main server port |
| `ADMIN_TOKEN` | - | Admin API authentication token (required) |
| `BASE_URL_CAMARA` | Official API | Câmara API base URL |
| `BASE_URL_SENADO` | Official API | Senado API base URL |
| `CACHE_DEFAULT_TTL_MS` | 3600000 | Cache TTL (1 hour) |
| `WEBHOOK_PORT` | 3002 | Webhook receiver port |
| `WEBHOOK_SECRET` | - | Webhook HMAC secret (optional) |

## Documentation

- **Full Integration Tests Guide:** `docs/INTEGRATION_TESTS.md`
- **Phase 2 Summary:** `PHASE2_SUMMARY.md`
- **Project Status:** `PHASES_STATUS.md`
- **Contributing:** `CONTRIBUTING.md`

## Support

For issues:
1. Check existing documentation
2. Review error messages
3. Verify environment variables
4. Open a GitHub issue with details

---

**Phase 2 Status:** ✅ COMPLETE  
**Last Updated:** 2025-10-07  
**Branch:** copilot/add-admin-token-generation-script
