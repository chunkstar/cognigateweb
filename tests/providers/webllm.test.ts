import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebLLMProvider } from '../../src/providers/local/webllm.js';
import { ProviderUnavailableError } from '../../src/utils/errors.js';

describe('WebLLMProvider', () => {
  beforeEach(() => {
    // Mock browser environment using vi.stubGlobal
    vi.stubGlobal('window', {});
    vi.stubGlobal('navigator', {
      gpu: {},
    });
  });

  afterEach(() => {
    // Restore original globals
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with default configuration', () => {
      const provider = new WebLLMProvider();

      expect(provider.name).toBe('webllm');
      expect(provider.type).toBe('local');
    });

    it('should use default models when not provided', () => {
      const provider = new WebLLMProvider();

      expect(provider).toBeDefined();
    });

    it('should use custom models when provided', () => {
      const provider = new WebLLMProvider({
        models: ['Llama-3.1-70B-Instruct', 'Phi-3.5-mini'],
      });

      expect(provider).toBeDefined();
    });
  });

  describe('isAvailable', () => {
    it('should return true when in browser with WebGPU support', async () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { gpu: {} });

      const provider = new WebLLMProvider();

      expect(await provider.isAvailable()).toBe(true);
    });

    it('should return false when window is undefined (Node.js)', async () => {
      vi.stubGlobal('window', undefined);

      const provider = new WebLLMProvider();

      expect(await provider.isAvailable()).toBe(false);
    });

    it('should return false when navigator is undefined', async () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', undefined);

      const provider = new WebLLMProvider();

      expect(await provider.isAvailable()).toBe(false);
    });

    it('should return false when WebGPU is not supported', async () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', {}); // No gpu property

      const provider = new WebLLMProvider();

      expect(await provider.isAvailable()).toBe(false);
    });
  });

  describe('complete', () => {
    it('should throw error when not in browser environment', async () => {
      vi.stubGlobal('window', undefined);

      const provider = new WebLLMProvider();

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
      await expect(provider.complete('Hello')).rejects.toThrow('only available in browser environments');
    });

    it('should successfully complete a prompt in browser', async () => {
      // Mock browser environment
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { gpu: {} });

      // Mock WebLLM module
      const mockEngine = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{
                message: { content: 'Hello! How can I help you?' }
              }],
              usage: { total_tokens: 15 },
            }),
          },
        },
        unload: vi.fn(),
      };

      const mockCreateMLCEngine = vi.fn().mockResolvedValue(mockEngine);

      // Mock dynamic import
      vi.doMock('@mlc-ai/web-llm', () => ({
        CreateMLCEngine: mockCreateMLCEngine,
      }));

      const provider = new WebLLMProvider();

      const result = await provider.complete('Hello');

      expect(result.text).toBe('Hello! How can I help you?');
      expect(result.tokens).toBe(15);
      expect(result.provider).toBe('webllm');
      expect(result.cached).toBe(false);
      expect(result.cost).toBe(0); // Browser models are free
    });

    it('should use custom model when provided in options', async () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { gpu: {} });

      const mockEngine = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: 'Response' } }],
              usage: { total_tokens: 10 },
            }),
          },
        },
        unload: vi.fn(),
      };

      const mockCreateMLCEngine = vi.fn().mockResolvedValue(mockEngine);

      vi.doMock('@mlc-ai/web-llm', () => ({
        CreateMLCEngine: mockCreateMLCEngine,
      }));

      const provider = new WebLLMProvider();

      await provider.complete('Hello', { model: 'Llama-3.1-70B-Instruct' });

      // Verify the model was used in CreateMLCEngine
      expect(mockCreateMLCEngine).toHaveBeenCalledWith('Llama-3.1-70B-Instruct');
    });

    it('should use custom temperature when provided', async () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { gpu: {} });

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        usage: { total_tokens: 10 },
      });

      const mockEngine = {
        chat: {
          completions: {
            create: mockCreate,
          },
        },
        unload: vi.fn(),
      };

      const mockCreateMLCEngine = vi.fn().mockResolvedValue(mockEngine);

      vi.doMock('@mlc-ai/web-llm', () => ({
        CreateMLCEngine: mockCreateMLCEngine,
      }));

      const provider = new WebLLMProvider();

      await provider.complete('Hello', { temperature: 0.5 });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.5,
        })
      );
    });

    it('should use custom maxTokens when provided', async () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { gpu: {} });

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        usage: { total_tokens: 10 },
      });

      const mockEngine = {
        chat: {
          completions: {
            create: mockCreate,
          },
        },
        unload: vi.fn(),
      };

      const mockCreateMLCEngine = vi.fn().mockResolvedValue(mockEngine);

      vi.doMock('@mlc-ai/web-llm', () => ({
        CreateMLCEngine: mockCreateMLCEngine,
      }));

      const provider = new WebLLMProvider();

      await provider.complete('Hello', { maxTokens: 500 });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 500,
        })
      );
    });

    it('should estimate tokens when usage is not provided', async () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { gpu: {} });

      const mockEngine = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: 'Short response' } }],
              // No usage field
            }),
          },
        },
        unload: vi.fn(),
      };

      const mockCreateMLCEngine = vi.fn().mockResolvedValue(mockEngine);

      vi.doMock('@mlc-ai/web-llm', () => ({
        CreateMLCEngine: mockCreateMLCEngine,
      }));

      const provider = new WebLLMProvider();

      const result = await provider.complete('Hello');

      expect(result.tokens).toBeGreaterThan(0);
    });

    it('should handle completion errors', async () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { gpu: {} });

      const mockEngine = {
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('Model loading failed')),
          },
        },
        unload: vi.fn(),
      };

      const mockCreateMLCEngine = vi.fn().mockResolvedValue(mockEngine);

      vi.doMock('@mlc-ai/web-llm', () => ({
        CreateMLCEngine: mockCreateMLCEngine,
      }));

      const provider = new WebLLMProvider();

      await expect(provider.complete('Hello')).rejects.toThrow(ProviderUnavailableError);
      await expect(provider.complete('Hello')).rejects.toThrow('Failed to complete request');
    });

    it('should send correct request structure', async () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { gpu: {} });

      const mockCreate = vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'Response' } }],
        usage: { total_tokens: 10 },
      });

      const mockEngine = {
        chat: {
          completions: {
            create: mockCreate,
          },
        },
        unload: vi.fn(),
      };

      const mockCreateMLCEngine = vi.fn().mockResolvedValue(mockEngine);

      vi.doMock('@mlc-ai/web-llm', () => ({
        CreateMLCEngine: mockCreateMLCEngine,
      }));

      const provider = new WebLLMProvider();

      await provider.complete('Test prompt');

      // Verify request structure (OpenAI-compatible)
      expect(mockCreate).toHaveBeenCalledWith({
        messages: [{ role: 'user', content: 'Test prompt' }],
        temperature: 0.7, // Default
        max_tokens: 1000, // Default
        stream: false,
      });
    });
  });

  describe('estimateCost', () => {
    it('should return 0 for any prompt (browser models are free)', () => {
      const provider = new WebLLMProvider();

      expect(provider.estimateCost('Short prompt')).toBe(0);
      expect(provider.estimateCost('This is a much longer prompt that would cost money on cloud providers')).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should unload engine when cleanup is called', async () => {
      vi.stubGlobal('window', {});
      vi.stubGlobal('navigator', { gpu: {} });

      const mockUnload = vi.fn().mockResolvedValue(undefined);

      const mockEngine = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: 'Response' } }],
              usage: { total_tokens: 10 },
            }),
          },
        },
        unload: mockUnload,
      };

      const mockCreateMLCEngine = vi.fn().mockResolvedValue(mockEngine);

      vi.doMock('@mlc-ai/web-llm', () => ({
        CreateMLCEngine: mockCreateMLCEngine,
      }));

      const provider = new WebLLMProvider();

      // Complete a request to initialize engine
      await provider.complete('Hello');

      // Cleanup
      await provider.cleanup();

      expect(mockUnload).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const provider = new WebLLMProvider();

      // Cleanup without engine should not throw
      await expect(provider.cleanup()).resolves.not.toThrow();
    });
  });
});
