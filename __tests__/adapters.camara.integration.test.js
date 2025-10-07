// Integration tests for Câmara adapter (mocked network calls)
const camara = require('../lib/adapters/camara');

describe('Camara adapter integration (mocked)', () => {
  beforeAll(() => {
    // Mock global fetch for Node environment
    global.fetch = jest.fn(async (url) => {
      if (url.includes('/deputados')) {
        // Mock response for fetchDeputados
        return {
          ok: true,
          json: async () => ({
            dados: [
              {
                id: 123,
                nome: 'Fulano de Tal',
                siglaPartido: 'ABC',
                siglaUf: 'SP',
                urlFoto: 'http://example.com/photo.jpg',
                email: 'fulano@camara.leg.br'
              },
              {
                id: 456,
                nome: 'Beltrano Silva',
                siglaPartido: 'XYZ',
                siglaUf: 'RJ',
                urlFoto: 'http://example.com/photo2.jpg',
                email: 'beltrano@camara.leg.br'
              }
            ]
          })
        };
      }
      
      if (url.match(/\/deputados\/\d+\/despesas/)) {
        // Mock response for fetchDespesasDeputado
        return {
          ok: true,
          json: async () => ({
            dados: [
              {
                id: 1,
                fornecedor: 'Loja ABC',
                data: '2024-01-01',
                tipo: 'COMBUSTÍVEIS E LUBRIFICANTES',
                valor: '1.234,56'
              },
              {
                id: 2,
                fornecedor: 'Hotel XYZ',
                data: '2024-01-02',
                tipo: 'HOSPEDAGEM',
                valor: '500,00'
              }
            ]
          })
        };
      }
      
      return { ok: false, status: 404, json: async () => ({}) };
    });
  });

  afterAll(() => {
    global.fetch = undefined;
  });

  test('fetchDeputados normalizes data correctly', async () => {
    const deputies = await camara.fetchDeputados();
    
    expect(Array.isArray(deputies)).toBe(true);
    expect(deputies.length).toBe(2);
    expect(deputies[0].nome).toBe('Fulano de Tal');
    expect(deputies[0].partido).toBe('ABC');
    expect(deputies[0].estado).toBe('SP');
    expect(deputies[0].cargo).toBe('Deputado');
  });

  test('fetchDespesasDeputado parses money correctly', async () => {
    const despesas = await camara.fetchDespesasDeputado(123);
    
    expect(Array.isArray(despesas)).toBe(true);
    expect(despesas.length).toBe(2);
    expect(despesas[0].valor).toBeCloseTo(1234.56, 2);
    expect(despesas[1].valor).toBeCloseTo(500.00, 2);
    expect(despesas[0].fornecedor).toBe('Loja ABC');
    expect(despesas[0].tipo).toBe('COMBUSTÍVEIS E LUBRIFICANTES');
  });

  test('parseBrazilianMoney handles different formats', () => {
    expect(camara.parseBrazilianMoney('1.234,56')).toBeCloseTo(1234.56, 2);
    expect(camara.parseBrazilianMoney('1234,56')).toBeCloseTo(1234.56, 2);
    expect(camara.parseBrazilianMoney('1234.56')).toBeCloseTo(1234.56, 2);
    expect(camara.parseBrazilianMoney('R$ 1.234,56')).toBeCloseTo(1234.56, 2);
    expect(camara.parseBrazilianMoney('0')).toBe(0);
    expect(camara.parseBrazilianMoney(null)).toBe(0);
  });
});
