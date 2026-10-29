import Link from "next/link";
import { Gift, RotateCcw } from "lucide-react";
import Snowfall from "@/components/snowfall";

export default function CancelPage() {
  return (
    <div className="noise relative flex min-h-screen items-center justify-center p-4">
      <Snowfall />
      <div className="pop glass-strong relative z-10 w-full max-w-md rounded-[2rem] p-8 text-center shadow-[0_40px_90px_-50px_rgba(0,0,0,0.9)]">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-white/6 text-3xl">
          🎄
        </div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-sage">
          Checkout paused
        </div>
        <h1 className="text-gradient font-display text-3xl font-semibold leading-tight">
          Payment cancelled
        </h1>
        <p className="mt-2 text-sm text-sage">
          You cancelled the PayPal payment — no charges were made. Your gift
          ideas are still waiting in the chat.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Link href="/" className="gold-btn h-11 px-5 text-sm">
            <RotateCcw className="h-4 w-4" />
            Try again
          </Link>
          <Link href="/" className="ghost-btn h-11 px-5 text-sm">
            <Gift className="h-4 w-4" />
            Browse more ideas
          </Link>
        </div>
      </div>
    </div>
  );
}
