import { BaseProvider } from '../base.js';
import type { ProviderConfig, CompletionOptions, CompletionResult } from '../../utils/types.js';
import { ProviderUnavailableError } from '../../utils/errors.js';

/**
 * LM Studio provider implementation
 *
 * Provides access to local LLMs via LM Studio's OpenAI-compatible API
 * @see https://lmstudio.ai/
 */
export class LMStudioProvider extends BaseProvider {
  name = 'lmstudio';
  type = 'local' as const;

  private baseUrl: string;
  private models: string[];

  constructor(config: Partial<ProviderConfig> = {}) {
    super();
    // LM Studio doesn't require an API key (it's local)
    this.baseUrl = config.baseUrl || 'http://localhost:1234/v1';
    this.models = config.models || ['local-model']; // LM Studio auto-detects loaded model
  }

  /**
   * Check if LM Studio is available by pinging the models endpoint
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
      });
      return response.ok;
    } catch {
      // LM Studio is not running or not accessible
      return false;
    }
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    if (!await this.isAvailable()) {
      throw new ProviderUnavailableError(
        'lmstudio',
        'LM Studio is not available. Make sure LM Studio is installed and running at ' + this.baseUrl
      );
    }

    const model = options?.model || this.models[0]!;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 1000;

    try {
      // LM Studio uses OpenAI-compatible API format
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderUnavailableError(
          'lmstudio',
          `API error (${response.status}): ${errorText}`
        );
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { total_tokens?: number };
      };

      const text = data.choices?.[0]?.message?.content || '';
      const tokens = data.usage?.total_tokens || this.estimateTokens(prompt + text);

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
        'lmstudio',
        `Failed to complete request: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  estimateCost(prompt: string): number {
    // Local models are always free
    return 0;
  }
}
