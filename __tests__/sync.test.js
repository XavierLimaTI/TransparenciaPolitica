// Test for server/sync.js
const fs = require('fs');
const path = require('path');

// Mock the adapters before requiring sync
jest.mock('../lib/adapters/camara', () => ({
  fetchDeputados: jest.fn(async () => [
    { id: 1, nome: 'Test Deputy 1', partido: 'ABC', estado: 'SP' },
    { id: 2, nome: 'Test Deputy 2', partido: 'XYZ', estado: 'RJ' }
  ])
}));

jest.mock('../lib/adapters/senado', () => ({
  fetchSenadores: jest.fn(async () => [
    { id: 3, nome: 'Test Senator 1', partido: 'DEF', estado: 'MG' }
  ])
}));

const { syncData } = require('../server/sync');

describe('Sync service', () => {
  const DB_FILE = path.join(__dirname, '..', 'server', 'db.json');
  
  beforeEach(() => {
    // Clean up db.json before each test
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }
  });
  
  afterEach(() => {
    // Clean up after tests
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }
  });

  test('syncData fetches and saves data', async () => {
    const result = await syncData();
    
    expect(result).toBe(true);
    expect(fs.existsSync(DB_FILE)).toBe(true);
    
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    
    expect(data.deputados).toBeDefined();
    expect(data.senadores).toBeDefined();
    expect(data.lastSync).toBeDefined();
    expect(data.deputados.length).toBe(2);
    expect(data.senadores.length).toBe(1);
  });
});
