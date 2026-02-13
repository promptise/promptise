# Registry

`Promptise` is the central registry for compositions and fixtures.

## Create a Registry

```typescript
import { Promptise } from '@promptise/core';

export default new Promptise({
  defaultCost: {
    inputTokenPrice: 0.000005,
    outputTokenPrice: 0.000015,
    currency: 'USD',
  },
  compositions: [
    medicalDiagnosis,
    {
      composition: codeReview,
      fixtures: {
        complete: { role: 'reviewer', task: 'audit dependencies' },
        partial: { role: 'reviewer' },
      },
      cost: {
        inputTokenPrice: 0.000003,
        outputTokenPrice: 0.000015,
        currency: 'USD',
      },
    },
  ],
});
```

## Composition Entry

- `composition`: prompt definition
- `fixtures`: fixture map for CLI previews
- `cost`: entry pricing override for CLI estimation

## Pricing Resolution

1. `CompositionEntry.cost`
2. `PromptiseConfig.defaultCost`
3. `undefined`

## Runtime Methods

- `registry.getCompositions()`
- `registry.getComposition(id)`
