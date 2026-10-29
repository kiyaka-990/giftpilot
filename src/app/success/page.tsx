"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CheckCircle, Gift, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Confetti from "@/components/confetti";
import Snowfall from "@/components/snowfall";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("token") || searchParams.get("orderId");
  const [result, setResult] = useState<{
    status: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!orderId) return;

    // Capture the order
    fetch("/api/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setResult({
            status: "success",
            message: `Order ${data.orderId} completed successfully!`,
          });
        } else {
          setResult({
            status: "error",
            message: data.error || "Payment capture failed.",
          });
        }
      })
      .catch(() => {
        setResult({
          status: "error",
          message: "Network error while confirming payment.",
        });
      });
  }, [orderId]);

  // Missing token renders the error state directly — no effect round-trip.
  const status: "loading" | "success" | "error" = !orderId
    ? "error"
    : (result?.status ?? "loading");
  const message = !orderId
    ? "No order ID found."
    : (result?.message ?? "");

  return (
    <div className="noise relative flex min-h-screen items-center justify-center p-4">
      <Snowfall />
      <Confetti run={status === "success"} />

      <div className="pop glass-strong relative z-10 w-full max-w-md rounded-[2rem] p-8 text-center shadow-[0_40px_90px_-50px_rgba(0,0,0,0.9)]">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-white/6">
              <Loader2 className="h-8 w-8 animate-spin text-gold" />
            </div>
            <h1 className="font-display text-2xl font-semibold">
              Confirming payment…
            </h1>
            <p className="mt-2 text-sm text-sage">
              Please wait a moment while PayPal settles the order.
            </p>
            <div className="skeleton mx-auto mt-6 h-2 w-40 rounded-full" />
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-gradient-to-br from-emerald-400/25 to-emerald-600/10 ring-1 ring-emerald-400/40">
              <CheckCircle className="h-9 w-9 text-emerald-300" />
            </div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-soft">
              🎁 Gift secured
            </div>
            <h1 className="text-gradient font-display text-3xl font-semibold leading-tight">
              Payment successful!
            </h1>
            <p className="mt-2 text-sm text-sage">{message}</p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-xs text-sage">
              <div className="flex items-center justify-between gap-3">
                <span>Order ID</span>
                <span className="truncate font-mono text-cream">
                  {orderId || "—"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span>Payment</span>
                <span className="text-emerald-300">Captured (sandbox)</span>
              </div>
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-sage">
              <ShieldCheck className="h-3.5 w-3.5" />
              Sandbox transaction · no real money was charged
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <Link href="/" className="gold-btn h-11 px-5 text-sm">
                <Gift className="h-4 w-4" />
                Find another gift
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-berry/15 ring-1 ring-berry/40">
              <span className="text-2xl">🎁</span>
            </div>
            <h1 className="font-display text-2xl font-semibold">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-sage">{message}</p>
            <Link
              href="/"
              className="ghost-btn mt-6 inline-flex h-11 px-5 text-sm"
            >
              ← Back to GiftPilot
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-night text-cream flex items-center justify-center">
          Loading…
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
