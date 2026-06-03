import type { ExcavationResult, CareerChapter } from "../types.js";

export type { ExcavationResult };

interface CommitEntry {
  date: string;
  message: string;
  files: string[];
  additions: number;
  deletions: number;
}

interface RepoHistory {
  name: string;
  fullName: string;
  language: string | null;
  commits: CommitEntry[];
  stars: number;
  createdAt: string;
}

/**
 * Deep-mines git history to generate career insights.
 * Works with both local repos (via simple-git) and public repos (via API).
 */
export async function excavateGitHistory(
  repos: RepoHistory[]
): Promise<ExcavationResult> {
  const allCommits = repos.flatMap((r) => r.commits);
  const totalCommits = allCommits.length;
  const totalRepos = repos.length;

  // Group commits by year
  const byYear = new Map<number, CommitEntry[]>();
  for (const commit of allCommits) {
    const year = new Date(commit.date).getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(commit);
  }

  // Build language evolution
  const languageEvolution: { year: number; languages: Record<string, number> }[] = [];
  for (const [year, _] of [...byYear.entries()].sort(([a], [b]) => a - b)) {
    const yearRepos = repos.filter((r) => new Date(r.createdAt).getFullYear() <= year);
    const langs: Record<string, number> = {};
    for (const r of yearRepos) {
      if (r.language) {
        langs[r.language] = (langs[r.language] || 0) + 1;
      }
    }
    languageEvolution.push({ year, languages: normalizePct(langs) });
  }

  // Detect code patterns
  const codePatterns = detectPatterns(allCommits);

  // Find peak productivity
  const peakProductivity = findPeakProductivity(allCommits);

  // Generate chapters and narrative
  const chapters = generateChapters(repos, byYear);
  const narrative = generateNarrative(chapters);

  return {
    chapters,
    totalCommits,
    totalRepos,
    languageEvolution,
    peakProductivity,
    codePatterns,
    narrative,
  };
}

function normalizePct(langs: Record<string, number>): Record<string, number> {
  const total = Object.values(langs).reduce((a, b) => a + b, 0);
  if (total === 0) return langs;
  const result: Record<string, number> = {};
  for (const [lang, count] of Object.entries(langs)) {
    result[lang] = Math.round((count / total) * 100);
  }
  return result;
}

function detectPatterns(commits: CommitEntry[]): ExcavationResult["codePatterns"] {
  const patterns: ExcavationResult["codePatterns"] = [];
  const allMessages = commits.map((c) => c.message);

  // Good patterns
  const testCount = allMessages.filter((m) => /test|spec|coverage/i.test(m)).length;
  if (testCount > commits.length * 0.1) {
    patterns.push({ pattern: "Regular test additions", frequency: testCount, type: "good" });
  }

  const docCount = allMessages.filter((m) => /doc|readme|comment/i.test(m)).length;
  if (docCount > 5) {
    patterns.push({ pattern: "Documentation-focused commits", frequency: docCount, type: "good" });
  }

  const refactorCount = allMessages.filter((m) => /refactor|clean|improve|optimize/i.test(m)).length;
  if (refactorCount > 5) {
    patterns.push({ pattern: "Code refactoring and improvement", frequency: refactorCount, type: "good" });
  }

  // Bad patterns
  const largeCount = commits.filter((c) => c.additions > 500).length;
  if (largeCount > commits.length * 0.05) {
    patterns.push({ pattern: "Oversized commits (>500 lines)", frequency: largeCount, type: "bad" });
  }

  const fixCount = allMessages.filter((m) => /fix|bug|hotfix|typo/i.test(m)).length;
  if (fixCount > commits.length * 0.2) {
    patterns.push({ pattern: "Bug fix commits (high ratio)", frequency: fixCount, type: "bad" });
  }

  const vagueCount = allMessages.filter((m) => m.length < 10 || /wip|update|stuff|changes/i.test(m)).length;
  if (vagueCount > commits.length * 0.1) {
    patterns.push({ pattern: "Vague or minimal commit messages", frequency: vagueCount, type: "bad" });
  }

  return patterns;
}

