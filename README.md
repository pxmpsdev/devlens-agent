<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue?style=flat-square" alt="version">
  <img src="https://img.shields.io/github/license/pxmpsdev/devlens?style=flat-square" alt="license">
  <img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square" alt="build">
  <img src="https://img.shields.io/node/v/devlens?style=flat-square" alt="node version">
</p>

<h1 align="center">🔍 DevLens</h1>
<p align="center"><strong>Code Health Analyzer for Git Repositories</strong><br>
<em>Inspect, score, and improve your codebase — right from the terminal.</em></p>

---

## ⚡ Quick Start

```bash
npm install -g devlens
devlens analyze .
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

## 🛠 Features

| Feature | Description |
|---------|------------|
| **Complexity Analysis** | Cyclomatic complexity per function via TypeScript Compiler API |
| **Duplication Detection** | Finds similar code blocks across files |
| **Git Hotspots** | Frequently changed files with high complexity |
| **Health Score** | Transparent 0–100 score with weighted dimensions |
| **Recommendations** | Concrete suggestions with file, line & severity |
| **Multiple Outputs** | Colored terminal, JSON, Markdown |
| **CI/CD Ready** | Exit codes and JSON output for automation |
| **Configurable** | All thresholds and weights via `.devlensrc` |

---

## 📋 Commands

| Command | Description |
|---------|------------|
| `devlens analyze <path>` | Full code health analysis |
| `devlens hotspots <path>` | Git hotspots only |
| `devlens history <path>` | Git history metrics |
| `devlens report <path>` | Generate report & optionally save to file |
| `devlens --help` | Show all commands |

**Options:**
```
-f, --format <format>    terminal (default), json, markdown
-o, --output <file>      Save report to file
-n, --limit <number>     Limit number of hotspots
```

---

## 🎯 Health Score

The score is calculated from four weighted dimensions:

```
Score = 35% × Complexity + 25% × Duplication + 25% × Maintainability + 15% × Git Risk
```

| Grade | Score | Meaning |
|-------|-------|---------|
| **A** | 90–100 | Excellent |
| **B** | 75–89 | Good |
| **C** | 60–74 | Needs improvement |
| **D** | 40–59 | Critical |
| **F** | 0–39 | Requires immediate attention |

All weights are configurable in `.devlensrc`.

---

## ⚙ Configuration

Create a `.devlensrc` in your project root:

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

Supported config files: `.devlensrc`, `.devlensrc.json`, `.devlensrc.yaml`, `devlens.config.js`, and the `"devlens"` key in `package.json`.

---

## 🤖 GitHub Action

```yaml
name: Code Health
on: [pull_request]

jobs:
  devlens:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # required for git history!

      - uses: devlens/action@v1
        with:
          path: 'src'
          fail_on: 'C'
          comment: 'true'
```

**Inputs:**

| Parameter | Default | Description |
|-----------|---------|------------|
| `path` | `.` | Repository path to analyze |
| `fail_on` | `C` | Fail check if grade drops below this |
| `comment` | `true` | Post markdown report as PR comment |

---

## 🏗 Architecture

```
devlens/
├── src/
│   ├── cli/              Commander.js CLI
│   │   └── commands/     analyze, hotspots, history, report
│   ├── analyzer/
│   │   ├── complexity/   TS Compiler API (cyclomatic complexity)
│   │   ├── duplication/  Code duplicate detection
│   │   ├── git/          Git history & hotspot analysis
│   │   └── files/        File-level health metrics
│   ├── scoring/          Health score calculation
│   ├── recommendations/  Concrete improvement suggestions
│   ├── output/           Terminal / JSON / Markdown formatters
│   └── config/           Configuration loader (cosmiconfig)
└── tests/
    ├── fixtures/         Test repositories
    └── unit/             36 unit tests
```

### JSON Data Model

CLI, GitHub Action, and future dashboard share the same schema:

```json
{
  "repository": { "name": "...", "branch": "main", "analyzedFiles": 143 },
  "score": { "overall": 78, "breakdown": {...}, "grade": "B" },
  "metrics": {
    "complexity": { "average": 8.2, "highest": 34 },
    "duplication": { "estimatedPercentage": 6.8 },
    "fileHealth": { "averageHealth": 72 },
    "git": { "totalCommits": 500, "churnRate": 12 }
  },
  "hotspots": [{ "file": "src/auth.ts", "changes": 92, "riskScore": 15.5 }],
  "recommendations": [
    { "file": "src/auth.ts", "line": 42, "severity": "high", "suggestion": "..." }
  ]
}
```

---

## 🧪 Development

```bash
git clone https://github.com/pxmpsdev/devlens.git
cd devlens
npm install
npm run build
npm test
```

| Script | Description |
|--------|------------|
| `npm run build` | Compile TypeScript |
| `npm test` | Run all tests |
| `npm run test:coverage` | Test coverage report |
| `npm run lint` | Lint with Biome |
| `npm run typecheck` | Type check only |

---

## 🗺 Roadmap

- [ ] Python, Rust, Go, Java, C#, PHP support via Tree-sitter
- [ ] Web dashboard
- [ ] Dependency health analysis
- [ ] Security vulnerability scanning
- [ ] VS Code extension
- [ ] Git hooks integration

---

## 📄 Docs

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Changelog](CHANGELOG.md)

---

<p align="center">
  <strong>MIT License</strong> &nbsp;·&nbsp; © DevLens Contributors<br>
  <sub>Built with TypeScript ❤️</sub>
</p>
