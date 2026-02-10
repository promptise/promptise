/**
 * Template placeholder extraction utility.
 */

/**
 * Extract {{placeholder}} variables from a string template.
 *
 * @param template - Template string to extract from
 * @returns Array of placeholder names
 *
 * @example
 * extractPlaceholders('Hello {{name}}, you are {{age}} years old')
 * // Returns: ['name', 'age']
 */
export function extractPlaceholders(template: string): string[] {
  const regex = /\{\{(\w+)\}\}/g;
  const matches = template.matchAll(regex);
  return Array.from(matches, (m) => m[1] ?? '');
}
