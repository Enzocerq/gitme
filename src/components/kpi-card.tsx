import { ArrowDown, ArrowUp, Info } from "lucide-react";
import { GlassCard } from "./glass-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { cn } from "@/lib/utils";

export interface KpiDelta {
  value: number;
  /** Unidade exibida após o número. Default: "%". Use "pts" para pontos percentuais. */
  suffix?: string;
  /** true quando "menor é melhor" (ex.: lead time, cycle time). */
  invert?: boolean;
  /** true para métricas de volume sem valência — mostra direção sem cor boa/ruim. */
  neutral?: boolean;
  /** Período de comparação exibido após o valor. Ex.: "30 dias ant.", "per. ant." */
  compareLabel?: string;
}

interface KpiCardProps {
  label: string;
  value: string;
  delta?: KpiDelta;
  hint?: string;
  /** Texto explicativo opcional (ícone ⓘ ao lado do label) — use para contextualizar métricas que podem ser mal interpretadas. */
  info?: string;
  children?: React.ReactNode;
}

export function KpiCard({ label, value, delta, hint, info, children }: KpiCardProps) {
  const isUp = delta && delta.value > 0;
  const isDown = delta && delta.value < 0;
  const good = delta && !delta.neutral ? (delta.invert ? isDown : isUp) : false;
  const bad = delta && !delta.neutral ? (delta.invert ? isUp : isDown) : false;
  const DirIcon = isUp ? ArrowUp : isDown ? ArrowDown : null;
  const sign = delta && delta.value > 0 ? "+" : "";
  const suffix = delta?.suffix ?? "%";
  const compareLabel = delta?.compareLabel ?? "per. ant.";

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-1.5 mb-2">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.18em]">
          {label}
        </p>
        {info && (
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`Sobre a métrica ${label}`}
                  className="text-muted-foreground/50 hover:text-muted-foreground transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-foreground/30 rounded"
                >
                  <Info className="size-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px] bg-obsidian-950/95 text-foreground border border-border backdrop-blur-xl leading-relaxed font-normal normal-case tracking-normal">
                {info}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <span className="text-4xl font-bold font-mono tracking-tight text-foreground">
        {value}
      </span>

      {delta && (
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          {/* Badge direcional */}
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-mono font-semibold px-1.5 py-0.5 rounded",
              good  && "text-[oklch(0.82_0.18_145)] bg-[oklch(0.82_0.18_145)]/10 ring-1 ring-[oklch(0.82_0.18_145)]/30",
              bad   && "text-ruby-glow bg-ruby-glow/10 ring-1 ring-ruby-glow/30",
              !good && !bad && "text-foreground/50 bg-foreground/5 ring-1 ring-foreground/10"
            )}
            aria-label={`variação: ${sign}${Math.abs(delta.value)}${suffix}${good ? " — melhora" : bad ? " — piora" : ""}`}
          >
            {DirIcon && <DirIcon className="size-3 shrink-0" aria-hidden="true" />}
            {sign}{Math.abs(delta.value)}{suffix}
          </span>

          {/* Contexto textual */}
          <span className="text-[10px] font-mono text-muted-foreground/70">
            vs. {compareLabel}
          </span>
        </div>
      )}

      {hint && (
        <p className="mt-2 text-[10px] text-muted-foreground">{hint}</p>
      )}

      {children && <div className="mt-4">{children}</div>}
    </GlassCard>
  );
}
