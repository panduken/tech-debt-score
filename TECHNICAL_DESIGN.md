# Technical Design Document: tech-debt-score

> **Version:** 1.0  
> **Last Updated:** 2026-01-20  
> **Status:** Design Phase

---

## Table of Contents

1. [Overview](#overview)
2. [Goals and Non-Goals](#goals-and-non-goals)
3. [Supported Languages and Scope](#supported-languages-and-scope)
4. [Metrics Specification](#metrics-specification)
5. [Architecture](#architecture)
6. [Directory Structure](#directory-structure)
7. [Data Flow](#data-flow)
8. [Implementation Guidelines](#implementation-guidelines)
9. [Future Considerations](#future-considerations)

---

## Overview

`tech-debt-score` is an open-source CLI tool and analysis engine that quantifies technical debt in a codebase using a single, actionable score (0-100).

### Key Principles

- **Developer-focused**: Built by developers, for developers
- **Actionable over comprehensive**: Measures what teams can control
- **AST-based analysis**: No regex, language-aware parsing
- **Clean architecture**: Hexagonal/Ports & Adapters pattern
- **CI-friendly**: Easy integration into automated workflows

### Value Proposition

Unlike traditional tools that focus on lint errors and code smells, `tech-debt-score` answers critical questions:
- *How bad is our technical debt, really?*
- *Is it getting better or worse over time?*
- *Where should we focus first?*

---

## Goals and Non-Goals

### ✅ Goals (V1)

- Provide a **normalized 0-100 technical debt score**
- Measure **team-controllable factors** only
- Support **TypeScript and JavaScript** codebases
- Generate **human-readable and JSON reports**
- Enable **trend tracking** over time
- Maintain **fast execution** and minimal configuration

### ❌ Non-Goals (V1)

- Deprecated dependencies detection
- Security vulnerability scanning
- Runtime performance analysis
- External API/service health checks
- Supporting languages beyond JS/TS

---

## Supported Languages and Scope

### Supported Languages

- **TypeScript** (`.ts` files)
- **JavaScript** (`.js` files)

### Default File Patterns

**Analyzed:**
- `src/**/*.ts`
- `src/**/*.js`

**Ignored:**
- `node_modules/`
- `dist/`
- `build/`
- `coverage/`
- `.git/`
- Generated files

### Future Configuration

CLI flags will allow customization of these patterns.

---

## Metrics Specification

### 1. Structural Code Metrics (AST-based)

**Implementation Approach:** All metrics use AST parsing (not regex) for accuracy.

#### File-Level Metrics

| Metric | Description | Purpose |
|--------|-------------|---------|
| **File Length (LOC)** | Lines of code per file | Identify overly large files |
| **TODO Comments** | Count of `// TODO` comments | Track deferred work |
| **FIXME Comments** | Count of `// FIXME` comments | Track known issues |

#### Function-Level Metrics

| Metric | Description | Purpose |
|--------|-------------|---------|
| **Function Length** | Lines of code per function | Identify complex functions |
| **Nesting Depth** | Maximum nesting level | Measure code complexity |
| **Cyclomatic Complexity** | Number of decision paths | Measure testability |
| **Parameter Count** | Number of function parameters | Identify hard-to-use functions |

#### TypeScript-Specific Metrics

| Metric | Description | Purpose |
|--------|-------------|---------|
| **`any` Usage** | Usage of the `any` type | Track type safety violations |

### 2. Project-Level Signals (Aggregated)

These provide the "big picture" view:

| Signal | Calculation | Purpose |
|--------|-------------|---------|
| **Total Files** | Count of analyzed files | Scope indicator |
| **Average Complexity** | Mean complexity per file | Overall health indicator |
| **Large Files %** | Percentage of files exceeding threshold | Hotspot identification |
| **Complex Functions %** | Percentage of functions exceeding threshold | Risk assessment |

### 3. Scoring Algorithm (High-Level)

```
1. Collect raw metrics per file
2. Normalize metrics to 0-100 scale
3. Apply category weights:
   - Complexity: 30%
   - Size: 25%
   - Type Safety: 20%
   - Code Quality: 15%
   - Structure: 10%
4. Calculate weighted average
5. Generate final score (inverse: 100 = no debt)
```

---

## Architecture

### Architectural Style

**Hexagonal Architecture (Ports & Adapters)**

This pattern ensures:
- Clear separation of concerns
- High testability
- Easy adapter swapping
- Framework independence

### Layer Definitions

```
┌─────────────────────────────────────────┐
│           CLI Adapter (Entry)           │
│         (No Business Logic)             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        Application Layer                │
│   - Orchestrates analysis               │
│   - Applies rules                       │
│   - Aggregates scores                   │
└─────┬───────────────────────┬───────────┘
      │                       │
┌─────▼─────────┐    ┌────────▼──────────┐
│ Input Adapters│    │ Output Adapters   │
│ - File Reader │    │ - Terminal Report │
│ - AST Parser  │    │ - JSON Exporter   │
└─────┬─────────┘    └────────┬──────────┘
      │                       │
      └───────────┬───────────┘
                  │
        ┌─────────▼──────────┐
        │   Domain Layer     │
        │  (Pure Logic)      │
        │  - Score           │
        │  - Metric          │
        │  - Rule            │
        │  - Finding         │
        └────────────────────┘
```

### Layer Details

#### 1. Domain Layer (Pure Logic)

**Core Entities:**
- `Score` - Represents technical debt scores and calculations
- `Metric` - Individual measurement data
- `Rule` - Evaluation and scoring rules
- `Finding` - Identified code issues

**Constraints:**
- ❌ No filesystem access
- ❌ No CLI dependencies
- ❌ No Node.js APIs
- ❌ No external libraries (except utility functions)
- ✅ Pure TypeScript/JavaScript logic only
- ✅ 100% unit testable

**Example Domain Interfaces:**

```typescript
interface Metric {
  name: string;
  value: number;
  filePath: string;
  location?: SourceLocation;
}

interface Rule {
  id: string;
  name: string;
  evaluate(metrics: Metric[]): Finding[];
  calculateScore(findings: Finding[]): number;
}

interface Score {
  overall: number; // 0-100
  categories: CategoryScore[];
  timestamp: Date;
}

interface Finding {
  ruleId: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  filePath: string;
  location?: SourceLocation;
}
```

#### 2. Application Layer (Use Cases)

**Responsibilities:**
- Orchestrate the analysis workflow
- Coordinate between domain and adapters
- Apply business rules
- Aggregate results

**Example Services:**

```typescript
class AnalysisService {
  constructor(
    private fileReader: IFileReader,
    private parser: IParser,
    private rules: Rule[]
  ) {}
  
  async analyze(config: AnalysisConfig): Promise<AnalysisResult> {
    // 1. Read files
    // 2. Parse to AST
    // 3. Extract metrics
    // 4. Apply rules
    // 5. Calculate scores
    // 6. Return results
  }
}
```

#### 3. Adapters Layer (External Interfaces)

##### Input Adapters (Inbound Ports)

**File System Reader:**
- Scans directories
- Filters files by patterns
- Respects ignore rules
- Returns file metadata

**AST Parser:**
- Parses TypeScript/JavaScript
- Extracts structural information
- Handles syntax errors gracefully
- Technology: `@typescript-eslint/parser`, `@babel/parser`, or `acorn`

##### Output Adapters (Outbound Ports)

**Terminal Reporter:**
- Formats results for console
- Uses colors and formatting
- Provides actionable output
- Technology: `chalk`, `cli-table3`

**JSON Exporter:**
- Exports structured data
- CI/CD friendly format
- Version-stamped output

#### 4. Entry Point

**CLI Adapter:**
- Parses command-line arguments
- Maps to application commands
- Handles errors and exit codes
- **No business logic**
- Technology: `commander` or `yargs`

### Dependency Rules

**The Dependency Rule:** Dependencies point **inward only**

```
CLI → Application → Domain
        ↓
    Adapters (depend on Domain interfaces)
```

- Domain layer has **zero dependencies**
- Application layer depends on **Domain only**
- Adapters depend on **Domain interfaces**
- CLI depends on **Application and Adapters**

---

## Directory Structure

```
tech-debt-score/
├── src/
│   ├── domain/              # Pure business logic
│   │   ├── entities/
│   │   │   ├── Score.ts
│   │   │   ├── Metric.ts
│   │   │   ├── Rule.ts
│   │   │   └── Finding.ts
│   │   ├── rules/           # Scoring rules
│   │   │   ├── ComplexityRule.ts
│   │   │   ├── SizeRule.ts
│   │   │   └── TypeSafetyRule.ts
│   │   └── services/
│   │       └── ScoreCalculator.ts
│   │
│   ├── application/         # Use cases & orchestration
│   │   ├── services/
│   │   │   └── AnalysisService.ts
│   │   ├── ports/           # Interface definitions
│   │   │   ├── IFileReader.ts
│   │   │   ├── IParser.ts
│   │   │   └── IReporter.ts
│   │   └── config/
│   │       └── AnalysisConfig.ts
│   │
│   ├── adapters/            # External integrations
│   │   ├── input/
│   │   │   ├── FileSystemReader.ts
│   │   │   └── TypeScriptParser.ts
│   │   └── output/
│   │       ├── TerminalReporter.ts
│   │       └── JsonExporter.ts
│   │
│   ├── cli/                 # Command-line interface
│   │   ├── index.ts         # Entry point
│   │   └── commands/
│   │       └── analyze.ts
│   │
│   └── shared/              # Shared utilities
│       ├── types.ts
│       └── utils.ts
│
├── tests/
│   ├── domain/              # Unit tests (no I/O)
│   ├── application/         # Integration tests
│   └── e2e/                 # End-to-end tests
│
├── docs/
├── package.json
├── tsconfig.json
└── README.md
```

---

## Data Flow

### Analysis Flow

```
1. User runs CLI command
   ↓
2. CLI adapter parses arguments
   ↓
3. Application layer receives config
   ↓
4. FileReader adapter scans files
   ↓
5. Parser adapter generates ASTs
   ↓
6. Application extracts Metrics
   ↓
7. Domain Rules evaluate Metrics → Findings
   ↓
8. Domain ScoreCalculator → Score
   ↓
9. Application returns AnalysisResult
   ↓
10. Reporter adapter formats output
    ↓
11. CLI displays results
```

### Data Structures

```typescript
// Input
AnalysisConfig {
  rootPath: string;
  patterns: string[];
  ignore: string[];
}

// Processing
File[] → AST[] → Metric[] → Finding[] → Score

// Output
AnalysisResult {
  score: Score;
  findings: Finding[];
  metadata: {
    filesAnalyzed: number;
    duration: number;
    timestamp: Date;
  }
}
```

---

## Implementation Guidelines

### Technology Stack

- **Language:** TypeScript
- **Runtime:** Node.js (v18+)
- **Package Manager:** npm
- **Build Tool:** tsc (TypeScript compiler)

### Recommended Libraries

| Purpose | Library | Why |
|---------|---------|-----|
| AST Parsing | `@typescript-eslint/parser` | TypeScript support |
| JS Parsing | `@babel/parser` or `acorn` | JavaScript support |
| File Scanning | `fast-glob` | Fast pattern matching |
| CLI Framework | `commander` | Intuitive API |
| Terminal Output | `chalk` + `cli-table3` | Beautiful formatting |
| Testing | `vitest` or `jest` | Fast, modern testing |

### Code Quality Standards

- **TypeScript strict mode:** Enabled
- **No `any` types** in core codebase (except adapters if needed)
- **100% test coverage** for domain layer
- **ESLint + Prettier** for consistency
- **Clear error messages** for users

### Testing Strategy

1. **Unit Tests** (Domain layer)
   - Test pure functions
   - No mocks needed (no I/O)
   - Fast execution

2. **Integration Tests** (Application layer)
   - Test with mock adapters
   - Verify orchestration logic

3. **E2E Tests**
   - Test real codebases
   - Verify actual output
   - Performance benchmarks

---

## Future Considerations

### V2 Features (Potential)

- **Additional Languages:** Python, Go, Java
- **Code Duplication Detection:** AST-based clone detection
- **Test Coverage Integration:** Parse coverage reports
- **Custom Rules:** User-defined scoring rules
- **Configuration File:** `.tech-debt-score.json`
- **Git Integration:** Track score over commits
- **Web Dashboard:** Visualize trends
- **IDE Extensions:** VS Code, IntelliJ
- **CI Platform Integrations:** GitHub Actions, GitLab CI

### Scalability Considerations

- **Caching:** Cache AST parsing results
- **Parallelization:** Process files in parallel
- **Incremental Analysis:** Only analyze changed files
- **Large Codebases:** Stream processing for memory efficiency

### Extensibility Points

The architecture supports:
- New input adapters (e.g., read from Git, API)
- New output adapters (e.g., HTML report, database)
- New parsing adapters (e.g., Python, Go)
- New rules (plugin system)
- Different scoring algorithms

---

## Questions & Decisions Log

### Open Questions

1. **Scoring thresholds:** What defines a "large file" or "complex function"?
   - Proposal: Configurable, with sensible defaults (e.g., 300 LOC, cyclomatic > 10)

2. **Weighting system:** How to balance different metric categories?
   - Proposal: Start with equal weights, tune based on user feedback

3. **Trend storage:** Where to store historical scores?
   - Proposal: V1 outputs JSON, users can track; V2 adds built-in storage

### Decisions Made

- ✅ **Architecture:** Hexagonal/Ports & Adapters (2026-01-20)
- ✅ **Languages (V1):** TypeScript and JavaScript only (2026-01-20)
- ✅ **Analysis Method:** AST-based, no regex (2026-01-20)
- ✅ **Scope (V1):** Team-controllable metrics only (2026-01-20)

---

## Appendix

### References

- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [AST Explorer](https://astexplorer.net/) - For testing AST parsing
- [TypeScript Compiler API](https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API)
- [Cyclomatic Complexity](https://en.wikipedia.org/wiki/Cyclomatic_complexity)

### Contributors

- Initial Design: 2026-01-20

---

**Next Steps:**
1. Review and approve this design
2. Set up project structure
3. Implement domain layer (pure logic)
4. Implement AST parser adapter
5. Build CLI and reporting
6. Add comprehensive tests
7. Package and publish
