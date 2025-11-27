import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MistralProvider } from '../../src/providers/cloud/mistral.js';
import { ProviderUnavailableError } from '../../src/utils/errors.js';

describe('MistralProvider', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      const provider = new MistralProvider({
        apiKey: 'mistral-test-key',
      });

      expect(provider.name).toBe('mistral');
      expect(provider.type).toBe('cloud');
    });

    it('should use default base URL', () => {
      const provider = new MistralProvider({
        apiKey: 'mistral-test-key',
      });

      expect(provider).toBeDefined();
    });

    it('should use custom base URL when provided', () => {
      const provider = new MistralProvider({
        apiKey: 'mistral-test-key',
        baseUrl: 'https://custom.mistral.ai/v1',
      });

      expect(provider).toBeDefined();
    });
  });

  describe('isAvailable', () => {
    it('should return true when API key is provided', async () => {
      const provider = new MistralProvider({
        apiKey: 'mistral-test-key',
      });

      expect(await provider.isAvailable()).toBe(true);
    });

    it('should return false when API key is empty', async () => {
      const provider = new MistralProvider({
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
          choices: [{ message: { content: 'Mistral response' } }],
          usage: { total_tokens: 40, prompt_tokens: 15, completion_tokens: 25 },
        }),
      });

      const provider = new MistralProvider({
        apiKey: 'mistral-test-key',
      });

      const result = await provider.complete('Hello');

      expect(result.text).toBe('Mistral response');
      expect(result.tokens).toBe(40);
      expect(result.provider).toBe('mistral');
      expect(result.cached).toBe(false);
      expect(result.cost).toBeGreaterThan(0);
    });

    it('should throw error when API key is missing', async () => {
      const provider = new MistralProvider({
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

      const provider = new MistralProvider({
        apiKey: 'mistral-test-key',
      });

      await provider.complete('Test prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.mistral.ai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mistral-test-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should use default model (mistral-small-latest)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 15 },
        }),
      });

      const provider = new MistralProvider({
        apiKey: 'mistral-test-key',
      });

      await provider.complete('Test');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe('mistral-small-latest');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const provider = new MistralProvider({
        apiKey: 'mistral-invalid-key',
      });

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
    });

    it('should support specialized models like codestral', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Code response' } }],
          usage: { total_tokens: 20 },
        }),
      });

      const provider = new MistralProvider({
        apiKey: 'mistral-test-key',
        models: ['codestral-latest'],
      });

      await provider.complete('Write a function');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe('codestral-latest');
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for a prompt', () => {
      const provider = new MistralProvider({
        apiKey: 'mistral-test-key',
      });

      const cost = provider.estimateCost('Test prompt');

      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should have competitive pricing (European provider)', () => {
      const provider = new MistralProvider({
        apiKey: 'mistral-test-key',
      });

      // Mistral small: $0.20 input, $0.60 output per 1M tokens
      // Very competitive pricing for high-quality models
      const cost = provider.estimateCost('Test prompt for comparison');

      // Cost should be relatively low
      expect(cost).toBeLessThan(0.01); // Less than $0.01 for a short prompt
    });
  });
});
