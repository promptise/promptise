# Integrations

> **Use Promptise with popular AI frameworks and providers.**

Promptise is framework-agnostic and works seamlessly with OpenAI, Anthropic, LangChain, Mastra AI, and any LLM provider.

---

## OpenAI

> **Use Promptise with OpenAI's API.**

### Installation

```bash
npm install @promptise/core openai
```

### Quick Start

```typescript
import OpenAI from 'openai';
import { createPromptComposition, createPromptComponent } from '@promptise/core';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create prompt
const prompt = createPromptComposition({
  id: 'assistant',
  components: [
    createPromptComponent({
      key: 'role',
      schema: z.object({ role: z.string() }),
      template: 'You are a {{role}}.',
    }),
    createPromptComponent({
      key: 'task',
      schema: z.object({ task: z.string() }),
      template: 'Task: {{task}}',
    }),
  ],
  cost: {
    // GPT-5 pricing
    inputTokenPrice: 0.000005, // $5 / 1M tokens
    outputTokenPrice: 0.000015, // $15 / 1M tokens
    currency: 'USD',
  },
});

// Build with automatic cost tracking
const instance = prompt.build({
  role: 'helpful assistant',
  task: 'Analyze this data',
});

console.log(`Input tokens: ${instance.metadata.tokenCount}`);
console.log(`Input cost: $${instance.metadata.cost.input.cost.toFixed(6)}`);

// Use with chat completions
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: instance.asString() }],
});

// Update with output tokens
instance.updateCost({ outputTokens: completion.usage?.completion_tokens ?? 0 });
console.log(`Total cost: $${instance.metadata.cost.total.toFixed(6)}`);

console.log(completion.choices[0].message.content);
```

---

### Chat Completions

#### Single Message

```typescript
const prompt = createPromptComposition({
  id: 'single-message',
  components: [roleComp, taskComp],
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: prompt.build(data).asString() }],
});
```

#### Multi-Message with Message Mapping

```typescript
const chatPrompt = createPromptComposition({
  id: 'few-shot',
  components: [systemComp, exampleUserComp, exampleAssistantComp, userComp],
  messageRoles: {
    system: 'system',
    'example-user': 'user',
    'example-assistant': 'assistant',
    user: 'user',
  },
});

// Get properly formatted messages
const messages = chatPrompt
  .build({
    system: 'You are a classifier',
    exampleUser: 'Input: positive review',
    exampleAssistant: 'Output: POSITIVE',
    user: 'Input: terrible experience',
  })
  .asMessages();

const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: messages,
});
```

---

### Streaming Responses

```typescript
const prompt = createPromptComposition({
  id: 'streaming',
  components: [roleComp, taskComp],
});

const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: prompt.build(data).asString() }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

---

### Cost Tracking with o1 Models

```typescript
import type { CostConfig } from "@promptise/core";

const O1_PRICING: CostConfig = {
  inputTokenPrice: 0.000015,  // $15 / 1M tokens
  outputTokenPrice: 0.00006,  // $60 / 1M tokens (includes reasoning)
  currency: 'USD',
};

const composition = createPromptComposition({
  id: "reasoning-task",
  components: [taskComp],
  cost: O1_PRICING, // o1 model pricing
});

const instance = composition.build(data);

const response = await openai.chat.completions.create({
  model: \"o1-preview\",\n  messages: [{ role: \"user\", content: instance.asString() }],
});

// o1 models include reasoning tokens in completion_tokens
const outputTokens = response.usage?.completion_tokens ?? 0;

instance.updateCost({ outputTokens });

console.log(`Total cost: $${instance.metadata.cost.total.toFixed(6)}`);
```

---

### Function Calling

```typescript
const functionPrompt = createPromptComposition({
  id: 'function-caller',
  components: [
    createPromptComponent({
      key: 'role',
      template: 'You are a data analyst with access to analysis tools.',
    }),
    createPromptComponent({
      key: 'task',
      schema: z.object({ query: z.string() }),
      template: 'User query: {{query}}',
    }),
  ],
});

