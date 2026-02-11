# Registry

> **Centralize and manage all your prompt compositions.**

The Promptise Registry is a central catalog that organizes all your compositions and their fixture data. It serves as the single source of truth for your prompt library and powers CLI tooling for preview generation.

---

## Quick Start

```typescript
import { Promptise, createPromptComposition, createPromptComponent } from '@promptise/core';
import { z } from 'zod';

// 1. Create your compositions
const roleComp = createPromptComponent({
  key: 'role',
  schema: z.object({ role: z.string() }),
  template: 'You are a {{role}}.',
});

const taskComp = createPromptComponent({
  key: 'task',
  schema: z.object({ task: z.string() }),
  template: 'Task: {{task}}',
});

const medicalDiagnosis = createPromptComposition({
  id: 'medical-diagnosis',
  components: [roleComp, taskComp],
});

const codeReview = createPromptComposition({
  id: 'code-review',
  components: [roleComp, taskComp],
});

// 2. Create registry with fixtures
export default new Promptise({
  compositions: [
    {
      composition: medicalDiagnosis,
      fixtures: {
        basic: { role: 'doctor', task: 'diagnose symptoms' },
        icu: { role: 'intensivist', task: 'stabilize patient' },
      },
    },
    {
      composition: codeReview,
      fixtures: {
        security: { role: 'security engineer', task: 'find vulnerabilities' },
        performance: { role: 'performance expert', task: 'optimize code' },
      },
    },
  ],
});
```

**Configuration Properties:**

| Property       | Type                 | Required | Description                  |
| -------------- | -------------------- | -------- | ---------------------------- |
| `compositions` | `CompositionEntry[]` | ✅       | Array of composition entries |

**CompositionEntry Properties:**

| Property      | Type                                  | Required | Description                     |
| ------------- | ------------------------------------- | -------- | ------------------------------- |
| `composition` | `PromptComposition`                   | ✅       | The prompt composition instance |
| `fixtures`    | `Record<string, Record<string, any>>` | ❌       | Named test data for CLI tooling |

---

## Registering Compositions

The registry accepts compositions in two formats, giving you flexibility based on whether you need fixtures or not.

### Direct Format (No Fixtures)

When you don't need fixtures for a composition, pass it directly to the array:

```typescript
import { Promptise, createPromptComposition } from '@promptise/core';

const composition1 = createPromptComposition({
  id: 'simple-prompt',
  components: [/* ... */],
});

const composition2 = createPromptComposition({
  id: 'another-prompt',
  components: [/* ... */],
});

export default new Promptise({
  compositions: [composition1, composition2], // Direct format
});
```

**When to use:**
- Simple catalog of compositions
- Compositions used only in production code
- Quick setup (CLI generates placeholder preview automatically)

---

### Object Format (With Fixtures)

When you need fixtures for CLI tooling, use the object format:

```typescript
export default new Promptise({
  compositions: [
    {
      composition: medicalDiagnosis,
      fixtures: {
        basic: { role: 'doctor', task: 'diagnose symptoms' },
        icu: { role: 'intensivist', task: 'stabilize patient' },
      },
    },
  ],
});
```

**When to use:**
- Need fixtures for CLI preview generation
- Testing multiple scenarios
- Documentation examples

---

### Mixed Format

You can combine both formats in the same registry:

```typescript
export default new Promptise({
  compositions: [
    // Direct format (no fixtures)
    simplePrompt,
    anotherPrompt,

    // Object format (with fixtures)
    {
      composition: complexPrompt,
      fixtures: {
        scenario1: { /* ... */ },
        scenario2: { /* ... */ },
      },
    },

    // Object format without fixtures (explicit)
    { composition: yetAnotherPrompt },
  ],
});
```

**When to use:**
- Mix of compositions with and without fixtures
- Gradual migration (adding fixtures over time)
- Different tooling needs per composition

---

## Core Concepts

### Registry as Central Catalog

The registry centralizes all compositions in one place:

