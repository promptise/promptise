import { PromptComposition } from '../composition/composition.types.js';
import { UniversalPromptInstance } from '../core/core.types.js';
import { StrategyPattern } from './pattern/types.js';

/**
 * @interface StrategyHistory
 * Represents a single execution record in the strategy's history.
 * Useful for debugging, auditing, and tracing prompt execution flows.
 */
export interface StrategyHistory {
  /**
   * The zero-based index of the executed step.
   */
  index: number;

  /**
   * The ID of the composition that was executed.
   */
  id: string;

  /**
   * Timestamp when this step was executed.
   */
  timestamp: Date;
}

/**
 * @interface StrategyProgress
 * Represents the current progress state of the strategy execution.
 */
export interface StrategyProgress {
  /**
   * The current step index (zero-based).
   */
  current: number;

  /**
   * Total number of steps in the strategy.
   */
  total: number;

  /**
   * Completion percentage (0-100).
   */
  percentage: number;
}

/**
 * @interface PromptStrategyConfig
 * Defines the configuration object required to create a PromptStrategy.
 * This is the blueprint for a multi-turn prompt execution flow.
 */
export interface PromptStrategyConfig {
  /**
   * A unique identifier for the strategy.
   * Required.
   */
  id: string;

  /**
   * A brief description of the strategy's purpose.
   * Useful for documentation and debugging.
   *
   * @example
   * description: 'Iterative content refinement through draft, critique, and refine steps'
   *
   * Optional.
   */
  description?: string;

  /**
   * Ordered array of compositions that form this strategy.
   * Each composition is executed sequentially through the current() and next() methods.
   *
   * The framework enforces:
   * - Sequential execution (no step skipping)
   * - Unique composition IDs
   * - Order validation
   *
   * @example
   * steps: [
   *   draftComposition,
   *   critiqueComposition,
   *   refineComposition
   * ]
   *
   * Required.
   */
  steps: PromptComposition[];

  /**
   * Optional strategy pattern that validates the structure of the steps.
   * Unlike composition patterns (which validate component content), strategy patterns
   * only validate:
   * - Presence of expected composition IDs
   * - Correct execution order
   *
   * Use prebuilt patterns like DRAFT_CRITIQUE_REFINE, REACT, or create custom patterns.
   *
   * @example
   * pattern: DRAFT_CRITIQUE_REFINE
   */
  pattern?: StrategyPattern;
}

/**
 * @interface PromptStrategy
 * Represents the functional object returned by the `createPromptStrategy` factory.
 * It's a stateful state machine for managing multi-turn prompt execution flows.
 *
 * PromptStrategy enforces sequential execution and tracks history, making it ideal
 * for reasoning workflows within agentic frameworks like Langraph, Mastra, or n8n.
 *
 * @example
 * const strategy = createPromptStrategy({
 *   id: 'draft-critique-refine',
 *   steps: [draftComposition, critiqueComposition, refineComposition]
 * });
 *
 * // Execute sequentially
 * const draft = strategy.current(data);
 * const critique = strategy.next({ ...data, draft: draftResponse });
 * const final = strategy.next({ draft: draftResponse, critique: critiqueResponse });
 *
 * // Inspect state
 * console.log(strategy.getProgress()); // { current: 2, total: 3, percentage: 66.66 }
 * console.log(strategy.getHistory());  // Full execution trace
 */
export interface PromptStrategy {
  /**
   * Unique identifier for this strategy.
   */
  readonly id: string;

  /**
   * Optional description of the strategy's purpose.
   */
  readonly description?: string;

  /**
   * Ordered array of compositions that form this strategy.
   */
  readonly steps: PromptComposition[];

