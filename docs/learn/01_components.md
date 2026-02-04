# Components

> **The atomic building blocks of Promptise.**

Components are reusable, type-safe prompt pieces that encapsulate a single semantic unit (role, task, rules, examples, etc.). Think of them like components in Angular or React, but for prompts.

---

## Basic Usage

```typescript
import { createPromptComponent } from '@promptise/core';
import { z } from 'zod';

const roleComponent = createPromptComponent({
  key: 'role', // Semantic identifier
  schema: z.object({
    // Zod schema for validation
    role: z.string(),
  }),
  template: 'You are a {{role}}.', // String template with interpolation
  description: 'Defines the AI assistant role', // Optional documentation
});

// Render the component (validation happens automatically)
const result = roleComponent.render({ role: 'helpful assistant' });
console.log(result.content); // "You are a helpful assistant."
```

**Key Properties:**

| Property      | Type                 | Required | Description                                                |
| ------------- | -------------------- | -------- | ---------------------------------------------------------- |
| `key`         | `string`             | ✅       | Semantic identifier for pattern validation                 |
| `schema`      | `ZodObject`          | ❌       | Zod schema for input validation (defaults to empty object) |
| `template`    | `string \| function` | ✅       | Template string with `{{var}}` or function                 |
| `description` | `string`             | ❌       | Human-readable description                                 |

---

## Component Types

### String Templates

Simple templates with `{{variable}}` interpolation:

```typescript
const taskComponent = createPromptComponent({
  key: 'task',
  schema: z.object({
    action: z.string(),
    target: z.string(),
  }),
  template: 'Your task is to {{action}} the {{target}}.',
});

const result = taskComponent.render({
  action: 'analyze',
  target: 'medical records',
});
// "Your task is to analyze the medical records."
```

**Best for:**

- Simple variable substitution
- Static text with minimal logic
- Quick prototyping

---

### Function Templates

Dynamic templates with custom logic:

```typescript
const listComponent = createPromptComponent({
  key: 'list',
  schema: z.object({
    items: z.array(z.string()),
    format: z.enum(['bullets', 'numbers']),
  }),
  template: ({ input }) => {
    const prefix = input.format === 'bullets' ? '•' : '';
    return input.items
      .map((item, i) => {
        const num = input.format === 'numbers' ? `${i + 1}. ` : prefix;
        return `${num} ${item}`;
      })
      .join('\n');
  },
});

const result = listComponent.render({
  items: ['First item', 'Second item', 'Third item'],
  format: 'numbers',
});
// "1. First item
//  2. Second item
//  3. Third item"
```

**Best for:**

- Conditional rendering
- Complex formatting
- Dynamic content generation
- Lists, tables, or structured data

---

### Static Components

Components without input schema for static content:

```typescript
const disclaimerComponent = createPromptComponent({
  key: 'disclaimer',
  template: '<disclaimer>This is AI-generated content. Verify all information.</disclaimer>',
  description: 'Static disclaimer',
});

// No input needed
const result = disclaimerComponent.render({});
```

**Best for:**

- Fixed instructions
- Disclaimers
- System messages
- Compliance text

---

## Advanced Features

### Context Propagation

Pass runtime context through the component without it being part of the schema:

```typescript
const greetingComponent = createPromptComponent({
  key: 'greeting',
  schema: z.object({
    name: z.string(),
  }),
  template: ({ input, context }) => {
    const timeOfDay = context?.timeOfDay || 'day';
    const emoji = context?.emoji || '👋';
    return `${emoji} Good ${timeOfDay}, ${input.name}!`;
  },
});

// Pass context when rendering
const result = greetingComponent.render({ name: 'Alice' }, { timeOfDay: 'morning', emoji: '☀️' });
// "☀️ Good morning, Alice!"
```

**Use cases:**

- Runtime configuration
- Environment variables
- User preferences
- Feature flags

---

### Token Counting

