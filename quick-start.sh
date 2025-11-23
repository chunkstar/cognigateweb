#!/bin/bash

echo "🚀 Cognigate Quick Start"
echo "======================="
echo ""

echo "1️⃣  Building library..."
npm run build

echo ""
echo "2️⃣  Running tests..."
npm test -- --run | head -30

echo ""
echo "3️⃣  Quick preview test..."
node preview-test.js

echo ""
echo "✅ All systems ready!"
echo ""
echo "📝 Next steps:"
echo "   • Set API key: export OPENAI_API_KEY='sk-...'"
echo "   • Run example: npx tsx examples/basic-chat.ts"
echo "   • See PREVIEW.md for more options"
