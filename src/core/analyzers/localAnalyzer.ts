import type { LocalRepoMetrics } from "../types.js";
import { execSync } from "child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

interface LocalAnalysisResult {
  overall: number;
  fileCount: number;
  totalBytes: number;
  languageBytes: Record<string, number>;
  languages: Array<{ name: string; percentage: number }>;
  testRatio: number;
  hasCICD: boolean;
  hasLicense: boolean;
  commitCount: number;
  authorCount: number;
  avgCommitSize: number;
  lastCommitDaysAgo: number;
  readmeLength: number;
}

/**
 * Analyze a local git repository path (full pipeline).
 * Extracts git metrics + file metrics from the local filesystem.
 * NEVER sends code content to any server.
 */
export async function localAnalyze(
  repoPath: string,
  options?: { deep?: boolean; privateMode?: boolean; since?: number }
): Promise<LocalAnalysisResult> {
  const gitData = extractGitMetrics(repoPath, options?.since);
  const fileData = extractFileMetrics(repoPath);
  const testData = detectTestFiles(repoPath);
  const ciData = detectCIConfig(repoPath);
  const readmeData = extractReadme(repoPath);

  const totalBytes = Object.values(fileData.byLanguage).reduce((a, b) => a + b, 0);

  // Compute score
  let score = 50;
  if (fileData.total > 10) score += 5;
  if (fileData.total > 50) score += 5;
  if (testData.ratio > 0.1) score += 8;
  if (testData.ratio > 0.3) score += 7;
  if (ciData.detected) score += 10;
  if (readmeData.length > 200) score += 5;
  if (readmeData.length > 500) score += 5;
  if (gitData.commitCount > 50) score += 5;
  if (gitData.authorCount > 1) score += 5;
  if (readmeData.detectedLicense) score += 5;
  if (gitData.lastCommitDaysAgo < 7) score += 5;
  if (gitData.lastCommitDaysAgo < 30) score += 3;
  score = Math.min(100, Math.max(0, score));

  const languages: Array<{ name: string; percentage: number }> = [];
  const langEntries = Object.entries(fileData.byLanguage);
  const total = langEntries.reduce((s, [, v]) => s + v, 0);
  for (const [name, bytes] of langEntries) {
    languages.push({ name, percentage: total > 0 ? Math.round((bytes / total) * 100) : 0 });
  }
  languages.sort((a, b) => b.percentage - a.percentage);

  return {
    overall: score,
    fileCount: fileData.total,
    totalBytes,
    languageBytes: fileData.byLanguage,
    languages: languages.slice(0, 8),
    testRatio: testData.ratio,
    hasCICD: ciData.detected,
    hasLicense: readmeData.detectedLicense,
    commitCount: gitData.commitCount,
    authorCount: gitData.authorCount,
    avgCommitSize: gitData.avgCommitSize,
    lastCommitDaysAgo: gitData.lastCommitDaysAgo,
    readmeLength: readmeData.length,
  };
}

