import { NextRequest, NextResponse } from "next/server";
import { runGiftAgent } from "@/lib/agent";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = body.messages || [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const result = await runGiftAgent(messages);

    return NextResponse.json({
      role: "assistant",
      content: result.content,
      products: result.products || [],
      orderId: result.orderId,
      approveUrl: result.approveUrl,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
