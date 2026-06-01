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
import { GitCommit, GitPullRequest, Gauge, CheckCircle2, ArrowUpRight, Loader2, Zap } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { KpiCard } from "@/components/kpi-card";
import { getOverviewMetrics, getFlowMetrics, getCollaborationMetrics, getProductivityScore } from "@/lib/api";
import type { ProductivityScoreResponse } from "@/lib/api";
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

const SCORE_COMPONENTS: Array<{
  key: keyof Omit<ProductivityScoreResponse, "scoreFinal">;
  label: string;
  weight: number;
  color: string;
  meta: string;
}> = [
  { key: "entrega",      label: "Entrega",      weight: 35, color: "#10b981", meta: "meta: 50 unid." },
  { key: "eficiencia",   label: "Eficiência",   weight: 25, color: "#8b5cf6", meta: "meta: 3 dias" },
  { key: "qualidade",    label: "Qualidade",    weight: 20, color: "#f59e0b", meta: "meta: 80% merge" },
  { key: "colaboracao",  label: "Colaboração",  weight: 10, color: "#06b6d4", meta: "meta: 8 reviews" },
  { key: "consistencia", label: "Consistência", weight: 10, color: "#f97316", meta: "meta: 20 dias" },
];

function getScoreLabel(s: number) {
  if (s >= 90) return "Excelente";
  if (s >= 75) return "Ótimo";
  if (s >= 60) return "Bom";
  if (s >= 45) return "Regular";
  return "Crítico";
}

function getScoreColor(s: number) {
  if (s >= 75) return "#10b981";
  if (s >= 50) return "#f59e0b";
  return "#ef4444";
}

function ProductivityScorePanel({ data, loading }: { data?: ProductivityScoreResponse; loading: boolean }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const score = data?.scoreFinal ?? 0;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <GlassCard className="p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-5">
        <div className="flex items-center gap-2">
          <Zap className="size-4" style={{ color: "#f59e0b" }} />
          <h3 className="text-base font-semibold text-foreground">Score de Produtividade</h3>
        </div>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">últimos 30 dias</span>
      </div>

      {loading && !data ? (
        <div className="flex items-center gap-6 animate-pulse">
          <div className="w-36 h-36 rounded-full bg-obsidian-900/60 flex-shrink-0" />
          <div className="flex-1 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3 w-32 rounded bg-obsidian-900/60" />
                <div className="h-1.5 rounded-full bg-obsidian-900/60" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-10">
          {/* Donut ring */}
          <div className="relative w-36 h-36 flex-shrink-0">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" style={{ overflow: "visible" }} aria-hidden="true">
              <circle cx="60" cy="60" r={r} fill="none" stroke="oklch(1 0 0 / 0.06)" strokeWidth="9" />
              <circle
                cx="60" cy="60" r={r} fill="none"
                stroke={color}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={circ - (score / 100) * circ}
                style={{ filter: `drop-shadow(0 0 8px ${color})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold font-mono leading-none" style={{ color }}>
                {score.toFixed(0)}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground tracking-widest mt-0.5">/100</span>
              <span
                className="text-[9px] font-mono uppercase tracking-widest mt-2 px-2 py-0.5 rounded-full border"
                style={{ color, borderColor: `${color}40` }}
              >
                {label}
              </span>
            </div>
          </div>

          {/* Component bars */}
          <div className="flex-1 w-full space-y-3">
            {SCORE_COMPONENTS.map((comp) => {
              const value = data ? data[comp.key] : 0;
              const clamped = Math.min(100, Math.max(0, value));
              return (
                <div key={comp.key}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: comp.color, boxShadow: `0 0 4px ${comp.color}` }}
                      />
                      <span className="text-foreground">{comp.label}</span>
                      <span className="text-muted-foreground/50">{comp.weight}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span className="text-muted-foreground/50">{comp.meta}</span>
                      <span className="tabular-nums font-bold" style={{ color: comp.color }}>
                        {clamped.toFixed(0)}
                        <span className="text-muted-foreground font-normal">/100</span>
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${clamped}%`,
                        background: comp.color,
                        boxShadow: `0 0 6px ${comp.color}`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </GlassCard>
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

  const { data: scoreData, isLoading: loadingScore } = useQuery({
    queryKey: ["productivityScore", user?.login, from, to],
    queryFn: () => getProductivityScore(user!.login, from, to),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  if (loadingOverview || !overview) return <LoadingSkeleton />;

  const raw = overview.individual;
  const ind = {
    acceptanceRate: (raw.acceptanceRate ?? 0) * 100,
    prsMerged: raw.prsMerged ?? 0,
    prsOpened: raw.prsOpened ?? 0,
    commits: raw.commits ?? 0,
  };
  const leadTimeDays = flow ? ((flow.individual.leadTimeHours ?? 0) / 24) : 0;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const activitySeries = (overview.activityOverTime ?? [])
    .filter((p) => new Date(p.date) >= cutoff)
    .map((p) => ({
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
    status: item.state === "closed" || item.state === "merged" ? "merged" : item.state === "open" ? "open" : "ok",
    additions: item.additions,
    deletions: item.deletions,
  }));

  const contributors = (collab?.reviewDistribution ?? []).slice(0, 5).map((r) => ({
    login: r.login,
    name: r.login,
    reviews: r.reviews,
    avatar: `https://github.com/${r.login}.png`,
  }));

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Productivity Score */}
      <ProductivityScorePanel data={scoreData} loading={loadingScore} />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiCard
          label="Commits"
          value={`${ind.commits}`}
          hint={`Equipe: ${overview.team.commits}`}
        />

        <KpiCard
          label="PRs Mergeadas"
          value={`${ind.prsMerged}`}
          hint={`${ind.prsOpened} abertas no período`}
        />

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
          label="Tempo de Lead"
          value={`${leadTimeDays.toFixed(1)}d`}
          delta={flow ? { value: 0, invert: true } : undefined}
          hint="Da issue ao merge"
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
                const iconColor = a.type === "commit" ? "text-emerald-glow" : "text-violet-glow";
                const iconBorder = a.type === "commit" ? "border-emerald-glow/30 bg-emerald-glow/5" : "border-violet-glow/30 bg-violet-glow/5";
                return (
                  <li key={i} className="px-4 py-3 md:px-6 md:py-4 flex items-center gap-3 md:gap-4 hover:bg-obsidian-800/20 transition-colors">
                    <div className={`size-9 grid place-items-center rounded-lg border bg-obsidian-900/60 shrink-0 ${iconBorder}`}>
                      <Icon className={`size-4 ${iconColor}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{a.repo} • {a.time}</p>
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
                    </div>
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
