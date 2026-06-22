import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DEFAULT_GOALS, type ProductivityGoals } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Campo do formulário. `percent: true` apresenta a meta como porcentagem (0–100) ao usuário,
 * mas o valor trafega como razão 0–1 (caso da Qualidade / taxa de aceitação de PRs).
 */
const FIELDS: Array<{
  key: keyof ProductivityGoals;
  label: string;
  color: string;
  unit: string;
  helper: string;
  step: number;
  min: number;
  max?: number;
  percent?: boolean;
}> = [
  {
    key: "metaEntrega",
    label: "Entrega",
    color: "#10b981",
    unit: "unid.",
    helper: "commits + PRs mergeadas × 3",
    step: 1,
    min: 1,
  },
  {
    key: "metaCycleTime",
    label: "Eficiência",
    color: "#8b5cf6",
    unit: "dias",
    helper: "cycle time médio alvo por PR (menor é melhor)",
    step: 0.5,
    min: 0.5,
  },
  {
    key: "metaQualidade",
    label: "Qualidade",
    color: "#f59e0b",
    unit: "%",
    helper: "taxa de aceitação de PRs (mergeadas ÷ criadas)",
    step: 5,
    min: 5,
    max: 100,
    percent: true,
  },
  {
    key: "metaReviews",
    label: "Colaboração",
    color: "#06b6d4",
    unit: "reviews",
    helper: "reviews fornecidas a outras pessoas",
    step: 1,
    min: 1,
  },
  {
    key: "metaDiasAtivos",
    label: "Consistência",
    color: "#f97316",
    unit: "dias",
    helper: "dias distintos com atividade",
    step: 1,
    min: 1,
  },
];

/** Converte as metas (razão 0–1 na Qualidade) para os números exibidos no formulário. */
function toForm(goals: ProductivityGoals): Record<keyof ProductivityGoals, number> {
  return { ...goals, metaQualidade: Math.round(goals.metaQualidade * 100) };
}

function fromForm(form: Record<keyof ProductivityGoals, number>): ProductivityGoals {
  return { ...form, metaQualidade: form.metaQualidade / 100 };
}

export function GoalsDialog({
  open,
  blocking,
  initial,
  periodLabel,
  onApply,
  onCancel,
}: {
  open: boolean;
  /** Quando true, o usuário ainda não definiu metas para o período: o modal não pode ser fechado. */
  blocking: boolean;
  initial: ProductivityGoals;
  periodLabel: string;
  onApply: (goals: ProductivityGoals) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(() => toForm(initial));

  // Reabrir o modal recomeça o formulário a partir das metas vigentes (ou dos defaults).
  useEffect(() => {
    if (open) setForm(toForm(initial));
  }, [open, initial]);

  const valid = FIELDS.every((f) => {
    const v = form[f.key];
    return Number.isFinite(v) && v >= f.min && (f.max == null || v <= f.max);
  });

  function setField(key: keyof ProductivityGoals, raw: string) {
    const v = raw === "" ? NaN : Number(raw);
    setForm((prev) => ({ ...prev, [key]: v }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (valid) onApply(fromForm(form));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !blocking) onCancel();
      }}
    >
      <DialogContent
        className={cn(
          "max-w-lg bg-obsidian-950/95 backdrop-blur-xl border-border",
          blocking && "[&>button]:hidden", // sem botão de fechar enquanto as metas não forem definidas
        )}
        onEscapeKeyDown={(e) => blocking && e.preventDefault()}
        onInteractOutside={(e) => blocking && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="size-4" style={{ color: "#f59e0b" }} />
            Definir metas do período
          </DialogTitle>
          <DialogDescription className="leading-relaxed">
            As metas calibram o seu{" "}
            <span className="text-foreground/80">Score de Produtividade</span> para{" "}
            <span className="text-foreground/80">{periodLabel}</span>. Defina-as conforme o ritmo de
            trabalho que considera adequado para si, como referência de autoconhecimento, não
            avaliação. Ao trocar o período, você as ajusta novamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {FIELDS.map((f) => {
              const v = form[f.key];
              const invalid = !(Number.isFinite(v) && v >= f.min && (f.max == null || v <= f.max));
              return (
                <div key={f.key} className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: f.color, boxShadow: `0 0 4px ${f.color}` }}
                  />
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={`goal-${f.key}`}
                      className="text-sm font-medium text-foreground"
                    >
                      {f.label}
                    </label>
                    <p className="text-[11px] text-muted-foreground leading-tight">{f.helper}</p>
                  </div>
                  <div className="relative shrink-0">
                    <input
                      id={`goal-${f.key}`}
                      type="number"
                      inputMode="decimal"
                      step={f.step}
                      min={f.min}
                      max={f.max}
                      value={Number.isFinite(v) ? v : ""}
                      onChange={(e) => setField(f.key, e.target.value)}
                      className={cn(
                        "w-28 rounded-lg border bg-obsidian-900/60 pl-3 pr-12 py-2 text-sm font-mono text-foreground text-right tabular-nums",
                        "focus:outline-none focus:ring-1 focus:ring-foreground/30 transition-colors",
                        invalid ? "border-ruby-glow/60" : "border-border",
                      )}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground">
                      {f.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setForm(toForm(DEFAULT_GOALS))}
              className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors text-left"
            >
              Restaurar referência
            </button>
            <div className="flex gap-2 sm:justify-end">
              {!blocking && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                disabled={!valid}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-glow/15 text-emerald-glow border border-emerald-glow/30 hover:bg-emerald-glow/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Aplicar metas
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
