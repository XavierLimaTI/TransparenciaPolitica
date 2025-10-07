#!/usr/bin/env node

/**
 * Example script demonstrating how to use the API adapters
 * 
 * This script shows how to:
 * - Fetch deputies from Câmara API
 * - Fetch senators from Senado API
 * - Parse Brazilian currency formats
 * - Use the cache system
 * - Run data synchronization
 */

const camara = require('../lib/adapters/camara');
const senado = require('../lib/adapters/senado');
const cache = require('../server/cache');

async function demonstrateAdapters() {
  console.log('=== API Adapters Demo ===\n');

  // Example 1: Parse Brazilian currency
  console.log('1. Brazilian Currency Parsing:');
  const examples = [
    'R$ 1.234,56',
    '1234,56',
    '1.234,56',
    '0',
    null
  ];
  
  examples.forEach(value => {
    const parsed = camara.parseBrazilianMoney(value);
    console.log(`  ${value} → ${parsed}`);
  });
  console.log();

  // Example 2: Data normalization
  console.log('2. Data Normalization:');
  const rawDeputado = {
    id: 123,
    nome: 'João Silva',
    siglaPartido: 'ABC',
    siglaUf: 'SP',
    urlFoto: 'http://example.com/photo.jpg'
  };
  
  const normalized = camara.normalizeDeputado(rawDeputado);
  console.log('  Raw:', JSON.stringify(rawDeputado, null, 2));
  console.log('  Normalized:', JSON.stringify(normalized, null, 2));
  console.log();

  // Example 3: Cache usage
  console.log('3. Cache System:');
  cache.set('example-key', { message: 'Hello, Cache!' }, 5000); // 5 second TTL
  console.log('  Set cache:', cache.get('example-key'));
  
  setTimeout(() => {
    console.log('  After 2 seconds:', cache.get('example-key'));
  }, 2000);
  
  setTimeout(() => {
    console.log('  After 6 seconds (expired):', cache.get('example-key'));
    cache.clear();
    console.log();
    
    // Example 4: Instructions for live API calls
    console.log('4. To test with real APIs:');
    console.log('  export BASE_URL_CAMARA="https://dadosabertos.camara.leg.br/api/v2"');
    console.log('  export BASE_URL_SENADO="https://legis.senado.leg.br/dadosabertos"');
    console.log('  npm run test:integration');
    console.log();
    
    console.log('5. To sync data from APIs:');
    console.log('  npm run start:sync');
    console.log('  # or');
    console.log('  node server/sync.js --once');
    console.log();
    
    console.log('=== Demo Complete ===');
  }, 6500);
}

// Run the demo
if (require.main === module) {
  demonstrateAdapters().catch(console.error);
}

module.exports = { demonstrateAdapters };
