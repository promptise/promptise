# CLI

> **Generate preview prompts from your compositions.**

The Promptise CLI (`@promptise/cli`) is a developer tool that generates text preview files from your registered compositions and fixtures. Use it to test prompts, share examples with stakeholders, and maintain a library of prompt variations.

---

## Installation

```bash
npm install -D @promptise/cli
```

**Recommended as dev dependency** - the CLI is a development/build tool, not a production runtime.

---

## Quick Start

### 1. Create Config File

Create `promptise.config.ts` in your project root:

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

**Alternative:** Pass compositions directly without fixtures for simpler setup. The CLI will generate placeholder previews:

```typescript
export default new Promptise({
  compositions: [medicalDiagnosis], // Direct format
});
// Generates: medical-diagnosis_placeholder.txt with {{placeholders}}
```

### 2. Generate Previews

```bash
npx promptise build
```

**Output:**

```
Promptise CLI

Building previews...

✓ Generated 2 previews in .promptise/builds
```

### 3. Check Generated Files

```
.promptise/
  builds/
    medical-diagnosis_basic.txt
    medical-diagnosis_icu.txt
```

**File content:**

```
---
Composition: medical-diagnosis
Fixture: basic
Status: full
Provided: role, task
Missing: none
Tokens: 15
---

You are a doctor.

Task: diagnose symptoms
```

---

## CLI Commands

### build

Generate preview files for all compositions (or specific ones).

```bash
promptise build [compositionId] [options]
```

**Arguments:**

| Argument        | Type     | Description                      |
| --------------- | -------- | -------------------------------- |
| `compositionId` | `string` | Optional composition ID to build |

**Options:**

| Option                 | Type      | Default               | Description                      |
| ---------------------- | --------- | --------------------- | -------------------------------- |
| `-f, --fixture <name>` | `string`  | -                     | Build specific fixture only      |
| `-o, --outdir <path>`  | `string`  | `.promptise/builds`   | Output directory                 |
| `-c, --config <path>`  | `string`  | `promptise.config.ts` | Path to config file              |
| `--no-metadata`        | `boolean` | `false`               | Omit metadata headers from files |
| `-v, --verbose`        | `boolean` | `false`               | Enable verbose logging           |

---

## Usage Examples

### Build All Compositions

```bash
npx promptise build
```

Generates preview files for every composition and fixture in your config.

---

### Build Specific Composition

```bash
npx promptise build medical-diagnosis
```

Only generates previews for `medical-diagnosis` composition (all fixtures).

---

### Build Specific Fixture

```bash
npx promptise build medical-diagnosis --fixture icu
```

Generates only the `medical-diagnosis_icu.txt` file.

---

### Custom Output Directory

```bash
npx promptise build --outdir ./docs/prompts
```

Saves previews to `./docs/prompts/` instead of `.promptise/builds/`.

---

### Clean Files Without Metadata

```bash
npx promptise build --no-metadata
```

Generates files without metadata headers - perfect for copy-pasting directly into ChatGPT or Claude:

```
You are a doctor.

Task: diagnose symptoms
```

---

### Custom Config File

```bash
npx promptise build --config ./configs/medical.config.ts
```

Load compositions from a different config file.

---

### Verbose Logging

```bash
npx promptise build --verbose
```

**Output:**

```
Promptise CLI

Loading config from promptise.config.ts...
✓ Config loaded

Building previews...

Processing medical-diagnosis...
  ✓ basic (15 tokens)
  ✓ icu (23 tokens)

✓ Generated 2 previews in .promptise/builds
```

---

### Combine Options

```bash
npx promptise build medical-diagnosis \
  --fixture icu \
  --outdir ./docs/medical \
  --no-metadata \
  --verbose
```

---

## Output Format

### Default Format (with metadata)

```
---
Composition: medical-diagnosis
Fixture: basic
Status: full
Provided: role, task
Missing: none
Tokens: 15
---

You are a doctor.

Task: diagnose symptoms
```

**Metadata Fields:**

| Field         | Description                                     |
| ------------- | ----------------------------------------------- |
| `Composition` | Composition ID                                  |
| `Fixture`     | Fixture name                                    |
| `Status`      | `full`, `partial`, or `placeholder`             |
| `Provided`    | Comma-separated list of provided fields         |
| `Missing`     | Comma-separated list of missing required fields |
| `Tokens`      | Token count (if composition has cost tracking)  |

---

### Clean Format (--no-metadata)

```
You are a doctor.

Task: diagnose symptoms
```

Use this format when you want to copy-paste directly into LLM interfaces.

---

## Fixture Status

The CLI analyzes each fixture and reports its completeness:

### full

All required fields provided. Ready for production use.

```
Status: full
Provided: role, task, context
Missing: none
```

---

### partial

Some required fields missing. May have placeholders like `{{fieldName}}`.

```
Status: partial
Provided: role, task
Missing: context, rules
```

**Generated file:**

```
You are a doctor.

Task: diagnose symptoms

Context: {{context}}

Rules: {{rules}}
```

CLI warns:

```
⚠️  1 file with incomplete fixtures - review before using
```

