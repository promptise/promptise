import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig } from './config-loader';

async function createTempConfig(contents: string): Promise<{ dir: string; file: string }> {
  const dir = await mkdtemp(join(tmpdir(), 'promptise-cli-config-'));
  const file = join(dir, 'promptise.config.mjs');
  await writeFile(file, contents, 'utf-8');
  return { dir, file };
}

describe('loadConfig', () => {
  it('should throw error when config file does not exist', async () => {
    const missingPath = join(tmpdir(), `promptise-missing-${Date.now()}.mjs`);

    await expect(loadConfig(missingPath)).rejects.toThrow('Config file not found');
    await expect(loadConfig(missingPath)).rejects.toThrow('Create a promptise.config.ts');
  });

  it('should load config when module exports default with getCompositions', async () => {
    const { dir, file } = await createTempConfig(
      'export default { getCompositions() { return []; } };',
    );

    try {
      const config = await loadConfig(file);
      expect(typeof config.getCompositions).toBe('function');
      expect(config.getCompositions()).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('should load default promptise.config.ts path when configPath is omitted', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'promptise-cli-default-config-'));
    const file = join(dir, 'promptise.config.ts');
    const originalCwd = process.cwd();

    await writeFile(file, 'export default { getCompositions() { return []; } };', 'utf-8');

    try {
      process.chdir(dir);
      const config = await loadConfig();
      expect(typeof config.getCompositions).toBe('function');
    } finally {
      process.chdir(originalCwd);
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('should wrap error when default export is missing', async () => {
    const { dir, file } = await createTempConfig('export const value = 1;');

    try {
      await expect(loadConfig(file)).rejects.toThrow('Failed to load config file');
      await expect(loadConfig(file)).rejects.toThrow('Default export must have a value');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('should wrap error when default export is not a Promptise instance', async () => {
    const { dir, file } = await createTempConfig('export default { value: 1 };');

    try {
      await expect(loadConfig(file)).rejects.toThrow('Failed to load config file');
      await expect(loadConfig(file)).rejects.toThrow('Default export must be a Promptise instance');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('should rethrow errors that already include "Config file"', async () => {
    const { dir, file } = await createTempConfig('throw new Error("Config file exploded");');

    try {
      await expect(loadConfig(file)).rejects.toThrow('Config file exploded');
      await expect(loadConfig(file)).rejects.not.toThrow('Failed to load config file');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('should wrap runtime module errors that are Error instances', async () => {
    const { dir, file } = await createTempConfig('throw new Error("runtime exploded");');

    try {
      await expect(loadConfig(file)).rejects.toThrow('Failed to load config file');
      await expect(loadConfig(file)).rejects.toThrow('Error: runtime exploded');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('should wrap runtime module errors that are not Error instances', async () => {
    const { dir, file } = await createTempConfig("throw 'runtime-string-error';");

    try {
      await expect(loadConfig(file)).rejects.toThrow('Failed to load config file');
      await expect(loadConfig(file)).rejects.toThrow('Error: runtime-string-error');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
