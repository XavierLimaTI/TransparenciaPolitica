// Integration tests for Senado adapter (live API calls)
const senado = require('../lib/adapters/senado');

const BASE = process.env.BASE_URL_SENADO || '';

// Skip tests if BASE_URL_SENADO is not set
if (!BASE) {
  test.skip('Integration tests for Senado adapter skipped (BASE_URL_SENADO not set)', () => {});
} else {
  describe('Senado adapter - integration (live)', () => {
    jest.setTimeout(30000); // 30 seconds timeout for network requests

    test('fetchSenadores() returns list and normalizes fields', async () => {
      const senators = await senado.fetchSenadores({ itens: 5 });
      
      expect(Array.isArray(senators)).toBe(true);
      expect(senators.length).toBeGreaterThan(0);
      
      const s = senators[0];
      expect(s).toHaveProperty('id');
      expect(s).toHaveProperty('nome');
      expect(s).toHaveProperty('partido');
      expect(s.cargo).toBe('Senador');
    });

    test('normalizeSenador correctly transforms raw data', () => {
      const raw = {
        id: 123,
        nome: 'Test Senator',
        partido: 'TEST',
        uf: 'SP'
      };
      
      const normalized = senado.normalizeSenador(raw);
      
      expect(normalized.id).toBe(123);
      expect(normalized.nome).toBe('Test Senator');
      expect(normalized.partido).toBe('TEST');
      expect(normalized.estado).toBe('SP');
      expect(normalized.cargo).toBe('Senador');
    });
  });
}
