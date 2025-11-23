/**
 * Streaming Chat Example
 *
 * Demonstrates real-time streaming responses for better UX.
 * Shows tokens as they're generated instead of waiting for full response.
 */

import { createGateway } from '../src/index.js';

async function main() {
  console.log('⚡ Streaming Chat Example');
  console.log('========================\n');

  const ai = createGateway({
    dailyBudget: 5.00,
    cloudProviders: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
      }
    }
  });

  const prompt = "Write a short poem about artificial intelligence";

  console.log(`📝 Prompt: "${prompt}"\n`);
  console.log('🔄 Streaming response:\n');
  console.log('─'.repeat(60));

  let fullResponse = '';
  const startTime = Date.now();

  try {
    // Stream the response token by token
    for await (const token of ai.stream(prompt)) {
      process.stdout.write(token);  // Print without newline
      fullResponse += token;
    }

    const duration = Date.now() - startTime;

    console.log('\n' + '─'.repeat(60));
    console.log(`\n✅ Complete! (${duration}ms)`);
    console.log(`📊 Total length: ${fullResponse.length} characters`);

    // Check budget
    const status = ai.getBudgetStatus();
    console.log(`💰 Cost: $${status.used.toFixed(6)}`);

  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

main().catch(console.error);
