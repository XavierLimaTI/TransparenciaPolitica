// CSV parser for despesas (robust handling of quoted fields, separators and numeric normalization)
function parseDespesasCSV(text) {
    if (!text) return [];
    // Normalize line endings and trim
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    // Determine delimiter by header sniff (comma or semicolon or tab)
    const headerLine = lines[0];
    let delim = ',';
    const commaCount = (headerLine.match(/,/g) || []).length;
    const semiCount = (headerLine.match(/;/g) || []).length;
    const tabCount = (headerLine.match(/\t/g) || []).length;
    if (semiCount > commaCount && semiCount >= tabCount) delim = ';';
    else if (tabCount > commaCount && tabCount >= semiCount) delim = '\t';

    // Parse header considering quotes
    function splitLine(line) {
        const parts = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i+1] === '"') { cur += '"'; i++; continue; }
                inQuotes = !inQuotes;
                continue;
            }
            if (!inQuotes && ch === delim) {
                parts.push(cur.trim()); cur = ''; continue;
            }
            cur += ch;
        }
        parts.push(cur.trim());
        return parts;
    }

    const header = splitLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9_]/g,''));

    const rows = lines.slice(1).map(line => {
        const parts = splitLine(line);
        const obj = {};
        // if there are more parts than headers, join extras into last header
        if (parts.length > header.length && header.length > 0) {
            const last = parts.slice(header.length - 1).join(delim);
            parts.splice(header.length - 1, parts.length - (header.length - 1), last);
        }
        for (let i = 0; i < header.length; i++) obj[header[i]] = (parts[i] || '').trim();
        return obj;
    });

    const normalized = rows.map(r => {
        // find valor field among common names
        const rawValor = (r.valor || r.valordocumento || r.valor_documento || r.valor_pagamento || r.valorpagamento || r['valor pagamento'] || '0').toString();
        // Keep decimal separator if comma used (e.g., 1.234,56) -> 1234.56
        let cleaned = rawValor.replace(/[^0-9,\.\-]/g, '');
        if (cleaned.indexOf(',') > -1 && cleaned.indexOf('.') > -1) {
            // assume thousand separators are dots and comma is decimal
            cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
        } else if (cleaned.indexOf(',') > -1 && cleaned.indexOf('.') === -1) {
            // comma decimal
            cleaned = cleaned.replace(/,/g, '.');
        } else {
            // only dots -> treat as decimal or integer
            // leave as is
        }
        const valor = Number(cleaned) || 0;
        return {
            dataDocumento: r.data || r.datadoc || r.data_documento || r.data_document || null,
            descricao: r.descricao || r.historico || r.tipo || r.historico || '',
            valor,
            favorecido: r.favorecido || r.nome || r.nome_favorecido || r.fornecedor || '',
            cnpjCpf: r.cpf || r.cnpj || r.cpfcnpj || null,
            origem: r.orgao || r.unidade || r.orgao_origem || null,
            detalhe: r
        };
    });

    return normalized;
}

if (typeof module !== 'undefined' && module.exports) module.exports = { parseDespesasCSV };
