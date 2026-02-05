# Promptise

> TypeScript prompt engineering framework focused on developer experience.

## Project Architecture

Monorepo managed with npm workspaces.

```
packages/
└── core/                  # @promptise/core
    ├── src/
    ├── CHANGELOG.md
    └── package.json
docs/
├── conventions/           # Commits, branches, code standards
└── learn/                 # Tutorials and guides
README.md
```

## Commands

```
npm run validate
├── npm run lint       → ESLint
├── npm run test       → Jest
└── npm run build      → tsc
```

## Core Principles

### Clarity & Minimalism

- Write code understandable without additional context
- Implement only what's needed, no "preventive code"
- Avoid premature abstractions and unnecessary patterns
- Anticipate effects of current code, not hypothetical futures

### Strict Type Safety

- Use strict TypeScript
- Avoid `any`/`unknown` without explicit type guards
- Prefer enums or string literals over generic strings

### Code Style

- Early returns: exit fast on invalid conditions
- Guard clauses: validate inputs at function start
- Consistency: review existing APIs before proposing new ones
- Code, comments, and docs: always in English

### API Design

- Public APIs: design for clarity and consistency
- Breaking changes: avoid at all costs, use deprecation patterns
- Exports: explicit and minimal surface area
- Backwards compatibility: maintain across minor versions

### Documentation

- JSDoc with `@example` for all public APIs
- Update related JSDoc and markdown on changes
- Document type parameters, exceptions, and edge cases

### Library Standards

- Tree-shakeable exports with comprehensive TypeScript definitions
- Unit test coverage for all public APIs
- Clear error messages with actionable guidance
- Semantic versioning strictness

## Development Process

1. **Analyze** existing APIs and patterns
2. **Propose** with public API impact and breaking change assessment
3. **Approval** required for public API and breaking changes; refactors proceed with rationale
4. **Verify** with `npm run validate`
5. **Document** with JSDoc and related markdown

## Conventions

See [docs/conventions/](docs/conventions/) for detailed guidelines.

## Learning

See [docs/learn/](docs/learn/) for a sequential guide through all project features and concepts.
