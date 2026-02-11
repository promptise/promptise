import { validateComponentContent, formatValidationErrors } from './composition-pattern.validator';
import { ContentValidation } from './composition-pattern.types';

describe('Strategy Validator', () => {
  describe('validateComponentContent', () => {
    it('should pass validation when no rules are configured', () => {
      const validation: ContentValidation = {};

      const text = 'Any text content here';
      const result = validateComponentContent('test-comp', 'task', text, validation);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate required keywords successfully', () => {
      const validation: ContentValidation = {
        required: ['HIPAA', 'PHI'],
      };

      const text = 'This component discusses HIPAA compliance and PHI protection.';
      const result = validateComponentContent('test-component', 'rules', text, validation);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when required keywords are missing', () => {
      const validation: ContentValidation = {
        required: ['HIPAA', 'PHI', 'confidential'],
      };

      const text = 'This component discusses HIPAA compliance.';
      const result = validateComponentContent('test-component', 'rules', text, validation);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].type).toBe('error');
      expect(result.errors[0].message).toContain('PHI');
      expect(result.errors[1].message).toContain('confidential');
    });

    it('should be case-insensitive for required keywords', () => {
      const validation: ContentValidation = {
        required: ['HIPAA', 'phi'],
      };

      const text = 'This discusses hipaa and PHI.';
      const result = validateComponentContent('test-component', 'rules', text, validation);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should warn about missing optional keywords', () => {
      const validation: ContentValidation = {
        optional: ['FDA', 'HL7'],
      };

      const text = 'This component discusses FDA regulations.';
      const result = validateComponentContent('test-component', 'rules', text, validation);

      expect(result.valid).toBe(true); // Warnings don't fail validation
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('warning');
      expect(result.errors[0].message).toContain('HL7');
    });

    it('should detect forbidden keywords', () => {
      const validation: ContentValidation = {
        forbidden: ['diagnose', 'prescribe', 'cure'],
      };

      const text = 'This component will diagnose the patient condition.';
      const result = validateComponentContent('test-component', 'rules', text, validation);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('error');
      expect(result.errors[0].message).toContain('diagnose');
    });

    it('should be case-insensitive for forbidden keywords', () => {
      const validation: ContentValidation = {
        forbidden: ['diagnose'],
      };

      const text = 'This will DIAGNOSE the issue.';
      const result = validateComponentContent('test-component', 'rules', text, validation);

      expect(result.valid).toBe(false);
    });

    it('should validate max tokens', () => {
      const validation: ContentValidation = {
        maxTokens: 5,
      };

      const text = 'This is a text that will definitely exceed five tokens when encoded.';
      const result = validateComponentContent('test-component', 'role', text, validation);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Exceeds max tokens');
    });

    it('should run custom validators', () => {
      const validation: ContentValidation = {
        custom: [
          (text) => ({
            valid: text.includes('example'),
            message: 'Must include the word "example"',
          }),
          (text) => ({
            valid: text.split('\n').length >= 2,
            message: 'Must have at least 2 lines',
          }),
        ],
      };

      const text = 'This is a single line without the required word.';
      const result = validateComponentContent('test-component', 'examples', text, validation);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].message).toContain('example');
      expect(result.errors[1].message).toContain('2 lines');
    });

    it('should handle single custom validator (not array)', () => {
      const validation: ContentValidation = {
        custom: [
          (text) => ({
            valid: text.includes('test'),
            message: 'Must include "test"',
          }),
        ],
      };

      const text = 'This is a sample text.';
      const result = validateComponentContent('test-component', 'task', text, validation);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('test');
    });

    it('should handle custom validator without message', () => {
      const validation: ContentValidation = {
        custom: [
          (text) => ({
            valid: text.includes('required-word'),
            // No message provided
          }),
        ],
      };

      const text = 'This text is missing the required word.';
      const result = validateComponentContent('test-component', 'task', text, validation);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Custom validator #1 failed');
    });

    it('should pass with all validations met', () => {
      const validation: ContentValidation = {
        required: ['HIPAA', 'PHI'],
        optional: ['FDA'],
        forbidden: ['diagnose'],
        maxTokens: 100,
        custom: [
          (text) => ({
            valid: text.includes('compliance'),
            message: 'Must mention compliance',
          }),
        ],
      };

      const text = 'This component ensures HIPAA compliance and PHI protection with FDA oversight.';
      const result = validateComponentContent('test-component', 'rules', text, validation);

      expect(result.valid).toBe(true);
      expect(result.errors.filter((e) => e.type === 'error')).toHaveLength(0);
    });
  });

  describe('formatValidationErrors', () => {
    it('should format errors correctly', () => {
      const errors = [
        { type: 'error' as const, message: 'Missing required keyword "HIPAA"' },
        { type: 'error' as const, message: 'Contains forbidden keyword "diagnose"' },
      ];

      const formatted = formatValidationErrors('test-comp', 'rules', errors);

      expect(formatted).toContain('[Promptise]');
      expect(formatted).toContain('test-comp');
      expect(formatted).toContain('rules');
      expect(formatted).toContain('HIPAA');
      expect(formatted).toContain('diagnose');
      expect(formatted).toContain('Errors:');
    });

    it('should separate errors and warnings', () => {
      const errors = [
        { type: 'error' as const, message: 'Missing required keyword "HIPAA"' },
        { type: 'warning' as const, message: 'Recommended keyword "FDA" not found' },
      ];

      const formatted = formatValidationErrors('test-comp', 'rules', errors);

      expect(formatted).toContain('Errors:');
      expect(formatted).toContain('Warnings:');
      expect(formatted).toContain('HIPAA');
      expect(formatted).toContain('FDA');
    });

    it('should format warnings only when no errors', () => {
      const errors = [
        { type: 'warning' as const, message: 'Recommended keyword "FDA" not found' },
        { type: 'warning' as const, message: 'Recommended keyword "HIPAA" not found' },
      ];

      const formatted = formatValidationErrors('test-comp', 'rules', errors);

      expect(formatted).toContain('[Promptise]');
      expect(formatted).toContain('test-comp');
      expect(formatted).toContain('rules');
      expect(formatted).toContain('Warnings:');
      expect(formatted).not.toContain('Errors:');
      expect(formatted).toContain('FDA');
      expect(formatted).toContain('HIPAA');
    });
  });

  describe('Edge cases - Keywords with special characters', () => {
    it('should match keywords with hyphens', () => {
      const validation: ContentValidation = {
        required: ['HIPAA-compliant', 'FDA-approved'],
      };

      const text = 'This is HIPAA-compliant and FDA-approved.';
      const result = validateComponentContent('test-comp', 'rules', text, validation);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should match keywords with slashes', () => {
      const validation: ContentValidation = {
        required: ['PHI/PII', 'SSL/TLS'],
      };

      const text = 'We protect PHI/PII using SSL/TLS encryption.';
      const result = validateComponentContent('test-comp', 'security', text, validation);

      expect(result.valid).toBe(true);
    });

    it('should NOT match keywords as substrings of other words', () => {
      const validation: ContentValidation = {
        required: ['act'],
      };

      const text = 'We need to take action on this matter.';
      const result = validateComponentContent('test-comp', 'task', text, validation);

      // "act" should NOT match "action" - only whole word matching
      expect(result.valid).toBe(false);
    });

    it('should match whole words with word boundaries', () => {
      const validation: ContentValidation = {
        required: ['test'],
      };

      const text = 'Run the test suite.';
      const result = validateComponentContent('test-comp', 'task', text, validation);

      expect(result.valid).toBe(true);
    });
  });

  describe('Edge cases - Empty and invalid inputs', () => {
    it('should handle empty string arrays in required', () => {
      const validation: ContentValidation = {
        required: [],
      };

      const text = 'Any text here.';
      const result = validateComponentContent('test-comp', 'task', text, validation);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty keywords in required array', () => {
      const validation: ContentValidation = {
        required: ['', '  ', 'valid'],
      };

      const text = 'This has the valid keyword.';
      const result = validateComponentContent('test-comp', 'task', text, validation);

      // Empty strings should be ignored
      expect(result.valid).toBe(true);
    });

    it('should handle empty keywords in optional array', () => {
      const validation: ContentValidation = {
        optional: ['', '  ', 'recommended'],
      };

      const text = 'This has the recommended keyword.';
      const result = validateComponentContent('test-comp', 'task', text, validation);

      // Empty strings should be ignored
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty keywords in forbidden array', () => {
      const validation: ContentValidation = {
        forbidden: ['', '  ', 'banned'],
      };

      const text = 'This text is allowed.';
      const result = validateComponentContent('test-comp', 'task', text, validation);

      // Empty strings should be ignored, only 'banned' should be checked
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty text being validated', () => {
      const validation: ContentValidation = {
        required: ['something'],
      };

      const text = '';
      const result = validateComponentContent('test-comp', 'task', text, validation);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should handle whitespace-only text', () => {
      const validation: ContentValidation = {
        required: ['keyword'],
      };

      const text = '   \n\t  ';
      const result = validateComponentContent('test-comp', 'task', text, validation);

      expect(result.valid).toBe(false);
    });

    it('should handle text with unicode and emoji', () => {
      const validation: ContentValidation = {
        required: ['emoji'],
      };

      const text = '✅ This text has emoji 🎉 and the emoji keyword';
      const result = validateComponentContent('test-comp', 'task', text, validation);

      expect(result.valid).toBe(true);
    });
  });

  describe('Edge cases - Custom validators', () => {
    it('should handle custom validator that throws exception', () => {
      const validation: ContentValidation = {
        custom: [
          () => {
            throw new Error('Validator error');
          },
        ],
      };

      const text = 'Some text';

      // Should catch the error and return validation failure
      expect(() => {
        validateComponentContent('test-comp', 'task', text, validation);
      }).toThrow('Validator error');
    });

    it('should handle custom validator returning invalid result', () => {
      const validation: ContentValidation = {
        custom: [
          // @ts-expect-error - Testing runtime behavior with invalid return
          () => undefined,
        ],
      };

      const text = 'Some text';
      const result = validateComponentContent('test-comp', 'task', text, validation);

      // Should treat undefined as invalid
      expect(result.valid).toBe(false);
    });

    it('should handle empty custom validators array', () => {
      const validation: ContentValidation = {
        custom: [],
      };

      const text = 'Some text';
      const result = validateComponentContent('test-comp', 'task', text, validation);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Edge cases - maxTokens', () => {
    it('should handle maxTokens = 0', () => {
      const validation: ContentValidation = {
        maxTokens: 0,
      };

      const text = 'Any text';
      const result = validateComponentContent('test-comp', 'task', text, validation);

      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Invalid maxTokens configuration');
    });

    it('should handle negative maxTokens', () => {
      const validation: ContentValidation = {
        maxTokens: -5,
      };

      const text = 'Any text';
      const result = validateComponentContent('test-comp', 'task', text, validation);

      // Negative should be treated as invalid config, but not crash
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Invalid maxTokens configuration');
    });

    it('should handle very long text for performance', () => {
      const validation: ContentValidation = {
        required: ['keyword'],
      };

      const text = 'keyword ' + 'a'.repeat(100000);
      const startTime = Date.now();
      const result = validateComponentContent('test-comp', 'task', text, validation);
      const duration = Date.now() - startTime;

      expect(result.valid).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second
    });
  });
});
