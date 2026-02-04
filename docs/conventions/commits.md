# Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

## Format

```
<type>: <description>
```

## Types

| Type       | Description                                      |
| ---------- | ------------------------------------------------ |
| `feat`     | New feature or functionality                     |
| `fix`      | Bug fix                                          |
| `docs`     | Documentation changes                            |
| `refactor` | Code refactoring (no feature or fix)             |
| `test`     | Adding or updating tests                         |
| `chore`    | Maintenance tasks (dependencies, configs, etc.)  |
| `perf`     | Performance improvements                         |
| `style`    | Code style changes (formatting, no logic change) |

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
perf: optimize tokenizer caching
style: fix indentation in component files
```

## Breaking Changes

For breaking changes, add `!` after the type:

```bash
feat!: change default tokenizer to tiktoken
refactor!: rename Component to Prompt
```
