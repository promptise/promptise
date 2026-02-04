# Token Optimization with TOON

Promptise integrates native support for [TOON (Token-Oriented Object Notation)](https://github.com/toon-format/toon), a compact serialization format designed specifically for Large Language Models that reduces token usage by **30-60%** compared to standard JSON.

---

## Why Optimize Tokens?

LLM tokens cost money and impact latency. Standard JSON is verbose:

```json
{
  "users": [
    { "id": 1, "name": "Alice", "role": "admin" },
    { "id": 2, "name": "Bob", "role": "user" }
  ]
}
```

**85 tokens** with typical overhead.

With TOON optimization:

```toon
users[2]{id,name,role}:
  1,Alice,admin
  2,Bob,user
```

**Only 15 tokens** - significant reduction!

---

## What is TOON?

TOON (Token-Oriented Object Notation) is an official serialization format optimized for LLM prompts:

- **Token-efficient**: 30-60% fewer tokens than JSON
- **LLM-friendly**: Explicit lengths and field declarations for validation
- **Tabular format**: Declares keys once, streams data as rows
- **Indentation-based**: Like YAML, but optimized for tokens

**Official library**: [`@toon-format/toon`](https://github.com/toon-format/toon)

---

## Quick Start

### 1. Enable Optimizer

Add `optimizer: { toon: true }` to your component config:

```typescript
import { createPromptComponent } from '@promptise/core';
import { z } from 'zod';

const component = createPromptComponent({
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
    toon: true, // ✅ Enable TOON optimization
  },
  template: ({ input, optimized }) => `
Analyze these users:
${optimized.users}
  `,
});
```

### 2. Render Component

```typescript
const result = component.render({
  users: [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' },
    { id: 3, name: 'Charlie', role: 'user' },
  ],
});

console.log(result);
// Analyze these users:
// users[3]{id,name,role}:
//   1,Alice,admin
//   2,Bob,user
//   3,Charlie,user
```

**Result**: Significantly fewer tokens compared to JSON!

---

## When to Use Optimization

### ✅ **Best Use Cases:**

| Data Type             | Optimization         | Example                           |
| --------------------- | -------------------- | --------------------------------- |
| **Arrays of objects** | ⭐⭐⭐⭐⭐ Excellent | User lists, analytics data, logs  |
| **Nested objects**    | ⭐⭐⭐⭐ Good        | Configuration, settings, metadata |
| **Large datasets**    | ⭐⭐⭐⭐⭐ Excellent | Tabular data with 10+ rows        |

### ❌ **Not Recommended:**

| Data Type                       | Optimization | Reason                                    |
| ------------------------------- | ------------ | ----------------------------------------- |
| Primitives (`string`, `number`) | None         | No structure to optimize                  |
| Empty arrays                    | None         | No data to compress                       |
| Arrays of primitives            | Minimal      | Simple values don't benefit               |
| Non-uniform objects             | Low          | Inconsistent structure reduces efficiency |

### Auto-Detection

Promptise automatically detects which data types benefit from TOON:

```typescript
const input = {
  title: 'Report', // Primitive - NOT optimized
  users: [
    // Array of objects - ✅ OPTIMIZED
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ],
  tags: ['admin', 'ops'], // Array of primitives - NOT optimized
  config: { theme: 'dark' }, // Nested object - ✅ OPTIMIZED
};

// Only `users` and `config` are TOON-encoded
```

---

## Configuration

### Simple Boolean Flag

Use `toon: true` for default configuration:

```typescript
optimizer: {
  toon: true, // Comma delimiter, 2-space indent
}
```

**Default settings:**

- Delimiter: `,` (comma)
- Indent: `2` spaces
- Length marker: disabled

---

## Template Usage

### Function Templates

Access both original and optimized data:

```typescript
template: ({ input, optimized, context }) => {
  // input: Original data (unchanged)
  // optimized: TOON-encoded strings
  // context: Context and metadata

  return `
Total users: ${input.users.length}
Data:
${optimized.users}
  `;
};
```

### String Templates

Use `{{optimized.key}}` syntax:

```typescript
template: `
Users:
{{optimized.users}}

Config:
{{optimized.config}}
`;
```

---

## Real-World Examples

### Example 1: Analytics Dashboard

```typescript
const analyticsComponent = createPromptComponent({
  key: 'analytics',
  schema: z.object({
    events: z.array(
      z.object({
        timestamp: z.string(),
        user_id: z.number(),
        event_type: z.string(),
        duration_ms: z.number(),
      }),
    ),
  }),
  optimizer: { toon: true },
  template: ({ input, optimized }) => `
Analyze these ${input.events.length} user events:
${optimized.events}

Provide insights on:
- Most common event types
- Average duration
- User behavior patterns
  `,
});

const result = analyticsComponent.render({
  events: [
    {
      timestamp: '2025-01-15T10:30:00Z',
      user_id: 1,
      event_type: 'click',
      duration_ms: 250,
    },
    {
      timestamp: '2025-01-15T10:31:00Z',
      user_id: 2,
      event_type: 'scroll',
      duration_ms: 1500,
    },
    {
      timestamp: '2025-01-15T10:32:00Z',
      user_id: 1,
      event_type: 'click',
      duration_ms: 180,
    },
    // ... 100+ more events
  ],
});

// Result: Significant token reduction on large datasets
```

### Example 2: Mixed Data Types

```typescript
const reportComponent = createPromptComponent({
  key: 'report',
  schema: z.object({
    title: z.string(), // Not optimized (primitive)
    timestamp: z.string(), // Not optimized (primitive)
    users: z.array(
      z.object({
        // ✅ Optimized (array of objects)
        id: z.number(),
        name: z.string(),
        status: z.string(),
      }),
    ),
    tags: z.array(z.string()), // Not optimized (array of primitives)
    metadata: z.object({
      // ✅ Optimized (nested object)
      version: z.string(),
      author: z.string(),
    }),
  }),
  optimizer: { toon: true },
  template: ({ input, optimized }) => `
# ${input.title}
Generated: ${input.timestamp}
Tags: ${input.tags.join(', ')}

## Users
${optimized.users}

## Metadata
${optimized.metadata}
  `,
});
```

---

## Best Practices

### 1. **Optimize Large Datasets First**

Focus optimization on components with substantial data:

```typescript
// ✅ Good - Large dataset (50+ items)
const logsComponent = createPromptComponent({
  // ... 100+ log entries
  optimizer: { toon: true },
});

// ⚠️ Unnecessary - Small dataset (2-3 items)
const settingsComponent = createPromptComponent({
  // ... 2-3 config values
  // optimizer not needed
});
```

### 2. **Use with Uniform Data**

TOON excels with consistent object structures:

```typescript
// ✅ Excellent - All objects have same fields
const uniformData = [
  { id: 1, name: 'Alice', role: 'admin' },
  { id: 2, name: 'Bob', role: 'user' },
  { id: 3, name: 'Charlie', role: 'user' },
];

// ❌ Poor - Non-uniform objects
const nonUniformData = [
  { id: 1, name: 'Alice', role: 'admin', level: 5 },
  { id: 2, name: 'Bob' }, // Missing fields
  { id: 3, status: 'active' }, // Different schema
];
```

### 3. **Access Original Data When Needed**

Keep both contexts available:

```typescript
template: ({ input, optimized }) => `
Processing ${input.users.length} users...

${optimized.users}

Summary: ${input.users.filter((u) => u.role === 'admin').length} admins detected.
`;
```

### 4. **Combine with Cost Tracking**

Monitor token savings:

```typescript
const component = createPromptComponent({
  key: 'users',
  schema: userSchema,
  optimizer: { toon: true },
  template: ({ optimized }) => `Users:\n${optimized.users}`,
});

const composition = createPromptComposition({
  id: 'analysis',
  components: [component],
  cost: {
    inputTokenPrice: 0.000005, // GPT-5: $5 / 1M input tokens
    outputTokenPrice: 0.000015, // GPT-5: $15 / 1M output tokens
    currency: 'USD',
  },
});

const result = composition.build({ users: [...] });
// result.metadata.cost.totalCost - includes optimized token count
```

### 5. **Test Before and After**

Measure actual impact:

```typescript
// Without optimizer
const beforeTokens = countTokens(JSON.stringify(data));

// With optimizer
const component = createPromptComponent({
  optimizer: { toon: true },
  // ...
});
const result = component.render(data);
const afterTokens = countTokens(result.content);

const reduction = ((beforeTokens - afterTokens) / beforeTokens) * 100;
console.log(`Token reduction: ${reduction.toFixed(1)}%`);
```

---

## TypeScript Support

### Type Definitions

```typescript
import type { OptimizerConfig, OptimizationMetadata } from '@promptise/core';

// Optimizer configuration
const config: OptimizerConfig = {
  toon: true,
};

// Optimization result metadata
interface ComponentMetadata {
  tokens: number;
  optimization?: OptimizationMetadata; // Present when optimizer used
}

// OptimizationMetadata structure
interface OptimizationMetadata {
  originalTokens: number;
  optimizedTokens: number;
  reduction: number; // percentage (0-100)
  keysOptimized: string[]; // which keys were TOON-encoded
}
```

### Template Function Types

```typescript
type TemplateFunction<T> = (params: {
  input: T; // Original data
  optimized: Record<string, string>; // TOON-encoded strings
  context?: Record<string, unknown>; // Optional context from composition
}) => string;
```

---

## API Reference

### `OptimizerConfig`

Configuration for token optimization.

```typescript
interface OptimizerConfig {
  toon?: boolean;
}
```

**Properties:**

- `toon` (optional): Enable TOON encoding. Default configuration used when `true`.

---

### `OptimizationMetadata`

Metadata about optimization results.

```typescript
interface OptimizationMetadata {
  originalTokens: number;
  optimizedTokens: number;
  reduction: number;
  keysOptimized: string[];
}
```

**Properties:**

- `originalTokens`: Token count before optimization
- `optimizedTokens`: Token count after optimization
- `reduction`: Percentage reduction (0-100)
- `keysOptimized`: Array of input keys that were TOON-encoded

---

### Component Configuration

```typescript
interface PromptComponentConfig<T> {
  key: string;
  schema?: ZodObject<T>;
  template: string | TemplateFunction<T>;
  optimizer?: OptimizerConfig; // ← Optimizer config
  description?: string;
}
```

---

### Template Context

Function templates receive optimization context:

```typescript
template: ({ input, optimized, context }) => {
  // input: T - Original validated input
  // optimized: Record<string, string> - TOON-encoded values
  // context?: Record<string, unknown>

  return '...';
};
```

---

## Performance

TOON reduces token usage by **30-60%** compared to standard JSON, particularly effective for arrays of objects and tabular data.

For detailed benchmarks and performance data, see the [official TOON repository](https://github.com/toon-format/toon).

---

## Troubleshooting

### Optimizer Not Reducing Tokens?

**Check your data structure:**

```typescript
// ❌ Won't optimize - primitives only
const data = { name: 'Alice', age: 30 };

// ✅ Will optimize - array of objects
const data = {
  users: [
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: 25 },
  ],
};
```

### Empty Optimized Object?

Check if data types support optimization:

```typescript
template: ({ optimized }) => {
  console.log(Object.keys(optimized)); // ['users'] - only optimized keys

  // Access with bracket notation
  const usersData = optimized['users'];
  return usersData ? `Data: ${usersData}` : 'No optimization applied';
};
```

### TypeScript Errors?

Use bracket notation for dynamic keys:

```typescript
// ❌ Error: Property comes from index signature
const data = optimized.users;

// ✅ Correct
const data = optimized['users'];
```

---

## Contributing

Found an issue or have suggestions? [Open an issue](https://github.com/promptise/promptise/issues) or submit a PR!

**TOON Format Partnership**: This feature is developed in collaboration with the [TOON Format team](https://github.com/toon-format/toon) to provide native, first-class token optimization for LLM prompts.