const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    {
      role: 'user',
      content: functionPrompt.build({ query: 'Analyze sales' }).asString(),
    },
  ],
  functions: [
    {
      name: 'analyze_data',
      description: 'Analyzes datasets',
      parameters: {
        type: 'object',
        properties: {
          dataset: { type: 'string' },
          metrics: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  ],
});
```

---

### OpenAI Best Practices

#### 1. Use Message Mapping for Few-Shot

```typescript
const fewShotPrompt = createPromptComposition({
  id: 'classifier',
  components: [
    systemComp,
    example1UserComp,
    example1AssistantComp,
    example2UserComp,
    example2AssistantComp,
    actualUserComp,
  ],
  messageRoles: {
    system: 'system',
    'example1-user': 'user',
    'example1-assistant': 'assistant',
    'example2-user': 'user',
    'example2-assistant': 'assistant',
    'actual-user': 'user',
  },
});

const messages = fewShotPrompt.build(data).asMessages();
```

#### 2. Track Costs in Production

```typescript
const instance = prompt.build(data);

const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: instance.asString() }],
});

instance.updateCost({ outputTokens: completion.usage?.completion_tokens ?? 0 });

// Log to monitoring
logger.info('LLM Call', {
  inputTokens: instance.metadata.tokenCount,
  outputTokens: completion.usage?.completion_tokens,
  totalCost: instance.metadata.cost.total,
  model: 'gpt-4o',
});
```

#### 3. Handle Errors Gracefully

```typescript
try {
  const instance = prompt.build(data); // May throw validation errors

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: instance.asString() }],
  });
} catch (error) {
  if (error.code === 'context_length_exceeded') {
    console.error('Prompt too long for model');
  } else {
    console.error('Error:', error.message);
  }
}
```

---

### OpenAI Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)

---

## LangChain

> **Use Promptise with LangChain and LangGraph.**

### Installation

```bash
npm install @promptise/core @langchain/core @langchain/openai
```

### Quick Start

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { createPromptComposition, createPromptComponent } from '@promptise/core';
import { z } from 'zod';

const llm = new ChatOpenAI({ model: 'gpt-4o' });

// Create prompt with Promptise
const prompt = createPromptComposition({
  id: 'assistant',
  components: [
    createPromptComponent({
      key: 'role',
      schema: z.object({ role: z.string() }),
      template: 'You are a {{role}}.',
    }),
    createPromptComponent({
      key: 'task',
      schema: z.object({ task: z.string() }),
      template: 'Task: {{task}}',
    }),
  ],
});

// Use with LangChain
const messages = prompt
  .build({
    role: 'helpful assistant',
    task: 'Analyze this data',
  })
  .asMessages();

const result = await llm.invoke(messages);
console.log(result.content);
```

---

### Chat Models

#### With Message Mapping

```typescript
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

const chatPrompt = createPromptComposition({
  id: 'few-shot',
  components: [systemComp, exampleUserComp, exampleAssistantComp, userComp],
  messageRoles: {
    system: 'system',
    'example-user': 'user',
    'example-assistant': 'assistant',
    user: 'user',
  },
});

const messages = chatPrompt.build(data).asMessages();

// Convert to LangChain message format if needed
const langchainMessages = messages.map((msg) => {
  switch (msg.role) {
    case 'system':
      return new SystemMessage(msg.content);
    case 'user':
      return new HumanMessage(msg.content);
    case 'assistant':
      return new AIMessage(msg.content);
  }
});

const result = await llm.invoke(langchainMessages);
```

---

### LangGraph Integration

```typescript
import { StateGraph } from '@langchain/langgraph';
import { createPromptStrategy } from '@promptise/core';

// Create multi-step strategy
const researchStrategy = createPromptStrategy({
  id: 'research-workflow',
  steps: [analysisComposition, synthesisComposition, conclusionComposition],
});

// Define state
interface ResearchState {
  topic: string;
  analysis?: string;
  synthesis?: string;
  conclusion?: string;
}

// Build workflow
const workflow = new StateGraph<ResearchState>({
  channels: {
    topic: null,
    analysis: null,
    synthesis: null,
    conclusion: null,
  },
})
  .addNode('analyze', async (state) => {
    const prompt = researchStrategy.current({ topic: state.topic });
    const result = await llm.invoke(prompt.asMessages());
    return { analysis: result.content };
  })
  .addNode('synthesize', async (state) => {
    const prompt = researchStrategy.next({
      topic: state.topic,
      analysis: state.analysis,
    });
    const result = await llm.invoke(prompt.asMessages());
    return { synthesis: result.content };
  })
  .addNode('conclude', async (state) => {
    const prompt = researchStrategy.next({
      analysis: state.analysis,
      synthesis: state.synthesis,
    });
    const result = await llm.invoke(prompt.asMessages());
    return { conclusion: result.content };
  })
  .addEdge('analyze', 'synthesize')
  .addEdge('synthesize', 'conclude');

// Execute
const result = await workflow.invoke({ topic: 'Quantum Computing' });
console.log(result.conclusion);
```

