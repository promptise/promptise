import { z } from 'zod';
import { analyzeFixtureStatus } from './fixture-analyzer';

describe('analyzeFixtureStatus', () => {
  describe('status detection', () => {
    it('should detect complete status when all required fields are provided', () => {
      const schema = z.object({
        role: z.string(),
        task: z.string(),
      });

      const fixture = {
        role: 'doctor',
        task: 'diagnose symptoms',
      };

      const result = analyzeFixtureStatus(schema, fixture);

      expect(result.status).toBe('complete');
      expect(result.provided).toEqual(['role', 'task']);
      expect(result.missing).toEqual([]);
    });

    it('should detect partial status when some required fields are missing', () => {
      const schema = z.object({
        role: z.string(),
        task: z.string(),
        context: z.string(),
      });

      const fixture = {
        role: 'doctor',
      };

      const result = analyzeFixtureStatus(schema, fixture);

      expect(result.status).toBe('partial');
      expect(result.provided).toEqual(['role']);
      expect(result.missing).toEqual(['task', 'context']);
    });

    it('should detect placeholder status when no required fields are provided', () => {
      const schema = z.object({
        role: z.string(),
        task: z.string(),
      });

      const fixture = {};

      const result = analyzeFixtureStatus(schema, fixture);

      expect(result.status).toBe('placeholder');
      expect(result.provided).toEqual([]);
      expect(result.missing).toEqual(['role', 'task']);
    });
  });

  describe('optional fields handling', () => {
    it('should ignore optional fields in status determination', () => {
      const schema = z.object({
        role: z.string(),
        task: z.string(),
        examples: z.array(z.string()).optional(),
      });

      const fixture = {
        role: 'doctor',
        task: 'diagnose',
        examples: ['example1'],
      };

      const result = analyzeFixtureStatus(schema, fixture);

      expect(result.status).toBe('complete');
      expect(result.provided).toEqual(['role', 'task']);
      expect(result.missing).toEqual([]);
    });

    it('should still be placeholder if only optional fields provided', () => {
      const schema = z.object({
        role: z.string(),
        task: z.string(),
        examples: z.array(z.string()).optional(),
      });

      const fixture = {
        examples: ['example1'],
      };

      const result = analyzeFixtureStatus(schema, fixture);

      expect(result.status).toBe('placeholder');
      expect(result.provided).toEqual([]);
      expect(result.missing).toEqual(['role', 'task']);
    });

    it('should handle schema with only optional fields', () => {
      const schema = z.object({
        examples: z.array(z.string()).optional(),
        notes: z.string().optional(),
      });

      const fixture = {
        examples: ['example1'],
      };

      const result = analyzeFixtureStatus(schema, fixture);

      expect(result.status).toBe('complete');
      expect(result.statusLabel).toBe('complete - no required fields');
      expect(result.provided).toEqual([]);
      expect(result.missing).toEqual([]);
      expect(result.requiredFields).toEqual([]);
      expect(result.optionalFields).toEqual(['examples', 'notes']);
    });
  });

  describe('nullable fields handling', () => {
    it('should treat nullable() fields as required', () => {
      const schema = z.object({
        required: z.string(),
        nullable: z.string().nullable(),
      });

      const fixture = {
        required: 'value',
        nullable: null,
      };

      const result = analyzeFixtureStatus(schema, fixture);

      // nullable() does NOT make field optional - field must be present (can be null)
      expect(result.status).toBe('complete');
      expect(result.requiredFields).toEqual(['required', 'nullable']);
      expect(result.optionalFields).toEqual([]);
    });

    it('should detect missing nullable field', () => {
      const schema = z.object({
        required: z.string(),
        nullable: z.string().nullable(),
      });

      const fixture = {
        required: 'value',
      };

      const result = analyzeFixtureStatus(schema, fixture);

      // nullable field not provided = partial status
      expect(result.status).toBe('partial');
      expect(result.provided).toEqual(['required']);
      expect(result.missing).toEqual(['nullable']);
    });
  });

  describe('default values handling', () => {
    it('should treat fields with default() as optional', () => {
      const schema = z.object({
        required: z.string(),
        withDefault: z.string().default('default value'),
      });

      const fixture = {
        required: 'value',
      };

      const result = analyzeFixtureStatus(schema, fixture);

      // .default() makes field optional
      expect(result.status).toBe('complete');
      expect(result.requiredFields).toEqual(['required']);
      expect(result.optionalFields).toEqual(['withDefault']);
    });

    it('should handle provided field with default value', () => {
      const schema = z.object({
        required: z.string(),
        withDefault: z.string().default('default value'),
      });

      const fixture = {
        required: 'value',
        withDefault: 'custom value',
      };

      const result = analyzeFixtureStatus(schema, fixture);

      expect(result.status).toBe('complete');
      expect(result.provided).toEqual(['required']);
      expect(result.missing).toEqual([]);
    });
  });

  describe('null vs undefined values', () => {
    it('should treat null as provided value', () => {
      const schema = z.object({
        field1: z.string(),
        field2: z.string().nullable(),
      });

      const fixture = {
        field1: 'value',
        field2: null,
      };

      const result = analyzeFixtureStatus(schema, fixture);

      // null is a provided value
      expect(result.status).toBe('complete');
      expect(result.provided).toEqual(['field1', 'field2']);
      expect(result.missing).toEqual([]);
    });

    it('should treat undefined as not provided', () => {
      const schema = z.object({
        field1: z.string(),
        field2: z.string(),
      });

      const fixture = {
        field1: 'value',
        field2: undefined,
      };

      const result = analyzeFixtureStatus(schema, fixture);

      // undefined means field was not provided (not in object keys)
      expect(result.status).toBe('complete');
      expect(result.provided).toEqual(['field1', 'field2']);
    });
  });

  describe('nested schemas', () => {
    it('should handle nested object schemas at top level', () => {
      const schema = z.object({
        simple: z.string(),
        nested: z.object({
          inner1: z.string(),
          inner2: z.number(),
        }),
      });

      const fixture = {
        simple: 'value',
        nested: {
          inner1: 'text',
          inner2: 42,
        },
      };

      const result = analyzeFixtureStatus(schema, fixture);

      // Analyzer only checks top-level fields (nested is one field)
      expect(result.status).toBe('complete');
      expect(result.provided).toEqual(['simple', 'nested']);
      expect(result.requiredFields).toEqual(['simple', 'nested']);
    });

    it('should detect missing nested object', () => {
      const schema = z.object({
        simple: z.string(),
        nested: z.object({
          inner: z.string(),
        }),
      });

      const fixture = {
        simple: 'value',
      };

      const result = analyzeFixtureStatus(schema, fixture);

      expect(result.status).toBe('partial');
      expect(result.provided).toEqual(['simple']);
      expect(result.missing).toEqual(['nested']);
    });
  });

  describe('array fields', () => {
    it('should handle array fields as single required field', () => {
      const schema = z.object({
        name: z.string(),
        tags: z.array(z.string()),
      });

      const fixture = {
        name: 'test',
        tags: ['tag1', 'tag2', 'tag3'],
      };

      const result = analyzeFixtureStatus(schema, fixture);

      // Array is treated as one field
      expect(result.status).toBe('complete');
      expect(result.provided).toEqual(['name', 'tags']);
      expect(result.requiredFields).toEqual(['name', 'tags']);
    });

    it('should detect missing array field', () => {
      const schema = z.object({
        name: z.string(),
        tags: z.array(z.string()),
      });

      const fixture = {
        name: 'test',
      };

      const result = analyzeFixtureStatus(schema, fixture);

      expect(result.status).toBe('partial');
      expect(result.missing).toEqual(['tags']);
    });

    it('should handle empty array as provided', () => {
      const schema = z.object({
        name: z.string(),
        tags: z.array(z.string()),
      });

      const fixture = {
        name: 'test',
        tags: [],
      };

      const result = analyzeFixtureStatus(schema, fixture);

      // Empty array is still a provided value
      expect(result.status).toBe('complete');
      expect(result.provided).toEqual(['name', 'tags']);
    });
  });

  describe('provided and missing fields', () => {
    it('should correctly identify provided and missing fields', () => {
      const schema = z.object({
        field1: z.string(),
        field2: z.string(),
        field3: z.string(),
        field4: z.string(),
      });

      const fixture = {
        field1: 'value1',
        field3: 'value3',
      };

      const result = analyzeFixtureStatus(schema, fixture);

      expect(result.provided).toEqual(['field1', 'field3']);
      expect(result.missing).toEqual(['field2', 'field4']);
    });

    it('should handle fixture with extra fields not in schema', () => {
      const schema = z.object({
        role: z.string(),
        task: z.string(),
      });

      const fixture = {
        role: 'doctor',
        task: 'diagnose',
        extraField: 'should be ignored',
      };

      const result = analyzeFixtureStatus(schema, fixture);

      expect(result.status).toBe('complete');
      expect(result.provided).toEqual(['role', 'task']);
      expect(result.missing).toEqual([]);
    });
  });
});
