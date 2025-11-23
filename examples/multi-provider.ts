/**
 * Example: Multi-Provider Setup with Redundancy
 *
 * This example demonstrates US-003: Multiple cloud providers with automatic failover
 *
 * Run with: npx tsx examples/multi-provider.ts
 */

import { createGateway } from '../src/index.js';

async function main() {
  // Initialize gateway with both OpenAI and Anthropic
  const ai = createGateway({
    dailyBudget: 10.00,
    cloudProviders: {
      // Primary provider: OpenAI (tried first)
      openai: {
        apiKey: process.env.OPENAI_API_KEY || 'your-openai-key',
        models: ['gpt-4o-mini', 'gpt-4o']
      },
      // Backup provider: Anthropic (tried if OpenAI fails)
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY || 'your-anthropic-key',
        models: ['claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022']
      }
    }
  });

  console.log('Multi-Provider Example\n');
  console.log('======================\n');

  try {
    // Make a request - gateway will try providers in order
    console.log('Sending request (will try OpenAI first, then Anthropic)...\n');
    const response = await ai.complete('Explain what multi-provider redundancy means in one sentence.');
    console.log(`Response: ${response}\n`);

    // You can also force a specific provider
    console.log('Forcing Anthropic provider...\n');
    const claudeResponse = await ai.complete(
      'What is your name?',
      { forceProvider: 'cloud' }  // Forces cloud providers only
    );
    console.log(`Response: ${claudeResponse}\n`);

    // Check budget after requests
    const status = ai.getBudgetStatus();
    console.log('Budget Status:');
    console.log(`  Used: $${status.used.toFixed(4)}`);
    console.log(`  Remaining: $${status.remaining.toFixed(4)}`);
    console.log(`  Resets at: ${status.resetAt.toISOString()}`);

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

main();
