# Cognigate - Technical Architecture

**Version:** 1.0.0
**Date:** 2025-11-21
**Status:** Design Phase

---

## 1. Requirements Analysis

### 1.1 Functional Requirements

Based on the provided examples, cognigate must:

1. **AI Gateway Core**
   - Unified API to interact with multiple LLM providers
   - Simple `ai.complete(prompt)` interface
   - Support for streaming responses
   - Provider abstraction (cloud and local)

2. **Budget Management**
   - Daily spending limits (hard cutoff at limit)
   - Cost tracking across providers
   - Block requests when budget exceeded
   - Per-request cost calculation

3. **Performance Optimization**
   - Semantic caching (deduplicate similar requests)
   - Compression (reduce token usage)
   - Configurable compression levels

4. **Local Fallback Chain**
   - Auto-detect local LLM providers
   - Fallback order: Ollama → LM Studio → WebLLM
   - Seamless switchover when cloud budget exhausted
   - Zero-cost local inference

5. **Voice Mode**
   - Speech-to-text (mic input)
   - Text-to-speech (AI responses)
   - Continuous listen loop
   - Language configuration
   - Toggle on/off

6. **Alerts & Monitoring**
   - Webhook notifications (Slack, Discord, etc.)
   - Budget alerts
   - Fallback notifications
   - Error reporting

### 1.2 Non-Functional Requirements

1. **Cross-Platform**
   - Node.js (server-side)
   - Browser (client-side via CDN)
   - React/Next.js (framework integration)

2. **Developer Experience**
   - Zero-config defaults
   - Simple API surface
   - TypeScript-first
   - ESM and CommonJS support

3. **Performance**
   - < 100ms overhead for request routing
   - Efficient caching (in-memory + optional persistent)
   - Minimal bundle size for browser

4. **Reliability**
   - Graceful degradation
   - Auto-retry with exponential backoff
   - Error recovery

5. **Security**
   - API key management
   - Environment variable support
   - No key exposure in browser bundles

### 1.3 Constraints

- Must work in browser without CORS issues (local models)
- Must handle budget tracking without external database (in-memory OK)
- Must detect local providers without complex installation
- Voice mode requires browser Web APIs (MediaRecorder, SpeechSynthesis)

---

## 2. System Architecture

### 2.1 High-Level Components

```
┌─────────────────────────────────────────────────┐
│                   Cognigate API                 │
│              (createGateway, VoiceMode)         │
└───────────────────┬─────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│  Gateway Core  │    │   Voice Mode    │
│                │    │                 │
│ - Routing      │    │ - STT/TTS       │
│ - Budget       │    │ - Audio Input   │
│ - Caching      │    │ - Listening Loop│
└───────┬────────┘    └─────────────────┘
        │
        │
┌───────┴────────────────────────────────────────┐
│              Provider Manager                  │
│  (Routes to Cloud or Local based on budget)    │
└───┬────────────────────────────────────────┬───┘
    │                                        │
┌───▼──────────┐                    ┌────────▼─────────┐
│ Cloud Router │                    │  Local Detector  │
│              │                    │                  │
│ - OpenAI     │                    │ - Ollama         │
│ - Anthropic  │                    │ - LM Studio      │
│ - Google     │                    │ - WebLLM         │
│ - Others     │                    │                  │
└──────────────┘                    └──────────────────┘
```

### 2.2 Core Components

#### A. Gateway Core
**Responsibilities:**
- Request orchestration
- Budget enforcement
- Cache management
- Compression application
- Error handling

**Key Classes:**
```typescript
class Gateway {
  constructor(config: GatewayConfig)
  complete(prompt: string, options?: CompletionOptions): Promise<string>
  stream(prompt: string, options?: StreamOptions): AsyncIterator<string>
  getBudgetStatus(): BudgetStatus
}
```

#### B. Budget Manager
**Responsibilities:**
- Track daily spending
- Calculate per-request costs
- Enforce limits
- Reset at daily boundaries

**Key Classes:**
```typescript
class BudgetManager {
  recordUsage(tokens: number, provider: string): void
  canAfford(estimatedTokens: number, provider: string): boolean
  getRemainingBudget(): number
  reset(): void
}
```

#### C. Provider Manager
**Responsibilities:**
- Detect available providers
- Route requests
- Handle provider-specific APIs
- Manage failover

**Key Classes:**
```typescript
interface Provider {
  name: string
  isAvailable(): Promise<boolean>
  complete(prompt: string): Promise<CompletionResult>
  estimateCost(prompt: string): number
}

class CloudProvider implements Provider { }
class LocalProvider implements Provider { }
```

#### D. Cache Layer
**Responsibilities:**
- Semantic similarity detection
- Cache storage (in-memory + optional persistence)
- TTL management
- Cache invalidation

**Key Classes:**
```typescript
class SemanticCache {
  get(prompt: string, similarityThreshold: number): CacheEntry | null
  set(prompt: string, response: string, metadata: CacheMetadata): void
  clear(): void
}
```

