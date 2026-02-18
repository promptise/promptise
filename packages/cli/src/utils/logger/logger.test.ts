import { logger } from './logger';
import type { MockInstance } from 'vitest';

describe('logger', () => {
  let consoleLogSpy: MockInstance;
  let consoleErrorSpy: MockInstance;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('info', () => {
    it('should log info message', () => {
      logger.info('Test message');

      expect(consoleLogSpy).toHaveBeenCalledWith('Test message');
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('banner', () => {
    it('should log banner with ASCII art in bold cyan', () => {
      logger.banner();

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('═══');
      expect(loggedMessage).toContain('█▀█');
    });
  });

  describe('title', () => {
    it('should log title message in bold cyan', () => {
      logger.title('Test Title');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('Test Title');
    });
  });

  describe('separator', () => {
    it('should log separator line', () => {
      logger.separator();

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('═══');
    });
  });

  describe('step', () => {
    it('should log step message with arrow prefix', () => {
      logger.step('Generating previews');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('Generating previews');
      expect(loggedMessage).toContain('→');
    });
  });

  describe('detail', () => {
    it('should log indented detail message', () => {
      logger.detail('Output: .promptise/builds');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('Output: .promptise/builds');
    });
  });

  describe('blank', () => {
    it('should log a blank line', () => {
      logger.blank();

      expect(consoleLogSpy).toHaveBeenCalledWith('');
      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('success', () => {
    it('should log success message in green', () => {
      logger.success('Success!');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('Success!');
    });
  });

  describe('warn', () => {
    it('should log warning message in yellow', () => {
      logger.warn('Warning!');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('Warning!');
    });
  });

  describe('warnDetail', () => {
    it('should log indented warning detail message in yellow', () => {
      logger.warnDetail('partial fixture (missing: rules)');

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('⚠ partial fixture (missing: rules)');
    });
  });

  describe('error', () => {
    it('should log error message in red', () => {
      logger.error('Error occurred');

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const errorMessage = consoleErrorSpy.mock.calls[0][0];
      expect(errorMessage).toContain('Error occurred');
    });

    it('should log error with Error object', () => {
      const error = new Error('Test error');
      logger.error('Something failed', error);

      // message + error.message + error.stack (if exists)
      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Something failed');
      expect(consoleErrorSpy.mock.calls[1][0]).toContain('Test error');
    });

    it('should log error with stack trace', () => {
      const error = new Error('Test error with stack');
      error.stack = 'Error: Test error with stack\n    at Object.<anonymous>';

      logger.error('Stack trace test', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Stack trace test');
      expect(consoleErrorSpy.mock.calls[1][0]).toContain('Test error with stack');
      expect(consoleErrorSpy.mock.calls[2][0]).toContain('Object.<anonymous>');
    });

    it('should handle error without stack trace', () => {
      const error = new Error('No stack');
      delete error.stack;

      logger.error('No stack test', error);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('No stack test');
      expect(consoleErrorSpy.mock.calls[1][0]).toContain('No stack');
    });
  });
});
