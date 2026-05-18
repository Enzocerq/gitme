export const mockUser = {
  login: "alex-rivera",
  name: "Alex Rivera",
  role: "Lead Architect",
  avatarUrl: "https://i.pravatar.cc/120?img=12",
};

export const mockKPIs = {
  commits: 348,
  commitsDelta: 12.4,
  prsMerged: 42,
  prsOpened: 51,
  score: 89,
  scoreDelta: 4.2,
  acceptanceRate: 92.1,
  acceptanceDelta: -1.1,
  leadTimeDays: 1.4,
  leadTimeDelta: -12,
  cycleTimeHours: 3.2,
  cycleTimeDelta: 0.8,
  activeDays: 22,
  tcm: 86, // avg lines per commit
};

// 30-day activity series
export const mockActivitySeries = Array.from({ length: 30 }).map((_, i) => {
  const day = i + 1;
  const seed = Math.sin(i * 1.3) * 0.5 + 0.5;
  const seed2 = Math.cos(i * 0.9) * 0.5 + 0.5;
  return {
    day: `D${day}`,
    date: `2025-04-${String(day).padStart(2, "0")}`,
    commits: Math.round(4 + seed * 18),
    prs: Math.round(1 + seed2 * 5),
    score: Math.round(70 + seed * 25),
    teamAvg: Math.round(65 + seed2 * 12),
  };
});

export const mockRecentActivity = [
  { type: "commit", title: "refactor: optimize token verification middleware", repo: "githealth-api", time: "2h", diff: "+142 -12", status: "ok" },
  { type: "pr", title: "Merge pull request #88 from dev/feature-api", repo: "core-engine", time: "5h", diff: "+892 -45", status: "merged" },
  { type: "commit", title: "fix: memory leak in stream buffer parser", repo: "data-ingest", time: "1d", diff: "+14 -4", status: "warn" },
  { type: "pr", title: "feat: implement realtime dashboard hydration", repo: "githealth-web", time: "1d", diff: "+412 -88", status: "open" },
  { type: "commit", title: "chore: bump dependencies & lockfile", repo: "githealth-web", time: "2d", diff: "+1204 -1190", status: "ok" },
  { type: "issue", title: "Investigate flaky e2e in checkout flow", repo: "core-engine", time: "3d", diff: "—", status: "warn" },
];

export const mockRepos = [
  { name: "githealth-api", commits: 142, prs: 18, participation: 64, productionRate: 8.4, language: "TypeScript", color: "#10b981" },
  { name: "core-engine", commits: 96, prs: 12, participation: 41, productionRate: 5.9, language: "Rust", color: "#8b5cf6" },
  { name: "githealth-web", commits: 72, prs: 9, participation: 38, productionRate: 6.2, language: "TypeScript", color: "#f43f5e" },
  { name: "data-ingest", commits: 38, prs: 3, participation: 22, productionRate: 3.1, language: "Go", color: "#f59e0b" },
];

export const mockTeam = [
  { name: "Marcus Thorne", role: "Senior Frontend", login: "marcus-t", avatar: "https://i.pravatar.cc/80?img=33", commits: 142, reviews: 28, score: 96, trend: [2, 4, 3, 6, 5, 4, 6] },
  { name: "Sana K.", role: "DevOps Lead", login: "sanak", avatar: "https://i.pravatar.cc/80?img=47", commits: 89, reviews: 54, score: 91, trend: [4, 3, 4, 4, 5, 5, 6] },
  { name: "Yuki Tanaka", role: "Backend Engineer", login: "yuki", avatar: "https://i.pravatar.cc/80?img=15", commits: 76, reviews: 31, score: 84, trend: [3, 3, 2, 4, 3, 5, 4] },
  { name: "Priya Shah", role: "Staff Engineer", login: "priya", avatar: "https://i.pravatar.cc/80?img=23", commits: 65, reviews: 42, score: 88, trend: [2, 3, 4, 3, 4, 4, 5] },
  { name: "Diego Alvarez", role: "Mobile Engineer", login: "diego", avatar: "https://i.pravatar.cc/80?img=51", commits: 51, reviews: 17, score: 78, trend: [1, 2, 3, 2, 3, 4, 3] },
];

export const mockTeamComparison = [
  { metric: "Commits/sem", you: 38, team: 24 },
  { metric: "PRs/sem", you: 6.2, team: 4.1 },
  { metric: "Cycle Time (h)", you: 3.2, team: 5.4 },
  { metric: "Lead Time (d)", you: 1.4, team: 2.6 },
  { metric: "Score", you: 89, team: 74 },
];

export const mockReviewsDistribution = [
  { reviewer: "Marcus T.", reviewed: 28 },
  { reviewer: "Sana K.", reviewed: 54 },
  { reviewer: "Yuki T.", reviewed: 31 },
  { reviewer: "Priya S.", reviewed: 42 },
  { reviewer: "Diego A.", reviewed: 17 },
  { reviewer: "Você", reviewed: 36 },
];

export const mockTimeInReview = [
  { pr: "#1402", hours: 36, status: "blocked" },
  { pr: "#1399", hours: 18, status: "review" },
  { pr: "#1394", hours: 8, status: "review" },
  { pr: "#1388", hours: 4, status: "ok" },
  { pr: "#1385", hours: 2, status: "ok" },
];

// 7x24 heatmap: rows = days (Mon..Sun), cols = hours 0..23
export const mockHeatmap = Array.from({ length: 7 }).map((_, d) =>
  Array.from({ length: 24 }).map((_, h) => {
    const workHour = h >= 9 && h <= 18 ? 1 : 0.2;
    const weekend = d >= 5 ? 0.3 : 1;
    const noise = Math.abs(Math.sin(d * 2.7 + h * 1.3));
    return Math.round(workHour * weekend * (10 + noise * 28));
  })
);

export const mockBugFixRatio = [
  { name: "Features", value: 68, color: "var(--emerald-glow)" },
  { name: "Bug Fixing", value: 22, color: "var(--ruby-glow)" },
  { name: "Refactor / Chore", value: 10, color: "var(--violet-glow)" },
];

export const mockInsights = [
  { tone: "positive", title: "Aceitação em alta", body: "Sua taxa de aceitação de PRs cresceu 15% no último mês, indicando entregas mais maduras na primeira revisão." },
  { tone: "warning", title: "Tempo em revisão", body: "Seu código permanece, em média, 3 dias aguardando revisão externa no repo core-engine." },
  { tone: "info", title: "Janela produtiva", body: "Sua maior densidade de commits ocorre entre 14h e 17h nas terças e quartas." },
  { tone: "positive", title: "Cycle time -18%", body: "Após adoção do staging automatizado, seu cycle time caiu 18% comparado ao trimestre anterior." },
  { tone: "warning", title: "Bug fixing acima do baseline", body: "22% do esforço foi para correções — 4 pontos acima da média da equipe (18%)." },
];

export const mockContributorsCount = 24;