#### E. Voice Mode
**Responsibilities:**
- Audio input capture
- Speech-to-text conversion
- Text-to-speech output
- Listening state management

**Key Classes:**
```typescript
class VoiceMode {
  constructor(gateway: Gateway, options?: VoiceOptions)
  startListening(): void
  stopListening(): void
  toggle(): void
  speak(text: string): Promise<void>
}
```

#### F. Webhook Manager
**Responsibilities:**
- Send notifications
- Format messages for different platforms
- Retry failed webhooks

---

## 3. Data Flow

### 3.1 Request Flow

```
User Request
    │
    ▼
┌─────────────────────┐
│ 1. Gateway.complete │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Check Cache      │◄─── Hit? Return cached
└──────────┬──────────┘
           │ Miss
           ▼
┌─────────────────────┐
│ 3. Check Budget     │◄─── Exceeded? → Local Fallback
└──────────┬──────────┘
           │ OK
           ▼
┌─────────────────────┐
│ 4. Apply Compression│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 5. Route to Provider│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 6. Execute Request  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 7. Record Usage     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 8. Update Cache     │
└──────────┬──────────┘
           │
           ▼
      Return Response
```

### 3.2 Voice Mode Flow

```
User Speaks
    │
    ▼
┌─────────────────────┐
│ 1. Audio Capture    │ (MediaRecorder)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Speech-to-Text   │ (Web Speech API or Whisper)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. Gateway.complete │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. Text-to-Speech   │ (SpeechSynthesis API)
└──────────┬──────────┘
           │
           ▼
    Audio Output (Speaker)
```

---

## 4. Technology Stack

### 4.1 Core Technologies

| Component | Technology | Justification |
|-----------|------------|---------------|
| Language | TypeScript | Type safety, better DX |
| Build Tool | Vite + tsup | Fast builds, dual ESM/CJS output |
| Testing | Vitest | Fast, Vite-native |
| Linting | ESLint + Prettier | Code quality |

### 4.2 Dependencies

**Production:**
- `ai` (Vercel AI SDK) - Provider abstractions
- `nanoid` - ID generation
- `zod` - Runtime validation
- `ws` (Node.js only) - WebSocket for streaming

**Browser-Specific:**
- Web Speech API (native)
- MediaRecorder API (native)
- LocalStorage API (native)

**Node.js-Specific:**
- `node-fetch` - HTTP requests
- `dotenv` - Environment variables

**Optional:**
- `@anthropic-ai/sdk` - Anthropic support
- `openai` - OpenAI support
- `@google/generative-ai` - Google support

### 4.3 Local Provider Detection

```typescript
// Ollama: Check http://localhost:11434
// LM Studio: Check http://localhost:1234
// WebLLM: Check if running in browser
```

---

## 5. Project Structure

```
cognigate/
├── src/
│   ├── core/
│   │   ├── gateway.ts           # Main Gateway class
│   │   ├── budget.ts            # BudgetManager
│   │   ├── cache.ts             # SemanticCache
│   │   └── compression.ts       # Compression logic
│   │
│   ├── providers/
│   │   ├── base.ts              # Provider interface
│   │   ├── cloud/
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   └── google.ts
│   │   └── local/
│   │       ├── detector.ts      # Auto-detect local providers
│   │       ├── ollama.ts
│   │       ├── lmstudio.ts
│   │       └── webllm.ts
│   │
│   ├── voice/
│   │   ├── voice-chat.ts        # VoiceMode class
│   │   ├── stt.ts               # Speech-to-text
│   │   └── tts.ts               # Text-to-speech
│   │
│   ├── webhooks/
│   │   ├── manager.ts           # Webhook manager
│   │   ├── slack.ts
│   │   └── discord.ts
│   │
│   ├── utils/
│   │   ├── types.ts             # TypeScript types
│   │   ├── errors.ts            # Custom errors
│   │   └── logger.ts            # Logging
│   │
│   └── index.ts                 # Public API exports
│
├── dist/                        # Build output
│   ├── index.js                 # CommonJS
│   ├── index.mjs                # ESM
│   └── index.d.ts               # TypeScript declarations
│
├── tests/
│   ├── core/
│   ├── providers/
│   └── voice/
│
├── examples/
│   ├── node/
│   ├── browser/
│   └── react/
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 6. API Design

### 6.1 Core API

```typescript
// Main export
export function createGateway(config: GatewayConfig): Gateway;

// Configuration
interface GatewayConfig {
  dailyBudget?: number;              // USD, 0 = unlimited
  cacheEnabled?: boolean;            // Default: true
  compressionLevel?: 'low' | 'medium' | 'high'; // Default: 'medium'
  localFallback?: {
    enabled: boolean;
    providers?: ('ollama' | 'lmstudio' | 'webllm')[];
  };
  cloudProviders?: {
    openai?: { apiKey: string; models?: string[] };
    anthropic?: { apiKey: string; models?: string[] };
    google?: { apiKey: string; models?: string[] };
  };
  webhooks?: {
    slack?: string;
    discord?: string;
    custom?: string;
  };
}

