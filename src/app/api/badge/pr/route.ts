import { NextRequest, NextResponse } from "next/server";

const GITHUB_API = "https://api.github.com";

function getHeaders() {
  return {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "DevScore-AI/1.0",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing PR url parameter", { status: 400 });
  }

  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
  if (!match) {
    return new NextResponse("Invalid PR URL", { status: 400 });
  }

  const [, owner, repo, prNumber] = match;

  try {
    const prRes = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`,
      { headers: getHeaders() }
    );

    if (!prRes.ok) {
      return new NextResponse("PR not found", { status: 404 });
    }

    const pr = await prRes.json();

    // Calculate a simple health score
    let score = 100;
    const totalChanges = pr.additions + pr.deletions;
    if (totalChanges > 500) score -= 20;
    else if (totalChanges > 200) score -= 10;
    if (pr.mergeable === false) score -= 25;
    if (pr.mergeable_state === "dirty") score -= 20;
    if (pr.body === null || pr.body.length < 50) score -= 15;
    const daysOpen = (Date.now() - new Date(pr.created_at).getTime()) / 86400000;
    if (daysOpen > 30) score -= 15;
    else if (daysOpen > 14) score -= 10;

    const label = score >= 70 ? "ready" : score >= 40 ? "needs-work" : "conflicts";
    const color = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

    // Get conflict count
    let conflictCount = 0;
    let mergeableState = pr.mergeable_state || "unknown";
    if (mergeableState === "dirty") conflictCount = 1;

    const displayScore = Math.max(0, Math.min(100, score));

    // Generate SVG badge
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="20">
  <defs>
    <linearGradient id="b" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
  </defs>
  <rect rx="3" width="220" height="20" fill="#555"/>
  <rect rx="3" x="0" width="120" height="20" fill="#555"/>
  <rect rx="3" x="120" width="100" height="20" fill="${color}"/>
  <rect rx="3" x="120" width="100" height="20" fill="${color}"/>
  <path d="M120 0h4v20h-4z" fill="${color}"/>
  <text x="60" y="14" text-anchor="middle" fill="#fff" font-family="DejaVu Sans,Helvetica,sans-serif" font-size="11" font-weight="bold">PR Health</text>
  <text x="170" y="14" text-anchor="middle" fill="#fff" font-family="DejaVu Sans,Helvetica,sans-serif" font-size="11" font-weight="bold">${displayScore}/100</text>
</svg>`;

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-cache, max-age=0",
      },
    });
  } catch {
    return new NextResponse("Analysis failed", { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Redirect POST to GET for badge generation
  const body = await req.json().catch(() => ({}));
  const url = body.url || "";
  const redirectUrl = new URL(req.url);
  redirectUrl.searchParams.set("url", url);
  return NextResponse.redirect(redirectUrl.toString());
}