```typescript
// promptise.config.ts
import { Promptise } from '@promptise/core';
import * as medicalPrompts from './prompts/medical';
import * as legalPrompts from './prompts/legal';
import * as technicalPrompts from './prompts/technical';

export default new Promptise({
  compositions: [
    // Medical prompts
    { composition: medicalPrompts.diagnosis, fixtures: {...} },
    { composition: medicalPrompts.treatment, fixtures: {...} },

    // Legal prompts
    { composition: legalPrompts.contractReview, fixtures: {...} },
    { composition: legalPrompts.complianceCheck, fixtures: {...} },

    // Technical prompts
    { composition: technicalPrompts.codeReview, fixtures: {...} },
    { composition: technicalPrompts.architecture, fixtures: {...} },
  ],
});
```

**Benefits:**

- ✅ Single source of truth for all prompts
- ✅ CLI discovers all compositions automatically
- ✅ Organized catalog for team collaboration
- ✅ Version control for your prompt library

---

### Fixtures for Development

Fixtures are mock data used exclusively by development tooling. They are **NOT** used in production code.

```typescript
export default new Promptise({
  compositions: [
    {
      composition: medicalDiagnosis,
      fixtures: {
        // Each fixture is named and contains test data
        basic: {
          role: 'general practitioner',
          task: 'diagnose common symptoms',
        },
        icu: {
          role: 'intensive care specialist',
          task: 'stabilize critical patient',
        },
        emergency: {
          role: 'emergency physician',
          task: 'triage trauma patient',
        },
      },
    },
  ],
});
```

**Fixture Use Cases:**

- ✅ CLI preview generation
- ✅ Testing prompt variations
- ✅ Documentation examples
- ✅ Demo data for stakeholders

**Important:** In production, always pass real data to `composition.build(data)`:

```typescript
// ❌ Don't use fixtures in production
const prompt = composition.build(fixtures.basic);

// ✅ Use real data in production
const prompt = composition.build({
  role: userData.role,
  task: actualTask,
});
```

---

### Unique ID Validation

The registry validates that all composition IDs are unique:

```typescript
const prompt1 = createPromptComposition({
  id: 'medical-diagnosis', // ✅ Unique
  components: [roleComp, taskComp],
});

const prompt2 = createPromptComposition({
  id: 'medical-diagnosis', // ❌ Duplicate!
  components: [otherComp],
});

// This will throw an error
const registry = new Promptise({
  compositions: [
    { composition: prompt1, fixtures: {} },
    { composition: prompt2, fixtures: {} }, // Error: Duplicate ID 'medical-diagnosis'
  ],
});
```

---

## Registry Methods

### getCompositions()

Get all composition entries with their fixtures. Primary method used by CLI.

```typescript
const registry = new Promptise({
  compositions: [
    {
      composition: medicalDiagnosis,
      fixtures: {
        basic: { role: 'doctor', task: 'diagnose' },
        icu: { role: 'intensivist', task: 'stabilize' },
      },
    },
    {
      composition: codeReview,
      fixtures: {
        security: { role: 'security engineer', task: 'audit code' },
      },
    },
  ],
});

const entries = registry.getCompositions();
// [
//   {
//     composition: medicalDiagnosis,
//     fixtures: {
//       basic: { role: 'doctor', task: 'diagnose' },
//       icu: { role: 'intensivist', task: 'stabilize' }
//     }
//   },
//   {
//     composition: codeReview,
//     fixtures: {
//       security: { role: 'security engineer', task: 'audit code' }
//     }
//   }
// ]
```

**Use in CLI:**

```typescript
for (const entry of registry.getCompositions()) {
  console.log(`Processing ${entry.composition.id}...`);

  const fixtures = entry.fixtures ?? {};
  for (const [fixtureName, fixtureData] of Object.entries(fixtures)) {
    const preview = entry.composition.build(fixtureData);
    // Write preview.asString() to file
  }
}
```

---

### getComposition(id)

Get a specific composition entry by ID. Returns `undefined` if not found.

```typescript
const entry = registry.getComposition('medical-diagnosis');

if (entry) {
  console.log(`Found ${entry.composition.id}`);
  console.log(`Fixtures: ${Object.keys(entry.fixtures ?? {}).join(', ')}`);
} else {
  console.log('Composition not found');
}
```

---

## Use Cases

### 1. CLI Preview Generation

Primary use case - organize compositions for automated preview generation:

