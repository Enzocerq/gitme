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
| `/dashboard` | Visão geral: score de produtividade (com **tendência** vs. período anterior e **sparkline de evolução**), PRs, lead time, taxa de aceitação. Atividade recente com **drill-down** para o commit/PR no GitHub |
| `/activity` | Velocidade de desenvolvimento: cycle time e lead time com **benchmark DORA**, tempo em review, comparação você vs. equipe em barras pareadas (escala por métrica) |
| `/repositories` | Análise por repositório: commits, PRs, distribuição de esforço |
| `/collaboration` | Métricas de time (**"Equipe"**): comparação individual vs. grupo em escalas normalizadas, distribuição de reviews com linha de **mediana** |
| `/insights` | Diagnósticos de **conteúdo do trabalho** (motor heurístico de **regras determinísticas**, com disclaimer explícito), **tendência** vs. período anterior, mapa de produtividade com **totais por dia/hora** (`role="img"` com descrição de pico para leitores de tela) e painel **Ritmo de Trabalho** |

### Acessibilidade

- **Cor + texto:** badges de delta nos KPI cards carregam `aria-label` explicitando valor e valência (`melhora`/`piora`). Ícones decorativos marcados com `aria-hidden="true"`.
- **Tipografia:** labels críticos elevados de `text-[9px]`/`text-[10px]` para `text-xs`/`text-[10px]` com mais espaço para contraste WCAG AA.
- **Heatmap acessível:** o mapa commits × dia/hora recebe `role="img"` e `aria-label` contendo o insight de pico (ex.: "SEG às 14h concentra 22% dos commits"). Células internas marcadas como `aria-hidden`.
- **Sem "Ao vivo" enganoso:** o cabeçalho "Atividade Recente" exibe "Atualizado há Xmin" (recalculado a cada 30 s com base em `dataUpdatedAt` do TanStack Query) + botão de refresh — reflete fielmente o `staleTime` de 5 min.
- **Progressbars semânticos:** as barras de componente do Score de Produtividade usam `role="progressbar"` com `aria-valuenow`/`aria-valuemin`/`aria-valuemax`.
- **Badges adições/deleções:** labels `aria-label="N adições"` / `aria-label="N deleções"` nos badges verdes/vermelhos do feed de atividade.

### KPIs Monitorados

- **Productivity Score** — índice composto 0–100, com **modal de metodologia** (fórmula, pesos e ancoragem em SPACE/DORA) acessível pelo botão "Metodologia", **badge de tendência** período-vs-período e **sparkline de evolução** (série temporal via endpoint `/api/productivity-score/{login}/trend`, janela móvel de 30 dias por ponto) — a evolução importa mais que o valor absoluto isolado
- **PRs Merged** — taxa de aceitação de pull requests, exibida com **mini-gauge** colorido por faixa (baixa/moderada/saudável)
- **Lead Time** — tempo do primeiro commit até o merge, com rótulo de **benchmark DORA** (elite < 1 dia, alto < 1 semana, médio < 1 mês)
- **Cycle Time** — tempo de abertura até o fechamento do PR, com **benchmark DORA** (elite < 24h, bom < 1 semana)
- **TCM** — tamanho de commit médio (linhas/commit). Exibido com tooltip de contexto: é estatística descritiva, **não** medida de produtividade (LOC desacreditado como proxy de valor desde os anos 1970)
- **Time in Review** — distribuição do tempo de revisão por repositório

### Seletor de Período Global

Um seletor de período no header controla **todas as telas internas** simultaneamente:

- **Presets:** 7 dias, 30 dias, 90 dias e 12 meses, além de um **intervalo personalizado** (date pickers).
- **Default:** últimos **30 dias**. A escolha é persistida em `localStorage` (`gitme_period`) e os presets são re-ancorados em "hoje" a cada carga — o "30 dias" nunca congela numa janela antiga.
- **Deltas vs. período anterior:** os KPIs do dashboard e da tela de atividade exibem a variação contra o **período imediatamente anterior de mesma duração** (calculada no cliente, já que o backend não expõe endpoint de comparação). A variação é mostrada com seta direcional (▲/▼) e cor — verde/vermelho para métricas com valência clara (lead time, cycle time, taxa de aceitação) e tom neutro para métricas de volume (commits, PRs). Quando o baseline é zero, o delta é omitido em vez de exibir valor falso.

