"use client";

interface Milestone {
  date: string;
  type: "improvement" | "decline" | "neutral";
  label: string;
}

function typeConfig(type: string) {
  switch (type) {
    case "improvement": return { icon: "✅", color: "var(--emerald)" };
    case "decline": return { icon: "⚠️", color: "var(--red)" };
    default: return { icon: "➖", color: "var(--text-muted)" };
  }
}

export default function MilestoneMarkers({ milestones }: { milestones: Milestone[] }) {
  if (milestones.length === 0) {
    return (
      <div className="content-card">
        <h3 className="card-title">
          <span className="card-icon" style={{ background: "rgba(245,158,11,0.15)" }}>🏷️</span>
          Milestones
        </h3>
        <p style={{ fontSize: 13, color: "var(--text-muted)", textAlign: "center", padding: 20 }}>
          No milestones yet. Track your repo improvements over time.
        </p>
      </div>
    );
  }

  return (
    <div className="content-card">
      <h3 className="card-title">
        <span className="card-icon" style={{ background: "rgba(245,158,11,0.15)" }}>🏷️</span>
        Milestones
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {milestones.map((m, i) => {
          const cfg = typeConfig(m.type);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: 18 }}>{cfg.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: cfg.color }}>{m.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{m.date}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
