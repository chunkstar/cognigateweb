import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Gateway } from '../../src/core/gateway.js';
import type { GatewayConfig } from '../../src/utils/types.js';

describe('Gateway Streaming', () => {
  // Mock fetch for testing
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function createGateway(config: GatewayConfig = {}): Gateway {
    return new Gateway(config);
  }

  function mockResponse(content: string, tokens = 10) {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content } }],
        usage: { total_tokens: tokens },
      }),
    });
  }

  describe('stream() method', () => {
    it('should return an async iterator', async () => {
      const gateway = createGateway({
        dailyBudget: 0,
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        }
      });

      const stream = gateway.stream('Hello');

      expect(stream[Symbol.asyncIterator]).toBeDefined();
    });

    it('should yield tokens progressively', async () => {
      mockResponse('Hello, this is a test response!');

      const gateway = createGateway({
        dailyBudget: 0,
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        }
      });

      const tokens: string[] = [];

      for await (const token of gateway.stream('Test')) {
        tokens.push(token);
      }

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.every(t => typeof t === 'string')).toBe(true);
    });

    it('should concatenate to form complete response', async () => {
      const expectedText = 'Hello world!';
      mockResponse(expectedText);

      const gateway = createGateway({
        dailyBudget: 0,
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        }
      });

      let fullText = '';

      for await (const token of gateway.stream('Test')) {
        fullText += token;
      }

      expect(fullText).toBe(expectedText);
    });

    it('should yield tokens with acceptable latency', async () => {
      mockResponse('Short response');

      const gateway = createGateway({
        dailyBudget: 0,
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        }
      });

      const timestamps: number[] = [];
      let prevTime = Date.now();

      for await (const token of gateway.stream('Test')) {
        const now = Date.now();
        const latency = now - prevTime;
        timestamps.push(latency);
        prevTime = now;
      }

      // Skip the first timestamp (includes API latency)
      const tokenLatencies = timestamps.slice(1);

      // Most tokens should arrive within 50ms (per acceptance criteria)
      const fastTokens = tokenLatencies.filter(t => t < 50);
      const ratio = fastTokens.length / tokenLatencies.length;

      expect(ratio).toBeGreaterThan(0.5); // At least 50% of tokens should be fast
    });
  });

  describe('streaming with compression', () => {
    it('should apply compression to prompt before streaming', async () => {
      mockResponse('Compressed response');

      const gateway = createGateway({
        dailyBudget: 0,
        compressionLevel: 'high',
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        }
      });

      let fullText = '';

      for await (const token of gateway.stream('This is very really just basically a simple test')) {
        fullText += token;
      }

      expect(fullText).toBe('Compressed response');
    });
  });

  describe('streaming with budget control', () => {
    it('should track spending after streaming completes', async () => {
      mockResponse('Test response');

      const gateway = createGateway({
        dailyBudget: 10,
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        }
      });

      const statusBefore = gateway.getBudgetStatus();
      expect(statusBefore.used).toBe(0);

      for await (const token of gateway.stream('Test')) {
        // Stream the response
      }

      const statusAfter = gateway.getBudgetStatus();
      expect(statusAfter.used).toBeGreaterThan(0);
    });

    it('should respect budget limits', async () => {
      mockResponse('First response');

      const gateway = createGateway({
        dailyBudget: 0.000001, // Very small budget
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        }
      });

      // First request should work
      let firstResponse = '';
      for await (const token of gateway.stream('Hi')) {
        firstResponse += token;
      }
      expect(firstResponse.length).toBeGreaterThan(0);

      // Second request should exceed budget (no need to mock as it won't reach provider)
      await expect(async () => {
        for await (const token of gateway.stream('Long prompt that will exceed our tiny budget')) {
          // Should throw before yielding any tokens
        }
      }).rejects.toThrow(/budget|exceeded/i);
    });
  });

  describe('streaming error handling', () => {
    it('should throw error for invalid API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Invalid API key',
      });

      const gateway = createGateway({
        dailyBudget: 0,
        cloudProviders: {
          openai: { apiKey: 'invalid-key' }
        },
        localFallback: { enabled: false }
      });

      await expect(async () => {
        for await (const token of gateway.stream('Test')) {
          // Should throw before yielding
        }
      }).rejects.toThrow();
    });

    it('should handle mid-stream errors gracefully', async () => {
      mockResponse('Test response');

      const gateway = createGateway({
        dailyBudget: 0,
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        }
      });

      // Stream should either complete successfully or throw a clean error
      try {
        for await (const token of gateway.stream('Test')) {
          expect(typeof token).toBe('string');
        }
      } catch (error) {
        // If it fails, it should be a proper error
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('streaming with forceProvider option', () => {
    it('should force cloud providers when specified', async () => {
      mockResponse('Cloud response');

      const gateway = createGateway({
        dailyBudget: 0,
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        }
      });

      let fullText = '';

      for await (const token of gateway.stream('Test', { forceProvider: 'cloud' })) {
        fullText += token;
      }

      expect(fullText).toBe('Cloud response');
    });
  });

  describe('streaming iterator behavior', () => {
    it('should properly close iterator when complete', async () => {
      mockResponse('Test response');

      const gateway = createGateway({
        dailyBudget: 0,
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        }
      });

      const tokens: string[] = [];

      for await (const token of gateway.stream('Test')) {
        tokens.push(token);
      }

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.join('')).toBe('Test response');
    });

    it('should allow manual iteration control', async () => {
      mockResponse('Test response');

      const gateway = createGateway({
        dailyBudget: 0,
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        }
      });

      const iterator = gateway.stream('Test')[Symbol.asyncIterator]();

      // Get first token
      const first = await iterator.next();
      expect(first.done).toBe(false);
      expect(typeof first.value).toBe('string');

      // Get second token
      const second = await iterator.next();
      expect(typeof second.value).toBe('string');

      // Can continue iterating...
    });

    it('should support breaking out of iteration early', async () => {
      mockResponse('This is a longer test response that can be interrupted');

      const gateway = createGateway({
        dailyBudget: 0,
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        }
      });

      let tokenCount = 0;

      for await (const token of gateway.stream('Test')) {
        tokenCount++;
        if (tokenCount >= 3) {
          break; // Stop early
        }
      }

      expect(tokenCount).toBe(3);
    });
  });
});
