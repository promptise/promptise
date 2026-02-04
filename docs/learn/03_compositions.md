# Compositions

> **Orchestrate multiple components into complete, type-safe prompts.**

Compositions combine multiple components into a cohesive prompt with automatic schema inference, validation, and multiple output formats. Think of them as the container that brings your components together.

---

## Basic Usage

```typescript
import { createPromptComponent, createPromptComposition } from '@promptise/core';
import { z } from 'zod';

// 1. Create components
const roleComponent = createPromptComponent({
  key: 'role',
  schema: z.object({ role: z.string() }),
  template: 'You are a {{role}}.',
});

const taskComponent = createPromptComponent({
  key: 'task',
  schema: z.object({ action: z.string(), target: z.string() }),
  template: 'Your task: {{action}} the {{target}}',
});

// 2. Compose them
const composition = createPromptComposition({
  id: 'assistant-prompt',
  components: [roleComponent, taskComponent],
});

// 3. Build with inferred schema
const prompt = composition.build({
  role: 'helpful assistant',
  action: 'analyze',
  target: 'this data',
});

// 4. Use the output
console.log(prompt.asString());
// You are a helpful assistant.
//
// Your task: analyze the this data
```

**Key Properties:**

| Property           | Type                   | Required | Description                           |
| ------------------ | ---------------------- | -------- | ------------------------------------- |
| `id`               | `string`               | ✅       | Unique identifier                     |
| `components`       | `PromptComponent[]`    | ✅       | Array of components                   |
| `pattern`          | `CompositionPattern`   | ❌       | Enforce structural validation         |
| `componentWrapper` | `WrapperStyle`         | ❌       | Wrap components (XML, Markdown, etc.) |
| `messageRoles`     | `Record<string, Role>` | ❌       | Map components to chat roles          |
| `augmentSchema`    | `function`             | ❌       | Extend inferred schema                |
| `cost`             | `CostConfig`           | ❌       | Enable cost tracking (pricing preset) |

---

## Core Features

### Automatic Schema Inference

Promptise automatically infers the input schema from your components:

```typescript
const roleComp = createPromptComponent({
  key: 'role',
  schema: z.object({ role: z.string() }),
  template: '{{role}}',
});

const taskComp = createPromptComponent({
  key: 'task',
  schema: z.object({ action: z.string(), target: z.string() }),
  template: '{{action}} the {{target}}',
});

const composition = createPromptComposition({
  id: 'my-prompt',
  components: [roleComp, taskComp],
});

// Inferred schema combines both:
// {
//   role: string,
//   action: string,
//   target: string
// }

const prompt = composition.build({
  role: 'Data Analyst',
  action: 'Analyze',
  target: 'sales data',
});
```

**Type safety:**

```typescript
// ✅ TypeScript knows the required fields
composition.build({
  role: 'Analyst',
  action: 'Review',
  target: 'metrics',
});

// ❌ TypeScript error: missing 'target'
composition.build({
  role: 'Analyst',
  action: 'Review',
});
```

---

### Schema Augmentation

Extend the inferred schema with composition-level fields:

```typescript
const composition = createPromptComposition({
  id: 'medical-prompt',
  components: [roleComp, taskComp],
  augmentSchema: (inferredSchema) => {
    return inferredSchema.extend({
      patientId: z.string().uuid(),
      priority: z.enum(['low', 'medium', 'high']),
      metadata: z
        .object({
          timestamp: z.date(),
          clinician: z.string(),
        })
        .optional(),
    });
  },
});

// Now you can pass composition-level data
const prompt = composition.build({
  role: 'Clinical Assistant',
  task: 'Analyze lab results',
  patientId: '550e8400-e29b-41d4-a716-446655440000',
  priority: 'high',
  metadata: {
    timestamp: new Date(),
    clinician: 'Dr. Smith',
  },
});
```

**Use cases:**

- Add metadata fields
- Resolve component field name collisions
- Add composition-level configuration

---

### Component Wrappers

Wrap components with structural markers for better LLM parsing:

#### **XML Wrapper**

```typescript
const composition = createPromptComposition({
  id: 'structured-prompt',
  components: [roleComp, taskComp, contextComp],
  componentWrapper: 'xml',
});

const prompt = composition.build(data);
console.log(prompt.asString());
```

**Output:**

```xml
<role>
You are a helpful assistant.
</role>

<task>
Analyze this data
</task>

<context>
Medical records from Q1 2024
</context>
```

**Best for:** Claude, GPT-4, models that prefer XML structure

---

#### **Markdown Wrapper**

```typescript
const composition = createPromptComposition({
  id: 'readable-prompt',
  components: [roleComp, taskComp],
  componentWrapper: 'markdown',
});
```

**Output:**

```markdown
## Role

You are a helpful assistant.

## Task

Analyze this data
```

