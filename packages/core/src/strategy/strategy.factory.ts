import { PromptStrategy, PromptStrategyConfig, StrategyHistory } from './strategy.types.js';
import { PromptComposition } from '../composition/composition.types.js';
import { UniversalPromptInstance } from '../utils/core.types.js';
import { StrategyPattern } from './pattern/strategy-pattern.types.js';

/**
 * Validates that all composition IDs in steps are unique.
 *
 * Ensures no duplicate IDs exist, which would cause ambiguity in step references
 * and history tracking. Uses a Set to detect duplicates efficiently.
 *
 * @param steps - Array of compositions to validate
 * @param strategyId - Strategy ID for error messages
 * @throws {Error} When duplicate composition IDs are found
 *
 * @example
 * // Valid: all unique IDs
 * _validateUniqueIds([comp1, comp2, comp3], 'my-strategy'); // ✓
 *
 * @example
 * // Invalid: duplicate IDs throw error
 * _validateUniqueIds([comp1, comp2, comp1], 'my-strategy');
 * // Error: Strategy "my-strategy" has duplicate composition IDs...
 *
 * @internal
 */
function _validateUniqueIds(steps: PromptComposition[], strategyId: string): void {
  const ids = steps.map((comp) => comp.id);
  const uniqueIds = new Set(ids);

  if (ids.length !== uniqueIds.size) {
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    throw new Error(
      `[Promptise] Strategy "${strategyId}" has duplicate composition IDs.\n` +
        `> Duplicate IDs: ${[...new Set(duplicates)].join(', ')}\n` +
        `> All composition IDs must be unique within a strategy.`,
    );
  }
}

/**
 * Validates that the strategy steps match the provided strategy pattern.
 *
 * Performs structural validation only - checks composition IDs and their order.
 * Does NOT validate component content (handled by composition patterns).
 *
 * Rules enforced:
 * 1. All pattern step IDs must exist in the strategy steps
 * 2. Pattern step IDs must appear in the same relative order in strategy
 * 3. Strategy MAY have additional steps not in the pattern
 *
 * @param steps - Array of compositions in the strategy
 * @param pattern - Strategy pattern to validate against
 * @param strategyId - Strategy ID for error messages
 * @throws {Error} When required pattern IDs are missing from steps
 * @throws {Error} When pattern IDs appear out of order in steps
 *
 * @example
 * // Valid: pattern IDs exist and are in order
 * // Pattern: [think, act]
 * // Steps: [think, act, observe] ✓ (observe is extra, OK)
 *
 * @example
 * // Invalid: missing pattern ID
 * // Pattern: [think, act, observe]
 * // Steps: [think, act] ✗ (missing observe)
 *
 * @example
 * // Invalid: wrong order
 * // Pattern: [think, act, observe]
 * // Steps: [think, observe, act] ✗ (act after observe)
 *
 * @internal
 */
function _validateStrategyPattern(
  steps: PromptComposition[],
  pattern: StrategyPattern,
  strategyId: string,
): void {
  const stepIds = steps.map((comp) => comp.id);
  const patternIds = pattern.steps.map((step) => step.id);

  // Check if all pattern IDs exist in steps
  const missingIds = patternIds.filter((id) => !stepIds.includes(id));
  if (missingIds.length > 0) {
    throw new Error(
      `[Promptise] Strategy "${strategyId}" does not match pattern "${pattern.id}".\n` +
        `> Missing composition IDs: ${missingIds.join(', ')}\n` +
        `> Expected IDs from pattern: ${patternIds.join(', ')}\n` +
        `> Actual IDs in strategy: ${stepIds.join(', ')}`,
    );
  }

  // Check order - pattern IDs must appear in same order in steps
  let lastFoundIndex = -1;
  for (const patternId of patternIds) {
    const foundIndex = stepIds.indexOf(patternId);
    if (foundIndex <= lastFoundIndex) {
      throw new Error(
        `[Promptise] Strategy "${strategyId}" violates pattern "${pattern.id}" order.\n` +
          `> Composition "${patternId}" appears out of order.\n` +
          `> Expected order: ${patternIds.join(' → ')}\n` +
          `> Actual order: ${stepIds.join(' → ')}`,
      );
    }
    lastFoundIndex = foundIndex;
  }
}

/**
 * Creates a PromptStrategy object from a configuration.
 *
 * Strategies are stateful multi-turn prompt execution flows designed for sequential AI workflows.
 * Use them when you need:
 * - Sequential prompt chains (draft → critique → refine, or think → act → observe)
 * - Execution history tracking and auditing
 * - Progress monitoring across steps
 * - State management for multi-step reasoning or agent workflows
 *
 * For single prompts or stateless compositions, use {@link createPromptComposition} instead.
 *
 * @param config - The strategy configuration object
 * @returns A PromptStrategy instance with stateful navigation methods
 *
 * @throws {Error} When steps array is empty
 * @throws {Error} When steps contain duplicate composition IDs
 * @throws {Error} When pattern validation fails (missing IDs or wrong order)
 *
 * @see {@link PromptStrategyConfig} - Configuration interface
 * @see {@link PromptStrategy} - Return type interface
 * @see {@link createStrategyPattern} - Create validation patterns
 * @see {@link createPromptComposition} - For single prompts
 *
 * @example
 * // Basic usage - iterative content refinement
 * const strategy = createPromptStrategy({
 *   id: 'draft-critique-refine',
 *   description: 'Iterative content refinement',
 *   steps: [draftComp, critiqueComp, refineComp]
 * });
 *
 * // Execute sequentially
 * const draft = strategy.current({ topic: 'AI Ethics' });
 * const critique = strategy.next({ ...data, draft: draftResponse });
 * const final = strategy.next({ draft: draftResponse, critique: critiqueResponse });
 *
 * @example
 * // With pattern validation - ensures correct structure
 * import { REACT_PATTERN } from '@promptise/core';
 *
 * const strategy = createPromptStrategy({
 *   id: 'react-agent',
 *   steps: [thoughtComp, actionComp, observationComp],
 *   pattern: REACT_PATTERN // Validates step structure
 * });
 *
 * @example
 * // Error handling - duplicate IDs
 * try {
 *   const strategy = createPromptStrategy({
 *     id: 'invalid',
 *     steps: [comp1, comp1] // ❌ Duplicate composition IDs
 *   });
 * } catch (error) {
 *   console.error('Strategy creation failed:', error.message);
 *   // Error: Strategy "invalid" has duplicate composition IDs...
 * }
 *
 * @example
 * // Edge case - single-step strategy (valid but uncommon)
 * const singleStep = createPromptStrategy({
 *   id: 'simple',
 *   steps: [onlyComposition] // Valid, though composition alone may be simpler
 * });
 */
