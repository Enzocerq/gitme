# GitHealth

**Dashboard de inteligência de engenharia** para monitorar a saúde e produtividade de times de desenvolvimento via métricas do GitHub.

![Tech Stack](https://img.shields.io/badge/React-19-blue?logo=react)
![TanStack Start](https://img.shields.io/badge/TanStack_Start-1.167-orange)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![Cloudflare Workers](https://img.shields.io/badge/Deploy-Cloudflare_Workers-F38020?logo=cloudflare)

---

## Sobre o Projeto

GitHealth é um dashboard analítico que transforma dados brutos do GitHub em indicadores acionáveis de saúde de engenharia. A aplicação oferece uma visão unificada de commits, pull requests, tempo de ciclo, colaboração entre times e padrões de atividade — tudo com uma interface dark "engineering console" com glassmorphism.

> Projeto desenvolvido como TCC para explorar métricas de engenharia de software e visualização de dados de desenvolvimento.

---

## Funcionalidades

### Páginas

| Rota | Descrição |
|------|-----------|
| `/login` | Autenticação via GitHub com UI glassmórfica |
| `/dashboard` | Visão geral: score de produtividade, PRs, lead time, taxa de aceitação |
| `/activity` | Velocidade de desenvolvimento: cycle time, lead time, tempo em review |
| `/repositories` | Análise por repositório: commits, PRs, distribuição de esforço |
| `/collaboration` | Métricas de time: comparação individual vs. grupo, distribuição de reviews |
| `/insights` | Diagnósticos: mapa de produtividade (commits por dia da semana × hora), proporção features/bugs, insights automáticos |

### KPIs Monitorados

- **Productivity Score** — índice composto 0–100
- **PRs Merged** — taxa de aceitação de pull requests
- **Lead Time** — tempo do primeiro commit até o merge
- **Cycle Time** — tempo de abertura até o fechamento do PR
- **TCM** — linhas de código por commit (Technical Code Metrics)
- **Time in Review** — distribuição do tempo de revisão por repositório

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

A interface usa um tema dark com estética de "console de engenharia":

- **Paleta**: escala `obsidian` em espaço de cor OKLCH (950 → 400)
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
git clone https://github.com/seu-usuario/git-health.git
cd git-health

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com seu GitHub Client ID e a URL do backend

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`.

> **Pré-requisito:** o backend [GitHubPoc](../GitHubPoc) deve estar rodando em `http://localhost:8081` antes de usar a aplicação.

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
│   ├── login.tsx            # Página de autenticação (OAuth GitHub)
│   ├── _app/
│   │   ├── dashboard.tsx    # Dashboard principal
│   │   ├── activity.tsx     # Métricas de atividade
│   │   ├── repositories.tsx # Análise de repositórios
│   │   ├── collaboration.tsx# Métricas de colaboração
│   │   └── insights.tsx     # Insights, heatmap e diagnósticos automáticos
├── lib/
│   ├── api.ts               # Chamadas ao backend (endpoints de métricas)
│   ├── auth.ts              # Fluxo OAuth GitHub (login, token, logout)
│   ├── mock-data.ts         # Dados mockados para desenvolvimento offline
│   ├── error-capture.ts     # Captura e normalização de erros de API
│   └── utils.ts             # Utilitários gerais
└── styles.css               # Tokens de design e variáveis CSS
```

---

## Dados e Integração

O frontend consome o backend **GitHubPoc** (Spring Boot) via `src/lib/api.ts`. O fluxo completo:

1. **Autenticação** — OAuth GitHub via `src/lib/auth.ts`: redireciona para o GitHub, recebe o `code`, troca pelo token no backend e armazena em `localStorage`.
2. **Dados** — todas as métricas são calculadas sobre dados históricos persistidos no banco; o frontend **não consome a GitHub API diretamente em runtime**.
3. **Desenvolvimento offline** — `src/lib/mock-data.ts` pode ser usado como fallback durante desenvolvimento sem o backend disponível.

---

## Deploy

O projeto usa **Cloudflare Workers** para hospedagem serverless via o plugin oficial do Vite:

```bash
npm run build
# Deploy com Wrangler CLI
npx wrangler deploy
```

---

## Licença

Este projeto foi desenvolvido como Trabalho de Conclusão de Curso (TCC). Consulte o autor para informações sobre uso e distribuição.
