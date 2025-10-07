// Test for server/cache.js
const fs = require('fs');
const path = require('path');
const cache = require('../server/cache');

describe('Cache module', () => {
  beforeEach(() => {
    // Clear cache before each test
    cache.clear();
  });

  afterEach(() => {
    // Clean up cache file
    cache.clear();
  });

  test('set and get cache entries', () => {
    cache.set('test-key', { data: 'test value' });
    const result = cache.get('test-key');
    
    expect(result).toEqual({ data: 'test value' });
  });

  test('returns null for non-existent keys', () => {
    const result = cache.get('non-existent');
    expect(result).toBeNull();
  });

  test('expires entries after TTL', (done) => {
    cache.set('expire-test', { data: 'will expire' }, 100); // 100ms TTL
    
    // Should exist immediately
    expect(cache.get('expire-test')).toEqual({ data: 'will expire' });
    
    // Should be null after expiration
    setTimeout(() => {
      expect(cache.get('expire-test')).toBeNull();
      done();
    }, 150);
  });

  test('invalidate removes specific entry', () => {
    cache.set('key1', { data: 'value1' });
    cache.set('key2', { data: 'value2' });
    
    cache.invalidate('key1');
    
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toEqual({ data: 'value2' });
  });

  test('clear removes all entries', () => {
    cache.set('key1', { data: 'value1' });
    cache.set('key2', { data: 'value2' });
    
    cache.clear();
    
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  test('persists to disk', () => {
    cache.set('persist-test', { data: 'persisted' });
    
    // Check that cache.json was created
    expect(fs.existsSync(cache.CACHE_FILE)).toBe(true);
    
    // Read the file and verify content
    const content = JSON.parse(fs.readFileSync(cache.CACHE_FILE, 'utf8'));
    expect(content['persist-test']).toBeDefined();
    expect(content['persist-test'].data).toEqual({ data: 'persisted' });
  });
});
