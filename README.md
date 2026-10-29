# GiftPilot 🎁

**An AI gift-shopping agent that finds the right present and buys it for you — in one conversation.**

Chat: *"Gift for my sister who loves coffee, budget $50–80."* GiftPilot turns that into a search brief, searches **live products across thousands of retailers with Channel3**, ranks them with a reason for each pick, then creates a **PayPal** sandbox order for the exact item you choose. You pay inside PayPal, the order is captured, and the app confirms it. No tabs, no price comparison spreadsheets, no abandoned carts.

> **AI doesn't just recommend — it transacts.** That's agentic commerce.

---

## Live demo

**https://giftpilot-coral.vercel.app/**

> ⬜ *Demo video (YouTube, < 3 min) goes here before submission.*

---

## Why it exists (Potential Impact)

Gift buying is a real, repeated, high-stress problem: you know the person, not the product. Shoppers open a dozen tabs, abandon carts, and still buy the wrong thing. GiftPilot collapses the whole loop — *describe → discover → decide → pay* — into one conversation:

- **For:** last-minute and hard-to-shop-for gift buyers (14%+ of retail spending lands in Nov–Dec).
- **Problem:** product discovery is search-box-shaped, but people think in relationships and budgets.
- **Solution:** an agent that speaks human, searches live inventory, justifies every pick, and completes checkout without leaving the chat.

---

## What it does

1. **Understand** — Claude extracts recipient, interests, occasion and budget from a messy sentence, and shows it back as a visible **Gift brief** (so you can see the agent's reasoning).
2. **Search** — Channel3 queries live retailer catalogs for real, in-stock products.
3. **Rank** — Claude ranks the results and writes a **"Why it fits"** line for each one.
4. **Transact** — `Buy 2` (or the **Buy now** button) creates a real PayPal order for that exact product, in its real currency.
5. **Complete** — you pay in PayPal's sandbox; the order is captured and `/success` confirms it with confetti.

Every step degrades gracefully: with no `ANTHROPIC_API_KEY` the agent falls back to built-in heuristics, so **the demo never dies on stage**.

---

## How it maps to the judging criteria

| Criterion | Evidence in the app |
|---|---|
| **Technological Implementation** | Claude (Anthropic SDK, structured analysis + ranking), Channel3 live search API, PayPal Orders API create → buyer approval → capture. Multi-turn conversation state, budget bounds enforced server-side, currency-correct orders. |
| **Design** | A complete product, not a PoC: festive "Holiday Edition" theme (Fraunces + Geist), bento hero, aurora/glass, skeletons, quick prompts, ⌘K focus, full success/cancel/error states, responsive to phone width, reduced-motion support. |
| **Potential Impact** | Gifting is a large, seasonal, genuinely painful recurring task; the demo solves one real user's stated request end-to-end with live inventory. |
| **Innovation / Idea** | The agent doesn't hand you links — it creates the PayPal order for the specific ranked item it recommended, inside the same conversation. Visible reasoning (gift brief + per-item reasons) keeps it trustworthy. |
| **Presentation** | Deterministic demo path (suggestion chip → ranked picks → Buy now → PayPal → confetti) that runs end-to-end in under two minutes. |

**Sponsor track:** uses **Channel3** for live product search (Best Use of Channel3).

---

## Tech stack

| Layer | Tool |
|---|---|
| AI model | Claude (Anthropic) via `@ai-sdk/anthropic` + `ai` |
| Product search | Channel3 SDK (`@channel3/sdk`) — live retailer catalogs |
| Payments | PayPal Orders API (sandbox): create → approve → capture |
| App | Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · React 19 |
| UI extras | lucide-react, custom confetti/snowfall, no component library |

**Tools used (per submission requirements):** Claude (Anthropic) — intent extraction and product ranking; Channel3 — live product search; PayPal Developer Platform — sandbox order creation and capture.

---

## Getting started (for judges)

```bash
git clone https://github.com/kiyaka-990/giftpilot.git
cd giftpilot
npm install
```

Create `.env.local`:

```bash
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
CHANNEL3_API_KEY=your_channel3_key
ANTHROPIC_API_KEY=your_claude_key      # optional — app falls back to heuristics
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

```bash
npm run dev
# open http://localhost:3000
```

Sandbox credentials: create a free **PayPal Developer** account → [developer.paypal.com](https://developer.paypal.com) → *My Apps & Credentials* → Sandbox.

---

## Two-minute demo script

1. Tap a suggestion chip (e.g. *Stocking stuffers*) or type your own request.
2. Read the **Gift brief** and the ranked picks with **Why it fits**.
3. Click **Buy now** (or type `Buy 1`) → a PayPal sandbox order is created for that item.
4. Pay with a sandbox buyer account → `/success` confirms capture with confetti.

No real money moves anywhere in this flow.

---

## Project structure

```
src/
├── app/
│   ├── page.tsx            # conversation UI, hero, product cards, composer
│   ├── success/            # capture + confirmation
│   ├── cancel/             # abandoned checkout state
│   └── api/
│       ├── chat/           # agent endpoint (brief → search → rank)
│       └── capture/        # PayPal order capture
├── components/             # confetti, snowfall
└── lib/
    ├── agent.ts            # orchestration: buy intent, brief, search, ranking
    ├── llm.ts              # Claude analysis + ranking (graceful fallback)
    ├── channel3.ts         # live product search
    ├── paypal.ts           # OAuth, create order, capture order
    └── money.ts            # currency-aware price formatting
```

---

## Built for

**PayPal AI Hackathon 2026** — paypalaihackathon.devpost.com

## License

[MIT](LICENSE)
