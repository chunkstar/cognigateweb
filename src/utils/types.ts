/**
 * Configuration for the Cognigate gateway
 *
 * @example
 * ```typescript
 * const config: GatewayConfig = {
 *   dailyBudget: 10.00,
 *   cacheEnabled: true,
 *   compressionLevel: 'medium',
 *   cloudProviders: {
 *     openai: { apiKey: process.env.OPENAI_API_KEY }
 *   },
 *   localFallback: {
 *     enabled: true,
 *     providers: ['ollama', 'lmstudio']
 *   }
 * };
 * ```
 */
export interface GatewayConfig {
  /**
   * Daily budget limit in USD (0 = unlimited)
   *
   * When set to a positive number, the gateway will track spending and throw
   * {@link BudgetExceededError} when the daily limit would be exceeded.
   * Budget automatically resets at midnight UTC.
   *
   * @default 0
   * @example
   * ```typescript
   * dailyBudget: 10.00  // $10 per day
   * dailyBudget: 0      // unlimited
   * ```
   */
  dailyBudget?: number;

  /**
   * Enable caching to reduce costs
   *
   * When enabled, identical prompts will retrieve cached responses instead of
   * making new API calls, significantly reducing costs and latency.
   *
   * @default true
   * @see {@link CacheEntry}
   */
  cacheEnabled?: boolean;

  /**
   * Enable semantic caching for similar prompts
   *
   * When enabled, semantically similar prompts (not just identical) will match
   * cached responses. Uses cosine similarity to compare prompts.
   *
   * Examples:
   * - "What is 2+2?" matches "what is 2+2" (case-insensitive)
   * - "Explain TypeScript" matches "Can you explain TypeScript?" (high similarity)
   *
   * @default false
   * @see {@link similarityThreshold}
   */
  semanticCaching?: boolean;

  /**
   * Similarity threshold for semantic caching (0-1)
   *
   * Only applies when `semanticCaching` is enabled.
   * Higher values require closer matches, lower values are more lenient.
   *
   * - `0.95`: Very strict matching (nearly identical prompts)
   * - `0.90`: Balanced matching (default, recommended)
   * - `0.80`: Lenient matching (may have false positives)
   *
   * @default 0.9
   */
  similarityThreshold?: number;

  /**
   * Compression level for prompts
   *
   * Higher compression levels reduce token usage and costs, but may slightly
   * impact response quality for very complex prompts.
   *
   * - `'low'`: ~10% token reduction, minimal quality impact
   * - `'medium'`: ~25% token reduction, good balance
   * - `'high'`: ~40% token reduction, may affect complex prompts
   *
   * @default 'medium'
   */
  compressionLevel?: 'low' | 'medium' | 'high';

  /**
   * Local fallback configuration
   *
   * Configure automatic fallback to free local LLM providers when budget
   * is exhausted or cloud providers are unavailable.
   *
   * @see {@link LocalFallbackConfig}
   */
  localFallback?: LocalFallbackConfig;

  /**
   * Cloud provider configurations
   *
   * Configure one or more cloud AI providers (OpenAI, Anthropic, Google).
   * The gateway will use these providers in order of preference.
   *
   * @see {@link CloudProvidersConfig}
   */
  cloudProviders?: CloudProvidersConfig;

  /**
   * Webhook configurations for alerts
   *
   * Configure webhooks to receive alerts when budget limits are reached,
   * errors occur, or other important events happen.
   *
   * @see {@link WebhooksConfig}
   */
  webhooks?: WebhooksConfig;
}

/**
 * Local fallback configuration
 *
 * Enables automatic fallback to free local LLM providers when cloud providers
 * are unavailable or budget is exhausted. Providers are tried in order until
 * one succeeds.
 *
 * @example
 * ```typescript
 * localFallback: {
 *   enabled: true,
 *   providers: ['ollama', 'lmstudio', 'webllm']
 * }
 * ```
 */
export interface LocalFallbackConfig {
  /**
   * Enable automatic fallback to local providers
   *
   * When `true`, the gateway will automatically switch to local providers
   * when cloud providers fail or budget is exceeded.
   */
  enabled: boolean;