```typescript
// promptise.config.ts
import { Promptise } from '@promptise/core';
import { medicalDiagnosis, codeReview, legalReview } from './prompts';

export default new Promptise({
  compositions: [
    {
      composition: medicalDiagnosis,
      fixtures: {
        basic: { role: 'doctor', task: 'diagnose symptoms' },
        icu: { role: 'intensivist', task: 'stabilize patient' },
      },
    },
    {
      composition: codeReview,
      fixtures: {
        security: { role: 'security engineer', task: 'find vulnerabilities' },
        performance: { role: 'performance expert', task: 'optimize code' },
      },
    },
    {
      composition: legalReview,
      fixtures: {
        contract: { role: 'contract lawyer', task: 'review agreement' },
      },
    },
  ],
});
```

Run CLI to generate all previews:

```bash
npx promptise build
# Generates:
# - medical-diagnosis_basic.txt
# - medical-diagnosis_icu.txt
# - code-review_security.txt
# - code-review_performance.txt
# - legal-review_contract.txt
```

---

### 2. Prompt Library Management

Organize prompts by domain or feature:

```typescript
// prompts/medical/index.ts
export { diagnosis } from './diagnosis';
export { treatment } from './treatment';
export { triage } from './triage';

// prompts/legal/index.ts
export { contractReview } from './contract-review';
export { compliance } from './compliance';

// promptise.config.ts
import { Promptise } from '@promptise/core';
import * as medical from './prompts/medical';
import * as legal from './prompts/legal';

export default new Promptise({
  compositions: [
    // Medical domain
    { composition: medical.diagnosis, fixtures: {...} },
    { composition: medical.treatment, fixtures: {...} },
    { composition: medical.triage, fixtures: {...} },

    // Legal domain
    { composition: legal.contractReview, fixtures: {...} },
    { composition: legal.compliance, fixtures: {...} },
  ],
});
```

---

### 3. Testing Variations

Create multiple fixtures to test different scenarios:

```typescript
export default new Promptise({
  compositions: [
    {
      composition: customerSupport,
      fixtures: {
        // Happy path
        standard: {
          tone: 'professional',
          urgency: 'normal',
          context: 'Product inquiry',
        },

        // Edge cases
        urgent: {
          tone: 'empathetic',
          urgency: 'critical',
          context: 'Service outage affecting business',
        },

        // Compliance scenarios
        regulated: {
          tone: 'formal',
          urgency: 'normal',
          context: 'HIPAA-related inquiry',
        },

        // Multilingual
        spanish: {
          tone: 'friendly',
          urgency: 'normal',
          context: 'Consulta sobre producto',
        },
      },
    },
  ],
});
```

---

### 4. Documentation Generation

Use fixtures as documentation examples:

```typescript
export default new Promptise({
  compositions: [
    {
      composition: apiDocGenerator,
      fixtures: {
        // Example 1: REST API
        rest: {
          apiType: 'REST',
          endpoint: '/users/{id}',
          method: 'GET',
        },

        // Example 2: GraphQL
        graphql: {
          apiType: 'GraphQL',
          query: 'user(id: ID!): User',
          resolver: 'User',
        },

        // Example 3: WebSocket
        websocket: {
          apiType: 'WebSocket',
          event: 'message',
          channel: 'chat-room',
        },
      },
    },
  ],
});
```

Generate markdown docs from fixtures:

```bash
npx promptise build api-doc-generator --outdir ./docs/api-examples
```

---

### 5. Monorepo Organization

Separate configs per application:

```
apps/
  medical-app/
    promptise.config.ts       (medical compositions)
  legal-app/
    promptise.config.ts       (legal compositions)
  customer-support/
    promptise.config.ts       (support compositions)
```

Build specific app:

```bash
npx promptise build --config apps/medical-app/promptise.config.ts
```

---

## FAQ

### **Q: Are fixtures required?**

**A:** No, fixtures are optional. You can register compositions without fixtures using either format:

```typescript
export default new Promptise({
  compositions: [
    // Direct format (no fixtures)
    myPrompt,

    // Object format without fixtures
    { composition: anotherPrompt },

    // Object format with fixtures
    { composition: yetAnotherPrompt, fixtures: { test: {...} } },
  ],
});
```

**CLI behavior:**
- Compositions **with fixtures**: Generates one preview per fixture
- Compositions **without fixtures**: Generates a single `{compositionId}_placeholder.txt` with empty data (all placeholders visible)

---

### **Q: Can I use fixtures in production code?**

