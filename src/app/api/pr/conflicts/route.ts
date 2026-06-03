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

export async function POST(req: NextRequest) {
  try {
    const { prUrl } = await req.json();
    if (!prUrl) {
      return NextResponse.json({ error: "PR URL is required" }, { status: 400 });
    }

    const match = prUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/pull\/(\d+)/);
    if (!match) {
      return NextResponse.json({ error: "Invalid PR URL" }, { status: 400 });
    }

    const [, owner, repo, prNumber] = match;

    // Get PR details
    const prRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`, {
      headers: getHeaders(),
    });
    if (!prRes.ok) {
      return NextResponse.json({ error: "PR not found" }, { status: 404 });
    }
    const pr = await prRes.json();

    // Get files that have conflicts by fetching the base..head comparison
    const conflictFiles: Array<{
      path: string;
      content: string;
      explanation: string;
      currentLines: string[];
      incomingLines: string[];
    }> = [];

    // Check the PR's mergeable_state to determine if there are conflicts
    if (pr.mergeable_state === "dirty") {
      // Get the PR files
      const filesRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/files`, {
        headers: getHeaders(),
      });
      if (filesRes.ok) {
        const files = await filesRes.json();

        // For files that might have conflicts, fetch their content
        for (const file of files.slice(0, 15)) {
          try {
            // Fetch the file content from the head branch
            const contentRes = await fetch(
              `${GITHUB_API}/repos/${owner}/${repo}/contents/${file.filename}?ref=${pr.head.ref}`,
              { headers: getHeaders() }
            );

            if (contentRes.ok) {
              const data = await contentRes.json();
              const content = Buffer.from(data.content, "base64").toString("utf-8");

              // Check for conflict markers
              if (content.includes("<<<<<<<") && content.includes("=======") && content.includes(">>>>>>>")) {
                const sections: Array<{ current: string; incoming: string; startLine: number }> = [];
                const lines = content.split("\n");
                let currentLines: string[] = [];
                let incomingLines: string[] = [];
                let inCurrent = false;
                let inIncoming = false;
                let startLine = 0;

                for (let i = 0; i < lines.length; i++) {
                  const line = lines[i];
                  if (line.startsWith("<<<<<<< ")) {
                    inCurrent = true;
                    startLine = i + 1;
                    currentLines = [];
                    incomingLines = [];
                  } else if (line.startsWith("=======") && inCurrent) {
                    inCurrent = false;
                    inIncoming = true;
                  } else if (line.startsWith(">>>>>>> ") && inIncoming) {
                    inIncoming = false;
                    sections.push({
                      current: currentLines.join("\n"),
                      incoming: incomingLines.join("\n"),
                      startLine,
                    });
                  } else if (inCurrent) {
                    currentLines.push(line);
                  } else if (inIncoming) {
                    incomingLines.push(line);
                  }
                }

                // Generate explanation
                const explanation = `Both branches modified the same section in ${file.filename} around line ${sections[0]?.startLine || 1}. The current branch has ${sections[0]?.current.split("\n").length || 0} lines of changes, while the incoming branch has ${sections[0]?.incoming.split("\n").length || 0} lines. This conflict needs to be resolved by incorporating both sets of changes.`;

                conflictFiles.push({
                  path: file.filename,
                  content,
                  explanation,
                  currentLines: sections.map((s) => s.current),
                  incomingLines: sections.map((s) => s.incoming),
                });
              }
            }
          } catch {
            // Skip files we can't read
          }
        }
      }
    }

    return NextResponse.json({
      prInfo: {
        number: pr.number,
        title: pr.title,
        author: pr.user.login,
        baseBranch: pr.base.ref,
        headBranch: pr.head.ref,
        mergeable: pr.mergeable,
        mergeableState: pr.mergeable_state,
      },
      conflicts: conflictFiles.map((f) => ({
        path: f.path,
        explanation: f.explanation,
        currentChanges: f.currentLines.slice(0, 3).join("\n").substring(0, 300),
        incomingChanges: f.incomingLines.slice(0, 3).join("\n").substring(0, 300),
        suggestedAction: f.currentLines.length > 0 && f.incomingLines.length > 0
          ? "Keep both changes — they appear compatible and should be merged together"
          : f.currentLines.length > 0
          ? "Keep current branch changes — incoming deleted this section"
          : "Accept incoming changes — current deleted this section",
        risk: /(package\.json|\.ts$|\.js$|schema|\.env)/i.test(f.path) ? "high" : "medium",
      })),
      totalConflicts: conflictFiles.length,
      message: conflictFiles.length === 0
        ? "✅ No conflicts detected. This PR is ready to merge."
        : `⚠️ ${conflictFiles.length} file${conflictFiles.length > 1 ? "s" : ""} have conflicts that need resolution.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Conflict analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
