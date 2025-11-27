import type {
  GatewayConfig,
  CompletionOptions,
  BudgetStatus,
  Provider,
} from '../utils/types.js';
import { ConfigurationError, ProviderUnavailableError } from '../utils/errors.js';
import { OpenAIProvider } from '../providers/cloud/openai.js';
import { AnthropicProvider } from '../providers/cloud/anthropic.js';
import { GoogleProvider } from '../providers/cloud/google.js';
import { XAIProvider } from '../providers/cloud/xai.js';
import { DeepSeekProvider } from '../providers/cloud/deepseek.js';
import { MistralProvider } from '../providers/cloud/mistral.js';
import { TogetherProvider } from '../providers/cloud/together.js';
import { OllamaProvider } from '../providers/local/ollama.js';
import { LMStudioProvider } from '../providers/local/lmstudio.js';
import { WebLLMProvider } from '../providers/local/webllm.js';
import { BudgetManager } from './budget-manager.js';
import { CacheManager } from './cache-manager.js';
import { Compressor } from './compressor.js';
import { AlertManager } from './alert-manager.js';
import { WebhookManager } from '../webhooks/webhook-manager.js';
import type { AlertPayload } from '../webhooks/types.js';

/**
 * Main Gateway class for Cognigate
 *
 * Handles AI completions with budget controls, caching, and provider management.
 */
export class Gateway {
  private config: Required<GatewayConfig>;
  private providers: Provider[] = [];
  private budgetManager: BudgetManager;
  private cacheManager: CacheManager;
  private alertManager: AlertManager;
  private webhookManager: WebhookManager;

  constructor(config: GatewayConfig = {}) {
    // Validate and set defaults
    this.config = this.validateAndSetDefaults(config);

    // Initialize alert manager
    this.alertManager = new AlertManager();

    // Initialize budget manager with alert manager
    this.budgetManager = new BudgetManager(this.config.dailyBudget, this.alertManager);

    // Initialize cache manager
    this.cacheManager = new CacheManager({
      enabled: this.config.cacheEnabled,
      semanticCaching: this.config.semanticCaching,
      similarityThreshold: this.config.similarityThreshold,
    });

    // Initialize webhook manager
    this.webhookManager = new WebhookManager(this.config.webhooks);

    // Connect alert manager to webhook manager
    this.alertManager.on('alert', (payload: AlertPayload) => {
      this.webhookManager.sendAlert(payload).catch(error => {
        console.error('Failed to send webhook alert:', error);
      });
    });

    // Initialize providers
    this.initializeProviders();
  }

  /**
   * Initialize providers based on configuration
   */
  private initializeProviders(): void {
    // Initialize cloud providers
    if (this.config.cloudProviders.openai) {
      this.providers.push(new OpenAIProvider(this.config.cloudProviders.openai));
    }

    if (this.config.cloudProviders.anthropic) {
      this.providers.push(new AnthropicProvider(this.config.cloudProviders.anthropic));
    }

    if (this.config.cloudProviders.google) {
      this.providers.push(new GoogleProvider(this.config.cloudProviders.google));
    }

    if (this.config.cloudProviders.xai) {
      this.providers.push(new XAIProvider(this.config.cloudProviders.xai));
    }

    if (this.config.cloudProviders.deepseek) {
      this.providers.push(new DeepSeekProvider(this.config.cloudProviders.deepseek));
    }

    if (this.config.cloudProviders.mistral) {
      this.providers.push(new MistralProvider(this.config.cloudProviders.mistral));
    }

    if (this.config.cloudProviders.together) {
      this.providers.push(new TogetherProvider(this.config.cloudProviders.together));
    }

    // Initialize local fallback providers
    if (this.config.localFallback.enabled) {
      const localProviders = this.config.localFallback.providers || ['ollama', 'lmstudio', 'webllm'];

      for (const providerName of localProviders) {
        if (providerName === 'ollama') {
          this.providers.push(new OllamaProvider());
        } else if (providerName === 'lmstudio') {
          this.providers.push(new LMStudioProvider());
        } else if (providerName === 'webllm') {
          this.providers.push(new WebLLMProvider());
        }
      }
    }
  }

