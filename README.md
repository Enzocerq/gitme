# GITME

**Dashboard de inteligência de engenharia** para monitorar a saúde e produtividade de times de desenvolvimento via métricas do GitHub.

![Tech Stack](https://img.shields.io/badge/React-19-blue?logo=react)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-1.167-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![Cloudflare Workers](https://img.shields.io/badge/Deploy-Cloudflare_Workers-F38020?logo=cloudflare)

---

## Sobre o Projeto

GITME é um dashboard analítico que transforma dados brutos do GitHub em indicadores acionáveis de saúde de engenharia. A aplicação oferece uma visão unificada de commits, pull requests, tempo de ciclo, colaboração entre times e padrões de atividade — tudo com uma interface "engineering console" com glassmorphism e suporte a temas claro e escuro.

Além do fluxo real via OAuth GitHub, a aplicação possui um **modo demonstração** que carrega dados pré-populados dos repositórios `axios/axios` e `vuejs/core` sem necessidade de autenticação, exibindo automaticamente as métricas do contribuidor com mais commits no repositório selecionado.

> Projeto desenvolvido como TCC para explorar métricas de engenharia de software e visualização de dados de desenvolvimento.

---

## Funcionalidades

### Páginas

| Rota | Descrição |
|------|-----------|
| `/login` | Autenticação via GitHub OAuth ou entrada em modo demonstração |
| `/select-repos` | Seleção de repositórios para análise (repos do GitHub ou repos de demo) |
| `/dashboard` | Visão geral: score de produtividade, PRs, lead time, taxa de aceitação |
| `/activity` | Velocidade de desenvolvimento: cycle time, lead time, tempo em review |
| `/repositories` | Análise por repositório: commits, PRs, distribuição de esforço |
| `/collaboration` | Métricas de time: comparação individual vs. grupo, distribuição de reviews |
| `/insights` | Diagnósticos: mapa de produtividade (commits por dia da semana × hora), proporção features/bugs |

### KPIs Monitorados

- **Productivity Score** — índice composto 0–100
- **PRs Merged** — taxa de aceitação de pull requests
- **Lead Time** — tempo do primeiro commit até o merge
- **Cycle Time** — tempo de abertura até o fechamento do PR
- **TCM** — linhas de código por commit (Technical Code Metrics)
- **Time in Review** — distribuição do tempo de revisão por repositório

### Modo Demonstração

Acessível diretamente na tela de login pelo botão **"Ver demonstração"**. Neste modo:

- Nenhuma autenticação GitHub é necessária
- A tela de seleção exibe apenas `axios/axios` e `vuejs/core`
- Ao confirmar a seleção, o backend identifica automaticamente o contribuidor com mais commits no(s) repositório(s) escolhido(s) e o define como usuário ativo
- O ETL **não é executado** — os dados já estão pré-carregados no banco
- O dashboard carrega imediatamente com dados reais

---

## Stack Tecnológica

### Frontend
- **React 19** — biblioteca UI
- **TanStack Start** — framework full-stack (SSR/SSG com Vite)
- **TanStack Router** — roteamento file-based com type safety
- **TanStack Query** — data fetching e cache

### Estilização
- **Tailwind CSS 4** — utility-first CSS
- **shadcn/ui** — componentes acessíveis (Radix UI + Tailwind)
- **Recharts** — gráficos e visualizações
- **Lucide React** — ícones

### Build & Deploy
- **Vite 7** — bundler
- **TypeScript 5.8** — type safety
- **Cloudflare Workers** — hosting serverless

---

## Design System

A interface adota estética de "console de engenharia" com suporte a tema claro e escuro (toggle no header):

- **Paleta**: escala `obsidian` em espaço de cor OKLCH (950 → 400) no modo escuro; paleta invertida no modo claro
- **Accents**: emerald (produtividade), violet (insights), ruby (alertas), amber (avisos)
- **Efeitos visuais**: glassmorphism com `backdrop-blur`, radial glows, bordas inset translúcidas
- **Tipografia**: Inter para UI + JetBrains Mono para métricas e dados numéricos

---

## Pré-requisitos

- **Node.js** 20+
- **npm** 10+

---

## Instalação e Execução

```bash
# 1. Clone o repositório
git clone https://github.com/enzocerq/gitme.git
cd gitme

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com seu GitHub Client ID e a URL do backend

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:8080`.

> **Pré-requisito:** o backend [gitme-backend](../gitme-backend) deve estar rodando em `http://localhost:8081` antes de usar a aplicação. Em produção o backend está disponível em `https://gitme-backend.onrender.com`.

---

## Variáveis de Ambiente

```properties
VITE_GITHUB_CLIENT_ID=your_github_oauth_client_id

# Desenvolvimento local
VITE_REDIRECT_URI=http://localhost:8080/auth-callback
VITE_BACKEND_URL=http://localhost:8081

# Produção
# VITE_REDIRECT_URI=https://gitme.enzocerq.workers.dev/auth-callback
# VITE_BACKEND_URL=https://gitme-backend.onrender.com
```

---

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento com hot-reload |
| `npm run build` | Build de produção |
| `npm run build:dev` | Build de desenvolvimento com source maps |
| `npm run preview` | Preview do build de produção localmente |
| `npm run lint` | Verifica o código com ESLint |
| `npm run format` | Formata o código com Prettier |

---

## Estrutura do Projeto

```
src/
├── components/
│   ├── ui/                  # Componentes shadcn/ui
│   ├── app-shell.tsx        # Layout principal com sidebar
│   ├── glass-card.tsx       # Card glassmórfico reutilizável
│   ├── kpi-card.tsx         # Card de métrica com delta/tendência
│   └── section-header.tsx   # Cabeçalho de seção
├── routes/
│   ├── login.tsx            # Login OAuth GitHub + botão de modo demonstração
│   ├── auth-callback.tsx    # Callback OAuth: troca code por token
│   ├── select-repos.tsx     # Seleção de repositórios (GitHub real ou demonstração)
│   └── _app/
│       ├── dashboard.tsx    # Dashboard principal
│       ├── activity.tsx     # Métricas de atividade
│       ├── repositories.tsx # Análise de repositórios
│       ├── collaboration.tsx# Métricas de colaboração
│       └── insights.tsx     # Insights, heatmap e diagnósticos automáticos
├── lib/
│   ├── api.ts               # Chamadas ao backend (métricas, demo, ETL, auth)
│   ├── auth.ts              # Autenticação: token, usuário, seleção de repos e modo demo
│   ├── mock-data.ts         # Dados mockados para desenvolvimento offline
│   ├── error-capture.ts     # Captura e normalização de erros de API
│   └── utils.ts             # Utilitários gerais
└── styles.css               # Tokens de design e variáveis CSS
```

---

## Dados e Integração

O frontend consome o backend **GitHubPoc** (Spring Boot) via `src/lib/api.ts`. O fluxo completo:

### Fluxo GitHub (autenticação real)

1. **Login** — OAuth GitHub via `src/lib/auth.ts`: redireciona para o GitHub, recebe o `code`, troca pelo token no backend e armazena em `localStorage`.
2. **Seleção de repositórios** — lista os repos da conta autenticada via `GET /api/poc/github/repositorios`.
3. **ETL** — o backend ingere commits, PRs, issues e reviews do(s) repo(s) selecionado(s) via `POST /api/poc/etl/seed`. O frontend faz polling em `/api/poc/etl/status` até a conclusão.
4. **Dashboard** — métricas calculadas sobre dados históricos persistidos no banco.

### Fluxo Demonstração

1. **"Ver demonstração"** — define `simulation_mode=true` no `localStorage`, sem OAuth.
2. **Seleção de repositórios** — exibe apenas `axios/axios` e `vuejs/core` via `GET /api/poc/demo/repos`.
3. **Top contributor** — ao confirmar, o frontend consulta `GET /api/poc/demo/top-contributor?repoIds=...` e define o contribuidor com mais commits como usuário ativo.
4. **Dashboard** — carrega imediatamente, sem ETL, usando dados pré-populados.

### Estado no localStorage

| Chave | Conteúdo |
|---|---|
| `gh_token` | Bearer token GitHub (ou `"DEMO"` no modo demonstração) |
| `gh_user` | Perfil do usuário (`login`, `name`, `avatarUrl`) |
| `selected_repos` | Array de repositórios selecionados com `id`, `name`, `fullName`, `owner` |
| `simulation_mode` | `"true"` quando em modo demonstração |

---

## Deploy

O projeto usa **Cloudflare Workers** para hospedagem serverless via o plugin oficial do Vite.

**URL de produção:** `https://gitme.enzocerq.workers.dev`

```bash
# 1. Autentique no Cloudflare (primeira vez)
npx wrangler login

# 2. Build de produção (lê as variáveis do .env)
npm run build

# 3. Deploy para Cloudflare Workers
npx wrangler deploy
```

> Antes do deploy, configure `VITE_REDIRECT_URI` e `VITE_BACKEND_URL` no `.env` com os valores de produção.
> Após o deploy, atualize o **Authorization callback URL** no GitHub OAuth App para `https://gitme.enzocerq.workers.dev/auth-callback`.

---

## Licença

Este projeto foi desenvolvido como Trabalho de Conclusão de Curso (TCC). Consulte o autor para informações sobre uso e distribuição.
