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
        limit: options.limit || 8,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Channel3 API error:", res.status, text);
      return [];
    }

    const data = await res.json();

    const products: ProductOffer[] = (data.products || []).map((p: any) => {
      const bestOffer = p.offers?.[0] || {};

      // Price is nested: offers[0].price.price
      const priceObj = bestOffer.price || {};
      const price = Number(priceObj.price) || 0;
      const currency = priceObj.currency || "USD";

      // Image is an object with .url
      const mainImage = p.images?.find((img: any) => img.is_main_image) || p.images?.[0];
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
    return products
      .filter((p) => p.price > 0)
      .slice(0, options.limit || 6);
  } catch (error) {
    console.error("Channel3 search error:", error);
    return [];
  }
}