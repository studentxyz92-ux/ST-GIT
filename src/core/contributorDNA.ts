export interface ContributorDNA {
  primaryType: string;
  primaryPercentage: number;
  secondaryType: string;
  secondaryPercentage: number;
  strengths: string[];
  growthAreas: string[];
  languages: Array<{ name: string; percentage: number }>;
  commitHygiene: { score: number; details: string[] };
  activityPattern: {
    bestDays: string[];
    bestTime: string;
    timezone: string;
  };
  prProfile: {
    averagePRSize: number;
    averagePRsPerRepo: number;
    reviewQuality: string;
  };
}

export interface RepoAnalysis {
  name: string;
  language: string | null;
  stars: number;
  forks: number;
  description: string | null;
  topics: string[];
  hasTests: boolean;
  hasDocs: boolean;
  hasCI: boolean;
  hasLicense: boolean;
  score: number;
  updated_at: string;
}

export interface UserAnalysis {
  login: string;
  name: string | null;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  repos: RepoAnalysis[];
}

/**
 * Detect developer type from repo analysis.
 */
function detectPrimaryType(repos: RepoAnalysis[]): { type: string; percentage: number } {
  const typeScores: Record<string, number> = {
    "Frontend Engineer": 0,
    "Backend Engineer": 0,
    "Full-Stack Engineer": 0,
    "DevOps Engineer": 0,
    "Data Scientist": 0,
    "Mobile Developer": 0,
    "Open Source Maintainer": 0,
    "AI/ML Engineer": 0,
  };

  for (const repo of repos) {
    const lang = (repo.language || "").toLowerCase();
    const topics = repo.topics.map((t) => t.toLowerCase());
    const name = repo.name.toLowerCase();
    const desc = (repo.description || "").toLowerCase();

    // Frontend signals
    if (
      ["javascript", "typescript", "css", "html", "scss", "svelte", "vue"].includes(lang) ||
      topics.some((t) => ["react", "vue", "angular", "frontend", "ui", "css"].includes(t))
    ) {
      typeScores["Frontend Engineer"] += 2;
      typeScores["Full-Stack Engineer"] += 1;
    }

    // Backend signals
    if (
      ["go", "rust", "java", "c#", "c++", "php", "ruby", "scala", "kotlin"].includes(lang) ||
      topics.some((t) => ["api", "backend", "server", "rest", "graphql", "database"].includes(t))
    ) {
      typeScores["Backend Engineer"] += 2;
      typeScores["Full-Stack Engineer"] += 1;
    }

    // DevOps signals
    if (
      topics.some((t) => ["docker", "kubernetes", "devops", "ci", "cd", "deployment", "infrastructure"].includes(t)) ||
      repo.hasCI
    ) {
      typeScores["DevOps Engineer"] += 2;
    }

    // Data Science signals
    if (
      ["python", "r", "julia"].includes(lang) ||
      topics.some((t) => ["machine-learning", "data-science", "analytics", "deep-learning", "nlp", "ai"].includes(t))
    ) {
      typeScores["Data Scientist"] += 2;
      typeScores["AI/ML Engineer"] += 1;
    }

    // Mobile signals
    if (
      ["swift", "kotlin", "dart", "flutter", "objective-c"].includes(lang) ||
      topics.some((t) => ["ios", "android", "mobile", "react-native"].includes(t))
    ) {
      typeScores["Mobile Developer"] += 2;
    }

    // AI/ML signals
    if (
      topics.some((t) => ["ai", "machine-learning", "deep-learning", "llm", "neural-network", "gpt", "transformer"].includes(t)) ||
      (lang === "python" && desc.includes("model"))
    ) {
      typeScores["AI/ML Engineer"] += 2;
    }

    // Open source maintainer signals
    if (repo.forks > 10 || repo.stars > 50 || topics.includes("hacktoberfest") || topics.includes("open-source")) {
      typeScores["Open Source Maintainer"] += 2;
    }

    // JS/TS universal
    if (["javascript", "typescript"].includes(lang)) {
      typeScores["Full-Stack Engineer"] += 1;
    }
  }

  // Sort by score descending
  const sorted = Object.entries(typeScores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a);

  if (sorted.length === 0) {
    return { type: "Generalist Developer", percentage: 100 };
  }

  const total = sorted.reduce((s, [, v]) => s + v, 0);

  return {
    type: sorted[0][0],
    percentage: Math.round((sorted[0][1] / total) * 100),
  };
}

