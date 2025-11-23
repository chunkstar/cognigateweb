# Platform Tier - Technical Specification
**Feature:** Multi-Tenant User Management for AI Applications
**Target:** Developers building AI products with end-users
**Pricing:** $149/month (up to 1,000 end-users)

---

## Executive Summary

Enable Cognigate customers to manage AI usage for their own end-users, with per-user quotas, limits, and tracking.

**Use Cases:**
- AI chatbot platforms (customer support, internal tools)
- AI SaaS products (writing tools, image generators)
- API resellers (selling access to AI models)
- Multi-tenant applications

**Core Value:**
- Track usage per end-user
- Enforce limits per user tier
- Aggregate billing to customer
- Prevent abuse and cost overruns

---

## User Stories

### Epic: Multi-Tenant User Management

#### US-1: Register End-Users
**As a** Platform tier customer
**I want to** register my end-users with Cognigate
**So that** I can track their individual AI usage

**Acceptance Criteria:**
- [ ] API endpoint to create/update end-users
- [ ] Support for external user IDs (customer's own IDs)
- [ ] Associate end-users with customer's organization
- [ ] Support user metadata (tier, limits, custom fields)
- [ ] Batch registration (import 1000+ users at once)
- [ ] Idempotent operations (safe to retry)

**API Design:**
```typescript
// Create/update single user
POST /api/v1/users
{
  "externalId": "user_123_from_my_app",
  "tier": "pro",
  "metadata": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "limits": {
    "daily": {
      "requests": 100,
      "cost": 5.00
    },
    "monthly": {
      "requests": 3000,
      "cost": 150.00
    }
  }
}

// Batch registration
POST /api/v1/users/batch
{
  "users": [
    { "externalId": "user_1", "tier": "free", ... },
    { "externalId": "user_2", "tier": "pro", ... },
    // ... up to 1000 at once
  ]
}

// Get user details
GET /api/v1/users/{externalId}

// List users with pagination
GET /api/v1/users?page=1&limit=100&tier=pro

// Delete user
DELETE /api/v1/users/{externalId}
```

---

#### US-2: Make AI Requests with User Context
**As a** Platform tier customer
**I want to** make AI requests on behalf of specific end-users
**So that** usage is tracked per user

**Acceptance Criteria:**
- [ ] Pass user ID with every AI request
- [ ] Automatically track usage to that user
- [ ] Enforce user-specific limits
- [ ] Return quota info in response headers
- [ ] Support both streaming and non-streaming
- [ ] Thread-safe quota checking

**SDK Usage:**
```typescript
import { Cognigate } from 'cognigate';

const cognigate = new Cognigate({
  apiKey: process.env.COGNIGATE_API_KEY,
  plan: 'platform'
});

// Chat completion
const response = await cognigate.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
  // User context
  user: {
    id: 'user_123_from_my_app',
    tier: 'pro' // optional, will use registered tier
  }
});

// Response includes quota headers
console.log(response.headers);
// {
//   'X-Cognigate-User-Daily-Used': '45',
//   'X-Cognigate-User-Daily-Limit': '100',
//   'X-Cognigate-User-Daily-Remaining': '55',
//   'X-Cognigate-User-Monthly-Remaining': '2850'
// }
```

**Error Handling:**
```typescript
try {
  await cognigate.chat.completions.create({...});
} catch (error) {
  if (error.code === 'USER_QUOTA_EXCEEDED') {
    // User hit their daily/monthly limit
    return res.status(429).json({
      error: 'You have reached your daily limit',
      quota: error.quota,
      resetAt: error.resetAt
    });
  }

  if (error.code === 'USER_NOT_FOUND') {
    // User not registered, auto-register or reject
  }
}
```

---

#### US-3: Real-Time Quota Tracking
**As a** Platform tier customer
**I want to** check my end-users' current quota usage
**So that** I can display it in my app's UI

**Acceptance Criteria:**
- [ ] API to get current quota for a user
- [ ] Real-time (not delayed)
- [ ] Show daily and monthly usage
- [ ] Show remaining quota
- [ ] Show when quota resets
- [ ] Support bulk quota checks (multiple users)

**API Design:**
```typescript
// Get quota for single user
GET /api/v1/users/{externalId}/quota

Response:
{
  "userId": "user_123_from_my_app",
  "daily": {
    "used": 45,
    "limit": 100,
    "remaining": 55,
    "resetAt": "2025-12-01T00:00:00Z",
    "percentUsed": 45
  },
  "monthly": {
    "used": 850,
    "limit": 3000,
    "remaining": 2150,
    "resetAt": "2026-01-01T00:00:00Z",
    "percentUsed": 28.3
  },
  "cost": {
    "daily": 2.35,
    "monthly": 42.50
  }
}

// Bulk quota check (for dashboard)
POST /api/v1/users/quota/batch
{
  "userIds": ["user_1", "user_2", "user_3"]
}

Response:
{
  "quotas": [
    { "userId": "user_1", "daily": {...}, "monthly": {...} },
    { "userId": "user_2", "daily": {...}, "monthly": {...} },
    { "userId": "user_3", "daily": {...}, "monthly": {...} }
  ]
}
```

**SDK Usage:**
```typescript
// In your app's UI endpoint
app.get('/api/my-app/user/quota', async (req, res) => {
  const quota = await cognigate.users.getQuota(req.user.id);

  res.json({
    messagesRemaining: quota.daily.remaining,
    resetsAt: quota.daily.resetAt,
    upgrade: quota.daily.percentUsed > 80 // Show upgrade prompt
  });
});
```

---

#### US-4: Usage Analytics Dashboard
**As a** Platform tier customer
**I want to** see analytics of my end-users' AI usage
**So that** I can optimize costs and pricing

**Acceptance Criteria:**
- [ ] Dashboard showing usage by user
- [ ] Top users by cost/requests
- [ ] Usage breakdown by tier
- [ ] Time-series graphs (daily/weekly/monthly)
- [ ] Export to CSV
- [ ] Filter by date range, tier, user

**Dashboard Views:**

**View 1: Overview**
```
Total End-Users: 1,245
Active This Month: 892 (72%)

Cost Breakdown:
├─ Free tier (500 users): $125 (22%)
├─ Pro tier (300 users): $320 (56%)
└─ Enterprise (45 users): $128 (22%)

Total: $573 this month
Average per user: $0.46
```

**View 2: Top Users**
```
User ID         | Tier       | Requests | Cost    | % of Total
----------------|------------|----------|---------|----------
user_5892       | Enterprise | 45,293   | $45.20  | 7.9%
user_2341       | Pro        | 28,104   | $28.15  | 4.9%
user_8821       | Pro        | 22,456   | $22.35  | 3.9%
user_1203       | Free       | 9,982    | $9.98   | 1.7%
...
```

**View 3: Usage Trends**
```
[Line chart showing daily usage over last 30 days]
- Total requests per day
- Total cost per day
- Average per user

[Bar chart showing usage by tier]
- Free: 45% of requests, 20% of costs
- Pro: 40% of requests, 55% of costs
- Enterprise: 15% of requests, 25% of costs
```

**API for Analytics:**
```typescript
// Usage summary
GET /api/v1/analytics/summary?startDate=2025-12-01&endDate=2025-12-31

// Top users
GET /api/v1/analytics/top-users?limit=100&sortBy=cost

// Usage by tier
GET /api/v1/analytics/by-tier?startDate=2025-12-01

// Time series
GET /api/v1/analytics/timeseries?interval=day&startDate=2025-12-01

// Export
GET /api/v1/analytics/export?format=csv&startDate=2025-12-01
```

---

#### US-5: Webhooks for Quota Events
**As a** Platform tier customer
**I want to** receive webhooks when users hit quota thresholds
**So that** I can notify them or take action

**Acceptance Criteria:**
- [ ] Webhook when user hits 75% of quota
- [ ] Webhook when user hits 90% of quota
- [ ] Webhook when user hits 100% (quota exceeded)
- [ ] Webhook when user resets (new day/month)
- [ ] Configurable webhook URL per event type
- [ ] Secure webhook signatures (HMAC)
- [ ] Retry logic with exponential backoff

**Webhook Payload:**
```json
{
  "event": "user.quota.threshold",
  "timestamp": "2025-12-01T14:23:45Z",
  "data": {
    "userId": "user_123_from_my_app",
    "tier": "pro",
    "threshold": 90,
    "quota": {
      "type": "daily",
      "used": 90,
      "limit": 100,
      "remaining": 10,
      "percentUsed": 90
    }
  },
  "signature": "sha256=abc123..." // HMAC signature for verification
}
```

**Event Types:**
- `user.quota.threshold` - User hit 75%, 90%, or custom threshold
- `user.quota.exceeded` - User hit 100% of quota
- `user.quota.reset` - Quota reset (new day/month)
- `user.tier.upgrade` - User tier changed
- `user.registered` - New user registered
- `user.deleted` - User deleted

**SDK Configuration:**
```typescript
const cognigate = new Cognigate({
  apiKey: process.env.COGNIGATE_API_KEY,
  webhooks: {
    url: 'https://myapp.com/webhooks/cognigate',
    secret: process.env.WEBHOOK_SECRET,
    events: [
      'user.quota.threshold',
      'user.quota.exceeded'
    ]
  }
});

// Verify webhook in your endpoint
app.post('/webhooks/cognigate', async (req, res) => {
  const isValid = cognigate.webhooks.verify(
    req.body,
    req.headers['x-cognigate-signature']
  );

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;

  if (event.event === 'user.quota.threshold' && event.data.threshold === 90) {
    // Notify user they're approaching limit
    await sendEmail(event.data.userId, {
      subject: 'Approaching your daily limit',
      body: `You've used 90% of your daily quota. Upgrade to Pro for more!`
    });
  }

  if (event.event === 'user.quota.exceeded') {
    // User hit limit, show upgrade prompt
    await showUpgradePrompt(event.data.userId);
  }

  res.status(200).json({ received: true });
});
```

---

#### US-6: Auto-Provisioning & Tier Management
**As a** Platform tier customer
**I want to** automatically register users on first request
**So that** I don't have to pre-register everyone

**Acceptance Criteria:**
- [ ] Option to auto-create users on first request
- [ ] Default tier for auto-created users
- [ ] Option to update user tier dynamically
- [ ] Tier change takes effect immediately
- [ ] Audit log of tier changes

**Auto-Provisioning:**
```typescript
const cognigate = new Cognigate({
  apiKey: process.env.COGNIGATE_API_KEY,
  autoProvision: {
    enabled: true,
    defaultTier: 'free',
    defaultLimits: {
      daily: { requests: 10 },
      monthly: { requests: 300 }
    }
  }
});

