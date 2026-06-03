import type { AnalysisResult } from "./types";

export interface RepoAnalysisInput {
  name: string;
  full_name?: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  size: number;
  license: { name: string } | null;
  updated_at: string;
  html_url?: string;
  default_branch?: string;
  visibility?: string;
  owner?: { login: string; avatar_url: string };
}

/**
 * Heuristic analyser — produces a repo score without an AI API key.
 * Scores the repo across 5 dimensions and returns a full AnalysisResult.
 */
export function heuristicAnalyse(
  repoInfo: RepoAnalysisInput,
  readme: string,
  tree: string
): AnalysisResult {
  const treeLines = tree.split("\n").filter(Boolean);

  // ── README score (0-10) ─────────────────────────────────
  let readmeScore = 0;
  if (readme.length > 50) readmeScore += 2;
  if (readme.length > 300) readmeScore += 2;
  if (readme.length > 1000) readmeScore += 2;
  if (/##\s*(installation|getting started|usage)/i.test(readme)) readmeScore += 2;
  if (/!\[.*\]\(.*\)/i.test(readme)) readmeScore += 1;
  if (/badge/i.test(readme)) readmeScore += 1;
  readmeScore = Math.min(10, readmeScore);

  // ── Structure score (0-10) ──────────────────────────────
  let structureScore = 0;
  if (treeLines.length > 5) structureScore += 2;
  if (treeLines.some((l) => /^src\//i.test(l))) structureScore += 2;
  if (treeLines.some((l) => /test|spec|__tests__/i.test(l))) structureScore += 2;
  if (treeLines.some((l) => /\.github|\.gitignore|\.env\.example/i.test(l))) structureScore += 1;
  if (treeLines.some((l) => /docker|ci\.yml|\.yml/i.test(l))) structureScore += 1;
  if (repoInfo.description) structureScore += 1;
  if (repoInfo.topics.length > 0) structureScore += 1;
  structureScore = Math.min(10, structureScore);

  // ── Test score (0-10) ───────────────────────────────────
  const hasTests = treeLines.some((l) => /test|spec|__tests__/i.test(l));
  const testScore = hasTests ? 7 : 2;

  // ── Code quality score (0-10) ───────────────────────────
  const hasLicense = !!repoInfo.license;
  const hasCi = treeLines.some((l) => /\.github\/workflows|travis|circleci/i.test(l));
  let codeQualityScore = 5;
  if (hasLicense) codeQualityScore += 1;
  if (hasCi) codeQualityScore += 2;
  if (repoInfo.stargazers_count > 0) codeQualityScore += 1;
  if (repoInfo.forks_count > 0) codeQualityScore += 1;
  codeQualityScore = Math.min(10, codeQualityScore);

  // ── Activity score (0-10) ───────────────────────────────
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(repoInfo.updated_at).getTime()) / 86400000
  );
  let activityScore = 10;
  if (daysSinceUpdate > 30) activityScore -= 2;
  if (daysSinceUpdate > 90) activityScore -= 2;
  if (daysSinceUpdate > 180) activityScore -= 2;
  activityScore = Math.max(2, activityScore);

  // ── Overall score ───────────────────────────────────────
  const overall =
    readmeScore * 0.25 +
    structureScore * 0.25 +
    testScore * 0.2 +
    codeQualityScore * 0.2 +
    activityScore * 0.1;
  const overallScore = Math.round(overall * 10) / 10;

  // ── Hiring readiness ────────────────────────────────────
  let hiringReadiness: AnalysisResult["hiringReadiness"];
  let hiringReadinessClass: AnalysisResult["hiringReadinessClass"];
  if (overallScore >= 8) { hiringReadiness = "Great Fit"; hiringReadinessClass = "great"; }
  else if (overallScore >= 6) { hiringReadiness = "Good Candidate"; hiringReadinessClass = "good"; }
  else if (overallScore >= 4) { hiringReadiness = "Needs Work"; hiringReadinessClass = "average"; }
  else { hiringReadiness = "Not Ready"; hiringReadinessClass = "poor"; }

  // ── Issues ──────────────────────────────────────────────
  const issues: AnalysisResult["issues"] = [];
  if (readme.length < 100)
    issues.push({ severity: "critical", title: "Missing or minimal README", description: "Your README is almost empty. Companies and contributors rely on it to understand your project." });
  else if (readme.length < 500)
    issues.push({ severity: "warning", title: "README is too short", description: "The README exists but lacks installation steps, usage examples, and screenshots." });
  if (!hasTests)
    issues.push({ severity: "critical", title: "No test files found", description: "There are no test files in this repository. Tests are mandatory for production-grade projects." });
  if (!hasLicense)
    issues.push({ severity: "warning", title: "No license file", description: "Without a license, others legally cannot use or contribute to your code." });
  if (!hasCi)
    issues.push({ severity: "info", title: "No CI/CD pipeline", description: "Adding GitHub Actions or similar CI/CD shows professional engineering practices." });
  if (!repoInfo.description)
    issues.push({ severity: "warning", title: "Missing repository description", description: "Add a short description on GitHub so recruiters can find and understand your project." });
  if (repoInfo.topics.length === 0)
    issues.push({ severity: "info", title: "No repository topics/tags", description: "Add relevant topics to improve discoverability and SEO on GitHub." });
  if (daysSinceUpdate > 90)
    issues.push({ severity: "info", title: "Repository not updated recently", description: `Last update was ${daysSinceUpdate} days ago. Keep your projects active.` });

  // ── Suggestions ─────────────────────────────────────────
  const suggestions: AnalysisResult["suggestions"] = [
    { title: "Write a professional README", detail: "Include sections: Overview, Features, Tech Stack, Installation, Usage, Screenshots, Contributing, and License." },
    { title: "Add comprehensive tests", detail: "Aim for 70%+ test coverage using Jest, Pytest, or the appropriate framework for your language." },
    { title: "Set up GitHub Actions", detail: "Add a CI workflow that runs tests on every push. Include a status badge in your README." },
    { title: "Add a LICENSE file", detail: "Use MIT for open-source or Apache 2.0 for business-friendly projects." },
    { title: "Tag your repository with topics", detail: "Add 5-10 relevant topics so your repo appears in GitHub searches and collections." },
    { title: "Add a live demo link", detail: "Deploy your project (Vercel, Netlify, Railway) and link to the live demo in your README and repo URL." },
    { title: "Improve folder structure", detail: "Use a src/ directory, separate modules by responsibility, and add a clear entry point." },
    { title: "Add API documentation", detail: "If you have an API, document it with Swagger/OpenAPI or a Postman collection." },
  ];

  // ── README suggestion ───────────────────────────────────
  const readmeSuggestion = `# ${repoInfo.name}\n\n> ${repoInfo.description || "A short, punchy description of your project."}\n\n${repoInfo.language ? `![Language](https://img.shields.io/badge/language-${repoInfo.language}-blue)` : ""}\n![License](https://img.shields.io/github/license/owner/${repoInfo.name})\n![Stars](https://img.shields.io/github/stars/owner/${repoInfo.name})\n\n## 🚀 Features\n\n- ✅ Feature one\n- ✅ Feature two\n- ✅ Feature three\n\n## 🛠 Tech Stack\n\n- **Frontend:** ...\n- **Backend:** ...\n- **Database:** ...\n\n## 📦 Installation\n\n\`\`\`bash\ngit clone https://github.com/your-username/${repoInfo.name}\ncd ${repoInfo.name}\nnpm install\nnpm run dev\n\`\`\`\n\n## 📸 Screenshots\n\n<!-- Add screenshots here -->\n\n## 🤝 Contributing\n\nPull requests are welcome. For major changes, please open an issue first.\n\n## 📄 License\n\n[MIT](LICENSE)`;

  // ── Resume tips ─────────────────────────────────────────
  const resumeTips: AnalysisResult["resumeTips"] = [
    {
      icon: "💼",
      title: "Bullet for resume",
      text: `Built ${repoInfo.name} — a ${repoInfo.language || "full-stack"} project with ${repoInfo.stargazers_count} GitHub stars. Describe the problem it solves and the results it achieved.`,
    },
    {
      icon: "🔗",
      title: "Portfolio URL",
      text: "Deploy your project and include a live link. Recruiters spend < 60 seconds per candidate — a working demo is worth 10 code explanations.",
    },
    {
      icon: "📊",
      title: "Quantify your impact",
      text: `Add metrics: "Reduced load time by 40%", "Handles 1000+ requests/sec", "Used by X users". Numbers stand out in resumes.`,
    },
    {
      icon: "🏷️",
      title: "Tag with keywords",
      text: `Add topics like "${repoInfo.language || "javascript"}", "open-source", and domain keywords. Recruiters search GitHub by topic.`,
    },
  ];

  // ── Strengths ───────────────────────────────────────────
  const strengths: string[] = [];
  if (repoInfo.stargazers_count > 0)
    strengths.push(`⭐ ${repoInfo.stargazers_count} GitHub star${repoInfo.stargazers_count > 1 ? "s" : ""} — community recognises this project`);
  if (repoInfo.forks_count > 0)
    strengths.push(`🍴 ${repoInfo.forks_count} fork${repoInfo.forks_count > 1 ? "s" : ""} — others are building on your work`);
  if (hasTests) strengths.push("✅ Test files present — good engineering habit");
  if (hasLicense) strengths.push("📄 License file present — open-source ready");
  if (hasCi) strengths.push("⚙️ CI/CD pipeline configured — professional workflow");
  if (repoInfo.language) strengths.push(`💻 Primary language detected: ${repoInfo.language}`);
  if (treeLines.length > 20) strengths.push("📁 Well-developed file structure");

  // ── Stats ───────────────────────────────────────────────
  const stats = [
    { label: "Stars", value: String(repoInfo.stargazers_count) },
    { label: "Forks", value: String(repoInfo.forks_count) },
    { label: "Open Issues", value: String(repoInfo.open_issues_count) },
    { label: "Repo Size", value: `${Math.round(repoInfo.size / 1024 * 10) / 10} MB` },
    { label: "Files Scanned", value: String(Math.min(treeLines.length, 120)) },
    { label: "Last Updated", value: `${daysSinceUpdate}d ago` },
  ];

  return {
    overallScore,
    hiringReadiness,
    hiringReadinessClass,
    summary: `${repoInfo.name} is a ${repoInfo.language || "multi-language"} project. ${overallScore >= 7 ? "It shows good professional practices and could impress recruiters." : overallScore >= 5 ? "It has a foundation but needs improvements to stand out to companies." : "It needs significant work before it can be used as a portfolio piece."}`,
    subScores: [
      { name: "README", score: readmeScore, icon: "📄", color: readmeScore >= 7 ? "green" : readmeScore >= 4 ? "amber" : "red" },
      { name: "Structure", score: structureScore, icon: "🏗️", color: structureScore >= 7 ? "green" : structureScore >= 4 ? "amber" : "red" },
      { name: "Tests", score: testScore, icon: "🧪", color: testScore >= 7 ? "green" : testScore >= 4 ? "amber" : "red" },
      { name: "Code Quality", score: codeQualityScore, icon: "⚡", color: codeQualityScore >= 7 ? "green" : codeQualityScore >= 4 ? "amber" : "red" },
      { name: "Activity", score: activityScore, icon: "📈", color: activityScore >= 7 ? "green" : activityScore >= 4 ? "amber" : "red" },
    ],
    issues,
    suggestions,
    readmeSuggestion,
    resumeTips,
    strengths,
    stats,
  };
}
