import type { AnalysisResult } from "../types";

export interface InterviewQuestion {
  id: string;
  category: "technical" | "design" | "system-design" | "behavioral";
  question: string;
  context: string;
  difficulty: "easy" | "medium" | "hard";
  modelAnswer: string;
  keyConcepts: string[];
}

export interface InterviewSession {
  id: string;
  repoName: string;
  questions: InterviewQuestion[];
  createdAt: string;
}

/**
 * Generate interview questions based on a repo analysis.
 * Uses AI if available, falls back to heuristic generation.
 */
export function generateInterviewQuestions(
  result: AnalysisResult,
  repoName: string,
  repos?: Array<{ name: string; language: string | null; score: number }>
): InterviewQuestion[] {
  const questions: InterviewQuestion[] = [];
  const lang = (result.stats.find((s) => s.label === "Language")?.value || "JavaScript").toLowerCase();
  const repoLanguage = capitalizeFirst(lang);

  // ── Questions based on weaknesses ──────────────────────────────────

  // No tests?
  if (result.issues.some((i) => i.title.toLowerCase().includes("test"))) {
    questions.push({
      id: "q-test-1",
      category: "technical",
      question: `Your project has no test coverage. In an interview, the hiring manager asks: "How would you approach adding tests to this codebase? Where would you start?"`,
      context: `Based on ${repoName} — no test files detected.`,
      difficulty: "medium",
      modelAnswer: `I would start by identifying the core business logic and the most critical paths through the application. For ${repoName}, I'd begin with unit tests for the utility/helper functions, then add integration tests for the main API endpoints or user flows. I'd use the testing framework appropriate to the stack (Jest/Vitest for JS/TS, Pytest for Python). I'd aim for 70%+ coverage starting with the most critical paths, then expand to edge cases.`,
      keyConcepts: ["test coverage", "unit testing", "integration testing", "TDD"],
    });
  }

  // Weak README?
  if (result.issues.some((i) => i.title.toLowerCase().includes("readme"))) {
    questions.push({
      id: "q-readme-1",
      category: "behavioral",
      question: `Your README for ${repoName} is minimal. "Walk me through your project as if I'm a senior engineer evaluating it for our team. What were the hardest technical decisions you made?"`,
      context: `Based on ${repoName} — README needs improvement.`,
      difficulty: "medium",
      modelAnswer: `I should be able to clearly articulate: (1) The problem ${repoName} solves, (2) The tech stack choices and why they were made, (3) The hardest technical challenge I faced and how I solved it, (4) What I'd do differently next time. A strong answer shows ownership and technical depth beyond just describing features.`,
      keyConcepts: ["technical communication", "architecture decisions", "project ownership"],
    });
  }

  // Performance issue detected?
  if (result.issues.some((i) => i.title.toLowerCase().includes("performance") || i.title.toLowerCase().includes("complexity"))) {
    questions.push({
      id: "q-perf-1",
      category: "system-design",
      question: `Your ${repoName} project has performance concerns. "How would you optimize the slowest part of this application for 1M users? Walk me through your approach."`,
      context: `Based on ${repoName} — performance issue detected.`,
      difficulty: "hard",
      modelAnswer: `I would: (1) Profile the application to identify bottlenecks using tools like Chrome DevTools or server profiling, (2) Identify the slowest queries or operations, (3) Consider caching strategies (Redis, CDN), (4) Optimize database queries with proper indexing, (5) Consider horizontal scaling, (6) Implement lazy loading and code splitting for frontend, (7) Benchmark before and after each change. For 1M users, I'd also consider microservices for independent scaling.`,
      keyConcepts: ["performance optimization", "scalability", "caching", "profiling"],
    });
  }

  // ── Questions based on language & stack ────────────────────────────

  // TypeScript project
  if (repoLanguage.toLowerCase() === "typescript" || repoLanguage.toLowerCase() === "javascript") {
    questions.push({
      id: "q-ts-1",
      category: "technical",
      question: `I see you use ${repoLanguage}. "What's the difference between types and interfaces in TypeScript? When would you use one over the other?"`,
      context: `${repoName} is a ${repoLanguage} project.`,
      difficulty: "easy",
      modelAnswer: `Interfaces are extendable via 'extends' and can be merged (declaration merging). Types are more flexible — they can represent unions, intersections, primitives, and mapped types. I use interfaces for object shapes that might be extended (e.g., API responses, component props) and types for complex transformations, unions, or when I need computed properties. In recent TypeScript versions, the gap has narrowed significantly.`,
      keyConcepts: ["TypeScript", "type system", "interfaces vs types"],
    });

    questions.push({
      id: "q-arch-1",
      category: "design",
      question: `Looking at ${repoName}, "If you were to rebuild this project from scratch today, what would you do differently architecturally?"`,
      context: `Architectural reflection on ${repoName}.`,
      difficulty: "hard",
      modelAnswer: `I'd evaluate: (1) Better separation of concerns — smaller, more focused modules, (2) Improved error handling with proper error boundaries, (3) More comprehensive testing from day one, (4) Better documentation — JSDoc, ADRs, (5) More consistent code style enforced by linters, (6) Earlier implementation of monitoring and observability.`,
      keyConcepts: ["software architecture", "refactoring", "technical debt"],
    });
  }

  // Python project
  if (repoLanguage.toLowerCase() === "python") {
    questions.push({
      id: "q-py-1",
      category: "technical",
      question: `Your ${repoName} project uses Python. "How do you manage dependencies and virtual environments in your Python projects? What's your preferred approach?"`,
      context: `${repoName} is a Python project.`,
      difficulty: "easy",
      modelAnswer: `I use Poetry for dependency management and virtual environments. It handles both dev and production dependencies cleanly, has a lockfile for reproducible builds, and integrates well with publishing. For simpler projects, I use pip + venv. I always pin dependencies using a lockfile and use pre-commit hooks for code quality.`,
      keyConcepts: ["Python", "dependency management", "Poetry", "virtual environments"],
    });
  }

  // ── General architecture questions ─────────────────────────────────

  questions.push({
    id: "q-gen-1",
    category: "system-design",
    question: `Based on your work in ${repoName}, "How would you design a system that handles the core functionality of your app but needs to scale to 100x the current load?"`,
    context: `Scaling question based on ${repoName}.`,
    difficulty: "hard",
    modelAnswer: `I'd start by understanding the current bottlenecks: (1) Database: add read replicas, implement sharding, optimize slow queries, (2) Caching: implement multi-layer caching (CDN, Redis, in-memory), (3) Async processing: move non-critical tasks to a queue (BullMQ, Celery), (4) Horizontal scaling: make the application stateless so it can scale horizontally behind a load balancer, (5) Monitoring: implement distributed tracing, metrics, and alerting.`,
    keyConcepts: ["system design", "scalability", "distributed systems", "caching"],
  });

  questions.push({
    id: "q-gen-2",
    category: "behavioral",
    question: `"Tell me about a time you had to make a significant technical decision in ${repoName || "one of your projects"}."`,
    context: `Behavioral question based on project experience.`,
    difficulty: "medium",
    modelAnswer: `Use the STAR method: (S)ituation — what was the context, (T)ask — what needed to be decided, (A)ction — what alternatives did you consider and why did you choose the approach you did, (R)esult — what was the outcome. The best answers include tradeoffs you considered and why you made the choice.`,
    keyConcepts: ["behavioral interview", "technical decision making", "STAR method"],
  });

  // Ensure we generate 5 questions minimum
  if (questions.length < 5) {
    const fallbacks: InterviewQuestion[] = [
      {
        id: "q-fallback-1",
        category: "technical",
        question: `"Describe your development workflow for a typical feature in ${repoName}. From idea to deployment, walk me through your process."`,
        context: `Understanding the developer's workflow.`,
        difficulty: "medium",
        modelAnswer: `My workflow: (1) Understand requirements and clarify edge cases, (2) Design the solution — consider API changes, database migrations, UI changes, (3) Write tests first (TDD) or alongside implementation, (4) Implement the feature in small, focused commits, (5) Run tests and linting locally, (6) Create a PR with clear description and screenshots if applicable, (7) Address review feedback, (8) Merge after CI passes and approvals are received, (9) Monitor the deployment for any issues.`,
        keyConcepts: ["workflow", "development process", "code review", "deployment"],
      },
      {
        id: "q-fallback-2",
        category: "design",
        question: `${repoName} uses a specific tech stack. "Why did you choose these technologies? What alternatives did you consider?"`,
        context: `Technology choice rationale.`,
        difficulty: "medium",
        modelAnswer: `I should be able to articulate: (1) The problem each technology solves, (2) Alternatives considered and why they were rejected, (3) Tradeoffs made (e.g., performance vs. developer experience, learning curve vs. long-term maintainability, ecosystem maturity vs. innovation), (4) Whether I'd make the same choices today.`,
        keyConcepts: ["technology choices", "tradeoff analysis", "decision making"],
      },
    ];
    questions.push(...fallbacks.slice(0, 5 - questions.length));
  }

  return questions.slice(0, 7); // Max 7 questions per session
}

function capitalizeFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Generate feedback for a user's answer.
 */
export function generateAnswerFeedback(
  question: InterviewQuestion,
  userAnswer: string
): string {
  const answerLength = userAnswer.trim().split(/\s+/).length;

  let feedback = "";
  const issues: string[] = [];
  const strengths: string[] = [];

  if (answerLength < 20) {
    issues.push("Your answer is too brief. Expand with specific examples.");
  } else {
    strengths.push("Good length — you provided substantial detail.");
  }

  // Check for key concepts
  const matchedConcepts = question.keyConcepts.filter((c) =>
    userAnswer.toLowerCase().includes(c.toLowerCase())
  );
  const missingConcepts = question.keyConcepts.filter(
    (c) => !userAnswer.toLowerCase().includes(c.toLowerCase())
  );

  if (matchedConcepts.length > 0) {
    strengths.push(`You mentioned: ${matchedConcepts.join(", ")}`);
  }
  if (missingConcepts.length > 0) {
    issues.push(`Consider addressing: ${missingConcepts.join(", ")}`);
  }

  // Check for structure
  if (userAnswer.includes("first") || userAnswer.includes("second") || userAnswer.includes("then")) {
    strengths.push("Well-structured answer with logical flow.");
  }

  // Check for specificity
  if (/\d+/.test(userAnswer)) {
    strengths.push("Good use of numbers/metrics to back up your points.");
  }

  if (issues.length > 0) {
    feedback = `📝 Feedback:\n${strengths.map((s) => `✅ ${s}`).join("\n")}\n\n${issues.map((i) => `⚠️  ${i}`).join("\n")}\n\n💡 Model Answer:\n${question.modelAnswer}`;
  } else {
    feedback = `✅ Strong answer!\n${strengths.map((s) => `✅ ${s}`).join("\n")}\n\nFor comparison:\n💡 Model Answer:\n${question.modelAnswer}`;
  }

  return feedback;
}
