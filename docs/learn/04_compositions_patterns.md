# Compositions Patterns

Composition patterns enforce structure and validation rules across components.

## Use a Prebuilt Pattern

```typescript
import { createPromptComposition, RACE_PATTERN } from '@promptise/core';

const composition = createPromptComposition({
  id: 'race-example',
  components: [roleComponent, actionComponent, contextComponent, expectationComponent],
  pattern: RACE_PATTERN,
});
```

## Create a Custom Pattern

```typescript
import { createCompositionPattern } from '@promptise/core';

const customPattern = createCompositionPattern({
  id: 'custom-structure',
  components: [
    { key: 'role' },
    { key: 'task' },
    { key: 'rules', optional: true },
  ],
  maxTokens: 4096,
});
```

Apply it with `pattern` in `createPromptComposition`.
