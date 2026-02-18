/**
 * CLI logging utility.
 */

import chalk from 'chalk';

const SEPARATOR = '═══════════════════════════════════════════════════';

const BANNER = `
${SEPARATOR}

  █▀█ █▀█ █▀█ █▀▄▀█ █▀█ ▀█▀ █ █▀ █▀▀   █▀▀ █   █
  █▀▀ █▀▄ █▄█ █ ▀ █ █▀▀  █  █ ▄█ ██▄   █▄▄ █▄▄ █
`;

/**
 * CLI logger with colored output.
 */
export const logger = {
  /**
   * Log banner with styled ASCII art.
   */
  banner(): void {
    console.log(chalk.bold.cyan(BANNER));
  },

  /**
   * Log title message with bold cyan color.
   */
  title(message: string): void {
    console.log(chalk.bold.cyan(message));
  },

  /**
   * Log cyan separator line.
   */
  separator(): void {
    console.log(chalk.bold.cyan(SEPARATOR));
  },

  /**
   * Log step message with cyan arrow prefix.
   */
  step(message: string): void {
    console.log(chalk.bold.cyan(`→ ${message}`));
  },

  /**
   * Log indented detail message.
   */
  detail(message: string): void {
    console.log(chalk.gray(`  ${message}`));
  },

  /**
   * Log a blank line.
   */
  blank(): void {
    console.log('');
  },

  /**
   * Log info message.
   */
  info(message: string): void {
    console.log(message);
  },

  /**
   * Log success message (green).
   */
  success(message: string): void {
    console.log(chalk.green(`✓ ${message}`));
  },

  /**
   * Log warning message (yellow).
   */
  warn(message: string): void {
    console.log(chalk.yellow(`⚠ ${message}`));
  },

  /**
   * Log indented warning message (yellow).
   */
  warnDetail(message: string): void {
    console.log(chalk.yellow(`     ⚠ ${message}`));
  },

  /**
   * Log error message (red).
   */
  error(message: string, error?: unknown): void {
    console.error(chalk.red(`✖ ${message}`));
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
      if (error.stack) {
        console.error(chalk.gray(error.stack));
      }
    }
  },
};
