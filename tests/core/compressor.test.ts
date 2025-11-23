import { describe, it, expect } from 'vitest';
import { Compressor } from '../../src/core/compressor.js';

describe('Compressor', () => {
  describe('low compression', () => {
    it('should normalize whitespace', () => {
      const input = 'Hello    world   this  is   a    test';
      const output = Compressor.compress(input, 'low');

      expect(output).toBe('Hello world this is a test');
    });

    it('should remove extra newlines', () => {
      const input = 'Line 1\n\n\nLine 2\n\n\n\nLine 3';
      const output = Compressor.compress(input, 'low');

      expect(output).toBe('Line 1\nLine 2\nLine 3');
    });

    it('should trim leading and trailing whitespace', () => {
      const input = '   Hello world   ';
      const output = Compressor.compress(input, 'low');

      expect(output).toBe('Hello world');
    });

    it('should achieve approximately 10% reduction on verbose text', () => {
      const input = 'This  is   a    test   with    lots     of      extra       spaces        everywhere';
      const output = Compressor.compress(input, 'low');
      const ratio = Compressor.getCompressionRatio(input, output);

      // With all the extra spaces, this should achieve decent compression
      expect(ratio).toBeGreaterThan(0.05); // At least 5% reduction
    });
  });

  describe('medium compression', () => {
    it('should remove filler words', () => {
      const input = 'This is very really quite just basically a simple test';
      const output = Compressor.compress(input, 'medium');

      // Filler words should be removed
      expect(output).not.toContain('very');
      expect(output).not.toContain('really');
      expect(output).not.toContain('quite');
      expect(output).not.toContain('just');
      expect(output).not.toContain('basically');
      expect(output).toContain('simple test');
    });

    it('should simplify verbose phrases', () => {
      const input = 'In order to make a decision, we need to take into consideration the facts';
      const output = Compressor.compress(input, 'medium');

      expect(output).toContain('to decide');
      expect(output).toContain('consider');
      expect(output).not.toContain('in order to');
      expect(output).not.toContain('make a decision');
      expect(output).not.toContain('take into consideration');
    });

    it('should replace "due to the fact that" with "because"', () => {
      const input = 'Due to the fact that it is raining, we will stay inside';
      const output = Compressor.compress(input, 'medium');

      expect(output).toContain('because');
      expect(output).not.toContain('due to the fact that');
    });

    it('should replace "at this point in time" with "now"', () => {
      const input = 'At this point in time, we are ready to proceed';
      const output = Compressor.compress(input, 'medium');

      expect(output).toContain('now');
      expect(output).not.toContain('at this point in time');
    });

    it('should achieve approximately 25% reduction on verbose text', () => {
      const input = 'In order to very really just basically make a decision about this very important matter, we need to take into consideration all of the relevant facts at this point in time';
      const output = Compressor.compress(input, 'medium');
      const ratio = Compressor.getCompressionRatio(input, output);

      expect(ratio).toBeGreaterThan(0.20); // At least 20% reduction
      expect(ratio).toBeLessThan(0.55); // But not more than 55%
    });
  });

  describe('high compression', () => {
    it('should remove articles', () => {
      const input = 'The cat sat on the mat in the house';
      const output = Compressor.compress(input, 'high');

      // Most articles should be removed (though sentence start might be preserved)
      const articleCount = (output.match(/\b(a|an|the)\b/gi) || []).length;
      const originalArticleCount = (input.match(/\b(a|an|the)\b/gi) || []).length;

      expect(articleCount).toBeLessThan(originalArticleCount);
    });

    it('should use contractions', () => {
      const input = 'I am going to do not do that because it is not right';
      const output = Compressor.compress(input, 'high');

      expect(output).toContain("I'm");
      expect(output).toContain("don't");
      expect(output).toContain("isn't");
      expect(output).not.toContain('I am');
      expect(output).not.toContain('do not');
      expect(output).not.toContain('is not');
    });

    it('should abbreviate common words', () => {
      const input = 'The information regarding the example without additional details';
      const output = Compressor.compress(input, 'high');

      expect(output).toContain('info');
      expect(output).toContain('re');
      expect(output).toContain('e.g.');
      expect(output).toContain('w/o');
    });

    it('should apply all compression strategies', () => {
      const input = 'This is very really a simple example regarding the information that we have at this point in time';
      const output = Compressor.compress(input, 'high');

      // Should remove fillers
      expect(output).not.toContain('very');
      expect(output).not.toContain('really');

      // Should simplify phrases
      expect(output).toContain('now');

      // Should abbreviate
      expect(output).toContain('re');
      expect(output).toContain('info');
    });

    it('should achieve approximately 40% reduction on very verbose text', () => {
      const input = 'In order to very really quite just make a decision about the matter, we need to take into consideration all of the relevant information regarding the situation at this point in time because it is very important';
      const output = Compressor.compress(input, 'high');
      const ratio = Compressor.getCompressionRatio(input, output);

      expect(ratio).toBeGreaterThan(0.30); // At least 30% reduction
      expect(ratio).toBeLessThan(0.60); // But not more than 60%
    });
  });

  describe('getCompressionRatio', () => {
    it('should calculate correct compression ratio', () => {
      const original = 'Hello world this is a test';
      const compressed = 'Hello world test';
      const ratio = Compressor.getCompressionRatio(original, compressed);

      // Original: 26 chars, Compressed: 16 chars
      // Reduction: (26 - 16) / 26 = 10/26 ≈ 0.385
      expect(ratio).toBeCloseTo(0.385, 2);
    });

    it('should return 0 for empty original string', () => {
      const ratio = Compressor.getCompressionRatio('', 'anything');

      expect(ratio).toBe(0);
    });

    it('should return 0 when compressed is longer', () => {
      const original = 'Hi';
      const compressed = 'Hello world';
      const ratio = Compressor.getCompressionRatio(original, compressed);

      expect(ratio).toBe(0); // Clamped to 0
    });

    it('should return value between 0 and 1', () => {
      const original = 'This is a much longer string';
      const compressed = 'Short';
      const ratio = Compressor.getCompressionRatio(original, compressed);

      expect(ratio).toBeGreaterThanOrEqual(0);
      expect(ratio).toBeLessThanOrEqual(1);
    });
  });

  describe('semantic preservation', () => {
    it('should preserve core meaning with low compression', () => {
      const input = 'What  is   the   capital   of   France?';
      const output = Compressor.compress(input, 'low');

      expect(output).toBe('What is the capital of France?');
      expect(output).toContain('capital');
      expect(output).toContain('France');
    });

    it('should preserve core meaning with medium compression', () => {
      const input = 'Can you very really just tell me what the capital of France is?';
      const output = Compressor.compress(input, 'medium');

      expect(output).toContain('tell');
      expect(output).toContain('capital');
      expect(output).toContain('France');
    });

    it('should preserve core meaning with high compression', () => {
      const input = 'I would like to know what the capital of France is at this point in time';
      const output = Compressor.compress(input, 'high');

      expect(output).toContain('capital');
      expect(output).toContain('France');
      // "I would" should become "I'd"
      expect(output).toContain("I'd");
    });

    it('should handle questions properly', () => {
      const input = 'What is the meaning of life?';
      const output = Compressor.compress(input, 'high');

      expect(output).toContain('meaning');
      expect(output).toContain('life');
      expect(output).toContain('?');
    });

    it('should handle code snippets without breaking them', () => {
      const input = 'Write a function that returns the sum of two numbers';
      const output = Compressor.compress(input, 'medium');

      expect(output).toContain('function');
      expect(output).toContain('returns');
      expect(output).toContain('sum');
      expect(output).toContain('numbers');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const output = Compressor.compress('', 'medium');

      expect(output).toBe('');
    });

    it('should handle single word', () => {
      const output = Compressor.compress('Hello', 'high');

      expect(output).toBe('Hello');
    });

    it('should handle text with only whitespace', () => {
      const output = Compressor.compress('    \n\n   \t   ', 'low');

      expect(output).toBe('');
    });

    it('should handle text with special characters', () => {
      const input = 'Hello! How are you? This is great.';
      const output = Compressor.compress(input, 'medium');

      expect(output).toContain('!');
      expect(output).toContain('?');
      expect(output).toContain('.');
    });

    it('should handle numbers', () => {
      const input = 'The answer is 42 and the year is 2025';
      const output = Compressor.compress(input, 'high');

      expect(output).toContain('42');
      expect(output).toContain('2025');
    });
  });

  describe('real-world examples', () => {
    it('should compress technical documentation', () => {
      const input = 'In order to very really use this API, you need to basically just make a POST request to the endpoint with the required parameters at this point in time';
      const output = Compressor.compress(input, 'high');
      const ratio = Compressor.getCompressionRatio(input, output);

      expect(ratio).toBeGreaterThan(0.25); // Good compression
      expect(output).toContain('API');
      expect(output).toContain('POST');
      expect(output).toContain('endpoint');
      expect(output).toContain('parameters');
    });

    it('should compress conversational prompts', () => {
      const input = 'Can you very please just tell me a little bit about the history of artificial intelligence?';
      const output = Compressor.compress(input, 'medium');

      expect(output).toContain('tell');
      expect(output).toContain('history');
      expect(output).toContain('artificial intelligence');
    });

    it('should compress verbose instructions', () => {
      const input = 'I would like you to write a function that takes into consideration the input and returns the output';
      const output = Compressor.compress(input, 'high');

      expect(output).toContain("I'd");
      expect(output).toContain('write');
      expect(output).toContain('function');
      expect(output).toContain('input');
      expect(output).toContain('output');
    });
  });
});
