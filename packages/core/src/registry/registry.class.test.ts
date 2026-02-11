import { z } from 'zod';
import { Promptise } from './registry.class';
import { createPromptComposition } from '../composition/composition.factory';
import { createPromptComponent } from '../component/component.factory';

// Mock TOON library
jest.mock('@toon-format/toon', () => ({
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

describe('Promptise', () => {
  // Test components and compositions
  const userComponent = createPromptComponent({
    key: 'role',
    schema: z.object({ role: z.string() }),
    template: 'You are a {{role}}.',
  });

  const taskComponent = createPromptComponent({
    key: 'task',
    schema: z.object({ task: z.string() }),
    template: 'Task: {{task}}',
  });

  const composition1 = createPromptComposition({
    id: 'comp-1',
    components: [userComponent],
  });

  const composition2 = createPromptComposition({
    id: 'comp-2',
    components: [taskComponent],
  });

  const composition3 = createPromptComposition({
    id: 'comp-3',
    components: [userComponent, taskComponent],
  });

  describe('constructor', () => {
    it('should accept valid config', () => {
      const registry = new Promptise({
        compositions: [
          { composition: composition1, fixtures: { basic: { role: 'doctor' } } },
          { composition: composition2 },
        ],
      });

      expect(registry).toBeInstanceOf(Promptise);
    });

    it('should accept empty compositions array', () => {
      const registry = new Promptise({
        compositions: [],
      });

      expect(registry).toBeInstanceOf(Promptise);
      expect(registry.getCompositions()).toHaveLength(0);
    });

    it('should reject duplicate composition IDs', () => {
      expect(() => {
        new Promptise({
          compositions: [
            { composition: composition1 },
            { composition: composition1 }, // Same composition = duplicate ID
          ],
        });
      }).toThrow(/duplicate composition IDs/i);
    });

    it('should provide helpful error message for duplicate IDs', () => {
      expect(() => {
        new Promptise({
          compositions: [{ composition: composition1 }, { composition: composition1 }],
        });
      }).toThrow('comp-1');
    });
  });

  describe('Direct composition format', () => {
    it('should accept compositions directly without wrapper object', () => {
      const registry = new Promptise({
        compositions: [composition1, composition2, composition3],
      });

      expect(registry.getCompositions()).toHaveLength(3);
      expect(registry.getCompositions()[0]?.composition).toBe(composition1);
      expect(registry.getCompositions()[0]?.fixtures).toBeUndefined();
      expect(registry.getCompositions()[1]?.composition).toBe(composition2);
      expect(registry.getCompositions()[1]?.fixtures).toBeUndefined();
      expect(registry.getCompositions()[2]?.composition).toBe(composition3);
      expect(registry.getCompositions()[2]?.fixtures).toBeUndefined();
    });

    it('should handle empty array with direct format', () => {
      const registry = new Promptise({
        compositions: [],
      });

      expect(registry.getCompositions()).toHaveLength(0);
    });

    it('should allow getComposition() to work with direct format', () => {
      const registry = new Promptise({
        compositions: [composition1, composition2],
      });

      const entry = registry.getComposition('comp-1');
      expect(entry).toBeDefined();
      expect(entry?.composition).toBe(composition1);
      expect(entry?.fixtures).toBeUndefined();
    });
  });

  describe('Mixed composition formats', () => {
    it('should accept mixed formats (direct and with fixtures)', () => {
      const registry = new Promptise({
        compositions: [
          composition1, // direct
          { composition: composition2, fixtures: { test: { task: 'test task' } } }, // object
          composition3, // direct
        ],
      });

      const entries = registry.getCompositions();
      expect(entries).toHaveLength(3);

      // First entry: direct (no fixtures)
      expect(entries[0]?.composition).toBe(composition1);
      expect(entries[0]?.fixtures).toBeUndefined();

      // Second entry: object (with fixtures)
      expect(entries[1]?.composition).toBe(composition2);
      expect(entries[1]?.fixtures).toBeDefined();
      expect(entries[1]?.fixtures?.test).toEqual({ task: 'test task' });

      // Third entry: direct (no fixtures)
      expect(entries[2]?.composition).toBe(composition3);
      expect(entries[2]?.fixtures).toBeUndefined();
    });

    it('should preserve fixture data when using object format', () => {
      const fixtures = {
        basic: { role: 'doctor', task: 'diagnose' },
        icu: { role: 'intensivist', task: 'stabilize' },
      };

      const registry = new Promptise({
        compositions: [
          composition1, // direct
          { composition: composition2, fixtures },
        ],
      });

      const entry = registry.getComposition('comp-2');
      expect(entry?.fixtures).toEqual(fixtures);
    });
  });

  describe('Validation with new formats', () => {
    it('should detect duplicate IDs with direct format', () => {
      expect(() => {
        new Promptise({
          compositions: [composition1, composition1], // duplicate
        });
      }).toThrow(/duplicate composition IDs/i);
    });

    it('should detect duplicate IDs in mixed format', () => {
      expect(() => {
        new Promptise({
          compositions: [
            composition1, // direct
            { composition: composition1, fixtures: { test: {} } }, // duplicate
          ],
        });
      }).toThrow(/duplicate composition IDs/i);
    });

    it('should detect duplicates across different formats', () => {
      expect(() => {
        new Promptise({
          compositions: [
            { composition: composition1, fixtures: { a: {} } },
            composition1, // duplicate
            { composition: composition1 }, // duplicate
          ],
        });
      }).toThrow(/duplicate composition IDs/i);
    });
  });

  describe('Backwards compatibility', () => {
    it('should still accept old object-only format', () => {
      const registry = new Promptise({
        compositions: [
          { composition: composition1, fixtures: { basic: { role: 'doctor' } } },
          { composition: composition2 },
        ],
      });

      expect(registry.getCompositions()).toHaveLength(2);
    });

    it('should work with existing code patterns', () => {
      // Este test simula código existente que no debe romperse
      const config = {
        compositions: [
          { composition: composition1 },
          { composition: composition2, fixtures: {} },
          { composition: composition3, fixtures: { test: {} } },
        ],
      };

      const registry = new Promptise(config);
      expect(registry.getCompositions()).toHaveLength(3);
    });
  });

  describe('getCompositions()', () => {
    it('should return all composition entries', () => {
      const registry = new Promptise({
        compositions: [
          { composition: composition1, fixtures: { basic: { role: 'doctor' } } },
          { composition: composition2 },
          {
            composition: composition3,
            fixtures: { example: { role: 'doctor', task: 'diagnose' } },
          },
        ],
      });

      const results = registry.getCompositions();
      expect(results).toHaveLength(3);
      expect(results[0]?.composition.id).toBe('comp-1');
      expect(results[1]?.composition.id).toBe('comp-2');
      expect(results[2]?.composition.id).toBe('comp-3');
    });

    it('should return entries with their fixtures', () => {
      const registry = new Promptise({
        compositions: [
          {
            composition: composition1,
            fixtures: {
              basic: { role: 'from-registry' },
              advanced: { role: 'advanced-from-registry' },
            },
          },
        ],
      });

      const results = registry.getCompositions();
      const fixtures = results[0]?.fixtures;

      expect(fixtures?.basic).toEqual({ role: 'from-registry' });
      expect(fixtures?.advanced).toEqual({ role: 'advanced-from-registry' });
      expect(Object.keys(fixtures ?? {})).toHaveLength(2);
    });

    it('should handle entries without fixtures', () => {
      const registry = new Promptise({
        compositions: [{ composition: composition2 }],
      });

      const results = registry.getCompositions();
      expect(results[0]?.fixtures).toBeUndefined();
    });

    it('should return empty array for empty registry', () => {
      const registry = new Promptise({
        compositions: [],
      });

      const results = registry.getCompositions();
      expect(results).toEqual([]);
    });

    it('should preserve composition instance references', () => {
      const registry = new Promptise({
        compositions: [{ composition: composition1 }, { composition: composition2 }],
      });

      const results = registry.getCompositions();
      expect(results[0]?.composition).toBe(composition1);
      expect(results[1]?.composition).toBe(composition2);
    });

    it('should preserve order of compositions', () => {
      const registry = new Promptise({
        compositions: [
          { composition: composition3 },
          { composition: composition1 },
          { composition: composition2 },
        ],
      });

      const results = registry.getCompositions();
      expect(results[0]?.composition.id).toBe('comp-3');
      expect(results[1]?.composition.id).toBe('comp-1');
      expect(results[2]?.composition.id).toBe('comp-2');
    });
  });

  describe('getCompositions()', () => {
    it('should return all composition entries', () => {
      const registry = new Promptise({
        compositions: [
          { composition: composition1, fixtures: { basic: { role: 'doctor' } } },
          { composition: composition2 },
          {
            composition: composition3,
            fixtures: { example: { role: 'doctor', task: 'diagnose' } },
          },
        ],
      });

      const results = registry.getCompositions();
      expect(results).toHaveLength(3);
      expect(results[0]?.composition.id).toBe('comp-1');
      expect(results[1]?.composition.id).toBe('comp-2');
      expect(results[2]?.composition.id).toBe('comp-3');
    });

    it('should return empty array for empty registry', () => {
      const registry = new Promptise({
        compositions: [],
      });

      const results = registry.getCompositions();
      expect(results).toEqual([]);
    });

    it('should preserve composition instance references', () => {
      const registry = new Promptise({
        compositions: [{ composition: composition1 }, { composition: composition2 }],
      });

      const results = registry.getCompositions();
      expect(results[0]?.composition).toBe(composition1);
      expect(results[1]?.composition).toBe(composition2);
    });
  });

  describe('getComposition()', () => {
    it('should return entry by composition id', () => {
      const registry = new Promptise({
        compositions: [
          { composition: composition1, fixtures: { basic: { role: 'doctor' } } },
          { composition: composition2 },
          { composition: composition3 },
        ],
      });

      const result = registry.getComposition('comp-2');
      expect(result?.composition).toBe(composition2);
      expect(result?.composition.id).toBe('comp-2');
    });

    it('should return undefined for non-existent id', () => {
      const registry = new Promptise({
        compositions: [{ composition: composition1 }],
      });

      const result = registry.getComposition('non-existent');
      expect(result).toBeUndefined();
    });

    it('should return entry with fixtures', () => {
      const registry = new Promptise({
        compositions: [
          {
            composition: composition1,
            fixtures: { basic: { role: 'from-registry' } },
          },
        ],
      });

      const result = registry.getComposition('comp-1');
      expect(result?.fixtures).toBeDefined();
      expect(result?.fixtures?.basic).toEqual({ role: 'from-registry' });
    });

    it('should return undefined for empty registry', () => {
      const registry = new Promptise({
        compositions: [],
      });

      const result = registry.getComposition('any-id');
      expect(result).toBeUndefined();
    });

    it('should handle entry without fixtures', () => {
      const registry = new Promptise({
        compositions: [{ composition: composition2 }],
      });

      const result = registry.getComposition('comp-2');
      expect(result?.composition).toBe(composition2);
      expect(result?.fixtures).toBeUndefined();
    });
  });

  describe('getComposition()', () => {
    it('should return composition entry by id', () => {
      const registry = new Promptise({
        compositions: [
          { composition: composition1 },
          { composition: composition2 },
          { composition: composition3 },
        ],
      });

      const result = registry.getComposition('comp-2');
      expect(result?.composition).toBe(composition2);
      expect(result?.composition.id).toBe('comp-2');
    });

    it('should return undefined for non-existent id', () => {
      const registry = new Promptise({
        compositions: [{ composition: composition1 }],
      });

      const result = registry.getComposition('non-existent');
      expect(result).toBeUndefined();
    });

    it('should return entry with fixtures', () => {
      const registry = new Promptise({
        compositions: [
          {
            composition: composition1,
            fixtures: { basic: { role: 'from-registry' } },
          },
        ],
      });

      const result = registry.getComposition('comp-1');
      expect(result?.composition).toBe(composition1);
      expect(result?.fixtures?.basic).toEqual({ role: 'from-registry' });
    });

    it('should return undefined for empty registry', () => {
      const registry = new Promptise({
        compositions: [],
      });

      const result = registry.getComposition('any-id');
      expect(result).toBeUndefined();
    });
  });
});
