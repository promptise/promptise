# @promptise/cli

Generate prompt preview files from your Promptise registry fixtures.

Before you start:

- [Repository README](https://github.com/promptise/promptise/blob/main/README.md)
- [Learning Docs](https://github.com/promptise/promptise/tree/main/docs/learn)

## Installation

```bash
npm install -D @promptise/cli
```

## Quick Usage

```bash
npx promptise build
```

```bash
npx promptise build [compositionId] [options]
```

Options:

- `-f, --fixture <name>`: build a single fixture
- `-o, --outdir <path>`: set output directory
- `-c, --config <path>`: set config file path
- `--no-metadata`: generate previews without header metadata
- `--no-clean`: keep stale preview files
- `-v, --verbose`: deprecated alias (verbose logging is now default)

## Features

- Fixture-driven preview generation (`complete`, `partial`, `placeholder`)
- Estimated input cost block when pricing is configured (`defaultCost` or entry `cost`)
- Estimated tokens fallback when pricing is not configured
- Metadata header controls (`--no-metadata`)
- Stale preview cleanup by default (`--no-clean` to disable)
- Default output directory: `.promptise/builds`

## License

Apache-2.0
