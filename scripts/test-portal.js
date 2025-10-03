// Quick test for Portal da Transparência client in api-integration.js
// This script demonstrates behavior when API key is missing.

const fetch = globalThis.fetch || require('node-fetch');

(async () => {
    try {
        const res = await fetch('https://api.portaldatransparencia.gov.br/api-de-dados/despesas?pagina=1&itens=5');
        const text = await res.text();
        console.log('Portal response status:', res.status);
        console.log(text);
    } catch (err) {
        console.error('Error testing portal:', err);
    }
})();
