# Strategies

A strategy orchestrates multiple compositions as ordered steps.

## Create a Strategy

```typescript
import { createPromptStrategy } from '@promptise/core';

const strategy = createPromptStrategy({
  id: 'analysis-flow',
  steps: [draftComposition, critiqueComposition, refineComposition],
});
```

## Runtime API

- `strategy.current(data, context?)`
- `strategy.next(data, context?)`
- `strategy.previous(data, context?)`
- `strategy.reset()`
- `strategy.progress`
- `strategy.getHistory()`

## Example

```typescript
const first = strategy.current(data);
const second = strategy.next(data);
const third = strategy.next(data);
```
