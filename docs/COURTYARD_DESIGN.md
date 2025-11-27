# Cognigate Courtyard - UX Design Document

## Vision

Transform AI gateway configuration from a technical chore into an intuitive, guided journey through a virtual office courtyard. Each "office" is staffed by a specialized AI assistant who helps users configure that specific feature.

---

## The Courtyard Map

```
                          NORTH WING - PROVIDERS
    ┌─────────────────────────────────────────────────────────────┐
    │                                                             │
    │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
    │   │ OpenAI  │  │Anthropic│  │ Google  │  │  xAI    │       │
    │   │ Office  │  │ Office  │  │ Office  │  │ Office  │       │
    │   │   🤖    │  │   🧠    │  │   💎    │  │   🚀    │       │
    │   └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
    │                                                             │
    │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
    │   │DeepSeek │  │ Mistral │  │ Cohere  │  │Perplexity│      │
    │   │ Office  │  │ Office  │  │ Office  │  │ Office  │       │
    │   │   🔮    │  │   🌬️    │  │   📚    │  │   🔍    │       │
    │   └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
                              │
    ┌─────────────┐           │           ┌─────────────┐
    │   BUDGET    │           │           │    CACHE    │
    │   OFFICE    │     ┌─────┴─────┐     │   OFFICE    │
    │     💰      │◄────┤           ├────►│     📦      │
    │   Penny     │     │  CENTRAL  │     │    Memo     │
    └─────────────┘     │ COURTYARD │     └─────────────┘
                        │           │
    ┌─────────────┐     │   ⛲ 🌳   │     ┌─────────────┐
    │   VOICE     │     │           │     │   ALERTS    │
    │   OFFICE    │◄────┤  Welcome  ├────►│   OFFICE    │
    │     🎤      │     │   Desk    │     │     🔔      │
    │    Echo     │     └─────┬─────┘     │    Bell     │
    └─────────────┘           │           └─────────────┘
                              │
    ┌─────────────────────────────────────────────────────────────┐
    │                      SOUTH WING - LOCAL                     │
    │                                                             │
    │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
    │   │ Ollama  │  │LM Studio│  │ WebLLM  │  │Together │       │
    │   │ Office  │  │ Office  │  │ Office  │  │   AI    │       │
    │   │   🦙    │  │   🖥️    │  │   🌐    │  │   🤝    │       │
    │   └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
    │                                                             │
    └─────────────────────────────────────────────────────────────┘
```

---

## Provider Rankings by Category

Based on 2025 benchmarks, users can choose providers by their strengths:

### Coding & Development
| Rank | Provider | Model | Strength |
|------|----------|-------|----------|
| 1 | Anthropic | Claude 4 | 72.5% SWE-bench, best for code |
| 2 | DeepSeek | DeepSeek Coder | Strong reasoning, budget-friendly |
| 3 | OpenAI | GPT-4o | Reliable, multimodal |

### Math & Reasoning
| Rank | Provider | Model | Strength |
|------|----------|-------|----------|
| 1 | Google | Gemini 2.5 Pro | 86.4 GPQA, "Deep Think" mode |
| 2 | xAI | Grok 4 | Advanced reasoning, 2M context |
| 3 | Mistral | Mathstral 7B | Specialized math model |

### Creative Writing
| Rank | Provider | Model | Strength |
|------|----------|-------|----------|
| 1 | OpenAI | GPT-4o | Best creative flow |
| 2 | Google | Gemini 2.5 Pro | Improved style/structure |
| 3 | Anthropic | Claude 4 | Nuanced, thoughtful |

### Research & Search
| Rank | Provider | Model | Strength |
|------|----------|-------|----------|
| 1 | Perplexity | pplx-API | Real-time web search |
| 2 | Cohere | Command R | RAG specialist, 256K context |
| 3 | Google | Gemini 2.5 Pro | 1M context window |

### Conversation & Chat
| Rank | Provider | Model | Strength |
|------|----------|-------|----------|
| 1 | Anthropic | Claude Sonnet 4 | Natural, thoughtful |
| 2 | Mistral | Mistral Medium 3 | Cost-effective |
| 3 | OpenAI | GPT-4o | Versatile |

### Budget-Friendly
| Rank | Provider | Model | Strength |
|------|----------|-------|----------|
| 1 | DeepSeek | DeepSeek V3 | Frontier quality, low cost |
| 2 | Mistral | Mistral Medium 3 | Enterprise value |
| 3 | Ollama | Local models | Free (local compute) |

---

## Office Specialists

### Central Courtyard - Welcome Desk
**Concierge: Guide**
- First point of contact
- Helps users understand the courtyard
- Recommends offices based on needs
- Quick setup wizard option

