/**
 * Base error class for Cognigate
 */
export class CognigateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CognigateError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when daily budget is exceeded
 */
export class BudgetExceededError extends CognigateError {
  public readonly used: number;
  public readonly limit: number;

  constructor(used: number, limit: number) {
    super(
      `Daily budget exceeded: $${used.toFixed(2)} / $${limit.toFixed(2)}. ` +
      `Enable local fallback to continue with free local models, or increase your daily budget.`
    );
    this.name = 'BudgetExceededError';
    this.used = used;
    this.limit = limit;
  }
}

/**
 * Error thrown when a provider is unavailable
 */
export class ProviderUnavailableError extends CognigateError {
  public readonly provider: string;

  constructor(provider: string, details?: string) {
    const message = details
      ? `Provider unavailable: ${provider}. ${details}`
      : `Provider unavailable: ${provider}. Check your configuration and network connection.`;

    super(message);
    this.name = 'ProviderUnavailableError';
    this.provider = provider;
  }
}

/**
 * Error thrown for cache-related issues
 */
export class CacheError extends CognigateError {
  constructor(message: string) {
    super(`Cache error: ${message}`);
    this.name = 'CacheError';
  }
}

/**
 * Error thrown for voice mode issues
 */
export class VoiceModeError extends CognigateError {
  constructor(message: string) {
    super(`Voice mode error: ${message}`);
    this.name = 'VoiceModeError';
  }
}

/**
 * Error thrown for configuration validation failures
 */
export class ConfigurationError extends CognigateError {
  constructor(message: string) {
    super(`Configuration error: ${message}`);
    this.name = 'ConfigurationError';
  }
}
