"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnalysisResult } from "@/lib/types";

interface TabsSectionProps {
  result: AnalysisResult;
}

const TABS = [
  { id: "issues", label: "🚨 Issues", countKey: "issues" as const },
  { id: "suggestions", label: "💡 Suggestions", countKey: null },
  { id: "readme", label: "📄 README Fix", countKey: null },
  { id: "resume", label: "💼 Resume Tips", countKey: null },
  { id: "strengths", label: "✨ Strengths", countKey: null },
  { id: "stats", label: "📊 Stats", countKey: null },
];

const tabContentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.15 } },
};

export default function TabsSection({ result }: TabsSectionProps) {
  const [activeTab, setActiveTab] = useState("issues");
  const [copied, setCopied] = useState(false);

  function copyReadme() {
    if (result?.readmeSuggestion) {
      navigator.clipboard.writeText(result.readmeSuggestion);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <>
      {/* Tabs */}
      <div className="tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`tab-btn${activeTab === tab.id ? " active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.countKey && result[tab.countKey].length > 0 && (
              <span
                style={{
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: "100px",
                  padding: "1px 7px",
                  fontSize: "11px",
                }}
              >
                {result[tab.countKey].length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={tabContentVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {activeTab === "issues" && <IssuesTab issues={result.issues} />}
          {activeTab === "suggestions" && <SuggestionsTab suggestions={result.suggestions} />}
          {activeTab === "readme" && (
            <ReadmeTab
              readmeSuggestion={result.readmeSuggestion}
              copied={copied}
              onCopy={copyReadme}
            />
          )}
          {activeTab === "resume" && <ResumeTab tips={result.resumeTips} />}
          {activeTab === "strengths" && <StrengthsTab strengths={result.strengths} />}
          {activeTab === "stats" && <StatsTab stats={result.stats} />}
        </motion.div>
      </AnimatePresence>
    </>
  );
}

// ── Issues Tab ──────────────────────────────────────────────────────────
function IssuesTab({ issues }: { issues: AnalysisResult["issues"] }) {
  return (
    <div className="content-card">
      <div className="card-title">
        <div className="card-icon" style={{ background: "rgba(239,68,68,0.1)" }}>🚨</div>
        Problems Found
      </div>
      {issues.length === 0 ? (
        <p style={{ color: "var(--emerald)", fontSize: 14 }}>
          ✅ No major issues found. Great repo!
        </p>
      ) : (
        issues.map((issue, i) => (
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
  );
}

// ── Suggestions Tab ─────────────────────────────────────────────────────
function SuggestionsTab({ suggestions }: { suggestions: AnalysisResult["suggestions"] }) {
  return (
    <div className="content-card">
      <div className="card-title">
        <div className="card-icon" style={{ background: "rgba(99,102,241,0.1)" }}>💡</div>
        Improvement Suggestions
      </div>
      {suggestions.map((s, i) => (
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
  );
}

// ── README Tab ──────────────────────────────────────────────────────────
function ReadmeTab({
  readmeSuggestion,
  copied,
  onCopy,
}: {
  readmeSuggestion: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="content-card">
      <div className="card-title">
        <div className="card-icon" style={{ background: "rgba(6,182,212,0.1)" }}>📄</div>
        Suggested README Template
      </div>
      <button className="copy-btn" onClick={onCopy}>
        {copied ? "✅ Copied!" : "📋 Copy to clipboard"}
      </button>
      <pre className="readme-section">{readmeSuggestion}</pre>
    </div>
  );
}

// ── Resume Tab ──────────────────────────────────────────────────────────
function ResumeTab({ tips }: { tips: AnalysisResult["resumeTips"] }) {
  return (
    <div className="content-card">
      <div className="card-title">
        <div className="card-icon" style={{ background: "rgba(16,185,129,0.1)" }}>💼</div>
        Resume & Portfolio Tips
      </div>
      {tips.map((tip, i) => (
        <div key={i} className="resume-tip">
          <div className="resume-tip-icon">{tip.icon}</div>
          <div className="resume-tip-content">
            <div className="resume-tip-title">{tip.title}</div>
            <div className="resume-tip-text">{tip.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Strengths Tab ───────────────────────────────────────────────────────
function StrengthsTab({ strengths }: { strengths: AnalysisResult["strengths"] }) {
  return (
    <div className="content-card">
      <div className="card-title">
        <div className="card-icon" style={{ background: "rgba(245,158,11,0.1)" }}>✨</div>
        Project Strengths
      </div>
      {strengths.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          No notable strengths detected yet. Keep building!
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {strengths.map((s, i) => (
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
  );
}

// ── Stats Tab ───────────────────────────────────────────────────────────
function StatsTab({ stats }: { stats: AnalysisResult["stats"] }) {
  return (
    <div className="content-card">
      <div className="card-title">
        <div className="card-icon" style={{ background: "rgba(124,58,237,0.1)" }}>📊</div>
        Repository Statistics
      </div>
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="stat-item"
          >
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
