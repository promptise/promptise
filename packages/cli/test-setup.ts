/**
 * Vitest setup - global mocks and configuration.
 * This file is outside src/ to avoid being compiled into dist/
 */

vi.mock('chalk', () => ({
  __esModule: true,
  default: {
    green: (str: string) => str,
    yellow: (str: string) => str,
    red: (str: string) => str,
    gray: (str: string) => str,
    bold: {
      cyan: (str: string) => str,
    },
  },
}));
