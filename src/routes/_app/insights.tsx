import { createFileRoute } from "@tanstack/react-router";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Sparkles, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { mockBugFixRatio, mockHeatmap, mockInsights } from "@/lib/mock-data";

export const Route = createFileRoute("/_app/insights")({
  head: () => ({
    meta: [
      { title: "Insights — GitHealth" },
      { name: "description", content: "Heatmap de produtividade, bug fixing time e diagnósticos automáticos." },
    ],
  }),
  component: InsightsPage,
});

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function heatColor(v: number) {
  if (v < 5) return "bg-obsidian-800/40";
  if (v < 12) return "bg-emerald-glow/15";
  if (v < 22) return "bg-emerald-glow/35";
  if (v < 32) return "bg-emerald-glow/60";
  return "bg-emerald-glow shadow-[0_0_12px_rgba(16,185,129,0.7)]";
}

function InsightCard({
  tone,
  title,
  body,
}: {
  tone: "positive" | "warning" | "info";
  title: string;
  body: string;
}) {
  const styles =
    tone === "positive"
      ? { border: "border-l-emerald-glow", bg: "bg-emerald-glow/5", text: "text-emerald-glow", Icon: TrendingUp }
      : tone === "warning"
      ? { border: "border-l-ruby-glow", bg: "bg-ruby-glow/5", text: "text-ruby-glow", Icon: AlertTriangle }
      : { border: "border-l-violet-glow", bg: "bg-violet-glow/5", text: "text-violet-glow", Icon: Sparkles };
  const Icon = styles.Icon;
  return (
    <div className={`rounded-xl border border-border border-l-2 ${styles.border} ${styles.bg} p-5`}>
      <div className="flex items-start gap-3">
        <Icon className={`size-4 ${styles.text} mt-0.5 shrink-0`} />
        <div>
          <p className={`text-xs font-semibold ${styles.text} mb-1.5 uppercase tracking-widest`}>{title}</p>
          <p className="text-sm text-foreground/90 leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

function InsightsPage() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Mapa de Produtividade</h3>
              <p className="text-xs text-muted-foreground">Commits por dia da semana × hora do dia</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              <span>menos</span>
              <div className="flex gap-1">
                <span className="size-3 rounded-sm bg-obsidian-800/40" />
                <span className="size-3 rounded-sm bg-emerald-glow/15" />
                <span className="size-3 rounded-sm bg-emerald-glow/35" />
                <span className="size-3 rounded-sm bg-emerald-glow/60" />
                <span className="size-3 rounded-sm bg-emerald-glow" />
              </div>
              <span>mais</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="flex">
                <div className="w-10" />
                <div className="grid grid-cols-24 gap-1 flex-1" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                  {Array.from({ length: 24 }).map((_, h) => (
                    <div key={h} className="text-center text-[9px] font-mono text-muted-foreground">
                      {h % 3 === 0 ? h : ""}
                    </div>
                  ))}
                </div>
              </div>
              {mockHeatmap.map((row, d) => (
                <div key={d} className="flex items-center mt-1">
                  <div className="w-10 text-[10px] font-mono text-muted-foreground uppercase">{DAYS[d]}</div>
                  <div className="grid gap-1 flex-1" style={{ gridTemplateColumns: "repeat(24, minmax(0, 1fr))" }}>
                    {row.map((v, h) => (
                      <div
                        key={h}
                        className={`aspect-square rounded-sm ${heatColor(v)} transition-colors`}
                        title={`${DAYS[d]} ${h}h — ${v} commits`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border flex items-start gap-3">
            <Clock className="size-4 text-emerald-glow mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">Pico identificado:</span> terças e quartas entre 14h
              e 17h concentram 38% dos seus commits semanais. Sábados após 18h apresentam a menor atividade.
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">Bug Fixing Time</h3>
          <p className="text-xs text-muted-foreground mb-6">Esforço em features vs correções</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockBugFixRatio}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="none"
                >
                  {mockBugFixRatio.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--obsidian-950)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {mockBugFixRatio.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm" style={{ background: d.color }} />
                  <span className="text-foreground">{d.name}</span>
                </div>
                <span className="font-mono text-muted-foreground tabular-nums">{d.value}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-4 text-violet-glow" />
          <h3 className="text-base font-semibold text-foreground">Diagnósticos automáticos</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockInsights.map((i, idx) => (
            <InsightCard key={idx} tone={i.tone as any} title={i.title} body={i.body} />
          ))}
        </div>
      </div>
    </div>
  );
}
