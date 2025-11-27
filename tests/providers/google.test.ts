import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleProvider } from '../../src/providers/cloud/google.js';
import { ProviderUnavailableError } from '../../src/utils/errors.js';

describe('GoogleProvider', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      const provider = new GoogleProvider({
        apiKey: 'test-google-key',
      });

      expect(provider.name).toBe('google');
      expect(provider.type).toBe('cloud');
    });

    it('should use default base URL when not provided', () => {
      const provider = new GoogleProvider({
        apiKey: 'test-key',
      });

      expect(provider).toBeDefined();
    });

    it('should use custom base URL when provided', () => {
      const provider = new GoogleProvider({
        apiKey: 'test-key',
        baseUrl: 'https://custom.googleapis.com/v1',
      });

      expect(provider).toBeDefined();
    });

    it('should use default models when not provided', () => {
      const provider = new GoogleProvider({
        apiKey: 'test-key',
      });

      expect(provider).toBeDefined();
    });

    it('should use custom models when provided', () => {
      const provider = new GoogleProvider({
        apiKey: 'test-key',
        models: ['gemini-1.5-pro', 'gemini-1.0-pro'],
      });

      expect(provider).toBeDefined();
    });
  });

  describe('isAvailable', () => {
    it('should return true when API key is provided', async () => {
      const provider = new GoogleProvider({
        apiKey: 'test-key',
      });

      expect(await provider.isAvailable()).toBe(true);
    });

    it('should return false when API key is empty', async () => {
      const provider = new GoogleProvider({
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
          candidates: [{
            content: {
              parts: [{ text: 'Hello! How can I help you today?' }]
            }
          }],
          usageMetadata: {
            promptTokenCount: 5,
            candidatesTokenCount: 10,
            totalTokenCount: 15,
          },
        }),
      });

      const provider = new GoogleProvider({
        apiKey: 'test-key',
      });

      const result = await provider.complete('Hello');

      expect(result.text).toBe('Hello! How can I help you today?');
      expect(result.tokens).toBe(15);
      expect(result.provider).toBe('google');
      expect(result.cached).toBe(false);
      expect(result.cost).toBeGreaterThan(0);
    });

    it('should throw error when API key is missing', async () => {
      const provider = new GoogleProvider({
        apiKey: '',
      });

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
      await expect(provider.complete('Hello')).rejects.toThrow('API key is missing or invalid');
    });

    it('should use custom model when provided in options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Response' }]
            }
          }],
          usageMetadata: { totalTokenCount: 10 },
        }),
      });

      const provider = new GoogleProvider({
        apiKey: 'test-key',
      });

      await provider.complete('Hello', { model: 'gemini-1.5-pro' });

      const fetchCall = mockFetch.mock.calls[0];
      const url = fetchCall![0] as string;

      expect(url).toContain('gemini-1.5-pro');
    });

    it('should use custom temperature when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Response' }]
            }
          }],
          usageMetadata: { totalTokenCount: 10 },
        }),
      });

      const provider = new GoogleProvider({
        apiKey: 'test-key',
      });

      await provider.complete('Hello', { temperature: 0.5 });

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall![1].body);

      expect(body.generationConfig.temperature).toBe(0.5);
    });

    it('should use custom maxTokens when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Response' }]
            }
          }],
          usageMetadata: { totalTokenCount: 10 },
        }),
      });

      const provider = new GoogleProvider({
        apiKey: 'test-key',
      });

      await provider.complete('Hello', { maxTokens: 500 });

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall![1].body);

      expect(body.generationConfig.maxOutputTokens).toBe(500);
    });

    it('should handle API errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Invalid API key',
      });

      const provider = new GoogleProvider({
        apiKey: 'invalid-key',
      });

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
      await expect(provider.complete('Hello')).rejects.toThrow('API error (401)');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network timeout'));

      const provider = new GoogleProvider({
        apiKey: 'test-key',
      });

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
      await expect(provider.complete('Hello')).rejects.toThrow('Failed to complete request');
    });

    it('should send correct request structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Response' }]
            }
          }],
          usageMetadata: { totalTokenCount: 10 },
        }),
      });

      const provider = new GoogleProvider({
        apiKey: 'test-key',
      });

      await provider.complete('Test prompt');

      const fetchCall = mockFetch.mock.calls[0];
      const url = fetchCall![0] as string;
      const body = JSON.parse(fetchCall![1].body);

      // Verify URL contains API key
      expect(url).toContain('key=test-key');
      expect(url).toContain('gemini-2.5-flash'); // Default model
      expect(url).toContain('generateContent');

      // Verify request body
      expect(body.contents).toEqual([{
        parts: [{ text: 'Test prompt' }]
      }]);
      expect(body.generationConfig.temperature).toBe(0.7); // Default
      expect(body.generationConfig.maxOutputTokens).toBe(1000); // Default
    });

    it('should use custom base URL when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Response' }]
            }
          }],
          usageMetadata: { totalTokenCount: 10 },
        }),
      });

      const provider = new GoogleProvider({
        apiKey: 'test-key',
        baseUrl: 'https://custom.googleapis.com/v1',
      });

      await provider.complete('Hello');

      const fetchCall = mockFetch.mock.calls[0];
      const url = fetchCall![0] as string;

      expect(url).toContain('https://custom.googleapis.com/v1');
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost for a prompt', () => {
      const provider = new GoogleProvider({
        apiKey: 'test-key',
      });

      const cost = provider.estimateCost('Hello, this is a test prompt!');

      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should return higher cost for longer prompts', () => {
      const provider = new GoogleProvider({
        apiKey: 'test-key',
      });

      const shortCost = provider.estimateCost('Hi');
      const longCost = provider.estimateCost('This is a much longer prompt that should cost more to process');

      expect(longCost).toBeGreaterThan(shortCost);
    });
  });
});
