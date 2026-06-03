"use client";

import { motion } from "framer-motion";

const FEATURES = [
  { icon: "⚡", bg: "rgba(99,102,241,0.12)", name: "Overall Repo Score", desc: "A 0–10 composite score based on code quality, documentation, tests, and activity." },
  { icon: "🚨", bg: "rgba(239,68,68,0.1)", name: "Issues Detected", desc: "Critical problems highlighted with severity — missing README, no tests, no license, and more." },
  { icon: "💡", bg: "rgba(245,158,11,0.1)", name: "AI Suggestions", desc: "Specific, actionable steps to raise your score and make the repo job-application ready." },
  { icon: "📄", bg: "rgba(6,182,212,0.1)", name: "README Generator", desc: "Get a professional README template tailored to your specific repository." },
  { icon: "💼", bg: "rgba(16,185,129,0.1)", name: "Resume Tips", desc: "Learn how to present this project on your CV and LinkedIn to impress recruiters." },
  { icon: "🎯", bg: "rgba(236,72,153,0.1)", name: "Hiring Readiness", desc: "A final verdict — Great Fit, Good Candidate, Needs Work, or Not Ready." },
];

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

export default function FeatureStrip() {
  return (
    <section className="features-strip">
      <div className="container">
        <h2 className="features-title">Everything developers need to stand out</h2>
        <p className="features-subtitle">Comprehensive repo intelligence in seconds — no sign-up required</p>
        <motion.div
          className="features-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {FEATURES.map((f) => (
            <motion.div key={f.name} className="feature-card" variants={cardVariants}>
              <div className="feature-icon" style={{ background: f.bg }}>
                {f.icon}
              </div>
              <div className="feature-name">{f.name}</div>
              <div className="feature-desc">{f.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
