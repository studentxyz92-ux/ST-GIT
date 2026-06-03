"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AnalysisResult } from "@/lib/types";
import ErrorBoundary from "@/components/ErrorBoundary";
import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import LoadingSection from "@/components/LoadingSection";
import ScoreHeader from "@/components/results/ScoreHeader";
import MiniScoresGrid from "@/components/results/MiniScoresGrid";
import TabsSection from "@/components/results/TabsSection";
import ShareSection from "@/components/results/ShareSection";
import ExportSection from "@/components/results/ExportSection";
import BadgeSection from "@/components/results/BadgeSection";
import RepoDoctor from "@/components/results/RepoDoctor";
import FeatureStrip from "@/components/FeatureStrip";
import Footer from "@/components/Footer";

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [repoMeta, setRepoMeta] = useState<{ full_name: string; html_url: string } | null>(null);
  const [error, setError] = useState("");
  const resultsRef = useRef<HTMLDivElement>(null);
  const stepTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate loading steps
  useEffect(() => {
    if (loading) {
      setStep(0);
      let s = 0;
      stepTimer.current = setInterval(() => {
        s = Math.min(s + 1, 5);
        setStep(s);
      }, 1800);
    } else {
      if (stepTimer.current) clearInterval(stepTimer.current);
    }
    return () => {
      if (stepTimer.current) clearInterval(stepTimer.current);
    };
  }, [loading]);

  // Scroll to results
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

  // Handle OAuth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("github_token");
    const user = params.get("github_user");
    if (token && user) {
      // Clean URL params
      const url = new URL(window.location.href);
      url.searchParams.delete("github_token");
      url.searchParams.delete("github_user");
      url.searchParams.delete("github_avatar");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  function resetForm() {
    setResult(null);
    setRepoMeta(null);
    setRepoUrl("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <ErrorBoundary>
      <Nav />

      <main>
        <Hero
          repoUrl={repoUrl}
          setRepoUrl={setRepoUrl}
          loading={loading}
          error={error}
          onAnalyse={handleAnalyse}
        />

        <AnimatePresence>
          {loading && <LoadingSection key="loading" step={step} />}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <motion.section
              key="results"
              ref={resultsRef}
              className="results-section container"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <ScoreHeader result={result} repoMeta={repoMeta} />
              <MiniScoresGrid subScores={result.subScores} />
              <TabsSection result={result} />
              <ExportSection result={result} repoFullName={repoMeta?.full_name || ""} />
              <BadgeSection result={result} repoFullName={repoMeta?.full_name || ""} />
              <RepoDoctor result={result} repoUrl={repoMeta?.html_url || repoUrl} repoFullName={repoMeta?.full_name || ""} />
              <ShareSection result={result} />

              {/* Analyse another */}
              <div style={{ textAlign: "center", marginTop: 24 }}>
                <button
                  className="analyze-btn"
                  style={{ margin: "0 auto" }}
                  onClick={resetForm}
                >
                  ⚡ Analyse another repo
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Features (shown when no results) */}
        {!result && !loading && <FeatureStrip />}
      </main>

      <Footer />
    </ErrorBoundary>
  );
}
