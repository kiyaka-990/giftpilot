1. GitHub README.md (copy this entirely)Markdown# GiftPilot

**AI Gift Shopping Agent powered by Claude + Channel3 + PayPal**

GiftPilot is an agentic commerce application that turns a simple conversation into a completed purchase.

Users describe who the gift is for, the occasion, interests, and budget. The AI agent:
1. Understands the request using Claude
2. Searches real products across thousands of retailers using Channel3
3. Presents the best options
4. Creates a real PayPal order when the user chooses one
5. Lets the user complete payment securely in the PayPal sandbox

This is true **agentic commerce** — the AI doesn’t just recommend, it transacts.

---

## Live Demo

https://giftpilot-coral.vercel.app/

## Demo Video

[Your YouTube link here]

---

## Tech Stack

- **AI**: Claude (Anthropic)
- **Product Search**: Channel3
- **Payments**: PayPal Orders API (Sandbox)
- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS

---

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
Create a .env.local file:envPAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
CHANNEL3_API_KEY=your_channel3_key
ANTHROPIC_API_KEY=your_claude_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
Run the development server:Bashnpm run dev
Open http://localhost:3000
How it works
User describes a gift request
Claude extracts intent and budget
Channel3 searches real products
User selects a product (“Buy 2”)
The agent creates a PayPal order
User completes payment in PayPal sandbox
Order is captured and success page is shown
Built forPayPal AI Hackathon 2026Targeting:
Best Use of Agentic Commerce
Best Use of Channel3
Overall prizes
LicenseMITtext---

### 2. “Built With” section for Devpost submissionClaude (Anthropic), Channel3, PayPal Orders API, Next.js, TypeScript, Tailwind CSStextOr the longer version if the form allows more detail:AI Reasoning: Claude (Anthropic)
Product Search: Channel3
Payments: PayPal Orders API (Sandbox)
Frontend: Next.js 16 + TypeScript + Tailwind CSStext---

### 3. Short Tagline / Elevator Pitch (for Devpost)An AI agent that finds the perfect gift and buys it for you with PayPal — true agentic commerce.text

---

## Holiday Edition — what's new in this build

**Agentic reasoning** (optional, needs `ANTHROPIC_API_KEY`)
- Claude turns a messy conversation into a clean search brief: recipient, interests, budget
- Live Channel3 results are ranked with a **"Why it fits"** line per product, plus a visible **Gift brief**
- No key configured? The agent falls back to the built-in heuristics, so the demo never breaks

**Reliable checkout**
- `Buy 1` / `Buy 2` — or the **Buy now** button on a card — resolves against the products actually on screen instead of re-searching
- Budget bounds are really applied: "$50–80" no longer returns a $3,999 machine
- Orders are created with the product's real currency

**UI**
- Festive pine/gold theme: Fraunces + Geist, bento hero, aurora + film grain, product-card glow rings, search skeletons, quick prompts, ⌘K to focus
- Restyled success screen with confetti and a live days-to-Christmas counter

### Judging checklist
1. Type a natural request (or tap a suggestion chip)
2. See the **Gift brief** and ranked products with reasons
3. Click **Buy now** → PayPal sandbox order for that exact item
4. Pay with a sandbox buyer account → confetti on `/success`
