# Strategies Patterns

Strategy patterns validate step structure for multi-step workflows.

## Use a Prebuilt Pattern

```typescript
import { createPromptStrategy, DRAFT_CRITIQUE_REFINE_PATTERN } from '@promptise/core';

const strategy = createPromptStrategy({
  id: 'writing-flow',
  steps: [draftComposition, critiqueComposition, refineComposition],
  pattern: DRAFT_CRITIQUE_REFINE_PATTERN,
});
```

## Custom Pattern

```typescript
import { createStrategyPattern } from '@promptise/core';

const custom = createStrategyPattern({
  id: 'custom-flow',
  steps: ['analyze', 'plan', 'execute'],
});
```

Use patterns to keep strategy definitions consistent and predictable.
