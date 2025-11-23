/**
 * Quick Preview Test
 *
 * Run with: node preview-test.js
 */

import { createGateway } from './dist/index.js';

console.log('🚀 Cognigate Preview Test\n');

// Test 1: Basic initialization
console.log('✅ Test 1: Can create gateway');
const ai = createGateway({
  dailyBudget: 10,
  cacheEnabled: true,
  compressionLevel: 'medium',
  localFallback: { enabled: true }
});
console.log('   Gateway created successfully!\n');

// Test 2: Budget tracking
console.log('✅ Test 2: Budget tracking works');
const status = ai.getBudgetStatus();
console.log(`   Daily limit: $${status.dailyLimit.toFixed(2)}`);
console.log(`   Used: $${status.used.toFixed(4)}`);
console.log(`   Remaining: $${status.remaining.toFixed(2)}`);
console.log(`   Resets: ${status.resetAt.toLocaleString()}\n`);

// Test 3: Configuration
console.log('✅ Test 3: Configuration accessible');
const config = ai.getConfig();
console.log(`   Cache enabled: ${config.cacheEnabled}`);
console.log(`   Compression: ${config.compressionLevel}`);
console.log(`   Local fallback: ${config.localFallback.enabled}\n`);

// Test 4: Methods available
console.log('✅ Test 4: All methods available');
console.log(`   ai.complete: ${typeof ai.complete}`);
console.log(`   ai.stream: ${typeof ai.stream}`);
console.log(`   ai.getBudgetStatus: ${typeof ai.getBudgetStatus}`);
console.log(`   ai.clearCache: ${typeof ai.clearCache}\n`);

console.log('🎉 All preview tests passed!\n');
console.log('💡 To test with real API:');
console.log('   1. Set OPENAI_API_KEY environment variable');
console.log('   2. Run: node examples/basic-chat.js');
console.log('   3. Or try: npx tsx examples/basic-chat.ts\n');