---

### Chains

```typescript
import { RunnableSequence } from '@langchain/core/runnables';

const prompt = createPromptComposition({
  id: 'chain-step',
  components: [roleComp, taskComp],
});

const chain = RunnableSequence.from([
  // Step 1: Format input
  (input) => {
    return prompt.build({ role: input.role, task: input.task }).asMessages();
  },
  // Step 2: LLM
  llm,
  // Step 3: Parse output
  (output) => output.content,
]);

const result = await chain.invoke({
  role: 'data analyst',
  task: 'Analyze trends',
});
```

---

### Streaming

```typescript
const prompt = createPromptComposition({
  id: 'streaming',
  components: [roleComp, taskComp],
});

const messages = prompt.build(data).asMessages();

const stream = await llm.stream(messages);

for await (const chunk of stream) {
  process.stdout.write(chunk.content);
}
```

---

### LangChain Best Practices

#### 1. Use Message Mapping for Chat

```typescript
// ✅ Good: Proper message roles
const chatPrompt = createPromptComposition({
  id: 'chat',
  components: [systemComp, userComp],
  messageRoles: {
    system: 'system',
    user: 'user',
  },
});

const messages = chatPrompt.build(data).asMessages();
await llm.invoke(messages);
```

#### 2. Combine with LangGraph for Complex Workflows

```typescript
// Use Promptise strategies with LangGraph nodes
const workflow = new StateGraph({
  /* ... */
})
  .addNode('step1', async (state) => {
    const prompt = strategy.current(state);
    return { result: await llm.invoke(prompt.asMessages()) };
  })
  .addNode('step2', async (state) => {
    const prompt = strategy.next(state);
    return { result: await llm.invoke(prompt.asMessages()) };
  });
```

#### 3. Pattern Validation for Reliability

```typescript
import { createCompositionPattern } from '@promptise/core';

const pattern = createCompositionPattern({
  name: 'LangChainAgent',
  components: [
    { key: 'role', validation: { required: ['assistant', 'tools'] } },
    { key: 'tools', validation: { required: ['available'] } },
  ],
});

const agentPrompt = createPromptComposition({
  id: 'validated-agent',
  components: [roleComp, toolsComp],
  pattern: pattern,
});
```

---

### LangChain Resources

