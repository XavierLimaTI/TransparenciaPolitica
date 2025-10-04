// test-api-integration.js - run GovernmentAPI methods in Node to validate integration
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const code = fs.readFileSync(path.resolve(__dirname, '..', 'api-integration.js'), 'utf8');
const sandbox = { console, fetch: require('node-fetch'), module: {}, window: {} };
vm.runInNewContext(code + '\nmodule.exports = GovernmentAPI;', sandbox);
const GovernmentAPI = sandbox.module.exports;

(async () => {
  const api = new GovernmentAPI();
  try {
    console.log('Calling getDeputadosPage...');
    const deps = await api.getDeputadosPage(1, 10);
    console.log('Deputados:', Array.isArray(deps) ? deps.length : deps);
  } catch (e) { console.error('deputados error', e); }

  try {
    console.log('Calling getSenadoresAtuais...');
    const sens = await api.getSenadoresAtuais();
    console.log('Senadores:', Array.isArray(sens) ? sens.length : sens);
  } catch (e) { console.error('senadores error', e); }

  try {
    console.log('Calling getVotacoesCamara...');
    const v = await api.getVotacoesCamara(5);
    console.log('Votacoes:', Array.isArray(v) ? v.length : v);
  } catch (e) { console.error('votacoes error', e); }
})();
