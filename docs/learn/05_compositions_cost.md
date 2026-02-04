# Cost Tracking

Promptise provides built-in cost tracking with type-safe configuration. Track input and output tokens automatically with structured cost breakdown per component.

## Quick Start

```typescript
import { createPromptComposition } from '@promptise/core';

const composition = createPromptComposition({
  id: 'my-prompt',
  components: [systemComponent, userComponent],
  cost: {
    // GPT-5 pricing (check provider docs for current rates)
    inputTokenPrice: 0.000005, // $5 / 1M tokens
    outputTokenPrice: 0.000015, // $15 / 1M tokens (includes reasoning/thinking tokens)
    currency: 'USD',
  },
});

// Build prompt - automatically calculates input token cost
const prompt = composition.build(data);

console.log(prompt.metadata.tokenCount); // Total tokens
console.log(prompt.metadata.cost.input.cost); // Input cost in USD
console.log(prompt.metadata.components); // Per-component breakdown

// After LLM response, update with output tokens
prompt.updateCost({ outputTokens: 150 });
console.log(prompt.metadata.cost.total); // Final total cost
```

---

## Pricing Configuration

### CostConfig Type

```typescript
interface CostConfig {
  inputTokenPrice: number; // Price per token (not per 1K or 1M)
  outputTokenPrice?: number; // Includes reasoning/thinking tokens
  currency?: 'USD';
}
```

**Important:** Thinking/reasoning tokens (e.g., GPT-o1, Gemini Thinking) are billed as output tokens by all providers.

### Getting Current Pricing

Refer to official provider documentation:

- **OpenAI:** https://openai.com/api/pricing/
- **Anthropic:** https://www.anthropic.com/pricing
- **Google:** https://ai.google.dev/pricing

### Example Configurations

```typescript
// Use inline objects directly in your composition config.
// Check provider docs for current rates:
// - OpenAI: https://openai.com/api/pricing/
// - Anthropic: https://www.anthropic.com/pricing
// - Google: https://ai.google.dev/pricing

// Example GPT-5 pricing:
cost: {
  inputTokenPrice: 0.000005, // $5 / 1M tokens
  outputTokenPrice: 0.000015, // $15 / 1M tokens
  currency: 'USD',
}

// Example Claude 3.5 Sonnet pricing:
cost: {
  inputTokenPrice: 0.000003, // $3 / 1M tokens
  outputTokenPrice: 0.000015, // $15 / 1M tokens
  currency: 'USD',
}

// Example Gemini 3 Flash pricing:
cost: {
  inputTokenPrice: 0.000000075, // $0.075 / 1M tokens
  outputTokenPrice: 0.0000003, // $0.30 / 1M tokens (includes thinking)
  currency: 'USD',
}

// Example GPT-o1 pricing (reasoning tokens billed as output):
cost: {
  inputTokenPrice: 0.000015, // $15 / 1M tokens
  outputTokenPrice: 0.00006, // $60 / 1M tokens (regular + reasoning)
  currency: 'USD',
}
```

---

## Cost Metadata Structure

The structured cost breakdown provides clear separation between input and output costs:

```typescript
// Structured cost breakdown at composition level
interface CostBreakdown {
  tokens: number;
  cost: number; // USD
}

interface CostMetadata {
  input: CostBreakdown; // Always present after build()
  output?: CostBreakdown; // After updateCost() - includes reasoning/thinking tokens
  total: number; // Sum of all costs (USD)
  currency: 'USD';
}

// Flat structure at component level (input only)
interface ComponentMetadata {
  key: string; // Component identifier
  tokens: number; // Input tokens in this component
  cost?: number; // Input cost in USD (if cost config provided)
}
```

**Key Points:**

- Composition-level: Structured breakdown (input/output)
- Component-level: Flat structure (only input tokens/cost)
- Output costs are NOT distributed to components (cannot be accurately attributed)
- Reasoning/thinking tokens are included in `output` field

