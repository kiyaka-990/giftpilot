import { createAnthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";

/**
 * Optional LLM reasoning layer for the gift agent.
 *
 * Everything here degrades gracefully: if ANTHROPIC_API_KEY is missing, the
 * model errors, or the call times out, we return null and the caller falls
 * back to the original regex-based heuristics in agent.ts. The agent never
 * hard-depends on a model being available.
 */

export interface GiftBrief {
  /** Product search query distilled from the conversation. */
  query: string;
  minPrice?: number;
  maxPrice?: number;
  /** Human-readable summary of who we are buying for. */
  brief?: string;
}

export interface RankedPick {
  index: number;
  reason: string;
}

export interface GiftRanking {
  intro?: string;
  picks: RankedPick[];
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";
const TIMEOUT_MS = 12_000;

export function reasoningEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function parseJson<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return null;
  }
}

async function complete(system: string, prompt: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const anthropic = createAnthropic({ apiKey });
    const result = await generateText({
      model: anthropic(MODEL),
      system,
      prompt,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return result.text ?? null;
  } catch (error) {
    console.error("[gift-agent] LLM call failed, using fallback:", error);
    return null;
  }
}

const TRANSCRIPT_MAX = 12;

function transcript(
  messages: { role: string; content: string }[]
): string {
  return messages
    .slice(-TRANSCRIPT_MAX)
    .map((m) => `${m.role === "user" ? "Shopper" : "GiftPilot"}: ${m.content}`)
    .join("\n");
}

/**
 * Turn a messy shopper conversation into a clean search brief.
 */
export async function analyzeGiftIntent(
  messages: { role: string; content: string }[]
): Promise<GiftBrief | null> {
  const text = await complete(
    `You are the reasoning engine of GiftPilot, an AI gift-shopping agent for a PayPal hackathon demo.
Extract a product search brief from the shopper's conversation.

Rules:
- "query" is a 3-8 word product search (no pronouns, no budget, no filler like "gift for").
- Keep interests and hobbies: "sister coffee specialty beans" beats "sister".
- minPrice/maxPrice come from explicit budgets like "$50-80", "under $40", "around 60". Omit them if absent. Numbers only.
- "brief" is one short line describing the recipient, e.g. "Sister · coffee lover · $50–80".
- If the shopper never mentioned a person, set brief to null.

Respond with ONLY raw JSON, no markdown fences:
{"query": string, "minPrice"?: number, "maxPrice"?: number, "brief"?: string|null}`,
    `Conversation:\n${transcript(messages)}`
  );

  if (!text) return null;
  const parsed = parseJson<Partial<GiftBrief>>(text);
  if (!parsed || typeof parsed.query !== "string" || parsed.query.trim().length < 2) {
    return null;
  }

  return {
    query: parsed.query.trim().slice(0, 100),
    minPrice:
      typeof parsed.minPrice === "number" && parsed.minPrice >= 0
        ? parsed.minPrice
        : undefined,
    maxPrice:
      typeof parsed.maxPrice === "number" && parsed.maxPrice > 0
        ? parsed.maxPrice
        : undefined,
    brief: typeof parsed.brief === "string" ? parsed.brief : undefined,
  };
}

/**
 * Rank live search results against the shopper's intent and explain why each
 * one fits — this is the "agentic" reasoning judges get to see.
 */
export async function rankGifts(
  messages: { role: string; content: string }[],
  brief: string | undefined,
  products: { title: string; price: number; brand?: string; retailer?: string; description?: string }[]
): Promise<GiftRanking | null> {
  const catalogue = products
    .map(
      (p, i) =>
        `${i + 1}. ${p.title} | $${p.price.toFixed(2)}${
          p.brand ? ` | ${p.brand}` : ""
        }${p.retailer ? ` | ${p.retailer}` : ""}${
          p.description ? ` | ${p.description}` : ""
        }`
    )
    .join("\n");

  const text = await complete(
    `You are GiftPilot, a sharp gift curator. Given the shopper's conversation and a list of live product results, rank them for fit (not just price) and explain each pick in one warm, specific sentence.

Rules:
- "index" is the 1-based product number from the list.
- "intro" is one friendly sentence referencing who the gift is for. Keep it under 25 words. No emojis.
- "reason" must reference the recipient's stated interests — never generic praise.
- Return every product that is a reasonable fit (usually the top 4-5). Skip clearly unsuitable ones.
- Respond with ONLY raw JSON, no markdown fences:
{"intro": string, "picks": [{"index": number, "reason": string}]}`,
    `Conversation:\n${transcript(messages)}\n${brief ? `Brief: ${brief}\n` : ""}Products:\n${catalogue}`
  );

  if (!text) return null;
  const parsed = parseJson<{ intro?: string; picks?: RankedPick[] }>(text);
  if (!parsed || !Array.isArray(parsed.picks)) return null;

  const picks = parsed.picks.filter(
    (p) =>
      typeof p?.index === "number" &&
      p.index >= 1 &&
      p.index <= products.length &&
      typeof p?.reason === "string" &&
      p.reason.trim().length > 0
  );

  if (picks.length === 0) return null;

  return {
    intro: typeof parsed.intro === "string" ? parsed.intro : undefined,
    picks: picks.map((p) => ({
      index: p.index,
      reason: p.reason.trim().slice(0, 180),
    })),
  };
}
