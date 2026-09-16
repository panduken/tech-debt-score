# tech-debt-score

> Quantify technical debt you can actually control.  
> **Built by developers, for developers.**

`tech-debt-score` is an open-source CLI and engine that analyzes your codebase and produces a **single, actionable Technical Debt Score**, along with a breakdown of the factors that impact it.

The goal is not to find _everything that could be wrong_, but to measure **what your team can realistically improve**.

---

## Why tech-debt-score?

Most tools focus on:

- Lint errors
- Code smells
- Best practices

But engineering teams need answers to questions like:

- _How bad is our technical debt, really?_
- _Is it getting better or worse over time?_
- _Where should we focus first?_

`tech-debt-score` provides:

- A normalized **0–100 score**
- Clear ownership (team-controllable factors)
- CI-friendly output
- A foundation for long-term debt tracking
- **Designed with developers in mind: fast, minimal friction, and easy to integrate**

> ⚡ **We made it by devs, for devs. Focus on your code, not the tooling.**

---

## What it measures (v1 scope)

The first version focuses only on **signals fully controlled by the engineering team**:

- Code complexity (cyclomatic, nesting)
- File and function size
- Code duplication

- Type safety indicators
- Project structure consistency

> ⚠️ External factors such as deprecated dependencies, security vulnerabilities, or runtime risks are intentionally **out of scope for v1**.

---

## How it works (high level)

1. Scan the codebase
2. Collect raw metrics using AST parsing
3. Normalize metrics into signals
4. Apply weighted scoring
5. Generate:
   - Global score
   - Category breakdown
   - Human-readable report
   - Optional JSON output

---

## Installation

Install as a dev dependency:

```bash
npm install --save-dev tech-debt-score
```

---

## Usage

### Analyze current directory

```bash
npx tech-debt-score
```

### Analyze specific directory

```bash
npx tech-debt-score ./src
```

### Output Options

Generate a JSON report for CI/CD integration:

```bash
npx tech-debt-score . --json report.json
```

### Development

```bash
# Build the project
npm run build

# Run analysis on current project
npm run analyze

# Run self-scan verification
npm run scan
```

---

## Project Structure

This project follows **Hexagonal Architecture** (Ports & Adapters):

```
src/
├── domain/              # Pure business logic (no dependencies)
│   ├── entities/        # Core entities: Score, Metric, Rule, Finding
│   └── rules/           # Scoring rules: ComplexityRule, SizeRule, etc.
│
├── application/         # Use cases & orchestration
│   ├── services/        # AnalysisService
│   ├── ports/           # Interface definitions (IFileReader, IParser, IReporter)
│   └── config/          # Configuration
│
├── adapters/            # External integrations
│   ├── input/           # FileSystemReader, TypeScriptParser
│   └── output/          # TerminalReporter, JsonExporter
│
├── cli/                 # Command-line interface (entry point)
│   └── commands/        # CLI commands
│
└── shared/              # Shared types and utilities
```

---

## Architecture Principles

- **Clean Architecture**: Domain layer has zero dependencies
- **Dependency Inversion**: Dependencies point inward
- **Testability**: Pure business logic, easy to unit test
- **Extensibility**: Easy to add new parsers, rules, or output formats

For detailed architecture information, see [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md)

---

## Development Status

**Current Version:** 0.1.13 (Beta)

### ✅ Completed

- [x] Hexagonal architecture setup
- [x] Domain layer (entities and rules)
- [x] Application layer (services and ports)
- [x] **Full AST parsing implementation**
- [x] **File scanning with fast-glob**
- [x] **Code duplication detection**
- [x] **Circular dependency detection**
- [x] CLI entry point with JSON export
- [x] Density-based scoring by analyzed file count

### 🚧 Roadmap v0.2.0

- [ ] Configuration file support (`.tech-debt-score.json`)
- [ ] Git integration for trend tracking
- [ ] Ignore patterns configuration
- [ ] Real test runner and broader test coverage

### 📋 Roadmap

- [ ] Improve duplication similarity detection
- [ ] Improve circular dependency resolution
- [ ] Git integration for trend tracking
- [ ] Additional output formats (HTML, Markdown)
- [ ] VS Code extension

---

## Contributing

Contributions are welcome! Please read our contributing guidelines (coming soon).

---

## License

MIT © @panduken

---

## Links

- **GitHub**: [github.com/panduken/tech-debt-score](https://github.com/panduken/tech-debt-score)
- **Issues**: [Report a bug](https://github.com/panduken/tech-debt-score/issues)
- **Technical Design**: [TECHNICAL_DESIGN.md](./TECHNICAL_DESIGN.md)
