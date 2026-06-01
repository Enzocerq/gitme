import { createFileRoute } from "@tanstack/react-router";
import { GithubIcon, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — GITME" },
      { name: "description", content: "Conecte sua conta do GitHub para visualizar seu painel de saúde de desenvolvimento." },
    ],
  }),
  component: LoginPage,
});

function handleGithubIconLogin() {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID as string;
  if (!clientId) {
    alert("VITE_GITHUB_CLIENT_ID não configurado no .env");
    return;
  }
  const redirectUri = import.meta.env.VITE_REDIRECT_URI as string;
  const scope = "repo user";
  const state = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  sessionStorage.setItem("oauth_state", state);
  window.location.href =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(state)}`;
}

function LoginPage() {
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
          onClick={handleGithubIconLogin}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-foreground text-obsidian-950 font-semibold text-sm transition-all hover:shadow-[0_0_24px_rgba(56,189,248,0.4)] hover:bg-emerald-glow"
        >
          <GithubIcon className="size-5" />
          Continuar com GitHub
        </button>

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
