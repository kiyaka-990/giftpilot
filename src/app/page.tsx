"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Gift, Loader2, ExternalLink } from "lucide-react";

interface Product {
  title: string;
  price: number;
  currency: string;
  image?: string;
  url: string;
  brand?: string;
  retailer?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  products?: Product[];
  orderId?: string;
  approveUrl?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I’m GiftPilot 🎁\n\nTell me who the gift is for, the occasion, their interests, and your budget. I’ll find real products and let you check out with PayPal.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Error: ${data.error}` },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.content,
            products: data.products,
            orderId: data.orderId,
            approveUrl: data.approveUrl,
          },
        ]);
      }
    }  catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900">GiftPilot</h1>
            <p className="text-xs text-gray-500">
              AI Gift Agent · Powered by PayPal + Channel3
            </p>
          </div>
        </div>
      </header>

      {/* Chat */}
      <main className="max-w-3xl mx-auto px-4 py-6 pb-32">
        <div className="space-y-6">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-white border shadow-sm text-gray-800"
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {m.content}
                </div>

                {/* Product cards */}
                {m.products && m.products.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {m.products.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex gap-3 p-3 rounded-xl bg-gray-50 border"
                      >
                        {p.image && (
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm line-clamp-2">
                            {p.title}
                          </p>
                          <p className="text-indigo-600 font-semibold mt-1">
                            ${p.price.toFixed(2)}
                          </p>
                          {p.brand && (
                            <p className="text-xs text-gray-500">{p.brand}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* PayPal approve button */}
                {m.approveUrl && (
                  <a
                    href={m.approveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 bg-[#0070ba] hover:bg-[#005ea6] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
                  >
                    Pay with PayPal
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border shadow-sm rounded-2xl px-4 py-3 flex items-center gap-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Finding gifts…</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            <input
               type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="e.g. Gift for my sister who loves coffee, budget $50-80"
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl px-4 py-3 transition"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">
            Sandbox mode · No real money is charged
          </p>
        </div>
      </div>
    </div>
  );
}
