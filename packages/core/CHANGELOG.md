# Changelog

All notable changes to **@promptise/core** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-13

### Changed

- **Breaking:** `build(data, context)` is now `build(data, { context })`.
- **Breaking:** `prompt.metadata.tokenCount` -> `prompt.metadata.estimatedTokens`.
- **Breaking:** `prompt.metadata.components[].tokens` -> `prompt.metadata.components[].estimatedTokens`.
- Cost estimation is centralized in registry/CLI (`Promptise` + entries), not in composition runtime.

### Removed

- **Breaking:** `cost` en `createPromptComposition(...)`.
- **Breaking:** `prompt.updateCost()`.
- **Breaking:** `prompt.metadata.cost`.
- **Breaking:** `prompt.metadata.components[].cost`.

### Documentation

- README and docs aligned with the v2 model (`estimatedTokens`, build options, cost in registry/CLI).

## [1.1.1] - 2026-02-13

### Fixed

- **Package metadata**: Added `packages/core/README.md` so the npm package page for `@promptise/core` includes documentation content

### Documentation

- Added a package-level README with installation, quick usage, and links to repository docs

## [1.1.0] - 2026-02-11

### Added

- **Registry**: New `Promptise` class for centralizing compositions
  - `getCompositions()` - Returns all compositions with optional fixtures
  - `getComposition(id)` - Retrieves specific composition entry by ID
  - Unique ID validation on instantiation
  - Flexible composition input - accept compositions directly or as objects
  - `CompositionInput` union type for cleaner registration syntax
- **Types**: Exported `Promptise`, `PromptiseConfig`, `CompositionEntry`, and `CompositionInput`

### Changed

- **File Naming**: Standardized pattern files with feature prefixes for better IDE navigation
  - `composition/pattern/factory.ts` → `composition/pattern/composition-pattern.factory.ts`
  - `strategy/pattern/factory.ts` → `strategy/pattern/strategy-pattern.factory.ts`
  - Applied to all pattern module files (factory, types, prebuilt, validator)
- **Folder Structure**: Renamed `core/` → `utils/` to avoid redundant nesting (`core/src/core/` → `core/src/utils/`)

### Documentation

- Added `docs/learn/09_registry.md` - Complete Registry guide with flexible composition formats
- Added `docs/conventions/file-naming.md` - File naming conventions guide
- Updated root README with Registry examples (direct and object formats)
- Updated `docs/conventions/commits-and-branches.md` with clearer formatting

## [1.0.0] - 2026-02-03

### Added

#### Components

- `createPromptComponent` - Atomic building blocks for prompts
- String templates with `{{variable}}` interpolation
- Function templates for dynamic logic
- Static components (no input schema)
- Zod schema validation with detailed error messages
- Context propagation support

#### Compositions

- `createPromptComposition` - Orchestrate multiple components into complete prompts
- Automatic schema inference from components
- Schema augmentation (extend inferred types)
- Component wrappers (XML, Markdown, Brackets, Custom)
- Message role mapping for chat models
- Multiple output formats (`asString()`, `asMessages()`)

#### Patterns

- `createCompositionPattern` - Enforce structural validation and best practices
- Content validation (required, optional, forbidden keywords)
- Token and character limits per component
- Custom validators with detailed errors
- Prebuilt patterns: RACE, COSTAR, Chain-of-Thought, Few-Shot, ReAct

#### Strategies

- `createPromptStrategy` - Multi-turn prompt chaining with state management
- Stateful navigation (prevents step skipping)
- Execution history with timestamps
- Progress monitoring
- Reset and restart capabilities

#### Strategy Patterns

- `createStrategyPattern` - Enforce workflow structure for multi-turn strategies
- Step presence and order validation
- Prebuilt patterns: Draft-Critique-Refine, ReAct, Chain-of-Density, Research-Outline-Write-Edit, Analysis-Hypothesis-Test

#### Cost Tracking

- Built-in token counting with `CostConfig` interface
- Type-safe cost configuration (inline pricing objects)
- Per-component cost breakdown
- Support for input, output, and reasoning tokens
- `updateCost()` for post-response cost calculation

#### Optimization

- TOON (Token-Oriented Object Notation) integration
- 30-60% token reduction for arrays and objects
- Automatic detection of optimizable data
- Native integration with cost tracking

#### Integrations

- Framework-agnostic design
- Compatible with OpenAI, Anthropic, LangChain, Mastra AI
- Full TypeScript support with type inference

#### Utilities

- `formatValidationError()` - Format Zod validation errors with helpful suggestions
- `countTokens()` - Count tokens for any text using tiktoken
