# Platform Tier Validation Guide

**Goal**: Validate if 5-10 indie developers would pay $149/mo for per-user AI usage tracking before building the feature.

**Timeline**: 1-2 weeks of customer conversations
**Success Criteria**: 5+ people say "I would pay for this" with specific use cases

---

## Target Customer Profile

**Who to talk to:**
- Indie hackers building AI chatbots
- Solo developers building AI SaaS products
- Small teams (2-5 people) with AI features
- Developers with paying customers already

**Where to find them:**
- Indie Hackers (search: "AI chatbot", "AI SaaS", "GPT")
- Reddit: r/SideProject, r/EntrepreneurRideAlong, r/SaaS
- Twitter/X: #buildinpublic, #indiehacker
- Product Hunt: Recent AI tool launches
- Discord: Indie Hackers, BuildSpace, AI Builder communities

---

## Validation Questions (20-Minute Call Script)

### Part 1: Current Situation (5 min)

**Question 1: Tell me about your product**
- What does it do?
- Who uses it?
- How do you use AI in it?

**Question 2: How many users do you have?**
- Free users: ___
- Paying users: ___
- Average AI requests per user per day: ___

**Question 3: How do you track AI costs today?**
- [ ] I don't track it
- [ ] I look at OpenAI dashboard manually
- [ ] I built custom tracking
- [ ] I use a tool (which one?)

### Part 2: Pain Points (5 min)

**Question 4: What's your biggest challenge with AI costs?**
Listen for:
- "I don't know which users cost me the most"
- "I can't set per-user limits"
- "Some users abuse the free tier"
- "I'm losing money on power users"

**Question 5: Do you have different user tiers?**
- [ ] Yes (free, pro, enterprise, etc.)
- [ ] No (everyone gets the same)

**If yes:** How do you limit AI usage per tier?
- [ ] Hard limits (max 10 messages/day)
- [ ] Soft limits (warnings)
- [ ] No limits (honor system)

**Question 6: Have you ever had to block a user for overuse?**
- [ ] Yes (tell me about it)
- [ ] No, but worried about it
- [ ] No, not an issue yet

### Part 3: Solution Validation (5 min)

**Question 7: If you could see AI usage per user, what would you do?**
Listen for:
- Identify heavy users
- Create usage-based pricing
- Set automatic limits
- Send upgrade prompts
- Predict costs

**Question 8: Show them the Platform tier concept**

> "I'm building a tool that lets you track AI costs per user. You'd add a single line to your code:
>
> ```javascript
> const response = await cognigate.chat.completions.create({
>   model: 'gpt-4',
>   messages: [...],
>   user: { id: 'user_123', tier: 'pro' }
> });
> ```
>
> Then you get:
> - Dashboard showing cost per user
> - Automatic tier limits (free users get 10 msgs/day, pro gets unlimited)
> - Alerts when users hit limits
> - Upgrade prompts you can show users
>
> Would this solve your problem?"

**Responses to listen for:**
- ✅ "Yes, I need this NOW"
- ✅ "I would pay for this"
- ⚠️ "Interesting, but I'd need to see it first"
- ❌ "Not really, I don't have that problem"

**Question 9: What would you pay for this?**
- Don't mention $149 yet
- Let them tell you a number first
- Listen for: $50, $100, $200+

**Question 10: If I had this ready in 4 weeks, would you try it?**
- [ ] Yes, sign me up for beta (GET EMAIL)
- [ ] Yes, but I'd need to see it first
- [ ] Maybe, depends on features
- [ ] No, not right now

### Part 4: Feature Prioritization (5 min)

**Question 11: Rank these features (1-5, 1 = most important)**

| Feature | Rank |
|---------|------|
| Per-user cost tracking dashboard | ___ |
| Automatic tier limits (free vs pro) | ___ |
| Email alerts when user hits limit | ___ |
| API to check user's remaining quota | ___ |
| Upgrade prompts for users | ___ |
| Usage-based billing integration | ___ |
| Webhook when user exceeds limit | ___ |

**Question 12: What's missing?**
- "Is there a feature you'd need that I didn't mention?"
- Listen for unique requirements

---

## Validation Posts (Copy-Paste Ready)

### Indie Hackers Post

**Title:** "Would you pay $149/mo to track AI costs per user?"

**Body:**
```
Hey IH community! 👋

Building an AI product? I'm working on something and need your input.

**The Problem:**
You're building an AI chatbot/SaaS. You have 1,000 users. Some free, some paid.

You wake up to a $500 OpenAI bill. But you have NO IDEA:
- Which users cost you the most
- If your free tier is losing money
- When to prompt users to upgrade

**The Solution I'm Building:**
A tool that tracks AI costs PER USER with automatic tier limits.

One line of code:
```javascript
const response = await cognigate.chat.completions.create({
  model: 'gpt-4',
  user: { id: 'user_123', tier: 'pro' }
});
```

You get:
✅ Dashboard: see cost per user
✅ Tier limits: free users get 10 msgs/day, pro unlimited
✅ Auto-upgrade prompts when users hit limits
✅ Webhooks for your own logic

**My Questions:**
1. Do you have this problem?
2. How do you solve it today?
3. Would you pay $149/mo for this?

Drop a comment or DM me! 🚀
```

