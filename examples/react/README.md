# Cognigate + Next.js Example

A modern chat interface built with Next.js 14, React, and Tailwind CSS, powered by cognigate.

## Features

- 🎨 Beautiful gradient UI with Tailwind CSS
- 💬 Real-time chat interface
- 🎤 Voice mode integration
- 📊 Budget tracking display
- 🔄 Automatic local fallback
- ⚡ Next.js 14 App Router

## Setup

### 1. Install Dependencies

```bash
npm install
# or
pnpm install
# or
yarn install
```

### 2. Configure Environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_OPENAI_KEY=sk-...
```

**Note:** If you don't provide an API key, cognigate will automatically use local models (Ollama, LM Studio, or WebLLM).

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
react/
├── app/
│   ├── page.tsx          # Main chat interface
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles with Tailwind
├── package.json
├── tailwind.config.ts
├── next.config.js
└── tsconfig.json
```

## Usage

### Text Chat

1. Type your question in the input field
2. Press Enter or click "Send"
3. AI response appears in the chat

### Voice Mode

1. Click the microphone button (bottom-right)
2. Speak your question
3. AI responds with voice

### Budget Tracking

- Monitor your daily spending at the top
- Warning appears at 80% usage
- Automatic fallback to free local models when exceeded

## Customization

### Change Colors

Edit `app/page.tsx`:

```tsx
// From purple/pink gradient
bg-gradient-to-r from-purple-400 to-pink-400

// To blue/green gradient
bg-gradient-to-r from-blue-400 to-green-400
```

### Adjust Budget

Edit `app/page.tsx`:

```tsx
const gateway = createGateway({
  dailyBudget: 10,  // Change to your preferred limit
  // ...
});
```

### Change AI Model

```tsx
const gateway = createGateway({
  cloudProviders: {
    openai: {
      apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
      models: ['gpt-4o', 'gpt-4o-mini']  // Customize models
    }
  }
});
```

### Add More Providers

```tsx
const gateway = createGateway({
  cloudProviders: {
    openai: { apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY },
    anthropic: { apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_KEY },
    google: { apiKey: process.env.NEXT_PUBLIC_GOOGLE_KEY }
  }
});
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

### Other Platforms

Build the production bundle:

```bash
npm run build
npm run start
```

## Security Notes

### API Keys

- Never commit `.env.local` to version control
- Use `NEXT_PUBLIC_` prefix only for browser-accessible keys
- For production, use server-side API routes to protect keys

### Server-Side Proxy (Production)

For better security, create an API route:

```typescript
// app/api/ai/route.ts
import { createGateway } from 'cognigate';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const ai = createGateway({
    cloudProviders: {
      openai: { apiKey: process.env.OPENAI_KEY }  // Server-only
    }
  });

  const response = await ai.complete(prompt);
  return Response.json({ response });
}
```

Then update client:

```typescript
// app/page.tsx
const response = await fetch('/api/ai', {
  method: 'POST',
  body: JSON.stringify({ prompt: question })
});
```

## Troubleshooting

### Voice Mode Not Working

- Ensure HTTPS (required by browsers)
- Check microphone permissions
- Try Chrome/Edge (best support)

### Local Models Not Detected

- Install Ollama: `ollama run llama3.2`
- Or install LM Studio and start server
- Check http://localhost:11434 (Ollama) or http://localhost:1234 (LM Studio)

### Build Errors

```bash
rm -rf .next node_modules
npm install
npm run dev
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Cognigate Architecture](../../ARCHITECTURE.md)
- [Cognigate Implementation Guide](../../IMPLEMENTATION_GUIDE.md)
