# Contributing to DevLens

Thanks for your interest in contributing!

## Development Setup

```bash
git clone https://github.com/devlens/devlens.git
cd devlens
npm install
npm run build
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run dev` | Run CLI in dev mode |
| `npm test` | Run tests |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Test coverage report |
| `npm run lint` | Lint code |
| `npm run format` | Format code |
| `npm run typecheck` | Type check |

## Testing

Write tests for all new features. Tests live in `tests/unit/`. Use the fixture repositories in `tests/fixtures/` for reproducible test cases.

## Code Style

- TypeScript with strict mode
- Biome for formatting and linting
- Single quotes, semicolons, trailing commas
- No `any` without good reason

## Adding a New Language Analyzer

1. Create `src/analyzer/languages/<lang>/`
2. Implement the complexity, duplication, and file analysis functions
3. Register the language in `config/defaults.ts`
4. Add tests and fixtures

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Add tests for your changes
4. Ensure all tests pass: `npm test`
5. Ensure linting passes: `npm run lint`
6. Submit a pull request

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
