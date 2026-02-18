/**
 * Preview generation utility.
 */

import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import type { CostConfig, Promptise } from '@promptise/core';
import type { BuildOptions, BuildStats } from '../../types.js';
import { analyzeFixtureStatus } from '../fixture-analyzer/index.js';
import { logger } from '../logger/index.js';

interface ZodFieldLike {
  safeParse?: (value: unknown) => { success: boolean };
  isOptional?: () => boolean;
  shape?: Record<string, ZodFieldLike>;
  options?: unknown[];
  value?: unknown;
}

interface ZodObjectLike {
  shape: Record<string, ZodFieldLike>;
}

interface BuildTarget {
  composition: {
    id: string;
    schema: Parameters<typeof analyzeFixtureStatus>[0];
    build: (data: Record<string, unknown>) => {
      asString: () => string;
      metadata: { estimatedTokens: number };
    };
  };
  name: string;
  data: Record<string, unknown>;
  cost?: CostConfig;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasPlaceholder(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.includes('{{') && value.includes('}}');
  }

  if (Array.isArray(value)) {
    return value.some((item) => hasPlaceholder(item));
  }

  if (isRecord(value)) {
    return Object.values(value).some((item) => hasPlaceholder(item));
  }

  return false;
}

function tryCandidate(schema: ZodFieldLike | undefined, value: unknown): boolean {
  if (!schema?.safeParse) {
    return false;
  }
  return schema.safeParse(value).success;
}

function buildObjectPlaceholder(
  fieldName: string,
  schema: ZodFieldLike | undefined,
  depth = 0,
): Record<string, unknown> {
  if (!schema?.shape || depth > 3) {
    return { [fieldName]: `{{${fieldName}}}` };
  }

  const nested: Record<string, unknown> = {};
  for (const [key, childSchema] of Object.entries(schema.shape) as [
    string,
    ZodFieldLike | undefined,
  ][]) {
    if (childSchema?.isOptional?.()) {
      continue;
    }

    nested[key] = resolvePlaceholderValue(`${fieldName}.${key}`, childSchema, depth + 1);
  }

  return nested;
}

function resolvePlaceholderValue(
  fieldName: string,
  schema: ZodFieldLike | undefined,
  depth = 0,
): unknown {
  const textPlaceholder = `{{${fieldName}}}`;
  const candidates: unknown[] = [];

  if (Array.isArray(schema?.options) && schema.options.length > 0) {
    candidates.push(schema.options[0]);
  }

  if (schema && 'value' in schema) {
    candidates.push(schema.value);
  }

  candidates.push(textPlaceholder);
  candidates.push([textPlaceholder]);
  candidates.push(buildObjectPlaceholder(fieldName, schema, depth + 1));
  candidates.push([]);
  candidates.push(0);
  candidates.push(false);
  candidates.push(null);
  candidates.push({});

  for (const candidate of candidates) {
    if (tryCandidate(schema, candidate)) {
      return candidate;
    }
  }

  return textPlaceholder;
}

function buildStaticObject(schema: ZodFieldLike | undefined, depth = 0): Record<string, unknown> {
  if (!schema?.shape || depth > 3) {
    return {};
  }

  const nested: Record<string, unknown> = {};
  for (const [key, childSchema] of Object.entries(schema.shape) as [
    string,
    ZodFieldLike | undefined,
  ][]) {
    if (childSchema?.isOptional?.()) {
      continue;
    }

    nested[key] = resolveStaticValue(childSchema, depth + 1);
  }

  return nested;
}

function resolveStaticValue(schema: ZodFieldLike | undefined, depth = 0): unknown {
  const candidates: unknown[] = [];

  if (Array.isArray(schema?.options) && schema.options.length > 0) {
    candidates.push(schema.options[0]);
  }

  if (schema && 'value' in schema) {
    candidates.push(schema.value);
  }

  candidates.push('');
  candidates.push([]);
  candidates.push(buildStaticObject(schema, depth + 1));
  candidates.push(0);
  candidates.push(false);
  candidates.push(null);
  candidates.push({});

  for (const candidate of candidates) {
    if (tryCandidate(schema, candidate)) {
      return candidate;
    }
  }

  return '';
}

