# Commits & Branches Convention

Minimalist style based on [Conventional Commits](https://www.conventionalcommits.org/).

## Format

```
<type>: <description>
```

## Types

Same types for commits and branches:

| Type       | Description                                                          | Branch Example              |
| ---------- | -------------------------------------------------------------------- | --------------------------- |
| `feat`     | New feature or functionality                                         | `feat/retry-strategy`       |
| `fix`      | Bug fix                                                              | `fix/token-counting`        |
| `refactor` | Code refactoring (no feat or fix)                                    | `refactor/monorepo`         |
| `docs`     | Documentation changes                                                | `docs/api-examples`         |
| `test`     | Add or update tests                                                  | `test/composition-coverage` |
| `style`    | Formatting, whitespace (no logic change)                             | `style/indentation`         |
| `chore`    | Maintenance (groups `ci`, `build`, `perf`, `revert`)                 | `chore/update-deps`         |

## Rules

1. Use lowercase for type and description
2. No period at the end
3. Use imperative mood ("add" not "added" or "adds")
4. Keep description under 72 characters

## Examples

```bash
feat: add retry strategy for failed requests
fix: resolve token counting for empty strings
docs: update installation instructions
refactor: simplify composition rendering logic
test: add tests for cost tracking
chore: update dependencies
style: fix indentation in component files
```

## Breaking Changes

Breaking changes require extra attention. Mark with `!` and include a `BREAKING CHANGE` footer:

```
feat!: change default tokenizer to tiktoken

BREAKING CHANGE:
- `defaultTokenizer` option removed, tiktoken is now the default
- `countTokens()` return type changed from number to TokenResult
- `Tokenizer` interface requires `model` property
```