// First request from unknown user
await cognigate.chat.completions.create({
  model: 'gpt-4',
  messages: [...],
  user: {
    id: 'never_seen_before_user_999',
    // No tier specified, will use defaultTier
  }
});
// Cognigate automatically creates user with 'free' tier
```

**Tier Updates:**
```typescript
// User upgrades in your app
app.post('/api/my-app/upgrade', async (req, res) => {
  // Update in your database
  await db.users.update(req.user.id, { tier: 'pro' });

  // Update in Cognigate
  await cognigate.users.update(req.user.id, {
    tier: 'pro',
    limits: {
      daily: { requests: 100 },
      monthly: { requests: 3000 }
    }
  });

  res.json({ success: true });
});

// Tier change is immediate (no delay)
```

---

#### US-7: Fair Usage & Abuse Prevention
**As a** Platform tier customer
**I want to** detect and prevent abuse
**So that** one user doesn't drive up my costs

**Acceptance Criteria:**
- [ ] Rate limiting per user (requests per second)
- [ ] Anomaly detection (sudden spike in usage)
- [ ] Auto-block abusive users
- [ ] Alerts when user behavior is suspicious
- [ ] Whitelist/blacklist users

**Abuse Detection:**
```typescript
// Configure abuse detection
await cognigate.settings.update({
  abuseDetection: {
    enabled: true,
    thresholds: {
      requestsPerMinute: 60, // Max 60 req/min per user
      costPerHour: 10.00,     // Alert if user costs $10 in 1 hour
      dailySpike: 5.0         // Alert if user's usage is 5x their average
    },
    actions: {
      onRateLimit: 'throttle', // or 'block'
      onCostSpike: 'alert',     // or 'block'
      onAnomaly: 'alert'
    }
  }
});
```

**Webhook for Abuse:**
```json
{
  "event": "user.abuse.detected",
  "data": {
    "userId": "user_suspicious_999",
    "reason": "cost_spike",
    "details": {
      "normalCostPerDay": 0.50,
      "actualCostToday": 25.00,
      "multiplier": 50
    },
    "action": "throttled",
    "timestamp": "2025-12-01T15:00:00Z"
  }
}
```

**Manual Controls:**
```typescript
// Block a user
await cognigate.users.block('user_suspicious_999');

