import { ArrowDown, ArrowUp } from "lucide-react";
import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils";

export interface KpiDelta {
  value: number;
  suffix?: string;
  /** true quando "menor é melhor" (ex.: lead time, cycle time). */
  invert?: boolean;
  /** true para métricas de volume sem valência (ex.: commits) — mostra direção sem colorir bom/ruim. */
  neutral?: boolean;
  /** texto do tooltip; default: "vs. período anterior". */
  title?: string;
}

interface KpiCardProps {
  label: string;
  value: string;
  delta?: KpiDelta;
  hint?: string;
  children?: React.ReactNode;
}

export function KpiCard({ label, value, delta, hint, children }: KpiCardProps) {
  const dir = delta && delta.value !== 0 ? (delta.value > 0 ? "up" : "down") : "flat";
  const good = delta && !delta.neutral ? (delta.invert ? delta.value < 0 : delta.value > 0) : false;
  const bad = delta && !delta.neutral ? (delta.invert ? delta.value > 0 : delta.value < 0) : false;
  const DirIcon = dir === "up" ? ArrowUp : dir === "down" ? ArrowDown : null;

  return (
    <GlassCard className="p-6">
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.18em] mb-2">{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold font-mono tracking-tight text-foreground">{value}</span>
        {delta && (
          <span
            title={delta.title ?? "vs. período anterior"}
            className={cn(
              "text-xs font-mono mb-1.5 inline-flex items-center gap-0.5",
              good && "text-emerald-glow",
              bad && "text-ruby-glow",
              !good && !bad && "text-muted-foreground"
            )}
          >
            {DirIcon && <DirIcon className="size-3 shrink-0" aria-hidden />}
            {delta.value > 0 ? "+" : ""}
            {delta.value}
            {delta.suffix ?? "%"}
          </span>
        )}
      </div>
      {hint && <p className="mt-2 text-[10px] text-muted-foreground">{hint}</p>}
      {children && <div className="mt-4">{children}</div>}
    </GlassCard>
  );
}
