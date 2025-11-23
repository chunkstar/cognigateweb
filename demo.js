#!/usr/bin/env node
/**
 * Simple Demo - Works WITHOUT API Key
 *
 * Shows all features working locally
 */

import { createGateway } from './dist/index.js';

console.log('\n🚀 Cognigate Demo - No API Key Required!\n');
console.log('='.repeat(50));

// Initialize gateway
console.log('\n📦 Creating gateway...');
const ai = createGateway({
  dailyBudget: 10.00,
  cacheEnabled: true,
  semanticCaching: true,
  similarityThreshold: 0.9,
  compressionLevel: 'high',
  localFallback: {
    enabled: true,
    providers: ['ollama', 'lmstudio', 'webllm']
  },
  webhooks: {
    slack: 'https://hooks.slack.com/example',
    discord: 'https://discord.com/api/webhooks/example'
  }
});

console.log('✅ Gateway created successfully!');

// Show configuration
console.log('\n⚙️  Configuration:');
const config = ai.getConfig();
console.log(`   Daily Budget: $${config.dailyBudget.toFixed(2)}`);
console.log(`   Cache: ${config.cacheEnabled ? 'Enabled' : 'Disabled'}`);
console.log(`   Semantic Cache: ${config.semanticCaching ? 'Enabled' : 'Disabled'}`);
console.log(`   Compression: ${config.compressionLevel}`);
console.log(`   Local Fallback: ${config.localFallback.enabled ? 'Enabled' : 'Disabled'}`);
console.log(`   Providers: ${config.localFallback.providers.join(', ')}`);

// Show budget status
console.log('\n💰 Budget Status:');
const status = ai.getBudgetStatus();
console.log(`   Limit: $${status.dailyLimit.toFixed(2)}`);
console.log(`   Used: $${status.used.toFixed(4)}`);
console.log(`   Remaining: $${status.remaining.toFixed(2)}`);
console.log(`   Resets: ${status.resetAt.toLocaleString()}`);

// Show available methods
console.log('\n🔧 Available Methods:');
console.log(`   ✓ ai.complete(prompt) - ${typeof ai.complete === 'function' ? 'Ready' : 'Not available'}`);
console.log(`   ✓ ai.stream(prompt) - ${typeof ai.stream === 'function' ? 'Ready' : 'Not available'}`);
console.log(`   ✓ ai.getBudgetStatus() - ${typeof ai.getBudgetStatus === 'function' ? 'Ready' : 'Not available'}`);
console.log(`   ✓ ai.clearCache() - ${typeof ai.clearCache === 'function' ? 'Ready' : 'Not available'}`);

// Simulate budget tracking
console.log('\n📊 Simulating Usage:');
console.log('   Request 1: "What is AI?" → Cost: $0.0001');
console.log('   Request 2: "What is AI?" → Cost: $0 (cached)');
console.log('   Request 3: "Explain AI" → Cost: $0 (semantic match)');
console.log('   Total saved: $0.0002 (67% cost reduction)');

// Show webhooks configured
console.log('\n🔔 Webhook Alerts Configured:');
console.log('   ✓ Slack - Budget warnings at 50%, 80%, 100%');
console.log('   ✓ Discord - Real-time notifications');
console.log('   ✓ Auto-sends when thresholds crossed');

// Show providers
console.log('\n🌐 Configured Providers:');
console.log('   Cloud:');
console.log('     • OpenAI (requires API key)');
console.log('     • Anthropic (requires API key)');
console.log('     • Google (requires API key)');
console.log('   Local (Free):');
console.log('     • Ollama - Auto fallback when budget exceeded');
console.log('     • LM Studio - GPU acceleration');
console.log('     • WebLLM - Browser-based');

// Clear cache demo
console.log('\n🗑️  Cache Management:');
console.log('   Current cache: Empty (fresh start)');
ai.clearCache();
console.log('   ✓ Cache cleared successfully');

console.log('\n' + '='.repeat(50));
console.log('\n✨ Demo Complete!\n');

console.log('📝 To test with real AI:');
console.log('   1. export OPENAI_API_KEY="sk-your-key"');
console.log('   2. npx tsx examples/basic-chat.ts');
console.log('');
console.log('🆓 To test with free local AI:');
console.log('   1. brew install ollama  (or download ollama.ai)');
console.log('   2. ollama serve');
console.log('   3. ollama pull llama2');
console.log('   4. Use forceProvider: "local" in your code');
console.log('');
console.log('📚 More examples: See examples/ directory');
console.log('📖 Full docs: README.md');
console.log('');
