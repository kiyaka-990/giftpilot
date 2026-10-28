import { searchProducts, ProductOffer } from "./channel3";
import { createOrder } from "./paypal";

export interface AgentResponse {
  content: string;
  products?: ProductOffer[];
  orderId?: string;
  approveUrl?: string;
}

/**
 * Lightweight agent that:
 * 1. Extracts intent + budget from user message
 * 2. Searches Channel3
 * 3. Handles "Buy X" to create PayPal order
 *
 * Later we can replace the reasoning with OpenAI / Claude for smarter replies.
 */
export async function runGiftAgent(
  messages: { role: string; content: string }[]
): Promise<AgentResponse> {
  const lastUser = messages.filter((m) => m.role === "user").pop()?.content || "";

  // Detect buy intent
  const buyMatch = lastUser.match(/(?:buy|get|choose|pick|take|i want|select)\s*#?(\d+)/i);

  // Try to recover previous products from conversation context
  // (In a real app we'd store them in session / DB)
  // For now we re-search if needed.

  // Extract budget
  const budgetMatch = lastUser.match(
    /\$?(\d+)\s*(?:-|to|–)\s*\$?(\d+)|under\s*\$?(\d+)|budget\s*(?:of\s*)?\$?(\d+)|around\s*\$?(\d+)/i
  );

  let minPrice: number | undefined;
  let maxPrice: number | undefined;

  if (budgetMatch) {
    if (budgetMatch[1] && budgetMatch[2]) {
      minPrice = Number(budgetMatch[1]);
      maxPrice = Number(budgetMatch[2]);
    } else if (budgetMatch[3]) {
      maxPrice = Number(budgetMatch[3]);
    } else if (budgetMatch[4] || budgetMatch[5]) {
      const val = Number(budgetMatch[4] || budgetMatch[5]);
      minPrice = Math.max(0, val - 20);
      maxPrice = val + 20;
    }
  }

  // Clean search query
  let searchQuery = lastUser
    .replace(/\$?\d+\s*(?:-|to|–)\s*\$?\d+/gi, "")
    .replace(/under\s*\$?\d+/gi, "")
    .replace(/budget\s*(?:of\s*)?\$?\d+/gi, "")
    .replace(/around\s*\$?\d+/gi, "")
    .replace(/(?:buy|get|choose|pick|take|i want|select)\s*#?\d+/gi, "")
    .replace(/gift for|birthday|present for|looking for/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 100);

  if (!searchQuery || searchQuery.length < 3) {
    searchQuery = "thoughtful gift ideas";
  }

  const products = await searchProducts(searchQuery, {
    minPrice,
    maxPrice,
    limit: 6,
  });

  // Handle "Buy X"
  if (buyMatch && products.length > 0) {
    const idx = Number(buyMatch[1]) - 1;
    if (idx >= 0 && idx < products.length) {
      const chosen = products[idx];

      try {
        const order = await createOrder({
          amount: chosen.price.toFixed(2),
          description: chosen.title,
          productUrl: chosen.url,
        });

        const approveUrl = order.links?.find((l: any) => l.rel === "approve")?.href;

        return {
          content: `Excellent choice! 🎁\n\n**${chosen.title}**\nPrice: $${chosen.price.toFixed(2)}\n\nI've created a secure PayPal sandbox order for you. Click the button below to complete the payment (use a sandbox buyer account).`,
          products: [chosen],
          orderId: order.id,
          approveUrl,
        };
      } catch (err: any) {
        return {
          content: `I found the perfect gift but ran into an issue creating the PayPal order:\n\n${err.message}\n\nPlease try again in a moment.`,
          products: [chosen],
        };
      }
    }
  }

  // Normal search response
  if (products.length === 0) {
    return {
      content:
        "I couldn't find matching products with those criteria. Try broadening the description or adjusting the budget (e.g. \"gift for coffee lover under $80\").",
    };
  }

  let content = `I found ${products.length} great options for you:\n\n`;

  products.forEach((p, i) => {
    content += `**${i + 1}. ${p.title}**\n`;
    if (p.brand) content += `• Brand: ${p.brand}\n`;
    content += `• Price: $${p.price.toFixed(2)}\n`;
    if (p.retailer) content += `• From: ${p.retailer}\n`;
    content += `\n`;
  });

  content +=
    "Which one would you like? Just reply with **Buy 1**, **Buy 2**, etc. and I’ll create a PayPal checkout for you.";

  return {
    content,
    products,
  };
}
