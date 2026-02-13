# Introduction

Promptise is a TypeScript framework for building reusable, validated prompts.

It has two packages:

- `@promptise/core`: components, compositions, patterns, strategies, registry
- `@promptise/cli`: preview generation from registry fixtures

## Install

```bash
npm install @promptise/core
npm install -D @promptise/cli
```

## Quick Start

```typescript
import { createPromptComponent, createPromptComposition } from '@promptise/core';
import { z } from 'zod';

const role = createPromptComponent({
  key: 'role',
  schema: z.object({ role: z.string() }),
  template: 'You are a {{role}}.',
});

const task = createPromptComponent({
  key: 'task',
  schema: z.object({ task: z.string() }),
  template: 'Task: {{task}}',
});

const promptDef = createPromptComposition({
  id: 'assistant',
  components: [role, task],
});

const prompt = promptDef.build({ role: 'analyst', task: 'review this report' });

console.log(prompt.asString());
console.log(prompt.metadata.estimatedTokens);
```

## CLI Quick Start

```bash
npx promptise build
```

This generates `.txt` preview files from your registry fixtures.