---

## Usage Patterns

### Basic Cost Tracking

```typescript
const composition = createPromptComposition({
  id: 'chat-prompt',
  components: [systemComponent, userComponent],
  cost: {
    // GPT-5 pricing
    inputTokenPrice: 0.000005, // $5 / 1M tokens
    outputTokenPrice: 0.000015, // $15 / 1M tokens
    currency: 'USD',
  },
});

const prompt = composition.build({
  system: 'You are a helpful assistant.',
  user: 'Explain quantum computing.',
});

// Input cost calculated automatically
console.log(`Input tokens: ${prompt.metadata.cost.input.tokens}`);
console.log(`Input cost: $${prompt.metadata.cost.input.cost.toFixed(6)}`);
```

### Tracking Output Tokens

```typescript
// After receiving LLM response
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: prompt.asString() }],
});

// Update with actual output tokens from API
const outputTokens = response.usage?.completion_tokens ?? 0;
prompt.updateCost({ outputTokens });

console.log(`Output tokens: ${prompt.metadata.cost.output?.tokens}`);
console.log(`Output cost: $${prompt.metadata.cost.output?.cost.toFixed(6)}`);
console.log(`Total cost: $${prompt.metadata.cost.total.toFixed(6)}`);
```

### Tracking Reasoning/Thinking Tokens (o1, Gemini Thinking)

For models with thinking/reasoning capabilities, include those tokens in your output count:

```typescript
const O1_PREVIEW: CostConfig = {
  inputTokenPrice: 0.000015,
  outputTokenPrice: 0.00006, // Billed same for regular + reasoning
  currency: 'USD',
};

const composition = createPromptComposition({
  id: 'reasoning-prompt',
  components: [taskComponent],
  cost: O1_PREVIEW,
});

const prompt = composition.build(data);

// After o1 model response
const response = await openai.chat.completions.create({
  model: 'o1-preview',
  messages: [{ role: 'user', content: prompt.asString() }],
});

// o1 models return completion_tokens (already includes reasoning)
const outputTokens = response.usage?.completion_tokens ?? 0;

// Single update call - reasoning tokens already included in completion_tokens
prompt.updateCost({ outputTokens });

console.log(`Total output (regular + reasoning): ${outputTokens} tokens`);
console.log(`Total cost: $${prompt.metadata.cost.total.toFixed(6)}`);
```

**Note:** OpenAI and Google bill reasoning/thinking tokens at the same rate as output tokens. The API's `completion_tokens` already includes all output.

### Per-Component Cost Breakdown

```typescript
const prompt = composition.build(data);

// Analyze input cost distribution across components
prompt.metadata.components.forEach((component) => {
  console.log(`Component: ${component.key}`);
  console.log(`  Input tokens: ${component.tokens}`);
  console.log(`  Input cost: $${(component.cost ?? 0).toFixed(6)}`);
});

// Find most expensive component (by input cost)
const mostExpensive = prompt.metadata.components.reduce((max, current) =>
  (current.cost ?? 0) > (max.cost ?? 0) ? current : max,
);
console.log(`Most expensive: ${mostExpensive.key} ($${(mostExpensive.cost ?? 0).toFixed(6)})`);
```

---

## Custom Pricing

Create custom pricing configurations for any model:

```typescript
import type { CostConfig } from '@promptise/core';

// Example: Custom model pricing
const CUSTOM_MODEL: CostConfig = {
  inputTokenPrice: 0.000005, // $5 per 1M input tokens
  outputTokenPrice: 0.000015, // $15 per 1M output tokens (includes reasoning if applicable)
};

const composition = createPromptComposition({
  id: 'custom-prompt',
  components: [component],
  cost: CUSTOM_MODEL,
});
```

**Pricing Format:** All prices are per-token (not per 1K or 1M). Example: $10/1M = 0.00001 per token.

---

## Cost Tracking Without Composition

