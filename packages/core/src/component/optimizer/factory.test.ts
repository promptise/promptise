import { shouldOptimize, optimizeInput } from './index';
import type { OptimizerConfig } from './types';

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
    if (typeof value === 'object' && value !== null) {
      return Object.entries(value)
        .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
        .join('\n');
    }
    return JSON.stringify(value);
  },
}));

describe('shouldOptimize', () => {
  it('should return true for arrays of objects', () => {
    const data = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ];
    expect(shouldOptimize(data)).toBe(true);
  });

  it('should return true for nested objects', () => {
    const data = { user: { id: 1, name: 'Alice' } };
    expect(shouldOptimize(data)).toBe(true);
  });

  it('should return false for primitives', () => {
    expect(shouldOptimize('string')).toBe(false);
    expect(shouldOptimize(123)).toBe(false);
    expect(shouldOptimize(true)).toBe(false);
    expect(shouldOptimize(null)).toBe(false);
  });

  it('should return false for empty arrays', () => {
    expect(shouldOptimize([])).toBe(false);
  });

  it('should return false for arrays of primitives', () => {
    expect(shouldOptimize([1, 2, 3])).toBe(false);
    expect(shouldOptimize(['a', 'b', 'c'])).toBe(false);
  });

  it('should return false for mixed arrays', () => {
    const data = [1, 'string', { id: 1 }];
    expect(shouldOptimize(data)).toBe(false);
  });

  it('should return false for arrays with null values', () => {
    const data = [{ id: 1 }, null, { id: 2 }];
    expect(shouldOptimize(data)).toBe(false);
  });
});

describe('optimizeInput', () => {
  it('should optimize arrays of objects with TOON', () => {
    const input = {
      users: [
        { id: 1, name: 'Alice', role: 'admin' },
        { id: 2, name: 'Bob', role: 'user' },
      ],
    };
    const config: OptimizerConfig = { toon: true };

    const result = optimizeInput(input, config);

    expect(result.original).toEqual(input);
    expect(result.optimized.users).toBeDefined();
    expect(result.optimized.users).toContain('[2]{id,name,role}');
    expect(result.metadata.keysOptimized).toEqual(['users']);
  });

  it('should optimize nested objects with TOON', () => {
    const input = {
      config: { theme: 'dark', language: 'en' },
    };
    const config: OptimizerConfig = { toon: true };

    const result = optimizeInput(input, config);

    expect(result.original).toEqual(input);
    expect(result.optimized.config).toBeDefined();
    expect(result.metadata.keysOptimized).toEqual(['config']);
  });

  it('should not optimize primitive values', () => {
    const input = {
      name: 'Alice',
      age: 30,
      active: true,
    };
    const config: OptimizerConfig = { toon: true };

    const result = optimizeInput(input, config);

    expect(result.original).toEqual(input);
    expect(result.optimized).toEqual({});
    expect(result.metadata.keysOptimized).toEqual([]);
  });

  it('should handle mixed data types correctly', () => {
    const input = {
      name: 'Alice', // primitive - not optimized
      users: [
        { id: 1, name: 'Bob' },
        { id: 2, name: 'Charlie' },
      ], // array of objects - optimized
      tags: ['admin', 'ops'], // array of primitives - not optimized
      config: { theme: 'dark' }, // nested object - optimized
    };
    const config: OptimizerConfig = { toon: true };

    const result = optimizeInput(input, config);

    expect(result.original).toEqual(input);
    expect(result.optimized.users).toBeDefined();
    expect(result.optimized.config).toBeDefined();
    expect(result.optimized.name).toBeUndefined();
    expect(result.optimized.tags).toBeUndefined();
    expect(result.metadata.keysOptimized).toContain('users');
    expect(result.metadata.keysOptimized).toContain('config');
  });

  describe('custom TOON configuration', () => {
    it('should accept custom EncodeOptions instead of boolean', () => {
      const input = {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      };
      const config: OptimizerConfig = {
        toon: {
          delimiter: '|',
          indent: 0,
          lengthMarker: true,
        },
      };

      const result = optimizeInput(input, config);

      expect(result.original).toEqual(input);
      expect(result.optimized.users).toBeDefined();
      expect(result.metadata.keysOptimized).toEqual(['users']);
    });

    it('should merge custom config with defaults', () => {
      const input = {
        data: { key: 'value' },
      };
      const config: OptimizerConfig = {
        toon: {
          delimiter: ';', // custom
          // Other options use TOON's native defaults
        },
      };

      const result = optimizeInput(input, config);

      expect(result.optimized.data).toBeDefined();
      expect(result.metadata.keysOptimized).toEqual(['data']);
    });

    it('should still work with boolean true (backward compatible)', () => {
      const input = {
        users: [{ id: 1 }],
      };
      const config: OptimizerConfig = { toon: true };

      const result = optimizeInput(input, config);

      expect(result.optimized.users).toBeDefined();
      expect(result.metadata.keysOptimized).toEqual(['users']);
    });
  });

  it('should calculate token reduction metadata', () => {
    const input = {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    };
    const config: OptimizerConfig = { toon: true };

    const result = optimizeInput(input, config);

    expect(result.metadata.originalTokens).toBeGreaterThan(0);
    expect(result.metadata.optimizedTokens).toBeGreaterThan(0);
    expect(result.metadata.reduction).toBeGreaterThanOrEqual(0);
    expect(result.metadata.reduction).toBeLessThanOrEqual(100);
  });

  it('should return zero reduction when no keys are optimized', () => {
    const input = {
      name: 'Alice',
      age: 30,
    };
    const config: OptimizerConfig = { toon: true };

    const result = optimizeInput(input, config);

    expect(result.metadata.reduction).toBe(0);
    expect(result.metadata.keysOptimized).toEqual([]);
  });

  it('should handle empty input object', () => {
    const input = {};
    const config: OptimizerConfig = { toon: true };

    const result = optimizeInput(input, config);

    expect(result.original).toEqual({});
    expect(result.optimized).toEqual({});
    expect(result.metadata.keysOptimized).toEqual([]);
    expect(result.metadata.reduction).toBe(0);
  });

  it('should not optimize when toon is false', () => {
    const input = {
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    };
    const config: OptimizerConfig = { toon: false };

    const result = optimizeInput(input, config);

    expect(result.optimized).toEqual({});
    expect(result.metadata.keysOptimized).toEqual([]);
  });

  it('should handle deeply nested structures', () => {
    const input = {
      data: {
        users: [
          {
            id: 1,
            profile: { name: 'Alice', age: 30 },
          },
        ],
      },
    };
    const config: OptimizerConfig = { toon: true };

    const result = optimizeInput(input, config);

    expect(result.original).toEqual(input);
    expect(result.optimized.data).toBeDefined();
    expect(result.metadata.keysOptimized).toEqual(['data']);
  });
});
