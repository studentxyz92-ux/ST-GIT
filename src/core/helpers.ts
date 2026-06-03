export function scoreColor(s: number): string {
  if (s >= 7) return "#10b981";
  if (s >= 4) return "#f59e0b";
  return "#ef4444";
}

export function getScoreClass(s: number): "green" | "amber" | "red" {
  if (s >= 7) return "green";
  if (s >= 4) return "amber";
  return "red";
}

export function formatScore(s: number): string {
  return s.toFixed(1);
}

export function getHiringEmoji(cls: string): string {
  switch (cls) {
    case "great": return "🟢";
    case "good": return "🔵";
    case "average": return "🟡";
    case "poor": return "🔴";
    default: return "⚪";
  }
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + "...";
}
