"use client";

import { motion } from "framer-motion";

interface Question {
  category: string;
  question: string;
  context: string;
  difficulty: string;
  modelAnswer?: string;
  keyConcepts?: string[];
}

const CATEGORY_COLORS: Record<string, { bg: string; border: string; color: string; label: string }> = {
  technical: { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.25)", color: "var(--indigo-light)", label: "Technical" },
  design: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.25)", color: "var(--amber)", label: "Design" },
  "system-design": { bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.25)", color: "var(--pink)", label: "System Design" },
  behavioral: { bg: "rgba(6,182,212,0.12)", border: "rgba(6,182,212,0.25)", color: "var(--cyan)", label: "Behavioral" },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "var(--emerald)",
  medium: "var(--amber)",
  hard: "var(--red)",
};

interface Props {
  question: Question;
  index: number;
  showAnswer: boolean;
  onToggleAnswer: () => void;
  userAnswer?: string;
  feedback?: string;
  onChangeAnswer?: (answer: string) => void;
}

export default function QuestionCard({
  question,
  index,
  showAnswer,
  onToggleAnswer,
  userAnswer,
  feedback,
  onChangeAnswer,
}: Props) {
  const catConfig = CATEGORY_COLORS[question.category] || CATEGORY_COLORS.technical;
  const diffColor = DIFFICULTY_COLORS[question.difficulty] || "var(--text-muted)";

  return (
    <motion.div
      className="content-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <span
          style={{
            background: catConfig.bg,
            border: `1px solid ${catConfig.border}`,
            color: catConfig.color,
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {catConfig.label}
        </span>
        <span
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border)",
            color: diffColor,
            padding: "3px 10px",
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {question.difficulty.toUpperCase()}
        </span>
        {question.keyConcepts?.map((c) => (
          <span
            key={c}
            style={{
              background: "rgba(255,255,255,0.03)",
              borderRadius: 4,
              padding: "2px 6px",
              fontSize: 10,
              color: "var(--text-muted)",
            }}
          >
            {c}
          </span>
        ))}
      </div>

      <p style={{ fontSize: 14, color: "var(--text-primary)", fontWeight: 600, marginBottom: 8, lineHeight: 1.5 }}>
        {question.question}
      </p>

      <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16, fontStyle: "italic" }}>
        {question.context}
      </p>

      {/* User Answer Input */}
      {onChangeAnswer && (
        <div style={{ marginBottom: 12 }}>
          <textarea
            placeholder="Type your answer here..."
            value={userAnswer || ""}
            onChange={(e) => onChangeAnswer(e.target.value)}
            style={{
              width: "100%",
              minHeight: 80,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              padding: 12,
              fontSize: 13,
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.5,
              resize: "vertical",
              outline: "none",
            }}
          />
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          style={{
            background: "rgba(16,185,129,0.06)",
            border: "1px solid rgba(16,185,129,0.15)",
            borderRadius: "var(--radius-md)",
            padding: 12,
            marginBottom: 12,
            fontSize: 13,
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {feedback}
        </div>
      )}

      {/* Toggle Model Answer */}
      <button
        onClick={onToggleAnswer}
        style={{
          background: "none",
          border: "none",
          color: "var(--indigo-light)",
          fontSize: 12,
          cursor: "pointer",
          padding: 0,
          fontFamily: "inherit",
          fontWeight: 500,
        }}
      >
        {showAnswer ? "🔽 Hide model answer" : "👉 Show model answer"}
      </button>

      {showAnswer && question.modelAnswer && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          style={{
            marginTop: 8,
            background: "#0d1117",
            borderRadius: "var(--radius-sm)",
            padding: 12,
            fontSize: 12,
            color: "#c9d1d9",
            lineHeight: 1.6,
          }}
        >
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            💡 Model Answer
          </div>
          {question.modelAnswer}
        </motion.div>
      )}
    </motion.div>
  );
}