// Unblock
await cognigate.users.unblock('user_suspicious_999');

// Set custom rate limit for specific user
await cognigate.users.update('user_power_user_123', {
  rateLimits: {
    requestsPerMinute: 120 // Higher limit for this user
  }
});
```

---

## Database Schema

### Tables

```sql
-- End-users (belongs to organizations)
CREATE TABLE end_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL, -- Customer's user ID
    tier VARCHAR(50) NOT NULL DEFAULT 'free',
    metadata JSONB DEFAULT '{}',

    -- Limits
    daily_request_limit INTEGER,
    daily_cost_limit DECIMAL(10, 2),
    monthly_request_limit INTEGER,
    monthly_cost_limit DECIMAL(10, 2),

    -- Rate limiting
    requests_per_minute INTEGER DEFAULT 60,

    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, blocked, suspended
    blocked_reason TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(org_id, external_id),
    INDEX idx_external_id (org_id, external_id),
    INDEX idx_tier (org_id, tier),
    INDEX idx_status (org_id, status)
);

-- Real-time quota tracking (optimized for high-throughput)
CREATE TABLE user_quotas (
    end_user_id UUID PRIMARY KEY REFERENCES end_users(id) ON DELETE CASCADE,

    -- Daily counters
    daily_requests_used INTEGER DEFAULT 0,
    daily_cost_used DECIMAL(10, 6) DEFAULT 0,
    daily_last_reset TIMESTAMP DEFAULT NOW(),

    -- Monthly counters
    monthly_requests_used INTEGER DEFAULT 0,
    monthly_cost_used DECIMAL(10, 6) DEFAULT 0,
    monthly_last_reset TIMESTAMP DEFAULT NOW(),

    -- Last request timestamp (for rate limiting)
    last_request_at TIMESTAMP,

    updated_at TIMESTAMP DEFAULT NOW(),

    INDEX idx_daily_usage (end_user_id, daily_requests_used),
    INDEX idx_monthly_usage (end_user_id, monthly_requests_used)
);

