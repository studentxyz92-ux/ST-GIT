import type { ConflictSection } from "../conflictParser";

export interface ConflictExplanation {
  whatHappened: string;
  risk: "low" | "medium" | "high";
  recommendedResolution: string;
  suggestion: string;
}

/**
 * Generate a plain-English explanation of why a conflict happened.
 * Uses static analysis when AI is unavailable.
 */
export function explainConflict(
  section: ConflictSection,
  filePath: string
): ConflictExplanation {
  const currentLines = section.currentBranchContent.split("\n").filter(Boolean);
  const incomingLines = section.incomingBranchContent.split("\n").filter(Boolean);

  const currFirstLine = currentLines[0] || "";
  const incFirstLine = incomingLines[0] || "";

  // Detect what changed in each side
  const currentSummary = summarizeChanges(currentLines, "current");
  const incomingSummary = summarizeChanges(incomingLines, "incoming");

  const risk = assessRisk(filePath, currentLines, incomingLines);

  const whatHappened = `Two branches modified the same section of ${filePath} around line ${section.startLine}.`;
  const detail = `Your branch (${currentSummary}) while the branch you're merging into ${incomingSummary}.`;

  const recommendedResolution = generateRecommendedResolution(
    currentLines,
    incomingLines,
    filePath
  );

  const suggestion = risk === "high"
    ? "⚠️  Review carefully: this change touches critical logic. Consider discussing with your team before resolving."
    : risk === "medium"
    ? "Both changes appear compatible but should be verified. Look for any implicit dependencies on the changed code."
    : "Low-risk merge. The conflict is in a self-contained section that can be safely merged.";

  return {
    whatHappened: `${whatHappened}\n${detail}`,
    risk,
    recommendedResolution,
    suggestion,
  };
}

function summarizeChanges(lines: string[], label: string): string {
  if (lines.length === 0) return `deleted content`;

  // Check for common patterns
  const joined = lines.join(" ");

  if (joined.includes("import ") || joined.includes("require(")) {
    return `${label === "current" ? "added" : "added"} new imports/dependencies`;
  }
  if (/function\s+\w+\s*\(/.test(joined) || /const\s+\w+\s*=\s*\(/.test(joined)) {
    return `${label === "current" ? "added" : "added"} a new function or method`;
  }
  if (/interface\s+\w+|type\s+\w+\s*=/.test(joined)) {
    return `${label === "current" ? "added" : "added"} a new type definition`;
  }
  if (joined.includes("export")) {
    return `${label === "current" ? "added" : "added"} a new export`;
  }
  if (/if\s*\(/.test(joined) || /switch\s*\(/.test(joined)) {
    return `${label === "current" ? "modified" : "modified"} a conditional block`;
  }

  return `${label === "current" ? "modified" : "modified"} ${lines.length} line${lines.length > 1 ? "s" : ""}`;
}

function assessRisk(
  filePath: string,
  current: string[],
  incoming: string[]
): "low" | "medium" | "high" {
  // High-risk patterns
  const highRiskPatterns = [/password/i, /secret/i, /token/i, /auth/i, /schema/i, /migration/i];
  const joined = [...current, ...incoming].join(" ");

  for (const pattern of highRiskPatterns) {
    if (pattern.test(joined) && pattern.test(filePath)) {
      return "high";
    }
  }

  // Medium risk: function signatures, exports
  const medRiskPatterns = [/function/, /export/, /interface/, /class\s+\w+/];
  for (const pattern of medRiskPatterns) {
    if (pattern.test(joined)) {
      return "medium";
    }
  }

  return "low";
}

function generateRecommendedResolution(
  current: string[],
  incoming: string[],
  filePath: string
): string {
  // If both sides add different things, keep both
  if (current.length > 0 && incoming.length > 0) {
    return "Keep both changes. The current and incoming modifications are compatible — integrate them in order.";
  }

  // If one side deletes and the other adds, prefer the addition
  if (current.length === 0 && incoming.length > 0) {
    return "Accept incoming changes. Your branch deleted content that the other branch modified.";
  }
  if (current.length > 0 && incoming.length === 0) {
    return "Keep your changes. The other branch deleted content you modified.";
  }

  return "Review both changes manually. No clear automatic resolution exists.";
}

/**
 * Explain conflicts in batch with a summary.
 */
export function explainConflicts(
  sections: ConflictSection[],
  filePaths: string[]
): {
  explanations: Array<{ path: string; line: number; explanation: ConflictExplanation }>;
  summary: string;
  totalConflicts: number;
  highRiskCount: number;
} {
  const explanations = sections.map((s) => ({
    path: s.path,
    line: s.startLine,
    explanation: explainConflict(s, s.path),
  }));

  const highRiskCount = explanations.filter((e) => e.explanation.risk === "high").length;

  let summary: string;
  if (sections.length === 0) {
    summary = "No conflicts detected. This PR is conflict-free.";
  } else if (highRiskCount > 0) {
    summary = `${sections.length} conflict${sections.length > 1 ? "s" : ""} found (${highRiskCount} high-risk). Review carefully.`;
  } else {
    summary = `${sections.length} conflict${sections.length > 1 ? "s" : ""} found — all low or medium risk. Standard resolution applies.`;
  }

  return {
    explanations,
    summary,
    totalConflicts: sections.length,
    highRiskCount,
  };
}
