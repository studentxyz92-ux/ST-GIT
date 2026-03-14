import { NextRequest, NextResponse } from "next/server";
import {
    parseGitHubUrl,
    fetchRepoInfo,
    fetchReadme,
    fetchFileTree,
    fetchCodeSnippets,
} from "@/lib/github";
import type { AnalysisResult } from "@/lib/types";

export const maxDuration = 60;

// ── Fallback heuristic analyser (no AI key needed) ──────────────────────────
function heuristicAnalyse(
    repoInfo: {
        name: string;
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
    tree: string
): AnalysisResult {
    const treeLines = tree.split("\n").filter(Boolean);

    // --- score components (0-10) ---
    let readmeScore = 0;
    if (readme.length > 50) readmeScore += 2;
    if (readme.length > 300) readmeScore += 2;
    if (readme.length > 1000) readmeScore += 2;
    if (/##\s*(installation|getting started|usage)/i.test(readme)) readmeScore += 2;
    if (/!\[.*\]\(.*\)/i.test(readme)) readmeScore += 1; // has images
    if (/badge/i.test(readme)) readmeScore += 1;
    readmeScore = Math.min(10, readmeScore);

    let structureScore = 0;
    if (treeLines.length > 5) structureScore += 2;
    if (treeLines.some((l) => /^src\//i.test(l))) structureScore += 2;
    if (treeLines.some((l) => /test|spec|__tests__/i.test(l))) structureScore += 2;
    if (treeLines.some((l) => /\.github|\.gitignore|\.env\.example/i.test(l))) structureScore += 1;
    if (treeLines.some((l) => /docker|ci\.yml|\.yml/i.test(l))) structureScore += 1;
    if (repoInfo.description) structureScore += 1;
    if (repoInfo.topics.length > 0) structureScore += 1;
    structureScore = Math.min(10, structureScore);

    const hasTests = treeLines.some((l) => /test|spec|__tests__/i.test(l));
    const testScore = hasTests ? 7 : 2;

    const hasLicense = !!repoInfo.license;
    const hasCi = treeLines.some((l) => /\.github\/workflows|travis|circleci/i.test(l));
    let codeQualityScore = 5;
    if (hasLicense) codeQualityScore += 1;
    if (hasCi) codeQualityScore += 2;
    if (repoInfo.stargazers_count > 0) codeQualityScore += 1;
    if (repoInfo.forks_count > 0) codeQualityScore += 1;
    codeQualityScore = Math.min(10, codeQualityScore);

    const daysSinceUpdate = Math.floor(
        (Date.now() - new Date(repoInfo.updated_at).getTime()) / 86400000
    );
    let activityScore = 10;
    if (daysSinceUpdate > 30) activityScore -= 2;
    if (daysSinceUpdate > 90) activityScore -= 2;
    if (daysSinceUpdate > 180) activityScore -= 2;
    activityScore = Math.max(2, activityScore);

    const overall =
        (readmeScore * 0.25 +
            structureScore * 0.25 +
            testScore * 0.2 +
            codeQualityScore * 0.2 +
            activityScore * 0.1);
    const overallScore = Math.round(overall * 10) / 10;

    // hiring readiness
    let hiringReadiness: AnalysisResult["hiringReadiness"];
    let hiringReadinessClass: AnalysisResult["hiringReadinessClass"];
    if (overallScore >= 8) { hiringReadiness = "Great Fit"; hiringReadinessClass = "great"; }
    else if (overallScore >= 6) { hiringReadiness = "Good Candidate"; hiringReadinessClass = "good"; }
    else if (overallScore >= 4) { hiringReadiness = "Needs Work"; hiringReadinessClass = "average"; }
    else { hiringReadiness = "Not Ready"; hiringReadinessClass = "poor"; }

    // build issues
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

    // build suggestions
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

    const readmeSuggestion = `# ${repoInfo.name}

> ${repoInfo.description || "A short, punchy description of your project."}

${repoInfo.language ? `![Language](https://img.shields.io/badge/language-${repoInfo.language}-blue)` : ""}
![License](https://img.shields.io/github/license/owner/${repoInfo.name})
![Stars](https://img.shields.io/github/stars/owner/${repoInfo.name})

## 🚀 Features

- ✅ Feature one
- ✅ Feature two
- ✅ Feature three

## 🛠 Tech Stack

- **Frontend:** ...
- **Backend:** ...
- **Database:** ...

## 📦 Installation

\`\`\`bash
git clone https://github.com/your-username/${repoInfo.name}
cd ${repoInfo.name}
npm install
npm run dev
\`\`\`

## 📸 Screenshots

<!-- Add screenshots here -->

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

## 📄 License

[MIT](LICENSE)`;

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
