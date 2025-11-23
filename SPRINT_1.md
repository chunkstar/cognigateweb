# Sprint 1: Foundation

**Sprint Goal:** Core gateway with budget tracking working
**Duration:** 2 weeks (Weeks 1-2)
**Team:** Developer + BMad Agents
**Capacity:** 16 points
**Status:** 🟢 Active

---

## Sprint Backlog

### 📝 To Do (16 points remaining)

#### US-001: Initialize Gateway with Simple Configuration (2 pts)
**Priority:** P0 - Must Have
**Assignee:** Developer
**Status:** 🔲 To Do

**Description:**
As a developer integrating Cognigate, I want to initialize the gateway with minimal configuration, so that I can start making AI requests quickly.

**Acceptance Criteria:**
- [ ] Given I import `createGateway`, when I call it with no arguments, then it returns a working gateway instance with defaults
- [ ] Given I provide an API key, when I initialize the gateway, then it connects to the provider successfully
- [ ] Given invalid configuration, when I initialize the gateway, then it throws a descriptive validation error
- [ ] Given I check the documentation, when I look at quickstart, then I can get running in < 5 minutes

**Tasks:**
- [ ] Create project structure (src/, tests/, etc.)
- [ ] Set up package.json
- [ ] Configure TypeScript (tsconfig.json)
- [ ] Create `createGateway()` factory function
- [ ] Define GatewayConfig interface
- [ ] Write basic tests

**Files to Create:**
- `package.json`
- `tsconfig.json`
- `src/index.ts`
- `src/utils/types.ts`
- `tests/setup.ts`

---

#### US-002: Complete Simple Prompts (3 pts)
**Priority:** P0 - Must Have
**Assignee:** Developer
**Status:** 🔲 To Do

**Description:**
As a developer using the gateway, I want to send a text prompt and receive a text response, so that I can build AI-powered features.

**Acceptance Criteria:**
- [ ] Given an initialized gateway, when I call `ai.complete("Hello")`, then I receive a string response
- [ ] Given a long prompt, when I send it, then I receive a complete response without truncation
- [ ] Given a provider error, when I send a prompt, then I receive a descriptive error message
- [ ] Given the provider is unavailable, when I send a prompt, then the system attempts fallback providers

**Tasks:**
- [ ] Create Gateway class with `complete()` method
- [ ] Implement BaseProvider interface
- [ ] Create OpenAI provider implementation
- [ ] Add error handling
- [ ] Write integration tests

**Files to Create:**
- `src/core/gateway.ts`
- `src/providers/base.ts`
- `src/providers/cloud/openai.ts`
- `tests/core/gateway.test.ts`
- `tests/providers/openai.test.ts`

**Dependencies:** US-001

---

#### US-005: Set Daily Budget Limit (3 pts)
**Priority:** P0 - Must Have
**Assignee:** Developer
**Status:** 🔲 To Do

**Description:**
As a developer concerned about costs, I want to set a hard daily spending limit, so that I never exceed my intended budget.

**Acceptance Criteria:**
- [ ] Given I set `dailyBudget: 10`, when costs reach $10.00, then all subsequent cloud requests are blocked
- [ ] Given budget is exceeded, when I make a request, then I receive a `BudgetExceededError`
- [ ] Given budget is exceeded, when fallback is enabled, then it switches to local models automatically
- [ ] Given I set `dailyBudget: 0`, when I make requests, then budget is unlimited (no blocking)

**Tasks:**
- [ ] Create BudgetManager class
- [ ] Implement daily limit enforcement
- [ ] Create BudgetExceededError class
- [ ] Add budget checking to Gateway
- [ ] Write comprehensive tests (100% coverage required!)

**Files to Create:**
- `src/core/budget.ts`
- `src/utils/errors.ts`
- `tests/core/budget.test.ts`

**Dependencies:** US-002

---

#### US-006: Track Budget Usage in Real-Time (2 pts)
**Priority:** P0 - Must Have
**Assignee:** Developer
**Status:** 🔲 To Do