  /**
   * Optional strategy pattern that validates the structure of the steps.
   */
  readonly pattern?: StrategyPattern;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Stateful Navigation Methods
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Builds the prompt for the current step without advancing the index.
   *
   * This method is idempotent - calling it multiple times returns the same step.
   * The internal index is only advanced by {@link next}.
   *
   * @param data - Input data matching the current step's composition schema.
   *               Must satisfy the Zod schema of the current composition.
   * @param context - Optional context object shared across all components in the composition.
   *                  Use for cross-component data like locale, theme, or metadata.
   * @returns A UniversalPromptInstance for the current step, or null if strategy is complete
   * @throws {ZodError} When data doesn't match the current composition's schema
   *
   * @see {@link next} - Advance to next step and get its prompt
   * @see {@link completed} - Check if strategy has finished all steps
   * @see {@link getCurrentIndex} - Get current position in the strategy
   * @see {@link reset} - Reset strategy to first step
   *
   * @example
   * // Basic usage
   * const prompt = strategy.current({ topic: 'AI Ethics' });
   * if (prompt === null) {
   *   console.log('No current step - strategy is complete');
   * } else {
   *   const response = await llm.invoke(prompt.asString());
   * }
   *
   * @example
   * // Check before calling
   * if (!strategy.completed) {
   *   const prompt = strategy.current({ topic: 'AI' });
   *   // ... use prompt
   * }
   *
   * @example
   * // Handle validation errors
   * try {
   *   const prompt = strategy.current({ topic: 123 }); // Wrong type
   * } catch (error) {
   *   if (error instanceof z.ZodError) {
   *     console.error('Invalid input:', error.issues);
   *   }
   * }
   */
  current(data: unknown, context?: Record<string, unknown>): UniversalPromptInstance | null;

  /**
   * Advances to the next step and builds its prompt.
   *
   * This method mutates state:
   * - Records the current step in history (with index, id, and timestamp)
   * - Advances the internal index by 1
   * - Returns the prompt for the new current step
   *
   * @param data - Input data matching the next step's composition schema.
   *               Must satisfy the Zod schema of the next composition.
   * @param context - Optional context object shared across all components in the composition.
   *                  Use for cross-component data like locale, theme, or metadata.
   * @returns A UniversalPromptInstance for the next step, or null if strategy is complete
   * @throws {ZodError} When data doesn't match the next composition's schema
   *
   * @see {@link current} - Get current step's prompt without advancing
   * @see {@link completed} - Check if strategy has finished all steps
   * @see {@link getHistory} - Get execution history of all executed steps
   * @see {@link reset} - Reset strategy to first step and clear history
   *
   * @example
   * // Basic sequential execution
   * const nextPrompt = strategy.next({ draft: previousResponse });
   * if (nextPrompt === null) {
   *   console.log('Strategy completed!');
   * } else {
   *   const response = await llm.invoke(nextPrompt.asString());
   * }
   *
   * @example
   * // Safe execution with completion check
   * if (!strategy.completed) {
   *   const prompt = strategy.next({ draft: 'content' });
   *   // ... use prompt
   * } else {
   *   console.log('No more steps available');
   * }
   *
   * @example
   * // Multi-step workflow with history tracking
   * strategy.current({ topic: 'AI' });
   * strategy.next({ draft: 'First draft' });
   * strategy.next({ draft: 'First draft', critique: 'Feedback' });
   *
   * const history = strategy.getHistory();
   * console.log(`Executed ${history.length} steps`);
   */
  next(data: unknown, context?: Record<string, unknown>): UniversalPromptInstance | null;

