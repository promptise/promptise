# Promptise Basic Example

This example demonstrates the core features of Promptise:

- Creating reusable components
- Composing components into complete prompts
- Using the Registry pattern with fixtures
- Generating preview files with the CLI

## Structure

```
basic/
├── src/
│   ├── components.ts      # Reusable prompt components
│   └── compositions.ts    # Complete prompts with fixtures
├── promptise.config.ts    # Registry configuration
└── .promptise/
    └── builds/            # Generated preview files
```

## Installation

From the monorepo root:

```bash
# Install all dependencies
npm install

# Build packages
npm run build
```

From this example directory:

```bash
# Install example dependencies
npm install
```

## Usage

### Generate all previews

```bash
npm run build
```

This generates preview files in `.promptise/builds/`:

- `medical-diagnosis_complete.txt` - Complete fixture with all required fields
- `code-review_partial.txt` - Partial fixture with placeholders for missing fields
- `simple-prompt_placeholder.txt` - Auto-generated placeholder preview (no fixtures)

### Generate with verbose logging

```bash
npm run build:verbose
```

### Generate clean files (no metadata)

```bash
npm run build:clean
```

### Generate specific composition

```bash
npx promptise build medical-diagnosis
```

### Generate specific fixture

```bash
npx promptise build medical-diagnosis --fixture complete
```

## Components

### `roleComponent`

Defines who the AI assistant is.

### `taskComponent`

Defines what the AI should do.

### `contextComponent`

Provides additional background information.

### `rulesComponent`

Defines constraints or guidelines.

## Compositions

### `medicalDiagnosis`

Medical diagnosis assistance with XML wrappers.

**Fixtures:**

- `complete` - General practitioner scenario with all required fields

### `codeReview`

Code review assistance with Markdown wrappers.

**Fixtures:**

- `partial` - Security review with intentionally missing required fields

### `simplePrompt`

Basic prompt without fixtures (demonstrates placeholder behavior).

## Output Examples

### Complete fixture (medical-diagnosis_complete.txt)

```
---
Composition ID: medical-diagnosis
Fixture: complete (complete - 4/4)
Schema Fields:
  ✓ role (required)
  ✓ context (required)
  ✓ task (required)
  ✓ rules (required)

Estimated Input Cost:
  Input Pricing: $5.00 / 1M tokens ($0.000005/token)
  Static: 35 tokens / $0.000175
  Dynamic: 33 tokens / $0.000165
  Total: 68 tokens / $0.000340
---

<role>
You are a general practitioner.
</role>
<context>
Context: Patient presenting with fever and headache
</context>
<task>
Task: Provide differential diagnosis
</task>
<rules>
Rules:
- Consider common conditions first
- Ask clarifying questions if needed
- Recommend when to seek emergency care
</rules>
```

### Placeholder (simple-prompt_placeholder.txt)

```
---
Composition ID: simple-prompt
Fixture: placeholder (empty - 0/2)
Schema Fields:
  ✗ role (required) → placeholder
  ✗ task (required) → placeholder
---

You are a {{role}}.
Task: {{task}}
```

## Learning Path

1. **Explore components** - See how reusable building blocks are defined in `src/components.ts`
2. **Study compositions** - Learn how components are combined in `src/compositions.ts`
3. **Understand fixtures** - See how example data is provided for preview generation
4. **Run the CLI** - Generate previews and inspect the output files
5. **Modify and experiment** - Try adding new components, compositions, or fixtures

## Resources

- Explore the [Promptise documentation](../../docs/learn) for guides and API usage.
- Try the [pattern example](../patterns) to learn structural validation.
