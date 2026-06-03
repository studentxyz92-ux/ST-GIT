export interface PRDimension {
  score: number; // 0–100
  label: string;
  status: "green" | "yellow" | "red";
}

export interface ConflictFile {
  path: string;
  lines: string;
  baseLines?: string;
  headLines?: string;
  explanation?: string;
}

export interface PRHealthResult {
  overall: number; // 0–100
  dimensions: {
    conflictRisk: PRDimension;
    size: PRDimension;
    description: PRDimension;
    reviewReadiness: PRDimension;
    staleness: PRDimension;
    risk: PRDimension;
  };
  topIssues: Array<{ severity: "critical" | "warning" | "info"; title: string; description: string }>;
  mergeReadiness: "ready" | "needs-work" | "blocked";
}

export interface PRInput {
  title: string;
  body: string | null;
  state: string;
  created_at: string;
  updated_at: string;
  additions: number;
  deletions: number;
  changed_files: number;
  base: { ref: string; sha: string };
  head: { ref: string; sha: string };
  user: { login: string; avatar_url: string };
  requested_reviewers: Array<{ login: string }>;
  requested_teams: Array<{}>;
  labels: Array<{ name: string }>;
  milestone: { title: string } | null;
  mergeable: boolean | null;
  rebaseable: boolean | null;
  mergeable_state: string;
  comments: number;
  review_comments: number;
  commits: number;
}

export interface PRFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  contents_url: string;
  sha: string;
}

export interface CIStatus {
  state: string;
  total_count: number;
  statuses: Array<{ context: string; state: string; description: string | null }>;
}

export interface Commit {
  sha: string;
  commit: { message: string; author: { date: string } };
}

export interface Review {
  state: string;
  user: { login: string };
  submitted_at: string;
  body: string | null;
}

function dimensionStatus(score: number): "green" | "yellow" | "red" {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
}

/**
 * Analyzes conflict risk based on files with conflicts and mergeability.
 */
export function analyzeConflictRisk(
  pr: PRInput,
  conflictFiles: ConflictFile[]
): PRDimension {
  let score = 100;
  const criticalExtensions = [".json", ".yaml", ".yml", ".lock", ".config", ".ts", ".js", ".py", ".go"];

  // Penalize for each conflicted file
  const criticalConflicts = conflictFiles.filter((f) =>
    criticalExtensions.some((ext) => f.path.endsWith(ext))
  );
  score -= conflictFiles.length * 15;
  score -= criticalConflicts.length * 10;

  // Mergeable state
  if (pr.mergeable === false) score -= 20;
  if (pr.mergeable_state === "dirty") score -= 15;
  if (pr.mergeable_state === "behind") score -= 10;

  // File count
  if (pr.changed_files > 20) score -= 10;
  if (pr.changed_files > 50) score -= 15;

  return {
    score: Math.max(0, Math.min(100, score)),
    label: conflictFiles.length === 0
      ? "No conflicts detected"
      : `${conflictFiles.length} file${conflictFiles.length > 1 ? "s" : ""} have conflicts`,
    status: dimensionStatus(score),
  };
}

/**
 * Analyzes PR size for review fatigue.
 */
export function analyzeSize(pr: PRInput): PRDimension {
  let score = 100;
  const totalChanges = pr.additions + pr.deletions;

  if (totalChanges > 500) score -= 30;
  else if (totalChanges > 300) score -= 20;
  else if (totalChanges > 100) score -= 10;

  if (pr.changed_files > 20) score -= 15;
  else if (pr.changed_files > 10) score -= 5;

  // Ideal size bonus
  if (totalChanges < 100 && pr.changed_files <= 5) score += 5;

  const label =
    totalChanges > 500
      ? `Very large PR (${totalChanges} lines in ${pr.changed_files} files) — consider splitting`
      : totalChanges > 200
      ? `Moderate size (${totalChanges} lines in ${pr.changed_files} files)`
      : `Good size (${totalChanges} lines in ${pr.changed_files} files)`;

  return {
    score: Math.max(0, Math.min(100, score)),
    label,
    status: dimensionStatus(score),
  };
}

/**
 * Analyzes PR description quality.
 */
