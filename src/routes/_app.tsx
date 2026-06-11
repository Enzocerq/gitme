import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { PeriodProvider } from "@/hooks/use-period";
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
    <PeriodProvider>
      <AppShell />
    </PeriodProvider>
  );
}

export const Route = createFileRoute("/_app")({
  component: AuthGuard,
});
