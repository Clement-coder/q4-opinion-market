import { Link } from "react-router-dom";
import MarketPreview from "../components/MarketPreview";
import FeatureCard   from "../components/FeatureCard";
import ProcessStep   from "../components/ProcessStep";
import {
  ShieldCheck, Globe, CheckCircle2,
  Coins, ArrowLeftRight, Clock, Gift,
  ClipboardList, WalletCards, PieChart,
  ArrowRight,
} from "../components/icons";
import { useAuth } from "../context/AuthContext";

/* ── Data ─────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Coins,
    title: "Economic Conviction",
    text: "We measure the strength of capital behind each side, not the number of people.",
  },
  {
    icon: ArrowLeftRight,
    title: "Switch Once",
    text: "Change your position once if you believe the other side is stronger.",
  },
  {
    icon: Clock,
    title: "Time Matters",
    text: "Switch early or wait — at least 5 minutes must remain before market close.",
  },
  {
    icon: ShieldCheck,
    title: "Fair & Transparent",
    text: "Built on decentralised technology to ensure a level playing field.",
  },
  {
    icon: Gift,
    title: "Earn Rewards",
    text: "Correct predictions earn rewards from the platform and community.",
  },
];

const STEPS = [
  { number: "01", icon: ClipboardList, title: "Answer",           description: "Answer daily polls across multiple categories."                 },
  { number: "02", icon: WalletCards,   title: "Stake",            description: "Commit a small amount of Q4 to the side you believe in."            },
  { number: "03", icon: PieChart,      title: "Conviction Builds",description: "Total capital on each side determines the YES / NO percentages."    },
  { number: "04", icon: ArrowLeftRight,title: "Switch Once",      description: "Change your position once if the other side becomes stronger."      },
  { number: "05", icon: ShieldCheck,   title: "Market Resolves",  description: "When time is up, outcome is verified by trusted sources."           },
  { number: "06", icon: Gift,          title: "Earn Rewards",     description: "Win rewards when you're on the correct side."                       },
];

const TRUST = [
  { icon: ShieldCheck,  title: "Fair & Transparent",  sub: "Built for everyone"   },
  { icon: Globe,        title: "Decentralized",        sub: "On Quai Network"      },
  { icon: CheckCircle2, title: "Secure & Reliable",    sub: "Your funds are safe"  },
];

/* ── Page ─────────────────────────────────────────── */

