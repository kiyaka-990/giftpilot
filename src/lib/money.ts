const SYMBOLS: Record<string, string> = {
  USD: "$",
  CAD: "C$",
  GBP: "£",
  EUR: "€",
  AUD: "A$",
  NZD: "NZ$",
  JPY: "¥",
  INR: "₹",
};

/** Format a price with the right currency symbol for both server and client. */
export function formatPrice(price: number, currency = "USD"): string {
  const symbol = SYMBOLS[(currency || "USD").toUpperCase()];
  const value = Number.isFinite(price) ? price : 0;
  const decimals = (currency || "USD").toUpperCase() === "JPY" ? 0 : 2;
  const amount = value.toFixed(decimals);
  return symbol ? `${symbol}${amount}` : `${amount} ${currency}`;
}
