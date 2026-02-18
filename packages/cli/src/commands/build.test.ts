import { buildCommand } from './build';
import { loadConfig } from '../utils/config-loader/index.js';
import { generatePreviews } from '../utils/preview-generator/index.js';
import { logger } from '../utils/logger/index.js';
import type { Promptise } from '@promptise/core';
import type { Mocked, MockedFunction, MockInstance } from 'vitest';

vi.mock('../utils/config-loader/index.js');
vi.mock('../utils/preview-generator/index.js');
vi.mock('../utils/logger/index.js');

const mockLoadConfig = loadConfig as MockedFunction<typeof loadConfig>;
const mockGeneratePreviews = generatePreviews as MockedFunction<typeof generatePreviews>;
const mockLogger = logger as Mocked<typeof logger>;

describe('buildCommand', () => {
  let mockRegistry: Promptise;
  let processExitSpy: MockInstance;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRegistry = {
      getCompositions: vi.fn().mockReturnValue([]),
    } as unknown as Promptise;

    mockLoadConfig.mockResolvedValue(mockRegistry);
    mockGeneratePreviews.mockResolvedValue({ totalBuilds: 5, totalWarnings: 0 });

    // Mock process.exit
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code?: number) => {
      throw new Error(`process.exit: ${code}`);
    });
  });

  afterEach(() => {
    processExitSpy.mockRestore();
  });

  describe('basic functionality', () => {
    it('should load config and generate previews', async () => {
      await buildCommand();

      expect(mockLoadConfig).toHaveBeenCalledWith(undefined);
      expect(mockGeneratePreviews).toHaveBeenCalledWith(mockRegistry, {
        outdir: '.promptise/builds',
        compositionId: undefined,
        fixtureName: undefined,
      });
    });

    it('should use custom output directory', async () => {
      await buildCommand(undefined, { outdir: './custom/output' });

      expect(mockGeneratePreviews).toHaveBeenCalledWith(mockRegistry, {
        outdir: './custom/output',
        compositionId: undefined,
        fixtureName: undefined,
      });
    });

    it('should filter by composition ID', async () => {
      await buildCommand('test-composition', { outdir: '.promptise/builds' });

      expect(mockGeneratePreviews).toHaveBeenCalledWith(mockRegistry, {
        outdir: '.promptise/builds',
        compositionId: 'test-composition',
        fixtureName: undefined,
      });
    });

    it('should filter by fixture name', async () => {
      await buildCommand(undefined, { outdir: '.promptise/builds', fixture: 'test-fixture' });

      expect(mockGeneratePreviews).toHaveBeenCalledWith(mockRegistry, {
        outdir: '.promptise/builds',
        fixture: 'test-fixture',
        compositionId: undefined,
        fixtureName: 'test-fixture',
      });
    });
  });

  describe('logging', () => {
    it('should log config loading by default', async () => {
      await buildCommand(undefined, { outdir: '.promptise/builds' });

      expect(mockLogger.step).toHaveBeenCalledWith('Loading config');
      expect(mockLogger.success).toHaveBeenCalledWith(
        expect.stringContaining('Config loaded from promptise.config.ts'),
      );
    });

    it('should show custom config path in success message', async () => {
      await buildCommand(undefined, {
        outdir: '.promptise/builds',
        config: 'custom.config.ts',
      });

      expect(mockLogger.success).toHaveBeenCalledWith(
        expect.stringContaining('Config loaded from custom.config.ts'),
      );
    });
  });

  describe('success reporting', () => {
    it('should report successful build with correct count', async () => {
      mockGeneratePreviews.mockResolvedValue({ totalBuilds: 5, totalWarnings: 0 });

      await buildCommand();

      expect(mockLogger.success).toHaveBeenCalledWith(
        expect.stringContaining('Generated 5 previews'),
      );
    });

    it('should use singular form for single preview', async () => {
      mockGeneratePreviews.mockResolvedValue({ totalBuilds: 1, totalWarnings: 0 });

      await buildCommand();

      expect(mockLogger.success).toHaveBeenCalledWith(expect.stringContaining('1 preview'));
      expect(mockLogger.success).toHaveBeenCalledWith(expect.not.stringContaining('previews'));
    });

    it('should include output directory in success message', async () => {
      await buildCommand(undefined, { outdir: './custom/path' });

      expect(mockLogger.success).toHaveBeenCalledWith(expect.stringContaining('custom/path'));
    });

    it('should display dot when output path resolves to init cwd', async () => {
      const originalInitCwd = process.env.INIT_CWD;
      process.env.INIT_CWD = process.cwd();

      try {
        await buildCommand(undefined, { outdir: '.' });
      } finally {
        process.env.INIT_CWD = originalInitCwd;
      }

      expect(mockLogger.success).toHaveBeenCalledWith(expect.stringContaining(' in .'));
    });

    it('should fallback to process cwd when INIT_CWD is undefined', async () => {
      const originalInitCwd = process.env.INIT_CWD;
      delete process.env.INIT_CWD;

      try {
        await buildCommand(undefined, { outdir: './custom/path' });
      } finally {
        process.env.INIT_CWD = originalInitCwd;
      }

      expect(mockLogger.success).toHaveBeenCalledWith(expect.stringContaining('custom/path'));
    });
  });

  describe('warnings', () => {
    it('should report warnings for incomplete fixtures', async () => {
      mockGeneratePreviews.mockResolvedValue({ totalBuilds: 5, totalWarnings: 2 });

      await buildCommand();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('2 files with incomplete fixtures'),
      );
    });

    it('should use singular form for single warning', async () => {
      mockGeneratePreviews.mockResolvedValue({ totalBuilds: 3, totalWarnings: 1 });

      await buildCommand();

      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('1 file'));
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.not.stringContaining('files'));
    });

    it('should not show warning message when no warnings', async () => {
      mockGeneratePreviews.mockResolvedValue({ totalBuilds: 5, totalWarnings: 0 });

      await buildCommand();

      expect(mockLogger.warn).not.toHaveBeenCalledWith(
        expect.stringContaining('incomplete fixtures'),
      );
    });

    it('should warn when no previews generated', async () => {
      mockGeneratePreviews.mockResolvedValue({ totalBuilds: 0, totalWarnings: 0 });

      await buildCommand();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No previews generated'),
      );
      expect(mockLogger.success).not.toHaveBeenCalledWith(expect.stringContaining('Generated'));
    });
  });

  describe('error handling', () => {
    it('should handle config loading errors', async () => {
      const configError = new Error('Config not found');
      mockLoadConfig.mockRejectedValue(configError);

      await expect(buildCommand()).rejects.toThrow('process.exit: 1');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Build failed'),
        configError,
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle preview generation errors', async () => {
      const generationError = new Error('Failed to write file');
      mockGeneratePreviews.mockRejectedValue(generationError);

      await expect(buildCommand()).rejects.toThrow('process.exit: 1');

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Build failed'),
        generationError,
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should exit with code 1 on any error', async () => {
      mockLoadConfig.mockRejectedValue(new Error('Any error'));

      await expect(buildCommand()).rejects.toThrow('process.exit: 1');

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('options passing', () => {
    it('should pass all options to generatePreviews', async () => {
      await buildCommand('comp-id', {
        outdir: './output',
        fixture: 'fixture-name',
        metadata: false,
        clean: false,
        config: 'custom.config.ts',
      });

      expect(mockGeneratePreviews).toHaveBeenCalledWith(mockRegistry, {
        outdir: './output',
        fixture: 'fixture-name',
        metadata: false,
        clean: false,
        config: 'custom.config.ts',
        compositionId: 'comp-id',
        fixtureName: 'fixture-name',
      });
    });

    it('should use default outdir when not provided', async () => {
      await buildCommand();

      expect(mockGeneratePreviews).toHaveBeenCalledWith(
        mockRegistry,
        expect.objectContaining({
          outdir: '.promptise/builds',
        }),
      );
    });

    it('should load custom config file', async () => {
      await buildCommand(undefined, {
        outdir: '.promptise/builds',
        config: 'apps/web/promptise.config.ts',
      });

      expect(mockLoadConfig).toHaveBeenCalledWith('apps/web/promptise.config.ts');
    });
  });

  describe('edge cases - non-existent resources', () => {
    it('should generate 0 builds when compositionId does not exist', async () => {
      mockGeneratePreviews.mockResolvedValue({ totalBuilds: 0, totalWarnings: 0 });

      await buildCommand('non-existent-comp', { outdir: '.promptise/builds' });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No previews generated'),
      );
    });

    it('should generate 0 builds when fixture does not exist', async () => {
      mockGeneratePreviews.mockResolvedValue({ totalBuilds: 0, totalWarnings: 0 });

      await buildCommand(undefined, {
        outdir: '.promptise/builds',
        fixture: 'non-existent-fixture',
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('No previews generated'),
      );
    });
  });

  describe('edge cases - multiple compositions', () => {
    it('should process multiple compositions successfully', async () => {
      mockGeneratePreviews.mockResolvedValue({ totalBuilds: 10, totalWarnings: 2 });

      await buildCommand(undefined, { outdir: '.promptise/builds' });

      expect(mockLogger.success).toHaveBeenCalledWith(expect.stringContaining('10 previews'));
      expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('2 files'));
    });
  });

  describe('edge cases - special paths', () => {
    it('should handle outdir with spaces', async () => {
      await buildCommand(undefined, { outdir: './output dir/with spaces' });

      expect(mockGeneratePreviews).toHaveBeenCalledWith(
        mockRegistry,
        expect.objectContaining({
          outdir: './output dir/with spaces',
        }),
      );
    });

    it('should handle outdir with special characters', async () => {
      await buildCommand(undefined, { outdir: './output-dir_@special!' });

      expect(mockGeneratePreviews).toHaveBeenCalledWith(
        mockRegistry,
        expect.objectContaining({
          outdir: './output-dir_@special!',
        }),
      );
    });
  });
});
