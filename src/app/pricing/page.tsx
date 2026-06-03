"use client";

import { motion } from "framer-motion";
import ErrorBoundary from "@/components/ErrorBoundary";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for getting started",
    features: [
      "3 repo analyses per day",
      "Heuristic scoring engine",
      "README generator",
      "Resume tips",
      "Social sharing",
      "Basic CLI access",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$5",
    period: "/month",
    desc: "For serious developers",
    features: [
      "Unlimited analyses",
      "GPT-4o deep AI analysis",
      "PDF report export",
      "Badge generation",
      "History & tracking",
      "Compare repos",
      "Full CLI access (all commands)",
      "Priority support",
    ],
    cta: "Go Pro",
    popular: true,
  },
  {
    name: "Team",
    price: "$19",
    period: "/month",
    desc: "For engineering teams",
    features: [
      "Everything in Pro",
      "PR Doctor — unlimited PR health analyses",
      "Conflict Explainer with AI resolution",
      "Team dashboard with repo overview",
      "Interview Simulator — unlimited sessions",
      "Repo health timelines & trends",
      "Contributor DNA profiles",
      "PR Health badges for all repos",
      "Up to 5 team seats",
      "Slack/Discord integration",
    ],
    cta: "Go Team",
    popular: false,
  },
  {
    name: "Enterprise",
    price: "$49",
    period: "/month",
    desc: "For companies & recruiters",
    features: [
      "Everything in Team",
      "Up to 25 team seats",
      "Recruiter dashboard & candidate search",
      "Bulk candidate analysis (500+/day)",
      "Batch analysis (up to 100 repos)",
      "API access (5000 req/day)",
      "GitHub Action integration",
      "Custom branding on reports",
      "SSO / SAML",
      "Dedicated support & SLA",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function PricingPage() {
  return (
    <ErrorBoundary>
      <Nav />
      <main style={{ paddingTop: 120, paddingBottom: 80 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center", marginBottom: 60 }}
        >
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(2.2rem, 5vw, 3.5rem)", fontWeight: 800, marginBottom: 16 }}>
            Simple, <span className="gradient-text" style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Transparent</span> Pricing
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: 500, margin: "0 auto" }}>
            Start free, upgrade when you need more power
          </p>
        </motion.div>

        <div className="container" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24, maxWidth: 1100 }}>
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              style={{
                background: plan.popular ? "var(--gradient-card)" : "var(--bg-card)",
                border: plan.popular ? "1px solid var(--indigo)" : "1px solid var(--border)",
                borderRadius: "var(--radius-xl)",
                padding: 36,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {plan.popular && (
                <div style={{
                  position: "absolute",
                  top: 16,
                  right: -32,
                  background: "var(--gradient-primary)",
                  color: "white",
                  padding: "4px 40px",
                  fontSize: 11,
                  fontWeight: 700,
                  transform: "rotate(45deg)",
                  letterSpacing: "0.05em",
                }}>
                  POPULAR
                </div>
              )}

              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.2rem", fontWeight: 700, marginBottom: 4 }}>{plan.name}</h3>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2.8rem", fontWeight: 800 }}>{plan.price}</span>
                  <span style={{ color: "var(--text-muted)", fontSize: 14 }}>{plan.period}</span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>{plan.desc}</p>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                    <span style={{ color: "var(--emerald)" }}>✓</span> {f}
                  </li>
                ))}
              </ul>

              <button
                className="analyze-btn"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  background: plan.popular ? "var(--gradient-primary)" : "rgba(255,255,255,0.05)",
                  boxShadow: plan.popular ? "var(--shadow-button)" : "none",
                  border: plan.popular ? "none" : "1px solid var(--border)",
                }}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="container"
          style={{ textAlign: "center", marginTop: 60, padding: "40px 24px", borderTop: "1px solid var(--border)" }}
        >
          <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.3rem", fontWeight: 700, marginBottom: 8 }}>
            🚀 Startup Special
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
            We&apos;re in beta! All features are currently free. Lock in Pro pricing at launch by signing up for early access.
          </p>
          <div className="input-group" style={{ maxWidth: 400, margin: "20px auto 0" }}>
            <div className="input-wrapper">
              <input className="repo-input" placeholder="your@email.com" style={{ paddingLeft: 16 }} />
            </div>
            <button className="analyze-btn">Get Early Access</button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </ErrorBoundary>
  );
}
