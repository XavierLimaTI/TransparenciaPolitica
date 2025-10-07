#!/usr/bin/env node
// Comprehensive test script for Phase 2 implementation
const http = require('http');
const https = require('https');

const WEBHOOK_PORT = 3002;
const PROXY_PORT = 3001;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

console.log('🧪 Phase 2 Implementation Test Suite\n');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const lib = options.protocol === 'https:' ? https : http;
    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data), headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function testWebhookService() {
  console.log('📡 Testing Webhook Service (port 3002)...\n');
  
  try {
    // Test health endpoint
    const health = await request({
      hostname: 'localhost',
      port: WEBHOOK_PORT,
      path: '/health',
      method: 'GET'
    });
    console.log('  ✓ Health check:', health.status === 200 ? 'PASS' : 'FAIL');
    
    // Test webhook receive
    const webhook = await request({
      hostname: 'localhost',
      port: WEBHOOK_PORT,
      path: '/webhooks/receive',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({ type: 'test.event', id: 999 }));
    console.log('  ✓ Webhook receive:', webhook.status === 200 ? 'PASS' : 'FAIL');
    
  } catch (err) {
    console.log('  ✗ Webhook service not running. Start with: npm run start:webhooks');
  }
  console.log();
}

async function testAdminEndpoints() {
  console.log('🔐 Testing Admin Endpoints (port 3001)...\n');
  
  if (!ADMIN_TOKEN) {
    console.log('  ⚠️  ADMIN_TOKEN not set. Run: node scripts/generate-admin-token.js');
    console.log('     Then export ADMIN_TOKEN=your-token\n');
    return;
  }
  
  try {
    // Test metrics endpoint
    const metrics = await request({
      hostname: 'localhost',
      port: PROXY_PORT,
      path: '/admin/metrics',
      method: 'GET',
      headers: { 'x-admin-token': ADMIN_TOKEN }
    });
    console.log('  ✓ GET /admin/metrics:', metrics.status === 200 ? 'PASS' : 'FAIL');
    if (metrics.status === 200 && metrics.data.metrics) {
      const m = metrics.data.metrics;
      console.log('    Metrics:', Object.keys(m).length, 'counters');
      Object.keys(m).slice(0, 3).forEach(k => {
        console.log(`      - ${k}: ${m[k]}`);
      });
    }
    
    // Test cache endpoint
    const cache = await request({
      hostname: 'localhost',
      port: PROXY_PORT,
      path: '/admin/cache',
      method: 'GET',
      headers: { 'x-admin-token': ADMIN_TOKEN }
    });
    console.log('  ✓ GET /admin/cache:', cache.status === 200 ? 'PASS' : 'FAIL');
    if (cache.status === 200) {
      console.log('    Cache entries:', cache.data.count || 0);
    }
    
    // Test webhooks endpoint
    const webhooks = await request({
      hostname: 'localhost',
      port: PROXY_PORT,
      path: '/admin/webhooks',
      method: 'GET',
      headers: { 'x-admin-token': ADMIN_TOKEN }
    });
    console.log('  ✓ GET /admin/webhooks:', webhooks.status === 200 ? 'PASS' : 'FAIL');
    if (webhooks.status === 200) {
      console.log('    Webhook events:', webhooks.data.count || 0);
    }
    
  } catch (err) {
    console.log('  ✗ Proxy service not running. Start with: ADMIN_TOKEN=' + ADMIN_TOKEN + ' npm run start-proxy');
  }
  console.log();
}

async function testCacheInvalidation() {
  console.log('🗑️  Testing Cache Invalidation...\n');
  
  if (!ADMIN_TOKEN) {
    console.log('  ⚠️  ADMIN_TOKEN not set. Skipping.\n');
    return;
  }
  
  try {
    // Clear cache with prefix
    const clear = await request({
      hostname: 'localhost',
      port: PROXY_PORT,
      path: '/admin/cache/clear',
      method: 'POST',
      headers: { 
        'x-admin-token': ADMIN_TOKEN,
        'Content-Type': 'application/json'
      }
    }, JSON.stringify({ prefix: 'test:' }));
    console.log('  ✓ POST /admin/cache/clear:', clear.status === 200 ? 'PASS' : 'FAIL');
    if (clear.status === 200) {
      console.log('    Removed entries:', clear.data.removed || 0);
    }
    
  } catch (err) {
    console.log('  ✗ Error:', err.message);
  }
  console.log();
}

async function testRetryLogic() {
  console.log('🔄 Testing Retry Logic...\n');
  
  try {
    const { withRetry } = require('../server/sync');
    
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error('Simulated failure');
      }
      return 'success';
    }, { retries: 3, baseDelay: 50 });
    
    console.log('  ✓ Retry with failure then success:', result === 'success' ? 'PASS' : 'FAIL');
    console.log('    Total attempts:', attempts);
    
  } catch (err) {
    console.log('  ✗ Error:', err.message);
  }
  console.log();
}

async function main() {
  console.log('Starting tests...\n');
  console.log('Prerequisites:');
  console.log('  - Webhook service running on port 3002');
  console.log('  - Proxy service running on port 3001');
  console.log('  - ADMIN_TOKEN environment variable set\n');
  console.log('═'.repeat(60) + '\n');
  
  await testWebhookService();
  await testAdminEndpoints();
  await testCacheInvalidation();
  await testRetryLogic();
  
  console.log('═'.repeat(60));
  console.log('\n✅ Test suite completed!\n');
  console.log('For more details, see PHASE2_IMPLEMENTATION.md\n');
}

main().catch(err => {
  console.error('Error running tests:', err);
  process.exit(1);
});
