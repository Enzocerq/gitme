import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getUserRepos, getDemoRepos, getDemoTopContributor, startSeed, getSeedStatus, type GithubRepo } from "@/lib/api";
import { getUser, setUser, setSelectedRepos, isAuthenticated, isSimulationMode, logout } from "@/lib/auth";
import { GithubIcon, GitBranch, Search, Loader2, Star, CheckCircle2, AlertTriangle, FlaskConical, ArrowDownWideNarrow, ArrowDownAZ, LogOut } from "lucide-react";
import { GlassCard } from "@/components/glass-card";

/** Limite máximo de tentativas de polling (~5 min a 3 s) antes de declarar timeout. */
const MAX_POLL_ATTEMPTS = 100;
const POLL_INTERVAL_MS = 3000;

type SortKey = "stars" | "name";

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
  const isDemo = isSimulationMode();

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("stars");
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
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated() && !isDemo) {
      navigate({ to: "/login" });
    }
  }, [navigate, isDemo]);

  const {
    data: repos,
    isLoading,
    error,
  } = useQuery({
    queryKey: isDemo ? ["demo-repos"] : ["user-repos"],
    queryFn: isDemo ? getDemoRepos : getUserRepos,
    enabled: isDemo || isAuthenticated(),
    staleTime: 1000 * 60 * 5,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const list = (repos ?? []).filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q)
    );
    // Ordena por estrelas (proxy de relevância) ou alfabeticamente.
    // O backend não expõe pushed_at, então não há ordenação por atividade recente.
    return [...list].sort((a, b) =>
      sortKey === "stars" ? b.stars - a.stars : a.name.localeCompare(b.name)
    );
  }, [repos, search, sortKey]);

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

    if (isDemo) {
      const repoIds = selected.map((r) => r.id);
      try {
        const { login } = await getDemoTopContributor(repoIds);
        if (login) {
          setUser({
            login,
            name: login,
            avatarUrl: `https://github.com/${login}.png`,
          });
        }
      } catch {
        // mantém o usuário demo atual se a requisição falhar
      }
      setSelectedRepos(
        selected.map((r) => ({
          id: r.id,
          name: r.name,
          fullName: `${r.owner.login}/${r.name}`,
          owner: r.owner.login,
          description: r.description,
        }))
      );
      navigate({ to: "/dashboard" });
      return;
    }

    const fullNames = selected.map((r) => `${r.owner.login}/${r.name}`);

    setSeedState({ phase: "seeding", message: `Iniciando ingestão de ${fullNames.length} repositório(s)…`, commitsIngested: 0, pullRequestsIngested: 0, issuesIngested: 0, repoNames: fullNames });

    try {
      await startSeed(fullNames);
    } catch (err) {
      setSeedState((s) => ({ ...s, phase: "error", message: String(err) }));
      return;
    }

    attemptsRef.current = 0;
    pollRef.current = setInterval(async () => {
      attemptsRef.current += 1;

      // Timeout: evita ficar preso para sempre se o seed travar no backend.
      if (attemptsRef.current > MAX_POLL_ATTEMPTS) {
        stopPolling();
        setSeedState((s) => ({
          ...s,
          phase: "error",
          message:
            "Tempo limite excedido (~5 min) aguardando a ingestão. O processo pode ter travado no servidor. " +
            "Tente novamente — repositórios muito grandes podem exigir mais tempo.",
        }));
        return;
      }

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
        // erros transitórios não interrompem o polling; o timeout acima é a rede de segurança
      }
    }, POLL_INTERVAL_MS);
  }

  function handleRetry() {
    stopPolling();
    attemptsRef.current = 0;
    setSeedState({
      phase: "select",
      message: "",
      commitsIngested: 0,
      pullRequestsIngested: 0,
      issuesIngested: 0,
      repoNames: [],
    });
  }

  if (seedState.phase === "seeding" || seedState.phase === "done" || seedState.phase === "error") {
    return <SeedingScreen state={seedState} onRetry={handleRetry} />;
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
            {isDemo ? (
              <FlaskConical className="size-4 text-primary-foreground" />
            ) : (
              <GithubIcon className="size-4 text-primary-foreground" />
            )}
          </div>
          <div>
            <p className="font-bold text-base tracking-tight">
              <span className="text-emerald-glow">git</span>
              <span className="text-violet-deep">me</span>
            </p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              {isDemo ? "Modo demonstração" : "Seleção de repositórios"}
            </p>
          </div>
          {!isDemo && user && (
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <img
                src={user.avatarUrl}
                alt={user.login}
                className="size-7 rounded-full border border-border"
              />
              <span>@{user.login}</span>
            </div>
          )}
          {isDemo && (
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <span className="px-2 py-0.5 rounded-full border border-violet-deep/40 bg-violet-deep/10 text-violet-deep text-[10px] font-mono uppercase tracking-wider">
                Demo
              </span>
            </div>
          )}
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-1">
          {isDemo ? "Repositórios disponíveis" : "Escolha os repositórios"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {isDemo
            ? "Selecione um dos repositórios abaixo para explorar as métricas de produtividade."
            : "Selecione um ou mais repositórios para análise de métricas de produtividade."}
        </p>

        {/* Search + sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar repositório…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-obsidian-900/60 backdrop-blur-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-emerald-glow/50 transition-colors"
            />
          </div>
          <div
            role="group"
            aria-label="Ordenar repositórios"
            className="flex rounded-xl border border-border bg-obsidian-900/60 backdrop-blur-xl p-1 shrink-0"
          >
            {([
              { key: "stars" as const, label: "Estrelas", Icon: ArrowDownWideNarrow },
              { key: "name" as const, label: "Nome", Icon: ArrowDownAZ },
            ]).map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSortKey(key)}
                aria-pressed={sortKey === key}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  sortKey === key
                    ? "bg-emerald-glow/15 text-emerald-glow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>
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
          {isDemo ? <FlaskConical className="size-5" /> : <GithubIcon className="size-5" />}
          {selected.length > 0
            ? isDemo
              ? `Explorar ${selected.length} repositório${selected.length > 1 ? "s" : ""}`
              : `Analisar ${selected.length} repositório${selected.length > 1 ? "s" : ""}`
            : "Selecione repositórios"}
        </button>

        <p className="text-center text-xs text-muted-foreground mt-4">
          {isDemo
            ? "Os dados já estão carregados. Você será redirecionado imediatamente."
            : "Os dados serão ingeridos na primeira vez. Repositórios grandes podem levar alguns minutos."}
        </p>

        <button
          type="button"
          onClick={() => { logout(); navigate({ to: "/login" }); }}
          className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <LogOut className="size-4" />
          Voltar ao login
        </button>
      </div>
    </div>
  );
}

function SeedingScreen({ state, onRetry }: { state: SeedState; onRetry: () => void }) {
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

        {state.phase === "seeding" && (
          <>
            {/* Barra indeterminada: o backend não expõe um total estimado, então o
                progresso real é desconhecido — comunicamos isso explicitamente. */}
            <div
              className="h-1.5 w-full rounded-full bg-obsidian-800 progress-indeterminate mb-2"
              role="progressbar"
              aria-label="Ingestão em andamento (progresso indeterminado)"
            />
            <p className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-widest mb-6">
              Tempo indeterminado · contadores ao vivo abaixo
            </p>

            {total > 0 && (
              <div className="space-y-3 text-left mb-2">
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
          </>
        )}

        {state.phase === "error" && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-foreground text-obsidian-950 font-semibold text-sm transition-all hover:bg-emerald-glow"
          >
            Tentar novamente
          </button>
        )}
      </GlassCard>
    </div>
  );
}
