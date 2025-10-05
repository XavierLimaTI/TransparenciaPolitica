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
```

Também há um server proxy para desenvolvimento:

```powershell
npm run start-proxy
# ou o proxy leve
node server/proxy-light.js
```

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
