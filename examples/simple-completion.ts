/**
 * Example: Simple AI Completion with OpenAI
 *
 * This example demonstrates US-002: Complete Simple Prompts
 *
 * Run with: npx tsx examples/simple-completion.ts
 */

import { createGateway } from '../src/index.js';

async function main() {
  // Initialize gateway with OpenAI
  const ai = createGateway({
    cloudProviders: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
      }
    }
  });

  try {
    console.log('Sending prompt to OpenAI...');

    // Simple completion
    const response = await ai.complete('Say hello in 5 words or less');

    console.log('Response:', response);

    // Completion with options
    const response2 = await ai.complete('Write a haiku about TypeScript', {
      model: 'gpt-4o-mini',
      temperature: 0.9,
      maxTokens: 100,
    });

    console.log('Haiku:', response2);

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

main();
