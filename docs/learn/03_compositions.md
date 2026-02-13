# Compositions

A composition combines multiple components into one prompt definition.

## Create a Composition

```typescript
import { createPromptComposition } from '@promptise/core';

const composition = createPromptComposition({
  id: 'medical-analysis',
  components: [roleComponent, contextComponent, taskComponent],
  componentWrapper: 'xml',
  messageRoles: {
    role: 'system',
    task: 'user',
  },
});
```

## Build a Prompt

```typescript
const prompt = composition.build({
  role: 'doctor',
  context: 'Patient with persistent fever',
  task: 'Provide differential diagnosis',
});
```

## Output APIs

- `prompt.asString()`
- `prompt.asMessages()`

## Build Options

```typescript
const prompt = composition.build(data, {
  context: { locale: 'en-US' },
});
```

## Metadata

```typescript
prompt.metadata.id;
prompt.metadata.estimatedTokens;
prompt.metadata.inputData;
prompt.metadata.components;
```
