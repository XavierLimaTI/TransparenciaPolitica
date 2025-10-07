// Teste simples para GovernmentAPI (Node)
const assert = require('assert');
const path = require('path');

// Require the module we created
let mod;
try {
    mod = require(path.resolve(__dirname, '..', 'lib', 'government-api.js'));
} catch (e) {
    console.error('Erro ao carregar lib/government-api.js:', e);
    process.exit(2);
}

const GovernmentAPI = mod && mod.GovernmentAPI ? mod.GovernmentAPI : (mod && mod.exports && mod.exports.GovernmentAPI) || mod;
if (!GovernmentAPI) {
    console.error('GovernmentAPI não encontrado no módulo lib/government-api.js');
    process.exit(2);
}

(async () => {
    try {
        const api = new GovernmentAPI();
        const sampleCSV = 'data;descricao;valor;nome\n2024-01-10;"Compra, grande";1.234,56;Fornecedor A\n2024-02-02;Servico;789,00;Fornecedor B';
        const parsed = api.loadDespesasFromCSV(sampleCSV);
        console.log('Parsed', Array.isArray(parsed) ? parsed.length : 0, 'items');
        assert(Array.isArray(parsed), 'Resultado deve ser um array');
        assert(parsed.length === 2, 'Devem ser 2 registros parseados');

        // Test useLocalDespesas and event emission: attach listener
        let eventCount = 0;
        if (typeof global !== 'undefined') {
            // Simulate window dispatch in Node by creating a simple event emitter on global
            if (typeof global.addEventListener !== 'function') {
                global._events = global._events || {};
                global.addEventListener = function(name, cb) { global._events[name] = global._events[name] || []; global._events[name].push(cb); };
                global.dispatchEvent = function(ev) { const list = (global._events && global._events[ev.type]) || []; list.forEach(f => { try { f(ev); } catch(e) { void e; } }); };
            }
        }

        global.addEventListener('localDespesasUsed', (ev) => { eventCount += (ev && ev.detail && ev.detail.count) || 1; });
        api.useLocalDespesas(parsed);
        // give a brief tick for async dispatch
        await new Promise(r => setTimeout(r, 50));
        assert(eventCount >= 1, 'Evento localDespesasUsed deve ser disparado');

        console.log('✅ government-api quick tests passed');
        process.exit(0);
    } catch (err) {
        console.error('❌ Test failed:', err);
        process.exit(3);
    }
})();
