import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LMStudioProvider } from '../../src/providers/local/lmstudio.js';
import { ProviderUnavailableError } from '../../src/utils/errors.js';

describe('LMStudioProvider', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const provider = new LMStudioProvider();

      expect(provider.name).toBe('lmstudio');
      expect(provider.type).toBe('local');
    });

    it('should use default base URL when not provided', () => {
      const provider = new LMStudioProvider();

      expect(provider).toBeDefined();
    });

    it('should use custom base URL when provided', () => {
      const provider = new LMStudioProvider({
        baseUrl: 'http://localhost:5000/v1',
      });

      expect(provider).toBeDefined();
    });

    it('should use default models when not provided', () => {
      const provider = new LMStudioProvider();

      expect(provider).toBeDefined();
    });

    it('should use custom models when provided', () => {
      const provider = new LMStudioProvider({
        models: ['custom-model-1', 'custom-model-2'],
      });

      expect(provider).toBeDefined();
    });
  });

  describe('isAvailable', () => {
    it('should return true when LM Studio is running', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const provider = new LMStudioProvider();

      expect(await provider.isAvailable()).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:1234/v1/models',
        { method: 'GET' }
      );
    });

    it('should return false when LM Studio is not running', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const provider = new LMStudioProvider();

      expect(await provider.isAvailable()).toBe(false);
    });

    it('should return false when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const provider = new LMStudioProvider();

      expect(await provider.isAvailable()).toBe(false);
    });

    it('should check custom base URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      const provider = new LMStudioProvider({
        baseUrl: 'http://localhost:5000/v1',
      });

      await provider.isAvailable();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:5000/v1/models',
        { method: 'GET' }
      );
    });
  });

  describe('complete', () => {
    it('should successfully complete a prompt', async () => {
      // Mock isAvailable check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      // Mock completion request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: { content: 'Hello! How can I help you?' }
          }],
          usage: { total_tokens: 15 },
        }),
      });

      const provider = new LMStudioProvider();

      const result = await provider.complete('Hello');

      expect(result.text).toBe('Hello! How can I help you?');
      expect(result.tokens).toBe(15);
      expect(result.provider).toBe('lmstudio');
      expect(result.cached).toBe(false);
      expect(result.cost).toBe(0); // Local models are free
    });

    it('should throw error when LM Studio is not available', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const provider = new LMStudioProvider();

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
      await expect(provider.complete('Hello')).rejects.toThrow('LM Studio is not available');
    });

    it('should use custom model when provided in options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 10 },
        }),
      });

      const provider = new LMStudioProvider();

      await provider.complete('Hello', { model: 'llama-3-8b' });

      const completionCall = mockFetch.mock.calls[1];
      const body = JSON.parse(completionCall![1].body);

      expect(body.model).toBe('llama-3-8b');
    });

    it('should use custom temperature when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 10 },
        }),
      });

      const provider = new LMStudioProvider();

      await provider.complete('Hello', { temperature: 0.5 });

      const completionCall = mockFetch.mock.calls[1];
      const body = JSON.parse(completionCall![1].body);

      expect(body.temperature).toBe(0.5);
    });

    it('should use custom maxTokens when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 10 },
        }),
      });

      const provider = new LMStudioProvider();

      await provider.complete('Hello', { maxTokens: 500 });

      const completionCall = mockFetch.mock.calls[1];
      const body = JSON.parse(completionCall![1].body);

      expect(body.max_tokens).toBe(500);
    });

    it('should handle API errors', async () => {
      // First isAvailable check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      // First completion request (API error)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      // Second isAvailable check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      // Second completion request (API error)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      const provider = new LMStudioProvider();

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
      await expect(provider.complete('Hello')).rejects.toThrow('API error (500)');
    });

    it('should handle network errors', async () => {
      // First isAvailable check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      // First completion request (network error)
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      // Second isAvailable check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      // Second completion request (network error)
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const provider = new LMStudioProvider();

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
      await expect(provider.complete('Hello')).rejects.toThrow('Failed to complete request');
    });

    it('should send correct request structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 10 },
        }),
      });

      const provider = new LMStudioProvider();

      await provider.complete('Test prompt');

      const completionCall = mockFetch.mock.calls[1];
      const url = completionCall![0] as string;
      const body = JSON.parse(completionCall![1].body);

      // Verify URL
      expect(url).toBe('http://localhost:1234/v1/chat/completions');

      // Verify request body (OpenAI-compatible format)
      expect(body.messages).toEqual([{ role: 'user', content: 'Test prompt' }]);
      expect(body.temperature).toBe(0.7); // Default
      expect(body.max_tokens).toBe(1000); // Default
      expect(body.model).toBe('local-model'); // Default
    });

    it('should estimate tokens when usage is not provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Short response' } }],
          // No usage field
        }),
      });

      const provider = new LMStudioProvider();

      const result = await provider.complete('Hello');

      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should use custom base URL when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { total_tokens: 10 },
        }),
      });

      const provider = new LMStudioProvider({
        baseUrl: 'http://localhost:5000/v1',
      });

      await provider.complete('Hello');

      const completionCall = mockFetch.mock.calls[1];
      const url = completionCall![0] as string;

      expect(url).toBe('http://localhost:5000/v1/chat/completions');
    });
  });

  describe('estimateCost', () => {
    it('should return 0 for any prompt (local models are free)', () => {
      const provider = new LMStudioProvider();

      expect(provider.estimateCost('Short prompt')).toBe(0);
      expect(provider.estimateCost('This is a much longer prompt that would cost money on cloud providers')).toBe(0);
    });
  });
});
