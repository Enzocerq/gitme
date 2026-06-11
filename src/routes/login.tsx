import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GithubIcon, Sparkles, FlaskConical, AlertTriangle, Loader2 } from "lucide-react";
import { setToken, setUser, setSimulationMode } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — GITME" },
      { name: "description", content: "Conecte sua conta do GitHub para visualizar seu painel de saúde de desenvolvimento." },
    ],
  }),
  component: LoginPage,
});

/** Gera um state OAuth criptograficamente forte para proteção contra CSRF. */
function generateOAuthState(): string {
  const c = globalThis.crypto;
  if (typeof c?.randomUUID === "function") {
    return c.randomUUID().replace(/-/g, "");
  }
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  function handleGithubLogin() {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID as string;
    if (!clientId) {
      setError("Configuração ausente: defina VITE_GITHUB_CLIENT_ID no arquivo .env para habilitar o login via GitHub.");
      return;
    }
    setError(null);
    setRedirecting(true);
    const redirectUri = import.meta.env.VITE_REDIRECT_URI as string;
    const scope = "repo user";
    const state = generateOAuthState();
    sessionStorage.setItem("oauth_state", state);
    window.location.href =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&state=${encodeURIComponent(state)}`;
  }

  function handleDemoMode() {
    setSimulationMode(true);
    setToken("DEMO");
    setUser({ login: "demo", name: "Demonstração", avatarUrl: "https://github.com/github.png" });
    navigate({ to: "/select-repos" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-foreground">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-[calc(50%-300px)] size-[600px] rounded-full bg-emerald-glow/20 blur-[160px]" />
        <div className="absolute bottom-0 left-[calc(50%-300px)] size-[600px] rounded-full bg-violet-deep/25 blur-[160px]" />
      </div>

      <div className="w-full max-w-md rounded-3xl border border-border bg-obsidian-900/60 backdrop-blur-2xl p-10 shadow-2xl">
        <div className="flex items-center gap-5 mb-10">
          <div
            className="size-16 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--color-emerald-glow), var(--color-violet-deep))", boxShadow: "var(--shadow-glow)" }}
          >
            <GithubIcon className="size-8 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-3xl tracking-tight">
              <span className="text-emerald-glow">git</span>
              <span className="text-violet-deep">me</span>
            </p>
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
              Métricas Git & Insights
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          Acompanhe seu cycle time, score de produtividade e a saúde colaborativa dos seus
          repositórios em tempo real.
        </p>

        <button
          onClick={handleGithubLogin}
          disabled={redirecting}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-foreground text-obsidian-950 font-semibold text-sm transition-all hover:shadow-[0_0_24px_rgba(56,189,248,0.4)] hover:bg-emerald-glow disabled:opacity-60 disabled:cursor-wait"
        >
          {redirecting ? (
            <>
              <Loader2 className="size-5 animate-spin" />
              Redirecionando para o GitHub…
            </>
          ) : (
            <>
              <GithubIcon className="size-5" />
              Continuar com GitHub
            </>
          )}
        </button>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-ruby-glow/30 bg-ruby-glow/5 p-3 text-xs text-foreground/90 leading-relaxed"
          >
            <AlertTriangle className="size-4 text-ruby-glow shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-obsidian-900/60 text-muted-foreground">ou</span>
          </div>
        </div>

        <button
          onClick={handleDemoMode}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border border-border bg-transparent text-foreground font-semibold text-sm transition-all hover:border-violet-deep/50 hover:bg-violet-deep/10"
        >
          <FlaskConical className="size-5 text-violet-deep" />
          Ver demonstração
        </button>

        <p className="text-center text-[11px] text-muted-foreground mt-2">
          Explore o painel com dados de projetos open-source reais — sem precisar conectar sua conta
        </p>

        <div className="mt-8 pt-6 border-t border-border flex items-start gap-3 text-xs text-muted-foreground">
          <Sparkles className="size-4 text-violet-glow mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            Ao continuar, você autoriza o GITME a ler metadados de commits, pull requests
            e issues dos repositórios selecionados. Nenhum dado é modificado.
          </p>
        </div>
      </div>
    </div>
  );
}
