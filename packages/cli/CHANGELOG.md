# Changelog

All notable changes to **@promptise/cli** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2026-02-18

### Changed

- Detailed logging is now the default behavior for `promptise build`.
- Updated config log flow:
  - `→ Loading config`
  - `✓ Config loaded from <path>`
- Updated preview log flow to print generated files first, then fixture warnings as indented details.
- Removed internal conditional logic tied to `verbose` to simplify future maintenance.

### Deprecated

- `-v, --verbose` remains as a backward-compatible legacy alias (no-op).
- Plan: remove the alias in the next major release.

### Quality

- `@promptise/cli` coverage updated to 100% (statements/branches/functions/lines).

## [2.0.0] - 2026-02-13

### Changed

- **Breaking:** fixture status `full` -> `complete`.
- **Breaking:** `Estimated Tokens` is shown only for `complete` fixtures.
- **Breaking:** `Estimated Input Cost` is shown only for `complete` fixtures.
- Core dependency aligned to `@promptise/core@^2.0.0`.

### Added

- Stale preview cleanup enabled by default before build.
- New opt-out flag: `--no-clean`.

### Documentation

- README and learn docs aligned with current preview and metadata behavior.

## [1.0.0] - 2026-02-10

### Added

#### Build Command

- `promptise build` - Generate preview files from compositions and fixtures
- Composition filtering - Build specific composition by ID
- Fixture filtering - Build specific fixture by name
- Custom output directory support with `--outdir` option
- Custom config file path with `--config` option
- Verbose logging with `--verbose` flag
- Clean output mode with `--no-metadata` flag

#### Preview Generation

- Automatic preview file generation for all composition/fixture combinations
- File naming pattern: `{compositionId}_{fixtureName}.txt`
- Metadata headers with composition info, fixture status, and token counts
- Fixture completeness analysis (full/partial/placeholder status)
- Missing field detection and reporting
- Token counting in preview metadata (when composition has cost tracking)

#### Fixture Analysis

- Automatic schema validation against fixture data
- Three-tier status system:
  - `full` - All required fields provided
  - `partial` - Some required fields missing
  - `placeholder` - No required fields provided
- Field tracking (provided vs missing)
- Warning system for incomplete fixtures

#### Config Loading

- Dynamic TypeScript config import
- Support for ES modules (`.ts`, `.mts`)
- Config file validation (must export Promptise instance)
- Helpful error messages for common config issues
- Automatic schema inference from config compositions

#### Path Resolution

- Smart path display relative to command execution directory
- Monorepo-aware path formatting using `INIT_CWD`
- Absolute path resolution for output directory
- Cross-platform path handling

#### Developer Experience

- Colored console output (success/error/warning states)
- Progress indicators during build
- Summary statistics (total builds, warnings)
- Detailed error messages with suggestions
- TypeScript definitions included

#### Template Processing

- Variable extraction from component templates
- Placeholder preservation for missing fields
- Support for `{{variable}}` syntax
- Template analysis for fixture validation

### Documentation

- Comprehensive README with usage examples
- CLI options reference
- Integration examples (npm scripts, CI/CD, monorepo)
- Error handling guide
- FAQ section

### Developer Tooling

- Unit test suite with 96 tests
- 91.17% code coverage
- ESLint strict type checking
- Prettier code formatting
- TypeScript strict mode
- Pre-commit hooks via Husky

### Dependencies

- `@promptise/core` - Core prompt framework
- `zod` - Schema validation
- `commander` - CLI argument parsing
- `chalk` - Terminal styling
- Development dependencies for testing and linting

## Notes

**Breaking Changes:** None - this is the initial release.

**Migration:** No migration needed - new package.

**Deprecations:** None.
