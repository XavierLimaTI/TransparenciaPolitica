const { parseDespesasCSV } = require('../lib/csv-parser');

test('parses simple semicolon CSV', () => {
    const csv = 'data;descricao;valor;nome\n2024-01-10;"Compra, grande";1.234,56;Fornecedor A\n2024-02-02;Servico;789,00;Fornecedor B';
    const out = parseDespesasCSV(csv);
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBe(2);
    expect(out[0].valor).toBeCloseTo(1234.56, 2);
    expect(out[1].valor).toBeCloseTo(789.00, 2);
    expect(out[0].favorecido).toBe('Fornecedor A');
});

test('parses comma CSV with quoted fields', () => {
    const csv = 'data,descricao,valor,nome\n2024-03-01,"Serviço, extensivo",2500.00,Fornecedor C';
    const out = parseDespesasCSV(csv);
    expect(Array.isArray(out)).toBe(true);
});
