import { BaseProvider } from '../base.js';
import type { ProviderConfig, CompletionOptions, CompletionResult } from '../../utils/types.js';
import { ProviderUnavailableError } from '../../utils/errors.js';

/**
 * WebLLM provider implementation
 *
 * Provides access to browser-based LLMs via WebLLM (requires WebGPU)
 * Note: This provider only works in browser environments with WebGPU support
 * @see https://webllm.mlc.ai/
 */
export class WebLLMProvider extends BaseProvider {
  name = 'webllm';
  type = 'local' as const;

  private models: string[];
  private engine: any = null; // Will be MLCEngine instance in browser

  constructor(config: Partial<ProviderConfig> = {}) {
    super();
    // WebLLM doesn't require an API key (it's browser-based)
    this.models = config.models || ['Llama-3.1-8B-Instruct-q4f32_1-MLC'];
  }

  /**
   * Check if WebLLM is available (requires browser environment with WebGPU)
   */
  async isAvailable(): Promise<boolean> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    // Check if WebGPU is available
    if (!('gpu' in navigator)) {
      return false;
    }

    return true;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    if (!await this.isAvailable()) {
      throw new ProviderUnavailableError(
        'webllm',
        'WebLLM is only available in browser environments with WebGPU support. ' +
        'This provider cannot run in Node.js or non-WebGPU browsers.'
      );
    }

    const model = options?.model || this.models[0]!;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 1000;

    try {
      // Initialize engine if not already done
      if (!this.engine) {
        // Dynamic import for browser-only code
        // In a real browser environment, this would import @mlc-ai/web-llm
        const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
        this.engine = await CreateMLCEngine(model);
      }

      // WebLLM uses OpenAI-compatible chat completion API
      const response = await this.engine.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens: maxTokens,
        stream: false,
      });

      const text = response.choices?.[0]?.message?.content || '';
      const tokens = response.usage?.total_tokens || this.estimateTokens(prompt + text);

      // Browser-based models are free!
      const cost = 0;

      return {
        text,
        tokens,
        cost,
        provider: this.name,
        cached: false,
      };
    } catch (error) {
      if (error instanceof ProviderUnavailableError) {
        throw error;
      }

      throw new ProviderUnavailableError(
        'webllm',
        `Failed to complete request: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  estimateCost(prompt: string): number {
    // Browser-based models are always free
    return 0;
  }

  /**
   * Clean up resources when done
   */
  async cleanup(): Promise<void> {
    if (this.engine) {
      try {
        await this.engine.unload();
        this.engine = null;
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }
}
