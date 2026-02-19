# ✨ Promptise

[![npm version](https://img.shields.io/npm/v/@promptise/core.svg)](https://www.npmjs.com/package/@promptise/core)
[![CI](https://github.com/promptise/promptise/actions/workflows/ci.yml/badge.svg)](https://github.com/promptise/promptise/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](https://github.com/promptise/promptise/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

> **The component-based prompt engineering framework.**
> Build type-safe, reusable LLM prompts like you build UIs.

Promptise brings **component-based architecture** from UI frameworks (Angular, React, etc.) to prompt engineering. Compose complex prompts from small, reusable building blocks with full TypeScript type safety. Open-source, framework-agnostic, and production-ready.

---

## 🎯 Why Promptise?

### **Component-Based Architecture**

Build prompts like you build UIs—from small, reusable, testable components. Inspired by component-based frameworks (Angular, React, Vue), Promptise brings the same engineering rigor to prompt design.

### **Type-Safe by Design**

Powered by Zod and TypeScript. Catch errors at compile-time, not runtime. Get intelligent IDE autocomplete for your entire prompt structure.

### **Framework Agnostic**

Works with OpenAI, Anthropic, Mastra AI, LangChain, or any LLM provider. Your prompts, your choice.

### **Production Ready**

Built-in content validation, estimated token metadata, multi-turn strategies, and compliance checks. Trusted for regulated industries like healthcare and finance.

---

## 📦 Packages

Promptise is a monorepo with two packages:

### **[@promptise/core](https://www.npmjs.com/package/@promptise/core)**

The main framework for building type-safe, reusable prompts.

```bash
npm install @promptise/core
```

**Use in production:** Components, Compositions, Patterns, Strategies, Registry.

### **[@promptise/cli](https://www.npmjs.com/package/@promptise/cli)**

CLI for generating preview files from your prompts.

```bash
npm install -D @promptise/cli
```

**Developer tool for:** Preview generation, fixture testing, documentation.

---

## 🚀 Quick Start

```typescript
import { createPromptComponent, createPromptComposition } from '@promptise/core';
import { z } from 'zod';

// 1. Define reusable components
const roleComponent = createPromptComponent({
  key: 'role',
  schema: z.object({ role: z.string() }),
  template: 'You are a {{role}}.',
});

const taskComponent = createPromptComponent({
  key: 'task',
  schema: z.object({ task: z.string() }),
  template: 'Your task: {{task}}',
});

// 2. Compose them together
const myPrompt = createPromptComposition({
  id: 'assistant-prompt',
  components: [roleComponent, taskComponent], // Reusable building blocks
});

// 3. Build with type-safe inputs
const prompt = myPrompt.build({
  role: 'helpful assistant',
  task: 'Analyze this dataset',
});

console.log(prompt.asString());
// Output:
// You are a helpful assistant.
// Your task: Analyze this dataset
```

```typescript
// Use with any LLM
const messages = prompt.asMessages(); // For chat models
await openai.chat.completions.create({ model: 'gpt-4', messages });
```

How it works: The composition automatically merges schemas from all components. Each field in your input object is validated against its component's schema and passed to the corresponding template.

---

## 🧩 Core Primitives

### 1. Components

**The atomic building blocks of your prompts.**

```typescript
const component = createPromptComponent({
  key: 'greeting', // Semantic identifier
  schema: z.object({
    // Type-safe input validation
    name: z.string(),
    time: z.enum(['morning', 'evening']),
  }),
  template: ({ input }) => {
    // String or function template
    return `Good ${input.time}, ${input.name}!`;
  },
  description: 'Personalized greeting', // Optional documentation
});

// Validate and render
const result = component.render({ name: 'Alice', time: 'morning' });
console.log(result.content); // "Good morning, Alice!"
```

**Features:**

- ✅ String templates with `{{variable}}` interpolation
- ✅ Function templates for dynamic logic
- ✅ Static components (no input schema)
- ✅ Intrinsic content validation (opt-in)
- ✅ Native estimated token metadata
- ✅ Zod validation with detailed errors

Note: Function templates receive a context object with `input` (your validated data), `context` (optional runtime context), and `optimized` (when optimizer is enabled).

---

### 2. Compositions

**Orchestrate multiple components into complete prompts with rich estimated token metadata.**

```typescript
const composition = createPromptComposition({
  id: 'medical-analysis',
  components: [roleComponent, rulesComponent, taskComponent],
  pattern: RACE_PATTERN, // Optional: enforce structure
  componentWrapper: 'xml', // Optional: wrap with <tags>
  messageRoles: {
    // Optional: multi-message chat
    role: 'system',
    task: 'user',
  },
});

const prompt = composition.build(data);

console.log(prompt.asString());
// Output with XML wrapper:
// <role>
// You are a helpful assistant.
// </role>
// <rules>
// Follow medical guidelines
// </rules>
// <task>
// Analyze this patient data
// </task>

// Automatic estimated token metadata
console.log(prompt.metadata.estimatedTokens); // Total estimated input tokens
console.log(prompt.metadata.components); // Per-component breakdown

// Optional external estimation
const inputCostEstimate = prompt.metadata.estimatedTokens * 0.000005;
console.log(`Estimated input cost: $${inputCostEstimate.toFixed(6)}`);

// messageRoles maps component keys to chat message roles
const messages = prompt.asMessages();
// [
//   { role: 'system', content: '<role>\nYou are a helpful assistant.\n</role>' },
//   { role: 'user', content: '<task>\nAnalyze this patient data\n</task>' }
// ]
// Note: unmapped component keys are omitted from asMessages().
```

**Features:**

- ✅ Schema inference from components
- ✅ Schema augmentation (extend inferred types)
- ✅ Context propagation
- ✅ Multiple output formats (string, messages)
- ✅ Component wrappers (XML, Markdown, Brackets)
- ✅ Built-in estimated token metadata
- ✅ Token optimization with TOON (30-60% reduction)

---

### 3. Patterns

**Enforce prompt engineering best practices with validation.**

```typescript
import { createCompositionPattern, RACE_PATTERN } from '@promptise/core';

// Use prebuilt patterns
const composition = createPromptComposition({
  id: 'my-prompt',
  components: [roleComp, actionComp, contextComp, examplesComp],
  pattern: RACE_PATTERN, // Enforces: Role → Action → Context → Examples
});

// Or create custom patterns with validation
const medicalPattern = createCompositionPattern({
  id: 'medical-analysis',
  description: 'HIPAA-compliant clinical analysis',
  maxTokens: 8192, // GPT-4 8K context window limit
  components: [
    {
      key: 'role',
      validation: {
        required: ['clinical', 'synthesizer'], // Must contain keywords
        maxTokens: 100, // Per-component token limit
      },
    },
    {
      key: 'rules',
      validation: {
        required: ['HIPAA', 'PHI'], // Compliance keywords
        forbidden: ['diagnose', 'prescribe'], // Liability prevention
        optional: ['FDA', 'HL7'], // Best practices (warnings)
      },
    },
  ],
});
```

**Prebuilt Composition Patterns:**

- `RACE_PATTERN` - Role, Action, Context, Examples
- `COSTAR_PATTERN` - Context, Objective, Style, Tone, Audience, Response
- `CHAIN_OF_THOUGHT_PATTERN` - Task, Reasoning, Constraints
- `FEW_SHOT_PATTERN` - Instruction, Examples, Task
- `COMPOSITION_REACT_PATTERN` - Thought, Action, Observation (ReAct agent pattern)

**Validation Features:**

- ✅ Component-level validation (intrinsic, always active)
- ✅ Pattern-level validation (per-component + global)
- ✅ Required/optional/forbidden keywords
- ✅ Token limits (per-component and global)
- ✅ Custom validators with detailed errors
- ✅ Cascade validation (Component → Pattern, AND logic)
- ✅ Case-insensitive matching

---

### 4. Strategies

**Multi-turn prompt chaining with state management.**

```typescript
import { createPromptStrategy } from '@promptise/core';

// Create a strategy for iterative workflows
const strategy = createPromptStrategy({
  id: 'draft-critique-refine',
  description: 'Iterative content refinement',
  steps: [draftComposition, critiqueComposition, refineComposition],
});

// Execute sequentially with state tracking
const draft = strategy.current({ topic: 'AI Ethics' });
const draftResponse = await llm.invoke(draft.asString());

const critique = strategy.next({ draft: draftResponse });
const critiqueResponse = await llm.invoke(critique.asString());

const final = strategy.next({
  draft: draftResponse,
  critique: critiqueResponse,
});

// Track progress
console.log(strategy.progress);
// { current: 2, total: 3, percentage: 66.66 }

console.log(strategy.getHistory());
// Full execution trace with timestamps
```

**Features:**

- ✅ Stateful navigation (prevents step skipping)
- ✅ Execution history with timestamps
- ✅ Progress monitoring
- ✅ Reset and restart capabilities
- ✅ Perfect for ReAct, Chain-of-Density, Draft-Critique-Refine

---

### 5. Registry

**Centralize and organize all your prompts in one place.**

```typescript
import { Promptise } from '@promptise/core';

// Simple format - pass compositions directly
export default new Promptise({
  compositions: [medicalDiagnosis, codeReview, legalReview],
});

// Or with fixtures for CLI preview generation
export default new Promptise({
  defaultCost: {
    inputTokenPrice: 0.000005,
    outputTokenPrice: 0.000015,
    currency: 'USD',
  },
  compositions: [
    {
      composition: medicalDiagnosis,
      fixtures: {
        // Test data for CLI preview generation
        complete: { role: 'doctor', task: 'diagnose symptoms' },
      },
    },
    {
      composition: codeReview,
      fixtures: {
        partial: { role: 'senior reviewer' },
      },
    },
    simplePrompt, // Mix formats as needed
  ],
});

// Access in your code (production)
const allCompositions = registry.getCompositions();
const specific = registry.getComposition('medical-diagnosis');

// CLI uses same registry for preview generation
// npx promptise build
```

**Features:**

- ✅ Central catalog for all compositions
- ✅ Runtime access to compositions by ID
- ✅ Fixture data for CLI tooling
- ✅ Single source of truth for your prompt library

**Note:** The registry serves both production (composition access) and CLI tooling (preview generation). Fixtures are only used by the CLI, not in production code.

---

### 6. Token Optimization

**Reduce LLM costs by 30-60% with native TOON integration.**

```typescript
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
  template: ({ optimized }) => `
Analyze these users:
${optimized.users}
  `,
});

// TOON format is significantly more token-efficient than JSON
```

**TOON Output:**

```
[3]{id,name,role}:
  1,Alice,admin
  2,Bob,user
  3,Charlie,user
```

**Features:**

- ✅ 30-60% token reduction for arrays of objects
- ✅ Automatic detection of optimizable data
- ✅ Partnership with [TOON Format](https://github.com/toon-format/toon)
- ✅ Native integration with token efficiency analysis

---

## 🔌 Framework Integrations

### Mastra AI

```typescript
import { Agent } from '@mastra/core/agent';
import { vertex } from '@ai-sdk/google-vertex';

const agent = new Agent({
  name: 'medical-assistant',
  model: () => vertex('gemini-2.0-flash'),
  instructions: myPrompt.build(data).asString(),
});
```

### LangChain

```typescript
import { ChatOpenAI } from '@langchain/openai';

const llm = new ChatOpenAI();
const result = await llm.invoke(myPrompt.build(data).asMessages());
```

### OpenAI

```typescript
import OpenAI from 'openai';

const openai = new OpenAI();
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: myPrompt.build(data).asMessages(),
});
```

---

## 🛠️ CLI Development Tools

### Preview Generation

Generate text previews of your prompts for testing and documentation:

```bash
# Install CLI (dev dependency)
npm install -D @promptise/cli
```

**Create config file** (`promptise.config.ts`):

```typescript
import { Promptise } from '@promptise/core';
import { medicalDiagnosis, codeReview, simplePrompt } from './prompts';

export default new Promptise({
  defaultCost: {
    inputTokenPrice: 0.000005,
    outputTokenPrice: 0.000015,
    currency: 'USD',
  },
  compositions: [
    {
      composition: medicalDiagnosis,
      fixtures: {
        complete: { role: 'doctor', task: 'diagnose symptoms' },
      },
    },
    {
      composition: codeReview,
      fixtures: {
        partial: { role: 'senior reviewer' },
      },
    },
    simplePrompt,
  ],
});
```

**Generate previews:**

```bash
npx promptise build
# ✓ Generated 3 previews in .promptise/builds
```

**Output files:**

```
.promptise/builds/
  medical-diagnosis_complete.txt
  code-review_partial.txt
  simple-prompt_placeholder.txt
```

**CLI Features:**

- ✅ Preview generation from fixtures
- ✅ Fixture completeness analysis (complete/partial/placeholder)
- ✅ `Estimated Input Cost` block for complete fixtures when pricing config is available
- ✅ Token-only metadata fallback when pricing config is not available
- ✅ Automatic stale file cleanup (disable with `--no-clean`)
- ✅ Clean output mode for copy-paste
- ✅ Monorepo support with smart path resolution
- ✅ Custom output directories

**Use cases:**

- Test prompt variations without LLM calls
- Generate documentation examples
- Share prompts with stakeholders
- Validate fixture completeness
- Quick prototyping

See the CLI README for complete documentation.

---

## 🛡️ Type Safety & Validation

All validation powered by Zod with enhanced error messages:

```typescript
try {
  const result = component.render({
    /* invalid data */
  });
} catch (error) {
  console.error(error.message);
  // [Promptise] Validation failed for component "greeting"
  //   Issue 1:
  //     Path: name
  //     Problem: Required
  //     Code: invalid_type
  //     💡 Suggestion: Ensure the value matches the expected type 'string'.
}
```

---

## 🤝 Contributing

Contributions are welcome! Whether it's bug reports, new features, or integration guides.

---

## 📄 License

Apache-2.0 © 2026 Promptise
