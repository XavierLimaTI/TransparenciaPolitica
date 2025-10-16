# Demo UI — Política Transparente

Como testar localmente

1. Inicie um servidor estático na raiz do repositório (já iniciado nesta sessão):

```powershell
# servidor iniciado nesta sessão na porta 8001
# se precisar iniciar manualmente:
npx http-server -c-1 -p 8001
```

2. Abra no navegador:

```text
http://127.0.0.1:8001/demo-ui/index.html
```

O que a demo faz

- Carrega `/resources/data/manifest.json` e lista arquivos disponíveis.
- Ao clicar em um arquivo, carrega o JSON e mostra uma amostra (configurável).
- Gera uma visualização simples quando possível (coluna numérica).
- Permite baixar o JSON localmente.

Dicas:

- Se o manifest não existir, rode `npm run verify:data` conforme README principal.
- Para publicação pública: copie `demo-ui` para `gh-pages` ou configure o workflow de publish.
