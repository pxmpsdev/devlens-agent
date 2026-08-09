# DevLens

> Analyze git repositories and score code health — right from your terminal.

DevLens inspects your codebase and produces a clear, actionable health report. It measures complexity, duplication, maintainability, and git hotspots, then generates a 0–100 health score with concrete recommendations.

## Quick Start

```bash
# Install
npm install -g devlens

# Analyze your project
devlens analyze .

# JSON output for CI/CD
devlens analyze . --format json
```

## Example Output

```
DevLens Code Health
────────────────────────────────────────────
Repository: my-project
Branch: main
Files analyzed: 143
Health Score: 78/100  B

Complexity
  Average: 8.2
  Highest: 34

Code Duplication
  Estimated: 6.8%

Git Hotspots
  15.5  src/auth/login.ts              92 changes
  12.1  src/api/users.ts               81 changes
  9.8   src/db/query.ts                76 changes

Recommendations
  ⚠ High cyclomatic complexity in loginUser()
    src/auth/login.ts:42
    Split authentication, validation and session creation
    into separate functions.

  ⚡ Code duplication detected
    Estimated duplication is 6.8% across 12 blocks.
    Extract duplicated code into shared utilities.
```

## Features

- **Complexity Analysis** — Cyclomatic complexity per function via TypeScript Compiler API
- **Duplication Detection** — Finds similar code blocks across files
- **Git Hotspots** — Identifies frequently changed, high-complexity files
- **Health Score** — Transparent 0–100 score with weighted breakdown
- **Recommendations** — Concrete, actionable suggestions with severity levels
- **Multiple Outputs** — Terminal, JSON, Markdown
- **CI/CD Ready** — Exit codes and JSON output for automation
- **Configurable** — All thresholds and weights adjustable via `.devlensrc`

## Commands

| Command | Description |
|---------|-------------|
| `devlens analyze <path>` | Full code health analysis |
| `devlens hotspots <path>` | Git hotspots only |
| `devlens history <path>` | Git history metrics |
| `devlens report <path>` | Full report with file output |
| `devlens --help` | Show all commands |

## Configuration

Create a `.devlensrc` file in your project root:

```json
{
  "scoring": {
    "complexity": 0.35,
    "duplication": 0.25,
    "maintainability": 0.25,
    "gitRisk": 0.15
  },
  "exclude": ["node_modules", "dist", ".git", "coverage"],
  "thresholds": {
    "complexity": {
      "high": 20,
      "warning": 10
    },
    "fileSize": 500,
    "duplication": {
      "minBlockLines": 6,
      "warningThreshold": 0.05
    },
    "hotspot": {
      "minChanges": 5,
      "highRisk": 15
    }
  },
  "languages": ["typescript", "javascript"]
}
```

## Health Score

The health score (0–100) is calculated from four weighted dimensions:

| Dimension | Default Weight | Description |
|-----------|---------------|-------------|
| Complexity | 35% | Cyclomatic complexity of functions |
| Duplication | 25% | Estimated code duplication percentage |
| Maintainability | 25% | File health (size, complexity, churn) |
| Git Risk | 15% | Hotspot risk from frequent changes + complexity |

All weights are configurable in `.devlensrc`.

## GitHub Action

```yaml
- uses: devlens/action@v1
  with:
    path: 'src'
    fail_on: 'C'
    comment: 'true'
```

The action analyzes your code, posts a markdown report as a PR comment, and can fail the check if the health grade drops below your threshold.

## Architecture

```
devlens/
├── src/
│   ├── cli/            # Commander.js CLI
│   │   └── commands/   # analyze, hotspots, history, report
│   ├── analyzer/       # Code analysis engine
│   │   ├── complexity/ # Cyclomatic complexity (TS Compiler API)
│   │   ├── duplication/# Duplicate block detection
│   │   ├── git/        # Git history + hotspot analysis
│   │   └── files/      # File-level health metrics
│   ├── scoring/        # Health score calculation
│   ├── recommendations/# Concrete improvement suggestions
│   ├── output/         # Terminal, JSON, Markdown formatters
│   └── config/         # Configuration loading (cosmiconfig)
└── tests/
    ├── fixtures/        # Test repositories
    └── unit/            # Unit tests
```

### JSON Schema

The CLI, GitHub Action, and future dashboard share the same data model:

```json
{
  "repository": { "name": "...", "branch": "...", "analyzedFiles": 143 },
  "score": { "overall": 78, "breakdown": {...}, "grade": "B" },
  "metrics": {
    "complexity": { "average": 8.2, "highest": 34 },
    "duplication": { "estimatedPercentage": 6.8 },
    "fileHealth": { "averageHealth": 72 },
    "git": { "totalCommits": 500, "churnRate": 12 }
  },
  "hotspots": [
    { "file": "src/auth/login.ts", "changes": 92, "riskScore": 15.5 }
  ],
  "recommendations": [
    { "file": "src/auth/login.ts", "line": 42, "severity": "high", "suggestion": "..." }
  ]
}
```

## Roadmap

- [ ] Python, Rust, Go, Java, C#, PHP language support (via Tree-sitter)
- [ ] Web dashboard
- [ ] Dependency health analysis
- [ ] Security vulnerability scanning
- [ ] Test coverage integration
- [ ] Git hooks integration
- [ ] VS Code extension

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT © DevLens Contributors
