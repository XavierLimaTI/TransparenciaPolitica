# Design da Demo UI — Política Transparente

Objetivo

Criar uma interface moderna, acessível e CSP-safe que permita explorar os datasets publicados em `resources/data` (manifest.json) e visualizar amostras e gráficos simples.

Pontos-chave

- Sem scripts inline críticos (scripts externos em `assets/`)
- Foco em acessibilidade (semântica, aria, contraste)
- UX responsiva com foco em descoberta (lista lateral + painel de preview)

Páginas / Componentes

1. Lista de datasets (sidebar)
   - Entrada: `manifest.json` com estrutura { files: [...] }
   - Saída: lista clicável com label e caminho

2. Painel de Preview
   - Entrada: JSON do dataset (array of objects) ou objeto com `rows`
   - Exibe: amostra (n linhas, selecionável), botão baixar, abrir raw
   - Garante: sanitação ao renderizar (escape de strings)

3. Visualizações
   - Detecta a primeira coluna numérica e plota um gráfico de pizza simples por frequência
   - Fallback para mensagem quando não houver colunas numéricas

Contrato de Dados (contrato mínimo)

- `manifest.json` esperado: { files: [ { csv: 'despesas/2025...', json: 'data/ingested/..', count?: 123 }, ... ] }
- `dataset` carregado: pode ser
  - Array de objetos => rows
  - Objeto { rows: [...] } => rows

Edge cases

- Manifest ausente -> mostrar instruções (rodar `npm run verify:data`)
- Arquivo grande -> mostrar apenas amostra; oferecer download
- Campos com caracteres especiais -> escapados no HTML

Sequência de implementação

1. UI kit leve (index.html + styles + index.js) — já criado em `demo-ui`
2. Melhorias e integração com app principal: migrar componentes progressivamente para `index.html` e `lib/views.js` (adaptar funções de render)
3. Testes: smoke local e Playwright para caminho crítico de carregamento de manifest e preview

Notas operacionais

- Servidor estático usado para testes: `npx http-server -c-1 -p 8001`
- Deploy: pode ser copiado para `gh-pages` ou usado como subpath `/demo-ui/` no Pages

Próximo passo: implementar a versão melhorada do frontend principal com os componentes aprovados aqui e preparar PR incremental.
