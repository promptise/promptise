import { PromptComposition } from '../composition/composition.types.js';
import type { CostConfig } from '../utils/core.types.js';

/**
 * Input format for compositions in the registry.
 *
 * Accepts two formats:
 * - **Direct**: Pass `PromptComposition` directly (no fixtures needed)
 * - **Object**: Pass `CompositionEntry` object (with optional fixtures)
 *
 * Both formats can be mixed in the same array.
 *
 * @example
 * // Direct format (no fixtures)
 * const registry = new Promptise({
 *   compositions: [medicalDiagnosis, codeReview, simplePrompt]
 * });
 *
 * @example
 * // Mixed format
 * const registry = new Promptise({
 *   compositions: [
 *     medicalDiagnosis,  // direct
 *     { composition: codeReview, fixtures: { test: {...} } },  // with fixtures
 *     simplePrompt  // direct
 *   ]
 * });
 */
export type CompositionInput = PromptComposition | CompositionEntry;

/**
 * A composition entry in the registry with optional fixture data.
 *
 * Fixtures are mock/test data used by the CLI to generate preview prompts.
 * They are developer tooling and not used in production code.
 *
 * @example
 * {
 *   composition: medicalDiagnosisComposition,
 *   fixtures: {
 *     basic: { role: 'doctor', task: 'diagnose symptoms' },
 *     icu: { role: 'intensivist', task: 'stabilize patient' }
 *   },
 *   cost: {
 *     inputTokenPrice: 0.000005,
 *     outputTokenPrice: 0.000015,
 *     currency: 'USD'
 *   }
 * }
 */
export interface CompositionEntry {
  /**
   * The prompt composition instance.
   */
  composition: PromptComposition;

  /**
   * Optional fixture data for CLI preview generation.
   *
   * Each fixture is a named set of mock data that matches the composition's schema.
   * The CLI will generate one preview file per fixture.
   *
   * **Fixtures are for development/tooling only** - they are not used in production.
   * In production, always pass real data to `composition.build(data)`.
   *
   * @example
   * fixtures: {
   *   basic: { role: 'general practitioner', task: 'diagnose common symptoms' },
   *   icu: { role: 'intensivist', task: 'stabilize critical patient' },
   *   emergency: { role: 'emergency physician', task: 'triage trauma patient' }
   * }
   */
  fixtures?: Record<string, Record<string, unknown>>;

  /**
   * Optional token pricing override for this specific composition entry.
   *
   * Used by development tooling (CLI) to estimate costs from token counts.
   * In production, rely on provider-reported usage/cost data from the LLM API.
   *
   * @example
   * cost: {
   *   inputTokenPrice: 0.000005,
   *   outputTokenPrice: 0.000015,
   *   currency: 'USD'
   * }
   */
  cost?: CostConfig;
}

/**
 * Configuration for creating a Promptise registry instance.
 *
 * Compositions can be passed in two formats:
 * 1. **Direct format**: Pass `PromptComposition` directly (no fixtures needed)
 * 2. **Object format**: Pass `CompositionEntry` object (with fixtures)
 *
 * Both formats can be mixed in the same array.
 *
 * @example
 * // Direct format (no fixtures)
 * import { Promptise } from '@promptise/core';
 * import { medicalDiagnosis, codeReview, simplePrompt } from './prompts';
 *
 * export default new Promptise({
 *   compositions: [medicalDiagnosis, codeReview, simplePrompt]
 * });
 *
 * @example
 * // Object format (with fixtures)
 * export default new Promptise({
 *   compositions: [
 *     {
 *       composition: medicalDiagnosis,
 *       fixtures: {
 *         basic: { role: 'general practitioner', task: 'diagnose common symptoms' },
 *         icu: { role: 'intensivist', task: 'stabilize critical patient' }
 *       }
 *     }
 *   ],
 *   defaultCost: {
 *     inputTokenPrice: 0.000005,
 *     outputTokenPrice: 0.000015,
 *     currency: 'USD'
 *   }
 * });
 *
 * @example
 * // Mixed format
 * export default new Promptise({
 *   compositions: [
 *     medicalDiagnosis,  // direct (no fixtures)
 *     {
 *       composition: codeReview,
 *       fixtures: { security: { language: 'typescript', focus: 'security' } }
 *     },
 *     simplePrompt  // direct (no fixtures)
 *   ]
 * });
 */
export interface PromptiseConfig {
  /**
   * Array of compositions.
   *
   * Accepts two formats:
   * 1. **Direct**: `PromptComposition` (no fixtures)
   * 2. **Object**: `CompositionEntry` (with optional fixtures)
   *
   * Both formats can be mixed in the same array.
   * The order determines the order in CLI outputs and listings.
   */
  compositions: CompositionInput[];

  /**
   * Default token pricing used for tooling cost estimation.
   *
   * Resolution order:
   * 1. `CompositionEntry.cost` (entry-specific override)
   * 2. `PromptiseConfig.defaultCost` (global fallback)
   * 3. `undefined` (no estimation configuration)
   *
   * @example
   * defaultCost: {
   *   inputTokenPrice: 0.000005,
   *   outputTokenPrice: 0.000015,
   *   currency: 'USD'
   * }
   */
  defaultCost?: CostConfig;
}
