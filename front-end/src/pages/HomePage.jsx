import { Link } from "react-router-dom";
import MarketPreview from "../components/MarketPreview";
import FeatureCard   from "../components/FeatureCard";
import ProcessStep   from "../components/ProcessStep";
import {
  ShieldCheck, Globe, CheckCircle2,
  Clock, Gift, Zap,
  ClipboardList, BarChart3, ArrowRight,
} from "../components/icons";
import { useAuth } from "../context/AuthContext";

/* ── Data ─────────────────────────────────────────── */

const FEATURES = [
  {
    icon: Clock,
    title: "24-Hour Markets",
    text: "Every market closes within 24 hours. Predict, wait, and know the result the same day.",
  },
  {
    icon: CheckCircle2,
    title: "Real-World Outcomes",
    text: "Questions are based on events that actually happen — crypto prices, sports scores, weather.",
  },
  {
    icon: Zap,
    title: "Live Data Oracles",
    text: "Outcomes are verified automatically using trusted external data sources at the deadline.",
  },
  {
    icon: ShieldCheck,
    title: "Auto-Resolution",
    text: "No manual intervention. The market resolves itself once the data source confirms the result.",
  },
  {
    icon: Gift,
    title: "Earn Rewards",
    text: "Correct predictions earn rewards. The winning side splits the pool from the losing side.",
  },
];

const STEPS = [
  { number: "01", icon: ClipboardList, title: "Generate",  description: "Questions are automatically generated from templates and live data."   },
  { number: "02", icon: Globe,         title: "Predict",   description: "Browse active markets and choose YES or NO on each question."           },
  { number: "03", icon: Clock,         title: "Wait",      description: "Each market has a specific deadline, usually within 24 hours."          },
  { number: "04", icon: Zap,           title: "Verify",    description: "When the deadline arrives, the system checks the agreed data source."   },
  { number: "05", icon: BarChart3,     title: "Resolve",   description: "The market resolves YES or NO based on the verified real-world result."  },
  { number: "06", icon: Gift,          title: "Claim",     description: "Correct predictions earn a share of the opposing pool as rewards."      },
];

const TRUST = [
  { icon: ShieldCheck,  title: "Verified Outcomes",   sub: "Live data oracles"   },
  { icon: Clock,        title: "24-Hour Deadline",     sub: "Fast, clear results" },
  { icon: CheckCircle2, title: "Auto-Resolved",        sub: "No manual input"     },
];

const CATEGORIES = [
  { emoji: "₿",  label: "Crypto",  example: "Will Bitcoin be above $118,000 at 11:59 PM?" },
  { emoji: "⚽", label: "Sports",  example: "Will Arsenal score in the first half?"        },
  { emoji: "🌤️", label: "Weather", example: "Will it rain in Abuja before 8 PM?"           },
  { emoji: "📈", label: "Stocks",  example: "Will Apple stock close higher today?"          },
];

/* ── Page ─────────────────────────────────────────── */

