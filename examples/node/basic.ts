// Basic Node.js example
import { createGateway } from 'cognigate';
import { VoiceMode } from 'cognigate/voice';

// 1. Create the gateway
const ai = createGateway({
  dailyBudget: 10,                    // $10/day hard limit (blocks at $10.01)
  cacheEnabled: true,                 // semantic caching
  compressionLevel: 'medium',
  localFallback: { enabled: true },   // auto-detects Ollama → LM Studio → WebLLM
  cloudProviders: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      models: ['gpt-4o-mini', 'gpt-4o']
    }
  },
  webhooks: {
    slack: process.env.SLACK_WEBHOOK  // optional alerts
  },
});

// 2. Voice mode (mic → speak → listen loop)
const voice = new VoiceMode(ai, { lang: 'en-US' });

// 3. One-liner for any request (cloud or free local)
async function ask(question: string) {
  try {
    const reply = await ai.complete(question);
    console.log('AI:', reply);
    voice.speak(reply);  // speaks the answer
    return reply;
  } catch (e: any) {
    console.log('Blocked or fallback:', e.message);
    voice.speak('Running on free local AI');
  }
}

// 4. Start voice chat (press any key or call voice.toggle())
voice.startListening();
console.log('🎤 Voice mode active — speak now!');

// Example usage
ask("Tell me a joke about programmers");

// Keep node running
process.stdin.resume();
