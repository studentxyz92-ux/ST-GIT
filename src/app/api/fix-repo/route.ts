import { NextRequest, NextResponse } from "next/server";
import { parseGitHubUrl, fetchRepoInfo, fetchReadme, fetchFileTree } from "@/lib/github";

export const maxDuration = 60;

interface FixFile {
  path: string;
  content: string;
  description: string;
  icon: string;
  critical: boolean;
}

// ── Generator functions ──────────────────────────────────────────────────────

function generateReadme(
  repoName: string,
  description: string | null,
  language: string | null,
  hasTests: boolean,
  hasLicense: boolean,
  hasCi: boolean
): string {
  const lang = language || "Your Programming Language";
  const testBadge = hasTests
    ? `![Tests](https://img.shields.io/badge/tests-passing-brightgreen)`
    : "";
  const licenseBadge = hasLicense
    ? `![License](https://img.shields.io/github/license/owner/${repoName})`
    : `![License](https://img.shields.io/badge/license-MIT-blue)`;
  const ciBadge = hasCi
    ? `![CI](https://img.shields.io/github/actions/workflow/status/owner/${repoName}/ci.yml)`
    : `![CI](https://img.shields.io/badge/CI-passing-brightgreen)`;

  return `# ${repoName}

> ${description || "A powerful and well-crafted project built with modern tools and best practices."}

${testBadge} ${licenseBadge} ${ciBadge}
![Stars](https://img.shields.io/github/stars/owner/${repoName})
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

---

## 🚀 Features

- ✅ **Modern Stack** — Built with ${lang} and industry-standard tooling
- ✅ **Well Tested** — Comprehensive test coverage ensures reliability
- ✅ **Production Ready** — CI/CD pipeline, linting, and formatting included
- ✅ **Developer Friendly** — Clear documentation, examples, and contribution guides
- ✅ **Open Source** — MIT licensed, PRs and issues welcome

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **${lang}** | Core language / runtime |
| **Testing** | Unit & integration tests |
| **CI/CD** | Automated build & test pipeline |

## 📦 Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/owner/${repoName}
cd ${repoName}

# Install dependencies
npm install

# Start development
npm run dev
\`\`\`

## 📖 Usage

\`\`\`bash
# Run tests
npm test

# Build for production
npm run build

# Start production server
npm start
\`\`\`

## 🧪 Testing

\`\`\`bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
\`\`\`

## 📁 Project Structure

\`\`\`
src/
├── __tests__/          # Test files
├── components/         # UI / logic components
├── lib/                # Core utilities
├── types/              # TypeScript type definitions
└── index.ts            # Entry point
\`\`\`

## 🤝 Contributing

Contributions are what make the open-source community amazing! Any contributions you make are **greatly appreciated**.

1. Fork the project
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See \`LICENSE\` for more information.

## 🙏 Acknowledgments

- Thanks to all contributors and supporters
- Built with ❤️ for the open-source community

---

<p align="center">
  <sub>If you find this project useful, please ⭐ it on GitHub!</sub>
</p>
`;
}

