### Cabeçalhos HTTP e GitHub Pages

Ao publicar os datasets em `gh-pages` (pasta `data/`), é importante entender que o GitHub Pages limita o controle sobre alguns cabeçalhos HTTP. Isso pode causar mensagens no console do navegador relacionadas a segurança ou detecção de tipo de conteúdo.

Pontos importantes:

- GitHub Pages não permite customizar livremente cabeçalhos como `X-Content-Type-Options` ou cabeçalhos de cache para arquivos individuais.
- A página 404 padrão do Pages pode incluir políticas CSP que bloqueiam scripts inline — por isso o fluxo de publicação aqui gera `index.html` que usa scripts externos (em `assets/`) para evitar esse bloqueio.

Alternativas e soluções:

1. Cloudflare (proxy): use Cloudflare na frente do GitHub Pages para injetar cabeçalhos como `X-Content-Type-Options: nosniff` e `Cache-Control` personalizados. Requer configurar DNS/registro e roteamento pelo Cloudflare.
2. Netlify/Vercel ou outro host: migre o hosting para plataformas que permitam configurar cabeçalhos e regras de cache (Netlify tem `_headers`, Vercel permite `headers()` em `vercel.json`).
3. Proxy customizado / servidor próprio: hospede os arquivos em um servidor (NGINX/Apache) onde você controla `add_header` / `Header set` para políticas de segurança.
4. Cloudflare Workers / Edge Workers: para quem quer continuar com GitHub Pages mas precisa ajustar cabeçalhos dinamicamente, um Worker pode reescrever respostas e injetar cabeçalhos antes de chegar ao cliente.

Como verificar os cabeçalhos localmente (exemplo usando PowerShell / curl):

PowerShell:

```powershell
# inspecionar cabeçalhos (substitua OWNER e REPO)
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/{OWNER}/{REPO}/gh-pages/data/despesas.csv.json" -Method Head | Select-Object -ExpandProperty Headers
```

curl (linha de comando):

```bash
curl -I "https://raw.githubusercontent.com/{OWNER}/{REPO}/gh-pages/data/despesas.csv.json"
```

Se precisar, posso adicionar exemplos práticos de configuração do Cloudflare Worker ou um bloco `_headers` para Netlify — me diga qual solução você prefere e eu preparo um patch/PR.
# Desenvolvimento — Política Transparente Brasil

Este documento descreve como configurar o ambiente de desenvolvimento, rodar testes e ativar o CI para o projeto.

## Requisitos
- Node.js >= 14 (recomendado 18)
- npm
- PowerShell (Windows) ou um shell POSIX

## Instalação
Na raiz do repositório:

```powershell
npm ci
```

## Rodar o servidor local
Você pode usar o `http-server` incluído nos devDependencies:

```powershell
npx http-server -c-1 -p 8000
Start-Process http://localhost:8000
npx http-server -c-1 -p 8000
Start-Process http://127.0.0.1:8000
```

Também há um server proxy para desenvolvimento:

```powershell
npm run start-proxy
# ou o proxy leve
node server/proxy-light.js
```
### Carregar demo de despesas (fluxo rápido)

Um dataset de demonstração está disponível em `resources/data/despesas.json` para desenvolvimento e demonstrações locais. Para carregar o demo na interface:

1. Inicie o servidor estático (ver comando acima).
2. Abra a página no navegador: http://127.0.0.1:8000/
3. No painel "Datasets" (ou na tela principal), clique no botão "Carregar demo (despesas)" para injetar os dados de `resources/data/despesas.json`.

Ao carregar, a aplicação dispara um evento `localDespesasUsed` e tenta chamar o helper `window.governmentAPI.useLocalDespesas(data)` quando disponível — isso integra os dados ao fluxo existente da UI.

Acesso aos dados publicados (raw & Pages):

