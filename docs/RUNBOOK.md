## Novos comandos e operações implementadas (Fase 2 - itens 1..6)

1) Invalidação automática de cache por webhooks
- Endpoint: POST /webhooks/receive
- Envie payloads do tipo:
  - { "type":"deputado.update", "id":123 }  -> invalida chaves `deputado:123*`
  - { "type":"despesa.update", "deputadoId":123 } -> invalida `deputado:123:despesas*`
  - { "prefix": "deputado:123" } -> invalida por prefixo
- Para testar local:
  curl -X POST -H "Content-Type: application/json" -d '{"type":"deputado.update","id":123}' http://127.0.0.1:3002/webhooks/receive

2) Harden do scheduler (retry + circuit-breaker)
- Variáveis configuráveis (.env):
  - SYNC_FAILURE_THRESHOLD (padrão 5)
  - SYNC_COOLDOWN_MS (padrão 300000)
- O sync usa retry exponencial por fetch e abre circuito se many failures ocorrerem.

3) Provisionamento de secrets
- Defina no CI / servidor:
  - ADMIN_TOKEN, WEBHOOK_SECRET, PORTAL_KEY, BASE_URL_CAMARA, BASE_URL_SENADO
- Exemplo para GitHub Actions: configure como Secrets e repasse ao job.

### Provisionamento de secrets (detalhado)

Para rodar integrações e proteger endpoints, configure os secrets abaixo no repositório/servidor:

- ADMIN_TOKEN — token para endpoints /admin (ver .env.example)
- WEBHOOK_SECRET — secret HMAC SHA256 usado para validar webhooks
- BASE_URL_CAMARA — ex: https://dadosabertos.camara.leg.br/api/v2
- BASE_URL_SENADO — ex: https://legis.senado.leg.br/dadosabertos

GitHub Actions:
1. Vá em Settings → Secrets and variables → Actions → New repository secret
2. Adicione os secrets com os nomes acima.
3. O workflow .github/workflows/ci-integration.yml executará testes de integração ao vivo automaticamente somente se BASE_URL_CAMARA e BASE_URL_SENADO estiverem definidos.

Exemplo para CI local (PowerShell):
$env:BASE_URL_CAMARA='https://dadosabertos.camara.leg.br/api/v2'
$env:BASE_URL_SENADO='https://legis.senado.leg.br/dadosabertos'
$env:ADMIN_TOKEN='...'
$env:WEBHOOK_SECRET='...'
npm run test:integration

4) Observability / métricas básicas
- Logs em JSON: server/logs.jsonl
- Métricas simples: server/metrics.json
- Endpoint admin: GET /admin/metrics (protegido por ADMIN_TOKEN)

5) Endpoints admin adicionados
- GET /admin/cache
- POST /admin/cache/clear  (body: { prefix: "deputado:123" })
- GET /admin/webhooks
- GET /admin/metrics

6) Migração para DB (plano rápido)
- Arquivos atuais: cache persistente em server/cache.json e histórico webhooks em server/webhooks.json
- Para migrar:
  - criar tabela `deputados`, `despesas`, `webhooks` em SQLite/Postgres
  - script migrador: scripts/migrate-to-db.js (não incluído automaticamente)
  - recomenda-se começar com SQLite local e migrar para Postgres em produção.

# Fim das atualizações