### Budget Office 💰
**Specialist: Penny**
- Personality: Careful, protective, maternal
- Greeting: "Welcome! I'm Penny, your budget guardian. Let's make sure you never get an unexpected AI bill."
- Tasks:
  - Set daily spending limits
  - View current usage
  - Configure budget alerts
  - Review spending history

### Provider Offices (North Wing)

#### OpenAI Office 🤖
**Specialist: Ada**
- Personality: Professional, knowledgeable, efficient
- Greeting: "Hello! I'm Ada. OpenAI offers the most versatile models. Let me help you connect."
- Specialties: GPT-4o, GPT-4o-mini, o1-preview
- Best for: General purpose, creative writing, multimodal

#### Anthropic Office 🧠
**Specialist: Claude** (yes, named Claude!)
- Personality: Thoughtful, careful, nuanced
- Greeting: "Hi there. I'm here to help you access Claude models - known for safety and code excellence."
- Specialties: Claude 4, Claude Sonnet, Claude Haiku
- Best for: Coding, complex reasoning, enterprise

#### Google Office 💎
**Specialist: Gemma**
- Personality: Enthusiastic, forward-thinking
- Greeting: "Welcome! Ready to explore Gemini's incredible reasoning? I'll show you the way."
- Specialties: Gemini 2.5 Pro, Gemini Flash
- Best for: Math, reasoning, long context (1M tokens)

#### xAI Office 🚀
**Specialist: Grok** (fitting!)
- Personality: Bold, unconventional, direct
- Greeting: "Hey! I'm Grok. Want AI that thinks different? You're in the right place."
- Specialties: Grok 4, Grok 4.1 Fast
- Best for: Reasoning, 2M context, tool use

#### DeepSeek Office 🔮
**Specialist: Deep**
- Personality: Focused, efficient, value-conscious
- Greeting: "Hello! DeepSeek offers frontier performance at breakthrough prices. Let's get started."
- Specialties: DeepSeek V3, DeepSeek R1
- Best for: Coding, reasoning, budget-conscious

#### Mistral Office 🌬️
**Specialist: Mira**
- Personality: Elegant, multilingual, European flair
- Greeting: "Bonjour! Mistral brings European AI excellence. Fast, capable, and cost-effective."
- Specialties: Mistral Medium 3, Mathstral
- Best for: Math, multilingual, enterprise

#### Cohere Office 📚
**Specialist: Coral**
- Personality: Librarian-like, organized, knowledgeable
- Greeting: "Welcome to Cohere! I specialize in helping you find and use knowledge effectively."
- Specialties: Command R, Command A
- Best for: RAG, enterprise search, knowledge bases

#### Perplexity Office 🔍
**Specialist: Percy**
- Personality: Curious, always searching, up-to-date
- Greeting: "Hey! Need real-time information? I connect you to the freshest data on the web."
- Specialties: pplx-API, Sonar
- Best for: Research, real-time search, fact-checking

### Local Offices (South Wing)

#### Ollama Office 🦙
**Specialist: Sage**
- Personality: Calm, resourceful, privacy-focused
- Greeting: "Welcome! I help you run AI locally - free, private, and always available."
- Specialties: Llama 3, Mistral, CodeLlama
- Best for: Free fallback, privacy, offline

#### LM Studio Office 🖥️
**Specialist: Mac**
- Personality: Friendly, Mac-enthusiast
- Greeting: "Hey! Got a Mac? LM Studio uses Metal acceleration for blazing fast local AI."
- Specialties: Various GGUF models
- Best for: macOS users, local inference

#### WebLLM Office 🌐
**Specialist: Web**
- Personality: Browser-native, lightweight
- Greeting: "Hi! I run AI entirely in your browser - no server needed, just WebGPU magic."
- Specialties: Browser-based LLMs
- Best for: Browser apps, edge computing

#### Together AI Office 🤝
**Specialist: Unity**
- Personality: Collaborative, diverse
- Greeting: "Welcome! Together AI gives you access to 200+ open-source models. What would you like to try?"
- Specialties: Open-source models
- Best for: Experimentation, variety

### Support Offices

#### Voice Office 🎤
**Specialist: Echo**
- Personality: Friendly, patient, articulate
- Greeting: "Hello! I'll help you set up voice interactions - speaking and listening."
- Tasks:
  - Configure speech recognition
  - Set up text-to-speech
  - Test voice commands
  - Choose voices and languages

#### Cache Office 📦
**Specialist: Memo**
- Personality: Efficient, organized, memory-focused
- Greeting: "Hi! I'm all about saving you money by remembering what we've already done."
- Tasks:
  - Enable/disable caching
  - Configure semantic matching
  - Set cache duration
  - View cache stats

#### Alerts Office 🔔
**Specialist: Bell**
- Personality: Vigilant, timely, helpful
- Greeting: "Welcome! I'll make sure you're notified when important things happen."
- Tasks:
  - Set up Slack webhooks
  - Configure Discord alerts
  - Custom webhook URLs
  - Alert thresholds

