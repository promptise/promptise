import {
  ContentValidation,
  ValidationError,
  ComponentValidationResult,
} from './composition-pattern.types.js';
import { countTokens } from '../../utils/tokenizer/tokenizer.js';

// Constants for validation error types
const ERROR_TYPE = 'error' as const;
const WARNING_TYPE = 'warning' as const;

/**
 * Validates component content against pattern validation rules.
 *
 * @param componentId - Unique ID of the component being validated
 * @param patternKey - Pattern key name (e.g., 'role', 'task', 'rules')
 * @param text - Rendered component text to validate
 * @param validation - Validation rules to apply
 * @param validation.required - Keywords that must all be present (case-insensitive)
 * @param validation.optional - Keywords that should be present (warnings if missing)
 * @param validation.forbidden - Keywords that must not appear (case-insensitive)
 * @param validation.maxTokens - Maximum allowed token count
 * @param validation.custom - Custom validation functions with specific error messages
 * @returns Validation result with `valid` flag and list of errors/warnings
 *
 * @example
 * ```typescript
 * const result = validateComponentContent(
 *   'medical-disclaimer',
 *   'rules',
 *   'This AI ensures HIPAA compliance and PHI protection.',
 *   {
 *     required: ['HIPAA', 'PHI'],
 *     forbidden: ['diagnose', 'prescribe'],
 *     maxTokens: 100
 *   }
 * );
 *
 * if (!result.valid) {
 *   console.error('Validation failed:', result.errors);
 * }
 * ```
 */
export function validateComponentContent(
  _componentId: string,
  _patternKey: string,
  text: string,
  validation: ContentValidation,
): ComponentValidationResult {
  const errors: ValidationError[] = [];

  // Early return if no validation rules are configured
  const hasAnyValidation =
    Boolean(validation.required) ||
    Boolean(validation.optional) ||
    Boolean(validation.forbidden) ||
    validation.maxTokens !== undefined ||
    Boolean(validation.custom);

  if (!hasAnyValidation) {
    return { valid: true, errors: [] };
  }

  // 1. Required keywords - all must be present (case-insensitive, whole word matching)
  if (validation.required) {
    validation.required.forEach((keyword) => {
      // Skip empty keywords
      if (!keyword || keyword.trim() === '') {
        return;
      }

      // Use word boundaries for whole-word matching to avoid substring matches
      const escapedKeyword = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');

      if (!regex.test(text)) {
        errors.push({
          type: ERROR_TYPE,
          message: `Missing required keyword "${keyword}"`,
        });
      }
    });
  }

  // 2. Optional keywords - warnings only, not blocking (case-insensitive, whole word)
  if (validation.optional) {
    validation.optional.forEach((keyword) => {
      // Skip empty keywords
      if (!keyword || keyword.trim() === '') {
        return;
      }

      const escapedKeyword = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');

      if (!regex.test(text)) {
        errors.push({
          type: WARNING_TYPE,
          message: `Recommended keyword "${keyword}" not found`,
        });
      }
    });
  }

  // 3. Forbidden keywords - none should appear (case-insensitive, whole word)
  if (validation.forbidden) {
    validation.forbidden.forEach((keyword) => {
      // Skip empty keywords
      if (!keyword || keyword.trim() === '') {
        return;
      }

      const escapedKeyword = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedKeyword}\\b`, 'i');

      if (regex.test(text)) {
        errors.push({
          type: ERROR_TYPE,
          message: `Contains forbidden keyword "${keyword}"`,
        });
      }
    });
  }

  // 4. Maximum token count - prevent context window overflow
  if (validation.maxTokens !== undefined) {
    if (validation.maxTokens <= 0) {
      errors.push({
        type: ERROR_TYPE,
        message: `Invalid maxTokens configuration: ${String(validation.maxTokens)} (must be positive)`,
      });
    } else {
      const tokenCount = countTokens(text);
      if (tokenCount > validation.maxTokens) {
        errors.push({
          type: ERROR_TYPE,
          message: `Exceeds max tokens: ${String(tokenCount)} > ${String(validation.maxTokens)} tokens`,
        });
      }
    }
  }

  // 6. Custom validators - user-defined validation logic
  if (validation.custom) {
    validation.custom.forEach((validator, index) => {
      try {
        const result = validator(text);

        // Validate result structure (handle null/undefined returns)
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!result || typeof result.valid !== 'boolean') {
          errors.push({
            type: ERROR_TYPE,
            message: `Custom validator #${String(index + 1)} returned invalid result`,
          });
          return;
        }

        if (!result.valid) {
          errors.push({
            type: ERROR_TYPE,
            message: result.message ?? `Custom validator #${String(index + 1)} failed`,
          });
        }
      } catch (error) {
        // Re-throw validator exceptions to make debugging easier
        throw error;
      }
    });
  }

  // Component is valid if there are no errors (warnings don't block)
  const hasErrors = errors.some((e) => e.type === ERROR_TYPE);

  return {
    valid: !hasErrors,
    errors,
  };
}

/**
 * Formats validation errors into a human-readable error message.
 *
 * @param componentId - Unique ID of the component that failed validation
 * @param patternKey - Pattern key name for the component
 * @param errors - List of validation errors and warnings to format
 * @returns Multi-line formatted error message with errors and warnings sections
 *
 * @example
 * ```typescript
 * const errors: ValidationError[] = [
 *   { type: 'error', message: 'Missing required keyword "HIPAA"' },
 *   { type: 'warning', message: 'Recommended keyword "FDA" not found' }
 * ];
 *
 * const message = formatValidationErrors('medical-rules', 'rules', errors);
 * console.error(message);
 * // Output:
 * // [Promptise] Component "medical-rules" for key "rules" validation failed:
 * //
 * // Errors:
 * //   - Missing required keyword "HIPAA"
 * //
 * // Warnings:
 * //   - Recommended keyword "FDA" not found
 * ```
 */
export function formatValidationErrors(
  componentId: string,
  patternKey: string,
  errors: ValidationError[],
): string {
  const errorMessages = errors.filter((e) => e.type === ERROR_TYPE).map((e) => `  - ${e.message}`);

  const warningMessages = errors
    .filter((e) => e.type === WARNING_TYPE)
    .map((e) => `  - ${e.message}`);

  let message = `[Promptise] Component "${componentId}" for key "${patternKey}" validation failed:`;

  if (errorMessages.length > 0) {
    message += `\n\nErrors:\n${errorMessages.join('\n')}`;
  }

  if (warningMessages.length > 0) {
    message += `\n\nWarnings:\n${warningMessages.join('\n')}`;
  }

  return message;
}
