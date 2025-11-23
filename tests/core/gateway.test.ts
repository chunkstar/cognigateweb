import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createGateway, Gateway, ConfigurationError, ProviderUnavailableError, BudgetExceededError } from '../../src/index.js';

describe('Gateway', () => {
  describe('createGateway', () => {
    it('should create a gateway instance with no arguments', () => {
      const gateway = createGateway();

      expect(gateway).toBeInstanceOf(Gateway);
    });

    it('should create a gateway instance with empty config', () => {
      const gateway = createGateway({});

      expect(gateway).toBeInstanceOf(Gateway);
    });

    it('should create a gateway instance with full config', () => {
      const gateway = createGateway({
        dailyBudget: 10,
        cacheEnabled: true,
        compressionLevel: 'medium',
        cloudProviders: {
          openai: {
            apiKey: 'test-key',
          },
        },
        localFallback: {
          enabled: true,
        },
      });

      expect(gateway).toBeInstanceOf(Gateway);
    });
  });

  describe('configuration validation', () => {
    it('should apply default values when not provided', () => {
      const gateway = createGateway({
        cloudProviders: {
          openai: { apiKey: 'test' },
        },
      });

      const config = gateway.getConfig();

      expect(config.dailyBudget).toBe(0); // unlimited by default
      expect(config.cacheEnabled).toBe(true);
      expect(config.compressionLevel).toBe('medium');
      expect(config.localFallback.enabled).toBe(false);
    });

    it('should reject negative daily budget', () => {
      expect(() =>
        createGateway({
          dailyBudget: -1,
          cloudProviders: { openai: { apiKey: 'test' } },
        })
      ).toThrow(ConfigurationError);

      expect(() =>
        createGateway({
          dailyBudget: -1,
          cloudProviders: { openai: { apiKey: 'test' } },
        })
      ).toThrow('dailyBudget must be >= 0');
    });

    it('should accept zero daily budget (unlimited)', () => {
      const gateway = createGateway({
        dailyBudget: 0,
        cloudProviders: { openai: { apiKey: 'test' } },
      });

      expect(gateway.getConfig().dailyBudget).toBe(0);
    });

    it('should reject invalid compression level', () => {
      expect(() =>
        createGateway({
          // @ts-expect-error - testing invalid value
          compressionLevel: 'invalid',
          cloudProviders: { openai: { apiKey: 'test' } },
        })
      ).toThrow(ConfigurationError);

      expect(() =>
        createGateway({
          // @ts-expect-error - testing invalid value
          compressionLevel: 'invalid',
          cloudProviders: { openai: { apiKey: 'test' } },
        })
      ).toThrow('compressionLevel must be one of');
    });

    it('should accept valid compression levels', () => {
      const levels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];

      levels.forEach((level) => {
        const gateway = createGateway({
          compressionLevel: level,
          cloudProviders: { openai: { apiKey: 'test' } },
        });

        expect(gateway.getConfig().compressionLevel).toBe(level);
      });
    });

    it('should default to local fallback when no providers configured', () => {
      const gateway = createGateway({});
      const config = gateway.getConfig();

      expect(config.localFallback.enabled).toBe(true);
      expect(config.cloudProviders).toEqual({});
    });

    it('should require at least one provider when local fallback explicitly disabled', () => {
      expect(() =>
        createGateway({
          localFallback: { enabled: false },
        })
      ).toThrow(ConfigurationError);

      expect(() =>
        createGateway({
          localFallback: { enabled: false },
        })
      ).toThrow('At least one cloud provider or local fallback must be enabled');
    });

    it('should accept cloud provider only', () => {
      const gateway = createGateway({
        cloudProviders: {
          openai: { apiKey: 'test' },
        },
      });

      expect(gateway).toBeInstanceOf(Gateway);
    });

    it('should accept local fallback only', () => {
      const gateway = createGateway({
        localFallback: { enabled: true },
      });

      expect(gateway).toBeInstanceOf(Gateway);
    });

    it('should accept both cloud and local providers', () => {
      const gateway = createGateway({
        cloudProviders: {
          openai: { apiKey: 'test' },
        },
        localFallback: {
          enabled: true,
        },
      });

      expect(gateway).toBeInstanceOf(Gateway);
    });

    it('should accept Anthropic provider', () => {
      const gateway = createGateway({
        cloudProviders: {
          anthropic: { apiKey: 'sk-ant-test' },
        },
      });

      expect(gateway).toBeInstanceOf(Gateway);
    });

    it('should accept multiple cloud providers', () => {
      const gateway = createGateway({
        cloudProviders: {
          openai: { apiKey: 'sk-test' },
          anthropic: { apiKey: 'sk-ant-test' },
        },
      });

      expect(gateway).toBeInstanceOf(Gateway);
    });

    it('should accept Google provider', () => {
      const gateway = createGateway({
        cloudProviders: {
          google: { apiKey: 'test-google-key' },
        },
      });

      expect(gateway).toBeInstanceOf(Gateway);
    });

    it('should accept all three cloud providers', () => {
      const gateway = createGateway({
        cloudProviders: {
          openai: { apiKey: 'sk-test' },
          anthropic: { apiKey: 'sk-ant-test' },
          google: { apiKey: 'test-google-key' },
        },
      });

      expect(gateway).toBeInstanceOf(Gateway);
    });

    it('should accept LM Studio as local provider', () => {
      const gateway = createGateway({
        localFallback: {
          enabled: true,
          providers: ['lmstudio'],
        },
      });

      expect(gateway).toBeInstanceOf(Gateway);
    });

    it('should accept multiple local providers including LM Studio', () => {
      const gateway = createGateway({
        localFallback: {
          enabled: true,
          providers: ['ollama', 'lmstudio'],
        },
      });

      expect(gateway).toBeInstanceOf(Gateway);
    });

    it('should accept WebLLM as local provider', () => {
      const gateway = createGateway({
        localFallback: {
          enabled: true,
          providers: ['webllm'],
        },
      });

      expect(gateway).toBeInstanceOf(Gateway);
    });

    it('should accept all local providers (ollama, lmstudio, webllm)', () => {
      const gateway = createGateway({
        localFallback: {
          enabled: true,
          providers: ['ollama', 'lmstudio', 'webllm'],
        },
      });

      expect(gateway).toBeInstanceOf(Gateway);
    });
  });

  describe('getBudgetStatus', () => {
    it('should return budget status with correct daily limit', () => {
      const gateway = createGateway({
        dailyBudget: 10,
        cloudProviders: { openai: { apiKey: 'test' } },
      });

      const status = gateway.getBudgetStatus();

      expect(status.dailyLimit).toBe(10);
      expect(status.used).toBe(0); // Nothing used yet
      expect(status.remaining).toBe(10);
      expect(status.resetAt).toBeInstanceOf(Date);
    });

    it('should return unlimited budget when dailyBudget is 0', () => {
      const gateway = createGateway({
        dailyBudget: 0,
        cloudProviders: { openai: { apiKey: 'test' } },
      });

      const status = gateway.getBudgetStatus();

      expect(status.dailyLimit).toBe(0);
    });
  });

  describe('clearCache', () => {
    it('should not throw error when clearing cache', () => {
      const gateway = createGateway({
        cacheEnabled: true,
        cloudProviders: { openai: { apiKey: 'test' } },
      });

      expect(() => gateway.clearCache()).not.toThrow();
    });
  });

  describe('complete', () => {
    // Mock fetch for testing
    const mockFetch = vi.fn();

    beforeEach(() => {
      global.fetch = mockFetch;
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should complete a prompt using OpenAI provider', async () => {
      // Mock successful OpenAI response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Hello! How can I help you?' } }],
          usage: { total_tokens: 25 },
        }),
      });

      const gateway = createGateway({
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        },
      });

      const result = await gateway.complete('Hello');

      expect(result).toBe('Hello! How can I help you?');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-test-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should pass options to the provider', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Test response' } }],
          usage: { total_tokens: 20 },
        }),
      });

      const gateway = createGateway({
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        },
      });

      await gateway.complete('Hello', {
        model: 'gpt-4o',
        temperature: 0.5,
        maxTokens: 500,
      });

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.model).toBe('gpt-4o');
      expect(body.temperature).toBe(0.5);
      expect(body.max_tokens).toBe(500);
    });

    it('should throw error when no providers are available', async () => {
      const gateway = createGateway({
        cloudProviders: {
          openai: { apiKey: '' } // Empty API key = not available
        },
        localFallback: { enabled: false },
      });

      await expect(gateway.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
      await expect(gateway.complete('Hello')).rejects.toThrow(
        'All providers failed'
      );
    });

    it('should fallback to second provider if first fails', async () => {
      // First call will fail (OpenAI with empty key)
      // Second call should succeed (Anthropic)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Response from Claude!' }],
          usage: { input_tokens: 5, output_tokens: 10 },
        }),
      });

      const gateway = createGateway({
        cloudProviders: {
          openai: { apiKey: '' }, // Will fail - no API key
          anthropic: { apiKey: 'sk-ant-test' }, // Should fallback to this
        },
        localFallback: { enabled: false },
      });

      const result = await gateway.complete('Hello');
      expect(result).toBe('Response from Claude!');

      // Verify Anthropic API was called (not OpenAI)
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('anthropic.com'),
        expect.any(Object)
      );
    });

    it('should provide detailed errors when all providers fail', async () => {
      const gateway = createGateway({
        cloudProviders: {
          openai: { apiKey: '' },
          anthropic: { apiKey: '' },
        },
        localFallback: { enabled: false },
      });

      try {
        await gateway.complete('Hello');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(ProviderUnavailableError);
        const providerError = error as ProviderUnavailableError;
        // Should mention both providers in error
        expect(providerError.message).toContain('openai');
        expect(providerError.message).toContain('anthropic');
      }
    });

    it('should handle OpenAI API errors gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Invalid API key',
      });

      const gateway = createGateway({
        cloudProviders: {
          openai: { apiKey: 'sk-invalid-key' }
        },
      });

      await expect(gateway.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const gateway = createGateway({
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        },
      });

      await expect(gateway.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
    });

    it('should use default model when not specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 10 },
        }),
      });

      const gateway = createGateway({
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        },
      });

      await gateway.complete('Hello');

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.model).toBe('gpt-4o-mini'); // Default model
    });

    it('should use custom base URL when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 10 },
        }),
      });

      const gateway = createGateway({
        cloudProviders: {
          openai: {
            apiKey: 'sk-test-key',
            baseUrl: 'https://custom.openai.proxy.com/v1'
          }
        },
      });

      await gateway.complete('Hello');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://custom.openai.proxy.com/v1/chat/completions',
        expect.any(Object)
      );
    });

    describe('budget enforcement', () => {
      it('should throw BudgetExceededError when request would exceed budget', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response' } }],
            usage: { total_tokens: 1000000 }, // Very high token count
          }),
        });

        const gateway = createGateway({
          dailyBudget: 0.0001, // Extremely small budget (0.01 cents)
          cloudProviders: {
            openai: { apiKey: 'sk-test-key' }
          },
        });

        // Create a very long prompt to exceed budget (repeat text to increase token count)
        const longPrompt = 'This is a test prompt. '.repeat(100); // ~400 tokens

        await expect(gateway.complete(longPrompt)).rejects.toThrow(BudgetExceededError);
      });

      it('should allow requests within budget', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response' } }],
            usage: { total_tokens: 50 },
          }),
        });

        const gateway = createGateway({
          dailyBudget: 10, // Generous budget
          cloudProviders: {
            openai: { apiKey: 'sk-test-key' }
          },
        });

        await expect(gateway.complete('Short prompt')).resolves.toBe('Response');
      });

      it('should track spending across multiple requests', async () => {
        // Use a moderate prompt length
        const prompt = 'Test prompt for budget tracking. '.repeat(10); // ~100 chars, ~25 tokens

        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response' } }],
            usage: { total_tokens: 50 }, // Realistic for the prompt length
          }),
        });

        const gateway = createGateway({
          dailyBudget: 0.00008, // Small budget to allow 1 request (~$0.000062) but not 2
          cacheEnabled: false, // Disable caching to test budget tracking
          cloudProviders: {
            openai: { apiKey: 'sk-test-key' }
          },
        });

        // First request should work
        await gateway.complete(prompt);

        const status = gateway.getBudgetStatus();
        expect(status.used).toBeGreaterThan(0);
        expect(status.remaining).toBeLessThan(status.dailyLimit);

        // Second request should fail due to accumulated spending
        await expect(gateway.complete(prompt)).rejects.toThrow(BudgetExceededError);
      });

      it('should allow unlimited spending when dailyBudget is 0', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response' } }],
            usage: { total_tokens: 1000000 },
          }),
        });

        const gateway = createGateway({
          dailyBudget: 0, // Unlimited
          cloudProviders: {
            openai: { apiKey: 'sk-test-key' }
          },
        });

        // Should work even with very high cost
        await expect(gateway.complete('Expensive prompt')).resolves.toBe('Response');
      });

      it('should update budget status after successful request', async () => {
        mockFetch.mockResolvedValue({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Response' } }],
            usage: { total_tokens: 100 },
          }),
        });

        const gateway = createGateway({
          dailyBudget: 10,
          cloudProviders: {
            openai: { apiKey: 'sk-test-key' }
          },
        });

        const statusBefore = gateway.getBudgetStatus();
        expect(statusBefore.used).toBe(0);

        await gateway.complete('Prompt');

        const statusAfter = gateway.getBudgetStatus();
        expect(statusAfter.used).toBeGreaterThan(0);
        expect(statusAfter.remaining).toBe(statusAfter.dailyLimit - statusAfter.used);
      });
    });

    describe('local provider support', () => {
      it('should support Ollama provider when local fallback is enabled', async () => {
        // First call: Gateway calls isAvailable on all providers
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ models: [] }),
        });

        // Second call: Ollama.complete() calls isAvailable() internally
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ models: [] }),
        });

        // Third call: Ollama completion
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: 'Hello from Ollama!',
            done: true,
          }),
        });

        const gateway = createGateway({
          localFallback: {
            enabled: true,
            providers: ['ollama'],
          },
        });

        const result = await gateway.complete('Hello');
        expect(result).toBe('Hello from Ollama!');

        // Verify Ollama API was called
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:11434/api/generate',
          expect.any(Object)
        );
      });

      it('should use Ollama when cloud providers fail', async () => {
        // Mock OpenAI failure (no API key) - Gateway.complete() checks isAvailable first
        // OpenAI will fail isAvailable check (no mocks, empty apiKey)

        // First call: Gateway checks Ollama isAvailable
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ models: [] }),
        });

        // Second call: Ollama.complete() calls isAvailable() internally
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ models: [] }),
        });

        // Third call: Ollama completion
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: 'Ollama to the rescue!',
            done: true,
          }),
        });

        const gateway = createGateway({
          cloudProviders: {
            openai: { apiKey: '' }, // Empty API key = will fail
          },
          localFallback: {
            enabled: true,
            providers: ['ollama'],
          },
        });

        const result = await gateway.complete('Help!');
        expect(result).toBe('Ollama to the rescue!');
      });

      it('should report $0 cost for local Ollama requests', async () => {
        // First call: Gateway checks Ollama isAvailable
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ models: [] }),
        });

        // Second call: Ollama.complete() calls isAvailable() internally
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ models: [] }),
        });

        // Third call: Ollama completion
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            response: 'Free response!',
            done: true,
          }),
        });

        const gateway = createGateway({
          dailyBudget: 10,
          localFallback: {
            enabled: true,
            providers: ['ollama'],
          },
        });

        const statusBefore = gateway.getBudgetStatus();
        await gateway.complete('Test');
        const statusAfter = gateway.getBudgetStatus();

        // Local models should not consume budget
        expect(statusAfter.used).toBe(statusBefore.used); // No change
        expect(statusAfter.remaining).toBe(10); // Still full budget
      });
    });
  });

  describe('caching', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
      global.fetch = mockFetch;
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should cache identical prompts', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Cached response' } }],
          usage: { total_tokens: 50 },
        }),
      });

      const gateway = createGateway({
        cacheEnabled: true,
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        },
      });

      // First request - should hit API
      const result1 = await gateway.complete('Test prompt');
      expect(result1).toBe('Cached response');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second identical request - should use cache
      const result2 = await gateway.complete('Test prompt');
      expect(result2).toBe('Cached response');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 API call
    });

    it('should not cache when disabled', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 50 },
        }),
      });

      const gateway = createGateway({
        cacheEnabled: false,
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        },
      });

      // First request
      await gateway.complete('Test prompt');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second identical request - should make new API call
      await gateway.complete('Test prompt');
      expect(mockFetch).toHaveBeenCalledTimes(2); // Two API calls
    });

    it('should differentiate between different prompts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response 1' } }],
          usage: { total_tokens: 50 },
        }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response 2' } }],
          usage: { total_tokens: 50 },
        }),
      });

      const gateway = createGateway({
        cacheEnabled: true,
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        },
      });

      const result1 = await gateway.complete('Prompt 1');
      const result2 = await gateway.complete('Prompt 2');

      expect(result1).toBe('Response 1');
      expect(result2).toBe('Response 2');
      expect(mockFetch).toHaveBeenCalledTimes(2); // Different prompts = 2 API calls
    });

    it('should differentiate between different options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'GPT-4 response' } }],
          usage: { total_tokens: 50 },
        }),
      }).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'GPT-4o-mini response' } }],
          usage: { total_tokens: 50 },
        }),
      });

      const gateway = createGateway({
        cacheEnabled: true,
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        },
      });

      const result1 = await gateway.complete('Test', { model: 'gpt-4' });
      const result2 = await gateway.complete('Test', { model: 'gpt-4o-mini' });

      expect(result1).toBe('GPT-4 response');
      expect(result2).toBe('GPT-4o-mini response');
      expect(mockFetch).toHaveBeenCalledTimes(2); // Different options = 2 API calls
    });

    it('should clear cache when clearCache() is called', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 50 },
        }),
      });

      const gateway = createGateway({
        cacheEnabled: true,
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        },
      });

      // First request - hits API
      await gateway.complete('Test');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second request - uses cache
      await gateway.complete('Test');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Clear cache
      gateway.clearCache();

      // Third request - should hit API again
      await gateway.complete('Test');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not charge budget for cached requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 100 },
        }),
      });

      const gateway = createGateway({
        cacheEnabled: true,
        dailyBudget: 10,
        cloudProviders: {
          openai: { apiKey: 'sk-test-key' }
        },
      });

      // First request - hits API and charges budget
      await gateway.complete('Test');
      const statusAfterFirst = gateway.getBudgetStatus();
      const costFirst = statusAfterFirst.used;
      expect(costFirst).toBeGreaterThan(0);

      // Second request - uses cache, no additional cost
      await gateway.complete('Test');
      const statusAfterSecond = gateway.getBudgetStatus();
      expect(statusAfterSecond.used).toBe(costFirst); // No increase
    });
  });
});
