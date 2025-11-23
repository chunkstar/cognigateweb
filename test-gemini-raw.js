#!/usr/bin/env node
/**
 * Debug raw Gemini response
 */

const API_KEY = 'AIzaSyC7Es3osZ_xdRYqE-oiYmlh8zuR8Y1XM3w';

console.log('🔍 Checking raw Gemini response...\n');

try {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: 'Say exactly: Hello World' }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 100,
      },
    }),
  });

  console.log('Status:', response.status);
  const data = await response.json();
  console.log('\n📦 Full response:');
  console.log(JSON.stringify(data, null, 2));

  console.log('\n🔍 Extracting text...');
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  console.log('Extracted text:', text);
} catch (error) {
  console.error('❌ Error:', error.message);
}
