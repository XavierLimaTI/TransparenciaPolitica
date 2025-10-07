// Integration tests for Senado adapter (mocked network calls)
const senado = require('../lib/adapters/senado');

describe('Senado adapter integration (mocked)', () => {
  beforeAll(() => {
    // Mock global fetch for Node environment
    global.fetch = jest.fn(async (url) => {
      if (url.includes('/senador/lista/atual')) {
        // Mock response for fetchSenadores
        return {
          ok: true,
          json: async () => ({
            ListaParlamentarEmExercicio: {
              Parlamentares: {
                Parlamentar: [
                  {
                    id: 789,
                    nome: 'Senador Um',
                    partido: 'ABC',
                    uf: 'SP',
                    foto: 'http://example.com/senador1.jpg'
                  },
                  {
                    id: 101,
                    nome: 'Senadora Dois',
                    partido: 'XYZ',
                    uf: 'RJ',
                    foto: 'http://example.com/senador2.jpg'
                  }
                ]
              }
            }
          })
        };
      }
      
      return { ok: false, status: 404, json: async () => ({}) };
    });
  });

  afterAll(() => {
    global.fetch = undefined;
  });

  test('fetchSenadores normalizes data correctly', async () => {
    const senators = await senado.fetchSenadores();
    
    expect(Array.isArray(senators)).toBe(true);
    expect(senators.length).toBe(2);
    expect(senators[0].nome).toBe('Senador Um');
    expect(senators[0].partido).toBe('ABC');
    expect(senators[0].estado).toBe('SP');
    expect(senators[0].cargo).toBe('Senador');
    expect(senators[1].nome).toBe('Senadora Dois');
  });

  test('normalizeSenador transforms raw data correctly', () => {
    const raw = {
      id: 123,
      nome: 'Test Senator',
      partido: 'TEST',
      uf: 'SP',
      foto: 'http://example.com/photo.jpg'
    };
    
    const normalized = senado.normalizeSenador(raw);
    
    expect(normalized.id).toBe(123);
    expect(normalized.nome).toBe('Test Senator');
    expect(normalized.partido).toBe('TEST');
    expect(normalized.estado).toBe('SP');
    expect(normalized.cargo).toBe('Senador');
  });
});
