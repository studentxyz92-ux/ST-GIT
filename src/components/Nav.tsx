"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [githubUser, setGithubUser] = useState<string | null>(null);
  const [githubAvatar, setGithubAvatar] = useState<string | null>(null);

  // Check for GitHub OAuth token in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("github_token");
    const user = params.get("github_user");
    const avatar = params.get("github_avatar");
    if (token && user) {
      // Store in session for persistence across navigations
      sessionStorage.setItem("github_token", token);
      sessionStorage.setItem("github_user", user);
      if (avatar) sessionStorage.setItem("github_avatar", avatar);
      setGithubUser(user);
      setGithubAvatar(avatar);
    } else {
      const storedUser = sessionStorage.getItem("github_user");
      if (storedUser) {
        setGithubUser(storedUser);
        setGithubAvatar(sessionStorage.getItem("github_avatar"));
      }
    }
  }, []);

  function handleLogin() {
    window.location.href = "/api/auth/github/login";
  }

  function handleLogout() {
    sessionStorage.removeItem("github_token");
    sessionStorage.removeItem("github_user");
    sessionStorage.removeItem("github_avatar");
    setGithubUser(null);
    setGithubAvatar(null);
  }

  return (
    <nav className="nav">
      <div className="container nav-inner">
        <Link href="/" className="logo">
          <div className="logo-icon">⚡</div>
          <span className="logo-text">ST-GIT</span>
        </Link>

        <div className="nav-links" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Desktop links */}
          <div className="nav-desktop-links" style={{ display: "flex", gap: 6 }}>
            <Link href="/pr" className="nav-link">PR Doctor</Link>
            <Link href="/profile" className="nav-link">Profile</Link>
            <Link href="/compare" className="nav-link">Compare</Link>
            <Link href="/interview" className="nav-link">Interview</Link>
            <Link href="/timeline" className="nav-link">Timeline</Link>
            <Link href="/team" className="nav-link">Team</Link>
            <Link href="/pricing" className="nav-link">Pricing</Link>
            <Link href="/docs" className="nav-link">Docs</Link>
          </div>

          {/* GitHub Login / User */}
          {githubUser ? (
            <div className="nav-user" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {githubAvatar && (
                <img
                  src={githubAvatar}
                  alt={githubUser}
                  style={{ width: 24, height: 24, borderRadius: "50%", border: "2px solid var(--indigo)" }}
                />
              )}
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>@{githubUser}</span>
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--text-muted)",
                  fontSize: 11,
                  padding: "4px 8px",
                  cursor: "pointer",
                  transition: "var(--transition)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.borderColor = "var(--indigo)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="github-login-btn"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style={{ flexShrink: 0 }}>
                <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Sign in
            </button>
          )}

          <span className="nav-badge" style={{ marginLeft: 4 }}>BETA</span>

          {/* Mobile menu toggle */}
          <button
            className="nav-mobile-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{
              display: "none",
              background: "none",
              border: "none",
              color: "var(--text-primary)",
              fontSize: 24,
              cursor: "pointer",
              padding: 4,
            }}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="container" style={{ paddingTop: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <Link href="/pr" className="nav-link" style={{ display: "block", padding: "8px 0" }}>PR Doctor</Link>
            <Link href="/profile" className="nav-link" style={{ display: "block", padding: "8px 0" }}>Profile</Link>
            <Link href="/compare" className="nav-link" style={{ display: "block", padding: "8px 0" }}>Compare</Link>
            <Link href="/interview" className="nav-link" style={{ display: "block", padding: "8px 0" }}>Interview</Link>
            <Link href="/timeline" className="nav-link" style={{ display: "block", padding: "8px 0" }}>Timeline</Link>
            <Link href="/team" className="nav-link" style={{ display: "block", padding: "8px 0" }}>Team</Link>
            <Link href="/pricing" className="nav-link" style={{ display: "block", padding: "8px 0" }}>Pricing</Link>
            <Link href="/docs" className="nav-link" style={{ display: "block", padding: "8px 0" }}>Docs</Link>
            {githubUser ? (
              <button onClick={handleLogout} className="nav-link" style={{ display: "block", padding: "8px 0", textAlign: "left", background: "none", border: "none", cursor: "pointer", width: "100%" }}>
                Logout @{githubUser}
              </button>
            ) : (
              <button onClick={handleLogin} className="nav-link" style={{ display: "block", padding: "8px 0", textAlign: "left", background: "none", border: "none", cursor: "pointer", width: "100%" }}>
                Sign in with GitHub
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          padding: 6px 14px;
          border-radius: var(--radius-sm);
          transition: var(--transition);
        }
        .nav-link:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.05);
        }

        .github-login-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
          font-family: inherit;
        }
        .github-login-btn:hover {
          color: var(--text-primary);
          background: rgba(255,255,255,0.1);
          border-color: var(--indigo);
        }

        @media (max-width: 640px) {
          .nav-desktop-links { display: none !important; }
          .nav-mobile-toggle { display: block !important; }
          .github-login-btn { display: none; }
          .nav-user { display: none; }
        }
      `}</style>
    </nav>
  );
}