---

### placeholder

No required fields provided. Entire prompt is placeholders.

```
Status: placeholder
Provided: none
Missing: role, task, context
```

**Generated file:**

```
You are a {{role}}.

Task: {{task}}

Context: {{context}}
```

---

## File Naming

Generated files follow this pattern:

```
{compositionId}_{fixtureName}.txt
```

**Examples:**

- `medical-diagnosis_basic.txt`
- `code-review_security.txt`
- `customer-support_urgent.txt`

**Why this format?**

- ✅ Alphabetically grouped by composition
- ✅ Clear fixture identification
- ✅ Safe for all file systems
- ✅ Easy to search and filter

---

## Integration Examples

### npm Scripts

Add commands to `package.json`:

```json
{
  "scripts": {
    "prompts:build": "promptise build",
    "prompts:build:clean": "promptise build --no-metadata",
    "prompts:build:medical": "promptise build medical-diagnosis",
    "prompts:build:docs": "promptise build --outdir ./docs/prompts --no-metadata"
  }
}
```

Usage:

```bash
npm run prompts:build
npm run prompts:build:medical
npm run prompts:build:docs
```

---

### CI/CD Pipeline

Generate previews on every commit:

```yaml
# .github/workflows/prompts.yml
name: Generate Prompt Previews

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run prompts:build
      - uses: actions/upload-artifact@v3
        with:
          name: prompt-previews
          path: .promptise/builds/
```

---

### Pre-commit Hook

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "promptise build --no-metadata --outdir ./docs/prompts"
    }
  }
}
```

---

### Monorepo Setup

```
apps/
  medical-app/
    promptise.config.ts
  legal-app/
    promptise.config.ts
  support-app/
    promptise.config.ts
```

Build specific apps:

```bash
# Build all apps
npx promptise build --config apps/medical-app/promptise.config.ts
npx promptise build --config apps/legal-app/promptise.config.ts
npx promptise build --config apps/support-app/promptise.config.ts

# Or create npm scripts
{
  "scripts": {
    "prompts:medical": "promptise build --config apps/medical-app/promptise.config.ts",
    "prompts:legal": "promptise build --config apps/legal-app/promptise.config.ts",
    "prompts:support": "promptise build --config apps/support-app/promptise.config.ts"
  }
}
```

---

## Use Cases

### 1. Testing Prompt Variations

Generate previews to compare different fixture variations:

```typescript
export default new Promptise({
  compositions: [
    {
      composition: customerSupport,
      fixtures: {
        friendly: { tone: 'casual', urgency: 'low' },
        professional: { tone: 'formal', urgency: 'medium' },
        urgent: { tone: 'empathetic', urgency: 'critical' },
      },
    },
  ],
});
```

```bash
npx promptise build customer-support
```

Compare outputs to choose the best approach.

---

### 2. Stakeholder Demos

Generate clean previews for non-technical stakeholders:

```bash
npx promptise build --outdir ./stakeholder-demos --no-metadata
```

Share the `stakeholder-demos/` folder with your team for review.

---

### 3. Documentation

Maintain up-to-date prompt examples:

```bash
# Generate docs on every release
npx promptise build --outdir ./docs/api/prompts --no-metadata
```

Commit the generated files to version control.

---

### 4. Quick Testing

Test a new fixture immediately:

```typescript
// Add to config
fixtures: {
  test: { role: 'new role', task: 'new task' }
}
```

```bash
npx promptise build my-composition --fixture test --verbose
```

Review output, iterate on fixture.

---

### 5. Compliance Audits

Generate previews for regulated prompts:

```typescript
export default new Promptise({
  compositions: [
    {
      composition: hipaaCompliantDiagnosis,
      fixtures: {
        audit_v1: {
          /* compliant data */
        },
        audit_v2: {
          /* updated for new regulations */
        },
      },
    },
  ],
});
```

```bash
npx promptise build hipaa-compliant-diagnosis --outdir ./compliance/audits
```

Archive generated files for audit trails.

---

## Error Handling

### Composition Not Found

```bash
npx promptise build nonexistent-prompt
```

**Output:**

```
Build failed: Composition 'nonexistent-prompt' not found in registry.
```

**Fix:** Check composition ID in your config file.

---

### Fixture Not Found

```bash
npx promptise build medical-diagnosis --fixture nonexistent
```

**Output:**

```
Build failed: Fixture 'nonexistent' not found for composition 'medical-diagnosis'.
Available fixtures: basic, icu
```

**Fix:** Use one of the available fixture names.

---

### Config File Not Found

```bash
npx promptise build --config missing.config.ts
```

**Output:**

```
Build failed: Config file not found: missing.config.ts
```

**Fix:** Ensure config file exists at specified path.

---

### Invalid Config Export

```typescript
// ❌ Wrong: named export
export const config = new Promptise({...});

