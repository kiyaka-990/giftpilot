export interface ProductOffer {
  title: string;
  price: number;
  currency: string;
  image?: string;
  url: string;
  brand?: string;
  retailer?: string;
  description?: string;
}

/** Loose shapes of the Channel3 search payload (only the fields we read). */
interface RawPrice {
  price?: string | number;
  currency?: string;
}

interface RawOffer {
  price?: RawPrice;
  url?: string;
  domain?: string;
}

interface RawImage {
  url?: string;
  cleaned_url?: string;
  is_main_image?: boolean;
}

interface RawProduct {
  title?: string;
  description?: string;
  offers?: RawOffer[];
  images?: RawImage[];
  brands?: { name?: string }[];
}

export async function searchProducts(
  query: string,
  options: {
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
  } = {}
): Promise<ProductOffer[]> {
  const apiKey = process.env.CHANNEL3_API_KEY;

  if (!apiKey) {
    console.error("CHANNEL3_API_KEY is missing");
    return [];
  }

  try {
    const res = await fetch("https://api.trychannel3.com/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query: query || "gift",
        // Budget filtering happens client-side, so ask for extra candidates
        // whenever a budget is in play.
        limit:
          typeof options.minPrice === "number" ||
          typeof options.maxPrice === "number"
            ? (options.limit || 6) * 2
            : options.limit || 8,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Channel3 API error:", res.status, text);
      return [];
    }

    const data = await res.json();

    const products: ProductOffer[] = (
      (data.products as RawProduct[]) || []
    ).map((p) => {
      const bestOffer = p.offers?.[0] || {};

      // Price is nested: offers[0].price.price
      const priceObj = bestOffer.price || {};
      const price = Number(priceObj.price) || 0;
      const currency = priceObj.currency || "USD";

      // Image is an object with .url
      const mainImage =
        p.images?.find((img) => img.is_main_image) || p.images?.[0];
      const image = mainImage?.url || mainImage?.cleaned_url;

      return {
        title: p.title || "Unknown product",
        price,
        currency,
        image,
        url: bestOffer.url || "#",
        brand: p.brands?.[0]?.name,
        retailer: bestOffer.domain,
        description: (p.description || "").slice(0, 200),
      };
    });

    // Only return products that have a real price > 0
    const valid = products.filter((p) => p.price > 0);

    // Apply the shopper's budget. Channel3 is a keyword search, so we filter
    // here: prefer exact in-budget matches, and if none survive, fall back to
    // the closest prices instead of returning an empty list.
    const { minPrice, maxPrice } = options;
    let selected = valid;

    if (typeof minPrice === "number" || typeof maxPrice === "number") {
      const inBudget = valid.filter(
        (p) =>
          (typeof minPrice !== "number" || p.price >= minPrice) &&
          (typeof maxPrice !== "number" || p.price <= maxPrice)
      );

      if (inBudget.length > 0) {
        selected = inBudget;
      } else if (valid.length > 0) {
        const target =
          ((typeof minPrice === "number" ? minPrice : 0) +
            (typeof maxPrice === "number" ? maxPrice : minPrice ?? 0)) /
          2;
        selected = [...valid].sort(
          (a, b) => Math.abs(a.price - target) - Math.abs(b.price - target)
        );
      }
    }

    return selected.slice(0, options.limit || 6);
  } catch (error) {
    console.error("Channel3 search error:", error);
    return [];
  }
}