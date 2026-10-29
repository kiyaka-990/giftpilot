import { NextRequest, NextResponse } from "next/server";
import { runGiftAgent } from "@/lib/agent";
import type { ProductOffer } from "@/lib/channel3";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages || [];
    const recentProducts: ProductOffer[] = Array.isArray(body.products)
      ? body.products
      : [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const result = await runGiftAgent(messages, { recentProducts });

    return NextResponse.json({
      role: "assistant",
      content: result.content,
      products: result.products || [],
      orderId: result.orderId,
      approveUrl: result.approveUrl,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