export function analyzeDescription(pr: PRInput): PRDimension {
  let score = 0;
  const body = pr.body || "";

  if (body.length > 0) score += 20;
  if (body.length > 100) score += 15;
  if (body.length > 500) score += 10;

  // Check for key sections
  const sections = [
    { pattern: /##?\s*(what|why|changes|motivation|goal|summary|overview)/i, points: 10 },
    { pattern: /##?\s*(how|implementation|approach|details)/i, points: 10 },
    { pattern: /##?\s*(test|testing|validation)/i, points: 10 },
    { pattern: /##?\s*(screenshot|demo|preview|ui)/i, points: 10 },
    { pattern: /##?\s*(breaking|migration|notes)/i, points: 5 },
    { pattern: /##?\s*(todo|follow.up|next)/i, points: 5 },
    { pattern: /(fixes|closes|resolves|refs?)\s*#\d+/i, points: 10 },
    { pattern: /```/g, points: 5 }, // code blocks
    { pattern: /!\[.*\]\(.*\)/i, points: 5 }, // images/screenshots
    { pattern: /- \[x\]|- \[ \]/i, points: 5 }, // checklist
  ];

  for (const { pattern, points } of sections) {
    const matches = body.match(pattern);
    if (matches) {
      score += points;
      if (pattern.toString() === "/```/g") {
        score += Math.min(matches.length, 4) * 2;
      }
    }
  }

  // Bonus for linking issues
  if (/fixes|closes|resolves/i.test(body)) score += 5;

  return {
    score: Math.min(100, score),
    label: score >= 70
      ? "Well-documented PR with clear description"
      : score >= 40
      ? "Description exists but could be more detailed"
      : pr.body
      ? "Minimal description — add context for reviewers"
      : "No description provided — reviewers are blind",
    status: dimensionStatus(score),
  };
}

/**
 * Analyzes review readiness based on CI checks, review status, and branch freshness.
 */
export function analyzeReviewReadiness(
  pr: PRInput,
  ciStatus: CIStatus | null,
  reviews: Review[]
): PRDimension {
  let score = 50; // Start neutral

  // CI checks
  if (ciStatus) {
    const successCount = ciStatus.statuses.filter((s) => s.state === "success").length;
    const failCount = ciStatus.statuses.filter((s) => s.state === "failure").length;
    const pendingCount = ciStatus.statuses.filter((s) => s.state === "pending").length;

    if (ciStatus.state === "success") score += 25;
    else if (ciStatus.state === "failure") score -= 30;
    else if (ciStatus.state === "pending") score -= 10;

    // Ratio of passing checks
    if (ciStatus.statuses.length > 0) {
      const passRate = successCount / ciStatus.statuses.length;
      if (passRate > 0.9) score += 10;
      else if (passRate < 0.5) score -= 15;
    }
  } else {
    score -= 10; // No CI checks configured
  }

  // Review status
  const approvedReviews = reviews.filter((r) => r.state === "APPROVED").length;
  const changesRequested = reviews.filter((r) => r.state === "CHANGES_REQUESTED").length;

  if (approvedReviews >= 2) score += 20;
  else if (approvedReviews === 1) score += 10;
  if (changesRequested > 0) score -= 20;

  // Requested reviewers
  if (pr.requested_reviewers.length > 0) score -= 10;

  // Branch up-to-date
  if (pr.mergeable_state === "behind") score -= 15;

  return {
    score: Math.max(0, Math.min(100, score)),
    label: score >= 70
      ? "Ready for review — CI passing, PR reviewed"
      : score >= 40
      ? "Needs attention — pending reviews or CI fixes"
      : "Not ready — CI failing or changes requested",
    status: dimensionStatus(score),
  };
}

/**
 * Analyzes staleness: how long the PR has been open and active.
 */
export function analyzeStaleness(pr: PRInput, commits: Commit[]): PRDimension {
  let score = 100;
  const now = Date.now();
  const created = new Date(pr.created_at).getTime();
  const updated = new Date(pr.updated_at).getTime();
  const daysOpen = (now - created) / 86400000;
  const daysSinceUpdate = (now - updated) / 86400000;

  // Penalize for being open too long
  if (daysOpen > 30) score -= 30;
  else if (daysOpen > 14) score -= 20;
  else if (daysOpen > 7) score -= 10;

  // Penalize for inactivity
  if (daysSinceUpdate > 14) score -= 25;
  else if (daysSinceUpdate > 7) score -= 15;
  else if (daysSinceUpdate > 3) score -= 5;

  // Review cycles (multiple commits after reviews)
  const uniqueDates = new Set(commits.map((c) => c.commit.author.date.split("T")[0]));
  if (uniqueDates.size > 10) score -= 10; // Too many cycles

  const label =
    daysOpen <= 3
      ? `Fresh PR (${Math.round(daysOpen)}d open, last activity ${Math.round(daysSinceUpdate)}d ago)`
      : daysOpen <= 14
      ? `Active PR (${Math.round(daysOpen)}d open)`
      : `Stale PR (${Math.round(daysOpen)}d open, last update ${Math.round(daysSinceUpdate)}d ago)`;

  return {
    score: Math.max(0, Math.min(100, score)),
    label,
    status: dimensionStatus(score),
  };
}

/**
 * Analyzes risk: security-sensitive files, schema changes, API changes.
 */
export function analyzeRisk(pr: PRInput, files: PRFile[]): PRDimension {
  let score = 100;

  // High-risk file patterns
  const highRiskPatterns = [
    /security/i, /auth/i, /password/i, /token/i, /credential/i,
    /schema/i, /migration/i, /database/i, /\.sql$/i,
    /Dockerfile/i, /docker-compose/i, /deploy/i,
    /config/i, /\.env/i, /secret/i,
    /api\/v\d/i, /route/i, /middleware/i,
    /payment/i, /billing/i, /stripe/i,
  ];

  const highRiskFiles = files.filter((f) =>
    highRiskPatterns.some((p) => p.test(f.filename))
  );

  if (highRiskFiles.length > 0) {
    score -= highRiskFiles.length * 10;
  }

  // Test coverage
  const hasTestChanges = files.some(
    (f) => /test|spec|__tests__/i.test(f.filename)
  );
  if (!hasTestChanges && files.filter((f) => /\.(ts|js|tsx|jsx|py|go|rs|java)$/.test(f.filename)).length > 0) {
    score -= 10;
  }

  // Large deletions in critical files
  const criticalDeletions = files.filter(
    (f) => f.deletions > 50 && /\.(ts|js|py|go|java)$/.test(f.filename)
  );
  if (criticalDeletions.length > 0) score -= 10;

  const label =
    highRiskFiles.length === 0
      ? "Low risk — no sensitive files modified"
      : `${highRiskFiles.length} high-risk file${highRiskFiles.length > 1 ? "s" : ""} modified (${highRiskFiles.map((f) => f.filename.split("/").pop()).join(", ")})`;

  return {
    score: Math.max(0, Math.min(100, score)),
    label,
    status: dimensionStatus(score),
  };
}

/**
 * Full PR health analysis across all 6 dimensions.
 */
export function analyzePRHealth(
  pr: PRInput,
  files: PRFile[],
  conflictFiles: ConflictFile[],
  ciStatus: CIStatus | null,
  reviews: Review[],
  commits: Commit[]
): PRHealthResult {
  const dimensions = {
    conflictRisk: analyzeConflictRisk(pr, conflictFiles),
    size: analyzeSize(pr),
    description: analyzeDescription(pr),
    reviewReadiness: analyzeReviewReadiness(pr, ciStatus, reviews),
    staleness: analyzeStaleness(pr, commits),
    risk: analyzeRisk(pr, files),
  };

  // Weighted overall score
  const overall = Math.round(
    dimensions.conflictRisk.score * 0.25 +
    dimensions.size.score * 0.15 +
    dimensions.description.score * 0.15 +
    dimensions.reviewReadiness.score * 0.2 +
    dimensions.staleness.score * 0.1 +
    dimensions.risk.score * 0.15
  );

  // Determine merge readiness
  const mergeReadiness: "ready" | "needs-work" | "blocked" =
    dimensions.conflictRisk.status === "red" || dimensions.reviewReadiness.status === "red"
      ? "blocked"
      : dimensions.conflictRisk.status === "yellow" ||
        dimensions.size.status === "yellow" ||
        dimensions.description.status === "yellow" ||
        dimensions.reviewReadiness.status === "yellow"
      ? "needs-work"
      : "ready";

  // Top issues
  const topIssues: Array<{
    severity: "critical" | "warning" | "info";
    title: string;
    description: string;
  }> = [];

  if (dimensions.conflictRisk.score < 40) {
    topIssues.push({
      severity: "critical",
      title: "Conflicts blocking merge",
      description: `This PR has unresolved conflicts. Merge ${pr.base.ref} into ${pr.head.ref} first.`,
    });
  }
  if (dimensions.reviewReadiness.score < 40) {
    topIssues.push({
      severity: "critical",
      title: "Not ready for review",
      description:
        dimensions.reviewReadiness.label.includes("CI")
          ? "CI checks are failing. Fix them before requesting review."
          : "Changes requested by reviewers. Address feedback before re-requesting.",
    });
  }
  if (dimensions.size.score < 40) {
    topIssues.push({
      severity: "warning",
      title: "PR is too large",
      description: `Split this PR (${pr.additions + pr.deletions} lines) into smaller, focused changes.`,
    });
  }
  if (dimensions.description.score < 40) {
    topIssues.push({
      severity: "warning",
      title: "Improve PR description",
      description: "Add what changed, why it changed, testing approach, and any screenshots.",
    });
  }
  if (dimensions.risk.score < 70 && dimensions.risk.score >= 40) {
    topIssues.push({
      severity: "warning",
      title: "High-risk files modified",
      description: `Review carefully: ${dimensions.risk.label}`,
    });
  }
  if (dimensions.staleness.score < 40) {
    topIssues.push({
      severity: "info",
      title: "Stale PR needs attention",
      description: "This PR has been open for a while. Consider closing or reviving it.",
    });
  }

  return { overall, dimensions, topIssues, mergeReadiness };
}
