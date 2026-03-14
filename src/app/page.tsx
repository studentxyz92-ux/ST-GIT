"use client";

import { useState, useRef, useEffect } from "react";
import type { AnalysisResult } from "@/lib/types";

// ── helpers ──────────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 7) return "#10b981";
  if (s >= 4) return "#f59e0b";
  return "#ef4444";
}

function scoreClass(color: string) {
  if (color === "green") return "text-green";
  if (color === "amber") return "text-amber";
  if (color === "red") return "text-red";
  return "text-indigo";
}

// ── Loading steps ─────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Connecting to GitHub API" },
  { label: "Fetching repository metadata" },
  { label: "Reading README and file tree" },
  { label: "Extracting code snippets" },
  { label: "Running AI analysis" },
  { label: "Generating improvement report" },
];

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [repoMeta, setRepoMeta] = useState<{ full_name: string; html_url: string } | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("issues");
  const [copied, setCopied] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const EXAMPLES = [
    "https://github.com/vercel/next.js",
    "https://github.com/facebook/react",
    "https://github.com/torvalds/linux",
  ];

  useEffect(() => {
    if (loading) {
      setStep(0);
      let s = 0;
      stepTimer.current = setInterval(() => {
        s = Math.min(s + 1, STEPS.length - 1);
        setStep(s);
      }, 1800);
    } else {
      if (stepTimer.current) clearInterval(stepTimer.current);
    }
    return () => {
      if (stepTimer.current) clearInterval(stepTimer.current);
    };
  }, [loading]);

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  async function handleAnalyse(url = repoUrl) {
    if (!url.trim()) return;
    setError("");
    setResult(null);
    setRepoMeta(null);
    setLoading(true);
    setActiveTab("issues");

    try {
      const res = await fetch("/api/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Analysis failed. Please try again.");
      } else {
        setResult(data.result);
        setRepoMeta(data.repoInfo);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function copyReadme() {
    if (result?.readmeSuggestion) {
      navigator.clipboard.writeText(result.readmeSuggestion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function shareOnTwitter() {
    if (!result) return;
    const text = `I just scored my GitHub repo on DevScore.ai 🚀\n\nScore: ${result.overallScore}/10 — ${result.hiringReadiness}\n\nCheck yours 👇`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://devscore.ai")}`, "_blank");
  }

  const pct = result ? Math.round(result.overallScore * 10) : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Nav */}
      <nav className="nav">
        <div className="container nav-inner">
          <a href="/" className="logo">
            <div className="logo-icon">⚡</div>
            <span className="logo-text">DevScore.ai</span>
          </a>
          <span className="nav-badge">BETA · Free</span>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="hero">
          <div className="container">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              AI-powered · Instant · Free
            </div>
            <h1 className="hero-title">
              Will companies hire you<br />
              <span className="gradient-text">based on your GitHub?</span>
            </h1>
            <p className="hero-subtitle">
              Paste any GitHub repo link. Get an instant AI-powered review:
              code quality, README, structure, resume tips &amp; hiring readiness score.
            </p>

            {/* Analyzer */}
            <div className="analyzer-card">
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
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyse()}
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <button
                  id="analyze-btn"
                  className="analyze-btn"
                  onClick={() => handleAnalyse()}
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
                    onClick={() => {
                      setRepoUrl(ex);
                      handleAnalyse(ex);
                    }}
                  >
                    {ex.replace("https://github.com/", "")}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="error-card">
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div>
                  <strong>Error: </strong>{error}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <section className="loading-section container">
            <div className="loading-card">
              <div className="loading-spinner-wrapper">
                <div className="loading-spinner" />
                <div className="loading-spinner-inner" />
              </div>
              <h2 className="loading-title">Analysing Repository…</h2>
              <p className="loading-subtitle">This takes 10–30 seconds. Hang tight!</p>
              <div className="loading-steps">
                {STEPS.map((s, i) => (
                  <div
                    key={i}
                    className={`loading-step${i < step ? " done" : i === step ? " active" : ""}`}
                  >
                    <div className="step-icon">
                      {i < step ? "✓" : i === step ? "●" : String(i + 1)}
                    </div>
                    {s.label}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Results */}
        {result && !loading && (
          <section ref={resultsRef} className="results-section container">

            {/* Score Header */}
            <div className="score-header">
              <div className="score-header-inner">
                <div className="score-circle-wrapper">
                  <div
                    className="score-circle"
                    style={{ "--pct": pct } as React.CSSProperties}
                  >
                    <div className="score-circle-inner">
                      <span
                        className="score-number"
                        style={{ color: scoreColor(result.overallScore) }}
                      >
                        {result.overallScore}
                      </span>
                      <span className="score-label">/ 10</span>
                    </div>
                  </div>
                </div>

                <div className="score-info">
                  <h2 className="repo-name">
                    {repoMeta?.full_name || "Repository"}
                  </h2>
                  <div className={`hiring-badge ${result.hiringReadinessClass}`}>
                    {result.hiringReadiness === "Great Fit" ? "🟢" :
                      result.hiringReadiness === "Good Candidate" ? "🔵" :
                        result.hiringReadiness === "Needs Work" ? "🟡" : "🔴"}
                    {" "}{result.hiringReadiness}
                  </div>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {result.summary}
                  </p>
                  {repoMeta?.html_url && (
                    <a
                      href={repoMeta.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-block", marginTop: 12, fontSize: 13, color: "var(--indigo-light)" }}
                    >
                      View on GitHub →
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Mini scores */}
            <div className="mini-scores-grid">
              {result.subScores.map((sub) => (
                <div key={sub.name} className="mini-score-card">
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
                    <div
                      className="mini-bar-fill"
                      style={{
                        width: `${sub.score * 10}%`,
                        background: scoreColor(sub.score),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="tabs">
              {[
                { id: "issues", label: "🚨 Issues", count: result.issues.length },
                { id: "suggestions", label: "💡 Suggestions" },
                { id: "readme", label: "📄 README Fix" },
                { id: "resume", label: "💼 Resume Tips" },
                { id: "strengths", label: "✨ Strengths" },
                { id: "stats", label: "📊 Stats" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span
                      style={{
                        background: "rgba(255,255,255,0.15)",
                        borderRadius: "100px",
                        padding: "1px 7px",
                        fontSize: "11px",
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab: Issues */}
            {activeTab === "issues" && (
              <div className="content-card">
                <div className="card-title">
                  <div className="card-icon" style={{ background: "rgba(239,68,68,0.1)" }}>🚨</div>
                  Problems Found
                </div>
                {result.issues.length === 0 ? (
                  <p style={{ color: "var(--emerald)", fontSize: 14 }}>
                    ✅ No major issues found. Great repo!
                  </p>
                ) : (
                  result.issues.map((issue, i) => (
                    <div key={i} className="issue-item">
                      <span className={`issue-severity severity-${issue.severity}`}>
                        {issue.severity}
                      </span>
                      <div className="issue-text">
                        <strong>{issue.title}</strong>
                        <br />
                        {issue.description}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Suggestions */}
            {activeTab === "suggestions" && (
              <div className="content-card">
                <div className="card-title">
                  <div className="card-icon" style={{ background: "rgba(99,102,241,0.1)" }}>💡</div>
                  Improvement Suggestions
                </div>
                {result.suggestions.map((s, i) => (
                  <div key={i} className="suggestion-item">
                    <div className="suggestion-num">{i + 1}</div>
                    <div className="suggestion-text">
                      <strong>{s.title}</strong>
                      <br />
                      {s.detail}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: README */}
            {activeTab === "readme" && (
              <div className="content-card">
                <div className="card-title">
                  <div className="card-icon" style={{ background: "rgba(6,182,212,0.1)" }}>📄</div>
                  Suggested README Template
                </div>
                <button className="copy-btn" onClick={copyReadme}>
                  {copied ? "✅ Copied!" : "📋 Copy to clipboard"}
                </button>
                <pre className="readme-section">{result.readmeSuggestion}</pre>
              </div>
            )}

            {/* Tab: Resume */}
            {activeTab === "resume" && (
              <div className="content-card">
                <div className="card-title">
                  <div className="card-icon" style={{ background: "rgba(16,185,129,0.1)" }}>💼</div>
                  Resume & Portfolio Tips
                </div>
                {result.resumeTips.map((tip, i) => (
                  <div key={i} className="resume-tip">
                    <div className="resume-tip-icon">{tip.icon}</div>
                    <div className="resume-tip-content">
                      <div className="resume-tip-title">{tip.title}</div>
                      <div className="resume-tip-text">{tip.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Strengths */}
            {activeTab === "strengths" && (
              <div className="content-card">
                <div className="card-title">
                  <div className="card-icon" style={{ background: "rgba(245,158,11,0.1)" }}>✨</div>
                  Project Strengths
                </div>
                {result.strengths.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
                    No notable strengths detected yet. Keep building!
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {result.strengths.map((s, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "12px 16px",
                          background: "rgba(16,185,129,0.06)",
                          border: "1px solid rgba(16,185,129,0.15)",
                          borderRadius: "var(--radius-md)",
                          fontSize: 14,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Stats */}
            {activeTab === "stats" && (
              <div className="content-card">
                <div className="card-title">
                  <div className="card-icon" style={{ background: "rgba(124,58,237,0.1)" }}>📊</div>
                  Repository Statistics
                </div>
                <div className="stats-grid">
                  {result.stats.map((stat, i) => (
                    <div key={i} className="stat-item">
                      <div className="stat-value">{stat.value}</div>
                      <div className="stat-label">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share */}
            <div className="share-section">
              <div className="share-title">🚀 Share your score!</div>
              <div className="share-subtitle">
                Developers who share results get 3× more profile views
              </div>
              <div className="share-buttons">
                <button className="share-btn share-btn-twitter" onClick={shareOnTwitter}>
                  𝕏 Tweet your score
                </button>
                <button
                  className="share-btn share-btn-copy"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `My GitHub repo scored ${result.overallScore}/10 on DevScore.ai — ${result.hiringReadiness}. Check yours at devscore.ai`
                    );
                  }}
                >
                  📋 Copy link
                </button>
              </div>
            </div>

            {/* Analyse another */}
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button
                className="analyze-btn"
                style={{ margin: "0 auto" }}
                onClick={() => {
                  setResult(null);
                  setRepoMeta(null);
                  setRepoUrl("");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                ⚡ Analyse another repo
              </button>
            </div>
          </section>
        )}

        {/* Feature strip */}
        {!result && !loading && (
          <section className="features-strip">
            <div className="container">
              <h2 className="features-title">Everything developers need to stand out</h2>
              <p className="features-subtitle">Comprehensive repo intelligence in seconds — no sign-up required</p>
              <div className="features-grid">
                {[
                  { icon: "⚡", bg: "rgba(99,102,241,0.12)", name: "Overall Repo Score", desc: "A 0–10 composite score based on code quality, documentation, tests, and activity." },
                  { icon: "🚨", bg: "rgba(239,68,68,0.1)", name: "Issues Detected", desc: "Critical problems highlighted with severity — missing README, no tests, no license, and more." },
                  { icon: "💡", bg: "rgba(245,158,11,0.1)", name: "AI Suggestions", desc: "Specific, actionable steps to raise your score and make the repo job-application ready." },
                  { icon: "📄", bg: "rgba(6,182,212,0.1)", name: "README Generator", desc: "Get a professional README template tailored to your specific repository." },
                  { icon: "💼", bg: "rgba(16,185,129,0.1)", name: "Resume Tips", desc: "Learn how to present this project on your CV and LinkedIn to impress recruiters." },
                  { icon: "🎯", bg: "rgba(236,72,153,0.1)", name: "Hiring Readiness", desc: "A final verdict — Great Fit, Good Candidate, Needs Work, or Not Ready." },
                ].map((f) => (
                  <div key={f.name} className="feature-card">
                    <div className="feature-icon" style={{ background: f.bg }}>
                      {f.icon}
                    </div>
                    <div className="feature-name">{f.name}</div>
                    <div className="feature-desc">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-logo">DevScore.ai</div>
          <p>AI-powered GitHub project reviewer &nbsp;·&nbsp; Free &amp; open-source · Built for developers</p>
        </div>
      </footer>
    </>
  );
}
