const fs = require('fs');
const vm = require('vm');
const path = require('path');

// Minimal CSV parse logic mirroring api-integration.loadDespesasFromCSV
const sample = `data,descricao,valor,nome\n2024-01-10,Compra de material,1234.56,Fornecedor A\n2024-02-01,Serviço prestado,789.00,Fornecedor B`;

function loadDespesasFromCSV(text) {
	if (!text) return [];
	const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
	if (lines.length === 0) return [];
	const header = lines[0].split(/,|;|\t/).map(h => h.trim().toLowerCase());
	const rows = lines.slice(1).map(line => {
		const parts = line.split(/,|;|\t/).map(p => p.trim());
		const obj = {};
		for (let i = 0; i < header.length; i++) {
			obj[header[i]] = parts[i] || '';
		}
		return obj;
	});

	const normalized = rows.map(r => ({
		dataDocumento: r.data || r.datadoc || r.data_documento || r.data_document || null,
		descricao: r.descricao || r.historico || r.tipo || r.historico || '',
		valor: Number((r.valor || r.valor_documento || r.valor_pagamento || '0').replace(/[^0-9\-,\.]/g, '').replace(',', '.')) || 0,
		favorecido: r.favorecido || r.nome || r.nome_favorecido || r.fornecedor || '',
		cnpjCpf: r.cpf || r.cnpj || r.cpfcnpj || null,
		origem: r.orgao || r.unidade || r.orgao_origem || null,
		detalhe: r
	}));

	return normalized;
}

const parsed = loadDespesasFromCSV(sample);
console.log('Parsed', parsed.length, 'items');
console.log(parsed);