// ✅ Correct: default export
export default new Promptise({...});
```

**Output:**

```
Build failed: Default export must be a Promptise instance.
Example: export default new Promptise({ ... })
```

---

### No Fixtures

```typescript
export default new Promptise({
  compositions: [
    { composition: myPrompt }, // No fixtures
  ],
});
```

**Output:**

```
✓ Generated 0 previews in .promptise/builds
⚠️  No previews generated. Check your fixtures configuration.
```

**Fix:** Add fixtures to your composition entry.

---

## FAQ

### **Q: Do I need the CLI in production?**

**A:** No, `@promptise/cli` is a dev tool. Install as dev dependency:

```bash
npm install -D @promptise/cli
```

Your production app only needs `@promptise/core`.

---

### **Q: Can I customize the output format?**

**A:** Not currently. The CLI generates plain text files with optional metadata headers.

For custom formats, use the API programmatically:

```typescript
import { Promptise } from './promptise.config';

const registry = new Promptise({...});
for (const entry of registry.getEntries()) {
  const prompt = entry.composition.build(fixtureData);
  // Custom formatting here
  const customFormat = {
    id: entry.composition.id,
    content: prompt.asString(),
    tokens: prompt.metadata.tokenCount,
  };
}
```

---

### **Q: Can I generate JSON or YAML output?**

**A:** CLI generates text files only. For structured output, write a custom script:

```typescript
import fs from 'fs';
import registry from './promptise.config';

const output = registry.getEntries().map((entry) => ({
  id: entry.composition.id,
  fixtures: Object.entries(entry.fixtures ?? {}).map(([name, data]) => ({
    name,
    prompt: entry.composition.build(data).asString(),
  })),
}));

fs.writeFileSync('prompts.json', JSON.stringify(output, null, 2));
```

---

### **Q: What if my composition has no cost tracking?**

**A:** The `Tokens` field in metadata will show `N/A`:

```
Tokens: N/A
```

To enable token counting, add cost config to your composition:

```typescript
const composition = createPromptComposition({
  id: 'my-prompt',
  components: [...],
  cost: {
    inputTokenPrice: 0.000005,
    outputTokenPrice: 0.000015,
    currency: 'USD',
  },
});
```

---

### **Q: Can I watch files and rebuild automatically?**

**A:** CLI doesn't have watch mode. Use `nodemon`:

```bash
npm install -D nodemon
```

```json
{
  "scripts": {
    "prompts:watch": "nodemon --watch src --watch promptise.config.ts --exec 'promptise build'"
  }
}
```

---

### **Q: How do I preview chat-formatted prompts?**

**A:** The CLI outputs `asString()` format. For `asMessages()` format, use a custom script:

```typescript
import registry from './promptise.config';

const entry = registry.getComposition('my-prompt');
const prompt = entry.composition.build(fixtureData);

console.log(JSON.stringify(prompt.asMessages(), null, 2));
// [
//   { "role": "system", "content": "..." },
//   { "role": "user", "content": "..." }
// ]
```

---

### **Q: Can I filter compositions by pattern or tag?**

**A:** Not directly. Build specific compositions by ID:

```bash
npx promptise build medical-diagnosis
npx promptise build legal-review
```

Or create separate config files:

```bash
npx promptise build --config medical.config.ts
npx promptise build --config legal.config.ts
```

---

### **Q: What's the performance for large registries?**

**A:** CLI is fast - generates hundreds of previews in seconds:

```
✓ Generated 250 previews in .promptise/builds (1.2s)
```

For very large registries (1000+ fixtures), consider:

- Building specific compositions: `promptise build specific-id`
- Parallel builds with shell scripts
- Separate configs per domain

---

### **Q: Can I use environment variables in config?**

**A:** Yes, the config file is TypeScript:

```typescript
import { Promptise } from '@promptise/core';

const fixtures =
  process.env.NODE_ENV === 'production'
    ? { prod: { restrictive: true } }
    : { dev: { permissive: true }, test: { mock: true } };

export default new Promptise({
  compositions: [{ composition: myPrompt, fixtures }],
});
```

---

### **Q: How do I handle secrets in fixtures?**

**A:** Never put real secrets in fixtures. Use placeholders:

```typescript
fixtures: {
  example: {
    apiKey: 'sk-test-xxxxxxxxxxxxx', // Fake key
    endpoint: 'https://api.example.com',
  },
}
```

For testing with real secrets, load from env:

```typescript
// test-script.ts (not in config)
import registry from './promptise.config';

const prompt = registry.getComposition('api-call')?.composition.build({
  apiKey: process.env.REAL_API_KEY, // Real secret
  endpoint: process.env.API_ENDPOINT,
});
```

---

### **Q: Can I run the CLI programmatically?**

**A:** Yes, import the build command:

```typescript
import { buildCommand } from '@promptise/cli';

await buildCommand('medical-diagnosis', {
  outdir: './custom-output',
  fixture: 'icu',
  metadata: true,
  verbose: false,
});
```

---

### **Q: What's the difference between build and validate?**

**A:** CLI only has `build` command. The registry validates composition IDs on instantiation:

```typescript
// This validates automatically
const registry = new Promptise({
  compositions: [...], // Throws if duplicate IDs
});
```

For schema validation, use Zod's built-in validation during `composition.build()`.
