# Browser Examples

Pure HTML/JavaScript examples that run directly in the browser using the CDN version of cognigate.

## Features

- No build step required
- Works offline with local models
- No API keys needed (when using local models)
- Voice mode built-in

## Examples

### basic.html

Full chat interface with text input and voice mode.

**Features:**
- Text chat interface
- Voice mode toggle
- Budget tracking display
- Local model fallback

**Run:**
```bash
# Option 1: Open directly in browser
open basic.html

# Option 2: Serve with a local server
npx http-server -p 8000
# Then visit http://localhost:8000/basic.html
```

### voice-only.html

Beautiful voice-only interface - just click and talk!

**Features:**
- Minimal UI
- Voice-first design
- Conversation transcript
- Animated microphone button

**Run:**
```bash
open voice-only.html
```

## Requirements

### For Cloud Models

If you want to use cloud providers (OpenAI, etc.), you'll need to modify the code to include your API key:

```javascript
const ai = createGateway({
  dailyBudget: 10,
  cloudProviders: {
    openai: {
      apiKey: 'your-api-key-here'  // ⚠️ Don't expose in production!
    }
  }
});
```

**Warning:** Never commit API keys to public repositories. Use environment variables or a backend proxy.

### For Local Models (Free!)

Install one of these local LLM providers:

1. **Ollama** (Recommended)
   ```bash
   # Install from ollama.ai
   ollama run llama3.2
   ```

2. **LM Studio**
   - Download from lmstudio.ai
   - Load a model
   - Start server on port 1234

3. **WebLLM** (Browser-based)
   - Works automatically in Chrome/Edge
   - Requires WebGPU support
   - Downloads model to browser cache

## Browser Compatibility

- **Chrome/Edge**: Full support (including WebLLM)
- **Firefox**: Voice mode supported, no WebLLM
- **Safari**: Voice mode with webkit prefix

## Usage Tips

1. **Voice Mode**: Works best in Chrome/Edge with good microphone
2. **Local Models**: First run downloads model (can be slow)
3. **Caching**: Responses are cached for 1 hour
4. **Budget**: Set to 0 for unlimited (when using local models)

## Production Deployment

For production apps:

1. **Don't expose API keys in browser code**
2. **Use a backend proxy** for cloud API calls
3. **Implement server-side budget tracking**
4. **Add HTTPS** for voice mode (required by browsers)

Example proxy:

```javascript
// Browser
const response = await fetch('/api/ai', {
  method: 'POST',
  body: JSON.stringify({ prompt: 'Hello' })
});

// Server (Node.js)
app.post('/api/ai', async (req, res) => {
  const ai = createGateway({
    cloudProviders: {
      openai: { apiKey: process.env.OPENAI_KEY }
    }
  });
  const result = await ai.complete(req.body.prompt);
  res.json({ result });
});
```

## Customization

### Change Voice

```javascript
const voice = new VoiceMode(ai, {
  lang: 'en-GB',  // British English
  voiceId: 'Google UK English Female'
});
```

### Adjust Compression

```javascript
const ai = createGateway({
  compressionLevel: 'high'  // More aggressive token reduction
});
```

### Add Webhooks

```javascript
const ai = createGateway({
  webhooks: {
    slack: 'https://hooks.slack.com/...'
  }
});
```
