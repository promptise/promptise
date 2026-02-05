import { describe, it, expect } from '@jest/globals';
import { createStrategyPattern } from './factory.js';

describe('createStrategyPattern', () => {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Factory Creation & Validation
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Factory Creation', () => {
    it('creates pattern with name and steps', () => {
      const pattern = createStrategyPattern({
        id: 'TEST_PATTERN',
        steps: [{ id: 'step1' }, { id: 'step2' }],
      });

      expect(pattern.id).toBe('TEST_PATTERN');
      expect(pattern.steps).toHaveLength(2);
      expect(pattern.steps[0].id).toBe('step1');
      expect(pattern.steps[1].id).toBe('step2');
      expect(pattern.description).toBeUndefined();
    });

    it('creates pattern with description', () => {
      const pattern = createStrategyPattern({
        id: 'DESCRIBED_PATTERN',
        description: 'A pattern with description',
        steps: [{ id: 'step1' }],
      });

      expect(pattern.id).toBe('DESCRIBED_PATTERN');
      expect(pattern.description).toBe('A pattern with description');
    });

    it('creates pattern with step descriptions', () => {
      const pattern = createStrategyPattern({
        id: 'DETAILED_PATTERN',
        steps: [
          { id: 'step1', description: 'First step' },
          { id: 'step2', description: 'Second step' },
        ],
      });

      expect(pattern.steps[0].description).toBe('First step');
      expect(pattern.steps[1].description).toBe('Second step');
    });

    it('creates pattern with single step', () => {
      const pattern = createStrategyPattern({
        id: 'SINGLE_STEP',
        steps: [{ id: 'only-step' }],
      });

      expect(pattern.steps).toHaveLength(1);
      expect(pattern.steps[0].id).toBe('only-step');
    });

    it('creates pattern with many steps', () => {
      const steps = Array.from({ length: 10 }, (_, i) => {
        const num = i + 1;
        return {
          id: `step-${num}`,
          description: `Step ${num}`,
        };
      });

      const pattern = createStrategyPattern({
        id: 'MANY_STEPS',
        steps,
      });

      expect(pattern.steps).toHaveLength(10);
      expect(pattern.steps[0].id).toBe('step-1');
      expect(pattern.steps[9].id).toBe('step-10');
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Validation Rules
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Validation Rules', () => {
    it('throws on invalid pattern ID starting with number', () => {
      expect(() => {
        createStrategyPattern({
          id: '123-pattern',
          steps: [{ id: 'step1' }],
        });
      }).toThrow(/Invalid strategy pattern ID/);
    });

    it('throws on invalid pattern ID with special characters', () => {
      expect(() => {
        createStrategyPattern({
          id: 'pattern@invalid',
          steps: [{ id: 'step1' }],
        });
      }).toThrow(/Invalid strategy pattern ID/);
    });

    it('throws on invalid pattern ID with spaces', () => {
      expect(() => {
        createStrategyPattern({
          id: 'my pattern',
          steps: [{ id: 'step1' }],
        });
      }).toThrow(/Invalid strategy pattern ID/);
    });

    it('accepts valid pattern ID with hyphens', () => {
      const pattern = createStrategyPattern({
        id: 'my-valid-pattern',
        steps: [{ id: 'step1' }],
      });
      expect(pattern.id).toBe('my-valid-pattern');
    });

    it('accepts valid pattern ID with underscores', () => {
      const pattern = createStrategyPattern({
        id: 'my_valid_pattern',
        steps: [{ id: 'step1' }],
      });
      expect(pattern.id).toBe('my_valid_pattern');
    });

    it('accepts valid pattern ID with mixed case', () => {
      const pattern = createStrategyPattern({
        id: 'MyValidPattern',
        steps: [{ id: 'step1' }],
      });
      expect(pattern.id).toBe('MyValidPattern');
    });

    it('throws on empty steps array', () => {
      expect(() => {
        createStrategyPattern({
          id: 'EMPTY_PATTERN',
          steps: [],
        });
      }).toThrow(/must have at least one step/);
    });

    it('throws on duplicate step IDs', () => {
      expect(() => {
        createStrategyPattern({
          id: 'DUPLICATE_PATTERN',
          steps: [{ id: 'duplicate' }, { id: 'duplicate' }, { id: 'unique' }],
        });
      }).toThrow(/duplicate step IDs/);
    });

    it('error message lists duplicate IDs', () => {
      expect(() => {
        createStrategyPattern({
          id: 'MULTI_DUPLICATE',
          steps: [{ id: 'dup1' }, { id: 'dup1' }, { id: 'dup2' }, { id: 'dup2' }, { id: 'unique' }],
        });
      }).toThrow(/Duplicate IDs: dup1, dup2/);
    });

    it('accepts steps with same description but different IDs', () => {
      const pattern = createStrategyPattern({
        id: 'SAME_DESC',
        steps: [
          { id: 'step1', description: 'Same description' },
          { id: 'step2', description: 'Same description' },
        ],
      });

      expect(pattern.steps).toHaveLength(2);
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Edge Cases
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Edge Cases - Pattern ID Validation', () => {
    it('throws on empty pattern ID', () => {
      expect(() => {
        createStrategyPattern({
          id: '',
          steps: [{ id: 'step1' }],
        });
      }).toThrow(/Invalid strategy pattern ID/);
    });

    it('throws on whitespace-only pattern ID', () => {
      expect(() => {
        createStrategyPattern({
          id: '   ',
          steps: [{ id: 'step1' }],
        });
      }).toThrow(/Invalid strategy pattern ID/);
    });

    it('throws on very long pattern ID (>255 chars)', () => {
      const longId = 'a' + 'b'.repeat(255);
      expect(() => {
        createStrategyPattern({
          id: longId,
          steps: [{ id: 'step1' }],
        });
      }).toThrow(/Pattern ID must be 255 characters or less/);
    });

    it('throws on pattern ID with only separators', () => {
      expect(() => {
        createStrategyPattern({
          id: '---',
          steps: [{ id: 'step1' }],
        });
      }).toThrow(/Invalid strategy pattern ID/);
    });

    it('throws on pattern ID with only underscores', () => {
      expect(() => {
        createStrategyPattern({
          id: '___',
          steps: [{ id: 'step1' }],
        });
      }).toThrow(/Invalid strategy pattern ID/);
    });

    it('throws on pattern ID with mixed separators only', () => {
      expect(() => {
        createStrategyPattern({
          id: '-_-_-',
          steps: [{ id: 'step1' }],
        });
      }).toThrow(/Invalid strategy pattern ID/);
    });

    it('normalizes pattern ID with leading whitespace', () => {
      const pattern = createStrategyPattern({
        id: '  valid-pattern',
        steps: [{ id: 'step1' }],
      });
      expect(pattern.id).toBe('valid-pattern');
    });

    it('normalizes pattern ID with trailing whitespace', () => {
      const pattern = createStrategyPattern({
        id: 'valid-pattern  ',
        steps: [{ id: 'step1' }],
      });
      expect(pattern.id).toBe('valid-pattern');
    });

    it('accepts pattern ID at exactly 255 characters', () => {
      const exactId = 'a' + 'b'.repeat(254);
      const pattern = createStrategyPattern({
        id: exactId,
        steps: [{ id: 'step1' }],
      });
      expect(pattern.id).toBe(exactId);
      expect(pattern.id.length).toBe(255);
    });
  });

  describe('Edge Cases - Step ID Validation', () => {
    it('throws on empty step ID', () => {
      expect(() => {
        createStrategyPattern({
          id: 'EMPTY_STEP_ID',
          steps: [{ id: '' }],
        });
      }).toThrow(/Step ID cannot be empty/);
    });

    it('throws on whitespace-only step ID', () => {
      expect(() => {
        createStrategyPattern({
          id: 'WHITESPACE_STEP',
          steps: [{ id: '   ' }],
        });
      }).toThrow(/Step ID cannot be empty/);
    });

    it('throws on very long step ID (>255 chars)', () => {
      const longStepId = 'a'.repeat(256);
      expect(() => {
        createStrategyPattern({
          id: 'LONG_STEP',
          steps: [{ id: longStepId }],
        });
      }).toThrow(/Step ID must be 255 characters or less/);
    });

    it('accepts step ID at exactly 255 characters', () => {
      const exactStepId = 'a'.repeat(255);
      const pattern = createStrategyPattern({
        id: 'EXACT_LENGTH',
        steps: [{ id: exactStepId }],
      });
      expect(pattern.steps[0].id).toBe(exactStepId);
      expect(pattern.steps[0].id.length).toBe(255);
    });

    it('normalizes step IDs with leading/trailing whitespace', () => {
      const pattern = createStrategyPattern({
        id: 'NORMALIZED',
        steps: [{ id: '  step1  ' }, { id: 'step2' }],
      });
      expect(pattern.steps[0].id).toBe('step1');
      expect(pattern.steps[1].id).toBe('step2');
    });

    it('handles special characters in step IDs', () => {
      const pattern = createStrategyPattern({
        id: 'SPECIAL_CHARS',
        steps: [{ id: 'step-1' }, { id: 'step_2' }, { id: 'step.3' }, { id: 'step:4' }],
      });

      expect(pattern.steps).toHaveLength(4);
      expect(pattern.steps[0].id).toBe('step-1');
      expect(pattern.steps[3].id).toBe('step:4');
    });

    it('handles Unicode characters in step IDs', () => {
      const pattern = createStrategyPattern({
        id: 'UNICODE',
        steps: [{ id: '步骤1' }, { id: 'étape2' }, { id: 'шаг3' }],
      });

      expect(pattern.steps).toHaveLength(3);
      expect(pattern.steps[0].id).toBe('步骤1');
    });
  });

  describe('Edge Cases - Duplicate Detection', () => {
    it('allows different case variants (case-sensitive IDs)', () => {
      const pattern = createStrategyPattern({
        id: 'CASE_SENSITIVE',
        steps: [{ id: 'step1' }, { id: 'STEP1' }],
      });
      expect(pattern.steps).toHaveLength(2);
      expect(pattern.steps[0].id).toBe('step1');
      expect(pattern.steps[1].id).toBe('STEP1');
    });

    it('detects duplicates after whitespace normalization', () => {
      expect(() => {
        createStrategyPattern({
          id: 'WHITESPACE_DUPS',
          steps: [{ id: '  step1  ' }, { id: 'step1' }],
        });
      }).toThrow(/duplicate step IDs/);
    });

    it('detects duplicate empty strings after normalization', () => {
      expect(() => {
        createStrategyPattern({
          id: 'EMPTY_DUPS',
          steps: [{ id: '   ' }, { id: '  ' }],
        });
      }).toThrow(/Step ID cannot be empty/);
    });

    it('handles Unicode normalization in duplicate detection (NFC vs NFD)', () => {
      // café in NFC (single character é)
      const nfc = 'café';
      // café in NFD (e + combining accent)
      const nfd = 'café';

      expect(() => {
        createStrategyPattern({
          id: 'UNICODE_NORM',
          steps: [{ id: nfc }, { id: nfd }],
        });
      }).toThrow(/duplicate step IDs/);
    });
  });

  describe('Edge Cases - Description Validation', () => {
    it('accepts empty pattern description', () => {
      const pattern = createStrategyPattern({
        id: 'EMPTY_DESC',
        description: '',
        steps: [{ id: 'step1' }],
      });
      expect(pattern.description).toBe('');
    });

    it('accepts whitespace-only pattern description', () => {
      const pattern = createStrategyPattern({
        id: 'WHITESPACE_DESC',
        description: '   ',
        steps: [{ id: 'step1' }],
      });
      expect(pattern.description).toBe('   ');
    });

    it('accepts pattern description with control characters', () => {
      const pattern = createStrategyPattern({
        id: 'CONTROL_CHARS',
        description: 'Line 1\nLine 2\tTabbed\rReturn',
        steps: [{ id: 'step1' }],
      });
      expect(pattern.description).toContain('\n');
      expect(pattern.description).toContain('\t');
    });

    it('accepts empty step description', () => {
      const pattern = createStrategyPattern({
        id: 'EMPTY_STEP_DESC',
        steps: [{ id: 'step1', description: '' }],
      });
      expect(pattern.steps[0].description).toBe('');
    });

    it('accepts whitespace-only step description', () => {
      const pattern = createStrategyPattern({
        id: 'WHITESPACE_STEP_DESC',
        steps: [{ id: 'step1', description: '   ' }],
      });
      expect(pattern.steps[0].description).toBe('   ');
    });

    it('handles very long step descriptions', () => {
      const longDescription = 'A'.repeat(1000);
      const pattern = createStrategyPattern({
        id: 'LONG_DESC',
        steps: [{ id: 'step1', description: longDescription }],
      });

      expect(pattern.steps[0].description).toBe(longDescription);
      expect(pattern.steps[0].description?.length).toBe(1000);
    });

    it('handles very long pattern description', () => {
      const longDescription = 'B'.repeat(5000);
      const pattern = createStrategyPattern({
        id: 'LONG_PATTERN_DESC',
        description: longDescription,
        steps: [{ id: 'step1' }],
      });
      expect(pattern.description).toBe(longDescription);
      expect(pattern.description?.length).toBe(5000);
    });
  });

  describe('Edge Cases - Large Arrays', () => {
    it('handles very large step arrays (100 steps)', () => {
      const steps = Array.from({ length: 100 }, (_, i) => ({
        id: `step-${i}`,
        description: `Step ${i}`,
      }));

      const pattern = createStrategyPattern({
        id: 'LARGE_ARRAY',
        steps,
      });

      expect(pattern.steps).toHaveLength(100);
      expect(pattern.steps[0].id).toBe('step-0');
      expect(pattern.steps[99].id).toBe('step-99');
    });

    it('handles very large step arrays (1000 steps)', () => {
      const steps = Array.from({ length: 1000 }, (_, i) => ({
        id: `s${i}`,
      }));

      const pattern = createStrategyPattern({
        id: 'VERY_LARGE',
        steps,
      });

      expect(pattern.steps).toHaveLength(1000);
      expect(pattern.steps[500].id).toBe('s500');
    });

    it('detects duplicates in large arrays efficiently', () => {
      const steps = Array.from({ length: 100 }, (_, i) => ({
        id: `step-${i}`,
      }));
      steps.push({ id: 'step-50' }); // Duplicate

      expect(() => {
        createStrategyPattern({
          id: 'LARGE_WITH_DUP',
          steps,
        });
      }).toThrow(/duplicate step IDs/);
      expect(() => {
        createStrategyPattern({
          id: 'LARGE_WITH_DUP',
          steps,
        });
      }).toThrow(/step-50/);
    });
  });

  describe('Edge Cases - Order Preservation', () => {
    it('preserves step order exactly', () => {
      const pattern = createStrategyPattern({
        id: 'ORDER_TEST',
        steps: [{ id: 'z-step' }, { id: 'a-step' }, { id: 'm-step' }, { id: 'b-step' }],
      });

      expect(pattern.steps[0].id).toBe('z-step');
      expect(pattern.steps[1].id).toBe('a-step');
      expect(pattern.steps[2].id).toBe('m-step');
      expect(pattern.steps[3].id).toBe('b-step');
    });
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Immutability
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  describe('Immutability', () => {
    it('pattern is independent from config object', () => {
      const config = {
        id: 'IMMUTABLE_TEST',
        steps: [{ id: 'step1' }, { id: 'step2' }],
      };

      const pattern = createStrategyPattern(config);

      // Mutate original config
      config.name = 'MUTATED_NAME';
      config.steps.push({ id: 'step3' });

      // Pattern should NOT be affected
      expect(pattern.id).toBe('IMMUTABLE_TEST');
      expect(pattern.steps).toHaveLength(2);
    });

    it('pattern steps are independent from config steps', () => {
      const steps = [{ id: 'step1', description: 'Original' }];
      const pattern = createStrategyPattern({
        id: 'STEP_IMMUTABLE',
        steps,
      });

      // Mutate original steps array
      steps[0].description = 'Mutated';

      // Pattern should NOT be affected
      expect(pattern.steps[0].description).toBe('Original');
      expect(pattern.steps).toHaveLength(1);
    });
  });
});