  /**
   * Resets the strategy to its initial state.
   *
   * This method:
   * - Clears the execution history completely
   * - Resets the current index to 0 (first step)
   * - Allows reusing the same strategy instance with different input data
   *
   * @see {@link getHistory} - View history before resetting
   * @see {@link getCurrentIndex} - Verify reset to index 0
   *
   * @example
   * // Reuse strategy for multiple runs
   * strategy.reset();
   * // Now strategy.current() will return the first step again
   *
   * @example
   * // Process multiple datasets with same strategy
   * const datasets = [data1, data2, data3];
   *
   * for (const data of datasets) {
   *   strategy.reset();
   *   let prompt = strategy.current(data);
   *   while (prompt !== null) {
   *     const result = await llm.invoke(prompt.asString());
   *     prompt = strategy.next({ ...data, result });
   *   }
   * }
   */
  reset(): void;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // State Introspection Methods
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Gets the current step index (zero-based).
   *
   * The index points to the step that {@link current} will return.
   * It advances only when {@link next} is called.
   *
   * @returns The current zero-based index (0 to steps.length)
   *
   * @see {@link getStep} - Use this index to get the current composition
   * @see {@link getProgress} - Get index with total and percentage
   * @see {@link steps} - Direct access to all steps for manual indexing
   *
   * @example
   * // Track progress
   * console.log(strategy.getCurrentIndex()); // 0 (first step)
   * strategy.next({ draft: 'text' });
   * console.log(strategy.getCurrentIndex()); // 1 (second step)
   *
   * @example
   * // Get current step safely
   * if (!strategy.completed) {
   *   const index = strategy.getCurrentIndex();
   *   const step = strategy.getStep(index);
   *   console.log(`Current step: ${step.id}`);
   * }
   */
  getCurrentIndex(): number;

  /**
   * Gets the composition for the next step without advancing.
   *
   * This is useful for previewing what step comes next before calling {@link next}.
   * Does not modify state - purely informational.
   *
   * @returns The next PromptComposition, or null if at the last step or complete
   *
   * @see {@link next} - Advance and execute the next step
   * @see {@link getCurrentIndex} - Get current position
   * @see {@link getStep} - Get any step by index
   *
   * @example
   * // Preview next step
   * const nextComp = strategy.getNextStep();
   * if (nextComp) {
   *   console.log(`Next step: ${nextComp.id}`);
   *   console.log(`Schema keys: ${Object.keys(nextComp.schema.shape)}`);
   * }
   *
   * @example
   * // Conditional execution based on next step
   * const next = strategy.getNextStep();
   * if (next?.id === 'critique') {
   *   // Prepare critique-specific data
   *   const prompt = strategy.next({ draft: content, critique: feedback });
   * }
   */
  getNextStep(): PromptComposition | null;

  /**
   * Indicates whether all steps have been executed.
   *
   * Returns true when the internal index has reached or exceeded the total number of steps.
   * This happens after {@link next} has been called enough times to exhaust all steps.
   *
   * This is a computed property - it reflects the current state without method invocation.
   *
   * @see {@link progress} - Get detailed progress information
   * @see {@link getCurrentIndex} - Get exact position
   * @see {@link current} - Returns null when complete
   * @see {@link next} - Returns null when complete
   *
   * @example
   * // Safe execution pattern
   * if (strategy.completed) {
   *   console.log('All steps executed');
   * } else {
   *   const prompt = strategy.current(data);
   * }
   *
   * @example
   * // Execute all remaining steps
   * while (!strategy.completed) {
   *   const prompt = strategy.current(data);
   *   const result = await llm.invoke(prompt.asString());
   *   strategy.next({ ...data, result });
   * }
   */
  readonly completed: boolean;

  /**
   * Current execution progress with detailed metrics.
   *
   * Returns an object containing:
   * - current: The current step index (zero-based)
   * - total: Total number of steps in the strategy
   * - percentage: Completion percentage (0-100)
   *
   * This is a computed property - it reflects the current state without method invocation.
   *
   * @see {@link getCurrentIndex} - Get just the current index
   * @see {@link completed} - Simple boolean completion check
   * @see {@link steps} - Direct access to all steps
   *
   * @example
   * // Display progress
   * const { percentage, current, total } = strategy.progress;
   * console.log(`Progress: ${percentage.toFixed(1)}% (${current + 1}/${total})`);
   *
   * @example
   * // Progress bar implementation
   * const { current, total, percentage } = strategy.progress;
   * const barLength = 20;
   * const filled = Math.floor((percentage / 100) * barLength);
   * const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
   * console.log(`${bar} ${percentage.toFixed(0)}%`);
   */
  readonly progress: StrategyProgress;

