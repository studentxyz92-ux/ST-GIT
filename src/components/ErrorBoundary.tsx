"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="container" style={{ padding: "80px 24px", textAlign: "center" }}>
          <div className="error-card" style={{ maxWidth: 500, margin: "0 auto" }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div>
              <strong>Something went wrong</strong>
              <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)" }}>
                {this.state.error?.message || "An unexpected error occurred. Please try refreshing the page."}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
