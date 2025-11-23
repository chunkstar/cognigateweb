'use client'

import { useState, useEffect } from 'react'

interface Stats {
  todaySpending: number
  totalRequests: number
  budgetLimit: number
  providerUsage: Record<string, number>
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    todaySpending: 0,
    totalRequests: 0,
    budgetLimit: 10.00,
    providerUsage: { openai: 0, anthropic: 0, google: 0, ollama: 0 }
  })

  useEffect(() => {
    // Simulated real-time updates
    // Replace with actual Cognigate SDK integration:
    // import { createGateway } from 'cognigate'
    // const gateway = createGateway({ ... })
    // const realStats = gateway.getStats()

    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        todaySpending: prev.todaySpending + (Math.random() * 0.3),
        totalRequests: prev.totalRequests + 1,
        providerUsage: {
          openai: prev.providerUsage.openai + (Math.random() > 0.5 ? 1 : 0),
          anthropic: prev.providerUsage.anthropic + (Math.random() > 0.6 ? 1 : 0),
          google: prev.providerUsage.google + (Math.random() > 0.7 ? 1 : 0),
          ollama: prev.providerUsage.ollama + (Math.random() > 0.4 ? 1 : 0),
        }
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const budgetPercent = Math.min((stats.todaySpending / stats.budgetLimit) * 100, 100)
  const avgCost = stats.totalRequests > 0 ? stats.todaySpending / stats.totalRequests : 0

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Cognigate Dashboard
        </h1>
        <p className="text-gray-400 mt-2">Real-time AI spending monitor</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          label="Today's Spending"
          value={'$' + stats.todaySpending.toFixed(2)}
          change="-12%"
          positive={true}
        />
        <StatsCard
          label="Total Requests"
          value={stats.totalRequests.toString()}
          change="+24%"
          positive={true}
        />
        <StatsCard
          label="Avg Cost/Request"
          value={'$' + avgCost.toFixed(3)}
          change="-8%"
          positive={true}
        />
        <StatsCard
          label="Budget Status"
          value={budgetPercent.toFixed(1) + '%'}
          change={budgetPercent > 75 ? 'Warning' : 'Healthy'}
          positive={budgetPercent < 75}
        />
      </div>

      {/* Budget Progress */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-semibold">Daily Budget</h3>
            <p className="text-gray-400 text-sm">Limit: ${stats.budgetLimit.toFixed(2)}</p>
          </div>
          <div className="text-2xl font-bold">
            ${stats.todaySpending.toFixed(2)} / ${stats.budgetLimit.toFixed(2)}
          </div>
        </div>
        <div className="bg-white/5 rounded-full h-8 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 flex items-center justify-end px-4 text-sm font-semibold ${
              budgetPercent >= 90 ? 'bg-red-500' :
              budgetPercent >= 75 ? 'bg-yellow-500' :
              'bg-gradient-to-r from-primary to-secondary'
            }`}
            style={{ width: `${budgetPercent}%` }}
          >
            {budgetPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Provider Usage */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold mb-6">Provider Usage</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats.providerUsage).map(([provider, count]) => (
            <div key={provider} className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-gray-400 capitalize">{provider}</div>
              <div className="text-2xl font-bold mt-1">{count}</div>
              <div className="text-xs text-gray-500 mt-1">requests</div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration Instructions */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold mb-3">🚀 Integrate with Real Data</h3>
        <p className="text-gray-400 mb-4">
          Replace the simulated data with actual Cognigate SDK integration:
        </p>
        <pre className="bg-black/50 rounded-lg p-4 text-sm overflow-x-auto">
{`import { createGateway } from 'cognigate'

const gateway = createGateway({
  budget: { dailyLimit: 10.00 },
  providers: [{
    name: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    models: ['gpt-4']
  }]
})

// Get real stats
const stats = gateway.getStats()
setStats(stats)`}
        </pre>
      </div>
    </div>
  )
}

function StatsCard({
  label,
  value,
  change,
  positive
}: {
  label: string
  value: string
  change: string
  positive: boolean
}) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-primary/50 transition-all">
      <div className="text-gray-400 text-sm mb-2">{label}</div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className={`text-sm flex items-center gap-1 ${positive ? 'text-green-400' : 'text-red-400'}`}>
        <span>{positive ? '↓' : '↑'}</span>
        <span>{change}</span>
      </div>
    </div>
  )
}
