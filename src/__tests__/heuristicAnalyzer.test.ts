import { describe, it, expect } from "vitest";
import { heuristicAnalyse } from "@/lib/heuristicAnalyzer";
import type { RepoAnalysisInput } from "@/lib/heuristicAnalyzer";

function makeRepo(overrides: Partial<RepoAnalysisInput> = {}): RepoAnalysisInput {
  return {
    name: "test-repo",
    description: "A test repository",
    language: "TypeScript",
    topics: ["typescript", "react", "testing"],
    stargazers_count: 10,
    forks_count: 3,
    open_issues_count: 1,
    size: 2048,
    license: { name: "MIT" },
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("heuristicAnalyse", () => {
  it("returns a complete AnalysisResult", () => {
    const result = heuristicAnalyse(makeRepo(), "# Full README\n\n## Installation\n\n```\nnpm install\n```\n\n![screenshot](img.png)\n\n![badge](https://img.shields.io)", "src/\nsrc/index.ts\ntests/\n.github/workflows/ci.yml\n.gitignore\n.env.example\nREADME.md");
    
    expect(result).toHaveProperty("overallScore");
    expect(result).toHaveProperty("hiringReadiness");
    expect(result).toHaveProperty("hiringReadinessClass");
    expect(result).toHaveProperty("summary");
    expect(result.subScores).toHaveLength(5);
    expect(result.issues).toBeInstanceOf(Array);
    expect(result.suggestions).toHaveLength(8);
    expect(result.readmeSuggestion).toBeTruthy();
    expect(result.resumeTips).toHaveLength(4);
    expect(result.strengths).toBeInstanceOf(Array);
    expect(result.stats).toHaveLength(6);
  });

  describe("README scoring", () => {
    it("scores 0 for empty README", () => {
      const result = heuristicAnalyse(makeRepo(), "", "");
      const readmeScore = result.subScores.find((s) => s.name === "README")!.score;
      expect(readmeScore).toBe(0);
    });

    it("scores higher with installation instructions and badges", () => {
      const result = heuristicAnalyse(
        makeRepo(),
        "# README\n\n## Installation\n\n```\nnpm install\n```\n\n## Getting Started\n\n![screenshot](img.png)\n\n![badge](https://img.shields.io) A longer string to push past the 300 char threshold. ".repeat(5),
        ""
      );
      const readmeScore = result.subScores.find((s) => s.name === "README")!.score;
      expect(readmeScore).toBeGreaterThanOrEqual(7);
    });
  });

  describe("Structure scoring", () => {
    it("scores higher with src/ dir and test files", () => {
      const tree = "src/\nsrc/index.ts\nsrc/utils.ts\ntests/\ntests/index.test.ts\n.github/\n.gitignore\n.env.example\nREADME.md\ndocker-compose.yml";
      const result = heuristicAnalyse(makeRepo(), "# README", tree);
      const structScore = result.subScores.find((s) => s.name === "Structure")!.score;
      expect(structScore).toBeGreaterThanOrEqual(7);
    });

    it("scores higher with topics and description", () => {
      const result = heuristicAnalyse(
        makeRepo({ topics: ["typescript", "react"], description: "Has description" }),
        "# README",
        "src/\nsrc/index.ts\n.gitignore\n.env.example\n.docker/ci.yml"
      );
      const structScore = result.subScores.find((s) => s.name === "Structure")!.score;
      expect(structScore).toBeGreaterThanOrEqual(5);
    });
  });

  describe("Test scoring", () => {
    it("scores 7 when tests exist", () => {
      const result = heuristicAnalyse(makeRepo(), "# README", "src/\ntests/\n__tests__/");
      const testScore = result.subScores.find((s) => s.name === "Tests")!.score;
      expect(testScore).toBe(7);
    });

    it("scores 2 when no tests exist", () => {
      const result = heuristicAnalyse(makeRepo(), "# README", "src/");
      const testScore = result.subScores.find((s) => s.name === "Tests")!.score;
      expect(testScore).toBe(2);
    });
  });

  describe("Code Quality scoring", () => {
    it("scores base 5 when no license, CI, stars, or forks", () => {
      const result = heuristicAnalyse(
        makeRepo({ license: null, stargazers_count: 0, forks_count: 0 }),
        "# README",
        "src/"
      );
      const cqScore = result.subScores.find((s) => s.name === "Code Quality")!.score;
      expect(cqScore).toBe(5);
    });

    it("scores higher with license, CI, stars, and forks", () => {
      const result = heuristicAnalyse(
        makeRepo({ license: { name: "MIT" }, stargazers_count: 100, forks_count: 20 }),
        "# README",
        "src/\n.github/workflows/ci.yml"
      );
      const cqScore = result.subScores.find((s) => s.name === "Code Quality")!.score;
      expect(cqScore).toBeGreaterThanOrEqual(9);
    });
  });

  describe("Activity scoring", () => {
    it("scores 10 for recently updated repos", () => {
      const result = heuristicAnalyse(
        makeRepo({ updated_at: new Date().toISOString() }),
        "# README",
        "src/"
      );
      const actScore = result.subScores.find((s) => s.name === "Activity")!.score;
      expect(actScore).toBe(10);
    });

    it("scores lower for old repos", () => {
      const oldDate = new Date(Date.now() - 200 * 86400000).toISOString();
      const result = heuristicAnalyse(
        makeRepo({ updated_at: oldDate }),
        "# README",
        "src/"
      );
      const actScore = result.subScores.find((s) => s.name === "Activity")!.score;
      expect(actScore).toBeLessThan(7);
    });
  });

  describe("Issues detection", () => {
    it("flags missing README as critical", () => {
      const result = heuristicAnalyse(makeRepo(), "", "src/");
      expect(result.issues.some((i) => i.severity === "critical" && i.title.includes("README"))).toBe(true);
    });

    it("flags missing tests as critical", () => {
      const result = heuristicAnalyse(makeRepo(), "# README", "src/");
      expect(result.issues.some((i) => i.severity === "critical" && i.title.includes("test"))).toBe(true);
    });

    it("flags missing license as warning", () => {
      const result = heuristicAnalyse(makeRepo({ license: null }), "# README", "src/");
      expect(result.issues.some((i) => i.severity === "warning" && i.title.includes("license"))).toBe(true);
    });
  });

  describe("Hiring readiness", () => {
    it("returns Great Fit for scores >= 8", () => {
      const repo = makeRepo({
        license: { name: "MIT" },
        stargazers_count: 500,
        forks_count: 100,
        topics: ["typescript", "react", "node"],
        description: "An amazing project",
      });
      const tree = "src/\nsrc/index.ts\nsrc/utils.ts\ntests/\ntests/index.test.ts\n.github/workflows/ci.yml\n.gitignore\n.env.example\nREADME.md\ndocker-compose.yml";
      const readme = "# Full\n\n## Installation\n\n## Usage\n\n## Getting Started\n\n![img](img.png)\n\n![badge](https://img.shields.io)\n\nWith lots of content here to make it long enough for the score. ".repeat(10);
      const result = heuristicAnalyse(repo, readme, tree);
      expect(result.hiringReadiness).toBe("Great Fit");
    });

    it("returns Not Ready for scores < 4", () => {
      const result = heuristicAnalyse(makeRepo({ license: null }), "", "");
      expect(result.hiringReadiness).toBe("Not Ready");
    });
  });

  describe("README suggestion generation", () => {
    it("includes the repo name in the generated README", () => {
      const result = heuristicAnalyse(makeRepo({ name: "my-awesome-repo" }), "", "src/");
      expect(result.readmeSuggestion).toContain("my-awesome-repo");
    });

    it("includes the repo language badge", () => {
      const result = heuristicAnalyse(makeRepo({ language: "Rust" }), "", "src/");
      expect(result.readmeSuggestion).toContain("Rust");
    });
  });
});
