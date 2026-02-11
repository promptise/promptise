import { CompositionPattern } from './composition-pattern.types.js';

/**
 * Factory function to create a CompositionPattern object.
 *
 * This is the recommended way to create patterns as it provides:
 * - Type safety
 * - No global registration required
 * - Can be passed directly to compositions
 * - Easier to test
 *
 * @param config - The pattern configuration
 * @returns A CompositionPattern object ready to use
 * @throws {Error} When pattern ID is invalid (must start with letter, alphanumeric/-/_ only)
 * @throws {Error} When components array is empty (patterns need at least one component)
 * @throws {Error} When duplicate component keys exist (each key must be unique)
 *
 * @example
 * ```typescript
 * const medicalPattern = createCompositionPattern({
 *   id: 'medical-analysis',
 *   description: 'Clinical analysis pattern',
 *   components: [
 *     { key: 'role', description: 'Medical role' },
 *     { key: 'task', description: 'Analysis task' },
 *   ],
 * });
 *
 * const composition = createPromptComposition({
 *   id: 'medical-summary',
 *   components: [roleComponent, taskComponent],
 *   pattern: medicalPattern, // Pass directly, no registration needed
 * });
 * ```
 */
export function createCompositionPattern(config: CompositionPattern): CompositionPattern {
  // Validate pattern ID format and content
  if (!config.id || typeof config.id !== 'string') {
    throw new Error(
      `[Promptise] Invalid pattern ID: "${config.id}".\n` +
        `> ID must be a non-empty string.\n` +
        `> Examples: "medical-analysis", "race_pattern", "customValidation"`,
    );
  }

  const trimmedId = config.id.trim();

  if (trimmedId === '') {
    throw new Error(
      `[Promptise] Invalid pattern ID: ID cannot be empty or whitespace only.\n` +
        `> Provide a meaningful identifier for your pattern.\n` +
        `> Examples: "medical-analysis", "race_pattern", "customValidation"`,
    );
  }

  if (trimmedId.length > 255) {
    throw new Error(
      `[Promptise] Invalid pattern ID: "${trimmedId.substring(0, 50)}..." is too long (${trimmedId.length} characters).\n` +
        `> Pattern IDs must be 255 characters or less.\n` +
        `> Use a concise, descriptive name.`,
    );
  }

  const validIdPattern = /^[a-z][a-z0-9-_]*$/i;
  const onlySeparators = /^[-_]+$/;

  if (onlySeparators.test(trimmedId)) {
    throw new Error(
      `[Promptise] Invalid pattern ID: "${trimmedId}" contains only separators.\n` +
        `> IDs must contain at least one alphanumeric character.\n` +
        `> Examples: "medical-analysis", "race_pattern", "custom-1"`,
    );
  }

  if (!validIdPattern.test(trimmedId)) {
    throw new Error(
      `[Promptise] Invalid pattern ID: "${trimmedId}".\n` +
        `> IDs must start with a letter and contain only alphanumeric characters, hyphens, or underscores.\n` +
        `> Examples: "medical-analysis", "race_pattern", "customValidation"`,
    );
  }

  // Validate maxTokens if provided
  if (config.maxTokens !== undefined) {
    if (typeof config.maxTokens !== 'number' || config.maxTokens <= 0) {
      throw new Error(
        `[Promptise] Invalid maxTokens in pattern "${trimmedId}": ${String(config.maxTokens)}.\n` +
          `> maxTokens must be a positive number.\n` +
          `> Example: maxTokens: 8192`,
      );
    }
  }

  // Validate components array is not empty
  if (config.components.length === 0) {
    throw new Error(
      `[Promptise] Pattern "${trimmedId}" must have at least one component.\n` +
        `> Patterns define expected component structure and cannot be empty.\n` +
        `> Add at least one component with a key and optional validation rules.`,
    );
  }

  // Prevent ambiguous validation - each component key must be unique within pattern
  const seenKeys = new Set<string>();
  for (const component of config.components) {
    if (seenKeys.has(component.key)) {
      throw new Error(
        `[Promptise] Duplicate component key "${component.key}" in pattern "${trimmedId}".\n` +
          `> Each component in the pattern must have a unique key.\n` +
          `> Consider using descriptive, semantic keys like "context", "instructions", "examples".`,
      );
    }
    seenKeys.add(component.key);

    // Validate component-level validation rules
    if (component.validation) {
      const val = component.validation;

      if (
        val.maxTokens !== undefined &&
        (typeof val.maxTokens !== 'number' || val.maxTokens <= 0)
      ) {
        throw new Error(
          `[Promptise] Invalid maxTokens in component "${component.key}": ${String(val.maxTokens)}.\n` +
            `> maxTokens must be a positive number.\n` +
            `> Example: maxTokens: 100`,
        );
      }
    }
  }

  return config;
}
