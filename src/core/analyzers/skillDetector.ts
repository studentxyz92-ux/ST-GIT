import type { SkillLevel } from "../types.js";

/**
 * Detects developer skills from code analysis signals.
 * Maps file types, patterns, and commit history to recognized skill levels.
 */
export function detectSkills(
  languages: Record<string, number>,
  hasTests: boolean,
  hasCICD: boolean,
  hasDocker: boolean,
  hasDocs: boolean,
  hasAPIDocs: boolean,
  fileCount: number,
  totalStars: number,
  repoCount: number
): SkillLevel[] {
  const skills: SkillLevel[] = [];

  // Language-based skills
  for (const [lang, pct] of Object.entries(languages)) {
    const level = pct >= 50 ? "expert" : pct >= 30 ? "strong" : pct >= 15 ? "intermediate" : "basic";
    // Only include significant languages
    if (pct >= 10) {
      skills.push({
        name: lang,
        level,
        evidence: `${pct}% of code across ${repoCount} repos`,
        percentage: pct,
      });
    }
  }

  // Framework/tech detection from language context
  if (languages["TypeScript"] && languages["TypeScript"] >= 20) {
    skills.push({
      name: "TypeScript",
      level: languages["TypeScript"] >= 50 ? "expert" : languages["TypeScript"] >= 30 ? "strong" : "intermediate",
      evidence: `${languages["TypeScript"]}% of code, type-safe development`,
      percentage: languages["TypeScript"],
    });
  }

  if (languages["JavaScript"] && languages["JavaScript"] >= 20) {
    skills.push({
      name: "JavaScript",
      level: languages["JavaScript"] >= 50 ? "expert" : languages["JavaScript"] >= 30 ? "strong" : "intermediate",
      evidence: `${languages["JavaScript"]}% of code`,
      percentage: languages["JavaScript"],
    });
  }

  if (languages["Python"] && languages["Python"] >= 15) {
    skills.push({
      name: "Python",
      level: languages["Python"] >= 40 ? "expert" : languages["Python"] >= 20 ? "strong" : "intermediate",
      evidence: `${languages["Python"]}% of code`,
      percentage: languages["Python"],
    });
  }

  if (languages["Go"] && languages["Go"] >= 10) {
    skills.push({
      name: "Go",
      level: languages["Go"] >= 30 ? "strong" : "intermediate",
      evidence: `${languages["Go"]}% of code`,
      percentage: languages["Go"],
    });
  }

  if (languages["Rust"] && languages["Rust"] >= 10) {
    skills.push({
      name: "Rust",
      level: languages["Rust"] >= 30 ? "strong" : "intermediate",
      evidence: `${languages["Rust"]}% of code`,
      percentage: languages["Rust"],
    });
  }

  if (languages["Java"] && languages["Java"] >= 10) {
    skills.push({
      name: "Java",
      level: languages["Java"] >= 40 ? "strong" : "intermediate",
      evidence: `${languages["Java"]}% of code`,
      percentage: languages["Java"],
    });
  }

  // Infrastructure skills
  if (hasCICD) {
    skills.push({
      name: "CI/CD",
      level: "strong",
      evidence: "CI/CD pipeline configured in repos",
    });
  }

  if (hasDocker) {
    skills.push({
      name: "Docker",
      level: "strong",
      evidence: "Docker configuration present",
    });
  }

  // Testing
  if (hasTests) {
    skills.push({
      name: "Testing",
      level: "intermediate",
      evidence: `Test files detected across repos`,
    });
  }

  // Documentation
  if (hasDocs) {
    skills.push({
      name: "Documentation",
      level: "strong",
      evidence: "Comprehensive documentation in repos",
    });
  }

  if (hasAPIDocs) {
    skills.push({
      name: "API Design",
      level: "intermediate",
      evidence: "API documentation present",
    });
  }

  // Community signals
  if (totalStars > 50) {
    skills.push({
      name: "Open Source",
      level: totalStars > 200 ? "strong" : "intermediate",
      evidence: `${totalStars} total GitHub stars across repos`,
    });
  }

  return skills;
}