**Best for:** Human-readable prompts, documentation, debugging

---

#### **Brackets Wrapper**

```typescript
const composition = createPromptComposition({
  id: 'bracket-prompt',
  components: [roleComp, taskComp],
  componentWrapper: 'brackets',
});
```

**Output:**

```
[ROLE]
You are a helpful assistant.
[/ROLE]

[TASK]
Analyze this data
[/TASK]
```

---

#### **Custom Wrapper**

```typescript
const composition = createPromptComposition({
  id: 'custom-prompt',
  components: [roleComp, taskComp],
  componentWrapper: {
    before: (key) => `=== ${key.toUpperCase()} ===\n`,
    after: () => '\n---\n',
  },
});
```

**Output:**

```
=== ROLE ===
You are a helpful assistant.
---

=== TASK ===
Analyze this data
---
```

---

### Message Mapping

Map components to chat message roles for multi-message output:

```typescript
const systemComp = createPromptComponent({
  key: 'system',
  schema: z.object({ role: z.string() }),
  template: 'You are a {{role}}.',
});

const userComp = createPromptComponent({
  key: 'user',
  schema: z.object({ question: z.string() }),
  template: '{{question}}',
});

const assistantComp = createPromptComponent({
  key: 'assistant',
  schema: z.object({ example: z.string() }),
  template: '{{example}}',
});

const composition = createPromptComposition({
  id: 'chat-prompt',
  components: [systemComp, userComp, assistantComp],
  messageRoles: {
    system: 'system',
    user: 'user',
    assistant: 'assistant',
  },
});

const prompt = composition.build({
  role: 'helpful assistant',
  question: 'What is 2+2?',
  example: '2+2 equals 4',
});

// Get multi-message array
const messages = prompt.asMessages();
console.log(messages);
// [
//   { role: 'system', content: 'You are a helpful assistant.' },
//   { role: 'user', content: 'What is 2+2?' },
//   { role: 'assistant', content: '2+2 equals 4' }
// ]

// Use with any chat API
await openai.chat.completions.create({
  model: 'gpt-4',
  messages: messages,
});
```

**Perfect for:**

- Few-shot prompting
- Chat-based models
- Multi-turn conversations
- Example-based learning

**Note:** Components are joined with double newlines (`"\n\n"`). This separator is hardcoded for consistency.

---

## Output Formats

### `asString()`

Get the full prompt as a single string:

```typescript
const prompt = composition.build(data);
const text = prompt.asString();

// Use with OpenAI chat completions
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: text }],
  }),
});
```

---

### `asMessages()`

Get the prompt as a message array for chat models:

```typescript
const prompt = composition.build(data);
const messages = prompt.asMessages();

// With message mapping: array of role-based messages
// Without mapping: single user message

await openai.chat.completions.create({
  model: 'gpt-4',
  messages: messages,
});
```

---

### Metadata Access

Access build metadata:

```typescript
const prompt = composition.build(data);

console.log(prompt.metadata);
// {
//   id: 'assistant-prompt',
//   tokenCount: 42,
//   inputData: { role: '...', task: '...' },
//   timestamp: Date,
// }
```

---

## Advanced Patterns

### Cost Tracking

```typescript
const composition = createPromptComposition({
  id: 'cost-aware',
  components: [roleComp, taskComp, contextComp],
  cost: {
    inputTokenPrice: 0.0000025, // $2.50 / 1M tokens
    outputTokenPrice: 0.00001, // $10 / 1M tokens
    currency: 'USD',
  },
});

const prompt = composition.build(data);

// Input cost calculated automatically
console.log(`Tokens: ${prompt.metadata.tokenCount}`);
console.log(`Input cost: $${prompt.metadata.cost.input.cost.toFixed(6)}`);
console.log(`Component breakdown:`, prompt.metadata.components);

// After LLM response, update with output tokens
prompt.updateCost({ outputTokens: 150 });
console.log(`Total cost: $${prompt.metadata.cost.total.toFixed(6)}`);
```

---

### Context Propagation

Pass runtime context to all components:

```typescript
const timeAwareComp = createPromptComponent({
  key: 'greeting',
  schema: z.object({ name: z.string() }),
  template: ({ input, context }) => {
    const time = context?.timeOfDay || 'day';
    return `Good ${time}, ${input.name}!`;
  },
});

const composition = createPromptComposition({
  id: 'contextual',
  components: [timeAwareComp, taskComp],
});

// Pass context to all components
const prompt = composition.build(
  { name: 'Alice', task: 'Review data' },
  { context: { timeOfDay: 'morning', env: 'production' } },
);
```

---

### Pattern Validation

Enforce structural patterns with validation:

