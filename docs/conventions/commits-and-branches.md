# Commits & Branches Convention

Minimalist style based on [Conventional Commits](https://www.conventionalcommits.org/).

## Format

### Standard (single-line)

```
<type>: <description>
```

**Examples:**
```bash
feat: add retry strategy for failed requests
fix: resolve token counting for empty strings
refactor: standardize file naming and reorganize utils folder
docs: update installation instructions
```

### Breaking Changes (multi-line)

```
<type>!: <description>

BREAKING CHANGE:
- Detail 1
- Detail 2
```

Breaking changes require the `!` suffix and a `BREAKING CHANGE` footer explaining what changed, why, and migration steps.

**Example:**
```bash
feat!: change default tokenizer to tiktoken

BREAKING CHANGE:
- `defaultTokenizer` option removed, tiktoken is now the default
- `countTokens()` return type changed from number to TokenResult
- `Tokenizer` interface requires `model` property
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

- **Lowercase**: Type and description in lowercase
- **No period**: Don't end with `.`
- **Imperative**: "add" not "added" or "adds"
- **Concise**: Keep under 72 characters
- **Single-line**: Multi-line only for breaking changes
- **Details in PR**: Keep commit scannable, context in PR