For simple use cases, use the `countTokens` utility:

```typescript
import { countTokens } from '@promptise/core';

const text = 'Hello, world!';
const tokens = countTokens(text);
const cost = tokens * 0.00001; // Manual calculation

console.log(`Tokens: ${tokens}, Cost: $${cost.toFixed(6)}`);
```

**Note:** This provides token counting only. For full cost tracking with automatic updates and component breakdown, use composition's `build()` method.

---

## Best Practices

### 1. Keep Pricing Up-to-Date

```typescript
// Check provider pricing periodically and update your configs
// Verify at openai.com/api/pricing, anthropic.com/pricing, etc.
const composition = createPromptComposition({
  id: 'my-prompt',
  components: [...],
  cost: {
    inputTokenPrice: 0.000005, // GPT-5: Verify current rates
    outputTokenPrice: 0.000015,
    currency: 'USD',
  },
});
```

### 2. Track Costs in Production

```typescript
const prompt = composition.build(data);
const initialCost = prompt.metadata.cost.input.cost;

// Call LLM
const response = await llm.generate(prompt.asString());

// Update costs
prompt.updateCost({ outputTokens: response.usage.completion_tokens });

// Log to monitoring system
logger.info('LLM Call', {
  promptId: composition.id,
  inputTokens: prompt.metadata.cost.input.tokens,
  outputTokens: prompt.metadata.cost.output?.tokens,
  totalCost: prompt.metadata.cost.total,
  components: prompt.metadata.components,
});
```

### 3. Optimize Expensive Components

```typescript
const prompt = composition.build(data);

// Identify expensive components (by input cost)
const expensiveComponents = prompt.metadata.components
  .filter((c) => (c.cost ?? 0) > 0.001) // $0.001 threshold
  .sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0));

if (expensiveComponents.length > 0) {
  console.warn('High-cost components detected:', expensiveComponents);
  // Consider refactoring or using compression strategies
}
```

### 4. Budget Enforcement

```typescript
const MAX_COST = 0.01; // $0.01 per request

const prompt = composition.build(data);

if (prompt.metadata.cost.input.cost > MAX_COST) {
  throw new Error(
    `Prompt exceeds budget: $${prompt.metadata.cost.input.cost.toFixed(4)} > $${MAX_COST}`,
  );
}

// Proceed with LLM call
```

---

## API Reference

### `CostConfig`

```typescript
interface CostConfig {
  inputTokenPrice: number; // Price per input token (required)
  outputTokenPrice?: number; // Price per output token (includes reasoning/thinking)
  currency?: 'USD';
}
```

**Note:** Reasoning/thinking tokens are billed as output tokens by all major providers.

### `updateCost()`

```typescript
prompt.updateCost(usage: {
  outputTokens: number; // Total output tokens (includes reasoning if applicable)
}): void
```

**Behavior:**

- Calculates output cost using configured `outputTokenPrice`
- Updates composition-level cost metadata
- Does NOT distribute to components (output cannot be accurately attributed)
- Recalculates total cost (input + output)

---

## Troubleshooting

### "Cannot update cost: no cost config provided"

Ensure you pass `cost` when creating the composition:

```typescript
const composition = createPromptComposition({
  id: 'my-prompt',
  components: [component],
  cost: {
    // Required for cost tracking
    inputTokenPrice: 0.000005,
    outputTokenPrice: 0.000015,
    currency: 'USD',
  },
});
```

### Inaccurate Cost Calculations

- Verify your per-token prices are correct (not per 1K or 1M)
- Check provider documentation for current pricing
- Ensure you're using `completion_tokens` from the API response (not `total_tokens`)
- Remember: Reasoning tokens are included in `completion_tokens`

### Missing Output Cost

Call `updateCost()` after receiving the LLM response:

```typescript
const response = await llm.generate(prompt.asString());
prompt.updateCost({ outputTokens: response.usage.completion_tokens });
```
