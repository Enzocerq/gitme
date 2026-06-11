import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  DEFAULT_PERIOD,
  presetRange,
  type Period,
  type PeriodPreset,
} from "@/lib/period";

const STORAGE_KEY = "gitme_period";

interface PeriodContextValue {
  period: Period;
  setPreset: (preset: Exclude<PeriodPreset, "custom">) => void;
  setCustom: (from: string, to: string) => void;
}

const PeriodContext = createContext<PeriodContextValue | null>(null);

function loadInitial(): Period {
  if (typeof window === "undefined") return DEFAULT_PERIOD;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PERIOD;
    const saved = JSON.parse(raw) as Period;
    // Presets são relativos: re-ancoramos em "hoje" a cada carga
    // para que "30 dias" não congele numa janela antiga.
    if (saved.preset && saved.preset !== "custom" && saved.preset in { "7d": 1, "30d": 1, "90d": 1, "365d": 1 }) {
      return { preset: saved.preset, ...presetRange(saved.preset as Exclude<PeriodPreset, "custom">) };
    }
    if (saved.from && saved.to) return { preset: "custom", from: saved.from, to: saved.to };
  } catch {
    /* ignora JSON inválido */
  }
  return DEFAULT_PERIOD;
}

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(period));
    } catch {
      /* storage indisponível */
    }
  }, [period]);

  function setPreset(preset: Exclude<PeriodPreset, "custom">) {
    setPeriod({ preset, ...presetRange(preset) });
  }

  function setCustom(from: string, to: string) {
    setPeriod({ preset: "custom", from, to });
  }

  return (
    <PeriodContext.Provider value={{ period, setPreset, setCustom }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod(): PeriodContextValue {
  const ctx = useContext(PeriodContext);
  if (!ctx) throw new Error("usePeriod precisa estar dentro de <PeriodProvider>");
  return ctx;
}
