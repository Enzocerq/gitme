# Plano — GitHealth

Dashboard de saúde de desenvolvimento baseado em métricas do GitHub. Visual **Obsidian engineering console com glassmorphism**: fundo escuro `obsidian-950`, glows radiais coloridos (emerald, violet, ruby) atrás do conteúdo, cards translúcidos com `backdrop-blur` e bordas finas iluminadas. Dados mockados realistas. Login do GitHub presente como botão visual (sem OAuth ainda).

## Telas

1. **`/login`** — card centralizado com glow violet/emerald ao fundo, botão "Continuar com GitHub" (mockado → leva ao dashboard).
2. **`/dashboard`** — Visão Geral: 4 KPI cards (Score 0–100, PRs Mergeadas, Lead Time, Taxa de Aceitação), gráfico de linha Commits×PRs (30d), painel de Insights, comparativo Score vs média do repo, tabela "Active Contributions".
3. **`/activity`** — Atividade e Fluxo: dias ativos, Cycle Time, Lead Time, TCM (linhas/commit); gráfico Time in Review; timeline de commits/PRs recentes.
4. **`/repositories`** — grid de repos com commits, PRs, % participação relativa, Taxa de Produção; donut de distribuição de esforço.
5. **`/collaboration`** — total de contribuidores; barras agrupadas (você vs média da equipe); distribuição de PRs revisadas.
6. **`/insights`** — heatmap 7×24 dia/hora de produtividade; donut Features vs Bug Fixing; cards de diagnósticos automáticos ("Sua taxa de aceitação cresceu 15%" etc, gerados via regras sobre o mock).

## Design system (src/styles.css)

- Dark como padrão. Tokens em oklch.
- Cores: `obsidian-950/900/800/400`, `emerald-glow`, `violet-glow`, `ruby-glow`, foreground slate.
- Fontes: **Inter** (sans) + **JetBrains Mono** (números/labels técnicos).
- Tokens semânticos: `--glass-card` (bg semi-transparente), `--shadow-glow-emerald`, `--gradient-radial-mesh`.
- Glows radiais fixos no fundo do layout (3 blobs blurrados emerald/violet/ruby) + cards com `bg-obsidian-900/40 backdrop-blur-xl border border-white/5`.

## Estrutura técnica

- **TanStack Start** + React 19 + Tailwind v4 + shadcn + **Recharts** + lucide-react.
- Layout compartilhado em `src/routes/_app.tsx` com sidebar fixa (logo + nav + bloco usuário GitHub) + header sticky com badge "GITHUB CONNECTED" + `<Outlet/>`.
- Páginas em `src/routes/_app/{dashboard,activity,repositories,collaboration,insights}.tsx` + `src/routes/login.tsx` + `src/routes/index.tsx` redireciona para `/dashboard`.
- Cada rota com `head()` próprio (title + meta description distintos).
- **Mock data** em `src/lib/mock-data.ts` espelhando o shape da GitHub REST API → futura troca por `createServerFn` é trivial.
- Componentes reutilizáveis em `src/components/`: `GlassCard`, `KpiCard`, `SectionHeader`, `InsightCard`, `Sparkline`, `Heatmap`, `AppShell`.
- Avatares via `https://i.pravatar.cc` para mock.
- Responsivo: grid 4-col → 2-col → 1-col; sidebar vira sheet no mobile.

## Não-objetivos (próximas iterações)

- OAuth real do GitHub (precisa Lovable Cloud + criar OAuth App).
- Persistência em banco.
- Insights gerados por IA de verdade (agora são regras determinísticas).
