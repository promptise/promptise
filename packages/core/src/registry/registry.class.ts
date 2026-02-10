import { PromptiseConfig, CompositionEntry } from './registry.types.js';

/**
 * Central registry for prompt compositions and their fixture data.
 *
 * Promptise centralizes all compositions and fixtures in your project:
 * - Unified access to all registered compositions
 * - Fixture data for CLI preview generation
 * - Single source of truth for your prompt catalog
 * - Integration point for tooling (CLI, documentation generators, etc.)
 *
 * **Note on fixtures:** Fixtures are mock/test data used exclusively by developer tooling.
 * They are not used in production code. In production, always pass real data to `composition.build(data)`.
 *
 * @example
 * // Create compositions (no fixtures in composition)
 * const medicalDiagnosis = createPromptComposition({
 *   id: 'medical-diagnosis',
 *   components: [roleComp, taskComp]
 * });
 *
 * const codeReview = createPromptComposition({
 *   id: 'code-review',
 *   components: [systemComp, instructionsComp]
 * });
 *
 * // Register with fixtures in registry
 * export default new Promptise({
 *   compositions: [
 *     {
 *       composition: medicalDiagnosis,
 *       fixtures: {
 *         basic: { role: 'doctor', task: 'diagnose symptoms' },
 *         icu: { role: 'intensivist', task: 'stabilize patient' }
 *       }
 *     },
 *     {
 *       composition: codeReview,
 *       fixtures: {
 *         security: { language: 'typescript', focus: 'security' }
 *       }
 *     }
 *   ]
 * });
 *
 * @example
 * // CLI usage
 * const registry = await import('./promptise.config.js');
 * for (const entry of registry.default.getCompositions()) {
 *   const fixtureCount = Object.keys(entry.fixtures ?? {}).length;
 *   console.log(`${entry.composition.id}: ${fixtureCount} fixtures`);
 * }
 */
export class Promptise {
  /**
   * Internal array of compositions with their fixtures.
   * @private
   */
  private readonly _compositions: CompositionEntry[];

  /**
   * Creates a new Promptise registry instance.
   *
   * Validates that all composition IDs are unique and stores composition entries
   * with their fixture data for access by CLI and other tooling.
   *
   * @param config - Registry configuration with composition entries
   * @throws {Error} When duplicate composition IDs are found
   *
   * @example
   * const registry = new Promptise({
   *   compositions: [
   *     {
   *       composition: createPromptComposition({ id: 'prompt-1', components: [...] }),
   *       fixtures: { test: { ... } }
   *     },
   *     {
   *       composition: createPromptComposition({ id: 'prompt-2', components: [...] }),
   *       fixtures: { basic: { ... } }
   *     }
   *   ]
   * });
   */
  constructor(config: PromptiseConfig) {
    this.validateUniqueIds(config.compositions);
    this._compositions = config.compositions;
  }

  /**
   * Get all compositions with their fixture data.
   *
   * Returns the complete array of composition entries, each containing
   * a composition and its associated fixture data.
   *
   * Primary method used by CLI for preview generation.
   * In production code, simply ignore the `fixtures` property.
   *
   * @returns Array of all registered compositions with optional fixtures
   *
   * @example
   * // CLI preview generation
   * for (const entry of registry.getCompositions()) {
   *   console.log(`Generating previews for ${entry.composition.id}...`);
   *
   *   const fixtures = entry.fixtures ?? {};
   *   for (const [fixtureName, fixtureData] of Object.entries(fixtures)) {
   *     const preview = entry.composition.build(fixtureData);
   *     // Write preview to file
   *   }
   * }
   *
   * @example
   * // Production usage - just use compositions
   * const compositions = registry.getCompositions();
   * for (const entry of compositions) {
   *   // Use entry.composition, ignore entry.fixtures
   *   console.log(entry.composition.id);
   * }
   */
  getCompositions(): CompositionEntry[] {
    return this._compositions;
  }

  /**
   * Get a specific composition by ID.
   *
   * Returns the composition entry (composition + optional fixtures) if found,
   * or `undefined` if no composition with the given ID exists.
   *
   * @param id - The unique identifier of the composition to retrieve
   * @returns The composition entry if found, or `undefined`
   *
   * @example
   * // Retrieve composition with fixtures
   * const entry = registry.getComposition('medical-diagnosis');
   * if (entry) {
   *   const { composition, fixtures } = entry;
   *   console.log(`${composition.id} has ${Object.keys(fixtures ?? {}).length} fixtures`);
   * }
   *
   * @example
   * // Production usage - use the composition
   * const entry = registry.getComposition('medical-diagnosis');
   * if (entry) {
   *   const prompt = entry.composition.build({ role: 'doctor', task: 'diagnose' });
   *   console.log(prompt.asString());
   * }
   *
   * @example
   * // Handle missing composition
   * const entry = registry.getComposition('non-existent');
   * if (!entry) {
   *   console.error('Composition not found');
   * }
   */
  getComposition(id: string): CompositionEntry | undefined {
    return this._compositions.find((entry) => entry.composition.id === id);
  }

  /**
   * Validates that all composition IDs are unique within the registry.
   *
   * @param entries - Array of composition entries to validate
   * @throws {Error} When duplicate composition IDs are found
   *
   * @private
   */
  private validateUniqueIds(entries: CompositionEntry[]): void {
    const ids = entries.map((entry) => entry.composition.id);
    const uniqueIds = new Set(ids);

    if (ids.length !== uniqueIds.size) {
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      throw new Error(
        `[Promptise] Registry contains duplicate composition IDs.\n` +
          `> Duplicate IDs: ${[...new Set(duplicates)].join(', ')}\n` +
          `> All composition IDs must be unique within the registry.`,
      );
    }
  }
}
