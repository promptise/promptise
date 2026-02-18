import { z } from 'zod';
import * as toon from '@toon-format/toon';
import { createPromptComponent } from './component.factory';

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

describe('createPromptComponent', () => {
  it('should create a valid component with required fields', () => {
    const component = createPromptComponent({
      key: 'test-component',
      schema: z.object({
        name: z.string(),
      }),
      template: 'Hello {{name}}',
    });

    expect(component.key).toBe('test-component');
    expect(component.schema).toBeDefined();
    expect(component.template).toBe('Hello {{name}}');
  });

  it('should include description when provided', () => {
    const component = createPromptComponent({
      key: 'with-description',
      schema: z.object({ name: z.string() }),
      template: 'Hello {{name}}',
      description: 'A greeting component',
    });

    expect(component.description).toBe('A greeting component');
  });

  describe('component key validation', () => {
    it('should accept valid keys starting with lowercase letter', () => {
      expect(() =>
        createPromptComponent({
          key: 'user',
          template: 'test',
        }),
      ).not.toThrow();
    });

    it('should accept valid keys starting with uppercase letter', () => {
      expect(() =>
        createPromptComponent({
          key: 'UserProfile',
          template: 'test',
        }),
      ).not.toThrow();
    });

    it('should accept valid keys with hyphens', () => {
      expect(() =>
        createPromptComponent({
          key: 'user-profile',
          template: 'test',
        }),
      ).not.toThrow();
    });

    it('should accept valid keys with underscores', () => {
      expect(() =>
        createPromptComponent({
          key: 'user_settings',
          template: 'test',
        }),
      ).not.toThrow();
    });

    it('should accept valid keys with numbers', () => {
      expect(() =>
        createPromptComponent({
          key: 'user123',
          template: 'test',
        }),
      ).not.toThrow();
    });

    it('should reject keys starting with a number', () => {
      expect(() =>
        createPromptComponent({
          key: '123user',
          template: 'test',
        }),
      ).toThrow('Invalid component key "123user". Keys must start with a letter');
    });

    it('should reject keys starting with hyphen', () => {
      expect(() =>
        createPromptComponent({
          key: '-user',
          template: 'test',
        }),
      ).toThrow('Invalid component key "-user". Keys must start with a letter');
    });

    it('should reject keys with spaces', () => {
      expect(() =>
        createPromptComponent({
          key: 'user profile',
          template: 'test',
        }),
      ).toThrow('Invalid component key "user profile". Keys must start with a letter');
    });

    it('should reject keys with special characters', () => {
      expect(() =>
        createPromptComponent({
          key: 'user@profile',
          template: 'test',
        }),
      ).toThrow('Invalid component key "user@profile". Keys must start with a letter');
    });

    it('should reject keys with dots', () => {
      expect(() =>
        createPromptComponent({
          key: 'user.profile',
          template: 'test',
        }),
      ).toThrow('Invalid component key "user.profile". Keys must start with a letter');
    });
  });

  describe('error messages with description', () => {
    it('should include description in validation error when provided', () => {
      const component = createPromptComponent({
        key: 'user-component',
        schema: z.object({
          age: z.number(),
        }),
        template: 'Age: {{age}}',
        description: 'Renders user age information',
      });

      expect(() => component.render({ age: 'invalid' as any })).toThrow(
        'Component "user-component" (Renders user age information)',
      );
    });

    it('should not include description in validation error when not provided', () => {
      const component = createPromptComponent({
        key: 'user-component',
        schema: z.object({
          age: z.number(),
        }),
        template: 'Age: {{age}}',
      });

      expect(() => component.render({ age: 'invalid' as any })).toThrow(
        'Component "user-component"',
      );
      expect(() => component.render({ age: 'invalid' as any })).not.toThrow(/\(/);
    });
  });

  it('should validate input data correctly', () => {
    const component = createPromptComponent({
      key: 'validation-test',
      schema: z.object({
        age: z.number(),
      }),
      template: 'Age: {{age}}',
    });

    // Valid data should render without throwing
    expect(() => component.render({ age: 25 })).not.toThrow();
    expect(component.render({ age: 25 }).content).toBe('Age: 25');

    // Invalid data should throw
    expect(() => component.render({ age: 'invalid' } as { age: number })).toThrow();
  });

  it('should render template with data', () => {
    const component = createPromptComponent({
      key: 'render-test',
      schema: z.object({
        greeting: z.string(),
        name: z.string(),
      }),
      template: '{{greeting}}, {{name}}!',
    });

    const result = component.render({ greeting: 'Hello', name: 'World' });
    expect(result.content).toBe('Hello, World!');
  });

  it('should render with whitespace in template placeholders', () => {
    const component = createPromptComponent({
      key: 'whitespace-test',
      schema: z.object({
        value: z.string(),
      }),
      template: 'Value: {{ value }}',
    });

    const result = component.render({ value: 'test' });
    expect(result.content).toBe('Value: test');
  });

  it('should handle undefined/null values in string templates gracefully', () => {
    const component = createPromptComponent({
      key: 'optional-test',
      schema: z.object({
        required: z.string(),
        optional: z.string().optional(),
        nullable: z.string().nullable(),
      }),
      template: 'Required: {{required}}, Optional: {{optional}}, Nullable: {{nullable}}',
    });

    // When optional fields are undefined/null, should render as empty string, not "undefined"/"null"
    const result = component.render({
      required: 'value',
      optional: undefined,
      nullable: null,
    });

    expect(result.content).toBe('Required: value, Optional: , Nullable: ');
    expect(result.content).not.toContain('undefined');
    expect(result.content).not.toContain('null');
  });

  it('should work without inputSchema (optional)', () => {
    const component = createPromptComponent({
      key: 'no-schema-test',
      template: 'Static content',
    });

    expect(component.key).toBe('no-schema-test');
    expect(component.render({}).content).toBe('Static content');
  });

  it('should use function template', () => {
    const component = createPromptComponent({
      key: 'function-template',
      schema: z.object({
        name: z.string(),
        age: z.number(),
      }),
      template: ({ input }) => `${input.name} is ${String(input.age)} years old`,
    });

    const result = component.render({ name: 'Alice', age: 30 });
    expect(result.content).toBe('Alice is 30 years old');
  });

  it('should pass context to function template', () => {
    const component = createPromptComponent({
      key: 'context-template',
      schema: z.object({ name: z.string() }),
      template: ({ input, context }) => {
        const greeting = context?.['greeting'];
        const greetingStr = typeof greeting === 'string' ? greeting : 'Hi';
        return `${greetingStr}, ${input.name}`;
      },
    });

    const result = component.render({ name: 'Bob' }, { greeting: 'Hello' });
    expect(result.content).toBe('Hello, Bob');
  });

  it('should throw error when rendering with invalid data', () => {
    const component = createPromptComponent({
      key: 'error-test',
      schema: z.object({
        required: z.string(),
      }),
      template: 'Value: {{required}}',
    });

    expect(() => {
      // @ts-expect-error - Testing validation error with invalid input
      component.render({} as Record<string, never>);
    }).toThrow();
  });

  it('should include component key in validation error', () => {
    const component = createPromptComponent({
      key: 'my-component',
      schema: z.object({
        required: z.string(),
      }),
      template: 'Value: {{required}}',
    });

    expect(() => {
      // @ts-expect-error - Testing validation error with invalid input
      component.render({} as Record<string, never>);
    }).toThrow('my-component');
  });

  it('should handle multiple replacements of same variable', () => {
    const component = createPromptComponent({
      key: 'multiple-test',
      schema: z.object({
        name: z.string(),
      }),
      template: '{{name}} and {{name}} again',
    });

    const result = component.render({ name: 'Test' });
    expect(result.content).toBe('Test and Test again');
  });

  it('should convert non-string values to strings in template', () => {
    const component = createPromptComponent({
      key: 'conversion-test',
      schema: z.object({
        count: z.number(),
        active: z.boolean(),
      }),
      template: 'Count: {{count}}, Active: {{active}}',
    });

    const result = component.render({ count: 42, active: true });
    expect(result.content).toBe('Count: 42, Active: true');
  });

  describe('optimizer integration', () => {
    it('should render with optimizer using function template', () => {
      const component = createPromptComponent({
        key: 'users-optimized',
        schema: z.object({
          users: z.array(
            z.object({
              id: z.number(),
              name: z.string(),
              role: z.string(),
            }),
          ),
        }),
        optimizer: { toon: true },
        template: ({ input, optimized }) => `
Users (${String(input.users.length)} total):
${optimized['users'] ?? 'No optimization'}
        `,
      });

      const result = component.render({
        users: [
          { id: 1, name: 'Alice', role: 'admin' },
          { id: 2, name: 'Bob', role: 'user' },
        ],
      });

      expect(result.content).toContain('Users (2 total)');
      expect(result.content).toContain('[2]{id,name,role}');
    });

    it('should render with optimizer using string template', () => {
      const component = createPromptComponent({
        key: 'config-optimized',
        schema: z.object({
          config: z.object({
            theme: z.string(),
            language: z.string(),
          }),
        }),
        optimizer: { toon: true },
        template: 'Configuration:\n{{optimized.config}}',
      });

      const result = component.render({
        config: { theme: 'dark', language: 'en' },
      });

      expect(result.content).toContain('Configuration:');
      // Mock returns newline-separated key: value format or JSON
      expect(result.content.length).toBeGreaterThan('Configuration:'.length);
    });

    it('should handle mixed optimized and non-optimized data', () => {
      const component = createPromptComponent({
        key: 'mixed-data',
        schema: z.object({
          title: z.string(),
          users: z.array(
            z.object({
              id: z.number(),
              name: z.string(),
            }),
          ),
        }),
        optimizer: { toon: true },
        template: ({ input, optimized }) => `
Title: ${input.title}
Users:
${optimized['users'] ?? 'none'}
        `,
      });

      const result = component.render({
        title: 'Team Members',
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      });

      expect(result.content).toContain('Title: Team Members');
      expect(result.content).toContain('[2]{id,name}');
    });

    it('should render without optimizer when not configured', () => {
      const component = createPromptComponent({
        key: 'no-optimizer',
        schema: z.object({
          users: z.array(z.object({ id: z.number(), name: z.string() })),
        }),
        template: ({ input, optimized }) => {
          const optimizedData = optimized['users'];
          return optimizedData
            ? `Optimized: ${optimizedData}`
            : `Raw: ${JSON.stringify(input.users)}`;
        },
      });

      const result = component.render({
        users: [{ id: 1, name: 'Alice' }],
      });

      expect(result.content).toContain('Raw:');
      expect(result.content).not.toContain('Optimized:');
    });

    it('should not optimize primitive values', () => {
      const component = createPromptComponent({
        key: 'primitives-only',
        schema: z.object({
          name: z.string(),
          age: z.number(),
        }),
        optimizer: { toon: true },
        template: ({ optimized }) => {
          const nameOpt = optimized['name'];
          const ageOpt = optimized['age'];
          return `
Name optimized: ${nameOpt ? 'yes' : 'no'}
Age optimized: ${ageOpt ? 'yes' : 'no'}
        `;
        },
      });

      const result = component.render({ name: 'Alice', age: 30 });

      expect(result.content).toContain('Name optimized: no');
      expect(result.content).toContain('Age optimized: no');
    });

    it('should handle empty arrays', () => {
      const component = createPromptComponent({
        key: 'empty-array',
        schema: z.object({
          users: z.array(z.object({ id: z.number() })),
        }),
        optimizer: { toon: true },
        template: ({ optimized }) => `Users: ${optimized['users'] ?? 'none'}`,
      });

      const result = component.render({ users: [] });

      expect(result.content).toBe('Users: none');
    });

    it('should support backward compatible string templates', () => {
      const component = createPromptComponent({
        key: 'backward-compatible',
        schema: z.object({
          name: z.string(),
          users: z.array(z.object({ id: z.number(), name: z.string() })),
        }),
        optimizer: { toon: true },
        template: 'Hello {{name}}, users: {{optimized.users}}',
      });

      const result = component.render({
        name: 'Admin',
        users: [{ id: 1, name: 'Alice' }],
      });

      expect(result.content).toContain('Hello Admin');
      expect(result.content).toContain('[1]{id,name}');
    });

    it('should fallback to empty string when optimized value is nullish', () => {
      const encodeSpy = vi
        .spyOn(toon, 'encode')
        .mockReturnValueOnce(undefined as unknown as string);
      const component = createPromptComponent({
        key: 'nullish-optimized',
        schema: z.object({
          settings: z.object({
            theme: z.string(),
          }),
        }),
        optimizer: { toon: true },
        template: 'Settings: {{optimized.settings}}',
      });

      const result = component.render({
        settings: { theme: 'dark' },
      });

      expect(result.content).toBe('Settings: ');
      expect(result.content).not.toContain('undefined');
      encodeSpy.mockRestore();
    });
  });

  describe('optimization metadata', () => {
    it('should include optimization metadata when optimizer is configured', () => {
      const component = createPromptComponent({
        key: 'with-optimizer',
        schema: z.object({
          users: z.array(z.object({ id: z.number(), name: z.string() })),
        }),
        optimizer: { toon: true },
        template: ({ optimized }) => `Users:\n${optimized.users}`,
      });

      const result = component.render({
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
      });

      expect(result.metadata.optimization).toBeDefined();
      expect(result.metadata.optimization?.keysOptimized).toEqual(['users']);
      expect(result.metadata.optimization?.originalTokens).toBeGreaterThan(0);
      expect(result.metadata.optimization?.optimizedTokens).toBeGreaterThan(0);
      expect(result.metadata.optimization?.reduction).toBeGreaterThan(0);
    });

    it('should not include optimization metadata when optimizer is not configured', () => {
      const component = createPromptComponent({
        key: 'no-optimizer',
        schema: z.object({
          name: z.string(),
        }),
        template: 'Hello {{name}}',
      });

      const result = component.render({ name: 'Alice' });

      expect(result.metadata.optimization).toBeUndefined();
    });

    it('should have empty keysOptimized when no fields are optimizable', () => {
      const component = createPromptComponent({
        key: 'primitives-only',
        schema: z.object({
          name: z.string(),
          age: z.number(),
        }),
        optimizer: { toon: true },
        template: '{{name}} is {{age}} years old',
      });

      const result = component.render({ name: 'Alice', age: 30 });

      expect(result.metadata.optimization).toBeDefined();
      expect(result.metadata.optimization?.keysOptimized).toEqual([]);
      expect(result.metadata.optimization?.reduction).toBe(0);
    });
  });

  describe('edge cases: template rendering', () => {
    it('should render empty string template', () => {
      const component = createPromptComponent({
        key: 'empty-template',
        template: '',
      });

      const result = component.render({});
      expect(result.content).toBe('');
    });

    it('should leave unmatched placeholders as-is in template', () => {
      const component = createPromptComponent({
        key: 'unmatched-placeholder',
        schema: z.object({ name: z.string() }),
        template: 'Hello {{name}}, your {{nonExistent}} is here',
      });

      const result = component.render({ name: 'Alice' });
      expect(result.content).toBe('Hello Alice, your {{nonExistent}} is here');
    });

    it('should handle empty string values (not null/undefined)', () => {
      const component = createPromptComponent({
        key: 'empty-string',
        schema: z.object({
          name: z.string(),
          description: z.string(),
        }),
        template: 'Name: {{name}}, Description: {{description}}',
      });

      const result = component.render({ name: 'Test', description: '' });
      expect(result.content).toBe('Name: Test, Description: ');
    });

    it("should render boolean false as 'false' string", () => {
      const component = createPromptComponent({
        key: 'boolean-false',
        schema: z.object({
          active: z.boolean(),
          premium: z.boolean(),
        }),
        template: 'Active: {{active}}, Premium: {{premium}}',
      });

      const result = component.render({ active: false, premium: true });
      expect(result.content).toBe('Active: false, Premium: true');
    });

    it("should render zero as '0' not empty string", () => {
      const component = createPromptComponent({
        key: 'zero-value',
        schema: z.object({
          count: z.number(),
          balance: z.number(),
        }),
        template: 'Count: {{count}}, Balance: {{balance}}',
      });

      const result = component.render({ count: 0, balance: 0 });
      expect(result.content).toBe('Count: 0, Balance: 0');
    });

    it('should stringify arrays in string templates', () => {
      const component = createPromptComponent({
        key: 'array-stringify',
        schema: z.object({
          tags: z.array(z.string()),
        }),
        template: 'Tags: {{tags}}',
      });

      const result = component.render({ tags: ['typescript', 'zod', 'ai'] });
      // Arrays convert to JSON representation
      expect(result.content).toBe('Tags: ["typescript","zod","ai"]');
    });

    it('should stringify objects as JSON in string templates', () => {
      const component = createPromptComponent({
        key: 'object-stringify',
        schema: z.object({
          user: z.object({ name: z.string() }),
        }),
        template: 'User: {{user}}',
      });

      const result = component.render({ user: { name: 'Alice' } });
      expect(result.content).toBe('User: {"name":"Alice"}');
    });

    it('should handle multiple consecutive placeholders without spaces', () => {
      const component = createPromptComponent({
        key: 'consecutive-placeholders',
        schema: z.object({
          first: z.string(),
          last: z.string(),
        }),
        template: '{{first}}{{last}}',
      });

      const result = component.render({ first: 'John', last: 'Doe' });
      expect(result.content).toBe('JohnDoe');
    });

    it('should reject special numeric values (Infinity, NaN) via Zod', () => {
      const component = createPromptComponent({
        key: 'special-numbers',
        schema: z.object({
          value: z.number(),
        }),
        template: 'Value: {{value}}',
      });

      // Zod rejects Infinity, -Infinity, and NaN as invalid numbers
      expect(() => component.render({ value: Infinity })).toThrow();
      expect(() => component.render({ value: -Infinity })).toThrow();
      expect(() => component.render({ value: NaN })).toThrow();
    });

    it('should accept finite numbers including negatives and decimals', () => {
      const component = createPromptComponent({
        key: 'finite-numbers',
        schema: z.object({
          negative: z.number(),
          decimal: z.number(),
          zero: z.number(),
        }),
        template: 'Neg: {{negative}}, Dec: {{decimal}}, Zero: {{zero}}',
      });

      const result = component.render({
        negative: -42,
        decimal: 3.14159,
        zero: 0,
      });
      expect(result.content).toBe('Neg: -42, Dec: 3.14159, Zero: 0');
    });
  });

  describe('edge cases: schema validation', () => {
    it('should work with schema transforms', () => {
      const component = createPromptComponent({
        key: 'with-transform',
        schema: z.object({
          email: z.string().transform((val) => val.toLowerCase()),
        }),
        template: 'Email: {{email}}',
      });

      const result = component.render({ email: 'USER@EXAMPLE.COM' });
      expect(result.content).toBe('Email: user@example.com');
    });

    it('should apply default values from schema', () => {
      const component = createPromptComponent({
        key: 'with-defaults',
        schema: z.object({
          name: z.string(),
          role: z.string().default('user'),
        }),
        template: '{{name}} ({{role}})',
      });

      const result = component.render({ name: 'Alice' });
      expect(result.content).toBe('Alice (user)');
    });

    it('should work with coercion', () => {
      const component = createPromptComponent({
        key: 'with-coercion',
        schema: z.object({
          age: z.coerce.number(),
          active: z.coerce.boolean(),
        }),
        template: 'Age: {{age}}, Active: {{active}}',
      });

      const result = component.render({ age: '25' as any, active: 1 as any });
      expect(result.content).toBe('Age: 25, Active: true');
    });

    it('should reject invalid data after preprocessing', () => {
      const component = createPromptComponent({
        key: 'preprocess-validation',
        schema: z.object({
          value: z.preprocess(
            (val) => (typeof val === 'string' ? val.trim() : val),
            z.string().min(1, 'Cannot be empty after trimming'),
          ),
        }),
        template: 'Value: {{value}}',
      });

      // Valid case: trimmed string is not empty
      expect(() => component.render({ value: '  test  ' as any })).not.toThrow();

      // Invalid case: trimmed string is empty
      expect(() => component.render({ value: '   ' as any })).toThrow();
    });
  });

  describe('edge cases: function templates', () => {
    it('should handle context as undefined', () => {
      const component = createPromptComponent({
        key: 'undefined-context',
        schema: z.object({ name: z.string() }),
        template: ({ input, context }) => {
          const hasContext = context !== undefined;
          return `${input.name}, context: ${String(hasContext)}`;
        },
      });

      // Explicitly pass undefined
      const result = component.render({ name: 'Alice' }, undefined);
      expect(result.content).toBe('Alice, context: false');
    });

    it('should safely access non-existent optimized keys', () => {
      const component = createPromptComponent({
        key: 'safe-optimized-access',
        schema: z.object({ name: z.string() }),
        optimizer: { toon: true },
        template: ({ input, optimized }) => {
          const opt = optimized['nonExistent'];
          return opt ? `Optimized: ${opt}` : `Raw: ${input.name}`;
        },
      });

      const result = component.render({ name: 'Alice' });
      expect(result.content).toBe('Raw: Alice');
    });

    it('should handle function template returning empty string', () => {
      const component = createPromptComponent({
        key: 'function-empty',
        schema: z.object({ name: z.string() }),
        template: () => '',
      });

      const result = component.render({ name: 'Alice' });
      expect(result.content).toBe('');
    });

    it('should handle multiline function template output', () => {
      const component = createPromptComponent({
        key: 'multiline-function',
        schema: z.object({ name: z.string(), items: z.array(z.string()) }),
        template: ({ input }) => {
          return `Name: ${input.name}
Items:
${input.items.map((item) => `- ${item}`).join('\n')}`;
        },
      });

      const result = component.render({
        name: 'Shopping',
        items: ['milk', 'bread', 'eggs'],
      });
      expect(result.content).toContain('Name: Shopping');
      expect(result.content).toContain('- milk');
      expect(result.content).toContain('- bread');
      expect(result.content).toContain('- eggs');
    });
  });

  describe('Component validation (intrinsic)', () => {
    it('should validate maxTokens and throw error when exceeded', () => {
      const component = createPromptComponent({
        key: 'validated-component',
        schema: z.object({ text: z.string() }),
        template: '{{text}}',
        validation: {
          maxTokens: 2,
        },
      });

      expect(() => {
        component.render({ text: 'This is a very long text that will exceed the token limit' });
      }).toThrow(/validation failed/);
    });

    it('should validate required keywords', () => {
      const component = createPromptComponent({
        key: 'required-keywords',
        schema: z.object({ text: z.string() }),
        template: '{{text}}',
        validation: {
          required: ['IMPORTANT', 'CRITICAL'],
        },
      });

      expect(() => {
        component.render({ text: 'This text is missing required keywords' });
      }).toThrow(/validation failed/);
    });

    it('should validate forbidden keywords', () => {
      const component = createPromptComponent({
        key: 'forbidden-keywords',
        schema: z.object({ text: z.string() }),
        template: '{{text}}',
        validation: {
          forbidden: ['BAD', 'WRONG'],
        },
      });

      expect(() => {
        component.render({ text: 'This text contains BAD content' });
      }).toThrow(/validation failed/);
    });

    it('should pass when validation succeeds', () => {
      const component = createPromptComponent({
        key: 'valid-component',
        schema: z.object({ text: z.string() }),
        template: '{{text}}',
        validation: {
          required: ['GOOD'],
          maxTokens: 50,
        },
      });

      const result = component.render({ text: 'This is GOOD content' });
      expect(result.content).toBe('This is GOOD content');
    });

    it('should warn for optional keywords', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const component = createPromptComponent({
        key: 'optional-keywords',
        schema: z.object({ text: z.string() }),
        template: '{{text}}',
        validation: {
          optional: ['RECOMMENDED'],
        },
      });

      component.render({ text: 'This text does not have optional keyword' });

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });

    it('should work without validation', () => {
      const component = createPromptComponent({
        key: 'no-validation',
        schema: z.object({ text: z.string() }),
        template: '{{text}}',
      });

      const result = component.render({ text: 'Any content works' });
      expect(result.content).toBe('Any content works');
    });
  });
});
