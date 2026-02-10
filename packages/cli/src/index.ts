#!/usr/bin/env node

/**
 * Promptise CLI - Entry point
 *
 * CLI for generating preview prompts from Promptise compositions.
 */

import { program } from 'commander';
import { buildCommand } from './commands/build.js';
import type { BuildOptions } from './types.js';

program
  .name('promptise')
  .description('CLI for generating preview prompts from Promptise compositions')
  .version('1.0.0');

// Build command
program
  .command('build [compositionId]')
  .description('Generate preview files for compositions')
  .option('-f, --fixture <name>', 'Use specific fixture name')
  .option('-o, --outdir <path>', 'Output directory', '.promptise/builds')
  .option('-c, --config <path>', 'Path to config file', 'promptise.config.ts')
  .option('--no-metadata', 'Generate clean files without metadata headers')
  .option('-v, --verbose', 'Enable verbose logging')
  .action(async (compositionId: string | undefined, options: BuildOptions) => {
    await buildCommand(compositionId, options);
  });

program.parse();
