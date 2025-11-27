import { BaseProvider } from '../base.js';
import type { ProviderConfig, CompletionOptions, CompletionResult } from '../../utils/types.js';
import { ProviderUnavailableError } from '../../utils/errors.js';

/**
 * Pricing configuration for a model
 */
export interface ModelPricing {
  input: number;  // Price per 1M input tokens
  output: number; // Price per 1M output tokens
}

/**
 * Configuration for OpenAI-compatible providers
 */
export interface OpenAICompatibleConfig {
  name: string;
  defaultBaseUrl: string;
  defaultModels: string[];
  pricing: Record<string, ModelPricing>;
  defaultPricing: ModelPricing;
  authHeader?: 'Authorization' | 'x-api-key';
  authPrefix?: string;
  extraHeaders?: Record<string, string>;
}

/**
 * Base class for OpenAI-compatible API providers
 *
 * Many AI providers (xAI, DeepSeek, Mistral, Together AI) use OpenAI-compatible
 * APIs. This base class reduces duplication by providing common functionality.
 *
 * Subclasses only need to define:
 * - Provider name
 * - Default base URL
 * - Default models
 * - Pricing table
 */
export abstract class OpenAICompatibleProvider extends BaseProvider {
  abstract name: string;
  type = 'cloud' as const;

  protected apiKey: string;
  protected baseUrl: string;
  protected models: string[];
  protected providerConfig: OpenAICompatibleConfig;

  constructor(config: ProviderConfig, providerConfig: OpenAICompatibleConfig) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || providerConfig.defaultBaseUrl;
    this.models = config.models || providerConfig.defaultModels;
    this.providerConfig = providerConfig;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    if (!await this.isAvailable()) {
      throw new ProviderUnavailableError(
        this.name,
        'API key is missing or invalid'
      );
    }

    const model = options?.model || this.models[0]!;
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 1000;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...this.providerConfig.extraHeaders,
      };

      // Handle authentication header
      const authHeader = this.providerConfig.authHeader || 'Authorization';
      const authPrefix = this.providerConfig.authPrefix ?? 'Bearer ';
      headers[authHeader] = `${authPrefix}${this.apiKey}`;

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
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
          this.name,
          `API error (${response.status}): ${errorText}`
        );
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: {
          total_tokens?: number;
          prompt_tokens?: number;
          completion_tokens?: number;
        };
      };

      const text = data.choices?.[0]?.message?.content || '';
      const inputTokens = data.usage?.prompt_tokens || this.estimateTokens(prompt);
      const outputTokens = data.usage?.completion_tokens || this.estimateTokens(text);
      const tokens = data.usage?.total_tokens || (inputTokens + outputTokens);
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
        this.name,
        `Failed to complete request: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  estimateCost(prompt: string): number {
    const tokens = this.estimateTokens(prompt);
    const model = this.models[0]!;
    // Rough estimate: assume output is same length as input
    return this.calculateCost(tokens, tokens, model);
  }

  /**
   * Calculate cost based on provider pricing
   */
  protected calculateCost(inputTokens: number, outputTokens: number, model: string): number {
    const pricing = this.providerConfig.pricing[model] || this.providerConfig.defaultPricing;

    const cost = (
      (inputTokens * pricing.input) +
      (outputTokens * pricing.output)
    ) / 1_000_000;

    return cost;
  }
}
