/**
 * Strategy Pattern module - Structural validation for strategies
 */

export { createStrategyPattern } from './strategy-pattern.factory.js';
export type {
  StrategyPattern,
  StrategyPatternStep,
  StrategyPatternConfig,
} from './strategy-pattern.types.js';
export {
  PREBUILT_STRATEGY_PATTERNS,
  DRAFT_CRITIQUE_REFINE_PATTERN,
  REACT_PATTERN,
  CHAIN_OF_DENSITY_PATTERN,
  RESEARCH_OUTLINE_WRITE_EDIT_PATTERN,
  ANALYSIS_HYPOTHESIS_TEST_PATTERN,
} from './strategy-pattern.prebuilt.js';
export type { PrebuiltStrategyPatternName } from './strategy-pattern.prebuilt.js';
