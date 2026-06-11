import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { PeriodProvider } from "@/hooks/use-period";
import { ActiveRepoProvider } from "@/hooks/use-active-repo";
import { isAuthenticated, getSelectedRepo } from "@/lib/auth";

function AuthGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
    } else if (!getSelectedRepo()) {
      navigate({ to: "/select-repos" });
    }
  }, [navigate]);

  if (!isAuthenticated() || !getSelectedRepo()) return null;

  return (
    <ActiveRepoProvider>
      <PeriodProvider>
        <AppShell />
      </PeriodProvider>
    </ActiveRepoProvider>
  );
}

export const Route = createFileRoute("/_app")({
  component: AuthGuard,
});