  /**
   * Validates configuration and applies defaults
   */
  private validateAndSetDefaults(config: GatewayConfig): Required<GatewayConfig> {
    // Check if any providers are configured
    const hasCloudProvider = config.cloudProviders && Object.keys(config.cloudProviders).length > 0;
    const localFallbackExplicitlyDisabled = config.localFallback?.enabled === false;

    // Default to local fallback if no cloud providers configured and not explicitly disabled
    const defaultLocalFallback = !hasCloudProvider && !localFallbackExplicitlyDisabled;

    // Set defaults
    const validated: Required<GatewayConfig> = {
      dailyBudget: config.dailyBudget ?? 0,
      cacheEnabled: config.cacheEnabled ?? true,
      semanticCaching: config.semanticCaching ?? false,
      similarityThreshold: config.similarityThreshold ?? 0.9,
      compressionLevel: config.compressionLevel ?? 'medium',
      localFallback: config.localFallback ?? {
        enabled: defaultLocalFallback,
        providers: ['ollama', 'lmstudio', 'webllm']
      },
      cloudProviders: config.cloudProviders ?? {},
      webhooks: config.webhooks ?? {},
    };

    // Validate dailyBudget
    if (validated.dailyBudget < 0) {
      throw new ConfigurationError('dailyBudget must be >= 0 (0 = unlimited)');
    }

    // Validate compression level
    const validCompressionLevels = ['low', 'medium', 'high'];
    if (!validCompressionLevels.includes(validated.compressionLevel)) {
      throw new ConfigurationError(
        `compressionLevel must be one of: ${validCompressionLevels.join(', ')}`
      );
    }

    // Validate similarity threshold
    if (validated.similarityThreshold < 0 || validated.similarityThreshold > 1) {
      throw new ConfigurationError(
        'similarityThreshold must be between 0 and 1'
      );
    }

    // Validate that at least one provider is configured or will be available
    const hasAnyProvider = Object.keys(validated.cloudProviders).length > 0 || validated.localFallback.enabled;

    if (!hasAnyProvider) {
      throw new ConfigurationError(
        'At least one cloud provider or local fallback must be enabled'
      );
    }

    return validated;
  }

  /**
   * Complete a prompt and return the response
   *
   * @param prompt - The text prompt to complete
   * @param options - Optional completion options
   * @returns The completion response text
   * @throws {BudgetExceededError} If the request would exceed the daily budget
   * @throws {ProviderUnavailableError} If all providers fail
   */
  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    // Check cache first (using original prompt)
    const cachedResult = this.cacheManager.get(prompt, options);
    if (cachedResult) {
      return cachedResult.text;
    }

    // Apply compression to reduce token usage
    const compressedPrompt = Compressor.compress(prompt, this.config.compressionLevel);

    // Get candidate providers
    let candidateProviders = this.providers;

    if (options?.forceProvider) {
      candidateProviders = this.providers.filter(p => p.type === options.forceProvider);
    }

    if (candidateProviders.length === 0) {
      throw new ProviderUnavailableError(
        'all',
        'No providers configured. Add at least one cloud provider or enable local fallback.'
      );
    }

    const errors: Array<{ provider: string; error: string }> = [];

