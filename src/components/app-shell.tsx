import { useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Activity,
  GitBranch,
  Users,
  Sparkles,
  GithubIcon,
  LogOut,
  GitFork,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { getUser, getSelectedRepo, logout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

const nav = [
  { to: "/dashboard", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/activity", label: "Atividade", icon: Activity },
  { to: "/repositories", label: "Repositórios", icon: GitBranch },
  { to: "/collaboration", label: "Equipe", icon: Users },
  { to: "/insights", label: "Insights", icon: Sparkles },
] as const;

const titles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Visão Geral de Produtividade", subtitle: "Resumo executivo de produtividade e fluxo" },
  "/activity": { title: "Atividade & Fluxo", subtitle: "Commits, PRs, issues e tempos de resolução" },
  "/repositories": { title: "Repositórios", subtitle: "Análise de esforço por repositório" },
  "/collaboration": { title: "Equipe", subtitle: "Distribuição de commits e colaboração entre membros" },
  "/insights": { title: "Motor de Insights", subtitle: "Diagnósticos automáticos e padrões de commit" },
};

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();
  const meta = titles[pathname] ?? { title: "GITME", subtitle: "Inteligência de engenharia em tempo real" };
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = getUser();
  const repo = getSelectedRepo();

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  function handleChangeRepo() {
    setSidebarOpen(false);
    navigate({ to: "/select-repos" });
  }

  return (
    <div className="min-h-screen text-foreground selection:bg-emerald-glow/30">
      {/* Background glows */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-[calc(50%-300px)] size-[600px] rounded-full bg-emerald-glow/15 blur-[160px]" />
        <div className="absolute bottom-0 left-[calc(50%-300px)] size-[600px] rounded-full bg-violet-deep/20 blur-[160px]" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 border-r border-border bg-obsidian-950/95 backdrop-blur-xl z-40 flex flex-col transition-transform duration-300 ease-in-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-6 flex items-center gap-3 border-b border-border">
          <div
            className="size-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, var(--color-emerald-glow), var(--color-violet-deep))" }}
          >
            <GithubIcon className="size-4 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-bold text-base tracking-tight text-foreground block leading-none">
              <span className="text-emerald-glow">git</span>
              <span className="text-violet-deep">me</span>
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">v1.0</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden size-8 grid place-items-center rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Fechar menu"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Repo badge */}
        {repo && (
          <button
            onClick={handleChangeRepo}
            className="mx-3 mt-3 px-3 py-2 rounded-lg bg-obsidian-900/60 border border-border text-left hover:border-emerald-glow/30 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <GitFork className="size-3.5 text-emerald-glow shrink-0" />
              <p className="text-xs font-medium text-foreground truncate">{repo.fullName}</p>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5 group-hover:text-emerald-glow/70 transition-colors">
              Trocar repositório
            </p>
          </button>
        )}

        <nav className="p-3 space-y-1 flex-1 mt-1">
          {nav.map((item) => {
            const active = pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  active
                    ? "bg-emerald-glow/10 text-emerald-glow font-medium border border-emerald-glow/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-obsidian-800/50"
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto size-1.5 rounded-full bg-emerald-glow shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4">
          <div className="flex items-center gap-3 p-3 bg-obsidian-900/60 border border-border rounded-xl backdrop-blur-xl">
            {user ? (
              <img
                src={user.avatarUrl}
                alt={user.login}
                className="size-10 rounded-full border border-border shrink-0"
              />
            ) : (
              <div className="size-10 rounded-full border border-border bg-obsidian-800 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.name ?? user?.login ?? "GitHub User"}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider truncate">
                @{user?.login ?? "…"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Sair"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="md:pl-64">
        <header className="h-16 md:h-20 border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 bg-obsidian-950/70 backdrop-blur-xl z-30 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden size-9 grid place-items-center rounded-lg border border-border bg-obsidian-900/60 backdrop-blur-xl text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Abrir menu"
            >
              <Menu className="size-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-semibold text-foreground truncate">{meta.title}</h1>
              <p className="text-xs text-muted-foreground hidden sm:block truncate">{meta.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="hidden sm:flex bg-obsidian-900/60 px-3 py-2 border border-border rounded-lg text-[10px] font-mono text-emerald-glow items-center gap-2 backdrop-blur-xl uppercase tracking-widest">
              <span className="size-2 rounded-full bg-emerald-glow animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              GitHub Conectado
            </div>
            <button
              onClick={toggle}
              className="size-9 grid place-items-center rounded-lg border border-border bg-obsidian-900/60 backdrop-blur-xl text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}
            >
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <a
              href={`https://github.com/${user?.login ?? ""}`}
              target="_blank"
              rel="noreferrer"
              className="size-9 grid place-items-center rounded-lg border border-border bg-obsidian-900/60 backdrop-blur-xl text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <GithubIcon className="size-4" />
            </a>
          </div>
        </header>

        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
