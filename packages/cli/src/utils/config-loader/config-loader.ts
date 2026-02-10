/**
 * Configuration loader utility.
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Promptise } from '@promptise/core';

/**
 * Load the Promptise config from a TypeScript config file.
 *
 * @param configPath - Path to config file (relative to cwd or absolute)
 * @returns Promptise registry instance
 * @throws Error when config file is not found or invalid
 *
 * @example
 * // Load default config
 * const registry = await loadConfig();
 *
 * @example
 * // Load custom config
 * const registry = await loadConfig('apps/web/promptise.config.ts');
 */
export async function loadConfig(configPath?: string): Promise<Promptise> {
  const finalPath = resolve(process.cwd(), configPath ?? 'promptise.config.ts');

  if (!existsSync(finalPath)) {
    throw new Error(
      `Config file not found: ${finalPath}\n` +
        'Create a promptise.config.ts file or specify a custom path with --config.',
    );
  }

  try {
    const configUrl = pathToFileURL(finalPath).href;
    const module = (await import(configUrl)) as { default?: Promptise };

    if (!module.default) {
      throw new Error(
        'Default export must have a value.\n' + 'Example: export default new Promptise({ ... })',
      );
    }

    if (typeof module.default.getCompositions !== 'function') {
      throw new Error(
        'Default export must be a Promptise instance.\n' +
          'Example: export default new Promptise({ ... })',
      );
    }

    return module.default;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Config file')) {
      throw error;
    }
    throw new Error(
      `Failed to load config file: ${finalPath}\n` +
        `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
