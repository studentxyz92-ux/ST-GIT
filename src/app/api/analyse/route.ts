import { NextRequest, NextResponse } from "next/server";
import {
    parseGitHubUrl,
    fetchRepoInfo,
    fetchReadme,
    fetchFileTree,
    fetchCodeSnippets,
} from "@/lib/github";
import { heuristicAnalyse } from "@/lib/heuristicAnalyzer";
import type { AnalysisResult } from "@/lib/types";
import { withAuth } from "@/core/auth/apiAuth";
import type { SessionUser } from "@/core/types";

export const maxDuration = 60;

// ── AI analyser using OpenAI ────────────────────────────────────────────────
async function aiAnalyse(
    repoInfo: {
        name: string;
        full_name: string;
        description: string | null;
        language: string | null;
        topics: string[];
        stargazers_count: number;
        forks_count: number;
        open_issues_count: number;
        size: number;
        license: { name: string } | null;
        updated_at: string;
    },
    readme: string,
    tree: string,
    snippets: string
): Promise<AnalysisResult | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return null;

    const prompt = `You are a senior software engineer and technical recruiter reviewing a GitHub repository.

REPOSITORY DATA:
Name: ${repoInfo.full_name}
Description: ${repoInfo.description || "None"}
Primary Language: ${repoInfo.language || "Unknown"}
Topics: ${repoInfo.topics.join(", ") || "None"}
Stars: ${repoInfo.stargazers_count} | Forks: ${repoInfo.forks_count} | Open Issues: ${repoInfo.open_issues_count}
License: ${repoInfo.license?.name || "None"}
Last Updated: ${repoInfo.updated_at}

README (first 2000 chars):
${readme.slice(0, 2000) || "No README found"}

FILE TREE:
${tree.slice(0, 2000) || "Unable to fetch"}

CODE SNIPPETS:
${snippets.slice(0, 1500) || "Unable to fetch"}

Please analyse this repository and return a JSON object with this EXACT structure (no markdown, raw JSON only):
{
  "overallScore": <number 0-10, one decimal>,
  "hiringReadiness": <"Great Fit" | "Good Candidate" | "Needs Work" | "Not Ready">,
  "hiringReadinessClass": <"great" | "good" | "average" | "poor">,
  "summary": <2-3 sentence overall assessment>,
  "subScores": [
    {"name": "README", "score": <0-10>, "icon": "📄", "color": <"green"|"amber"|"red"|"indigo">},
    {"name": "Structure", "score": <0-10>, "icon": "🏗️", "color": <"green"|"amber"|"red"|"indigo">},
    {"name": "Tests", "score": <0-10>, "icon": "🧪", "color": <"green"|"amber"|"red"|"indigo">},
    {"name": "Code Quality", "score": <0-10>, "icon": "⚡", "color": <"green"|"amber"|"red"|"indigo">},
    {"name": "Activity", "score": <0-10>, "icon": "📈", "color": <"green"|"amber"|"red"|"indigo">}
  ],
  "issues": [
    {"severity": <"critical"|"warning"|"info">, "title": <string>, "description": <string>}
  ],
  "suggestions": [
    {"title": <string>, "detail": <string>}
  ],
  "readmeSuggestion": <markdown string for an improved README>,
  "resumeTips": [
    {"icon": <emoji>, "title": <string>, "text": <string>}
  ],
  "strengths": [<string>],
  "stats": [
    {"label": <string>, "value": <string>}
  ]
}

Be specific and actionable. Mention actual file names or patterns you noticed. Stats should include Stars, Forks, Open Issues, Repo Size, Files Scanned, and Last Updated.`;

    try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.3,
                max_tokens: 2500,
            }),
        });

        if (!res.ok) return null;
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content || "";
        const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        return JSON.parse(cleaned);
    } catch {
        return null;
    }
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
    // Optional auth: validate API key for API requests
    const isApiRequest = req.headers.get("authorization")?.startsWith("Bearer ds_live_");

    // For API key requests, validate the key
    if (isApiRequest) {
        const authResult = await import("@/core/auth/apiAuth").then(m =>
            m.validateRequest(req.headers.get("authorization"))
        );
        if (!authResult.valid) {
            return NextResponse.json({ error: authResult.error }, { status: 401 });
        }
        // API key users have rate limits — handled by frontend middleware
    }

    try {
        const { repoUrl } = await req.json();
        if (!repoUrl) {
            return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
        }

        const parsed = parseGitHubUrl(repoUrl);
        if (!parsed) {
            return NextResponse.json(
                { error: "Invalid GitHub URL. Please use format: https://github.com/owner/repo" },
                { status: 400 }
            );
        }

        const { owner, repo } = parsed;

        // Fetch repo data in parallel
        const [repoInfo, readme, tree, snippets] = await Promise.all([
            fetchRepoInfo(owner, repo),
            fetchReadme(owner, repo),
            fetchFileTree(owner, repo, "main").then((t) =>
                t || fetchFileTree(owner, repo, "master")
            ),
            fetchCodeSnippets(owner, repo),
        ]);

        // Try AI analysis first, fall back to heuristic
        const result =
            (await aiAnalyse(repoInfo, readme, tree, snippets)) ||
            heuristicAnalyse(repoInfo, readme, tree);

        return NextResponse.json({ result, repoInfo: { full_name: repoInfo.full_name, html_url: repoInfo.html_url } });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Analysis failed";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
