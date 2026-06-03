"use client";

import { motion } from "framer-motion";
import { scoreColor } from "@/lib/helpers";
import type { AnalysisResult } from "@/lib/types";

interface MiniScoresGridProps {
  subScores: AnalysisResult["subScores"];
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MiniScoresGrid({ subScores }: MiniScoresGridProps) {
  return (
    <motion.div
      className="mini-scores-grid"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {subScores.map((sub) => (
        <motion.div key={sub.name} className="mini-score-card" variants={cardVariants}>
          <div className="mini-score-icon">{sub.icon}</div>
          <div
            className="mini-score-value"
            style={{ color: scoreColor(sub.score) }}
          >
            {sub.score}
            <span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/10</span>
          </div>
          <div className="mini-score-name">{sub.name}</div>
          <div className="mini-bar">
            <motion.div
              className="mini-bar-fill"
              style={{
                background: scoreColor(sub.score),
              }}
              initial={{ width: 0 }}
              animate={{ width: `${sub.score * 10}%` }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
