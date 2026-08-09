# Changelog

## [0.1.0] - 2025-01-15

### Added

- Initial release of DevLens
- CLI with `analyze`, `hotspots`, `history`, `report` commands
- TypeScript/JavaScript complexity analysis via TS Compiler API
- Cyclomatic complexity calculation for functions
- Code duplication detection with similarity scoring
- Git hotspot analysis with complexity-weighted risk scores
- File health metrics (lines, complexity, churn, contributors)
- Health score calculation (0-100) with configurable weights
- Concrete, actionable recommendations with severity levels
- Multiple output formats: terminal, JSON, markdown
- Configuration via `.devlensrc` with cosmiconfig
- Exit codes for CI/CD integration (F < 40, error > 2)
- GitHub Action for automated PR analysis
- 36 unit tests with fixture repositories
- CI/CD workflows (test, lint, release)
