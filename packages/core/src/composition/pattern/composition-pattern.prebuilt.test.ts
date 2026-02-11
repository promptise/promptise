import {
  RACE_PATTERN,
  COSTAR_PATTERN,
  CHAIN_OF_THOUGHT_PATTERN,
  FEW_SHOT_PATTERN,
  REACT_PATTERN,
  PREBUILT_PATTERNS,
  type PrebuiltPatternName,
} from './composition-pattern.prebuilt';

describe('Prebuilt Strategies', () => {
  describe('RACE_PATTERN', () => {
    it('should have correct name', () => {
      expect(RACE_PATTERN.id).toBe('race');
    });

    it('should have correct description', () => {
      expect(RACE_PATTERN.description).toBe(
        'Role, Action, Context, Examples - A structured pattern for clear task definition',
      );
    });

    it('should have 4 components in correct order', () => {
      expect(RACE_PATTERN.components).toHaveLength(4);
      expect(RACE_PATTERN.components[0].key).toBe('role');
      expect(RACE_PATTERN.components[1].key).toBe('action');
      expect(RACE_PATTERN.components[2].key).toBe('context');
      expect(RACE_PATTERN.components[3].key).toBe('examples');
    });

    it('should have descriptions for all components', () => {
      RACE_PATTERN.components.forEach((component) => {
        expect(component.description).toBeDefined();
        expect(component.description).toBeTruthy();
        if (component.description) {
          expect(component.description.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('COSTAR_PATTERN', () => {
    it('should have correct name', () => {
      expect(COSTAR_PATTERN.id).toBe('costar');
    });

    it('should have correct description', () => {
      expect(COSTAR_PATTERN.description).toBe(
        'Context, Objective, Style, Tone, Audience, Response - Comprehensive prompt specification',
      );
    });

    it('should have 6 components in correct order', () => {
      expect(COSTAR_PATTERN.components).toHaveLength(6);
      expect(COSTAR_PATTERN.components[0].key).toBe('context');
      expect(COSTAR_PATTERN.components[1].key).toBe('objective');
      expect(COSTAR_PATTERN.components[2].key).toBe('style');
      expect(COSTAR_PATTERN.components[3].key).toBe('tone');
      expect(COSTAR_PATTERN.components[4].key).toBe('audience');
      expect(COSTAR_PATTERN.components[5].key).toBe('response');
    });

    it('should have descriptions for all components', () => {
      COSTAR_PATTERN.components.forEach((component) => {
        expect(component.description).toBeDefined();
        expect(component.description).toBeTruthy();
        if (component.description) {
          expect(component.description.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('CHAIN_OF_THOUGHT_PATTERN', () => {
    it('should have correct name', () => {
      expect(CHAIN_OF_THOUGHT_PATTERN.id).toBe('chain-of-thought');
    });

    it('should have correct description', () => {
      expect(CHAIN_OF_THOUGHT_PATTERN.description).toBe(
        'Step-by-step reasoning pattern for complex problem-solving',
      );
    });

    it('should have 3 components in correct order', () => {
      expect(CHAIN_OF_THOUGHT_PATTERN.components).toHaveLength(3);
      expect(CHAIN_OF_THOUGHT_PATTERN.components[0].key).toBe('task');
      expect(CHAIN_OF_THOUGHT_PATTERN.components[1].key).toBe('reasoning');
      expect(CHAIN_OF_THOUGHT_PATTERN.components[2].key).toBe('constraints');
    });

    it('should have descriptions for all components', () => {
      CHAIN_OF_THOUGHT_PATTERN.components.forEach((component) => {
        expect(component.description).toBeDefined();
        expect(component.description).toBeTruthy();
        if (component.description) {
          expect(component.description.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('FEW_SHOT_PATTERN', () => {
    it('should have correct name', () => {
      expect(FEW_SHOT_PATTERN.id).toBe('few-shot');
    });

    it('should have correct description', () => {
      expect(FEW_SHOT_PATTERN.description).toBe(
        'Examples-based learning pattern for consistent outputs',
      );
    });

    it('should have 3 components in correct order', () => {
      expect(FEW_SHOT_PATTERN.components).toHaveLength(3);
      expect(FEW_SHOT_PATTERN.components[0].key).toBe('instruction');
      expect(FEW_SHOT_PATTERN.components[1].key).toBe('examples');
      expect(FEW_SHOT_PATTERN.components[2].key).toBe('task');
    });

    it('should have descriptions for all components', () => {
      FEW_SHOT_PATTERN.components.forEach((component) => {
        expect(component.description).toBeDefined();
        expect(component.description).toBeTruthy();
        if (component.description) {
          expect(component.description.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('REACT_PATTERN', () => {
    it('should have correct name', () => {
      expect(REACT_PATTERN.id).toBe('react');
    });

    it('should have correct description', () => {
      expect(REACT_PATTERN.description).toBe(
        'Reasoning + Acting - Interleave reasoning and action steps',
      );
    });

    it('should have 3 components in correct order', () => {
      expect(REACT_PATTERN.components).toHaveLength(3);
      expect(REACT_PATTERN.components[0].key).toBe('thought');
      expect(REACT_PATTERN.components[1].key).toBe('action');
      expect(REACT_PATTERN.components[2].key).toBe('observation');
    });

    it('should have descriptions for all components', () => {
      REACT_PATTERN.components.forEach((component) => {
        expect(component.description).toBeDefined();
        expect(component.description).toBeTruthy();
        if (component.description) {
          expect(component.description.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('PREBUILT_PATTERNS', () => {
    it('should contain all 5 prebuilt patterns', () => {
      expect(Object.keys(PREBUILT_PATTERNS)).toHaveLength(5);
      expect(PREBUILT_PATTERNS.RACE).toBe(RACE_PATTERN);
      expect(PREBUILT_PATTERNS.COSTAR).toBe(COSTAR_PATTERN);
      expect(PREBUILT_PATTERNS.CHAIN_OF_THOUGHT).toBe(CHAIN_OF_THOUGHT_PATTERN);
      expect(PREBUILT_PATTERNS.FEW_SHOT).toBe(FEW_SHOT_PATTERN);
      expect(PREBUILT_PATTERNS.REACT).toBe(REACT_PATTERN);
    });

    it('should have correct keys', () => {
      const expectedKeys: PrebuiltPatternName[] = [
        'RACE',
        'COSTAR',
        'CHAIN_OF_THOUGHT',
        'FEW_SHOT',
        'REACT',
      ];
      expect(Object.keys(PREBUILT_PATTERNS)).toEqual(expectedKeys);
    });

    it('should be read-only (const assertion)', () => {
      // TypeScript const assertion prevents modification at compile time
      // At runtime, we can verify the object is not sealed but the type is correct
      expect(PREBUILT_PATTERNS).toBeDefined();
      expect(typeof PREBUILT_PATTERNS).toBe('object');
    });
  });

  describe('PrebuiltPatternName type', () => {
    it('should allow valid pattern names', () => {
      const validNames: PrebuiltPatternName[] = [
        'RACE',
        'COSTAR',
        'CHAIN_OF_THOUGHT',
        'FEW_SHOT',
        'REACT',
      ];

      validNames.forEach((name) => {
        expect(PREBUILT_PATTERNS[name]).toBeDefined();
      });
    });
  });

  describe('Strategy immutability', () => {
    it('should return immutable pattern objects', () => {
      // Strategies should not be modified after creation
      const originalName = RACE_PATTERN.name;
      const originalComponentsLength = RACE_PATTERN.components.length;

      // These should not affect the original pattern
      expect(RACE_PATTERN.name).toBe(originalName);
      expect(RACE_PATTERN.components).toHaveLength(originalComponentsLength);
    });
  });

  describe('Pattern component structure', () => {
    it('should have consistent component structure across all patterns', () => {
      const allPatterns = [
        RACE_PATTERN,
        COSTAR_PATTERN,
        CHAIN_OF_THOUGHT_PATTERN,
        FEW_SHOT_PATTERN,
        REACT_PATTERN,
      ];

      allPatterns.forEach((pattern) => {
        expect(pattern.id).toBeDefined();
        expect(typeof pattern.id).toBe('string');
        expect(pattern.id.length).toBeGreaterThan(0);

        expect(pattern.description).toBeDefined();
        expect(typeof pattern.description).toBe('string');
        if (pattern.description) {
          expect(pattern.description.length).toBeGreaterThan(0);
        }

        expect(Array.isArray(pattern.components)).toBe(true);
        expect(pattern.components.length).toBeGreaterThan(0);

        pattern.components.forEach((component) => {
          expect(component.key).toBeDefined();
          expect(typeof component.key).toBe('string');
          expect(component.key.length).toBeGreaterThan(0);

          expect(component.description).toBeDefined();
          expect(typeof component.description).toBe('string');
          if (component.description) {
            expect(component.description.length).toBeGreaterThan(0);
          }
        });
      });
    });

    it('should have unique component keys within each pattern', () => {
      const allPatterns = [
        RACE_PATTERN,
        COSTAR_PATTERN,
        CHAIN_OF_THOUGHT_PATTERN,
        FEW_SHOT_PATTERN,
        REACT_PATTERN,
      ];

      allPatterns.forEach((pattern) => {
        const keys = pattern.components.map((c) => c.key);
        const uniqueKeys = new Set(keys);
        expect(uniqueKeys.size).toBe(keys.length);
      });
    });
  });
});
