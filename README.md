# ST-GIT — AI GitHub Project Reviewer

> **Paste your GitHub repo link. Get an instant AI-powered review in seconds.**

![Score](https://img.shields.io/badge/MVP-Ready-6366f1)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![License](https://img.shields.io/badge/license-MIT-green)
![Free](https://img.shields.io/badge/Free-No_signup_required-emerald)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289da?style=flat&logo=discord&logoColor=white)](https://discord.gg/uda7M3QdV)

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

## 🗺 PLANNED FEATURES — Full Product Vision

> _Below are the complete feature blueprints for transforming DevScore.ai from a repo scorer into an **AI Career Co-Pilot for Developers** and an **AI-powered PR resolution platform.**_

---

## 🎯 PHASE 1 — AI Career Co-Pilot (Market Features)

_"DevScore.ai doesn't just score your GitHub — it tells you exactly how to get hired."_

### 1. 🤖 AI Repo Doctor (Auto-Fix Mode) ⭐ MUST HAVE
Auto-generate PR-ready fixes for weak areas:
- Detects missing README, tests, CI/CD, LICENSE
- User clicks "Fix My Repo" → AI generates new README.md, missing tests, .gitignore, LICENSE, GitHub Actions workflow
- One-click → Opens a Pull Request on their repo via GitHub OAuth
- **Free**: 1 fix/month | **Pro**: Unlimited

### 2. 🎯 Job-Match Score (Reverse Engineering) ⭐ HUGE DIFFERENTIATOR
Let users paste a job description → analyse their GitHub against actual job requirements:
```
Job: "Senior React Developer at Stripe"
Your Match Score: 67%

✅ React expertise: Strong (12 repos)
✅ TypeScript: Strong
⚠️ Testing: Weak — Stripe values 90%+ coverage
❌ System design: No architecture docs found

ACTION PLAN:
1. Add tests to your "shop-app" repo (+15% match)
2. Write architecture.md in your top 3 repos (+10%)
```

### 3. 📊 Developer DNA Profile (Personality of Code)
Analyze coding patterns across ALL repos to generate a "Developer DNA":
```yaml
🧬 Your Developer DNA:
- Builder Type: "Full-Stack Pragmatist"
- Strengths: API design, TypeScript, rapid prototyping
- Coding Style: Functional, modular, comment-heavy
- Languages: JS/TS (78%), Python (15%), Go (7%)
- Best fit roles: Backend Engineer, Tech Lead, Founding Engineer
```
Shareable like Spotify Wrapped — viral potential 🔥

### 4. 🏆 Public Leaderboard + Dev Profiles
- Public profile pages: devscore.ai/u/yourusername
- Global leaderboard by language, country, score
- Verified badge for top 1%, top 10%
- "Open to Work" toggle → Recruiters can search & contact

### 5. 🎓 Personalized Learning Path (AI Mentor)
Based on weak dimensions, generate a custom roadmap:
```
📚 Your 30-Day Improvement Plan:
Week 1: Add tests to top 3 repos
  → Video: "Vitest in 10 minutes"
  → Template: vitest.config.ts (download)
Week 2: Write killer READMEs
  → AI generates templates for each repo
Week 3: Open Source contribution
  → Curated "good first issues" matching your stack
```

### 6. 💼 Recruiter Dashboard (B2B Revenue) 💰
- Bulk analyse 100s of candidates
- Filter by: score, tech stack, location, activity
- "Hidden gem" detection: high-quality devs with low followers
- Outreach templates auto-generated
- **Monetization**: $99-499/month per recruiter

### 7. 🔥 Real-Time GitHub Activity Tracker
- Connect GitHub → Live dashboard
- Daily/weekly improvement reports via email
- Streaks like Duolingo for consistent committing

### 8. 🎨 Resume PDF Generator (AI-Powered)
- Auto-generate tailored resume from GitHub
- ATS-optimized format, multiple templates
- One-click LinkedIn import

### 9. 🌐 Browser Extension (Chrome/Arc)
- See score on every GitHub repo page
- See score next to every dev's profile
- Hover any user → instant DevScore card
- "Analyse this repo" button on GitHub

### 10. 🤝 Pair Programming Match (Tinder for Devs)
- Find devs with complementary skills
- Match for hackathons, open source, side projects
- Anonymous code reviews from top-scored devs

### 11. 🧠 AI/ML Advanced Features
- **Code Smell Detector** — Detect anti-patterns, security vulns, performance issues
- **Plagiarism / Originality Check** — Detect if a repo is a tutorial clone
- **AI-Generated Interview Questions** — Based on repos, generate likely interview questions

### 12. 🎨 UX/UI Upgrades
- Dark mode + theme customization
- Confetti animation on high scores
- Sound effects on score reveal (like Duolingo)
- Mobile app (React Native)
- Slack/Discord bot — `/devscore @username`

### 13. 📈 Growth & Virality Loops
- Shareable Score Cards — Auto-generate Twitter/LinkedIn images
- "Roast My GitHub" — Funny brutal-honest mode (viral on Twitter)
- Referral Program — Refer 3 friends, get 1 month Pro free
- GitHub Badge — Top users add `![DevScore](badge)` to their READMEs → free marketing
- Weekly Newsletter — "Top 10 GitHub repos this week"
- Open Source the CLI — Build community, get GitHub stars

---

## 🔥 PHASE 2 — AI PR Resolution Platform

_"DevScore.ai — The AI that resolves any GitHub conflict, fixes any failing PR, and ships code while you sleep."_

### 1. 🧩 Smart Merge Conflict Resolver ⭐ KILLER FEATURE
```
User connects GitHub → DevScore detects conflicts →
AI analyzes BOTH branches' intent →
Generates the CORRECT merged code →
One-click resolve & push.
```
Uses AST (Abstract Syntax Tree), commit messages, and code intent analysis to generate 3+ resolution options with confidence scores.

### 2. 🚨 Failing CI/CD Auto-Fixer
- Detect failing checks (GitHub Actions, CircleCI, etc.)
- Read error logs automatically
- AI identifies root cause, generates fix commit, pushes to PR branch

### 3. 🔍 Intelligent PR Review Bot
Auto-comments on PRs with:
- Code quality score, found issues (security, performance, style)
- Test coverage impact analysis
- Auto-fix available buttons

### 4. 🔄 Stuck PR Rescuer
- Monitor all open PRs
- Auto-rebase when main updates
- Resolve conflicts during rebase
- Send Slack/email nudges to reviewers

### 5. 📝 AI PR Description Generator
```
Before: "fix stuff"
After: Structured PR with purpose, changes, testing, screenshots, checklist
```

### 6. 🎯 Smart Reviewer Suggester
AI picks the BEST reviewer based on:
- git blame (who wrote the original code)
- Expertise in changed files
- Who's online NOW
- Workload balancing

### 7. 🔥 PR Dependency Graph
Visualize which PRs depend on which, with auto-rebase when dependencies merge.

### 8. 🧪 Test Generator for PRs
When a PR lacks tests, AI generates them automatically and commits.

### 9. 🛡️ Security & Secret Scanner
Block PRs from merging if they contain:
- Hardcoded API keys, passwords
- SQL injection vulnerabilities
- Exposed .env data, known CVEs

### 10. 📦 Dependency Update Resolver
Batch Dependabot PRs intelligently, resolve cross-PR conflicts, create ONE clean merged PR.

### 11. 🧠 Semantic Conflict Detection
Detect conflicts that Git MISSES (e.g., function renames that break callers).

### 12. 🔮 Pre-Conflict Prediction
Warn BEFORE conflicts happen based on who's editing which files.

### 13. 🎬 Time-Travel Debugging
If a merge breaks production: auto-analyze root cause, suggest hotfix or revert.

### 14. 🤝 Multi-PR Orchestrator
Merge 10 PRs in correct order automatically with conflict resolution.

### 15. 🗣️ Natural Language PR Commands
Chat with your PRs:
```
You: "Make this PR pass all tests"
🤖: Fixed 3 failing tests. Pushed commit.
You: "Why is this PR slow?"
🤖: Refactored O(n³) loop to O(n log n).
```

---

## 💰 Monetization Strategy (Updated)

| Tier | Price | Target |
|------|-------|--------|
| **Free** | $0 | Developers — 3 analyses/day, basic score |
| **Pro Dev** | $9/mo | Unlimited analyses, AI fixes, resume, learning paths |
| **Pro+** | $19/mo | Job match, browser extension, API access |
| **Recruiter** | $99/mo | Dashboard, bulk analysis, candidate search |
| **Enterprise** | $499/mo | Team analytics, custom branding, SSO |

---

## 🏗 Technical Architecture (Planned)

```
Frontend: Next.js 16 + Framer Motion
Backend: Node.js + Fastify (for PR features)
Queue: BullMQ + Redis (async PR processing)
Database: PostgreSQL (PR history) + Pinecone (code embeddings)
AI:
  - GPT-4 / Claude 3.5 Sonnet (reasoning)
  - Codestral / DeepSeek-Coder (code generation)
  - tree-sitter (AST parsing for any language)
GitHub Integration:
  - GitHub App (not OAuth) — for webhook events
  - Octokit for API calls
  - Probot framework for bot behavior
Conflict Resolution:
  - Custom 3-way merge with semantic understanding
  - AST-based diff (better than line-based)
  - Language-specific parsers
```

---

## 🚀 Implementation Roadmap

| Phase | Timeline | Focus |
|-------|----------|-------|
| **Phase 1** | Month 1-2 | AI Repo Doctor, Job-Match Score, Public Profiles, Leaderboard |
| **Phase 2** | Month 3-4 | Developer DNA (viral), Browser Extension, Resume Generator |
| **Phase 3** | Month 5-6 | Recruiter Dashboard, Stripe Integration, API for businesses |
| **Phase 4** | Month 7+ | PR Conflict Resolution, Mobile App, Enterprise Features |

**The ONE thing that will make DevScore win:**
> **AI Repo Doctor with one-click PR.** Because every other tool tells you what's wrong. You'd be the only one that fixes it. That's a 10x product, not a 10% improvement.

---

## 🏁 Final Positioning Statement

> **"DevScore.ai is the AI career co-pilot that turns your GitHub into a job-landing machine. We don't just score — we fix, coach, and connect."**

Combine: AI Auto-Fix + Job Match + Viral Profiles + Recruiter Marketplace = Unicorn potential 🦄

---

## 📄 License

MIT — free to use, modify, and deploy.
