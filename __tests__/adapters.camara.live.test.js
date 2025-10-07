// Integration tests for Câmara adapter (live API calls)
const camara = require('../lib/adapters/camara');

const BASE = process.env.BASE_URL_CAMARA || '';

// Skip tests if BASE_URL_CAMARA is not set
if (!BASE) {
  test.skip('Integration tests for Camara adapter skipped (BASE_URL_CAMARA not set)', () => {});
} else {
  describe('Camara adapter - integration (live)', () => {
    jest.setTimeout(30000); // 30 seconds timeout for network requests

    test('fetchDeputados() returns list and normalizes fields', async () => {
      const deputies = await camara.fetchDeputados({ itens: 5 });
      
      expect(Array.isArray(deputies)).toBe(true);
      expect(deputies.length).toBeGreaterThan(0);
      
      const d = deputies[0];
      expect(d).toHaveProperty('id');
      expect(d).toHaveProperty('nome');
      expect(d).toHaveProperty('partido');
      expect(typeof d.id).toBe('number');
      expect(typeof d.nome).toBe('string');
    });

    test('fetchDespesasDeputado() returns expenses and parses values', async () => {
      // First fetch a deputy to get their ID
      const deputies = await camara.fetchDeputados({ itens: 1 });
      const id = deputies[0].id;
      
      const despesas = await camara.fetchDespesasDeputado(id, { itens: 5 });
      
      expect(Array.isArray(despesas)).toBe(true);
      
      if (despesas.length > 0) {
        const d = despesas[0];
        expect(d).toHaveProperty('valor');
        expect(typeof d.valor).toBe('number');
        expect(d.valor).toBeGreaterThanOrEqual(0);
      }
    });

    test('parseBrazilianMoney correctly parses different formats', () => {
      expect(camara.parseBrazilianMoney('1.234,56')).toBeCloseTo(1234.56, 2);
      expect(camara.parseBrazilianMoney('1234,56')).toBeCloseTo(1234.56, 2);
      expect(camara.parseBrazilianMoney('1234.56')).toBeCloseTo(1234.56, 2);
      expect(camara.parseBrazilianMoney('R$ 1.234,56')).toBeCloseTo(1234.56, 2);
      expect(camara.parseBrazilianMoney('0')).toBe(0);
      expect(camara.parseBrazilianMoney(null)).toBe(0);
    });
  });
}