Components automatically count tokens. For cost tracking, use compositions with a `CostConfig`:

```typescript
import { createPromptComponent, createPromptComposition } from '@promptise/core';
import { z } from 'zod';

const component = createPromptComponent({
  key: 'summary',
  schema: z.object({ text: z.string() }),
  template: 'Summarize this text:\n{{text}}',
});

const composition = createPromptComposition({
  id: 'summary-prompt',
  components: [component],
  cost: {
    inputTokenPrice: 0.0000025, // $2.50 / 1M tokens
    outputTokenPrice: 0.00001, // $10 / 1M tokens
    currency: 'USD',
  },
});

const prompt = composition.build({ text: 'A very long document...' });

console.log(`Tokens: ${prompt.metadata.tokenCount}`);
console.log(`Input cost: $${prompt.metadata.cost.input.cost.toFixed(6)}`);
```

---

### Validation

Components validate input at render time using Zod:

```typescript
const strictComponent = createPromptComponent({
  key: 'analysis',
  schema: z.object({
    metric: z.enum(['accuracy', 'precision', 'recall']),
    threshold: z.number().min(0).max(1),
    dataset: z.string().min(1),
  }),
  template: 'Analyze {{dataset}} for {{metric}} above {{threshold}}',
});

try {
  const result = strictComponent.render({
    metric: 'accuracy',
    threshold: 1.5, // Invalid: > 1
    dataset: '', // Invalid: empty string
  });
} catch (error) {
  console.error(error.message);
  // [Promptise] Validation failed for component "analysis"
  //   Issue 1:
  //     Path: threshold
  //     Problem: Number must be less than or equal to 1
  //     Code: too_big
  //   Issue 2:
  //     Path: dataset
  //     Problem: String must contain at least 1 character(s)
  //     Code: too_small
}
```

**Validation features:**

- ✅ Runtime type checking
- ✅ Range validation
- ✅ Pattern matching (regex)
- ✅ Custom refinements
- ✅ Detailed error messages

---

## Best Practices

### 1. Use Semantic Keys

```typescript
// ❌ Bad: Generic keys
const comp1 = createPromptComponent({ key: 'part1' /* ... */ });
const comp2 = createPromptComponent({ key: 'part2' /* ... */ });

// ✅ Good: Semantic keys
const roleComp = createPromptComponent({ key: 'role' /* ... */ });
const taskComp = createPromptComponent({ key: 'task' /* ... */ });
```

**Why?** Semantic keys enable pattern validation and make compositions self-documenting.

---

### 2. Keep Components Small

```typescript
// ❌ Bad: Monolithic component
const giantComponent = createPromptComponent({
  key: 'everything',
  template: ({ input }) => `
    Role: ${input.role}
    Task: ${input.task}
    Rules: ${input.rules.join(', ')}
    Examples: ${input.examples.map((e) => `${e.input} -> ${e.output}`).join('\n')}
    Context: ${input.context}
  `,
});

// ✅ Good: Single responsibility
const roleComp = createPromptComponent({ key: 'role' /* ... */ });
const taskComp = createPromptComponent({ key: 'task' /* ... */ });
const rulesComp = createPromptComponent({ key: 'rules' /* ... */ });
const examplesComp = createPromptComponent({ key: 'examples' /* ... */ });
const contextComp = createPromptComponent({ key: 'context' /* ... */ });
```

**Why?** Smaller components are easier to test, reuse, and compose.

---

### 3. Type Everything

```typescript
// ❌ Bad: Optional schema allows any input
const looseComp = createPromptComponent({
  key: 'task',
  template: ({ input }: any) => `Task: ${input.whatever}`,
});

// ✅ Good: Strict schema
const strictComp = createPromptComponent({
  key: 'task',
  schema: z.object({
    action: z.string(),
    target: z.string(),
  }),
  template: ({ input }) => `Task: ${input.action} the ${input.target}`,
});
```

