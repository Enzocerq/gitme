import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Users } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { getCollaborationMetrics } from "@/lib/api";
import { getUser, getSelectedRepo, defaultDateRange } from "@/lib/auth";

export const Route = createFileRoute("/_app/collaboration")({
  head: () => ({
    meta: [
      { title: "Colaboração — GitHealth" },
      { name: "description", content: "Você vs equipe e distribuição de revisões de Pull Requests." },
    ],
  }),
  component: CollaborationPage,
});

function CollaborationPage() {
  const user = getUser();
  const repo = getSelectedRepo();
  const { from, to } = defaultDateRange();

  const { data: collab, isLoading } = useQuery({
    queryKey: ["collaboration", { repoId: repo?.id, authorLogin: user?.login, from, to }],
    queryFn: () => getCollaborationMetrics({ repoId: repo!.id, authorLogin: user!.login, from, to }),
    enabled: !!repo && !!user,
    staleTime: 1000 * 60 * 5,
  });

  const reviewDistribution = (collab?.reviewDistribution ?? []).map((r) => ({
    reviewer: r.login,
    reviewed: r.reviews,
  }));

  const comparison = collab?.comparison;
  const teamComparison = comparison
    ? [
        { metric: "Commits", you: Math.round(comparison.individual.commits), team: Math.round(comparison.teamAverage.commits) },
        { metric: "PRs Mergeadas", you: Math.round(comparison.individual.prsMerged), team: Math.round(comparison.teamAverage.prsMerged) },
        { metric: "TCM (linhas)", you: Math.round(comparison.individual.tcm), team: Math.round(comparison.teamAverage.tcm) },
      ]
    : [];

  const myReviews = reviewDistribution.find((r) => r.reviewer === user?.login)?.reviewed ?? 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-foreground">Você vs Média da Equipe</h3>
            <p className="text-xs text-muted-foreground">Comparativo nas métricas principais</p>
          </div>
          {teamComparison.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-sm text-muted-foreground">
              Sem dados de comparação disponíveis.
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                  <XAxis dataKey="metric" stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                    contentStyle={{ background: "var(--obsidian-950)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                  <Bar dataKey="you" name="Você" fill="var(--emerald-glow)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="team" name="Equipe (média)" fill="var(--violet-glow)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-foreground">Distribuição de Revisões</h3>
            <p className="text-xs text-muted-foreground">PRs revisadas por membro da equipe</p>
          </div>
          {reviewDistribution.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-sm text-muted-foreground">
              Sem dados de revisão disponíveis.
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reviewDistribution} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" horizontal={false} />
                  <XAxis type="number" stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="reviewer" stroke="var(--obsidian-400)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                  <Tooltip
                    cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                    contentStyle={{ background: "var(--obsidian-950)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="reviewed" radius={[0, 6, 6, 0]}>
                    {reviewDistribution.map((d, i) => (
                      <Cell key={i} fill={d.reviewer === user?.login ? "var(--emerald-glow)" : "var(--violet-glow)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Top Revisores do Repositório</h3>
          <p className="text-xs text-muted-foreground">Snapshot por número de revisões no período</p>
        </div>
        {reviewDistribution.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Sem dados de revisão disponíveis.</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-obsidian-950/50 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                <th className="px-6 py-3 font-medium">Developer</th>
                <th className="px-6 py-3 text-center font-medium">Reviews</th>
                <th className="px-6 py-3 font-medium">Share</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border">
              {reviewDistribution
                .sort((a, b) => b.reviewed - a.reviewed)
                .map((m) => {
                  const total = reviewDistribution.reduce((s, x) => s + x.reviewed, 0);
                  const pct = total > 0 ? Math.round((m.reviewed / total) * 100) : 0;
                  const isMe = m.reviewer === user?.login;
                  return (
                    <tr key={m.reviewer} className="hover:bg-obsidian-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://github.com/${m.reviewer}.png`}
                            alt={m.reviewer}
                            className="size-9 rounded-full border border-border"
                          />
                          <div>
                            <p className={`font-medium ${isMe ? "text-emerald-glow" : "text-foreground"}`}>
                              @{m.reviewer} {isMe && <span className="text-xs text-muted-foreground">(você)</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-mono tabular-nums">{m.reviewed}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-obsidian-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: isMe ? "var(--emerald-glow)" : "var(--violet-glow)" }}
                            />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        )}
      </GlassCard>
    </div>
  );
}
