/**
 * Preview generation utility.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import type { Promptise } from '@promptise/core';
import type { BuildOptions, BuildStats } from '../../types.js';
import { analyzeFixtureStatus } from '../fixture-analyzer/index.js';
import { logger } from '../logger/index.js';

/**
 * Generate preview files for compositions with fixture data.
 *
 * Creates .txt files in the output directory with:
 * - Optional metadata header (composition id, fixture name, status, fields)
 * - Rendered prompt content
 *
 * @param registry - Promptise registry instance
 * @param options - Generation options
 * @returns Build statistics with totals and warnings
 *
 * @example
 * // Generate with metadata headers (default)
 * const stats = await generatePreviews(registry, { outdir: '.promptise/builds' });
 *
 * @example
 * // Generate clean files without metadata
 * const stats = await generatePreviews(registry, {
 *   outdir: '.promptise/builds',
 *   metadata: false
 * });
 */
export async function generatePreviews(
  registry: Promptise,
  options: BuildOptions & { compositionId?: string; fixtureName?: string },
): Promise<BuildStats> {
  const { outdir, compositionId, fixtureName, verbose, metadata = true } = options;
  const entries = registry.getCompositions();

  // Ensure output directory exists
  const outPath = resolve(process.cwd(), outdir);
  await mkdir(outPath, { recursive: true });

  let totalBuilds = 0;
  let totalWarnings = 0;

  for (const entry of entries) {
    const { composition, fixtures } = entry;

    // Filter by composition ID if specified
    if (compositionId && composition.id !== compositionId) {
      continue;
    }

    const fixtureData = fixtures ?? {};

    // If no fixtures provided, generate a placeholder preview with empty data
    // This allows users to see the composition structure even without fixtures
    const fixturesToProcess =
      Object.keys(fixtureData).length === 0 ? { placeholder: {} } : fixtureData;

    for (const [name, data] of Object.entries(fixturesToProcess)) {
      // Filter by fixture name if specified
      if (fixtureName && name !== fixtureName) {
        continue;
      }

      // Analyze fixture completeness
      const analysis = analyzeFixtureStatus(composition.schema, data);

      // Log warnings for incomplete fixtures
      if (analysis.status === 'partial') {
        logger.warn(
          `⚠️  ${composition.id}/${name}: Partial fixture - Missing: ${analysis.missing.join(', ')}`,
        );
        totalWarnings++;
      } else if (analysis.status === 'placeholder') {
        logger.warn(`⚠️  ${composition.id}/${name}: Placeholder - No required fields provided`);
        totalWarnings++;
      }

      try {
        // Build the prompt with fixture data
        const prompt = composition.build(data);
        const rendered = prompt.asString();

        let content = rendered;

        // Add metadata header if enabled
        if (metadata) {
          // Generate field-by-field list
          const fieldsList: string[] = [];

          // Add required fields
          for (const field of analysis.requiredFields) {
            const isProvided = analysis.provided.includes(field);
            const symbol = isProvided ? '✓' : '✗';
            const statusText = isProvided ? '' : ' → placeholder';
            fieldsList.push(`  ${symbol} ${field} (required)${statusText}`);
          }

          // Add optional fields
          for (const field of analysis.optionalFields) {
            const isProvided = field in data;
            const symbol = isProvided ? '✓' : '○';
            const statusText = isProvided ? '' : ' → not provided';
            fieldsList.push(`  ${symbol} ${field} (optional)${statusText}`);
          }

          const header = [
            '---',
            `Composition ID: ${composition.id}`,
            `Fixture: ${name} (${analysis.statusLabel})`,
            ...(fieldsList.length > 0 ? ['Schema Fields:', ...fieldsList] : []),
            `Tokens: ${prompt.metadata.tokenCount}`,
            '---',
            '',
          ].join('\n');

          content = header + rendered;
        }

        // Write preview file
        const filename = `${composition.id}_${name}.txt`;
        const filepath = join(outPath, filename);
        await writeFile(filepath, content, 'utf-8');

        if (verbose) {
          logger.success(`✓ Generated: ${filename}`);
        }

        totalBuilds++;
      } catch (error) {
        logger.error(`Failed to generate preview for ${composition.id}/${name}`, error);
        // Continue with other fixtures even if one fails
      }
    }
  }

  return { totalBuilds, totalWarnings };
}
