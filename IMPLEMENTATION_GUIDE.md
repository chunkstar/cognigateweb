# Cognigate - Implementation Guide

This guide provides step-by-step instructions for implementing the cognigate library based on the technical architecture.

---

## Phase 1: Core Foundation

### Step 1.1: Project Initialization

```bash
# Create project
npm init -y
npm install -D typescript @types/node vite tsup vitest

# Initialize TypeScript
npx tsc --init
```

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**package.json scripts:**
```json
{
  "name": "cognigate",
  "version": "4.0.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
    "./voice": {
      "import": "./dist/voice/voice-chat.mjs",
      "require": "./dist/voice/voice-chat.cjs",
      "types": "./dist/voice/voice-chat.d.ts"
    }
  },
  "scripts": {
    "build": "tsup",
    "test": "vitest",
    "dev": "tsup --watch"
  }
}
```

**tsup.config.ts:**
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'voice/voice-chat': 'src/voice/voice-chat.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [],
});
```

### Step 1.2: Type Definitions

**src/utils/types.ts:**
```typescript
export interface GatewayConfig {
  dailyBudget?: number;
  cacheEnabled?: boolean;
  compressionLevel?: 'low' | 'medium' | 'high';
  localFallback?: LocalFallbackConfig;
  cloudProviders?: CloudProvidersConfig;
  webhooks?: WebhooksConfig;
}

export interface LocalFallbackConfig {
  enabled: boolean;
  providers?: ('ollama' | 'lmstudio' | 'webllm')[];
}

export interface CloudProvidersConfig {
  openai?: ProviderConfig;
  anthropic?: ProviderConfig;
  google?: ProviderConfig;
}

export interface ProviderConfig {
  apiKey: string;
  models?: string[];
  baseUrl?: string;
}

export interface WebhooksConfig {
  slack?: string;
  discord?: string;
  custom?: string;
}

export interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  forceProvider?: 'cloud' | 'local';
}

export interface CompletionResult {
  text: string;
  tokens: number;
  cost: number;
  provider: string;
  cached: boolean;
}

export interface BudgetStatus {
  dailyLimit: number;
  used: number;
  remaining: number;
  resetAt: Date;
}

export interface CacheEntry {
  prompt: string;
  response: string;
  timestamp: number;
  hits: number;
}

export interface Provider {
  name: string;
  type: 'cloud' | 'local';
  isAvailable(): Promise<boolean>;
  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
  estimateCost(prompt: string): number;
}
```

### Step 1.3: Error Classes

**src/utils/errors.ts:**
```typescript
export class CognigateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CognigateError';
  }
}

export class BudgetExceededError extends CognigateError {
  constructor(used: number, limit: number) {
    super(`Daily budget exceeded: $${used.toFixed(2)} / $${limit.toFixed(2)}`);
    this.name = 'BudgetExceededError';
  }
}

export class ProviderUnavailableError extends CognigateError {
  constructor(provider: string) {
    super(`Provider unavailable: ${provider}`);
    this.name = 'ProviderUnavailableError';
  }
}

export class CacheError extends CognigateError {
  constructor(message: string) {
    super(`Cache error: ${message}`);
    this.name = 'CacheError';
  }
}

export class VoiceModeError extends CognigateError {
  constructor(message: string) {
    super(`Voice mode error: ${message}`);
    this.name = 'VoiceModeError';
  }
}
```

### Step 1.4: Budget Manager

**src/core/budget.ts:**
```typescript
import { BudgetStatus } from '../utils/types.js';

export class BudgetManager {
  private dailyLimit: number;
  private used: number = 0;
  private resetAt: Date;

  constructor(dailyLimit: number = 0) {
    this.dailyLimit = dailyLimit;
    this.resetAt = this.getNextResetTime();
    this.checkAndReset();
  }

  private getNextResetTime(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
  }

  private checkAndReset(): void {
    const now = new Date();
    if (now >= this.resetAt) {
      this.used = 0;
      this.resetAt = this.getNextResetTime();
    }
  }

  recordUsage(cost: number): void {
    this.checkAndReset();
    this.used += cost;
  }

  canAfford(estimatedCost: number): boolean {
    this.checkAndReset();

    // 0 = unlimited
    if (this.dailyLimit === 0) return true;

    return (this.used + estimatedCost) <= this.dailyLimit;
  }

  getStatus(): BudgetStatus {
    this.checkAndReset();
    return {
      dailyLimit: this.dailyLimit,
      used: this.used,
      remaining: Math.max(0, this.dailyLimit - this.used),
      resetAt: this.resetAt,
    };
  }