- [LangChain Documentation](https://js.langchain.com/docs)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraphjs/)

---

## Mastra AI

> **Use Promptise with Mastra AI agents and workflows.**

[Mastra AI](https://mastra.ai) is a TypeScript framework for building AI agents and workflows.

### Installation

```bash
npm install @promptise/core @mastra/core
```

### Quick Start

```typescript
import { Agent } from '@mastra/core/agent';
import { vertex } from '@ai-sdk/google-vertex';
import { createPromptComposition, createPromptComponent } from '@promptise/core';
import { z } from 'zod';

// Create prompt composition
const medicalPrompt = createPromptComposition({
  id: 'medical-assistant',
  components: [
    createPromptComponent({
      key: 'role',
      schema: z.object({ specialty: z.string() }),
      template: 'You are a clinical AI assistant specializing in {{specialty}}.',
    }),
    createPromptComponent({
      key: 'rules',
      template: `Follow these guidelines:
- Maintain HIPAA compliance
- Do not diagnose or prescribe
- Provide information only`,
    }),
  ],
});

// Use with Mastra Agent
const medicalAgent = new Agent({
  name: 'medical-assistant',
  model: () => vertex('gemini-2.0-flash'),
  instructions: medicalPrompt.build({ specialty: 'cardiology' }).asString(),
});

// Execute agent
const result = await medicalAgent.generate('Analyze this ECG data...');
console.log(result.text);
```

---

### Agent Instructions

#### Static Instructions

```typescript
const prompt = createPromptComposition({
  id: 'static-agent',
  components: [roleComp, rulesComp, formatComp],
});

const agent = new Agent({
  name: 'my-agent',
  model: () => vertex('gemini-2.0-flash'),
  instructions: prompt.build(config).asString(),
});
```

#### Dynamic Instructions

```typescript
function createAgentWithContext(context) {
  const prompt = createPromptComposition({
    id: 'dynamic-agent',
    components: [roleComp, contextComp, taskComp],
  });

  return new Agent({
    name: 'contextual-agent',
    model: () => vertex('gemini-2.0-flash'),
    instructions: prompt
      .build({
        role: context.role,
        context: context.data,
        task: context.task,
      })
      .asString(),
  });
}
```

---

### Multi-Agent Workflows

```typescript
import { createPromptStrategy } from '@promptise/core';

// Create strategy for multi-step reasoning
const researchStrategy = createPromptStrategy({
  id: 'research-workflow',
  steps: [analysisComposition, hypothesisComposition, conclusionComposition],
});

// Agent 1: Researcher
const researcher = new Agent({
  name: 'researcher',
  model: () => vertex('gemini-2.0-flash'),
  async execute(input) {
    researchStrategy.reset();

    const analysis = await this.model.generate(
      researchStrategy.current({ topic: input.topic }).asString(),
    );

    return { analysis: analysis.text };
  },
});

// Agent 2: Critic
const critic = new Agent({
  name: 'critic',
  model: () => vertex('gemini-2.0-flash'),
  async execute(input) {
    const critique = await this.model.generate(
      researchStrategy.next({ analysis: input.analysis }).asString(),
    );

    return { critique: critique.text };
  },
});

// Orchestrate
const researchResult = await researcher.execute({ topic: 'Quantum Computing' });
const critiqueResult = await critic.execute(researchResult);
```

---

### Pattern Validation for Agents

```typescript
import { createCompositionPattern } from '@promptise/core';

// Custom pattern for medical agents
const medicalPattern = createCompositionPattern({
  name: 'MedicalAgent',
  components: [
    {
      key: 'role',
      validation: {
        required: ['clinical', 'AI assistant'],
        maxTokens: 100,
      },
    },
    {
      key: 'compliance',
      validation: {
        required: ['HIPAA', 'PHI'],
        forbidden: ['diagnose', 'prescribe'],
      },
    },
  ],
});

const medicalPrompt = createPromptComposition({
  id: 'compliant-agent',
  components: [roleComp, complianceComp, taskComp],
  pattern: medicalPattern, // Validates compliance
});

const agent = new Agent({
  name: 'medical-agent',
  model: () => vertex('gemini-2.0-flash'),
  instructions: medicalPrompt.build(data).asString(), // Throws if validation fails
});
```

---

### Mastra Best Practices

#### 1. Validate Agent Instructions

```typescript
// Add pattern validation to catch errors early
const agentPrompt = createPromptComposition({
  id: 'validated-agent',
  components: [roleComp, rulesComp],
  pattern: myPattern,
});

try {
  const instructions = agentPrompt.build(config).asString();
  const agent = new Agent({ /* ... */ instructions });
} catch (error) {
  console.error('Invalid agent configuration:', error.message);
}
```

#### 2. Reuse Prompts Across Agents

```typescript
// Create shared prompt library
const agentPrompts = {
  medical: createPromptComposition({
    /* ... */
  }),
  legal: createPromptComposition({
    /* ... */
  }),
  technical: createPromptComposition({
    /* ... */
  }),
};

// Use across multiple agents
const medicalAgent = new Agent({
  name: 'medical',
  instructions: agentPrompts.medical.build(config).asString(),
});
```

#### 3. Dynamic Agent Creation

```typescript
function createSpecializedAgent(domain: string, config: any) {
  const prompt = createPromptComposition({
    id: `${domain}-agent`,
    components: getDomainComponents(domain),
  });

  return new Agent({
    name: `${domain}-specialist`,
    model: () => vertex('gemini-2.0-flash'),
    instructions: prompt.build(config).asString(),
  });
}
```

---

### Mastra Resources

- [Mastra AI Documentation](https://docs.mastra.ai)
