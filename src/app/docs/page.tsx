"use client";

import { motion } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export default function DocsPage() {
  const sections = [
    {
      title: "📡 API Overview",
      content: `DevScore.ai provides a simple REST API to analyse GitHub repositories. \n\nBase URL: https://devscore.ai/api`,
    },
    {
      title: "🔍 Analyse Repository",
      content: `POST /api/analyse
      
Analyses a GitHub repository and returns a comprehensive score.

Request Body:
{
  "repoUrl": "https://github.com/owner/repo"
}

Response:
{
  "result": {
    "overallScore": 7.5,
    "hiringReadiness": "Good Candidate",
    "summary": "...",
    "subScores": [...],
    "issues": [...],
    "suggestions": [...],
    "readmeSuggestion": "...",
    "resumeTips": [...],
    "strengths": [...],
    "stats": [...]
  },
  "repoInfo": {
    "full_name": "owner/repo",
    "html_url": "https://github.com/owner/repo"
  }
}`,
    },
    {
      title: "📦 CLI Tool",
      content: `The DevScore CLI lets you analyse repos from your terminal.

Install: npx devscore
Usage:   devscore analyse owner/repo
         devscore profile username
         devscore compare repo1 repo2
         devscore badge owner/repo
         devscore export owner/repo -f md
         devscore batch repos.txt
         devscore config set GITHUB_TOKEN <token>

Output formats: pretty (default), json, md`,
    },
    {
      title: "🔐 Authentication",
      content: `The API is currently unauthenticated (free tier).
      
For production use, add a GitHub token:
- Header: Authorization: Bearer <token>
- Or env: GITHUB_TOKEN=...

Rate limits: 60 requests/hour without token, 5000 with token.`,
    },
    {
      title: "📊 Score Interpretation",
      content: `8.0 - 10.0: Great Fit — Professional-grade, ready for production
6.0 - 7.9:  Good Candidate — Solid with some room for improvement
4.0 - 5.9:  Needs Work — Foundation exists, needs significant improvements
0.0 - 3.9:  Not Ready — Early stage, needs major work`,
    },
    {
      title: "⚙️ Environment Variables",
      content: `GITHUB_TOKEN=ghp_xxx     GitHub API token (recommended)
OPENAI_API_KEY=sk-xxx    OpenAI key (for AI analysis)`,
    },
  ];

  return (
    <ErrorBoundary>
      <Nav />
      <main className="container" style={{ paddingTop: 120, paddingBottom: 80, maxWidth: 800 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 48 }}
        >
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 800, marginBottom: 12 }}>
            <span className="gradient-text" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Documentation
            </span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem" }}>
            Everything you need to integrate DevScore into your workflow
          </p>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              className="content-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 16 }}>{section.title}</h3>
              <pre
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  background: "rgba(255,255,255,0.03)",
                  padding: 20,
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  overflow: "auto",
                }}
              >
                {section.content}
              </pre>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="share-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ marginTop: 40 }}
        >
          <h3 className="share-title">💬 Need Help?</h3>
          <p className="share-subtitle">
            Check our GitHub issues or reach out for support
          </p>
          <div className="share-buttons">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="share-btn share-btn-twitter">
              📖 View on GitHub
            </a>
          </div>
        </motion.div>
      </main>
      <Footer />
    </ErrorBoundary>
  );
}
