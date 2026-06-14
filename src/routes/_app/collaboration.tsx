import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Users, Info } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { QueryError } from "@/components/query-state";
import { getCollaborationMetrics, getFlowMetrics } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { useActiveRepo } from "@/hooks/use-active-repo";
import { usePeriod } from "@/hooks/use-period";

export const Route = createFileRoute("/_app/collaboration")({
  head: () => ({
    meta: [
      { title: "Equipe — GITME" },
      { name: "description", content: "Você vs equipe e distribuição de revisões de Pull Requests." },
    ],
  }),
  component: CollaborationPage,
});

function CollaborationPage() {
  const user = getUser();
  const { activeRepo: repo } = useActiveRepo();
  const { from, to } = usePeriod().period;

  const { data: collab, isLoading, isError, refetch } = useQuery({
    queryKey: ["collaboration", { repoId: repo?.id, authorLogin: user?.login, from, to }],
    queryFn: () => getCollaborationMetrics({ repoId: repo!.id, authorLogin: user!.login, from, to }),
    enabled: !!repo && !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: flow, isLoading: isLoadingFlow } = useQuery({
    queryKey: ["flow", { repoId: repo?.id, authorLogin: user?.login, from, to }],
    queryFn: () => getFlowMetrics({ repoId: repo!.id, authorLogin: user!.login, from, to }),
    enabled: !!repo && !!user,
    staleTime: 1000 * 60 * 5,
  });

  const reviewDistribution = (collab?.reviewDistribution ?? []).map((r) => ({
    reviewer: r.login,
    reviewed: r.reviews,
  }));

  const comparison = collab?.comparison;
  // Barras pareadas por linha — cada métrica normalizada na sua própria escala.
  // Métricas de volume (commits/PRs) não têm valência; métricas de tempo: menor é melhor.
  const comparisonRows = [
    ...(comparison ? [
      { label: "Commits", youNum: comparison.individual.commits, teamNum: comparison.teamAverage.commits, fmt: (n: number) => `${Math.round(n)}`, invert: false, hasValence: false },
      { label: "PRs Mergeadas", youNum: comparison.individual.prsMerged, teamNum: comparison.teamAverage.prsMerged, fmt: (n: number) => `${Math.round(n)}`, invert: false, hasValence: false },
    ] : []),
    ...(flow ? [
      { label: "Tempo de Ciclo do PR", youNum: flow.individual.cycleTimeHours ?? 0, teamNum: flow.team.cycleTimeHours ?? 0, fmt: (n: number) => `${n.toFixed(1)}h`, invert: true, hasValence: true },
      { label: "Tempo de Resolução de Issue", youNum: (flow.individual.leadTimeHours ?? 0) / 24, teamNum: (flow.team.leadTimeHours ?? 0) / 24, fmt: (n: number) => `${n.toFixed(1)}d`, invert: true, hasValence: true },
      { label: "Tamanho Médio de Commit", youNum: flow.individual.tcm ?? 0, teamNum: flow.team.tcm ?? 0, fmt: (n: number) => `${Math.round(n)} linhas`, invert: false, hasValence: false },
      { label: "Tempo em Revisão", youNum: (flow.individual.timeInReviewHours ?? 0) * 60, teamNum: (flow.team.timeInReviewHours ?? 0) * 60, fmt: (n: number) => `${Math.round(n)} min`, invert: true, hasValence: true },
    ] : []),
  ];

  const myReviews = reviewDistribution.find((r) => r.reviewer === user?.login)?.reviewed ?? 0;

  // Mediana das revisões: mais robusta a outliers que a média em times grandes.
  const sortedReviews = reviewDistribution.map((r) => r.reviewed).sort((a, b) => a - b);
  const medianReviews = sortedReviews.length
    ? sortedReviews.length % 2 === 1
      ? sortedReviews[(sortedReviews.length - 1) / 2]
      : (sortedReviews[sortedReviews.length / 2 - 1] + sortedReviews[sortedReviews.length / 2]) / 2
    : 0;

  if (isError) {
    return <QueryError onRetry={refetch} className="h-64 mt-4" />;
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <GlassCard className="p-6 flex items-center gap-4">
          <div className="size-12 rounded-xl grid place-items-center bg-emerald-glow/10 border border-emerald-glow/20">
            <Users className="size-5 text-emerald-glow" />
          </div>
          <div>
            <p className="text-3xl font-bold font-mono text-foreground tabular-nums">
              {isLoading ? "…" : (collab?.activeContributors ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">Contribuidores ativos no repositório</p>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">PRs revisadas (você)</p>
          <p className="text-3xl font-bold font-mono text-foreground tabular-nums">
            {isLoading ? "…" : myReviews}
          </p>
          <p className="text-xs text-emerald-glow mt-1">no período selecionado</p>
        </GlassCard>

        <GlassCard className="p-6">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Seus commits</p>
          <p className="text-3xl font-bold font-mono text-foreground tabular-nums">
            {isLoading ? "…" : Math.round(comparison?.individual.commits ?? 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Equipe: {Math.round(comparison?.teamAverage.commits ?? 0)} (média)
          </p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <GlassCard className="p-4 md:p-6">
          <div className="mb-4 md:mb-6 flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-foreground">Você vs Média da Equipe</h3>
              <p className="text-xs text-muted-foreground">Comparação completa · escala por métrica</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest shrink-0">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-glow" />Você</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-obsidian-400" />Equipe</span>
            </div>
          </div>
          {isLoading || isLoadingFlow ? (
            <div className="h-64 md:h-80 flex items-center justify-center text-sm text-muted-foreground animate-pulse">
              Carregando…
            </div>
          ) : comparisonRows.length === 0 ? (
            <div className="h-64 md:h-80 flex items-center justify-center text-sm text-muted-foreground">
              Sem dados de comparação disponíveis.
            </div>
          ) : (
            <div className="space-y-5 py-2">
              {comparisonRows.map((b) => {
                const rowMax = Math.max(b.youNum, b.teamNum, 0.0001);
                const youW = Math.max((b.youNum / rowMax) * 100, b.youNum > 0 ? 2 : 0);
                const teamW = Math.max((b.teamNum / rowMax) * 100, b.teamNum > 0 ? 2 : 0);
                const good = b.hasValence ? (b.invert ? b.youNum <= b.teamNum : b.youNum >= b.teamNum) : false;
                const youColor = !b.hasValence ? "bg-emerald-glow" : good ? "bg-emerald-glow" : "bg-ruby-glow";
                return (
                  <div key={b.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">{b.label}</span>
                      <span className="font-mono text-foreground tabular-nums">
                        {b.fmt(b.youNum)} <span className="text-muted-foreground/50">·</span> {b.fmt(b.teamNum)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2.5 w-full bg-obsidian-800/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${youColor} transition-all duration-500`}
                          style={{ width: `${youW}%` }}
                          role="progressbar"
                          aria-label={`Você — ${b.label}: ${b.fmt(b.youNum)}`}
                        />
                      </div>
                      <div className="h-2.5 w-full bg-obsidian-800/60 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-obsidian-400 transition-all duration-500"
                          style={{ width: `${teamW}%` }}
                          role="progressbar"
                          aria-label={`Média da equipe — ${b.label}: ${b.fmt(b.teamNum)}`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed border-t border-border pt-3">
                TCM (linhas/commit) é estatística descritiva de estilo, não medida de produtividade — comparar não implica "melhor". Métricas de tempo: verde = você está abaixo da média da equipe.
              </p>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-4 md:p-6">
          <div className="mb-4 md:mb-6">
            <h3 className="text-base font-semibold text-foreground">Distribuição de Revisões</h3>
            <p className="text-xs text-muted-foreground">PRs revisadas por membro · linha = mediana da equipe</p>
          </div>
          {reviewDistribution.length === 0 ? (
            <div className="h-64 md:h-80 flex items-center justify-center text-sm text-muted-foreground">
              Sem dados de revisão disponíveis.
            </div>
          ) : (
            <>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reviewDistribution} layout="vertical" margin={{ left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" horizontal={false} />
                    <XAxis type="number" stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="reviewer" stroke="var(--obsidian-400)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                    <Tooltip
                      cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                      contentStyle={{ background: "var(--obsidian-950)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    />
                    {medianReviews > 0 && (
                      <ReferenceLine
                        x={medianReviews}
                        stroke="var(--amber-glow)"
                        strokeDasharray="4 4"
                        label={{ value: `mediana ${medianReviews}`, position: "top", fill: "var(--amber-glow)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                      />
                    )}
                    <Bar dataKey="reviewed" radius={[0, 6, 6, 0]}>
                      {reviewDistribution.map((d, i) => (
                        <Cell key={i} fill={d.reviewer === user?.login ? "var(--emerald-glow)" : "var(--violet-glow)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-3 flex items-start gap-2 text-[10px] text-muted-foreground/70 leading-relaxed border-t border-border pt-3">
                <Info className="size-3 shrink-0 mt-0.5" />
                A <span className="text-amber-glow">mediana</span> resiste a outliers melhor que a média — em times grandes, poucos revisores muito ativos distorcem a média e penalizam injustamente os demais.
              </p>
            </>
          )}
        </GlassCard>
      </div>

    </div>
  );
}
