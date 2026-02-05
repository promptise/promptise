import { countTokens } from './tokenizer';

describe('countTokens', () => {
  describe('Basic functionality', () => {
    it('should count tokens for simple text', () => {
      const text = 'Hello world';
      const count = countTokens(text);

      expect(count).toBe(2); // o200k_base: "Hello" = 1, " world" = 1
      expect(typeof count).toBe('number');
    });

    it('should return 0 for empty string', () => {
      expect(countTokens('')).toBe(0);
    });

    it('should count tokens for longer text', () => {
      const shortText = 'Hi';
      const longText =
        'This is a much longer piece of text that should have significantly more tokens than a simple greeting.';

      const shortCount = countTokens(shortText);
      const longCount = countTokens(longText);

      expect(shortCount).toBe(1);
      expect(longCount).toBe(19);
      expect(longCount).toBeGreaterThan(shortCount);
    });
  });

  describe('Special characters and formatting', () => {
    it('should handle punctuation', () => {
      const text = 'Hello! How are you?';
      const count = countTokens(text);

      expect(count).toBe(6); // o200k_base tokenization
      expect(typeof count).toBe('number');
    });

    it('should handle emojis', () => {
      const text = '🎉';
      const count = countTokens(text);

      expect(count).toBe(2); // Emojis typically use multiple tokens
    });

    it('should handle mixed emojis and text', () => {
      const text = 'Hello! 🎉 How are you? 🚀';
      const count = countTokens(text);

      expect(count).toBeGreaterThan(6);
      expect(typeof count).toBe('number');
    });

    it('should handle multiline text', () => {
      const text = `Line 1
Line 2
Line 3`;
      const count = countTokens(text);

      expect(count).toBe(11); // "Line", " ", "1", "\n", "Line", " ", "2", "\n", "Line", " ", "3"
    });

    it('should handle whitespace variations', () => {
      expect(countTokens('   ')).toBe(1); // Multiple spaces
      expect(countTokens('\t\t')).toBe(1); // Tabs
      expect(countTokens('\n\n')).toBe(1); // Newlines (both counted as one)
    });
  });

  describe('Edge cases', () => {
    it('should handle very long text', () => {
      const longText = 'word '.repeat(1000);
      const count = countTokens(longText);

      expect(count).toBeGreaterThan(1000);
      expect(typeof count).toBe('number');
    });

    it('should handle unicode characters', () => {
      const text = '你好世界'; // "Hello world" in Chinese
      const count = countTokens(text);

      expect(count).toBeGreaterThan(0);
    });

    it('should handle JSON structures', () => {
      const json = JSON.stringify({ key: 'value', nested: { data: [1, 2, 3] } });
      const count = countTokens(json);

      expect(count).toBeGreaterThan(0);
      expect(typeof count).toBe('number');
    });

    it('should handle code snippets', () => {
      const code = `function hello() {\\n  return "world";\\n}`;
      const count = countTokens(code);

      expect(count).toBeGreaterThan(0);
    });
  });

  describe('Regression tests', () => {
    it('should maintain consistent counts for known strings', () => {
      // These are regression tests to detect tokenizer changes
      expect(countTokens('The quick brown fox')).toBe(4);
      expect(countTokens('GPT-4 is amazing!')).toBe(6);
      expect(countTokens('console.log()')).toBe(3); // o200k_base: "console", ".log", "()"
    });
  });
});