function buildStaticData(
  schema: ZodObjectLike,
  sourceData: Record<string, unknown>,
): Record<string, unknown> {
  const staticData: Record<string, unknown> = {};

  for (const key of Object.keys(sourceData)) {
    staticData[key] = resolveStaticValue(schema.shape[key]);
  }

  return staticData;
}

function formatTokenCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatUsd(value: number): string {
  return `$${value.toFixed(6)}`;
}

function formatInputPricingLine(inputTokenPrice: number): string {
  const perMillion = inputTokenPrice * 1_000_000;
  return `Input Pricing: $${perMillion.toFixed(2)} / 1M tokens ($${inputTokenPrice.toFixed(6)}/token)`;
}

function applyMissingPlaceholders(
  schema: ZodObjectLike,
  data: Record<string, unknown>,
  missingFields: string[],
): Record<string, unknown> {
  const nextData: Record<string, unknown> = { ...data };

  for (const field of missingFields) {
    const fieldSchema = schema.shape[field];
    nextData[field] = resolvePlaceholderValue(field, fieldSchema);
  }

  return nextData;
}

function formatFallbackPreview(
  data: Record<string, unknown>,
  options: { includeError?: string },
): string {
  const lines = ['[Promptise] Preview generated with placeholder fallback.'];

  if (options.includeError) {
    lines.push(`Reason: ${options.includeError}`);
  }

  const placeholderEntries = Object.entries(data).filter(([, value]) => hasPlaceholder(value));
  if (placeholderEntries.length > 0) {
    lines.push('Placeholders:');
    for (const [key, value] of placeholderEntries) {
      lines.push(`- ${key}: ${JSON.stringify(value)}`);
    }
  }

  return lines.join('\n');
}

function resolveFixturesToProcess(
  fixtures: Record<string, Record<string, unknown>> | undefined,
): Record<string, Record<string, unknown>> {
  const fixtureData = fixtures ?? {};
  return Object.keys(fixtureData).length === 0 ? { placeholder: {} } : fixtureData;
}

