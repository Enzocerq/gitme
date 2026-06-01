import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { exchangeGithubCode } from "@/lib/api";
import { setToken, setUser, isAuthenticated } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth-callback")({
  head: () => ({ meta: [{ title: "Autenticando — GITME" }] }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate({ to: "/select-repos" });
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const storedState = sessionStorage.getItem("oauth_state");

    if (state !== storedState) {
      setError("Estado OAuth inválido. Tente fazer login novamente.");
      return;
    }
    if (!code) {
      setError("Código OAuth não encontrado na URL.");
      return;
    }

    sessionStorage.removeItem("oauth_state");

    exchangeGithubCode(code)
      .then(({ accessToken, user }) => {
        setToken(accessToken);
        setUser({
          login: user.login,
          name: user.name,
          avatarUrl: user.avatarUrl ?? `https://github.com/${user.login}.png`,
        });
        navigate({ to: "/select-repos" });
      })
      .catch((err: Error) => {
        setError(err.message ?? "Falha na autenticação. Tente novamente.");
      });
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-foreground">
        <div className="w-full max-w-sm rounded-3xl border border-ruby-glow/30 bg-ruby-glow/5 backdrop-blur-2xl p-10 shadow-2xl text-center">
          <p className="text-ruby-glow font-semibold mb-2">Erro de autenticação</p>
          <p className="text-sm text-muted-foreground mb-6">{error}</p>
          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl bg-foreground text-obsidian-950 font-semibold text-sm"
          >
            Voltar ao login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-foreground">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="size-8 text-emerald-glow animate-spin" />
        <p className="text-sm text-muted-foreground">Autenticando com GitHub...</p>
      </div>
    </div>
  );
}
