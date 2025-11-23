import { BaseProvider } from '../base.js';
import type { ProviderConfig, CompletionOptions, CompletionResult } from '../../utils/types.js';
import { ProviderUnavailableError } from '../../utils/errors.js';

/**
 * Anthropic provider implementation
 *
 * Provides access to Claude models via the Anthropic Messages API
 */
export class AnthropicProvider extends BaseProvider {
  name = 'anthropic';
  type = 'cloud' as const;

  private apiKey: string;
  private baseUrl: string;
  private models: string[];

  constructor(config: ProviderConfig) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    this.models = config.models || ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022'];
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    if (!await this.isAvailable()) {
      throw new ProviderUnavailableError(
        'anthropic',
        'API key is missing or invalid'
      );
    }

    const model = options?.model || this.models[0]!;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 1000;

    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
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
          'anthropic',
          `API error (${response.status}): ${errorText}`
        );
      }

      const data = await response.json() as {
        content?: Array<{ text?: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
      };

      const text = data.content?.[0]?.text || '';
      const inputTokens = data.usage?.input_tokens || 0;
      const outputTokens = data.usage?.output_tokens || 0;
      const tokens = inputTokens + outputTokens;
      const cost = this.calculateCost(inputTokens, outputTokens, model);

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
        'anthropic',
        `Failed to complete request: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  estimateCost(prompt: string): number {
    const tokens = this.estimateTokens(prompt);
    const model = this.models[0]!;
    // Rough estimate: assume 2x for output
    return this.calculateCost(tokens, tokens, model);
  }

  /**
   * Calculate cost based on Anthropic pricing (as of 2025)
   * Prices per 1M tokens
   */
  private calculateCost(inputTokens: number, outputTokens: number, model: string): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
      'claude-3-5-haiku-20241022': { input: 0.80, output: 4.00 },
      'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
      'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
      'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    };

    const rate = pricing[model] || pricing['claude-3-5-haiku-20241022']!;

    const cost = (
      (inputTokens * rate.input) +
      (outputTokens * rate.output)
    ) / 1_000_000;

    return cost;
  }
}
