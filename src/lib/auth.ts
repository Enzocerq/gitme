export interface GitHubUser {
  login: string;
  name: string | null;
  avatarUrl: string;
}

export interface SelectedRepo {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  description: string | null;
}

const TOKEN_KEY = "gh_token";
const USER_KEY = "gh_user";
const REPOS_KEY = "selected_repos";

function isClient() {
  return typeof window !== "undefined";
}

export function getToken(): string | null {
  if (!isClient()) return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (!isClient()) return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function getUser(): GitHubUser | null {
  if (!isClient()) return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as GitHubUser) : null;
}

export function setUser(user: GitHubUser): void {
  if (!isClient()) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getSelectedRepos(): SelectedRepo[] {
  if (!isClient()) return [];
  const raw = localStorage.getItem(REPOS_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as SelectedRepo[]) : [parsed as SelectedRepo];
}

export function getSelectedRepo(): SelectedRepo | null {
  const repos = getSelectedRepos();
  return repos[0] ?? null;
}

export function setSelectedRepos(repos: SelectedRepo[]): void {
  if (!isClient()) return;
  localStorage.setItem(REPOS_KEY, JSON.stringify(repos));
}

export function setSelectedRepo(repo: SelectedRepo): void {
  setSelectedRepos([repo]);
}

const ACTIVE_REPO_KEY = "gitme_active_repo_id";

export function getActiveRepoId(): number | null {
  if (!isClient()) return null;
  const raw = localStorage.getItem(ACTIVE_REPO_KEY);
  return raw ? parseInt(raw, 10) : null;
}

export function setActiveRepoId(id: number): void {
  if (!isClient()) return;
  localStorage.setItem(ACTIVE_REPO_KEY, String(id));
}

/** Repo atualmente ativo para visualização. Cai no primeiro selecionado como fallback. */
export function getActiveRepo(): SelectedRepo | null {
  const repos = getSelectedRepos();
  if (repos.length === 0) return null;
  const activeId = getActiveRepoId();
  if (activeId !== null) {
    const found = repos.find((r) => r.id === activeId);
    if (found) return found;
  }
  return repos[0];
}

const SIMULATION_KEY = "simulation_mode";

export function setSimulationMode(active: boolean): void {
  if (!isClient()) return;
  if (active) {
    localStorage.setItem(SIMULATION_KEY, "true");
  } else {
    localStorage.removeItem(SIMULATION_KEY);
  }
}

export function isSimulationMode(): boolean {
  if (!isClient()) return false;
  return localStorage.getItem(SIMULATION_KEY) === "true";
}

export function logout(): void {
  if (!isClient()) return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REPOS_KEY);
  localStorage.removeItem(SIMULATION_KEY);
  localStorage.removeItem(ACTIVE_REPO_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function defaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}
