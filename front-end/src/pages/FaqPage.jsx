import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ArrowRight } from "../components/icons";

const FAQS = [
  {
    cat: "General",
    items: [
      { q: "What is Q4?",                         a: "Q4 is a capital-weighted consensus market on Quai Network. Your economic conviction — the amount you commit — determines the market percentages, not headcount." },
      { q: "Is Q4 free to use?",                  a: "Browsing polls is always free. You only need Q4 tokens when you want to stake a position." },
      { q: "Which blockchain is Q4 built on?",    a: "Q4 runs on Quai Network, an EVM-compatible proof-of-work blockchain. Smart contracts handle all settlement on-chain." },
    ],
  },
  {
    cat: "Staking & Positions",
    items: [
      { q: "How much do I need to stake?",    a: "There is a minimum stake per question, currently 1 Q4. There is no maximum." },
      { q: "Can I stake on both sides?",      a: "No. You may only hold a position on one side per market at a time." },
      { q: "What does 'Switch Once' mean?",   a: "You may flip from YES to NO (or vice versa) exactly once per market, as long as at least 5 minutes remain before close." },
      { q: "Can I withdraw before close?",    a: "No. Once staked, tokens are locked until market resolution to ensure economic integrity." },
    ],
  },
  {
    cat: "Rewards",
    items: [
      { q: "How are rewards distributed?", a: "After resolution, the losing pool is distributed proportionally to winning stakers, minus a small protocol fee." },
      { q: "What is the protocol fee?",    a: "The current fee is 2% of the losing pool, visible on every market." },
      { q: "When do I receive rewards?",   a: "Rewards are claimable within minutes of market resolution via your dashboard." },
    ],
  },
  {
    cat: "Security",
    items: [
      { q: "Are smart contracts audited?",     a: "Yes. Our contracts are independently audited. Reports are publicly available." },
      { q: "What happens if an oracle fails?", a: "We use redundant oracles. In rare disputes, the market enters a challenge period before finalising." },
      { q: "Is my wallet ever at risk?",       a: "You interact only with audited smart contracts. We never request custody of private keys." },
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
            Everything you need to know about Q4.
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
