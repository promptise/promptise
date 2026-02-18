import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import { generatePreviews } from './preview-generator';
import { logger } from '../logger/index.js';
import { z } from 'zod';
import type { Mocked, MockedFunction } from 'vitest';

vi.mock('node:fs/promises');
vi.mock('../logger/index.js');

const mockMkdir = mkdir as MockedFunction<typeof mkdir>;
const mockReaddir = readdir as MockedFunction<typeof readdir>;
const mockUnlink = unlink as MockedFunction<typeof unlink>;
const mockWriteFile = writeFile as MockedFunction<typeof writeFile>;
const mockLogger = logger as Mocked<typeof logger>;

function createFileDirent(name: string): { name: string; isFile: () => boolean } {
  return {
    name,
    isFile: () => true,
  };
}

describe('generatePreviews', () => {
  let mockRegistry: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReaddir.mockResolvedValue([]);
    mockUnlink.mockResolvedValue(undefined);

    // Create mock registry with basic structure
    mockRegistry = {
      getCompositions: vi.fn(() => [
        {
          composition: {
            id: 'test-comp',
            schema: z.object({
              field1: z.string(),
              field2: z.string(),
            }),
            build: vi.fn((data) => ({
              asString: () => `Field1: ${data.field1}, Field2: ${data.field2}`,
              metadata: { estimatedTokens: 10 },
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

  describe('stale file cleanup', () => {
    it('should remove stale preview files by default', async () => {
      mockReaddir.mockResolvedValue([
        createFileDirent('test-comp_old-fixture.txt'),
        createFileDirent('unrelated-file.txt'),
      ] as any);

      await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(mockUnlink).toHaveBeenCalledTimes(1);
      expect(mockUnlink).toHaveBeenCalledWith(expect.stringContaining('test-comp_old-fixture.txt'));
    });

    it('should not remove files when clean=false', async () => {
      mockReaddir.mockResolvedValue([createFileDirent('test-comp_old-fixture.txt')] as any);

      await generatePreviews(mockRegistry, {
        outdir: '.promptise/builds',
        clean: false,
      });

      expect(mockUnlink).not.toHaveBeenCalled();
    });

    it('should skip stale cleanup on fixture-filtered builds', async () => {
      mockReaddir.mockResolvedValue([createFileDirent('test-comp_partial.txt')] as any);

      await generatePreviews(mockRegistry, {
        outdir: '.promptise/builds',
        fixtureName: 'complete',
      });

      expect(mockUnlink).not.toHaveBeenCalled();
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
            build: vi.fn((data) => ({
              asString: () => `Required: ${data.required}`,
              metadata: { estimatedTokens: 5 },
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

    it('should show estimated tokens only for complete fixtures', async () => {
      await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      const fullContent = mockWriteFile.mock.calls[0]?.[1] as string;
      const partialContent = mockWriteFile.mock.calls[1]?.[1] as string;

      expect(fullContent).toContain('Fixture: complete');
      expect(fullContent).toContain('Estimated Tokens: 10');

      expect(partialContent).toContain('Fixture: partial');
      expect(partialContent).not.toContain('Estimated Tokens:');
    });

    it('should include estimated input cost block for complete fixtures with pricing', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'priced-comp',
            schema: z.object({
              field1: z.string(),
              field2: z.string(),
            }),
            build: vi.fn((data) => ({
              asString: () => `Field1: ${data.field1}, Field2: ${data.field2}`,
              metadata: { estimatedTokens: data.field1 === '' && data.field2 === '' ? 4 : 10 },
            })),
          },
          fixtures: {
            complete: { field1: 'value1', field2: 'value2' },
          },
          cost: {
            inputTokenPrice: 0.000005,
            outputTokenPrice: 0.000015,
            currency: 'USD',
          },
        },
      ]);

      await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      const content = mockWriteFile.mock.calls[0][1] as string;
      expect(content).toContain('Estimated Input Cost:');
      expect(content).toContain('Input Pricing: $5.00 / 1M tokens ($0.000005/token)');
      expect(content).toContain('Static: 4 tokens / $0.000020');
      expect(content).toContain('Dynamic: 6 tokens / $0.000030');
      expect(content).toContain('Total: 10 tokens / $0.000050');
      expect(content).not.toContain('Estimated Tokens: 10');
    });

    it('should not include estimated input cost block for partial fixtures even with pricing', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'priced-partial',
            schema: z.object({
              field1: z.string(),
              field2: z.string(),
            }),
            build: vi.fn((data) => ({
              asString: () => `Field1: ${data.field1}, Field2: ${data.field2}`,
              metadata: { estimatedTokens: 8 },
            })),
          },
          fixtures: {
            partial: { field1: 'value1' },
          },
          cost: {
            inputTokenPrice: 0.000005,
            outputTokenPrice: 0.000015,
            currency: 'USD',
          },
        },
      ]);

      await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      const content = mockWriteFile.mock.calls[0][1] as string;
      expect(content).toContain('Fixture: partial');
      expect(content).not.toContain('Estimated Input Cost:');
      expect(content).not.toContain('Estimated Tokens:');
    });

    it('should inject placeholders for missing required fields', async () => {
      await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      const partialContent = mockWriteFile.mock.calls[1]?.[1] as string;
      expect(partialContent).toContain('Field2: {{field2}}');
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
            build: vi.fn((data) => ({
              asString: () => `Name: ${data.name}, Desc: ${data.description}`,
              metadata: { estimatedTokens: 8 },
            })),
          },
          fixtures: {
            complete: { name: 'John', description: 'A developer' }, // optional field IS provided
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
            build: vi.fn(() => ({
              asString: () => 'Static content',
              metadata: { estimatedTokens: 2 },
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
      expect(content).toContain('Estimated Tokens: 2');
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

    it('should generate placeholder preview when no fixtures exist', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'empty-comp',
            schema: z.object({
              field1: z.string(),
              field2: z.string(),
            }),
            build: vi.fn(() => ({
              asString: () => `Field1: {{field1}}, Field2: {{field2}}`,
              metadata: { estimatedTokens: 5 },
            })),
          },
          fixtures: {},
        },
      ]);

      const stats = await generatePreviews(mockRegistry, {
        outdir: '.promptise/builds',
      });

      // Should generate one preview with "placeholder" fixture name
      expect(stats.totalBuilds).toBe(1);
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('empty-comp_placeholder.txt'),
        expect.any(String),
        'utf-8',
      );
    });

    it('should generate placeholder preview when fixtures is undefined', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'no-fixtures',
            schema: z.object({
              name: z.string(),
            }),
            build: vi.fn(() => ({
              asString: () => `Name: {{name}}`,
              metadata: { estimatedTokens: 3 },
            })),
          },
          fixtures: undefined,
        },
      ]);

      const stats = await generatePreviews(mockRegistry, {
        outdir: '.promptise/builds',
      });

      expect(stats.totalBuilds).toBe(1);
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('no-fixtures_placeholder.txt'),
        expect.any(String),
        'utf-8',
      );
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
            build: vi.fn(() => {
              throw new Error('Build failed');
            }),
          },
          fixtures: {
            bad: {},
          },
        },
      ]);

      const stats = await generatePreviews(mockRegistry, { outdir: '.promptise/builds' });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Using fallback preview'),
      );
      expect(stats.totalBuilds).toBe(1);
      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const content = mockWriteFile.mock.calls[0]?.[1] as string;
      expect(content).toContain('[Promptise] Preview generated with placeholder fallback.');
      expect(content).toContain('{{required}}');
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
            build: vi.fn((data) => ({
              asString: () => `Field1: ${data.field1}, Field2: ${data.field2}`,
              metadata: { estimatedTokens: 10 },
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
            build: vi.fn((data) => ({
              asString: () => `Field1: ${data.field1}`,
              metadata: { estimatedTokens: 5 },
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
            build: vi.fn((data) => ({
              asString: () => `Simple: ${data.simple}, Inner: ${data.nested.inner}`,
              metadata: { estimatedTokens: 12 },
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
            build: vi.fn((data) => ({
              asString: () => `Name: ${data.name}, Tags: ${data.tags.join(', ')}`,
              metadata: { estimatedTokens: 15 },
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
            build: vi.fn(() => ({
              asString: () => '',
              metadata: { estimatedTokens: 0 },
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
      expect(content).toContain('Estimated Tokens: 0');
    });

    it('should handle very large token count', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'large-tokens',
            schema: z.object({ field: z.string() }),
            build: vi.fn(() => ({
              asString: () => 'a'.repeat(50000),
              metadata: { estimatedTokens: 15000 },
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
      expect(content).toContain('Estimated Tokens: 15000');
    });

    it('should handle empty rendered content', async () => {
      mockRegistry.getCompositions.mockReturnValue([
        {
          composition: {
            id: 'empty-render',
            schema: z.object({ field: z.string() }),
            build: vi.fn(() => ({
              asString: () => '',
              metadata: { estimatedTokens: 0 },
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
            build: vi.fn(() => ({
              asString: () => 'test content',
              metadata: { estimatedTokens: 5 },
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
            build: vi.fn(() => ({
              asString: () => 'test content',
              metadata: { estimatedTokens: 5 },
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
            build: vi.fn(() => ({
              asString: () => 'content 1',
              metadata: { estimatedTokens: 5 },
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
            build: vi.fn(() => ({
              asString: () => 'content 2',
              metadata: { estimatedTokens: 5 },
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
