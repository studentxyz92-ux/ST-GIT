import { NextRequest, NextResponse } from "next/server";
import { fetchUserInfo, fetchUserRepos, fetchReadme, fetchFileTree } from "@/lib/github";
import { heuristicAnalyse } from "@/lib/heuristicAnalyzer";

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  try {
    const username = req.nextUrl.searchParams.get("username");
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Fetch user info and repos in parallel
    const [userInfo, repos] = await Promise.all([
      fetchUserInfo(username),
      fetchUserRepos(username),
    ]);

    // Analyze top 20 repos (skip huge profiles)
    const repoSlice = repos.slice(0, 20);
    const repoResults: Array<{
      name: string;
      full_name: string;
      score: number;
      language: string | null;
      stars: number;
      hiringReadiness: string;
    }> = [];

    for (const repo of repoSlice) {
      try {
        const readme = await fetchReadme(repo.full_name.split("/")[0], repo.name);
        const tree = await fetchFileTree(repo.full_name.split("/")[0], repo.name);
        const result = heuristicAnalyse(
          {
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
            html_url: `https://github.com/${repo.full_name}`,
            default_branch: "main",
            visibility: "public",
            owner: { login: username, avatar_url: userInfo.avatar_url },
          },
          readme,
          tree
        );
        repoResults.push({
          name: repo.name,
          full_name: repo.full_name,
          score: result.overallScore,
          language: repo.language,
          stars: repo.stargazers_count,
          hiringReadiness: result.hiringReadiness,
        });
      } catch {
        // Skip repos that fail analysis
      }
    }

    // Sort by score descending
    repoResults.sort((a, b) => b.score - a.score);

    const avgScore =
      repoResults.length > 0
        ? Math.round((repoResults.reduce((s, r) => s + r.score, 0) / repoResults.length) * 100) / 100
        : 0;

    return NextResponse.json({
      user: userInfo,
      repos: repoResults,
      averageScore: avgScore,
      totalRepos: repos.length,
      analyzedCount: repoResults.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Profile analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
