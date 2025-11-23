import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OllamaProvider } from '../../src/providers/local/ollama.js';
import { ProviderUnavailableError } from '../../src/utils/errors.js';

describe('OllamaProvider', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with no config', () => {
      const provider = new OllamaProvider();

      expect(provider.name).toBe('ollama');
      expect(provider.type).toBe('local');
    });

    it('should use default base URL when not provided', () => {
      const provider = new OllamaProvider();

      expect(provider).toBeDefined();
    });

    it('should use custom base URL when provided', () => {
      const provider = new OllamaProvider({
        baseUrl: 'http://custom-ollama:11434',
      });

      expect(provider).toBeDefined();
    });

    it('should use default models when not provided', () => {
      const provider = new OllamaProvider();

      expect(provider).toBeDefined();
    });

    it('should use custom models when provided', () => {
      const provider = new OllamaProvider({
        models: ['llama3', 'mixtral'],
      });

      expect(provider).toBeDefined();
    });

    it('should not require API key', () => {
      const provider = new OllamaProvider();

      expect(provider).toBeDefined();
    });
  });

  describe('isAvailable', () => {
    it('should return true when Ollama is running', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      });

      const provider = new OllamaProvider();

      expect(await provider.isAvailable()).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/tags',
        { method: 'GET' }
      );
    });

    it('should return false when Ollama is not running', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const provider = new OllamaProvider();

      expect(await provider.isAvailable()).toBe(false);
    });

    it('should return false when Ollama endpoint returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const provider = new OllamaProvider();

      expect(await provider.isAvailable()).toBe(false);
    });
  });

  describe('complete', () => {
    it('should successfully complete a prompt', async () => {
      // Mock isAvailable check
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      });

      // Mock completion request
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'This is a response from Ollama!',
          done: true,
        }),
      });

      const provider = new OllamaProvider();

      const result = await provider.complete('Hello');

      expect(result.text).toBe('This is a response from Ollama!');
      expect(result.tokens).toBeGreaterThan(0);
      expect(result.provider).toBe('ollama');
      expect(result.cached).toBe(false);
      expect(result.cost).toBe(0); // Local is free!
    });

    it('should throw error when Ollama is not available', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection refused'));

      const provider = new OllamaProvider();

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
      await expect(provider.complete('Hello')).rejects.toThrow(
        'Ollama is not available'
      );
    });

    it('should use custom model when provided in options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Response',
          done: true,
        }),
      });

      const provider = new OllamaProvider();

      await provider.complete('Hello', { model: 'llama3' });

      const fetchCall = mockFetch.mock.calls[1];
      const body = JSON.parse(fetchCall![1].body);

      expect(body.model).toBe('llama3');
    });

    it('should use custom temperature when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Response',
          done: true,
        }),
      });

      const provider = new OllamaProvider();

      await provider.complete('Hello', { temperature: 0.5 });

      const fetchCall = mockFetch.mock.calls[1];
      const body = JSON.parse(fetchCall![1].body);

      expect(body.temperature).toBe(0.5);
    });

    it('should handle API errors', async () => {
      // First call: isAvailable check (success)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      });

      // Second call: completion request (error)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Model not found',
      });

      const provider = new OllamaProvider();

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);

      // Reset mocks for second test
      mockFetch.mockClear();

      // Third call: isAvailable check (success)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      });

      // Fourth call: completion request (error)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Model not found',
      });

      await expect(provider.complete('Hello')).rejects.toThrow('API error (404)');
    });

    it('should handle network errors', async () => {
      // First call: isAvailable check (success)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      });

      // Second call: completion request (network error)
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      const provider = new OllamaProvider();

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);

      // Reset mocks for second test
      mockFetch.mockClear();

      // Third call: isAvailable check (success)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      });

      // Fourth call: completion request (network error)
      mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

      await expect(provider.complete('Hello')).rejects.toThrow('Failed to complete request');
    });

    it('should send correct request structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Response',
          done: true,
        }),
      });

      const provider = new OllamaProvider();

      await provider.complete('Test prompt');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:11434/api/generate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.any(String),
        }
      );

      const fetchCall = mockFetch.mock.calls[1];
      const body = JSON.parse(fetchCall![1].body);

      expect(body.prompt).toBe('Test prompt');
      expect(body.model).toBe('llama2'); // Default model
      expect(body.temperature).toBe(0.7); // Default temperature
      expect(body.stream).toBe(false); // No streaming
    });

    it('should use custom base URL when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ models: [] }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: 'Response',
          done: true,
        }),
      });

      const provider = new OllamaProvider({
        baseUrl: 'http://custom-ollama:11434',
      });

      await provider.complete('Hello');

      // Check isAvailable call
      expect(mockFetch).toHaveBeenCalledWith(
        'http://custom-ollama:11434/api/tags',
        expect.any(Object)
      );

      // Check complete call
      expect(mockFetch).toHaveBeenCalledWith(
        'http://custom-ollama:11434/api/generate',
        expect.any(Object)
      );
    });
  });

  describe('estimateCost', () => {
    it('should always return 0 for local models', () => {
      const provider = new OllamaProvider();

      const cost = provider.estimateCost('Hello, this is a test prompt!');

      expect(cost).toBe(0); // Local models are free!
    });

    it('should return 0 for any prompt length', () => {
      const provider = new OllamaProvider();

      const shortCost = provider.estimateCost('Hi');
      const longCost = provider.estimateCost('This is a much longer prompt'.repeat(100));

      expect(shortCost).toBe(0);
      expect(longCost).toBe(0);
    });
  });
});