### Reddit r/SideProject Post

**Title:** "I built a tool to track AI costs per user (looking for feedback)"

**Body:**
```
Hey r/SideProject!

I'm a developer who built an AI chatbot side project. I was bleeding money on the free tier because I couldn't track which users were costing me the most.

So I built a tool to fix it. Now I want to know if others have this problem.

**What it does:**
- Tracks AI costs per user (not just total)
- Sets limits per tier (free vs paid)
- Sends alerts when users hit limits
- Shows upgrade prompts to users

**Example use case:**
You have 1,000 users. 900 free, 100 paid.

You set limits:
- Free: 10 messages/day
- Pro: Unlimited

When a free user hits 10 messages, they see: "Upgrade to Pro for unlimited messages"

**My question:**
Is this a real problem? Would you use this?

Happy to share more details if anyone's interested!
```

### Twitter/X Post

**Tweet:**
```
Building an AI product?

Do you know which users cost you the most? 💸

I'm building a tool to track AI costs PER USER with automatic tier limits.

Would you pay $149/mo for this?

DM me if interested! 🚀

#buildinpublic #indiehacker #AI
```

---

## Validation Spreadsheet Template

Track your conversations:

| Date | Name | Product | Users | Pain Level (1-5) | Would Pay? | Price Point | Beta Interest | Email | Notes |
|------|------|---------|-------|------------------|------------|-------------|---------------|-------|-------|
| 12/1 | John | AI Chatbot | 500 | 4 | Yes | $100 | Yes | john@ex.com | Losing money on free tier |
| 12/2 | Sarah | Docs AI | 2000 | 3 | Maybe | $50 | No | sarah@ex.com | Has custom tracking already |

---

## Success Metrics

**After 10 conversations, look for:**

✅ **5+ people say "I would pay for this"**
- → BUILD IT (Platform tier validated)

⚠️ **2-4 people interested**
- → Keep validating, adjust messaging
- → Maybe it's a nice-to-have, not must-have

❌ **0-1 people interested**
- → PIVOT (not a real problem yet)
- → Focus on Indie tier ($29/mo) for now

---

## Pricing Validation Strategy

**Don't mention $149 first. Ask:**
"What would you pay for this per month?"

**Common Responses:**
- "$50" → Too low, they don't value it enough
- "$100-150" → ✅ PERFECT, validates $149 price
- "$200+" → You can charge more!
- "I'd build it myself" → Not your customer

**If they say "$50":**
- Ask: "Even if it saved you $500/mo in wasted AI costs?"
- Explain ROI: "Most customers save 5x what they pay"

---

## Next Steps After Validation

**If validated (5+ interested):**
1. Send beta signup form to all interested people
2. Build 2-week MVP (US-1, US-2, US-3 from spec)
3. Onboard first 3 beta customers
4. Iterate based on feedback
5. Launch publicly

**If not validated:**
1. Stick with Indie tier ($29/mo)
2. Launch to market
3. Talk to first 20 customers
4. Revisit Platform tier if 5+ ask for it

---

## Cold Email Template

**Subject:** Quick question about [their product name]

**Body:**
```
Hey [Name],

I saw you launched [product name] on Product Hunt - congrats on the launch! 🎉

I noticed you're using AI in your product. Quick question:

Do you track AI costs per user? Or do you just see the total bill from OpenAI?

I'm building a tool to solve this (track cost per user, set tier limits, etc.) and talking to folks who might need it.

Would love 15 minutes of your time to ask a few questions. Not selling anything - genuinely just want to understand the problem.

Available this week?

Thanks!
[Your name]
```

---

## Interview Notes Template

**After each call, write:**

**What I Learned:**
- [Their biggest pain point]
- [How they solve it today]
- [What they'd pay]

**Quotes:**
- "[Direct quote about their problem]"
- "[Their reaction to the solution]"

**Follow-up:**
- [ ] Send beta signup link
- [ ] Add to email list
- [ ] Connect on Twitter
- [ ] Schedule check-in

---

## Validation Timeline

**Week 1:**
- Day 1-2: Post on IH, Reddit, Twitter
- Day 3-7: 10 customer calls

**Week 2:**
- Day 8-10: Analyze responses
- Day 11-12: Decide: Build Platform tier? Or stick with Indie tier?
- Day 13-14: If building, start MVP

---

## Red Flags (Don't Build If You See These)

❌ People say "cool idea" but won't commit to paying
❌ Everyone wants it cheaper than $100/mo
❌ Only enterprise companies want it (not indie hackers)
❌ People say "I'd just build it myself"
❌ The pain level is 1-2 out of 5 (nice-to-have, not must-have)

---

## Green Flags (BUILD IT!)

✅ People say "I need this NOW"
✅ They ask when it's ready
✅ They offer to pay upfront
✅ Pain level is 4-5 out of 5
✅ They describe the exact problem you're solving
✅ They're already paying for other tools to solve pieces of this

---

**Next Action:** Pick 3 places to post this week, schedule 5 customer calls, and see what you learn! 🚀

**Remember:** You're not selling yet. You're learning if this is a real problem worth solving.
