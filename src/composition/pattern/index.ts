/**
 * Composition Pattern module - Structural validation for compositions
 */

export { createCompositionPattern } from './factory.js';
export type {
  CompositionPattern,
  CompositionPatternComponent,
  ContentValidation,
  ValidationResult,
  CustomValidator,
  ValidationError,
  ComponentValidationResult,
} from './types.js';
export { validateComponentContent, formatValidationErrors } from './validator.js';
export {
  PREBUILT_PATTERNS,
  RACE_PATTERN,
  COSTAR_PATTERN,
  CHAIN_OF_THOUGHT_PATTERN,
  FEW_SHOT_PATTERN,
  REACT_PATTERN,
} from './prebuilt.js';
export type { PrebuiltPatternName } from './prebuilt.js';
