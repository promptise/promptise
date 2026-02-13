# Components

A component is the smallest prompt unit.

## Create a Component

```typescript
import { createPromptComponent } from '@promptise/core';
import { z } from 'zod';

const roleComponent = createPromptComponent({
  key: 'role',
  schema: z.object({ role: z.string() }),
  template: 'You are a {{role}}.',
  description: 'Defines assistant role',
});
```

## Core Fields

- `key`: unique component key
- `schema`: Zod schema for input validation
- `template`: string template or function
- `description`: optional documentation
- `optimizer`: optional optimization config

## Template Forms

String template:

```typescript
template: 'Task: {{task}}'
```

Function template:

```typescript
template: ({ input, context }) => `Task: ${input.task} (${context?.env ?? 'default'})`
```

## Render

```typescript
const result = roleComponent.render({ role: 'security reviewer' });
console.log(result.content);
```

Use `render()` for component-level validation and output.