export function createPromptStrategy(config: PromptStrategyConfig): PromptStrategy {
  const { id, description, steps, pattern } = config;

  // Validation: steps must not be empty
  if (steps.length === 0) {
    throw new Error(
      `[Promptise] Strategy "${id}" must have at least one step.\n` +
        `> Provide a non-empty array of PromptComposition objects in the 'steps' property.`,
    );
  }

  // Validation: all composition IDs must be unique
  _validateUniqueIds(steps, id);

  // Validation: if pattern is provided, validate structure
  if (pattern) {
    _validateStrategyPattern(steps, pattern, id);
  }

  // Internal state (mutable, encapsulated)
  let currentIndex = 0;
  const history: StrategyHistory[] = [];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Stateful Navigation Methods
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  function current(
    data: unknown,
    context?: Record<string, unknown>,
  ): UniversalPromptInstance | null {
    if (currentIndex >= steps.length) {
      return null;
    }

    const currentComposition = steps[currentIndex];
    if (!currentComposition) return null;
    return currentComposition.build(data, context);
  }

  function next(data: unknown, context?: Record<string, unknown>): UniversalPromptInstance | null {
    // If already completed, return null
    if (currentIndex >= steps.length) {
      return null;
    }

    // Record current step in history before advancing
    const currentComposition = steps[currentIndex];
    if (!currentComposition) return null;
    history.push({
      index: currentIndex,
      id: currentComposition.id,
      timestamp: new Date(),
    });

    // Advance to next step
    currentIndex++;

    // Check if we've completed after advancing
    if (currentIndex >= steps.length) {
      return null;
    }

    // Build the new current step
    const nextComposition = steps[currentIndex];
    if (!nextComposition) return null;
    return nextComposition.build(data, context);
  }

  function reset(): void {
    currentIndex = 0;
    history.length = 0; // Clear array in-place
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // State Introspection Methods
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  function getCurrentIndex(): number {
    return currentIndex;
  }

  function getNextStep(): PromptComposition | null {
    const nextIndex = currentIndex + 1;
    return nextIndex < steps.length ? (steps[nextIndex] ?? null) : null;
  }

  function getHistory(): StrategyHistory[] {
    // Return a shallow copy to prevent external mutations
    return [...history];
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Helper Methods
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  function getStep(index: number): PromptComposition {
    if (index < 0 || index >= steps.length) {
      throw new Error(
        `[Promptise] Strategy "${id}" step index out of bounds.\n` +
          `> Requested index: ${String(index)}\n` +
          `> Valid range: 0 to ${String(steps.length - 1)}\n` +
          `> Total steps: ${String(steps.length)}`,
      );
    }
    const step = steps[index];
    if (!step) {
      throw new Error(`[Promptise] Strategy "${id}" step not found at index ${String(index)}`);
    }
    return step;
  }

  function getStepById(id: string): PromptComposition | undefined {
    return steps.find((comp) => comp.id === id);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Return Immutable API Object
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // We use Object.defineProperties to create computed properties (getters)
  // that access the closure's mutable state (currentIndex, history).
  //
  // This pattern provides:
  // - Reactive properties: `completed` and `progress` always reflect current state
  // - Ergonomic API: `strategy.completed` vs `strategy.isComplete()`
  // - Type safety: TypeScript infers readonly properties correctly
  // - Immutability: `configurable: false` prevents property redefinition
  // - Enumeration: `enumerable: true` makes them visible in Object.keys()
  //
  // Alternative considered: getter syntax on class (rejected for functional style)
  return Object.defineProperties(
    {
      // Static configuration (readonly via interface)
      id,
      description,
      steps, // Return original reference (readonly interface prevents mutations)
      pattern,

      // Stateful navigation methods
      current,
      next,
      reset,

      // State introspection methods
      getCurrentIndex,
      getNextStep,
      getHistory,

      // Helper methods
      getStep,
      getStepById,
    },
    {
      // Computed properties - reactive getters that access closure state
      completed: {
        get: () => currentIndex >= steps.length,
        enumerable: true, // Visible in Object.keys(), spread, etc.
        configurable: false, // Cannot be redefined or deleted
      },
      progress: {
        get: () => {
          const total = steps.length;
          const percentage = total > 0 ? (currentIndex / total) * 100 : 0;
          return { current: currentIndex, total, percentage };
        },
        enumerable: true,
        configurable: false,
      },
    },
  ) as PromptStrategy;
}
