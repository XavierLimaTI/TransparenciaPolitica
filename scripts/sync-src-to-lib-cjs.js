const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'lib');
const outDir = path.join(__dirname, '..', 'lib');

if (!fs.existsSync(srcDir)) {
  console.error('src/lib not found, aborting');
  process.exit(1);
}

const entries = fs.readdirSync(srcDir).filter(f => f.endsWith('.js')).map(f => path.join(srcDir, f));

if (entries.length === 0) {
  console.log('no entries to build');
  process.exit(0);
}

// Ensure outDir exists
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

esbuild.build({
  entryPoints: entries,
  outdir: outDir,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: ['node14'],
  sourcemap: false,
}).then(() => {
  // Post-process generated files to export default if present for legacy requires
  const outFiles = fs.readdirSync(outDir).filter(f => f.endsWith('.js'));
  outFiles.forEach(f => {
    const p = path.join(outDir, f);
    let content = fs.readFileSync(p, 'utf8');
    const marker = '\n// compat: export default -> module.exports\nif (typeof module !== "undefined" && module.exports && module.exports.default) module.exports = module.exports.default;\n';
    if (!content.includes('compat: export default')) {
      fs.appendFileSync(p, marker, 'utf8');
    }
  });
  // Ensure government-api exports named symbols for legacy requires used in tests
  const govPath = path.join(outDir, 'government-api.js');
  if (fs.existsSync(govPath)) {
    let gcontent = fs.readFileSync(govPath, 'utf8');
    const exportMarker = "\n// compat: ensure named exports for GovernmentAPI/DataUpdater\nif (typeof module !== 'undefined' && module.exports) { try { if (!module.exports.GovernmentAPI && typeof GovernmentAPI !== 'undefined') module.exports.GovernmentAPI = GovernmentAPI; if (!module.exports.DataUpdater && typeof DataUpdater !== 'undefined') module.exports.DataUpdater = DataUpdater; } catch (e) {} }\n";
    if (!gcontent.includes('compat: ensure named exports')) {
      fs.appendFileSync(govPath, exportMarker, 'utf8');
    }
    // Also append prototype wrappers for convenience (keeps tests happy)
    const protoMarkerTag = 'compat: ensure government-api prototype wrappers';
    if (!gcontent.includes(protoMarkerTag)) {
      const protoWrapperLines = [
        `// ${protoMarkerTag}`,
        'if (typeof GovernmentAPI !== \"undefined\") {',
        '  try {',
        '    if (!GovernmentAPI.prototype.getDeputado) {',
        '      GovernmentAPI.prototype.getDeputado = async function(id) {',
        '        if (!id) return null;',
        '        const data = await this.fetchData(\'camara\', `/deputados/${id}`);',
        '        if (!data || !data.dados) return null;',
        '        const d = data.dados;',
        '        return { id: d.id, nome: d.nomeCivil || (d.ultimoStatus && d.ultimoStatus.nome) || d.nome, partido: d.ultimoStatus ? d.ultimoStatus.siglaPartido : d.siglaPartido || \"\", estado: d.ultimoStatus ? d.ultimoStatus.siglaUf : d.siglaUf || \"\", foto: (d.ultimoStatus && d.ultimoStatus.urlFoto) || d.urlFoto || null, email: d.email || (d.ultimoStatus && d.ultimoStatus.email) || null, cpf: d.cpf || null, dataNascimento: d.dataNascimento || null, situacao: d.ultimoStatus ? d.ultimoStatus.escolaridade : null, raw: d };',
        '      };',
        '    }',
        '    if (!GovernmentAPI.prototype.getSenadoresAtuais) {',
        "      GovernmentAPI.prototype.getSenadoresAtuais = async function() {",
        "        let data = await this.fetchData('senado', '/senador');",
        "        if (!data || !data.ListaParlamentarEmExercicio) { try { data = await this.fetchData('senado', '/senador/listaParlamentarEmExercicio'); } catch (e) {} }",
        "        if (!data || !data.ListaParlamentarEmExercicio || !data.ListaParlamentarEmExercicio.Parlamentares) return [];",
        '        return data.ListaParlamentarEmExercicio.Parlamentares.Parlamentar.map(senador => ({ id: senador.IdentificacaoParlamentar.CodigoParlamentar, nome: senador.IdentificacaoParlamentar.NomeParlamentar, partido: senador.IdentificacaoParlamentar.SiglaPartidoParlamentar, estado: senador.IdentificacaoParlamentar.UfParlamentar, foto: senador.IdentificacaoParlamentar.UrlFotoParlamentar, email: senador.IdentificacaoParlamentar.EmailParlamentar, cargo: \"Senador\", ideologia: this.classificarIdeologia(senador.IdentificacaoParlamentar.SiglaPartidoParlamentar), dataNascimento: senador.IdentificacaoParlamentar.DataNascimentoParlamentar, situacao: \"Exercício\" }));',
        '      };',
        '    }',
        '    if (!GovernmentAPI.prototype.getVotacoesCamara) {',
        '      GovernmentAPI.prototype.getVotacoesCamara = async function(limit = 20) {',
        "        const data = await this.fetchData('camara', '/votacoes', { ordem: 'DESC', ordenarPor: 'dataHoraRegistro', itens: limit });",
        '        if (!data || !data.dados) return [];',
        '        return data.dados.map(votacao => ({ id: votacao.id, materia: votacao.siglaOrgao || \"Votação\", descricao: votacao.descricao || \"Descrição não disponível\", data: votacao.dataHoraRegistro, resultado: votacao.aprovacao ? \"Aprovada\" : \"Rejeitada\", importancia: this.classificarImportancia(votacao.siglaOrgao), votos: { \"a favor\": votacao.secoes && votacao.secoes[0] && votacao.secoes[0].totalVotosSimulacao || 0, \"contra\": votacao.secoes && votacao.secoes[0] && votacao.secoes[0].totalVotosNaoSimulacao || 0, \"abstencao\": votacao.secoes && votacao.secoes[0] && votacao.secoes[0].totalVotosAbstencaoSimulacao || 0 } }));',
        '      };',
        '    }',
        '    if (!GovernmentAPI.prototype.getDetalhesVotacao) {',
        '      GovernmentAPI.prototype.getDetalhesVotacao = async function(idVotacao) {',
        '        const data = await this.fetchData(\'camara\', `/votacoes/${idVotacao}`);',
        '        if (!data || !data.dados) return null;',
        '        const votacao = data.dados;',
        '        const votosData = await this.fetchData(\'camara\', `/votacoes/${idVotacao}/votos`);',
        '        return { id: votacao.id, materia: votacao.siglaOrgao || \"Votação\", descricao: votacao.descricao || \"Descrição não disponível\", data: votacao.dataHoraRegistro, resultado: votacao.aprovacao ? \"Aprovada\" : \"Rejeitada\", importancia: this.classificarImportancia(votacao.siglaOrgao), votos: { \"a favor\": votosData && votosData.dados ? votosData.dados.filter(v => v.tipoVoto === \"Sim\").length : 0, \"contra\": votosData && votosData.dados ? votosData.dados.filter(v => v.tipoVoto === \"Não\").length : 0, \"abstencao\": votosData && votosData.dados ? votosData.dados.filter(v => v.tipoVoto === \"Abstenção\").length : 0 }, votosIndividuais: votosData && votosData.dados ? votosData.dados.map(v => ({ deputadoId: v.deputado_id, nome: v.deputado_nome, partido: v.deputado_siglaPartido, voto: this.traduzirVoto(v.tipoVoto) })) : [] };',
        '      };',
        '    }',
        '  } catch (e) { /* ignore */ }',
        '}'
      ];
      const protoWrapper = protoWrapperLines.join('\n');
      fs.appendFileSync(govPath, protoWrapper, 'utf8');
    }
  }
  console.log('Synced src/lib -> lib (CJS) with compat wrappers');
}).catch(err => {
  console.error('esbuild error', err);
  process.exit(1);
});
