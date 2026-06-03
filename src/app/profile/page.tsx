"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

interface UserInfo {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  location: string | null;
  company: string | null;
  html_url: string;
}

interface RepoScore {
  name: string;
  full_name: string;
  score: number;
  language: string | null;
  stars: number;
  hiringReadiness: string;
}

export default function ProfilePage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [repos, setRepos] = useState<RepoScore[]>([]);
  const [avgScore, setAvgScore] = useState(0);
  const [error, setError] = useState("");

  async function handleAnalyse() {
    if (!username.trim()) return;
    setLoading(true);
    setError("");
    setUserInfo(null);
    setRepos([]);

    try {
      const res = await fetch(`/api/analyse/profile?username=${encodeURIComponent(username.trim())}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Failed to fetch profile");
      } else {
        setUserInfo(data.user);
        setRepos(data.repos);
        setAvgScore(data.averageScore);
      }
    } catch {
      setError("Network error. Please try again.");
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
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: 48 }}
        >
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, marginBottom: 12 }}>
            <span className="gradient-text" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Profile Analysis
            </span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 520, margin: "0 auto" }}>
            Get a comprehensive analysis of a developer&apos;s entire GitHub portfolio
          </p>
        </motion.div>

        <motion.div
          className="analyzer-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                className="repo-input"
                placeholder="GitHub username (e.g., torvalds)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyse()}
              />
            </div>
            <button className="analyze-btn" onClick={handleAnalyse} disabled={loading || !username.trim()}>
              {loading ? "Analysing..." : "Analyse Profile"}
              {loading && <span className="analyze-btn-shimmer" />}
            </button>
          </div>
        </motion.div>

        {error && (
          <motion.div
            className="error-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span>⚠️</span> {error}
          </motion.div>
        )}

        <AnimatePresence>
          {loading && (
            <motion.div
              key="loading"
              className="loading-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="loading-card">
                <div className="loading-spinner-wrapper">
                  <div className="loading-spinner" />
                  <div className="loading-spinner-inner" />
                </div>
                <h3 className="loading-title">Analysing Profile</h3>
                <p className="loading-subtitle">Fetching repos and calculating scores...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {userInfo && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* User Card */}
            <div className="score-header" style={{ marginBottom: 24 }}>
              <div className="score-header-inner">
                <img
                  src={userInfo.avatar_url}
                  alt={userInfo.login}
                  style={{ width: 100, height: 100, borderRadius: "50%", border: "3px solid var(--indigo)", flexShrink: 0 }}
                />
                <div className="score-info">
                  <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.6rem", fontWeight: 700, marginBottom: 4 }}>
                    {userInfo.name || userInfo.login}
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: 14, marginBottom: 12 }}>
                    @{userInfo.login} {userInfo.location ? `· ${userInfo.location}` : ""} {userInfo.company ? `· ${userInfo.company}` : ""}
                  </p>
                  {userInfo.bio && (
                    <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
                      {userInfo.bio}
                    </p>
                  )}
                  <div className="score-meta">
                    <span className="score-meta-item">📦 {userInfo.public_repos} repos</span>
                    <span className="score-meta-item">👥 {userInfo.followers} followers</span>
                    <span className="score-meta-item">⭐ {avgScore.toFixed(1)} avg score</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Repo Rankings */}
            <div className="content-card">
              <h3 className="card-title">
                <span className="card-icon" style={{ background: "rgba(99,102,241,0.15)" }}>📋</span>
                Repository Rankings ({repos.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {repos.map((repo, i) => (
                  <motion.div
                    key={repo.full_name}
                    className="suggestion-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    style={{ display: "flex", alignItems: "center", gap: 12, cursor: "default" }}
                  >
                    <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <a
                          href={`https://github.com/${repo.full_name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "var(--text-primary)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}
                        >
                          {repo.full_name}
                        </a>
                        {repo.language && (
                          <span style={{ fontSize: 11, color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 4 }}>{repo.language}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-muted)" }}>
                        <span>⭐ {repo.stars}</span>
                        <span>{repo.hiringReadiness}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.3rem", fontWeight: 700, color: repo.score >= 7 ? "var(--emerald)" : repo.score >= 5 ? "var(--amber)" : "var(--red)" }}>
                        {repo.score.toFixed(1)}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>/10</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {!userInfo && !loading && (
          <div className="features-strip" style={{ border: "none", margin: "60px 0" }}>
            <div className="features-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              {[
                { icon: "👤", name: "Portfolio View", desc: "See all public repos at a glance" },
                { icon: "📊", name: "Aggregate Score", desc: "Average health across all projects" },
                { icon: "🏆", name: "Top Repos", desc: "Find the best projects in the profile" },
                { icon: "📈", name: "Growth Trends", desc: "Track improvements over time" },
              ].map((f, i) => (
                <motion.div key={i} className="feature-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
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
