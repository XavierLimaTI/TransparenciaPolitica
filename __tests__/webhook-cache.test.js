// Integration test for webhook → cache invalidation flow
const cache = require('../server/cache');
const { webhookHandler } = require('../server/webhooks');

describe('Webhook Cache Invalidation', () => {
  beforeEach(() => {
    // Clear cache before each test
    cache.clear();
  });

  test('webhook invalidates cache by deputado ID', () => {
    // Populate cache
    cache.set('deputado:123:info', { name: 'Test Deputado' });
    cache.set('deputado:123:despesas', [{ value: 100 }]);
    cache.set('deputado:456:info', { name: 'Other Deputado' });

    // Verify cache is populated
    expect(cache.get('deputado:123:info')).toBeTruthy();
    expect(cache.get('deputado:123:despesas')).toBeTruthy();
    expect(cache.get('deputado:456:info')).toBeTruthy();

    // Simulate webhook request
    const req = {
      body: {
        type: 'deputado.update',
        id: 123
      },
      headers: {}
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    webhookHandler(req, res);

    // Verify only deputado:123 cache entries were invalidated
    expect(cache.get('deputado:123:info')).toBeNull();
    expect(cache.get('deputado:123:despesas')).toBeNull();
    expect(cache.get('deputado:456:info')).toBeTruthy();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ ok: true });
  });

  test('webhook invalidates cache by prefix', () => {
    // Populate cache
    cache.set('deputado:100:info', { name: 'Test 1' });
    cache.set('deputado:200:info', { name: 'Test 2' });
    cache.set('senador:300:info', { name: 'Test 3' });

    // Simulate webhook request with generic prefix
    const req = {
      body: {
        prefix: 'deputado:'
      },
      headers: {}
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    webhookHandler(req, res);

    // Verify all deputado entries were cleared but senador remains
    expect(cache.get('deputado:100:info')).toBeNull();
    expect(cache.get('deputado:200:info')).toBeNull();
    expect(cache.get('senador:300:info')).toBeTruthy();
  });

  test('webhook handles despesa updates', () => {
    // Populate cache
    cache.set('deputado:789:despesas', [{ value: 100 }]);
    cache.set('deputado:789:info', { name: 'Test' });

    // Simulate despesa update webhook
    const req = {
      body: {
        type: 'despesa.update',
        deputadoId: 789
      },
      headers: {}
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    webhookHandler(req, res);

    // Verify despesas were cleared but info remains
    expect(cache.get('deputado:789:despesas')).toBeNull();
    expect(cache.get('deputado:789:info')).toBeTruthy();
  });

  test('webhook with invalid signature is rejected', () => {
    process.env.WEBHOOK_SECRET = 'test-secret';

    const req = {
      body: {
        type: 'test'
      },
      headers: {
        'x-hub-signature-256': 'invalid-signature'
      }
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    webhookHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'invalid_signature' });

    delete process.env.WEBHOOK_SECRET;
  });
});
