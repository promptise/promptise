/**
 * CLI module types.
 */

/**
 * Options for the build command.
 */
export interface BuildOptions {
  /**
   * Use specific fixture name.
   */
  fixture?: string;

  /**
   * Output directory for generated previews.
   * @default '.promptise/builds'
   */
  outdir: string;

  /**
   * Path to config file.
   * @default 'promptise.config.ts'
   */
  config?: string;

  /**
   * Include metadata header in generated files.
   * @default true
   */
  metadata?: boolean;

  /**
   * Remove stale preview files before generating.
   * @default true
   */
  clean?: boolean;

  /**
   * Legacy alias accepted by CLI parser.
   * @deprecated Verbose logging is always enabled by default.
   */
  verbose?: boolean;
}

/**
 * Statistics from preview generation.
 */
export interface BuildStats {
  /**
   * Total number of preview files generated.
   */
  totalBuilds: number;

  /**
   * Total number of files with warnings (partial/placeholder).
   */
  totalWarnings: number;
}

/**
 * Status of a fixture.
 */
export type FixtureStatus = 'complete' | 'partial' | 'placeholder';

/**
 * Analysis result for a fixture.
 */
export interface FixtureAnalysis {
  /**
   * Status of the fixture.
   */
  status: FixtureStatus;

  /**
   * Human-readable status description (e.g., "complete - 4/4 required").
   */
  statusLabel: string;

  /**
   * Fields that are provided in the fixture.
   */
  provided: string[];

  /**
   * Fields that are missing from the fixture.
   */
  missing: string[];

  /**
   * All required fields in the schema.
   */
  requiredFields: string[];

  /**
   * All optional fields in the schema.
   */
  optionalFields: string[];
}
