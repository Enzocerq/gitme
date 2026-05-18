import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GitCommit, GitPullRequest, CheckCircle2, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { KpiCard } from "@/components/kpi-card";
import { mockKPIs, mockRecentActivity, mockTimeInReview } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/activity")({
  head: () => ({
    meta: [
      { title: "Atividade — GitHealth" },
      { name: "description", content: "Commits, PRs, issues, cycle time, lead time e TCM." },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Dias Ativos" value={`${mockKPIs.activeDays}`} hint="dos últimos 30" />
        <KpiCard
          label="Cycle Time"
          value={`${mockKPIs.cycleTimeHours}h`}
          delta={{ value: mockKPIs.cycleTimeDelta, suffix: "h", invert: true }}
          hint="primeiro commit → merge"
        />
        <KpiCard
          label="Lead Time"
          value={`${mockKPIs.leadTimeDays}d`}
          delta={{ value: mockKPIs.leadTimeDelta, invert: true }}
          hint="issue criada → resolvida"
        />
        <KpiCard label="TCM" value={`${mockKPIs.tcm}`} hint="linhas alteradas / commit" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-foreground">Time in Review</h3>
            <p className="text-xs text-muted-foreground">Horas aguardando aprovação por PR</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockTimeInReview} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" horizontal={false} />
                <XAxis type="number" stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="pr" stroke="var(--obsidian-400)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                  contentStyle={{ background: "var(--obsidian-950)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="hours" radius={[0, 6, 6, 0]}>
                  {mockTimeInReview.map((d, i) => (
                    <rect
                      key={i}
                      fill={
                        d.status === "blocked"
                          ? "var(--ruby-glow)"
                          : d.status === "review"
                          ? "var(--amber-glow)"
                          : "var(--emerald-glow)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-foreground">Distribuição de Tamanho</h3>
            <p className="text-xs text-muted-foreground">Commits por faixa de linhas alteradas</p>
          </div>
          <div className="space-y-5 mt-8">
            {[
              { label: "Pequeno (< 50 linhas)", value: 58, color: "bg-emerald-glow" },
              { label: "Médio (50 – 200)", value: 28, color: "bg-violet-glow" },
              { label: "Grande (200 – 500)", value: 10, color: "bg-amber-glow" },
              { label: "XL (> 500)", value: 4, color: "bg-ruby-glow" },
            ].map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="font-mono text-foreground">{b.value}%</span>
                </div>
                <div className="h-2 w-full bg-obsidian-800 rounded-full overflow-hidden">
                  <div className={`h-full ${b.color}`} style={{ width: `${b.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Timeline cronológica</h3>
          <p className="text-xs text-muted-foreground">Últimos commits, PRs e issues</p>
        </div>
        <ul className="divide-y divide-border">
          {mockRecentActivity.map((a, i) => {
            const Icon = a.type === "commit" ? GitCommit : a.type === "pr" ? GitPullRequest : AlertTriangle;
            const tone =
              a.status === "merged"
                ? "text-violet-glow border-violet-glow/30 bg-violet-glow/5"
                : a.status === "warn"
                ? "text-amber-glow border-amber-glow/30 bg-amber-glow/5"
                : a.status === "open"
                ? "text-emerald-glow border-emerald-glow/30 bg-emerald-glow/5"
                : "text-muted-foreground border-border bg-obsidian-800/30";
            return (
              <li key={i} className="px-6 py-4 flex items-center gap-4 hover:bg-obsidian-800/20 transition-colors">
                <div className="size-9 grid place-items-center rounded-lg border border-border bg-obsidian-900/60">
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {a.repo} • há {a.time}
                  </p>
                </div>
                <span className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded border ${tone}`}>
                  {a.status}
                </span>
                <span className="text-xs font-mono text-muted-foreground tabular-nums hidden sm:inline">
                  {a.diff}
                </span>
                {a.type === "commit" || a.type === "pr" ? (
                  <CheckCircle2 className="size-4 text-emerald-glow/70" />
                ) : null}
              </li>
            );
          })}
        </ul>
      </GlassCard>
    </div>
  );
}
