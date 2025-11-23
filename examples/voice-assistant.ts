/**
 * Voice Assistant Example
 *
 * Demonstrates voice-to-voice AI conversation with speech recognition
 * and text-to-speech synthesis.
 *
 * Note: Requires browser environment with Web Speech API support.
 */

import { createGateway } from '../src/index.js';
import { Conversation } from '../src/voice/conversation.js';

async function main() {
  console.log('🎤 Cognigate Voice Assistant');
  console.log('📝 Browser-based voice conversation\n');

  // Check if running in browser
  if (typeof window === 'undefined') {
    console.error('❌ This example requires a browser environment');
    console.log('💡 Try running in a browser with:');
    console.log('   <script type="module" src="voice-assistant.ts"></script>');
    return;
  }

  // Initialize gateway
  const ai = createGateway({
    dailyBudget: 10.00,
    cloudProviders: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
      }
    }
  });

  // Create voice conversation
  const conversation = new Conversation(ai, {
    continuous: true,
    autoSpeak: true,
    language: 'en-US',
    voice: {
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0
    }
  });

  // Listen for events
  conversation.on('listening', () => {
    console.log('👂 Listening...');
  });

  conversation.on('transcript', (text: string) => {
    console.log(`📝 You said: ${text}`);
  });

  conversation.on('response', (response: string) => {
    console.log(`🤖 AI said: ${response}`);
  });

  conversation.on('speaking', () => {
    console.log('🔊 Speaking...');
  });

  conversation.on('error', (error: Error) => {
    console.error(`❌ Error: ${error.message}`);
  });

  // Start conversation
  console.log('✅ Voice assistant ready!');
  console.log('💬 Say something to start...\n');

  await conversation.start();

  // Keep alive (in real app, this would be managed by UI)
  console.log('🎙️ Listening for voice commands...');
  console.log('Press Ctrl+C to stop\n');
}

// Browser-specific code
if (typeof window !== 'undefined') {
  // Add start button to page
  document.body.innerHTML = `
    <div style="padding: 40px; font-family: Arial, sans-serif;">
      <h1>🎤 Cognigate Voice Assistant</h1>
      <button id="startBtn" style="padding: 20px 40px; font-size: 18px; cursor: pointer;">
        Start Voice Conversation
      </button>
      <div id="status" style="margin-top: 20px; font-size: 16px;"></div>
      <div id="transcript" style="margin-top: 20px; padding: 20px; background: #f5f5f5; border-radius: 8px; min-height: 100px;"></div>
    </div>
  `;

  document.getElementById('startBtn')?.addEventListener('click', main);
} else {
  // Node.js execution
  main().catch(console.error);
}
