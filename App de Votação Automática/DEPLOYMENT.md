# Guia de Deployment - Política Transparente Brasil

## Deploy no Vercel (Recomendado)

### Opção 1: Deploy via GitHub
1. Faça upload dos arquivos para um repositório GitHub
2. Conecte o repositório ao Vercel
3. O Vercel detectará automaticamente o projeto estático

### Opção 2: Deploy Manual (Upload Direto)
1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Arraste a pasta do projeto para a área de upload
4. O Vercel fará o deploy automaticamente

### Opção 3: Deploy via CLI
```bash
# Instalar o CLI do Vercel
npm i -g vercel

# Fazer login
vercel login

# Fazer deploy
vercel --prod
```

## Estrutura Necessária para Deploy

```
/
├── index.html          # Página principal (obrigatório)
├── candidatos.html     # Página de candidatos
├── votacoes.html       # Página de votações
├── sobre.html          # Página sobre
├── main.js            # JavaScript principal
├── api-integration.js # Integração com APIs
├── vercel.json        # Configuração do Vercel
├── package.json       # Informações do projeto
├── resources/         # Imagens e assets
│   ├── hero-bg.png
│   └── politician-avatars.png
└── README.md          # Documentação
```

## Configurações Importantes

### vercel.json
O arquivo `vercel.json` já está configurado com:
- Rotas para todas as páginas HTML
- Configuração de build para arquivos estáticos
- Rewrites para URLs amigáveis

### package.json
Identifica o projeto como estático para o Vercel.

## Problemas Comuns e Soluções

### ❌ Erro 404: NOT_FOUND
**Causa**: O Vercel não encontrou o index.html
**Solução**: Verifique se o index.html está na raiz do projeto

### ❌ Erro de rotas
**Causa**: Links para páginas internas não funcionam
**Solução**: O vercel.json já configura as rotas corretamente

### ❌ Imagens não carregam
**Causa**: Caminho incorreto para arquivos estáticos
**Solução**: As imagens devem estar na pasta `resources/`

## Verificação Pré-Deploy

Antes de fazer deploy, verifique:
- [ ] Todos os arquivos HTML existem
- [ ] Arquivos JavaScript estão na raiz
- [ ] Pasta `resources/` existe com imagens
- [ ] `vercel.json` está presente
- [ ] `package.json` está presente

## Teste Local

Para testar antes do deploy:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js
npx serve .
```

Acesse: http://localhost:8000

## Deploy Alternativos

### Netlify
1. Arraste a pasta para [netlify.com](https://netlify.com)
2. Deploy instantâneo

### GitHub Pages
1. Faça upload para GitHub
2. Ative GitHub Pages nas configurações

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Suporte

Se encontrar problemas:
1. Verifique a estrutura de arquivos
2. Confira os logs de build no Vercel
3. Teste localmente primeiro
4. Certifique-se de que todos os arquivos foram enviados

---

**Sucesso no deploy!** 🚀