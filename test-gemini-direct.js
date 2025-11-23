#!/usr/bin/env node
/**
 * Test Gemini API with hardcoded key
 */

const API_KEY = 'AIzaSyC7Es3osZ_xdRYqE-oiYmlh8zuR8Y1XM3w';

console.log('🔍 Testing Gemini API Key\n');
console.log('API Key:', API_KEY.substring(0, 10) + '...');
console.log('');

// Test direct API call
console.log('📡 Testing direct API call to Google...\n');
try {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: 'Say "Hello World" in one sentence.' }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100,
      },
    }),
  });

  console.log('Response status:', response.status);

  if (response.ok) {
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('\n✅ API Key is VALID!');
    console.log('Response:', text);
  } else {
    const errorData = await response.json();
    console.log('\n❌ API Key is INVALID');
    console.log('Error:', errorData.error?.message);
    console.log('\n💡 The API key may be:');
    console.log('   • Not activated yet (check Google AI Studio)');
    console.log('   • Expired or revoked');
    console.log('   • Missing required APIs enabled');
    console.log('\n🔗 Get a new key at: https://makersuite.google.com/app/apikey');
  }
} catch (error) {
  console.error('\n❌ Network error:', error.message);
}