```typescript
import { RACE_PATTERN } from '@promptise/core';

const composition = createPromptComposition({
  id: 'validated-prompt',
  components: [roleComp, actionComp, contextComp, examplesComp],
  pattern: RACE_PATTERN, // Enforces: Role → Action → Context → Examples
});

// Throws if components don't match pattern order
const prompt = composition.build(data);
```

[See full Pattern documentation →](./04_compositions_patterns.md)

---

## Best Practices

### 1. Use Semantic Component Order

```typescript
// ✅ Good: Logical flow
const composition = createPromptComposition({
  id: 'medical-analysis',
  components: [
    roleComp, // Who you are
    rulesComp, // What to follow
    contextComp, // Background info
    examplesComp, // How to do it
    taskComp, // What to do
  ],
});

// ❌ Bad: Random order
const composition = createPromptComposition({
  id: 'messy',
  components: [taskComp, roleComp, examplesComp, rulesComp, contextComp],
});
```

---

### 2. Choose the Right Wrapper

```typescript
// For Claude/GPT-4: XML
componentWrapper: 'xml';

// For human readability: Markdown
componentWrapper: 'markdown';

// For debugging: None
componentWrapper: 'none';
```

---

### 3. Use Message Mapping for Chat Models

```typescript
// ✅ Good: Proper message structure
const composition = createPromptComposition({
  id: 'chat',
  components: [systemComp, userComp],
  messageRoles: {
    system: 'system',
    user: 'user',
  },
});

const messages = composition.build(data).asMessages();
// [
//   { role: 'system', content: '...' },
//   { role: 'user', content: '...' }
// ]
```

---

## FAQ

### **Q: What happens if component schemas have overlapping fields?**

**A:** The composition merges schemas. If there's a conflict, the **last** component's schema wins:

```typescript
const comp1 = createPromptComponent({
  key: 'part1',
  schema: z.object({ name: z.string() }),
  template: '{{name}}',
});

const comp2 = createPromptComponent({
  key: 'part2',
  schema: z.object({ name: z.number() }), // Different type!
  template: '{{name}}',
});

const composition = createPromptComposition({
  id: 'conflict',
  components: [comp1, comp2],
});

// Schema will expect: { name: number }
// comp2 wins because it's last
```

**Solution:** Use `augmentSchema` to resolve conflicts:

```typescript
const composition = createPromptComposition({
  id: 'resolved',
  components: [comp1, comp2],
  augmentSchema: (schema) =>
    schema.extend({
      name1: z.string(),
      name2: z.number(),
    }),
});
```

---

### **Q: Can I use async operations in compositions?**

**A:** No, compositions are synchronous. Fetch data **before** calling `build()`:

```typescript
// ❌ Bad: Async in template
const comp = createPromptComponent({
  key: 'data',
  template: async (input) => {
    const data = await fetchData(); // Not supported
    return `Data: ${data}`;
  },
});

// ✅ Good: Fetch before build
const data = await fetchData();
const prompt = composition.build({ data });
```

---

### **Q: How do I debug what's being sent to the LLM?**

**A:** Use `asString()` to inspect the final prompt:

```typescript
const prompt = composition.build(data);

// Debug: See exact prompt
console.log('=== PROMPT ===');
console.log(prompt.asString());
console.log('=== END ===');

// Debug: See metadata
console.log(prompt.metadata);

// Then send to LLM
const response = await llm.invoke(prompt.asString());
```

---

### **Q: Can I nest compositions?**

**A:** Not directly, but you can render a composition and pass it as input to another component:

```typescript
const innerComposition = createPromptComposition({
  id: 'inner',
  components: [comp1, comp2],
});

const outerComponent = createPromptComponent({
  key: 'wrapper',
  schema: z.object({ innerPrompt: z.string() }),
  template: 'Context:\n{{innerPrompt}}\n\nNow do this: ...',
});

// Build inner first
const innerPrompt = innerComposition.build(data).asString();

// Use as input to outer
const outerResult = outerComponent.render({ innerPrompt });
console.log(outerResult.content);
```

---

### **Q: What's the separator between components?**

**A:** Components are joined with double newlines (`"\n\n"`). This is hardcoded for consistency.

**Output example:**

```
You are a helpful assistant.

Your task: Analyze this data
```

---

### **Q: Can I conditionally include components?**

**A:** Build the component array dynamically:

```typescript
const components = [roleComp, taskComp];

if (includeExamples) {
  components.push(examplesComp);
}

if (includeContext) {
  components.push(contextComp);
}

const composition = createPromptComposition({
  id: 'dynamic',
  components: components,
});
```

---

### **Q: How do I use compositions with streaming responses?**

**A:** Compositions generate the **prompt**, streaming is handled by your LLM client:

```typescript
const prompt = composition.build(data);

// Use with streaming
const stream = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: prompt.asMessages(),
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```
