// Quick test for GovernmentAPI.getDeputadosPage
// Run with: node scripts/test-camara.js

const fetch = globalThis.fetch || require('node-fetch');

async function test() {
    try {
        const res = await fetch('https://dadosabertos.camara.leg.br/api/v2/deputados?pagina=1&itens=5', {
            headers: { 'Accept': 'application/json' }
        });

        if (!res.ok) {
            console.error('HTTP error', res.status);
            process.exit(1);
        }

        const data = await res.json();
        console.log('Received', (data && data.dados && data.dados.length) || 0, 'items');
        console.log(data.dados.map(d => ({ id: d.id, nome: d.nome, partido: d.siglaPartido, uf: d.siglaUf })));
    } catch (err) {
        console.error('Fetch error', err);
        process.exit(1);
    }
}

test();
