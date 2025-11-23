import { BaseProvider } from '../base.js';
import type { ProviderConfig, CompletionOptions, CompletionResult } from '../../utils/types.js';
import { ProviderUnavailableError } from '../../utils/errors.js';

/**
 * Ollama provider implementation
 *
 * Provides access to local LLMs via Ollama
 * @see https://ollama.ai/
 */
export class OllamaProvider extends BaseProvider {
  name = 'ollama';
  type = 'local' as const;

  private baseUrl: string;
  private models: string[];

  constructor(config: Partial<ProviderConfig> = {}) {
    super();
    // Ollama doesn't require an API key (it's local)
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.models = config.models || ['llama2', 'codellama', 'mistral'];
  }

  /**
   * Check if Ollama is available by pinging the health endpoint
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      // Ollama is not running or not accessible
      return false;
    }
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    if (!await this.isAvailable()) {
      throw new ProviderUnavailableError(
        'ollama',
        'Ollama is not available. Make sure Ollama is installed and running at ' + this.baseUrl
      );
    }

    const model = options?.model || this.models[0]!;
    const temperature = options?.temperature ?? 0.7;

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt,
          temperature,
          stream: false, // We want the complete response at once
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderUnavailableError(
          'ollama',
          `API error (${response.status}): ${errorText}`
        );
      }

      const data = await response.json() as {
        response?: string;
        context?: number[];
        done?: boolean;
      };

      const text = data.response || '';

      // Ollama doesn't return token counts in non-streaming mode,
      // so we estimate based on text length
      const tokens = this.estimateTokens(prompt + text);

      // Local models are free!
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
        'ollama',
        `Failed to complete request: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  estimateCost(prompt: string): number {
    // Local models are always free
    return 0;
  }
}