**Why?** Type safety catches errors at development time, not runtime.

---

### 4. Document with Descriptions

```typescript
const component = createPromptComponent({
  key: 'medical-role',
  description: 'Defines the AI assistant role for clinical data analysis. HIPAA compliant.',
  schema: z.object({
    specialty: z.enum(['cardiology', 'oncology', 'neurology']),
  }),
  template: 'You are a clinical AI assistant specializing in {{specialty}}.',
});
```

**Why?** Descriptions help other developers (and future you) understand component purpose.

---

## FAQ

### **Q: Can I use components without compositions?**

**A:** Yes, components are standalone:

```typescript
const component = createPromptComponent({
  /* ... */
});

// Direct rendering
const result = component.render(data);

// Use with any LLM
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: result.content }],
});
```

But compositions provide schema inference, validation, and advanced features.

---

### **Q: Can I reuse the same component in multiple compositions?**

**A:** Absolutely! That's the whole point:

```typescript
const roleComp = createPromptComponent({
  /* ... */
});

const composition1 = createPromptComposition({
  id: 'medical-analysis',
  components: [roleComp /* ... */],
});

const composition2 = createPromptComposition({
  id: 'clinical-summary',
  components: [roleComp /* ... */],
});
```

---

### **Q: How do I test components?**

**A:** Components are pure functions, easy to test:

```typescript
import { describe, it, expect } from '@jest/globals';

describe('roleComponent', () => {
  it('should render role correctly', () => {
    const result = roleComponent.render({ role: 'doctor' });
    expect(result.content).toBe('You are a doctor.');
  });

  it('should validate input schema', () => {
    expect(() => roleComponent.render({ role: 123 })).toThrow();
  });
});
```

**Note:** For token counting and cost tracking, use composition's `build()` method instead.

---

### **Q: How do I handle optional fields?**

**A:** Use Zod's `.optional()` or `.nullable()`:

```typescript
const component = createPromptComponent({
  key: 'context',
  schema: z.object({
    required: z.string(),
    optional: z.string().optional(),
    nullable: z.string().nullable(),
  }),
  template: ({ input }) => {
    const parts = [input.required];
    if (input.optional) parts.push(input.optional);
    if (input.nullable) parts.push(input.nullable);
    return parts.join('\n');
  },
});
```

---

### **Q: Can I use async functions in templates?**

**A:** No, templates are synchronous. For async operations:

1. Fetch data **before** calling `render()`
2. Pass fetched data as input

```typescript
// ❌ Bad: Async template
const component = createPromptComponent({
  key: 'data',
  template: async (input) => {
    const data = await fetchData(); // Not supported
    return `Data: ${data}`;
  },
});

// ✅ Good: Fetch before render
const data = await fetchData();
const result = component.render({ data });
```

---

### **Q: How do I handle arrays in string templates?**

**A:** Use function templates for complex formatting:

```typescript
// ❌ Won't work: String interpolation with arrays
const component = createPromptComponent({
  key: 'list',
  schema: z.object({ items: z.array(z.string()) }),
  template: 'Items: {{items}}', // Renders as "Items: item1,item2,item3"
});

// ✅ Use function template
const component = createPromptComponent({
  key: 'list',
  schema: z.object({ items: z.array(z.string()) }),
  template: ({ input }) => `Items:\n${input.items.map((item, i) => `${i + 1}. ${item}`).join('\n')}`,
});
```

---

### **Q: Can I use nested objects in schema?**

**A:** Yes, Zod supports nested schemas:

```typescript
const component = createPromptComponent({
  key: 'patient-info',
  schema: z.object({
    patient: z.object({
      name: z.string(),
      age: z.number(),
      conditions: z.array(z.string()),
    }),
  }),
  template: ({ input }) => {
    return `Patient: ${input.patient.name} (${input.patient.age} years old)
Conditions: ${input.patient.conditions.join(', ')}`;
  },
});
```
