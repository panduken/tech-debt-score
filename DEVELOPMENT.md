# Development Guide

## Project Structure

The project follows **Hexagonal Architecture** (Ports & Adapters pattern):

```
src/
├── domain/              # ✅ Pure business logic (COMPLETE)
│   ├── entities/        # Score, Metric, Rule, Finding
│   └── rules/           # ComplexityRule, SizeRule, TypeSafetyRule
│
├── application/         # ✅ Use cases & orchestration (COMPLETE)
│   ├── services/        # AnalysisService
│   ├── ports/           # Interface definitions
│   └── config/          # AnalysisConfig
│
├── adapters/            # ✅ External integrations
│   ├── input/           # FileSystemReader, TypeScriptParser
│   └── output/          # TerminalReporter, JsonExporter (COMPLETE)
│
├── cli/                 # ✅ Command-line interface (COMPLETE)
│   └── commands/        # analyze command
│
└── shared/              # ✅ Shared types (COMPLETE)
```

## Current Status

### ✅ Completed

- [x] Complete hexagonal architecture setup
- [x] Domain layer (all entities and rules)
- [x] Application layer (services, ports, config)
- [x] CLI entry point and analyze command
- [x] Output adapters (Terminal and JSON reporters)
- [x] Build system configured and working
- [x] TypeScript strict mode enabled

### 🚧 TODO - High Priority

1. **Configure a real test runner** and execute the existing test suites.
2. **Improve circular dependency resolution** across TS/JS extensions and index files.
3. **Improve duplication detection** to support actual similarity rather than exact normalized matches.

### 📋 TODO - Medium Priority

- [ ] Add more sophisticated scoring algorithm
- [ ] Implement code duplication detection
- [ ] Add test coverage integration
- [ ] Create configuration file support (`.tech-debt-score.json`)
- [ ] Add CLI flags for customization
- [ ] Better error handling and user feedback

### 🎯 TODO - Future Enhancements

- [ ] Git integration for trend tracking
- [ ] Additional output formats (HTML, Markdown)
- [ ] VS Code extension
- [ ] CI/CD examples (GitHub Actions, GitLab CI)
- [ ] Multi-language support (Python, Go, Java)

## Quick Commands

```bash
# Build the project
npm run build

# Run analysis
npm run analyze

# Run with specific path
npm run dev -- ./path/to/code

# Run tests (when implemented)
npm test
```

## Architecture Guidelines

### Dependency Rule

Dependencies point **inward only**:

```
CLI → Application → Domain
        ↓
    Adapters (depend on Domain interfaces)
```

### Domain Layer Rules

- ❌ NO filesystem access
- ❌ NO CLI dependencies
- ❌ NO Node.js APIs
- ❌ NO external libraries (except utilities)
- ✅ Pure TypeScript/JavaScript logic only
- ✅ 100% unit testable

### Testing Strategy

1. **Domain Tests**: No mocks needed, test pure logic
2. **Application Tests**: Use mock adapters
3. **E2E Tests**: Test with real codebases

## Next Steps

1. **Implement file scanning** - Get FileSystemReader working
2. **Implement AST parsing** - Extract real metrics from code
3. **Test with real code** - Run against this project itself!
4. **Write tests** - Start with domain layer
5. **Publish to npm** - Make it available for others

## Contributing

When adding new features:

1. Start with domain layer (pure logic)
2. Define ports (interfaces) in application layer
3. Implement adapters for external dependencies
4. Wire everything together in CLI commands

This ensures clean separation and testability!
