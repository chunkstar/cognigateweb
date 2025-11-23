# Node.js Examples

Examples demonstrating cognigate usage in Node.js/TypeScript environments.

## Setup

```bash
npm install
# or
pnpm install
```

## Set Environment Variables

Create a `.env` file:

```env
OPENAI_API_KEY=sk-...
SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

## Run Examples

### Basic Usage

```bash
npm run basic
```

Demonstrates:
- Creating a gateway
- Simple completions
- Voice mode integration

### Budget Demo

```bash
npm run budget
```

Demonstrates:
- Budget tracking
- Budget exceeded errors
- Automatic local fallback
- Budget status monitoring

### Streaming Demo

```bash
npm run streaming
```

Demonstrates:
- Streaming responses
- Real-time output
- Token-by-token display

### Cache Demo

```bash
npm run cache
```

Demonstrates:
- Cache hits and misses
- Semantic similarity matching
- Cache clearing
- Performance improvements

## Examples

### basic.ts
The "hello world" - simple Q&A with voice mode.

### budget-demo.ts
Shows how budget controls work and fallback activation.

### streaming.ts
Real-time streaming responses from the AI.

### cache-demo.ts
Demonstrates caching for cost savings.
