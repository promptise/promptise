/**
 * Build command implementation.
 */

import path from 'node:path';
import type { BuildOptions } from '../types.js';
import { loadConfig } from '../utils/config-loader/index.js';
import { generatePreviews } from '../utils/preview-generator/index.js';
import { logger } from '../utils/logger/index.js';

/**
 * Execute the build command.
 *
 * Loads the Promptise config and generates preview files for all compositions.
 *
 * @param compositionId - Optional specific composition ID to build
 * @param options - Build options
 *
 * @example
 * // Build all compositions
 * await buildCommand(undefined, { outdir: '.promptise/builds' });
 *
 * @example
 * // Build specific composition
 * await buildCommand('medical-diagnosis', { outdir: './docs/prompts' });
 */
export async function buildCommand(
  compositionId?: string,
  options: BuildOptions = { outdir: '.promptise/builds' },
): Promise<void> {
  try {
    logger.banner();

    // Load config
    if (options.verbose) {
      logger.info(`Loading config from ${options.config ?? 'promptise.config.ts'}...`);
    }

    const registry = await loadConfig(options.config);

    if (options.verbose) {
      logger.success('✓ Config loaded\n');
    }

    // Generate previews
    logger.info('Building previews...');

    const stats = await generatePreviews(registry, {
      ...options,
      compositionId,
      fixtureName: options.fixture,
    });

    // Report results
    logger.info('');
    if (stats.totalBuilds === 0) {
      logger.warn('No previews generated. Check your fixtures configuration.');
      return;
    }

    // Calculate display path relative to initial working directory
    const resolvedOutdir = path.resolve(options.outdir);
    const initCwd = process.env['INIT_CWD'] ?? process.cwd();
    const displayPath = path.relative(initCwd, resolvedOutdir);

    logger.success(
      `✓ Generated ${stats.totalBuilds} preview${stats.totalBuilds === 1 ? '' : 's'} in ${displayPath}`,
    );

    if (stats.totalWarnings > 0) {
      logger.warn(
        `\n⚠️  ${stats.totalWarnings} file${stats.totalWarnings === 1 ? '' : 's'} with incomplete fixtures - review before using`,
      );
    }

    logger.info('');
  } catch (error) {
    logger.error('\nBuild failed:', error);
    process.exit(1);
  }
}
