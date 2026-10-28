"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { CheckCircle, Gift, Loader2 } from "lucide-react";
import Link from "next/link";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("token") || searchParams.get("orderId");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      setMessage("No order ID found.");
      return;
    }

    // Capture the order
    fetch("/api/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage(`Order ${data.orderId} completed successfully!`);
        } else {
          setStatus("error");
          setMessage(data.error || "Payment capture failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error while confirming payment.");
      });
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900">Confirming payment…</h1>
            <p className="text-gray-500 mt-2">Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
            <p className="text-gray-600 mt-2">{message}</p>
            <p className="text-sm text-gray-400 mt-4">
              This was a sandbox transaction. No real money was charged.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition"
            >
              <Gift className="w-4 h-4" />
              Find another gift
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-xl font-bold text-red-600">Something went wrong</h1>
            <p className="text-gray-600 mt-2">{message}</p>
            <Link
              href="/"
              className="mt-6 inline-block text-indigo-600 hover:underline"
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  );
}