-- Usage logs (detailed history)
CREATE TABLE user_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    end_user_id UUID NOT NULL REFERENCES end_users(id) ON DELETE CASCADE,

    -- Request details
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    tokens_input INTEGER,
    tokens_output INTEGER,
    tokens_total INTEGER,

    -- Cost
    cost DECIMAL(10, 6) NOT NULL,

    -- Metadata
    request_id VARCHAR(255),
    duration_ms INTEGER,
    cached BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT NOW(),

    INDEX idx_user_created (end_user_id, created_at DESC),
    INDEX idx_org_created (org_id, created_at DESC),
    INDEX idx_cost (org_id, created_at, cost DESC)
);

-- Partitioning for scale
CREATE TABLE user_usage_logs_2025_12 PARTITION OF user_usage_logs
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Tier changes audit log
CREATE TABLE tier_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    end_user_id UUID NOT NULL REFERENCES end_users(id) ON DELETE CASCADE,
    old_tier VARCHAR(50),
    new_tier VARCHAR(50) NOT NULL,
    changed_by VARCHAR(255), -- 'api', 'dashboard', 'auto'
    reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),

    INDEX idx_user_created (end_user_id, created_at DESC)
);

-- Webhook configurations
CREATE TABLE webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    secret VARCHAR(255) NOT NULL,
    events TEXT[] NOT NULL, -- ['user.quota.threshold', 'user.quota.exceeded']
    enabled BOOLEAN DEFAULT TRUE,
    retry_count INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT NOW(),

    INDEX idx_org_enabled (org_id, enabled)
);

-- Webhook delivery log
CREATE TABLE webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    attempts INTEGER DEFAULT 0,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),

    INDEX idx_endpoint_created (webhook_endpoint_id, created_at DESC)
);
```

---

## API Implementation

### Core Services

#### 1. UserService
```typescript
class UserService {
  // CRUD operations
  async create(orgId: string, data: CreateUserData): Promise<User>
  async update(orgId: string, externalId: string, data: UpdateUserData): Promise<User>
  async delete(orgId: string, externalId: string): Promise<void>
  async get(orgId: string, externalId: string): Promise<User>
  async list(orgId: string, filters: ListFilters): Promise<PaginatedUsers>