async function cleanupStalePreviews(
  outPath: string,
  targetCompositionIds: Set<string>,
  expectedFilenames: Set<string>,
): Promise<number> {
  if (targetCompositionIds.size === 0) {
    return 0;
  }

  const files = await readdir(outPath, { withFileTypes: true });
  const staleFiles: string[] = [];

  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith('.txt')) {
      continue;
    }

    const belongsToTargetComposition = Array.from(targetCompositionIds).some((compositionId) =>
      file.name.startsWith(`${compositionId}_`),
    );

    if (!belongsToTargetComposition || expectedFilenames.has(file.name)) {
      continue;
    }

    staleFiles.push(file.name);
  }

  await Promise.all(staleFiles.map(async (filename) => unlink(join(outPath, filename))));

  if (staleFiles.length > 0) {
    logger.info(
      `Removed ${staleFiles.length} stale preview${staleFiles.length === 1 ? '' : 's'} before build`,
    );
  }

  return staleFiles.length;
}

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
  const { outdir, compositionId, fixtureName, metadata = true, clean = true } = options;
  const entries = registry.getCompositions();

  // Ensure output directory exists
  const outPath = resolve(process.cwd(), outdir);
  await mkdir(outPath, { recursive: true });

  const buildTargets: BuildTarget[] = [];
  const targetCompositionIds = new Set<string>();

  for (const entry of entries) {
    const { composition } = entry;

    if (compositionId && composition.id !== compositionId) {
      continue;
    }

    targetCompositionIds.add(composition.id);

    const fixturesToProcess = resolveFixturesToProcess(entry.fixtures);

    for (const [name, data] of Object.entries(fixturesToProcess)) {
      if (fixtureName && name !== fixtureName) {
        continue;
      }

      buildTargets.push({
        composition: composition as BuildTarget['composition'],
        name,
        data,
        cost: entry.cost,
      });
    }
  }

  // Stale cleanup is only safe on full fixture builds.
  if (clean && !fixtureName) {
    const expectedFilenames = new Set(
      buildTargets.map((target) => `${target.composition.id}_${target.name}.txt`),
    );
    await cleanupStalePreviews(outPath, targetCompositionIds, expectedFilenames);
  }

  let totalBuilds = 0;
  let totalWarnings = 0;

  for (const target of buildTargets) {
    const { composition, name, data, cost } = target;

    // Analyze fixture completeness
    const analysis = analyzeFixtureStatus(composition.schema, data);

    // Capture warning info for incomplete fixtures (logged after file generation).
    let fixtureWarningMessage: string | undefined;
    if (analysis.status === 'partial') {
      fixtureWarningMessage = `partial fixture (missing: ${analysis.missing.join(', ')})`;
      totalWarnings++;
    } else if (analysis.status === 'placeholder') {
      fixtureWarningMessage = 'placeholder fixture (no inputs provided)';
      totalWarnings++;
    }

    const sourceData = data;
    const dataWithPlaceholders =
      analysis.status === 'complete'
        ? sourceData
        : applyMissingPlaceholders(
            composition.schema as unknown as ZodObjectLike,
            sourceData,
            analysis.missing,
          );

    let rendered = '';
    let estimatedTokens: number | undefined;
    let staticEstimatedTokens = 0;
    let dynamicEstimatedTokens = 0;
    let buildErrorMessage: string | undefined;

    try {
      const prompt = composition.build(dataWithPlaceholders);
      rendered = prompt.asString();
      estimatedTokens =
        analysis.status === 'complete' ? prompt.metadata.estimatedTokens : undefined;

      if (analysis.status === 'complete' && estimatedTokens !== undefined) {
        try {
          const staticData = buildStaticData(
            composition.schema as unknown as ZodObjectLike,
            sourceData,
          );
          const staticPrompt = composition.build(staticData);
          staticEstimatedTokens = Math.min(staticPrompt.metadata.estimatedTokens, estimatedTokens);
          dynamicEstimatedTokens = estimatedTokens - staticEstimatedTokens;
        } catch {
          staticEstimatedTokens = 0;
          dynamicEstimatedTokens = estimatedTokens;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      buildErrorMessage = message;

      if (analysis.status === 'complete') {
        logger.error(`Failed to generate preview for ${composition.id}/${name}`, error);
      } else {
        logger.warn(
          `${composition.id}/${name}: using fallback preview due to placeholder rendering constraints`,
        );
      }
    }

    if (!rendered) {
      rendered = formatFallbackPreview(dataWithPlaceholders, { includeError: buildErrorMessage });
    }

    let content = rendered;

    // Add metadata header if enabled
    if (metadata) {
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
        const isProvided = field in sourceData;
        const symbol = isProvided ? '✓' : '○';
        const statusText = isProvided ? '' : ' → not provided';
        fieldsList.push(`  ${symbol} ${field} (optional)${statusText}`);
      }

      const header = [
        '---',
        `Composition ID: ${composition.id}`,
        `Fixture: ${name} (${analysis.statusLabel})`,
        ...(fieldsList.length > 0 ? ['Schema Fields:', ...fieldsList] : []),
        ...(analysis.status === 'complete' && estimatedTokens !== undefined
          ? cost
            ? [
                '',
                'Estimated Input Cost:',
                `  ${formatInputPricingLine(cost.inputTokenPrice)}`,
                `  Static: ${formatTokenCount(staticEstimatedTokens)} tokens / ${formatUsd(staticEstimatedTokens * cost.inputTokenPrice)}`,
                `  Dynamic: ${formatTokenCount(dynamicEstimatedTokens)} tokens / ${formatUsd(dynamicEstimatedTokens * cost.inputTokenPrice)}`,
                `  Total: ${formatTokenCount(estimatedTokens)} tokens / ${formatUsd(estimatedTokens * cost.inputTokenPrice)}`,
              ]
            : [`Estimated Tokens: ${estimatedTokens}`]
          : []),
        '---',
        '',
      ].join('\n');

      content = header + rendered;
    }

    try {
      // Write preview file
      const filename = `${composition.id}_${name}.txt`;
      const filepath = join(outPath, filename);
      await writeFile(filepath, content, 'utf-8');

      logger.success(`Generated: ${filename}`);
      if (fixtureWarningMessage) {
        logger.warnDetail(fixtureWarningMessage);
      }

      totalBuilds++;
    } catch (error) {
      logger.error(`Failed to generate preview for ${composition.id}/${name}`, error);
      // Continue with other fixtures even if one fails
    }
  }

  return { totalBuilds, totalWarnings };
}
