import { mkdir, writeFile } from 'node:fs/promises';
import { generatePreviews } from './preview-generator';
import { logger } from '../logger/index.js';
import { z } from 'zod';

jest.mock('node:fs/promises');
jest.mock('../logger/index.js');

const mockMkdir = mkdir as jest.MockedFunction<typeof mkdir>;
const mockWriteFile = writeFile as jest.MockedFunction<typeof writeFile>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('generatePreviews', () => {
  let mockRegistry: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock registry with basic structure
    mockRegistry = {
      getCompositions: jest.fn(() => [
        {
          composition: {
            id: 'test-comp',
            schema: z.object({
              field1: z.string(),
              field2: z.string(),
            }),
            build: jest.fn((data) => ({
              asString: () => `Field1: ${data.field1}, Field2: ${data.field2}`,
              metadata: { tokenCount: 10 },
            })),
          },
          fixtures: {
            complete: { field1: 'value1', field2: 'value2' },
            partial: { field1: 'value1' },
          },
        },
      ]),
    };
  });

  describe('basic functionality', () => {
    it('should create output directory', async () => {
      await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(mockMkdir).toHaveBeenCalledWith(expect.stringContaining('.promptise/builds'), {
        recursive: true,
      });
    });

    it('should write preview files for each fixture', async () => {
      const stats = await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(mockWriteFile).toHaveBeenCalledTimes(2);
      expect(stats.totalBuilds).toBe(2);
    });

    it('should write files with correct naming pattern', async () => {
      await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('test-comp_complete.txt'),
        expect.any(String),
        'utf-8',
      );
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('test-comp_partial.txt'),
        expect.any(String),
        'utf-8',
      );
    });
  });

  describe('metadata generation', () => {
    it('should include metadata by default', async () => {
      await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      const firstCall = mockWriteFile.mock.calls[0];
      const content = firstCall[1] as string;

      expect(content).toContain('---');
      expect(content).toContain('Composition ID: test-comp');
      expect(content).toContain('Fixture:');
    });

    it('should skip metadata when metadata=false', async () => {
      await generatePreviews(mockRegistry, { outdir: '.promptise/builds', metadata: false });

      const firstCall = mockWriteFile.mock.calls[0];
      const content = firstCall[1] as string;

      expect(content).not.toContain('---');
      expect(content).not.toContain('Composition ID');
    });

    it('should include optional fields in metadata', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'with-optional',
            schema: z.object({
              required: z.string(),
              optional: z.string().optional(),
            }),
            build: jest.fn((data) => ({
              asString: () => `Required: ${data.required}`,
              metadata: { tokenCount: 5 },
            })),
          },
          fixtures: {
            partial: { required: 'value' }, // optional field not provided
          },
        },
      ]);

      await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      const content = mockWriteFile.mock.calls[0][1] as string;

      expect(content).toContain('✓ required (required)');
      expect(content).toContain('○ optional (optional)');
      expect(content).toContain('→ not provided');
    });

    it('should show provided optional fields', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'with-provided-optional',
            schema: z.object({
              name: z.string(),
              description: z.string().optional(),
            }),
            build: jest.fn((data) => ({
              asString: () => `Name: ${data.name}, Desc: ${data.description}`,
              metadata: { tokenCount: 8 },
            })),
          },
          fixtures: {
            full: { name: 'John', description: 'A developer' }, // optional field IS provided
          },
        },
      ]);

      await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      const content = mockWriteFile.mock.calls[0][1] as string;

      expect(content).toContain('✓ name (required)');
      expect(content).toContain('✓ description (optional)');
      expect(content).not.toContain('→ not provided');
    });

    it('should handle composition with empty schema', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'no-schema',
            schema: z.object({}), // Empty schema - no fields
            build: jest.fn(() => ({
              asString: () => 'Static content',
              metadata: { tokenCount: 2 },
            })),
          },
          fixtures: {
            empty: {},
          },
        },
      ]);

      await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      const content = mockWriteFile.mock.calls[0][1] as string;

      expect(content).toContain('Composition ID: no-schema');
      expect(content).toContain('Fixture: empty');
      expect(content).not.toContain('Schema Fields:'); // No fields section
      expect(content).toContain('Tokens: 2');
    });
  });

  describe('filtering', () => {
    it('should filter by composition ID', async () => {
      const stats = await generatePreviews(mockRegistry, {
        outdir: '.promptise/builds',
        compositionId: 'test-comp',
      });

      expect(stats.totalBuilds).toBe(2);
    });

    it('should skip non-matching composition ID', async () => {
      const stats = await generatePreviews(mockRegistry, {
        outdir: '.promptise/builds',
        compositionId: 'non-existent',
      });

      expect(stats.totalBuilds).toBe(0);
    });

    it('should filter by fixture name', async () => {
      const stats = await generatePreviews(mockRegistry, {
        outdir: '.promptise/builds',
        fixtureName: 'complete',
      });

      expect(stats.totalBuilds).toBe(1);
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('warnings', () => {
    it('should warn for partial fixtures', async () => {
      const stats = await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Partial fixture'));
      expect(stats.totalWarnings).toBeGreaterThan(0);
    });

    it('should warn when no fixtures exist', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: { id: 'empty-comp', schema: z.object({}) },
          fixtures: {},
        },
      ]);

      await generatePreviews(mockRegistry, {
        outdir: '.promptise/builds',
        verbose: true,
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('No fixtures'));
    });

    it('should not warn when no fixtures and verbose=false', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: { id: 'empty-comp', schema: z.object({}) },
          fixtures: {},
        },
      ]);

      const stats = await generatePreviews(mockRegistry, {
        outdir: '.promptise/builds',
        verbose: false,
      });

      expect(mockLogger.warn).not.toHaveBeenCalledWith(expect.stringContaining('No fixtures'));
      expect(stats.totalBuilds).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should continue on error and log failure', async () => {
      mockWriteFile.mockRejectedValueOnce(new Error('Write failed'));

      const stats = await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(mockLogger.error).toHaveBeenCalled();
      expect(stats.totalBuilds).toBe(1); // Only the second one succeeded
    });

    it('should handle build errors gracefully', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'failing',
            schema: z.object({ required: z.string() }),
            build: jest.fn(() => {
              throw new Error('Build failed');
            }),
          },
          fixtures: {
            bad: {},
          },
        },
      ]);

      const stats = await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(mockLogger.error).toHaveBeenCalled();
      expect(stats.totalBuilds).toBe(0);
    });
  });

  describe('verbose mode', () => {
    it('should log success messages in verbose mode', async () => {
      await generatePreviews(mockRegistry, { outdir: '.promptise/builds', verbose: true });

      expect(mockLogger.success).toHaveBeenCalled();
    });

    it('should not log success when verbose=false', async () => {
      await generatePreviews(mockRegistry, { outdir: '.promptise/builds', verbose: false });

      expect(mockLogger.success).not.toHaveBeenCalled();
    });
  });

  describe('edge cases - null and undefined values', () => {
    it('should handle fixture with null values', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'with-null',
            schema: z.object({
              field1: z.string(),
              field2: z.string().nullable(),
            }),
            build: jest.fn((data) => ({
              asString: () => `Field1: ${data.field1}, Field2: ${data.field2}`,
              metadata: { tokenCount: 10 },
            })),
          },
          fixtures: {
            test: { field1: 'value', field2: null },
          },
        },
      ]);

      const stats = await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(stats.totalBuilds).toBe(1);
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('should handle fixture with undefined values', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'with-undefined',
            schema: z.object({
              field1: z.string(),
              field2: z.string().optional(),
            }),
            build: jest.fn((data) => ({
              asString: () => `Field1: ${data.field1}`,
              metadata: { tokenCount: 5 },
            })),
          },
          fixtures: {
            test: { field1: 'value', field2: undefined },
          },
        },
      ]);

      const stats = await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(stats.totalBuilds).toBe(1);
      expect(mockWriteFile).toHaveBeenCalled();
    });
  });

  describe('edge cases - complex schemas', () => {
    it('should handle schema with nested objects', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'nested-schema',
            schema: z.object({
              simple: z.string(),
              nested: z.object({
                inner: z.string(),
              }),
            }),
            build: jest.fn((data) => ({
              asString: () => `Simple: ${data.simple}, Inner: ${data.nested.inner}`,
              metadata: { tokenCount: 12 },
            })),
          },
          fixtures: {
            test: {
              simple: 'value',
              nested: { inner: 'nested value' },
            },
          },
        },
      ]);

      const stats = await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(stats.totalBuilds).toBe(1);
      const content = mockWriteFile.mock.calls[0][1] as string;
      expect(content).toContain('✓ simple (required)');
      expect(content).toContain('✓ nested (required)');
    });

    it('should handle schema with array fields', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'array-schema',
            schema: z.object({
              name: z.string(),
              tags: z.array(z.string()),
            }),
            build: jest.fn((data) => ({
              asString: () => `Name: ${data.name}, Tags: ${data.tags.join(', ')}`,
              metadata: { tokenCount: 15 },
            })),
          },
          fixtures: {
            test: {
              name: 'Test',
              tags: ['tag1', 'tag2'],
            },
          },
        },
      ]);

      const stats = await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(stats.totalBuilds).toBe(1);
      const content = mockWriteFile.mock.calls[0][1] as string;
      expect(content).toContain('✓ name (required)');
      expect(content).toContain('✓ tags (required)');
    });
  });

  describe('edge cases - token counts', () => {
    it('should handle token count of 0', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'zero-tokens',
            schema: z.object({ field: z.string() }),
            build: jest.fn(() => ({
              asString: () => '',
              metadata: { tokenCount: 0 },
            })),
          },
          fixtures: {
            test: { field: 'value' },
          },
        },
      ]);

      const stats = await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(stats.totalBuilds).toBe(1);
      const content = mockWriteFile.mock.calls[0][1] as string;
      expect(content).toContain('Tokens: 0');
    });

    it('should handle very large token count', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'large-tokens',
            schema: z.object({ field: z.string() }),
            build: jest.fn(() => ({
              asString: () => 'a'.repeat(50000),
              metadata: { tokenCount: 15000 },
            })),
          },
          fixtures: {
            test: { field: 'value' },
          },
        },
      ]);

      const stats = await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(stats.totalBuilds).toBe(1);
      const content = mockWriteFile.mock.calls[0][1] as string;
      expect(content).toContain('Tokens: 15000');
    });

    it('should handle empty rendered content', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'empty-render',
            schema: z.object({ field: z.string() }),
            build: jest.fn(() => ({
              asString: () => '',
              metadata: { tokenCount: 0 },
            })),
          },
          fixtures: {
            test: { field: 'value' },
          },
        },
      ]);

      const stats = await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(stats.totalBuilds).toBe(1);
      expect(mockWriteFile).toHaveBeenCalled();
      const content = mockWriteFile.mock.calls[0][1] as string;
      // Empty content should still have metadata header
      expect(content).toContain('---');
      expect(content).toContain('Composition ID: empty-render');
    });
  });

  describe('edge cases - special characters in names', () => {
    it('should handle composition ID with special characters', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'comp-with-special@chars!',
            schema: z.object({ field: z.string() }),
            build: jest.fn(() => ({
              asString: () => 'test content',
              metadata: { tokenCount: 5 },
            })),
          },
          fixtures: {
            test: { field: 'value' },
          },
        },
      ]);

      const stats = await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(stats.totalBuilds).toBe(1);
      // File should be created with the special chars in filename
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('comp-with-special@chars!_test.txt'),
        expect.any(String),
        'utf-8',
      );
    });

    it('should handle fixture name with special characters', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'normal-comp',
            schema: z.object({ field: z.string() }),
            build: jest.fn(() => ({
              asString: () => 'test content',
              metadata: { tokenCount: 5 },
            })),
          },
          fixtures: {
            'fixture-with-special!@#': { field: 'value' },
          },
        },
      ]);

      const stats = await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(stats.totalBuilds).toBe(1);
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('normal-comp_fixture-with-special!@#.txt'),
        expect.any(String),
        'utf-8',
      );
    });

    it('should handle multiple compositions with same fixture name', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'comp-1',
            schema: z.object({ field: z.string() }),
            build: jest.fn(() => ({
              asString: () => 'content 1',
              metadata: { tokenCount: 5 },
            })),
          },
          fixtures: {
            common: { field: 'value1' },
          },
        },
        {
          composition: {
            id: 'comp-2',
            schema: z.object({ field: z.string() }),
            build: jest.fn(() => ({
              asString: () => 'content 2',
              metadata: { tokenCount: 5 },
            })),
          },
          fixtures: {
            common: { field: 'value2' },
          },
        },
      ]);

      const stats = await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(stats.totalBuilds).toBe(2);
      // Should create different files: comp-1_common.txt and comp-2_common.txt
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('comp-1_common.txt'),
        expect.any(String),
        'utf-8',
      );
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('comp-2_common.txt'),
        expect.any(String),
        'utf-8',
      );
    });
  });
});
