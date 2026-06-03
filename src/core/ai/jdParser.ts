/**
 * Parses job descriptions to extract structured requirements.
 * Uses keyword matching with fallback to AI-powered extraction.
 */

interface ParsedJD {
  title: string;
  company?: string;
  required: string[];
  preferred: string[];
  experience: string;
  responsibilities: string[];
  skills: string[];
}

const SKILL_KEYWORDS = [
  "TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "Kotlin",
  "Swift", "Ruby", "PHP", "C++", "C#", "Scala", "Elixir",
  "React", "Vue", "Angular", "Svelte", "Next.js", "Nuxt",
  "Node.js", "Express", "Fastify", "Django", "Flask", "Spring Boot",
  "GraphQL", "REST", "gRPC", "WebSocket",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
  "Docker", "Kubernetes", "Terraform", "Ansible",
  "AWS", "GCP", "Azure", "Cloud",
  "CI/CD", "GitHub Actions", "Jenkins", "CircleCI",
  "Testing", "Jest", "Vitest", "Cypress", "Playwright",
  "Machine Learning", "AI", "Deep Learning", "TensorFlow", "PyTorch",
  "System Design", "Architecture", "Microservices",
  "Agile", "Scrum", "Leadership", "Mentoring",
];

const EXPERIENCE_PATTERNS = [
  /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?experience/i,
  /(?:years?|yrs?)\s*(?:of\s*)?experience\s*:?\s*(\d+)/i,
  /(\d+)\s*-\s*(\d+)\s*(?:years?|yrs?)/i,
];

/**
 * Parse a job description text into structured requirements.
 * Works via keyword extraction and pattern matching.
 */
export function parseJobDescription(jdText: string): ParsedJD {
  const lines = jdText.split("\n").filter(Boolean);
  const text = jdText;

  // Extract title (first non-empty line or line with common title patterns)
  let title = "Software Engineer";
  const titlePatterns = [
    /(?:title|role|position):\s*(.+)/i,
    /(?:senior|staff|lead|principal|junior|mid).*(?:engineer|developer|architect)/i,
    /(?:frontend|backend|full.?stack|devops|data|mobile|ml).*(?:engineer|developer)/i,
  ];
  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match) {
      title = match[1] || match[0];
      break;
    }
  }
  title = title.trim().replace(/^(title|role|position):\s*/i, "");

  // Extract company
  let company: string | undefined;
  const companyPattern = /(?:company|organization|team):\s*(.+)/i;
  const companyMatch = text.match(companyPattern);
  if (companyMatch) company = companyMatch[1].trim();

  // Extract experience requirement
  let experience = "N/A";
  for (const pattern of EXPERIENCE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      if (match[2]) {
        experience = `${match[1]}-${match[2]} years`;
      } else {
        experience = `${match[1]}+ years`;
      }
      break;
    }
  }

  // Extract skills
  const foundSkills = new Set<string>();
  const txtLower = text.toLowerCase();

  for (const skill of SKILL_KEYWORDS) {
    if (txtLower.includes(skill.toLowerCase())) {
      foundSkills.add(skill);
    }
  }

  // Categorize as required vs preferred based on context
  const required: string[] = [];
  const preferred: string[] = [];

  // Section-based categorization
  const sections = splitIntoSections(lines);

  for (const skill of foundSkills) {
    const skillLower = skill.toLowerCase();

    // Check if it appears in "preferred" or "nice to have" sections
    const inPreferredSection = sections.preferred.some((l) =>
      l.toLowerCase().includes(skillLower)
    );
    const inRequiredSection = sections.required.some((l) =>
      l.toLowerCase().includes(skillLower)
    );

    // Check if it's near "preferred" / "nice to have" keywords
    const nearPreferred = sections.other.some((l) =>
      /preferred|nice.?to.?have|bonus|plus|good.?to.?have/i.test(l) &&
      l.toLowerCase().includes(skillLower)
    );

    if (nearPreferred || inPreferredSection) {
      preferred.push(skill);
    } else if (inRequiredSection || !inPreferredSection) {
      required.push(skill);
    }
  }

  // Extract responsibilities
  const responsibilities: string[] = [];
  const respSection = extractSection(lines, [
    /responsibilities|what you.ll do|the role|key duties/i,
  ]);
  for (const line of respSection) {
    const clean = line.replace(/^[-•*]\s*/, "").trim();
    if (clean.length > 10 && !clean.startsWith("```")) {
      responsibilities.push(clean);
    }
  }

  // Compile all skills
  const allSkills = [...new Set([...required, ...preferred])];

  return {
    title: title.trim(),
    company,
    required: [...new Set(required)],
    preferred: [...new Set(preferred)],
    experience,
    responsibilities: responsibilities.slice(0, 8),
    skills: allSkills,
  };
}

function splitIntoSections(lines: string[]): {
  required: string[];
  preferred: string[];
  other: string[];
} {
  const required: string[] = [];
  const preferred: string[] = [];
  const other: string[] = [];

  let currentSection = "other";

  for (const line of lines) {
    if (/requirements|qualifications|what you need|must.?have/i.test(line)) {
      currentSection = "required";
      continue;
    }
    if (/preferred|nice.?to.?have|bonus|plus/i.test(line)) {
      currentSection = "preferred";
      continue;
    }
    if (/responsibilities|what you.ll do|about the role/i.test(line)) {
      currentSection = "other";
      continue;
    }

    if (currentSection === "required") required.push(line);
    else if (currentSection === "preferred") preferred.push(line);
    else other.push(line);
  }

  return { required, preferred, other };
}

function extractSection(lines: string[], patterns: RegExp[]): string[] {
  let found = false;
  const section: string[] = [];

  for (const line of lines) {
    if (!found) {
      if (patterns.some((p) => p.test(line))) {
        found = true;
      }
      continue;
    }

    // Stop at next section header
    if (/^#{1,3}\s|^##/i.test(line) || /^[A-Z][A-Z\s]+$/i.test(line)) {
      break;
    }

    if (line.trim()) {
      section.push(line.trim());
    }
  }

  return section;
}