  // Batch operations
  async createBatch(orgId: string, users: CreateUserData[]): Promise<BatchResult>

  // Quota management
  async getQuota(orgId: string, externalId: string): Promise<Quota>
  async checkQuota(orgId: string, externalId: string, cost: number): Promise<boolean>
  async incrementQuota(orgId: string, externalId: string, usage: Usage): Promise<void>
  async resetQuota(endUserId: string, type: 'daily' | 'monthly'): Promise<void>

  // Status management
  async block(orgId: string, externalId: string, reason: string): Promise<void>
  async unblock(orgId: string, externalId: string): Promise<void>
}
```

#### 2. QuotaService (High-Performance)
```typescript
class QuotaService {
  private redis: Redis;
  private db: PostgreSQL;

  // Real-time quota checking (uses Redis for speed)
  async checkAndIncrement(
    endUserId: string,
    cost: number,
    requests: number
  ): Promise<QuotaCheckResult> {
    // 1. Get current quota from Redis (fast!)
    const current = await this.redis.get(`quota:${endUserId}`);

    // 2. Check limits
    if (current.daily.used + requests > current.daily.limit) {
      return { allowed: false, reason: 'daily_limit_exceeded' };
    }

    // 3. Increment in Redis atomically
    await this.redis.incrby(`quota:${endUserId}:daily`, requests);
    await this.redis.incrbyfloat(`quota:${endUserId}:daily:cost`, cost);

    // 4. Async write to PostgreSQL (for durability)
    this.writeToDatabase(endUserId, cost, requests); // Fire-and-forget

    return { allowed: true, remaining: current.daily.limit - current.daily.used - requests };
  }

  // Reset quotas (runs on cron job)
  async resetDailyQuotas(): Promise<void> {
    // Reset all daily quotas at midnight UTC
    await this.redis.eval(RESET_DAILY_SCRIPT);
    await this.db.query('UPDATE user_quotas SET daily_requests_used = 0, daily_cost_used = 0, daily_last_reset = NOW()');
  }
}
```

#### 3. AnalyticsService
```typescript
class AnalyticsService {
  async getOverview(orgId: string, dateRange: DateRange): Promise<OverviewStats>
  async getTopUsers(orgId: string, limit: number, sortBy: 'cost' | 'requests'): Promise<TopUsers[]>
  async getUsageByTier(orgId: string, dateRange: DateRange): Promise<TierBreakdown>
  async getTimeSeries(orgId: string, interval: 'hour' | 'day' | 'week', dateRange: DateRange): Promise<TimeSeriesData>
  async export(orgId: string, format: 'csv' | 'json', dateRange: DateRange): Promise<StreamableFile>
}
```

#### 4. WebhookService
```typescript
class WebhookService {
  async send(orgId: string, event: WebhookEvent): Promise<void> {
    // Get webhook configs for this org
    const configs = await this.getConfigs(orgId, event.type);

    // Send to all configured endpoints
    await Promise.all(
      configs.map(config => this.deliver(config, event))
    );
  }

  private async deliver(config: WebhookConfig, event: WebhookEvent): Promise<void> {
    const signature = this.sign(event, config.secret);

    try {
      await fetch(config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cognigate-Signature': signature,
          'X-Cognigate-Event': event.type
        },
        body: JSON.stringify(event)
      });
    } catch (error) {
      // Retry logic with exponential backoff
      await this.retry(config, event, 1);
    }
  }
}
```

---

## Performance Requirements

### Throughput
- **Target:** Handle 10,000 requests/second across all users
- **Per-user quota check:** < 5ms (using Redis)
- **Database writes:** Async, batched every 1 second
- **Analytics queries:** < 500ms for dashboard

### Scalability
- **Users per organization:** Up to 100,000 end-users
- **Concurrent requests:** 10,000+ simultaneous
- **Data retention:** 90 days of detailed logs (then aggregate)

### Optimization Strategies

**1. Redis for Real-Time Quotas**
```
Redis Structure:
quota:{endUserId}:daily -> Hash { requests: 45, cost: 2.35, limit: 100 }
quota:{endUserId}:monthly -> Hash { requests: 850, cost: 42.50, limit: 3000 }
rate:{endUserId} -> Sorted Set (for rate limiting)
```

**2. Database Partitioning**
```sql
-- Partition usage logs by month
CREATE TABLE user_usage_logs_2025_12 PARTITION OF user_usage_logs ...
CREATE TABLE user_usage_logs_2026_01 PARTITION OF user_usage_logs ...