  /**
   * Gets the full execution history of executed steps.
   *
   * Returns a shallow copy to prevent external mutations.
   * Only steps executed via {@link next} are recorded - {@link current}
   * does not add to history since it doesn't advance state.
   *
   * Each history record contains:
   * - index: The step index when it was executed
   * - id: The composition ID that was executed
   * - timestamp: When the step was executed
   *
   * @returns Array of history records in execution order.
   *          Returns empty array if no steps have been executed yet.
   *
   * @see {@link reset} - Clears history and resets strategy
   * @see {@link getProgress} - Get current progress metrics
   * @see {@link next} - The method that records history
   *
   * @example
   * // Basic usage
   * const history = strategy.getHistory();
   * history.forEach(record => {
   *   console.log(`${record.id} executed at ${record.timestamp}`);
   * });
   *
   * @example
   * // Audit trail for debugging
   * strategy.next({ draft: 'text' });
   * strategy.next({ critique: 'feedback' });
   *
   * const history = strategy.getHistory();
   * console.log(`Executed ${history.length} steps`);
   *
   * const elapsed = history[history.length - 1].timestamp.getTime() -
   *                 history[0].timestamp.getTime();
   * console.log(`Total time: ${elapsed}ms`);
   *
   * @example
   * // History is immutable
   * const history1 = strategy.getHistory();
   * history1.push({ index: 99, id: 'fake', timestamp: new Date() });
   *
   * const history2 = strategy.getHistory();
   * console.log(history2.length); // Not affected by mutation
   */
  getHistory(): StrategyHistory[];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Helper Methods
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /**
   * Gets a composition by its index.
   *
   * Throws an error if the index is out of bounds.
   * Use {@link steps} for direct readonly access without bounds checking.
   *
   * @param index - Zero-based index of the step (must be 0 to steps.length - 1)
   * @returns The composition at the specified index
   * @throws {Error} When index is out of bounds (< 0 or >= steps.length).
   *                 Error includes helpful details about valid range.
   *
   * @see {@link getStepById} - Get step by composition ID instead of index
   * @see {@link getCurrentIndex} - Get current index to use with this method
   * @see {@link steps} - Direct readonly access to all steps
   * @see {@link getNextStep} - Get next step without needing index
   *
   * @example
   * // Get first step
   * const firstStep = strategy.getStep(0);
   * console.log(firstStep.id);
   *
   * @example
   * // Get current step safely
   * if (!strategy.isComplete()) {
   *   const current = strategy.getStep(strategy.getCurrentIndex());
   *   console.log(`Current step: ${current.id}`);
   * }
   *
   * @example
   * // Handle out of bounds
   * try {
   *   const step = strategy.getStep(99);
   * } catch (error) {
   *   console.error('Invalid step index:', error.message);
   * }
   *
   * @example
   * // Iterate all steps
   * for (let i = 0; i < strategy.steps.length; i++) {
   *   const step = strategy.getStep(i);
   *   console.log(`Step ${i}: ${step.id}`);
   * }
   */
  getStep(index: number): PromptComposition;

  /**
   * Gets a composition by its ID.
   *
   * Searches through all steps to find a composition with the matching ID.
   * Returns undefined if no composition with that ID exists.
   *
   * @param id - ID of the composition to find
   * @returns The composition if found, undefined otherwise
   *
   * @see {@link getStep} - Get step by index instead of ID
   * @see {@link steps} - Direct readonly access to all steps
   *
   * @example
   * // Find specific step
   * const critiqueComp = strategy.getStepById('critique');
   * if (critiqueComp) {
   *   console.log('Found critique step');
   *   console.log(critiqueComp.schema);
   * }
   *
   * @example
   * // Conditional logic based on step existence
   * const draftStep = strategy.getStepById('draft');
   * if (!draftStep) {
   *   throw new Error('Draft step required but not found');
   * }
   *
   * @example
   * // Check if strategy contains a specific step
   * const hasReview = strategy.getStepById('review') !== undefined;
   * console.log(`Includes review step: ${hasReview}`);
   */
  getStepById(id: string): PromptComposition | undefined;
}
