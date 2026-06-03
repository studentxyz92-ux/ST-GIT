"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import type { AnalysisResult } from "@/lib/types";

export default function ComparePage() {
  const [repo1, setRepo1] = useState("");
  const [repo2, setRepo2] = useState("");
  const [loading, setLoading] = useState(false);
  const [result1, setResult1] = useState<AnalysisResult | null>(null);
  const [result2, setResult2] = useState<AnalysisResult | null>(null);
  const [meta1, setMeta1] = useState<{ full_name: string; html_url: string } | null>(null);
  const [meta2, setMeta2] = useState<{ full_name: string; html_url: string } | null>(null);
  const [error, setError] = useState("");

  async function handleCompare() {
    if (!repo1.trim() || !repo2.trim()) return;
    setLoading(true);
    setError("");

    try {
      const [res1, res2] = await Promise.all([
        fetch("/api/analyse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl: repo1.trim() }),
        }),
        fetch("/api/analyse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl: repo2.trim() }),
        }),
      ]);

      const data1 = await res1.json();
      const data2 = await res2.json();

      if (!res1.ok || data1.error) throw new Error(data1.error || "First repo analysis failed");
      if (!res2.ok || data2.error) throw new Error(data2.error || "Second repo analysis failed");

      setResult1(data1.result);
      setResult2(data2.result);
      setMeta1(data1.repoInfo);
      setMeta2(data2.repoInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
    } finally {
      setLoading(false);
    }
  }

  function colorForScore(s: number): string {
    if (s >= 7) return "var(--emerald)";
    if (s >= 5) return "var(--amber)";
    return "var(--red)";
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
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, marginBottom: 12 }}>
            <span className="gradient-text" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Compare Repositories
            </span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 520, margin: "0 auto" }}>
            Side-by-side analysis of two GitHub projects
          </p>
        </motion.div>

        <motion.div
          className="analyzer-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div style={{ display: "flex", gap: 16, flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div className="input-wrapper" style={{ flex: 1 }}>
                <span className="input-icon">①</span>
                <input
                  className="repo-input"
                  placeholder="First repo: owner/repo or URL"
                  value={repo1}
                  onChange={(e) => setRepo1(e.target.value)}
                />
              </div>
              <div className="input-wrapper" style={{ flex: 1 }}>
                <span className="input-icon">②</span>
                <input
                  className="repo-input"
                  placeholder="Second repo: owner/repo or URL"
                  value={repo2}
                  onChange={(e) => setRepo2(e.target.value)}
                />
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <button className="analyze-btn" onClick={handleCompare} disabled={loading || !repo1.trim() || !repo2.trim()} style={{ margin: "0 auto" }}>
                {loading ? "Analysing..." : "⚖️ Compare"}
                {loading && <span className="analyze-btn-shimmer" />}
              </button>
            </div>
          </div>
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
                <h3 className="loading-title">Comparing Repositories</h3>
                <p className="loading-subtitle">Analysing both repos simultaneously...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {result1 && result2 && !loading && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            {/* Score comparison */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 16, marginBottom: 24, alignItems: "center" }}>
              <ScoreBox result={result1} meta={meta1} />
              <div style={{ textAlign: "center", padding: "0 8px" }}>
                <div style={{ fontSize: "2rem", color: "var(--text-muted)" }}>VS</div>
              </div>
              <ScoreBox result={result2} meta={meta2} />
            </div>

            {/* Sub-score comparison */}
            <div className="content-card">
              <h3 className="card-title">
                <span className="card-icon" style={{ background: "rgba(99,102,241,0.15)" }}>📊</span>
                Sub-Score Comparison
              </h3>
              {result1.subScores.map((sub, i) => {
                const sub2 = result2.subScores[i];
                const diff = (sub.score - sub2.score).toFixed(1);
                return (
                  <div key={sub.name} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{sub.icon} {sub.name}</span>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        <span style={{ color: colorForScore(sub.score) }}>{sub.score}</span>
                        <span style={{ margin: "0 8px", color: "var(--text-muted)" }}>vs</span>
                        <span style={{ color: colorForScore(sub2.score) }}>{sub2.score}</span>
                        <span style={{ marginLeft: 8, fontWeight: 600, color: parseFloat(diff) > 0 ? "var(--emerald)" : parseFloat(diff) < 0 ? "var(--red)" : "var(--text-muted)" }}>
                          {parseFloat(diff) > 0 ? `+${diff}` : diff}
                        </span>
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div className="mini-bar" style={{ flex: 1 }}>
                        <div className="mini-bar-fill" style={{ width: `${(sub.score / 10) * 100}%`, background: colorForScore(sub.score) }} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>vs</span>
                      <div className="mini-bar" style={{ flex: 1 }}>
                        <div className="mini-bar-fill" style={{ width: `${(sub2.score / 10) * 100}%`, background: colorForScore(sub2.score) }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats table */}
            <div className="content-card">
              <h3 className="card-title">
                <span className="card-icon" style={{ background: "rgba(16,185,129,0.15)" }}>📋</span>
                Stats Comparison
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th style={{ textAlign: "left", padding: "10px 12px", color: "var(--text-muted)", fontWeight: 600 }}>Metric</th>
                      <th style={{ textAlign: "right", padding: "10px 12px", color: "var(--text-primary)" }}>{meta1?.full_name || "Repo 1"}</th>
                      <th style={{ textAlign: "right", padding: "10px 12px", color: "var(--text-primary)" }}>{meta2?.full_name || "Repo 2"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result1.stats.map((stat, i) => {
                      const stat2 = result2.stats[i];
                      return (
                        <tr key={stat.label} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "10px 12px", color: "var(--text-secondary)" }}>{stat.label}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>{stat.value}</td>
                          <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 600 }}>{stat2?.value || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {!result1 && !loading && (
          <div className="features-strip" style={{ border: "none", margin: "60px 0" }}>
            <div className="features-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              {[
                { icon: "⚖️", name: "Side-by-Side", desc: "Compare scores, metrics, and issues" },
                { icon: "📊", name: "Visual Charts", desc: "See where each repo excels" },
                { icon: "🏆", name: "Winner Detection", desc: "Instantly see which repo is better" },
                { icon: "📋", name: "Detailed Breakdown", desc: "Compare across all 5 sub-scores" },
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

function ScoreBox({ result, meta }: { result: AnalysisResult; meta: { full_name: string; html_url: string } | null }) {
  const score = result.overallScore;
  const color = score >= 7 ? "var(--emerald)" : score >= 5 ? "var(--amber)" : "var(--red)";
  return (
    <div className="score-header" style={{ marginBottom: 0, padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "3rem", fontWeight: 800, color, marginBottom: 4 }}>
          {score}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>out of 10</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
          <a href={meta?.html_url || "#"} target="_blank" rel="noopener noreferrer" style={{ color: "var(--text-primary)", textDecoration: "none" }}>
            {meta?.full_name || "Repo"}
          </a>
        </div>
        <span className={`hiring-badge ${result.hiringReadinessClass}`}>{result.hiringReadiness}</span>
      </div>
    </div>
  );
}