-- Drop old partitions
DROP TABLE user_usage_logs_2025_09;
```

**3. Caching Strategy**
```typescript
// Cache user config for 5 minutes
const userConfig = await cache.get(`user:${externalId}:config`, async () => {
  return await db.users.get(orgId, externalId);
}, { ttl: 300 });
```

---

## SDK Implementation

### TypeScript SDK

```typescript
// Main SDK class
export class Cognigate {
  private apiKey: string;
  private baseUrl: string;
  public users: UserManagement;
  public analytics: Analytics;
  public webhooks: Webhooks;

  constructor(config: CognigateConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.cognigate.dev';

    if (config.plan === 'platform') {
      this.users = new UserManagement(this);
      this.analytics = new Analytics(this);
      this.webhooks = new Webhooks(this);
    }
  }

  // Core AI methods
  async chat.completions.create(params: ChatCompletionParams): Promise<ChatCompletion> {
    // If user context provided, check quota
    if (params.user) {
      await this.checkUserQuota(params.user.id, estimatedCost(params));
    }

    // Make AI request
    const response = await this.makeRequest(params);

    // Track usage
    if (params.user) {
      await this.trackUserUsage(params.user.id, response.usage, response.cost);
    }

    return response;
  }
}

// User management
export class UserManagement {
  async create(data: CreateUserData): Promise<User>
  async update(externalId: string, data: UpdateUserData): Promise<User>
  async delete(externalId: string): Promise<void>
  async get(externalId: string): Promise<User>
  async list(filters?: ListFilters): Promise<PaginatedUsers>
  async getQuota(externalId: string): Promise<Quota>
  async block(externalId: string, reason: string): Promise<void>
  async unblock(externalId: string): Promise<void>
}

// Analytics
export class Analytics {
  async getOverview(dateRange: DateRange): Promise<OverviewStats>
  async getTopUsers(limit: number): Promise<TopUser[]>
  async getUsageByTier(dateRange: DateRange): Promise<TierBreakdown>
  async export(format: 'csv' | 'json', dateRange: DateRange): Promise<Buffer>
}

// Webhooks
export class Webhooks {
  verify(payload: any, signature: string): boolean
  sign(payload: any): string
}
```

### Usage Example (Full Flow)

```typescript
import { Cognigate } from 'cognigate';
import express from 'express';

const app = express();
const cognigate = new Cognigate({
  apiKey: process.env.COGNIGATE_API_KEY,
  plan: 'platform',
  autoProvision: {
    enabled: true,
    defaultTier: 'free',
    defaultLimits: {
      daily: { requests: 10 },
      monthly: { requests: 300 }
    }
  }
});

// Your app's chat endpoint
app.post('/api/chat', async (req, res) => {
  const userId = req.user.id;
  const userTier = req.user.tier;

  try {
    // Check quota first (optional - SDK does it automatically)
    const quota = await cognigate.users.getQuota(userId);

    if (quota.daily.remaining === 0) {
      return res.status(429).json({
        error: 'Daily limit reached',
        upgrade: {
          from: userTier,
          to: 'pro',
          benefits: 'Get 100 messages/day instead of 10'
        }
      });
    }

    // Make AI request
    const response = await cognigate.chat.completions.create({
      model: 'gpt-4',
      messages: req.body.messages,
      user: {
        id: userId,
        tier: userTier
      }
    });

    // Return response + quota info
    res.json({
      message: response.choices[0].message,
      quota: {
        remaining: response.headers['X-Cognigate-User-Daily-Remaining'],
        resetAt: response.headers['X-Cognigate-User-Reset-At']
      }
    });

  } catch (error) {
    if (error.code === 'USER_QUOTA_EXCEEDED') {
      return res.status(429).json({
        error: 'Daily limit exceeded',
        quota: error.quota
      });
    }
    throw error;
  }
});

