"use client";

import { motion } from "framer-motion";

interface PRInfo {
  title: string;
  number: number;
  state: string;
  author: string;
  avatar: string;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export default function PRHealthHeader({
  score,
  prInfo,
  repoFullName,
}: {
  score: number;
  prInfo: PRInfo;
  repoFullName: string;
}) {
  const strokeColor = score >= 70 ? "var(--emerald)" : score >= 40 ? "var(--amber)" : "var(--red)";
  const textColor = score >= 70 ? "var(--emerald)" : score >= 40 ? "var(--amber)" : "var(--red)";

  return (
    <motion.div
      className="score-header"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="score-header-inner">
        <div className="score-circle-wrapper">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <circle
              cx="65"
              cy="65"
              r="54"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="8"
            />
            <motion.circle
              cx="65"
              cy="65"
              r="54"
              fill="none"
              stroke={strokeColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(score / 100) * 339.292} 339.292`}
              transform="rotate(-90 65 65)"
              initial={{ strokeDasharray: "0 339.292" }}
              animate={{ strokeDasharray: `${(score / 100) * 339.292} 339.292` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
            <text x="65" y="58" textAnchor="middle" fill={textColor} fontFamily="'Space Grotesk', sans-serif" fontSize="32" fontWeight="800">
              {score}
            </text>
            <text x="65" y="78" textAnchor="middle" fill="var(--text-muted)" fontSize="11">
              /100
            </text>
          </svg>
        </div>
        <div className="score-info">
          <div className="repo-name" style={{ fontSize: "1.1rem" }}>
            <a
              href={prInfo.html_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--text-primary)", textDecoration: "none" }}
            >
              {repoFullName}#{prInfo.number}
            </a>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 8, lineHeight: 1.4 }}>
            {prInfo.title}
          </p>
          <div className="score-meta">
            <span className="score-meta-item">👤 {prInfo.author}</span>
            <span className="score-meta-item">
              {prInfo.state === "open" ? "🟢 Open" : "🔒 Closed"}
            </span>
            <span className="score-meta-item">
              📅 {new Date(prInfo.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
