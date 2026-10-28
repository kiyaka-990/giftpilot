import { NextRequest, NextResponse } from "next/server";
import { captureOrder } from "@/lib/paypal";

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const result = await captureOrder(orderId);

    return NextResponse.json({
      success: true,
      orderId: result.id,
      status: result.status,
      details: result,
    });
  } catch (error: any) {
    console.error("Capture error:", error);
    return NextResponse.json(
      { error: error.message || "Capture failed" },
      { status: 500 }
    );
  }
}
