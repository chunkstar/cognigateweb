import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnthropicProvider } from '../../src/providers/cloud/anthropic.js';
import { ProviderUnavailableError } from '../../src/utils/errors.js';

describe('AnthropicProvider', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      const provider = new AnthropicProvider({
        apiKey: 'sk-ant-test-key',
      });

      expect(provider.name).toBe('anthropic');
      expect(provider.type).toBe('cloud');
    });

    it('should use default base URL when not provided', () => {
      const provider = new AnthropicProvider({
        apiKey: 'sk-ant-test-key',
      });

      expect(provider).toBeDefined();
    });

    it('should use custom base URL when provided', () => {
      const provider = new AnthropicProvider({
        apiKey: 'sk-ant-test-key',
        baseUrl: 'https://custom.api.com/v1',
      });

      expect(provider).toBeDefined();
    });

    it('should use default models when not provided', () => {
      const provider = new AnthropicProvider({
        apiKey: 'sk-ant-test-key',
      });

      expect(provider).toBeDefined();
    });

    it('should use custom models when provided', () => {
      const provider = new AnthropicProvider({
        apiKey: 'sk-ant-test-key',
        models: ['claude-3-opus-20240229', 'claude-3-5-sonnet-20241022'],
      });

      expect(provider).toBeDefined();
    });
  });

  describe('isAvailable', () => {
    it('should return true when API key is provided', async () => {
      const provider = new AnthropicProvider({
        apiKey: 'sk-ant-test-key',
      });

      expect(await provider.isAvailable()).toBe(true);
    });

    it('should return false when API key is empty', async () => {
      const provider = new AnthropicProvider({
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
          content: [{ text: 'Hello! How can I assist you today?' }],
          usage: { input_tokens: 10, output_tokens: 15 },
        }),
      });

      const provider = new AnthropicProvider({
        apiKey: 'sk-ant-test-key',
      });

      const result = await provider.complete('Hello');

      expect(result.text).toBe('Hello! How can I assist you today?');
      expect(result.tokens).toBe(25); // 10 input + 15 output
      expect(result.provider).toBe('anthropic');
      expect(result.cached).toBe(false);
      expect(result.cost).toBeGreaterThan(0);
    });

    it('should throw error when API key is missing', async () => {
      const provider = new AnthropicProvider({
        apiKey: '',
      });

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
      await expect(provider.complete('Hello')).rejects.toThrow('API key is missing or invalid');
    });

    it('should use custom model when provided in options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Response' }],
          usage: { input_tokens: 5, output_tokens: 10 },
        }),
      });

      const provider = new AnthropicProvider({
        apiKey: 'sk-ant-test-key',
      });

      await provider.complete('Hello', { model: 'claude-3-opus-20240229' });

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.model).toBe('claude-3-opus-20240229');
    });

    it('should use custom temperature when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Response' }],
          usage: { input_tokens: 5, output_tokens: 10 },
        }),
      });

      const provider = new AnthropicProvider({
        apiKey: 'sk-ant-test-key',
      });

      await provider.complete('Hello', { temperature: 0.5 });

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.temperature).toBe(0.5);
    });

    it('should use custom maxTokens when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Response' }],
          usage: { input_tokens: 5, output_tokens: 10 },
        }),
      });

      const provider = new AnthropicProvider({
        apiKey: 'sk-ant-test-key',
      });

      await provider.complete('Hello', { maxTokens: 500 });

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.max_tokens).toBe(500);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Invalid authentication',
      });

      const provider = new AnthropicProvider({
        apiKey: 'sk-ant-invalid-key',
      });

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network timeout'));

      const provider = new AnthropicProvider({
        apiKey: 'sk-ant-test-key',
      });

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
    });

    it('should send correct request structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Response' }],
          usage: { input_tokens: 5, output_tokens: 10 },
        }),
      });

      const provider = new AnthropicProvider({
        apiKey: 'sk-ant-test-key',
      });

      await provider.complete('Test prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        {
          method: 'POST',
          headers: {
            'x-api-key': 'sk-ant-test-key',
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: expect.any(String),
        }
      );

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.messages).toEqual([{ role: 'user', content: 'Test prompt' }]);
      expect(body.model).toBe('claude-3-5-haiku-20241022'); // Default model
      expect(body.temperature).toBe(0.7); // Default temperature
      expect(body.max_tokens).toBe(1000); // Default max_tokens
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for a prompt', () => {
      const provider = new AnthropicProvider({
        apiKey: 'sk-ant-test-key',
      });

      const cost = provider.estimateCost('Hello, this is a test prompt!');

      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should return higher cost for longer prompts', () => {
      const provider = new AnthropicProvider({
        apiKey: 'sk-ant-test-key',
      });

      const shortCost = provider.estimateCost('Hi');
      const longCost = provider.estimateCost('This is a much longer prompt that should cost more to process');

      expect(longCost).toBeGreaterThan(shortCost);
    });
  });
});
