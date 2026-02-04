import { ZodObject } from 'zod';
import { PromptComponent } from '../component/component.types.js';
import { UniversalPromptInstance, CostConfig } from '../core/core.types.js';
import { CompositionPattern } from './pattern/types.js';

/**
 * @typedef MessageRole
 * Valid message roles for chat-based LLM APIs.
 */
export type MessageRole = 'system' | 'user' | 'assistant';

/**
 * @typedef WrapperStyle
 * Defines how component content should be wrapped with structural markers.
 * Useful for LLMs that prefer structured input formats.
 *
 * @example
 * // Custom wrapper with decorative separators
 * componentWrapper: {
 *   before: (key) => `--- ${key.toUpperCase()} ---\n`,
 *   after: (key) => `\n--- END ${key.toUpperCase()} ---`
 * }
 */
export type WrapperStyle =
  | 'none' // No wrapper (plain content)
  | 'xml' // XML-style tags: <key>\ncontent\n</key>
  | 'markdown' // Markdown headers: ## Key\ncontent
  | 'brackets' // Square brackets: [KEY]\ncontent\n[/KEY]
  | {
      // Custom wrapper functions
      before: (key: string) => string;
      after?: (key: string) => string;
    };

/**
 * @interface PromptCompositionConfig
 * Defines the configuration object required to create a PromptComposition.
 * This is the blueprint for a complete, structured prompt.
 */
export interface PromptCompositionConfig {
  /**
   * A unique identifier for the composition.
   * Must start with a letter and contain only alphanumeric characters, hyphens, or underscores.
   * Case-insensitive.
   *
   * @example 'medical-diagnosis' | 'chat-agent' | 'code_review'
   */
  id: string;

  /**
   * The ordered array of components that make up this composition.
   * Each component must have a unique semantic key (e.g., 'role', 'task', 'rules').
   * The framework will use these keys for pattern validation.
   *
   * Note: Uses `any` for component schemas to support heterogeneous component types.
   * The composition will merge and validate all schemas at runtime.
   *
   * Required.
   */
  components: PromptComponent<any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any

  /**
   * Prompt pattern for structural validation.
   * Pass a PromptPattern object created with createPromptPattern().
   *
   * When provided, the framework will validate the composition against the pattern's
   * required components and their order.
   *
   * @example
   * // Using a prebuilt pattern
   * import { RACE_PATTERN } from 'promptise';
   * pattern: RACE_PATTERN
   *
   * @example
   * // Using a custom pattern
   * const myPattern = createCompositionPattern({ ... });
   * pattern: myPattern
   *
   * Optional.
   */
  pattern?: CompositionPattern;

  /**
   * A function that receives the automatically inferred Zod schema from the `components`
   * and allows for its modification. Useful for resolving name collisions,
   * making optional fields required, or adding new composition-level variables.
   *
   * @param inferredSchema - The merged Zod schema automatically inferred from all component schemas
   * @returns A modified Zod schema (must be a superset of the inferred schema to preserve component compatibility)
   *
   * @example
   * augmentSchema: (schema) => schema.extend({
   *   locale: z.enum(['en', 'es']).default('en'),
   *   debug: z.boolean().optional()
   * })
   *
   * Optional.
   */
  augmentSchema?: (inferredSchema: ZodObject<any>) => ZodObject<any>; // eslint-disable-line @typescript-eslint/no-explicit-any

  /**
   * A brief description of the composition's purpose.
   * Optional.
   */
  description?: string;

  /**
   * Wrapper style for component rendering.
   * Wraps each component's content with structural markers for better LLM parsing.
   *
   * - 'none': No wrapper (default, plain content)
   * - 'xml': XML-style tags with multi-line format: <key>\ncontent\n</key>
   * - 'markdown': Markdown headers: ## Key\ncontent
   * - 'brackets': Square brackets: [KEY]\ncontent\n[/KEY]
   * - Custom object: { before: (key) => string, after?: (key) => string }
   *
   * @default 'none'
   */
  componentWrapper?: WrapperStyle;

  /**
   * Component keys mapped to message roles for multi-message output.
   * When provided, asMessages() will generate multiple messages instead of a single system message.
   * @example { role: 'system', task: 'user', examples: 'assistant' }
   */
  messageRoles?: Record<string, MessageRole>;

  /**
   * Cost tracking configuration.
   * Enables automatic cost calculation based on token usage and pricing.
   *
   * @example
   * // GPT-5 pricing
   * cost: {
   *   inputTokenPrice: 0.000005,  // $5 / 1M tokens
   *   outputTokenPrice: 0.000015, // $15 / 1M tokens
   *   currency: 'USD'
   * }
   *
   * Optional.
   */
  cost?: CostConfig;
}

/**
 * @interface PromptComposition
 * Represents the functional object returned by the `createPromptComposition` factory.
 * It's the primary interface for building and inspecting a complete prompt.
 */
export interface PromptComposition extends Readonly<PromptCompositionConfig> {
  /**
   * The inferred or augmented input schema.
   *
   * Useful for understanding what data structure the composition expects,
   * or for integrating with form validation libraries.
   *
   * @example
   * const schema = composition.schema;
   * const isValid = schema.safeParse(data).success;
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Return type must be generic to support heterogeneous component schemas
  readonly schema: ZodObject<any>;

  /**
   * Builds the final prompt instance with rendered content.
   *
   * **This is the main method for production use.**
   *
   * Validates input data, renders all components, applies wrappers,
   * calculates token counts and costs, and returns a complete prompt instance.
   *
   * @param data - Input data matching the composition's schema
   * @param context - Optional context object for cross-component data sharing
   * @returns A UniversalPromptInstance with string and message representations
   * @throws Error with formatted validation message if data is invalid
   *
   * @example
   * const composition = createPromptComposition({
   *   components: [roleComp, taskComp, rulesComp]
   * });
   *
   * const prompt = composition.build({
   *   role: 'doctor',
   *   task: 'analyze lab results'
   * });
   *
   * console.log(prompt.asString());
   * console.log(prompt.metadata.tokenCount);
   */
  build(data: unknown, context?: Record<string, unknown>): UniversalPromptInstance;
}
