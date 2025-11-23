#!/usr/bin/env node
/**
 * Debug what Cognigate returns
 */

import { createGateway } from './dist/index.js';

const API_KEY = 'AIzaSyC7Es3osZ_xdRYqE-oiYmlh8zuR8Y1XM3w';

console.log('🔍 Debugging Cognigate response\n');

const ai = createGateway({
  dailyBudget: 5.00,
  cacheEnabled: false, // Disable cache for debugging
  cloudProviders: {
    google: {
      apiKey: API_KEY
    }
  }
});

console.log('Gateway created\n');

try {
  console.log('Calling ai.complete()...');
  const result = await ai.complete('Say exactly: Hello World');

  console.log('\n📦 Result type:', typeof result);
  console.log('📦 Result value:', result);
  console.log('📦 Result length:', result ? result.length : 'null/undefined');
  console.log('📦 Result JSON:', JSON.stringify(result));

  if (result) {
    console.log('\n✅ Got a response!');
    console.log('Text:', result);
  } else {
    console.log('\n❌ Result is empty/null/undefined');
  }
} catch (error) {
  console.error('\n❌ Error:', error.message);
  console.error('Stack:', error.stack);
}
