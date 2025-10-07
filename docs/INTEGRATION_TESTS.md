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

## API Documentation

For more details on the official APIs:

- [Câmara dos Deputados API](https://dadosabertos.camara.leg.br/swagger/api.html)
- [Senado Federal API](https://legis.senado.leg.br/dadosabertos/docs/)
