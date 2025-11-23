# Cognigate

**A unified AI gateway with budget controls, local fallback, and voice mode.**

[![npm version](https://badge.fury.io/js/cognigate.svg)](https://www.npmjs.com/package/cognigate)
[![Tests](https://github.com/chunkstar/cognigateweb/workflows/tests/badge.svg)](https://github.com/chunkstar/cognigateweb/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Why Cognigate?

**Never overspend on AI again.** Cognigate gives you hard budget limits, automatic fallback to free local models, and seamless provider switching.

### Key Features

- **💰 Budget Protection** - Hard daily spending limits, never exceed your budget
- **🔄 Smart Fallback** - Automatically switches to Ollama/LM Studio/WebLLM when budget runs out
- **🎤 Voice Mode** - Built-in speech recognition and text-to-speech for conversational AI
- **🚀 Multi-Provider** - OpenAI, Anthropic, Google - one API for all
- **📊 Real-Time Monitoring** - Track costs, get webhook alerts (Slack/Discord)
- **⚡ Performance** - Semantic caching and compression reduce costs by 40%+
- **🌐 Cross-Platform** - Works in Node.js, browsers, React, and Next.js

---

## Quick Start

### Installation

```bash
npm install cognigate
```

### Basic Usage

```typescript
import { createGateway } from 'cognigate';

const ai = createGateway({
  dailyBudget: 10,        // $10/day limit
  cacheEnabled: true,
  cloudProviders: {
    openai: { apiKey: process.env.OPENAI_API_KEY }
  },
  localFallback: { enabled: true }
});

// Simple completion
const answer = await ai.complete("What is TypeScript?");
console.log(answer);

// Check budget
const status = ai.getBudgetStatus();
console.log(`Used: $${status.used.toFixed(2)} / $${status.dailyLimit}`);
```

---

## 📊 Dashboard & Monitoring

Cognigate provides **three ways** to monitor your AI spending:

### 1. Web Dashboard (Hosted)
Visit the live dashboard at **[cognigate.dev/dashboard.html](https://cognigate.dev/dashboard.html)**

Features:
- Real-time budget tracking
- Cost charts and provider breakdown
- Request history
- Alert notifications
- No installation required!

### 2. React Dashboard (Self-Hosted)
Build your own custom dashboard with our React example:

```bash
cd examples/react-dashboard
npm install
npm run dev
```

Features:
- Next.js 14 + TypeScript + Tailwind
- Customizable components
- Chart.js visualizations
- Full source code included

### 3. REST API (For Custom Integrations)

Enable the API server to access metrics programmatically:

```typescript
import { createGateway } from 'cognigate';
import { createApiServer } from 'cognigate/api';

const gateway = createGateway({ budget: { dailyLimit: 10 } });
const api = createApiServer(gateway, { port: 3001 });
await api.start();

// Available endpoints:
// GET /api/budget      - Budget status
// GET /api/usage       - Usage statistics
// GET /api/providers   - Provider breakdown
// GET /api/health      - Health check
```

See `examples/api-server.ts` for a complete example.

---

## Features in Detail

### 💰 Budget Protection

Set daily spending limits and never worry about unexpected costs:

```typescript
const ai = createGateway({
  dailyBudget: 5.00,  // Hard limit: $5/day
  cloudProviders: {
    openai: { apiKey: process.env.OPENAI_API_KEY }
  }
});

// Track budget in real-time
const status = ai.getBudgetStatus();
console.log(`Used: $${status.used} / $${status.dailyLimit}`);
console.log(`Remaining: $${status.remaining}`);
console.log(`Resets at: ${status.resetAt}`);
```

Budget automatically resets at midnight UTC. When exceeded, requests throw `BudgetExceededError` or fall back to local models.

### 🔄 Multi-Provider Support

Use multiple AI providers with automatic fallback:

```typescript
const ai = createGateway({
  dailyBudget: 10,
  cloudProviders: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      models: ['gpt-4o-mini', 'gpt-4o']  // Tries mini first
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      models: ['claude-3-haiku', 'claude-3-sonnet']
    },
    google: {
      apiKey: process.env.GOOGLE_API_KEY,
      models: ['gemini-1.5-flash']
    }
  }
});

// Automatically tries providers in order until one succeeds
const answer = await ai.complete("Hello!");
```

### 🏠 Local Fallback

When budget runs out or cloud providers fail, automatically switch to free local models:

```typescript
const ai = createGateway({
  dailyBudget: 1.00,  // Small budget
  cloudProviders: {
    openai: { apiKey: process.env.OPENAI_API_KEY }
  },
  localFallback: {
    enabled: true,
    providers: ['ollama', 'lmstudio', 'webllm']  // Tries in order
  }
});

// If budget exceeded, automatically uses Ollama (free!)
const answer = await ai.complete("Hello!");
```

**Supported local providers:**
- **Ollama** - Most popular, GPU-accelerated
- **LM Studio** - Great for Mac with Metal acceleration
- **WebLLM** - Runs entirely in browser via WebGPU

### ⚡ Streaming Responses

Get tokens as they're generated for better UX:

```typescript
for await (const token of ai.stream("Write a poem")) {
  process.stdout.write(token);  // Print each word immediately
}
```

### 🎤 Voice Mode

Built-in speech recognition and text-to-speech:

```typescript
import { createGateway } from 'cognigate';
import { Conversation } from 'cognigate/voice';

const ai = createGateway({ dailyBudget: 5 });
const conversation = new Conversation(ai, {
  continuous: true,
  autoSpeak: true,
  language: 'en-US'
});

// Listen for events
conversation.on('transcript', (text) => {
  console.log(`You said: ${text}`);
});

conversation.on('response', (text) => {
  console.log(`AI said: ${text}`);
});

// Start listening
await conversation.start();
```

### 📊 Webhook Alerts

Get notified when budget thresholds are reached:

```typescript
const ai = createGateway({
  dailyBudget: 10,
  cloudProviders: {
    openai: { apiKey: process.env.OPENAI_API_KEY }
  },
  webhooks: {
    slack: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
    discord: 'https://discord.com/api/webhooks/YOUR/WEBHOOK/URL',
    custom: 'https://your-server.com/webhook'
  }
});

// Automatically sends alerts at 50%, 80%, and 100% budget usage
```

**Alert types:**
- **50% Warning** - Yellow alert
- **80% Urgent** - Orange alert
- **100% Exceeded** - Red alert

### 🗄️ Smart Caching

Reduce costs with intelligent caching:

```typescript
const ai = createGateway({
  dailyBudget: 10,
  cacheEnabled: true,
  semanticCaching: true,      // Match similar prompts
  similarityThreshold: 0.9,   // How similar (0-1)
  cloudProviders: {
    openai: { apiKey: process.env.OPENAI_API_KEY }
  }
});

// First call - hits API
await ai.complete("What is TypeScript?");  // Cost: $0.0001

// Second call - cached!
await ai.complete("What is TypeScript?");  // Cost: $0 (cached)

// Third call - semantic match!
await ai.complete("Explain TypeScript");   // Cost: $0 (similar prompt)
```

### 🗜️ Prompt Compression

Reduce token usage with automatic compression:

```typescript
const ai = createGateway({
  dailyBudget: 10,
  compressionLevel: 'high',  // 'low' | 'medium' | 'high'
  cloudProviders: {
    openai: { apiKey: process.env.OPENAI_API_KEY }
  }
});

// Automatically compresses prompts before sending
// High compression: ~40% token reduction
```

---

## Platform Support

### Node.js

```bash
npm install cognigate
```

```typescript
import { createGateway } from 'cognigate';

const ai = createGateway({
  dailyBudget: 10,
  cloudProviders: {
    openai: { apiKey: process.env.OPENAI_API_KEY }
  }
});
```

### Browser (CDN)

```html
<!DOCTYPE html>
<script type="module">
import { createGateway } from 'https://cdn.jsdelivr.net/npm/cognigate@1.0.0/dist/index.mjs';

const ai = createGateway({ dailyBudget: 0 }); // unlimited
const answer = await ai.complete("Hello!");
console.log(answer);
</script>
```

### React / Next.js

```tsx
'use client';
import { createGateway } from 'cognigate';
import { useEffect, useState } from 'react';

export default function ChatPage() {
  const [ai] = useState(() => createGateway({
    dailyBudget: 5,
    cloudProviders: {
      openai: { apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY }
    }
  }));

  const [response, setResponse] = useState('');

  const handleSubmit = async (prompt: string) => {
    const answer = await ai.complete(prompt);
    setResponse(answer);
  };

  return (
    <div>
      <button onClick={() => handleSubmit("Hello!")}>
        Ask AI
      </button>
      <p>{response}</p>
    </div>
  );
}
```

---

## API Reference

### `createGateway(config)`

Creates a new gateway instance.

```typescript
interface GatewayConfig {
  dailyBudget?: number;              // Daily spending limit in USD (0 = unlimited)
  cacheEnabled?: boolean;             // Enable response caching
  semanticCaching?: boolean;          // Cache similar prompts
  similarityThreshold?: number;       // Similarity threshold (0-1)
  compressionLevel?: 'low' | 'medium' | 'high';
  localFallback?: LocalFallbackConfig;
  cloudProviders?: CloudProvidersConfig;
  webhooks?: WebhooksConfig;
}
```

### `ai.complete(prompt, options?)`

Send a prompt and get a text response.

```typescript
const answer = await ai.complete("What is AI?", {
  model: 'gpt-4o',              // Override default model
  temperature: 0.7,              // Creativity (0-2)
  maxTokens: 500,                // Max response length
  forceProvider: 'cloud' | 'local'  // Force provider type
});
```

### `ai.stream(prompt, options?)`

Stream response tokens in real-time.

```typescript
for await (const token of ai.stream("Write a story")) {
  console.log(token);  // Each word as it's generated
}
```

### `ai.getBudgetStatus()`

Get current budget information.

```typescript
const status = ai.getBudgetStatus();
// Returns: { dailyLimit, used, remaining, resetAt }
```

### `ai.clearCache()`

Manually clear the response cache.

```typescript
ai.clearCache();
```

---

## Examples

See the [examples/](./examples) directory for complete working examples:

- **[basic-chat.ts](./examples/basic-chat.ts)** - Simple Q&A with budget tracking
- **[voice-assistant.ts](./examples/voice-assistant.ts)** - Voice-to-voice conversation
- **[budget-aware-app.ts](./examples/budget-aware-app.ts)** - Advanced budget management
- **[streaming-chat.ts](./examples/streaming-chat.ts)** - Real-time streaming responses

---

## Configuration Guide

### Environment Variables

```bash
# Cloud providers
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GOOGLE_API_KEY="..."

# Webhooks (optional)
export SLACK_WEBHOOK_URL="https://hooks.slack.com/..."
export DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

### Cost Optimization

**Reduce costs by 70%+ with these settings:**

```typescript
const ai = createGateway({
  dailyBudget: 5,
  cacheEnabled: true,
  semanticCaching: true,
  similarityThreshold: 0.85,    // Aggressive caching
  compressionLevel: 'high',      // Max compression
  cloudProviders: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      models: ['gpt-4o-mini']    // Use cheapest model
    }
  },
  localFallback: {
    enabled: true                 // Free fallback
  }
});
```

---

## Troubleshooting

### "Budget exceeded" error

Budget resets at midnight UTC. Options:
1. Increase `dailyBudget`
2. Enable `localFallback` for free models
3. Wait for reset (check `status.resetAt`)

### Caching not working

Enable caching explicitly:
```typescript
cacheEnabled: true,
semanticCaching: true
```

### Voice features not working

Voice requires:
- Browser environment (Chrome, Safari, Edge)
- HTTPS or localhost
- Microphone permissions granted

### Local models not found

Install Ollama or LM Studio:
```bash
# macOS
brew install ollama
ollama serve

# Or download LM Studio
# https://lmstudio.ai/
```

---

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build

# Run examples
npx tsx examples/basic-chat.ts
```

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

## Support

- **Documentation**: [README.md](./README.md)
- **Examples**: [examples/](./examples)
- **Issues**: [GitHub Issues](https://github.com/yourusername/cognigate/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/cognigate/discussions)

---

Made with ❤️ by developers who hate surprise AI bills.
