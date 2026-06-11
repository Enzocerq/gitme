import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, AlertTriangle, TrendingUp } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { getInsightsMetrics } from "@/lib/api";
import { getUser, getSelectedRepo } from "@/lib/auth";
import { usePeriod } from "@/hooks/use-period";

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
  const { from, to } = usePeriod().period;

  const { data: insights, isLoading } = useQuery({
    queryKey: ["insights", { repoId: repo?.id, authorLogin: user?.login, from, to }],
    queryFn: () => getInsightsMetrics({ repoId: repo!.id, authorLogin: user!.login, from, to }),
    enabled: !!repo && !!user,
    staleTime: 1000 * 60 * 5,
  });

  const ind = insights?.individual?.commitClassification;
  const team = insights?.team?.commitClassification;

  function buildInsights(): Array<{ tone: "positive" | "warning" | "info"; title: string; body: string }> {
    if (!ind || !team) return [];
    const result: Array<{ tone: "positive" | "warning" | "info"; title: string; body: string }> = [];
    const heatmap = insights?.productivityHeatmap;

    const total = ind.feat + ind.fix + ind.other;
    const otherRatio = total > 0 ? ind.other / total : 0;
    const conventionalPct = total > 0 ? Math.round((ind.totalConventional / total) * 100) : 0;

    let hmTotal = 0, businessHours = 0, weekendTotal = 0, nightTotal = 0;
    if (heatmap) {
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          const v = heatmap[d][h];
          hmTotal += v;
          if (d <= 4 && h >= 9 && h < 18) businessHours += v;
          if (d >= 5) weekendTotal += v;
          if (h < 6) nightTotal += v;
        }
      }
    }
    const businessHoursPct = hmTotal > 0 ? Math.round((businessHours / hmTotal) * 100) : 0;
    const weekendPct = hmTotal > 0 ? Math.round((weekendTotal / hmTotal) * 100) : 0;
    const nightPct = hmTotal > 0 ? Math.round((nightTotal / hmTotal) * 100) : 0;

    // ── Positivos ──────────────────────────────────────────────
    if (ind.featRatio >= 0.5) {
      result.push({
        tone: "positive",
        title: "Alto foco em features",
        body: `${(ind.featRatio * 100).toFixed(0)}% dos seus commits convencionais são features (feat:), indicando um bom ritmo de entrega de valor.`,
      });
    }

    if (team.featRatio > 0 && ind.featRatio >= team.featRatio * 1.3) {
      result.push({
        tone: "positive",
        title: "Features acima da média da equipe",
        body: `Sua taxa de features (${(ind.featRatio * 100).toFixed(0)}%) supera em destaque a média da equipe (${(team.featRatio * 100).toFixed(0)}%), indicando alta entrega de valor.`,
      });
    }

    if (ind.fix === 0 && total > 0) {
      result.push({
        tone: "positive",
        title: "Período sem bugs registrados",
        body: "Nenhum commit de correção (fix:) identificado no período — sinal de código estável e menor retrabalho.",
      });
    } else if (ind.fix > 0 && ind.fixRatio <= 0.3 && team.fixRatio > 0 && ind.fixRatio < team.fixRatio * 0.7) {
      result.push({
        tone: "positive",
        title: "Menos bugs que a equipe",
        body: `Seu índice de correções (${(ind.fixRatio * 100).toFixed(0)}%) está abaixo da média da equipe (${(team.fixRatio * 100).toFixed(0)}%), sugerindo menor retrabalho.`,
      });
    }

    if (conventionalPct >= 80) {
      result.push({
        tone: "positive",
        title: "Excelente adoção do Conventional Commits",
        body: `${conventionalPct}% dos seus commits seguem o padrão Conventional Commits — ótimo para changelogs automáticos e rastreabilidade.`,
      });
    } else if (conventionalPct >= 50) {
      result.push({
        tone: "positive",
        title: "Boa adoção do Conventional Commits",
        body: `${conventionalPct}% dos seus commits seguem o padrão Conventional Commits, facilitando changelogs automáticos.`,
      });
    }

    if (heatmap && hmTotal > 0 && businessHoursPct >= 70) {
      result.push({
        tone: "positive",
        title: "Boa disciplina de horário",
        body: `${businessHoursPct}% dos commits ocorrem em horário comercial (seg–sex, 9h–18h), indicando ritmo de trabalho sustentável.`,
      });
    }

    // ── Informativos ───────────────────────────────────────────
    if (ind.fix > 0 && ind.fixRatio <= 0.3 && !(team.fixRatio > 0 && ind.fixRatio < team.fixRatio * 0.7)) {
      result.push({
        tone: "info",
        title: "Bug fixing saudável",
        body: `${(ind.fixRatio * 100).toFixed(0)}% dos commits são correções — dentro do baseline esperado.`,
      });
    }

    if (conventionalPct > 0 && conventionalPct < 50) {
      result.push({
        tone: "info",
        title: "Adoção parcial do Conventional Commits",
        body: `${conventionalPct}% dos commits usam o padrão convencional. Adotar mais amplamente melhora rastreabilidade e automação de release.`,
      });
    }

    if (total > 3 && otherRatio > 0.3 && otherRatio <= 0.5 && ind.totalConventional > 0) {
      result.push({
        tone: "info",
        title: "Commits sem classificação convencional",
        body: `${(otherRatio * 100).toFixed(0)}% dos commits não seguem prefixos como feat:, fix: ou chore:. Padronizar melhora rastreabilidade.`,
      });
    }

    if (heatmap && hmTotal > 0 && weekendPct > 10 && weekendPct <= 25) {
      result.push({
        tone: "info",
        title: "Commits nos fins de semana",
        body: `${weekendPct}% dos commits ocorrem no fim de semana. Verifique se esse padrão é intencional ou sinal de sobrecarga.`,
      });
    }

    if (heatmap && hmTotal > 0 && nightPct > 10 && nightPct <= 25) {
      result.push({
        tone: "info",
        title: "Commits em horário noturno",
        body: `${nightPct}% dos commits são feitos entre 0h–6h. Trabalhar tarde pode impactar a qualidade e a sustentabilidade do ritmo.`,
      });
    }

    // ── Alertas ────────────────────────────────────────────────
    if (ind.fixRatio > 0.3) {
      result.push({
        tone: "warning",
        title: "Bug fixing acima do baseline",
        body: `${(ind.fixRatio * 100).toFixed(0)}% do esforço foi para correções${team.fixRatio > 0 ? ` — ${((ind.fixRatio - team.fixRatio) * 100).toFixed(0)}pp acima da média da equipe` : ""}.`,
      });
    }

    if (team.featRatio > 0 && ind.featRatio < team.featRatio * 0.7) {
      result.push({
        tone: "warning",
        title: "Features abaixo da média",
        body: `Sua taxa de features (${(ind.featRatio * 100).toFixed(0)}%) está abaixo da média da equipe (${(team.featRatio * 100).toFixed(0)}%).`,
      });
    }

    if (total > 5 && ind.totalConventional === 0) {
      result.push({
        tone: "warning",
        title: "Sem uso do Conventional Commits",
        body: "Nenhum commit segue o padrão Conventional Commits. Isso dificulta changelogs automáticos e rastreabilidade de mudanças.",
      });
    } else if (total > 3 && otherRatio > 0.5 && ind.totalConventional > 0) {
      result.push({
        tone: "warning",
        title: "Maioria dos commits sem padrão convencional",
        body: `${(otherRatio * 100).toFixed(0)}% dos commits não têm classificação convencional, dificultando análise e automação do histórico.`,
      });
    }

    if (heatmap && hmTotal > 0 && weekendPct > 25) {
      result.push({
        tone: "warning",
        title: "Alto volume de trabalho no fim de semana",
        body: `${weekendPct}% dos commits ocorrem aos fins de semana. Isso pode indicar sobrecarga ou dificuldade de entregar dentro do horário normal.`,
      });
    }

    if (heatmap && hmTotal > 0 && nightPct > 25) {
      result.push({
        tone: "warning",
        title: "Padrão de commits noturnos",
        body: `${nightPct}% dos commits são feitos entre 0h–6h. Esse padrão pode indicar sobrecarga e impacto na qualidade do código.`,
      });
    }

    return result;
  }

  const autoInsights = buildInsights();

  return (
    <div className="space-y-6 md:space-y-8">
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

      {insights?.productivityHeatmap && (
        <ProductivityHeatmap heatmap={insights.productivityHeatmap} />
      )}

    </div>
  );
}
