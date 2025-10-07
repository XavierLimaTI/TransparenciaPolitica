# Política Transparente Brasil

## Descrição

Plataforma web inovadora dedicada à transparência política brasileira, permitindo que eleitores consultem informações detalhadas sobre candidatos, seus votos em matérias importantes da Câmara e Senado, e tomem decisões conscientes para as eleições de 2026.

# Política Transparente Brasil

## Descrição

Plataforma web dedicada à transparência política brasileira, permitindo que eleitores consultem informações sobre candidatos, votações e despesas públicas.

## Funcionalidades Principais

### Sistema de Busca Avançada
- Busca por candidatos, partidos e votações
- Filtros: partido, ideologia, estado, cargo

### Visualizações
- Gráficos por partido, votações e tendências

## Próximas Etapas (Roadmap)

### Fase 1 - MVP Completo ✅
- [x] Estrutura básica do webapp
- [x] Sistema de busca e filtros
- [x] Perfis de candidatos
- [x] Página de votações
- [x] Visualizações de dados

### Fase 2 - Integração com Dados Reais (implementação acionável)
- [ ] Integração com APIs oficiais do Congresso (adaptadores)
- [ ] Atualização automática de dados (sync)
- [ ] Sistema de cache para performance
- [ ] Webhooks para atualizações em tempo real

#### Objetivo
Trazer dados oficiais da Câmara e do Senado para o app em produção e em ambientes locais de desenvolvimento, com garantia de disponibilidade via fallback CSV e mecanismo de cache.

O repositório já contém implementações e stubs que tornam essa fase acionável:

- Adaptadores: `lib/adapters/camara.js` e `lib/adapters/senado.js` (stubs de normalização)
- Cliente principal: `lib/government-api.js` (cache em memória + persistente, fallbacks CSV, retry/backoff para o Portal)
- Scheduler / sincronizador: `server/sync.js` (salva `server/db.json` e cria lock em `server/sync.lock`)
- Cache persistente: `server/cache.js` (arquivo `server/cache.json`)
- Webhooks receiver: `server/webhooks.js` (POST `/webhooks/receive`, GET `/health`)
- Exemplo de variáveis: `.env.example`

Checklist acionável (passos para implementar/usar):

1. Adaptadores de API (implementado parcialmente)

- Arquivos: `lib/adapters/camara.js` e `lib/adapters/senado.js` — complete as normalizações conforme o shape das APIs.
- O `lib/government-api.js` usa os adaptadores se presentes e provê métodos de alto nível: `getDeputadosAtuais()`, `getSenadoresAtuais()`, `getVotacoesCamara()`, `getDespesasPorParlamentar()`, `loadDespesasFromCSV()` e `useLocalDespesas()`.

2. Atualização automática (scheduler)

- Arquivo: `server/sync.js`.
- Execução: `node server/sync.js --once` roda uma sincronização única e grava `server/db.json`.
- Para produção: execute periodicamente via cron/systemd/timers ou em um worker/container.

3. Sistema de cache

- `server/cache.js` fornece API `get(key)` / `set(key, data, ttl)` com persistência em `server/cache.json`.
- `lib/government-api.js` integra esse cache quando disponível.

4. Webhooks

- `server/webhooks.js` aceita POST `/webhooks/receive` e grava eventos em `server/webhooks.json`.
- Para segurança, configure `WEBHOOK_SECRET` e envie assinatura HMAC SHA256 no header `x-hub-signature-256`.

## Como desenvolver e testar localmente (passo a passo)

1. Instale dependências:

```powershell
npm ci
npx playwright install
```

2. Prepare variáveis (opcional):

```powershell
# exporte variáveis se necessário
$env:PORTAL_KEY = ''
$env:PROXY_BASE = 'http://127.0.0.1:3001'
$env:WEBHOOKS_BASE = 'http://127.0.0.1:3002'
```

3. Inicie serviços em terminais separados (ou use `scripts/ci-local.ps1` na raiz):

```powershell
# Iniciar proxy (escuta em 0.0.0.0:3001 por padrão)
- Estrutura semântica HTML5
# Iniciar servidor estático do app (porta 8000)
- Navegação por teclado
# Iniciar webhooks receiver (porta 3002)

```

4. Rode uma sincronização única (popula `server/db.json`):

```powershell
node server/sync.js --once
```

5. Verifique health endpoints:

```powershell
Invoke-WebRequest http://127.0.0.1:3001/health
Invoke-WebRequest http://127.0.0.1:3002/health
```

6. Rodar testes unitários e E2E:

```powershell
npm run test:unit
$env:BASE_URL = 'http://127.0.0.1:8000'
$env:PROXY_BASE = 'http://127.0.0.1:3001'
$env:WEBHOOKS_BASE = 'http://127.0.0.1:3002'
npx playwright test tests/e2e --reporter=list
```

7. Testar fallback CSV localmente (dev hook):

Abra o console do navegador (no app rodando em `http://127.0.0.1:8000`) e execute:

```javascript
// injeta despesas a partir de um CSV (útil para dev/testes)
fetch('/tests/fixtures/despesas.csv').then(r => r.text()).then(csv => window.loadLocalFixture(csv));
```

## Testes sugeridos a adicionar

- `__tests__/adapters.test.js` — validar mapeamento de campos vindo das APIs públicas (use fixtures)
- `__tests__/sync.test.js` — validar comportamento do scheduler (retry, lock)
- `__tests__/cache.test.js` — TTL e persistência do cache
- `__tests__/webhooks.test.js` — validar recebimento e replay de eventos

## Notas finais

- Para produção, prefira executar o sincronizador (`server/sync.js`) em um job runner.
- Complete as normalizações em `lib/adapters/*` seguindo a shape das APIs oficiais.

---

Política Transparente Brasil — Fortalecendo a democracia através da informação.
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

#### Objetivo
Trazer dados oficiais da Câmara e do Senado para o app em produção e em ambientes locais de desenvolvimento, com garantia de disponibilidade via fallback CSV e mecanismo de cache.

Checklist acionável (implementação sugerida)
- [ ] Adaptadores de API
	- Arquivo sugerido: `lib/government-api.js` (ou `lib/adapters/camara.js` e `lib/adapters/senado.js`)
	- Funções mínimas: `fetchDespesas()`, `fetchVotacoes()`, `fetchCandidatos()` e `useLocalDespesas(csvString)` para fallback
- [ ] Atualização automática (scheduler)
	- Arquivo sugerido: `server/sync.js` ou `scripts/update-data.ps1`
	- Features: agendamento (cron), retry/backoff, registro de última execução em `server/db.json`
- [ ] Sistema de cache
	- TTL em memória + persistente: `server/cache.json`
	- Headers `Cache-Control` para assets estáticos e endpoints de proxy
- [ ] Webhooks
	- Endpoint receptor: `POST /webhooks/receive` (em `server/webhooks.js` ou integrado em `server/proxy.js`)
	- UI administrativa (opcional): página `admin.html` para listar/validar URLs

Segurança e variáveis de ambiente
- Use variáveis de ambiente para chaves/URLs: `PORTAL_KEY`, `BASE_URL_CAMARA`, `BASE_URL_SENADO`
- Não versionar chaves no repositório. Ex.: `server/portal_key.json` deve ser ignorado pelo git

Como desenvolver e testar localmente
1. Instale dependências:

```powershell
npm ci
npx playwright install
```

2. Inicie o proxy local (em background) — o proxy emula endpoints públicos e fornece rotas de teste:

```powershell
# Iniciar proxy (escuta em 0.0.0.0:3001 por padrão)
npm run start-proxy
# Iniciar servidor estático do app (porta 8000)
npm run start:npm
```

3. Rodar testes unitários:

```powershell
npm run test:unit
```

4. Rodar os testes E2E (Playwright) apontando para as variáveis exportadas pela etapa acima:

```powershell
$env:BASE_URL = "http://127.0.0.1:8000";
$env:PROXY_BASE = "http://127.0.0.1:3001";
npx playwright test tests/e2e --reporter=list
```

5. Testar fallback CSV localmente (dev hook):

Abra o console do navegador (no app rodando em `http://127.0.0.1:8000`) e execute:

```javascript
// injeta despesas a partir de um CSV (útil para dev/testes)
fetch('/tests/fixtures/despesas.csv').then(r => r.text()).then(csv => window.loadLocalFixture(csv));
```

Testes sugeridos a adicionar
- `__tests__/adapters.test.js` — validar mapeamento de campos vindo das APIs públicas
- `__tests__/sync.test.js` — validar comportamento do scheduler (retry, lock)
- `__tests__/cache.test.js` — TTL e persistência do cache
- `__tests__/webhooks.test.js` — validar recebimento e replay de eventos

Notas finais
- Para produção, prefira executar o sincronizador (`server/sync.js`) em uma máquina com cron ou job runner (e.g., systemd timer, GitHub Actions scheduled workflow, ou um container com cron).
- Documente no `README.md` raiz as variáveis de ambiente necessárias e um exemplo `env.example` para desenvolvedores.

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

## Equipe

**Desenvolvimento**: Equipe dedicada à transparência política
**Design**: Especialistas em UX/UI
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