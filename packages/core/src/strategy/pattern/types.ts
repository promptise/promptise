/**
 * Represents a required step (composition) in a strategy pattern.
 * Unlike composition patterns, strategy patterns don't validate content—
 * each composition already handles its own validation internally.
 *
 * @property id - The composition ID that must be present in the strategy
 * @property description - Optional description of what this step represents
 */
export interface StrategyPatternStep {
  /**
   * The composition ID that must be present in the strategy.
   * This should match the composition.id of a step.
   *
   * @example 'draft' | 'critique' | 'refine'
   */
  id: string;

  /**
   * An optional description of what this step represents.
   * Useful for documentation and error messages.
   *
   * @example 'Initial content generation step'
   */
  description?: string;
}

/**
 * Configuration for creating a strategy pattern.
 *
 * @property id - Unique identifier for this strategy pattern
 * @property description - Optional description of the pattern's purpose
 * @property steps - Ordered array of composition steps required by this pattern
 */
export interface StrategyPatternConfig {
  /**
   * Unique identifier for this strategy pattern.
   * @example 'draft-critique-refine' | 'react' | 'chain-of-density'
   */
  id: string;

  /**
   * Optional description of the pattern's purpose.
   */
  description?: string;

  /**
   * Ordered array of composition steps required by this pattern.
   */
  readonly steps: StrategyPatternStep[];
}

/**
 * Defines the structural pattern for a multi-turn prompt strategy.
 * Enforces which compositions must be present and in what order.
 *
 * Strategy patterns focus on **structure** only (presence and order of steps).
 * Content validation is handled by each composition's internal patterns and validations.
 *
 * @property id - Unique identifier for the strategy pattern
 * @property description - Optional description of the pattern and its intended use case
 * @property steps - Ordered array of composition steps required by this pattern
 *
 * @remarks
 * Pattern validation runs during strategy.build() to ensure all required steps are present
 * and appear in the correct order.
 *
 * @example
 * const DRAFT_CRITIQUE_REFINE = createStrategyPattern({
 *   id: 'draft-critique-refine',
 *   description: 'Iterative refinement workflow',
 *   steps: [
 *     { id: 'draft', description: 'Initial draft' },
 *     { id: 'critique', description: 'Critical review' },
 *     { id: 'refine', description: 'Final polish' }
 *   ]
 * });
 */
export interface StrategyPattern {
  /**
   * Unique identifier for the strategy pattern.
   * @example 'draft-critique-refine' | 'react'
   */
  id: string;

  /**
   * An optional description of the pattern and its intended use case.
   */
  description?: string;

  /**
   * Ordered array of composition steps required by this pattern.
   * The validator enforces that compositions in the strategy's steps
   * appear in the same order as defined here.
   */
  readonly steps: readonly StrategyPatternStep[];
}
