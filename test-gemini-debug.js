#!/usr/bin/env node
/**
 * Debug Gemini API Key
 */

import { createGateway } from './dist/index.js';

console.log('🔍 Debugging Gemini API Key\n');

const apiKey = process.env.GOOGLE_API_KEY;
console.log('API Key from env:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');
console.log('API Key length:', apiKey ? apiKey.length : 0);
console.log('');

// Test direct API call first
console.log('📡 Testing direct API call to Google...');
try {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: 'Say "Hello World"' }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100,
      },
    }),
  });

  console.log('Response status:', response.status);
  const data = await response.json();
  console.log('Response data:', JSON.stringify(data, null, 2));

  if (response.ok) {
    console.log('✅ Direct API call successful!');
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('Response text:', text);
  } else {
    console.log('❌ Direct API call failed');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('\n---\n');

// Now test with Cognigate
console.log('🚀 Testing with Cognigate...');
const ai = createGateway({
  dailyBudget: 5.00,
  cloudProviders: {
    google: {
      apiKey: apiKey
    }
  }
});

console.log('Gateway created');
console.log('Config:', JSON.stringify(ai.getConfig(), null, 2));
