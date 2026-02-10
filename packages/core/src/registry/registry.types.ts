import { PromptComposition } from '../composition/composition.types.js';

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
}

/**
 * Configuration for creating a Promptise registry instance.
 *
 * The registry centralizes all compositions and their fixture data.
 * It serves as the configuration point for the Promptise CLI.
 *
 * @example
 * import { Promptise } from '@promptise/core';
 * import { medicalDiagnosis, codeReview } from './prompts';
 *
 * export default new Promptise({
 *   compositions: [
 *     {
 *       composition: medicalDiagnosis,
 *       fixtures: {
 *         basic: { role: 'general practitioner', task: 'diagnose common symptoms' },
 *         icu: { role: 'intensivist', task: 'stabilize critical patient' }
 *       }
 *     },
 *     {
 *       composition: codeReview,
 *       fixtures: {
 *         security: { language: 'typescript', focus: 'security vulnerabilities' }
 *       }
 *     }
 *   ]
 * });
 */
export interface PromptiseConfig {
  /**
   * Array of composition entries with optional fixtures.
   *
   * Each entry contains a composition and its associated fixture data for CLI tooling.
   * The order determines the order in CLI outputs and listings.
   */
  compositions: CompositionEntry[];
}