function findPeakProductivity(commits: CommitEntry[]): { period: string; avgCommitsPerWeek: number } {
  if (commits.length === 0) {
    return { period: "N/A", avgCommitsPerWeek: 0 };
  }

  // Group by month
  const byMonth = new Map<string, CommitEntry[]>();
  for (const commit of commits) {
    const month = commit.date.slice(0, 7); // YYYY-MM
    if (!byMonth.has(month)) byMonth.set(month, []);
    byMonth.get(month)!.push(commit);
  }

  let peakMonth = "";
  let maxCommits = 0;

  for (const [month, entries] of byMonth) {
    if (entries.length > maxCommits) {
      maxCommits = entries.length;
      peakMonth = month;
    }
  }

  // Convert to weeks
  const avgPerWeek = Math.round((maxCommits / 4.33) * 10) / 10;

  return {
    period: peakMonth,
    avgCommitsPerWeek: avgPerWeek,
  };
}

function generateChapters(
  repos: RepoHistory[],
  byYear: Map<number, CommitEntry[]>
): CareerChapter[] {
  const chapters: CareerChapter[] = [];
  const sortedYears = [...byYear.entries()].sort(([a], [b]) => a - b);

  for (const [year, commits] of sortedYears) {
    const yearRepos = repos.filter((r) => new Date(r.createdAt).getFullYear() <= year);
    const yearNewRepos = repos.filter((r) => new Date(r.createdAt).getFullYear() === year);
    const langs = new Set(yearRepos.map((r) => r.language).filter(Boolean));

    const highlights: string[] = [];
    if (yearRepos.length > 0) highlights.push(`${yearNewRepos.length} new projects started`);
    if (commits.length > 50) highlights.push(`${commits.length} commits — high productivity year`);
    if (langs.size >= 3) highlights.push(`Explored ${langs.size} programming languages`);
    if (yearRepos.some((r) => r.stars > 10)) highlights.push("Gained community attention on projects");

    const totalStars = yearRepos.reduce((s, r) => s + r.stars, 0);
    const score = Math.min(10, Math.round((yearRepos.length * 2 + Math.log10(totalStars + 1) * 3 + Math.min(commits.length / 20, 5)) * 10) / 10);

    chapters.push({
      title: `Chapter ${chapters.length + 1}: ${getChapterTitle(chapters.length, langs)}`,
      period: String(year),
      narrative: `In ${year}, you worked on ${yearRepos.length} project${yearRepos.length > 1 ? "s" : ""} with ${commits.length} commit${commits.length > 1 ? "s" : ""}. Your primary languages: ${[...langs].join(", ") || "various"}.`,
      highlights,
      score,
    });
  }

  return chapters;
}

function getChapterTitle(index: number, langs: Set<string | null>): string {
  if (index === 0) return "The Beginning";
  if (index === 1) return "Finding Your Stack";
  if (index === 2) return "Going Deeper";
  if (index === 3) return "The Professional";

  const uniqueLangs = [...langs].filter(Boolean);
  if (uniqueLangs.length >= 2) return "Expanding Horizons";
  if (uniqueLangs.length >= 4) return "Polyglot Excellence";
  return "Continued Growth";
}

function generateNarrative(chapters: CareerChapter[]): string {
  if (chapters.length === 0) {
    return "Your developer story is just beginning. Every commit is a new chapter.";
  }

  const parts: string[] = [];

  for (const chapter of chapters) {
    parts.push(chapter.narrative);
    if (chapter.highlights.length > 0) {
      parts.push(`Highlights: ${chapter.highlights.join(", ")}.`);
    }
  }

  // Add trajectory
  const scores = chapters.map((c) => c.score).filter((s) => s !== undefined) as number[];
  if (scores.length >= 2) {
    const first = scores[0];
    const last = scores[scores.length - 1];
    const diff = last - first;
    if (diff > 2) {
      parts.push(`Your trajectory shows strong growth — scoring ${diff > 0 ? "+" : ""}${diff.toFixed(1)} points from your first year to now.`);
    } else if (diff > 0) {
      parts.push("Your trajectory shows steady, consistent improvement.");
    } else {
      parts.push("Your trajectory is stable. Consider taking on more challenging projects to accelerate growth.");
    }
  }

  return parts.join("\n\n");
}
