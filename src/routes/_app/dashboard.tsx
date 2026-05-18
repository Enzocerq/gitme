import { createFileRoute } from "@tanstack/react-router";
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
import { GitCommit, GitPullRequest, Gauge, CheckCircle2, ArrowUpRight } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { KpiCard } from "@/components/kpi-card";
import {
  mockActivitySeries,
  mockKPIs,
  mockRecentActivity,
  mockTeam,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — GitHealth" },
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

function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          label="Productivity Score"
          value={`${mockKPIs.score}`}
          delta={{ value: mockKPIs.scoreDelta }}
        >
          <div className="h-1.5 w-full bg-obsidian-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-glow shadow-[0_0_12px_rgba(16,185,129,0.5)]"
              style={{ width: `${mockKPIs.score}%` }}
            />
          </div>
        </KpiCard>

        <KpiCard
          label="PRs Mergeadas"
          value={`${mockKPIs.prsMerged}`}
          delta={{ value: 8.2 }}
          hint={`${mockKPIs.prsOpened} abertas no período`}
        />

        <KpiCard
          label="Lead Time"
          value={`${mockKPIs.leadTimeDays}d`}
          delta={{ value: mockKPIs.leadTimeDelta, invert: true }}
          hint="Da criação da issue ao merge"
        />

        <KpiCard
          label="Taxa de Aceitação"
          value={`${mockKPIs.acceptanceRate}%`}
          delta={{ value: mockKPIs.acceptanceDelta }}
        >
          <div className="flex gap-1">
            {[1, 1, 1, 1, 0].map((v, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-sm ${v ? "bg-emerald-glow" : "bg-ruby-glow/30"}`}
              />
            ))}
          </div>
        </KpiCard>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-foreground">Throughput Velocity</h3>
              <p className="text-xs text-muted-foreground">Commits e PRs nos últimos 30 dias</p>
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
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockActivitySeries}>
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
                <XAxis dataKey="day" stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="commits" stroke="var(--emerald-glow)" strokeWidth={2} fill="url(#gradCommits)" />
                <Area type="monotone" dataKey="prs" stroke="var(--violet-glow)" strokeWidth={2} fill="url(#gradPrs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-foreground">Score vs Média do Repo</h3>
            <p className="text-xs text-muted-foreground">Evolução comparativa</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockActivitySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="score" stroke="var(--emerald-glow)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="teamAvg" stroke="var(--obsidian-400)" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex gap-4 text-[10px] font-mono uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-glow" />
              Você
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-obsidian-400" />
              Repo avg
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Recent + Team */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Atividade Recente</h3>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Live
            </span>
          </div>
          <ul className="divide-y divide-border">
            {mockRecentActivity.slice(0, 5).map((a, i) => {
              const Icon = a.type === "commit" ? GitCommit : a.type === "pr" ? GitPullRequest : CheckCircle2;
              const dotColor =
                a.status === "ok"
                  ? "bg-emerald-glow"
                  : a.status === "merged"
                  ? "bg-violet-glow"
                  : a.status === "warn"
                  ? "bg-amber-glow"
                  : "bg-obsidian-400";
              return (
                <li key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-obsidian-800/20 transition-colors">
                  <Icon className="size-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {a.repo} • {a.time} atrás
                    </p>
                  </div>
                  <span className={`size-2 rounded-full ${dotColor}`} />
                  <span className="text-[11px] font-mono text-muted-foreground tabular-nums">{a.diff}</span>
                </li>
              );
            })}
          </ul>
        </GlassCard>

        <GlassCard className="overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground">Top Contribuidores</h3>
            <Gauge className="size-4 text-emerald-glow" />
          </div>
          <ul className="divide-y divide-border">
            {mockTeam.slice(0, 5).map((m) => (
              <li key={m.login} className="px-6 py-4 flex items-center gap-4">
                <img src={m.avatar} alt={m.name} className="size-9 rounded-full border border-border" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">@{m.login} • {m.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold font-mono text-emerald-glow">{m.score}</p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">score</p>
                </div>
                <div className="flex gap-0.5 items-end h-6">
                  {m.trend.map((v, i) => (
                    <div key={i} className="w-1.5 bg-emerald-glow/70 rounded-sm" style={{ height: `${v * 14}%` }} />
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <div className="p-4">
            <button className="w-full py-2.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-obsidian-800/40 transition-colors flex items-center justify-center gap-2">
              Ver equipe completa <ArrowUpRight className="size-3.5" />
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
