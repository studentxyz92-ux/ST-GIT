"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnalysisResult } from "@/lib/types";

interface FixFile {
  path: string;
  content: string;
  description: string;
  icon: string;
  critical: boolean;
}

interface RepoDoctorProps {
  result: AnalysisResult;
  repoUrl: string;
  repoFullName: string;
}

export default function RepoDoctor({ result, repoUrl, repoFullName }: RepoDoctorProps) {
  const [loading, setLoading] = useState(false);
  const [fixes, setFixes] = useState<FixFile[] | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");
  const [creatingPR, setCreatingPR] = useState(false);
  const [prUrl, setPrUrl] = useState("");

  const hasIssues = result.issues.length > 0;
  const criticalIssues = result.issues.filter((i) => i.severity === "critical").length;
  const warningIssues = result.issues.filter((i) => i.severity === "warning").length;
  const infoIssues = result.issues.filter((i) => i.severity === "info").length;

  const githubToken = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("github_token")
    : null;
  const githubUser = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("github_user")
    : null;

  const handleGenerateFixes = useCallback(async () => {
    setLoading(true);
    setError("");
    setFixes(null);

    try {
      const res = await fetch("/api/fix-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoUrl,
          issues: result.issues.map((i) => i.title.toLowerCase()),
          language: result.strengths.find((s) => s.includes("language")) || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Failed to generate fixes");
      } else if (data.message) {
        setError(data.message);
      } else {
        setFixes(data.fixes);
        if (data.fixes.length > 0) {
          setActiveFile(data.fixes[0].path);
        }
        setExpanded(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [repoUrl, result.issues, result.strengths]);

  const handleCopyFile = useCallback(async (file: FixFile) => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopiedFile(file.path);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = file.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedFile(file.path);
      setTimeout(() => setCopiedFile(null), 2000);
    }
  }, []);

  const handleDownloadFile = useCallback((file: FixFile) => {
    const blob = new Blob([file.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.path.split("/").pop() || file.path;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleDownloadAll = useCallback(() => {
    if (!fixes) return;
    // Create a combined markdown file
    const combined = fixes
      .map((f) => `# ${f.path}\n\n\`\`\`\n${f.content}\n\`\`\``)
      .join("\n\n---\n\n");
    const blob = new Blob([combined], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${repoFullName.replace("/", "-")}-fixes.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [fixes, repoFullName]);

  const handleCreatePR = useCallback(async () => {
    if (!githubToken) {
      // Redirect to login
      window.location.href = "/api/auth/github/login";
      return;
    }

    setCreatingPR(true);
    setError("");

    try {
      const res = await fetch("/api/fix-repo/pr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${githubToken}`,
        },
        body: JSON.stringify({
          repoFullName,
          fixes,
          defaultBranch: "main",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Failed to create PR");
      } else {
        setPrUrl(data.prUrl);
      }
    } catch {
      setError("Failed to create PR. Make sure your token has repo scope.");
    } finally {
      setCreatingPR(false);
    }
  }, [githubToken, repoFullName, fixes]);

  const activeFix = fixes?.find((f) => f.path === activeFile);

  // Don't show if no issues
  if (!hasIssues && result.overallScore >= 8) return null;

  return (
    <motion.div
      className="share-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <div className="share-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          🔧 AI Repo Doctor
          <span
            style={{
              background: "rgba(99,102,241,0.2)",
              border: "1px solid rgba(99,102,241,0.3)",
              color: "var(--indigo-light)",
              padding: "2px 10px",
              borderRadius: 100,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            BETA
          </span>
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {criticalIssues} critical · {warningIssues} warnings · {infoIssues} info
        </span>
      </div>

      <p className="share-subtitle" style={{ marginBottom: 16 }}>
        Auto-generate fixes for the issues found — add a README, license, tests, CI/CD, and more
      </p>

      {/* Generate button */}
      {!fixes && !loading && (
        <button className="analyze-btn" onClick={handleGenerateFixes} style={{ margin: "0 auto" }}>
          🔧 Generate Fixes
        </button>
      )}

      {/* PR URL success */}
      {prUrl && (
        <motion.div
          className="error-card"
          style={{
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.25)",
            color: "var(--emerald)",
            marginTop: 16,
            cursor: "pointer",
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => window.open(prUrl, "_blank")}
        >
          <span>🎉</span>
          <div>
            <strong>PR Created!</strong>{" "}
            <a href={prUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--emerald)", textDecoration: "underline" }}>
              {prUrl}
            </a>
          </div>
        </motion.div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: 24 }}>
          <div className="loading-spinner-wrapper" style={{ width: 40, height: 40, margin: "0 auto 12px" }}>
            <div className="loading-spinner" style={{ width: 40, height: 40 }} />
            <div className="loading-spinner-inner" style={{ top: 5, left: 5, right: 5, bottom: 5 }} />
          </div>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>AI is generating fixes for your repo...</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && !prUrl && (
        <motion.div
          className="error-card"
          style={{ marginTop: 12, fontSize: 13 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span>ℹ️</span> {error}
        </motion.div>
      )}

      {/* Fix files listing */}
      {fixes && fixes.length > 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* File tabs */}
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 12,
              padding: 4,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              overflowX: "auto",
            }}
          >
            {fixes.map((file) => {
              const isActive = activeFile === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setActiveFile(file.path)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: "var(--radius-sm)",
                    background: isActive ? "var(--gradient-primary)" : "transparent",
                    color: isActive ? "white" : "var(--text-secondary)",
                    fontSize: 11,
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s ease",
                  }}
                >
                  {file.icon} {file.path.split("/").pop()}
                  {file.critical && (
                    <span style={{ color: "var(--red)", fontSize: 10 }}>●</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active file preview */}
          {activeFix && (
            <motion.div
              key={activeFix.path}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                    {activeFix.path}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 8 }}>
                    {activeFix.description}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="copy-btn"
                    style={{ margin: 0, fontSize: 11, padding: "6px 12px" }}
                    onClick={() => handleCopyFile(activeFix)}
                  >
                    {copiedFile === activeFix.path ? "✅ Copied!" : "📋 Copy"}
                  </button>
                  <button
                    className="copy-btn"
                    style={{ margin: 0, fontSize: 11, padding: "6px 12px" }}
                    onClick={() => handleDownloadFile(activeFix)}
                  >
                    ⬇️ Download
                  </button>
                </div>
              </div>

              <pre
                className="readme-section"
                style={{ maxHeight: 300, fontSize: 12, padding: 16 }}
              >
                {activeFix.content}
              </pre>
            </motion.div>
          )}

          {/* Action buttons */}
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: 16,
            }}
          >
            <button
              className="share-btn"
              style={{
                background: githubToken
                  ? "var(--gradient-primary)"
                  : "rgba(99,102,241,0.15)",
                border: "1px solid var(--indigo)",
                color: githubToken ? "white" : "var(--indigo-light)",
              }}
              onClick={handleCreatePR}
              disabled={creatingPR}
            >
              {creatingPR ? (
                <>⏳ Creating PR...</>
              ) : githubToken ? (
                <>🔄 Create Pull Request</>
              ) : (
                <>🔗 Connect GitHub to Create PR</>
              )}
            </button>

            <button
              className="share-btn share-btn-copy"
              onClick={handleDownloadAll}
            >
              📦 Download All Fixes
            </button>
          </div>

          {!githubToken && (
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 10 }}>
              Connect your GitHub account to create a pull request with all fixes applied
            </p>
          )}

          {githubToken && (
            <p style={{ fontSize: 11, color: "var(--emerald)", marginTop: 10 }}>
              ✅ Connected as @{githubUser} — PR will be created on your behalf
            </p>
          )}
        </motion.div>
      )}

      {/* "Already fixed" message */}
      {fixes && fixes.length === 0 && !loading && (
        <motion.div
          className="error-card"
          style={{
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.25)",
            color: "var(--emerald)",
            marginTop: 16,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span>✅</span> This repo already looks great! No automated fixes needed.
        </motion.div>
      )}
    </motion.div>
  );
}
