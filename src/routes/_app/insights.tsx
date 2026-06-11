import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, AlertTriangle, TrendingUp, TrendingDown, Minus, Clock, ShieldCheck, FunctionSquare } from "lucide-react";
import { GlassCard } from "@/components/glass-card";
import { QueryError } from "@/components/query-state";
import { getInsightsMetrics } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { useActiveRepo } from "@/hooks/use-active-repo";
import { usePeriod } from "@/hooks/use-period";
import { previousRange, computeDeltaPp, PRESET_COMPARE } from "@/lib/period";

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

  // Totais por linha (dia) e por coluna (hora) — revelam onde o trabalho se concentra.
  const rowTotals = heatmap.map((row) => row.reduce((s, v) => s + v, 0));
  const maxRowTotal = Math.max(...rowTotals, 1);
  const hourTotals = Array.from({ length: 24 }, (_, h) => heatmap.reduce((s, row) => s + (row[h] ?? 0), 0));
  const busiestDay = rowTotals.indexOf(Math.max(...rowTotals));
  const busiestHour = hourTotals.indexOf(Math.max(...hourTotals));
  const grandTotal = rowTotals.reduce((s, v) => s + v, 0);

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
        <div
          style={{ minWidth: 580 }}
          role="img"
          aria-label={`Mapa de produtividade: commits por dia da semana e hora do dia. ${peakText} Dia mais ativo: ${DAYS[busiestDay]}. Hora mais ativa: ${busiestHour}h.`}
        >
          {/* Hour labels */}
          <div className="flex ml-10 mb-1" aria-hidden="true">
            {Array.from({ length: 24 }).map((_, h) => (
              <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground">
                {h % 3 === 0 ? h : ""}
              </div>
            ))}
            <span className="w-9 text-center text-[10px] font-mono text-muted-foreground/70 shrink-0">Σ</span>
          </div>
          {/* Grid rows */}
          {heatmap.map((row, d) => (
            <div key={d} className="flex items-center gap-0 mb-1" aria-hidden="true">
              <span className="w-10 text-[10px] text-muted-foreground shrink-0">{DAYS[d]}</span>
              {row.map((val, h) => (
                <div
                  key={h}
                  className={`flex-1 aspect-square rounded-sm mx-px ${cellOpacity(val, max)}`}
                  title={`${DAYS[d]} ${h}h: ${val} commits`}
                />
              ))}
              {/* Total do dia */}
              <span
                className={`w-9 text-right text-[10px] font-mono tabular-nums shrink-0 pl-1 ${
                  d === busiestDay && rowTotals[d] > 0 ? "text-emerald-glow font-bold" : "text-muted-foreground/70"
                }`}
              >
                {rowTotals[d]}
              </span>
            </div>
          ))}
          {/* Totais por faixa de hora (a cada 3h, alinhados às labels) */}
          <div className="flex ml-10 mt-1 border-t border-border/50 pt-1" aria-hidden="true">
            {hourTotals.map((t, h) => (
              <div
                key={h}
                className={`flex-1 text-center text-[9px] font-mono tabular-nums ${
                  h === busiestHour && t > 0 ? "text-emerald-glow font-bold" : "text-muted-foreground/40"
                }`}
              >
                {h % 3 === 0 ? t : ""}
              </div>
            ))}
            <span className="w-9 text-right text-[9px] font-mono text-muted-foreground/70 shrink-0 pl-1">{grandTotal}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-emerald-glow shrink-0 mt-0.5" />
          <p><span className="text-foreground font-medium">Pico identificado:</span> {peakText.replace("Pico identificado: ", "")}</p>
        </div>
        {grandTotal > 0 && (
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-mono text-muted-foreground pl-5">
            <span>Dia mais ativo: <span className="text-emerald-glow">{DAYS[busiestDay]}</span> ({rowTotals[busiestDay]})</span>
            <span>Hora mais ativa: <span className="text-emerald-glow">{busiestHour}h</span> ({hourTotals[busiestHour]})</span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

interface RhythmData {
  total: number;
  businessHoursPct: number;
  weekendPct: number;
  nightPct: number;
}

/**
 * Distribui os commits por "lente temporal" para autoconhecimento.
 * As lentes se sobrepõem de propósito (um commit de sábado às 2h conta em fim de semana
 * e em madrugada) — são recortes independentes, não fatias de um total de 100%.
 */
function buildRhythm(heatmap: number[][]): RhythmData {
  let total = 0, business = 0, weekend = 0, night = 0;
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      const v = heatmap[d]?.[h] ?? 0;
      total += v;
      if (d <= 4 && h >= 9 && h < 18) business += v;
      if (d >= 5) weekend += v;
      if (h < 6) night += v;
    }
  }
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  return {
    total,
    businessHoursPct: pct(business),
    weekendPct: pct(weekend),
    nightPct: pct(night),
  };
}

