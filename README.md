<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue?style=flat-square" alt="version">
  <img src="https://img.shields.io/github/license/pxmpsdev/devlens-agent?style=flat-square" alt="license">
  <img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square" alt="build">
  <img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square" alt="node">
</p>

<h1 align="center">🕵️ DevLens Agent</h1>
<p align="center">
  <strong>Your codebase has a story. DevLens reads it for you.</strong>
</p>

<p align="center">
  DevLens Agent is an <strong>autonomous code health agent</strong> that scans your repository<br>
  and delivers a clear, structured analysis of what needs attention — no fluff, just facts.
</p>

<p align="center">
  <sub>Complexity analysis · Duplication detection · Git hotspot tracking · Actionable recommendations</sub>
</p>

---

## What makes it different?

Most linting tools tell you *what* is wrong. DevLens tells you **why it matters** and **what to do about it**.

It combines three perspectives that are usually siloed:

| Perspective | Question Answered |
|-------------|------------------|
| **Static Analysis** | How complex is this code? |
| **Git Archaeology** | Where does the team struggle most? |
| **Risk Intelligence** | Which files are most likely to cause bugs? |

By correlating **cyclomatic complexity** with **git change frequency**, DevLens identifies the files that are both complex *and* constantly touched — the true hotspots where bugs breed.

---

## ⚡ Quick Start

```bash
npm install -g devlens-agent
devlens analyze .
```

Or use the short alias:
```bash
dl analyze .
```

---

## 📊 Example Output

```
DevLens Code Health
────────────────────────────────────────────────────────────
  Repository:    src
  Branch:         master
  Last commit:    faf27d4c
  Files analyzed: 18
  Health Score:   88/100  B

Complexity
  Average:  16.1
  Highest:  18  (analyzer/duplication/index.ts)
  Top complex functions:
    18  analyzer/duplication/index.ts:62  findDuplicateBlocks()
    18  output/formatters.ts:4           formatTerminal()
    17  recommendations/index.ts:8       generateRecommendations()

Recommendations
  ⚠ No test files found
    The project has 18 source files but no test files were detected.
    ➜ Add unit tests for core functionality.

  ⚡ High cyclomatic complexity in findDuplicateBlocks()
    analyzer/duplication/index.ts:62
    Function findDuplicateBlocks() has complexity of 18.
    ➜ Split findDuplicateBlocks() into smaller, focused functions.
```

---

## 🧠 What It Analyzes

### 1. Complexity
Uses the **TypeScript Compiler API** — not regex — to calculate real cyclomatic complexity per function. No guesswork.

- Cyclomatic complexity per function
- Deeply nested conditionals
- Overly large files
- Functions that do too much

### 2. Duplication
Finds **semantically similar** code blocks across files, using normalized comparison with Levenshtein similarity scoring. Not just copy-paste — near-misses too.

### 3. Git Hotspots
Mines your git history to find files that are:
- Frequently changed (high churn)
- Modified by many developers
- Simultaneously complex

A file with **92 changes** and **complexity 34** is weighted far more heavily than a simple file changed 5 times.

### 4. Recommendations
Every finding comes with:
- **File + line number**
- **Severity** (high/medium/low)
- **The problem** in plain language
- **Concrete fix suggestion**

No vague "improve code quality" — actual refactoring guidance.

---

## 🎯 Health Score

Transparent 0–100 score, fully configurable:

```
Score = 35% × Complexity + 25% × Duplication + 25% × Maintainability + 15% × Git Risk
```

| Grade | Score | What it means |
|-------|-------|---------------|
| **A** | 90–100 | Ship it with confidence |
| **B** | 75–89 | Solid, minor improvements needed |
| **C** | 60–74 | Technical debt accumulating |
| **D** | 40–59 | Refactoring strongly recommended |
| **F** | 0–39 | Emergency — stop and fix |

Weights are adjustable in `.devlensrc`.

---

## 📋 Commands

| Command | What it does |
|---------|-------------|
| `devlens analyze <path>` | Full analysis: complexity, duplication, hotspots, score, recommendations |
| `devlens hotspots <path>` | Git hotspots only — find your trouble files fast |
| `devlens history <path>` | Git history metrics: commits, contributors, churn |
| `devlens report <path>` | Generate report and save to file |
| `devlens --help` | All commands and options |

**Output formats:**
```bash
devlens analyze .                        # Colored terminal output
devlens analyze . --format json          # Machine-readable JSON
devlens analyze . --format markdown      # Markdown for PRs/docs
devlens report . -o health.md            # Save report to disk
```

---

## 🤖 Use Cases

| Scenario | Command |
|----------|---------|
| **Code review prep** | `dl analyze .` before opening a PR |
| **CI/CD quality gate** | `dl analyze src --format json` → fail if grade < C |
| **Onboarding new devs** | `dl hotspots .` to see where the team struggles |
| **Refactoring sprint** | `dl report . -o before.md` — track before/after |
| **Technical debt audit** | `dl analyze . --format markdown` → share with team |

