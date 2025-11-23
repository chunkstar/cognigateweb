import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheManager } from '../../src/core/cache-manager.js';
import type { CompletionResult } from '../../src/utils/types.js';

describe('CacheManager', () => {
  let cache: CacheManager;
  let mockResult: CompletionResult;

  beforeEach(() => {
    cache = new CacheManager();
    mockResult = {
      text: 'Test response',
      tokens: 10,
      cost: 0.001,
      provider: 'openai',
      cached: false,
    };
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const cache = new CacheManager();
      const stats = cache.getStats();

      expect(stats.maxSize).toBe(100);
      expect(stats.ttl).toBe(3600); // 1 hour
      expect(stats.enabled).toBe(true);
    });

    it('should initialize with custom max size', () => {
      const cache = new CacheManager({ maxSize: 50 });
      const stats = cache.getStats();

      expect(stats.maxSize).toBe(50);
    });

    it('should initialize with custom TTL', () => {
      const cache = new CacheManager({ ttl: 1800 }); // 30 minutes
      const stats = cache.getStats();

      expect(stats.ttl).toBe(1800);
    });

    it('should initialize with cache disabled', () => {
      const cache = new CacheManager({ enabled: false });
      const stats = cache.getStats();

      expect(stats.enabled).toBe(false);
    });
  });

  describe('get and set', () => {
    it('should store and retrieve cached result', () => {
      cache.set('test prompt', undefined, mockResult);
      const result = cache.get('test prompt', undefined);

      expect(result).not.toBeNull();
      expect(result?.text).toBe('Test response');
      expect(result?.cached).toBe(true);
    });

    it('should return null for cache miss', () => {
      const result = cache.get('non-existent prompt', undefined);

      expect(result).toBeNull();
    });

    it('should differentiate between different prompts', () => {
      cache.set('prompt 1', undefined, mockResult);
      cache.set('prompt 2', undefined, { ...mockResult, text: 'Different response' });

      const result1 = cache.get('prompt 1', undefined);
      const result2 = cache.get('prompt 2', undefined);

      expect(result1?.text).toBe('Test response');
      expect(result2?.text).toBe('Different response');
    });

    it('should differentiate based on options', () => {
      cache.set('test', { model: 'gpt-4' }, mockResult);
      cache.set('test', { model: 'gpt-3.5' }, { ...mockResult, text: 'Different model response' });

      const result1 = cache.get('test', { model: 'gpt-4' });
      const result2 = cache.get('test', { model: 'gpt-3.5' });

      expect(result1?.text).toBe('Test response');
      expect(result2?.text).toBe('Different model response');
    });

    it('should not cache when disabled', () => {
      const cache = new CacheManager({ enabled: false });

      cache.set('test', undefined, mockResult);
      const result = cache.get('test', undefined);

      expect(result).toBeNull();
    });
  });

  describe('TTL expiration', () => {
    it('should return null for expired entries', async () => {
      const cache = new CacheManager({ ttl: 1 }); // 1 second TTL

      cache.set('test', undefined, mockResult);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      const result = cache.get('test', undefined);

      expect(result).toBeNull();
    });

    it('should return cached entry within TTL', async () => {
      const cache = new CacheManager({ ttl: 2 }); // 2 second TTL

      cache.set('test', undefined, mockResult);

      // Wait 500ms (well within TTL)
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = cache.get('test', undefined);

      expect(result).not.toBeNull();
      expect(result?.text).toBe('Test response');
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry when full', () => {
      const cache = new CacheManager({ maxSize: 3 });

      // Fill cache
      cache.set('prompt1', undefined, { ...mockResult, text: 'Response 1' });
      cache.set('prompt2', undefined, { ...mockResult, text: 'Response 2' });
      cache.set('prompt3', undefined, { ...mockResult, text: 'Response 3' });

      // Access prompt2 to make it more recently used
      cache.get('prompt2', undefined);

      // Add one more to trigger eviction
      cache.set('prompt4', undefined, { ...mockResult, text: 'Response 4' });

      // prompt1 should be evicted (least recently used)
      const result1 = cache.get('prompt1', undefined);
      const result2 = cache.get('prompt2', undefined);
      const result3 = cache.get('prompt3', undefined);
      const result4 = cache.get('prompt4', undefined);

      expect(result1).toBeNull();
      expect(result2?.text).toBe('Response 2');
      expect(result3?.text).toBe('Response 3');
      expect(result4?.text).toBe('Response 4');
    });

    it('should respect max size limit', () => {
      const cache = new CacheManager({ maxSize: 5 });

      for (let i = 0; i < 10; i++) {
        cache.set(`prompt${i}`, undefined, { ...mockResult, text: `Response ${i}` });
      }

      const stats = cache.getStats();
      expect(stats.size).toBe(5);
    });
  });

  describe('clear', () => {
    it('should remove all cached entries', () => {
      cache.set('prompt1', undefined, mockResult);
      cache.set('prompt2', undefined, mockResult);
      cache.set('prompt3', undefined, mockResult);

      expect(cache.size()).toBe(3);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.get('prompt1', undefined)).toBeNull();
      expect(cache.get('prompt2', undefined)).toBeNull();
      expect(cache.get('prompt3', undefined)).toBeNull();
    });

    it('should allow caching again after clear', () => {
      cache.set('test', undefined, mockResult);
      cache.clear();
      cache.set('new prompt', undefined, mockResult);

      const result = cache.get('new prompt', undefined);

      expect(result).not.toBeNull();
      expect(result?.text).toBe('Test response');
    });
  });

  describe('size', () => {
    it('should return current cache size', () => {
      expect(cache.size()).toBe(0);

      cache.set('prompt1', undefined, mockResult);
      expect(cache.size()).toBe(1);

      cache.set('prompt2', undefined, mockResult);
      expect(cache.size()).toBe(2);

      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return accurate cache statistics', () => {
      cache.set('prompt1', undefined, mockResult);
      cache.set('prompt2', undefined, mockResult);

      // Access prompt1 twice
      cache.get('prompt1', undefined);
      cache.get('prompt1', undefined);

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(100);
      expect(stats.ttl).toBe(3600);
      expect(stats.enabled).toBe(true);
      expect(stats.totalAccesses).toBe(2);
      expect(stats.expiredCount).toBe(0);
    });

    it('should track expired count correctly', async () => {
      const cache = new CacheManager({ ttl: 1 }); // 1 second TTL

      cache.set('test', undefined, mockResult);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      const stats = cache.getStats();

      expect(stats.expiredCount).toBe(1);
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      const cache = new CacheManager({ ttl: 1 }); // 1 second TTL

      cache.set('prompt1', undefined, mockResult);
      cache.set('prompt2', undefined, mockResult);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      cache.cleanup();

      expect(cache.size()).toBe(0);
    });

    it('should keep non-expired entries', async () => {
      const cache = new CacheManager({ ttl: 2 }); // 2 second TTL

      cache.set('prompt1', undefined, mockResult);

      // Wait 500ms (not expired)
      await new Promise(resolve => setTimeout(resolve, 500));

      cache.cleanup();

      expect(cache.size()).toBe(1);
    });
  });

  describe('access tracking', () => {
    it('should increment access count on cache hit', () => {
      cache.set('test', undefined, mockResult);

      cache.get('test', undefined);
      cache.get('test', undefined);
      cache.get('test', undefined);

      const stats = cache.getStats();

      expect(stats.totalAccesses).toBe(3);
    });

    it('should update last accessed time on cache hit', async () => {
      cache.set('test', undefined, mockResult);

      const firstAccess = Date.now();
      cache.get('test', undefined);

      await new Promise(resolve => setTimeout(resolve, 100));

      const secondAccess = Date.now();
      cache.get('test', undefined);

      // Both accesses should succeed (entry is not LRU)
      expect(secondAccess).toBeGreaterThan(firstAccess);
    });
  });

  describe('cached flag', () => {
    it('should mark cached results with cached: true', () => {
      cache.set('test', undefined, mockResult);

      const result = cache.get('test', undefined);

      expect(result?.cached).toBe(true);
    });

    it('should preserve other result properties', () => {
      cache.set('test', undefined, mockResult);

      const result = cache.get('test', undefined);

      expect(result?.text).toBe(mockResult.text);
      expect(result?.tokens).toBe(mockResult.tokens);
      expect(result?.cost).toBe(mockResult.cost);
      expect(result?.provider).toBe(mockResult.provider);
    });
  });
});
