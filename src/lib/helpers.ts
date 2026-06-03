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
