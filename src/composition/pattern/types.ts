/**
 * Result of a custom validation function.
 *
 * @property valid - Whether the validation passed
 * @property message - Optional error/warning message when validation fails
 */
export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Custom validator function type.
 */
export type CustomValidator = (text: string) => ValidationResult;

/**
 * Validation error or warning.
 *
 * @property type - Severity level: 'error' blocks build, 'warning' only logs
 * @property message - Human-readable description of the validation issue
 */
export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
}

/**
 * Result of component content validation.
 *
 * @property valid - Whether all validation rules passed (no errors)
 * @property errors - List of validation errors and warnings encountered
 */
export interface ComponentValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Content validation rules for a component.
 *
 * @remarks
 * Validations execute during `composition.build()`, after components render their content.
 * - Errors block the build and throw an exception
 * - Warnings only appear in validation results, build continues
 *
 * @property required - Keywords that MUST be present (case-insensitive)
 * @property optional - Keywords that SHOULD be present (warnings only)
 * @property forbidden - Keywords that MUST NOT appear (case-insensitive)
 * @property maxTokens - Maximum allowed tokens for this component
 * @property maxLength - Maximum allowed character length
 * @property custom - Custom validation functions for complex logic
 */
export interface ContentValidation {
  /**
   * Keywords that MUST be present in the component text.
   * Case-insensitive matching.
   *
   * @example
   * required: ['HIPAA', 'PHI', 'confidential']
   */
  readonly required?: readonly string[];

  /**
   * Keywords that SHOULD be present (validation warning, not error).
   * Useful for best practices that aren't critical.
   *
   * @example
   * optional: ['FDA', 'HL7', 'compliance']
   */
  readonly optional?: readonly string[];

  /**
   * Keywords that MUST NOT appear in the component text.
   * Case-insensitive matching to avoid accidental violations.
   *
   * @example
   * forbidden: ['diagnose', 'prescribe', 'cure', 'treat']
   */
  readonly forbidden?: readonly string[];

  /**
   * Maximum allowed tokens for this component.
   * Uses the tokenizer utility to count tokens.
   * Helps prevent context window overflow.
   *
   * @example
   * maxTokens: 500
   */
  maxTokens?: number;

  /**
   * Custom validation functions for complex logic.
   * Always use an array for consistency, even with single validator.
   *
   * @example
   * custom: [
   *   (text) => ({
   *     valid: /example \d+:/gi.test(text),
   *     message: 'Must include numbered examples'
   *   }),
   *   (text) => ({
   *     valid: text.split('\n').length >= 3,
   *     message: 'Must have at least 3 lines'
   *   })
   * ]
   */
  readonly custom?: readonly CustomValidator[];
}

/**
 * Represents a single semantic component required by a structure pattern.
 *
 * @remarks
 * Patterns are optional. When provided to a composition, validation occurs
 * automatically during `composition.build()` to ensure components match
 * the expected structure and content requirements.
 *
 * @property key - Semantic identifier matching component key (e.g., 'role', 'task')
 * @property description - Optional human-readable explanation of component purpose
 * @property validation - Content validation rules applied after component renders
 */
export interface CompositionPatternComponent {
  /**
   * The semantic key that must be present in the composition's structure.
   * This should match the component's purpose (e.g., 'role', 'action', 'context').
   */
  key: string;

  /**
   * An optional description of what this component represents. Useful for documentation and error messages.
   */
  description?: string;

  /**
   * Content validation rules for components using this key.
   * Validated when composition.build() is called.
   */
  validation?: ContentValidation;
}

/**
 * Defines the structural pattern for a prompt composition (e.g., 'RACE', 'COSTAR').
 * Enforces which components must be present and in what order.
 *
 * @remarks
 * Patterns are optional configuration passed to `createPromptComposition()`.
 * When provided, the pattern validates component structure and content during
 * every `composition.build()` call. Use prebuilt patterns (RACE_PATTERN, COSTAR_PATTERN)
 * or create custom patterns with `createCompositionPattern()`.
 *
 * @property id - Unique pattern identifier (e.g., 'race', 'costar', 'chain-of-thought')
 * @property description - Optional explanation of pattern's purpose and use cases
 * @property maxTokens - Maximum total tokens for entire prompt (throws error if exceeded)
 * @property components - Ordered array of required components with validation rules
 */
export interface CompositionPattern {
  /**
   * Unique identifier for the pattern.
   * @example 'race' | 'costar' | 'chain-of-thought'
   */
  id: string;

  /**
   * An optional description of the pattern and its intended use case.
   */
  description?: string;

  /**
   * Maximum total tokens for the entire prompt (optional).
   * If exceeded, validation will throw an error.
   * Use this for model context window limits.
   *
   * @example
   * maxTokens: 8000 // Ensures prompt fits GPT-4 8K context window
   *
   * @example
   * maxTokens: 128000 // For GPT-4 Turbo 128K context window
   */
  maxTokens?: number;

  /**
   * An ordered array of semantic components required by this pattern.
   * The validator enforces that components in the composition's structure
   * appear in the same order as defined here.
   */
  readonly components: readonly CompositionPatternComponent[];
}
