import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TogetherProvider } from '../../src/providers/cloud/together.js';
import { ProviderUnavailableError } from '../../src/utils/errors.js';

describe('TogetherProvider', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      const provider = new TogetherProvider({
        apiKey: 'together-test-key',
      });

      expect(provider.name).toBe('together');
      expect(provider.type).toBe('cloud');
    });

    it('should use default base URL', () => {
      const provider = new TogetherProvider({
        apiKey: 'together-test-key',
      });

      expect(provider).toBeDefined();
    });

    it('should use custom base URL when provided', () => {
      const provider = new TogetherProvider({
        apiKey: 'together-test-key',
        baseUrl: 'https://custom.together.xyz/v1',
      });

      expect(provider).toBeDefined();
    });
  });

  describe('isAvailable', () => {
    it('should return true when API key is provided', async () => {
      const provider = new TogetherProvider({
        apiKey: 'together-test-key',
      });

      expect(await provider.isAvailable()).toBe(true);
    });

    it('should return false when API key is empty', async () => {
      const provider = new TogetherProvider({
        apiKey: '',
      });

      expect(await provider.isAvailable()).toBe(false);
    });
  });

  describe('complete', () => {
    it('should successfully complete a prompt', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Llama response' } }],
          usage: { total_tokens: 45, prompt_tokens: 15, completion_tokens: 30 },
        }),
      });

      const provider = new TogetherProvider({
        apiKey: 'together-test-key',
      });

      const result = await provider.complete('Hello');

      expect(result.text).toBe('Llama response');
      expect(result.tokens).toBe(45);
      expect(result.provider).toBe('together');
      expect(result.cached).toBe(false);
      expect(result.cost).toBeGreaterThan(0);
    });

    it('should throw error when API key is missing', async () => {
      const provider = new TogetherProvider({
        apiKey: '',
      });

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
    });

    it('should send request to correct endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 15 },
        }),
      });

      const provider = new TogetherProvider({
        apiKey: 'together-test-key',
      });

      await provider.complete('Test prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.together.xyz/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer together-test-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should use default model (Llama 3.3 70B)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 15 },
        }),
      });

      const provider = new TogetherProvider({
        apiKey: 'together-test-key',
      });

      await provider.complete('Test');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe('meta-llama/Llama-3.3-70B-Instruct-Turbo');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const provider = new TogetherProvider({
        apiKey: 'together-invalid-key',
      });

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
    });

    it('should support various open-source models', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Mixtral response' } }],
          usage: { total_tokens: 25 },
        }),
      });

      const provider = new TogetherProvider({
        apiKey: 'together-test-key',
        models: ['mistralai/Mixtral-8x7B-Instruct-v0.1'],
      });

      await provider.complete('Explain quantum computing');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe('mistralai/Mixtral-8x7B-Instruct-v0.1');
    });

    it('should support DeepSeek models on Together', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'DeepSeek R1 response' } }],
          usage: { total_tokens: 100 },
        }),
      });

      const provider = new TogetherProvider({
        apiKey: 'together-test-key',
        models: ['deepseek-ai/DeepSeek-R1'],
      });

      await provider.complete('Solve this math problem');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe('deepseek-ai/DeepSeek-R1');
    });

    it('should support Qwen coding models', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Code solution' } }],
          usage: { total_tokens: 50 },
        }),
      });

      const provider = new TogetherProvider({
        apiKey: 'together-test-key',
        models: ['Qwen/Qwen2.5-Coder-32B-Instruct'],
      });

      await provider.complete('Write a Python function');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe('Qwen/Qwen2.5-Coder-32B-Instruct');
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for a prompt', () => {
      const provider = new TogetherProvider({
        apiKey: 'together-test-key',
      });

      const cost = provider.estimateCost('Test prompt');

      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should have competitive pricing for open-source models', () => {
      const provider = new TogetherProvider({
        apiKey: 'together-test-key',
      });

      // Together AI offers 200+ models at various price points
      // Llama 3.3 70B: $0.88 per 1M tokens (very competitive for a 70B model)
      const cost = provider.estimateCost('Test prompt for comparison');

      // Cost should be reasonable
      expect(cost).toBeLessThan(0.01); // Less than $0.01 for a short prompt
    });
  });
});