// Gateway instance
interface Gateway {
  complete(prompt: string, options?: CompletionOptions): Promise<string>;
  stream(prompt: string, options?: StreamOptions): AsyncIterator<string>;
  getBudgetStatus(): BudgetStatus;
  clearCache(): void;
}

interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  forceProvider?: 'cloud' | 'local';
}
```

### 6.2 Voice API

```typescript
export class VoiceMode {
  constructor(gateway: Gateway, options?: VoiceOptions);

  startListening(): void;
  stopListening(): void;
  toggle(): void;
  speak(text: string): Promise<void>;

  on(event: 'listening' | 'speaking' | 'error', callback: Function): void;
}

interface VoiceOptions {
  lang?: string;              // Default: 'en-US'
  autoSpeak?: boolean;        // Auto-speak AI responses
  continuous?: boolean;       // Keep listening after response
  voiceId?: string;           // TTS voice selection
}
```

---

## 7. Implementation Roadmap

### Phase 1: Core Foundation (Week 1-2)
- [ ] Project setup (TypeScript, build config)
- [ ] Gateway core class
- [ ] Budget manager
- [ ] Basic OpenAI provider
- [ ] Simple caching (in-memory)
- [ ] Basic error handling

### Phase 2: Multi-Provider (Week 3-4)
- [ ] Provider abstraction interface
- [ ] Anthropic provider
- [ ] Google provider
- [ ] Local provider detector
- [ ] Ollama integration
- [ ] LM Studio integration
- [ ] Fallback chain logic

### Phase 3: Optimization (Week 5)
- [ ] Semantic caching with embeddings
- [ ] Compression implementation
- [ ] Request batching
- [ ] Streaming support

### Phase 4: Voice Mode (Week 6)
- [ ] Web Speech API integration
- [ ] Audio capture and playback
- [ ] Voice mode class
- [ ] Browser compatibility

### Phase 5: Monitoring & Ops (Week 7)
- [ ] Webhook manager
- [ ] Slack integration
- [ ] Discord integration
- [ ] Logging and metrics

### Phase 6: Distribution (Week 8)
- [ ] NPM package build
- [ ] CDN distribution
- [ ] React/Next.js examples
- [ ] Documentation
- [ ] Testing suite

---

## 8. Testing Strategy

### 8.1 Unit Tests
- Core Gateway logic
- Budget calculations
- Cache hit/miss scenarios
- Provider selection
- Compression algorithms

### 8.2 Integration Tests
- Provider API calls (with mocks)
- Fallback chain execution
- Budget enforcement
- Webhook delivery

### 8.3 E2E Tests
- Full request flow (Node.js)
- Voice mode (browser automation)
- React component integration

### 8.4 Test Coverage Target
- 80% code coverage minimum
- 100% coverage for budget and caching logic

---

## 9. Deployment & Distribution

### 9.1 NPM Package
- Published to npm registry
- Semantic versioning
- ESM and CommonJS builds
- TypeScript declarations included

### 9.2 CDN Distribution
- Published to jsDelivr and unpkg
- Minified browser builds
- Source maps included

### 9.3 Documentation
- README with quick start
- API reference docs
- Example projects
- Migration guides

---

## 10. Monitoring & Error Handling

### 10.1 Error Types

```typescript
class BudgetExceededError extends Error {}
class ProviderUnavailableError extends Error {}
class CacheError extends Error {}
class VoiceModeError extends Error {}
```

### 10.2 Logging Strategy
- Error logging (always)
- Warning logging (budget close, cache misses)
- Debug logging (configurable)
- Performance metrics

### 10.3 Webhook Alerts
- Budget 80% consumed
- Budget exceeded (fallback activated)
- Provider errors
- Daily usage summary

---

## 11. Security Considerations

### 11.1 API Key Management
- Never log API keys
- Support environment variables
- Validate keys before use
- Clear error messages (without exposing keys)

### 11.2 Browser Security
- No API keys in browser bundles
- CORS handling for local providers
- Content Security Policy compatibility

### 11.3 Budget Protection
- Server-side enforcement recommended
- Client-side tracking for UX only
- Atomic budget updates

---

## 12. Future Enhancements

1. **Persistent Storage**
   - SQLite/IndexedDB for cache persistence
   - Budget tracking across restarts

2. **Advanced Features**
   - Function calling support
   - Multi-modal inputs (images, audio)
   - Custom model fine-tuning

3. **Enterprise Features**
   - Team budgets
   - Usage analytics dashboard
   - Role-based access control

4. **Performance**
   - Request queuing
   - Load balancing across providers
   - Edge caching (Cloudflare Workers)

---

**Next Steps:** Review this architecture, then proceed to implementation starting with Phase 1.
