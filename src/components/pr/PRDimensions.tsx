"use client";

import { motion } from "framer-motion";

interface Dimension {
  score: number;
  label: string;
  status: string;
}

interface Dimensions {
  conflictRisk: Dimension;
  size: Dimension;
  description: Dimension;
  reviewReadiness: Dimension;
  staleness: Dimension;
  risk: Dimension;
}

const DIMENSION_META: Record<string, { icon: string; name: string }> = {
  conflictRisk: { icon: "🔧", name: "Conflict Risk" },
  size: { icon: "📏", name: "PR Size" },
  description: { icon: "📝", name: "Description Quality" },
  reviewReadiness: { icon: "👀", name: "Review Readiness" },
  staleness: { icon: "⏰", name: "Staleness" },
  risk: { icon: "🛡️", name: "Risk Assessment" },
};

function statusColor(status: string): string {
  switch (status) {
    case "green": return "var(--emerald)";
    case "yellow": return "var(--amber)";
    case "red": return "var(--red)";
    default: return "var(--text-muted)";
  }
}

export default function PRDimensions({ dimensions }: { dimensions: Dimensions }) {
  return (
    <div className="mini-scores-grid" style={{ marginTop: 16 }}>
      {Object.entries(dimensions).map(([key, dim], i) => {
        const meta = DIMENSION_META[key] || { icon: "📊", name: key };
        const color = statusColor(dim.status);
        return (
          <motion.div
            key={key}
            className="mini-score-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="mini-score-icon">{meta.icon}</div>
            <div className="mini-score-value" style={{ color, fontSize: "1.3rem" }}>
              {dim.score}
            </div>
            <div className="mini-score-name">{meta.name}</div>
            <div className="mini-bar">
              <motion.div
                className="mini-bar-fill"
                style={{ background: color }}
                initial={{ width: 0 }}
                animate={{ width: `${dim.score}%` }}
                transition={{ duration: 1, delay: i * 0.1 + 0.3 }}
              />
            </div>
            <p style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.3 }}>
              {dim.label.substring(0, 60)}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
