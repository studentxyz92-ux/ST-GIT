"use client";

import { motion } from "framer-motion";

const STEPS = [
  { label: "Connecting to GitHub API" },
  { label: "Fetching repository metadata" },
  { label: "Reading README and file tree" },
  { label: "Extracting code snippets" },
  { label: "Running AI analysis" },
  { label: "Generating improvement report" },
];

interface LoadingSectionProps {
  step: number;
}

export default function LoadingSection({ step }: LoadingSectionProps) {
  return (
    <section className="loading-section container">
      <motion.div
        className="loading-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="loading-spinner-wrapper">
          <div className="loading-spinner" />
          <div className="loading-spinner-inner" />
        </div>
        <h2 className="loading-title">Analysing Repository…</h2>
        <p className="loading-subtitle">This takes 10–30 seconds. Hang tight!</p>
        <div className="loading-steps">
          {STEPS.map((s, i) => {
            const isDone = i < step;
            const isActive = i === step;
            return (
              <motion.div
                key={i}
                className={`loading-step${isDone ? " done" : isActive ? " active" : ""}`}
                animate={isActive ? { scale: [1, 1.02, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <div className="step-icon">
                  {isDone ? "✓" : isActive ? "●" : String(i + 1)}
                </div>
                {s.label}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
