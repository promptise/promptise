import { createCompositionPattern } from './composition-pattern.factory';

describe('createCompositionPattern', () => {
  it('should create a valid composition pattern', () => {
    const pattern = createCompositionPattern({
      id: 'TestPattern',
      description: 'A test pattern',
      components: [
        { key: 'role', description: 'Role component' },
        { key: 'task', description: 'Task component' },
      ],
    });

    expect(pattern.id).toBe('TestPattern');
    expect(pattern.components).toHaveLength(2);
  });

  it('should reject duplicate component keys in pattern', () => {
    expect(() => {
      createCompositionPattern({
        id: 'DuplicatePattern',
        components: [
          { key: 'duplicate', description: 'First' },
          { key: 'duplicate', description: 'Second' },
        ],
      });
    }).toThrow(/Duplicate component key "duplicate"/);
  });

  it('should reject invalid pattern IDs starting with number', () => {
    expect(() => {
      createCompositionPattern({
        id: '123invalid',
        components: [{ key: 'test' }],
      });
    }).toThrow(/Invalid pattern ID/);
  });

  it('should reject invalid pattern IDs with special characters', () => {
    expect(() => {
      createCompositionPattern({
        id: 'invalid@pattern',
        components: [{ key: 'test' }],
      });
    }).toThrow(/Invalid pattern ID/);
  });

  it('should reject invalid pattern IDs with spaces', () => {
    expect(() => {
      createCompositionPattern({
        id: 'invalid pattern',
        components: [{ key: 'test' }],
      });
    }).toThrow(/Invalid pattern ID/);
  });

  it('should accept valid pattern IDs with hyphens', () => {
    const pattern = createCompositionPattern({
      id: 'valid-pattern-name',
      components: [{ key: 'test' }],
    });
    expect(pattern.id).toBe('valid-pattern-name');
  });

  it('should accept valid pattern IDs with underscores', () => {
    const pattern = createCompositionPattern({
      id: 'valid_pattern_name',
      components: [{ key: 'test' }],
    });
    expect(pattern.id).toBe('valid_pattern_name');
  });

  it('should reject empty components array', () => {
    expect(() => {
      createCompositionPattern({
        id: 'EmptyPattern',
        components: [],
      });
    }).toThrow(/must have at least one component/);
  });

  it('should preserve component validation config', () => {
    const pattern = createCompositionPattern({
      id: 'ValidationPattern',
      components: [
        {
          key: 'role',
          description: 'Role with validation',
          validation: {
            required: ['must-have'],
            optional: ['nice-to-have'],
            maxTokens: 100,
          },
        },
      ],
    });

    expect(pattern.components[0].validation?.required).toEqual(['must-have']);
    expect(pattern.components[0].validation?.optional).toEqual(['nice-to-have']);
    expect(pattern.components[0].validation?.maxTokens).toBe(100);
  });

  describe('Edge cases - Pattern ID validation', () => {
    it('should reject empty pattern ID', () => {
      expect(() => {
        createCompositionPattern({
          id: '',
          components: [{ key: 'test' }],
        });
      }).toThrow(/Invalid pattern ID/);
    });

    it('should reject pattern ID with only whitespace', () => {
      expect(() => {
        createCompositionPattern({
          id: '   ',
          components: [{ key: 'test' }],
        });
      }).toThrow(/Invalid pattern ID/);
    });

    it('should reject very long pattern IDs', () => {
      expect(() => {
        createCompositionPattern({
          id: 'a'.repeat(300),
          components: [{ key: 'test' }],
        });
      }).toThrow(/Invalid pattern ID/);
    });

    it('should reject pattern ID with only hyphens', () => {
      expect(() => {
        createCompositionPattern({
          id: '---',
          components: [{ key: 'test' }],
        });
      }).toThrow(/Invalid pattern ID/);
    });

    it('should reject pattern ID with only underscores', () => {
      expect(() => {
        createCompositionPattern({
          id: '___',
          components: [{ key: 'test' }],
        });
      }).toThrow(/Invalid pattern ID/);
    });

    it('should accept pattern ID with mixed alphanumeric and separators', () => {
      const pattern = createCompositionPattern({
        id: 'valid-pattern_123',
        components: [{ key: 'test' }],
      });
      expect(pattern.id).toBe('valid-pattern_123');
    });
  });

  describe('Edge cases - maxTokens validation', () => {
    it('should reject maxTokens = 0', () => {
      expect(() => {
        createCompositionPattern({
          id: 'zero-tokens',
          maxTokens: 0,
          components: [{ key: 'test' }],
        });
      }).toThrow(/maxTokens must be a positive number/);
    });

    it('should reject negative maxTokens', () => {
      expect(() => {
        createCompositionPattern({
          id: 'negative-tokens',
          maxTokens: -100,
          components: [{ key: 'test' }],
        });
      }).toThrow(/maxTokens must be a positive number/);
    });

    it('should accept very large maxTokens', () => {
      const pattern = createCompositionPattern({
        id: 'large-tokens',
        maxTokens: 1000000,
        components: [{ key: 'test' }],
      });
      expect(pattern.maxTokens).toBe(1000000);
    });
  });

  describe('Edge cases - Component validation', () => {
    it('should reject component with maxTokens = 0', () => {
      expect(() => {
        createCompositionPattern({
          id: 'component-zero-tokens',
          components: [
            {
              key: 'test',
              validation: {
                maxTokens: 0,
              },
            },
          ],
        });
      }).toThrow(/maxTokens must be a positive number/);
    });
  });
});
