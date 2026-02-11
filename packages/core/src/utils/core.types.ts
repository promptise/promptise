import type { OptimizationMetadata } from '../component/optimizer/types.js';

// Re-export for convenience
export type { OptimizationMetadata };

/**
 * Standard message format for chat-based LLM APIs.
 * Compatible with OpenAI, Anthropic, Google, and most other providers.
 *
 * @property role - The role of the message sender
 * @property content - The text content of the message
 *
 * @example
 * ```typescript
 * const messages: ChatMessage[] = [
 *   { role: "system", content: "You are a helpful assistant." },
 *   { role: "user", content: "What is TypeScript?" }
 * ];
 * ```
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Token pricing configuration for cost tracking.
 *
 * @property inputTokenPrice - Price per input token (required)
 * @property outputTokenPrice - Price per output token (optional)
 * @property currency - Currency code (always "USD")
 *
 * @remarks
 * Thinking/reasoning tokens (e.g., GPT-o1, Gemini Thinking) are billed
 * as output tokens by all providers. Include them in `outputTokenPrice`.
 *
 * For current pricing, refer to official provider documentation:
 * - OpenAI: https://openai.com/api/pricing/
 * - Anthropic: https://www.anthropic.com/pricing
 * - Google: https://ai.google.dev/pricing
 *
 * @example
 * ```typescript
 * import type { CostConfig } from "@promptise/core";
 *
 * // GPT-4o pricing (check OpenAI for current rates)
 * const gpt4o: CostConfig = {
 *   inputTokenPrice: 0.0000025,  // $2.50 / 1M tokens
 *   outputTokenPrice: 0.00001,   // $10 / 1M tokens
 *   currency: "USD"
 * };
 *
 * // Claude 3.5 Sonnet (check Anthropic for current rates)
 * const claude: CostConfig = {
 *   inputTokenPrice: 0.000003,   // $3 / 1M tokens
 *   outputTokenPrice: 0.000015,  // $15 / 1M tokens
 *   currency: "USD"
 * };
 * ```
 */
export interface CostConfig {
  inputTokenPrice: number;
  outputTokenPrice?: number;
  currency: 'USD';
}

/**
 * Token count and cost breakdown for a specific token type.
 *
 * @property tokens - Number of tokens
 * @property cost - Cost in USD
 */
export interface CostBreakdown {
  tokens: number;
  cost: number;
}

/**
 * Complete cost tracking information for a prompt composition.
 *
 * @property input - Input tokens and cost (always present after build)
 * @property output - Output tokens and cost (present after updateCost)
 * @property total - Total cost in USD (sum of input + output)
 * @property currency - Currency code (always "USD")
 *
 * @remarks
 * The `output` field includes thinking/reasoning tokens for models like GPT-o1.
 * Providers bill these at the same rate as regular output tokens.
 *
 * @example
 * ```typescript
 * const prompt = composition.build(data);
 *
 * // Initial state (only input cost)
 * console.log(prompt.metadata.cost);
 * // {
 * //   input: { tokens: 245, cost: 0.000613 },
 * //   total: 0.000613,
 * //   currency: "USD"
 * // }
 *
 * // After LLM response
 * prompt.updateCost({ outputTokens: 150 });
 * console.log(prompt.metadata.cost);
 * // {
 * //   input: { tokens: 245, cost: 0.000613 },
 * //   output: { tokens: 150, cost: 0.0015 },
 * //   total: 0.002113,
 * //   currency: "USD"
 * // }
 * ```
 */
export interface CostMetadata {
  input: CostBreakdown;
  output?: CostBreakdown;
  total: number;
  currency: 'USD';
}

/**
 * Metadata about a single component's rendering and cost.
 *
 * @property key - The semantic key of the component
 * @property tokens - Number of input tokens for this component
 * @property cost - Input cost in USD (if cost tracking enabled)
 * @property optimization - Optimization statistics (if optimizer configured)
 *
 * @remarks
 * Only input costs are tracked at component level. Output costs cannot be
 * accurately attributed to individual components.
 */
export interface ComponentMetadata {
  key: string;
  tokens: number;
  cost?: number;
  optimization?: OptimizationMetadata;
}

/**
 * A fully built and validated prompt instance, ready for LLM consumption.
 *
 * @remarks
 * This is the final output of `composition.build()`. It provides:
 * - Multiple output formats (string, messages)
 * - Cost tracking with `updateCost()`
 * - Comprehensive metadata (tokens, components, costs)
 *
 * @example
 * ```typescript
 * const prompt = composition.build({ role: "assistant", task: "help users" });
 *
 * // Use with completion APIs
 * const text = prompt.asString();
 *
 * // Use with chat APIs
 * const messages = prompt.asMessages();
 *
 * // Track costs
 * const response = await openai.chat.completions.create({ messages });
 * prompt.updateCost({ outputTokens: response.usage.completion_tokens });
 * console.log(prompt.metadata.cost.total); // Total cost in USD
 * ```
 */
export interface UniversalPromptInstance {
  /**
   * Returns the complete prompt as a single string.
   *
   * @returns The fully rendered prompt text
   *
   * @remarks
   * Ideal for completion models or frameworks that expect single text input.
   */
  asString(): string;

  /**
   * Returns the prompt as an array of structured chat messages.
   *
   * @returns Array of chat messages with role and content
   *
   * @remarks
   * Standard format for chat models (OpenAI, Anthropic, Google, etc.).
   */
  asMessages(): ChatMessage[];

  /**
   * Updates cost metadata with actual output token usage from LLM response.
   *
   * @param usage - Token usage from the LLM API response
   * @param usage.outputTokens - Number of output tokens (includes reasoning/thinking)
   * @returns Updated metadata object
   *
   * @throws Error if no cost configuration was provided to the composition
   *
   * @remarks
   * For models with thinking/reasoning capabilities (GPT-o1, Gemini Thinking),
   * the `outputTokens` should include all output tokens. Providers bill
   * reasoning tokens at the same rate as regular output tokens.
   *
   * @example
   * ```typescript
   * const prompt = composition.build(data);
   *
   * // OpenAI response
   * const response = await openai.chat.completions.create({ messages: prompt.asMessages() });
   * prompt.updateCost({ outputTokens: response.usage.completion_tokens });
   *
   * // For o1 models, completion_tokens already includes reasoning
   * const o1Response = await openai.chat.completions.create({ model: "o1-preview", ... });
   * prompt.updateCost({ outputTokens: o1Response.usage.completion_tokens });
   * ```
   */
  updateCost(usage: { outputTokens: number }): UniversalPromptInstance['metadata'];

  /**
   * Metadata about the built prompt instance.
   *
   * @property id - Unique ID of the composition that generated this instance
   * @property tokenCount - Estimated token count of the rendered prompt
   * @property inputData - The data used to build this instance
   * @property cost - Cost tracking information (if cost config provided)
   * @property components - Per-component metadata with tokens and costs
   */
  readonly metadata: {
    id: string;
    tokenCount: number;
    inputData: Record<string, unknown>;
    cost?: CostMetadata;
    components: ComponentMetadata[];
  };
}