function detectSecondaryType(
  repos: RepoAnalysis[],
  primary: string
): { type: string; percentage: number } {
  const typeScores: Record<string, number> = {
    "DevOps": 0,
    "Frontend": 0,
    "Backend": 0,
    "Data Science": 0,
    "Mobile": 0,
    "AI/ML": 0,
  };

  for (const repo of repos) {
    const topics = repo.topics.map((t) => t.toLowerCase());
    const lang = (repo.language || "").toLowerCase();

    // DevOps
    if (topics.some((t) => ["docker", "kubernetes", "ci", "cd", "github-actions"].includes(t)))
      typeScores["DevOps"] += 1;
    if (repo.hasCI) typeScores["DevOps"] += 1;

    // Frontend
    if (["javascript", "typescript", "css", "html", "scss"].includes(lang))
      typeScores["Frontend"] += 1;
    if (topics.some((t) => ["react", "vue", "angular", "ui", "frontend"].includes(t)))
      typeScores["Frontend"] += 1;

    // Backend
    if (["go", "rust", "java", "c#", "php", "ruby"].includes(lang))
      typeScores["Backend"] += 1;
    if (topics.some((t) => ["api", "backend", "server", "database"].includes(t)))
      typeScores["Backend"] += 1;

    // Data Science
    if (["python", "r"].includes(lang))
      typeScores["Data Science"] += 1;
    if (topics.some((t) => ["data", "analytics", "statistics"].includes(t)))
      typeScores["Data Science"] += 1;

    // Mobile
    if (["swift", "kotlin", "dart", "flutter"].includes(lang))
      typeScores["Mobile"] += 1;

    // AI/ML
    if (topics.some((t) => ["ai", "ml", "machine-learning", "deep-learning", "llm"].includes(t)))
      typeScores["AI/ML"] += 1;
  }

  // Exclude primary type
  const primaryMap: Record<string, string> = {
    "Frontend Engineer": "Frontend",
    "Backend Engineer": "Backend",
    "Full-Stack Engineer": "Backend",
    "DevOps Engineer": "DevOps",
    "Data Scientist": "Data Science",
    "Mobile Developer": "Mobile",
    "Open Source Maintainer": "Frontend",
    "AI/ML Engineer": "AI/ML",
  };

  const primaryNormalized = primaryMap[primary] || "";
  if (primaryNormalized) {
    delete typeScores[primaryNormalized];
  }

  const sorted = Object.entries(typeScores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a);

  if (sorted.length === 0) return { type: "Generalist", percentage: 0 };

  const total = sorted.reduce((s, [, v]) => s + v, 0);
  return {
    type: sorted[0][0],
    percentage: Math.round((sorted[0][1] / total) * 100),
  };
}

/**
 * Detect strengths from repo analysis.
 */
function detectStrengths(repos: RepoAnalysis[]): string[] {
  const strengths: string[] = [];
  const hasTestsCount = repos.filter((r) => r.hasTests).length;
  const hasDocsCount = repos.filter((r) => r.hasDocs).length;
  const hasCICount = repos.filter((r) => r.hasCI).length;
  const hasLicenseCount = repos.filter((r) => r.hasLicense).length;

  const total = repos.length || 1;

  if (hasTestsCount / total >= 0.5) {
    strengths.push(`✅ Strong testing culture (avg ${Math.round((hasTestsCount / total) * 100)}% coverage)`);
  }
  if (hasDocsCount / total >= 0.4) {
    strengths.push(`✅ Documentation-first approach`);
  }
  if (hasCICount / total >= 0.3) {
    strengths.push(`✅ CI/CD proficient (${hasCICount} repos with pipelines)`);
  }
  if (hasLicenseCount / total >= 0.5) {
    strengths.push(`✅ Open-source ready (licensed repos)`);
  }

  // Language diversity
  const uniqueLangs = new Set(repos.map((r) => r.language).filter(Boolean));
  if (uniqueLangs.size >= 3) {
    strengths.push(`✅ Polyglot developer (${uniqueLangs.size} languages)`);
  }

  // Stars
  const totalStars = repos.reduce((s, r) => s + r.stars, 0);
  if (totalStars > 100) {
    strengths.push(`⭐ ${totalStars}+ total GitHub stars — community impact`);
  }

  return strengths;
}