  /**
   * Local providers to use (in order of preference)
   *
   * Providers are tried sequentially. If one fails, the next is attempted.
   *
   * - `'ollama'`: Ollama (https://ollama.ai) - Most popular
   * - `'lmstudio'`: LM Studio - GPU-accelerated
   * - `'webllm'`: WebLLM - Runs in browser via WebGPU
   *
   * @default ['ollama', 'lmstudio', 'webllm']
   */
  providers?: ('ollama' | 'lmstudio' | 'webllm')[];
}

/**
 * Cloud provider configurations
 *
 * Configure one or more cloud AI providers. You can use multiple providers
 * for redundancy - if one fails, the gateway automatically tries the next.
 *
 * @example
 * ```typescript
 * cloudProviders: {
 *   openai: {
 *     apiKey: process.env.OPENAI_API_KEY,
 *     models: ['gpt-4o-mini', 'gpt-4o']
 *   },
 *   anthropic: {
 *     apiKey: process.env.ANTHROPIC_API_KEY,
 *     models: ['claude-3-haiku', 'claude-3-sonnet']
 *   }
 * }
 * ```
 */
export interface CloudProvidersConfig {
  /**
   * OpenAI configuration
   *
   * Provider for GPT models (GPT-4o, GPT-4o-mini, etc.)
   *
   * @see https://platform.openai.com/docs
   */
  openai?: ProviderConfig;

  /**
   * Anthropic configuration
   *
   * Provider for Claude models (Claude 3.5 Sonnet, Claude 3 Haiku, etc.)
   *
   * @see https://docs.anthropic.com
   */
  anthropic?: ProviderConfig;

  /**
   * Google configuration
   *
   * Provider for Gemini models (Gemini Pro, Gemini Flash, etc.)
   *
   * @see https://ai.google.dev/docs
   */
  google?: ProviderConfig;
}

/**
 * Individual provider configuration
 *
 * Configuration for a single AI provider (OpenAI, Anthropic, Google, etc.)
 *
 * @example
 * ```typescript
 * {
 *   apiKey: 'sk-...',
 *   models: ['gpt-4o-mini', 'gpt-4o'],
 *   baseUrl: 'https://api.openai.com/v1'  // optional
 * }
 * ```
 */
export interface ProviderConfig {
  /**
   * API key for the provider
   *
   * Obtain from your provider's dashboard:
   * - OpenAI: https://platform.openai.com/api-keys
   * - Anthropic: https://console.anthropic.com/settings/keys
   * - Google: https://makersuite.google.com/app/apikey
   */
  apiKey: string;

  /**
   * Models to use (in order of preference)
   *
   * If not specified, uses provider defaults. The gateway will try each
   * model in order if one is unavailable.
   *
   * @example
   * ```typescript
   * models: ['gpt-4o-mini', 'gpt-4o']  // Try mini first, then 4o
   * ```
   */
  models?: string[];

  /**
   * Custom base URL (for proxies or compatible APIs)
   *
   * Use this to:
   * - Route through a proxy
   * - Use OpenAI-compatible APIs (e.g., Azure OpenAI)
   * - Use local testing endpoints
   *
   * @example
   * ```typescript
   * baseUrl: 'https://your-proxy.com/v1'
   * baseUrl: 'https://your-resource.openai.azure.com'
   * ```
   */
  baseUrl?: string;
}

/**
 * Webhook configurations
 *
 * Configure webhooks to receive real-time notifications about:
 * - Budget limit reached
 * - Provider failures
 * - Daily spending reports
 * - Cache statistics
 *
 * @example
 * ```typescript
 * webhooks: {
 *   slack: 'https://hooks.slack.com/services/...',
 *   discord: 'https://discord.com/api/webhooks/...'
 * }
 * ```
 */
export interface WebhooksConfig {
  /**
   * Slack webhook URL
   *
   * Create at: https://api.slack.com/messaging/webhooks
   *
   * Receives formatted messages with budget alerts and error notifications.
   */
  slack?: string;

  /**
   * Discord webhook URL
   *
   * Create in Server Settings → Integrations → Webhooks
   *
   * Receives formatted embeds with budget alerts and error notifications.
   */
  discord?: string;

