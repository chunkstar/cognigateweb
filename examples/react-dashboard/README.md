# Cognigate React Dashboard Example

A modern, real-time dashboard for monitoring Cognigate AI gateway usage built with Next.js 14, React 18, and Tailwind CSS.

## Features

- 📊 **Real-time Metrics** - Live budget tracking and cost monitoring
- 📈 **Interactive Charts** - Visualize provider usage and cost trends
- 🎨 **Modern UI** - Dark theme with glassmorphism effects
- ⚡ **Next.js 14** - App Router with Server Components
- 🔄 **Live Updates** - Real-time data refresh
- 📱 **Responsive** - Works on all device sizes

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Environment Setup

Create `.env.local`:

```env
# Optional: Add your AI provider API keys
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
```

## Project Structure

```
react-dashboard/
├── app/
│   ├── components/       # React components
│   │   ├── BudgetProgress.tsx
│   │   ├── CostChart.tsx
│   │   ├── ProviderChart.tsx
│   │   └── StatsCard.tsx
│   ├── lib/              # Utilities and Cognigate setup
│   │   └── cognigate.ts
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Dashboard page
├── public/               # Static assets
├── package.json
└── README.md
```

## Usage

### Integrate with Your API

Replace the simulated data in `app/page.tsx` with real Cognigate SDK calls:

```typescript
import { createGateway } from 'cognigate';

const gateway = createGateway({
  budget: { dailyLimit: 10.00 },
  providers: [
    {
      name: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      models: ['gpt-4', 'gpt-3.5-turbo']
    }
  ]
});

// Get real stats
const stats = gateway.getStats();
```

### Customize Charts

Edit chart components in `app/components/` to customize visualizations.

### Deploy

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel deploy

# Or any other Next.js hosting platform
```

## Learn More

- [Cognigate Documentation](https://cognigate.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [Recharts Documentation](https://recharts.org)

## License

MIT
