import { z, ZodObject } from 'zod';
import { PromptComposition, PromptCompositionConfig, WrapperStyle } from './composition.types.js';
import { PromptComponent } from '../component/component.types.js';
import {
  UniversalPromptInstance,
  CostMetadata,
  ComponentMetadata,
  CostConfig,
  OptimizationMetadata,
} from '../core/core.types.js';
import { CompositionPattern } from './pattern/types.js';
import { countTokens } from '../core/tokenizer/tokenizer.js';
import { formatValidationError } from '../core/errors/errors.js';
import { validateComponentContent, formatValidationErrors } from './pattern/validator.js';

/**
 * Validates that a composition ID follows the required format.
 * IDs must start with a letter and contain only alphanumeric characters, hyphens, or underscores.
 *
 * @param id - The composition ID to validate
 * @throws {Error} When ID format is invalid (doesn't match /^[a-z][a-z0-9-_]*$/i)
 *
 * @example
 * validateCompositionId('medical-diagnosis'); // ✓ Valid
 * validateCompositionId('chat_agent'); // ✓ Valid
 * validateCompositionId('123-invalid'); // ✗ Throws - starts with number
 * validateCompositionId('user@composition'); // ✗ Throws - contains @
 *
 * @internal
 */
function validateCompositionId(id: string): void {
  const validIdPattern = /^[a-z][a-z0-9-_]*$/i;

  if (!validIdPattern.test(id)) {
    throw new Error(
      `[Promptise] Invalid composition ID: "${id}".\n` +
        `> IDs must start with a letter and contain only alphanumeric characters, hyphens, or underscores.\n` +
        `> Examples: "medical-diagnosis", "chat_agent", "codeReview"`,
    );
  }
}

/**
 * Applies a wrapper style to component content.
 * @param content The rendered component content
 * @param key The component key (used in wrapper formatting)
 * @param wrapperStyle The wrapper style to apply
 * @returns The wrapped content
 * @internal
 */
function _applyWrapper(content: string, key: string, wrapperStyle: WrapperStyle): string {
  if (wrapperStyle === 'none') {
    return content;
  }

  if (wrapperStyle === 'xml') {
    return `<${key}>\n${content}\n</${key}>`;
  }

  if (wrapperStyle === 'markdown') {
    // Capitalize first letter of key for markdown header
    const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
    return `## ${capitalizedKey}\n${content}`;
  }

  if (wrapperStyle === 'brackets') {
    const upperKey = key.toUpperCase();
    return `[${upperKey}]\n${content}\n[/${upperKey}]`;
  }

  // Custom wrapper
  const before = wrapperStyle.before(key);
  const after = wrapperStyle.after?.(key) ?? '';
  return `${before}${content}${after}`;
}

/**
 * Validates that the composition's components match a pattern's rules.
 * Checks that all required components are present and in the correct order.
 *
 * @param compositionId The ID of the composition being validated, for error messages.
 * @param compositionComponents The array of components from the composition.
 * @param pattern The pattern object to validate against.
 * @throws {Error} If the components do not comply with the pattern's rules.
 * @internal
 */
function _validatePattern(
  compositionId: string,
  compositionComponents: { key: string }[],
  pattern: CompositionPattern,
): void {
  const requiredKeys = pattern.components.map((c) => c.key);
  const actualKeys = compositionComponents.map((c) => c.key);

  // 1. Presence Check
  const missingKeys = requiredKeys.filter((key) => !actualKeys.includes(key));
  if (missingKeys.length > 0) {
    throw new Error(
      `[Promptise] Composition "${compositionId}" does not match pattern "${
        pattern.id
      }".\n> Missing required components: ${missingKeys.join(', ')}`,
    );
  }

  // 2. Order Check (always enforced)
  // We only care about the order of the required keys, ignoring extra keys.
  const actualFilteredOrder = actualKeys.filter((key) => requiredKeys.includes(key));

  // Naive array comparison is fine here as we're dealing with primitive strings.
  if (JSON.stringify(actualFilteredOrder) !== JSON.stringify(requiredKeys)) {
    throw new Error(
      `[Promptise] Composition "${compositionId}" does not match pattern "${
        pattern.id
      }" required order.\n> Expected order: ${requiredKeys.join(
        ', ',
      )}\n>  Received order: ${actualFilteredOrder.join(', ')}`,
    );
  }
}

