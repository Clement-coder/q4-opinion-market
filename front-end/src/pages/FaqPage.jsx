import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ArrowRight } from "../components/icons";

const FAQS = [
  {
    cat: "General",
    items: [
      {
        q: "What is Q4 Opinion Market?",
        a: "Q4 is a short-term prediction market platform. Users predict the outcome of real-world events that can be verified within 24 hours, such as crypto prices, sports results, and weather events.",
      },
      {
        q: "How is Q4 different from other prediction markets?",
        a: "Most prediction markets focus on long-term questions that take weeks or months to resolve. Q4 focuses exclusively on near-term, verifiable outcomes — a market opens today, closes at the deadline, and resolves automatically the same day.",
      },
      {
        q: "Is Q4 free to use?",
        a: "Browsing markets is always free. You only need to commit a position when you want to predict YES or NO on a market.",
      },
    ],
  },
  {
    cat: "Predicting",
    items: [
      {
        q: "How do I make a prediction?",
        a: "Browse the active markets, pick a question you have a view on, and choose YES or NO. Your position is recorded and locked until the market resolves.",
      },
      {
        q: "Can I change my prediction?",
        a: "Once you commit a position, it is locked until market resolution. This ensures the integrity of the market and the pool.",
      },
      {
        q: "What types of questions does Q4 use?",
        a: "Q4 covers four main categories: Crypto (e.g., Will Bitcoin be above $118,000 at 11:59 PM?), Sports (e.g., Will Arsenal score in the first half?), Weather (e.g., Will it rain in Abuja before 8 PM?), and Stocks (e.g., Will Apple stock close higher today?).",
      },
    ],
  },
  {
    cat: "Resolution",
    items: [
      {
        q: "How does Q4 determine the correct answer?",
        a: "Q4 uses external data sources (oracles) to verify outcomes at the deadline. For example, a crypto price market checks the agreed BTC/USD price feed at the specified time. The result is determined automatically — no admin decides the outcome.",
      },
      {
        q: "What happens when a market reaches its deadline?",
        a: "The system fetches the real-world result from the relevant data source, compares it against the question condition, and resolves the market as YES or NO. User positions are then settled automatically.",
      },
      {
        q: "What if the data source is unavailable at resolution time?",
        a: "Q4 uses reliable, redundant data sources. In the rare event a source is unavailable, the market enters a short holding period until the result can be confirmed.",
      },
    ],
  },
  {
    cat: "Rewards",
    items: [
      {
        q: "How are rewards distributed?",
        a: "After resolution, the losing pool is distributed proportionally to the winning side, minus a small platform fee. The more you committed to the correct side, the larger your share of the rewards.",
      },
      {
        q: "When do I receive my rewards?",
        a: "Rewards are claimable from your dashboard within minutes of market resolution.",
      },
      {
        q: "What is the platform fee?",
        a: "A small percentage is deducted from the losing pool before distribution. The exact fee is shown on every market before you predict.",
      },
    ],
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }} className="last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium transition"
        style={{ color: open ? "#080808" : "rgba(0,0,0,0.7)" }}
      >
        {q}
        <ChevronRight
          size={15}
          strokeWidth={2}
          className="shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(90deg)" : "none", color: "rgba(0,0,0,0.3)" }}
        />
      </button>
      {open && (
        <p className="pb-4 text-sm leading-6" style={{ color: "rgba(0,0,0,0.5)" }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function FaqPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#080808" }}>

      {/* Hero */}
      <section className="hero-bg">
        <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em" }}>FAQ</p>
          <h1 className="font-bold text-white" style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.04em" }}>
            Common Questions
          </h1>
          <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Everything you need to know about Q4 Opinion Market.
          </p>
        </div>
      </section>

      {/* Accordion sections */}
      {FAQS.map(({ cat, items }, i) => (
        <section key={cat} style={{ background: i % 2 === 0 ? "#ffffff" : "#f5f5f5" }}>
          <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)", letterSpacing: "0.14em" }}>
              {cat}
            </h2>
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#ffffff" }}>
              <div className="px-6">
                {items.map(({ q, a }) => <FaqItem key={q} q={q} a={a} />)}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-2xl px-5 py-16 text-center sm:px-8">
          <h2 className="font-bold text-[#080808]" style={{ fontSize: "clamp(22px, 3vw, 34px)", letterSpacing: "-0.03em" }}>
            Still have questions?
          </h2>
          <p className="mt-3 text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
            Reach out — we typically respond within 24 hours.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link to="/signup" className="btn-primary-dark">
              Get Started
              <ArrowRight size={14} strokeWidth={2.4} />
            </Link>
            <a href="mailto:hello@q4.app" className="btn-secondary-dark">
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
