"use client";

import { motion } from "framer-motion";

interface Props {
  status: "ready" | "needs-work" | "blocked";
}

const CONFIG: Record<string, { icon: string; title: string; subtitle: string; bg: string; border: string; color: string }> = {
  ready: {
    icon: "✅",
    title: "Ready to Merge",
    subtitle: "All checks pass. No conflicts. PR is in good shape.",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.25)",
    color: "var(--emerald)",
  },
  "needs-work": {
    icon: "⚠️",
    title: "Needs Work",
    subtitle: "Some dimensions need attention before this PR is ready.",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.25)",
    color: "var(--amber)",
  },
  blocked: {
    icon: "🚫",
    title: "Blocked",
    subtitle: "Conflicts or failing checks are blocking this PR from merging.",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
    color: "var(--red)",
  },
};

export default function MergeReadiness({ status }: Props) {
  const config = CONFIG[status] || CONFIG["needs-work"];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: "var(--radius-lg)",
        padding: "20px 24px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div style={{ fontSize: 28 }}>{config.icon}</div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 16, color: config.color, marginBottom: 4 }}>
          {config.title}
        </div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {config.subtitle}
        </div>
      </div>
    </motion.div>
  );
}
