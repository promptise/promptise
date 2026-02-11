import { StrategyPattern, StrategyPatternConfig } from './strategy-pattern.types.js';

/**
 * Creates a StrategyPattern object.
 * Used to define structural patterns for multi-turn prompt strategies.
 *
 * Strategy patterns validate:
 * - Presence of required composition IDs
 * - Order of compositions
 *
 * Unlike composition patterns, strategy patterns don't validate content
 * since each composition handles its own validation internally.
 *
 * @param config - The strategy pattern configuration
 * @returns A StrategyPattern instance
 * @throws {Error} If pattern ID is invalid (must start with letter, contain only alphanumeric/-/_)
 * @throws {Error} If steps array is empty
 * @throws {Error} If steps contain duplicate IDs
 *
 * @example
 * const pattern = createStrategyPattern({
 *   id: 'draft-critique-refine',
 *   description: 'Iterative content refinement',
 *   steps: [
 *     { id: 'draft', description: 'Initial draft' },
 *     { id: 'critique', description: 'Critical review' },
 *     { id: 'refine', description: 'Final polish' }
 *   ]
 * });
 */
export function createStrategyPattern(config: StrategyPatternConfig): StrategyPattern {
  const { id, description, steps } = config;

  // Validate pattern ID - empty or whitespace
  const trimmedId = id.trim();
  if (trimmedId === '') {
    throw new Error(
      `[Promptise] Invalid strategy pattern ID: "${id}".\n` +
        `> Pattern ID cannot be empty or whitespace only.`,
    );
  }

  // Validate pattern ID - length limit
  if (trimmedId.length > 255) {
    throw new Error(
      `[Promptise] Invalid strategy pattern ID: "${id}".\n` +
        `> Pattern ID must be 255 characters or less. Current length: ${trimmedId.length}`,
    );
  }

  // Validate pattern ID format - must start with letter, alphanumeric/-/_ only
  const idPattern = /^[a-z][a-z0-9-_]*$/i;
  if (!idPattern.test(trimmedId)) {
    throw new Error(
      `[Promptise] Invalid strategy pattern ID: "${id}".\n` +
        `> IDs must start with a letter and contain only letters, numbers, hyphens, or underscores.`,
    );
  }

  // Validate steps array is not empty
  if (steps.length === 0) {
    throw new Error(`[Promptise] Strategy pattern "${id}" must have at least one step.`);
  }

  // Validate and normalize step IDs
  const normalizedSteps = steps.map((step) => {
    const trimmedStepId = step.id.trim();

    // Check for empty step IDs
    if (trimmedStepId === '') {
      throw new Error(
        `[Promptise] Strategy pattern "${id}" has invalid step.\n` +
          `> Step ID cannot be empty or whitespace only.`,
      );
    }

    // Check step ID length
    if (trimmedStepId.length > 255) {
      throw new Error(
        `[Promptise] Strategy pattern "${id}" has invalid step.\n` +
          `> Step ID must be 255 characters or less. Current length: ${trimmedStepId.length}`,
      );
    }

    // Normalize Unicode to NFC (composed form)
    const normalizedId = trimmedStepId.normalize('NFC');

    return {
      ...step,
      id: normalizedId,
    };
  });

  // Validate step IDs are unique (case-sensitive, after normalization)
  const ids = normalizedSteps.map((s) => s.id);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    throw new Error(
      `[Promptise] Strategy pattern "${id}" has duplicate step IDs.\n` +
        `> Duplicate IDs: ${[...new Set(duplicates)].join(', ')}`,
    );
  }

  // Create immutable copy of steps to prevent external mutations
  const stepsCopy = normalizedSteps.map((step) => ({ ...step }));

  return {
    id: trimmedId,
    description,
    steps: stepsCopy,
  };
}
