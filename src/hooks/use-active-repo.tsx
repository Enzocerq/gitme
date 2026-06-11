import { createContext, useContext, useState, type ReactNode } from "react";
import {
  getSelectedRepos,
  getActiveRepo as getActiveRepoFromStorage,
  setActiveRepoId,
  type SelectedRepo,
} from "@/lib/auth";

interface ActiveRepoContextValue {
  activeRepo: SelectedRepo | null;
  allRepos: SelectedRepo[];
  setActiveRepo: (repo: SelectedRepo) => void;
}

const ActiveRepoContext = createContext<ActiveRepoContextValue | null>(null);

export function ActiveRepoProvider({ children }: { children: ReactNode }) {
  const [activeRepo, setActiveRepoState] = useState<SelectedRepo | null>(
    () => getActiveRepoFromStorage()
  );
  const [allRepos] = useState<SelectedRepo[]>(() => getSelectedRepos());

  function setActiveRepo(repo: SelectedRepo) {
    setActiveRepoId(repo.id);
    setActiveRepoState(repo);
  }

  return (
    <ActiveRepoContext.Provider value={{ activeRepo, allRepos, setActiveRepo }}>
      {children}
    </ActiveRepoContext.Provider>
  );
}

export function useActiveRepo(): ActiveRepoContextValue {
  const ctx = useContext(ActiveRepoContext);
  if (!ctx) throw new Error("useActiveRepo precisa estar dentro de <ActiveRepoProvider>");
  return ctx;
}
