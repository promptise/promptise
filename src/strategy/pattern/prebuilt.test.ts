import { describe, it, expect } from '@jest/globals';
import {
  DRAFT_CRITIQUE_REFINE_PATTERN,
  REACT_PATTERN,
  CHAIN_OF_DENSITY_PATTERN,
  RESEARCH_OUTLINE_WRITE_EDIT_PATTERN,
  ANALYSIS_HYPOTHESIS_TEST_PATTERN,
  PREBUILT_STRATEGY_PATTERNS,
  type PrebuiltStrategyPatternName,
} from './prebuilt';

describe('Prebuilt Strategy Patterns', () => {
  describe('DRAFT_CRITIQUE_REFINE_PATTERN', () => {
    it('has correct structure', () => {
      expect(DRAFT_CRITIQUE_REFINE_PATTERN.id).toBe('draft-critique-refine');
      expect(DRAFT_CRITIQUE_REFINE_PATTERN.steps).toHaveLength(3);
      expect(DRAFT_CRITIQUE_REFINE_PATTERN.steps[0].id).toBe('draft');
      expect(DRAFT_CRITIQUE_REFINE_PATTERN.steps[1].id).toBe('critique');
      expect(DRAFT_CRITIQUE_REFINE_PATTERN.steps[2].id).toBe('refine');
    });

    it('has descriptions for all steps', () => {
      DRAFT_CRITIQUE_REFINE_PATTERN.steps.forEach((step) => {
        expect(step.description).toBeDefined();
        expect(typeof step.description).toBe('string');
      });
    });
  });

  describe('REACT_PATTERN', () => {
    it('has correct structure for ReAct workflow', () => {
      expect(REACT_PATTERN.id).toBe('react');
      expect(REACT_PATTERN.steps).toHaveLength(3);
      expect(REACT_PATTERN.steps[0].id).toBe('thought');
      expect(REACT_PATTERN.steps[1].id).toBe('action');
      expect(REACT_PATTERN.steps[2].id).toBe('observation');
    });
  });

  describe('CHAIN_OF_DENSITY_PATTERN', () => {
    it('has correct structure', () => {
      expect(CHAIN_OF_DENSITY_PATTERN.id).toBe('chain-of-density');
      expect(CHAIN_OF_DENSITY_PATTERN.steps).toHaveLength(5);
      expect(CHAIN_OF_DENSITY_PATTERN.steps[0].id).toBe('initial');
      expect(CHAIN_OF_DENSITY_PATTERN.steps[4].id).toBe('final');
    });
  });

  describe('RESEARCH_OUTLINE_WRITE_EDIT_PATTERN', () => {
    it('has correct structure', () => {
      expect(RESEARCH_OUTLINE_WRITE_EDIT_PATTERN.id).toBe('research-outline-write-edit');
      expect(RESEARCH_OUTLINE_WRITE_EDIT_PATTERN.steps).toHaveLength(4);
      expect(RESEARCH_OUTLINE_WRITE_EDIT_PATTERN.steps[0].id).toBe('research');
      expect(RESEARCH_OUTLINE_WRITE_EDIT_PATTERN.steps[3].id).toBe('edit');
    });
  });

  describe('ANALYSIS_HYPOTHESIS_TEST_PATTERN', () => {
    it('has correct structure', () => {
      expect(ANALYSIS_HYPOTHESIS_TEST_PATTERN.id).toBe('analysis-hypothesis-test');
      expect(ANALYSIS_HYPOTHESIS_TEST_PATTERN.steps).toHaveLength(4);
      expect(ANALYSIS_HYPOTHESIS_TEST_PATTERN.steps[0].id).toBe('analysis');
      expect(ANALYSIS_HYPOTHESIS_TEST_PATTERN.steps[3].id).toBe('conclusion');
    });
  });

  describe('PREBUILT_STRATEGY_PATTERNS', () => {
    it('contains all prebuilt patterns', () => {
      expect(Object.keys(PREBUILT_STRATEGY_PATTERNS)).toHaveLength(5);
      expect(PREBUILT_STRATEGY_PATTERNS.DRAFT_CRITIQUE_REFINE).toBe(DRAFT_CRITIQUE_REFINE_PATTERN);
      expect(PREBUILT_STRATEGY_PATTERNS.REACT).toBe(REACT_PATTERN);
      expect(PREBUILT_STRATEGY_PATTERNS.CHAIN_OF_DENSITY).toBe(CHAIN_OF_DENSITY_PATTERN);
      expect(PREBUILT_STRATEGY_PATTERNS.RESEARCH_OUTLINE_WRITE_EDIT).toBe(
        RESEARCH_OUTLINE_WRITE_EDIT_PATTERN,
      );
      expect(PREBUILT_STRATEGY_PATTERNS.ANALYSIS_HYPOTHESIS_TEST).toBe(
        ANALYSIS_HYPOTHESIS_TEST_PATTERN,
      );
    });

    it('type narrowing works correctly', () => {
      const patternName: PrebuiltStrategyPatternName = 'DRAFT_CRITIQUE_REFINE';
      const pattern = PREBUILT_STRATEGY_PATTERNS[patternName];
      expect(pattern).toBe(DRAFT_CRITIQUE_REFINE_PATTERN);
    });
  });

  describe('All patterns', () => {
    const allPatterns = Object.values(PREBUILT_STRATEGY_PATTERNS);

    it('all have unique ids', () => {
      const ids = allPatterns.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(allPatterns.length);
    });

    it('all have at least one step', () => {
      allPatterns.forEach((pattern) => {
        expect(pattern.steps.length).toBeGreaterThan(0);
      });
    });

    it('all have descriptions', () => {
      allPatterns.forEach((pattern) => {
        expect(pattern.description).toBeDefined();
        expect(typeof pattern.description).toBe('string');
        if (pattern.description) {
          expect(pattern.description.length).toBeGreaterThan(0);
        }
      });
    });

    it('all steps have unique IDs within their pattern', () => {
      allPatterns.forEach((pattern) => {
        const stepIds = pattern.steps.map((s) => s.id);
        const uniqueIds = new Set(stepIds);
        expect(uniqueIds.size).toBe(stepIds.length);
      });
    });
  });
});
