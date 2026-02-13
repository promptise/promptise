import { z } from 'zod';
import { createPromptComponent } from '../component';
import { createPromptComposition } from './composition.factory';
import { createCompositionPattern } from './pattern/composition-pattern.factory';

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

describe('createPromptComposition', () => {
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

  const rulesComponent = createPromptComponent({
    key: 'rules',
    schema: z.object({ rules: z.string() }),
    template: 'Rules: {{rules}}',
  });

  describe('Edge cases', () => {
    it('should handle empty components array', () => {
      const composition = createPromptComposition({
        id: 'empty-composition',
        components: [],
      });

      expect(composition.components).toHaveLength(0);

      const prompt = composition.build({});
      expect(prompt.asString()).toBe('');
      expect(prompt.metadata.estimatedTokens).toBe(0);
      expect(prompt.metadata.components).toHaveLength(0);
    });

    it('should handle component with empty schema', () => {
      const emptySchemaComponent = createPromptComponent({
        key: 'static',
        schema: z.object({}), // Empty schema
        template: 'Static text without variables',
      });

      const composition = createPromptComposition({
        id: 'empty-schema',
        components: [emptySchemaComponent, userComponent],
      });

      const prompt = composition.build({ role: 'assistant' });
      expect(prompt.asString()).toContain('Static text');
      expect(prompt.asString()).toContain('assistant');
    });

    it('should reject duplicate component keys', () => {
      const comp1 = createPromptComponent({
        key: 'duplicate-key',
        schema: z.object({ name: z.string() }),
        template: 'First: {{name}}',
      });

      const comp2 = createPromptComponent({
        key: 'duplicate-key', // Same key as comp1
        schema: z.object({ age: z.number() }),
        template: 'Second: {{age}}',
      });

      // Should throw error on duplicate keys
      expect(() => {
        createPromptComposition({
          id: 'duplicate-keys',
          components: [comp1, comp2],
        });
      }).toThrow(/Duplicate component key "duplicate-key"/);
    });

    it('should handle messageRoles with non-existent component keys', () => {
      const composition = createPromptComposition({
        id: 'non-existent-mapping',
        components: [userComponent, taskComponent],
        messageRoles: {
          role: 'system',
          nonExistent: 'user', // Key that doesn't exist
          anotherFake: 'assistant', // Another non-existent key
        },
      });

      const prompt = composition.build({
        role: 'assistant',
        task: 'help users',
      });

      const messages = prompt.asMessages();
      // Should only include messages for existing components
      expect(messages).toHaveLength(1);
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toContain('assistant');
    });

    it('should handle empty messageRoles object', () => {
      const composition = createPromptComposition({
        id: 'empty-message-roles',
        components: [userComponent, taskComponent],
        messageRoles: {}, // Empty object - all components filtered out
      });

      const prompt = composition.build({
        role: 'assistant',
        task: 'help users',
      });

      const messages = prompt.asMessages();
      expect(messages).toHaveLength(0); // No messages since all filtered
    });

    it('should handle component that renders empty string', () => {
      const emptyComponent = createPromptComponent({
        key: 'empty',
        schema: z.object({ name: z.string() }),
        template: () => '', // Always returns empty
      });

      const composition = createPromptComposition({
        id: 'empty-render',
        components: [emptyComponent, userComponent],
      });

      const prompt = composition.build({ name: 'test', role: 'assistant' });
      const text = prompt.asString();

      // Should contain second component but first is empty
      expect(text).toContain('assistant');
      expect(text).toMatch(/^\n/); // Starts with separator since first is empty

      // Metadata should still track empty component
      expect(prompt.metadata.components).toHaveLength(2);
      expect(prompt.metadata.components[0].key).toBe('empty');
      expect(prompt.metadata.components[0].estimatedTokens).toBe(0);
    });

    it('should handle single component without separator', () => {
      const composition = createPromptComposition({
        id: 'single-component',
        components: [userComponent],
      });

      const prompt = composition.build({ role: 'assistant' });
      const text = prompt.asString();

      // Single component should not have separator
      expect(text).toBe('You are a assistant.');
      expect(text).not.toContain('\n\n');
    });
  });

  describe('ID validation', () => {
    it('should accept valid composition IDs', () => {
      expect(() =>
        createPromptComposition({
          id: 'valid-id',
          components: [userComponent],
        }),
      ).not.toThrow();

      expect(() =>
        createPromptComposition({
          id: 'valid_id',
          components: [userComponent],
        }),
      ).not.toThrow();

      expect(() =>
        createPromptComposition({
          id: 'ValidID123',
          components: [userComponent],
        }),
      ).not.toThrow();
    });

    it('should reject IDs starting with numbers', () => {
      expect(() =>
        createPromptComposition({
          id: '123-invalid',
          components: [userComponent],
        }),
      ).toThrow(/Invalid composition ID/);
    });

    it('should reject IDs with special characters', () => {
      expect(() =>
        createPromptComposition({
          id: 'invalid@id',
          components: [userComponent],
        }),
      ).toThrow(/Invalid composition ID/);

      expect(() =>
        createPromptComposition({
          id: 'invalid.id',
          components: [userComponent],
        }),
      ).toThrow(/Invalid composition ID/);
    });

    it('should reject IDs with spaces', () => {
      expect(() =>
        createPromptComposition({
          id: 'invalid id',
          components: [userComponent],
        }),
      ).toThrow(/Invalid composition ID/);
    });
  });

  it('should create a composition with valid structure', () => {
    const composition = createPromptComposition({
      id: 'test-composition',
      components: [userComponent, taskComponent],
    });

    expect(composition.id).toBe('test-composition');
    expect(composition.components).toHaveLength(2);
    expect(composition.componentWrapper).toBe('none'); // Default wrapper
  });

  it('should build prompt with valid data', () => {
    const composition = createPromptComposition({
      id: 'build-test',
      components: [userComponent, taskComponent],
    });

    const prompt = composition.build({
      role: 'assistant',
      task: 'help users',
    });

    expect(prompt.asString()).toContain('You are a assistant');
    expect(prompt.asString()).toContain('Task: help users');
    expect(prompt.metadata.id).toBe('build-test');
    expect(prompt.metadata.estimatedTokens).toBeGreaterThan(0);
  });

  it('should render components with default separator', () => {
    const composition = createPromptComposition({
      id: 'separator-test',
      components: [userComponent, taskComponent],
    });

    const prompt = composition.build({
      role: 'assistant',
      task: 'help users',
    });

    // Default separator is now '\n' (single newline)
    expect(prompt.asString()).toContain('\n');
  });

  it('should apply xml wrapper to components', () => {
    const composition = createPromptComposition({
      id: 'xml-wrapper-test',
      components: [userComponent, taskComponent],
      componentWrapper: 'xml',
    });

    const prompt = composition.build({
      role: 'assistant',
      task: 'help users',
    });

    const text = prompt.asString();
    expect(text).toContain('<role>');
    expect(text).toContain('</role>');
    expect(text).toContain('<task>');
    expect(text).toContain('</task>');
  });

  it('should apply markdown wrapper to components', () => {
    const composition = createPromptComposition({
      id: 'markdown-wrapper-test',
      components: [userComponent, taskComponent],
      componentWrapper: 'markdown',
    });

    const prompt = composition.build({
      role: 'assistant',
      task: 'help users',
    });

    const text = prompt.asString();
    expect(text).toContain('## Role');
    expect(text).toContain('## Task');
  });

  it('should apply brackets wrapper to components', () => {
    const composition = createPromptComposition({
      id: 'brackets-wrapper-test',
      components: [userComponent, taskComponent],
      componentWrapper: 'brackets',
    });

    const prompt = composition.build({
      role: 'assistant',
      task: 'help users',
    });

    const text = prompt.asString();
    expect(text).toContain('[ROLE]');
    expect(text).toContain('[/ROLE]');
    expect(text).toContain('[TASK]');
    expect(text).toContain('[/TASK]');
  });

  it('should apply custom wrapper to components', () => {
    const composition = createPromptComposition({
      id: 'custom-wrapper-test',
      components: [userComponent, taskComponent],
      componentWrapper: {
        before: (key) => `=== ${key.toUpperCase()} ===\n`,
        after: () => '\n---',
      },
    });

    const prompt = composition.build({
      role: 'assistant',
      task: 'help users',
    });

    const text = prompt.asString();
    expect(text).toContain('=== ROLE ===');
    expect(text).toContain('---');
    expect(text).toContain('=== TASK ===');
  });

  it('should apply custom wrapper without after function', () => {
    const composition = createPromptComposition({
      id: 'custom-wrapper-no-after',
      components: [userComponent, taskComponent],
      componentWrapper: {
        before: (key) => `### ${key.toUpperCase()} ###\n`,
        // No 'after' - testing optional after
      },
    });

    const prompt = composition.build({
      role: 'assistant',
      task: 'help users',
    });

    const text = prompt.asString();
    expect(text).toContain('### ROLE ###');
    expect(text).toContain('### TASK ###');
    // Should not have any "after" content
    expect(text).not.toContain('---');
  });

  it('should work without inputSchema components', () => {
    const staticComponent = createPromptComponent({
      key: 'static',
      template: 'Static content',
    });

    const composition = createPromptComposition({
      id: 'static-test',
      components: [staticComponent],
    });

    const prompt = composition.build({});
    expect(prompt.asString()).toBe('Static content');
  });

  it('should build with individual component breakdown', () => {
    const composition = createPromptComposition({
      id: 'render-test',
      components: [userComponent, taskComponent],
    });

    const prompt = composition.build({
      role: 'assistant',
      task: 'help users',
    });

    // Check that prompt contains both components
    const text = prompt.asString();
    expect(text).toContain('assistant');
    expect(text).toContain('help users');

    // Check metadata has 2 components
    expect(prompt.metadata.components).toHaveLength(2);
    expect(prompt.metadata.components[0].key).toBe('role');
    expect(prompt.metadata.components[1].key).toBe('task');
  });

  it('should validate input data', () => {
    const composition = createPromptComposition({
      id: 'validation-test',
      components: [userComponent, taskComponent],
    });

    // Valid data should build without throwing
    expect(() =>
      composition.build({
        role: 'assistant',
        task: 'help users',
      }),
    ).not.toThrow();

    // Invalid data should throw
    expect(() => {
      composition.build({
        role: 'assistant',
        // Missing task
      });
    }).toThrow();
  });

  it('should throw error on invalid data during build', () => {
    const composition = createPromptComposition({
      id: 'error-test',
      components: [userComponent, taskComponent],
    });

    expect(() => {
      composition.build({
        role: 'assistant',
        // Missing task
      });
    }).toThrow();
  });

  it('should throw error on invalid data during build', () => {
    const composition = createPromptComposition({
      id: 'error-test',
      components: [userComponent, taskComponent],
    });

    expect(() => {
      composition.build({
        role: 'assistant',
        // Missing task
      });
    }).toThrow();
  });

  it('should return inferred schema', () => {
    const composition = createPromptComposition({
      id: 'schema-test',
      components: [userComponent, taskComponent],
    });

    const schema = composition.schema;

    expect(schema.shape.role).toBeDefined();

    expect(schema.shape.task).toBeDefined();
  });

  it('should augment schema when provided', () => {
    const composition = createPromptComposition({
      id: 'augment-test',
      components: [userComponent],
      augmentSchema: (schema) => schema.extend({ extra: z.string() }),
    });

    const schema = composition.schema;

    expect(schema.shape.role).toBeDefined();

    expect(schema.shape.extra).toBeDefined();
  });

  it('should warn on schema key collision', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const comp1 = createPromptComponent({
      key: 'comp1',
      schema: z.object({ name: z.string() }),
      template: 'Hello {{name}}',
    });

    const comp2 = createPromptComponent({
      key: 'comp2',
      schema: z.object({ name: z.string() }), // Same key
      template: 'Hi {{name}}',
    });

    createPromptComposition({
      id: 'collision-test',
      components: [comp1, comp2],
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Key "name" is used in multiple components'),
    );

    consoleWarnSpy.mockRestore();
  });

  it('should not warn when there are no schema key collisions', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const comp1 = createPromptComponent({
      key: 'comp1',
      schema: z.object({ firstName: z.string() }),
      template: 'First: {{firstName}}',
    });

    const comp2 = createPromptComponent({
      key: 'comp2',
      schema: z.object({ lastName: z.string() }), // Different key - no collision
      template: 'Last: {{lastName}}',
    });

    const composition = createPromptComposition({
      id: 'no-collision-test',
      components: [comp1, comp2],
    });

    // Should not have warned about collisions
    expect(consoleWarnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Key "firstName" is used in multiple components'),
    );
    expect(consoleWarnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Key "lastName" is used in multiple components'),
    );

    // Verify the schema was built correctly with both keys
    const schema = composition.schema;

    expect(schema.shape.firstName).toBeDefined();

    expect(schema.shape.lastName).toBeDefined();

    consoleWarnSpy.mockRestore();
  });

  it('should create asMessages with default mapping', () => {
    const composition = createPromptComposition({
      id: 'messages-default',
      components: [userComponent, taskComponent],
    });

    const prompt = composition.build({
      role: 'assistant',
      task: 'help users',
    });

    const messages = prompt.asMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('assistant');
    expect(messages[0].content).toContain('help users');
  });

  it('should create asMessages with custom messageRoles', () => {
    const composition = createPromptComposition({
      id: 'messages-custom',
      components: [userComponent, taskComponent],
      messageRoles: {
        role: 'system',
        task: 'user',
      },
    });

    const prompt = composition.build({
      role: 'assistant',
      task: 'help users',
    });

    const messages = prompt.asMessages();
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('assistant');
    expect(messages[1].role).toBe('user');
    expect(messages[1].content).toContain('help users');
  });

  it('should filter unmapped components in messageRoles', () => {
    const composition = createPromptComposition({
      id: 'messages-filter',
      components: [userComponent, taskComponent, rulesComponent],
      messageRoles: {
        role: 'system',
        // Only role is mapped, task and rules should be filtered
      },
    });

    const prompt = composition.build({
      role: 'assistant',
      task: 'help users',
      rules: 'be polite',
    });

    const messages = prompt.asMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('assistant');
  });

  it('should validate with strategy', () => {
    const testStrategy = createCompositionPattern({
      id: 'TestStrategyComposition',
      description: 'Test strategy',
      components: [
        { key: 'role', description: 'Role' },
        { key: 'task', description: 'Task' },
      ],
    });

    const composition = createPromptComposition({
      id: 'strategy-test',
      components: [userComponent, taskComponent],
      pattern: testStrategy,
    });

    expect(composition.pattern).toBe(testStrategy);
  });

  it('should throw error for missing required components in strategy', () => {
    const strictStrategy = createCompositionPattern({
      id: 'StrictStrategy',
      description: 'Strict strategy',
      components: [
        { key: 'role', description: 'Role' },
        { key: 'task', description: 'Task' },
        { key: 'rules', description: 'Rules' },
      ],
    });

    expect(() => {
      createPromptComposition({
        id: 'missing-component',
        components: [userComponent, taskComponent], // Missing rules
        pattern: strictStrategy,
      });
    }).toThrow('Missing required components: rules');
  });

  it('should throw error for wrong component order in strategy', () => {
    const orderStrategy = createCompositionPattern({
      id: 'OrderStrategy',
      description: 'Order matters',
      components: [
        { key: 'task', description: 'Task' },
        { key: 'role', description: 'Role' },
      ],
    });

    expect(() => {
      createPromptComposition({
        id: 'wrong-order',
        components: [userComponent, taskComponent], // Wrong order
        pattern: orderStrategy,
      });
    }).toThrow(/does not match pattern.*required order/);
  });

  it('should validate component content with strategy validation', () => {
    const validationStrategy = createCompositionPattern({
      id: 'ValidationStrategy',
      description: 'With content validation',
      components: [
        {
          key: 'role',
          description: 'Role',
          validation: {
            maxTokens: 2, // Very low token limit
          },
        },
      ],
    });

    const composition = createPromptComposition({
      id: 'content-validation',
      components: [userComponent],
      pattern: validationStrategy,
    });

    expect(() => {
      composition.build({
        role: 'very long role that exceeds the maximum token count for testing',
      });
    }).toThrow();
  });

  it('should warn for strategy validation warnings', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const warningStrategy = createCompositionPattern({
      id: 'WarningStrategy',
      description: 'With warnings',
      components: [
        {
          key: 'role',
          description: 'Role',
          validation: {
            optional: ['special'], // This will cause a warning since "long role" doesn't have it
          },
        },
      ],
    });

    const composition = createPromptComposition({
      id: 'warning-validation',
      components: [userComponent],
      pattern: warningStrategy,
    });

    composition.build({
      role: 'long role',
    });

    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('should pass context to render', () => {
    const contextComponent = createPromptComponent({
      key: 'context',
      template: ({ context }) => {
        const name = context?.['name'];
        return `Hello ${typeof name === 'string' ? name : 'unknown'}`;
      },
    });

    const composition = createPromptComposition({
      id: 'context-test',
      components: [contextComponent],
    });

    const prompt = composition.build({}, { context: { name: 'World' } });
    expect(prompt.asString()).toBe('Hello World');
  });

  it('should handle components without validation in strategy', () => {
    const strategyWithPartialValidation = createCompositionPattern({
      id: 'PartialValidationStrategy',
      description: 'Only some components have validation',
      components: [
        {
          key: 'role',
          description: 'Role component',
          // No validation
        },
        {
          key: 'task',
          description: 'Task component',
          validation: {
            maxTokens: 100,
          },
        },
      ],
    });

    const composition = createPromptComposition({
      id: 'partial-validation',
      components: [userComponent, taskComponent],
      pattern: strategyWithPartialValidation,
    });

    const prompt = composition.build({
      role: 'assistant',
      task: 'help',
    });

    expect(prompt.asString()).toContain('assistant');
    expect(prompt.asString()).toContain('help');
  });

  it('should skip validation for components not in strategy', () => {
    const strategyWithMissingComponent = createCompositionPattern({
      id: 'MissingComponentStrategy',
      description: 'Strategy that does not list all components',
      components: [
        {
          key: 'role',
          description: 'Role only',
          validation: {
            maxTokens: 100,
          },
        },
      ],
    });

    const extraComponent = createPromptComponent({
      key: 'extra',
      schema: z.object({ extra: z.string() }),
      template: 'Extra: {{extra}}',
    });

    const composition = createPromptComposition({
      id: 'missing-component-test',
      components: [userComponent, extraComponent],
      pattern: strategyWithMissingComponent,
    });

    const prompt = composition.build({
      role: 'assistant',
      extra: 'additional data',
    });

    expect(prompt.asString()).toContain('assistant');
    expect(prompt.asString()).toContain('additional data');
  });

  describe('Edge cases - Cascade validation (Component + Pattern)', () => {
    it('should apply both component intrinsic and pattern validation (AND logic)', () => {
      const componentWithIntrinsic = createPromptComponent({
        key: 'role',
        schema: z.object({ role: z.string() }),
        template: 'Role: {{role}}',
        validation: {
          required: ['component-required'],
        },
      });

      const patternWithValidation = createCompositionPattern({
        id: 'cascade-pattern',
        components: [
          {
            key: 'role',
            validation: {
              required: ['pattern-required'],
            },
          },
        ],
      });

      const composition = createPromptComposition({
        id: 'cascade-test',
        components: [componentWithIntrinsic],
        pattern: patternWithValidation,
      });

      // Missing component-required
      expect(() => {
        composition.build({ role: 'pattern-required text' });
      }).toThrow(/component-required/);

      // Missing pattern-required
      expect(() => {
        composition.build({ role: 'component-required text' });
      }).toThrow(/pattern-required/);

      // Both present - should pass
      const prompt = composition.build({ role: 'component-required pattern-required text' });
      expect(prompt.asString()).toContain('component-required pattern-required');
    });

    it('should handle component allowing what pattern forbids (pattern wins)', () => {
      const permissiveComponent = createPromptComponent({
        key: 'rules',
        schema: z.object({ rules: z.string() }),
        template: 'Rules: {{rules}}',
        // No forbidden keywords
      });

      const strictPattern = createCompositionPattern({
        id: 'strict-pattern',
        components: [
          {
            key: 'rules',
            validation: {
              forbidden: ['dangerous'],
            },
          },
        ],
      });

      const composition = createPromptComposition({
        id: 'conflict-test',
        components: [permissiveComponent],
        pattern: strictPattern,
      });

      // Pattern should block forbidden keyword
      expect(() => {
        composition.build({ rules: 'This is dangerous content' });
      }).toThrow(/dangerous/);
    });

    it('should accumulate errors from both validations', () => {
      const componentWithMultipleRules = createPromptComponent({
        key: 'content',
        schema: z.object({ content: z.string() }),
        template: '{{content}}',
        validation: {
          required: ['must-have-component'],
          maxTokens: 1000,
        },
      });

      const patternWithMultipleRules = createCompositionPattern({
        id: 'multi-rule-pattern',
        components: [
          {
            key: 'content',
            validation: {
              required: ['must-have-pattern'],
              forbidden: ['forbidden-word'],
            },
          },
        ],
      });

      const composition = createPromptComposition({
        id: 'multi-error-test',
        components: [componentWithMultipleRules],
        pattern: patternWithMultipleRules,
      });

      // Missing both required keywords and has forbidden
      expect(() => {
        composition.build({ content: 'This has forbidden-word but missing requirements' });
      }).toThrow();
    });
  });

  describe('Edge cases - Extra components not in pattern', () => {
    it('should allow extra components not listed in pattern', () => {
      const strictPattern = createCompositionPattern({
        id: 'partial-coverage',
        components: [{ key: 'role', description: 'Only validates role' }],
      });

      const extraComp = createPromptComponent({
        key: 'extra',
        schema: z.object({ extra: z.string() }),
        template: 'Extra: {{extra}}',
      });

      const composition = createPromptComposition({
        id: 'extra-comp-test',
        components: [userComponent, extraComp],
        pattern: strictPattern,
      });

      const prompt = composition.build({
        role: 'assistant',
        extra: 'additional',
      });

      expect(prompt.asString()).toContain('assistant');
      expect(prompt.asString()).toContain('additional');
    });

    it('should not validate extra components against pattern', () => {
      const strictPattern = createCompositionPattern({
        id: 'strict-only-role',
        components: [
          {
            key: 'role',
            validation: {
              required: ['strict-keyword'],
            },
          },
        ],
      });

      const unvalidatedComp = createPromptComponent({
        key: 'unvalidated',
        schema: z.object({ text: z.string() }),
        template: '{{text}}',
      });

      const composition = createPromptComposition({
        id: 'unvalidated-extra',
        components: [userComponent, unvalidatedComp],
        pattern: strictPattern,
      });

      // Extra component should not be subject to pattern validation
      const prompt = composition.build({
        role: 'strict-keyword present',
        text: 'no strict-keyword here',
      });

      expect(prompt.asString()).toContain('strict-keyword');
      expect(prompt.asString()).toContain('no strict-keyword here');
    });
  });

  describe('Edge cases - Empty and whitespace content', () => {
    it('should handle empty component content', () => {
      const emptyComp = createPromptComponent({
        key: 'empty',
        template: '',
      });

      const pattern = createCompositionPattern({
        id: 'empty-content-pattern',
        components: [
          {
            key: 'empty',
            validation: {
              required: ['something'],
            },
          },
        ],
      });

      const composition = createPromptComposition({
        id: 'empty-content',
        components: [emptyComp],
        pattern,
      });

      expect(() => {
        composition.build({});
      }).toThrow(/something/);
    });

    it('should handle whitespace-only component content', () => {
      const whitespaceComp = createPromptComponent({
        key: 'whitespace',
        template: '   \n\t  ',
      });

      const pattern = createCompositionPattern({
        id: 'whitespace-pattern',
        components: [
          {
            key: 'whitespace',
            validation: {
              required: ['keyword'],
            },
          },
        ],
      });

      const composition = createPromptComposition({
        id: 'whitespace-test',
        components: [whitespaceComp],
        pattern,
      });

      expect(() => {
        composition.build({});
      }).toThrow(/keyword/);
    });
  });

  describe('optimization metadata propagation', () => {
    it('should propagate optimization metadata from components to composition', () => {
      const componentWithOptimizer = createPromptComponent({
        key: 'users-list',
        schema: z.object({
          users: z.array(z.object({ id: z.number(), name: z.string() })),
        }),
        optimizer: { toon: true },
        template: ({ optimized }) => `Users:\n${optimized.users}`,
      });

      const componentWithoutOptimizer = createPromptComponent({
        key: 'title',
        schema: z.object({
          title: z.string(),
        }),
        template: 'Title: {{title}}',
      });

      const composition = createPromptComposition({
        id: 'metadata-test',
        components: [componentWithoutOptimizer, componentWithOptimizer],
      });

      const prompt = composition.build({
        title: 'Team Members',
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      });

      // Check title component (no optimization)
      const titleMetadata = prompt.metadata.components.find((c) => c.key === 'title');
      expect(titleMetadata?.optimization).toBeUndefined();

      // Check users-list component (with optimization)
      const usersMetadata = prompt.metadata.components.find((c) => c.key === 'users-list');
      expect(usersMetadata?.optimization).toBeDefined();
      expect(usersMetadata?.optimization?.keysOptimized).toEqual(['users']);
      expect(usersMetadata?.optimization?.reduction).toBeGreaterThan(0);
    });
  });

  describe('Pattern maxTokens validation', () => {
    it('should throw error when pattern maxTokens is exceeded', () => {
      const pattern = createCompositionPattern({
        id: 'token-limited-pattern',
        description: 'Pattern with strict token limit',
        maxTokens: 5, // Very low limit for testing
        components: [
          { key: 'role', description: 'User role' },
          { key: 'task', description: 'Task description' },
        ],
      });

      const composition = createPromptComposition({
        id: 'token-limit-test',
        components: [userComponent, taskComponent],
        pattern,
      });

      expect(() => {
        composition.build({
          role: 'senior developer with extensive experience',
          task: 'implement comprehensive testing strategy for microservices',
        });
      }).toThrow(/token limit exceeded/i);
    });

    it('should pass when pattern maxTokens is not exceeded', () => {
      const pattern = createCompositionPattern({
        id: 'reasonable-token-limit',
        description: 'Pattern with reasonable token limit',
        maxTokens: 100,
        components: [
          { key: 'role', description: 'User role' },
          { key: 'task', description: 'Task description' },
        ],
      });

      const composition = createPromptComposition({
        id: 'token-ok-test',
        components: [userComponent, taskComponent],
        pattern,
      });

      expect(() => {
        composition.build({
          role: 'developer',
          task: 'write tests',
        });
      }).not.toThrow();
    });

    it('should work without maxTokens in pattern', () => {
      const pattern = createCompositionPattern({
        id: 'no-limit-pattern',
        description: 'Pattern without token limit',
        components: [{ key: 'role', description: 'User role' }],
      });

      const composition = createPromptComposition({
        id: 'no-limit-test',
        components: [userComponent],
        pattern,
      });

      expect(() => {
        composition.build({
          role: 'this can be any length without throwing errors',
        });
      }).not.toThrow();
    });
  });
});
