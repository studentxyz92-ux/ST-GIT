import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const GITHUB_API = "https://api.github.com";

function getHeaders(token?: string) {
  const githubToken = token || process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DevScore-AI/1.0",
    ...(githubToken ? { Authorization: `Bearer ${githubToken}` } : {}),
  };
}

interface PRInput {
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

interface PRFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  contents_url: string;
  sha: string;
}

interface CIStatus {
  state: string;
  total_count: number;
  statuses: Array<{ context: string; state: string; description: string | null }>;
}

interface Commit {
  sha: string;
  commit: { message: string; author: { date: string } };
}

interface Review {
  state: string;
  user: { login: string };
  submitted_at: string;
  body: string | null;
}

// Inline the PR health analysis functions (import from core would cause module issues)
type DimensionStatus = "green" | "yellow" | "red";

function dimensionStatus(score: number): DimensionStatus {
  if (score >= 70) return "green";
  if (score >= 40) return "yellow";
  return "red";
}

interface ConflictFile {
  path: string;
  lines: string;
  baseLines?: string;
  headLines?: string;
  explanation?: string;
}

function analyzeConflictRisk(pr: PRInput, conflictFiles: ConflictFile[]) {
  let score = 100;
  const criticalExtensions = [".json", ".yaml", ".yml", ".lock", ".config", ".ts", ".js", ".py", ".go"];
  const criticalConflicts = conflictFiles.filter((f) =>
    criticalExtensions.some((ext) => f.path.endsWith(ext))
  );
  score -= conflictFiles.length * 15;
  score -= criticalConflicts.length * 10;
  if (pr.mergeable === false) score -= 20;
  if (pr.mergeable_state === "dirty") score -= 15;
  if (pr.mergeable_state === "behind") score -= 10;
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

function analyzeSize(pr: PRInput) {
  let score = 100;
  const totalChanges = pr.additions + pr.deletions;
  if (totalChanges > 500) score -= 30;
  else if (totalChanges > 300) score -= 20;
  else if (totalChanges > 100) score -= 10;
  if (pr.changed_files > 20) score -= 15;
  else if (pr.changed_files > 10) score -= 5;
  if (totalChanges < 100 && pr.changed_files <= 5) score += 5;
  const label = totalChanges > 500
    ? `Very large PR (${totalChanges} lines in ${pr.changed_files} files) — consider splitting`
    : totalChanges > 200
    ? `Moderate size (${totalChanges} lines in ${pr.changed_files} files)`
    : `Good size (${totalChanges} lines in ${pr.changed_files} files)`;
  return { score: Math.max(0, Math.min(100, score)), label, status: dimensionStatus(score) };
}

function analyzeDescription(pr: PRInput) {
  let score = 0;
  const body = pr.body || "";
  if (body.length > 0) score += 20;
  if (body.length > 100) score += 15;
  if (body.length > 500) score += 10;
  const sections: Array<{ pattern: RegExp; points: number }> = [
    { pattern: /##?\s*(what|why|changes|motivation|goal|summary|overview)/i, points: 10 },
    { pattern: /##?\s*(how|implementation|approach|details)/i, points: 10 },
    { pattern: /##?\s*(test|testing|validation)/i, points: 10 },
    { pattern: /##?\s*(screenshot|demo|preview|ui)/i, points: 10 },
    { pattern: /##?\s*(breaking|migration|notes)/i, points: 5 },
    { pattern: /##?\s*(todo|follow.up|next)/i, points: 5 },
    { pattern: /(fixes|closes|resolves|refs?)\s*#\d+/i, points: 10 },
    { pattern: /!\[.*\]\(.*\)/i, points: 5 },
    { pattern: /- \[x\]|- \[ \]/i, points: 5 },
  ];
  for (const { pattern } of sections) {
    const matches = body.match(pattern);
    if (matches) score += 10;
  }
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

function analyzeReviewReadiness(pr: PRInput, ciStatus: CIStatus | null, reviews: Review[]) {
  let score = 50;
  if (ciStatus) {
    const successCount = ciStatus.statuses.filter((s: { state: string }) => s.state === "success").length;
    const failCount = ciStatus.statuses.filter((s: { state: string }) => s.state === "failure").length;
    if (ciStatus.state === "success") score += 25;
    else if (ciStatus.state === "failure") score -= 30;
    else if (ciStatus.state === "pending") score -= 10;
    if (ciStatus.statuses.length > 0) {
      const passRate = successCount / ciStatus.statuses.length;
      if (passRate > 0.9) score += 10;
      else if (passRate < 0.5) score -= 15;
    }
  } else {
    score -= 10;
  }
  const approvedReviews = reviews.filter((r: Review) => r.state === "APPROVED").length;
  const changesRequested = reviews.filter((r: Review) => r.state === "CHANGES_REQUESTED").length;
  if (approvedReviews >= 2) score += 20;
  else if (approvedReviews === 1) score += 10;
  if (changesRequested > 0) score -= 20;
  if (pr.requested_reviewers.length > 0) score -= 10;
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

function analyzeStaleness(pr: PRInput) {
  let score = 100;
  const now = Date.now();
  const created = new Date(pr.created_at).getTime();
  const updated = new Date(pr.updated_at).getTime();
  const daysOpen = (now - created) / 86400000;
  const daysSinceUpdate = (now - updated) / 86400000;
  if (daysOpen > 30) score -= 30;
  else if (daysOpen > 14) score -= 20;
  else if (daysOpen > 7) score -= 10;
  if (daysSinceUpdate > 14) score -= 25;
  else if (daysSinceUpdate > 7) score -= 15;
  else if (daysSinceUpdate > 3) score -= 5;
  const label = daysOpen <= 3
    ? `Fresh PR (${Math.round(daysOpen)}d open, last activity ${Math.round(daysSinceUpdate)}d ago)`
    : daysOpen <= 14
    ? `Active PR (${Math.round(daysOpen)}d open)`
    : `Stale PR (${Math.round(daysOpen)}d open, last update ${Math.round(daysSinceUpdate)}d ago)`;
  return { score: Math.max(0, Math.min(100, score)), label, status: dimensionStatus(score) };
}

function analyzeRisk(pr: PRInput, files: PRFile[]) {
  let score = 100;
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
  if (highRiskFiles.length > 0) score -= highRiskFiles.length * 10;
  const hasTestChanges = files.some((f) => /test|spec|__tests__/i.test(f.filename));
  if (!hasTestChanges && files.filter((f) => /\.(ts|js|tsx|jsx|py|go|rs|java)$/.test(f.filename)).length > 0) {
    score -= 10;
  }
  const label = highRiskFiles.length === 0
    ? "Low risk — no sensitive files modified"
    : `${highRiskFiles.length} high-risk file${highRiskFiles.length > 1 ? "s" : ""} modified`;
  return { score: Math.max(0, Math.min(100, score)), label, status: dimensionStatus(score) };
}

export async function POST(req: NextRequest) {
  try {
    const { prUrl } = await req.json();
    if (!prUrl) {
      return NextResponse.json({ error: "PR URL is required" }, { status: 400 });
    }

    // Parse PR URL: https://github.com/owner/repo/pull/123
    const match = prUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (!match) {
      return NextResponse.json(
        { error: "Invalid PR URL. Use format: https://github.com/owner/repo/pull/123" },
        { status: 400 }
      );
    }

    const [, owner, repo, prNumber] = match;

    // Fetch PR data from GitHub API
    const [prRes, filesRes, commitsRes, reviewsRes] = await Promise.all([
      fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`, {
        headers: getHeaders(),
      }),
      fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/files`, {
        headers: getHeaders(),
      }),
      fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/commits`, {
        headers: getHeaders(),
      }),
      fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
        headers: getHeaders(),
      }),
    ]);

    if (!prRes.ok) {
      const err = await prRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message || `GitHub API returned ${prRes.status}` },
        { status: prRes.status }
      );
    }

    const pr: PRInput = await prRes.json();
    const files: PRFile[] = await filesRes.json();
    const commits: Commit[] = await commitsRes.json();
    const reviews: Review[] = await reviewsRes.json();

    // Fetch CI status
    let ciStatus: CIStatus | null = null;
    try {
      const ciRes = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/commits/${pr.head.sha}/combined_status`,
        { headers: getHeaders() }
      );
      if (ciRes.ok) {
        ciStatus = await ciRes.json();
      }
    } catch {
      // CI status unavailable
    }

    // Fetch conflict data by comparing base..head
    const conflictFiles: ConflictFile[] = [];
    try {
      const compareRes = await fetch(
        `${GITHUB_API}/repos/${owner}/${repo}/compare/${pr.base.ref}...${pr.head.ref}`,
        { headers: getHeaders() }
      );
      if (compareRes.ok) {
        const compareData = await compareRes.json();
        // Check for conflicting files by looking at mergeable_state
        if (pr.mergeable_state === "dirty") {
          // Find files with conflict markers
          const conflictFilePromises = files
            .filter((f) => f.status === "modified" || f.status === "added")
            .slice(0, 10)
            .map(async (f) => {
              try {
                const contentRes = await fetch(
                  `${GITHUB_API}/repos/${owner}/${repo}/contents/${f.filename}?ref=${pr.head.ref}`,
                  { headers: getHeaders() }
                );
                if (contentRes.ok) {
                  const data = await contentRes.json();
                  const content = Buffer.from(data.content, "base64").toString("utf-8");
                  if (content.includes("<<<<<<<") || content.includes("=======") || content.includes(">>>>>>>")) {
                    return { path: f.filename, lines: content, explanation: undefined };
                  }
                }
              } catch {}
              return null;
            });

          const results = await Promise.all(conflictFilePromises);
          conflictFiles.push(...results.filter((f): f is { path: string; lines: string; explanation: undefined } => f !== null));
        }
      }
    } catch {
      // Conflict fetch failed
    }

    // Calculate dimensions
    const dimensions = {
      conflictRisk: analyzeConflictRisk(pr, conflictFiles),
      size: analyzeSize(pr),
      description: analyzeDescription(pr),
      reviewReadiness: analyzeReviewReadiness(pr, ciStatus, reviews),
      staleness: analyzeStaleness(pr),
      risk: analyzeRisk(pr, files),
    };

    const overall = Math.round(
      dimensions.conflictRisk.score * 0.25 +
      dimensions.size.score * 0.15 +
      dimensions.description.score * 0.15 +
      dimensions.reviewReadiness.score * 0.2 +
      dimensions.staleness.score * 0.1 +
      dimensions.risk.score * 0.15
    );

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
    const topIssues: Array<{ severity: string; title: string; description: string }> = [];
    if (dimensions.conflictRisk.score < 40) {
      topIssues.push({ severity: "critical", title: "Conflicts blocking merge", description: `This PR has unresolved conflicts. Merge ${pr.base.ref} into ${pr.head.ref} first.` });
    }
    if (dimensions.reviewReadiness.score < 40) {
      topIssues.push({ severity: "critical", title: "Not ready for review", description: "CI checks are failing or changes are requested. Fix before requesting review." });
    }
    if (dimensions.size.score < 40) {
      topIssues.push({ severity: "warning", title: "PR is too large", description: `Split this PR (${pr.additions + pr.deletions} lines) into smaller changes.` });
    }
    if (dimensions.description.score < 40) {
      topIssues.push({ severity: "warning", title: "Improve PR description", description: "Add what changed, why, testing approach, and screenshots." });
    }
    if (dimensions.staleness.score < 40) {
      topIssues.push({ severity: "info", title: "Stale PR", description: "This PR has been open for a while. Consider closing or reviving it." });
    }

    return NextResponse.json({
      pr: {
        title: pr.title,
        number: parseInt(prNumber, 10),
        state: pr.state,
        author: pr.user.login,
        avatar: pr.user.avatar_url,
        html_url: `https://github.com/${owner}/${repo}/pull/${prNumber}`,
        created_at: pr.created_at,
        updated_at: pr.updated_at,
      },
      repoInfo: { full_name: `${owner}/${repo}`, owner, repo },
      healthScore: {
        overall,
        dimensions: {
          conflictRisk: dimensions.conflictRisk,
          size: dimensions.size,
          description: dimensions.description,
          reviewReadiness: dimensions.reviewReadiness,
          staleness: dimensions.staleness,
          risk: dimensions.risk,
        },
        topIssues,
        mergeReadiness,
      },
      stats: {
        totalChanges: pr.additions + pr.deletions,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changed_files,
        commits: commits.length,
        reviews: reviews.length,
        conflicts: conflictFiles.length,
        ciStatus: ciStatus?.state || "unknown",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "PR analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
