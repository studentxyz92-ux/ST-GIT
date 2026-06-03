"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { AnalysisResult } from "@/lib/types";

interface ShareSectionProps {
  result: AnalysisResult;
}

export default function ShareSection({ result }: ShareSectionProps) {
  const [copied, setCopied] = useState(false);

  function shareOnTwitter() {
    const text = `I just scored my GitHub repo on DevScore.ai 🚀\n\nScore: ${result.overallScore}/10 — ${result.hiringReadiness}\n\nCheck yours 👇`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://devscore.ai")}`,
      "_blank"
    );
  }

  return (
    <motion.div
      className="share-section"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
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
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        >
          {copied ? "✅ Copied!" : "📋 Copy link"}
        </button>
      </div>
    </motion.div>
  );
}
