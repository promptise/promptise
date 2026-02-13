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
 * Build options for prompt composition rendering.
 *
 * @property context - Optional runtime context propagated to all components
 *
 * @example
 * ```typescript
 * const prompt = composition.build(data, {
 *   context: { locale: "es", environment: "production" }
 * });
 * ```
 */
export interface BuildOptions {
  context?: Record<string, unknown>;
}

/**
 * Metadata about a single component's rendering.
 *
 * @property key - The semantic key of the component
 * @property estimatedTokens - Estimated number of input tokens for this component
 * @property optimization - Optimization statistics (if optimizer configured)
 */
export interface ComponentMetadata {
  key: string;
  estimatedTokens: number;
  optimization?: OptimizationMetadata;
}

/**
 * A fully built and validated prompt instance, ready for LLM consumption.
 *
 * @remarks
 * This is the final output of `composition.build()`. It provides:
 * - Multiple output formats (string, messages)
 * - Comprehensive metadata (estimated token counts and components)
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
   * Metadata about the built prompt instance.
   *
   * @property id - Unique ID of the composition that generated this instance
   * @property estimatedTokens - Estimated token count of the rendered prompt
   * @property inputData - The data used to build this instance
   * @property components - Per-component metadata with estimated token counts
   */
  readonly metadata: {
    id: string;
    estimatedTokens: number;
    inputData: Record<string, unknown>;
    components: ComponentMetadata[];
  };
}
