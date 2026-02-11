import { z, ZodObject, ZodRawShape } from 'zod';
import {
  PromptComponent,
  PromptComponentConfig,
  ComponentRenderResult,
} from './component.types.js';
import { formatValidationError } from '../utils/errors/index.js';
import { optimizeInput, type OptimizationMetadata } from './optimizer/index.js';
import { validateComponentContent } from '../composition/pattern/composition-pattern.validator.js';

/**
 * Validates that a component key follows the required format.
 * Keys must start with a letter and contain only alphanumeric characters, hyphens, or underscores.
 *
 * @param key - The component key to validate
 * @throws {Error} When key format is invalid (doesn't match /^[a-z][a-z0-9-_]*$/i)
 *
 * @example
 * validateComponentKey('user'); // ✓ Valid
 * validateComponentKey('user-profile'); // ✓ Valid
 * validateComponentKey('123-invalid'); // ✗ Throws - starts with number
 * validateComponentKey('user@name'); // ✗ Throws - contains @
 *
 * @internal
 */
function validateComponentKey(key: string): void {
  const validKeyPattern = /^[a-z][a-z0-9-_]*$/i;

  if (!validKeyPattern.test(key)) {
    throw new Error(
      `Invalid component key "${key}". ` +
        `Keys must start with a letter and contain only letters, numbers, hyphens, or underscores. ` +
        `Examples: "user", "user-profile", "user_settings", "UserInfo"`,
    );
  }
}

/**
 * A simple template renderer that replaces `{{variable}}` style placeholders.
 * Supports both {{input.key}} and {{optimized.key}} syntax.
 * @param template The template string.
 * @param data The input data object.
 * @param optimized The TOON-optimized strings.
 * @returns The rendered string.
 * @internal
 */
function _renderSimpleTemplate(
  template: string,
  data: Record<string, unknown>,
  optimized: Record<string, string>,
): string {
  let result = template;

  // Replace {{optimized.key}} placeholders
  Object.keys(optimized).forEach((key) => {
    const regex = new RegExp(`{{\\s*optimized\\.${key}\\s*}}`, 'g');
    result = result.replace(regex, optimized[key] ?? '');
  });

  // Replace {{input.key}} and {{key}} placeholders (backward compatible)
  Object.keys(data).forEach((key) => {
    const inputRegex = new RegExp(`{{\\s*input\\.${key}\\s*}}`, 'g');
    const simpleRegex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    // Handle undefined/null gracefully - render as empty string instead of "undefined"/"null"
    const rawValue = data[key];
    let value: string;
    if (rawValue == null) {
      value = '';
    } else if (typeof rawValue === 'object') {
      value = JSON.stringify(rawValue);
    } else {
      // At this point, rawValue is string | number | boolean | symbol | bigint
      // Safe to convert to string without Object stringification
      value = String(rawValue as string | number | boolean);
    }
    result = result.replace(inputRegex, value);
    result = result.replace(simpleRegex, value);
  });

  return result;
}

/**
 * Factory function to create a type-safe, reusable prompt component.
 *
 * Components are the atomic building blocks of Promptise. They encapsulate:
 * - Input validation via Zod schemas
 * - Template rendering (string or function-based)
 * - Optional TOON optimization for token efficiency
 * - Metadata tracking for optimization stats
 *
 * @template TSchema - Zod shape defining the component's input structure
 *
 * @param config - Component configuration object
 * @returns A PromptComponent instance with render() method and readonly properties
 *
 * @throws {Error} When component key format is invalid (must match /^[a-z][a-z0-9-_]*$/i)
 *
 * @example
 * // String template with validation
 * const roleComp = createPromptComponent({
 *   key: 'role',
 *   schema: z.object({ role: z.string() }),
 *   template: 'You are a {{role}}.'
 * });
 *
 * @example
 * // Function template with optimization
 * const usersComp = createPromptComponent({
 *   key: 'users',
 *   schema: z.object({ users: z.array(z.object({ id: z.number(), name: z.string() })) }),
 *   template: ({ input, optimized }) => `Users:\n${optimized.users || JSON.stringify(input.users)}`,
 *   optimizer: { toon: true }
 * });
 *
 * @example
 * // With context propagation
 * const greetComp = createPromptComponent({
 *   key: 'greeting',
 *   schema: z.object({ name: z.string() }),
 *   template: ({ input, context }) => {
 *     const locale = context?.locale ?? 'en';
 *     return locale === 'es' ? `Hola ${input.name}` : `Hello ${input.name}`;
 *   }
 * });
 */
export function createPromptComponent<TSchema extends ZodRawShape>(
  config: PromptComponentConfig<TSchema>,
): PromptComponent<TSchema> {
  // Validate component key format
  validateComponentKey(config.key);

  // Destructure for easier access and to form the returned object.
  // If no schema provided, default to empty object schema
  const {
    key,
    schema = z.object({}) as ZodObject<TSchema>,
    template,
    optimizer,
    validation,
    description,
  } = config;

  return {
    // --- Properties ---
    key,
    schema,
    template,
    optimizer,
    validation,
    description,

    // --- Methods ---
    render(
      data: z.infer<ZodObject<TSchema>>,
      context?: Record<string, unknown>,
    ): ComponentRenderResult {
      // First, ensure data is valid by parsing. This will throw on failure with enhanced error.
      const parseResult = this.schema.safeParse(data);
      if (!parseResult.success) {
        const componentInfo = this.description
          ? `Component "${this.key}" (${this.description})`
          : `Component "${this.key}"`;
        const errorMessage = formatValidationError(parseResult.error, componentInfo);
        throw new Error(errorMessage);
      }
      const validatedData = parseResult.data;

      // Apply TOON optimization if configured and capture metadata
      let optimized: Record<string, string> = {};
      let optimizationMetadata: OptimizationMetadata | undefined;
      if (this.optimizer) {
        const optimizationResult = optimizeInput(validatedData, this.optimizer);
        optimized = optimizationResult.optimized as Record<string, string>;
        optimizationMetadata = optimizationResult.metadata;
      }

      // Render template
      let content: string;
      if (typeof this.template === 'function') {
        content = this.template({ input: validatedData, optimized, context });
      } else {
        content = _renderSimpleTemplate(this.template, validatedData, optimized);
      }

      // Validate content if validation rules are defined
      if (this.validation) {
        const validationResult = validateComponentContent(
          this.key,
          this.key,
          content,
          this.validation,
        );

        // Throw on errors (warnings are logged but don't block)
        const errors = validationResult.errors.filter((e) => e.type === 'error');
        if (errors.length > 0) {
          const errorMessages = errors.map((e) => `  - ${e.message}`).join('\n');
          throw new Error(
            `[Promptise] Component "${this.key}" content validation failed:\n${errorMessages}`,
          );
        }

        // Log warnings
        const warnings = validationResult.errors.filter((e) => e.type === 'warning');
        if (warnings.length > 0) {
          warnings.forEach((w) => {
            console.warn(`[Promptise] Component "${this.key}" validation warning: ${w.message}`);
          });
        }
      }

      // Return result with metadata
      return {
        content,
        metadata: {
          optimization: optimizationMetadata,
        },
      };
    },
  };
}
