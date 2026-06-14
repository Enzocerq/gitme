import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GitCommit, GitPullRequest, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { KpiCard } from "@/components/kpi-card";
import { QueryError } from "@/components/query-state";
import { getFlowMetrics, getInsightsMetrics } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { usePeriod } from "@/hooks/use-period";
import { useActiveRepo } from "@/hooks/use-active-repo";
import { previousRange, computeDeltaPct, PRESET_COMPARE } from "@/lib/period";

export const Route = createFileRoute("/_app/activity")({
  head: () => ({
    meta: [
      { title: "Atividade — GITME" },
      { name: "description", content: "Commits, PRs, issues, cycle time, lead time e TCM." },
    ],
  }),
  component: ActivityPage,
});

/** Rótulo de benchmark DORA para cycle time (horas). */
function cycleBenchmark(hours: number): string {
  if (hours <= 0) return "primeiro commit → merge";
  if (hours < 24) return "elite · < 1 dia";
  if (hours < 168) return "bom · < 1 semana";
  return "acima de 1 semana";
}

/** Rótulo de benchmark DORA para lead time (horas). */
function leadBenchmark(hours: number): string {
  if (hours <= 0) return "issue criada → resolvida";
  const days = hours / 24;
  if (days < 1) return "elite · < 1 dia";
  if (days < 7) return "alto · < 1 semana";
  if (days < 30) return "médio · < 1 mês";
  return "acima de 1 mês";
}

