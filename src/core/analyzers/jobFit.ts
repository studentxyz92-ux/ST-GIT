import type { JobFitResult, GapAnalysis, SkillLevel, CareerTimeline } from "../types.js";

interface ParsedRequirements {
  title: string;
  required: string[];
  preferred: string[];
  experience: string;
}

/**
 * Compute how well a developer fits a specific job description by
 * comparing their detected skills from code analysis vs. job requirements.
 */
export function computeJobFit(
  skills: SkillLevel[],
  timeline: CareerTimeline,
  languages: Record<string, number>,
  testRatio: number,
  title: string,
  requirements?: ParsedRequirements
): JobFitResult {
  // Build requirement mapping from common role expectations
  const roleRequirements = requirements || getDefaultRequirements(title);

  const strongMatches: JobFitResult["strongMatches"] = [];
  const gaps: JobFitResult["gaps"] = [];

  for (const req of roleRequirements.required) {
    const userSkill = findMatchingSkill(skills, req, languages);
    if (userSkill) {
      strongMatches.push({
        skill: req,
        required: "Required",
        user: userSkill.level === "expert" ? "Expert" : userSkill.level === "strong" ? "Strong" : "Present",
      });
    } else {
      const fixSteps = generateFixSteps(req);
      gaps.push({
        skill: req,
        required: "Required",
        user: "Not detected",
        fixSteps,
      });
    }
  }

  for (const pref of roleRequirements.preferred) {
    const userSkill = findMatchingSkill(skills, pref, languages);
    if (!userSkill) {
      gaps.push({
        skill: pref,
        required: "Preferred",
        user: "Not detected",
        fixSteps: generateFixSteps(pref),
      });
    }
  }

  const score = computeMatchScore(strongMatches.length, gaps.length, roleRequirements);
  const steps = generateOverallSteps(gaps, testRatio);
  const verdict = generateVerdict(score, gaps.length);
  const estimatedTime = estimateTimeToFullMatch(gaps);

  return {
    score,
    title,
    strongMatches,
    gaps,
    steps,
    verdict,
    estimatedTime,
  };
}

/**
 * Analyze gaps between current skill level and a target role.
 */
export function computeGaps(
  skills: SkillLevel[],
  timeline: CareerTimeline,
  targetRole: string,
  currentLevel?: string
): GapAnalysis {
  const reqs = getDefaultRequirements(targetRole);
  const gaps: GapAnalysis["gaps"] = [];
  let matchedCount = 0;
  let totalRequired = 0;

  for (const req of reqs.required) {
    totalRequired++;
    const userSkill = findMatchingSkill(skills, req, {});
    if (!userSkill) {
      gaps.push({
        area: req,
        severity: "critical",
        description: `Missing required skill: ${req}`,
        howToFix: generateFixSteps(req)[0] || `Build experience with ${req}`,
      });
    } else if (userSkill.level === "basic" || userSkill.level === "intermediate") {
      gaps.push({
        area: req,
        severity: "warning",
        description: `${req} at ${userSkill.level} level, needs to be stronger`,
        howToFix: `Deepen ${req} knowledge through advanced projects`,
      });
    } else {
      matchedCount++;
    }
  }

  for (const pref of reqs.preferred) {
    const userSkill = findMatchingSkill(skills, pref, {});
    if (!userSkill || userSkill.level === "basic") {
      gaps.push({
        area: pref,
        severity: "info",
        description: `Missing preferred skill: ${pref}`,
        howToFix: generateFixSteps(pref)[0] || `Learn ${pref}`,
      });
    }
  }

  const overallReadiness = totalRequired > 0
    ? Math.round((matchedCount / totalRequired) * 100)
    : 0;

  const levelLabel = currentLevel || getCurrentLevelLabel(timeline.trajectory);
  return {
    targetRole,
    currentLevel: levelLabel,
    gaps: gaps.slice(0, 10),
    overallReadiness,
  };
}

// ── Helpers ───────────────────────────────────────────────────

function findMatchingSkill(
  skills: SkillLevel[],
  requirement: string,
  languages: Record<string, number>
): SkillLevel | null {
  const reqLower = requirement.toLowerCase();

  // Check detected skills
  for (const skill of skills) {
    if (skill.name.toLowerCase().includes(reqLower) || reqLower.includes(skill.name.toLowerCase())) {
      return skill;
    }
  }

  // Check languages
  for (const lang of Object.keys(languages)) {
    if (lang.toLowerCase().includes(reqLower) || reqLower.includes(lang.toLowerCase())) {
      return {
        name: lang,
        level: languages[lang] > 40 ? "strong" : languages[lang] > 20 ? "intermediate" : "basic",
        evidence: `${languages[lang]}% of codebase`,
        percentage: languages[lang],
      };
    }
  }

  return null;
}

