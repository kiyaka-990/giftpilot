"use client";

import {
  useState,
  useRef,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  Send,
  Gift,
  ExternalLink,
  Snowflake,
  ShoppingBag,
  ShieldCheck,
  Search,
  Sparkles,
} from "lucide-react";
import Snowfall from "@/components/snowfall";
import { formatPrice } from "@/lib/money";

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

const SUGGESTIONS = [
  {
    emoji: "☕",
    title: "For the coffee lover",
    text: "Gift for my sister who loves coffee, budget $50-80",
  },
  {
    emoji: "🎄",
    title: "Stocking stuffers",
    text: "Stocking stuffer gifts for a coworker under $30",
  },
  {
    emoji: "🔥",
    title: "For the grill master",
    text: "Gift for dad who loves grilling, budget $60-100",
  },
  {
    emoji: "📚",
    title: "Cozy & bookish",
    text: "Cozy gift for my wife who loves reading, under $70",
  },
];

/** Always-visible quick prompts docked above the composer. */
const QUICK = [
  {
    emoji: "🧦",
    label: "Stocking stuffers",
    text: "Stocking stuffer gifts for a coworker under $30",
  },
  {
    emoji: "🎅",
    label: "Secret Santa",
    text: "Secret Santa gift for a coworker under $25",
  },
  {
    emoji: "⏰",
    label: "Last-minute",
    text: "Last-minute gift for my brother who loves cooking, under $60",
  },
];

const STAGES = [
  "Reading your message…",
  "Searching Channel3 for live products…",
  "Ranking the best matches…",
  "Almost there…",
];

const WELCOME =
  "Hi! I’m GiftPilot 🎁\n\nTell me who the gift is for, the occasion, their interests, and your budget. I’ll find real products and let you check out with PayPal.";

/** Days until Dec 25 (this year, or next if we're past it). */
function daysUntilChristmas(): number {
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), 11, 25);
  const target =
    now.getTime() > thisYear.getTime()
      ? new Date(now.getFullYear() + 1, 11, 25)
      : thisYear;
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86_400_000));
}

const subscribeToClock = () => () => {};
const noClockOnServer = () => null;

/** Render **bold** and line breaks from the agent without a markdown dependency. */
function RichText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) =>
        line.trim() === "" ? (
          <div key={i} className="h-2" />
        ) : (
          <p key={i}>
            {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
              part.startsWith("**") && part.endsWith("**") ? (
                <strong key={j} className="font-semibold text-gold-soft">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </p>
        )
      )}
    </div>
  );
}

function ProductCard({
  product,
  index,
  onBuy,
}: {
  product: Product;
  index: number;
  onBuy: () => void;
}) {
  return (
    <div className="glass glow-ring group rounded-3xl p-3 transition duration-300 hover:-translate-y-1.5 hover:border-gold/45 hover:shadow-[0_30px_60px_-34px_rgba(233,185,73,0.95)]">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br from-white/8 to-white/2">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-3xl">🎁</div>
        )}
        <span className="absolute left-2 top-2 rounded-lg bg-night/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-gold-soft backdrop-blur">
          #{index + 1}
        </span>
        {product.retailer && (
          <span className="absolute right-2 top-2 max-w-[60%] truncate rounded-lg bg-night/80 px-2 py-0.5 text-[10px] font-medium text-cream/80 backdrop-blur">
            {product.retailer}
          </span>
        )}
      </div>

      <div className="mt-3 px-0.5">
        <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-cream">
          {product.title}
        </h4>
        <div className="mt-1.5 flex items-baseline justify-between gap-2">
          <span className="font-display text-lg font-semibold text-gold">
            {formatPrice(product.price, product.currency)}
          </span>
          {product.brand && (
            <span className="truncate text-[11px] text-sage">{product.brand}</span>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={onBuy}
            className="gold-btn h-9 flex-1 text-xs"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            Buy now
          </button>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ghost-btn h-9 px-3 text-xs"
          >
            View
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

/** Small bento tile used in the hero grid. */
function Tile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-3xl p-4 transition hover:border-gold/40">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="eyebrow">{label}</p>
        <p className="truncate text-sm font-semibold text-cream">{value}</p>
      </div>
    </div>
  );
}

