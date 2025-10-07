// Tests for admin endpoints
const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Mock environment
const originalEnv = process.env.ADMIN_TOKEN;
const testToken = 'test-admin-token-12345';

describe('Admin endpoints', () => {
  let app;
  let adminRouter;
  let cache;
  
  beforeAll(() => {
    // Set test admin token
    process.env.ADMIN_TOKEN = testToken;
    
    // Mock cache module
    const cacheFile = path.join(__dirname, '..', 'server', 'cache-test.json');
    cache = {
      CACHE_FILE: cacheFile,
      get: jest.fn(),
      set: jest.fn(),
      invalidate: jest.fn(),
      clear: jest.fn(() => {
        if (fs.existsSync(cacheFile)) {
          fs.writeFileSync(cacheFile, '{}');
        }
      })
    };
    
    jest.mock('../server/cache', () => cache, { virtual: false });
    
    // Create Express app with admin routes
    app = express();
    app.use(express.json());
    
    // Require admin router after mocking
    adminRouter = require('../server/admin');
    app.use('/', adminRouter);
  });
  
  afterAll(() => {
    // Restore original token
    if (originalEnv !== undefined) {
      process.env.ADMIN_TOKEN = originalEnv;
    } else {
      delete process.env.ADMIN_TOKEN;
    }
    
    // Clean up test cache file
    const cacheFile = path.join(__dirname, '..', 'server', 'cache-test.json');
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile);
    }
    
    jest.unmock('../server/cache');
  });
  
  beforeEach(() => {
    // Create empty cache file for tests
    const cacheFile = path.join(__dirname, '..', 'server', 'cache-test.json');
    fs.writeFileSync(cacheFile, JSON.stringify({
      'test:key1': { data: 'value1', storedAt: Date.now(), expiresAt: Date.now() + 10000 },
      'test:key2': { data: 'value2', storedAt: Date.now(), expiresAt: Date.now() + 20000 }
    }, null, 2));
  });
  
  describe('GET /admin/cache', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/admin/cache');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('invalid admin token');
    });
    
    it('returns 401 with wrong token', async () => {
      const res = await request(app)
        .get('/admin/cache')
        .set('x-admin-token', 'wrong-token');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('invalid admin token');
    });
    
    it('returns cache keys with valid token', async () => {
      const res = await request(app)
        .get('/admin/cache')
        .set('x-admin-token', testToken);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('keys');
      expect(res.body).toHaveProperty('count');
      expect(Array.isArray(res.body.keys)).toBe(true);
    });
  });
  
  describe('POST /admin/cache/clear', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).post('/admin/cache/clear');
      expect(res.status).toBe(401);
    });
    
    it('clears all cache with valid token', async () => {
      const res = await request(app)
        .post('/admin/cache/clear')
        .set('x-admin-token', testToken)
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.cleared).toBe('all');
    });
    
    it('clears cache by prefix with valid token', async () => {
      const res = await request(app)
        .post('/admin/cache/clear')
        .set('x-admin-token', testToken)
        .send({ prefix: 'test:' });
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
      expect(res.body.clearedPrefix).toBe('test:');
    });
  });
  
  describe('GET /admin/webhooks', () => {
    it('returns 401 without token', async () => {
      const res = await request(app).get('/admin/webhooks');
      expect(res.status).toBe(401);
    });
    
    it('returns webhook events with valid token', async () => {
      // Create test webhooks file
      const webhooksFile = path.join(__dirname, '..', 'server', 'webhooks.json');
      const testEvents = [
        { receivedAt: new Date().toISOString(), event: { type: 'test', id: 1 } },
        { receivedAt: new Date().toISOString(), event: { type: 'test', id: 2 } }
      ];
      fs.writeFileSync(webhooksFile, JSON.stringify(testEvents, null, 2));
      
      const res = await request(app)
        .get('/admin/webhooks')
        .set('x-admin-token', testToken);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('count');
      expect(res.body).toHaveProperty('events');
      expect(Array.isArray(res.body.events)).toBe(true);
      
      // Clean up
      if (fs.existsSync(webhooksFile)) {
        fs.unlinkSync(webhooksFile);
      }
    });
  });
});