> **Contexto SEI:** métricas de volume não recebem cor de "bom/ruim" de propósito (evita induzir Goodhart's Law); o TCM não exibe delta pelo mesmo motivo. Alinhado aos frameworks SPACE e DORA.

### Postura anti-vigilância (Software Engineering Intelligence)

O projeto adota deliberadamente uma postura de **inteligência de engenharia como autoconhecimento**, não como vigilância — uma decisão de design ancorada nos frameworks **SPACE** e **DORA**, que alertam contra métricas de output puro e contra medir *quando* as pessoas trabalham:

- **Padrões de horário ≠ alertas.** Commits noturnos e de fim de semana **não** são tratados como *warnings*. Eles aparecem no painel **Ritmo de Trabalho** (em `/insights`) como dado descritivo neutro, com aviso explícito de que "trabalhar fora do horário comercial não é melhor nem pior" e que o dado serve à reflexão pessoal, nunca à avaliação. Os diagnósticos automáticos restantes focam apenas no **conteúdo** do trabalho (tipo de commit, adoção de Conventional Commits, taxa de correções).
- **TCM contextualizado.** O Tamanho de Commit Médio (linhas/commit) exibe tooltip esclarecendo que é estatística descritiva, não medida de produtividade — LOC foi desacreditado como proxy de valor entregue desde os anos 1970. Sem "meta".
- **Score transparente.** O Score de Produtividade expõe sua metodologia completa via modal ("Metodologia"): fórmula, peso e descrição de cada um dos cinco componentes, dimensão SPACE/DORA correspondente, e limitações (depende dos dados do GitHub, não captura mentoria/design/pesquisa, não compara pessoas com contextos diferentes). Transparência da fórmula = confiança no indicador.

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
│   ├── app-shell.tsx        # Layout principal com sidebar (switcher de repo), breadcrumb do repo ativo + barra de loading global na navegação, seletor de período no header
│   ├── glass-card.tsx       # Card glassmórfico reutilizável
│   ├── kpi-card.tsx         # Card de métrica com delta vs. período anterior + tooltip de contexto opcional (prop `info`) + aria-label no badge de variação
│   ├── period-picker.tsx    # Seletor de período global (presets + intervalo personalizado)
│   ├── query-state.tsx      # `QueryError`: estado de erro com retry reutilizável entre telas
│   └── section-header.tsx   # Cabeçalho de seção
├── routes/
│   ├── login.tsx            # Login OAuth GitHub (state CSRF via crypto, erro inline, feedback de redirecionamento) + botão de modo demonstração
│   ├── auth-callback.tsx    # Callback OAuth: troca code por token
│   ├── select-repos.tsx     # Seleção de repositórios (ordenação por estrelas/nome, polling com timeout, barra de ingestão indeterminada)
│   ├── _app.tsx             # AuthGuard + PeriodProvider que envolvem o AppShell
│   └── _app/
│       ├── dashboard.tsx    # Dashboard principal
│       ├── activity.tsx     # Métricas de atividade
│       ├── repositories.tsx # Análise de repositórios
│       ├── collaboration.tsx# Métricas de colaboração
│       └── insights.tsx     # Diagnósticos de conteúdo, heatmap e painel Ritmo de Trabalho
├── hooks/
│   ├── use-active-repo.tsx  # Context global do repositório ativo (switcher entre repos selecionados)
│   ├── use-period.tsx       # Context global do período de análise (persiste em localStorage)
│   ├── use-theme.tsx        # Toggle de tema claro/escuro
│   └── use-mobile.tsx       # Detecção de viewport mobile
├── lib/
│   ├── api.ts               # Chamadas ao backend (métricas, demo, ETL, auth)
│   ├── auth.ts              # Autenticação: token, usuário, seleção de repos e modo demo
│   ├── period.ts            # Tipos e helpers de período (presetRange, previousRange, computeDelta)
│   ├── mock-data.ts         # Dados mockados para desenvolvimento offline
│   ├── error-capture.ts     # Captura e normalização de erros de API
│   ├── error-page.ts        # Helpers de página de erro
│   └── utils.ts             # Utilitários gerais
└── styles.css               # Tokens de design, variáveis CSS e utilitário de barra de progresso indeterminada
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
| `gitme_active_repo_id` | ID numérico do repositório ativo no switcher (fallback: primeiro selecionado) |
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
