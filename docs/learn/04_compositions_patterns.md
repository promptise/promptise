# Composition Patterns

> **Enforce prompt engineering best practices with structural validation.**

Composition patterns define the expected structure and content validation rules for compositions. They ensure components appear in the correct order and contain the right keywords—perfect for compliance, quality control, and enforcing organizational standards.

---

## Why Patterns?

**Enforce organizational standards:**

- Ensure all medical prompts include HIPAA disclaimers
- Prevent liability keywords (diagnose, prescribe, treat)
- Enforce specific prompt structures (RACE, COSTAR, etc.)

**Quality control:**

- Validate component order
- Check for required terminology
- Limit token usage per section

**Team alignment:**

- Share patterns across teams
- Document prompt best practices
- Onboard new developers faster

---

## Basic Usage

```typescript
import { createPromptComposition, createCompositionPattern } from '@promptise/core';

// 1. Create a pattern
const medicalPattern = createCompositionPattern({
  id: 'medical-analysis',
  description: 'HIPAA-compliant clinical data analysis pattern',
  maxTokens: 8192, // GPT-4 8K context window
  components: [
    {
      key: 'role',
      description: 'AI assistant medical role',
      validation: {
        required: ['clinical', 'synthesizer'],
        maxTokens: 100, // Per-component limit
      },
    },
    {
      key: 'rules',
      description: 'Compliance and safety guidelines',
      validation: {
        required: ['HIPAA', 'PHI'],
        forbidden: ['diagnose', 'prescribe', 'cure', 'treat'],
        optional: ['FDA', 'HL7'],
      },
    },
    {
      key: 'task',
      description: 'Analysis task',
    },
  ],
});

// 2. Apply pattern to composition
const composition = createPromptComposition({
  id: 'medical-analysis',
  components: [roleComp, rulesComp, taskComp],
  pattern: medicalPattern, // Enforces validation
});

// 3. Build - validation runs automatically
try {
  const prompt = composition.build(data);
  // ✅ All validation passed
} catch (error) {
  // ❌ Validation failed
  console.error(error.message);
}
```

---

## Content Validation

Validation rules are checked when `composition.build()` is called, **after** components render their content.

### Required Keywords

Keywords that **must** be present (case-insensitive):

```typescript
const pattern = createCompositionPattern({
  id: 'security-pattern',
  components: [
    {
      key: 'disclaimer',
      validation: {
        required: ['confidential', 'encrypted', 'secure'],
      },
    },
  ],
});

// ✅ Pass: Contains all required keywords
const comp = createPromptComponent({
  key: 'disclaimer',
  template: 'This system uses encrypted channels to keep data confidential and secure.',
});

// ❌ Fail: Missing "encrypted"
const comp = createPromptComponent({
  key: 'disclaimer',
  template: 'This system keeps data confidential and secure.',
});
```

**Throws:**

```
[Promptise] Content validation failed for component "disclaimer" (key: disclaimer)
  ❌ Missing required keyword: "encrypted"
```

---

### Optional Keywords

Keywords that **should** be present (warnings only):

```typescript
const pattern = createCompositionPattern({
  id: 'compliance-pattern',
  components: [
    {
      key: 'rules',
      validation: {
        required: ['HIPAA', 'PHI'],
        optional: ['FDA', 'HL7', 'FHIR'], // Best practices
      },
    },
  ],
});

// Builds successfully, but logs warnings if optional keywords missing
const prompt = composition.build(data);
// ⚠️  Warning: Missing optional keyword in "rules": "FDA"
// ⚠️  Warning: Missing optional keyword in "rules": "HL7"
```

**Use cases:**

- Best practice reminders
- Style guide suggestions
- Non-critical compliance checks

---

### Forbidden Keywords

Keywords that **must not** appear (case-insensitive):

```typescript
const pattern = createCompositionPattern({
  id: 'liability-protection',
  components: [
    {
      key: 'medical-advice',
      validation: {
        forbidden: ['diagnose', 'prescribe', 'cure', 'treat', 'therapy'],
      },
    },
  ],
});

// ❌ Fail: Contains forbidden keyword
const comp = createPromptComponent({
  key: 'medical-advice',
  template: 'The AI will diagnose based on symptoms.',
});
```