---

## ⚙ Configuration

`.devlensrc` in your project root:

```json
{
  "scoring": {
    "complexity": 0.35,
    "duplication": 0.25,
    "maintainability": 0.25,
    "gitRisk": 0.15
  },
  "exclude": ["node_modules", "dist", ".git", "coverage", "*.gen.*"],
  "thresholds": {
    "complexity": { "high": 20, "warning": 10 },
    "fileSize": 500,
    "duplication": { "minBlockLines": 6, "warningThreshold": 0.05 },
    "hotspot": { "minChanges": 5, "highRisk": 15 }
  },
  "languages": ["typescript", "javascript"]
}
```

Supports: `.devlensrc`, `.devlensrc.json`, `.devlensrc.yaml`, `.devlensrc.yml`, `devlens.config.js`, `devlens.config.ts`, and the `"devlens"` key in `package.json`.

---

## 🤖 GitHub Action

Add this to your PR workflow and DevLens becomes your automated code review companion:

```yaml
name: Code Health Agent
on: [pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: devlens/action@v1
        with:
          path: 'src'
          fail_on: 'C'
          comment: 'true'
```

**What it does:**
- Analyzes your code on every PR
- Posts a markdown report as a comment
- Fails the check if health drops below your threshold
- Exposes `health_score` and `grade` as outputs

---

## 🏗 Architecture

```
devlens/
├── src/
│   ├── cli/              Commander.js CLI with 4 commands
│   │   └── commands/     analyze, hotspots, history, report
│   ├── analyzer/
│   │   ├── complexity/   Cyclomatic complexity via TS Compiler API
│   │   ├── duplication/  Semantic duplicate block detection
│   │   ├── git/          Git history mining & hotspot correlation
│   │   └── files/        File-level health: size, complexity, churn
│   ├── scoring/          Weighted health score with grade mapping
│   ├── recommendations/  Structured, actionable suggestions
│   ├── output/           Terminal (chalk), JSON, Markdown
│   └── config/           cosmiconfig loader with deep merge
└── tests/
    ├── fixtures/         Reproducible test repositories
    └── unit/             36 unit tests across 6 test files
```

### JSON Data Model

Every output format shares the same structured schema — CLI, Action, and future dashboard:

```json
{
  "repository": { "name": "my-project", "branch": "main", "analyzedFiles": 143 },
  "score": { "overall": 78, "breakdown": {...}, "grade": "B" },
  "metrics": {
    "complexity": { "average": 8.2, "highest": 34 },
    "duplication": { "estimatedPercentage": 6.8 },
    "fileHealth": { "averageHealth": 72 },
    "git": { "totalCommits": 500, "churnRate": 12 }
  },
  "hotspots": [{ "file": "src/auth.ts", "changes": 92, "riskScore": 15.5 }],
  "recommendations": [
    {
      "file": "src/auth.ts",
      "line": 42,
      "severity": "high",
      "category": "complexity",
      "title": "High cyclomatic complexity in loginUser()",
      "description": "Function loginUser() has a cyclomatic complexity of 34.",
      "suggestion": "Split authentication, validation and session creation into separate functions."
    }
  ]
}
```

---

## 🗺 Roadmap

| Milestone | Status |
|-----------|--------|
| TypeScript/JavaScript analysis | ✅ Done |
| CLI + JSON + Markdown output | ✅ Done |
| GitHub Action | ✅ Done |
| Python, Rust, Go support (Tree-sitter) | 🔜 Planned |
| Web dashboard | 🔜 Planned |
| Dependency health & CVE scanning | 🔜 Planned |
| VS Code extension | 🔜 Planned |
| Git hooks integration | 🔜 Planned |

---

## 🧪 Development

```bash
git clone https://github.com/pxmpsdev/devlens-agent.git
cd devlens-agent
npm install
npm run build
npm test
```

| Script | Description |
|--------|------------|
| `npm run build` | Compile TypeScript |
| `npm test` | Run all 36 tests |
| `npm run test:coverage` | Coverage report |
| `npm run lint` | Biome linting |
| `npm run typecheck` | Type checking |

---

## 📄 Docs

- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

---

## Why "Agent"?

Because DevLens doesn't just dump metrics — it **correlates, interprets, and advises**.

A linter tells you about a missing semicolon. DevLens tells you that `src/auth/login.ts` has been changed 92 times, has complexity 34, and you should consider splitting it into separate functions **before it causes your next production incident**.

That's the difference between a tool and an agent.

---

<p align="center">
  <strong>MIT License</strong> &nbsp;·&nbsp; © DevLens Contributors<br>
  <sub>Built with TypeScript, shipped with ❤️</sub>
</p>
