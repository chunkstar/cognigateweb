/**
 * Example: Budget Control and Spending Limits
 *
 * This example demonstrates US-005: Set Daily Budget Limit
 *
 * Run with: npx tsx examples/budget-control.ts
 */

import { createGateway, BudgetExceededError } from '../src/index.js';

async function main() {
  // Initialize gateway with a $1 daily budget
  const ai = createGateway({
    dailyBudget: 1.00, // $1 per day limit
    cloudProviders: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
      }
    }
  });

  console.log('Budget Control Example\n');
  console.log('======================\n');

  // Check initial budget status
  const initialStatus = ai.getBudgetStatus();
  console.log('Initial Budget Status:');
  console.log(`  Daily Limit: $${initialStatus.dailyLimit.toFixed(2)}`);
  console.log(`  Used: $${initialStatus.used.toFixed(4)}`);
  console.log(`  Remaining: $${initialStatus.remaining.toFixed(4)}`);
  console.log(`  Resets At: ${initialStatus.resetAt.toISOString()}\n`);

  try {
    // Make a few requests
    console.log('Making first request...');
    const response1 = await ai.complete('Say hello in 5 words');
    console.log(`Response: ${response1}\n`);

    // Check budget after first request
    const status1 = ai.getBudgetStatus();
    console.log('Budget Status After First Request:');
    console.log(`  Used: $${status1.used.toFixed(4)}`);
    console.log(`  Remaining: $${status1.remaining.toFixed(4)}\n`);

    // Make second request
    console.log('Making second request...');
    const response2 = await ai.complete('Count to 5');
    console.log(`Response: ${response2}\n`);

    // Check budget after second request
    const status2 = ai.getBudgetStatus();
    console.log('Budget Status After Second Request:');
    console.log(`  Used: $${status2.used.toFixed(4)}`);
    console.log(`  Remaining: $${status2.remaining.toFixed(4)}\n`);

    // This would continue until budget is exceeded...
    console.log('Budget still available for more requests!');

  } catch (error) {
    if (error instanceof BudgetExceededError) {
      console.error('\nBudget Exceeded!');
      console.error(`  Message: ${error.message}`);
      console.error(`  Used: $${error.used.toFixed(4)}`);
      console.error(`  Limit: $${error.limit.toFixed(2)}`);
      console.error('\nTo continue:');
      console.error('  1. Wait for budget to reset at midnight UTC');
      console.error('  2. Increase your daily budget');
      console.error('  3. Enable local fallback to use free local models');
    } else {
      console.error('Error:', error instanceof Error ? error.message : error);
    }
  }
}

main();