function WorkRhythmPanel({ heatmap }: { heatmap: number[][] }) {
  const r = buildRhythm(heatmap);
  if (r.total === 0) return null;

  const lenses = [
    { label: "Horário comercial", sub: "seg–sex · 9h–18h", pct: r.businessHoursPct },
    { label: "Fim de semana", sub: "sáb–dom · qualquer hora", pct: r.weekendPct },
    { label: "Madrugada", sub: "0h–6h · qualquer dia", pct: r.nightPct },
  ];

  return (
    <GlassCard className="p-6">
      <div className="flex items-start gap-2 mb-4">
        <Clock className="size-4 text-violet-glow shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-semibold text-foreground">Ritmo de trabalho</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quando seus commits acontecem — para sua reflexão pessoal
          </p>
        </div>
      </div>

      {/* Enquadramento explícito: dado descritivo, não julgamento */}
      <div className="flex items-start gap-2 rounded-lg border border-border bg-foreground/[0.02] p-3 mb-5">
        <ShieldCheck className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Estes dados <span className="text-foreground/80">descrevem</span> padrões — não os julgam.
          Trabalhar fora do horário comercial não é melhor nem pior: pessoas têm rotinas, fusos e
          responsabilidades diferentes. Use como autoconhecimento, nunca como avaliação de desempenho.
        </p>
      </div>

      <div className="space-y-4">
        {lenses.map((l) => (
          <div key={l.label}>
            <div className="flex items-baseline justify-between mb-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-foreground">{l.label}</span>
                <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-wide">
                  {l.sub}
                </span>
              </div>
              <span className="text-sm font-mono font-bold tabular-nums text-foreground">{l.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-glow/60 transition-all duration-700 ease-out"
                style={{ width: `${l.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-[10px] text-muted-foreground/60 leading-relaxed border-t border-border pt-3">
        As lentes se sobrepõem (um commit de sábado de madrugada conta em ambas) — são recortes
        independentes, não fatias de um total de 100%.
      </p>
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

interface Classification {
  feat: number;
  fix: number;
  other: number;
  totalConventional: number;
  featRatio: number;
  fixRatio: number;
}

function conventionalRatio(c: Classification): number {
  const total = c.feat + c.fix + c.other;
  return total > 0 ? c.totalConventional / total : 0;
}

interface TrendRow {
  label: string;
  deltaPp: number;
  detail: string;
}

function buildTrend(cur?: Classification, prev?: Classification): TrendRow[] | null {
  if (!cur || !prev) return null;
  const curTotal = cur.feat + cur.fix + cur.other;
  const prevTotal = prev.feat + prev.fix + prev.other;
  if (curTotal === 0 || prevTotal === 0) return null;

  const rows: Array<{ label: string; cur: number; prev: number }> = [
    { label: "Adoção Conventional Commits", cur: conventionalRatio(cur), prev: conventionalRatio(prev) },
    { label: "Proporção de features", cur: cur.featRatio, prev: prev.featRatio },
    { label: "Proporção de correções", cur: cur.fixRatio, prev: prev.fixRatio },
  ];
  return rows.map((r) => ({
    label: r.label,
    deltaPp: computeDeltaPp(r.cur, r.prev) ?? 0,
    detail: `${Math.round(r.cur * 100)}% agora · ${Math.round(r.prev * 100)}% antes`,
  }));
}

function TrendPanel({ rows, compareLabel }: { rows: TrendRow[]; compareLabel: string }) {
  return (
    <GlassCard className="p-6">
      <div className="flex items-start gap-2 mb-1">
        <TrendingUp className="size-4 text-emerald-glow shrink-0 mt-0.5" />
        <div>
          <h3 className="text-base font-semibold text-foreground">Tendência vs. período anterior</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Como seus padrões de commit evoluíram em relação aos {compareLabel}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {rows.map((r) => {
          const up = r.deltaPp > 0;
          const down = r.deltaPp < 0;
          const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
          // Observação neutra: a seta indica direção, não "bom/ruim".
          const cls = up ? "text-emerald-glow" : down ? "text-amber-glow" : "text-muted-foreground";
          return (
            <div key={r.label} className="rounded-xl border border-border bg-foreground/[0.02] p-4">
              <p className="text-xs text-muted-foreground mb-2">{r.label}</p>
              <div className={`flex items-center gap-1.5 ${cls}`}>
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span
                  className="text-lg font-mono font-bold tabular-nums"
                  aria-label={`${r.label}: ${up ? "subiu" : down ? "caiu" : "estável"} ${Math.abs(r.deltaPp)} pontos percentuais`}
                >
                  {up ? "+" : ""}{r.deltaPp} pontos percentuais
                </span>
              </div>
              <p className="text-[10px] font-mono text-muted-foreground/60 mt-1.5">{r.detail}</p>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-[10px] text-muted-foreground/60 leading-relaxed border-t border-border pt-3">
        Variações em pontos percentuais são observações descritivas, não metas. Períodos curtos
        com poucos commits oscilam naturalmente — interprete com contexto.
      </p>
    </GlassCard>
  );
}

function InsightsPage() {
  const user = getUser();
  const { activeRepo: repo } = useActiveRepo();
  const { period } = usePeriod();
  const { from, to } = period;
  const prev = previousRange(period);

  const { data: insights, isLoading, isError, refetch } = useQuery({
    queryKey: ["insights", { repoId: repo?.id, authorLogin: user?.login, from, to }],
    queryFn: () => getInsightsMetrics({ repoId: repo!.id, authorLogin: user!.login, from, to }),
    enabled: !!repo && !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Insights do período anterior — base para o bloco de tendência (a evolução importa).
  const { data: prevInsights } = useQuery({
    queryKey: ["insights", { repoId: repo?.id, authorLogin: user?.login, from: prev.from, to: prev.to }],
    queryFn: () => getInsightsMetrics({ repoId: repo!.id, authorLogin: user!.login, from: prev.from, to: prev.to }),
    enabled: !!repo && !!user,
    staleTime: 1000 * 60 * 5,
  });

  const ind = insights?.individual?.commitClassification;
  const team = insights?.team?.commitClassification;

  function buildInsights(): Array<{ tone: "positive" | "warning" | "info"; title: string; body: string }> {
    if (!ind || !team) return [];
    const result: Array<{ tone: "positive" | "warning" | "info"; title: string; body: string }> = [];

    const total = ind.feat + ind.fix + ind.other;
    const otherRatio = total > 0 ? ind.other / total : 0;
    const conventionalPct = total > 0 ? Math.round((ind.totalConventional / total) * 100) : 0;

    // Diagnósticos focam no CONTEÚDO do trabalho (tipo de commit, padrão, qualidade),
    // nunca em QUANDO a pessoa trabalha — padrões de horário viram autoconhecimento
    // neutro no painel "Ritmo de trabalho", não alertas de vigilância (ver SPACE/DORA).

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

    // ── Alertas ────────────────────────────────────────────────
    if (ind.fixRatio > 0.3) {
      result.push({
        tone: "warning",
        title: "Bug fixing acima do baseline",
        body: `${(ind.fixRatio * 100).toFixed(0)}% do esforço foi para correções${team.fixRatio > 0 ? ` — ${((ind.fixRatio - team.fixRatio) * 100).toFixed(0)} pontos percentuais acima da média da equipe` : ""}.`,
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

    return result;
  }

  const autoInsights = buildInsights();
  const trendRows = buildTrend(ind, prevInsights?.individual?.commitClassification);
  const compareLabel = PRESET_COMPARE[period.preset];

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="size-4 text-violet-glow" />
          <h3 className="text-base font-semibold text-foreground">Diagnósticos automáticos</h3>
        </div>
        {/* Transparência: o motor é heurístico, baseado em regras fixas — não é ML. */}
        <div className="flex items-start gap-2 rounded-lg border border-border bg-foreground/[0.02] p-3 mb-4">
          <FunctionSquare className="size-3.5 text-violet-glow shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Diagnósticos gerados por <span className="text-foreground/80">regras determinísticas</span> (limiares
            sobre tipo de commit e adoção de Conventional Commits) — não há aprendizado de máquina nem
            inferência sobre a pessoa. São observações sobre o <span className="text-foreground/80">conteúdo</span> do
            trabalho versionado, jamais sobre quando ou quanto você trabalha.
          </p>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-obsidian-900/40 border border-border" />
            ))}
          </div>
        ) : isError ? (
          <QueryError onRetry={refetch} className="h-28" />
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

      {trendRows && <TrendPanel rows={trendRows} compareLabel={compareLabel} />}

      {insights?.productivityHeatmap && (
        <>
          <ProductivityHeatmap heatmap={insights.productivityHeatmap} />
          <WorkRhythmPanel heatmap={insights.productivityHeatmap} />
        </>
      )}

    </div>
  );
}
