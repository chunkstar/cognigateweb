import { createHash } from 'crypto';

// src/utils/errors.ts
var CognigateError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "CognigateError";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};
var BudgetExceededError = class extends CognigateError {
  used;
  limit;
  constructor(used, limit) {
    super(
      `Daily budget exceeded: $${used.toFixed(2)} / $${limit.toFixed(2)}. Enable local fallback to continue with free local models, or increase your daily budget.`
    );
    this.name = "BudgetExceededError";
    this.used = used;
    this.limit = limit;
  }
};
var ProviderUnavailableError = class extends CognigateError {
  provider;
  constructor(provider, details) {
    const message = details ? `Provider unavailable: ${provider}. ${details}` : `Provider unavailable: ${provider}. Check your configuration and network connection.`;
    super(message);
    this.name = "ProviderUnavailableError";
    this.provider = provider;
  }
};
var CacheError = class extends CognigateError {
  constructor(message) {
    super(`Cache error: ${message}`);
    this.name = "CacheError";
  }
};
var VoiceModeError = class extends CognigateError {
  constructor(message) {
    super(`Voice mode error: ${message}`);
    this.name = "VoiceModeError";
  }
};
var ConfigurationError = class extends CognigateError {
  constructor(message) {
    super(`Configuration error: ${message}`);
    this.name = "ConfigurationError";
  }
};

// src/providers/base.ts
var BaseProvider = class {
  /**
   * Stream a completion response token-by-token
   *
   * Default implementation simulates streaming by chunking the complete() response.
   * Providers with native streaming support should override this method.
   *
   * @param prompt - The text prompt to complete
   * @param options - Optional completion options
   * @returns Async iterator yielding response tokens
   */
  async *stream(prompt, options) {
    const result = await this.complete(prompt, options);
    const chunkSize = 5;
    const text = result.text;
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize);
      yield chunk;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  /**
   * Estimate token count for text
   * Rough estimate: 1 token ≈ 4 characters
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }
};

// src/providers/cloud/openai.ts
var OpenAIProvider = class extends BaseProvider {
  name = "openai";
  type = "cloud";
  apiKey;
  baseUrl;
  models;
  constructor(config) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.openai.com/v1";
    this.models = config.models || ["gpt-4o-mini", "gpt-4o"];
  }
  async isAvailable() {
    return !!this.apiKey && this.apiKey.length > 0;
  }
  async complete(prompt, options) {
    if (!await this.isAvailable()) {
      throw new ProviderUnavailableError(
        "openai",
        "API key is missing or invalid"
      );
    }
    const model = options?.model || this.models[0];
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 1e3;
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature,
          max_tokens: maxTokens
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderUnavailableError(
          "openai",
          `API error (${response.status}): ${errorText}`
        );
      }
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const tokens = data.usage?.total_tokens || this.estimateTokens(prompt + text);
      const cost = this.calculateCost(tokens, model);
      return {
        text,
        tokens,
        cost,
        provider: this.name,
        cached: false
      };
    } catch (error) {
      if (error instanceof ProviderUnavailableError) {
        throw error;
      }
      throw new ProviderUnavailableError(
        "openai",
        `Failed to complete request: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  estimateCost(prompt) {
    const tokens = this.estimateTokens(prompt);
    const model = this.models[0];
    return this.calculateCost(tokens * 2, model);
  }
  /**
   * Calculate cost based on OpenAI pricing (as of 2025)
   * Prices per 1M tokens
   */
  calculateCost(tokens, model) {
    const pricing = {
      "gpt-4o-mini": { input: 0.15, output: 0.6 },
      "gpt-4o": { input: 2.5, output: 10 },
      "gpt-4-turbo": { input: 10, output: 30 },
      "gpt-4": { input: 30, output: 60 }
    };
    const rate = pricing[model] || pricing["gpt-4o-mini"];
    const inputTokens = tokens / 2;
    const outputTokens = tokens / 2;
    const cost = (inputTokens * rate.input + outputTokens * rate.output) / 1e6;
    return cost;
  }
};