- Se você publicou com o workflow `publish-gh-pages.yml`, os arquivos ficam no branch `gh-pages` sob `data/` e, quando o Pages estiver habilitado, estarão disponíveis em:

	https://<OWNER>.github.io/<REPO>/data/

- Como alternativa imediata (quando Pages estiver desativado), é possível consumir os arquivos diretamente via raw URL:

	https://raw.githubusercontent.com/<OWNER>/<REPO>/gh-pages/data/<ARQUIVO>

	Exemplo:

	https://raw.githubusercontent.com/XavierLimaTI/TransparenciaPolitica/gh-pages/data/despesas.csv.json

### Teste E2E rápido com Playwright

Há um teste Playwright de fumaça que valida o fluxo do botão de demo: `scripts/playwright/load-demo.spec.js`.

Para executá-lo localmente:

```powershell
npx playwright test scripts/playwright/load-demo.spec.js
```

O teste abre a aplicação em um navegador headless, clica no botão e espera o diálogo de confirmação.

### Observações

- Os arquivos em `resources/data/ingested/` presentes neste branch são placeholders usados para evitar 404s durante demonstrações locais. Você pode removê-los ou regenerá-los a partir do pipeline de ingestão conforme necessário.

## Testes
- Executar toda a suíte (com coverage):

```powershell
npm test
```

- Executar apenas testes unitários:

```powershell
npm run test:unit
```

- Smoke tests (CSV + quick API checks):

```powershell
npm run test:smoke
npm run smoke:e2e
```

## Playwright E2E (automação de UI)

O repositório inclui um runner Playwright simples que automatiza a abertura do modal de configuração da chave do Portal e valida que a chave foi persistida em localStorage.

- Rodar localmente (pré-requisito: Playwright browsers instalados):

```powershell
# instalar browsers Playwright (só precisa rodar uma vez)
npx playwright install --with-deps

# executar o runner (sobe servidor estático e roda o teste)
npm run test:playwright
```

- Observações para CI (GitHub Actions):
	- O workflow já inclui um step `npx playwright install --with-deps` antes de rodar `npm run test:playwright`.
	- Se quiser rodar mais cenários, converta o runner para usar `@playwright/test` e adicione jobs paralelos.

### Rodar smoke localmente (rápido)

Use este fluxo para reproduzir o que o CI faz no job de smoke localmente:

```powershell
# construir o projeto (gera ./dist)
npm run build

# subir um servidor estático na porta 8001
npx http-server ./dist -p 8001

# (em outra janela) rodar o smoke-runner que captura screenshot, HTML e logs
node scripts/playwright-local-test.js
```

Observações:
- O script `scripts/playwright-local-test.js` faz um skip gracioso (exit 0) quando `./dist` não existe — útil em forks/PRs sem assets.
- Se quiser instalar os browsers Playwright localmente (só precisa ser feito uma vez): `npx playwright install --with-deps`.


## Ativar CI / Codecov
O projeto já contém um workflow GitHub Actions que roda `npm test` e envia `coverage/lcov.info` para Codecov.

Se o repositório for privado, adicione o secret `CODECOV_TOKEN` nas Settings → Secrets → Actions do GitHub:

1. Vá em https://github.com/<org_or_user>/<repo>/settings/secrets/actions
2. Clique em "New repository secret"
3. Nome: `CODECOV_TOKEN`
4. Valor: token obtido em https://codecov.io (ou do administrador do projeto)

O workflow usará o secret automaticamente quando estiver configurado.

## Como contribuir
1. Fork + clone
2. Crie branch para a feature: `git checkout -b feat/nova-coisa`
3. Faça commits pequenos e com mensagem clara
4. Rode `npm test` antes de abrir PR

## Checklist de revisão local
- [ ] Tests passando (`npm test`)
- [ ] Coverage razoável para a área alterada
- [ ] Lint/format (não temos uma configuração formal neste repo)

## Contato
Para dúvidas, abra uma issue ou comente no PR.
