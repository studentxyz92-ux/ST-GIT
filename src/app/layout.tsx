import type { Metadata } from "next";
import { AuthProvider } from "../components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ST-GIT — AI GitHub Project Reviewer",
  description:
    "Instantly analyze any GitHub repository with AI. Get code quality scores, README improvements, structure feedback, resume tips, and a hiring readiness score.",
  keywords: [
    "GitHub reviewer",
    "code quality",
    "AI code review",
    "developer portfolio",
    "hiring readiness",
    "repo analyzer",
  ],
  openGraph: {
    title: "ST-GIT — AI GitHub Project Reviewer",
    description:
      "Paste your GitHub repo link and get an AI-powered score in seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
