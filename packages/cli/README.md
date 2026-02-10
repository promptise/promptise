# @promptise/cli

[![npm version](https://img.shields.io/npm/v/@promptise/cli.svg)](https://www.npmjs.com/package/@promptise/cli)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](https://github.com/promptise/promptise/blob/main/LICENSE)
[![Coverage](https://img.shields.io/badge/coverage-91.17%25-brightgreen.svg)](https://github.com/promptise/promptise)

CLI for generating preview prompts from your Promptise compositions.

## Installation

```bash
npm install -D @promptise/cli
```

## Usage

### Setup

Create a `promptise.config.ts` file in your project root:

```typescript
import { Promptise, createPromptComposition, createPromptComponent } from '@promptise/core';
import { z } from 'zod';

const roleComp = createPromptComponent({
  key: 'role',
  schema: z.object({ role: z.string() }),
  template: 'You are a {{role}}.',
});

const taskComp = createPromptComponent({
  key: 'task',
  schema: z.object({ task: z.string() }),
  template: 'Task: {{task}}',
});

const medicalDiagnosis = createPromptComposition({
  id: 'medical-diagnosis',
  components: [roleComp, taskComp],
});

export default new Promptise({
  compositions: [
    {
      composition: medicalDiagnosis,
      fixtures: {
        basic: { role: 'doctor', task: 'diagnose symptoms' },
        icu: { role: 'intensivist', task: 'stabilize patient' },
      },
    },
  ],
});
```

### Generate Previews

```bash
# Generate all previews
npx promptise build

# Generate specific composition
npx promptise build medical-diagnosis

# Use specific fixture
npx promptise build medical-diagnosis --fixture basic

# Custom output directory
npx promptise build --outdir ./docs/prompts

# Custom config file
npx promptise build --config ./configs/promptise.config.ts

# Clean output without metadata headers
npx promptise build --no-metadata

# Verbose logging
npx promptise build --verbose
```

## Output Structure

Generated files are placed in the output directory (default: `.promptise/builds/`):

```
.promptise/
  builds/
    medical-diagnosis_basic.txt
    medical-diagnosis_icu.txt
    code-review_security.txt
```

### File Format

By default, files include a metadata header followed by the rendered prompt:

```
---
Composition: medical-diagnosis
Fixture: basic
Status: full
Provided: role, task
Missing: none
Tokens: 245
---

You are a doctor.
Task: diagnose symptoms
```

Use `--no-metadata` to generate clean files without headers (useful for copy-pasting directly into LLM interfaces).

### Fixture Status

- **`full`** - All required fields provided, ready to use
- **`partial`** - Some required fields missing, may contain placeholders
- **`placeholder`** - No required fields provided, all placeholders

The CLI will warn you about partial and placeholder fixtures during generation.

### Smart Path Resolution

The CLI displays relative paths based on where you run the command:

```bash
# Running from project root
npm run build --workspace=medical-app
# ✓ Generated 5 previews in apps/medical-app/.promptise/builds

# Running from app directory
cd apps/medical-app && npm run build
# ✓ Generated 5 previews in .promptise/builds
```

This makes it clear where files are generated in monorepo setups.

## CLI Options

```
Usage: promptise build [compositionId] [options]

Generate preview files for compositions

Arguments:
  compositionId            Specific composition ID to build (optional)

Options:
  -f, --fixture <name>     Use specific fixture name
  -o, --outdir <path>      Output directory (default: ".promptise/builds")
  -c, --config <path>      Path to config file (default: "promptise.config.ts")
  --no-metadata            Generate clean files without metadata headers
  -v, --verbose            Enable verbose logging
  -h, --help               Display help for command
```

## Examples

### Monorepo with multiple configs

```bash
# Build from a specific app's config
npx promptise build --config apps/web/promptise.config.ts
```

### Generate clean files for documentation

```bash
npx promptise build --outdir ./docs/prompts --no-metadata
```

### Build specific composition and fixture

```bash
npx promptise build medical-diagnosis --fixture icu --verbose
```

## License

Apache-2.0
