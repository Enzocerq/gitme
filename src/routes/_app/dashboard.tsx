import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GitCommit, GitPullRequest, Gauge, CheckCircle2, ArrowUpRight, Loader2 } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { KpiCard } from "@/components/kpi-card";
import { getOverviewMetrics, getFlowMetrics, getCollaborationMetrics } from "@/lib/api";
import { getUser, getSelectedRepo, defaultDateRange } from "@/lib/auth";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — GITME" },
      { name: "description", content: "Resumo executivo de commits, PRs, score de produtividade e taxa de aceitação." },
    ],
  }),
  component: DashboardPage,
});

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-obsidian-950/95 backdrop-blur-xl px-3 py-2 text-xs font-mono shadow-2xl">
      <p className="text-muted-foreground uppercase tracking-widest text-[10px] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.dataKey}: <span className="text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-obsidian-900/40 border border-border" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 rounded-2xl bg-obsidian-900/40 border border-border" />
        <div className="h-80 rounded-2xl bg-obsidian-900/40 border border-border" />
      </div>
    </div>
  );
}

function DashboardPage() {
  const user = getUser();
  const repo = getSelectedRepo();
  const { from, to } = defaultDateRange();

  const params = { repoId: repo?.id ?? 0, authorLogin: user?.login ?? "", from, to };

  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["overview", params],
    queryFn: () => getOverviewMetrics(params),
    enabled: !!repo && !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: flow } = useQuery({
    queryKey: ["flow", params],
    queryFn: () => getFlowMetrics(params),
    enabled: !!repo && !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: collab } = useQuery({
    queryKey: ["collaboration", params],
    queryFn: () => getCollaborationMetrics(params),
    enabled: !!repo && !!user,
    staleTime: 1000 * 60 * 5,
  });

  if (loadingOverview || !overview) return <LoadingSkeleton />;

  const raw = overview.individual;
  const ind = {
    acceptanceRate: raw.acceptanceRate ?? 0,
    prsMerged: raw.prsMerged ?? 0,
    prsOpened: raw.prsOpened ?? 0,
    commits: raw.commits ?? 0,
  };
  const leadTimeDays = flow ? ((flow.individual.leadTimeHours ?? 0) / 24) : 0;

  const activitySeries = (overview.activityOverTime ?? []).map((p) => ({
    day: new Date(p.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    date: p.date,
    commits: p.commits,
    prs: p.prs,
    teamCommits: p.teamCommits,
    teamPrs: p.teamPrs,
  }));
  const xAxisInterval = Math.max(0, Math.ceil(activitySeries.length / 8) - 1);

  const recentActivity = (flow?.recent ?? []).slice(0, 5).map((item) => ({
    type: item.kind === "commit" ? "commit" : "pr",
    title: item.title,
    repo: repo?.name ?? "",
    time: formatRelativeTime(item.date),
    diff: "—",
    status: item.state === "closed" || item.state === "merged" ? "merged" : item.state === "open" ? "open" : "ok",
  }));

  const contributors = (collab?.reviewDistribution ?? []).slice(0, 5).map((r) => ({
    login: r.login,
    name: r.login,
    reviews: r.reviews,
    avatar: `https://github.com/${r.login}.png`,
  }));

  return (
    <div className="space-y-6 md:space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiCard
          label="Taxa de Aceitação"
          value={`${ind.acceptanceRate.toFixed(1)}%`}
          delta={{ value: 0 }}
          hint={`${ind.prsMerged} PRs mergeadas`}
        >
          <div className="flex gap-1">
            {[1, 1, 1, ind.acceptanceRate > 50 ? 1 : 0, ind.acceptanceRate > 80 ? 1 : 0].map((v, i) => (
              <div key={i} className={`h-2 flex-1 rounded-sm ${v ? "bg-emerald-glow" : "bg-ruby-glow/30"}`} />
            ))}
          </div>
        </KpiCard>

        <KpiCard
          label="PRs Mergeadas"
          value={`${ind.prsMerged}`}
          hint={`${ind.prsOpened} abertas no período`}
        />

        <KpiCard
          label="Tempo de Lead"
          value={`${leadTimeDays.toFixed(1)}d`}
          delta={flow ? { value: 0, invert: true } : undefined}
          hint="Da issue ao merge"
        />

        <KpiCard
          label="Commits"
          value={`${ind.commits}`}
          hint={`Equipe: ${overview.team.commits}`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <GlassCard className="lg:col-span-2 p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-4 md:mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Velocidade de Entrega</h3>
              <p className="text-xs text-muted-foreground">Commits e PRs no período</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
                <span className="size-2 rounded-full bg-emerald-glow shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                Commits
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest">
                <span className="size-2 rounded-full bg-violet-glow shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                PRs
              </div>
            </div>
          </div>
          <div className="h-52 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activitySeries}>
                <defs>
                  <linearGradient id="gradCommits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--emerald-glow)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--emerald-glow)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPrs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--violet-glow)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--violet-glow)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} interval={xAxisInterval} />
                <YAxis stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="commits" stroke="var(--emerald-glow)" strokeWidth={2} fill="url(#gradCommits)" />
                <Area type="monotone" dataKey="prs" stroke="var(--violet-glow)" strokeWidth={2} fill="url(#gradPrs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-4 md:p-6">
          <div className="mb-4 md:mb-6">
            <h3 className="text-base font-semibold text-foreground">Você vs Equipe</h3>
            <p className="text-xs text-muted-foreground">Commits diários comparados</p>
          </div>
          <div className="h-52 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activitySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} interval={xAxisInterval} />
                <YAxis stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="commits" stroke="var(--emerald-glow)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="teamCommits" stroke="var(--obsidian-400)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex gap-4 text-[10px] font-mono uppercase tracking-widest">
            <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-glow" />Você</div>
            <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-obsidian-400" />Equipe</div>
          </div>
        </GlassCard>
      </div>

      {/* Recent + Contributors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <GlassCard className="overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Atividade Recente</h3>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Ao vivo</span>
          </div>
          {recentActivity.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Sem atividade no período.</div>
          ) : (
            <ul className="divide-y divide-border">
              {recentActivity.map((a, i) => {
                const Icon = a.type === "commit" ? GitCommit : a.type === "pr" ? GitPullRequest : CheckCircle2;
                const dotColor = a.status === "ok" ? "bg-emerald-glow" : a.status === "merged" ? "bg-violet-glow" : "bg-amber-glow";
                return (
                  <li key={i} className="px-4 py-3 md:px-6 md:py-4 flex items-center gap-3 md:gap-4 hover:bg-obsidian-800/20 transition-colors">
                    <Icon className="size-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{a.repo} • {a.time}</p>
                    </div>
                    <span className={`size-2 rounded-full ${dotColor}`} />
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Top Revisores</h3>
            <Gauge className="size-4 text-emerald-glow" />
          </div>
          {contributors.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Sem dados de revisão no período.</div>
          ) : (
            <>
              <ul className="divide-y divide-border">
                {contributors.map((m) => (
                  <li key={m.login} className="px-4 py-3 md:px-6 md:py-4 flex items-center gap-3 md:gap-4">
                    <img src={m.avatar} alt={m.name} className="size-9 rounded-full border border-border" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">@{m.login}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold font-mono text-emerald-glow">{m.reviews}</p>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase">revisões</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="p-4">
                <button className="w-full py-2.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-obsidian-800/40 transition-colors flex items-center justify-center gap-2">
                  Ver colaboração completa <ArrowUpRight className="size-3.5" />
                </button>
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "< 1h atrás";
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d atrás`;
  return `${Math.floor(diffD / 30)}m atrás`;
}