---

## Dual Experience Design

### Library API Experience (Developer-focused)

When developers import and use Cognigate programmatically:

```typescript
import { createGateway, offices } from 'cognigate';

// Visit the Welcome Desk
const guide = offices.welcome();
guide.greet();  // "Welcome to Cognigate! Where would you like to go?"

// Quick setup - Guide recommends based on needs
const ai = await guide.quickSetup({
  needs: ['coding', 'chat'],
  budget: 10
});
// Guide: "Based on your needs, I've set up Anthropic for coding
//         and OpenAI for chat, with a $10 daily budget."

// Or visit specific offices manually
const penny = offices.budget();
penny.setDailyLimit(10);
penny.onThreshold(0.8, () => console.log("80% budget used!"));

const ada = offices.openai();
ada.configure({ apiKey: process.env.OPENAI_API_KEY });
ada.recommend('coding');  // "For coding, I'd suggest gpt-4o"

// The gateway knows which offices you've visited
const ai = createGateway(); // Uses your office configurations
```

### Web Dashboard Experience (Visual)

The dashboard renders the courtyard as an actual navigable space:

1. **Entry Screen** - Bird's eye view of courtyard
2. **Navigation** - Click/tap offices to enter
3. **Office Interior** - Chat with specialist bot
4. **Configuration** - Forms/wizards with bot guidance
5. **Exit** - Return to courtyard, see configured offices glow

---

## User Flows

### Flow 1: First-Time Quick Setup

```
[User enters courtyard]
     │
     ▼
Guide: "Welcome to Cognigate! I'm your guide.
        What will you be building?"

        [ Chatbot ]  [ Code Assistant ]  [ Research Tool ]  [ Custom ]
     │
     ▼ (selects "Code Assistant")

Guide: "Great choice! For coding, I recommend visiting:
        1. Anthropic Office (best code quality)
        2. Budget Office (set your limits)
        3. Ollama Office (free fallback)

        Shall I take you on a quick tour?"

        [ Yes, guide me ]  [ I'll explore myself ]
     │
     ▼ (selects "Yes, guide me")

[Auto-tour through recommended offices]
```

### Flow 2: Expert Configuration

```
[User enters courtyard]
     │
     ▼
[User clicks directly on DeepSeek Office]
     │
     ▼
Deep: "Hello! DeepSeek offers frontier performance
       at breakthrough prices. Do you have an API key?"

       [ Enter API key ]  [ Get one (opens docs) ]
     │
     ▼
[User configures, returns to courtyard]
     │
     ▼
[User visits Cache Office, Alerts Office, etc.]
```

### Flow 3: Budget Emergency

```
[Budget alert triggers at 80%]
     │
     ▼
Bell: "Alert! You've used 80% of your daily budget.
       Would you like me to take you to Penny?"

       [ Yes, visit Budget Office ]  [ Dismiss ]
     │
     ▼
Penny: "I see you're running low. Options:
        1. Increase daily limit
        2. Enable local fallback (free)
        3. Wait for reset at midnight UTC"
```

---

## Technical Implementation

### Provider Interface Additions

Each provider office requires:

```typescript
interface ProviderOffice {
  // Office identity
  name: string;
  icon: string;
  specialist: {
    name: string;
    personality: string;
    greeting: string;
  };

  // Capabilities
  strengths: string[];  // ['coding', 'math', 'creative']
  models: string[];
  pricing: { input: number; output: number };

  // Configuration
  configure(config: ProviderConfig): void;
  isConfigured(): boolean;

  // Specialist chat
  chat(message: string): Promise<string>;
  recommend(useCase: string): string;
}
```

### Providers to Add

| Provider | Priority | API Compatibility | Notes |
|----------|----------|-------------------|-------|
| xAI (Grok) | High | OpenAI-compatible | $25 free credits/month |
| DeepSeek | High | OpenAI-compatible | Very cost-effective |
| Mistral | High | OpenAI-compatible | Mathstral for math |
| Cohere | Medium | Custom SDK | RAG specialist |
| Perplexity | Medium | Custom API | Real-time search |
| Together AI | Medium | OpenAI-compatible | 200+ models |

---

## Sources

- [Artificial Analysis LLM Leaderboard](https://artificialanalysis.ai/leaderboards/models)
- [Vellum LLM Leaderboard 2025](https://www.vellum.ai/llm-leaderboard)
- [LLM Stats - AI Leaderboards 2025](https://llm-stats.com)
- [xAI API](https://x.ai/api)
- [Perplexity API Platform](https://www.perplexity.ai/api-platform)
- [God of Prompt - Top LLM API Providers](https://www.godofprompt.ai/blog/top-llm-api-providers)
- [Helicone - LLM API Providers Comparison](https://www.helicone.ai/blog/llm-api-providers)