// Handle webhooks
app.post('/webhooks/cognigate', async (req, res) => {
  const isValid = cognigate.webhooks.verify(
    req.body,
    req.headers['x-cognigate-signature']
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  const event = req.body;

  if (event.event === 'user.quota.threshold' && event.data.threshold === 90) {
    // Send email to user
    await sendEmail(event.data.userId, {
      subject: "You're running out of messages!",
      template: 'quota-warning',
      data: {
        remaining: event.data.quota.remaining,
        upgradeLink: `https://myapp.com/upgrade`
      }
    });
  }

  res.sendStatus(200);
});
```

---

## Pricing & Billing

### Platform Tier Limits

**$149/month includes:**
- Up to 1,000 registered end-users
- Unlimited API requests (pass-through to AI providers)
- All platform features
- Email support (48hr response)

**Overage:**
- $0.10 per additional end-user per month
- Example: 1,500 users = $149 + (500 × $0.10) = $199/mo

**Volume Discounts:**
- 5,000+ users: $0.08/user/month
- 10,000+ users: $0.05/user/month
- 50,000+ users: Contact sales (Enterprise tier)

---

## Security & Compliance

### Data Isolation
- Each organization's data is logically isolated
- Row-level security in PostgreSQL
- API keys scoped to organization

### Encryption
- End-user data encrypted at rest (AES-256)
- API keys encrypted with org-specific keys
- TLS 1.3 for all connections

### Privacy
- No sharing of end-user data between orgs
- GDPR compliant (data export, deletion)
- SOC 2 Type 2 (planned for Month 12)

---

## Migration Path

### For Existing Customers

**Scenario:** Customer on Indie tier wants to upgrade to Platform

**Migration Steps:**
1. Upgrade plan in Stripe (prorate)
2. Enable platform features in account
3. Provide migration guide
4. SDK update (add user management)
5. Test with sandbox environment
6. Go live

**Backwards Compatibility:**
- Indie tier customers can continue as-is
- No breaking changes to SDK
- Platform features are opt-in

---

## Development Timeline

### Phase 1: Core Infrastructure (Weeks 1-2)
- [ ] Database schema
- [ ] User CRUD APIs
- [ ] Quota tracking (Redis + PostgreSQL)
- [ ] Basic SDK methods

### Phase 2: Usage Tracking (Week 3)
- [ ] Usage logging
- [ ] Per-user cost calculation
- [ ] Quota enforcement
- [ ] Error handling

### Phase 3: Analytics (Week 4)
- [ ] Analytics queries
- [ ] Dashboard UI
- [ ] CSV export
- [ ] Time-series graphs

### Phase 4: Webhooks (Week 5)
- [ ] Webhook delivery system
- [ ] Event triggers
- [ ] Retry logic
- [ ] Signature verification

### Phase 5: Polish & Launch (Week 6)
- [ ] Documentation
- [ ] SDK examples
- [ ] Migration guide
- [ ] Beta testing
- [ ] Launch

---

## Success Metrics

### Technical Metrics
- Quota check latency < 5ms (p95)
- API uptime > 99.9%
- Webhook delivery rate > 99%
- Database query time < 100ms (p95)

### Business Metrics
- 10 Platform tier customers by Month 3 ($1,490 MRR)
- 30 Platform tier customers by Month 6 ($4,470 MRR)
- 50 Platform tier customers by Month 12 ($7,450 MRR)
- Average 1,500 end-users per customer
- Churn < 5% monthly

---

## Documentation Requirements

### API Documentation
- OpenAPI spec
- Interactive API explorer
- Code examples (TypeScript, Python)
- Webhook reference

### Integration Guides
- Quick start (5 min setup)
- Chatbot integration guide
- SaaS product integration guide
- Migration from DIY solution

### SDK Documentation
- Full API reference
- Usage examples
- Best practices
- Troubleshooting

---

## Open Questions

1. **Auto-provisioning:** Should it be enabled by default?
2. **Quota reset timing:** UTC midnight or customer's timezone?
3. **Abuse detection:** How aggressive should we be?
4. **Free tier:** Should Platform tier have a free tier for testing?
5. **Webhooks:** Should we support custom retry logic per webhook?

---

## Next Steps

1. **Validate with customers** - Show this spec to 5-10 potential Platform tier customers
2. **Prioritize features** - Which features are must-have vs nice-to-have?
3. **Technical design review** - Review with engineer for feasibility
4. **Build prototype** - 2-week MVP with core features
5. **Beta test** - Launch to 3-5 beta customers
6. **Iterate** - Based on feedback
7. **Public launch** - Announce Platform tier

---

**Document Owner:** Mary (Business Analyst)
**Last Updated:** November 22, 2025
**Status:** Draft - Ready for Review
