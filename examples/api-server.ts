/**
 * Example: Running Cognigate with REST API Server
 *
 * This example shows how to enable the REST API server
 * to expose dashboard metrics via HTTP endpoints.
 */

import { createGateway } from '../dist/index.js';
import { createApiServer } from '../dist/api/index.js';

// Create gateway with budget tracking
const gateway = createGateway({
  budget: {
    dailyLimit: 10.00,
    alertThresholds: [75, 90]
  },
  providers: [
    {
      name: 'openai',
      apiKey: process.env.OPENAI_API_KEY || 'your-key-here',
      models: ['gpt-4', 'gpt-3.5-turbo']
    },
    {
      name: 'anthropic',
      apiKey: process.env.ANTHROPIC_API_KEY || 'your-key-here',
      models: ['claude-3-opus', 'claude-3-sonnet']
    },
    {
      name: 'ollama',
      baseUrl: 'http://localhost:11434',
      models: ['llama2', 'mistral']
    }
  ],
  fallback: {
    enabled: true,
    provider: 'ollama'
  }
});

// Create and start API server
const apiServer = createApiServer(gateway, {
  port: 3001,
  host: 'localhost',
  cors: true
});

await apiServer.start();

console.log(`
🚀 Cognigate API Server Running!

Available endpoints:
- http://localhost:3001/api/budget      - Budget status
- http://localhost:3001/api/usage       - Usage statistics
- http://localhost:3001/api/providers   - Provider breakdown
- http://localhost:3001/api/health      - Health check

Example request:
  curl http://localhost:3001/api/budget

Press Ctrl+C to stop
`);

// Make some test requests
async function testRequests() {
  try {
    const response = await gateway.completion({
      prompt: 'Hello! How are you?',
      maxTokens: 100
    });

    console.log('✅ Test request completed');
    console.log('Response:', response.text.substring(0, 100));

    // Show budget status
    const budgetRes = await fetch('http://localhost:3001/api/budget');
    const budgetData = await budgetRes.json();
    console.log('\n📊 Budget Status:', budgetData);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run a test after 2 seconds
setTimeout(testRequests, 2000);

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\nShutting down...');
  await apiServer.stop();
  process.exit(0);
});
