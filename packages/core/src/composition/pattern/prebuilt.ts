import { createCompositionPattern } from './factory.js';

/**
 * RACE pattern: Role, Action, Context, Examples.
 * A popular prompt engineering pattern for structured prompts.
 *
 * @example
 * ```typescript
 * import { createPromptComposition, RACE_PATTERN } from '@promptise/core';
 *
 * const composition = createPromptComposition({
 *   id: 'customer-support',
 *   components: [roleComp, actionComp, contextComp, examplesComp],
 *   pattern: RACE_PATTERN // Validates structure and order
 * });
 * ```
 */
export const RACE_PATTERN = createCompositionPattern({
  id: 'race',
  description: 'Role, Action, Context, Examples - A structured pattern for clear task definition',
  components: [
    {
      key: 'role',
      description: 'Define the AI assistant role (e.g., "You are a helpful medical assistant")',
    },
    {
      key: 'action',
      description: 'Specify the task to perform (e.g., "Analyze this patient data")',
    },
    {
      key: 'context',
      description: 'Provide relevant background information',
    },
    {
      key: 'examples',
      description: 'Few-shot examples showing input/output pairs',
    },
  ],
});

/**
 * COSTAR pattern: Context, Objective, Style, Tone, Audience, Response.
 * A comprehensive pattern for detailed prompt specifications.
 *
 * @example
 * ```typescript
 * import { createPromptComposition, COSTAR_PATTERN } from '@promptise/core';
 *
 * const composition = createPromptComposition({
 *   id: 'content-generation',
 *   components: [contextComp, objectiveComp, styleComp, toneComp, audienceComp, responseComp],
 *   pattern: COSTAR_PATTERN
 * });
 * ```
 */
export const COSTAR_PATTERN = createCompositionPattern({
  id: 'costar',
  description:
    'Context, Objective, Style, Tone, Audience, Response - Comprehensive prompt specification',
  components: [
    {
      key: 'context',
      description: 'Background and situational information',
    },
    {
      key: 'objective',
      description: 'The goal or purpose of the task',
    },
    {
      key: 'style',
      description: 'Writing or communication style (e.g., formal, casual, technical)',
    },
    {
      key: 'tone',
      description: 'Emotional tone (e.g., professional, empathetic, authoritative)',
    },
    {
      key: 'audience',
      description: 'Target audience for the response',
    },
    {
      key: 'response',
      description: 'Expected response format (e.g., JSON, bullet points, paragraph)',
    },
  ],
});

/**
 * Chain-of-Thought pattern for step-by-step reasoning.
 * Encourages transparency in problem-solving by breaking down complex tasks.
 *
 * @example
 * ```typescript
 * import { createPromptComposition, CHAIN_OF_THOUGHT_PATTERN } from '@promptise/core';
 *
 * const composition = createPromptComposition({
 *   id: 'math-problem-solver',
 *   components: [taskComp, reasoningComp, constraintsComp],
 *   pattern: CHAIN_OF_THOUGHT_PATTERN
 * });
 * ```
 */
export const CHAIN_OF_THOUGHT_PATTERN = createCompositionPattern({
  id: 'chain-of-thought',
  description: 'Step-by-step reasoning pattern for complex problem-solving',
  components: [
    {
      key: 'task',
      description: 'The problem or question to solve',
    },
    {
      key: 'reasoning',
      description: 'Instructions for step-by-step reasoning approach',
    },
    {
      key: 'constraints',
      description: 'Rules, limitations, or requirements to follow',
    },
  ],
});

/**
 * Few-Shot pattern for learning from examples.
 * Demonstrates desired behavior through multiple input/output pairs.
 *
 * @example
 * ```typescript
 * import { createPromptComposition, FEW_SHOT_PATTERN } from '@promptise/core';
 *
 * const composition = createPromptComposition({
 *   id: 'sentiment-classifier',
 *   components: [instructionComp, examplesComp, taskComp],
 *   pattern: FEW_SHOT_PATTERN
 * });
 * ```
 */
export const FEW_SHOT_PATTERN = createCompositionPattern({
  id: 'few-shot',
  description: 'Examples-based learning pattern for consistent outputs',
  components: [
    {
      key: 'instruction',
      description: 'Clear instruction of what to do',
    },
    {
      key: 'examples',
      description: 'Multiple input/output example pairs',
    },
    {
      key: 'task',
      description: 'The actual task to perform using the learned pattern',
    },
  ],
});

/**
 * ReAct pattern: Reasoning + Acting.
 * Combines reasoning traces with task-specific actions in an interleaved manner.
 *
 * @example
 * ```typescript
 * import { createPromptComposition, REACT_PATTERN } from '@promptise/core';
 *
 * const composition = createPromptComposition({
 *   id: 'research-agent',
 *   components: [thoughtComp, actionComp, observationComp],
 *   pattern: REACT_PATTERN
 * });
 * ```
 */
export const REACT_PATTERN = createCompositionPattern({
  id: 'react',
  description: 'Reasoning + Acting - Interleave reasoning and action steps',
  components: [
    {
      key: 'thought',
      description: 'Reasoning step: what to think about',
    },
    {
      key: 'action',
      description: 'Action step: what to do',
    },
    {
      key: 'observation',
      description: 'Observation step: what was observed',
    },
  ],
});

/**
 * Collection of all prebuilt composition patterns.
 *
 * @property RACE - Role, Action, Context, Examples pattern
 * @property COSTAR - Context, Objective, Style, Tone, Audience, Response pattern
 * @property CHAIN_OF_THOUGHT - Step-by-step reasoning pattern
 * @property FEW_SHOT - Examples-based learning pattern
 * @property REACT - Reasoning + Acting interleaved pattern
 *
 * @example
 * ```typescript
 * import { PREBUILT_PATTERNS } from '@promptise/core';
 *
 * const pattern = PREBUILT_PATTERNS.RACE;
 * const allPatternNames = Object.keys(PREBUILT_PATTERNS);
 * ```
 */
export const PREBUILT_PATTERNS = {
  RACE: RACE_PATTERN,
  COSTAR: COSTAR_PATTERN,
  CHAIN_OF_THOUGHT: CHAIN_OF_THOUGHT_PATTERN,
  FEW_SHOT: FEW_SHOT_PATTERN,
  REACT: REACT_PATTERN,
} as const;

/**
 * Type helper for prebuilt pattern names.
 * Use this type to ensure type-safe access to PREBUILT_PATTERNS.
 *
 * @example
 * ```typescript
 * import { PrebuiltPatternName, PREBUILT_PATTERNS } from '@promptise/core';
 *
 * function getPattern(name: PrebuiltPatternName) {
 *   return PREBUILT_PATTERNS[name];
 * }
 *
 * const pattern = getPattern('RACE'); // ✓ Type-safe
 * const invalid = getPattern('InvalidName'); // ✗ TypeScript error
 * ```
 */
export type PrebuiltPatternName = keyof typeof PREBUILT_PATTERNS;
