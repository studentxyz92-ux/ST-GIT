export interface ConflictSection {
  path: string;
  startLine: number;
  endLine: number;
  currentBranchContent: string;  // <<<<<<< HEAD section
  incomingBranchContent: string; // >>>>>>> branch section
  commonAncestorHint: string;
}

export interface ParsedConflict {
  conflictSections: ConflictSection[];
  totalConflicts: number;
  criticalFiles: string[]; // files with conflicts in critical paths
}

const CRITICAL_PATHS = [
  /package\.json$/,
  /\.ts$/,
  /\.js$/,
  /\.py$/,
  /\.go$/,
  /docker-compose/,
  /Dockerfile/,
  /\.github\/workflows/,
  /schema/,
  /migration/,
  /config\.[a-z]+$/,
  /\.env/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /package-lock\.json$/,
];

/**
 * Extract conflict sections from a conflict file's content.
 */
export function parseConflictMarkers(path: string, content: string): ConflictSection[] {
  const sections: ConflictSection[] = [];
  const lines = content.split("\n");
  let i = 0;
  let startLine = 0;
  let currentLines: string[] = [];
  let incomingLines: string[] = [];
  let inCurrent = false;
  let inIncoming = false;
  let inConflict = false;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("<<<<<<< ")) {
      inConflict = true;
      inCurrent = true;
      startLine = i + 1;
      currentLines = [];
      incomingLines = [];
    } else if (line.startsWith("=======") && inConflict) {
      inCurrent = false;
      inIncoming = true;
    } else if (line.startsWith(">>>>>>> ") && inConflict) {
      inIncoming = false;
      inConflict = false;

      const branchInfo = line.replace(">>>>>>> ", "").trim();
      sections.push({
        path,
        startLine,
        endLine: i + 1,
        currentBranchContent: currentLines.join("\n"),
        incomingBranchContent: incomingLines.join("\n"),
        commonAncestorHint: branchInfo,
      });

      currentLines = [];
      incomingLines = [];
    } else if (inCurrent) {
      currentLines.push(line);
    } else if (inIncoming) {
      incomingLines.push(line);
    }

    i++;
  }

  return sections;
}

/**
 * Parse all conflict files and return parsed conflicts.
 */
export function parseAllConflicts(
  files: Array<{ path: string; content: string }>
): ParsedConflict {
  const allSections: ConflictSection[] = [];
  const criticalFiles: string[] = [];

  for (const file of files) {
    const sections = parseConflictMarkers(file.path, file.content);
    allSections.push(...sections);

    if (sections.length > 0 && CRITICAL_PATHS.some((p) => p.test(file.path))) {
      criticalFiles.push(file.path);
    }
  }

  return {
    conflictSections: allSections,
    totalConflicts: allSections.length,
    criticalFiles: [...new Set(criticalFiles)],
  };
}

/**
 * Generate a human-readable summary of conflicts.
 */
export function summarizeConflicts(parsed: ParsedConflict): string {
  if (parsed.totalConflicts === 0) return "No conflicts detected.";

  const parts: string[] = [];
  parts.push(`${parsed.totalConflicts} conflict${parsed.totalConflicts > 1 ? "s" : ""} found across ${new Set(parsed.conflictSections.map((c) => c.path)).size} file(s).`);

  if (parsed.criticalFiles.length > 0) {
    parts.push(`⚠️  Critical files affected: ${parsed.criticalFiles.join(", ")}`);
  }

  // Group by file
  const byFile: Record<string, ConflictSection[]> = {};
  for (const section of parsed.conflictSections) {
    if (!byFile[section.path]) byFile[section.path] = [];
    byFile[section.path].push(section);
  }

  for (const [filePath, sections] of Object.entries(byFile)) {
    parts.push(`\n📄 ${filePath}:`);
    for (const section of sections) {
      const currLines = section.currentBranchContent.split("\n").length;
      const incLines = section.incomingBranchContent.split("\n").length;
      parts.push(`   Line ${section.startLine}–${section.endLine}: ${currLines} lines (current) vs ${incLines} lines (incoming)`);
    }
  }

  return parts.join("\n");
}