  getRemainingBudget(): number {
    this.checkAndReset();
    return this.dailyLimit === 0 ? Infinity : Math.max(0, this.dailyLimit - this.used);
  }

  reset(): void {
    this.used = 0;
    this.resetAt = this.getNextResetTime();
  }
}
```

### Step 1.5: Simple Cache

**src/core/cache.ts:**
```typescript
import { CacheEntry } from '../utils/types.js';

export class SimpleCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number = 1000;
  private ttl: number = 3600000; // 1 hour in ms

  constructor(maxSize?: number, ttl?: number) {
    if (maxSize) this.maxSize = maxSize;
    if (ttl) this.ttl = ttl;
  }

  private hash(prompt: string): string {
    // Simple hash for now, can be improved with semantic similarity
    return prompt.toLowerCase().trim();
  }

  get(prompt: string): string | null {
    const key = this.hash(prompt);
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.response;
  }

  set(prompt: string, response: string): void {
    const key = this.hash(prompt);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      prompt,
      response,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
```

### Step 1.6: Compression

**src/core/compression.ts:**
```typescript
export type CompressionLevel = 'low' | 'medium' | 'high';

export class Compressor {
  private level: CompressionLevel;

  constructor(level: CompressionLevel = 'medium') {
    this.level = level;
  }

  compress(text: string): string {
    switch (this.level) {
      case 'low':
        return this.compressLow(text);
      case 'medium':
        return this.compressMedium(text);
      case 'high':
        return this.compressHigh(text);
      default:
        return text;
    }
  }

  private compressLow(text: string): string {
    // Remove extra whitespace
    return text.replace(/\s+/g, ' ').trim();
  }

  private compressMedium(text: string): string {
    let compressed = this.compressLow(text);

    // Common word replacements
    const replacements: Record<string, string> = {
      ' and ': ' & ',
      ' or ': ' | ',
      'you are': "you're",
      'do not': "don't",
      'will not': "won't",
    };

    for (const [long, short] of Object.entries(replacements)) {
      compressed = compressed.replace(new RegExp(long, 'gi'), short);
    }

    return compressed;
  }

  private compressHigh(text: string): string {
    let compressed = this.compressMedium(text);

    // Remove articles and filler words
    const fillers = ['the', 'a', 'an', 'very', 'really', 'just'];
    const regex = new RegExp(`\\b(${fillers.join('|')})\\b`, 'gi');
    compressed = compressed.replace(regex, '');

    // Condense further
    return compressed.replace(/\s+/g, ' ').trim();
  }
}
```

### Step 1.7: Basic Provider (OpenAI)

**src/providers/base.ts:**
```typescript
import { Provider, CompletionOptions, CompletionResult } from '../utils/types.js';

export abstract class BaseProvider implements Provider {
  abstract name: string;
  abstract type: 'cloud' | 'local';

  abstract isAvailable(): Promise<boolean>;
  abstract complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
  abstract estimateCost(prompt: string): number;

  protected estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }
}
```

**src/providers/cloud/openai.ts:**
```typescript
import { BaseProvider } from '../base.js';
import { CompletionOptions, CompletionResult, ProviderConfig } from '../../utils/types.js';

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
    return !!this.apiKey;
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    const model = options?.model || this.models[0];

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';
    const tokens = data.usage?.total_tokens || this.estimateTokens(prompt + text);

    return {
      text,
      tokens,
      cost: this.calculateCost(tokens, model),
      provider: this.name,
      cached: false,
    };
  }

  estimateCost(prompt: string): number {
    const tokens = this.estimateTokens(prompt);
    return this.calculateCost(tokens, this.models[0]);
  }

  private calculateCost(tokens: number, model: string): number {
    // Pricing per 1M tokens (as of 2025)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o-mini': { input: 0.15, output: 0.60 },
      'gpt-4o': { input: 2.50, output: 10.00 },
      'gpt-4': { input: 30.00, output: 60.00 },
    };

    const rate = pricing[model] || pricing['gpt-4o-mini'];
    // Assume 50/50 split input/output
    return ((tokens / 2) * rate.input + (tokens / 2) * rate.output) / 1_000_000;
  }
}
```

### Step 1.8: Gateway Core

**src/core/gateway.ts:**
```typescript
import { BudgetManager } from './budget.js';
import { SimpleCache } from './cache.js';
import { Compressor } from './compression.js';
import { OpenAIProvider } from '../providers/cloud/openai.js';
import { BudgetExceededError, ProviderUnavailableError } from '../utils/errors.js';
import type {
  GatewayConfig,
  CompletionOptions,
  BudgetStatus,
  Provider,
} from '../utils/types.js';