/**
 * Merges Zod schemas from multiple components into a single schema.
 * Issues warnings for key collisions but allows them if types appear compatible.
 *
 * @param components - Array of components with schemas to merge
 * @returns Combined Zod schema object containing all component schema fields
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Return type must be generic to support heterogeneous component schemas
function _inferSchema(components: PromptComponent<any>[]): ZodObject<any> {
  let combinedSchema = z.object({});
  const seenKeys = new Map<string, string>(); // key -> component.key

  for (const component of components) {
    const componentSchema = component.schema;

    // Check for key collisions and issue warnings
    for (const key in componentSchema.shape) {
      if (key in combinedSchema.shape) {
        const previousComponentKey = seenKeys.get(key) ?? 'unknown';
        console.warn(
          `[Promptise] Warning: Key "${key}" is used in multiple components (` +
            `first in "${previousComponentKey}", now in "${component.key}"). ` +
            `The schema from "${component.key}" will be used. ` +
            `Consider using unique keys or leveraging the 'augmentSchema' option to resolve conflicts.`,
        );
      } else {
        seenKeys.set(key, component.key);
      }
    }
    // Using .extend() as .merge() is deprecated in Zod v4
    // .extend() will overwrite duplicate keys with the latest definition
    combinedSchema = combinedSchema.extend(componentSchema.shape);
  }
  return combinedSchema;
}

/**
 * Creates a composition that combines multiple prompt components into a cohesive prompt structure.
 *
 * This is the main factory function for assembling structured prompts with validation,
 * schema inference, cost tracking, and pattern enforcement capabilities.
 *
 * @param config - Configuration object for the composition
 * @param config.id - Unique identifier for the composition (alphanumeric, underscores, hyphens; must start with letter/underscore)
 * @param config.components - Array of prompt components to compose
 * @param config.pattern - Optional pattern for component validation and ordering
 * @param config.augmentSchema - Optional function to extend or modify the inferred schema
 * @param config.description - Optional description of the composition's purpose
 * @param config.componentWrapper - Wrapping style for components: "xml", "markdown", "brackets", "none", or custom function (default: "none")
 * @param config.messageRoles - Optional mapping of component keys to message roles for chat APIs
 * @param config.cost - Optional cost configuration for input/output/reasoning token pricing
 *
 * @returns A PromptComposition object with schema, build method, and metadata access
 *
 * @example
 * ```typescript
 * const composition = createPromptComposition({
 *   id: "support_email",
 *   components: [systemComponent, contextComponent, instructionComponent],
 *   componentWrapper: "xml",
 * });
 *
 * const prompt = composition.build({
 *   context: "User reported bug #123",
 *   instruction: "Draft empathetic response"
 * });
 * console.log(prompt.asString());
 * ```
 */
