'use client';
import { createGateway } from 'cognigate';
import { VoiceMode } from 'cognigate/voice';
import { useEffect, useState } from 'react';

export default function Home() {
  const [ai, setAi] = useState<any>(null);
  const [voice, setVoice] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Array<{role: 'user' | 'ai', text: string}>>([]);
  const [input, setInput] = useState('');
  const [budget, setBudget] = useState({ used: 0, limit: 5 });

  useEffect(() => {
    // Initialize gateway
    const gateway = createGateway({
      dailyBudget: 5,
      localFallback: { enabled: true },
      cacheEnabled: true,
      compressionLevel: 'medium',
      cloudProviders: {
        openai: {
          apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY || ''
        }
      }
    });

    // Initialize voice mode
    const voiceMode = new VoiceMode(gateway, {
      lang: 'en-US',
      autoSpeak: true,
      continuous: true
    });

    setAi(gateway);
    setVoice(voiceMode);

    // Update budget periodically
    const interval = setInterval(() => {
      const status = gateway.getBudgetStatus();
      setBudget({ used: status.used, limit: status.dailyLimit });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !ai) return;

    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);

    try {
      const response = await ai.complete(question);
      setMessages(prev => [...prev, { role: 'ai', text: response }]);

      // Update budget
      const status = ai.getBudgetStatus();
      setBudget({ used: status.used, limit: status.dailyLimit });
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'ai', text: `Error: ${error.message}` }]);
    }
  };

  const toggleVoice = () => {
    if (!voice) return;

    if (isListening) {
      voice.stopListening();
    } else {
      voice.startListening();
    }
    setIsListening(!isListening);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            🧠 Cognigate Chat
          </h1>
          <div className="text-sm text-gray-400">
            Budget: ${budget.used.toFixed(4)} / ${budget.limit}
            {budget.used / budget.limit > 0.8 && (
              <span className="ml-2 text-yellow-400">⚠️ Running low!</span>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="bg-slate-800/50 rounded-lg p-6 mb-6 h-96 overflow-y-auto backdrop-blur-sm">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center mt-20">
              Start a conversation by typing below or using voice mode
            </p>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-4 p-4 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-purple-600 ml-auto max-w-[80%]'
                    : 'bg-slate-700 mr-auto max-w-[80%]'
                }`}
              >
                <p className="text-sm text-gray-300 mb-1">
                  {msg.role === 'user' ? 'You' : 'AI'}
                </p>
                <p className="text-white">{msg.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-4 mb-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            className="flex-1 bg-slate-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg hover:opacity-90 transition"
          >
            Send
          </button>
        </form>

        {/* Voice Button */}
        <button
          id="mic"
          onClick={toggleVoice}
          className={`fixed bottom-8 right-8 w-20 h-20 rounded-full text-4xl shadow-lg transition transform hover:scale-110 ${
            isListening
              ? 'bg-red-500 animate-pulse'
              : 'bg-gradient-to-r from-purple-500 to-pink-500'
          }`}
        >
          {isListening ? '🔴' : '🎤'}
        </button>
      </div>
    </main>
  );
}