export class Gateway {
  private budget: BudgetManager;
  private cache: SimpleCache;
  private compressor: Compressor;
  private providers: Provider[] = [];
  private config: GatewayConfig;

  constructor(config: GatewayConfig = {}) {
    this.config = config;
    this.budget = new BudgetManager(config.dailyBudget || 0);
    this.cache = config.cacheEnabled !== false ? new SimpleCache() : new SimpleCache(0);
    this.compressor = new Compressor(config.compressionLevel || 'medium');

    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize cloud providers
    if (this.config.cloudProviders?.openai) {
      this.providers.push(new OpenAIProvider(this.config.cloudProviders.openai));
    }

    // TODO: Add Anthropic, Google, and local providers
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<string> {
    // 1. Check cache
    const cached = this.cache.get(prompt);
    if (cached) {
      return cached;
    }

    // 2. Compress prompt
    const compressed = this.compressor.compress(prompt);

    // 3. Select provider
    const provider = await this.selectProvider(compressed, options);
    if (!provider) {
      throw new ProviderUnavailableError('No providers available');
    }

    // 4. Check budget
    const estimatedCost = provider.estimateCost(compressed);
    if (!this.budget.canAfford(estimatedCost)) {
      throw new BudgetExceededError(
        this.budget.getStatus().used,
        this.budget.getStatus().dailyLimit
      );
    }

    // 5. Execute request
    const result = await provider.complete(compressed, options);

    // 6. Record usage
    this.budget.recordUsage(result.cost);

    // 7. Cache response
    this.cache.set(prompt, result.text);

    return result.text;
  }

  private async selectProvider(
    prompt: string,
    options?: CompletionOptions
  ): Promise<Provider | null> {
    // Find first available provider
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        return provider;
      }
    }
    return null;
  }

  getBudgetStatus(): BudgetStatus {
    return this.budget.getStatus();
  }

  clearCache(): void {
    this.cache.clear();
  }
}
```

### Step 1.9: Public API

**src/index.ts:**
```typescript
export { Gateway } from './core/gateway.js';
export type {
  GatewayConfig,
  CompletionOptions,
  BudgetStatus,
  CompletionResult,
  Provider,
} from './utils/types.js';
export {
  CognigateError,
  BudgetExceededError,
  ProviderUnavailableError,
  CacheError,
} from './utils/errors.js';

export function createGateway(config: GatewayConfig = {}) {
  return new Gateway(config);
}
```

### Step 1.10: Basic Test

**tests/core/gateway.test.ts:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createGateway } from '../../src/index.js';

describe('Gateway', () => {
  it('should create a gateway instance', () => {
    const gateway = createGateway();
    expect(gateway).toBeDefined();
  });

  it('should track budget correctly', () => {
    const gateway = createGateway({ dailyBudget: 10 });
    const status = gateway.getBudgetStatus();

    expect(status.dailyLimit).toBe(10);
    expect(status.used).toBe(0);
    expect(status.remaining).toBe(10);
  });

  it('should clear cache', () => {
    const gateway = createGateway({ cacheEnabled: true });
    gateway.clearCache();
    // No error should be thrown
  });
});
```

---

## Phase 2: Multi-Provider Support

### Step 2.1: Local Provider Detector

**src/providers/local/detector.ts:**
```typescript
export class LocalProviderDetector {
  async detectOllama(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      return response.ok;
    } catch {
      return false;
    }
  }

  async detectLMStudio(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:1234/v1/models');
      return response.ok;
    } catch {
      return false;
    }
  }

  async detectWebLLM(): Promise<boolean> {
    // Check if running in browser
    return typeof window !== 'undefined' && 'gpu' in navigator;
  }

  async detectAll(): Promise<{
    ollama: boolean;
    lmstudio: boolean;
    webllm: boolean;
  }> {
    const [ollama, lmstudio, webllm] = await Promise.all([
      this.detectOllama(),
      this.detectLMStudio(),
      this.detectWebLLM(),
    ]);

    return { ollama, lmstudio, webllm };
  }
}
```

### Step 2.2: Ollama Provider

