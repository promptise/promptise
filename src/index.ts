/**
 * Promptise - A powerful and type-safe prompt engineering framework.
 *
 * This file serves as the main entry point to the library, exporting
 * all the public-facing APIs for creating and managing prompts.
 */

// --- Export Core Types ---
export type {
  ChatMessage,
  UniversalPromptInstance,
  CostMetadata,
  ComponentMetadata,
  CostConfig,
} from './core/index.js';

// --- Export Component Feature ---
export { createPromptComponent } from './component/index.js';
export type { PromptComponent, PromptComponentConfig } from './component/index.js';

// --- Export Composition Feature ---
export { createPromptComposition } from './composition/index.js';
export type {
  PromptComposition,
  PromptCompositionConfig,
  WrapperStyle,
} from './composition/index.js';

// --- Export Composition Pattern Feature ---
export { createCompositionPattern } from './composition/pattern/index.js';
export type {
  CompositionPattern,
  CompositionPatternComponent,
  ContentValidation,
} from './composition/pattern/index.js';
export {
  PREBUILT_PATTERNS,
  RACE_PATTERN,
  COSTAR_PATTERN,
  CHAIN_OF_THOUGHT_PATTERN,
  FEW_SHOT_PATTERN,
  REACT_PATTERN as COMPOSITION_REACT_PATTERN,
} from './composition/pattern/index.js';
export type { PrebuiltPatternName } from './composition/pattern/index.js';

// --- Export Strategy Feature ---
export { createPromptStrategy } from './strategy/index.js';
export type {
  PromptStrategy,
  PromptStrategyConfig,
  StrategyHistory,
  StrategyProgress,
} from './strategy/index.js';

// --- Export Strategy Pattern Feature ---
export { createStrategyPattern } from './strategy/pattern/index.js';
export type { StrategyPattern, StrategyPatternStep } from './strategy/pattern/index.js';
export {
  PREBUILT_STRATEGY_PATTERNS,
  DRAFT_CRITIQUE_REFINE_PATTERN,
  REACT_PATTERN as STRATEGY_REACT_PATTERN,
  CHAIN_OF_DENSITY_PATTERN,
  RESEARCH_OUTLINE_WRITE_EDIT_PATTERN,
  ANALYSIS_HYPOTHESIS_TEST_PATTERN,
} from './strategy/pattern/index.js';
export type { PrebuiltStrategyPatternName } from './strategy/pattern/index.js';

// --- Export Optimizer Feature ---
export type { OptimizerConfig, OptimizationMetadata } from './component/optimizer/types.js';

// --- Export Core Utilities ---
export { formatValidationError, countTokens } from './core/index.js';
