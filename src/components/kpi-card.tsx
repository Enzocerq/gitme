import { GlassCard } from "./glass-card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: { value: number; suffix?: string; invert?: boolean };
  hint?: string;
  children?: React.ReactNode;
}

export function KpiCard({ label, value, delta, hint, children }: KpiCardProps) {
  const positive = delta ? (delta.invert ? delta.value < 0 : delta.value > 0) : false;
  const negative = delta ? (delta.invert ? delta.value > 0 : delta.value < 0) : false;

  return (
    <GlassCard className="p-6">
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.18em] mb-2">
        {label}
      </p>
      <div className="flex items-end gap-2">
        <span className="text-4xl font-bold font-mono tracking-tight text-foreground">{value}</span>
        {delta && (
          <span
            className={cn(
              "text-xs font-mono mb-1.5",
              positive && "text-emerald-glow",
              negative && "text-ruby-glow",
              !positive && !negative && "text-muted-foreground"
            )}
          >
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
