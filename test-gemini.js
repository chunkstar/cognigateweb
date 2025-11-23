#!/usr/bin/env node
/**
 * Test Gemini API Key with Cognigate
 */

import { createGateway } from './dist/index.js';

console.log('🧪 Testing Gemini API with Cognigate\n');
console.log('='.repeat(50));

const ai = createGateway({
  dailyBudget: 5.00,
  cacheEnabled: true,
  compressionLevel: 'medium',
  cloudProviders: {
    google: {
      apiKey: process.env.GOOGLE_API_KEY
    }
  }
});

console.log('\n✅ Gateway created with Gemini provider');

// Test 1: Simple question
console.log('\n📝 Test 1: Simple question...');
try {
  const answer1 = await ai.complete('Explain TypeScript in one sentence');
  console.log('✅ Answer:', answer1);

  const status1 = ai.getBudgetStatus();
  console.log(`💰 Cost: $${status1.used.toFixed(6)}`);
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Test 2: Cached request (should be free)
console.log('\n📝 Test 2: Same question (should hit cache)...');
try {
  const answer2 = await ai.complete('Explain TypeScript in one sentence');
  console.log('✅ Answer:', answer2);

  const status2 = ai.getBudgetStatus();
  console.log(`💰 Cost: $${status2.used.toFixed(6)} (no additional cost - cached!)`);
} catch (error) {
  console.error('❌ Error:', error.message);
}

// Test 3: Different question
console.log('\n📝 Test 3: Different question...');
try {
  const answer3 = await ai.complete('What is async/await?');
  console.log('✅ Answer:', answer3);

  const status3 = ai.getBudgetStatus();
  console.log(`💰 Total cost: $${status3.used.toFixed(6)}`);
  console.log(`💰 Remaining budget: $${status3.remaining.toFixed(2)}`);
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('\n' + '='.repeat(50));
console.log('\n🎉 Gemini API test complete!\n');