**src/providers/local/ollama.ts:**
```typescript
import { BaseProvider } from '../base.js';
import { CompletionOptions, CompletionResult } from '../../utils/types.js';

export class OllamaProvider extends BaseProvider {
  name = 'ollama';
  type = 'local' as const;

  private baseUrl = 'http://localhost:11434';
  private model = 'llama3.2';

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult> {
    const model = options?.model || this.model;

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.response || '';
    const tokens = this.estimateTokens(prompt + text);

    return {
      text,
      tokens,
      cost: 0, // Local = free
      provider: this.name,
      cached: false,
    };
  }

  estimateCost(_prompt: string): number {
    return 0; // Local providers are free
  }
}
```

---

## Phase 3: Voice Mode

### Step 3.1: Voice Mode Class

**src/voice/voice-chat.ts:**
```typescript
import { Gateway } from '../core/gateway.js';
import { VoiceModeError } from '../utils/errors.js';

export interface VoiceOptions {
  lang?: string;
  autoSpeak?: boolean;
  continuous?: boolean;
  voiceId?: string;
}

export class VoiceMode {
  private gateway: Gateway;
  private options: VoiceOptions;
  private recognition: any; // SpeechRecognition
  private synthesis: SpeechSynthesis;
  private isListening = false;

  constructor(gateway: Gateway, options: VoiceOptions = {}) {
    this.gateway = gateway;
    this.options = {
      lang: 'en-US',
      autoSpeak: true,
      continuous: true,
      ...options,
    };

    // Check browser support
    if (typeof window === 'undefined') {
      throw new VoiceModeError('Voice mode requires browser environment');
    }

    this.synthesis = window.speechSynthesis;
    this.initRecognition();
  }

  private initRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new VoiceModeError('SpeechRecognition not supported');
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = this.options.continuous;
    this.recognition.lang = this.options.lang;
    this.recognition.interimResults = false;

    this.recognition.onresult = async (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      console.log('User said:', transcript);

      try {
        const response = await this.gateway.complete(transcript);
        console.log('AI:', response);

        if (this.options.autoSpeak) {
          await this.speak(response);
        }
      } catch (error) {
        console.error('Error:', error);
        await this.speak('Sorry, I encountered an error.');
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };
  }

  startListening(): void {
    if (this.isListening) return;
    this.recognition.start();
    this.isListening = true;
    console.log('🎤 Listening...');
  }

  stopListening(): void {
    if (!this.isListening) return;
    this.recognition.stop();
    this.isListening = false;
    console.log('🛑 Stopped listening');
  }

  toggle(): void {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  async speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.options.lang || 'en-US';

      if (this.options.voiceId) {
        const voices = this.synthesis.getVoices();
        const voice = voices.find(v => v.name === this.options.voiceId);
        if (voice) utterance.voice = voice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new VoiceModeError(`TTS error: ${event.error}`));

      this.synthesis.speak(utterance);
    });
  }
}
```

---

## Phase 4: Webhook Support

### Step 4.1: Webhook Manager

**src/webhooks/manager.ts:**
```typescript
import { WebhooksConfig } from '../utils/types.js';

export interface WebhookMessage {
  type: 'budget_alert' | 'budget_exceeded' | 'error' | 'daily_summary';
  message: string;
  data?: any;
}

export class WebhookManager {
  private config: WebhooksConfig;

  constructor(config: WebhooksConfig = {}) {
    this.config = config;
  }

  async send(message: WebhookMessage): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.config.slack) {
      promises.push(this.sendToSlack(message));
    }

    if (this.config.discord) {
      promises.push(this.sendToDiscord(message));
    }

    if (this.config.custom) {
      promises.push(this.sendToCustom(message));
    }

    await Promise.allSettled(promises);
  }

  private async sendToSlack(message: WebhookMessage): Promise<void> {
    if (!this.config.slack) return;

    const payload = {
      text: `[Cognigate] ${message.type}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message.message,
          },
        },
      ],
    };

    await fetch(this.config.slack, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  private async sendToDiscord(message: WebhookMessage): Promise<void> {
    if (!this.config.discord) return;

    const payload = {
      content: `**[Cognigate]** ${message.message}`,
      embeds: message.data ? [{ description: JSON.stringify(message.data, null, 2) }] : [],
    };

    await fetch(this.config.discord, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

  private async sendToCustom(message: WebhookMessage): Promise<void> {
    if (!this.config.custom) return;

    await fetch(this.config.custom, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  }
}
```

---

## Next Steps

1. **Review** the architecture and this implementation guide
2. **Start Phase 1** by setting up the project structure
3. **Test each component** as you build it
4. **Iterate** based on real-world usage

Would you like me to:
- Generate the initial project files?
- Create package.json with all dependencies?
- Set up testing infrastructure?
- Start implementing Phase 1?
