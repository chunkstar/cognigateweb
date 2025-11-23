/**
 * Cognigate - AI Gateway with Budget Controls
 *
 * Build AI apps without fear. Never overspend, never go down.
 */

import { Gateway } from './core/gateway.js';
import type { GatewayConfig } from './utils/types.js';

/**
 * Create a new Cognigate gateway instance
 *
 * @param config - Gateway configuration
 * @returns Gateway instance
 *
 * @example
 * ```typescript
 * import { createGateway } from 'cognigate';
 *
 * const ai = createGateway({
 *   dailyBudget: 10,
 *   cloudProviders: {
 *     openai: { apiKey: process.env.OPENAI_API_KEY }
 *   },
 *   localFallback: { enabled: true }
 * });
 *
 * const response = await ai.complete("Hello, world!");
 * console.log(response);
 * ```
 */
export function createGateway(config: GatewayConfig = {}): Gateway {
  return new Gateway(config);
}

// Export Gateway class for advanced usage
export { Gateway } from './core/gateway.js';

// Export all types
export type {
  GatewayConfig,
  CompletionOptions,
  BudgetStatus,
  CompletionResult,
  LocalFallbackConfig,
  CloudProvidersConfig,
  ProviderConfig,
  WebhooksConfig,
  Provider,
  CacheEntry,
} from './utils/types.js';

// Export all errors
export {
  CognigateError,
  BudgetExceededError,
  ProviderUnavailableError,
  CacheError,
  VoiceModeError,
  ConfigurationError,
} from './utils/errors.js';

// Export voice classes and types
export {
  SpeechRecognizer,
  Speaker,
  Conversation,
  VoiceError,
  VoiceNotSupportedError,
  VoicePermissionError,
} from './voice/index.js';

export type {
  RecognizerConfig,
  RecognitionResult,
  SpeakerConfig,
  ConversationConfig,
} from './voice/index.js';

// Export webhook classes and functions
export {
  WebhookManager,
  sendSlackWebhook,
  sendDiscordWebhook,
} from './webhooks/index.js';

export type {
  AlertType,
  AlertSeverity,
  BudgetAlertData,
  ProviderFailedData,
  DailySummaryData,
  AlertPayload,
  WebhookResult,
} from './webhooks/index.js';
