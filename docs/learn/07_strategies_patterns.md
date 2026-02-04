# Strategy Patterns

> **Enforce structural validation for multi-turn prompt workflows.**

Strategy patterns define the expected sequence of composition steps in a multi-turn strategy. They ensure compositions appear in the correct order—perfect for enforcing workflow consistency, team alignment, and documenting multi-step processes.

---

## Why Strategy Patterns?

**Enforce workflow structure:**

- Ensure multi-turn strategies follow defined sequences
- Validate Draft → Critique → Refine workflows
- Enforce ReAct pattern (Thought → Action → Observation)

**Team alignment:**

- Share standard workflows across teams
- Document multi-step processes
- Onboard new developers faster

**Quality control:**

- Validate step presence and order
- Prevent missing critical steps
- Ensure consistent strategy structure

---

## Basic Usage

```typescript
import { createPromptStrategy, createStrategyPattern } from '@promptise/core';

// 1. Define a strategy pattern
const refinementPattern = createStrategyPattern({
  id: 'draft-critique-refine',
  description: 'Iterative content refinement workflow',
  steps: [
    { id: 'draft', description: 'Initial content generation' },
    { id: 'critique', description: 'Critical evaluation' },
    { id: 'refine', description: 'Final polish' },
  ],
});

// 2. Apply pattern to strategy
const strategy = createPromptStrategy({
  id: 'blog-post-workflow',
  steps: [draftComposition, critiqueComposition, refineComposition],
  pattern: refinementPattern, // Enforces step order
});

// 3. Validation runs automatically during build
try {
  const result = strategy.current(data);
  // ✅ Pattern validation passed
} catch (error) {
  // ❌ Pattern validation failed
  console.error(error.message);
}
```

**What gets validated:**

