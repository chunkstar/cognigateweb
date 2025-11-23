import { createHash } from 'crypto';
import type { CompletionResult } from '../utils/types.js';

/**
 * Cache entry with metadata
 */
interface CacheEntry {
  prompt: string; // Original prompt for semantic matching
  options?: any; // Original options for exact matching
  result: CompletionResult;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  /**
   * Maximum number of entries in cache
   * @default 100
   */
  maxSize?: number;

  /**
   * Time-to-live in seconds (how long entries stay in cache)
   * @default 3600 (1 hour)
   */
  ttl?: number;

  /**
   * Enable cache (can be disabled globally)
   * @default true
   */
  enabled?: boolean;

  /**
   * Enable semantic caching for similar prompts
   * @default false
   */
  semanticCaching?: boolean;

  /**
   * Similarity threshold for semantic matching (0-1)
   * @default 0.9
   */
  similarityThreshold?: number;
}

/**
 * LRU Cache Manager for AI completions
 *
 * Implements Least Recently Used (LRU) eviction policy
 * with TTL (time-to-live) support
 */
export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxSize: config.maxSize ?? 100,
      ttl: config.ttl ?? 3600, // 1 hour default
      enabled: config.enabled ?? true,
      semanticCaching: config.semanticCaching ?? false,
      similarityThreshold: config.similarityThreshold ?? 0.9,
    };
  }

  /**
   * Generate cache key from prompt and options
   */
  private generateKey(prompt: string, options?: any): string {
    const data = JSON.stringify({ prompt, options });
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    const age = (now - entry.timestamp) / 1000; // Convert to seconds
    return age > this.config.ttl;
  }

  /**
   * Calculate cosine similarity between two prompts
   * Returns a value between 0 (completely different) and 1 (identical)
   */
  private calculateSimilarity(prompt1: string, prompt2: string): number {
    // Normalize prompts (lowercase, trim)
    const p1 = prompt1.toLowerCase().trim();
    const p2 = prompt2.toLowerCase().trim();

    // Exact match after normalization
    if (p1 === p2) {
      return 1.0;
    }

    // Tokenize into words
    const words1 = p1.split(/\s+/);
    const words2 = p2.split(/\s+/);

    // Build vocabulary (unique words from both prompts)
    const vocabulary = new Set([...words1, ...words2]);

    // Create word frequency vectors
    const vector1 = new Map<string, number>();
    const vector2 = new Map<string, number>();

    for (const word of words1) {
      vector1.set(word, (vector1.get(word) || 0) + 1);
    }

    for (const word of words2) {
      vector2.set(word, (vector2.get(word) || 0) + 1);
    }

    // Calculate cosine similarity
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (const word of vocabulary) {
      const freq1 = vector1.get(word) || 0;
      const freq2 = vector2.get(word) || 0;

      dotProduct += freq1 * freq2;
      magnitude1 += freq1 * freq1;
      magnitude2 += freq2 * freq2;
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get cached result if available
   *
   * @param prompt - The prompt text
   * @param options - Optional completion options
   * @returns Cached result or null if not found/expired
   */
  get(prompt: string, options?: any): CompletionResult | null {
    if (!this.config.enabled) {
      return null;
    }

    // Try exact match first
    const key = this.generateKey(prompt, options);
    let entry = this.cache.get(key);

    // If not found and semantic caching is enabled, try similarity search
    if (!entry && this.config.semanticCaching) {
      let bestMatch: CacheEntry | null = null;
      let bestSimilarity = 0;

      for (const [, cachedEntry] of this.cache.entries()) {
        // Skip expired entries
        if (this.isExpired(cachedEntry)) {
          continue;
        }

        // Options must match exactly for semantic caching
        const optionsMatch = JSON.stringify(cachedEntry.options) === JSON.stringify(options);
        if (!optionsMatch) {
          continue;
        }

        // Calculate similarity
        const similarity = this.calculateSimilarity(prompt, cachedEntry.prompt);

        if (similarity >= this.config.similarityThreshold && similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = cachedEntry;
        }
      }

      entry = bestMatch;
    }

    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    // Return result with cached flag
    return {
      ...entry.result,
      cached: true,
    };
  }

  /**
   * Store result in cache
   *
   * @param prompt - The prompt text
   * @param options - Optional completion options
   * @param result - The completion result to cache
   */
  set(prompt: string, options: any | undefined, result: CompletionResult): void {
    if (!this.config.enabled) {
      return;
    }

    // Check if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const key = this.generateKey(prompt, options);
    const now = Date.now();

    this.cache.set(key, {
      prompt,
      options,
      result,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now,
    });
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let totalAccesses = 0;
    let expiredCount = 0;

    for (const entry of this.cache.values()) {
      totalAccesses += entry.accessCount;
      if (this.isExpired(entry)) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      ttl: this.config.ttl,
      enabled: this.config.enabled,
      semanticCaching: this.config.semanticCaching,
      similarityThreshold: this.config.similarityThreshold,
      totalAccesses,
      expiredCount,
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }
}
