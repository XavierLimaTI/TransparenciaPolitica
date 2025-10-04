# Instruções rápidas

Abaixo estão os passos para executar o app localmente e configurar a chave do Portal da Transparência.

1) Rodar a proxy local (opcional mas recomendado para esconder a chave do Portal):

   node server/proxy.js

2) Servir os arquivos estáticos (modo desenvolvimento):

   npx http-server -c-1 -p 8000

   Após isso abra o navegador em: [http://localhost:8000/candidatos.html](http://localhost:8000/candidatos.html)

3) Configurar chave do Portal da Transparência:

   - Clique em um candidato -> 'Ver gastos'.
   - Se a chave não tiver sido salva no navegador, será exibido um modal.
   - Cole a chave no campo 'Chave da API' e clique em 'Salvar'.
   - Você pode salvar localmente (localStorage) ou enviar para a proxy local (se estiver rodando) informando o token admin se configurado.

4) Testes unitários:

   npx jest --runInBand

5) Smoke test (simples):

   npm run smoke

Observações:

 - O app usa a API de dados abertos da Câmara para carregar deputados com paginação.
 - Para o Portal da Transparência, a proxy local injeta o header `chave-api-dados` para evitar expor a chave no cliente.
