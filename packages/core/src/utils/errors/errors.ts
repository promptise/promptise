import { ZodError } from 'zod';

/**
 * Formats a Zod validation error into a human-readable message with detailed information.
 *
 * Transforms Zod's technical error structure into user-friendly output with:
 * - Clear header indicating what failed
 * - Detailed breakdown of each validation issue
 * - Path to the problematic field
 * - Error code for programmatic handling
 *
 * @param error - The Zod error to format
 * @param contextLabel - Optional label to identify what was being validated (e.g., "component:userPrompt")
 * @returns A formatted multi-line error message string
 *
 * @throws {TypeError} If error is null or not a valid ZodError instance
 *
 * @see {@link createPromptComponent} Uses this for component validation errors
 * @see {@link createPromptComposition} Uses this for composition validation errors
 *
 * @example
 * // Simple validation error
 * const schema = z.object({ name: z.string() });
 * const result = schema.safeParse({ name: 123 });
 * if (!result.success) {
 *   console.error(formatValidationError(result.error));
 * }
 * // Output:
 * // [Promptise] Validation failed
 * //   Issue 1:
 * //     Path: name
 * //     Problem: Expected string, received number
 * //     Code: invalid_type
 *
 * @example
 * // With context label
 * const error = componentSchema.safeParse(invalid).error;
 * formatValidationError(error, "userPrompt");
 * // Output: [Promptise] Validation failed for "userPrompt"
 *
 * @example
 * // Multiple nested errors
 * const schema = z.object({
 *   user: z.object({
 *     email: z.string().email(),
 *     age: z.number().min(18)
 *   })
 * });
 * const result = schema.safeParse({ user: { email: "bad", age: 10 } });
 * // Shows path as "user.email" and "user.age"
 */
export function formatValidationError(error: ZodError, contextLabel?: string): string {
  const header = contextLabel
    ? `[Promptise] Validation failed for "${contextLabel}"`
    : '[Promptise] Validation failed';

  const issues = error.issues.map((issue, index) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '<root>';
    const message = issue.message;

    let details = `\n  Issue ${String(index + 1)}:`;
    details += `\n    Path: ${path}`;
    details += `\n    Problem: ${message}`;
    details += `\n    Code: ${issue.code}`;

    return details;
  });

  return `${header}\n${issues.join('\n')}`;
}
