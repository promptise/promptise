# Promptise CLI Cases Example

This workspace is focused on validating CLI log output across standalone scenarios.

## Structure

```
cli-cases/
├── cases/                  # One promptise.config.ts per scenario
├── src/shared/             # Reusable components and compositions
└── .promptise/builds/      # Generated previews per case
```

Each case is isolated through:

- dedicated config file: `cases/<id>/promptise.config.ts`
- dedicated output folder: `.promptise/builds/<id>`
- dedicated npm script for reproducible CLI output

## Run Commands

From repo root:

```bash
npm run case:complete -w promptise-example-cli-cases
npm run case:partial -w promptise-example-cli-cases
npm run case:placeholder -w promptise-example-cli-cases
npm run case:mixed -w promptise-example-cli-cases
npm run case:fallback -w promptise-example-cli-cases
npm run case:no-results:composition -w promptise-example-cli-cases
npm run case:no-results:fixture -w promptise-example-cli-cases
```

Run all non-failing scenarios:

```bash
npm run cases:all -w promptise-example-cli-cases
```

Intentional error-path scenario:

```bash
npm run case:config-error -w promptise-example-cli-cases
```

This command is expected to exit with code `1`.

## Scenario Matrix

- `01-complete`: complete fixture only (no warnings in summary)
- `02-partial`: partial fixture warning
- `03-placeholder`: auto-generated placeholder warning (`no inputs provided`)
- `04-mixed`: complete + partial + placeholder in one run
- `05-fallback`: placeholder fixture that triggers fallback preview warning
- `06-no-results-composition`: composition filter returns zero builds
- `07-no-results-fixture`: fixture filter returns zero builds
- `08-invalid-config`: invalid config default export (fatal error path)

## Why this setup

- Keeps CLI output deterministic and easy to compare.
- Avoids cross-case stale-file side effects with isolated `--outdir`.
- Makes each behavior reproducible with a single command.