function ActivityPage() {
  const user = getUser();
  const { activeRepo: repo } = useActiveRepo();
  const { period } = usePeriod();
  const { from, to } = period;
  const prev = previousRange(period);

  const { data: flow, isLoading, isError: errorFlow, refetch: refetchFlow } = useQuery({
    queryKey: ["flow", { repoId: repo?.id, authorLogin: user?.login, from, to }],
    queryFn: () => getFlowMetrics({ repoId: repo!.id, authorLogin: user!.login, from, to }),
    enabled: !!repo && !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: prevFlow } = useQuery({
    queryKey: ["flow", { repoId: repo?.id, authorLogin: user?.login, from: prev.from, to: prev.to }],
    queryFn: () => getFlowMetrics({ repoId: repo!.id, authorLogin: user!.login, from: prev.from, to: prev.to }),
    enabled: !!repo && !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: insights, isLoading: isLoadingInsights, isError: errorInsights, refetch: refetchInsights } = useQuery({
    queryKey: ["insights", { repoId: repo?.id, authorLogin: user?.login, from, to }],
    queryFn: () => getInsightsMetrics({ repoId: repo!.id, authorLogin: user!.login, from, to }),
    enabled: !!repo && !!user,
    staleTime: 1000 * 60 * 5,
  });

  const compareLabel = PRESET_COMPARE[period.preset];

  const pf = prevFlow?.individual;
  const dActiveDays = pf && flow ? computeDeltaPct(flow.individual.activeDays ?? 0, pf.activeDays ?? 0) : null;
  const dCycleTime = pf && flow ? computeDeltaPct(flow.individual.cycleTimeHours ?? 0, pf.cycleTimeHours ?? 0) : null;
  const dLeadTime = pf && flow ? computeDeltaPct(flow.individual.leadTimeHours ?? 0, pf.leadTimeHours ?? 0) : null;

  const indClass = insights?.individual?.commitClassification;
  const teamClass = insights?.team?.commitClassification;

  const bugFixRatioData = indClass
    ? [
        { name: "Funcionalidades (feat)", value: indClass.feat, color: "var(--emerald-glow)" },
        { name: "Correções (fix)", value: indClass.fix, color: "var(--ruby-glow)" },
        { name: "Outros", value: indClass.other, color: "var(--violet-glow)" },
      ].filter((d) => d.value > 0)
    : [];

  const teamBugFixData = teamClass
    ? [
        { name: "Features (feat)", value: teamClass.feat, color: "var(--emerald-glow)" },
        { name: "Bug Fixing (fix)", value: teamClass.fix, color: "var(--ruby-glow)" },
        { name: "Outros", value: teamClass.other, color: "var(--violet-glow)" },
      ].filter((d) => d.value > 0)
    : [];

  const ind = flow?.individual;
  const reviewSeries = (flow?.timeInReviewSeries ?? [])
    .filter((p) => p.avgHours != null && p.avgHours > 0)
    .slice(-30)
    .map((p) => ({
      date: p.date.slice(5),
      avgMinutes: Math.round(p.avgHours! * 60),
      status: p.avgHours! > 48 ? "blocked" : p.avgHours! > 16 ? "review" : "ok",
    }));

  const recentActivity = (flow?.recent ?? []).slice(0, 8);

  return (
    <div className="space-y-6 md:space-y-8">
      {errorFlow ? (
        <QueryError onRetry={refetchFlow} className="h-32" />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiCard
          label="Dias com Commit"
          value={isLoading ? "…" : `${ind?.activeDays ?? 0}`}
          delta={dActiveDays !== null ? { value: dActiveDays, neutral: true, compareLabel } : undefined}
        />
        <KpiCard
          label="Tempo de Ciclo do PR"
          value={isLoading ? "…" : `${((ind?.cycleTimeHours ?? 0)).toFixed(1)}h`}
          delta={dCycleTime !== null ? { value: dCycleTime, invert: true, compareLabel } : undefined}
          hint={cycleBenchmark(ind?.cycleTimeHours ?? 0)}
          info="Tempo do primeiro commit até o merge do PR. Referência DORA (elite): abaixo de 24h. Times de alta performance ficam abaixo de uma semana. Menor é melhor."
        />
        <KpiCard
          label="Tempo de Resolução de Issue"
          value={isLoading ? "…" : `${((ind?.leadTimeHours ?? 0) / 24).toFixed(1)}d`}
          delta={dLeadTime !== null ? { value: dLeadTime, invert: true, compareLabel } : undefined}
          hint={leadBenchmark(ind?.leadTimeHours ?? 0)}
          info="Tempo médio desde a abertura de uma issue até ela ser fechada (métrica DORA). Referência: elite < 1 dia, alto desempenho < 1 semana, médio < 1 mês. Menor é melhor."
        />
        <KpiCard
          label="Tamanho Médio de Commit"
          value={isLoading ? "…" : `${Math.round(ind?.tcm ?? 0)}`}
          info="Tamanho de Commit Médio (linhas alteradas por commit). É uma estatística descritiva do seu estilo de versionamento — não uma medida de produtividade. Volume de linhas de código foi desacreditado como proxy de valor entregue desde os anos 1970. Sem 'meta': nem mais nem menos é intrinsecamente melhor."
        />
      </div>
      )}

      {errorFlow ? null : (
      <GlassCard className="p-4 md:p-6">
        <div className="mb-4 md:mb-6">
          <h3 className="text-base font-semibold text-foreground">Tempo em Revisão</h3>
          <p className="text-xs text-muted-foreground">Minutos médios aguardando aprovação por dia</p>
        </div>
        {reviewSeries.length === 0 ? (
          <div className="h-52 md:h-72 flex items-center justify-center text-sm text-muted-foreground">
            Sem dados de revisão no período.
          </div>
        ) : (
          <div className="h-52 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reviewSeries} margin={{ bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="var(--obsidian-400)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                  contentStyle={{ background: "var(--obsidian-950)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [`${v} min`, "Tempo em revisão"]}
                />
                <Bar dataKey="avgMinutes" radius={[6, 6, 0, 0]}>
                  {reviewSeries.map((d, i) => (
                    <Cell
                      key={i}
                      fill={d.status === "blocked" ? "var(--ruby-glow)" : d.status === "review" ? "var(--amber-glow)" : "var(--emerald-glow)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </GlassCard>
      )}

      {errorInsights ? (
        <QueryError onRetry={refetchInsights} className="h-56" />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">Seus Commits por Tipo</h3>
          <p className="text-xs text-muted-foreground mb-4 md:mb-6">Classificação por Conventional Commits</p>
          {isLoadingInsights ? (
            <div className="h-56 flex items-center justify-center animate-pulse">
              <div className="size-28 rounded-full bg-obsidian-800/60" />
            </div>
          ) : bugFixRatioData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
              Sem commits classificados no período.
            </div>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={bugFixRatioData} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="none">
                      {bugFixRatioData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "var(--obsidian-950)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-3">
                {bugFixRatioData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-sm" style={{ background: d.color }} />
                      <span className="text-foreground">{d.name}</span>
                    </div>
                    <span className="font-mono text-muted-foreground tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">Equipe por Tipo</h3>
          <p className="text-xs text-muted-foreground mb-4 md:mb-6">Distribuição da equipe inteira</p>
          {isLoadingInsights ? (
            <div className="h-56 flex items-center justify-center animate-pulse">
              <div className="size-28 rounded-full bg-obsidian-800/60" />
            </div>
          ) : teamBugFixData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
              Sem dados de equipe disponíveis.
            </div>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={teamBugFixData} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="none">
                      {teamBugFixData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "var(--obsidian-950)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-3">
                {teamBugFixData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-sm" style={{ background: d.color }} />
                      <span className="text-foreground">{d.name}</span>
                    </div>
                    <span className="font-mono text-muted-foreground tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </GlassCard>
      </div>
      )}

      {errorFlow ? null : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Commits */}
        <GlassCard className="overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Commits Recentes</h3>
              <p className="text-xs text-muted-foreground">Últimos commits no período</p>
            </div>
            <div className="size-8 grid place-items-center rounded-lg border border-emerald-glow/30 bg-emerald-glow/5">
              <GitCommit className="size-4 text-emerald-glow" />
            </div>
          </div>
          {recentActivity.filter((a) => a.kind === "commit").length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Sem commits no período.</div>
          ) : (
            <ul className="divide-y divide-border">
              {recentActivity.filter((a) => a.kind === "commit").map((a, i) => (
                <li key={i} className="px-4 py-3 md:px-6 md:py-4 flex items-center gap-3 md:gap-4 hover:bg-obsidian-800/20 transition-colors">
                  <div className="size-9 grid place-items-center rounded-lg border border-emerald-glow/30 bg-emerald-glow/5 shrink-0">
                    <GitCommit className="size-4 text-emerald-glow" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      @{a.authorLogin} · {new Date(a.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {(a.additions != null && a.additions > 0) && (
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                        +{a.additions}
                      </span>
                    )}
                    {(a.deletions != null && a.deletions > 0) && (
                      <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-400">
                        -{a.deletions}
                      </span>
                    )}
                    {(a.additions == null || a.additions === 0) && (a.deletions == null || a.deletions === 0) && (
                      <CheckCircle2 className="size-4 text-emerald-glow/70" />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        {/* Pull Requests */}
        <GlassCard className="overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Pull Requests Recentes</h3>
              <p className="text-xs text-muted-foreground">Últimos PRs no período</p>
            </div>
            <div className="size-8 grid place-items-center rounded-lg border border-violet-glow/30 bg-violet-glow/5">
              <GitPullRequest className="size-4 text-violet-glow" />
            </div>
          </div>
          {recentActivity.filter((a) => a.kind === "pr").length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Sem PRs no período.</div>
          ) : (
            <ul className="divide-y divide-border">
              {recentActivity.filter((a) => a.kind === "pr").map((a, i) => {
                const tone =
                  a.state === "merged"
                    ? "text-violet-glow border-violet-glow/30 bg-violet-glow/5"
                    : a.state === "closed"
                    ? "text-emerald-glow border-emerald-glow/30 bg-emerald-glow/5"
                    : "text-amber-glow border-amber-glow/30 bg-amber-glow/5";
                return (
                  <li key={i} className="px-4 py-3 md:px-6 md:py-4 flex items-center gap-3 md:gap-4 hover:bg-obsidian-800/20 transition-colors">
                    <div className="size-9 grid place-items-center rounded-lg border border-violet-glow/30 bg-violet-glow/5 shrink-0">
                      <GitPullRequest className="size-4 text-violet-glow" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        @{a.authorLogin} · {new Date(a.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(a.additions != null && a.additions > 0) && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
                          +{a.additions}
                        </span>
                      )}
                      {(a.deletions != null && a.deletions > 0) && (
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-400">
                          -{a.deletions}
                        </span>
                      )}
                      <span className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded border ${tone}`}>
                        {a.state === "merged" ? "mesclado" : a.state === "open" ? "aberto" : a.state === "closed" ? "fechado" : a.state}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      </div>
      )}
    </div>
  );
}
