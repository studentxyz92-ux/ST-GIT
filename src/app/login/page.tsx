"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./login.module.css";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCliInstructions, setShowCliInstructions] = useState(false);

  // Check for error from OAuth callback
  useEffect(() => {
    const errorParam = searchParams?.get("error");
    if (errorParam === "oauth_failed") {
      setError("GitHub authentication failed. Please try again.");
    }
  }, [searchParams]);

  const handleGitHubLogin = () => {
    setLoading(true);
    setError(null);
    // Redirect to server-side auth endpoint
    window.location.href = "/api/auth/github/login";
  };

  const handleCliLogin = () => {
    setShowCliInstructions(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>ST-GIT</div>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>
            Sign in to access your developer profile, career analytics, and credentials.
          </p>
        </div>

        {error && (
          <div className={styles.error}>
            <span className={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        <div className={styles.providers}>
          <button
            className={styles.providerButton}
            onClick={handleGitHubLogin}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <svg className={styles.providerIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            )}
            <span className={styles.providerLabel}>
              {loading ? "Redirecting to GitHub..." : "Continue with GitHub"}
            </span>
          </button>

          <div className={styles.divider}>
            <span className={styles.dividerLine} />
            <span className={styles.dividerText}>or</span>
            <span className={styles.dividerLine} />
          </div>

          <button
            className={styles.cliButton}
            onClick={handleCliLogin}
          >
            <span className={styles.terminalIcon}>&gt;_</span>
            <span>Sign in via CLI</span>
          </button>
        </div>

        {showCliInstructions && (
          <div className={styles.cliInstructions}>
            <h3 className={styles.cliTitle}>ST-GIT CLI Login</h3>
            <ol className={styles.cliSteps}>
              <li>
                Install the CLI:{" "}
                <code className={styles.code}>npm install -g st-git-cli</code>
              </li>
              <li>
                Run:{" "}
                <code className={styles.code}>st-git auth login</code>
              </li>
              <li>
                Follow the device code flow in your terminal
              </li>
            </ol>
            <p className={styles.cliNote}>
              Already logged in via CLI? Use your API key as a Bearer token in API requests.
            </p>
          </div>
        )}

        <div className={styles.footer}>
          <p className={styles.footerText}>
            By signing in, you agree to our{" "}
            <a href="/terms" className={styles.link}>Terms of Service</a> and{" "}
            <a href="/privacy" className={styles.link}>Privacy Policy</a>.
          </p>
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>🔐</span>
          <div>
            <strong>Private Repo Intelligence</strong>
            <p className={styles.featureDesc}>
              Your private code never leaves your machine
            </p>
          </div>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>📈</span>
          <div>
            <strong>Career Timeline</strong>
            <p className={styles.featureDesc}>
              Watch your skills evolve over years of real commits
            </p>
          </div>
        </div>
        <div className={styles.feature}>
          <span className={styles.featureIcon}>🪪</span>
          <div>
            <strong>Verifiable Credentials</strong>
            <p className={styles.featureDesc}>
              Signed proofs of skill backed by real code
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
