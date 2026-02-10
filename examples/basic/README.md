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

- `medical-diagnosis_basic.txt` - Full preview with all fields
- `medical-diagnosis_icu.txt` - ICU variant
- `code-review_security.txt` - Security focus
- `code-review_performance.txt` - Performance focus
- `simple-prompt_default.txt` - Shows placeholders (no fixtures)

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
npx promptise build medical-diagnosis --fixture icu
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

- `basic` - General practitioner scenario
- `icu` - Intensive care specialist scenario

### `codeReview`

Code review assistance with Markdown wrappers.

**Fixtures:**

- `security` - Security vulnerability review
- `performance` - Performance optimization review

### `simplePrompt`

Basic prompt without fixtures (demonstrates placeholder behavior).

## Output Examples

### Full fixture (medical-diagnosis_basic.txt)

```
---
Composition: medical-diagnosis
Fixture: basic
Status: full
Provided: role, context, task, rules
Missing: none
Tokens: 127
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

### Placeholder (simple-prompt_default.txt)

```
---
Composition: simple-prompt
Fixture: default
Status: placeholder
Provided: none
Missing: role, task
Tokens: 15
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

## Next Steps

- Check out the [Promptise documentation](../../docs/learn) for advanced features
- Try the [pattern example](../patterns) to learn about structural validation
- Explore [strategy example](../strategies) for multi-turn prompts (coming soon)