- ✅ All required composition IDs are present
- ✅ Compositions appear in the correct order
- ❌ Content validation (handled by each composition's pattern)

---

## Pattern vs Composition Patterns

Strategy patterns and composition patterns serve different purposes:

| Feature                | Strategy Pattern               | Composition Pattern                          |
| ---------------------- | ------------------------------ | -------------------------------------------- |
| **Scope**              | Multi-turn workflow (strategy) | Single prompt (composition)                  |
| **Validates**          | Step presence and order        | Component order + content (keywords, tokens) |
| **Applied to**         | `createPromptStrategy()`       | `createPromptComposition()`                  |
| **Content validation** | No (delegated to compositions) | Yes (required/forbidden keywords, tokens)    |
| **Use case**           | Workflow structure             | Prompt quality and compliance                |
| **Examples**           | Draft→Critique→Refine, ReAct   | RACE, COSTAR, Medical compliance             |

**Key difference:** Strategy patterns focus on **structure** (which steps, what order), while composition patterns focus on **content** (what keywords, how many tokens).

---

## Prebuilt Patterns

Promptise includes common strategy patterns ready to use:

### Draft-Critique-Refine Pattern

**Draft → Critique → Refine**

```typescript
import { DRAFT_CRITIQUE_REFINE_PATTERN } from '@promptise/core';

const strategy = createPromptStrategy({
  id: 'blog-post',
  steps: [draftComposition, critiqueComposition, refineComposition],
  pattern: DRAFT_CRITIQUE_REFINE_PATTERN,
});
```

**When to use:**

- Iterative content generation
- Quality improvement workflows
- Writing and editing tasks

**Step IDs required:**

1. `draft` - Initial content generation
2. `critique` - Critical evaluation
3. `refine` - Final polished version

---

### ReAct Pattern

**Thought → Action → Observation**

```typescript
import { STRATEGY_REACT_PATTERN } from '@promptise/core';

const agentStrategy = createPromptStrategy({
  id: 'agent-workflow',
  steps: [thinkComposition, actComposition, observeComposition],
  pattern: STRATEGY_REACT_PATTERN,
});
```

**When to use:**

- Agent-based workflows
- Reasoning and acting loops
- Iterative problem-solving

**Step IDs required:**

1. `thought` - Reasoning step
2. `action` - Action to take
3. `observation` - Observe results

---

### Chain-of-Density Pattern

**Initial → Summarize → Compress**

```typescript
import { CHAIN_OF_DENSITY_PATTERN } from '@promptise/core';

const summaryStrategy = createPromptStrategy({
  id: 'dense-summary',
  steps: [initialComposition, summarizeComposition, compressComposition],
  pattern: CHAIN_OF_DENSITY_PATTERN,
});
```

**When to use:**

- Incremental summarization
- Density-based compression
- Multi-pass text refinement

**Step IDs required:**

1. `initial` - Initial summary
2. `summarize` - Add more details
3. `compress` - Final dense summary

---

### Tree-of-Thought Pattern

**Generate → Evaluate → Expand → Select**

```typescript
import { TREE_OF_THOUGHT_PATTERN } from '@promptise/core';

const reasoningStrategy = createPromptStrategy({
  id: 'complex-reasoning',
  steps: [generateComposition, evaluateComposition, expandComposition, selectComposition],
  pattern: TREE_OF_THOUGHT_PATTERN,
});
```

**When to use:**

- Complex reasoning tasks
- Multiple solution exploration
- Decision-making workflows

**Step IDs required:**

1. `generate` - Generate candidate solutions
2. `evaluate` - Evaluate each candidate
3. `expand` - Expand promising paths
4. `select` - Select final solution

---

## Creating Custom Patterns

Define patterns for your specific workflows:

```typescript
import { createStrategyPattern } from '@promptise/core';

const codeReviewPattern = createStrategyPattern({
  id: 'code-review-workflow',
  description: 'Multi-stage code review process',
  steps: [
    { id: 'analyze', description: 'Static code analysis' },
    { id: 'security', description: 'Security vulnerability check' },
    { id: 'performance', description: 'Performance review' },
    { id: 'report', description: 'Final review report' },
  ],
});

const strategy = createPromptStrategy({
  id: 'pr-review',
  steps: [analyzeComp, securityComp, performanceComp, reportComp],
  pattern: codeReviewPattern,
});
```

**Pattern configuration:**

```typescript
interface StrategyPatternConfig {
  id: string; // Pattern identifier (alphanumeric/-/_)
  description?: string; // Optional description
  steps: StrategyPatternStep[]; // Ordered array of required steps
}

interface StrategyPatternStep {
  id: string; // Composition ID to match
  description?: string; // Optional step description
}
```

---

## Validation

### Step Presence

Pattern ensures all required composition IDs are present:

```typescript
const pattern = createStrategyPattern({
  id: 'simple-workflow',
  steps: [{ id: 'step1' }, { id: 'step2' }, { id: 'step3' }],
});

// ❌ Missing step2
const strategy = createPromptStrategy({
  id: 'incomplete',
  steps: [step1Composition, step3Composition], // Missing step2
  pattern,
});
```

**Throws:**

```
[Promptise] Pattern validation failed for strategy "incomplete"
  ❌ Missing required step: "step2"
```

---

### Step Order

Pattern enforces composition order:

```typescript
const pattern = createStrategyPattern({
  id: 'ordered-workflow',
  steps: [{ id: 'first' }, { id: 'second' }, { id: 'third' }],
});

// ❌ Wrong order: second comes before first
const strategy = createPromptStrategy({
  id: 'wrong-order',
  steps: [secondComposition, firstComposition, thirdComposition],
  pattern,
});
```

**Throws:**

```
[Promptise] Pattern validation failed for strategy "wrong-order"
  ❌ Step "first" must appear before "second"
```

---

### Validation Timing

Pattern validation runs **once during strategy creation**, not on every step execution:

```typescript
// ✅ Validation happens here (during createPromptStrategy)
const strategy = createPromptStrategy({
  id: 'my-workflow',
  steps: [step1, step2, step3],
  pattern: myPattern,
});

// No validation here - just state management
strategy.current(data);
strategy.next(data);
strategy.next(data);
```

**Why?** Strategy structure is static—steps don't change at runtime.

---

## Best Practices

### 1. Use Descriptive Step IDs

```typescript
// ❌ Unclear
steps: [{ id: 's1' }, { id: 's2' }, { id: 's3' }];

// ✅ Self-documenting
steps: [{ id: 'draft' }, { id: 'critique' }, { id: 'refine' }];
```

### 2. Add Step Descriptions

```typescript
steps: [
  { id: 'analyze', description: 'Analyze code structure and patterns' },
  { id: 'security', description: 'Check for security vulnerabilities' },
  { id: 'report', description: 'Generate comprehensive review report' },
];
```

### 3. Match Step IDs to Composition IDs

```typescript
const draftComposition = createPromptComposition({
  id: 'draft', // Must match pattern step ID
  components: [roleComp, taskComp],
});

const pattern = createStrategyPattern({
  id: 'workflow',
  steps: [
    { id: 'draft' }, // Matches composition ID
  ],
});
```

### 4. Combine with Composition Patterns

```typescript
// Each composition has its own pattern for content validation
const draftComposition = createPromptComposition({
  id: 'draft',
  components: [roleComp, taskComp],
  pattern: RACE_PATTERN, // Composition pattern for content
});

// Strategy pattern validates step order
const strategy = createPromptStrategy({
  id: 'workflow',
  steps: [draftComposition, critiqueComposition],
  pattern: DRAFT_CRITIQUE_REFINE_PATTERN, // Strategy pattern for structure
});
```

**Validation layers:**

1. **Component level:** Schema validation (Zod)
2. **Composition level:** Content patterns (keywords, tokens)
3. **Strategy level:** Structural patterns (step order)

### 5. Document Custom Patterns

```typescript
/**
 * Medical diagnosis workflow pattern.
 * Enforces: Intake → Analysis → Consultation → Report
 */
export const MEDICAL_DIAGNOSIS_PATTERN = createStrategyPattern({
  id: 'medical-diagnosis',
  description: 'HIPAA-compliant multi-stage diagnosis workflow',
  steps: [
    { id: 'intake', description: 'Patient information collection' },
    { id: 'analysis', description: 'Clinical data analysis' },
    { id: 'consultation', description: 'Expert consultation' },
    { id: 'report', description: 'Final diagnostic report' },
  ],
});
```

---

## FAQ

### When should I use a strategy pattern?

Use strategy patterns when:

- ✅ You have multi-step workflows that must follow specific order
- ✅ You want to enforce team consistency across strategies
- ✅ You're building agent workflows (ReAct, Tree-of-Thought)
- ✅ You need to document standard processes

Skip patterns when:

- ❌ Strategy has only 1-2 steps (overhead not worth it)
- ❌ Step order is flexible/dynamic
- ❌ You're prototyping and iterating quickly

### Can I have optional steps?

No. Strategy patterns enforce **all steps are required** in the defined order.

For optional steps, use multiple patterns:

```typescript
const shortPattern = createStrategyPattern({
  id: 'quick-review',
  steps: [{ id: 'analyze' }, { id: 'report' }],
});

const fullPattern = createStrategyPattern({
  id: 'detailed-review',
  steps: [{ id: 'analyze' }, { id: 'security' }, { id: 'performance' }, { id: 'report' }],
});
```

### Can I reuse compositions across strategies?

Yes! Compositions are reusable:

```typescript
const analyzeComp = createPromptComposition({
  id: 'analyze',
  components: [codeAnalysisComp],
});

// Use in multiple strategies
const quickStrategy = createPromptStrategy({
  id: 'quick',
  steps: [analyzeComp, reportComp],
});

const deepStrategy = createPromptStrategy({
  id: 'deep',
  steps: [analyzeComp, securityComp, performanceComp, reportComp],
});
```

### What's the difference between COMPOSITION_REACT_PATTERN and STRATEGY_REACT_PATTERN?

- **COMPOSITION_REACT_PATTERN:** Validates a **single composition** has Thought, Action, Observation **components**
- **STRATEGY_REACT_PATTERN:** Validates a **strategy** has Thought, Action, Observation **compositions** (steps)

Use composition pattern for single-turn ReAct prompts, strategy pattern for multi-turn ReAct workflows.

### Can I validate step content?

No. Strategy patterns validate **structure only** (presence and order).

Content validation happens at the composition level:

```typescript
const draftComposition = createPromptComposition({
  id: 'draft',
  components: [roleComp, taskComp],
  pattern: myCompositionPattern, // Content validation here
});

const strategy = createPromptStrategy({
  id: 'workflow',
  steps: [draftComposition, critiqueComposition],
  pattern: myStrategyPattern, // Structure validation here
});
```
