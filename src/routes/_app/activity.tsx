import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GitCommit, GitPullRequest, CheckCircle2, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { KpiCard } from "@/components/kpi-card";
import { getFlowMetrics } from "@/lib/api";
import { getUser, getSelectedRepo, defaultDateRange } from "@/lib/auth";

export const Route = createFileRoute("/_app/activity")({
  head: () => ({
    meta: [
      { title: "Atividade — GITME" },
      { name: "description", content: "Commits, PRs, issues, cycle time, lead time e TCM." },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const user = getUser();
  const repo = getSelectedRepo();
  const { from, to } = defaultDateRange();

  const { data: flow, isLoading } = useQuery({
    queryKey: ["flow", { repoId: repo?.id, authorLogin: user?.login, from, to }],
    queryFn: () => getFlowMetrics({ repoId: repo!.id, authorLogin: user!.login, from, to }),
    enabled: !!repo && !!user,
    staleTime: 1000 * 60 * 5,
  });

  const ind = flow?.individual;
  const reviewSeries = (flow?.timeInReviewSeries ?? []).slice(-10).map((p) => ({
    date: p.date.slice(5),
    avgHours: Math.round((p.avgHours ?? 0) * 10) / 10,
    status: (p.avgHours ?? 0) > 48 ? "blocked" : (p.avgHours ?? 0) > 16 ? "review" : "ok",
  }));

  const recentActivity = (flow?.recent ?? []).slice(0, 8);

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiCard
          label="Dias Ativos"
          value={isLoading ? "…" : `${ind?.activeDays ?? 0}`}
          hint="dos últimos 365 dias"
        />
        <KpiCard
          label="Cycle Time"
          value={isLoading ? "…" : `${((ind?.cycleTimeHours ?? 0)).toFixed(1)}h`}
          hint="primeiro commit → merge"
        />
        <KpiCard
          label="Lead Time"
          value={isLoading ? "…" : `${((ind?.leadTimeHours ?? 0) / 24).toFixed(1)}d`}
          hint="issue criada → resolvida"
        />
        <KpiCard
          label="TCM"
          value={isLoading ? "…" : `${Math.round(ind?.tcm ?? 0)}`}
          hint="linhas alteradas / commit"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <GlassCard className="p-4 md:p-6">
          <div className="mb-4 md:mb-6">
            <h3 className="text-base font-semibold text-foreground">Time in Review</h3>
            <p className="text-xs text-muted-foreground">Horas médias aguardando aprovação por dia</p>
          </div>
          {reviewSeries.length === 0 ? (
            <div className="h-52 md:h-72 flex items-center justify-center text-sm text-muted-foreground">
              Sem dados de revisão no período.
            </div>
          ) : (
            <div className="h-52 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reviewSeries} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" horizontal={false} />
                  <XAxis type="number" stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="date" stroke="var(--obsidian-400)" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                    contentStyle={{ background: "var(--obsidian-950)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="avgHours" radius={[0, 6, 6, 0]}>
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

        <GlassCard className="p-4 md:p-6">
          <div className="mb-4 md:mb-6">
            <h3 className="text-base font-semibold text-foreground">Métricas da Equipe</h3>
            <p className="text-xs text-muted-foreground">Comparativo individual vs equipe</p>
          </div>
          <div className="space-y-5 mt-4">
            {flow && [
              {
                label: "Cycle Time",
                you: `${(flow.individual.cycleTimeHours ?? 0).toFixed(1)}h`,
                team: `${(flow.team.cycleTimeHours ?? 0).toFixed(1)}h`,
                ratio: (flow.team.cycleTimeHours ?? 0) > 0 ? Math.min((flow.individual.cycleTimeHours ?? 0) / flow.team.cycleTimeHours!, 2) : 0,
                invert: true,
              },
              {
                label: "Lead Time",
                you: `${((flow.individual.leadTimeHours ?? 0) / 24).toFixed(1)}d`,
                team: `${((flow.team.leadTimeHours ?? 0) / 24).toFixed(1)}d`,
                ratio: (flow.team.leadTimeHours ?? 0) > 0 ? Math.min((flow.individual.leadTimeHours ?? 0) / flow.team.leadTimeHours!, 2) : 0,
                invert: true,
              },
              {
                label: "TCM",
                you: `${Math.round(flow.individual.tcm ?? 0)} linhas`,
                team: `${Math.round(flow.team.tcm ?? 0)} linhas`,
                ratio: (flow.team.tcm ?? 0) > 0 ? Math.min((flow.individual.tcm ?? 0) / flow.team.tcm!, 2) : 0,
                invert: false,
              },
              {
                label: "Time in Review",
                you: `${(flow.individual.timeInReviewHours ?? 0).toFixed(1)}h`,
                team: `${(flow.team.timeInReviewHours ?? 0).toFixed(1)}h`,
                ratio: (flow.team.timeInReviewHours ?? 0) > 0 ? Math.min((flow.individual.timeInReviewHours ?? 0) / flow.team.timeInReviewHours!, 2) : 0,
                invert: true,
              },
            ].map((b) => {
              const pct = Math.round(b.ratio * 50);
              const good = b.invert ? b.ratio <= 1 : b.ratio >= 1;
              const barColor = good ? "bg-emerald-glow" : "bg-ruby-glow";
              return (
                <div key={b.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">{b.label}</span>
                    <span className="font-mono text-foreground">
                      Você: {b.you} · Equipe: {b.team}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-obsidian-800 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Timeline cronológica</h3>
          <p className="text-xs text-muted-foreground">Últimos commits, PRs e issues</p>
        </div>
        {recentActivity.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Sem atividade no período.</div>
        ) : (
          <ul className="divide-y divide-border">
            {recentActivity.map((a, i) => {
              const Icon = a.kind === "commit" ? GitCommit : a.kind === "pr" ? GitPullRequest : AlertTriangle;
              const tone =
                a.state === "merged"
                  ? "text-violet-glow border-violet-glow/30 bg-violet-glow/5"
                  : a.state === "closed"
                  ? "text-emerald-glow border-emerald-glow/30 bg-emerald-glow/5"
                  : "text-amber-glow border-amber-glow/30 bg-amber-glow/5";
              return (
                <li key={i} className="px-4 py-3 md:px-6 md:py-4 flex items-center gap-3 md:gap-4 hover:bg-obsidian-800/20 transition-colors">
                  <div className="size-9 grid place-items-center rounded-lg border border-border bg-obsidian-900/60">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      @{a.authorLogin} · {new Date(a.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded border ${tone}`}>
                    {a.state}
                  </span>
                  {a.kind === "commit" || a.kind === "pr" ? (
                    <CheckCircle2 className="size-4 text-emerald-glow/70" />
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}
