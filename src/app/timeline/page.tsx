"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ScoreChart from "@/components/timeline/ScoreChart";
import MilestoneMarkers from "@/components/timeline/MilestoneMarkers";

interface ScorePoint {
  analysedAt: string;
  overall: number;
  readme: number;
  structure: number;
  tests: number;
  quality: number;
  activity: number;
}

interface RepoOverview {
  name: string;
  latest: { overall: number };
  trend: number;
  dataPoints: number;
}

export default function TimelinePage() {
  const [repoFilter, setRepoFilter] = useState("");
  const [scores, setScores] = useState<ScorePoint[]>([]);
  const [overview, setOverview] = useState<RepoOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData(repo?: string) {
    setLoading(true);
    setError("");
    try {
      const params = repo ? `?repo=${encodeURIComponent(repo)}` : "";
      const res = await fetch(`/api/timeline${params}`);
      if (!res.ok) throw new Error("Failed to fetch timeline data");
      const data = await res.json();

      if (repo) {
        setScores(data.scores || []);
        setOverview([]);
      } else {
        setScores([]);
        setOverview(data.repos || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectRepo(repo: string) {
    setRepoFilter(repo);
    fetchData(repo);
  }

  function handleBack() {
    setRepoFilter("");
    setScores([]);
    fetchData();
  }

  // Generate milestones from score changes
  const milestones = scores.length >= 2
    ? scores.slice(1).map((s, i) => {
        const prev = scores[i];
        const diff = s.overall - prev.overall;
        return {
          date: new Date(s.analysedAt).toLocaleDateString(),
          type: (diff > 0.5 ? "improvement" : diff < -0.5 ? "decline" : "neutral") as "improvement" | "decline" | "neutral",
          label: diff > 0.5 ? `Score improved by ${diff.toFixed(1)} pts` : diff < -0.5 ? `Score dropped by ${Math.abs(diff).toFixed(1)} pts` : "Score stable",
        };
      })
    : [];

  return (
    <ErrorBoundary>
      <Nav />
      <main className="container" style={{ paddingTop: 120, paddingBottom: 80 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, marginBottom: 12 }}>
            <span className="gradient-text" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Repo Health Timeline
            </span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 520, margin: "0 auto" }}>
            Track how your repositories improve over time. Every analysis is saved automatically.
          </p>
        </motion.div>

        <AnimatePresence>
          {loading && (
            <motion.div key="loading" className="loading-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="loading-card">
                <div className="loading-spinner-wrapper">
                  <div className="loading-spinner" /><div className="loading-spinner-inner" />
                </div>
                <h3 className="loading-title">Loading Timeline</h3>
                <p className="loading-subtitle">Fetching score history...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div className="error-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span>⚠️</span> {error}
          </motion.div>
        )}

        {!loading && (
          <>
            {/* Back button when viewing a specific repo */}
            {repoFilter && (
              <button
                className="analyze-btn"
                onClick={handleBack}
                style={{ marginBottom: 16, background: "rgba(255,255,255,0.06)", boxShadow: "none", fontSize: 13 }}
              >
                ← Back to All Repos
              </button>
            )}

            {/* Repo Overview Grid */}
            {!repoFilter && overview.length > 0 && (
              <div className="mini-scores-grid" style={{ marginBottom: 24 }}>
                {overview.map((repo, i) => (
                  <motion.div
                    key={repo.name}
                    className="mini-score-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleSelectRepo(repo.name)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="mini-score-icon">📂</div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, wordBreak: "break-all" }}>
                      {repo.name}
                    </div>
                    <div className="mini-score-value" style={{ fontSize: "1.3rem", color: repo.latest.overall >= 7 ? "var(--emerald)" : repo.latest.overall >= 5 ? "var(--amber)" : "var(--red)" }}>
                      {repo.latest.overall.toFixed(1)}
                    </div>
                    <div className="mini-score-name">Latest Score</div>
                    <div style={{ fontSize: 11, marginTop: 4, color: repo.trend >= 0 ? "var(--emerald)" : "var(--red)" }}>
                      {repo.trend >= 0 ? `↑ +${repo.trend.toFixed(1)}` : `↓ ${repo.trend.toFixed(1)}`}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2 }}>
                      {repo.dataPoints} analysis{repo.dataPoints > 1 ? "es" : ""}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* No data */}
            {!repoFilter && overview.length === 0 && !loading && (
              <div className="content-card" style={{ textAlign: "center", padding: 48 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
                <h3 style={{ fontWeight: 600, marginBottom: 8 }}>No Timeline Data Yet</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
                  Analyse a repository on the homepage to start tracking its health score over time.
                  Each analysis is saved automatically and displayed here as a timeline.
                </p>
                <a href="/" className="analyze-btn" style={{ display: "inline-flex", marginTop: 20, textDecoration: "none" }}>
                  ⚡ Analyse a Repo
                </a>
              </div>
            )}

            {/* Score Chart for selected repo */}
            {repoFilter && <ScoreChart scores={scores} repoFull={repoFilter} />}

            {/* Milestones */}
            {repoFilter && scores.length >= 2 && (
              <MilestoneMarkers milestones={milestones} />
            )}
          </>
        )}
      </main>
      <Footer />
    </ErrorBoundary>
  );
}
