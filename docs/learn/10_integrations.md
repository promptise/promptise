# Integrations

Promptise can be used with any provider that accepts string prompts or chat messages.

## OpenAI

```typescript
import OpenAI from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const instance = composition.build(data);

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: instance.asMessages(),
});
```

## Generic SDK Pattern

```typescript
const instance = composition.build(data);

await llmClient.generate({
  prompt: instance.asString(),
});
```

## Usage + Cost Calculation Pattern

```typescript
const instance = composition.build(data);
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: instance.asMessages(),
});

const inputTokens = response.usage?.prompt_tokens ?? instance.metadata.estimatedTokens;
const outputTokens = response.usage?.completion_tokens ?? 0;

const totalCost = inputTokens * inputTokenPrice + outputTokens * outputTokenPrice;
```
