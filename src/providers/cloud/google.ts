import { BaseProvider } from '../base.js';
import type { ProviderConfig, CompletionOptions, CompletionResult } from '../../utils/types.js';
import { ProviderUnavailableError } from '../../utils/errors.js';

/**
 * Google Gemini provider implementation
 *
 * Provides access to Gemini models via the Google AI API
 * @see https://ai.google.dev/docs
 */
export class GoogleProvider extends BaseProvider {
  name = 'google';
  type = 'cloud' as const;

  private apiKey: string;
  private baseUrl: string;
  private models: string[];

  constructor(config: ProviderConfig) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    this.models = config.models || ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    if (!await this.isAvailable()) {
      throw new ProviderUnavailableError(
        'google',
        'API key is missing or invalid'
      );
    }

    const model = options?.model || this.models[0]!;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 1000;

    try {
      // Google uses a different endpoint format with API key in URL
      const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderUnavailableError(
          'google',
          `API error (${response.status}): ${errorText}`
        );
      }

      const data = await response.json() as {
        candidates?: Array<{
          content?: {
            parts?: Array<{ text?: string }>;
          };
        }>;
        usageMetadata?: {
          promptTokenCount?: number;
          candidatesTokenCount?: number;
          totalTokenCount?: number;
        };
      };

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const tokens = data.usageMetadata?.totalTokenCount || 0;
      const cost = this.calculateCost(
        data.usageMetadata?.promptTokenCount || 0,
        data.usageMetadata?.candidatesTokenCount || 0,
        model
      );

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
        'google',
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
   * Calculate cost based on Google Gemini pricing (as of 2025)
   * Prices per 1M tokens
   */
  private calculateCost(inputTokens: number, outputTokens: number, model: string): number {
    const pricing: Record<string, { input: number; output: number }> = {
      'gemini-2.5-flash': { input: 0.075, output: 0.30 },
      'gemini-2.5-pro': { input: 1.25, output: 5.00 },
      'gemini-2.0-flash': { input: 0.075, output: 0.30 },
      'gemini-1.5-flash': { input: 0.075, output: 0.30 },
      'gemini-1.5-pro': { input: 1.25, output: 5.00 },
      'gemini-1.0-pro': { input: 0.50, output: 1.50 },
    };

    const rate = pricing[model] || pricing['gemini-2.5-flash']!;

    const cost = (
      (inputTokens * rate.input) +
      (outputTokens * rate.output)
    ) / 1_000_000;

    return cost;
  }
}