// src/providers/cloud/anthropic.ts
var AnthropicProvider = class extends BaseProvider {
  name = "anthropic";
  type = "cloud";
  apiKey;
  baseUrl;
  models;
  constructor(config) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://api.anthropic.com/v1";
    this.models = config.models || ["claude-3-5-haiku-20241022", "claude-3-5-sonnet-20241022"];
  }
  async isAvailable() {
    return !!this.apiKey && this.apiKey.length > 0;
  }
  async complete(prompt, options) {
    if (!await this.isAvailable()) {
      throw new ProviderUnavailableError(
        "anthropic",
        "API key is missing or invalid"
      );
    }
    const model = options?.model || this.models[0];
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 1e3;
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature,
          max_tokens: maxTokens
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderUnavailableError(
          "anthropic",
          `API error (${response.status}): ${errorText}`
        );
      }
      const data = await response.json();
      const text = data.content?.[0]?.text || "";
      const inputTokens = data.usage?.input_tokens || 0;
      const outputTokens = data.usage?.output_tokens || 0;
      const tokens = inputTokens + outputTokens;
      const cost = this.calculateCost(inputTokens, outputTokens, model);
      return {
        text,
        tokens,
        cost,
        provider: this.name,
        cached: false
      };
    } catch (error) {
      if (error instanceof ProviderUnavailableError) {
        throw error;
      }
      throw new ProviderUnavailableError(
        "anthropic",
        `Failed to complete request: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  estimateCost(prompt) {
    const tokens = this.estimateTokens(prompt);
    const model = this.models[0];
    return this.calculateCost(tokens, tokens, model);
  }
  /**
   * Calculate cost based on Anthropic pricing (as of 2025)
   * Prices per 1M tokens
   */
  calculateCost(inputTokens, outputTokens, model) {
    const pricing = {
      "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
      "claude-3-5-haiku-20241022": { input: 0.8, output: 4 },
      "claude-3-opus-20240229": { input: 15, output: 75 },
      "claude-3-sonnet-20240229": { input: 3, output: 15 },
      "claude-3-haiku-20240307": { input: 0.25, output: 1.25 }
    };
    const rate = pricing[model] || pricing["claude-3-5-haiku-20241022"];
    const cost = (inputTokens * rate.input + outputTokens * rate.output) / 1e6;
    return cost;
  }
};

// src/providers/cloud/google.ts
var GoogleProvider = class extends BaseProvider {
  name = "google";
  type = "cloud";
  apiKey;
  baseUrl;
  models;
  constructor(config) {
    super();
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://generativelanguage.googleapis.com/v1beta";
    this.models = config.models || ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash"];
  }
  async isAvailable() {
    return !!this.apiKey && this.apiKey.length > 0;
  }
  async complete(prompt, options) {
    if (!await this.isAvailable()) {
      throw new ProviderUnavailableError(
        "google",
        "API key is missing or invalid"
      );
    }
    const model = options?.model || this.models[0];
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 1e3;
    try {
      const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens
          }
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderUnavailableError(
          "google",
          `API error (${response.status}): ${errorText}`
        );
      }
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
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
        cached: false
      };
    } catch (error) {
      if (error instanceof ProviderUnavailableError) {
        throw error;
      }
      throw new ProviderUnavailableError(
        "google",
        `Failed to complete request: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  estimateCost(prompt) {
    const tokens = this.estimateTokens(prompt);
    const model = this.models[0];
    return this.calculateCost(tokens, tokens, model);
  }
  /**
   * Calculate cost based on Google Gemini pricing (as of 2025)
   * Prices per 1M tokens
   */
  calculateCost(inputTokens, outputTokens, model) {
    const pricing = {
      "gemini-2.5-flash": { input: 0.075, output: 0.3 },
      "gemini-2.5-pro": { input: 1.25, output: 5 },
      "gemini-2.0-flash": { input: 0.075, output: 0.3 },
      "gemini-1.5-flash": { input: 0.075, output: 0.3 },
      "gemini-1.5-pro": { input: 1.25, output: 5 },
      "gemini-1.0-pro": { input: 0.5, output: 1.5 }
    };
    const rate = pricing[model] || pricing["gemini-2.5-flash"];
    const cost = (inputTokens * rate.input + outputTokens * rate.output) / 1e6;
    return cost;
  }
};

// src/providers/local/ollama.ts
var OllamaProvider = class extends BaseProvider {
  name = "ollama";
  type = "local";
  baseUrl;
  models;
  constructor(config = {}) {
    super();
    this.baseUrl = config.baseUrl || "http://localhost:11434";
    this.models = config.models || ["llama2", "codellama", "mistral"];
  }
  /**
   * Check if Ollama is available by pinging the health endpoint
   */
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: "GET"
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  async complete(prompt, options) {
    if (!await this.isAvailable()) {
      throw new ProviderUnavailableError(
        "ollama",
        "Ollama is not available. Make sure Ollama is installed and running at " + this.baseUrl
      );
    }
    const model = options?.model || this.models[0];
    const temperature = options?.temperature ?? 0.7;
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          prompt,
          temperature,
          stream: false
          // We want the complete response at once
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderUnavailableError(
          "ollama",
          `API error (${response.status}): ${errorText}`
        );
      }
      const data = await response.json();
      const text = data.response || "";
      const tokens = this.estimateTokens(prompt + text);
      const cost = 0;
      return {
        text,
        tokens,
        cost,
        provider: this.name,
        cached: false
      };
    } catch (error) {
      if (error instanceof ProviderUnavailableError) {
        throw error;
      }
      throw new ProviderUnavailableError(
        "ollama",
        `Failed to complete request: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  estimateCost(prompt) {
    return 0;
  }
};

// src/providers/local/lmstudio.ts
var LMStudioProvider = class extends BaseProvider {
  name = "lmstudio";
  type = "local";
  baseUrl;
  models;
  constructor(config = {}) {
    super();
    this.baseUrl = config.baseUrl || "http://localhost:1234/v1";
    this.models = config.models || ["local-model"];
  }
  /**
   * Check if LM Studio is available by pinging the models endpoint
   */
  async isAvailable() {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: "GET"
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  async complete(prompt, options) {
    if (!await this.isAvailable()) {
      throw new ProviderUnavailableError(
        "lmstudio",
        "LM Studio is not available. Make sure LM Studio is installed and running at " + this.baseUrl
      );
    }
    const model = options?.model || this.models[0];
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 1e3;
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature,
          max_tokens: maxTokens
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new ProviderUnavailableError(
          "lmstudio",
          `API error (${response.status}): ${errorText}`
        );
      }
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const tokens = data.usage?.total_tokens || this.estimateTokens(prompt + text);
      const cost = 0;
      return {
        text,
        tokens,
        cost,
        provider: this.name,
        cached: false
      };
    } catch (error) {
      if (error instanceof ProviderUnavailableError) {
        throw error;
      }
      throw new ProviderUnavailableError(
        "lmstudio",
        `Failed to complete request: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  estimateCost(prompt) {
    return 0;
  }
};

// src/providers/local/webllm.ts
var WebLLMProvider = class extends BaseProvider {
  name = "webllm";
  type = "local";
  models;
  engine = null;
  // Will be MLCEngine instance in browser
  constructor(config = {}) {
    super();
    this.models = config.models || ["Llama-3.1-8B-Instruct-q4f32_1-MLC"];
  }
  /**
   * Check if WebLLM is available (requires browser environment with WebGPU)
   */
  async isAvailable() {
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      return false;
    }
    if (!("gpu" in navigator)) {
      return false;
    }
    return true;
  }
  async complete(prompt, options) {
    if (!await this.isAvailable()) {
      throw new ProviderUnavailableError(
        "webllm",
        "WebLLM is only available in browser environments with WebGPU support. This provider cannot run in Node.js or non-WebGPU browsers."
      );
    }
    const model = options?.model || this.models[0];
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 1e3;
    try {
      if (!this.engine) {
        const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
        this.engine = await CreateMLCEngine(model);
      }
      const response = await this.engine.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        temperature,
        max_tokens: maxTokens,
        stream: false
      });
      const text = response.choices?.[0]?.message?.content || "";
      const tokens = response.usage?.total_tokens || this.estimateTokens(prompt + text);
      const cost = 0;
      return {
        text,
        tokens,
        cost,
        provider: this.name,
        cached: false
      };
    } catch (error) {
      if (error instanceof ProviderUnavailableError) {
        throw error;
      }
      throw new ProviderUnavailableError(
        "webllm",
        `Failed to complete request: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  estimateCost(prompt) {
    return 0;
  }
  /**
   * Clean up resources when done
   */
  async cleanup() {
    if (this.engine) {
      try {
        await this.engine.unload();
        this.engine = null;
      } catch (error) {
      }
    }
  }
};

// src/core/alert-manager.ts
var AlertManager = class {
  thresholds;
  firedAlerts = /* @__PURE__ */ new Set();
  listeners = /* @__PURE__ */ new Map();
  constructor(thresholds) {
    this.thresholds = {
      warning: thresholds?.warning ?? 50,
      urgent: thresholds?.urgent ?? 80,
      critical: thresholds?.critical ?? 100
    };
  }
  /**
   * Check budget usage and trigger alerts if thresholds crossed
   *
   * @param dailyLimit - Daily budget limit
   * @param used - Amount used so far
   * @param resetAt - When budget resets
   */
  checkBudget(dailyLimit, used, resetAt) {
    if (dailyLimit === 0) {
      return;
    }
    const percentage = used / dailyLimit * 100;
    const remaining = dailyLimit - used;
    const data = {
      dailyLimit,
      used,
      remaining,
      percentage,
      resetAt: resetAt.toISOString()
    };
    if (percentage >= this.thresholds.critical && !this.hasFired("critical")) {
      this.fireAlert("budget_exceeded", "critical", data);
      this.markFired("critical");
    } else if (percentage >= this.thresholds.urgent && !this.hasFired("urgent")) {
      this.fireAlert("budget_urgent", "urgent", data);
      this.markFired("urgent");
    } else if (percentage >= this.thresholds.warning && !this.hasFired("warning")) {
      this.fireAlert("budget_warning", "warning", data);
      this.markFired("warning");
    }
  }
  /**
   * Fire an alert to all listeners
   */
  fireAlert(event, severity, data) {
    const payload = {
      event,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      severity,
      data
    };
    this.emit("alert", payload);
  }
  /**
   * Check if alert has already fired
   */
  hasFired(threshold) {
    return this.firedAlerts.has(threshold);
  }
  /**
   * Mark alert as fired
   */
  markFired(threshold) {
    this.firedAlerts.add(threshold);
  }
  /**
   * Reset fired alerts (called on budget reset)
   */
  reset() {
    this.firedAlerts.clear();
  }
  /**
   * Register event listener
   *
   * @param event - Event name ('alert')
   * @param callback - Event callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(callback);
  }
  /**
   * Remove event listener
   *
   * @param event - Event name
   * @param callback - Event callback
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }
  /**
   * Emit event to all listeners
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Alert listener error:`, error);
        }
      });
    }
  }
  /**
   * Get current thresholds
   */
  getThresholds() {
    return { ...this.thresholds };
  }
};

