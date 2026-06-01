import { createFileRoute } from "@tanstack/react-router";
import { Github, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — GitHealth" },
      { name: "description", content: "Conecte sua conta do GitHub para visualizar seu painel de saúde de desenvolvimento." },
    ],
  }),
  component: LoginPage,
});

function handleGithubLogin() {
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
        <div className="absolute top-1/4 left-1/4 size-[480px] rounded-full bg-emerald-glow/20 blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/4 size-[460px] rounded-full bg-violet-glow/25 blur-[160px]" />
        <div className="absolute top-2/3 left-1/2 size-[380px] rounded-full bg-ruby-glow/15 blur-[160px]" />
      </div>

      <div className="w-full max-w-md rounded-3xl border border-border bg-obsidian-900/60 backdrop-blur-2xl p-10 shadow-2xl">
        <div className="flex items-center gap-3 mb-10">
          <div className="size-10 grid place-items-center bg-emerald-glow rounded-lg text-obsidian-950 font-bold tracking-tighter shadow-[0_0_24px_rgba(16,185,129,0.5)]">
            GH
          </div>
          <div>
            <p className="font-bold text-lg tracking-tight">GitHealth</p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Engineering Intelligence
            </p>
          </div>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-3">
          Conecte seu GitHub
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
          Acompanhe seu cycle time, score de produtividade e a saúde colaborativa dos seus
          repositórios em tempo real.
        </p>

        <button
          onClick={handleGithubLogin}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-foreground text-obsidian-950 font-semibold text-sm transition-all hover:shadow-[0_0_24px_rgba(16,185,129,0.4)] hover:bg-emerald-glow"
        >
          <Github className="size-5" />
          Continuar com GitHub
        </button>

        <div className="mt-8 pt-6 border-t border-border flex items-start gap-3 text-xs text-muted-foreground">
          <Sparkles className="size-4 text-violet-glow mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            Ao continuar, você autoriza o GitHealth a ler metadados de commits, pull requests
            e issues dos repositórios selecionados. Nenhum dado é modificado.
          </p>
        </div>
      </div>
    </div>
  );
}
