import type { CareerTimeline, TimelineYear, UserRepo, RepoAnalysisInput } from "../types.js";
import { heuristicAnalyse } from "../heuristicAnalyzer.js";

/**
 * Builds a year-by-year career timeline from all user repos.
 * Groups repos by year of creation, computes language aggregates,
 * average scores, and auto-detects milestones.
 */
export async function buildCareerTimeline(
  repos: UserRepo[],
  readmeFetcher: (owner: string, repo: string) => Promise<string>,
  treeFetcher: (owner: string, repo: string) => Promise<string>
): Promise<CareerTimeline> {
  const byYear = new Map<number, UserRepo[]>();

  for (const repo of repos) {
    const year = new Date(repo.created_at).getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(repo);
  }

  const years: TimelineYear[] = [];
  let totalScoreSum = 0;
  let totalReposCount = 0;

  for (const [yearStr, yearRepos] of [...byYear.entries()].sort(([a], [b]) => a - b)) {
    const allLanguages: Record<string, number> = {};
    let scoreSum = 0;
    let scoredCount = 0;
    const allMilestones = new Set<string>();

    for (const repo of yearRepos) {
      // Aggregate languages
      if (repo.language) {
        allLanguages[repo.language] = (allLanguages[repo.language] || 0) + 1;
      }

      // Compute scores for milestone detection
      try {
        const owner = repo.full_name.split("/")[0];
        const readme = await readmeFetcher(owner, repo.name);
        const tree = await treeFetcher(owner, repo.name);
        const input: RepoAnalysisInput = {
          name: repo.name,
          full_name: repo.full_name,
          description: repo.description,
          language: repo.language,
          topics: [],
          stargazers_count: repo.stargazers_count,
          forks_count: repo.forks_count,
          open_issues_count: repo.open_issues_count,
          size: 0,
          license: null,
          updated_at: repo.updated_at,
          html_url: repo.html_url,
          default_branch: "main",
          visibility: "public",
          owner: { login: repo.full_name.split("/")[0], avatar_url: "" },
        };
        const result = heuristicAnalyse(input, readme, tree);
        scoreSum += result.overallScore;
        scoredCount++;
        totalScoreSum += result.overallScore;
        totalReposCount++;

        // Detect milestones
        if (result.strengths.some((s) => /test/i.test(s))) allMilestones.add("First tests written");
        if (treeLinesHasCI(tree)) allMilestones.add("First CI/CD pipeline");
        if (repo.stargazers_count > 10) allMilestones.add(`First repo gaining traction (${repo.stargazers_count} ⭐)`);
        if (repo.forks_count > 3) allMilestones.add("Community adoption (multiple forks)");
        if (treeLinesHasDocker(tree)) allMilestones.add("Docker adoption");
      } catch {
        // Skip repos that fail analysis
      }
    }

    // Detect language evolution milestones
    const langCount = Object.keys(allLanguages).length;
    if (langCount >= 3) allMilestones.add("Multi-language development");
    if (langCount >= 5) allMilestones.add("Polyglot developer");

    const avgScore = scoredCount > 0 ? Math.round((scoreSum / scoredCount) * 10) / 10 : 0;

    years.push({
      year: yearStr,
      languages: normalizePercentages(allLanguages),
      avgScore,
      repoCount: yearRepos.length,
      milestones: [...allMilestones].slice(0, 5),
    });
  }

  const overallScore = totalReposCount > 0
    ? Math.round((totalScoreSum / totalReposCount) * 10) / 10
    : 0;

  const trajectory = computeTrajectory(years);
  const nextPrediction = predictNextStep(years);

  return { years, trajectory, nextPrediction, overallScore };
}

function treeLinesHasCI(tree: string): boolean {
  return /\.github\/workflows|travis|circleci|jenkins/i.test(tree);
}

function treeLinesHasDocker(tree: string): boolean {
  return /docker/i.test(tree);
}

function normalizePercentages(langs: Record<string, number>): Record<string, number> {
  const total = Object.values(langs).reduce((a, b) => a + b, 0);
  if (total === 0) return langs;
  const result: Record<string, number> = {};
  for (const [lang, count] of Object.entries(langs)) {
    result[lang] = Math.round((count / total) * 100);
  }
  return result;
}

function computeTrajectory(years: TimelineYear[]): CareerTimeline["trajectory"] {
  if (years.length < 2) return "junior";
  const recent = years.slice(-3);
  const avgRecent = recent.reduce((s, y) => s + y.avgScore, 0) / recent.length;
  const avgOlder = years.slice(0, -3).reduce((s, y) => s + y.avgScore, 0) / Math.max(1, years.length - 3);
  if (avgRecent >= 8 && years.length >= 4) return "staff";
  if (avgRecent >= 7) return "senior";
  if (avgRecent >= 5 || avgOlder >= 4) return "mid";
  return "junior";
}

function predictNextStep(years: TimelineYear[]): string {
  if (years.length === 0) return "Start building your first project";
  const latest = years[years.length - 1];
  const langs = Object.keys(latest.languages);

  if (latest.avgScore < 5) {
    return "Focus on code quality fundamentals: add tests, documentation, and CI/CD";
  }
  if (latest.avgScore < 7) {
    return "Level up by contributing to open source and adding automated testing";
  }
  if (langs.length < 3) {
    return `Expand your stack: learn a new language or framework to complement ${langs[0] || "your primary language"}`;
  }
  if (latest.repoCount < 5) {
    return "Build more projects to demonstrate breadth and depth";
  }
  return "You're on a strong trajectory. Consider distributed systems or architectural work next";
}
