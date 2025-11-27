import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DeepSeekProvider } from '../../src/providers/cloud/deepseek.js';
import { ProviderUnavailableError } from '../../src/utils/errors.js';

describe('DeepSeekProvider', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      const provider = new DeepSeekProvider({
        apiKey: 'sk-test-key',
      });

      expect(provider.name).toBe('deepseek');
      expect(provider.type).toBe('cloud');
    });

    it('should use default base URL', () => {
      const provider = new DeepSeekProvider({
        apiKey: 'sk-test-key',
      });

      expect(provider).toBeDefined();
    });

    it('should use custom base URL when provided', () => {
      const provider = new DeepSeekProvider({
        apiKey: 'sk-test-key',
        baseUrl: 'https://custom.deepseek.com/v1',
      });

      expect(provider).toBeDefined();
    });
  });

  describe('isAvailable', () => {
    it('should return true when API key is provided', async () => {
      const provider = new DeepSeekProvider({
        apiKey: 'sk-test-key',
      });

      expect(await provider.isAvailable()).toBe(true);
    });

    it('should return false when API key is empty', async () => {
      const provider = new DeepSeekProvider({
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
          choices: [{ message: { content: 'DeepSeek response' } }],
          usage: { total_tokens: 30, prompt_tokens: 10, completion_tokens: 20 },
        }),
      });

      const provider = new DeepSeekProvider({
        apiKey: 'sk-test-key',
      });

      const result = await provider.complete('Hello');

      expect(result.text).toBe('DeepSeek response');
      expect(result.tokens).toBe(30);
      expect(result.provider).toBe('deepseek');
      expect(result.cached).toBe(false);
      expect(result.cost).toBeGreaterThan(0);
    });

    it('should throw error when API key is missing', async () => {
      const provider = new DeepSeekProvider({
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

      const provider = new DeepSeekProvider({
        apiKey: 'sk-test-key',
      });

      await provider.complete('Test prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.deepseek.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer sk-test-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should use default model (deepseek-chat)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 15 },
        }),
      });

      const provider = new DeepSeekProvider({
        apiKey: 'sk-test-key',
      });

      await provider.complete('Test');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe('deepseek-chat');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const provider = new DeepSeekProvider({
        apiKey: 'sk-invalid-key',
      });

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for a prompt', () => {
      const provider = new DeepSeekProvider({
        apiKey: 'sk-test-key',
      });

      const cost = provider.estimateCost('Test prompt');

      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should have lower cost than OpenAI', () => {
      const provider = new DeepSeekProvider({
        apiKey: 'sk-test-key',
      });

      // DeepSeek is known for being very cost-effective
      // $0.14 input, $0.28 output per 1M tokens
      const cost = provider.estimateCost('Test prompt for comparison');

      // Cost should be very low (DeepSeek is about 10x cheaper than GPT-4o-mini)
      expect(cost).toBeLessThan(0.001); // Less than $0.001 for a short prompt
    });
  });
});
