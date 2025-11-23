#!/usr/bin/env node
/**
 * List available Gemini models
 */

const API_KEY = 'AIzaSyC7Es3osZ_xdRYqE-oiYmlh8zuR8Y1XM3w';

console.log('🔍 Checking available Gemini models...\n');

try {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

  const response = await fetch(url);
  console.log('Response status:', response.status);

  if (response.ok) {
    const data = await response.json();
    console.log('\n✅ API Key works! Available models:\n');

    if (data.models && data.models.length > 0) {
      data.models.forEach(model => {
        console.log(`  • ${model.name}`);
        console.log(`    Display: ${model.displayName}`);
        console.log(`    Methods: ${model.supportedGenerationMethods?.join(', ')}`);
        console.log('');
      });
    } else {
      console.log('No models found');
    }
  } else {
    const errorData = await response.json();
    console.log('\n❌ Error:', errorData.error?.message);
    console.log('\n💡 This API key may not have access to the Gemini API');
    console.log('🔗 Check your API key at: https://makersuite.google.com/app/apikey');
  }
} catch (error) {
  console.error('\n❌ Error:', error.message);
}
