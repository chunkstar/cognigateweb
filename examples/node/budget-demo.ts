// Budget management demonstration
import { createGateway, BudgetExceededError } from 'cognigate';

const ai = createGateway({
  dailyBudget: 1,  // Low budget for demo purposes
  localFallback: { enabled: true },
  cloudProviders: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
    }
  }
});

async function demonstrateBudgetControl() {
  console.log('=== Budget Control Demo ===\n');

  // Check initial budget
  let status = ai.getBudgetStatus();
  console.log('Initial Budget:');
  console.log(`  Limit: $${status.dailyLimit}`);
  console.log(`  Used: $${status.used.toFixed(4)}`);
  console.log(`  Remaining: $${status.remaining.toFixed(4)}`);
  console.log(`  Resets at: ${status.resetAt.toLocaleString()}\n`);

  // Make several requests
  const questions = [
    "What is TypeScript?",
    "Explain async/await in JavaScript",
    "What is a REST API?",
    "How does caching work?",
    "Tell me about databases",
  ];

  for (let i = 0; i < questions.length; i++) {
    try {
      console.log(`\nQuestion ${i + 1}: ${questions[i]}`);
      const answer = await ai.complete(questions[i]);
      console.log(`Answer: ${answer.substring(0, 100)}...`);

      // Check budget after each request
      status = ai.getBudgetStatus();
      console.log(`Budget used: $${status.used.toFixed(4)} / $${status.dailyLimit}`);

      if (status.remaining < 0.1) {
        console.log('⚠️  Warning: Budget running low!');
      }

    } catch (error) {
      if (error instanceof BudgetExceededError) {
        console.log('\n🚫 Budget exceeded! Switching to local fallback...');
        console.log(error.message);

        // Try again (will use local fallback automatically)
        console.log('\nRetrying with local model...');
        const answer = await ai.complete(questions[i]);
        console.log(`Local answer: ${answer.substring(0, 100)}...`);
      } else {
        console.error('Error:', error);
      }
    }
  }

  // Final budget status
  console.log('\n=== Final Budget Status ===');
  status = ai.getBudgetStatus();
  console.log(`Total used: $${status.used.toFixed(4)}`);
  console.log(`Remaining: $${status.remaining.toFixed(4)}`);
}

demonstrateBudgetControl().catch(console.error);
