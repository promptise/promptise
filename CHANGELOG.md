# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