  /**
   * Custom webhook URL
   *
   * Receives POST requests with JSON payload:
   * ```json
   * {
   *   "event": "budget_exceeded" | "provider_error" | "daily_report",
   *   "timestamp": "2025-01-15T10:30:00Z",
   *   "data": { ... }
   * }
   * ```
   */
  custom?: string;
}

/**
 * Options for completion requests
 *
 * Optional parameters to customize AI completion behavior on a per-request basis.
 *
 * @example
 * ```typescript
 * await ai.complete('Write a haiku', {
 *   model: 'gpt-4o',
 *   temperature: 0.9,
 *   maxTokens: 100
 * });
 * ```
 */
export interface CompletionOptions {
  /**
   * Model to use (overrides default)
   *
   * Specify a particular model for this request, overriding the default
   * from the provider configuration.
   *
   * @example
   * ```typescript
   * model: 'gpt-4o'           // OpenAI
   * model: 'claude-3-opus'    // Anthropic
   * model: 'gemini-pro'       // Google
   * ```
   */
  model?: string;

  /**
   * Temperature for sampling (0.0 to 2.0)
   *
   * Controls randomness in the output:
   * - `0.0`: Deterministic, focused responses
   * - `0.7`: Balanced creativity (default)
   * - `1.0`: More creative
   * - `2.0`: Maximum creativity/randomness
   *
   * @default 0.7
   */
  temperature?: number;

  /**
   * Maximum tokens to generate
   *
   * Limits the length of the generated response.
   * Actual response may be shorter if the model naturally concludes.
   *
   * @default 1000
   * @example
   * ```typescript
   * maxTokens: 50    // Short response
   * maxTokens: 500   // Medium response
   * maxTokens: 2000  // Long response
   * ```
   */
  maxTokens?: number;

  /**
   * Force use of specific provider type
   *
   * Override automatic provider selection to force cloud or local providers.
   *
   * - `'cloud'`: Only use cloud providers (OpenAI, Anthropic, Google)
   * - `'local'`: Only use local providers (Ollama, LM Studio, WebLLM)
   *
   * @example
   * ```typescript
   * forceProvider: 'local'  // Free but may be slower
   * forceProvider: 'cloud'  // Faster but costs money
   * ```
   */
  forceProvider?: 'cloud' | 'local';
}

/**
 * Result of a completion request
 *
 * Contains the generated response along with metadata about tokens, cost,
 * provider used, and cache status.
 *
 * @example
 * ```typescript
 * {
 *   text: "Hello! How can I help you?",
 *   tokens: 25,
 *   cost: 0.00001875,
 *   provider: "openai",
 *   cached: false
 * }
 * ```
 */
export interface CompletionResult {
  /**
   * Generated text response
   *
   * The actual AI-generated content in response to your prompt.
   */
  text: string;

  /**
   * Total tokens used (input + output)
   *
   * Includes both:
   * - Input tokens (your prompt)
   * - Output tokens (generated response)
   *
   * Used for cost calculation and tracking.
   */
  tokens: number;

  /**
   * Cost in USD
   *
   * Actual cost of this request based on provider pricing.
   * Does not include cached responses (cost = 0 for cache hits).
   *
   * @example
   * ```typescript
   * cost: 0.00001875  // ~$0.000019 (less than 1 cent)
   * cost: 0.0025      // ~$0.0025 (quarter of a cent)
   * ```
   */
  cost: number;

  /**
   * Provider that handled the request
   *
   * Name of the provider that generated this response.
   *
   * @example
   * ```typescript
   * provider: "openai"     // Cloud provider
   * provider: "ollama"     // Local provider
   * ```
   */
  provider: string;

  /**
   * Whether response came from cache
   *
   * `true` if this response was retrieved from cache (no API call made).
   * `false` if a new API request was made.
   *
   * Cached responses have zero cost.
   */
  cached: boolean;
}

/**
 * Budget status information
 *
 * Current state of the daily budget including usage and reset time.
 * Retrieved via {@link Gateway.getBudgetStatus}.
 *
 * @example
 * ```typescript
 * const status = ai.getBudgetStatus();
 * console.log(`Used: $${status.used.toFixed(4)}`);
 * console.log(`Remaining: $${status.remaining.toFixed(4)}`);
 * console.log(`Resets at: ${status.resetAt.toISOString()}`);
 * ```
 */
