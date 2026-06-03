"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { AnalysisResult } from "@/lib/types";

interface BadgeSectionProps {
  result: AnalysisResult;
  repoFullName: string;
}

export default function BadgeSection({ result, repoFullName }: BadgeSectionProps) {
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const score = result.overallScore;
  let color = "brightgreen";
  if (score >= 8) color = "brightgreen";
  else if (score >= 6) color = "green";
  else if (score >= 4) color = "orange";
  else color = "red";

  const badgeUrl = `https://img.shields.io/badge/DevScore-${score}%2F10-${color}?style=flat`;

  const markdown = `[![DevScore](https://img.shields.io/badge/DevScore-${score}%2F10-${color})](https://devscore.ai)`;
  const html = `<a href="https://devscore.ai"><img src="https://img.shields.io/badge/DevScore-${score}%2F10-${color}" alt="DevScore: ${score}/10" /></a>`;

  async function copy(text: string, setter: (v: boolean) => void) {
    await navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  return (
    <motion.div
      className="share-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="share-title">📛 Badge Generator</div>
      <div className="share-subtitle">
        Add a DevScore badge to your README to show off your score
      </div>

      {/* Preview */}
      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: 20,
        marginBottom: 16,
      }}>
        <img src={badgeUrl} alt={`DevScore: ${score}/10`} style={{ display: "block", margin: "0 auto" }} />
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          className="share-btn share-btn-copy"
          onClick={() => copy(markdown, setCopiedMd)}
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
        >
          {copiedMd ? "✅ Copied!" : "📋 Copy Markdown"}
        </button>
        <button
          className="share-btn share-btn-copy"
          onClick={() => copy(html, setCopiedHtml)}
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
        >
          {copiedHtml ? "✅ Copied!" : "🌐 Copy HTML"}
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Markdown:</p>
        <pre style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: "var(--text-secondary)",
          background: "rgba(255,255,255,0.03)",
          padding: 10,
          borderRadius: "var(--radius-sm)",
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}>
          {markdown}
        </pre>
      </div>
    </motion.div>
  );
}
