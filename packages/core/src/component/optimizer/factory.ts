import { encode } from '@toon-format/toon';
import type { OptimizerConfig, OptimizationResult, OptimizationMetadata } from './types.js';
import { countTokens } from '../../core/tokenizer/tokenizer.js';

export type { OptimizationMetadata };

/**
 * Determines if a value should be TOON-optimized
 * Only arrays of objects and nested objects benefit from TOON encoding
 *
 * @param value - Value to check
 * @returns true if value should be optimized
 */
export function shouldOptimize(value: unknown): boolean {
  // Optimize arrays of objects with uniform structure
  if (Array.isArray(value)) {
    return value.length > 0 && value.every((item) => typeof item === 'object' && item !== null);
  }

  // Optimize nested objects
  if (typeof value === 'object' && value !== null) {
    return true;
  }

  // Primitives don't benefit from TOON
  return false;
}

/**
 * Applies TOON optimization to input object
 * Only optimizes keys where it provides benefit (arrays of objects, nested objects)
 *
 * @param input - Input data to optimize
 * @param config - Optimizer configuration
 * @returns Optimization result with original, optimized, and metadata
 */
export function optimizeInput<T extends Record<string, unknown>>(
  input: T,
  config: OptimizerConfig,
): OptimizationResult<T> {
  const optimized: Partial<Record<keyof T, string>> = {};
  const keysOptimized: string[] = [];

  // Process TOON optimizer
  if (config.toon) {
    // Use custom config if provided, otherwise use TOON defaults
    const toonConfig = typeof config.toon === 'boolean' ? undefined : config.toon;

    for (const [key, value] of Object.entries(input)) {
      if (shouldOptimize(value)) {
        (optimized as Record<string, string>)[key] = encode(value, toonConfig);
        keysOptimized.push(key);
      }
    }
  }

  // Calculate token savings
  const originalTokens = countTokens(JSON.stringify(input));
  const optimizedTokens = countTokens(Object.values(optimized).join('\n'));
  const reduction =
    keysOptimized.length > 0 ? ((originalTokens - optimizedTokens) / originalTokens) * 100 : 0;

  return {
    original: input,
    optimized,
    metadata: {
      originalTokens,
      optimizedTokens,
      reduction,
      keysOptimized,
    },
  };
}
