# Política Transparente Brasil

[![CI](https://github.com/XavierLimaTI/TransparenciaPolitica/actions/workflows/ci.yml/badge.svg)](https://github.com/XavierLimaTI/TransparenciaPolitica/actions/workflows/ci.yml)
[![Codecov](https://codecov.io/gh/XavierLimaTI/TransparenciaPolitica/branch/main/graph/badge.svg?token=)](https://codecov.io/gh/XavierLimaTI/TransparenciaPolitica)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

## Descrição

Plataforma web inovadora dedicada à transparência política brasileira, permitindo que eleitores consultem informações detalhadas sobre candidatos, seus votos em matérias importantes da Câmara e Senado, e tomem decisões conscientes para as eleições de 2026.

<!-- CI trigger: update README to re-run CI smoke -->

## Status do Projeto (resumo rápido)

- Branch atual: `infra/add-s3-lifecycle-and-secrets-docs`
- Última atualização: 08/10/2025
- Progresso estimado: 65% completo

Principais entregas já realizadas:

- Fase 1 (MVP): concluída — UI, busca, perfis, votações e visualizações implementadas.
- Ingestão local de dados: scripts e fixtures incluídos; `resources/data/ingested/despesas.json` disponível para desenvolvimento.
- Auto-load de dados locais: `main.js` agora detecta `resources/data/ingested/despesas.json` e injeta os dados no app sem necessidade de `PORTAL_API_KEY`.
- Proxy de desenvolvimento + webhook-resync + metrics exporter: servidores auxiliares implementados e testados localmente.

Itens pendentes (Fase 2 - Integração com Dados Reais):

- Integração completa com o Portal da Transparência (requer `PORTAL_API_KEY`)
- Workflow mensal: ajustar para upload-artifact por padrão e tornar S3 opcional (pendente)
- Validar e documentar procedimento para resync mensal e alertas/monitoramento

Próximos passos recomendados (curto prazo):

1. Escolher se quer armazenar datasets mensais em S3 (requer credenciais) ou manter artifacts do GitHub Actions. Se optar por S3, eu posso ajustar o workflow e aplicar o Terraform opcional.
2. Executar testes de integração com `PORTAL_API_KEY` quando disponível.
3. Documentar plano de manutenção de dados (retention policy / lifecycle) e possíveis custos.

## Publicação automática dos dados ingeridos (GitHub Pages)

Para evitar custos com infraestrutura externa você pode usar o GitHub Pages para hospedar os JSONs gerados pelo pipeline de ingestão. Os dados publicados ficam disponíveis publicamente em uma URL estática e o frontend pode consumi-los diretamente.

- URL pública (padrão):

  https://<OWNER>.github.io/<REPO>/data/

  Exemplo para este repositório:

  https://XavierLimaTI.github.io/TransparenciaPolitica/data/

- Como o app usa essa URL:

  1. O pipeline de ingest gera `resources/data` contendo os arquivos JSON e `manifest.json`.
  2. O workflow `publish-gh-pages.yml` copia `resources/data` para a branch `gh-pages` e publica o conteúdo em `/data/`.
  3. O frontend pode apontar para `https://<OWNER>.github.io/<REPO>/data/manifest.json` para localizar os arquivos ingeridos.

- Automatizando atualizações (opções):

  1. Agendamento mensal (recomendado para produção): já existe o workflow `monthly-download.yml` que roda no dia 1 de cada mês. Ele baixa, gera metadados e pode enviar artifacts ou fazer upload opcional para S3/GCS.
  2. Agendamento diário/weekly (para ambientes de teste ou atualizações frequentes): adicione um workflow agendado para reexecutar o pipeline de ingest e publicar em GitHub Pages (o repositório já contém um workflow de publicação manual `publish-gh-pages.yml`).
  3. Dispatch manual: você pode disparar `publish-gh-pages.yml` ou o novo workflow agendado manualmente via Actions → Run workflow.

- Permissões necessárias:

  - Para que a publicação automática para `gh-pages` funcione o token usado pelo workflow precisa de permissão de escrita (Settings → Actions → General → Workflow permissions → "Read and write permissions"). O workflow já detecta e avisa caso não tenha permissão.

- Como reexecutar localmente (PowerShell):

```powershell
# executar downloader + ingest localmente
$env:PORTAL_API_KEY = 'SUA_CHAVE_AQUI'

# baixar mês anterior (exemplo)
node scripts/download_portal_monthly.js --start=$(Get-Date -Day 1).AddMonths(-1).ToString('yyyy-MM-01') --end=$(Get-Date -Day 1).AddMonths(-1).ToString('yyyy-MM-01') --type=despesas --extract

# gerar ingest
node scripts/ingest-datasets.js || npm run ingest

# copiar para a pasta de publicação local (opcional)
# cp -r resources/data gh-pages-temp/data
# abra a URL do GitHub Pages quando publicado: https://<OWNER>.github.io/<REPO>/data/
```

Se quiser que eu adicione um workflow agendado diário/weekly que execute o pipeline de ingest e publique automaticamente para o GitHub Pages, eu já criei um workflow de exemplo no repositório: `.github/workflows/scheduled-ingest-publish.yml`. Ele roda por schedule (diário/weekly/monthly) e também permite `workflow_dispatch` para disparo manual.

Como reproduzir o ambiente de desenvolvimento e testes rápidos:

```powershell
# instalar dependências (se necessário)
npm install

# servidor estático simples (usa Python embutido)
npm run dev

# servidor http (alternativa via npm)
npm run start:npm

# iniciar proxy de desenvolvimento (opcional)
npm run start-proxy

# iniciar collector de métricas local
npm run start:metrics

# rodar smoke e2e (proxy + servidor estático + checagens básicas)
npm run smoke:e2e

# rodar suíte rápida de smoke tests (CSV parsing, API quick checks)
npm run test:smoke

# rodar todos os testes unitários (Jest)
npm test
```

Se quiser que eu faça alguma dessas tarefas agora (ex.: ajustar workflow para artifacts-only, aplicar Terraform example, ou rodar testes contra o Portal ao fornecer `PORTAL_API_KEY`), diga qual opção prefere.

## HOWTO rápido — baixar e ingerir dados do Portal (local)

Se você quiser executar o downloader mensal e ingerir os CSVs localmente para desenvolvimento, siga estes passos (PowerShell):

```powershell
# (1) Defina a variável de ambiente com sua chave do Portal (opcional — sem chave o downloader fará check e pode pular).
$env:PORTAL_API_KEY = 'SUA_CHAVE_AQUI'

# (2) Baixe arquivos mensais (ex.: 20250501). Use --extract para extrair os zips localmente
npm run download:portal-monthly -- --from=20250501 --to=20250501 --extract

# (3) Ingerir os CSVs em JSON e atualizar o manifest
npm run ingest

# (4) Inicie o servidor estático e abra o app
npm run start:npm

# (5) Abra http://127.0.0.1:8000 e use o footer "Carregar últimos N meses" para carregar os dados locais
```

Veja também `infra/github-secrets.md` para instruções sobre onde guardar segredos e como configurar o CI para uploads S3 opcionais.

## Funcionalidades Principais

### 🔍 Sistema de Busca Avançada


### 👥 Perfil de Candidatos


### 🗳️ Votações Detalhadas


### 📊 Dashboard Interativo


## Tecnologias Utilizadas

### Frontend
- **Anime.js** - Animações suaves
- **Font Awesome** - Ícones vetoriais


### Design
- **Cores inspiradas na bandeira brasileira**
- **Tipografia elegante**: Playfair Display + Inter
- **Design responsivo** - Mobile-first
- **Animações sutis** - Melhor UX

## Estrutura do Projeto

```text
/
├── index.html          # Página inicial com dashboard
├── candidatos.html     # Página de candidatos com filtros
├── votacoes.html       # Página de votações e análises
├── sobre.html          # Sobre o projeto e contato
├── main.js            # JavaScript principal com todas as funcionalidades
├── resources/         # Imagens e assets
│   ├── hero-bg.png           # Background hero
│   └── politician-avatars.png # Avatares dos candidatos
├── design.md          # Documentação do design
├── interaction.md     # Documentação das interações
├── outline.md         # Estrutura do projeto
└── README.md          # Este arquivo
```


## Funcionalidades Implementadas

### ✅ Sistema de Busca
- Busca textual em tempo real
- Filtros múltiplos combináveis
- Ordenação por diferentes critérios
- Contadores de resultados


### ✅ Perfil de Candidatos
- Cards informativos com hover effects
- Sistema de favoritos (localStorage)
- Modal detalhado com histórico completo
- Classificação por ideologia e partido


### ✅ Votações
- Timeline cronológica
- Resultados por candidato
- Visualização de importância
- Análises contextuais


### ✅ Visualizações de Dados
- Gráficos de pizza (distribuição por partido)
- Gráficos de barras (resultados de votações)
- Gráficos de linha (tendências temporais)
- Estatísticas em tempo real

### ✅ Design Responsivo

- Layout mobile-first
- Breakpoints otimizados
- Navegação adaptativa
- Touch-friendly interface

## Como Usar

1. **Buscar Candidatos**: Use a barra de pesquisa principal ou acesse a página de candidatos para filtros avançados
2. **Explorar Votações**: Veja as votações recentes e como cada candidato se posicionou
3. **Analisar Dados**: Explore os gráficos interativos e estatísticas
4. **Favoritar**: Marque candidatos para acompanhar (os dados são salvos localmente)

## Proxy de Desenvolvimento (local)

Para rodar o proxy local recomendado (oferece rotas administrativas e fallback):

```powershell
npm install
npm run start-proxy
```

Se preferir uma alternativa sem dependências, há um proxy leve em `server/proxy-light.js` que pode ser executado com:

```powershell
node server/proxy-light.js
```

Nota sobre preview estático
--------------------------

Ao executar `npm run build` o processo agora gera um arquivo adicional `dist/datasets-index` (sem extensão). O frontend tenta primeiro `/datasets-index` durante a inicialização — essa rota é normalmente fornecida pelo proxy de desenvolvimento. O arquivo `dist/datasets-index` existe para que previews estáticos (por exemplo com `npx http-server ./dist -p 8001`) também possam exibir o índice de datasets sem erro 404.

Se você prefere comportamento dinâmico (ex.: fallback para S3 ou rota administrativa), use o proxy (`npm run start-proxy` ou `node server/proxy-light.js`).

## Dados de Demonstração

O projeto inclui dados simulados de:
- **Projetos e promessas** de campanha
## Demo rápido & PR

Se quiser testar rapidamente o fluxo de ingestão local sem fornecer `PORTAL_API_KEY`, há um demo pronto neste branch:

- Branch: `feat/demo-loader`
- Pull request aberto: https://github.com/XavierLimaTI/TransparenciaPolitica/pull/18

Passos rápidos:

1. Na raiz do repositório execute:

```powershell
npx http-server -c-1 -p 8000
Start-Process http://127.0.0.1:8000
```

2. Abra http://127.0.0.1:8000 no navegador e clique no botão "Carregar demo (despesas)".

3. Para validar automaticamente, execute o teste Playwright previsto no branch:

```powershell
npx playwright test scripts/playwright/load-demo.spec.js
```

Notas:

- O demo carrega `resources/data/despesas.json` e dispara o evento `localDespesasUsed` para integrar os dados à UI.
- Arquivos placeholder foram movidos (ou podem ser movidos) para `resources/data/samples/` para deixar claro que são exemplos locais.

## Características Técnicas

### Performance
- Carregamento otimizado de imagens
- JavaScript modular e organizado
- CSS minificado via CDN
- Animações otimizadas para performance

### Acessibilidade
- Contraste de cores adequado
- Fontes legíveis e tamanhos apropriados
- Estrutura semântica HTML5
- Navegação por teclado

### SEO
- Meta tags otimizadas
- Estrutura semântica
- URLs amigáveis
- Descrições relevantes

## Próximas Etapas (Roadmap)

### Fase 1 - MVP Completo ✅
- [x] Estrutura básica do webapp
- [x] Sistema de busca e filtros
- [x] Perfis de candidatos
- [x] Página de votações
- [x] Visualizações de dados

### Fase 2 - Integração com Dados Reais
- [ ] Integração com APIs oficiais do Congresso
- [ ] Atualização automática de dados
- [ ] Sistema de cache para performance
- [ ] Webhooks para atualizações em tempo real

### Fase 3 - Funcionalidades Avançadas
- [ ] Sistema de alertas e notificações
- [ ] Comparação lado a lado de candidatos
- [ ] Análises preditivas
- [ ] Gamificação para engajamento

### Fase 4 - Comunidade e Colaboração
- [ ] Sistema de avaliação de candidatos
- [ ] Comentários e discussões
- [ ] Compartilhamento em redes sociais
- [ ] API pública para desenvolvedores

## Contribuindo

Este é um projeto de código aberto dedicado à transparência política no Brasil. Contribuições são bem-vindas!

### Como Contribuir
1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

### Tipos de Contribuição
- 🐛 Correção de bugs
- ✨ Novas funcionalidades
- 📚 Documentação
- 🎨 Melhorias de design
- 📊 Análises de dados

## Testes de Integração (APIs reais)

Há alguns scripts de teste rápidos que executam chamadas às APIs públicas (Câmara, Portal da Transparência). Para facilitar, existe o script npm `test:integration` que roda os checks conhecidos.

## Integração contínua (GitHub Actions)

Este repositório inclui um workflow de CI em `.github/workflows/ci.yml` que executa os testes unitários em pushes e pull requests para `main`.

Além disso existe um job de integração "live" que roda verificações contra APIs reais. Por segurança este job só é executado automaticamente se o segredo `PORTAL_API_KEY` estiver definido no repositório, ou pode ser disparado manualmente via a aba Actions > CI > Run workflow.

Como configurar os segredos usados pelo workflow:

- `PORTAL_API_KEY` — chave de acesso ao Portal da Transparência. Se definida no repositório, o job de integração será executado automaticamente após os testes unitários.
- `PROXY_ADMIN_TOKEN` — token opcional usado pelo runner se o proxy exigir autenticação administrativa.

### Upload opcional para S3 (dados mensais)

O workflow mensal (`.github/workflows/monthly-download.yml`) agora gera checksums SHA256 e um arquivo `metadata.json` dentro do diretório do dataset (por exemplo `resources/data/despesas/metadata.json`).

Se você quiser armazenar os datasets mensalmente em um bucket S3, adicione os seguintes secrets no repositório (Settings → Secrets and variables → Actions):

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `S3_BUCKET` (nome do bucket, ex.: `meu-bucket-dados`)
- `AWS_REGION` (opcional, ex.: `sa-east-1`)

Quando esses secrets estiverem presentes, o workflow fará upload recursivo do diretório `resources/data/despesas/` para `s3://<S3_BUCKET>/datasets/<YYYY-MM-DD>/` (onde `<YYYY-MM-DD>` é o mês processado). Se os secrets não estiverem definidos, o workflow mantém o comportamento anterior e envia os arquivos como artifact do GitHub Actions.

Formato do `metadata.json` gerado:

```json
{
  "month": "2025-09-01",
  "type": "despesas",
  "files": [
    { "name": "20250901_despesas.zip", "path": "resources/data/despesas/20250901_despesas.zip", "sha256": "...", "size": 123456 }
  ],
  "runner": "ubuntu-latest",
  "timestamp": 1693526400
}
```

Como testar o workflow manualmente:

1. Vá em Actions → Monthly Portal Download → Run workflow (workflow_dispatch).
2. Se quiser testar upload para S3, adicione temporariamente os secrets citados acima no repositório (ou utilize um bucket de teste).
3. Inspecione os artefatos (se não houver S3) ou verifique o bucket S3 para o prefixo `datasets/<YYYY-MM-DD>/`.

Observação de segurança: prefira criar um usuário IAM com permissões restritas ao bucket (s3:PutObject, s3:PutObjectAcl, s3:ListBucket) e prazo de validade curto para chaves de teste.

### Deduplicação e índice central (index.json)

O workflow mensal agora tenta evitar uploads duplicados. Antes de enviar o dataset ele verifica se o arquivo `despesas_<YYYY-MM-DD>.tar.gz` já existe em `s3://<S3_BUCKET>/datasets/<YYYY-MM-DD>/`. Se o arquivo já existir, o workflow pula o upload recursivo do diretório e não sobrescreve o objeto existente.

Além disso, o workflow atualiza um arquivo central `datasets/index.json` no bucket contendo um índice com metadados (mês, arquivos, checksums, tamanhos). Esse índice é útil para consultas e para checar quais meses já foram processados.

Como forçar reupload ou atualizar um mês existente:

1. Acesse o bucket S3 e remova o objeto `s3://<S3_BUCKET>/datasets/<YYYY-MM-DD>/despesas_<YYYY-MM-DD>.tar.gz` (ou renomeie-o).
2. Reexecute o workflow (Actions → Monthly Portal Download → Run workflow). O workflow detectará a ausência do arquivo e fará upload do dataset e do archive.

Observação: o passo de atualização do `index.json` usa `aws s3 cp` para baixar/enviar o arquivo e substitui a entrada do mês no índice.

## Serviços auxiliares locais

1. Metrics exporter (Prometheus style)

Start local metrics exporter to collect simple counters:

```powershell
npm run start:metrics
# or: node tools/metrics-exporter.js
```

It exposes `/metrics` and a simple JSON endpoint `/increment` that accepts `{ "metric": "monthly_success", "value": 1 }`.

2. Webhook resync

Start the webhook consumer which listens on port 3002 by default:

```powershell
npm run start:webhook-resync
# or: node server/webhook-resync.js
```

POST `{ "start": "2025-09-01" }` to `/resync` to trigger a downloader run for that month.

3. Proxy endpoint for datasets index

During local development the proxy exposes `/datasets-index` which will return a local `resources/data/despesas/index.json` or `resources/data/index.json` if present. If not present and `S3_BUCKET` is defined in environment, the proxy will attempt to fetch `s3://<S3_BUCKET>/datasets/index.json` via AWS CLI.

4. Terraform lifecycle example

See `infra/terraform-s3-lifecycle/README.md` for a simple Terraform module that applies lifecycle rules to the `datasets/` prefix.

## Métricas (opcional)

O workflow pode enviar métricas para um collector simples. Para usar:

1. Rode localmente `npm run start:metrics` para iniciar o collector (porta 9101 por padrão).
2. Adicione um secret chamado `METRICS_URL` com o valor `http://<host>:9101` (ou um endpoint público).
3. O workflow `monthly-download.yml` enviará POSTs para `${METRICS_URL}/increment` com JSON `{ "metric": "monthly_success", "value": 1 }` ou `{ "metric": "monthly_failed", "value": 1 }` conforme o caso.




Passos para adicionar segredos (no GitHub):

### Tornar o job "SQLite CI" obrigatório em PRs (opcional)

O workflow `SQLite CI (optional)` agora pode ser executado em `pull_request` (além de `push`) quando o secret `ENABLE_SQLITE_CI` estiver definido como `true` ou se for disparado manualmente. Se você quiser que este job seja um check obrigatório em todas as Pull Requests do branch `main`, siga estes passos:

1. Vá em Settings → Branches → Branch protection rules.
2. Clique em "Add rule" ou edite a regra para o branch `main`.
3. Marque "Require status checks to pass before merging".
4. Na lista "Status checks to select", escolha o check correspondente ao job (ex.: `sqlite-ci` ou o nome exato mostrado nas Actions). Se o nome não aparecer imediatamente, faça um Run workflow para que o check seja registrado.
5. Salve a regra. A partir de então, Pull Requests para `main` só poderão ser mescladas se esse check passar.

Nota: tornar um job nativo e de build nativo obrigatório pode aumentar a fricção em PRs (compilações nativas falham em runners sem toolchain). Recomendo habilitar essa proteção apenas depois de validar o job algumas vezes no CI.


1. Vá no repositório GitHub > Settings > Secrets and variables > Actions > New repository secret.
2. Adicione `PORTAL_API_KEY` com o valor da sua chave.
3. (Opcional) Adicione `PROXY_ADMIN_TOKEN` se você usa um token para endpoints administrativos.

Executar o job de integração manualmente:

1. Acesse Actions > CI > Run workflow.
2. Selecione branch `main` e clique em Run workflow.

Observação: o job de integração usa `npm run test:integration`. No workflow atual o passo é executado com `|| true` para evitar que falhas de integração bloqueiem o pipeline principal — se preferir que falhas de integração falhem o workflow, peça que eu remova o `|| true`.


## Habilitar testes com SQLite no CI (opcional)

Este repositório inclui um workflow opcional (`.github/workflows/sqlite-ci.yml`) que compila e executa os testes usando `better-sqlite3` (módulo nativo). Por motivos de compatibilidade e build, esse job é opcional e pode ser executado manualmente antes de torná-lo obrigatório.

Passos rápidos para habilitar:

1. Vá em Settings → Secrets and variables → Actions no GitHub do repositório.
2. Adicione o secret `ENABLE_SQLITE_CI` com valor `true` (opcional — você também pode disparar o workflow manualmente via Actions → SQLite CI → Run workflow).

O que o workflow faz:

- Instala ferramentas do sistema necessárias para compilar módulos nativos (build-essential, python3, libsqlite3-dev, cmake).
- Executa `npm ci` e compila `better-sqlite3`.
- Executa a suíte de testes com a variável `USE_SQLITE_CACHE=1` para validar o uso do cache SQLite.

Cautelas:

- O build de dependências nativas pode falhar em runners sem toolchain (ex.: Windows self-hosted sem Visual Studio). Recomendo disparar manualmente na primeira vez e inspecionar logs.
- Se preferir armazenamento persistente do banco gerado, podemos estender o workflow para enviar o arquivo `.db` como artifact ou para um bucket S3.


Como usar (PowerShell):

```powershell
$env:BASE_URL_CAMARA = 'https://dadosabertos.camara.leg.br/api/v2'
$env:BASE_URL_SENADO = 'https://legis.senado.leg.br/dadosabertos'
# Se precisar de chave do Portal da Transparência:
$env:PORTAL_KEY = '<SUA_CHAVE_AQUI>'

npm run test:integration
```

Nota: se você não fornecer `PORTAL_KEY` ou outras chaves, alguns testes que demandam autenticação vão emitir avisos ou retornar um erro esperado. Esses scripts servem como sanity checks rápidos.

### Rodando testes de integração localmente

1. Copie o arquivo `.env.example` para `.env` e preencha os valores (especialmente `PORTAL_API_KEY` quando disponível):

```powershell
cp .env.example .env
# editar .env com um editor de texto e preencher os valores
```

1. No PowerShell, carregue as variáveis do `.env` e execute o runner de integração:

```powershell
# Windows PowerShell (pode usar um utilitário como 'dotenv' ou set manually):
Get-Content .env | ForEach-Object { $parts = $_ -split '='; if ($parts[0]) { setx $parts[0] $parts[1] } }
# Depois abra um novo terminal para carregar as variáveis, ou defina temporariamente:
# $env:PORTAL_API_KEY = 'SUA_CHAVE_AQUI'

# Rodar o runner de integração que carrega `.env` automaticamente:
npm run test:integration:local
```

Observação: o script de integração tentará usar `PORTAL_API_KEY` e `PROXY_ADMIN_TOKEN` se presentes; caso contrário, ele irá rodar os checks que não requerem credenciais.

## Equipe

**Desenvolvimento**: Equipe dedicada à transparência política
**Design**: Especialistas em UX/UI

## Modo desenvolvedor (botão de carregamento local)

Para facilitar desenvolvimento e testes locais há um botão flutuante que permite carregar fixtures CSV manualmente.

- O botão é exibido automaticamente quando a aplicação roda em `localhost` ou `127.0.0.1`.
- Para ativá-lo deliberadamente em qualquer ambiente você pode:
  - adicionar `?dev=1` à URL (ex.: <http://seu-host:8000/?dev=1>), ou
  - habilitar via console do navegador: `localStorage.setItem('DEV_LOAD','1')` e recarregar a página.

Observação: em ambientes que não sejam localhost, o botão NÃO será exibido a menos que uma das flags acima esteja presente.

**Dados**: Analistas políticos e cientistas de dados
**Revisão**: Especialistas em direito e política

## Licença

Este projeto é licenciado sob a MIT License - veja o arquivo LICENSE para detalhes.

## Agradecimentos

- Congresso Nacional por disponibilizar dados públicos
- Comunidade open source pelas ferramentas utilizadas
- Voluntários que contribuem com o projeto
- Cidadãos brasileiros que acreditam na transparência

---

**Política Transparente Brasil** - Fortalecendo a democracia através da informação. 🇧🇷

## Como rodar localmente

Existem duas formas simples de rodar o projeto localmente na porta 8000.

1. Usando Python (já testado neste ambiente)

No PowerShell, execute:

```powershell
Set-Location -LiteralPath 'h:\TransparenciaPolitica'
python -m http.server 8000
```

Depois abra no navegador: <http://localhost:8000>

1. Usando npm (quando você preferir não depender do Python)

O repositório inclui um script alternativo que usa `npx http-server`.

No PowerShell, execute:

```powershell
Set-Location -LiteralPath 'h:\TransparenciaPolitica'
npm install --no-audit --no-fund
npm run dev:npm
```

Isto usa `npx http-server -p 8000` e serve os arquivos estáticos na mesma porta.

Parar o servidor Python (se em background):

```powershell
Get-Process -Name python | Stop-Process
```

## Proxy local e fallback CSV

O projeto pode integrar o Portal da Transparência sem expor a chave API no navegador.

- Rodar o proxy local (insere a chave do Portal nas requisições server-side):

```powershell
Set-Location -LiteralPath 'h:\TransparenciaPolitica'
npm run start-proxy
```

- Definir a chave da API no proxy (opcionalmente com um token admin):

```powershell
# Exemplo: node scripts/post-proxy-key.js <SUA_CHAVE>
node scripts/post-proxy-key.js "SUA_CHAVE_AQUI"
```

- Remover a chave do proxy:

```powershell
node scripts/unset-proxy-key.js
```

- Fallback local (CSV): se você não tiver a chave do Portal, pode baixar os dados públicos em CSV/ZIP e colocá-los em `resources/data/`.

O repositório já inclui um downloader simples e alguns datasets baixados como exemplo:

```powershell
# Baixar manualmente com o script (exemplo):
node scripts/download_portal_datasets.js https://portaldatransparencia.gov.br/download-de-dados/despesas/20250101

# Os arquivos baixados são salvos em resources/data/
```


- Exemplo de datasets já presentes em `resources/data/`:

  - `20250101_Despesas.zip` (extraído em `resources/data/20250101_extracted/`)
  - `auxilio-brasil.csv`
  - `auxilio-emergencial.csv`
  - `auxilio-reconstrucao.csv`
  - `bolsa-familia-pagamentos.csv`
  - `bolsa-familia-saques.csv`
  - `novo-bolsa-familia.csv`

Integração com o app:

- Para usar esses CSVs localmente no app, você pode arrastar e soltar ou usar o input de upload disponível no rodapé (quando implementado), ou copiar um CSV para `resources/data/` e chamar `window.governmentAPI.loadDespesasFromCSV()` via console para popular o fallback local (`governmentAPI.useLocalDespesas(...)`).

Se quiser, eu posso:

1. Integrar automaticamente os CSVs de `resources/data/` ao build (copiá-los para `dist/resources/data/`) e adicionar um pequeno carregador que detecta e registra automaticamente os arquivos encontrados.
2. Adicionar documentação passo-a-passo com capturas de tela e exemplos de uso no navegador.

## Testes

Executar os testes unitários (Jest):

```powershell
npm run test:unit
```

Smoke test do parser (rápido):

```powershell
npm test
```

## Página Admin

Após `npm run build` e `npm run preview`, abra `http://localhost:8000/admin.html` para pré-visualizar datasets no `dist/resources/data/` e carregar um dataset no app aberto em outra aba.
Se quiser, eu posso também adicionar um pequeno script `npm ci`/`start` mais completo ou configurar um arquivo `serve.json` para `http-server`.

