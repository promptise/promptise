import type { EncodeOptions } from '@toon-format/toon';

/**
 * Optimizer configuration for prompt components
 * Enables token-efficient serialization of structured data
 */
export interface OptimizerConfig {
  /**
   * Enable TOON (Token-Oriented Object Notation) encoding
   * Reduces tokens by 30-60% for arrays of objects
   *
   * - `true`: Uses TOON defaults (comma delimiter, 2-space indent, no key folding)
   * - `EncodeOptions`: Custom TOON configuration (delimiter, indent, keyFolding, etc.)
   *
   * @throws {TypeError} If EncodeOptions contains invalid configuration values
   * @throws {RangeError} If indent is negative or delimiter is empty string
   *
   * @see https://github.com/toon-format/toon
   * @see {@link EncodeOptions} TOON configuration options
   *
   * @example
   * // Use defaults
   * optimizer: { toon: true }
   *
   * @example
   * // Custom configuration for tab-delimited output
   * optimizer: {
   *   toon: {
   *     delimiter: '\t',
   *     indent: 0,
   *     keyFolding: 'safe'
   *   }
   * }
   */
  toon?: boolean | EncodeOptions;
}

/**
 * Optimization metadata tracked per component
 *
 * @example
 * // Typical optimization result
 * {
 *   originalTokens: 1000,
 *   optimizedTokens: 450,
 *   reduction: 55.0,
 *   keysOptimized: ['users', 'products']
 * }
 */
export interface OptimizationMetadata {
  /**
   * Original token count before optimization
   *
   * @minimum 0
   */
  originalTokens: number;

  /**
   * Token count after optimization
   *
   * @minimum 0
   */
  optimizedTokens: number;

  /**
   * Percentage reduction in tokens (0-100)
   *
   * @minimum 0
   * @maximum 100
   */
  reduction: number;

  /**
   * Keys from input object that were optimized
   * Empty array if no optimization occurred
   */
  keysOptimized: string[];
}

/**
 * Result of optimization process
 *
 * @template T - Type of the input object being optimized
 *
 * @example
 * // Optimization with TOON encoding
 * const input = { users: [{ id: 1, name: "Alice" }] };
 * const result: OptimizationResult<typeof input> = {
 *   original: input,
 *   optimized: { users: "[1]{id,name}:\n  1,Alice" },
 *   metadata: {
 *     originalTokens: 50,
 *     optimizedTokens: 20,
 *     reduction: 60.0,
 *     keysOptimized: ['users']
 *   }
 * }
 */
export interface OptimizationResult<T extends Record<string, unknown>> {
  /**
   * Original input (unchanged)
   * Preserved for reference or fallback
   */
  original: T;

  /**
   * TOON-encoded strings for optimized keys
   * Keys are a subset of keys in `original`
   * Only contains keys where optimization provides benefit
   */
  optimized: Partial<Record<keyof T, string>>;

  /**
   * Optimization metadata
   * Contains token counts and reduction percentage
   */
  metadata: OptimizationMetadata;
}
