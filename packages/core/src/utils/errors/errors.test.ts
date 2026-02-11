import { formatValidationError } from './index';
import { z } from 'zod';

describe('formatValidationError', () => {
  it('should format simple validation error with suggestions', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    const result = schema.safeParse({ name: 123, age: 'invalid' });

    if (!result.success) {
      const formatted = formatValidationError(result.error);

      expect(formatted).toContain('Validation failed');
      expect(formatted).toContain('name');
      expect(formatted).toContain('age');
      expect(formatted).toContain('expected string, received number');
      expect(formatted).toContain('expected number, received string');
    } else {
      fail('Expected validation to fail');
    }
  });

  it('should handle missing required fields', () => {
    const schema = z.object({
      required: z.string(),
    });

    const result = schema.safeParse({});

    if (!result.success) {
      const formatted = formatValidationError(result.error);

      expect(formatted).toContain('Validation failed');
      expect(formatted).toContain('required');
      expect(formatted).toContain('expected string, received undefined');
    } else {
      fail('Expected validation to fail');
    }
  });

  it('should suggest valid keys when using strict schema', () => {
    const schema = z
      .object({
        validKey: z.string(),
      })
      .strict();

    const result = schema.safeParse({ validKey: 'test', invalidKey: 'oops' });

    if (!result.success) {
      const formatted = formatValidationError(result.error);

      expect(formatted).toContain('Validation failed');
      expect(formatted).toContain('Unrecognized key');
      expect(formatted).toContain('validKey');
    } else {
      fail('Expected validation to fail');
    }
  });

  it('should handle too_small validation error', () => {
    const schema = z.string().min(10);
    const result = schema.safeParse('short');

    if (!result.success) {
      const formatted = formatValidationError(result.error);
      expect(formatted).toContain('Validation failed');
      expect(formatted).toContain('Too small');
      expect(formatted).toContain('Code: too_small');
    } else {
      fail('Expected validation to fail');
    }
  });

  it('should handle too_big validation error', () => {
    const schema = z.string().max(5);
    const result = schema.safeParse('very long string');

    if (!result.success) {
      const formatted = formatValidationError(result.error);
      expect(formatted).toContain('Validation failed');
      expect(formatted).toContain('Too big');
      expect(formatted).toContain('Code: too_big');
    } else {
      fail('Expected validation to fail');
    }
  });

  it('should handle invalid_format validation error', () => {
    const schema = z.string().email();
    const result = schema.safeParse('not-an-email');

    if (!result.success) {
      const formatted = formatValidationError(result.error);
      expect(formatted).toContain('Validation failed');
      expect(formatted).toContain('email');
      expect(formatted).toContain('Code: invalid_format');
    } else {
      fail('Expected validation to fail');
    }
  });

  it('should handle custom validation error', () => {
    const schema = z.string().refine(() => false, { message: 'Custom error' });
    const result = schema.safeParse('test');

    if (!result.success) {
      const formatted = formatValidationError(result.error);
      expect(formatted).toContain('Validation failed');
      expect(formatted).toContain('Custom error');
      expect(formatted).toContain('Code: custom');
    } else {
      fail('Expected validation to fail');
    }
  });

  it('should handle unknown validation error codes', () => {
    const schema = z.string();
    const result = schema.safeParse(123);

    if (!result.success) {
      const formatted = formatValidationError(result.error);
      expect(formatted).toContain('Validation failed');
      expect(formatted).toBeDefined();
    } else {
      fail('Expected validation to fail');
    }
  });

  it('should handle validation errors with unknown issue codes gracefully', () => {
    // Create a schema that will produce an error
    const schema = z.object({
      field: z.string(),
    });
    const result = schema.safeParse({ field: 123 });

    if (!result.success) {
      const formatted = formatValidationError(result.error);
      // Should still format even if some suggestion returns null
      expect(formatted).toContain('Validation failed');
      expect(formatted).toContain('field');
    } else {
      fail('Expected validation to fail');
    }
  });

  it('should handle errors without suggestions', () => {
    // Create an error with a code that returns null from _getSuggestion
    const schema = z.string().refine((val) => val === 'specific', {
      message: 'Must be exactly "specific"',
    });
    const result = schema.safeParse('wrong');

    if (!result.success) {
      const formatted = formatValidationError(result.error);
      expect(formatted).toContain('Validation failed');
      expect(formatted).toContain('Must be exactly "specific"');
      // Should not crash when suggestion is null
      expect(formatted).toBeDefined();
    } else {
      fail('Expected validation to fail');
    }
  });

  it('should handle unrecognized_keys validation error', () => {
    const schema = z.object({ validKey: z.string() }).strict();
    const result = schema.safeParse({ validKey: 'test', extraKey: 'value' });

    if (!result.success) {
      const formatted = formatValidationError(result.error);
      expect(formatted).toContain('Validation failed');
      expect(formatted).toContain('extraKey');
    } else {
      fail('Expected validation to fail');
    }
  });

  it('should provide generic suggestion for unknown error codes', () => {
    // Use z.literal() with wrong value
    const schema = z.literal('expected-value');
    const result = schema.safeParse('wrong-value');

    if (!result.success) {
      const formatted = formatValidationError(result.error);
      expect(formatted).toContain('Validation failed');
      expect(formatted).toContain('Invalid input');
      expect(formatted).toBeDefined();
    } else {
      fail('Expected validation to fail');
    }
  });

  describe('edge cases', () => {
    it('should format error with contextLabel', () => {
      const schema = z.string();
      const result = schema.safeParse(123);

      if (!result.success) {
        const formatted = formatValidationError(result.error, 'userInput');
        expect(formatted).toContain('[Promptise] Validation failed for "userInput"');
        expect(formatted).toContain('string');
        expect(formatted).toContain('number');
      } else {
        fail('Expected validation to fail');
      }
    });

    it('should handle root-level errors with <root> path', () => {
      // Schema validation at root level (no nested path)
      const schema = z.number();
      const result = schema.safeParse('not a number');

      if (!result.success) {
        const formatted = formatValidationError(result.error);
        expect(formatted).toContain('Path: <root>');
        expect(formatted).toContain('number');
      } else {
        fail('Expected validation to fail');
      }
    });

    it('should handle multiple issues in single error', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string().email(),
      });
      const result = schema.safeParse({
        name: 123,
        age: 'invalid',
        email: 'bad',
      });

      if (!result.success) {
        const formatted = formatValidationError(result.error);
        expect(formatted).toContain('Issue 1:');
        expect(formatted).toContain('Issue 2:');
        expect(formatted).toContain('Issue 3:');
        expect(formatted).toContain('name');
        expect(formatted).toContain('age');
        expect(formatted).toContain('email');
      } else {
        fail('Expected validation to fail');
      }
    });

    it('should handle contextLabel with root-level error', () => {
      const schema = z.string();
      const result = schema.safeParse(null);

      if (!result.success) {
        const formatted = formatValidationError(result.error, 'config:apiKey');
        expect(formatted).toContain('[Promptise] Validation failed for "config:apiKey"');
        expect(formatted).toContain('Path: <root>');
      } else {
        fail('Expected validation to fail');
      }
    });

    it('should handle deeply nested paths', () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            settings: z.object({
              theme: z.string(),
            }),
          }),
        }),
      });
      const result = schema.safeParse({
        user: { profile: { settings: { theme: 123 } } },
      });

      if (!result.success) {
        const formatted = formatValidationError(result.error);
        expect(formatted).toContain('Path: user.profile.settings.theme');
        expect(formatted).toContain('string');
      } else {
        fail('Expected validation to fail');
      }
    });

    it('should handle many issues with correct numbering', () => {
      // Create schema with 12 fields to test double-digit issue numbers
      const schema = z.object({
        f1: z.string(),
        f2: z.string(),
        f3: z.string(),
        f4: z.string(),
        f5: z.string(),
        f6: z.string(),
        f7: z.string(),
        f8: z.string(),
        f9: z.string(),
        f10: z.string(),
        f11: z.string(),
        f12: z.string(),
      });
      const result = schema.safeParse({
        f1: 1,
        f2: 2,
        f3: 3,
        f4: 4,
        f5: 5,
        f6: 6,
        f7: 7,
        f8: 8,
        f9: 9,
        f10: 10,
        f11: 11,
        f12: 12,
      });

      if (!result.success) {
        const formatted = formatValidationError(result.error);
        expect(formatted).toContain('Issue 1:');
        expect(formatted).toContain('Issue 9:');
        expect(formatted).toContain('Issue 10:');
        expect(formatted).toContain('Issue 11:');
        expect(formatted).toContain('Issue 12:');
      } else {
        fail('Expected validation to fail');
      }
    });
  });
});
