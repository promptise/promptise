/**
 * Tests for index.ts exports
 * Ensures all public APIs are properly exported
 */

import * as Promptise from './index';

// Mock TOON library
vi.mock('@toon-format/toon', () => ({
  encode: (value: unknown) => {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      const keys = Object.keys(value[0] as Record<string, unknown>);
      const rows = value
        .map((item) => keys.map((k) => String((item as Record<string, unknown>)[k])).join(','))
        .join('\n  ');
      return `[${String(value.length)}]{${keys.join(',')}}:\n  ${rows}`;
    }
    return JSON.stringify(value);
  },
}));

describe('Promptise Index Exports', () => {
  describe('Core Types', () => {
    it('should export CostConfig type', () => {
      // Type-only test, will be checked at compile time
      const config: Promptise.CostConfig = {
        inputTokenPrice: 0.00001,
        outputTokenPrice: 0.00003,
        currency: 'USD',
      };
      expect(config).toBeDefined();
    });
  });

  describe('Component Feature', () => {
    it('should export createPromptComponent', () => {
      expect(typeof Promptise.createPromptComponent).toBe('function');
    });
  });

  describe('Composition Feature', () => {
    it('should export createPromptComposition', () => {
      expect(typeof Promptise.createPromptComposition).toBe('function');
    });
  });

  describe('Pattern Feature', () => {
    it('should export createCompositionPattern', () => {
      expect(typeof Promptise.createCompositionPattern).toBe('function');
    });

    it('should export prebuilt patterns', () => {
      expect(Promptise.PREBUILT_PATTERNS).toBeDefined();
      expect(Promptise.RACE_PATTERN).toBeDefined();
      expect(Promptise.COSTAR_PATTERN).toBeDefined();
      expect(Promptise.CHAIN_OF_THOUGHT_PATTERN).toBeDefined();
      expect(Promptise.FEW_SHOT_PATTERN).toBeDefined();
      expect(Promptise.COMPOSITION_REACT_PATTERN).toBeDefined();
    });
  });

  describe('Strategy Pattern Feature', () => {
    it('should export createStrategyPattern', () => {
      expect(typeof Promptise.createStrategyPattern).toBe('function');
    });

    it('should export prebuilt strategy patterns', () => {
      expect(Promptise.PREBUILT_STRATEGY_PATTERNS).toBeDefined();
      expect(Promptise.DRAFT_CRITIQUE_REFINE_PATTERN).toBeDefined();
      expect(Promptise.STRATEGY_REACT_PATTERN).toBeDefined();
      expect(Promptise.CHAIN_OF_DENSITY_PATTERN).toBeDefined();
      expect(Promptise.RESEARCH_OUTLINE_WRITE_EDIT_PATTERN).toBeDefined();
      expect(Promptise.ANALYSIS_HYPOTHESIS_TEST_PATTERN).toBeDefined();
    });
  });

  describe('Strategy Feature', () => {
    it('should export createPromptStrategy', () => {
      expect(typeof Promptise.createPromptStrategy).toBe('function');
    });
  });

  describe('Utilities', () => {
    it('should export formatValidationError', () => {
      expect(typeof Promptise.formatValidationError).toBe('function');
    });

    it('should export countTokens', () => {
      expect(typeof Promptise.countTokens).toBe('function');
    });
  });
});