    // Try each provider in order until one succeeds
    for (const provider of candidateProviders) {
      // Check if provider is available
      if (!await provider.isAvailable()) {
        errors.push({
          provider: provider.name,
          error: 'Provider not available (check API key or service status)'
        });
        continue;
      }

      try {
        // Estimate cost before making the request (using compressed prompt)
        const estimatedCost = provider.estimateCost(compressedPrompt);

        // Check if this request would exceed budget
        this.budgetManager.checkBudget(estimatedCost);

        // Complete the request using the provider (with compressed prompt)
        const result = await provider.complete(compressedPrompt, options);

        // Record actual spending
        this.budgetManager.recordSpending(result.cost);

        // Cache the result for future requests (keyed by original prompt)
        this.cacheManager.set(prompt, options, result);

        return result.text;

      } catch (error) {
        // If it's a budget error, don't try other providers - just throw
        if (error instanceof Error && error.name === 'BudgetExceededError') {
          throw error;
        }

        // Record the error and try next provider
        errors.push({
          provider: provider.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        continue;
      }
    }

    // All providers failed - throw detailed error
    const errorDetails = errors.map(e => `${e.provider}: ${e.error}`).join('; ');
    throw new ProviderUnavailableError(
      'all',
      `All providers failed. Errors: ${errorDetails}`
    );
  }

  /**
   * Stream a completion response token-by-token
   *
   * @param prompt - The text prompt to complete
   * @param options - Optional completion options
   * @returns Async iterator yielding response tokens
   * @throws {BudgetExceededError} If the request would exceed the daily budget
   * @throws {ProviderUnavailableError} If all providers fail
   *
   * @example
   * ```typescript
   * for await (const token of ai.stream('Write a story')) {
   *   process.stdout.write(token);
   * }
   * ```
   */
  async *stream(prompt: string, options?: CompletionOptions): AsyncIterable<string> {
    // Apply compression to reduce token usage
    const compressedPrompt = Compressor.compress(prompt, this.config.compressionLevel);

    // Get candidate providers
    let candidateProviders = this.providers;

    if (options?.forceProvider) {
      candidateProviders = this.providers.filter(p => p.type === options.forceProvider);
    }

    if (candidateProviders.length === 0) {
      throw new ProviderUnavailableError(
        'all',
        'No providers configured. Add at least one cloud provider or enable local fallback.'
      );
    }

    const errors: Array<{ provider: string; error: string }> = [];

    // Try each provider in order until one succeeds
    for (const provider of candidateProviders) {
      // Check if provider is available
      if (!await provider.isAvailable()) {
        errors.push({
          provider: provider.name,
          error: 'Provider not available (check API key or service status)'
        });
        continue;
      }

      try {
        // Estimate cost before making the request (using compressed prompt)
        const estimatedCost = provider.estimateCost(compressedPrompt);

        // Check if this request would exceed budget
        this.budgetManager.checkBudget(estimatedCost);

        // Stream the response using the provider (with compressed prompt)
        let fullText = '';
        for await (const token of provider.stream(compressedPrompt, options)) {
          fullText += token;
          yield token;
        }

        // Record spending after streaming completes
        // Note: We use the same cost estimation since streaming doesn't return cost metadata
        this.budgetManager.recordSpending(estimatedCost);

        // Successfully streamed - exit
        return;

      } catch (error) {
        // If it's a budget error, don't try other providers - just throw
        if (error instanceof Error && error.name === 'BudgetExceededError') {
          throw error;
        }

        // Record the error and try next provider
        errors.push({
          provider: provider.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        continue;
      }
    }

    // All providers failed - throw detailed error
    const errorDetails = errors.map(e => `${e.provider}: ${e.error}`).join('; ');
    throw new ProviderUnavailableError(
      'all',
      `All providers failed. Errors: ${errorDetails}`
    );
  }

  /**
   * Get current budget status
   *
   * @returns Budget status including used, remaining, and reset time
   */
  getBudgetStatus(): BudgetStatus {
    return this.budgetManager.getStatus();
  }

  /**
   * Clear the cache manually
   */
  clearCache(): void {
    this.cacheManager.clear();
  }

  /**
   * Get the current configuration
   * (Useful for debugging)
   */
  getConfig(): Readonly<Required<GatewayConfig>> {
    return { ...this.config };
  }
}
