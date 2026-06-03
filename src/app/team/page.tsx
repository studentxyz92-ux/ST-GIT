"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

interface RepoHealth {
  repoFull: string;
  latestScore: { overall: number } | null;
  scoreTrend: number;
  recentPRs: Array<{ overall: number; prNumber: number; mergeReady: boolean }>;
}

export default function TeamPage() {
  const [teamName, setTeamName] = useState("");
  const [repoInput, setRepoInput] = useState("");
  const [repos, setRepos] = useState<string[]>([]);
  const [data, setData] = useState<{ repos: RepoHealth[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addRepo() {
    const trimmed = repoInput.trim();
    if (trimmed && !repos.includes(trimmed)) {
      setRepos((prev) => [...prev, trimmed]);
      setRepoInput("");
    }
  }

  function removeRepo(repo: string) {
    setRepos((prev) => prev.filter((r) => r !== repo));
  }

  async function handleAnalyse() {
    if (repos.length === 0) return;
    setLoading(true);
    setError("");

    try {
      // Fetch timeline data for each repo
      const repoData = await Promise.all(
        repos.map(async (repo) => {
          const res = await fetch(`/api/timeline?repo=${encodeURIComponent(repo)}`);
          if (!res.ok) return null;
          const d = await res.json();
          return d;
        })
      );

      const healthData: RepoHealth[] = repoData
        .filter((d): d is { repo: string; scores: Array<{ overall: number }>; trend: number } => d !== null)
        .map((d) => ({
          repoFull: d.repo,
          latestScore: d.scores.length > 0 ? { overall: d.scores[d.scores.length - 1].overall } : null,
          scoreTrend: d.trend,
          recentPRs: [],
        }));

      setData({ repos: healthData });

      if (healthData.length === 0) {
        setError("No data found. Analyse your repos on the homepage first.");
      }
    } catch {
      setError("Failed to load team data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ErrorBoundary>
      <Nav />
      <main className="container" style={{ paddingTop: 120, paddingBottom: 80 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <div className="hero-badge" style={{ display: "inline-flex", marginBottom: 20 }}>
            <span className="hero-badge-dot" />
            Team Dashboard · B2B · Coming Soon
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, marginBottom: 12 }}>
            <span className="gradient-text" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Team Sync
            </span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 520, margin: "0 auto" }}>
            Monitor your entire engineering team&apos;s GitHub health in one dashboard. 
            Get insights across all repos, open PRs, and contributor activity.
          </p>
        </motion.div>

        <motion.div
          className="analyzer-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Add Team Repositories</h3>
          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon">📦</span>
              <input
                className="repo-input"
                placeholder="owner/repo (e.g., vercel/next.js)"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRepo()}
              />
            </div>
            <button className="analyze-btn" onClick={addRepo} disabled={!repoInput.trim()}>
              + Add
            </button>
          </div>

          {/* Repo Tags */}
          {repos.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {repos.map((repo) => (
                <span
                  key={repo}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(99,102,241,0.1)",
                    border: "1px solid rgba(99,102,241,0.25)",
                    borderRadius: 20,
                    padding: "4px 12px",
                    fontSize: 12,
                    color: "var(--indigo-light)",
                  }}
                >
                  {repo}
                  <button
                    onClick={() => removeRepo(repo)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: 14,
                      padding: 0,
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <button
            className="analyze-btn"
            onClick={handleAnalyse}
            disabled={loading || repos.length === 0}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {loading ? "Loading Dashboard..." : "📊 Load Team Dashboard"}
            {loading && <span className="analyze-btn-shimmer" />}
          </button>
        </motion.div>

        {error && (
          <motion.div className="error-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span>⚠️</span> {error}
          </motion.div>
        )}

        {/* Team Dashboard */}
        {data && !loading && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            {/* Summary */}
            <div className="score-header" style={{ marginBottom: 24 }}>
              <div className="score-header-inner" style={{ gap: 24 }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "var(--gradient-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  flexShrink: 0,
                }}>
                  👥
                </div>
                <div className="score-info">
                  <div className="repo-name" style={{ fontSize: "1.3rem" }}>
                    {teamName || "Engineering Team"} Dashboard
                  </div>
                  <div className="score-meta">
                    <span className="score-meta-item">📦 {data.repos.length} repositories</span>
                    <span className="score-meta-item">
                      📊 Avg score: {data.repos.length > 0
                        ? (data.repos.reduce((s, r) => s + (r.latestScore?.overall || 0), 0) / data.repos.length).toFixed(1)
                        : "N/A"}
                    </span>
                    <span className="score-meta-item">
                      📈 {data.repos.filter((r) => r.scoreTrend > 0).length} improving
                    </span>
                    <span className="score-meta-item">
                      📉 {data.repos.filter((r) => r.scoreTrend < 0).length} declining
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Repo Health Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.repos.map((repo, i) => {
                const score = repo.latestScore?.overall || 0;
                const scoreColor = score >= 7 ? "var(--emerald)" : score >= 5 ? "var(--amber)" : "var(--red)";
                const trendIcon = repo.scoreTrend > 0 ? "↑" : repo.scoreTrend < 0 ? "↓" : "→";
                const trendColor = repo.scoreTrend > 0 ? "var(--emerald)" : repo.scoreTrend < 0 ? "var(--red)" : "var(--text-muted)";

                return (
                  <motion.div
                    key={repo.repoFull}
                    className="content-card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                          📂 {repo.repoFull}
                        </h4>
                        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
                          <span style={{ color: scoreColor, fontWeight: 700 }}>
                            Score: {score.toFixed(1)}/10
                          </span>
                          <span style={{ color: trendColor }}>
                            {trendIcon} {Math.abs(repo.scoreTrend).toFixed(1)}
                          </span>
                          <span>
                            {repo.recentPRs.length} recent PR{repo.recentPRs.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                      <div className="mini-bar" style={{ width: 120 }}>
                        <div
                          className="mini-bar-fill"
                          style={{ width: `${(score / 10) * 100}%`, background: scoreColor }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Feature Preview */}
            <div className="content-card" style={{ marginTop: 24, textAlign: "center" }}>
              <h3 className="card-title" style={{ justifyContent: "center" }}>
                <span className="card-icon" style={{ background: "rgba(99,102,241,0.15)" }}>🚀</span>
                Coming Soon
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 16 }}>
                {[
                  { icon: "👥", label: "Contributor DNA" },
                  { icon: "🔀", label: "Open PR Dashboard" },
                  { icon: "📊", label: "Team Analytics" },
                  { icon: "📋", label: "Export Reports" },
                  { icon: "🔔", label: "Slack Integration" },
                  { icon: "📈", label: "Weekly Trends" },
                ].map((f, i) => (
                  <div key={i} style={{
                    padding: 12,
                    background: "rgba(255,255,255,0.02)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border)",
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{f.icon}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {!data && !loading && (
          <div className="features-strip" style={{ border: "none", margin: "60px 0" }}>
            <div className="features-grid">
              {[
                { icon: "👥", name: "Team Overview", desc: "See all repos in one dashboard" },
                { icon: "📊", name: "Repo Health", desc: "Scores, trends, and activity for each repo" },
                { icon: "🔀", name: "PR Monitoring", desc: "Track open PRs needing attention" },
                { icon: "📈", name: "Trend Tracking", desc: "Which repos are improving or declining" },
                { icon: "🏆", name: "Top Contributors", desc: "Identify your best contributors" },
                { icon: "💰", name: "Monetization", desc: "Free for individuals, paid for teams" },
              ].map((f, i) => (
                <motion.div key={i} className="feature-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <div className="feature-icon" style={{ background: "var(--gradient-primary)" }}>{f.icon}</div>
                  <div className="feature-name">{f.name}</div>
                  <div className="feature-desc">{f.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </ErrorBoundary>
  );
}
