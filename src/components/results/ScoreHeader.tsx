"use client";

import { motion } from "framer-motion";
import { scoreColor } from "@/lib/helpers";
import type { AnalysisResult } from "@/lib/types";

interface ScoreHeaderProps {
  result: AnalysisResult;
  repoMeta: { full_name: string; html_url: string } | null;
}

export default function ScoreHeader({ result, repoMeta }: ScoreHeaderProps) {
  const pct = Math.round(result.overallScore * 10);

  return (
    <div className="score-header">
      <div className="score-header-inner">
        <div className="score-circle-wrapper">
          <motion.div
            className="score-circle"
            style={{ "--pct": pct } as React.CSSProperties}
            initial={{ rotate: -90, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.2 }}
          >
            <div className="score-circle-inner">
              <motion.span
                className="score-number"
                style={{ color: scoreColor(result.overallScore) }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                {result.overallScore}
              </motion.span>
              <span className="score-label">/ 10</span>
            </div>
          </motion.div>
        </div>

        <div className="score-info">
          <h2 className="repo-name">
            {repoMeta?.full_name || "Repository"}
          </h2>
          <div className={`hiring-badge ${result.hiringReadinessClass}`}>
            {result.hiringReadiness === "Great Fit" ? "🟢" :
              result.hiringReadiness === "Good Candidate" ? "🔵" :
                result.hiringReadiness === "Needs Work" ? "🟡" : "🔴"}
            {" "}{result.hiringReadiness}
          </div>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {result.summary}
          </p>
          {repoMeta?.html_url && (
            <a
              href={repoMeta.html_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-block", marginTop: 12, fontSize: 13, color: "var(--indigo-light)" }}
            >
              View on GitHub →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
