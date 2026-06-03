"use client";

import { motion } from "framer-motion";

interface ScorePoint {
  analysedAt: string;
  overall: number;
  readme: number;
  structure: number;
  tests: number;
  quality: number;
  activity: number;
}

interface Props {
  scores: ScorePoint[];
  repoFull: string;
}

export default function ScoreChart({ scores, repoFull }: Props) {
  if (scores.length === 0) {
    return (
      <div className="content-card" style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📈</div>
        <h3 style={{ fontWeight: 600, marginBottom: 8 }}>No History Yet</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Analyse {repoFull} on the homepage to start tracking its score over time.
        </p>
      </div>
    );
  }

  const maxScore = Math.max(...scores.map((s) => s.overall), 10);
  const minScore = Math.min(...scores.map((s) => s.overall), 0);
  const range = Math.max(maxScore - minScore, 1);

  // Build simple SVG chart
  const width = 700;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = scores.map((s, i) => ({
    x: padding.left + (i / Math.max(scores.length - 1, 1)) * chartW,
    y: padding.top + chartH - ((s.overall - minScore) / range) * chartH,
    score: s.overall,
    date: new Date(s.analysedAt).toLocaleDateString(),
    readme: s.readme,
    structure: s.structure,
    tests: s.tests,
    quality: s.quality,
    activity: s.activity,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  // Area fill
  const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + chartH} L${points[0].x},${padding.top + chartH} Z`;

  const firstScore = scores[0].overall;
  const lastScore = scores[scores.length - 1].overall;
  const trend = lastScore - firstScore;
  const trendColor = trend >= 0 ? "var(--emerald)" : "var(--red)";

  return (
    <motion.div
      className="content-card"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <div>
          <h3 className="card-title" style={{ margin: 0 }}>
            <span className="card-icon" style={{ background: "rgba(99,102,241,0.15)" }}>📈</span>
            {repoFull} — Health Timeline
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
            {scores.length} data point{scores.length > 1 ? "s" : ""} · Score range: {Math.round(minScore * 10) / 10} – {Math.round(maxScore * 10) / 10}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.5rem", fontWeight: 700, color: trendColor }}>
            {trend > 0 ? `+${trend.toFixed(1)}` : trend.toFixed(1)}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {trend >= 0 ? "↑ Improvement" : "↓ Decline"}
          </div>
        </div>
      </div>

      {/* SVG Chart */}
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto", maxHeight: 250 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <g key={ratio}>
            <line
              x1={padding.left}
              y1={padding.top + chartH - ratio * chartH}
              x2={padding.left + chartW}
              y2={padding.top + chartH - ratio * chartH}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8}
              y={padding.top + chartH - ratio * chartH + 4}
              textAnchor="end"
              fill="var(--text-muted)"
              fontSize="10"
            >
              {Math.round(minScore + ratio * range)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <motion.path
          d={areaPath}
          fill="url(#gradient)"
          opacity={0.15}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.15 }}
          transition={{ duration: 1 }}
        />

        {/* Line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke="var(--indigo)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 + i * 0.1 }}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="var(--indigo)"
              stroke="var(--bg-card)"
              strokeWidth="2"
            />
            <text
              x={p.x}
              y={p.y - 10}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="9"
            >
              {p.score.toFixed(1)}
            </text>
            <text
              x={p.x}
              y={padding.top + chartH + 16}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="8"
              transform={scores.length > 6 ? `rotate(-30 ${p.x} ${padding.top + chartH + 16})` : undefined}
            >
              {p.date}
            </text>
          </motion.g>
        ))}

        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--indigo)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--indigo)" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--indigo)", display: "inline-block" }} />
          Overall Score
        </span>
      </div>
    </motion.div>
  );
}
