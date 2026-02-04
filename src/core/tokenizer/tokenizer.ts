import { getEncoding } from 'js-tiktoken';

/**
 * Counts the number of tokens in a given text string.
 *
 * @param text - The text to tokenize and count
 * @returns The number of tokens in the text
 *
 * @remarks
 * Uses `o200k_base` encoding (GPT-4o, GPT-4o-mini, o1, o1-mini models).
 * For other models, token counts may vary slightly:
 * - GPT-4, GPT-3.5: Use `cl100k_base` (~1-2% difference)
 * - Claude, Gemini: Different tokenizers (not compatible)
 *
 * This is an estimation utility. For billing-critical applications,
 * always use the token count returned by the LLM provider's API.
 *
 * @example
 * ```typescript
 * import { countTokens } from "@promptise/core";
 *
 * const text = "Hello, world!";
 * const tokens = countTokens(text);
 * console.log(`${text} = ${tokens} tokens`); // "Hello, world!" = 4 tokens
 * ```
 *
 * @example
 * ```typescript
 * // JSON structure tokenization
 * const data = { users: [{ id: 1, name: "Alice" }] };
 * const jsonString = JSON.stringify(data);
 * const tokens = countTokens(jsonString);
 * ```
 *
 * @see https://github.com/openai/tiktoken - Official tokenizer reference
 */
export function countTokens(text: string): number {
  const encoding = getEncoding('o200k_base');
  return encoding.encode(text).length;
}
