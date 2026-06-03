export type ScoreColor = "green" | "amber" | "red" | "indigo";

export interface SubScore {
  name: string;
  score: number;
  icon: string;
  color: ScoreColor;
}

export interface Issue {
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
}

export interface Suggestion {
  title: string;
  detail: string;
}

export interface ResumeTip {
  icon: string;
  title: string;
  text: string;
}

export interface AnalysisResult {
  overallScore: number;
  hiringReadiness: "Great Fit" | "Good Candidate" | "Needs Work" | "Not Ready";
  hiringReadinessClass: "great" | "good" | "average" | "poor";
  summary: string;
  subScores: SubScore[];
  issues: Issue[];
  suggestions: Suggestion[];
  readmeSuggestion: string;
  resumeTips: ResumeTip[];
  strengths: string[];
  stats: { label: string; value: string }[];
}

export interface RepoAnalysisInput {
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
  html_url: string;
  default_branch: string;
  visibility: string;
  owner: { login: string; avatar_url: string };
}

export interface RepoFile {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
}

export interface TreeEntry {
  path: string;
  type: string;
}

export interface UserRepo {
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  updated_at: string;
  created_at: string;
  fork: boolean;
  archived: boolean;
  default_branch: string;
  html_url: string;
}

// ── Career / Timeline types ──────────────────────────────────

export interface LocalRepoMetrics {
  languageBytes: Record<string, number>;
  fileCount: number;
  testRatio: number;
  commitCount: number;
  authorCount: number;
  avgCommitSize: number;
  hasCICD: boolean;
  lastCommitDaysAgo: number;
  readmeLength: number;
  hasLicense: boolean;
}

export interface TimelineYear {
  year: number;
  languages: Record<string, number>;
  avgScore: number;
  repoCount: number;
  milestones: string[];
}

export interface CareerTimeline {
  years: TimelineYear[];
  trajectory: "junior" | "mid" | "senior" | "staff";
  nextPrediction: string;
  overallScore: number;
}

export interface SkillLevel {
  name: string;
  level: "expert" | "strong" | "intermediate" | "basic" | "not-detected";
  evidence: string;
  percentage?: number;
}

export interface JobFitResult {
  score: number;
  title: string;
  strongMatches: { skill: string; required: string; user: string }[];
  gaps: { skill: string; required: string; user: string; fixSteps: string[] }[];
  steps: string[];
  verdict: string;
  estimatedTime: string;
}

export interface GapAnalysis {
  targetRole: string;
  currentLevel: string;
  gaps: { area: string; severity: "critical" | "warning" | "info"; description: string; howToFix: string }[];
  overallReadiness: number;
}

// ── Credential types ─────────────────────────────────────────

export interface DevCredential {
  version: string;
  type: "DevScoreCredential";
  issuer: string;
  issued_at: string;
  expires_at: string;
  subject: {
    github_username: string;
    github_verified: boolean;
  };
  score: {
    overall: number;
    readme: number;
    structure: number;
    tests: number;
    quality: number;
    activity: number;
  };
  verifiedSkills: SkillLevel[];
  signature: string;
}

// ── Git archaeology types ────────────────────────────────────

export interface CareerChapter {
  title: string;
  period: string;
  narrative: string;
  highlights: string[];
  score?: number;
}

export interface ExcavationResult {
  chapters: CareerChapter[];
  totalCommits: number;
  totalRepos: number;
  languageEvolution: { year: number; languages: Record<string, number> }[];
  peakProductivity: { period: string; avgCommitsPerWeek: number };
  codePatterns: { pattern: string; frequency: number; type: "good" | "bad" }[];
  narrative: string;
}

// ── Contributor DNA types ────────────────────────────────────

export interface ContributorDNA {
  primaryType: string;
  primaryPercent: number;
  secondaryType: string;
  secondaryPercent: number;
  tertiaryType: string;
  tertiaryPercent: number;
  strengths: string[];
  growthAreas: string[];
  languages: Record<string, number>;
  commitHygiene: { consistent: boolean; avgCommitsPerWeek: number };
  peakActivity: { days: string[]; timeRange: string };
  overallScore: number;
}

// ── Auth types ───────────────────────────────────────────────

export type AuthProvider = "github" | "gitlab" | "bitbucket";

export interface AuthProfile {
  token: string;
  provider: AuthProvider;
  provider_username: string;
  avatar_url?: string;
  name?: string;
  email?: string;
  added_at: string;
  expires_at?: string;
  scopes?: string[];
  /** API keys generated from this profile */
  apiKeys?: ApiKeyEntry[];
}

export interface CredentialStore {
  active: string;
  profiles: Record<string, AuthProfile>;
}

export interface ApiKeyEntry {
  id: string;
  keyPrefix: string;
  name: string;
  scopes: string[];
  created_at: string;
  expires_at?: string;
  last_used_at?: string;
}

// ── Web app auth types ───────────────────────────────────────

export interface SessionUser {
  id: string;
  provider: AuthProvider;
  providerAccountId: string;
  username: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  accessToken: string;
  tokenExpiresAt?: string;
}

export interface AuthMiddlewareOptions {
  /** Require a valid JWT session (web) */
  requireSession?: boolean;
  /** Require a valid API key or JWT */
  requireAuth?: boolean;
  /** Required scopes for API key access */
  requiredScopes?: string[];
  /** Allow unauthenticated requests */
  optional?: boolean;
}

export interface AuthValidationResult {
  valid: boolean;
  type: "session" | "api_key" | "none";
  user?: SessionUser;
  error?: string;
}

// ── Provider config types ────────────────────────────────────

export interface ProviderConfig {
  id: AuthProvider;
  name: string;
  color: string;
  deviceCodeUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
  userInfoUrl: string;
  defaultScopes: string[];
  clientIdEnvVar: string;
  /** OAuth app client ID (set via env) */
  getClientId: () => string;
}

// ── Rate limit types ─────────────────────────────────────────

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// ── Fix file types (for Repo Doctor) ─────────────────────────

export interface FixFile {
  path: string;
  content: string;
  description: string;
  language: string;
}
