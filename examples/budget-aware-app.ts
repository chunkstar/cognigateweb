/**
 * Budget-Aware Application Example
 *
 * Demonstrates advanced budget management with:
 * - Real-time budget monitoring
 * - Automatic fallback to local models
 * - Webhook alerts (Slack/Discord)
 * - Graceful degradation
 */

import { createGateway } from '../src/index.js';

async function main() {
  console.log('💰 Budget-Aware AI Application');
  console.log('===============================\n');

  // Initialize with strict budget and alerts
  const ai = createGateway({
    dailyBudget: 1.00,  // Very tight budget for demo

    cloudProviders: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
        models: ['gpt-4o-mini']  // Use cheaper model
      }
    },

    localFallback: {
      enabled: true,
      providers: ['ollama', 'lmstudio', 'webllm']
    },

    webhooks: {
      slack: process.env.SLACK_WEBHOOK_URL,
      discord: process.env.DISCORD_WEBHOOK_URL,
    },

    // Enable aggressive optimization
    cacheEnabled: true,
    semanticCaching: true,
    compressionLevel: 'high'  // Max compression for cost savings
  });

  console.log('📊 Configuration:');
  console.log(`   Daily Budget: $${ai.getConfig().dailyBudget.toFixed(2)}`);
  console.log(`   Cache: Enabled (semantic)`);
  console.log(`   Compression: High`);
  console.log(`   Local Fallback: Enabled\n`);

  // Simulate multiple requests
  const prompts = [
    "Explain TypeScript in 2 sentences",
    "What is TypeScript?",  // Should hit semantic cache
    "How do I use async/await?",
    "Explain promises in JavaScript",
    "What are the benefits of TypeScript?",  // Similar to first
  ];

  let requestCount = 0;
  let cachedCount = 0;

  for (const prompt of prompts) {
    requestCount++;
    console.log(`\n📝 Request #${requestCount}: "${prompt}"`);
    console.log('─'.repeat(60));

    try {
      const startTime = Date.now();
      const answer = await ai.complete(prompt);
      const duration = Date.now() - startTime;

      console.log(`✅ Response (${duration}ms): ${answer.substring(0, 100)}...`);

      // Check budget status
      const status = ai.getBudgetStatus();
      const percentUsed = (status.used / status.dailyLimit) * 100;

      console.log(`\n💵 Budget Status:`);
      console.log(`   Used: $${status.used.toFixed(4)} (${percentUsed.toFixed(1)}%)`);
      console.log(`   Remaining: $${status.remaining.toFixed(4)}`);
      console.log(`   Resets: ${status.resetAt.toLocaleString()}`);

      // Warn if approaching limit
      if (percentUsed >= 80) {
        console.log(`\n⚠️  WARNING: ${percentUsed.toFixed(1)}% of budget used!`);
        console.log(`   Will switch to local models if exceeded`);
      }

    } catch (error) {
      if (error instanceof Error && error.message.includes('Budget')) {
        console.log(`\n🔄 Budget exceeded! Falling back to local models...`);
        console.log(`   Error: ${error.message}`);

        // Could retry with forceProvider: 'local'
        try {
          const answer = await ai.complete(prompt, { forceProvider: 'local' });
          console.log(`✅ Local Response: ${answer.substring(0, 100)}...`);
          console.log(`   💡 No cost - using free local model!`);
        } catch (localError) {
          console.error(`❌ Local fallback failed: ${localError instanceof Error ? localError.message : 'Unknown'}`);
        }
      } else {
        console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  // Final summary
  console.log('\n\n📊 Session Summary');
  console.log('==================');
  console.log(`Total Requests: ${requestCount}`);
  console.log(`Cached Hits: ${cachedCount} (${((cachedCount/requestCount)*100).toFixed(1)}% cost savings)`);

  const finalStatus = ai.getBudgetStatus();
  console.log(`\nFinal Budget:`);
  console.log(`   Spent: $${finalStatus.used.toFixed(4)}`);
  console.log(`   Saved: $${(finalStatus.dailyLimit - finalStatus.used).toFixed(4)}`);
  console.log(`   Efficiency: ${((1 - finalStatus.used/finalStatus.dailyLimit)*100).toFixed(1)}% under budget`);

  console.log('\n✨ Demo complete!');
}

main().catch(console.error);
