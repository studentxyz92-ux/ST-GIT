import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { repoUrl } = await req.json();
    if (!repoUrl) {
      return NextResponse.json({ error: "Repo URL is required" }, { status: 400 });
    }

    // Parse the repo URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
    }

    const [, owner, repo] = match;

    // Fetch repo info + readme for context
    const GITHUB_API = "https://api.github.com";
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "DevScore-AI/1.0",
      ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
    };

    const [repoRes, readmeRes, langsRes] = await Promise.all([
      fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers }),
      fetch(`${GITHUB_API}/repos/${owner}/${repo}/readme`, {
        headers: { ...headers, Accept: "application/vnd.github.v3.raw" },
      }),
      fetch(`${GITHUB_API}/repos/${owner}/${repo}/languages`, { headers }),
    ]);

    if (!repoRes.ok) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    const repoInfo = await repoRes.json();
    const readme = readmeRes.ok ? await readmeRes.text() : "";
    const languages = langsRes.ok ? await langsRes.json() : {};

    // Build language breakdown
    const totalBytes = Object.values(languages).reduce((s: number, v: unknown) => s + (v as number), 0);
    const langBreakdown = Object.entries(languages)
      .map(([name, bytes]) => ({
        name,
        percentage: Math.round(((bytes as number) / totalBytes) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    // Generate questions
    const primaryLang = langBreakdown[0]?.name || "Unknown";
    const repoName = repoInfo.name;
    const description = repoInfo.description || "No description";

    const questions = [
      {
        category: "technical",
        question: `Looking at ${repoName}, which uses ${primaryLang}: "Explain the architecture of this project. How are the different components organized and how do they communicate?"`,
        context: `Based on ${repoName} — a ${primaryLang} project. ${description}`,
        difficulty: "medium",
        modelAnswer: "I should describe the high-level architecture, the main components, how data flows through the system, and the key design patterns used. I should mention specific files and modules that demonstrate good separation of concerns.",
        keyConcepts: ["software architecture", "design patterns", "modularity"],
      },
      {
        category: "technical",
        question: `${repoName} uses ${primaryLang}. "What are the key technical decisions you made in this project and why?"`,
        context: `Technical decisions in ${repoName}.`,
        difficulty: "medium",
        modelAnswer: "I should discuss the choice of framework, database, deployment strategy, and how each decision impacted the project's development. I should also mention tradeoffs considered.",
        keyConcepts: ["technical decisions", "tradeoffs", "architecture"],
      },
      {
        category: "behavioral",
        question: `"If you were to add a major new feature to ${repoName}, walk me through your process from ideation to deployment."`,
        context: `Feature development workflow.`,
        difficulty: "medium",
        modelAnswer: "I would: (1) Understand requirements, (2) Design the solution, (3) Consider edge cases, (4) Write tests, (5) Implement, (6) Code review, (7) Deploy, (8) Monitor.",
        keyConcepts: ["development workflow", "feature development", "testing"],
      },
      {
        category: "system-design",
        question: `"How would you scale ${repoName} to handle 10x its current load? What bottlenecks do you anticipate?"`,
        context: `Scaling ${repoName}.`,
        difficulty: "hard",
        modelAnswer: "I'd identify bottlenecks in database queries, API response times, and frontend rendering. I'd propose caching, database indexing, horizontal scaling, and CDN usage.",
        keyConcepts: ["scalability", "performance", "system design"],
      },
      {
        category: "design",
        question: `"What tests does ${repoName} have and what's missing? How would you improve test coverage?"`,
        context: `Test coverage for ${repoName}.`,
        difficulty: "easy",
        modelAnswer: "I should discuss unit tests, integration tests, end-to-end tests, and what areas of the codebase lack coverage. I should propose a testing strategy.",
        keyConcepts: ["testing", "test coverage", "quality assurance"],
      },
      {
        category: "behavioral",
        question: `"What was the hardest bug you fixed in ${repoName} and how did you debug it?"`,
        context: `Debugging experience in ${repoName}.`,
        difficulty: "medium",
        modelAnswer: "I should describe a specific bug, the debugging approach (logging, breakpoints, bisecting), the root cause, and how I fixed it. I should also mention preventive measures added.",
        keyConcepts: ["debugging", "problem solving", "root cause analysis"],
      },
      {
        category: "system-design",
        question: `"If you had to rebuild ${repoName} from scratch today, what would you do differently?"`,
        context: `Architecture reflection on ${repoName}.`,
        difficulty: "hard",
        modelAnswer: "I should honestly assess the current architecture, identify technical debt, and propose improvements in areas like testing, documentation, CI/CD, and code organization.",
        keyConcepts: ["refactoring", "technical debt", "continuous improvement"],
      },
    ];

    return NextResponse.json({
      repoInfo: {
        name: repoName,
        full_name: `${owner}/${repo}`,
        description,
        language: primaryLang,
        languages: langBreakdown,
        stars: repoInfo.stargazers_count,
        forks: repoInfo.forks_count,
      },
      questions,
      totalQuestions: questions.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