export default function HomePage() {
  const { user } = useAuth();
  return (
    <>

      {/* ═══════════════════════════════════════════════
          1. HERO
      ═══════════════════════════════════════════════ */}
      <section className="hero-bg relative overflow-hidden" style={{ minHeight: "calc(100vh - 60px)" }}>

        {/* Futuristic decorative layer */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          {/* Horizontal scan lines */}
          {[15, 30, 45, 60, 75].map((y) => (
            <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`}
              stroke="rgba(255,255,255,0.018)" strokeWidth="1" />
          ))}
          {/* Vertical scan lines */}
          {[20, 40, 60, 80].map((x) => (
            <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%"
              stroke="rgba(255,255,255,0.012)" strokeWidth="1" />
          ))}
          {/* Corner accent — top right */}
          <path d="M 100% 0 L calc(100% - 120px) 0 M 100% 0 L 100% 80px"
            stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none" />
          {/* Right-side glow circle behind card */}
          <ellipse cx="75%" cy="50%" rx="320" ry="280"
            fill="rgba(255,255,255,0.012)" />
          <ellipse cx="75%" cy="50%" rx="180" ry="150"
            fill="rgba(255,255,255,0.018)" />
        </svg>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8" style={{ paddingTop: "10vh", paddingBottom: "10vh" }}>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

            {/* Left copy */}
            <div style={{ maxWidth: 520 }}>

              {/* Pill */}
              <div className="pill mb-7">
                <span
                  style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.5)", flexShrink: 0 }}
                />
                Economic Conviction, Not Popularity
              </div>

              {/* Headline */}
              <h1
                className="font-bold text-white"
                style={{
                  fontSize: "clamp(42px, 5.5vw, 68px)",
                  letterSpacing: "-0.045em",
                  lineHeight: 1.01,
                }}
              >
                Answer Today.
                <br />
                <span style={{ color: "rgba(255,255,255,0.35)" }}>
                  Shape Tomorrow.
                </span>
              </h1>

              {/* Body */}
              <p
                className="hero-copy mt-6"
                style={{ color: "rgba(255,255,255,0.55)", maxWidth: 460 }}
              >
                Q4 is a prediction platform where your belief is measured by
                economic conviction, not the number of voters. Answer daily
                polls, stake a small amount, and earn rewards when the
                outcome is right.
              </p>

              {/* Buttons */}
              <div className="mt-8 flex items-center gap-3" style={{ width: "100%", maxWidth: 440 }}>
                <Link
                  to={user ? "/dashboard" : "/signup"}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {user ? "Go to Dashboard" : "Get Started"}
                  <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              </div>

              {/* Trust row */}
              <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
                {TRUST.map(({ icon: Icon, title, sub }, i) => (
                  <div key={title} className="flex items-center gap-4">
                    {i > 0 && (
                      <div
                        className="hidden sm:block"
                        style={{ width: 1, height: 28, background: "rgba(255,255,255,0.1)" }}
                      />
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.48)", fontSize: 13 }}>
                      <Icon size={14} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.65)", letterSpacing: "-0.01em" }}>{title}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)" }}>{sub}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Market card */}
            <div className="flex justify-center lg:justify-end">
              <MarketPreview />
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          2. WHY Q4  (white section)
      ═══════════════════════════════════════════════ */}
      <section id="about" style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">

          {/* Heading */}
          <div className="mb-12 text-center">
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(0,0,0,0.35)", letterSpacing: "0.14em" }}
            >
              Why Q4?
            </p>
            <h2
              className="font-bold text-[#080808]"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.03em" }}
            >
              A better way to predict the future.
            </h2>
          </div>

          {/* 5 cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          3. HOW IT WORKS  (very light gray)
      ═══════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ background: "#f5f5f5" }}>
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">

          {/* Heading */}
          <div className="mb-14 text-center">
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(0,0,0,0.35)", letterSpacing: "0.14em" }}
            >
              How Q4 Works
            </p>
            <h2
              className="font-bold text-[#080808]"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.03em" }}
            >
              Six simple steps.
            </h2>
          </div>

          {/* Steps — horizontal on desktop, 2-col on tablet, 1-col on mobile */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-2">
            {STEPS.map((step, i) => (
              <ProcessStep
                key={step.number}
                {...step}
                isLast={i === STEPS.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          4. CTA  (black card on white background)
      ═══════════════════════════════════════════════ */}
      <section style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-7xl px-5 pb-24 pt-4 sm:px-8">
          <div className="cta-card px-8 py-12 sm:px-12 sm:py-14">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">

              {/* Left text */}
              <div className="max-w-md">
                <h2
                  className="font-bold text-white leading-tight"
                  style={{ fontSize: "clamp(28px, 3.5vw, 44px)", letterSpacing: "-0.03em" }}
                >
                  Your belief has power.
                  <br />
                  Make it count with Q4.
                </h2>
                <p className="mt-4 text-sm leading-6" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Join thousands of people building the future through economic conviction.
                </p>
              </div>

              {/* Right buttons */}
              <div className="flex shrink-0 items-stretch gap-3" style={{ width: 320 }}>
                {user ? (
                  <div className="flex flex-col items-center gap-2" style={{ flex: 1 }}>
                    <Link to="/dashboard" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                      Go to Dashboard
                      <ArrowRight size={14} strokeWidth={2.4} />
                    </Link>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", margin: 0 }}>
                      Welcome back — your conviction awaits.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center gap-2" style={{ flex: 1 }}>
                      <Link to="/signup" className="btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                        Sign Up
                        <ArrowRight size={14} strokeWidth={2.4} />
                      </Link>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", margin: 0 }}>
                        Create your account in seconds.
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-2" style={{ flex: 1 }}>
                      <Link to="/login" className="btn-secondary" style={{ width: "100%", justifyContent: "center" }}>
                        Log In
                      </Link>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", margin: 0 }}>
                        Already have an account?
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
