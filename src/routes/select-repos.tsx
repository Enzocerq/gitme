import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserRepos, startSeed, getSeedStatus, type GithubRepo } from "@/lib/api";
import { getUser, setSelectedRepos, isAuthenticated } from "@/lib/auth";
import { GithubIcon, GitBranch, Search, Loader2, Star, CheckCircle2, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/glass-card";

export const Route = createFileRoute("/select-repos")({
  head: () => ({ meta: [{ title: "Selecionar Repositório — GITME" }] }),
  component: SelectReposPage,
});

type Phase = "select" | "seeding" | "done" | "error";

interface SeedState {
  phase: Phase;
  message: string;
  commitsIngested: number;
  pullRequestsIngested: number;
  issuesIngested: number;
  repoNames: string[];
}

function SelectReposPage() {
  const navigate = useNavigate();
  const user = getUser();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<GithubRepo[]>([]);
  const [seedState, setSeedState] = useState<SeedState>({
    phase: "select",
    message: "",
    commitsIngested: 0,
    pullRequestsIngested: 0,
    issuesIngested: 0,
    repoNames: [],
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  const {
    data: repos,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-repos"],
    queryFn: getUserRepos,
    enabled: isAuthenticated(),
    staleTime: 1000 * 60 * 5,
  });

  const filtered = (repos ?? []).filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => () => stopPolling(), []);

  function toggleRepo(repo: GithubRepo) {
    setSelected((prev) =>
      prev.some((r) => r.id === repo.id)
        ? prev.filter((r) => r.id !== repo.id)
        : [...prev, repo]
    );
  }

  async function handleAnalyze() {
    if (selected.length === 0) return;
    const fullNames = selected.map((r) => `${r.owner.login}/${r.name}`);

    setSeedState({ phase: "seeding", message: `Iniciando ingestão de ${fullNames.length} repositório(s)…`, commitsIngested: 0, pullRequestsIngested: 0, issuesIngested: 0, repoNames: fullNames });

    try {
      await startSeed(fullNames);
    } catch (err) {
      setSeedState((s) => ({ ...s, phase: "error", message: String(err) }));
      return;
    }

    pollRef.current = setInterval(async () => {
      try {
        const status = await getSeedStatus();
        setSeedState((s) => ({
          ...s,
          phase: status.status === "DONE" ? "done" : status.status === "ERROR" ? "error" : "seeding",
          message:
            status.status === "DONE"
              ? "Ingestão concluída! Redirecionando…"
              : status.status === "ERROR"
              ? `Erro: ${status.errorMessage}`
              : `Processando ${status.currentRepo || fullNames[0]}…`,
          commitsIngested: status.commitsIngested,
          pullRequestsIngested: status.pullRequestsIngested,
          issuesIngested: status.issuesIngested,
        }));

        if (status.status === "DONE") {
          stopPolling();
          setSelectedRepos(
            selected.map((r) => ({
              id: r.id,
              name: r.name,
              fullName: `${r.owner.login}/${r.name}`,
              owner: r.owner.login,
              description: r.description,
            }))
          );
          setTimeout(() => navigate({ to: "/dashboard" }), 1200);
        }

        if (status.status === "ERROR") {
          stopPolling();
        }
      } catch {
        // keep polling on transient errors
      }
    }, 3000);
  }

  if (seedState.phase === "seeding" || seedState.phase === "done" || seedState.phase === "error") {
    return <SeedingScreen state={seedState} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-16 px-4 text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-[calc(50%-300px)] size-[600px] rounded-full bg-emerald-glow/15 blur-[160px]" />
        <div className="absolute bottom-0 left-[calc(50%-300px)] size-[600px] rounded-full bg-violet-deep/22 blur-[160px]" />
      </div>

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="size-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--color-emerald-glow), var(--color-violet-deep))" }}
          >
            <GithubIcon className="size-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-base tracking-tight">
              <span className="text-emerald-glow">git</span>
              <span className="text-violet-deep">me</span>
            </p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Seleção de repositórios</p>
          </div>
          {user && (
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <img
                src={user.avatarUrl}
                alt={user.login}
                className="size-7 rounded-full border border-border"
              />
              <span>@{user.login}</span>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">
          Escolha os repositórios
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Selecione um ou mais repositórios para análise de métricas de produtividade.
        </p>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar repositório…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-obsidian-900/60 backdrop-blur-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-emerald-glow/50 transition-colors"
          />
        </div>

        {/* Repo list */}
        <GlassCard className="overflow-hidden mb-6">
          {isLoading && (
            <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span className="text-sm">Carregando repositórios…</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12 gap-3 text-ruby-glow">
              <AlertTriangle className="size-5" />
              <span className="text-sm">Falha ao carregar repositórios. Verifique o backend.</span>
            </div>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
              Nenhum repositório encontrado.
            </div>
          )}

          {!isLoading && !error && (
            <ul className="divide-y divide-border max-h-[420px] overflow-y-auto">
              {filtered.map((repo) => {
                const isSelected = selected.some((r) => r.id === repo.id);
                return (
                  <li
                    key={repo.id}
                    onClick={() => toggleRepo(repo)}
                    className={`px-5 py-4 flex items-center gap-4 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-emerald-glow/10 border-l-2 border-l-emerald-glow"
                        : "hover:bg-obsidian-800/30"
                    }`}
                  >
                    <div
                      className={`size-9 rounded-lg grid place-items-center border ${
                        isSelected
                          ? "bg-emerald-glow/15 border-emerald-glow/30"
                          : "bg-obsidian-800/60 border-border"
                      }`}
                    >
                      {isSelected ? (
                        <CheckCircle2 className="size-4 text-emerald-glow" />
                      ) : (
                        <GitBranch className="size-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isSelected ? "text-emerald-glow" : "text-foreground"}`}>
                        {repo.owner.login}/{repo.name}
                      </p>
                      {repo.description && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{repo.description}</p>
                      )}
                    </div>
                    {repo.stars > 0 && (
                      <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground shrink-0">
                        <Star className="size-3" />
                        {repo.stars.toLocaleString()}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>

        {/* Selection summary */}
        {selected.length > 0 && (
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs text-emerald-glow font-mono">
              {selected.length} repositório{selected.length > 1 ? "s" : ""} selecionado{selected.length > 1 ? "s" : ""}
            </p>
            <button
              onClick={() => setSelected([])}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Limpar seleção
            </button>
          </div>
        )}

        {/* Action */}
        <button
          onClick={handleAnalyze}
          disabled={selected.length === 0}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-foreground text-obsidian-950 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_24px_rgba(56,189,248,0.4)] hover:bg-emerald-glow"
        >
          <GithubIcon className="size-5" />
          {selected.length > 0
            ? `Analisar ${selected.length} repositório${selected.length > 1 ? "s" : ""}`
            : "Selecione repositórios"}
        </button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Os dados serão ingeridos na primeira vez. Repositórios grandes podem levar alguns minutos.
        </p>
      </div>
    </div>
  );
}

function SeedingScreen({ state }: { state: SeedState }) {
  const total = state.commitsIngested + state.pullRequestsIngested + state.issuesIngested;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 size-[500px] rounded-full bg-emerald-glow/12 blur-[180px]" />
      </div>

      <GlassCard className="w-full max-w-md p-10 text-center">
        <div className="mb-6 grid place-items-center">
          {state.phase === "done" ? (
            <CheckCircle2 className="size-12 text-emerald-glow" />
          ) : state.phase === "error" ? (
            <AlertTriangle className="size-12 text-ruby-glow" />
          ) : (
            <Loader2 className="size-12 text-emerald-glow animate-spin" />
          )}
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-2">
          {state.phase === "done" ? "Ingestão concluída!" : state.phase === "error" ? "Erro na ingestão" : "Ingerindo dados…"}
        </h2>

        <p className="text-sm text-muted-foreground mb-8">{state.message}</p>

        {state.phase === "seeding" && total > 0 && (
          <div className="space-y-3 text-left mb-6">
            {[
              { label: "Commits", value: state.commitsIngested, color: "bg-emerald-glow" },
              { label: "Pull Requests", value: state.pullRequestsIngested, color: "bg-violet-glow" },
              { label: "Issues", value: state.issuesIngested, color: "bg-amber-glow" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${item.color}`} />
                  <span className="text-muted-foreground">{item.label}</span>
                </div>
                <span className="font-mono text-foreground tabular-nums">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {state.phase === "error" && (
          <a
            href="/select-repos"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-foreground text-obsidian-950 font-semibold text-sm"
          >
            Tentar novamente
          </a>
        )}
      </GlassCard>
    </div>
  );
}
