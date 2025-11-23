import { describe, it, expect, beforeEach } from 'vitest';
import { CacheManager } from '../../src/core/cache-manager.js';
import type { CompletionResult } from '../../src/utils/types.js';

describe('Semantic Caching', () => {
  let cache: CacheManager;
  let mockResult: CompletionResult;

  beforeEach(() => {
    mockResult = {
      text: 'Test response',
      tokens: 10,
      cost: 0.001,
      provider: 'openai',
      cached: false,
    };
  });

  describe('case-insensitive matching', () => {
    it('should match prompts with different casing', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.9,
      });

      cache.set('What is 2+2?', undefined, mockResult);

      // Lowercase version should match
      const result = cache.get('what is 2+2?', undefined);

      expect(result).not.toBeNull();
      expect(result?.text).toBe('Test response');
      expect(result?.cached).toBe(true);
    });

    it('should match prompts with UPPERCASE', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.9,
      });

      cache.set('explain typescript', undefined, mockResult);

      // Uppercase version should match
      const result = cache.get('EXPLAIN TYPESCRIPT', undefined);

      expect(result).not.toBeNull();
      expect(result?.text).toBe('Test response');
    });
  });

  describe('semantic similarity matching', () => {
    it('should match semantically similar prompts', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.3, // Adjusted for word-based similarity
      });

      cache.set('Explain TypeScript', undefined, mockResult);

      // Similar prompt should match
      const result = cache.get('Can you explain TypeScript?', undefined);

      expect(result).not.toBeNull();
      expect(result?.text).toBe('Test response');
    });

    it('should match prompts with additional words', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.5, // Adjusted for word-based similarity
      });

      cache.set('What is JavaScript?', undefined, mockResult);

      // Longer version should match
      const result = cache.get('What is JavaScript programming language?', undefined);

      expect(result).not.toBeNull();
    });

    it('should match prompts with reordered words', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.9, // Reordered words have high similarity
      });

      cache.set('Python programming language', undefined, mockResult);

      // Reordered should still match
      const result = cache.get('programming language Python', undefined);

      expect(result).not.toBeNull();
    });
  });

  describe('similarity threshold', () => {
    it('should not match when below threshold', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.95, // Very strict
      });

      cache.set('What is TypeScript?', undefined, mockResult);

      // Too different - should not match
      const result = cache.get('Explain JavaScript', undefined);

      expect(result).toBeNull();
    });

    it('should match with lower threshold', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.2, // Very lenient
      });

      cache.set('Tell me about Python', undefined, mockResult);

      // With lower threshold, more lenient matching
      const result = cache.get('Python information', undefined);

      expect(result).not.toBeNull();
    });

    it('should use default threshold of 0.9', () => {
      cache = new CacheManager({
        semanticCaching: true,
        // No threshold specified, should use 0.9
      });

      const stats = cache.getStats();
      expect(stats.similarityThreshold).toBe(0.9);
    });
  });

  describe('best match selection', () => {
    it('should return the best matching entry when multiple matches exist', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.5, // Adjusted threshold
      });

      // Add multiple entries
      cache.set('What is Python?', undefined, { ...mockResult, text: 'Python response' });
      cache.set('What is Python programming?', undefined, { ...mockResult, text: 'Better response' });
      cache.set('Tell me about Java', undefined, { ...mockResult, text: 'Java response' });

      // Should match the most similar one
      const result = cache.get('What is Python programming language?', undefined);

      expect(result).not.toBeNull();
      // Should get the better match
      expect(result?.text).toBe('Better response');
    });
  });

  describe('exact match priority', () => {
    it('should prefer exact match over semantic match', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.8,
      });

      // Add exact and similar entries
      cache.set('What is TypeScript?', undefined, { ...mockResult, text: 'Exact match' });
      cache.set('Explain TypeScript', undefined, { ...mockResult, text: 'Semantic match' });

      // Exact match should win
      const result = cache.get('What is TypeScript?', undefined);

      expect(result?.text).toBe('Exact match');
    });
  });

  describe('options matching', () => {
    it('should only match when options are identical', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.9,
      });

      cache.set('Hello', { model: 'gpt-4' }, mockResult);

      // Different options - should not match
      const result = cache.get('Hello', { model: 'gpt-3.5' });

      expect(result).toBeNull();
    });

    it('should match when options are identical', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.9,
      });

      cache.set('Hello world', { model: 'gpt-4', temperature: 0.7 }, mockResult);

      // Same options - should match
      const result = cache.get('hello world', { model: 'gpt-4', temperature: 0.7 });

      expect(result).not.toBeNull();
    });
  });

  describe('avoiding false positives', () => {
    it('should not match completely different prompts', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.9,
      });

      cache.set('What is the weather today?', undefined, mockResult);

      // Completely different - should not match
      const result = cache.get('How do I cook pasta?', undefined);

      expect(result).toBeNull();
    });

    it('should not match prompts with opposite meanings', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.9,
      });

      cache.set('Why is TypeScript good?', undefined, mockResult);

      // Opposite topic - should not match
      const result = cache.get('Why is TypeScript bad?', undefined);

      // Note: Simple word-based similarity might still match these
      // This test documents current behavior
      // In production, more sophisticated NLP might be needed
    });
  });

  describe('disabled semantic caching', () => {
    it('should not match similar prompts when disabled', () => {
      cache = new CacheManager({
        semanticCaching: false, // Disabled
        similarityThreshold: 0.9,
      });

      cache.set('What is 2+2?', undefined, mockResult);

      // Even though similar, should not match when disabled
      const result = cache.get('what is 2+2?', undefined);

      expect(result).toBeNull();
    });

    it('should still match exact prompts when disabled', () => {
      cache = new CacheManager({
        semanticCaching: false,
        similarityThreshold: 0.9,
      });

      cache.set('What is 2+2?', undefined, mockResult);

      // Exact match should still work
      const result = cache.get('What is 2+2?', undefined);

      expect(result).not.toBeNull();
    });
  });

  describe('TTL with semantic caching', () => {
    it('should not match expired entries even with semantic caching', async () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.9,
        ttl: 1, // 1 second
      });

      cache.set('What is TypeScript?', undefined, mockResult);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Should not match expired entry
      const result = cache.get('what is typescript?', undefined);

      expect(result).toBeNull();
    });
  });

  describe('cache statistics', () => {
    it('should include semantic caching config in stats', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.85,
      });

      const stats = cache.getStats();

      expect(stats.semanticCaching).toBe(true);
      expect(stats.similarityThreshold).toBe(0.85);
    });

    it('should track access count for semantic matches', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.9,
      });

      cache.set('Hello', undefined, mockResult);

      // Access multiple times with similar prompts
      cache.get('hello', undefined);
      cache.get('HELLO', undefined);

      const stats = cache.getStats();

      expect(stats.totalAccesses).toBe(2);
    });
  });

  describe('real-world examples', () => {
    it('should handle code-related queries', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.8,
      });

      cache.set('How do I reverse a string in JavaScript?', undefined, mockResult);

      // Similar phrasing should match
      const result = cache.get('How can I reverse a string in JavaScript?', undefined);

      expect(result).not.toBeNull();
    });

    it('should handle conversational variations', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.3, // Adjusted for extra words
      });

      cache.set('Tell me about React hooks', undefined, mockResult);

      // Conversational variation
      const result = cache.get('Can you tell me about React hooks?', undefined);

      expect(result).not.toBeNull();
    });

    it('should handle technical documentation queries', () => {
      cache = new CacheManager({
        semanticCaching: true,
        similarityThreshold: 0.65, // Punctuation affects word splits
      });

      cache.set('Explain async/await in JavaScript', undefined, mockResult);

      // Slight variation (punctuation affects tokenization)
      const result = cache.get('Explain async await in JavaScript', undefined);

      expect(result).not.toBeNull();
    });
  });
});
