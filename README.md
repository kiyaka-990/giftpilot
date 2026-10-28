# GiftPilot – AI Gift Shopping Agent

**Built for the PayPal AI Hackathon 2026** ($67,500 prize pool)

An agentic commerce experience:
1. User describes a gift + budget
2. AI searches real products via **Channel3**
3. User picks one
4. Agent creates a real **PayPal sandbox order**
5. User completes payment

This project targets:
- **Best Use of Agentic Commerce** ($5,000)
- **Best Use of Channel3** ($1,500)
- Overall prizes (1st $12k / 2nd $8k / 3rd $5k)

---

## Quick Start (Local)

```bash
# 1. Go into the project
cd giftpilot

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Make sure .env.local exists with your keys:
# PAYPAL_CLIENT_ID=...
# PAYPAL_CLIENT_SECRET=...
# CHANNEL3_API_KEY=...

# 4. Run
npm run dev
```

Open → http://localhost:3000

### Test flow
1. Type: `Gift for my sister who loves coffee, budget $50-80`
2. Agent returns real products
3. Reply: `Buy 2`
4. Click **Pay with PayPal** → use a sandbox buyer account
5. You land on the Success page after payment

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main chat UI
│   ├── success/page.tsx      # After PayPal payment
│   ├── cancel/page.tsx       # If user cancels
│   └── api/
│       ├── chat/route.ts     # Agent endpoint
│       └── capture/route.ts  # Capture order after approval
├── lib/
│   ├── agent.ts              # Core gift agent logic
│   ├── channel3.ts           # Product search
│   └── paypal.ts             # Create + capture orders
```

---

## Environment Variables

Create `.env.local`:

```env
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
CHANNEL3_API_KEY=your_channel3_key
# Optional later:
# OPENAI_API_KEY=sk-...
# NEXT_PUBLIC_BASE_URL=https://your-deployed-url.com
```

---

## Deployment (Render / Vercel)

### Option A – Vercel (easiest)
1. Push the repo to GitHub
2. Import into Vercel
3. Add the environment variables
4. Deploy

### Option B – Render
1. Create a new **Web Service**
2. Connect the repo
3. Build command: `npm install --legacy-peer-deps && npm run build`
4. Start command: `npm start`
5. Add environment variables

After deploy, set `NEXT_PUBLIC_BASE_URL` to your live URL so PayPal return links work correctly.

---

## Demo Video Tips (≤ 3 minutes)

1. Show the problem (hard to find good gifts)
2. Type a natural request
3. Show product cards appearing
4. Say “Buy 1”
5. Click Pay with PayPal and complete sandbox payment
6. Land on Success page

Keep it under 2:45 so judges see the full flow.

---

## Roadmap (optional upgrades)

- [ ] Replace simple keyword agent with OpenAI / Claude for smarter reasoning
- [ ] Store conversation state so “Buy 2” works across messages without re-search
- [ ] Add product images more reliably
- [ ] Multi-currency support
- [ ] Gift wrapping / note feature

---

## License

MIT – built for the PayPal AI Hackathon 2026