**Throws:**

```
[Promptise] Content validation failed for component "medical-advice"
  ❌ Forbidden keyword found: "diagnose"
```

**Perfect for:**

- Liability prevention
- Compliance violations
- Brand safety
- Content moderation

---

### Token Limits

Limit component token count with **per-component** limits:

```typescript
const pattern = createCompositionPattern({
  id: 'token-aware',
  components: [
    {
      key: 'role',
      validation: {
        maxTokens: 50, // Per-component token limit
      },
    },
  ],
});

// ❌ Fail: Exceeds token limit
const comp = createPromptComponent({
  key: 'role',
  template: 'You are a highly specialized...' + '...very long text...', // > 50 tokens
});
```

**Throws:**

```
[Promptise] Content validation failed for component "role"
  ❌ Token count (73) exceeds maxTokens (50)
```

#### Global Token Limits

Enforce model context window limits with **pattern-level** `maxTokens`:

```typescript
const gpt4Pattern = createCompositionPattern({
  id: 'gpt4-8k',
  description: 'GPT-4 8K context window',
  maxTokens: 8192, // Global limit for entire prompt
  components: [
    { key: 'role', validation: { maxTokens: 100 } },
    { key: 'task', validation: { maxTokens: 200 } },
    { key: 'context' }, // No per-component limit
  ],
});

const composition = createPromptComposition({
  id: 'medical-analysis',
  components: [roleComp, taskComp, contextComp],
  pattern: gpt4Pattern,
});

// ❌ Fail if total tokens exceed 8192
const prompt = composition.build(data);
```

**Common model limits:**

- GPT-4 8K: `8,192` tokens
- GPT-4 32K: `32,768` tokens
- GPT-4 Turbo: `128,000` tokens
- Claude 3 Opus: `200,000` tokens
- Claude 3.5 Sonnet: `200,000` tokens

**Validation order:**

1. Component intrinsic validation (if defined)
2. Pattern per-component validation (if defined)
3. Pattern global `maxTokens` (if defined)

**All validations must pass** (AND logic).

---

### Custom Validators

Complex validation logic with custom functions:

```typescript
const pattern = createCompositionPattern({
  id: 'advanced-validation',
  components: [
    {
      key: 'examples',
      validation: {
        custom: [
          // Must have numbered examples
          (text) => ({
            valid: /example \d+:/gi.test(text),
            message: 'Must include numbered examples (e.g., "Example 1:")',
          }),
          // Must have at least 3 examples
          (text) => ({
            valid: (text.match(/example \d+:/gi) || []).length >= 3,
            message: 'Must include at least 3 examples',
          }),
          // Each example must have input/output
          (text) => {
            const hasInput = text.toLowerCase().includes('input:');
            const hasOutput = text.toLowerCase().includes('output:');
            return {
              valid: hasInput && hasOutput,
              message: 'Each example must have "Input:" and "Output:"',
            };
          },
        ],
      },
    },
  ],
});
```

**Custom validator signature:**

```typescript
type CustomValidator = (text: string) => {
  valid: boolean;
  message?: string; // Error message if invalid
};
```

---

## Prebuilt Patterns

Promptise includes battle-tested prompt engineering patterns:

### RACE Pattern

**Role, Action, Context, Examples**

```typescript
import { RACE_PATTERN } from '@promptise/core';

const composition = createPromptComposition({
  id: 'medical-assistant',
  components: [roleComp, actionComp, contextComp, examplesComp],
  pattern: RACE_PATTERN,
});
```

**When to use:**

- General-purpose prompts
- Task-oriented workflows
- Few-shot learning

---

### COSTAR Pattern

**Context, Objective, Style, Tone, Audience, Response**