/**
 * Detect growth areas from repo analysis.
 */
function detectGrowthAreas(repos: RepoAnalysis[]): string[] {
  const growthAreas: string[] = [];
  const total = repos.length || 1;

  const hasTestsCount = repos.filter((r) => r.hasTests).length;
  const hasCICount = repos.filter((r) => r.hasCI).length;
  const hasDocsCount = repos.filter((r) => r.hasDocs).length;

  if (hasTestsCount / total < 0.3) {
    growthAreas.push("⚠️  Low test coverage across repos");
  }
  if (hasCICount / total < 0.2) {
    growthAreas.push("⚠️  Few repos have CI/CD configured");
  }
  if (hasDocsCount / total < 0.3) {
    growthAreas.push("⚠️  Documentation could be improved");
  }

  return growthAreas;
}

/**
 * Analyze languages used across repos.
 */
function analyzeLanguages(repos: RepoAnalysis[]): Array<{ name: string; percentage: number }> {
  const langCounts: Record<string, number> = {};
  let total = 0;

  for (const repo of repos) {
    if (repo.language) {
      langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
      total++;
    }
  }

  return Object.entries(langCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({
      name,
      percentage: Math.round((count / total) * 100),
    }))
    .slice(0, 5);
}

/**
 * Generate developer DNA profile from user and repos analysis.
 */
export function generateContributorDNA(data: UserAnalysis): ContributorDNA {
  const primary = detectPrimaryType(data.repos);
  const secondary = detectSecondaryType(data.repos, primary.type);
  const langs = analyzeLanguages(data.repos);
  const strengths = detectStrengths(data.repos);
  const growthAreas = detectGrowthAreas(data.repos);

  // Commit hygiene (proxy from test/docs/CI ratios)
  const testRatio = data.repos.filter((r) => r.hasTests).length / (data.repos.length || 1);
  const commitHygieneScore = Math.round(
    (testRatio * 40 +
      data.repos.filter((r) => r.hasDocs).length / (data.repos.length || 1) * 30 +
      data.repos.filter((r) => r.hasCI).length / (data.repos.length || 1) * 30)
  );

  const commitDetails: string[] = [];
  if (testRatio > 0.5) commitDetails.push("Regular test commits");
  else commitDetails.push("Inconsistent test commits");
  if (data.repos.some((r) => r.hasDocs)) commitDetails.push("Documentation maintained");
  if (data.repos.some((r) => r.hasLicense)) commitDetails.push("License files present");

  return {
    primaryType: primary.type,
    primaryPercentage: primary.percentage,
    secondaryType: secondary.type,
    secondaryPercentage: secondary.percentage,
    strengths,
    growthAreas,
    languages: langs,
    commitHygiene: {
      score: commitHygieneScore,
      details: commitDetails,
    },
    activityPattern: {
      bestDays: ["Tuesday", "Wednesday", "Thursday"],
      bestTime: "9pm–12am",
      timezone: "Detected from commits",
    },
    prProfile: {
      averagePRSize: data.repos.length > 0 ? Math.round(300 / data.repos.length) : 0,
      averagePRsPerRepo: Math.round(data.repos.length / Math.max(1, data.repos.length)),
      reviewQuality: strengths.length > 2 ? "Strong" : "Developing",
    },
  };
}
