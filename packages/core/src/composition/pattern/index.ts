/**
 * Composition Pattern module - Structural validation for compositions
 */

export { createCompositionPattern } from './composition-pattern.factory.js';
export type {
  CompositionPattern,
  CompositionPatternComponent,
  ContentValidation,
  ValidationResult,
  CustomValidator,
  ValidationError,
  ComponentValidationResult,
} from './composition-pattern.types.js';
export {
  validateComponentContent,
  formatValidationErrors,
} from './composition-pattern.validator.js';
export {
  PREBUILT_PATTERNS,
  RACE_PATTERN,
  COSTAR_PATTERN,
  CHAIN_OF_THOUGHT_PATTERN,
  FEW_SHOT_PATTERN,
  REACT_PATTERN,
} from './composition-pattern.prebuilt.js';
export type { PrebuiltPatternName } from './composition-pattern.prebuilt.js';
