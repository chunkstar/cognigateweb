/**
 * Basic Chat Bot Example
 *
 * Demonstrates simple conversational AI with budget protection.
 */

import { createGateway } from '../src/index.js';

async function main() {
  // Initialize gateway with $5 daily budget
  const ai = createGateway({
    dailyBudget: 5.00,
    cloudProviders: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here'
      }
    },
    localFallback: {
      enabled: true,  // Falls back to Ollama/LM Studio if budget exceeded
    }
  });

  console.log('🤖 Cognigate Chat Bot Started');
  console.log('💰 Daily Budget: $5.00');
  console.log('---\n');

  // Simple Q&A
  const questions = [
    "What is TypeScript?",
    "Explain async/await in JavaScript",
    "What are the benefits of type safety?"
  ];

  for (const question of questions) {
    console.log(`❓ Question: ${question}`);

    try {
      const answer = await ai.complete(question);
      console.log(`✅ Answer: ${answer}\n`);

      // Check budget after each request
      const status = ai.getBudgetStatus();
      console.log(`💵 Budget: $${status.used.toFixed(4)} / $${status.dailyLimit.toFixed(2)}`);
      console.log(`⏰ Resets: ${status.resetAt.toLocaleString()}\n`);
      console.log('---\n');
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }

  console.log('✨ Chat session complete!');
}

main().catch(console.error);
