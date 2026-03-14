export type ScoreColor = "green" | "amber" | "red" | "indigo";

export interface SubScore {
    name: string;
    score: number;
    icon: string;
    color: ScoreColor;
}

export interface Issue {
    severity: "critical" | "warning" | "info";
    title: string;
    description: string;
}

export interface Suggestion {
    title: string;
    detail: string;
}

export interface ResumeTip {
    icon: string;
    title: string;
    text: string;
}

export interface AnalysisResult {
    overallScore: number;
    hiringReadiness: "Great Fit" | "Good Candidate" | "Needs Work" | "Not Ready";
    hiringReadinessClass: "great" | "good" | "average" | "poor";
    summary: string;
    subScores: SubScore[];
    issues: Issue[];
    suggestions: Suggestion[];
    readmeSuggestion: string;
    resumeTips: ResumeTip[];
    strengths: string[];
    stats: {
        label: string;
        value: string;
    }[];
}
