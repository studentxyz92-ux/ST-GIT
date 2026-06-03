"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import PRHealthHeader from "@/components/pr/PRHealthHeader";
import PRDimensions from "@/components/pr/PRDimensions";
import MergeReadiness from "@/components/pr/MergeReadiness";
import ConflictExplainer from "@/components/pr/ConflictExplainer";

interface PRHealthResult {
  overall: number;
  dimensions: {
    conflictRisk: { score: number; label: string; status: string };
    size: { score: number; label: string; status: string };
    description: { score: number; label: string; status: string };
    reviewReadiness: { score: number; label: string; status: string };
    staleness: { score: number; label: string; status: string };
    risk: { score: number; label: string; status: string };
  };
  topIssues: Array<{ severity: string; title: string; description: string }>;
  mergeReadiness: string;
}

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

export default function PRDoctorPage() {
  const [prUrl, setPrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    pr: PRInfo;
    repoInfo: { full_name: string };
    healthScore: PRHealthResult;
    stats: Record<string, unknown>;
  } | null>(null);
  const [showConflicts, setShowConflicts] = useState(false);
  const [conflictData, setConflictData] = useState<{
    conflicts: Array<{ path: string; explanation: string; currentChanges: string; incomingChanges: string; suggestedAction: string; risk: string }>;
    totalConflicts: number;
    message: string;
  } | null>(null);
  const [conflictLoading, setConflictLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"health" | "conflicts">("health");

  async function handleAnalyse() {
    if (!prUrl.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setConflictData(null);
    setActiveTab("health");

    try {
      const res = await fetch("/api/pr/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prUrl: prUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Analysis failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConflictCheck() {
    if (!prUrl.trim() || !result) return;
    setConflictLoading(true);
    setShowConflicts(true);
    setActiveTab("conflicts");

    try {
      const res = await fetch("/api/pr/conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prUrl: prUrl.trim() }),
      });
      const data = await res.json();
      setConflictData(data);
    } catch {
      setConflictData(null);
    } finally {
      setConflictLoading(false);
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
            AI-Powered · PR Intelligence · Free
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, marginBottom: 12 }}>
            <span className="gradient-text" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              PR Doctor
            </span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 560, margin: "0 auto" }}>
            Paste any GitHub Pull Request URL. Get instant health analysis across 6 dimensions, 
            conflict explanation, and actionable fixes.
          </p>
        </motion.div>

        <motion.div
          className="analyzer-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="input-group">
            <div className="input-wrapper">
              <span className="input-icon">🔀</span>
              <input
                className="repo-input"
                placeholder="https://github.com/owner/repo/pull/42"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyse()}
                disabled={loading}
              />
            </div>
            <button className="analyze-btn" onClick={handleAnalyse} disabled={loading || !prUrl.trim()}>
              {loading ? "Analysing..." : "🔍 Analyse PR"}
              {loading && <span className="analyze-btn-shimmer" />}
            </button>
          </div>
          <p className="input-hint" style={{ textAlign: "center" }}>
            Enter a full PR URL like: https://github.com/facebook/react/pull/12345
          </p>
        </motion.div>

        {error && (
          <motion.div className="error-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <span>⚠️</span> {error}
          </motion.div>
        )}

        <AnimatePresence>
          {loading && (
            <motion.div key="loading" className="loading-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="loading-card">
                <div className="loading-spinner-wrapper">
                  <div className="loading-spinner" /><div className="loading-spinner-inner" />
                </div>
                <h3 className="loading-title">Analysing Pull Request</h3>
                <p className="loading-subtitle">Fetching PR data, checking CI status, scanning for conflicts...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {result && !loading && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            {/* Tabs: Health | Conflicts */}
            <div className="tabs" style={{ marginTop: 24 }}>
              <button
                className={`tab-btn ${activeTab === "health" ? "active" : ""}`}
                onClick={() => setActiveTab("health")}
              >
                🏥 PR Health
              </button>
              <button
                className={`tab-btn ${activeTab === "conflicts" ? "active" : ""}`}
                onClick={() => { setActiveTab("conflicts"); if (!conflictData) handleConflictCheck(); }}
              >
                🔧 Conflicts {result.healthScore.topIssues.some((i) => i.title.includes("Conflicts")) ? "⚠️" : "✅"}
              </button>
            </div>

            {activeTab === "health" && (
              <>
                <PRHealthHeader
                  score={result.healthScore.overall}
                  prInfo={result.pr}
                  repoFullName={result.repoInfo.full_name}
                />

                <MergeReadiness status={result.healthScore.mergeReadiness as "ready" | "needs-work" | "blocked"} />

                <PRDimensions dimensions={result.healthScore.dimensions} />

                {/* Issues */}
                {result.healthScore.topIssues.length > 0 && (
                  <div className="content-card">
                    <h3 className="card-title">
                      <span className="card-icon" style={{ background: "rgba(239,68,68,0.15)" }}>🚨</span>
                      Issues Found
                    </h3>
                    {result.healthScore.topIssues.map((issue, i) => (
                      <div key={i} className="issue-item">
                        <span className={`issue-severity severity-${issue.severity}`}>
                          {issue.severity}
                        </span>
                        <div className="issue-text">
                          <strong>{issue.title}</strong><br />{issue.description}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="content-card">
                  <h3 className="card-title">
                    <span className="card-icon" style={{ background: "rgba(6,182,212,0.15)" }}>📊</span>
                    PR Stats
                  </h3>
                  <div className="stats-grid">
                    {Object.entries(result.stats).map(([key, val]) => (
                      <div key={key} className="stat-item">
                        <div className="stat-value">{String(val)}</div>
                        <div className="stat-label">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conflict Check Button */}
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <button className="analyze-btn" onClick={handleConflictCheck} style={{ margin: "0 auto" }}>
                    🔍 Check for Conflicts
                  </button>
                </div>
              </>
            )}

            {activeTab === "conflicts" && (
              <ConflictExplainer
                prUrl={prUrl}
                loading={conflictLoading}
                data={conflictData}
              />
            )}
          </motion.div>
        )}

        {!result && !loading && (
          <div className="features-strip" style={{ border: "none", margin: "60px 0" }}>
            <div className="features-grid">
              {[
                { icon: "🏥", name: "Health Score", desc: "Overall PR quality score out of 100" },
                { icon: "🔧", name: "Conflict Detection", desc: "Automatic conflict scanning and explanation" },
                { icon: "📊", name: "6 Dimensions", desc: "Conflict risk, size, description, reviews, staleness, risk" },
                { icon: "🚦", name: "Traffic Light UI", desc: "Green/Yellow/Red for every dimension" },
                { icon: "💡", name: "Actionable Fixes", desc: "Top issues with clear next steps" },
                { icon: "📋", name: "PR Badge", desc: "Add a live health badge to your PR description" },
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
