# Components Optimization

Promptise supports token optimization on component output.

## Enable Optimization

```typescript
import { createPromptComponent } from '@promptise/core';
import { z } from 'zod';

const usersComponent = createPromptComponent({
  key: 'users',
  schema: z.object({
    users: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        role: z.string(),
      }),
    ),
  }),
  optimizer: {
    toon: true,
  },
  template: ({ optimized }) => `Users:\n${optimized.users}`,
});
```

## Result

Optimization reduces token usage for dense structured data.

Use `metadata.estimatedTokens` on compositions to compare output sizes before and after optimization.
