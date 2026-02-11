# Promptise

> TypeScript prompt engineering framework focused on developer experience.

## Project Structure

Monorepo with npm workspaces.

```
packages/
└── core/                  # @promptise/core
    ├── src/
    │   ├── component/
    │   ├── composition/
    │   │   └── pattern/   # composition-pattern.*.ts
    │   ├── strategy/
    │   │   └── pattern/   # strategy-pattern.*.ts
    │   ├── registry/
    │   └── utils/         # core.types.ts, errors/, tokenizer/
    ├── CHANGELOG.md
    └── package.json
docs/
├── conventions/           # Commits, branches, code standards
└── learn/                 # Tutorials and guides
```

## Commands

```bash
npm run validate  # lint + test + build
npm run lint      # ESLint
npm run test      # Jest
npm run build     # TypeScript compilation
```

## File Naming Conventions

**Pattern**: `[feature-name].[type].ts`

- **Single-word features**: Use dots as separators
  - `component.factory.ts`, `component.types.ts`
  - `registry.class.ts`, `registry.types.ts`

- **Multi-word features**: Use hyphens in feature name, dots for type
  - `composition-pattern.factory.ts`
  - `composition-pattern.types.ts`
  - `strategy-pattern.prebuilt.ts`

- **Test files**: Add `.test` before `.ts`
  - `composition-pattern.factory.test.ts`
  - `registry.class.test.ts`

## Core Principles

### Clarity & Minimalism
- Write self-documenting code
- Implement only what's needed, no speculative features
- Avoid premature abstractions
- Use early returns and guard clauses

### Type Safety
- Strict TypeScript mode
- Avoid `any`/`unknown` without type guards
- Prefer string literals/enums over generic strings

### API Design
- Consistent with existing patterns
- Breaking changes require deprecation path
- Minimal, explicit export surface
- Maintain backwards compatibility in minor versions

### Documentation
- JSDoc with `@example` for public APIs
- Document type parameters, exceptions, edge cases
- Update related docs on changes

### Quality Standards
- Tree-shakeable exports
- Unit tests for public APIs
- Clear, actionable error messages
- Semantic versioning

## Development Workflow

1. **Analyze** existing patterns and APIs
2. **Propose** changes (assess breaking changes and public API impact)
3. **Implement** with tests and documentation
4. **Verify** with `npm run validate`

## References

- Conventions: `docs/conventions/`
- Learning guide: `docs/learn/`
