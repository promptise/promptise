# Strategies

> **Multi-turn prompt chaining with stateful navigation.**

Strategies manage sequential prompt execution flows with built-in state management, history tracking, and progress monitoring. Perfect for reasoning workflows, iterative refinement, and agent-based systems.

---

## Quick Start

```typescript
import { createPromptStrategy } from '@promptise/core';

// Create a strategy with 3 steps
const strategy = createPromptStrategy({
  id: 'draft-critique-refine',
  steps: [draftComposition, critiqueComposition, refineComposition],
});

// Execute first step
const step1 = strategy.current({ topic: 'AI Ethics' });
const response = await llm.invoke(step1.asString());

// Move to next step
const step2 = strategy.next({ draft: response });
// ... continue with remaining steps
```

---

## Core Concepts

### State Machine

- **current()** - Get current step without advancing
- **next()** - Advance to next step
- **reset()** - Start over
- **completed** - Check if all steps executed

### History Tracking

Every step execution is logged:

```typescript
strategy.getHistory();
// [
//   { index: 0, id: 'draft', timestamp: Date },
//   { index: 1, id: 'critique', timestamp: Date }
// ]
```

### Progress Monitoring

```typescript
const { current, total, percentage } = strategy.progress;
console.log(`Step ${current + 1} of ${total} (${percentage.toFixed(1)}%)`);
```

---

## Use Cases

### 1. Draft-Critique-Refine

```typescript
const strategy = createPromptStrategy({
  id: 'iterative-writing',
  steps: [
    createPromptComposition({
      id: 'draft',
      components: [roleComp, taskComp],
    }),
    createPromptComposition({
      id: 'critique',
      components: [reviewComp, guidelinesComp],
    }),
    createPromptComposition({
      id: 'refine',
      components: [originalComp, feedbackComp, instructionComp],
    }),
  ],
});
```

### 2. ReAct Agent

```typescript
const reactStrategy = createPromptStrategy({
  id: 'react-cycle',
  steps: [
    thoughtComposition, // Think about the problem
    actionComposition, // Take action
    observationComposition, // Observe results
  ],
});
```

### 3. Chain-of-Density Summarization

```typescript
const codStrategy = createPromptStrategy({
  id: 'chain-of-density',
  steps: [initialSummaryComp, denser1Comp, denser2Comp, denser3Comp, finalSummaryComp],
});
```

---

## API Reference

### Navigation

```typescript
// Get current step prompt
strategy.current(data) → UniversalPromptInstance

// Advance and get next prompt
strategy.next(data) → UniversalPromptInstance

// Reset to beginning
strategy.reset() → void
```

### State Introspection

```typescript
// Current position
strategy.getCurrentIndex() → number
strategy.getNextStep() → PromptComposition | null

// Progress (computed properties)
strategy.completed → boolean
strategy.progress → { current, total, percentage }

// History
strategy.getHistory() → Array<{ index, id, timestamp }>
```

### Helpers

```typescript
// Access steps
strategy.steps → readonly PromptComposition[]  // Direct access
strategy.getStep(index) → PromptComposition
strategy.getStepById(id) → PromptComposition | undefined
```

---

## Integration Examples

### Mastra AI

```typescript
import { Agent } from '@mastra/core/agent';

const agent = new Agent({
  name: 'reasoning-agent',
  async execute(input) {
    strategy.reset();

    const analysis = await this.model.generate(strategy.current({ data: input }).asString());

    const evaluation = await this.model.generate(strategy.next({ analysis }).asString());

    return strategy.next({ analysis, evaluation });
  },
});
```

### LangChain / LangGraph

```typescript
import { StateGraph } from '@langchain/langgraph';

const workflow = new StateGraph({
  /* ... */
})
  .addNode('step1', async (state) => {
    const prompt = strategy.current(state);
    return { result: await llm.invoke(prompt.asString()) };
  })
  .addNode('step2', async (state) => {
    const prompt = strategy.next(state);
    return { result: await llm.invoke(prompt.asString()) };
  });
```

---

## Best Practices

### 1. Reset Between Runs

```typescript
// ✅ Good: Reset for each new input
async function processRequest(input) {
  strategy.reset();
  // ... execute strategy
}

// ❌ Bad: Reusing without reset
async function processRequest(input) {
  // State persists from previous run!
  const prompt = strategy.current(input);
}
```

### 2. Check Completion

```typescript
while (!strategy.completed) {
  const prompt = strategy.next(data);
  const response = await llm.invoke(prompt.asString());
  // ... handle response
}
```

### 3. Handle Last Step

```typescript
if (strategy.completed) {
  console.log('Strategy complete, no more steps');
} else {
  const nextPrompt = strategy.next(data);
}
```

---

## FAQ

**Q: What happens if I call `next()` at the last step?**  
A: Returns `null`. Use `strategy.completed` to check.

**Q: Can I skip steps?**  
A: No, strategies enforce sequential execution.

**Q: Can I go backwards?**  
A: Use `reset()` to start over, or access `getStep(index)` for specific steps.

**Q: How do I handle branching logic?**  
A: Create multiple strategies for different paths, or use conditional composition arrays.
