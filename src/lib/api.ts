import { getToken } from "./auth";

const BASE_URL = (import.meta.env.VITE_BACKEND_URL as string | undefined) ?? "http://localhost:8080";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ---------- Auth ----------

export interface AuthResponse {
  accessToken: string;
  user: {
    login: string;
    name: string | null;
    avatarUrl: string;
  };
}

export async function exchangeGithubCode(code: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/github`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Auth failed: ${text}`);
  }
  return res.json() as Promise<AuthResponse>;
}

// ---------- GitHub Repos ----------

export interface GithubRepo {
  id: number;
  name: string;
  description: string | null;
  htmlUrl: string;
  stars: number;
  owner: { login: string };
}

export async function getUserRepos(): Promise<GithubRepo[]> {
  return apiFetch<GithubRepo[]>("/api/poc/github/repositorios");
}

// ---------- ETL ----------

export interface SeedStatus {
  status: "IDLE" | "RUNNING" | "DONE" | "ERROR";
  currentRepo: string;
  errorMessage: string;
  commitsIngested: number;
  pullRequestsIngested: number;
  issuesIngested: number;
  reviewsIngested: number;
  prCommitsIngested: number;
}

export async function startSeed(repos: string[]): Promise<"started" | "already_running"> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/api/poc/etl/seed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ repos }),
  });
  if (res.status === 409) return "already_running";
  if (!res.ok) throw new Error("Falha ao iniciar a ingestão ETL");
  return "started";
}

export async function getSeedStatus(): Promise<SeedStatus> {
  return apiFetch<SeedStatus>("/api/poc/etl/status");
}

// ---------- Metrics ----------

export interface MetricParams {
  repoId: number;
  authorLogin: string;
  from: string;
  to: string;
}

interface RepoOnlyParams {
  authorLogin: string;
  from: string;
  to: string;
}

function metricQs(params: MetricParams): string {
  return new URLSearchParams({
    repoId: String(params.repoId),
    authorLogin: params.authorLogin,
    from: params.from,
    to: params.to,
  }).toString();
}

// Overview
export interface OverviewMetrics {
  period: { from: string; to: string };
  individual: { commits: number; prsOpened: number; prsMerged: number; acceptanceRate: number };
  team: { commits: number; prsOpened: number; prsMerged: number; acceptanceRate: number };
  activityOverTime: Array<{
    date: string;
    commits: number;
    prs: number;
    teamCommits: number;
    teamPrs: number;
  }>;
}

export async function getOverviewMetrics(params: MetricParams): Promise<OverviewMetrics> {
  return apiFetch<OverviewMetrics>(`/api/poc/metrics/overview?${metricQs(params)}`);
}

// Flow
export interface FlowMetrics {
  period: { from: string; to: string };
  individual: { cycleTimeHours: number; leadTimeHours: number; tcm: number; timeInReviewHours: number; activeDays: number };
  team: { cycleTimeHours: number; leadTimeHours: number; tcm: number; timeInReviewHours: number; activeDays: number };
  timeInReviewSeries: Array<{ date: string; avgHours: number }>;
  recent: Array<{ kind: string; sha: string | null; number: number | null; title: string; state: string; date: string; authorLogin: string }>;
}

export async function getFlowMetrics(params: MetricParams): Promise<FlowMetrics> {
  return apiFetch<FlowMetrics>(`/api/poc/metrics/flow?${metricQs(params)}`);
}

// Repos
export interface RepoMetrics {
  period: { from: string; to: string };
  repos: Array<{ repoId: number; name: string; totalCommits: number; userCommits: number; participation: number; totalPrs: number; userPrs: number }>;
}

export async function getRepoMetrics(params: RepoOnlyParams): Promise<RepoMetrics> {
  const qs = new URLSearchParams({ authorLogin: params.authorLogin, from: params.from, to: params.to }).toString();
  return apiFetch<RepoMetrics>(`/api/poc/metrics/repos?${qs}`);
}

// Collaboration
export interface CollaborationMetrics {
  period: { from: string; to: string };
  activeContributors: number;
  reviewDistribution: Array<{ login: string; reviews: number }>;
  comparison: {
    individual: { commits: number; prsMerged: number; tcm: number };
    teamAverage: { commits: number; prsMerged: number; tcm: number };
  };
}

export async function getCollaborationMetrics(params: MetricParams): Promise<CollaborationMetrics> {
  return apiFetch<CollaborationMetrics>(`/api/poc/metrics/collaboration?${metricQs(params)}`);
}

// Insights
export interface InsightsMetrics {
  period: { from: string; to: string };
  individual: { commitClassification: { feat: number; fix: number; other: number; totalConventional: number; featRatio: number; fixRatio: number } };
  team: { commitClassification: { feat: number; fix: number; other: number; totalConventional: number; featRatio: number; fixRatio: number } };
  productivityHeatmap: number[][];
}

export async function getInsightsMetrics(params: MetricParams): Promise<InsightsMetrics> {
  return apiFetch<InsightsMetrics>(`/api/poc/metrics/insights?${metricQs(params)}`);
}
