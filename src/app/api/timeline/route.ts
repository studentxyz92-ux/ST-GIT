import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface ScoreEntry {
  repoFull: string;
  overall: number;
  readme: number;
  structure: number;
  tests: number;
  quality: number;
  activity: number;
  analysedAt: string;
}

const DATA_DIR = path.join(process.cwd(), ".devscore-data");
const REPO_SCORES_FILE = path.join(DATA_DIR, "repo-scores.json");

function readScores(): ScoreEntry[] {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(REPO_SCORES_FILE)) {
      const raw = fs.readFileSync(REPO_SCORES_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch {}
  return [];
}

export async function GET(req: NextRequest) {
  const repo = req.nextUrl.searchParams.get("repo");
  const allScores = readScores();

  if (repo) {
    const filtered = allScores
      .filter((e) => e.repoFull === repo)
      .sort((a, b) => new Date(a.analysedAt).getTime() - new Date(b.analysedAt).getTime());

    return NextResponse.json({
      repo,
      scores: filtered,
      total: filtered.length,
      trend: filtered.length >= 2
        ? filtered[filtered.length - 1].overall - filtered[0].overall
        : 0,
    });
  }

  // Group by repo for overview
  const grouped: Record<string, { name: string; latest: ScoreEntry; trend: number; dataPoints: number }> = {};
  for (const entry of allScores) {
    if (!grouped[entry.repoFull] || new Date(entry.analysedAt) > new Date(grouped[entry.repoFull].latest.analysedAt)) {
      grouped[entry.repoFull] = {
        name: entry.repoFull,
        latest: entry,
        trend: 0,
        dataPoints: 1,
      };
    }
  }

  // Calculate trends
  for (const [repoFull, entries] of Object.entries(
    allScores.reduce<Record<string, ScoreEntry[]>>((acc, e) => {
      if (!acc[e.repoFull]) acc[e.repoFull] = [];
      acc[e.repoFull].push(e);
      return acc;
    }, {})
  )) {
    if (entries.length >= 2) {
      const sorted = entries.sort(
        (a, b) => new Date(a.analysedAt).getTime() - new Date(b.analysedAt).getTime()
      );
      if (grouped[repoFull]) {
        grouped[repoFull].trend = sorted[sorted.length - 1].overall - sorted[0].overall;
        grouped[repoFull].dataPoints = entries.length;
      }
    }
  }

  return NextResponse.json({
    repos: Object.values(grouped).sort((a, b) => b.latest.overall - a.latest.overall),
    totalScores: allScores.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { repoFull, overall, readme, structure, tests, quality, activity } = body;

    if (!repoFull || overall === undefined) {
      return NextResponse.json({ error: "repoFull and overall score required" }, { status: 400 });
    }

    const entry: ScoreEntry = {
      repoFull,
      overall,
      readme: readme ?? 0,
      structure: structure ?? 0,
      tests: tests ?? 0,
      quality: quality ?? 0,
      activity: activity ?? 0,
      analysedAt: new Date().toISOString(),
    };

    const scores = readScores();
    scores.push(entry);
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(REPO_SCORES_FILE, JSON.stringify(scores, null, 2));

    return NextResponse.json({ success: true, entry });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save score";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
