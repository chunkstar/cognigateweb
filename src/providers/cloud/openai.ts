import { BaseProvider } from '../base.js';
import type { ProviderConfig, CompletionOptions, CompletionResult } from '../../utils/types.js';
import { ProviderUnavailableError } from '../../utils/errors.js';

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider extends BaseProvider {
  name = 'openai';
  type = 'cloud' as const;

  private apiKey: string;
  private baseUrl: string;
  private models: string[];

  constructor(config: ProviderConfig) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    this.models = config.models || ['gpt-4o-mini', 'gpt-4o'];
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    if (!await this.isAvailable()) {
      throw new ProviderUnavailableError(
        'openai',
        'API key is missing or invalid'
      );
    }

    const model = options?.model || this.models[0]!;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 1000;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
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
          'openai',
          `API error (${response.status}): ${errorText}`
        );
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { total_tokens?: number };
      };

      const text = data.choices?.[0]?.message?.content || '';
      const tokens = data.usage?.total_tokens || this.estimateTokens(prompt + text);
      const cost = this.calculateCost(tokens, model);

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
        'openai',
        `Failed to complete request: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  estimateCost(prompt: string): number {
    const tokens = this.estimateTokens(prompt);
    const model = this.models[0]!;
    return this.calculateCost(tokens * 2, model); // Rough estimate: 2x for input+output
  }

  /**
   * Calculate cost based on OpenAI pricing (as of 2025)
   * Prices per 1M tokens
   */
  private calculateCost(tokens: number, model: string): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o-mini': { input: 0.15, output: 0.60 },
      'gpt-4o': { input: 2.50, output: 10.00 },
      'gpt-4-turbo': { input: 10.00, output: 30.00 },
      'gpt-4': { input: 30.00, output: 60.00 },
    };

    const rate = pricing[model] || pricing['gpt-4o-mini']!;

    // Assume 50/50 split between input and output tokens
    const inputTokens = tokens / 2;
    const outputTokens = tokens / 2;

    const cost = (
      (inputTokens * rate.input) +
      (outputTokens * rate.output)
    ) / 1_000_000;

    return cost;
  }
}
