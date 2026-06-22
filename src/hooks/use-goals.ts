import { useState } from "react";
import { DEFAULT_GOALS, type ProductivityGoals } from "@/lib/api";

/**
 * Metas do Score de Produtividade, vinculadas ao período de análise.
 *
 * O usuário define as metas ao entrar no dashboard e precisa redefini-las sempre que
 * troca o período selecionado — uma meta de "20 dias ativos" faz sentido em 30 dias, não em 7.
 * Por isso o estado guarda *para qual período* as metas foram confirmadas (`definedFor`):
 * enquanto esse período não bater com o atual, `ready` é falso e a UI exige a (re)definição.
 *
 * As metas não são persistidas: cada entrada no dashboard recomeça a definição, em coerência
 * com o propósito de autoavaliação consciente do indicador.
 *
 * @param periodKey identificador estável do período atual (ex.: `"2026-05-01_2026-05-31"`).
 */
export function useGoals(periodKey: string) {
  // Última configuração informada — serve de ponto de partida do formulário.
  const [goals, setGoals] = useState<ProductivityGoals>(DEFAULT_GOALS);
  // Período para o qual as metas acima foram efetivamente confirmadas.
  const [definedFor, setDefinedFor] = useState<string | null>(null);

  const ready = definedFor === periodKey;

  function apply(next: ProductivityGoals) {
    setGoals(next);
    setDefinedFor(periodKey);
  }

  return { goals, ready, apply };
}
