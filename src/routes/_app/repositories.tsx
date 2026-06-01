import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { GitBranch, GitCommit, GitPullRequest, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { getRepoMetrics } from "@/lib/api";
import { getUser, getSelectedRepo, defaultDateRange } from "@/lib/auth";

export const Route = createFileRoute("/_app/repositories")({
  head: () => ({
    meta: [
      { title: "Repositórios — GITME" },
      { name: "description", content: "Análise de esforço por repositório, participação relativa e taxa de produção." },
    ],
  }),
  component: ReposPage,
});

const REPO_COLORS = [
  "#10b981", "#8b5cf6", "#f43f5e", "#f59e0b", "#3b82f6", "#ec4899", "#06b6d4",
];

function ReposPage() {
  const user = getUser();
  const { from, to } = defaultDateRange();

  const { data: repoData, isLoading } = useQuery({
    queryKey: ["repos", { authorLogin: user?.login, from, to }],
    queryFn: () => getRepoMetrics({ authorLogin: user!.login, from, to }),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const repos = (repoData?.repos ?? []).map((r, i) => ({
    ...r,
    color: REPO_COLORS[i % REPO_COLORS.length],
    participation: Math.round((r.participation ?? 0) * 10000) / 100,
  }));

  const totalCommits = repos.reduce((s, r) => s + r.totalCommits, 0);
  const totalPrs = repos.reduce((s, r) => s + r.totalPrs, 0);
  const pieData = repos.map((r) => ({ name: r.name, value: r.userCommits, color: r.color }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <GlassCard className="lg:col-span-2 overflow-hidden">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Repositórios Analisados</h3>
              <p className="text-xs text-muted-foreground">{repos.length} projeto{repos.length !== 1 ? "s" : ""} com sua participação</p>
            </div>
          </div>

          {isLoading && (
            <div className="p-8 space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl bg-obsidian-900/40" />
              ))}
            </div>
          )}

          {!isLoading && repos.length === 0 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum repositório encontrado no período.
            </div>
          )}

          {!isLoading && repos.length > 0 && (
            <ul className="divide-y divide-border">
              {repos.map((r) => (
                <li key={r.repoId} className="px-4 py-4 md:px-6 md:py-5 hover:bg-obsidian-800/20 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="size-10 rounded-lg grid place-items-center"
                      style={{ background: `${r.color}20`, border: `1px solid ${r.color}40` }}
                    >
                      <GitBranch className="size-4" style={{ color: r.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{r.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        {r.userCommits} seus commits · {r.totalCommits} total
                      </p>
                    </div>
                    <div className="hidden sm:flex gap-4 md:gap-6 text-right shrink-0">
                      <div>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Commits</p>
                        <p className="text-base font-bold font-mono text-foreground tabular-nums">{r.userCommits}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">PRs</p>
                        <p className="text-base font-bold font-mono text-foreground tabular-nums">{r.userPrs}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Part.</p>
                        <p className="text-base font-bold font-mono text-emerald-glow tabular-nums">
                          {r.participation.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1.5">
                      <span>Participação relativa</span>
                      <span className="text-foreground">{r.participation.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-obsidian-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(r.participation, 100)}%`,
                          background: `linear-gradient(90deg, ${r.color}, ${r.color}80)`,
                          boxShadow: `0 0 12px ${r.color}66`,
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">Distribuição de Esforço</h3>
          <p className="text-xs text-muted-foreground mb-6">Seus commits por repositório</p>
          {repos.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
              Sem dados disponíveis.
            </div>
          ) : (
            <>
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
                {repos.map((r) => {
                  const total = repos.reduce((s, x) => s + x.userCommits, 0);
                  return (
                    <div key={r.repoId} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="size-2.5 rounded-sm shrink-0" style={{ background: r.color }} />
                        <span className="text-foreground truncate">{r.name}</span>
                      </div>
                      <span className="font-mono text-muted-foreground tabular-nums">
                        {total > 0 ? Math.round((r.userCommits / total) * 100) : 0}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <GlassCard className="p-6 flex items-center gap-4">
          <div className="size-12 rounded-xl grid place-items-center bg-emerald-glow/10 border border-emerald-glow/20">
            <GitCommit className="size-5 text-emerald-glow" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-foreground tabular-nums">{totalCommits}</p>
            <p className="text-xs text-muted-foreground">Commits totais (todos os contribuidores)</p>
          </div>
        </GlassCard>
        <GlassCard className="p-6 flex items-center gap-4">
          <div className="size-12 rounded-xl grid place-items-center bg-violet-glow/10 border border-violet-glow/20">
            <GitPullRequest className="size-5 text-violet-glow" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-foreground tabular-nums">{totalPrs}</p>
            <p className="text-xs text-muted-foreground">PRs totais</p>
          </div>
        </GlassCard>
        <GlassCard className="p-6 flex items-center gap-4">
          <div className="size-12 rounded-xl grid place-items-center bg-amber-glow/10 border border-amber-glow/20">
            <TrendingUp className="size-5 text-amber-glow" />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono text-foreground tabular-nums">{repos.length}</p>
            <p className="text-xs text-muted-foreground">Repos com participação</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
