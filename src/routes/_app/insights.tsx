import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Sparkles, AlertTriangle, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { getInsightsMetrics } from "@/lib/api";
import { getUser, getSelectedRepo, defaultDateRange } from "@/lib/auth";

export const Route = createFileRoute("/_app/insights")({
  head: () => ({
    meta: [
      { title: "Insights — GITME" },
      { name: "description", content: "Classificação de commits por tipo e diagnósticos de produtividade." },
    ],
  }),
  component: InsightsPage,
});

const DAYS = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

function cellOpacity(value: number, max: number): string {
  if (max === 0 || value === 0) return "bg-obsidian-800/40";
  const ratio = value / max;
  if (ratio < 0.2) return "bg-emerald-glow/10";
  if (ratio < 0.4) return "bg-emerald-glow/30";
  if (ratio < 0.65) return "bg-emerald-glow/60";
  return "bg-emerald-glow";
}

function buildPeakInsight(heatmap: number[][]): string {
  const total = heatmap.flat().reduce((s, v) => s + v, 0);
  if (total === 0) return "Sem commits no período para análise de pico.";

  let peakDay = 0, peakHour = 0, peakVal = 0;
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      if (heatmap[d][h] > peakVal) { peakVal = heatmap[d][h]; peakDay = d; peakHour = h; }
    }
  }
  const pct = Math.round((peakVal / total) * 100);
  return `Pico identificado: ${DAYS[peakDay]} às ${peakHour}h concentra ${pct}% dos commits do período.`;
}

