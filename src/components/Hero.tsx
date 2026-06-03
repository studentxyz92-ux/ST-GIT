"use client";

import { motion } from "framer-motion";

interface HeroProps {
  repoUrl: string;
  setRepoUrl: (url: string) => void;
  loading: boolean;
  error: string;
  onAnalyse: (url?: string) => void;
}

const EXAMPLES = [
  "https://github.com/vercel/next.js",
  "https://github.com/facebook/react",
  "https://github.com/torvalds/linux",
];

export default function Hero({ repoUrl, setRepoUrl, loading, error, onAnalyse }: HeroProps) {
  return (
    <section className="hero">
      <div className="container">
        <motion.div
          className="hero-badge"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="hero-badge-dot" />
          AI-powered · Instant · Free
        </motion.div>

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Will companies hire you<br />
          <span className="gradient-text">based on your GitHub?</span>
        </motion.h1>

        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Paste any GitHub repo link. Get an instant AI-powered review:
          code quality, README, structure, resume tips &amp; hiring readiness score.
        </motion.p>

        {/* Analyzer Card */}
        <motion.div
          className="analyzer-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon">🔗</span>
              <input
                id="repo-url-input"
                type="url"
                className="repo-input"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onAnalyse()}
                disabled={loading}
                autoFocus
              />
            </div>
            <button
              id="analyze-btn"
              className="analyze-btn"
              onClick={() => onAnalyse()}
              disabled={loading || !repoUrl.trim()}
            >
              {loading ? (
                <>
                  <div className="analyze-btn-shimmer" />
                  Analysing…
                </>
              ) : (
                <> ⚡ Analyse</>
              )}
            </button>
          </div>

          <p className="input-hint">⚡ Try an example:</p>
          <div className="example-chips">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                className="example-chip"
                onClick={() => onAnalyse(ex)}
              >
                {ex.replace("https://github.com/", "")}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            className="error-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <strong>Error: </strong>{error}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