function getDefaultRequirements(title: string): ParsedRequirements {
  const t = title.toLowerCase();

  const seniorPatterns = /senior|staff|lead|principal|sr\.?/i;
  const isSenior = seniorPatterns.test(t);
  const isReact = /react|frontend|front-end|ui/i.test(t);
  const isBackend = /backend|back-end|api|server|engineer/i.test(t);
  const isFullStack = /full.?stack/i.test(t);
  const isDevOps = /devops|sre|infra|platform|cloud/i.test(t);
  const isData = /data|ml|ai|analytics/i.test(t);
  const isMobile = /mobile|react.?native|swift|kotlin|android|ios/i.test(t);

  const required: string[] = [];
  const preferred: string[] = [];

  // Base requirements for all
  required.push("TypeScript", "JavaScript", "Git", "Testing");
  if (isSenior) {
    required.push("System Design", "Architecture", "Code Review");
    preferred.push("Distributed Systems", "Mentoring", "Technical Writing");
  }

  if (isReact || isFullStack) {
    required.push("React", "CSS", "HTML");
    preferred.push("Next.js", "State Management", "Storybook", "Webpack/Vite");
  }
  if (isBackend || isFullStack) {
    required.push("Node.js", "REST APIs", "Databases (SQL/NoSQL)");
    preferred.push("GraphQL", "gRPC", "Message Queues", "Docker", "Kubernetes");
  }
  if (isDevOps) {
    required.push("Docker", "CI/CD", "Cloud (AWS/GCP/Azure)", "Linux");
    preferred.push("Kubernetes", "Terraform", "Ansible", "Monitoring");
  }
  if (isData) {
    required.push("Python", "SQL", "Data Structures");
    preferred.push("Machine Learning", "TensorFlow/PyTorch", "Spark");
  }
  if (isMobile) {
    required.push("Mobile Development", "REST APIs");
    preferred.push("Push Notifications", "Offline Storage", "App Store Deployment");
  }

  // Default for general engineering roles
  if (required.length < 3) {
    required.push("Programming Fundamentals", "Version Control", "Problem Solving");
    preferred.push("Agile/Scrum", "Communication", "API Design");
  }

  return {
    title,
    required,
    preferred,
    experience: isSenior ? "5+" : "2+",
  };
}

function computeMatchScore(
  strongCount: number,
  gapCount: number,
  reqs: ParsedRequirements
): number {
  const total = reqs.required.length + reqs.preferred.length * 0.5;
  if (total === 0) return 50;
  const matched = strongCount;
  const penalized = gapCount * 0.3;
  const raw = ((matched - penalized) / total) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

function generateFixSteps(skill: string): string[] {
  const s = skill.toLowerCase();
  const steps: string[] = [];

  if (s.includes("typescript") || s.includes("type")) {
    steps.push("Convert one existing JS project to TypeScript");
    steps.push("Add strict TypeScript config and fix all type errors");
  } else if (s.includes("test") || s.includes("jest") || s.includes("vitest")) {
    steps.push("Add unit tests to your best project (aim for 40%+ coverage)");
    steps.push("Add a CI step that runs tests on every PR");
  } else if (s.includes("docker") || s.includes("container")) {
    steps.push("Add a Dockerfile and docker-compose.yml to a project");
    steps.push("Deploy using Docker on a cloud platform");
  } else if (s.includes("ci") || s.includes("cd")) {
    steps.push("Add a GitHub Actions workflow that runs tests and lint");
    steps.push("Add a deployment workflow (Vercel/Netlify/AWS)");
  } else if (s.includes("api") || s.includes("rest") || s.includes("graphql")) {
    steps.push("Build a REST API with proper error handling and validation");
    steps.push("Document your API with OpenAPI/Swagger");
  } else if (s.includes("react") || s.includes("vue") || s.includes("angular")) {
    steps.push("Build a non-trivial app with proper component architecture");
    steps.push("Add state management and routing");
  } else if (s.includes("system design") || s.includes("architecture")) {
    steps.push("Write an architecture.md for your largest project");
    steps.push("Design a system that handles 1M+ requests");
  } else {
    steps.push(`Build a project demonstrating ${skill}`);
    steps.push(`Document your ${skill} knowledge in a blog post or README`);
  }

  return steps;
}

function generateOverallSteps(
  gaps: JobFitResult["gaps"],
  testRatio: number
): string[] {
  const steps: string[] = [];

  if (gaps.length > 0) {
    steps.push(`Build projects demonstrating: ${gaps.slice(0, 3).map((g) => g.skill).join(", ")}`);
  }
  if (testRatio < 0.3) {
    steps.push(`Improve test coverage (current: ${Math.round(testRatio * 100)}%). Aim for 40%+`);
  }
  steps.push("Contribute to open source to demonstrate collaborative skills");
  steps.push("Write technical blog posts about your projects");

  return steps.slice(0, 4);
}

function generateVerdict(score: number, gapCount: number): string {
  if (score >= 85) return "Excellent match. You're ready to apply and interview.";
  if (score >= 70) return "Strong match. Apply now and prepare for the gaps in interviews.";
  if (score >= 50) return "Moderate match. Focus on closing key gaps before applying.";
  if (score >= 30) return "Weak match. Significant work needed to be competitive.";
  return "Not a good fit currently. Consider a different role or invest 3-6 months in skill building.";
}

function estimateTimeToFullMatch(gaps: JobFitResult["gaps"]): string {
  const criticalCount = gaps.filter((g) => g.required === "Required").length;
  if (criticalCount <= 1) return "1-2 weeks of focused work";
  if (criticalCount <= 3) return "2-4 weeks of focused work";
  if (criticalCount <= 5) return "4-8 weeks of focused work";
  return "8+ weeks of focused work";
}

function getCurrentLevelLabel(trajectory: CareerTimeline["trajectory"]): string {
  switch (trajectory) {
    case "junior": return "Junior Developer";
    case "mid": return "Mid-Level Developer";
    case "senior": return "Senior Developer";
    case "staff": return "Staff/Lead Developer";
  }
}
