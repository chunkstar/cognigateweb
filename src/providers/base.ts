import type { Provider, CompletionOptions, CompletionResult } from '../utils/types.js';

/**
 * Base class for all providers
 */
export abstract class BaseProvider implements Provider {
  abstract name: string;
  abstract type: 'cloud' | 'local';

  /**
   * Check if provider is available
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Complete a prompt
   */
  abstract complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;

  /**
   * Stream a completion response token-by-token
   *
   * Default implementation simulates streaming by chunking the complete() response.
   * Providers with native streaming support should override this method.
   *
   * @param prompt - The text prompt to complete
   * @param options - Optional completion options
   * @returns Async iterator yielding response tokens
   */
  async *stream(prompt: string, options?: CompletionOptions): AsyncIterable<string> {
    // Get the complete response
    const result = await this.complete(prompt, options);

    // Chunk the response to simulate streaming
    // Use smaller chunks (~5 chars) to simulate token-level streaming
    const chunkSize = 5;
    const text = result.text;

    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize);
      yield chunk;

      // Add small delay to simulate network latency (< 50ms as per requirements)
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  /**
   * Estimate cost for a prompt
   */
  abstract estimateCost(prompt: string): number;

  /**
   * Estimate token count for text
   * Rough estimate: 1 token ≈ 4 characters
   */
  protected estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
