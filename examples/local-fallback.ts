/**
 * Example: Local Fallback with Ollama
 *
 * This example demonstrates US-008: Ollama support with automatic fallback to free local models
 *
 * Run with: npx tsx examples/local-fallback.ts
 *
 * Prerequisites:
 * - Install Ollama: https://ollama.ai/download
 * - Pull a model: ollama pull llama2
 * - Make sure Ollama is running: ollama serve
 */

import { createGateway } from '../src/index.js';

async function main() {
  console.log('Local Fallback Example\n');
  console.log('======================\n');

  // Example 1: Cloud-first with local fallback
  console.log('Example 1: Cloud-first with local fallback');
  console.log('------------------------------------------');
  const ai = createGateway({
    dailyBudget: 0.01, // Very small budget ($0.01)
    cloudProviders: {
      openai: {
        apiKey: process.env.OPENAI_API_KEY || 'your-openai-key',
      },
    },
    localFallback: {
      enabled: true, // Automatically fall back to Ollama when budget is exceeded
      providers: ['ollama'],
    },
  });

  try {
    // This might use OpenAI if budget allows
    console.log('\nFirst request (may use OpenAI if available):');
    const response1 = await ai.complete('Say "Hello from the cloud or local!"');
    console.log(`Response: ${response1}`);

    // If budget is exceeded, subsequent requests will use Ollama (free!)
    console.log('\nSubsequent requests will use free local Ollama:');
    const response2 = await ai.complete('What is 2 + 2?');
    console.log(`Response: ${response2}`);

    // Check budget status
    const status = ai.getBudgetStatus();
    console.log('\nBudget Status:');
    console.log(`  Used: $${status.used.toFixed(6)}`);
    console.log(`  Remaining: $${status.remaining.toFixed(6)}`);
    console.log(`  Daily Limit: $${status.dailyLimit.toFixed(2)}`);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    console.error('\nMake sure Ollama is running! Install from https://ollama.ai');
  }

  console.log('\n\n');

  // Example 2: Local-only mode (no cloud, 100% free)
  console.log('Example 2: Local-only mode (100% free)');
  console.log('---------------------------------------');
  const localAi = createGateway({
    localFallback: {
      enabled: true,
      providers: ['ollama'],
    },
    // No cloud providers = all requests use free local models
  });

  try {
    console.log('\nUsing 100% free local Ollama:');
    const response = await localAi.complete('Tell me a joke about programming in one sentence.');
    console.log(`Response: ${response}`);

    const status = localAi.getBudgetStatus();
    console.log('\nCost: $0.00 (local models are free!)');
    console.log(`Total Spend: $${status.used.toFixed(2)}`);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    console.error('\nMake sure Ollama is running! Run: ollama serve');
  }

  console.log('\n\n');

  // Example 3: Force local provider
  console.log('Example 3: Force specific provider');
  console.log('-----------------------------------');
  const hybridAi = createGateway({
    cloudProviders: {
      openai: { apiKey: process.env.OPENAI_API_KEY || 'your-key' },
    },
    localFallback: {
      enabled: true,
      providers: ['ollama'],
    },
  });

  try {
    console.log('\nForcing local provider:');
    const response = await hybridAi.complete(
      'What is the capital of France?',
      { forceProvider: 'local' } // Only use local providers
    );
    console.log(`Response: ${response}`);
    console.log('Cost: $0.00 (forced local)');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

main();