function extractGitMetrics(repoPath: string, sinceYear?: number) {
  let commitCount = 0;
  let authorCount = 0;
  let avgCommitSize = 0;
  let lastCommitDaysAgo = 999;

  try {
    const logOutput = execSync(
      `git log --oneline --format="%H|%ai|%an" --shortstat ${sinceYear ? `--since="${sinceYear}-01-01"` : ""} 2>/dev/null | head -200`,
      { cwd: repoPath, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );

    const lines = logOutput.split("\n").filter(Boolean);
    const authors = new Set<string>();
    let totalChanges = 0;
    let changeCount = 0;
    let lastDate: Date | null = null;

    for (const line of lines) {
      if (line.includes("|")) {
        const parts = line.split("|");
        if (parts.length >= 3) {
          if (parts[1]) {
            const d = new Date(parts[1]);
            if (!lastDate || d > lastDate) lastDate = d;
          }
          if (parts[2]) authors.add(parts[2].trim());
          commitCount++;
        }
      } else if (line.includes("insertions") || line.includes("deletions")) {
        const ins = parseInt(line.match(/(\d+) insertion/)?.[1] || "0", 10);
        const del = parseInt(line.match(/(\d+) deletion/)?.[1] || "0", 10);
        totalChanges += ins + del;
        changeCount++;
      }
    }

    authorCount = authors.size;
    avgCommitSize = changeCount > 0 ? Math.round(totalChanges / changeCount) : 0;
    if (lastDate) {
      lastCommitDaysAgo = Math.round((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  } catch {}

  return { commitCount, authorCount, avgCommitSize, lastCommitDaysAgo };
}

function extractFileMetrics(repoPath: string) {
  const byLanguage: Record<string, number> = {};
  let total = 0;

  const EXT_TO_LANG: Record<string, string> = {
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".py": "Python",
    ".go": "Go",
    ".rs": "Rust",
    ".java": "Java",
    ".rb": "Ruby",
    ".php": "PHP",
    ".swift": "Swift",
    ".kt": "Kotlin",
    ".scala": "Scala",
    ".ex": "Elixir",
    ".exs": "Elixir",
    ".css": "CSS",
    ".scss": "SCSS",
    ".html": "HTML",
    ".sql": "SQL",
    ".sh": "Shell",
    ".yaml": "YAML",
    ".yml": "YAML",
    ".json": "JSON",
    ".md": "Markdown",
    ".c": "C",
    ".h": "C/C++",
    ".cpp": "C++",
    ".cs": "C#",
    ".dart": "Dart",
  };

  function walk(dir: string) {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (entry.startsWith(".") || entry === "node_modules" || entry === "dist" || entry === "build") continue;
        const fullPath = join(dir, entry);
        try {
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            walk(fullPath);
          } else if (stat.isFile()) {
            const ext = extname(entry).toLowerCase();
            const lang = EXT_TO_LANG[ext];
            if (lang) {
              byLanguage[lang] = (byLanguage[lang] || 0) + stat.size;
            }
            total++;
          }
        } catch {}
      }
    } catch {}
  }

  walk(repoPath);
  return { byLanguage, total };
}

function detectTestFiles(repoPath: string) {
  let testFiles = 0;
  let total = 0;

  function walk(dir: string) {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (entry.startsWith(".") || entry === "node_modules" || entry === "dist" || entry === "build") continue;
        const fullPath = join(dir, entry);
        try {
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            walk(fullPath);
          } else if (stat.isFile()) {
            total++;
            if (/^(.*\.(test|spec)\.|__tests__)/.test(entry) || entry.includes(".test.") || entry.includes(".spec.")) {
              testFiles++;
            }
          }
        } catch {}
      }
    } catch {}
  }

  walk(repoPath);
  return { ratio: total > 0 ? testFiles / total : 0 };
}

function detectCIConfig(repoPath: string) {
  const ciFiles = [".github/workflows", ".travis.yml", ".circleci/config.yml", "Jenkinsfile", ".gitlab-ci.yml"];
  const detected = ciFiles.some((f) => existsSync(join(repoPath, f)));
  return { detected };
}

function extractReadme(repoPath: string) {
  const readmeNames = ["README.md", "README", "Readme.md", "readme.md"];
  for (const name of readmeNames) {
    const fullPath = join(repoPath, name);
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, "utf8");
        const hasLicense = content.toLowerCase().includes("license") || content.toLowerCase().includes("mit");
        return { length: content.length, detectedLicense: hasLicense };
      } catch {
        return { length: 0, detectedLicense: false };
      }
    }
  }
  return { length: 0, detectedLicense: false };
}

/**
 * Analyzes a local repository purely on the filesystem.
 * NEVER sends code content to any server — only derived metrics.
 * This enables private repo analysis with zero data exposure.
 */
export function analyseLocalRepo(metrics: LocalRepoMetrics): LocalAnalysisResult {
  const result = localAnalyzeSync(metrics);
  return result as any;
}

