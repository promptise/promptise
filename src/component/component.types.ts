import { z, ZodObject, ZodRawShape } from 'zod';
import type { OptimizerConfig, OptimizationMetadata } from './optimizer/types.js';
import type { ContentValidation } from '../composition/pattern/types.js';

/**
 * Result returned by component.render()
 * Contains the rendered content and metadata about optimization.
 */
export interface ComponentRenderResult {
  /**
   * The rendered string content of the component.
   */
  content: string;

  /**
   * Metadata about the render operation.
   */
  metadata: {
    /**
     * Optimization statistics (only present if optimizer is configured).
     * Includes original vs optimized token counts, reduction percentage, and which keys were optimized.
     */
    optimization?: OptimizationMetadata;
  };
}

/**
 * Parameters passed to template functions when rendering a component.
 *
 * @template TSchema - The Zod shape defining the component's input structure
 */
export interface TemplateFunctionParams<TSchema extends ZodRawShape> {
  /**
   * Validated input data matching the component's schema.
   * Type is inferred from the schema definition.
   *
   * @example
   * // Schema: z.object({ role: z.string(), expertise: z.array(z.string()) })
   * // input: { role: 'doctor', expertise: ['cardiology'] }
   */
  input: z.infer<ZodObject<TSchema>>;

  /**
   * TOON-optimized strings for array/object fields (when optimizer enabled).
   * Keys match input field names that were optimized.
   * Empty object if optimizer is not configured or no fields were optimized.
   *
   * @example
   * // Input: { users: [{ id: 1, name: 'Alice' }] }
   * // Optimized: { users: '[1]{id,name}:\n  1,Alice' }
   */
  optimized: Record<string, string>;

  /**
   * Optional context object propagated from composition.
   * Use for shared data across components (theme, locale, metadata, etc).
   *
   * @example
   * // Access context in template:
   * template: ({ input, context }) => {
   *   const locale = context?.locale ?? 'en';
   *   return locale === 'es' ? `Hola ${input.name}` : `Hello ${input.name}`;
   * }
   */
  context?: Record<string, unknown>;
}

/**
 * Function template signature for dynamic prompt rendering.
 * Receives validated input, optimized data, and optional context.
 *
 * @template TSchema - The Zod shape defining the component's input structure
 * @returns The rendered string content
 *
 * @example
 * const template: TemplateFunction<{ name: z.string() }> = ({ input }) => {
 *   return `Hello, ${input.name}!`;
 * };
 */
export type TemplateFunction<TSchema extends ZodRawShape> = (
  params: TemplateFunctionParams<TSchema>,
) => string;

/**
 * @interface PromptComponentConfig
 * Defines the configuration object required to create a new PromptComponent.
 */
export interface PromptComponentConfig<TSchema extends ZodRawShape = ZodRawShape> {
  /**
   * A unique semantic key for the component (e.g., 'role', 'task', 'rules').
   * This key is used for component identification and strategy validation.
   * @required
   */
  key: string;

  /**
   * A Zod schema that defines and validates the input variables needed by the template.
   * Optional - if not provided, defaults to an empty object schema.
   */
  schema?: ZodObject<TSchema>;

  /**
   * The prompt's template. Can be:
   * - String: Simple `{{variable}}` interpolation
   * - Function: Dynamic logic with access to input, optimized data, and context
   *
   * @example
   * // String template
   * template: 'You are a {{role}}'
   *
   * // Function template
   * template: ({ input, optimized, context }) => {
   *   return `Role: ${input.role}`;
   * }
   */
  template: string | TemplateFunction<TSchema>;

  /**
   * Optional optimizer configuration for token-efficient serialization
   * @see OptimizerConfig
   */
  optimizer?: OptimizerConfig;

  /**
   * Optional content validation rules for the rendered output.
   * Validates the component's content after rendering.
   * Executes independently before pattern-level validation (cascade validation).
   *
   * @remarks
   * Component validation is intrinsic and always active when defined.
   * Pattern validation (if provided) runs after and is independent.
   * Both validations must pass (AND logic).
   *
   * @example
   * validation: {
   *   required: ['HIPAA', 'compliant'],
   *   forbidden: ['diagnose', 'prescribe'],
   *   maxTokens: 100
   * }
   */
  validation?: ContentValidation;

  /**
   * A brief description of the component's purpose. Useful for documentation.
   * @optional
   */
  description?: string;
}

/**
 * @interface PromptComponent
 * Represents a reusable, atomic piece of a prompt.
 * This is the object returned by the `createPromptComponent` factory function.
 * Extends the configuration with readonly properties and adds validation/rendering methods.
 */
export interface PromptComponent<TSchema extends ZodRawShape = ZodRawShape> extends Readonly<
  PromptComponentConfig<TSchema>
> {
  /**
   * The Zod schema that defines the component's input variables.
   * Always defined (defaults to empty object schema if not provided in config).
   * @override Makes schema required (vs optional in config)
   */
  readonly schema: ZodObject<TSchema>;

  /**
   * Optional content validation rules.
   * Inherited from config, validated during render().
   */
  readonly validation?: ContentValidation;

  /**
   * Renders the component with validated data and returns result with metadata.
   *
   * **Called internally by `composition.build()`**
   *
   * You typically don't need to call this directly in production code.
   * The recommended workflow is:
   * 1. Create components with `createPromptComponent()`
   * 2. Compose them with `createPromptComposition()`
   * 3. Build with `composition.build()` ← **Use this in production**
   *
   * **When to use `render()` directly:**
   * - Unit testing individual component output and optimization
   * - Debugging component rendering logic and token reduction
   * - A/B testing different optimizer configurations
   * - Using a standalone component without composition (rare)
   *
   * @param data - Input data matching the component's schema
   * @param context - Optional context for cross-component data sharing
   * @returns Object with rendered content and metadata (optimization stats if optimizer configured)
   * @throws Error with formatted validation message if data is invalid
   *
   * @example
   * // ✅ Testing/Debugging
   * const result = component.render({ role: 'doctor' });
   * console.log(result.content); // "You are a doctor."
   * console.log(result.metadata.optimization?.reduction); // 0 (no optimization)
   *
   * // ✅ Testing optimization
   * const result = componentWithOptimizer.render({ users: [...] });
   * console.log(result.metadata.optimization?.reduction); // 60.5
   * console.log(result.metadata.optimization?.keysOptimized); // ['users']
   *
   * // ✅ Error handling in tests
   * expect(() => component.render(invalidData)).toThrow();
   *
   * // ✅ Production (recommended)
   * const composition = createPromptComposition({
   *   components: [roleComp, taskComp, rulesComp]
   * });
   * const prompt = composition.build(data);
   */
  render(
    data: z.infer<ZodObject<TSchema>>,
    context?: Record<string, unknown>,
  ): ComponentRenderResult;
}
