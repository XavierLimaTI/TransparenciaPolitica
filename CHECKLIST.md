# Checklist do Projeto — Política Transparente Brasil

Data: 2025-10-06

Este checklist sumariza o estado atual do projeto, o que já está pronto e as tarefas restantes para tornar o projeto "pronto para produção".

## Itens concluídos

- [x] Servidor estático local disponível em `http://localhost:8080` (http-server)
- [x] Proxy local (`server/proxy-light.js`) rodando em `http://localhost:3001` com endpoints `/camara`, `/senado`, `/despesas`, `/health`, `/set-key` e fallback para dados locais
- [x] Implementado CSV fallback e parser (`GovernmentAPI.loadDespesasFromCSV`, `useLocalDespesas`)
- [x] Extração de código DOM para `lib/views.js` e `lib/politica-app.js`; `main.js` ficou como bootstrap
- [x] Hooks e APIs públicas para desenvolvimento: `window.initPoliticaApp()`, `window.loadLocalFixture()`, evento `localDespesasUsed`, `PoliticaApp.onLocalDespesasApplied(count)`
- [x] Testes unitários (Jest) adicionados e rodando localmente
- [x] Testes E2E (Playwright) adicionados para CSV fallback e fluxos principais — rodando localmente com fixtures
- [x] Fixture determinística `tests/fixtures/despesas.csv` adicionada
- [x] Workflow de CI (`.github/workflows/ci.yml`) ajustado para instalar browsers, aguardar fixtures, aumentar timeouts/retries e gerar relatório HTML do Playwright
- [x] Execução local de testes: Jest (11 suites) e Playwright (E2E) passaram localmente
- [x] Branch e PR com mudanças de feature criados e mesclados em `main`
- [x] Verificação programática do proxy: `http://localhost:3001/camara/deputados?itens=10` retornou deputados reais

## Itens em andamento

- [ ] Atualizar documentação de execução local (README) — documentação parcial existente; consolidar passos para rodar servidor, proxy e carregar fixture local (IN-PROGRESS)

## Itens pendentes (prioridade média/alta)

- [ ] Gerenciar portalKey com segurança para produção (CI secrets, storage seguro para proxy)
- [ ] Remover/condicionar hooks de desenvolvimento para não aparecerem em produção (feature flags ou build-time removals)
- [ ] Adicionar testes de integração que validem rota `/despesas` via proxy com `portalKey` (usar segredo seguro em CI)
- [ ] Adicionar smoke-checks na CI para verificar `/health` do proxy e garantir upload de `playwright-report/` em falhas
- [ ] Automatizar E2E que abre a UI e clica no botão "Carregar dados locais" (Playwright headless)
- [ ] Limpeza de código: remover logs, arquivos temporários e adicionar lint/format se necessário

- [x] Limpeza de arquivos temporários e logs (.tmp, .httpserver.log, .proxy.log) e atualização de .gitignore
- [x] Playwright config ajustado para ler BASE_URL do env; workflow de CI melhorado para exportar BASE_URL e PROXY_BASE, usar nohup/logs/pids e upload do relatório
- [ ] Adicionar checks de qualidade: acessibilidade (axe), performance (Lighthouse) e corrigir problemas críticos
- [ ] Definir pipeline de deploy/produção (build, migração de dados, configuração do proxy em produção)

## Notas e recomendações

- O proxy local já lida com fallback para dados locais quando a `portalKey` não está disponível ou quando upstream falha.
- A UI depende da ordem de carregamento dos scripts; a injeção manual por Playwright exige atenção (alguns arquivos são CommonJS e esperam `require`). No navegador normal, a ordem do HTML funciona corretamente.
- Recomendo priorizar: 1) Documentação e scripts de desenvolvimento (README), 2) Automatizar E2E que carregam fixture via UI, 3) CI integration para `portalKey` e smoke-checks.

---


