/**
 * Simple JSON file-based storage for score history.
 * In production, replace with PostgreSQL / Supabase.
 */

import fs from "fs";
import path from "path";

export interface RepoScoreEntry {
  repoFull: string;
  overall: number;
  readme: number;
  structure: number;
  tests: number;
  quality: number;
  activity: number;
  analysedAt: string;
}

export interface PRScoreEntry {
  repoFull: string;
  prNumber: number;
  overall: number;
  mergeReady: boolean;
  conflictCount: number;
  analysedAt: string;
}

export interface InterviewEntry {
  id: string;
  githubUser: string;
  questions: Array<{
    question: string;
    context: string;
    userAnswer?: string;
    feedback?: string;
  }>;
  createdAt: string;
}

const DATA_DIR = path.join(process.cwd(), ".devscore-data");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON<T>(filePath: string, fallback: T): T {
  try {
    ensureDir();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw) as T;
    }
  } catch {
    // Corrupted file — reset
  }
  return fallback;
}

function writeJSON(filePath: string, data: unknown) {
  ensureDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ── Repo Scores ──────────────────────────────────────────────────────────

export function getRepoScores(repoFull: string): RepoScoreEntry[] {
  const filePath = path.join(DATA_DIR, "repo-scores.json");
  const all: RepoScoreEntry[] = readJSON(filePath, []);
  return all.filter((e) => e.repoFull === repoFull).sort(
    (a, b) => new Date(b.analysedAt).getTime() - new Date(a.analysedAt).getTime()
  );
}

export function getAllRepoScores(): RepoScoreEntry[] {
  const filePath = path.join(DATA_DIR, "repo-scores.json");
  return readJSON<RepoScoreEntry[]>(filePath, []).sort(
    (a, b) => new Date(b.analysedAt).getTime() - new Date(a.analysedAt).getTime()
  );
}

export function addRepoScores(entries: RepoScoreEntry[]) {
  const filePath = path.join(DATA_DIR, "repo-scores.json");
  const all = readJSON<RepoScoreEntry[]>(filePath, []);
  all.push(...entries);
  writeJSON(filePath, all);
}

// ── PR Scores ────────────────────────────────────────────────────────────

export function getPRScore(repoFull: string, prNumber: number): PRScoreEntry | null {
  const filePath = path.join(DATA_DIR, "pr-scores.json");
  const all: PRScoreEntry[] = readJSON(filePath, []);
  return all.find((e) => e.repoFull === repoFull && e.prNumber === prNumber) || null;
}

export function getAllPRScores(): PRScoreEntry[] {
  const filePath = path.join(DATA_DIR, "pr-scores.json");
  return readJSON<PRScoreEntry[]>(filePath, []).sort(
    (a, b) => new Date(b.analysedAt).getTime() - new Date(a.analysedAt).getTime()
  );
}

export function addPRScore(entry: PRScoreEntry) {
  const filePath = path.join(DATA_DIR, "pr-scores.json");
  const all = readJSON<PRScoreEntry[]>(filePath, []);
  const existing = all.findIndex(
    (e) => e.repoFull === entry.repoFull && e.prNumber === entry.prNumber
  );
  if (existing >= 0) {
    all[existing] = entry;
  } else {
    all.push(entry);
  }
  writeJSON(filePath, all);
}

// ── Interviews ───────────────────────────────────────────────────────────

export function addInterview(entry: InterviewEntry) {
  const filePath = path.join(DATA_DIR, "interviews.json");
  const all = readJSON<InterviewEntry[]>(filePath, []);
  all.push(entry);
  writeJSON(filePath, all);
}

export function getInterviews(githubUser: string): InterviewEntry[] {
  const filePath = path.join(DATA_DIR, "interviews.json");
  const all: InterviewEntry[] = readJSON(filePath, []);
  return all.filter((e) => e.githubUser === githubUser).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ── Team Dashboard ───────────────────────────────────────────────────────

export function getTeamDashboardData(teamRepos: string[]): {
  repos: Array<{
    repoFull: string;
    latestScore: RepoScoreEntry | null;
    scoreTrend: number; // positive = improving, negative = declining
    recentPRs: PRScoreEntry[];
  }>;
} {
  const allRepoScores = getAllRepoScores();
  const allPRScores = getAllPRScores();

  const repos = teamRepos.map((repoFull) => {
    const repoHistory = allRepoScores.filter((e) => e.repoFull === repoFull);
    const latest = repoHistory[0] || null;
    const prev = repoHistory[1] || null;
    const trend = latest && prev ? latest.overall - prev.overall : 0;
    const recentPRs = allPRScores
      .filter((e) => e.repoFull === repoFull)
      .slice(0, 10);

    return { repoFull, latestScore: latest, scoreTrend: trend, recentPRs };
  });

  return { repos };
}
