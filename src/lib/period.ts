// Período de análise global + utilitários de comparação contra o período anterior.

export type PeriodPreset = "7d" | "30d" | "90d" | "180d" | "365d" | "custom";

export interface Period {
  preset: PeriodPreset;
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD
}

export const PRESET_DAYS: Record<Exclude<PeriodPreset, "custom">, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "365d": 365,
};

export const PRESET_SHORT: Record<PeriodPreset, string> = {
  "7d": "7 dias",
  "30d": "30 dias",
  "90d": "90 dias",
  "180d": "6 meses",
  "365d": "12 meses",
  custom: "Personalizado",
};

export const PRESET_COMPARE: Record<PeriodPreset, string> = {
  "7d": "7 dias anteriores",
  "30d": "30 dias anteriores",
  "90d": "90 dias anteriores",
  "180d": "6 meses anteriores",
  "365d": "12 meses anteriores",
  custom: "período anterior",
};

export const PRESET_LABEL: Record<PeriodPreset, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  "180d": "Últimos 6 meses",
  "365d": "Últimos 12 meses",
  custom: "Período personalizado",
};

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function parseISO(s: string): Date {
  // Meia-noite UTC para evitar deslocamento por fuso horário nas contas de dias.
  return new Date(`${s}T00:00:00Z`);
}

/** Janela [hoje - (n-1), hoje] para um preset. */
export function presetRange(preset: Exclude<PeriodPreset, "custom">): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (PRESET_DAYS[preset] - 1));
  return { from: toISODate(from), to: toISODate(to) };
}

/** Quantidade de dias inclusivos no período. */
export function periodDays(period: Period): number {
  const from = parseISO(period.from);
  const to = parseISO(period.to);
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1);
}

/** Janela de mesma duração imediatamente anterior ao período atual. */
export function previousRange(period: Period): { from: string; to: string } {
  const days = periodDays(period);
  const prevTo = parseISO(period.from);
  prevTo.setUTCDate(prevTo.getUTCDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setUTCDate(prevFrom.getUTCDate() - (days - 1));
  return { from: toISODate(prevFrom), to: toISODate(prevTo) };
}

/**
 * Variação percentual relativa entre o valor atual e o anterior.
 * Retorna null quando não é representável (baseline zero com valor não-zero
 * ou entradas inválidas) — nesse caso a UI deve omitir o delta em vez de mentir.
 */
export function computeDeltaPct(current: number, previous: number): number | null {
  if (!isFinite(current) || !isFinite(previous)) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

/** Variação em pontos percentuais para métricas que já são taxas (0..1). */
export function computeDeltaPp(currentRate: number, previousRate: number): number | null {
  if (!isFinite(currentRate) || !isFinite(previousRate)) return null;
  return Math.round((currentRate - previousRate) * 100);
}

export const DEFAULT_PERIOD: Period = { preset: "30d", ...presetRange("30d") };

export function todayISO(): string {
  return toISODate(new Date());
}
