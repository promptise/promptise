/**
 * Strategy Pattern module - Structural validation for strategies
 */

export { createStrategyPattern } from './factory.js';
export type { StrategyPattern, StrategyPatternStep, StrategyPatternConfig } from './types.js';
export {
  PREBUILT_STRATEGY_PATTERNS,
  DRAFT_CRITIQUE_REFINE_PATTERN,
  REACT_PATTERN,
  CHAIN_OF_DENSITY_PATTERN,
  RESEARCH_OUTLINE_WRITE_EDIT_PATTERN,
  ANALYSIS_HYPOTHESIS_TEST_PATTERN,
} from './prebuilt.js';
export type { PrebuiltStrategyPatternName } from './prebuilt.js';