```typescript
import { COSTAR_PATTERN } from '@promptise/core';

const composition = createPromptComposition({
  id: 'content-writer',
  components: [contextComp, objectiveComp, styleComp, toneComp, audienceComp, responseComp],
  pattern: COSTAR_PATTERN,
});
```

**When to use:**

- Content generation
- Marketing copy
- Communication tasks

---

### Chain-of-Thought Pattern

**Task, Reasoning, Constraints**

```typescript
import { CHAIN_OF_THOUGHT_PATTERN } from '@promptise/core';

const composition = createPromptComposition({
  id: 'reasoning-task',
  components: [taskComp, reasoningComp, constraintsComp],
  pattern: CHAIN_OF_THOUGHT_PATTERN,
});
```

**When to use:**

- Complex reasoning
- Step-by-step analysis
- Mathematical problems

---

### Few-Shot Pattern

**Instruction, Examples, Task**

```typescript
import { FEW_SHOT_PATTERN } from '@promptise/core';

const composition = createPromptComposition({
  id: 'classifier',
  components: [instructionComp, examplesComp, taskComp],
  pattern: FEW_SHOT_PATTERN,
});
```

**When to use:**

- Classification tasks
- Pattern matching
- Consistent output formats

---

### ReAct Pattern

**Thought, Action, Observation**

```typescript
import { COMPOSITION_REACT_PATTERN } from '@promptise/core';

const composition = createPromptComposition({
  id: 'agent-step',
  components: [thoughtComp, actionComp, observationComp],
  pattern: COMPOSITION_REACT_PATTERN,
});
```

**When to use:**

- Agent workflows
- Iterative problem-solving
- Tool-using agents

---

## Creating Custom Patterns

### Basic Pattern

Minimal pattern with component order:

```typescript
const simplePattern = createCompositionPattern({
  id: 'simple-pattern',
  description: 'Basic role-task pattern',
  components: [
    { key: 'role', description: 'AI role' },
    { key: 'task', description: 'Task to perform' },
  ],
});
```

---

### Pattern with Validation

Full validation rules:

```typescript
const securePattern = createCompositionPattern({
  id: 'secure-data-analysis',
  description: 'Enterprise data analysis with security validation',
  components: [
    {
      key: 'role',
      description: 'Data analyst role',
      validation: {
        required: ['analyst', 'data'],
        maxTokens: 100,
      },
    },
    {
      key: 'security',
      description: 'Security guidelines',
      validation: {
        required: ['encrypted', 'authenticated', 'authorized'],
        forbidden: ['public', 'unsecured', 'plaintext'],
        maxTokens: 300,
      },
    },
    {
      key: 'task',
      description: 'Analysis task',
      validation: {
        required: ['analyze', 'report'],
        maxTokens: 200,
        custom: [
          (text) => ({
            valid: !text.toLowerCase().includes('delete'),
            message: 'Task should not include destructive operations',
          }),
        ],
      },
    },
    {
      key: 'output',
      description: 'Expected output format',
      validation: {
        required: ['format', 'structure'],
        optional: ['JSON', 'CSV', 'report'],
      },
    },
  ],
});
```

---

## Best Practices

### 1. Start Simple, Add Validation Later

```typescript
// ✅ Phase 1: Basic structure
const pattern = createCompositionPattern({
  id: 'my-pattern',
  components: [{ key: 'role' }, { key: 'task' }],
});

// ✅ Phase 2: Add validation as requirements emerge
const pattern = createCompositionPattern({
  id: 'my-pattern',
  components: [
    {
      key: 'role',
      validation: { required: ['assistant'], maxTokens: 100 },
    },
    {
      key: 'task',
      validation: { forbidden: ['illegal', 'harmful'] },
    },
  ],
});
```

---

### 2. Use Forbidden Keywords for Liability

```typescript
// Healthcare example
validation: {
  forbidden: ['diagnose', 'prescribe', 'cure', 'treat', 'therapy'];
}

// Financial example
validation: {
  forbidden: ['guarantee', 'promise', 'sure thing', 'no risk'];
}

// Legal example
validation: {
  forbidden: ['legal advice', 'represents', 'attorney'];
}
```