// src/core/budget-manager.ts
var BudgetManager = class {
  dailyLimit;
  used = 0;
  resetAt;
  alertManager;
  constructor(dailyLimit, alertManager) {
    this.dailyLimit = dailyLimit;
    this.resetAt = this.calculateNextReset();
    this.alertManager = alertManager || new AlertManager();
  }
  /**
   * Calculate the next midnight UTC reset time
   */
  calculateNextReset() {
    const now = /* @__PURE__ */ new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0);
    return tomorrow;
  }
  /**
   * Check if budget needs to be reset (past midnight UTC)
   */
  checkAndReset() {
    const now = /* @__PURE__ */ new Date();
    if (now >= this.resetAt) {
      this.used = 0;
      this.resetAt = this.calculateNextReset();
      this.alertManager.reset();
    }
  }
  /**
   * Check if a given cost would exceed the budget
   * Throws BudgetExceededError if it would exceed
   *
   * @param cost - The cost to check
   * @throws {BudgetExceededError} If adding this cost would exceed the daily limit
   */
  checkBudget(cost) {
    this.checkAndReset();
    if (this.dailyLimit === 0) {
      return;
    }
    const potentialTotal = this.used + cost;
    if (potentialTotal > this.dailyLimit) {
      throw new BudgetExceededError(potentialTotal, this.dailyLimit);
    }
  }
  /**
   * Record spending after a successful completion
   *
   * @param cost - The cost to add to the daily total
   */
  recordSpending(cost) {
    this.checkAndReset();
    this.used += cost;
    this.alertManager.checkBudget(this.dailyLimit, this.used, this.resetAt);
  }
  /**
   * Get current budget status
   */
  getStatus() {
    this.checkAndReset();
    return {
      dailyLimit: this.dailyLimit,
      used: this.used,
      remaining: this.dailyLimit === 0 ? 0 : this.dailyLimit - this.used,
      resetAt: this.resetAt
    };
  }
  /**
   * Get the daily limit
   */
  getDailyLimit() {
    return this.dailyLimit;
  }
  /**
   * Get current usage
   */
  getUsed() {
    this.checkAndReset();
    return this.used;
  }
  /**
   * Get the alert manager instance
   */
  getAlertManager() {
    return this.alertManager;
  }
};
var CacheManager = class {
  cache = /* @__PURE__ */ new Map();
  config;
  constructor(config = {}) {
    this.config = {
      maxSize: config.maxSize ?? 100,
      ttl: config.ttl ?? 3600,
      // 1 hour default
      enabled: config.enabled ?? true,
      semanticCaching: config.semanticCaching ?? false,
      similarityThreshold: config.similarityThreshold ?? 0.9
    };
  }
  /**
   * Generate cache key from prompt and options
   */
  generateKey(prompt, options) {
    const data = JSON.stringify({ prompt, options });
    return createHash("sha256").update(data).digest("hex");
  }
  /**
   * Check if entry is expired
   */
  isExpired(entry) {
    const now = Date.now();
    const age = (now - entry.timestamp) / 1e3;
    return age > this.config.ttl;
  }
  /**
   * Calculate cosine similarity between two prompts
   * Returns a value between 0 (completely different) and 1 (identical)
   */
  calculateSimilarity(prompt1, prompt2) {
    const p1 = prompt1.toLowerCase().trim();
    const p2 = prompt2.toLowerCase().trim();
    if (p1 === p2) {
      return 1;
    }
    const words1 = p1.split(/\s+/);
    const words2 = p2.split(/\s+/);
    const vocabulary = /* @__PURE__ */ new Set([...words1, ...words2]);
    const vector1 = /* @__PURE__ */ new Map();
    const vector2 = /* @__PURE__ */ new Map();
    for (const word of words1) {
      vector1.set(word, (vector1.get(word) || 0) + 1);
    }
    for (const word of words2) {
      vector2.set(word, (vector2.get(word) || 0) + 1);
    }
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    for (const word of vocabulary) {
      const freq1 = vector1.get(word) || 0;
      const freq2 = vector2.get(word) || 0;
      dotProduct += freq1 * freq2;
      magnitude1 += freq1 * freq1;
      magnitude2 += freq2 * freq2;
    }
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }
    return dotProduct / (magnitude1 * magnitude2);
  }
  /**
   * Evict least recently used entry
   */
  evictLRU() {
    let oldestKey = null;
    let oldestAccess = Infinity;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
  /**
   * Get cached result if available
   *
   * @param prompt - The prompt text
   * @param options - Optional completion options
   * @returns Cached result or null if not found/expired
   */
  get(prompt, options) {
    if (!this.config.enabled) {
      return null;
    }
    const key = this.generateKey(prompt, options);
    let entry = this.cache.get(key);
    if (!entry && this.config.semanticCaching) {
      let bestMatch = null;
      let bestSimilarity = 0;
      for (const [, cachedEntry] of this.cache.entries()) {
        if (this.isExpired(cachedEntry)) {
          continue;
        }
        const optionsMatch = JSON.stringify(cachedEntry.options) === JSON.stringify(options);
        if (!optionsMatch) {
          continue;
        }
        const similarity = this.calculateSimilarity(prompt, cachedEntry.prompt);
        if (similarity >= this.config.similarityThreshold && similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestMatch = cachedEntry;
        }
      }
      entry = bestMatch;
    }
    if (!entry) {
      return null;
    }
    if (this.isExpired(entry)) {
      return null;
    }
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    return {
      ...entry.result,
      cached: true
    };
  }
  /**
   * Store result in cache
   *
   * @param prompt - The prompt text
   * @param options - Optional completion options
   * @param result - The completion result to cache
   */
  set(prompt, options, result) {
    if (!this.config.enabled) {
      return;
    }
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }
    const key = this.generateKey(prompt, options);
    const now = Date.now();
    this.cache.set(key, {
      prompt,
      options,
      result,
      timestamp: now,
      accessCount: 0,
      lastAccessed: now
    });
  }
  /**
   * Clear all cached entries
   */
  clear() {
    this.cache.clear();
  }
  /**
   * Get current cache size
   */
  size() {
    return this.cache.size;
  }
  /**
   * Get cache statistics
   */
  getStats() {
    let totalAccesses = 0;
    let expiredCount = 0;
    for (const entry of this.cache.values()) {
      totalAccesses += entry.accessCount;
      if (this.isExpired(entry)) {
        expiredCount++;
      }
    }
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      ttl: this.config.ttl,
      enabled: this.config.enabled,
      semanticCaching: this.config.semanticCaching,
      similarityThreshold: this.config.similarityThreshold,
      totalAccesses,
      expiredCount
    };
  }
  /**
   * Clean up expired entries
   */
  cleanup() {
    const keysToDelete = [];
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      this.cache.delete(key);
    }
  }
};