**Description:**
As a developer monitoring costs, I want to check my current budget status at any time, so that I can make informed decisions about usage.

**Acceptance Criteria:**
- [ ] Given I've made some requests, when I call `getBudgetStatus()`, then I see current usage
- [ ] Given the data returned, when I check it, then it includes: used, remaining, dailyLimit, resetAt
- [ ] Given budget is tracked, when costs are calculated, then they're within 5% of actual provider costs
- [ ] Given multiple requests, when I check status, then usage is aggregated correctly across all providers

**Tasks:**
- [ ] Add `getBudgetStatus()` method to Gateway
- [ ] Implement cost calculation for OpenAI
- [ ] Add usage aggregation
- [ ] Test accuracy (within 5%)

**Files to Update:**
- `src/core/gateway.ts`
- `src/core/budget.ts`
- `src/providers/cloud/openai.ts`

**Dependencies:** US-005

---

#### US-007: Automatic Budget Reset at Midnight (3 pts)
**Priority:** P0 - Must Have
**Assignee:** Developer
**Status:** 🔲 To Do

**Description:**
As a developer with daily budgets, I want my budget to reset automatically at midnight UTC, so that I don't have to manually manage budget cycles.

**Acceptance Criteria:**
- [ ] Given it's midnight UTC, when the time passes, then budget usage resets to $0
- [ ] Given budget reset occurs, when I check `getBudgetStatus()`, then `used` is 0 and `resetAt` is tomorrow midnight
- [ ] Given budget reset is imminent, when I check status, then `resetAt` shows the correct next reset time
- [ ] Given the app restarts, when initialization occurs, then budget state is recalculated correctly

**Tasks:**
- [ ] Implement automatic reset logic in BudgetManager
- [ ] Add reset time calculation (midnight UTC)
- [ ] Handle app restarts correctly
- [ ] Test reset behavior thoroughly

**Files to Update:**
- `src/core/budget.ts`
- `tests/core/budget.test.ts`

**Dependencies:** US-006

---

#### US-023: Comprehensive TypeScript Types (3 pts)
**Priority:** P0 - Must Have
**Assignee:** Developer
**Status:** 🔲 To Do

**Description:**
As a TypeScript developer, I want full type definitions for all APIs, so that I get autocomplete and compile-time error checking.

**Acceptance Criteria:**
- [ ] Given I import the library, when I use VSCode, then I see autocomplete for all methods
- [ ] Given I pass wrong types, when I compile, then TypeScript shows clear errors
- [ ] Given I check types, when I hover over functions, then I see parameter descriptions
- [ ] Given I use the library, when I build, then there are no type errors

**Tasks:**
- [ ] Define all TypeScript interfaces in types.ts
- [ ] Add JSDoc comments for documentation
- [ ] Configure TypeScript for strict mode
- [ ] Generate .d.ts declaration files
- [ ] Test types with example code

**Files to Create/Update:**
- `src/utils/types.ts`
- `tsconfig.json`
- All source files (add JSDoc)

**Dependencies:** All other stories (ongoing)

---

### 🏃 In Progress (0 points)
*Nothing in progress yet - let's get started!*

---

### ✅ Done (0 points)
*Nothing completed yet - sprint just started!*

---

## Sprint Metrics

**Burndown:**
- Day 0: 16 points remaining
- Day 1: ___ points remaining
- Day 2: ___ points remaining
- ...
- Day 14: 0 points remaining (goal!)

**Velocity:**
- This sprint: TBD (first sprint)
- Target: 16 points / 2 weeks = 8 points/week

**Completion Rate:**
- Stories: 0/6 (0%)
- Points: 0/16 (0%)

---

## Daily Standup Log

### Day 1 - [Date]
**Completed:**
- Sprint kickoff
- Board created

**Today:**
- Set up project structure
- Begin US-001

**Blockers:**
- None

---

