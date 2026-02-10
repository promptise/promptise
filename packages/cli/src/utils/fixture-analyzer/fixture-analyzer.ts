/**
 * Fixture analysis utility.
 */

import type { ZodObject } from 'zod';
import type { FixtureAnalysis } from '../../types.js';

interface ZodField {
  isOptional: () => boolean;
}

/**
 * Analyze fixture data against a schema to determine completeness.
 *
 * @param schema - Zod schema to validate against
 * @param fixtureData - Fixture data to analyze
 * @returns Analysis result with status and field information
 *
 * @example
 * const schema = z.object({ role: z.string(), task: z.string() });
 * analyzeFixtureStatus(schema, { role: 'doctor' });
 * // → { status: 'partial', statusLabel: 'partial - 1/2 required', ... }
 */
export function analyzeFixtureStatus(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Schema can have any shape
  schema: ZodObject<any>,
  fixtureData: Record<string, unknown>,
): FixtureAnalysis {
  const shape = schema.shape as Record<string, ZodField>;
  const allFields = Object.keys(shape);

  const requiredFields = allFields.filter((key) => {
    const field = shape[key];
    return field && !field.isOptional();
  });

  const optionalFields = allFields.filter((key) => {
    const field = shape[key];
    return field?.isOptional();
  });

  const fixtureKeys = Object.keys(fixtureData);

  const providedRequired = requiredFields.filter((key) => fixtureKeys.includes(key));
  const missingRequired = requiredFields.filter((key) => !fixtureKeys.includes(key));

  let status: 'full' | 'partial' | 'placeholder';
  let statusLabel: string;

  if (missingRequired.length === 0) {
    status = 'full';
    statusLabel =
      requiredFields.length > 0
        ? `complete - ${requiredFields.length}/${requiredFields.length}`
        : 'complete - no required fields';
  } else if (providedRequired.length > 0) {
    status = 'partial';
    statusLabel = `partial - ${providedRequired.length}/${requiredFields.length}`;
  } else {
    status = 'placeholder';
    statusLabel = `empty - 0/${requiredFields.length}`;
  }

  return {
    status,
    statusLabel,
    provided: providedRequired,
    missing: missingRequired,
    requiredFields,
    optionalFields,
  };
}