export interface BudgetStatus {
  /**
   * Daily budget limit in USD
   *
   * The configured maximum spending per day.
   * `0` means unlimited budget.
   */
  dailyLimit: number;

  /**
   * Amount used today in USD
   *
   * Total spending since last reset (midnight UTC).
   * Includes all completed requests that weren't cached.
   */
  used: number;

  /**
   * Remaining budget in USD
   *
   * How much can still be spent today before hitting the limit.
   * Calculated as: `dailyLimit - used`
   *
   * For unlimited budgets (dailyLimit = 0), this is 0.
   */
  remaining: number;

  /**
   * Time when budget resets (midnight UTC)
   *
   * Budget usage resets to 0 at this time.
   * Always the next midnight in UTC timezone.
   *
   * @example
   * ```typescript
   * resetAt: Date // 2025-01-16T00:00:00.000Z
   * ```
   */
  resetAt: Date;
}

/**
 * Cache entry
 *
 * Represents a cached AI response. Used internally by the caching system
 * to store and retrieve previous responses for similar prompts.
 *
 * @internal
 * @example
 * ```typescript
 * {
 *   prompt: "What is 2+2?",
 *   response: "4",
 *   timestamp: 1705315200000,
 *   hits: 5
 * }
 * ```
 */
export interface CacheEntry {
  /**
   * Original prompt
   *
   * The prompt that was sent to the AI. Used to match against new prompts
   * using semantic similarity.
   */
  prompt: string;

  /**
   * Cached response
   *
   * The AI's response to this prompt. Returned directly when cache hits.
   */
  response: string;

  /**
   * Timestamp when cached
   *
   * Unix timestamp (milliseconds) when this response was first cached.
   * Used for cache expiration and statistics.
   */
  timestamp: number;

  /**
   * Number of cache hits
   *
   * How many times this cached response has been returned instead of
   * making a new API call. Higher numbers indicate popular/useful caches.
   */
  hits: number;
}

/**
 * Provider interface
 *
 * Abstract interface that all AI providers (cloud and local) must implement.
 * Used internally by the gateway to interact with different AI services.
 *
 * @internal
 */
export interface Provider {
  /**
   * Provider name
   *
   * Unique identifier for this provider.
   *
   * @example
   * ```typescript
   * name: "openai"
   * name: "ollama"
   * ```
   */
  name: string;

  /**
   * Provider type (cloud or local)
   *
   * - `'cloud'`: Remote API (OpenAI, Anthropic, Google)
   * - `'local'`: Local AI (Ollama, LM Studio, WebLLM)
   */
  type: 'cloud' | 'local';

  /**
   * Check if provider is available
   *
   * Verifies that this provider can handle requests. For cloud providers,
   * checks API key validity. For local providers, checks if the service
   * is running.
   *
   * @returns `true` if provider is ready to handle requests
   */
  isAvailable(): Promise<boolean>;

  /**
   * Complete a prompt
   *
   * Send a prompt to the AI and get a response. This is the core method
   * that all providers must implement.
   *
   * @param prompt - The text prompt to complete
   * @param options - Optional completion options
   * @returns Completion result with text, tokens, cost, etc.
   * @throws {ProviderUnavailableError} If provider cannot handle the request
   */
  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;

  /**
   * Stream a completion response
   *
   * Send a prompt and receive the response token-by-token as an async iterator.
   * Allows for real-time streaming of AI responses for better UX.
   *
   * @param prompt - The text prompt to complete
   * @param options - Optional completion options
   * @returns Async iterator yielding response tokens
   * @throws {ProviderUnavailableError} If provider cannot handle the request
   *
   * @example
   * ```typescript
   * for await (const token of provider.stream('Hello')) {
   *   process.stdout.write(token);
   * }
   * ```
   */
  stream(prompt: string, options?: CompletionOptions): AsyncIterable<string>;

  /**
   * Estimate cost for a prompt
   *
   * Calculate the estimated cost of completing this prompt without actually
   * sending it. Used for budget checking before making requests.
   *
   * @param prompt - The prompt to estimate
   * @returns Estimated cost in USD
   */
  estimateCost(prompt: string): number;
}
