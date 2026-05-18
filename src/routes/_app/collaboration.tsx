import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Users } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import {
  mockContributorsCount,
  mockReviewsDistribution,
  mockTeam,
  mockTeamComparison,
} from "@/lib/mock-data";

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
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6 flex items-center gap-4">
          <div className="size-12 rounded-xl grid place-items-center bg-emerald-glow/10 border border-emerald-glow/20">
            <Users className="size-5 text-emerald-glow" />
          </div>
          <div>
            <p className="text-3xl font-bold font-mono text-foreground tabular-nums">{mockContributorsCount}</p>
            <p className="text-xs text-muted-foreground">Contribuidores ativos no ecossistema</p>
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">PRs revisadas (você)</p>
          <p className="text-3xl font-bold font-mono text-foreground tabular-nums">36</p>
          <p className="text-xs text-emerald-glow mt-1">+12% vs período anterior</p>
        </GlassCard>
        <GlassCard className="p-6">
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Co-autorias</p>
          <p className="text-3xl font-bold font-mono text-foreground tabular-nums">14</p>
          <p className="text-xs text-muted-foreground mt-1">commits em pares</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-foreground">Você vs Média da Equipe</h3>
            <p className="text-xs text-muted-foreground">Comparativo nas métricas principais</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockTeamComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" vertical={false} />
                <XAxis dataKey="metric" stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                  contentStyle={{ background: "var(--obsidian-950)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-mono)" }} />
                <Bar dataKey="you" name="Você" fill="var(--emerald-glow)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="team" name="Equipe" fill="var(--violet-glow)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-foreground">Distribuição de Revisões</h3>
            <p className="text-xs text-muted-foreground">PRs revisadas por membro da equipe</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockReviewsDistribution} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" horizontal={false} />
                <XAxis type="number" stroke="var(--obsidian-400)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="reviewer" stroke="var(--obsidian-400)" fontSize={11} tickLine={false} axisLine={false} width={70} />
                <Tooltip
                  cursor={{ fill: "oklch(1 0 0 / 0.04)" }}
                  contentStyle={{ background: "var(--obsidian-950)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="reviewed" radius={[0, 6, 6, 0]}>
                  {mockReviewsDistribution.map((d, i) => (
                    <Cell key={i} fill={d.reviewer === "Você" ? "var(--emerald-glow)" : "var(--violet-glow)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">Saúde do time</h3>
          <p className="text-xs text-muted-foreground">Snapshot de cada contribuidor</p>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-obsidian-950/50 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              <th className="px-6 py-3 font-medium">Developer</th>
              <th className="px-6 py-3 text-center font-medium">Commits</th>
              <th className="px-6 py-3 text-center font-medium">Reviews</th>
              <th className="px-6 py-3 text-center font-medium">Score</th>
              <th className="px-6 py-3 font-medium">Tendência</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-border">
            {mockTeam.map((m) => (
              <tr key={m.login} className="hover:bg-obsidian-800/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={m.avatar} alt={m.name} className="size-9 rounded-full border border-border" />
                    <div>
                      <p className="font-medium text-foreground">{m.name}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">@{m.login}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center font-mono tabular-nums">{m.commits}</td>
                <td className="px-6 py-4 text-center font-mono tabular-nums">{m.reviews}</td>
                <td className="px-6 py-4 text-center">
                  <span className="font-mono font-bold text-emerald-glow tabular-nums">{m.score}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-1 items-end h-7">
                    {m.trend.map((v, i) => (
                      <div key={i} className="w-2 bg-emerald-glow/70 rounded-sm" style={{ height: `${v * 14}%` }} />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