function ProductivityHeatmap({ heatmap }: { heatmap: number[][] }) {
  const max = Math.max(...heatmap.flat(), 1);
  const peakText = buildPeakInsight(heatmap);

  return (
    <GlassCard className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
        <div>
          <h3 className="text-base font-semibold text-foreground">Mapa de Produtividade</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Commits por dia da semana × hora do dia</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>MENOS</span>
          {["bg-emerald-glow/10", "bg-emerald-glow/30", "bg-emerald-glow/60", "bg-emerald-glow"].map((cls, i) => (
            <span key={i} className={`size-3 rounded-sm ${cls}`} />
          ))}
          <span>MAIS</span>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div style={{ minWidth: 540 }}>
          {/* Hour labels */}
          <div className="flex ml-10 mb-1">
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground">
                {h % 3 === 0 ? h : ""}
              </div>
            ))}
          </div>
          {/* Grid rows */}
          {heatmap.map((row, d) => (
            <div key={d} className="flex items-center gap-0 mb-1">
              <span className="w-10 text-[10px] text-muted-foreground shrink-0">{DAYS[d]}</span>
              {row.map((val, h) => (
                <div
                  key={h}
                  className={`flex-1 aspect-square rounded-sm mx-px ${cellOpacity(val, max)}`}
                  title={`${DAYS[d]} ${h}h: ${val} commits`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground border-t border-border pt-4">
        <Sparkles className="size-3.5 text-emerald-glow shrink-0 mt-0.5" />
        <p><span className="text-foreground font-medium">Pico identificado:</span> {peakText.replace("Pico identificado: ", "")}</p>
      </div>
    </GlassCard>
  );
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
  const user = getUser();
  const repo = getSelectedRepo();
  const { from, to } = defaultDateRange();

  const { data: insights, isLoading } = useQuery({
    queryKey: ["insights", { repoId: repo?.id, authorLogin: user?.login, from, to }],
    queryFn: () => getInsightsMetrics({ repoId: repo!.id, authorLogin: user!.login, from, to }),
    enabled: !!repo && !!user,
    staleTime: 1000 * 60 * 5,
  });

  const ind = insights?.individual?.commitClassification;
  const team = insights?.team?.commitClassification;

  const bugFixRatioData = ind
    ? [
        { name: "Features (feat)", value: ind.feat, color: "var(--emerald-glow)" },
        { name: "Bug Fixing (fix)", value: ind.fix, color: "var(--ruby-glow)" },
        { name: "Outros", value: ind.other, color: "var(--violet-glow)" },
      ].filter((d) => d.value > 0)
    : [];

  const teamBugFixData = team
    ? [
        { name: "Features (feat)", value: team.feat, color: "var(--emerald-glow)" },
        { name: "Bug Fixing (fix)", value: team.fix, color: "var(--ruby-glow)" },
        { name: "Outros", value: team.other, color: "var(--violet-glow)" },
      ].filter((d) => d.value > 0)
    : [];

  function buildInsights(): Array<{ tone: "positive" | "warning" | "info"; title: string; body: string }> {
    if (!ind || !team) return [];
    const result: Array<{ tone: "positive" | "warning" | "info"; title: string; body: string }> = [];

    if (ind.featRatio >= 0.5) {
      result.push({
        tone: "positive",
        title: "Alto foco em features",
        body: `${(ind.featRatio * 100).toFixed(0)}% dos seus commits convencionais são features (feat:), indicando um bom ritmo de entrega de valor.`,
      });
    }

    if (ind.fixRatio > 0.3) {
      result.push({
        tone: "warning",
        title: "Bug fixing acima do baseline",
        body: `${(ind.fixRatio * 100).toFixed(0)}% do esforço foi para correções${team.fixRatio > 0 ? ` — ${((ind.fixRatio - team.fixRatio) * 100).toFixed(0)}pp acima da média da equipe` : ""}.`,
      });
    } else if (ind.fix > 0) {
      result.push({
        tone: "info",
        title: "Bug fixing saudável",
        body: `${(ind.fixRatio * 100).toFixed(0)}% dos commits são correções — dentro do baseline esperado.`,
      });
    }

    if (ind.totalConventional > 0) {
      const conventionalPct = Math.round((ind.totalConventional / (ind.feat + ind.fix + ind.other)) * 100);
      if (conventionalPct >= 50) {
        result.push({
          tone: "positive",
          title: "Boa adoção do padrão conventional",
          body: `${conventionalPct}% dos seus commits seguem o padrão Conventional Commits, facilitando changelogs automáticos.`,
        });
      } else {
        result.push({
          tone: "info",
          title: "Conventional Commits",
          body: `${conventionalPct}% dos commits usam o padrão convencional. Adotar mais amplamente melhora rastreabilidade e automação de release.`,
        });
      }
    }

    if (team.featRatio > 0 && ind.featRatio < team.featRatio * 0.7) {
      result.push({
        tone: "warning",
        title: "Features abaixo da média",
        body: `Sua taxa de features (${(ind.featRatio * 100).toFixed(0)}%) está abaixo da média da equipe (${(team.featRatio * 100).toFixed(0)}%).`,
      });
    }

    return result;
  }

  const autoInsights = buildInsights();

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">Seus Commits por Tipo</h3>
          <p className="text-xs text-muted-foreground mb-4 md:mb-6">Classificação por Conventional Commits</p>
          {isLoading ? (
            <div className="h-56 flex items-center justify-center animate-pulse">
              <div className="size-28 rounded-full bg-obsidian-800/60" />
            </div>
          ) : bugFixRatioData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
              Sem commits classificados no período.
            </div>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={bugFixRatioData} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="none">
                      {bugFixRatioData.map((d, i) => (
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
                {bugFixRatioData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-sm" style={{ background: d.color }} />
                      <span className="text-foreground">{d.name}</span>
                    </div>
                    <span className="font-mono text-muted-foreground tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-1">Equipe por Tipo</h3>
          <p className="text-xs text-muted-foreground mb-4 md:mb-6">Distribuição da equipe inteira</p>
          {isLoading ? (
            <div className="h-56 flex items-center justify-center animate-pulse">
              <div className="size-28 rounded-full bg-obsidian-800/60" />
            </div>
          ) : teamBugFixData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
              Sem dados de equipe disponíveis.
            </div>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={teamBugFixData} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={3} stroke="none">
                      {teamBugFixData.map((d, i) => (
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
                {teamBugFixData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="size-2.5 rounded-sm" style={{ background: d.color }} />
                      <span className="text-foreground">{d.name}</span>
                    </div>
                    <span className="font-mono text-muted-foreground tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </GlassCard>
      </div>

      {insights?.productivityHeatmap && (
        <ProductivityHeatmap heatmap={insights.productivityHeatmap} />
      )}

      {ind && (
        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Resumo Conventional Commits</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "feat", value: ind.feat, color: "text-emerald-glow", bg: "bg-emerald-glow/10 border-emerald-glow/20" },
              { label: "fix", value: ind.fix, color: "text-ruby-glow", bg: "bg-ruby-glow/10 border-ruby-glow/20" },
              { label: "outros", value: ind.other, color: "text-violet-glow", bg: "bg-violet-glow/10 border-violet-glow/20" },
              { label: "total convencional", value: ind.totalConventional, color: "text-amber-glow", bg: "bg-amber-glow/10 border-amber-glow/20" },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl border p-4 ${item.bg}`}>
                <p className={`text-2xl font-bold font-mono tabular-nums ${item.color}`}>{item.value}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1 font-mono">{item.label}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-4 text-violet-glow" />
          <h3 className="text-base font-semibold text-foreground">Diagnósticos automáticos</h3>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-obsidian-900/40 border border-border" />
            ))}
          </div>
        ) : autoInsights.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sem insights disponíveis no período.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {autoInsights.map((item, idx) => (
              <InsightCard key={idx} tone={item.tone} title={item.title} body={item.body} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