/** Shown while the agent is searching so the layout never jumps. */
function SkeletonCard() {
  return (
    <div className="glass rounded-3xl p-3">
      <div className="skeleton aspect-[16/10] rounded-2xl" />
      <div className="skeleton mt-3 h-3.5 w-4/5 rounded-full" />
      <div className="skeleton mt-2 h-4 w-1/3 rounded-full" />
      <div className="mt-3 flex gap-2">
        <div className="skeleton h-9 flex-1 rounded-xl" />
        <div className="skeleton h-9 w-16 rounded-xl" />
      </div>
    </div>
  );
}

function Avatar({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`${
        small ? "h-8 w-8 rounded-xl" : "h-9 w-9 rounded-2xl"
      } hidden shrink-0 place-items-center bg-gradient-to-br from-berry to-berry-deep shadow-[0_10px_24px_-12px_rgba(215,38,61,1)] sm:grid`}
    >
      <Gift className="h-4 w-4 text-gold-soft" />
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Read the clock on the client only — prerenders must stay deterministic.
  const daysToChristmas = useSyncExternalStore(
    subscribeToClock,
    daysUntilChristmas,
    noClockOnServer
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(
      () => setStage((s) => Math.min(s + 1, STAGES.length - 1)),
      1500
    );
    return () => clearInterval(id);
  }, [loading]);

  // ⌘K / Ctrl+K jumps straight to the composer, ChatGPT-style.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  async function sendMessage(preset?: string) {
    const text = (preset ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setStage(0);
    setLoading(true);

    // Pass the products the shopper is looking at so "Buy 2" resolves
    // against real conversation state instead of a fresh, possibly different,
    // search result.
    const recentProducts = [...history]
      .reverse().find(
        (m) => m.role === "assistant" && m.products && m.products.length > 0
      )?.products ?? [];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          products: recentProducts,
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
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const showHero = messages.length <= 1;

  return (
    <div className="noise relative min-h-screen">
      <div className="aurora-blob -left-[14%] -top-[20%] h-[460px] w-[460px] bg-berry/25" />
      <div className="aurora-blob aurora-blob-b -right-[10%] top-[8%] h-[400px] w-[400px] bg-gold/18" />
      <Snowfall />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* ---------------- Header ---------------- */}
        <header className="glass-strong sticky top-0 z-30 border-x-0 border-t-0">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent" />
          <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-3">
            <div className="halo grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-berry to-berry-deep shadow-[0_12px_28px_-12px_rgba(215,38,61,1)]">
              <Gift className="h-5 w-5 text-gold-soft" />
            </div>
            <div className="min-w-0 leading-tight">
              <h1 className="font-display text-lg font-semibold tracking-tight">
                GiftPilot
              </h1>
              <p className="truncate text-[11px] text-sage">
                Agentic gifting · PayPal × Channel3
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {daysToChristmas !== null && (
                <span className="pill hidden sm:inline-flex">
                  🎄 {daysToChristmas} days to Christmas
                </span>
              )}
              <span className="pill">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Sandbox
              </span>
            </div>
          </div>
        </header>

        {/* ---------------- Conversation ---------------- */}
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-44 pt-7">
          {showHero && (
            <section className="mb-10">
              <div className="rise inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gold-soft">
                <Snowflake className="h-3.5 w-3.5" />
                Holiday edition
              </div>

              <h2 className="text-gradient rise rise-2 mt-5 font-display text-[2.6rem] font-semibold leading-[0.98] tracking-[-0.03em] sm:text-[4rem]">
                Find a gift they&apos;ll actually love.
              </h2>

              <p className="rise rise-3 text-pretty mt-5 max-w-lg text-[15px] leading-relaxed text-sage">
                Describe the person, the occasion and your budget — GiftPilot
                searches live products with Channel3, ranks them for fit and
                checks out with PayPal, all in one conversation.
              </p>

              <div className="rise rise-4 mt-8 grid gap-3 sm:grid-cols-3">
                <div className="glass rounded-[1.75rem] p-5 sm:col-span-2">
                  <p className="eyebrow">Start here</p>
                  <p className="mt-1.5 font-display text-xl font-semibold text-cream">
                    Who are we buying for?
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.title}
                        type="button"
                        onClick={() => sendMessage(s.text)}
                        disabled={loading}
                        className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3.5 py-2 text-xs font-medium text-cream transition hover:border-gold/50 hover:bg-gold/10 disabled:opacity-50"
                      >
                        <span className="text-sm transition duration-200 group-hover:scale-125">
                          {s.emoji}
                        </span>
                        {s.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3">
                  <Tile
                    label="Live search"
                    value="Channel3 catalog"
                    icon={<Search className="h-4 w-4" />}
                  />
                  <Tile
                    label="Ranked for fit"
                    value="Why it fits, per pick"
                    icon={<Sparkles className="h-4 w-4" />}
                  />
                  <Tile
                    label="Checkout"
                    value="PayPal sandbox"
                    icon={<ShieldCheck className="h-4 w-4" />}
                  />
                </div>
              </div>
            </section>
          )}

          <div className="space-y-6">
            {messages.map((m, i) => {
              const isUser = m.role === "user";
              return (
                <article
                  key={i}
                  className={`rise flex gap-3 ${
                    isUser ? "flex-row-reverse" : ""
                  }`}
                >
                  {!isUser && <Avatar />}

                  <div
                    className={`min-w-0 ${
                      isUser ? "max-w-[85%]" : "flex-1 sm:min-w-0"
                    }`}
                  >
                    <div
                      className={`px-4 py-3 text-sm ${
                        isUser
                          ? "rounded-3xl rounded-tr-lg bg-gradient-to-br from-berry to-berry-deep text-white shadow-[0_18px_36px_-22px_rgba(215,38,61,1)]"
                          : "glass rounded-3xl rounded-tl-lg text-cream/95"
                      }`}
                    >
                      <RichText text={m.content} />
                    </div>

                    {m.products && m.products.length > 0 && (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {m.products.map((p, idx) => (
                          <ProductCard
                            key={`${i}-${idx}`}
                            product={p}
                            index={idx}
                            onBuy={() => sendMessage(`Buy ${idx + 1}`)}
                          />
                        ))}
                      </div>
                    )}

                    {m.approveUrl && (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <a
                          href={m.approveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-2xl bg-paypal px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_-20px_rgba(0,112,186,1)] transition hover:-translate-y-0.5 hover:bg-[#005ea6]"
                        >
                          Pay with PayPal
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <span className="text-[11px] text-sage">
                          Sandbox checkout
                          {m.orderId ? ` · order ${m.orderId}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}

            {loading && (
              <>
                <div className="rise flex gap-3">
                  <Avatar />
                  <div className="glass flex items-center gap-3 rounded-3xl rounded-tl-lg px-4 py-3">
                    <span className="flex items-end gap-1">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="dot h-1.5 w-1.5 rounded-full bg-gold"
                          style={{ animationDelay: `${d * 0.18}s` }}
                        />
                      ))}
                    </span>
                    <span className="text-sm text-sage">{STAGES[stage]}</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              </>
            )}

            <div ref={bottomRef} />
          </div>
        </main>

        {/* ---------------- Composer ---------------- */}
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-night/75 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-3">
            <div className="hide-scrollbar mb-2.5 flex gap-2 overflow-x-auto pb-0.5">
              {QUICK.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => sendMessage(q.text)}
                  disabled={loading}
                  className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-sage transition hover:-translate-y-0.5 hover:border-gold/45 hover:bg-gold/10 hover:text-cream disabled:opacity-50"
                >
                  {q.emoji} {q.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2 rounded-[1.5rem] border border-white/12 bg-white/6 p-1.5 pl-4 transition focus-within:border-gold/55 focus-within:shadow-[0_0_0_4px_rgba(233,185,73,0.12)]"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. Gift for my sister who loves coffee, budget $50-80"
                aria-label="Describe the gift you are looking for"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-cream placeholder:text-sage/70 focus:outline-none"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Send message"
                className="gold-btn h-10 w-10 shrink-0 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-sage">
              <span className="font-mono">
                ⏎ send · ⌘K focus · no real money is charged
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                PayPal sandbox · Channel3 live search
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
