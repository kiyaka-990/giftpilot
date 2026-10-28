const PAYPAL_API_BASE =
  process.env.PAYPAL_ENVIRONMENT === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal auth failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

export async function createOrder(params: {
  amount: string;
  currency?: string;
  description: string;
  productUrl?: string;
}) {
  const accessToken = await getAccessToken();

  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: params.currency || "USD",
            value: params.amount,
          },
          description: params.description.slice(0, 127),
          ...(params.productUrl
            ? {
                custom_id: params.productUrl.slice(0, 127),
              }
            : {}),
        },
      ],
      application_context: {
        brand_name: "GiftPilot",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/cancel`,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create order failed: ${res.status} ${text}`);
  }

  return res.json();
}

export async function captureOrder(orderId: string) {
  const accessToken = await getAccessToken();

  const res = await fetch(
    `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Capture failed: ${res.status} ${text}`);
  }

  return res.json();
}
