import { Link } from "react-router-dom";
import ProcessStep from "../components/ProcessStep";
import {
  ClipboardList, Globe, Clock, Zap,
  BarChart3, Gift, CheckCircle2, ArrowRight,
} from "../components/icons";

const STEPS = [
  { number: "01", icon: ClipboardList, title: "Generate",  description: "Questions are automatically created from templates combined with live data."        },
  { number: "02", icon: Globe,         title: "Predict",   description: "Browse available markets and choose YES or NO on each question."                    },
  { number: "03", icon: Clock,         title: "Wait",      description: "Each market has a specific deadline. Most markets close within 24 hours."           },
  { number: "04", icon: Zap,           title: "Verify",    description: "When the deadline arrives, the system fetches the result from the data source."     },
  { number: "05", icon: BarChart3,     title: "Resolve",   description: "The market resolves YES or NO based on the verified real-world outcome."            },
  { number: "06", icon: Gift,          title: "Claim",     description: "Correct predictions earn a proportional share of the opposing pool as rewards."     },
];

const RULES = [
  "Each market resolves once the deadline is reached.",
  "Outcomes are determined by verified external data sources, not admin input.",
  "Every question has a single, clearly measurable YES or NO answer.",
  "Markets cover Crypto, Sports, Weather, and Stocks categories.",
  "Resolution is automatic — no manual intervention required.",
  "All market rules and data sources are visible before you predict.",
];

const EXAMPLES = [
  { cat: "Crypto",  q: "Will Bitcoin be above $118,000 at 11:59 PM today?",   source: "BTC/USD price feed"        },
  { cat: "Sports",  q: "Will Arsenal score in the first half?",                source: "Match statistics API"      },
  { cat: "Weather", q: "Will it rain in Abuja before 8 PM today?",             source: "Weather data API"          },
  { cat: "Stocks",  q: "Will Apple stock close higher today?",                  source: "Stock market close price"  },
];

export default function HowItWorksPage() {
  return (
    <div style={{ background: "#080808", minHeight: "100vh" }}>

      {/* Hero */}
      <section className="hero-bg">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 sm:py-28">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em" }}>
            How Q4 Works
          </p>
          <h1 className="font-bold text-white" style={{ fontSize: "clamp(36px, 5vw, 60px)", letterSpacing: "-0.04em", lineHeight: 1.05 }}>
            Predict. Wait. Resolve.
          </h1>
          <p className="mt-5 text-base leading-7" style={{ color: "rgba(255,255,255,0.45)" }}>
            A market opens today, closes at the deadline, and resolves automatically
            when the real-world outcome is verified.
          </p>
        </div>
      </section>

      {/* Steps — white */}
      <section style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)", letterSpacing: "0.14em" }}>The Process</p>
            <h2 className="font-bold text-[#080808]" style={{ fontSize: "clamp(26px, 3.5vw, 40px)", letterSpacing: "-0.03em" }}>
              Six steps from question to reward.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-2">
            {STEPS.map((step, i) => (
              <ProcessStep key={step.number} {...step} isLast={i === STEPS.length - 1} />
            ))}
          </div>
        </div>
      </section>

      {/* Example questions — light gray */}
      <section style={{ background: "#f5f5f5" }}>
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)", letterSpacing: "0.14em" }}>Example Markets</p>
            <h2 className="font-bold text-[#080808]" style={{ fontSize: "clamp(26px, 3.5vw, 40px)", letterSpacing: "-0.03em" }}>
              Real questions. Real data.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {EXAMPLES.map(({ cat, q, source }) => (
              <div
                key={q}
                className="rounded-2xl p-6"
                style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.07)" }}
              >
                <span
                  className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold"
                  style={{ background: "rgba(0,0,0,0.05)", color: "rgba(0,0,0,0.5)", border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  {cat}
                </span>
                <p className="market-question mb-4 text-sm leading-snug text-[#080808]">"{q}"</p>
                <p className="text-xs" style={{ color: "rgba(0,0,0,0.4)" }}>
                  Resolved by: <span style={{ fontWeight: 600 }}>{source}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rules — white */}
      <section style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)", letterSpacing: "0.14em" }}>
            Platform Rules
          </p>
          <h2 className="mb-8 font-bold text-[#080808]" style={{ fontSize: "clamp(24px, 3vw, 36px)", letterSpacing: "-0.03em" }}>
            Clear rules for everyone.
          </h2>
          <ul className="flex flex-col gap-4">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-3">
                <CheckCircle2 size={16} strokeWidth={1.8} style={{ color: "rgba(0,0,0,0.4)", marginTop: 2, flexShrink: 0 }} />
                <span className="text-sm leading-6" style={{ color: "rgba(0,0,0,0.6)" }}>{rule}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex gap-3">
            <Link to="/signup" className="btn-primary-dark">
              Get Started
              <ArrowRight size={14} strokeWidth={2.4} />
            </Link>
            <Link to="/markets" className="btn-secondary-dark">
              Browse Markets
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