export default function HomePage() {
  const { user } = useAuth();
  return (
    <>

      {/* ═══════════════════════════════════════════════
          1. HERO
      ═══════════════════════════════════════════════ */}
      <section className="hero-bg relative" style={{ minHeight: "calc(100vh - 60px)", overflowX: "hidden" }}>

        {/* Futuristic decorative layer */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          {[15, 30, 45, 60, 75].map((y) => (
            <line key={y} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`}
              stroke="rgba(255,255,255,0.018)" strokeWidth="1" />
          ))}
          {[20, 40, 60, 80].map((x) => (
            <line key={x} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%"
              stroke="rgba(255,255,255,0.012)" strokeWidth="1" />
          ))}
          <ellipse cx="75%" cy="50%" rx="320" ry="280"
            fill="rgba(255,255,255,0.012)" />
          <ellipse cx="75%" cy="50%" rx="180" ry="150"
            fill="rgba(255,255,255,0.018)" />
        </svg>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8" style={{ paddingTop: "8vh", paddingBottom: "8vh" }}>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">

            {/* Left copy */}
            <div style={{ maxWidth: 520, width: "100%" }}>

              {/* Pill */}
              <div className="pill mb-7">
                <span
                  style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.5)", flexShrink: 0 }}
                />
                24-Hour Prediction Markets
              </div>

              {/* Headline */}
              <h1
                className="font-bold text-white"
                style={{
                  fontSize: "clamp(32px, 5.5vw, 68px)",
                  letterSpacing: "-0.04em",
                  lineHeight: 1.04,
                }}
              >
                Predict Today.
                <br />
                <span style={{ color: "rgba(255,255,255,0.35)" }}>
                  Resolved Tonight.
                </span>
              </h1>

              {/* Body */}
              <p
                className="hero-copy mt-6"
                style={{ color: "rgba(255,255,255,0.55)", maxWidth: 460, wordBreak: "break-word" }}
              >
                Q4 is a short-term prediction market where you predict real-world outcomes
                — crypto prices, sports results, weather events, and more.
                Markets open today, close at the deadline, and resolve automatically
                using live data.
              </p>

              {/* Buttons */}
              <div className="mt-8 flex items-center gap-3" style={{ width: "100%" }}>
                <Link
                  to={user ? "/dashboard" : "/signup"}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {user ? "Go to Dashboard" : "Get Started"}
                  <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
                <Link
                  to="/markets"
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  Browse Markets
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
            <div className="flex w-full justify-center lg:justify-end">
              <MarketPreview />
            </div>

          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          2. CATEGORIES
      ═══════════════════════════════════════════════ */}
      <section style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">

          <div className="mb-12 text-center">
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "rgba(0,0,0,0.35)", letterSpacing: "0.14em" }}
            >
              Question Categories
            </p>
            <h2
              className="font-bold text-[#080808]"
              style={{ fontSize: "clamp(28px, 4vw, 44px)", letterSpacing: "-0.03em" }}
            >
              Real events. Clear outcomes.
            </h2>
            <p className="mt-4 text-sm" style={{ color: "rgba(0,0,0,0.5)", maxWidth: 480, margin: "16px auto 0" }}>
              Every question has a measurable answer and a defined resolution time.
              No ambiguity — just YES or NO.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map(({ emoji, label, example }) => (
              <div
                key={label}
                className="feature-card p-6"
                style={{ border: "1px solid rgba(0,0,0,0.07)", borderRadius: 16, background: "#f9f9f9" }}
              >
                <div className="mb-4 text-3xl">{emoji}</div>
                <h3 className="mb-2 text-sm font-semibold text-[#080808]">{label}</h3>
                <p className="text-sm leading-6" style={{ color: "rgba(0,0,0,0.5)", fontStyle: "italic" }}>
                  "{example}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          3. WHY Q4
      ═══════════════════════════════════════════════ */}
      <section id="about" style={{ background: "#f5f5f5" }}>
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">

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
              Short-term. Verifiable. Automatic.
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          4. HOW IT WORKS
      ═══════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">

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
              Generate → Predict → Wait → Verify → Resolve
            </h2>
          </div>

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
          5. CTA
      ═══════════════════════════════════════════════ */}
      <section style={{ background: "#f5f5f5" }}>
        <div className="mx-auto max-w-7xl px-5 pb-24 pt-4 sm:px-8">
          <div className="cta-card px-8 py-12 sm:px-12 sm:py-14">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">

              {/* Left text */}
              <div className="max-w-md">
                <h2
                  className="font-bold text-white leading-tight"
                  style={{ fontSize: "clamp(28px, 3.5vw, 44px)", letterSpacing: "-0.03em" }}
                >
                  Predict today.
                  <br />
                  Know tonight with Q4.
                </h2>
                <p className="mt-4 text-sm leading-6" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Markets open, close, and resolve within 24 hours — backed by real-world data.
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
                      Welcome back — your markets await.
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
