"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import QuestionCard from "@/components/interview/QuestionCard";

interface Question {
  category: string;
  question: string;
  context: string;
  difficulty: string;
  modelAnswer: string;
  keyConcepts: string[];
}

interface RepoInfo {
  name: string;
  full_name: string;
  description: string;
  language: string;
  languages: Array<{ name: string; percentage: number }>;
  stars: number;
  forks: number;
}

export default function InterviewPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, string>>({});

  async function handleGenerate() {
    if (!repoUrl.trim()) return;
    setLoading(true);
    setError("");
    setQuestions([]);
    setRepoInfo(null);
    setShowAnswers({});
    setUserAnswers({});
    setFeedback({});

    try {
      const res = await fetch("/api/interview/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Generation failed");
      } else {
        setQuestions(data.questions);
        setRepoInfo(data.repoInfo);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleAnswer(i: number) {
    setShowAnswers((prev) => ({ ...prev, [i]: !prev[i] }));
  }

  function handleAnswerChange(i: number, answer: string) {
    setUserAnswers((prev) => ({ ...prev, [i]: answer }));
  }

  function generateFeedback(i: number) {
    const question = questions[i];
    const answer = userAnswers[i];
    if (!answer || answer.trim().length < 10) return;

    const answerLength = answer.trim().split(/\s+/).length;
    let fb = "";

    if (answerLength < 20) {
      fb = "⚠️ Your answer is too brief. Expand with specific examples from your project.";
    } else {
      fb = "✅ Good effort! Key points to cover:\n";
      const matched = question.keyConcepts.filter((c) =>
        answer.toLowerCase().includes(c.toLowerCase())
      );
      if (matched.length > 0) {
        fb += `✅ You mentioned: ${matched.join(", ")}\n`;
      } else {
        fb += `⚠️ Consider addressing: ${question.keyConcepts.join(", ")}\n`;
      }
      fb += `\nFor comparison:\n💡 ${question.modelAnswer.substring(0, 200)}...`;
    }

    setFeedback((prev) => ({ ...prev, [i]: fb }));
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
            AI-Powered · Real Questions · Free
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, marginBottom: 12 }}>
            <span className="gradient-text" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Interview Simulator
            </span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", maxWidth: 520, margin: "0 auto" }}>
            Paste your GitHub repo URL. We generate realistic interview questions based on your actual code.
            Practice answering and get feedback.
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
              <span className="input-icon">🎯</span>
              <input
                className="repo-input"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                disabled={loading}
              />
            </div>
            <button className="analyze-btn" onClick={handleGenerate} disabled={loading || !repoUrl.trim()}>
              {loading ? "Generating..." : "🎯 Generate Questions"}
              {loading && <span className="analyze-btn-shimmer" />}
            </button>
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
                <h3 className="loading-title">Generating Interview Questions</h3>
                <p className="loading-subtitle">Analysing repo, generating questions based on your code...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {repoInfo && !loading && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            {/* Repo Info Card */}
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
                  🎯
                </div>
                <div className="score-info">
                  <div className="repo-name" style={{ fontSize: "1.3rem" }}>
                    {repoInfo.full_name}
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 8 }}>
                    {repoInfo.description || "No description"}
                  </p>
                  <div className="score-meta">
                    <span className="score-meta-item">💻 {repoInfo.language}</span>
                    <span className="score-meta-item">⭐ {repoInfo.stars} stars</span>
                    <span className="score-meta-item">🍴 {repoInfo.forks} forks</span>
                    <span className="score-meta-item">📋 {questions.length} questions</span>
                  </div>
                  {/* Language breakdown */}
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    {repoInfo.languages.map((lang) => (
                      <span
                        key={lang.name}
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          borderRadius: 4,
                          padding: "2px 8px",
                          fontSize: 11,
                          color: "var(--text-muted)",
                        }}
                      >
                        {lang.name} {lang.percentage}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Questions */}
            {questions.map((q, i) => (
              <QuestionCard
                key={i}
                question={q}
                index={i}
                showAnswer={!!showAnswers[i]}
                onToggleAnswer={() => toggleAnswer(i)}
                userAnswer={userAnswers[i]}
                feedback={feedback[i]}
                onChangeAnswer={(answer) => handleAnswerChange(i, answer)}
              />
            ))}

            {/* Global actions */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
              <button
                className="analyze-btn"
                onClick={() => {
                  Object.keys(userAnswers).forEach((i) => {
                    const idx = parseInt(i);
                    if (userAnswers[idx]?.trim().length > 10) {
                      generateFeedback(idx);
                    }
                  });
                }}
                style={{ fontSize: 13 }}
              >
                📝 Get Feedback on All Answers
              </button>
              <button
                className="analyze-btn"
                onClick={() => {
                  setShowAnswers({});
                  setUserAnswers({});
                  setFeedback({});
                }}
                style={{ fontSize: 13, background: "rgba(255,255,255,0.06)", boxShadow: "none" }}
              >
                🔄 Reset All
              </button>
            </div>
          </motion.div>
        )}

        {!questions.length && !loading && (
          <div className="features-strip" style={{ border: "none", margin: "60px 0" }}>
            <div className="features-grid">
              {[
                { icon: "🎯", name: "Real Questions", desc: "Based on your actual code, not generic LeetCode" },
                { icon: "💡", name: "Model Answers", desc: "See how a senior engineer would answer" },
                { icon: "📝", name: "Practice Mode", desc: "Type your answers and get feedback" },
                { icon: "📊", name: "Category Tags", desc: "Technical, Design, System Design, Behavioral" },
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
