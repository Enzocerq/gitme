import { useEffect, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown } from "lucide-react";
import { usePeriod } from "@/hooks/use-period";
import { PRESET_SHORT, todayISO, type PeriodPreset } from "@/lib/period";
import { cn } from "@/lib/utils";

const PRESETS: Array<Exclude<PeriodPreset, "custom">> = ["7d", "30d", "90d", "365d"];

function fmtShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function PeriodPicker() {
  const { period, setPreset, setCustom } = usePeriod();
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(period.from);
  const [draftTo, setDraftTo] = useState(period.to);
  const ref = useRef<HTMLDivElement>(null);
  const today = todayISO();

  useEffect(() => {
    setDraftFrom(period.from);
    setDraftTo(period.to);
  }, [period.from, period.to]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const label =
    period.preset === "custom" ? `${fmtShort(period.from)} – ${fmtShort(period.to)}` : PRESET_SHORT[period.preset];

  const customValid = !!draftFrom && !!draftTo && draftFrom <= draftTo;

  function applyCustom() {
    if (customValid) {
      setCustom(draftFrom, draftTo);
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-obsidian-900/60 backdrop-blur-xl text-xs font-mono text-foreground hover:border-emerald-glow/40 transition-colors"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Período de análise: ${label}. Clique para alterar.`}
      >
        <CalendarDays className="size-4 text-emerald-glow shrink-0" />
        <span className="tabular-nums">{label}</span>
        <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Selecionar período de análise"
          className="absolute right-0 mt-2 w-64 rounded-xl border border-border bg-obsidian-950/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden"
        >
          <div className="p-2">
            {PRESETS.map((p) => {
              const active = period.preset === p;
              return (
                <button
                  key={p}
                  onClick={() => {
                    setPreset(p);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                    active
                      ? "bg-emerald-glow/10 text-emerald-glow font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-obsidian-800/50"
                  )}
                >
                  <span>{PRESET_SHORT[p]}</span>
                  {active && <Check className="size-4" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-border p-3 space-y-2.5">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Personalizado</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={draftFrom}
                max={draftTo || today}
                onChange={(e) => setDraftFrom(e.target.value)}
                aria-label="Data inicial"
                className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-border bg-obsidian-900/60 text-xs text-foreground outline-none focus:border-emerald-glow/50 transition-colors [color-scheme:dark]"
              />
              <span className="text-muted-foreground text-xs shrink-0">–</span>
              <input
                type="date"
                value={draftTo}
                min={draftFrom}
                max={today}
                onChange={(e) => setDraftTo(e.target.value)}
                aria-label="Data final"
                className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-border bg-obsidian-900/60 text-xs text-foreground outline-none focus:border-emerald-glow/50 transition-colors [color-scheme:dark]"
              />
            </div>
            <button
              onClick={applyCustom}
              disabled={!customValid}
              className="w-full py-2 rounded-lg bg-emerald-glow/15 border border-emerald-glow/30 text-emerald-glow text-xs font-medium transition-colors hover:bg-emerald-glow/25 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Aplicar período
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