**A:** No, fixtures are for development tooling only. In production, always pass real data:

```typescript
// ❌ Don't do this in production
const prompt = composition.build(registry.getComposition('my-prompt')?.fixtures?.basic);

// ✅ Do this instead
const prompt = composition.build(actualProductionData);
```

---

### **Q: Can fixture data be partial?**

**A:** Yes, the CLI will detect incomplete fixtures and warn you:

```typescript
const medicalComp = createPromptComposition({
  id: 'medical',
  components: [
    createPromptComponent({
      key: 'role',
      schema: z.object({
        role: z.string(),
        specialty: z.string(), // Required
      }),
      template: 'You are a {{role}} specializing in {{specialty}}.',
    }),
  ],
});

export default new Promptise({
  compositions: [
    {
      composition: medicalComp,
      fixtures: {
        partial: { role: 'doctor' }, // Missing 'specialty'
      },
    },
  ],
});
```

CLI output:

```
✓ Generated 1 preview in .promptise/builds
⚠️  1 file with incomplete fixtures - review before using
```

Preview file will show:

```
Status: partial
Provided: role
Missing: specialty
```

---

### **Q: How do I share fixtures across environments?**

**A:** Create a shared fixtures file:

```typescript
// fixtures/medical.ts
export const medicalFixtures = {
  basic: { role: 'doctor', task: 'diagnose' },
  icu: { role: 'intensivist', task: 'stabilize' },
};

// promptise.config.ts
import { Promptise } from '@promptise/core';
import { medicalDiagnosis } from './prompts';
import { medicalFixtures } from './fixtures/medical';

export default new Promptise({
  compositions: [
    {
      composition: medicalDiagnosis,
      fixtures: medicalFixtures,
    },
  ],
});
```

---

### **Q: Can I programmatically generate fixtures?**

**A:** Yes, fixtures are just objects:

```typescript
function generateTestFixtures(scenarios: string[]) {
  return scenarios.reduce(
    (acc, scenario) => {
      acc[scenario] = {
        role: `${scenario} specialist`,
        task: `Handle ${scenario} case`,
      };
      return acc;
    },
    {} as Record<string, any>,
  );
}

export default new Promptise({
  compositions: [
    {
      composition: medicalDiagnosis,
      fixtures: generateTestFixtures(['cardiology', 'neurology', 'oncology']),
    },
  ],
});
```

---

### **Q: What happens if I have no compositions in my registry?**

**A:** The registry will be empty but valid:

```typescript
const registry = new Promptise({
  compositions: [], // Empty is allowed
});

registry.getCompositions(); // []
registry.getCompositions(); // []
```

CLI will warn: "No previews generated. Check your fixtures configuration."

---

### **Q: Can I have multiple registries?**

**A:** Technically yes, but a project should have one registry per config file:

```typescript
// promptise.config.ts
export default new Promptise({ compositions: [...] });

// promptise.dev.config.ts (for development-only prompts)
export default new Promptise({ compositions: [...] });
```

Use different configs with CLI:

```bash
npx promptise build --config promptise.dev.config.ts
```

---

### **Q: How do I version my prompt library?**

**A:** The registry is just code - use git:

```typescript
// promptise.config.ts - v1.0.0
export default new Promptise({
  compositions: [
    { composition: diagnosisV1, fixtures: {...} },
  ],
});

// After updates - v2.0.0
export default new Promptise({
  compositions: [
    { composition: diagnosisV2, fixtures: {...} }, // New schema
  ],
});
```

Tag releases:

```bash
git tag prompt-library-v2.0.0
git push --tags
```

---

### **Q: Can I add metadata to registry entries?**

**A:** Not directly, but you can create a wrapper:

```typescript
interface EnhancedEntry {
  composition: PromptComposition;
  fixtures?: Record<string, any>;
  metadata: {
    domain: string;
    version: string;
    author: string;
  };
}

const entries: EnhancedEntry[] = [
  {
    composition: medicalDiagnosis,
    fixtures: {...},
    metadata: {
      domain: 'medical',
      version: '2.1.0',
      author: 'Medical Team',
    },
  },
];

// Registry only needs composition + fixtures
export default new Promptise({
  compositions: entries.map(e => ({
    composition: e.composition,
    fixtures: e.fixtures,
  })),
});
```
