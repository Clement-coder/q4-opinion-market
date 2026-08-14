import { Link } from "react-router-dom";
import ProcessStep from "../components/ProcessStep";
import {
  ClipboardList, WalletCards, PieChart, ArrowLeftRight,
  ShieldCheck, Gift, CheckCircle2, ArrowRight,
} from "../components/icons";

const STEPS = [
  { number: "01", icon: ClipboardList, title: "Answer",            description: "Browse daily polls across politics, finance, sports, and more." },
  { number: "02", icon: WalletCards,   title: "Stake",             description: "Commit a small amount of Q4 tokens to the side you believe in."      },
  { number: "03", icon: PieChart,      title: "Conviction Builds", description: "Capital on each side determines the live YES / NO percentages."      },
  { number: "04", icon: ArrowLeftRight,title: "Switch Once",       description: "Flip your position once if the other side grows stronger."            },
  { number: "05", icon: ShieldCheck,   title: "Market Resolves",   description: "Smart contracts settle the outcome when the timer expires."           },
  { number: "06", icon: Gift,          title: "Earn Rewards",      description: "Winners receive a proportional share of the opposing pool."           },
];

const RULES = [
  "Each market resolves once the countdown timer expires.",
  "You may only hold a position on one side at a time.",
  "Switching sides is permitted exactly once per market.",
  "Switching is disabled when fewer than 5 minutes remain.",
  "Protocol fee is deducted from the losing pool before distribution.",
  "All smart contract rules are public and auditable on Quai Network.",
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
            Simple. Fair. Powerful.
          </h1>
          <p className="mt-5 text-base leading-7" style={{ color: "rgba(255,255,255,0.45)" }}>
            Six steps from question to reward — every rule is transparent and enforced on-chain.
          </p>
        </div>
      </section>

      {/* Steps — white */}
      <section style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-2">
            {STEPS.map((step, i) => (
              <ProcessStep key={step.number} {...step} isLast={i === STEPS.length - 1} />
            ))}
          </div>
        </div>
      </section>

      {/* Rules — light gray */}
      <section style={{ background: "#f5f5f5" }}>
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
            <Link to="/polls" className="btn-secondary-dark">
              Browse Polls
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
