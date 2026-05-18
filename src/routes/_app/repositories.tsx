import { createFileRoute } from "@tanstack/react-router";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { GitBranch, GitCommit, GitPullRequest, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { mockRepos } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/repositories")({
  head: () => ({
    meta: [
      { title: "Repositórios — GitHealth" },
      { name: "description", content: "Análise de esforço por repositório, participação relativa e taxa de produção." },
    ],
  }),
  component: ReposPage,
});

function ReposPage() {
  const pieData = mockRepos.map((r) => ({ name: r.name, value: r.commits, color: r.color }));
  const totalCommits = mockRepos.reduce((s, r) => s + r.commits, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Repositórios Conectados</h3>
              <p className="text-xs text-muted-foreground">{mockRepos.length} projetos ativos</p>
            </div>
            <button className="text-xs font-mono text-emerald-glow uppercase tracking-widest hover:text-emerald-glow/80">
              + Conectar
            </button>
          </div>
          <ul className="divide-y divide-border">
            {mockRepos.map((r) => (
              <li key={r.name} className="px-6 py-5 hover:bg-obsidian-800/20 transition-colors">
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="size-10 rounded-lg grid place-items-center"
                    style={{ background: `${r.color}20`, border: `1px solid ${r.color}40` }}
                  >
                    <GitBranch className="size-4" style={{ color: r.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{r.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{r.language}</p>
                  </div>
                  <div className="flex gap-6 text-right">
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Commits</p>
                      <p className="text-base font-bold font-mono text-foreground tabular-nums">{r.commits}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">PRs</p>
                      <p className="text-base font-bold font-mono text-foreground tabular-nums">{r.prs}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">TP</p>
                      <p className="text-base font-bold font-mono text-emerald-glow tabular-nums">{r.productionRate}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
                    <span>Participação relativa</span>
                    <span className="text-foreground">{r.participation}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-obsidian-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${r.participation}%`,
                        background: `linear-gradient(90deg, ${r.color}, ${r.color}80)`,
                        boxShadow: `0 0 12px ${r.color}66`,
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">Distribuição de Esforço</h3>
          <p className="text-xs text-muted-foreground mb-6">Commits por repositório</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={3} stroke="none">
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--obsidian-950)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2.5">
            {mockRepos.map((r) => (
              <div key={r.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-2.5 rounded-sm shrink-0" style={{ background: r.color }} />
                  <span className="text-foreground truncate">{r.name}</span>
                </div>
                <span className="font-mono text-muted-foreground tabular-nums">
                  {Math.round((r.commits / totalCommits) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 flex items-center gap-4">
          <div className="size-12 rounded-xl grid place-items-center bg-emerald-glow/10 border border-emerald-glow/20">
            <GitCommit className="size-5 text-emerald-glow" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-foreground tabular-nums">{totalCommits}</p>
            <p className="text-xs text-muted-foreground">Commits totais</p>
          </div>
        </GlassCard>
        <GlassCard className="p-6 flex items-center gap-4">
          <div className="size-12 rounded-xl grid place-items-center bg-violet-glow/10 border border-violet-glow/20">
            <GitPullRequest className="size-5 text-violet-glow" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-foreground tabular-nums">
              {mockRepos.reduce((s, r) => s + r.prs, 0)}
            </p>
            <p className="text-xs text-muted-foreground">PRs totais</p>
          </div>
        </GlassCard>
        <GlassCard className="p-6 flex items-center gap-4">
          <div className="size-12 rounded-xl grid place-items-center bg-amber-glow/10 border border-amber-glow/20">
            <TrendingUp className="size-5 text-amber-glow" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-foreground tabular-nums">
              {(mockRepos.reduce((s, r) => s + r.productionRate, 0) / mockRepos.length).toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground">TP média</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
