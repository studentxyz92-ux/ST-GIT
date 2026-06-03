import type { SkillLevel } from "../types.js";

interface GapAdvice {
  area: string;
  severity: "critical" | "warning" | "info";
  description: string;
  steps: string[];
  resources?: string[];
  estimatedTime: string;
}

/**
 * Analyzes skill gaps and generates personalized, actionable advice
 * for closing each gap.
 */
export function generateGapAdvice(
  currentSkills: SkillLevel[],
  requiredSkills: string[],
  preferredSkills: string[],
  testRatio: number,
  repoCount: number
): GapAdvice[] {
  const advice: GapAdvice[] = [];
  const currentSkillNames = new Set(currentSkills.map((s) => s.name.toLowerCase()));

  // Check required skills
  for (const req of requiredSkills) {
    const reqLower = req.toLowerCase();
    const matching = currentSkills.find(
      (s) => s.name.toLowerCase().includes(reqLower) || reqLower.includes(s.name.toLowerCase())
    );

    if (!matching) {
      advice.push(generateAdviceForSkill(req, "critical", currentSkillNames));
    } else if (matching.level === "basic" || matching.level === "intermediate") {
      advice.push({
        area: req,
        severity: "warning",
        description: `${req} detected at ${matching.level} level — needs to be stronger`,
        steps: [
          `Build an advanced project focused on ${req}`,
          `Contribute to an open-source ${req} project`,
          `Write about ${req} to solidify understanding`,
        ],
        estimatedTime: "2-4 weeks",
      });
    }
  }

  // Check preferred skills
  for (const pref of preferredSkills) {
    const prefLower = pref.toLowerCase();
    const matching = currentSkills.find(
      (s) => s.name.toLowerCase().includes(prefLower) || prefLower.includes(s.name.toLowerCase())
    );

    if (!matching) {
      advice.push(generateAdviceForSkill(pref, "info", currentSkillNames));
    }
  }

  // General advice
  if (testRatio < 0.2) {
    advice.push({
      area: "Testing",
      severity: "warning",
      description: `Test coverage is low (${Math.round(testRatio * 100)}%). Most roles expect 40%+ coverage.`,
      steps: [
        "Add unit tests to your main project using Jest/Vitest",
        "Set up CI to run tests automatically",
        "Practice TDD on your next project",
      ],
      estimatedTime: "1-3 weeks",
    });
  }

  if (repoCount < 3) {
    advice.push({
      area: "Portfolio Depth",
      severity: "info",
      description: "Only a few repos analyzed. More projects demonstrate breadth.",
      steps: [
        "Build 2-3 more projects in different domains",
        "Contribute to existing open-source projects",
        "Document all projects with good READMEs",
      ],
      estimatedTime: "4-8 weeks",
    });
  }

  return advice;
}

function generateAdviceForSkill(
  skill: string,
  severity: "critical" | "warning" | "info",
  currentSkills: Set<string>
): GapAdvice {
  const s = skill.toLowerCase();

  if (s.includes("typescript") || s.includes("type")) {
    return {
      area: skill,
      severity,
      description: `No TypeScript detected in your repos. TypeScript is now expected for most professional roles.`,
      steps: [
        "Convert a JavaScript project to TypeScript",
        "Add strict TypeScript configuration",
        "Learn advanced types: generics, utility types, conditional types",
      ],
      resources: ["TypeScript Handbook", "TypeScript Challenges"],
      estimatedTime: "2-3 weeks",
    };
  }

  if (s.includes("test") || s.includes("jest") || s.includes("vitest")) {
    return {
      area: skill,
      severity,
      description: "No testing framework detected. Testing skills are essential for professional roles.",
      steps: [
        "Add unit tests to your best project",
        "Add integration tests for API endpoints",
        "Learn testing patterns: mocks, fixtures, snapshot testing",
      ],
      estimatedTime: "1-2 weeks",
    };
  }

  if (s.includes("docker") || s.includes("container")) {
    return {
      area: skill,
      severity,
      description: "Docker not detected in your repos. Containerization is a standard expectation.",
      steps: [
        "Add a Dockerfile to your main project",
        "Add docker-compose.yml with services",
        "Learn Docker best practices: multistage builds, layer caching",
      ],
      estimatedTime: "1-2 weeks",
    };
  }

  if (s.includes("ci") || s.includes("cd")) {
    return {
      area: skill,
      severity,
      description: "No CI/CD pipeline detected. Automated testing and deployment is standard practice.",
      steps: [
        "Add GitHub Actions workflow for testing",
        "Add linting and type-checking to CI",
        "Set up automated deployment",
      ],
      estimatedTime: "1 week",
    };
  }

  if (s.includes("api") || s.includes("rest") || s.includes("graphql")) {
    return {
      area: skill,
      severity,
      description: `No ${skill} expertise detected in your code.`,
      steps: [
        `Build a project that demonstrates ${skill}`,
        "Add proper error handling and validation",
        "Document your API with OpenAPI/Swagger",
      ],
      estimatedTime: "2-4 weeks",
    };
  }

  if (s.includes("react") || s.includes("vue") || s.includes("angular")) {
    return {
      area: skill,
      severity,
      description: `No ${skill} projects detected.`,
      steps: [
        `Build a non-trivial ${skill} application`,
        "Add state management and routing",
        "Add end-to-end tests",
      ],
      estimatedTime: "3-4 weeks",
    };
  }

  if (s.includes("system") || s.includes("architecture") || s.includes("design")) {
    return {
      area: skill,
      severity,
      description: "No system design artifacts found. Senior roles require architectural thinking.",
      steps: [
        "Write an architecture.md for your largest project",
        "Design a system that handles 1M+ users",
        "Learn common patterns: CQRS, Event Sourcing, Microservices",
      ],
      resources: ["System Design Interview (Alex Xu)", "Awesome System Design"],
      estimatedTime: "4-8 weeks",
    };
  }

  return {
    area: skill,
    severity,
    description: `${skill} not detected in your code.`,
    steps: [
      `Build a project showcasing ${skill}`,
      `Document your ${skill} knowledge`,
      `Contribute to an open-source ${skill} project`,
    ],
    estimatedTime: "2-4 weeks",
  };
}