function localAnalyzeSync(metrics: LocalRepoMetrics): Partial<LocalAnalysisResult> & { overallScore: number; hiringReadiness: string; hiringReadinessClass: string; subScores: any[]; issues: any[]; suggestions: any[]; strengths: string[]; stats: any[]; summary: string } {
  // ── Score computation ──────────────────────────────────
  let structureScore = 0;
  if (metrics.fileCount > 10) structureScore += 2;
  if (metrics.fileCount > 50) structureScore += 2;
  if (metrics.fileCount > 100) structureScore += 1;
  if (metrics.authorCount > 1) structureScore += 2;
  if (metrics.hasCICD) structureScore += 2;
  if (metrics.hasLicense) structureScore += 1;
  structureScore = Math.min(10, structureScore);

  let testScore = 0;
  if (metrics.testRatio > 0.1) testScore += 3;
  if (metrics.testRatio > 0.3) testScore += 3;
  if (metrics.testRatio > 0.5) testScore += 4;
  else if (metrics.testRatio > 0) testScore += 2;
  testScore = Math.min(10, testScore);

  let qualityScore = 5;
  if (metrics.avgCommitSize < 50) qualityScore += 2;
  if (metrics.avgCommitSize < 100) qualityScore += 1;
  if (metrics.hasCICD) qualityScore += 1;
  if (metrics.hasLicense) qualityScore += 1;
  qualityScore = Math.min(10, qualityScore);

  let activityScore = 10;
  if (metrics.lastCommitDaysAgo > 7) activityScore -= 1;
  if (metrics.lastCommitDaysAgo > 30) activityScore -= 2;
  if (metrics.lastCommitDaysAgo > 90) activityScore -= 3;
  if (metrics.lastCommitDaysAgo > 180) activityScore -= 2;
  activityScore = Math.max(2, activityScore);

  let readmeScore = 0;
  if (metrics.readmeLength > 50) readmeScore += 2;
  if (metrics.readmeLength > 300) readmeScore += 2;
  if (metrics.readmeLength > 1000) readmeScore += 3;
  if (metrics.readmeLength > 2000) readmeScore += 3;
  readmeScore = Math.min(10, readmeScore);

  const overall =
    readmeScore * 0.2 +
    structureScore * 0.25 +
    testScore * 0.25 +
    qualityScore * 0.2 +
    activityScore * 0.1;
  const overallScore = Math.round(overall * 10) / 10;

  // ── Hiring readiness ───────────────────────────────────
  let hiringReadiness: string;
  let hiringReadinessClass: string;
  if (overallScore >= 8) { hiringReadiness = "Great Fit"; hiringReadinessClass = "great"; }
  else if (overallScore >= 6) { hiringReadiness = "Good Candidate"; hiringReadinessClass = "good"; }
  else if (overallScore >= 4) { hiringReadiness = "Needs Work"; hiringReadinessClass = "average"; }
  else { hiringReadiness = "Not Ready"; hiringReadinessClass = "poor"; }

  // ── Issues ─────────────────────────────────────────────
  const issues: Array<{ severity: string; title: string; description: string }> = [];
  if (metrics.readmeLength < 100)
    issues.push({ severity: "critical", title: "Missing or minimal README", description: "Your README is nearly empty. Add installation steps, usage examples, and project description." });
  if (metrics.testRatio < 0.05)
    issues.push({ severity: "critical", title: "No test files found", description: "Tests are essential for production-grade projects." });
  else if (metrics.testRatio < 0.2)
    issues.push({ severity: "warning", title: "Low test coverage", description: `Only ${Math.round(metrics.testRatio * 100)}% of files have tests. Aim for 40%+.` });
  if (!metrics.hasLicense)
    issues.push({ severity: "warning", title: "No license file", description: "Without a license, others cannot legally use or contribute to your code." });
  if (!metrics.hasCICD)
    issues.push({ severity: "info", title: "No CI/CD pipeline", description: "CI/CD shows professional engineering practices." });
  if (metrics.lastCommitDaysAgo > 90)
    issues.push({ severity: "info", title: "Repository not updated recently", description: `Last commit was ${metrics.lastCommitDaysAgo} days ago.` });
  if (metrics.avgCommitSize > 200)
    issues.push({ severity: "warning", title: "Large commit sizes", description: "Average commit is very large. Prefer smaller, focused commits." });

  // ── Suggestions ────────────────────────────────────────
  const suggestions: Array<{ title: string; detail: string }> = [
    { title: "Improve documentation", detail: "Add a comprehensive README with installation, usage, and examples." },
    { title: "Add tests", detail: metrics.testRatio < 0.3 ? "Add test files for core functionality. Aim for 40%+ coverage." : "Great that you have tests! Consider adding integration tests." },
    { title: "Set up CI/CD", detail: "Add GitHub Actions or similar to run tests automatically." },
    { title: "Add a LICENSE", detail: "Choose an open-source license (MIT, Apache 2.0) to enable contributions." },
    { title: "Write smaller commits", detail: metrics.avgCommitSize > 100 ? "Aim for focused commits under 100 lines each." : "Your commit sizes look good." },
  ];

  // ── Strengths ──────────────────────────────────────────
  const strengths: string[] = [];
  if (metrics.commitCount > 50) strengths.push(`📊 ${metrics.commitCount} commits — substantial commit history`);
  if (metrics.authorCount > 1) strengths.push(`👥 ${metrics.authorCount} contributors — collaborative development`);
  if (metrics.hasCICD) strengths.push("⚙️ CI/CD configured — professional workflow");
  if (metrics.hasLicense) strengths.push("📄 License present — open-source ready");
  if (metrics.testRatio > 0.3) strengths.push("🧪 Good test coverage — quality-conscious development");
  if (metrics.fileCount > 50) strengths.push("📁 Substantial codebase");
  if (metrics.avgCommitSize < 50) strengths.push("🎯 Clean, focused commits");

  // ── Stats ──────────────────────────────────────────────
  const stats = [
    { label: "Files", value: String(metrics.fileCount) },
    { label: "Commits", value: String(metrics.commitCount) },
    { label: "Contributors", value: String(metrics.authorCount) },
    { label: "Test Ratio", value: `${Math.round(metrics.testRatio * 100)}%` },
    { label: "Avg Commit Size", value: `${Math.round(metrics.avgCommitSize)} lines` },
    { label: "Last Commit", value: `${metrics.lastCommitDaysAgo}d ago` },
  ];

  return {
    overallScore,
    hiringReadiness,
    hiringReadinessClass,
    summary: `Local repository with ${metrics.fileCount} files, ${metrics.commitCount} commits, and ${Math.round(metrics.testRatio * 100)}% test ratio. ${overallScore >= 7 ? "Looks professional and well-maintained." : overallScore >= 5 ? "Has good foundations but room for improvement." : "Needs significant work to be portfolio-ready."}`,
    subScores: [
      { name: "README", score: readmeScore, icon: "📄", color: readmeScore >= 7 ? "green" : readmeScore >= 4 ? "amber" : "red" },
      { name: "Structure", score: structureScore, icon: "🏗️", color: structureScore >= 7 ? "green" : structureScore >= 4 ? "amber" : "red" },
      { name: "Tests", score: testScore, icon: "🧪", color: testScore >= 7 ? "green" : testScore >= 4 ? "amber" : "red" },
      { name: "Code Quality", score: qualityScore, icon: "⚡", color: qualityScore >= 7 ? "green" : qualityScore >= 4 ? "amber" : "red" },
      { name: "Activity", score: activityScore, icon: "📈", color: activityScore >= 7 ? "green" : activityScore >= 4 ? "amber" : "red" },
    ],
    issues,
    suggestions,
    strengths,
    stats,
  };
}