// src/core/compressor.ts
var FILLER_WORDS = [
  "very",
  "really",
  "quite",
  "rather",
  "somewhat",
  "fairly",
  "just",
  "actually",
  "basically",
  "literally",
  "honestly",
  "simply",
  "clearly",
  "obviously",
  "essentially",
  "particularly"
];
var PHRASE_REPLACEMENTS = {
  "in order to": "to",
  "due to the fact that": "because",
  "at this point in time": "now",
  "for the purpose of": "to",
  "in the event that": "if",
  "a large number of": "many",
  "a small number of": "few",
  "on a regular basis": "regularly",
  "in spite of": "despite",
  "take into consideration": "consider",
  "make a decision": "decide",
  "give an answer": "answer",
  "have the ability to": "can",
  "in the near future": "soon",
  "at the present time": "now"
};
var Compressor = class {
  /**
   * Compress a prompt based on the specified level
   *
   * @param prompt - The text to compress
   * @param level - Compression level (low, medium, high)
   * @returns Compressed prompt
   */
  static compress(prompt, level = "medium") {
    let compressed = prompt;
    compressed = this.normalizeWhitespace(compressed);
    if (level === "low") {
      return compressed;
    }
    compressed = this.removeFillerWords(compressed);
    compressed = this.simplifyPhrases(compressed);
    if (level === "medium") {
      return compressed;
    }
    compressed = this.removeArticles(compressed);
    compressed = this.useContractions(compressed);
    compressed = this.abbreviateCommon(compressed);
    return compressed;
  }
  /**
   * Normalize whitespace (remove extra spaces, trim)
   */
  static normalizeWhitespace(text) {
    return text.replace(/[^\S\n]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
  }
  /**
   * Remove filler words that don't add meaning
   */
  static removeFillerWords(text) {
    const fillerPattern = new RegExp(`\\b(${FILLER_WORDS.join("|")})\\b`, "gi");
    return text.replace(fillerPattern, "").replace(/\s+/g, " ").trim();
  }
  /**
   * Simplify common verbose phrases
   */
  static simplifyPhrases(text) {
    let simplified = text;
    for (const [verbose, concise] of Object.entries(PHRASE_REPLACEMENTS)) {
      const pattern = new RegExp(verbose, "gi");
      simplified = simplified.replace(pattern, concise);
    }
    return simplified;
  }
  /**
   * Remove articles (a, an, the) where they're not critical
   */
  static removeArticles(text) {
    return text.replace(/\s+(a|an|the)\s+/gi, " ").replace(/\s+/g, " ").trim();
  }
  /**
   * Use contractions to reduce token count
   */
  static useContractions(text) {
    const contractions = {
      "do not": "don't",
      "does not": "doesn't",
      "did not": "didn't",
      "will not": "won't",
      "would not": "wouldn't",
      "should not": "shouldn't",
      "could not": "couldn't",
      "cannot": "can't",
      "are not": "aren't",
      "is not": "isn't",
      "was not": "wasn't",
      "were not": "weren't",
      "have not": "haven't",
      "has not": "hasn't",
      "had not": "hadn't",
      "I am": "I'm",
      "you are": "you're",
      "he is": "he's",
      "she is": "she's",
      "it is": "it's",
      "we are": "we're",
      "they are": "they're",
      "I have": "I've",
      "you have": "you've",
      "we have": "we've",
      "they have": "they've",
      "I will": "I'll",
      "you will": "you'll",
      "he will": "he'll",
      "she will": "she'll",
      "we will": "we'll",
      "they will": "they'll",
      "I would": "I'd",
      "you would": "you'd",
      "he would": "he'd",
      "she would": "she'd",
      "we would": "we'd",
      "they would": "they'd"
    };
    let contracted = text;
    for (const [phrase, contraction] of Object.entries(contractions)) {
      const pattern = new RegExp(`\\b${phrase}\\b`, "gi");
      contracted = contracted.replace(pattern, contraction);
    }
    return contracted;
  }
  /**
   * Abbreviate common words
   */
  static abbreviateCommon(text) {
    const abbreviations = {
      "approximately": "approx",
      "regarding": "re",
      "information": "info",
      "example": "e.g.",
      "because": "bc",
      "without": "w/o",
      "with": "w/",
      "between": "btw",
      "through": "thru",
      "number": "no.",
      "versus": "vs"
    };
    let abbreviated = text;
    for (const [word, abbrev] of Object.entries(abbreviations)) {
      const pattern = new RegExp(`\\b${word}\\b`, "gi");
      abbreviated = abbreviated.replace(pattern, abbrev);
    }
    return abbreviated;
  }
  /**
   * Calculate compression ratio
   *
   * @param original - Original text
   * @param compressed - Compressed text
   * @returns Compression ratio (0-1, where 0.25 means 25% reduction)
   */
  static getCompressionRatio(original, compressed) {
    const originalLength = original.length;
    const compressedLength = compressed.length;
    if (originalLength === 0) return 0;
    const reduction = (originalLength - compressedLength) / originalLength;
    return Math.max(0, Math.min(1, reduction));
  }
};

// src/webhooks/slack.ts
async function sendSlackWebhook(webhookUrl, payload) {
  const slackPayload = formatSlackMessage(payload);
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(slackPayload)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Slack webhook failed: ${response.status} ${text}`);
  }
}
function formatSlackMessage(payload) {
  const { event, severity, data } = payload;
  const colors = {
    info: "#36a64f",
    // Green
    warning: "#ffcc00",
    // Yellow
    urgent: "#ff9900",
    // Orange
    critical: "#ff0000"
    // Red
  };
  const color = colors[severity] ?? "#36a64f";
  if (event === "budget_warning" || event === "budget_urgent" || event === "budget_exceeded") {
    const budgetData = data;
    return formatBudgetAlert(event, color, budgetData);
  }
  return {
    text: `Cognigate Alert: ${event}`,
    attachments: [{
      color,
      title: `Alert: ${event}`,
      text: JSON.stringify(data, null, 2),
      footer: "Cognigate",
      ts: Math.floor(Date.now() / 1e3)
    }]
  };
}
function formatBudgetAlert(event, color, data) {
  const titles = {
    budget_warning: "\u26A0\uFE0F Budget Warning: 50% Used",
    budget_urgent: "\u{1F6A8} Budget Alert: 80% Used",
    budget_exceeded: "\u{1F6D1} Budget Exceeded!"
  };
  const title = titles[event] || "Budget Alert";
  return {
    text: title,
    attachments: [{
      color,
      title,
      fields: [
        {
          title: "Daily Limit",
          value: `$${data.dailyLimit.toFixed(2)}`,
          short: true
        },
        {
          title: "Used",
          value: `$${data.used.toFixed(2)} (${data.percentage.toFixed(1)}%)`,
          short: true
        },
        {
          title: "Remaining",
          value: `$${data.remaining.toFixed(2)}`,
          short: true
        },
        {
          title: "Resets At",
          value: new Date(data.resetAt).toLocaleString(),
          short: true
        }
      ],
      footer: "Cognigate Budget Monitor",
      ts: Math.floor(Date.now() / 1e3)
    }]
  };
}

// src/webhooks/discord.ts
async function sendDiscordWebhook(webhookUrl, payload) {
  const discordPayload = formatDiscordMessage(payload);
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(discordPayload)
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Discord webhook failed: ${response.status} ${text}`);
  }
}
function formatDiscordMessage(payload) {
  const { event, severity, data } = payload;
  const colors = {
    info: 3581519,
    // Green
    warning: 16763904,
    // Yellow
    urgent: 16750848,
    // Orange
    critical: 16711680
    // Red
  };
  const color = colors[severity] ?? 3581519;
  if (event === "budget_warning" || event === "budget_urgent" || event === "budget_exceeded") {
    const budgetData = data;
    return formatBudgetAlert2(event, color, budgetData);
  }
  return {
    embeds: [{
      title: `Cognigate Alert: ${event}`,
      description: JSON.stringify(data, null, 2),
      color,
      footer: {
        text: "Cognigate"
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }]
  };
}
function formatBudgetAlert2(event, color, data) {
  const titles = {
    budget_warning: "\u26A0\uFE0F Budget Warning: 50% Used",
    budget_urgent: "\u{1F6A8} Budget Alert: 80% Used",
    budget_exceeded: "\u{1F6D1} Budget Exceeded!"
  };
  const title = titles[event] || "Budget Alert";
  return {
    content: title,
    embeds: [{
      title,
      color,
      fields: [
        {
          name: "Daily Limit",
          value: `$${data.dailyLimit.toFixed(2)}`,
          inline: true
        },
        {
          name: "Used",
          value: `$${data.used.toFixed(2)} (${data.percentage.toFixed(1)}%)`,
          inline: true
        },
        {
          name: "Remaining",
          value: `$${data.remaining.toFixed(2)}`,
          inline: true
        },
        {
          name: "Resets At",
          value: new Date(data.resetAt).toLocaleString(),
          inline: false
        }
      ],
      footer: {
        text: "Cognigate Budget Monitor"
      },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    }]
  };
}

// src/webhooks/webhook-manager.ts
var WebhookManager = class {
  config;
  constructor(config = {}) {
    this.config = config;
  }
  /**
   * Send alert to all configured webhooks
   *
   * @param payload - Alert payload
   * @returns Array of webhook results
   */
  async sendAlert(payload) {
    const results = [];
    if (this.config.slack) {
      try {
        await sendSlackWebhook(this.config.slack, payload);
        results.push({
          success: true,
          webhook: "slack"
        });
      } catch (error) {
        results.push({
          success: false,
          webhook: "slack",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    if (this.config.discord) {
      try {
        await sendDiscordWebhook(this.config.discord, payload);
        results.push({
          success: true,
          webhook: "discord"
        });
      } catch (error) {
        results.push({
          success: false,
          webhook: "discord",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    if (this.config.custom) {
      try {
        await this.sendCustomWebhook(this.config.custom, payload);
        results.push({
          success: true,
          webhook: "custom"
        });
      } catch (error) {
        results.push({
          success: false,
          webhook: "custom",
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
    return results;
  }
  /**
   * Send alert to custom webhook URL
   *
   * @param url - Webhook URL
   * @param payload - Alert payload
   */
  async sendCustomWebhook(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }
  }
  /**
   * Update webhook configuration
   *
   * @param config - New webhook configuration
   */
  updateConfig(config) {
    this.config = config;
  }
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
};

// src/core/gateway.ts
var Gateway = class {
  config;
  providers = [];
  budgetManager;
  cacheManager;
  alertManager;
  webhookManager;
  constructor(config = {}) {
    this.config = this.validateAndSetDefaults(config);
    this.alertManager = new AlertManager();
    this.budgetManager = new BudgetManager(this.config.dailyBudget, this.alertManager);
    this.cacheManager = new CacheManager({
      enabled: this.config.cacheEnabled,
      semanticCaching: this.config.semanticCaching,
      similarityThreshold: this.config.similarityThreshold
    });
    this.webhookManager = new WebhookManager(this.config.webhooks);
    this.alertManager.on("alert", (payload) => {
      this.webhookManager.sendAlert(payload).catch((error) => {
        console.error("Failed to send webhook alert:", error);
      });
    });
    this.initializeProviders();
  }
  /**
   * Initialize providers based on configuration
   */
  initializeProviders() {
    if (this.config.cloudProviders.openai) {
      this.providers.push(new OpenAIProvider(this.config.cloudProviders.openai));
    }
    if (this.config.cloudProviders.anthropic) {
      this.providers.push(new AnthropicProvider(this.config.cloudProviders.anthropic));
    }
    if (this.config.cloudProviders.google) {
      this.providers.push(new GoogleProvider(this.config.cloudProviders.google));
    }
    if (this.config.localFallback.enabled) {
      const localProviders = this.config.localFallback.providers || ["ollama", "lmstudio", "webllm"];
      for (const providerName of localProviders) {
        if (providerName === "ollama") {
          this.providers.push(new OllamaProvider());
        } else if (providerName === "lmstudio") {
          this.providers.push(new LMStudioProvider());
        } else if (providerName === "webllm") {
          this.providers.push(new WebLLMProvider());
        }
      }
    }
  }
  /**
   * Validates configuration and applies defaults
   */
  validateAndSetDefaults(config) {
    const hasCloudProvider = config.cloudProviders && Object.keys(config.cloudProviders).length > 0;
    const localFallbackExplicitlyDisabled = config.localFallback?.enabled === false;
    const defaultLocalFallback = !hasCloudProvider && !localFallbackExplicitlyDisabled;
    const validated = {
      dailyBudget: config.dailyBudget ?? 0,
      cacheEnabled: config.cacheEnabled ?? true,
      semanticCaching: config.semanticCaching ?? false,
      similarityThreshold: config.similarityThreshold ?? 0.9,
      compressionLevel: config.compressionLevel ?? "medium",
      localFallback: config.localFallback ?? {
        enabled: defaultLocalFallback,
        providers: ["ollama", "lmstudio", "webllm"]
      },
      cloudProviders: config.cloudProviders ?? {},
      webhooks: config.webhooks ?? {}
    };
    if (validated.dailyBudget < 0) {
      throw new ConfigurationError("dailyBudget must be >= 0 (0 = unlimited)");
    }
    const validCompressionLevels = ["low", "medium", "high"];
    if (!validCompressionLevels.includes(validated.compressionLevel)) {
      throw new ConfigurationError(
        `compressionLevel must be one of: ${validCompressionLevels.join(", ")}`
      );
    }
    if (validated.similarityThreshold < 0 || validated.similarityThreshold > 1) {
      throw new ConfigurationError(
        "similarityThreshold must be between 0 and 1"
      );
    }
    const hasAnyProvider = Object.keys(validated.cloudProviders).length > 0 || validated.localFallback.enabled;
    if (!hasAnyProvider) {
      throw new ConfigurationError(
        "At least one cloud provider or local fallback must be enabled"
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
  async complete(prompt, options) {
    const cachedResult = this.cacheManager.get(prompt, options);
    if (cachedResult) {
      return cachedResult.text;
    }
    const compressedPrompt = Compressor.compress(prompt, this.config.compressionLevel);
    let candidateProviders = this.providers;
    if (options?.forceProvider) {
      candidateProviders = this.providers.filter((p) => p.type === options.forceProvider);
    }
    if (candidateProviders.length === 0) {
      throw new ProviderUnavailableError(
        "all",
        "No providers configured. Add at least one cloud provider or enable local fallback."
      );
    }
    const errors = [];
    for (const provider of candidateProviders) {
      if (!await provider.isAvailable()) {
        errors.push({
          provider: provider.name,
          error: "Provider not available (check API key or service status)"
        });
        continue;
      }
      try {
        const estimatedCost = provider.estimateCost(compressedPrompt);
        this.budgetManager.checkBudget(estimatedCost);
        const result = await provider.complete(compressedPrompt, options);
        this.budgetManager.recordSpending(result.cost);
        this.cacheManager.set(prompt, options, result);
        return result.text;
      } catch (error) {
        if (error instanceof Error && error.name === "BudgetExceededError") {
          throw error;
        }
        errors.push({
          provider: provider.name,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        continue;
      }
    }
    const errorDetails = errors.map((e) => `${e.provider}: ${e.error}`).join("; ");
    throw new ProviderUnavailableError(
      "all",
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
  async *stream(prompt, options) {
    const compressedPrompt = Compressor.compress(prompt, this.config.compressionLevel);
    let candidateProviders = this.providers;
    if (options?.forceProvider) {
      candidateProviders = this.providers.filter((p) => p.type === options.forceProvider);
    }
    if (candidateProviders.length === 0) {
      throw new ProviderUnavailableError(
        "all",
        "No providers configured. Add at least one cloud provider or enable local fallback."
      );
    }
    const errors = [];
    for (const provider of candidateProviders) {
      if (!await provider.isAvailable()) {
        errors.push({
          provider: provider.name,
          error: "Provider not available (check API key or service status)"
        });
        continue;
      }
      try {
        const estimatedCost = provider.estimateCost(compressedPrompt);
        this.budgetManager.checkBudget(estimatedCost);
        let fullText = "";
        for await (const token of provider.stream(compressedPrompt, options)) {
          fullText += token;
          yield token;
        }
        this.budgetManager.recordSpending(estimatedCost);
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "BudgetExceededError") {
          throw error;
        }
        errors.push({
          provider: provider.name,
          error: error instanceof Error ? error.message : "Unknown error"
        });
        continue;
      }
    }
    const errorDetails = errors.map((e) => `${e.provider}: ${e.error}`).join("; ");
    throw new ProviderUnavailableError(
      "all",
      `All providers failed. Errors: ${errorDetails}`
    );
  }
  /**
   * Get current budget status
   *
   * @returns Budget status including used, remaining, and reset time
   */
  getBudgetStatus() {
    return this.budgetManager.getStatus();
  }
  /**
   * Clear the cache manually
   */
  clearCache() {
    this.cacheManager.clear();
  }
  /**
   * Get the current configuration
   * (Useful for debugging)
   */
  getConfig() {
    return { ...this.config };
  }
};

// src/voice/types.ts
var VoiceError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "VoiceError";
  }
};
var VoiceNotSupportedError = class extends VoiceError {
  constructor(feature) {
    super(`${feature} is not supported in this browser`);
    this.name = "VoiceNotSupportedError";
  }
};
var VoicePermissionError = class extends VoiceError {
  constructor() {
    super("Microphone permission denied");
    this.name = "VoicePermissionError";
  }
};

// src/voice/recognizer.ts
var SpeechRecognizer = class _SpeechRecognizer {
  recognition;
  // SpeechRecognition type not available in Node
  config;
  listeners = /* @__PURE__ */ new Map();
  isListening = false;
  constructor(config = {}) {
    this.config = {
      language: config.language || "",
      continuous: config.continuous ?? false,
      interimResults: config.interimResults ?? false,
      maxAlternatives: config.maxAlternatives ?? 1
    };
    if (!this.isSupported()) {
      throw new VoiceNotSupportedError("Speech Recognition");
    }
    this.initializeRecognition();
  }
  /**
   * Check if speech recognition is supported
   */
  static isSupported() {
    if (typeof window === "undefined") {
      return false;
    }
    return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
  }
  /**
   * Check if speech recognition is supported (instance method)
   */
  isSupported() {
    return _SpeechRecognizer.isSupported();
  }
  /**
   * Initialize speech recognition
   */
  initializeRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    if (this.config.language) {
      this.recognition.lang = this.config.language;
    }
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives;
    this.recognition.onresult = (event) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      const alternative = lastResult[0];
      const result = {
        transcript: alternative.transcript,
        confidence: alternative.confidence,
        isFinal: lastResult.isFinal
      };
      this.emit("result", result);
    };
    this.recognition.onerror = (event) => {
      const error = event.error;
      if (error === "not-allowed" || error === "permission-denied") {
        this.emit("error", new VoicePermissionError());
      } else {
        this.emit("error", new Error(`Speech recognition error: ${error}`));
      }
      this.isListening = false;
    };
    this.recognition.onend = () => {
      this.isListening = false;
      this.emit("end");
    };
    this.recognition.onstart = () => {
      this.isListening = true;
      this.emit("start");
    };
  }
  /**
   * Start listening for speech
   *
   * @throws {VoicePermissionError} If microphone permission is denied
   */
  async startListening() {
    if (this.isListening) {
      return;
    }
    try {
      this.recognition.start();
    } catch (error) {
      if (error instanceof Error && error.message.includes("already started")) {
        return;
      }
      throw error;
    }
  }
  /**
   * Stop listening for speech
   */
  stopListening() {
    if (!this.isListening) {
      return;
    }
    this.recognition.stop();
  }
  /**
   * Abort listening immediately
   */
  abort() {
    this.recognition.abort();
    this.isListening = false;
  }
  /**
   * Check if currently listening
   */
  isActive() {
    return this.isListening;
  }
  /**
   * Register event listener
   *
   * Events:
   * - 'result': Fired when speech is recognized
   * - 'error': Fired when an error occurs
   * - 'start': Fired when recognition starts
   * - 'end': Fired when recognition ends
   *
   * @param event - Event name
   * @param callback - Event callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(callback);
  }
  /**
   * Remove event listener
   *
   * @param event - Event name
   * @param callback - Event callback
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }
  /**
   * Emit event to all listeners
   *
   * @param event - Event name
   * @param data - Event data
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
};

// src/voice/speaker.ts
var Speaker = class _Speaker {
  config;
  synthesis;
  listeners = /* @__PURE__ */ new Map();
  queue = [];
  isSpeaking = false;
  constructor(config = {}) {
    this.config = {
      voiceName: config.voiceName || "",
      language: config.language || "en-US",
      rate: config.rate ?? 1,
      pitch: config.pitch ?? 1,
      volume: config.volume ?? 1
    };
    if (!this.isSupported()) {
      throw new VoiceNotSupportedError("Speech Synthesis");
    }
    this.synthesis = window.speechSynthesis;
  }
  /**
   * Check if text-to-speech is supported
   */
  static isSupported() {
    if (typeof window === "undefined") {
      return false;
    }
    return "speechSynthesis" in window;
  }
  /**
   * Check if text-to-speech is supported (instance method)
   */
  isSupported() {
    return _Speaker.isSupported();
  }
  /**
   * Speak text aloud
   *
   * @param text - Text to speak
   * @param options - Optional override config for this utterance
   */
  speak(text, options) {
    const utterance = new SpeechSynthesisUtterance(text);
    const config = { ...this.config, ...options };
    utterance.lang = config.language;
    utterance.rate = config.rate;
    utterance.pitch = config.pitch;
    utterance.volume = config.volume;
    if (config.voiceName) {
      const voices = this.getVoices();
      const voice = voices.find((v) => v.name === config.voiceName);
      if (voice) {
        utterance.voice = voice;
      }
    }
    utterance.onstart = () => {
      this.isSpeaking = true;
      this.emit("start");
    };
    utterance.onend = () => {
      this.isSpeaking = false;
      this.emit("end");
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        this.synthesis.speak(next);
      }
    };
    utterance.onerror = (event) => {
      this.isSpeaking = false;
      this.emit("error", new Error(`TTS error: ${event.error}`));
    };
    if (this.isSpeaking) {
      this.queue.push(utterance);
    } else {
      this.synthesis.speak(utterance);
    }
  }
  /**
   * Stop speaking immediately
   */
  stop() {
    this.synthesis.cancel();
    this.queue = [];
    this.isSpeaking = false;
  }
  /**
   * Pause speaking
   */
  pause() {
    if (this.synthesis.speaking) {
      this.synthesis.pause();
    }
  }
  /**
   * Resume speaking
   */
  resume() {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }
  /**
   * Check if currently speaking
   */
  isActive() {
    return this.isSpeaking || this.synthesis.speaking;
  }
  /**
   * Get available voices
   *
   * @returns List of available speech synthesis voices
   */
  getVoices() {
    return this.synthesis.getVoices();
  }
  /**
   * Get voices for a specific language
   *
   * @param language - Language code (e.g., 'en-US')
   * @returns Voices matching the language
   */
  getVoicesForLanguage(language) {
    return this.getVoices().filter((voice) => voice.lang.startsWith(language));
  }
  /**
   * Register event listener
   *
   * Events:
   * - 'start': Fired when speech starts
   * - 'end': Fired when speech ends
   * - 'error': Fired when an error occurs
   *
   * @param event - Event name
   * @param callback - Event callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(callback);
  }
  /**
   * Remove event listener
   *
   * @param event - Event name
   * @param callback - Event callback
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }
  /**
   * Emit event to all listeners
   *
   * @param event - Event name
   * @param data - Event data
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Get queue length
   */
  getQueueLength() {
    return this.queue.length;
  }
};

// src/voice/conversation.ts
var Conversation = class {
  gateway;
  recognizer;
  speaker;
  config;
  listeners = /* @__PURE__ */ new Map();
  isActive = false;
  shouldContinue = false;
  constructor(gateway, config = {}) {
    this.gateway = gateway;
    this.config = {
      continuous: config.continuous ?? false,
      autoSpeak: config.autoSpeak ?? true,
      recognizer: config.recognizer ?? {},
      speaker: config.speaker ?? {}
    };
    this.recognizer = new SpeechRecognizer({
      ...this.config.recognizer,
      continuous: false
      // We handle continuation at conversation level
    });
    this.speaker = new Speaker(this.config.speaker);
    this.setupEventHandlers();
  }
  /**
   * Set up event handlers for recognizer and speaker
   */
  setupEventHandlers() {
    this.recognizer.on("result", async (result) => {
      if (!result.isFinal) {
        this.emit("interim", result.transcript);
        return;
      }
      const transcript = result.transcript;
      this.emit("transcript", transcript);
      try {
        const response = await this.gateway.complete(transcript);
        this.emit("response", response);
        if (this.config.autoSpeak) {
          this.speaker.speak(response);
        }
      } catch (error) {
        this.emit("error", error);
      }
    });
    this.recognizer.on("error", (error) => {
      this.emit("error", error);
    });
    this.recognizer.on("end", () => {
      if (this.shouldContinue && this.config.autoSpeak) {
        if (!this.speaker.isActive()) {
          this.resumeListening();
        }
      }
    });
    this.speaker.on("end", () => {
      if (this.shouldContinue && !this.recognizer.isActive()) {
        this.resumeListening();
      }
    });
    this.speaker.on("error", (error) => {
      this.emit("error", error);
    });
  }
  /**
   * Resume listening after a delay
   */
  resumeListening() {
    setTimeout(() => {
      if (this.shouldContinue) {
        this.recognizer.startListening().catch((error) => {
          this.emit("error", error);
        });
      }
    }, 500);
  }
  /**
   * Start conversation
   */
  async start() {
    this.isActive = true;
    this.shouldContinue = this.config.continuous;
    this.emit("start");
    await this.recognizer.startListening();
  }
  /**
   * Stop conversation
   */
  stop() {
    this.isActive = false;
    this.shouldContinue = false;
    this.recognizer.stopListening();
    this.speaker.stop();
    this.emit("stop");
  }
  /**
   * Toggle conversation on/off
   */
  async toggle() {
    if (this.isActive) {
      this.stop();
    } else {
      await this.start();
    }
  }
  /**
   * Pause conversation (temporary stop)
   */
  pause() {
    this.recognizer.stopListening();
    this.speaker.pause();
    this.emit("pause");
  }
  /**
   * Resume conversation after pause
   */
  async resume() {
    this.speaker.resume();
    await this.recognizer.startListening();
    this.emit("resume");
  }
  /**
   * Check if conversation is active
   */
  isRunning() {
    return this.isActive;
  }
  /**
   * Check if recognizer is listening
   */
  isListening() {
    return this.recognizer.isActive();
  }
  /**
   * Check if speaker is speaking
   */
  isSpeaking() {
    return this.speaker.isActive();
  }
  /**
   * Get available voices
   */
  getVoices() {
    return this.speaker.getVoices();
  }
  /**
   * Register event listener
   *
   * Events:
   * - 'start': Conversation started
   * - 'stop': Conversation stopped
   * - 'pause': Conversation paused
   * - 'resume': Conversation resumed
   * - 'interim': Interim transcript (while still speaking)
   * - 'transcript': Final transcript from user
   * - 'response': AI response text
   * - 'error': Error occurred
   *
   * @param event - Event name
   * @param callback - Event callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(callback);
  }
  /**
   * Remove event listener
   *
   * @param event - Event name
   * @param callback - Event callback
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }
  /**
   * Emit event to all listeners
   *
   * @param event - Event name
   * @param data - Event data
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
};

// src/index.ts
function createGateway(config = {}) {
  return new Gateway(config);
}

export { BudgetExceededError, CacheError, CognigateError, ConfigurationError, Conversation, Gateway, ProviderUnavailableError, Speaker, SpeechRecognizer, VoiceError, VoiceModeError, VoiceNotSupportedError, VoicePermissionError, WebhookManager, createGateway, sendDiscordWebhook, sendSlackWebhook };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map