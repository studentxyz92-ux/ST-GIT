"use client";

import { motion } from "framer-motion";

interface ConflictFile {
  path: string;
  explanation: string;
  currentChanges: string;
  incomingChanges: string;
  suggestedAction: string;
  risk: string;
}

interface ConflictData {
  conflicts: ConflictFile[];
  totalConflicts: number;
  message: string;
  prInfo?: {
    number: number;
    title: string;
    baseBranch: string;
    headBranch: string;
  };
}

export default function ConflictExplainer({
  prUrl,
  loading,
  data,
}: {
  prUrl: string;
  loading: boolean;
  data: ConflictData | null;
}) {
  if (loading) {
    return (
      <div className="loading-section">
        <div className="loading-card">
          <div className="loading-spinner-wrapper">
            <div className="loading-spinner" /><div className="loading-spinner-inner" />
          </div>
          <h3 className="loading-title">Scanning for conflicts...</h3>
          <p className="loading-subtitle">Analysing PR files for merge conflicts</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="content-card" style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>No Conflict Data</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Run a PR health analysis first, then check for conflicts.
        </p>
      </div>
    );
  }

  const noConflicts = data.totalConflicts === 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Summary Banner */}
      <div
        className="content-card"
        style={{
          background: noConflicts ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)",
          border: noConflicts ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(245,158,11,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>{noConflicts ? "✅" : "⚠️"}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: noConflicts ? "var(--emerald)" : "var(--amber)", marginBottom: 4 }}>
              {noConflicts ? "No Conflicts Detected" : `${data.totalConflicts} Conflict${data.totalConflicts > 1 ? "s" : ""} Found`}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              {data.message}
            </div>
          </div>
        </div>
      </div>

      {/* Conflict Cards */}
      {data.conflicts.map((conflict, i) => (
        <motion.div
          key={conflict.path}
          className="content-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <h3 className="card-title">
            <span className="card-icon" style={{ background: conflict.risk === "high" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)" }}>
              📄
            </span>
            {conflict.path}
            <span
              style={{
                marginLeft: "auto",
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 4,
                background: conflict.risk === "high" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)",
                color: conflict.risk === "high" ? "var(--red)" : "var(--amber)",
                fontWeight: 600,
              }}
            >
              {conflict.risk.toUpperCase()} RISK
            </span>
          </h3>

          {/* Explanation */}
          <div
            style={{
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.15)",
              borderRadius: "var(--radius-md)",
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--indigo-light)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              💡 What Happened
            </div>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {conflict.explanation}
            </p>
          </div>

          {/* 3-Panel View */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div
              style={{
                background: "#0d1117",
                borderRadius: "var(--radius-sm)",
                padding: 12,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: "#c9d1d9",
                lineHeight: 1.5,
                maxHeight: 150,
                overflow: "auto",
              }}
            >
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                ← Your Branch (Current)
              </div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {conflict.currentChanges || "(deleted)"}
              </pre>
            </div>
            <div
              style={{
                background: "#0d1117",
                borderRadius: "var(--radius-sm)",
                padding: 12,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                color: "#c9d1d9",
                lineHeight: 1.5,
                maxHeight: 150,
                overflow: "auto",
              }}
            >
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                → Incoming (Their Branch)
              </div>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {conflict.incomingChanges || "(deleted)"}
              </pre>
            </div>
          </div>

          {/* Suggested Resolution */}
          <div
            style={{
              background: "rgba(16,185,129,0.06)",
              border: "1px solid rgba(16,185,129,0.15)",
              borderRadius: "var(--radius-md)",
              padding: 12,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--emerald)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              ✅ Recommended Resolution
            </div>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {conflict.suggestedAction}
            </p>
          </div>
        </motion.div>
      ))}

      {/* No conflicts card */}
      {noConflicts && (
        <div className="content-card" style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <h3 style={{ fontWeight: 600, marginBottom: 8 }}>PR is Conflict-Free</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 400, margin: "0 auto" }}>
            This PR has no merge conflicts. Add the PR Health badge to your PR description to show reviewers the status.
          </p>
          <button
            className="analyze-btn"
            style={{ margin: "16px auto 0", fontSize: 12 }}
            onClick={() => {
              const badgeUrl = `${window.location.origin}/api/badge/pr?url=${encodeURIComponent(prUrl)}`;
              navigator.clipboard.writeText(
                `[![PR Health](${badgeUrl})](${window.location.origin}/pr)`
              );
            }}
          >
            📋 Copy PR Badge Markdown
          </button>
        </div>
      )}
    </motion.div>
  );
}
