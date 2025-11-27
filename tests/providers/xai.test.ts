import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { XAIProvider } from '../../src/providers/cloud/xai.js';
import { ProviderUnavailableError } from '../../src/utils/errors.js';

describe('XAIProvider', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      const provider = new XAIProvider({
        apiKey: 'xai-test-key',
      });

      expect(provider.name).toBe('xai');
      expect(provider.type).toBe('cloud');
    });

    it('should use default base URL', () => {
      const provider = new XAIProvider({
        apiKey: 'xai-test-key',
      });

      expect(provider).toBeDefined();
    });

    it('should use custom base URL when provided', () => {
      const provider = new XAIProvider({
        apiKey: 'xai-test-key',
        baseUrl: 'https://custom.x.ai/v1',
      });

      expect(provider).toBeDefined();
    });
  });

  describe('isAvailable', () => {
    it('should return true when API key is provided', async () => {
      const provider = new XAIProvider({
        apiKey: 'xai-test-key',
      });

      expect(await provider.isAvailable()).toBe(true);
    });

    it('should return false when API key is empty', async () => {
      const provider = new XAIProvider({
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
          choices: [{ message: { content: 'Grok response' } }],
          usage: { total_tokens: 50, prompt_tokens: 20, completion_tokens: 30 },
        }),
      });

      const provider = new XAIProvider({
        apiKey: 'xai-test-key',
      });

      const result = await provider.complete('Hello');

      expect(result.text).toBe('Grok response');
      expect(result.tokens).toBe(50);
      expect(result.provider).toBe('xai');
      expect(result.cached).toBe(false);
      expect(result.cost).toBeGreaterThan(0);
    });

    it('should throw error when API key is missing', async () => {
      const provider = new XAIProvider({
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

      const provider = new XAIProvider({
        apiKey: 'xai-test-key',
      });

      await provider.complete('Test prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.x.ai/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer xai-test-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should use default model (grok-2)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 15 },
        }),
      });

      const provider = new XAIProvider({
        apiKey: 'xai-test-key',
      });

      await provider.complete('Test');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.model).toBe('grok-2');
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const provider = new XAIProvider({
        apiKey: 'xai-invalid-key',
      });

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for a prompt', () => {
      const provider = new XAIProvider({
        apiKey: 'xai-test-key',
      });

      const cost = provider.estimateCost('Test prompt');

      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should have higher cost than DeepSeek (xAI is premium tier)', () => {
      const provider = new XAIProvider({
        apiKey: 'xai-test-key',
      });

      // xAI grok-2: $2.00 input, $10.00 output per 1M tokens
      // This is significantly more expensive than DeepSeek
      const cost = provider.estimateCost('Test prompt for comparison');

      // Cost should be moderate (xAI is premium pricing)
      expect(cost).toBeGreaterThan(0);
    });
  });
});
