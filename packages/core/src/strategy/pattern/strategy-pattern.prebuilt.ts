import { createStrategyPattern } from './strategy-pattern.factory.js';

/**
 * Draft → Critique → Refine pattern.
 * Common iterative refinement workflow for content generation.
 *
 * @example
 * import { DRAFT_CRITIQUE_REFINE_PATTERN } from '@promptise/core';
 *
 * const strategy = createStrategy({
 *   id: 'blog-post',
 *   pattern: DRAFT_CRITIQUE_REFINE_PATTERN,
 *   steps: [
 *     { id: 'draft', composition: draftComposition },
 *     { id: 'critique', composition: critiqueComposition },
 *     { id: 'refine', composition: refineComposition }
 *   ]
 * });
 */
export const DRAFT_CRITIQUE_REFINE_PATTERN = createStrategyPattern({
  id: 'draft-critique-refine',
  description: 'Iterative content refinement through draft, critique, and refine steps',
  steps: [
    { id: 'draft', description: 'Initial content generation' },
    { id: 'critique', description: 'Critical evaluation of draft' },
    { id: 'refine', description: 'Final polished version based on critique' },
  ],
});

/**
 * ReAct pattern: Reasoning and Acting.
 * Thought → Action → Observation loop for agent workflows.
 *
 * @example
 * import { REACT_PATTERN } from '@promptise/core';
 *
 * const agentStrategy = createStrategy({
 *   id: 'agent-workflow',
 *   pattern: REACT_PATTERN,
 *   steps: [
 *     { id: 'thought', composition: thinkComposition },
 *     { id: 'action', composition: actComposition },
 *     { id: 'observation', composition: observeComposition }
 *   ]
 * });
 */
export const REACT_PATTERN = createStrategyPattern({
  id: 'react',
  description: 'Reasoning and Acting pattern with thought, action, and observation',
  steps: [
    { id: 'thought', description: 'Reasoning step - think about the problem' },
    { id: 'action', description: 'Action to take based on reasoning' },
    { id: 'observation', description: 'Observation of action result' },
  ],
});

/**
 * Chain of Density pattern.
 * Initial → Compress → Compress → ... (iterative compression/summarization).
 *
 * @example
 * import { CHAIN_OF_DENSITY_PATTERN } from '@promptise/core';
 *
 * const summaryStrategy = createStrategy({
 *   id: 'dense-summary',
 *   pattern: CHAIN_OF_DENSITY_PATTERN,
 *   steps: [
 *     { id: 'initial', composition: initialSummary },
 *     { id: 'compress-1', composition: compress1 },
 *     { id: 'compress-2', composition: compress2 },
 *     { id: 'compress-3', composition: compress3 },
 *     { id: 'final', composition: finalDense }
 *   ]
 * });
 */
export const CHAIN_OF_DENSITY_PATTERN = createStrategyPattern({
  id: 'chain-of-density',
  description: 'Iterative summarization with increasing density',
  steps: [
    { id: 'initial', description: 'Initial verbose summary' },
    { id: 'compress-1', description: 'First compression pass' },
    { id: 'compress-2', description: 'Second compression pass' },
    { id: 'compress-3', description: 'Third compression pass' },
    { id: 'final', description: 'Final dense summary' },
  ],
});

/**
 * Research → Outline → Write → Edit pattern.
 * Complete content creation pipeline.
 *
 * @example
 * import { RESEARCH_OUTLINE_WRITE_EDIT_PATTERN } from '@promptise/core';
 *
 * const contentStrategy = createStrategy({
 *   id: 'article-creation',
 *   pattern: RESEARCH_OUTLINE_WRITE_EDIT_PATTERN,
 *   steps: [
 *     { id: 'research', composition: researchComposition },
 *     { id: 'outline', composition: outlineComposition },
 *     { id: 'write', composition: writeComposition },
 *     { id: 'edit', composition: editComposition }
 *   ]
 * });
 */
export const RESEARCH_OUTLINE_WRITE_EDIT_PATTERN = createStrategyPattern({
  id: 'research-outline-write-edit',
  description: 'Complete content creation pipeline from research to final edit',
  steps: [
    { id: 'research', description: 'Gather and analyze information' },
    { id: 'outline', description: 'Structure the content' },
    { id: 'write', description: 'Create initial draft' },
    { id: 'edit', description: 'Polish and refine' },
  ],
});

/**
 * Analysis → Hypothesis → Test → Conclusion pattern.
 * Scientific method workflow for problem-solving.
 *
 * @example
 * import { ANALYSIS_HYPOTHESIS_TEST_PATTERN } from '@promptise/core';
 *
 * const scientificStrategy = createStrategy({
 *   id: 'problem-solving',
 *   pattern: ANALYSIS_HYPOTHESIS_TEST_PATTERN,
 *   steps: [
 *     { id: 'analysis', composition: analyzeComposition },
 *     { id: 'hypothesis', composition: hypothesizeComposition },
 *     { id: 'test', composition: testComposition },
 *     { id: 'conclusion', composition: concludeComposition }
 *   ]
 * });
 */
export const ANALYSIS_HYPOTHESIS_TEST_PATTERN = createStrategyPattern({
  id: 'analysis-hypothesis-test',
  description: 'Scientific method approach to problem-solving',
  steps: [
    { id: 'analysis', description: 'Analyze the problem and gather data' },
    { id: 'hypothesis', description: 'Generate hypothesis' },
    { id: 'test', description: 'Test hypothesis' },
    { id: 'conclusion', description: 'Draw conclusions from test results' },
  ],
});

/**
 * Collection of prebuilt strategy patterns for common multi-step workflows.
 *
 * These patterns define structural requirements (presence and order of steps)
 * for different types of multi-turn prompt strategies.
 *
 * @property DRAFT_CRITIQUE_REFINE - Iterative content refinement workflow
 * @property REACT - Reasoning and Acting pattern for agent workflows
 * @property CHAIN_OF_DENSITY - Iterative summarization with increasing density
 * @property RESEARCH_OUTLINE_WRITE_EDIT - Complete content creation pipeline
 * @property ANALYSIS_HYPOTHESIS_TEST - Scientific method for problem-solving
 */
export const PREBUILT_STRATEGY_PATTERNS = {
  DRAFT_CRITIQUE_REFINE: DRAFT_CRITIQUE_REFINE_PATTERN,
  REACT: REACT_PATTERN,
  CHAIN_OF_DENSITY: CHAIN_OF_DENSITY_PATTERN,
  RESEARCH_OUTLINE_WRITE_EDIT: RESEARCH_OUTLINE_WRITE_EDIT_PATTERN,
  ANALYSIS_HYPOTHESIS_TEST: ANALYSIS_HYPOTHESIS_TEST_PATTERN,
} as const;

/**
 * Type helper for accessing prebuilt strategy pattern names.
 *
 * @example
 * const patternName: PrebuiltStrategyPatternName = 'REACT';
 * const pattern = PREBUILT_STRATEGY_PATTERNS[patternName];
 */
export type PrebuiltStrategyPatternName = keyof typeof PREBUILT_STRATEGY_PATTERNS;
