# Cognigate Examples

Example applications demonstrating various features of Cognigate.

## Prerequisites

```bash
npm install
```

Set up environment variables:
```bash
export OPENAI_API_KEY="your-key-here"
export SLACK_WEBHOOK_URL="your-webhook-url"  # Optional
export DISCORD_WEBHOOK_URL="your-webhook-url"  # Optional
```

## Examples

### 1. Basic Chat Bot
Simple conversational AI with budget protection.

```bash
npx tsx examples/basic-chat.ts
```

**Features:**
- Simple Q&A interface
- Budget tracking after each request
- Automatic fallback to local models

### 2. Voice Assistant
Browser-based voice-to-voice AI conversation.

**Features:**
- Speech recognition (mic input)
- Text-to-speech (speaker output)
- Continuous conversation loop
- Real-time transcription

### 3. Budget-Aware Application
Advanced budget management and cost optimization.

```bash
npx tsx examples/budget-aware-app.ts
```

**Features:**
- Strict budget enforcement
- Semantic caching for cost savings
- Webhook alerts (Slack/Discord)
- Graceful degradation to local models
- Performance metrics

### 4. Streaming Chat
Real-time streaming responses for better UX.

```bash
npx tsx examples/streaming-chat.ts
```

**Features:**
- Token-by-token streaming
- Low latency response
- Progress indication
- Budget tracking

## Running Examples

### Node.js
```bash
npx tsx examples/basic-chat.ts
```

## Common Issues

### "API key not found"
Set your OpenAI API key:
```bash
export OPENAI_API_KEY="sk-..."
```

### "Budget exceeded"
The examples use small budgets for demonstration. Increase in code or wait for reset at midnight UTC.

### Voice features not working
Voice features require:
- Modern browser (Chrome, Edge, Safari)
- HTTPS or localhost
- Microphone permissions

## Learn More

- [Main README](../README.md)
- [API Documentation](../README.md#api-reference)