### Day 2 - [Date]
**Completed:**
- [To be filled daily]

**Today:**
- [To be filled daily]

**Blockers:**
- [To be filled daily]

---

## Sprint Risks & Impediments

### Active Impediments
*None currently*

### Risks
- ⚠️ **First sprint** - Unknown velocity, may over/under commit
  - **Mitigation:** Can adjust scope if needed, US-023 can flex
- ⚠️ **Solo developer** - Limited capacity if blocked
  - **Mitigation:** BMad agents available to help

---

## Sprint Ceremonies

### Sprint Planning ✅
- **Date:** Today (Sprint Start)
- **Duration:** This handoff
- **Attendees:** Developer, John (PM), Bob (SM)
- **Outcome:** 16 points committed

### Daily Standup
- **Format:** Async updates (or sync if preferred)
- **Time:** Morning (flexible)
- **Duration:** 15 min max
- **Template:** See "Daily Standup Log" above

### Sprint Review
- **Date:** End of Week 2
- **Duration:** 1 hour
- **Goal:** Demo working gateway with budget tracking
- **Attendees:** Team + stakeholders

### Sprint Retrospective
- **Date:** End of Week 2 (after review)
- **Duration:** 30-45 min
- **Format:** Start/Stop/Continue
- **Goal:** Improve for Sprint 2

---

## Definition of Done

A story is "Done" when:
- ✅ All acceptance criteria met
- ✅ Code written and follows style guide
- ✅ Unit tests written and passing
- ✅ Integration tests passing (where applicable)
- ✅ Code reviewed (self or peer)
- ✅ No console errors/warnings
- ✅ Documentation updated (README, comments)
- ✅ Committed to git with clear message
- ✅ Demo-able (can show it working)

---

## Sprint Goal Success Criteria

**Sprint 1 is successful if:**
1. ✅ Can install and initialize gateway
2. ✅ Can make OpenAI completion requests
3. ✅ Budget blocks at exact limit
4. ✅ Budget tracking is accurate (±5%)
5. ✅ Budget resets at midnight UTC
6. ✅ TypeScript types work in IDE
7. ✅ Test coverage ≥80% (100% for budget module)
8. ✅ Demo to stakeholders works

**Demo script:**
```typescript
import { createGateway } from 'cognigate';

const ai = createGateway({
  dailyBudget: 10,
  cloudProviders: {
    openai: { apiKey: process.env.OPENAI_API_KEY }
  }
});

// 1. Make a request
const answer = await ai.complete("What is TypeScript?");
console.log('Answer:', answer);

// 2. Check budget
const status = ai.getBudgetStatus();
console.log(`Budget: $${status.used.toFixed(4)} / $${status.dailyLimit}`);
console.log(`Remaining: $${status.remaining.toFixed(4)}`);
console.log(`Resets at: ${status.resetAt.toLocaleString()}`);

// 3. Verify budget protection (if we make enough requests)
// Eventually should throw BudgetExceededError
```

---

## Notes & Decisions

**Technical Decisions:**
- TypeScript strict mode enabled
- Vitest for testing (fast, modern)
- ESM-first, dual build for CJS compatibility
- In-memory budget tracking (no DB needed for MVP)

**Scope Decisions:**
- OpenAI provider only (other providers in Sprint 2)
- Basic cache (semantic caching in Sprint 3)
- Simple compression (advanced in Sprint 3)
- Node.js focus (browser in Sprint 3)

**Risks Accepted:**
- Solo developer (mitigated with BMad agents)
- First sprint unknowns (can adjust in Sprint 2)

---

## Resources

- **Implementation Guide:** `IMPLEMENTATION_GUIDE.md`
- **User Stories:** `docs/USER_STORIES.md`
- **Architecture:** `ARCHITECTURE.md`
- **Requirements:** `docs/REQUIREMENTS.md`

---

**Sprint Status:** 🟢 **ACTIVE - LET'S GO!**

**Last Updated:** [Auto-update daily]