---

### 3. Combine Required + Optional

```typescript
validation: {
  required: ['HIPAA', 'PHI'],     // Critical compliance
  optional: ['FDA', 'HL7', 'FHIR'], // Best practices
  forbidden: ['diagnose']          // Liability
}
```

---

### 4. Test Patterns with Edge Cases

```typescript
import { describe, it, expect } from '@jest/globals';

describe('MedicalPattern', () => {
  it('should reject prompts without HIPAA mention', () => {
    const comp = createPromptComponent({
      key: 'rules',
      template: 'Follow all guidelines.',
    });

    const composition = createPromptComposition({
      id: 'test',
      components: [comp],
      pattern: medicalPattern,
    });

    expect(() => composition.build({})).toThrow('Missing required keyword: "HIPAA"');
  });

  it('should reject prompts with liability keywords', () => {
    const comp = createPromptComponent({
      key: 'rules',
      template: 'This AI will diagnose patients.',
    });

    expect(() => composition.build({})).toThrow('Forbidden keyword found: "diagnose"');
  });
});
```

---

## FAQ

### **Q: When is validation executed?**

**A:** Validation runs when `composition.build()` is called, **after** components render their content.

```typescript
const prompt = composition.build(data); // ← Validation happens here
```

---

### **Q: Are keyword checks case-sensitive?**

**A:** No, all keyword checks (required, optional, forbidden) are **case-insensitive**:

```typescript
validation: {
  required: ['HIPAA'];
}

// ✅ Matches: "hipaa", "HIPAA", "Hipaa", "HiPaA"
```

Custom validators can be case-sensitive if needed.

---

### **Q: Can I use patterns without validation?**

**A:** Yes, patterns can just enforce component order:

```typescript
const orderOnlyPattern = createCompositionPattern({
  id: 'order-only',
  components: [{ key: 'role' }, { key: 'task' }, { key: 'context' }],
});

// Enforces: role → task → context (no content validation)
```

---

### **Q: What happens if I add components not in the pattern?**

**A:** Pattern validates only listed components. Extra components are allowed but not validated:

```typescript
const pattern = createCompositionPattern({
  id: 'partial',
  components: [{ key: 'role' }, { key: 'task' }],
});

const composition = createPromptComposition({
  id: 'test',
  components: [roleComp, taskComp, extraComp], // extraComp not in pattern
  pattern: pattern,
});

// ✅ Builds successfully
// Only role and task are validated
```

---

### **Q: Can I reuse patterns across projects?**

**A:** Yes! Export patterns to shared libraries:

```typescript
// patterns/medical.ts
export const MEDICAL_PATTERN = createCompositionPattern({
  id: 'MedicalAnalysis',
  components: [
    /* ... */
  ],
});

// Use in multiple projects
import { MEDICAL_PATTERN } from '@company/prompt-patterns';
```

---

### **Q: How do I debug validation failures?**

**A:** Error messages include component key and specific validation failure:

```typescript
try {
  const prompt = composition.build(data);
} catch (error) {
  console.error(error.message);
  // [Promptise] Content validation failed for component "rules" (key: rules)
  //   ❌ Missing required keyword: "HIPAA"
  //   ❌ Forbidden keyword found: "diagnose"
  //   ⚠️  Missing optional keyword: "FDA"
}
```

---

### **Q: Can patterns have overlapping validation?**

**A:** Yes, multiple components can validate the same keywords:

```typescript
const pattern = createCompositionPattern({
  id: 'Redundant',
  components: [
    {
      key: 'intro',
      validation: { required: ['HIPAA'] },
    },
    {
      key: 'rules',
      validation: { required: ['HIPAA'] },
    },
  ],
});

// Both components must contain "HIPAA"
```

---

### **Q: Performance impact of validation?**

**A:** Minimal. Validation runs once per `build()` call using efficient string operations. For high-throughput systems, consider:

1. Cache built prompts if input data is static
2. Use simpler validation (fewer custom validators)
3. Skip validation in production (remove `pattern` property)
