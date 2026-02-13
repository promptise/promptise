# @promptise/core

Build reusable, validated prompt architectures for production LLM workflows.

Before you start:

- [Repository README](https://github.com/promptise/promptise/blob/main/README.md)
- [Learning Docs](https://github.com/promptise/promptise/tree/main/docs/learn)

## Installation

```bash
npm install @promptise/core
```

## Quick Usage

```ts
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

const prompt = createPromptComposition({
  id: 'assistant',
  components: [role, task],
}).build({ role: 'analyst', task: 'review this report' });

console.log(prompt.asString());
console.log(prompt.metadata.estimatedTokens);
```

## Features

- Prompt components
- Prompt compositions
- Composition patterns
- Prompt strategies
- Registry (`Promptise`)
- Metadata (`estimatedTokens`)

## License

Apache-2.0
