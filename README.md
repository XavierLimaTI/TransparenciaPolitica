# Política Transparente Brasil

[![CI](https://github.com/XavierLimaTI/TransparenciaPolitica/actions/workflows/ci.yml/badge.svg)](https://github.com/XavierLimaTI/TransparenciaPolitica/actions/workflows/ci.yml)
[![Codecov](https://codecov.io/gh/XavierLimaTI/TransparenciaPolitica/branch/main/graph/badge.svg?token=)](https://codecov.io/gh/XavierLimaTI/TransparenciaPolitica)

## Descrição

Plataforma web inovadora dedicada à transparência política brasileira, permitindo que eleitores consultem informações detalhadas sobre candidatos, seus votos em matérias importantes da Câmara e Senado, e tomem decisões conscientes para as eleições de 2026.

## Funcionalidades Principais

### 🔍 Sistema de Busca Avançada
- Busca por candidatos, partidos, votações específicas
- Filtros múltiplos: partido, ideologia, estado, cargo
- Autocomplete inteligente
- Ordenação personalizada

### 👥 Perfil de Candidatos
- Informações completas: foto, nome, partido, estado, cargo
- Histórico detalhado de votos em matérias importantes
- Projetos e promessas de campanha
- Avaliação de desempenho e alinhamento partidário

### 🗳️ Votações Detalhadas
- Descrição completa de cada matéria votada
- Resultados por candidato (a favor, contra, abstenção)
- Análise contextual e impacto das votações
- Comparação entre partidos

### 📊 Dashboard Interativo
- Gráficos ECharts interativos
- Estatísticas em tempo real
- Visualizações de tendências políticas
- Mapa de distribuição geográfica

## Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica
- **Tailwind CSS** - Framework de estilização moderno
- **JavaScript ES6+** - Funcionalidades interativas
- **ECharts.js** - Gráficos e visualizações de dados
- **Anime.js** - Animações suaves
- **Font Awesome** - Ícones vetoriais

### Design
- **Cores inspiradas na bandeira brasileira**
- **Tipografia elegante**: Playfair Display + Inter
- **Design responsivo** - Mobile-first
- **Animações sutis** - Melhor UX

## Estrutura do Projeto

```
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

## Dados de Demonstração

O projeto inclui dados simulados de:
- **6 candidatos** de diferentes partidos e estados
- **3 votações importantes** (PEC da Bandidagem, Reforma Tributária, Marco Legal das Startups)
- **Histórico de votos** detalhado para cada candidato
- **Projetos e promessas** de campanha

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

## Equipe

**Desenvolvimento**: Equipe dedicada à transparência política
**Design**: Especialistas em UX/UI

## Modo desenvolvedor (botão de carregamento local)

Para facilitar desenvolvimento e testes locais há um botão flutuante que permite carregar fixtures CSV manualmente.

- O botão é exibido automaticamente quando a aplicação roda em `localhost` ou `127.0.0.1`.
- Para ativá-lo deliberadamente em qualquer ambiente você pode:
	- adicionar `?dev=1` à URL (ex.: `http://seu-host:8000/?dev=1`), ou
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

1) Usando Python (já testado neste ambiente)

No PowerShell, execute:

```powershell
Set-Location -LiteralPath 'h:\TransparenciaPolitica'
python -m http.server 8000
```

Depois abra no navegador: http://localhost:8000

2) Usando npm (quando você preferir não depender do Python)

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