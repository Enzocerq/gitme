# CLAUDE.md — gitme (frontend)

Orientações para o Claude Code ao trabalhar neste diretório. Para detalhes de produto, fluxos e deploy, consulte o [README.md](README.md) — ele é a fonte de verdade.

## ⚠️ Regra obrigatória: manter o README atualizado

**Sempre que uma mudança alterar algo documentado no [README.md](README.md), atualize o README no mesmo trabalho** — antes de considerar a tarefa concluída. Isso inclui:

- Novas páginas/rotas, KPIs, ou mudança de comportamento de telas existentes
- Novos arquivos relevantes em `components/`, `hooks/`, `lib/`, `routes/` (atualizar a árvore "Estrutura do Projeto")
- Mudança em variáveis de ambiente, scripts npm, ou passos de instalação/deploy
- Mudança de defaults visíveis ao usuário (ex.: período padrão, integrações, endpoints consumidos)
- Mudança no estado persistido em `localStorage`

Se a mudança não toca nada documentado, não invente seção — mas verifique. Na dúvida, atualize.

## Comandos

```bash
npm run dev        # dev server (Vite) — http://localhost:8080
npm run build      # build de produção
npm run lint       # ESLint
npm run format     # Prettier
npx tsc --noEmit   # checagem de tipos (não há script dedicado; rode isto antes de concluir)
```

Após mudanças não-triviais, rode `npx tsc --noEmit` e, idealmente, `npm run build` para validar ponta a ponta.

## Arquitetura (essencial)

- **TanStack Start + Router file-based** (`src/routes/`). SSR habilitado.
- **`routes/_app.tsx`** é o guard: exige autenticação + repositório selecionado e envolve tudo em `<PeriodProvider>`. Todas as rotas internas vivem em `routes/_app/`.
- **`lib/api.ts`** é a **única** fronteira com o backend Spring Boot. Toda chamada HTTP passa por `apiFetch`. Não faça `fetch` espalhado pelas telas.
- **`lib/auth.ts`** guarda estado em `localStorage` (token, usuário, repos selecionados, modo demo). Funções são SSR-safe (guardam `typeof window`).
- **Período global:** use **sempre** `usePeriod()` (`hooks/use-period.tsx`) para obter `{ from, to }`. Não reintroduza `defaultDateRange()` nas telas. Helpers de período em `lib/period.ts` (`previousRange`, `computeDeltaPct`, `computeDeltaPp`).
- **Deltas:** o backend não tem endpoint de comparação — deltas vs. período anterior são calculados no cliente buscando `previousRange(period)` em paralelo. Omita o delta (passe `undefined`) quando não for representável; nunca exiba `0` falso.

## Convenções

- **UI em pt-BR.** Strings voltadas ao usuário em português.
- **`KpiCard`** (`components/kpi-card.tsx`): `delta.neutral: true` para métricas de volume (commits, PRs) — mostra direção sem colorir bom/ruim; `delta.invert: true` quando "menor é melhor" (lead/cycle time); `suffix: "pp"` para deltas de taxas. Decisão deliberada de SEI (evitar Goodhart's Law / alinhar a SPACE e DORA) — **não** adicione delta colorido ao TCM.
- **Design tokens** em `src/styles.css` (escala `obsidian` OKLCH, accents emerald/violet/ruby/amber). Use classes utilitárias existentes (`GlassCard`, glows) em vez de cores hardcoded.
- **Data fetching** via TanStack Query com `staleTime` de 5 min e `queryKey` incluindo `from`/`to`.

## Dependência do backend

Requer o **gitme-backend** (Spring Boot) rodando em `http://localhost:8081` (`VITE_BACKEND_URL`). Em produção: `https://gitme-backend.onrender.com`.
