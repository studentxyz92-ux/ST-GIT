# DevScore.ai — AI GitHub Project Reviewer

> **Paste your GitHub repo link. Get an instant AI-powered review in seconds.**

![Score](https://img.shields.io/badge/MVP-Ready-6366f1)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![License](https://img.shields.io/badge/license-MIT-green)
![Free](https://img.shields.io/badge/Free-No_signup_required-emerald)

---

## 🚀 What It Does

DevScore.ai analyses any public GitHub repository and gives developers:

| Feature | Description |
|---------|-------------|
| **Overall Score** | 0–10 composite rating based on 5 key dimensions |
| **Hiring Readiness** | Great Fit / Good Candidate / Needs Work / Not Ready |
| **Issues Detected** | Critical, warning, and info-level problems |
| **AI Suggestions** | Specific, actionable steps to improve your score |
| **README Generator** | Professional README template tailored to your repo |
| **Resume Tips** | How to present the project on your CV and LinkedIn |
| **Project Strengths** | What your repo already does well |
| **Repository Stats** | Stars, forks, issues, size, last activity |

---

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript
- **Styling**: Vanilla CSS with glassmorphism & animations
- **Backend**: Next.js API Routes (serverless)
- **Data**: GitHub REST API v3
- **AI**: OpenAI GPT-4o-mini (optional) + Smart heuristic fallback
- **Hosting**: Vercel (recommended)

---

## 📦 Installation & Running Locally

```bash
# Clone
git clone <your-repo-url>
cd devscore

# Install
npm install

# Set environment (optional)
cp .env.local .env.local
# Edit .env.local → add GITHUB_TOKEN and/or OPENAI_API_KEY

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Environment Variables

Edit `.env.local`:

```env
# Increases GitHub API rate limit from 60 to 5000 req/hr
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx

# Enables GPT-4o-mini deep analysis (falls back to heuristics if missing)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
```

> **The app works without any API keys** — it uses a smart heuristic analyser.

---

## 🧠 How the Analysis Works

```
User pastes GitHub URL
        ↓
GitHub API (parallel fetch):
  - Repo metadata (stars, forks, language, license…)
  - README content
  - File tree (recursive)
  - Code snippets from root files
        ↓
AI Analysis Engine:
  [With OpenAI key]  --> GPT-4o-mini deep analysis
  [Without key]       --> Smart heuristic scoring
        ↓
Structured Report:
  - 5 sub-scores (README, Structure, Tests, Code Quality, Activity)
  - Issues with severity (critical/warning/info)
  - Numbered suggestions
  - README markdown template
  - Resume bullet points
  - Social sharing
```

---

## 📁 Project Structure

```
devscore/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── analyse/
│   │   │       └── route.ts      # Main API endpoint
│   │   ├── globals.css           # Design system & styles
│   │   ├── layout.tsx            # Root layout + SEO metadata
│   │   └── page.tsx              # Full UI (hero, analyzer, results)
│   └── lib/
│       ├── github.ts             # GitHub API utilities
│       └── types.ts              # TypeScript interfaces
├── .env.local                    # Environment variables
└── next.config.ts
```

---

## 💰 Monetization Plan

| Plan | Price | Features |
|------|-------|---------|
| **Free** | $0 | 3 repo reviews/day, all features |
| **Pro** | $5/month | Unlimited reviews, advanced AI, resume PDF export |
| **Team** | $20/month | Team dashboards, recruiter view, API access |

**Revenue projection**: 500 Pro users x $5 = **$2,500/month**

---

## 🚀 Deployment (Vercel)

```bash
npx vercel --prod
```

Add env vars in Vercel Dashboard → Project → Settings → Environment Variables.

---

## 🗺 Roadmap

- [x] MVP: Repo analysis + scoring
- [x] Smart heuristic analyser (no API key needed)
- [x] README generator
- [x] Resume tips
- [x] Social sharing
- [ ] GPT-4o deep analysis
- [ ] Portfolio score (multiple repos)
- [ ] PDF resume export
- [ ] GitHub OAuth
- [ ] Recruiter view (public profile)
- [ ] Interview readiness score

---

## 📄 License

MIT — free to use, modify, and deploy.
