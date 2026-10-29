import { searchProducts, ProductOffer } from "./channel3";
import { createOrder } from "./paypal";
import { analyzeGiftIntent, rankGifts, reasoningEnabled } from "./llm";
import { formatPrice } from "./money";

export interface AgentResponse {
  content: string;
  products?: ProductOffer[];
  orderId?: string;
  approveUrl?: string;
}

export interface AgentOptions {
  /**
   * Products from the most recent assistant message. Lets "Buy 2" resolve
   * against what the shopper is actually looking at instead of re-searching
   * and hoping the ranking is identical.
   */
  recentProducts?: ProductOffer[];
}

const BUY_RE = /(?:buy|get|choose|pick|take|i want|select)\s*#?(\d+)/i;

/** Heuristic budget extraction — still used when no LLM key is configured. */
export function extractBudget(text: string): {
  minPrice?: number;
  maxPrice?: number;
} {
  const match = text.match(
    /\$?(\d+)\s*(?:-|to|–)\s*\$?(\d+)|under\s*\$?(\d+)|budget\s*(?:of\s*)?\$?(\d+)|around\s*\$?(\d+)/i
  );

  if (!match) return {};

  if (match[1] && match[2]) {
    return { minPrice: Number(match[1]), maxPrice: Number(match[2]) };
  }
  if (match[3]) {
    return { maxPrice: Number(match[3]) };
  }
  const around = Number(match[4] || match[5]);
  if (around) {
    return { minPrice: Math.max(0, around - 20), maxPrice: around + 20 };
  }
  return {};
}

/** Strip budget / buy phrasing so Channel3 gets a clean product query. */
export function buildSearchQuery(text: string): string {
  const query = text
    .replace(/\$?\d+\s*(?:-|to|–)\s*\$?\d+/gi, "")
    .replace(/under\s*\$?\d+/gi, "")
    .replace(/budget\s*(?:of\s*)?\$?\d+/gi, "")
    .replace(/around\s*\$?\d+/gi, "")
    .replace(BUY_RE, "")
    .replace(/gift for|birthday|present for|looking for/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);

  return query.length >= 3 ? query : "thoughtful gift ideas";
}

async function placeOrder(chosen: ProductOffer): Promise<AgentResponse> {
  try {
    const order = await createOrder({
      amount: chosen.price.toFixed(2),
      currency: chosen.currency,
      description: chosen.title,
      productUrl: chosen.url,
    });

    const approveUrl = order.links?.find(
      (l: { rel?: string; href?: string }) => l.rel === "approve"
    )?.href;

    return {
      content: `Excellent choice! 🎁\n\n**${chosen.title}**\nPrice: ${formatPrice(
        chosen.price,
        chosen.currency
      )}\n\nI've created a secure PayPal sandbox order for you. Click the button below to complete the payment (use a sandbox buyer account).`,
      products: [chosen],
      orderId: order.id,
      approveUrl,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: `I found the perfect gift but ran into an issue creating the PayPal order:\n\n${message}\n\nPlease try again in a moment.`,
      products: [chosen],
    };
  }
}

/**
 * Gift agent:
 * 1. Resolves "Buy X" against the products the shopper is looking at
 * 2. Builds a search brief (LLM when ANTHROPIC_API_KEY is set, regex otherwise)
 * 3. Searches Channel3 for live products
 * 4. Ranks + explains the picks (LLM) before handing back to the UI
 */
export async function runGiftAgent(
  messages: { role: string; content: string }[],
  options: AgentOptions = {}
): Promise<AgentResponse> {
  const lastUser =
    messages.filter((m) => m.role === "user").pop()?.content || "";
  const recent = options.recentProducts ?? [];

  // ---- Buy intent, resolved against real conversation state ----
  const buyMatch = lastUser.match(BUY_RE);

  if (buyMatch && recent.length > 0) {
    const idx = Number(buyMatch[1]) - 1;
    if (idx >= 0 && idx < recent.length) {
      return placeOrder(recent[idx]);
    }
    return {
      content: `I only have ${recent.length} option${
        recent.length === 1 ? "" : "s"
      } in front of us right now. Reply with **Buy 1**${
        recent.length > 1 ? ` up to **Buy ${recent.length}**` : ""
      }, or ask me to search for something else.`,
      products: recent,
    };
  }

  // ---- Build the search brief ----
  const heuristics = extractBudget(lastUser);
  let minPrice = heuristics.minPrice;
  let maxPrice = heuristics.maxPrice;
  let searchQuery = buildSearchQuery(lastUser);
  let brief: string | undefined;

  if (reasoningEnabled()) {
    const analyzed = await analyzeGiftIntent(messages);
    if (analyzed) {
      searchQuery = analyzed.query;
      minPrice = analyzed.minPrice ?? minPrice;
      maxPrice = analyzed.maxPrice ?? maxPrice;
      brief = analyzed.brief;
    }
  }

  const products = await searchProducts(searchQuery, {
    minPrice,
    maxPrice,
    limit: 6,
  });

  // ---- Buy intent resolved against a fresh search (legacy path) ----
  if (buyMatch && products.length > 0) {
    const idx = Number(buyMatch[1]) - 1;
    if (idx >= 0 && idx < products.length) {
      return placeOrder(products[idx]);
    }
    return {
      content: `I only found ${products.length} option${
        products.length === 1 ? "" : "s"
      } for that search. Reply with **Buy 1**${
        products.length > 1 ? ` up to **Buy ${products.length}**` : ""
      }, or refine the gift description.`,
      products,
    };
  }

  if (products.length === 0) {
    return {
      content:
        "I couldn't find matching products with those criteria. Try broadening the description or adjusting the budget (e.g. \"gift for coffee lover under $80\").",
    };
  }

  // ---- Rank + explain ----
  let intro: string | undefined;
  const reasons = new Map<number, string>();

  if (reasoningEnabled()) {
    const ranking = await rankGifts(messages, brief, products);
    if (ranking) {
      intro = ranking.intro;
      ranking.picks.forEach((p) => reasons.set(p.index - 1, p.reason));
    }
  }

  let content = intro ? `${intro}\n\n` : "";
  if (brief) content += `**Gift brief:** ${brief}\n\n`;

  content += `I found ${products.length} great options for you:\n\n`;

  products.forEach((p, i) => {
    content += `**${i + 1}. ${p.title}**\n`;
    if (p.brand) content += `• Brand: ${p.brand}\n`;
    content += `• Price: ${formatPrice(p.price, p.currency)}\n`;
    if (p.retailer) content += `• From: ${p.retailer}\n`;
    const reason = reasons.get(i);
    if (reason) content += `• Why it fits: ${reason}\n`;
    content += `\n`;
  });

  content +=
    "Which one would you like? Just reply with **Buy 1**, **Buy 2**, etc. — or hit **Buy now** on a card — and I’ll create a PayPal checkout for you.";

  return {
    content,
    products,
  };
}
