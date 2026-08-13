import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, TrendingUp, TrendingDown, ArrowRight } from "../components/icons";

const CATEGORIES = ["All", "Politics", "Sports", "Finance", "Technology", "Science", "Culture"];

const QUESTIONS = [
  { id: 1, cat: "Politics",   q: "Will the US hold presidential elections in 2024?",          yes: 70, no: 30, pool: "$10,000", closes: "1h 24m",  trending: true  },
  { id: 2, cat: "Finance",    q: "Will Bitcoin exceed $100k before end of 2026?",              yes: 58, no: 42, pool: "$24,500", closes: "3h 10m",  trending: true  },
  { id: 3, cat: "Sports",     q: "Will Real Madrid win the Champions League this season?",     yes: 45, no: 55, pool: "$8,200",  closes: "12h 05m", trending: false },
  { id: 4, cat: "Technology", q: "Will GPT-5 be publicly released before December 2026?",     yes: 62, no: 38, pool: "$15,800", closes: "2d 4h",   trending: true  },
  { id: 5, cat: "Science",    q: "Will a crewed Mars mission launch before 2030?",             yes: 33, no: 67, pool: "$6,400",  closes: "5d 2h",   trending: false },
  { id: 6, cat: "Culture",    q: "Will the same film win both Oscars and Cannes in 2026?",    yes: 22, no: 78, pool: "$3,100",  closes: "7d 12h",  trending: false },
  { id: 7, cat: "Politics",   q: "Will a new global climate treaty be signed in 2026?",       yes: 41, no: 59, pool: "$9,750",  closes: "4d 6h",   trending: false },
  { id: 8, cat: "Finance",    q: "Will inflation drop below 2% in the EU by Q4 2026?",       yes: 55, no: 45, pool: "$11,200", closes: "6d 18h",  trending: true  },
];

function QCard({ question }) {
  const [side, setSide] = useState(null);

  return (
    <div className="flex flex-col overflow-hidden transition-all" style={{
      borderRadius: 16,
      border: "1px solid rgba(255,255,255,0.08)",
      backgroundColor: "#0d0d0d",
      backgroundImage: "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%), radial-gradient(circle, rgba(255,255,255,0.26) 1px, transparent 1px)",
      backgroundSize: "auto, 32px 32px",
      backgroundPosition: "center top, 0 0",
    }}>
      {/* Top info */}
      <div className="flex flex-col flex-1 p-5">
        <div className="mb-3 flex items-center justify-between">
          <span
            className="rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
          >
            {question.cat}
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Clock size={11} strokeWidth={2} />
            {question.closes}
          </span>
        </div>

        <h3 className="flex-1 text-sm font-medium leading-snug" style={{ color: "rgba(255,255,255,0.9)", marginBottom: 14 }}>
          {question.q}
        </h3>

        <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)", marginBottom: 0 }}>
          Pool <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{question.pool}</span>
          {question.trending && (
            <span className="inline-flex items-center gap-1 ml-3" style={{ color: "rgba(34,197,94,0.7)" }}>
              <TrendingUp size={10} strokeWidth={2} /> Trending
            </span>
          )}
        </p>
      </div>

      {/* YES / NO row — flush bottom */}
      <div className="grid grid-cols-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <button
          type="button"
          onClick={() => setSide(side === "YES" ? null : "YES")}
          className={`outcome-yes py-3 text-sm font-bold transition ${side === "YES" ? "active" : ""}`}
          style={{ color: "#22c55e", borderRadius: 0, borderRight: "1px solid rgba(255,255,255,0.07)" }}
        >
          YES
        </button>
        <button
          type="button"
          onClick={() => setSide(side === "NO" ? null : "NO")}
          className={`outcome-no py-3 text-sm font-bold transition ${side === "NO" ? "active" : ""}`}
          style={{ color: "#ef4444", borderRadius: 0 }}
        >
          NO
        </button>
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? QUESTIONS : QUESTIONS.filter((q) => q.cat === active);

  return (
    <div className="hero-bg" style={{ minHeight: "100vh" }}>

      <section className="hero-bg">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em" }}>
            Live Markets
          </p>
          <h1 className="font-bold text-white" style={{ fontSize: "clamp(32px, 4vw, 52px)", letterSpacing: "-0.04em" }}>
            Today's Questions
          </h1>
          <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Pick a side, stake your conviction, earn rewards.
          </p>
        </div>
      </section>

      {/* Category filter */}
      <div
        className="sticky top-16 z-10 border-b"
        style={{ background: "rgba(8,8,8,0.92)", backdropFilter: "blur(16px)", borderColor: "rgba(255,255,255,0.07)" }}
      >
        <div className="mx-auto max-w-7xl overflow-x-auto px-5 sm:px-8">
          <div className="flex gap-2 py-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                className="shrink-0 rounded-lg px-4 py-2 text-sm transition"
                style={active === cat
                  ? { background: "#ffffff", color: "#080808", fontWeight: 600 }
                  : { background: "transparent", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <section>
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((q) => <QCard key={q.id} question={q} />)}
          </div>
          {filtered.length === 0 && (
            <div className="py-20 text-center text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              No questions in this category yet.
            </div>
          )}
        </div>
      </section>

      <section style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-8">
          <h2 className="font-bold text-[#080808]" style={{ fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-0.03em" }}>
            Ready to stake your conviction?
          </h2>
          <p className="mt-3 text-sm" style={{ color: "rgba(0,0,0,0.5)" }}>
            Create a free account to start answering and earning.
          </p>
          <Link to="/signup" className="btn-primary-dark mt-6 inline-flex">
            Create Account
            <ArrowRight size={14} strokeWidth={2.4} />
          </Link>
        </div>
      </section>
    </div>
  );
}