export function createPromptComposition(config: PromptCompositionConfig): PromptComposition {
  // --- Initial Validation and Schema Inference ---
  const {
    id,
    components,
    pattern,
    augmentSchema,
    description,
    componentWrapper = 'none',
    messageRoles,
    cost,
  } = config;

  // Validate composition ID format
  validateCompositionId(id);

  // Validate no duplicate component keys
  const seenComponentKeys = new Set<string>();
  for (const component of components) {
    if (seenComponentKeys.has(component.key)) {
      throw new Error(
        `[Promptise] Duplicate component key "${component.key}" in composition "${id}".\n` +
          `> Each component must have a unique key.\n` +
          `> Consider using descriptive, semantic keys like "context", "instructions", "examples".`,
      );
    }
    seenComponentKeys.add(component.key);
  }

  // Hardcoded separator: single newline
  const separator = '\n';

  // Validate and cache pattern object if provided
  let validatedPattern: CompositionPattern | undefined = undefined;
  if (pattern) {
    _validatePattern(id, components, pattern);
    validatedPattern = pattern;
  }

  const inferredSchema = _inferSchema(components);
  const finalSchema = augmentSchema ? augmentSchema(inferredSchema) : inferredSchema;

  // Private helper function for rendering components
  const renderComponents = (
    data: unknown,
    context?: Record<string, unknown>,
  ): {
    validatedData: Record<string, unknown>;
    parts: {
      key: string;
      rawContent: string;
      renderedText: string;
      optimizationMetadata?: OptimizationMetadata;
    }[];
  } => {
    const validation = finalSchema.safeParse(data);
    if (!validation.success) {
      const errorMessage = formatValidationError(validation.error, `Composition "${id}"`);
      throw new Error(errorMessage);
    }

    // After validation, data is guaranteed to match the schema structure
    const validatedData = validation.data;

    const parts = components.map((component) => {
      const renderResult = component.render(validatedData, context);
      const wrappedContent = _applyWrapper(renderResult.content, component.key, componentWrapper);
      return {
        key: component.key,
        rawContent: renderResult.content, // Texto puro sin wrapper para validación
        renderedText: wrappedContent,
        optimizationMetadata: renderResult.metadata.optimization,
      };
    });

    return { validatedData, parts };
  };

  // Helper: Calculate initial metadata for components and composition
  const _calculateInitialMetadata = (
    renderedParts: {
      key: string;
      renderedText: string;
      optimizationMetadata?: OptimizationMetadata;
    }[],
    costConfig: CostConfig | undefined,
  ): {
    componentsMetadata: ComponentMetadata[];
    totalTokens: number;
    costMetadata?: CostMetadata;
  } => {
    const componentsMetadata: ComponentMetadata[] = renderedParts.map((part) => {
      const tokens = countTokens(part.renderedText);
      const metadata: ComponentMetadata = {
        key: part.key,
        tokens,
      };

      if (part.optimizationMetadata) {
        metadata.optimization = part.optimizationMetadata;
      }

      if (costConfig) {
        metadata.cost = tokens * costConfig.inputTokenPrice;
      }

      return metadata;
    });

    const totalTokens = componentsMetadata.reduce((sum, m) => sum + m.tokens, 0);

    let costMetadata: CostMetadata | undefined = undefined;
    if (costConfig) {
      const inputCost = totalTokens * costConfig.inputTokenPrice;
      costMetadata = {
        input: { tokens: totalTokens, cost: inputCost },
        total: inputCost,
        currency: 'USD',
      };
    }

    return { componentsMetadata, totalTokens, costMetadata };
  };

  // --- Returned Object Implementation ---
  const composition: PromptComposition = {
    id,
    components,
    pattern,
    description,
    componentWrapper,
    messageRoles,
    cost,

    schema: finalSchema,

    build(data: unknown, context?: Record<string, unknown>): UniversalPromptInstance {
      const { validatedData, parts: renderedParts } = renderComponents(data, context);

      // Calculate initial metadata for all components (needed for validation)
      const { componentsMetadata, totalTokens, costMetadata } = _calculateInitialMetadata(
        renderedParts,
        cost,
      );
      let mutableCostMetadata = costMetadata;

      // Validate component content if pattern with validation exists
      if (validatedPattern) {
        renderedParts.forEach((part) => {
          const patternComponent = validatedPattern.components.find((c) => c.key === part.key);
          if (patternComponent?.validation) {
            const validationResult = validateComponentContent(
              part.key,
              part.key,
              part.rawContent, // Use pre-rendered raw content (without wrapper)
              patternComponent.validation,
            );

            if (!validationResult.valid) {
              const errorMessage = formatValidationErrors(
                part.key,
                part.key,
                validationResult.errors,
              );
              throw new Error(errorMessage);
            }

            // Log warnings (don't throw)
            const warnings = validationResult.errors.filter((e) => e.type === 'warning');
            if (warnings.length > 0) {
              console.warn(formatValidationErrors(part.key, part.key, warnings));
            }
          }
        });

        // Validate global token limit if pattern defines maxTokens
        if (validatedPattern.maxTokens !== undefined && totalTokens > validatedPattern.maxTokens) {
          throw new Error(
            `[Promptise] Pattern "${validatedPattern.id}" token limit exceeded: ${totalTokens} > ${validatedPattern.maxTokens}`,
          );
        }
      }

      // Join components with separator
      const fullPromptText = renderedParts.map((p) => p.renderedText).join(separator);

      // Intelligent asMessages() with messageRoles
      const getMessages = () => {
        if (!messageRoles) {
          // Default: single system message
          return [{ role: 'system' as const, content: fullPromptText }];
        }

        // Map each component to its role
        return renderedParts
          .filter((p) => p.key in messageRoles) // Only include mapped keys
          .map((p) => {
            const role = messageRoles[p.key];
            return {
              role: role,
              content: p.renderedText,
            };
          });
      };

      const promptInstance: UniversalPromptInstance = {
        asString: () => fullPromptText,
        asMessages: getMessages,

        updateCost(usage: { outputTokens: number }) {
          if (!mutableCostMetadata) {
            throw new Error(
              `[Promptise] Cannot update cost: no cost config provided in composition "${id}"`,
            );
          }

          const updated: CostMetadata = { ...mutableCostMetadata };

          // Update output cost (includes reasoning/thinking tokens)
          if (!cost?.outputTokenPrice) {
            console.warn(
              `[Promptise] Output tokens provided but no outputTokenPrice configured for composition "${id}"`,
            );
          } else {
            updated.output = {
              tokens: usage.outputTokens,
              cost: usage.outputTokens * cost.outputTokenPrice,
            };
          }

          // Recalculate total cost
          updated.total = updated.input.cost + (updated.output?.cost ?? 0);

          // Update metadata reference
          mutableCostMetadata = updated;
          promptInstance.metadata.cost = updated;

          return promptInstance.metadata;
        },

        metadata: {
          id: id,
          tokenCount: totalTokens,
          inputData: validatedData,
          cost: mutableCostMetadata,
          components: componentsMetadata,
        },
      };

      return promptInstance;
    },
  };

  return composition;
}