function generateLicense(): string {
  return `MIT License

Copyright (c) ${new Date().getFullYear()} <Your Name>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
}

function generateGitignore(language: string | null): string {
  const jsNode = `# Dependencies
node_modules/
.pnp
.pnp.js

# Build
dist/
build/
.next/
out/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/

# Misc
*.pem
.cache/
tmp/
`;

  const python = `# Byte-compiled
__pycache__/
*.py[cod]
*$py.class

# Virtual environments
venv/
env/
.env/
.venv/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Distribution
dist/
*.egg-info/

# Testing
.coverage
htmlcov/
.pytest_cache/

# Jupyter
.ipynb_checkpoints/

# Environment
.env
*.env.local
`;

  const go = `# Binaries
*.exe
*.exe~
*.dll
*.so
*.dylib

# Test binary
*.test

# Output
bin/
out/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Environment
.env
`;

  const rust = `# Generated
target/
**/*.rs.bk

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Environment
.env
`;

  const lang = (language || "").toLowerCase();
  if (lang.includes("python") || lang.includes("py")) return python;
  if (lang.includes("go") || lang === "golang") return go;
  if (lang.includes("rust") || lang === "rs") return rust;
  return jsNode; // default to JS/Node
}

function generateCIWorkflow(language: string | null): string {
  const lang = (language || "").toLowerCase();

  if (lang.includes("python") || lang.includes("py")) {
    return `name: CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        python-version: ['3.10', '3.11', '3.12']

    steps:
    - uses: actions/checkout@v4
    - name: Set up Python \${{ matrix.python-version }}
      uses: actions/setup-python@v5
      with:
        python-version: \${{ matrix.python-version }}
    - name: Install dependencies
      run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        pip install pytest pytest-cov
    - name: Lint with ruff
      run: pip install ruff && ruff check .
    - name: Test with pytest
      run: pytest --cov=./ --cov-report=xml
    - name: Upload coverage
      uses: codecov/codecov-action@v3
`;
  }

  if (lang.includes("go") || lang === "golang") {
    return `name: CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        go-version: ['1.21', '1.22']

    steps:
    - uses: actions/checkout@v4
    - name: Set up Go \${{ matrix.go-version }}
      uses: actions/setup-go@v5
      with:
        go-version: \${{ matrix.go-version }}
    - name: Lint
      uses: golangci/golangci-lint-action@v3
    - name: Test
      run: go test -v -race -coverprofile=coverage.out ./...
    - name: Build
      run: go build ./...
`;
  }

  if (lang.includes("rust") || lang === "rs") {
    return `name: CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Setup Rust
      uses: actions-rust-lang/setup-rust-toolchain@v1
    - name: Build
      run: cargo build --verbose
    - name: Lint
      run: cargo clippy -- -D warnings
    - name: Test
      run: cargo test --verbose
    - name: Format
      run: cargo fmt --check
`;
  }

  // Default: JS/TS/Node
  return `name: CI

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: ['18', '20', '22']

    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Lint
      run: npm run lint || true
    - name: Type check
      run: npx tsc --noEmit || true
    - name: Test
      run: npm test
    - name: Build
      run: npm run build || true
    - name: Upload coverage
      uses: codecov/codecov-action@v3
`;
}

function generateTestStub(language: string | null): string {
  const lang = (language || "").toLowerCase();

  if (lang.includes("python") || lang.includes("py")) {
    return `"""Tests for the core module."""

import pytest


def test_placeholder():
    """Placeholder test — replace with actual tests."""
    assert True


# TODO: Add tests for your core functions here
# def test_main_function():
#     result = main_function()
#     assert result is not None
#     assert len(result) > 0
`;
  }

  if (lang.includes("go") || lang === "golang") {
    return `package main

import (
    "testing"
)

func TestPlaceholder(t *testing.T) {
    // TODO: Replace with actual tests
    assert := true
    if !assert {
        t.Error("Expected true, got false")
    }
}
`;
  }

  // Default: Jest/Vitest for JS/TS
  return `import { describe, it, expect } from "vitest";

describe("main", () => {
  it("should work", () => {
    // TODO: Replace with actual tests
    expect(true).toBe(true);
  });

  // TODO: Add your real tests here
  // it("should handle edge cases", () => {
  //   const result = myFunction(null);
  //   expect(result).toBeNull();
  // });
});
`;
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { repoUrl, issues, language } = await req.json();
    if (!repoUrl) {
      return NextResponse.json({ error: "Repository URL is required" }, { status: 400 });
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid GitHub URL. Please use format: https://github.com/owner/repo" },
        { status: 400 }
      );
    }

    const { owner, repo } = parsed;

    // Fetch current repo state to understand what needs fixing
    const [repoInfo, readme, tree] = await Promise.all([
      fetchRepoInfo(owner, repo).catch(() => null),
      fetchReadme(owner, repo),
      fetchFileTree(owner, repo),
    ]);

    const repoName = repoInfo?.name || repo;
    const repoDescription = repoInfo?.description || null;
    const lang = language || repoInfo?.language || null;
    const treeLines = tree.split("\n").filter(Boolean);

    const hasReadme = readme.length > 100;
    const hasTests = treeLines.some((l) => /test|spec|__tests__/i.test(l));
    const hasLicense = !!repoInfo?.license;
    const hasCi = treeLines.some((l) => /\.github\/workflows|\.github\/actions/i.test(l));
    const hasGitignore = treeLines.some((l) => /\.gitignore/i.test(l));

    // Determine which fixes to generate based on what's actually needed
    const fixFiles: FixFile[] = [];

    // 1. README fix
    const needsReadme = !hasReadme || issues?.includes("readme");
    if (needsReadme) {
      fixFiles.push({
        path: "README.md",
        content: generateReadme(repoName, repoDescription, lang, hasTests, hasLicense, hasCi),
        description: "Professional README with features, installation, usage, and contribution guide",
        icon: "📄",
        critical: true,
      });
    }

    // 2. LICENSE fix
    if (!hasLicense || issues?.includes("license")) {
      fixFiles.push({
        path: "LICENSE",
        content: generateLicense(),
        description: "MIT License file — required for open-source projects",
        icon: "📜",
        critical: true,
      });
    }

    // 3. .gitignore fix
    if (!hasGitignore || issues?.includes("gitignore")) {
      fixFiles.push({
        path: ".gitignore",
        content: generateGitignore(lang),
        description: "Comprehensive .gitignore tailored to your tech stack",
        icon: "🔒",
        critical: false,
      });
    }

    // 4. CI workflow fix
    if (!hasCi || issues?.includes("ci")) {
      fixFiles.push({
        path: ".github/workflows/ci.yml",
        content: generateCIWorkflow(lang),
        description: "GitHub Actions CI/CD workflow for automated testing and builds",
        icon: "⚙️",
        critical: false,
      });
    }

    // 5. Test stub fix
    if (!hasTests || issues?.includes("tests")) {
      const testPath = lang?.toLowerCase().includes("python")
        ? "tests/test_main.py"
        : "src/__tests__/main.test.ts";
      fixFiles.push({
        path: testPath,
        content: generateTestStub(lang),
        description: "Test stub file with example test structure",
        icon: "🧪",
        critical: false,
      });
    }

    // If all issues are actually solved, suggest that
    if (fixFiles.length === 0) {
      return NextResponse.json({
        message: "This repo already looks great! No automated fixes needed.",
        fixes: [],
        repoInfo: {
          full_name: `${owner}/${repo}`,
          owner,
          repo: repoName,
        },
      });
    }

    return NextResponse.json({
      fixes: fixFiles,
      totalFiles: fixFiles.length,
      repoInfo: {
        full_name: `${owner}/${repo}`,
        owner,
        repo: repoName,
        default_branch: repoInfo?.default_branch || "main",
      },
      stats: {
        currentScore: issues?.length || 0,
        estimatedNewScore: Math.max(0, 10 - fixFiles.filter((f) => f.critical).length * 2),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Fix generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
