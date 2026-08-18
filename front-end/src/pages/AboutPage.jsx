import { Link } from "react-router-dom";
import { ShieldCheck, Globe, Clock, Zap, ArrowRight } from "../components/icons";

const VALUES = [
  { icon: Clock,        title: "Fast Results",          text: "Markets open today and resolve tonight. No waiting weeks or months for an outcome."     },
  { icon: Zap,          title: "Live Data Oracles",     text: "Every outcome is verified by an external data source — not by admins or user votes."    },
  { icon: ShieldCheck,  title: "Automatic Resolution",  text: "When the deadline arrives the system checks the data and resolves the market by itself." },
  { icon: Globe,        title: "Built for Everyone",    text: "Simple enough for newcomers, transparent enough for those who want to verify every step." },
];

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh" }}>

      {/* Hero — dark */}
      <section className="hero-bg">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 sm:py-28">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.14em" }}>
            About Q4
          </p>
          <h1 className="font-bold text-white" style={{ fontSize: "clamp(32px, 5vw, 56px)", letterSpacing: "-0.04em", lineHeight: 1.06 }}>
            Short-term markets.<br />Real-world outcomes.
          </h1>
          <p className="mt-5 text-base leading-7" style={{ color: "rgba(255,255,255,0.45)" }}>
            Q4 Opinion Market was built on a simple idea: prediction markets should be fast,
            clear, and backed by verifiable real-world data — not speculation that drags on for months.
          </p>
        </div>
      </section>

      {/* Mission — white */}
      <section style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)", letterSpacing: "0.14em" }}>
                Our Mission
              </p>
              <h2 className="font-bold text-[#080808]" style={{ fontSize: "clamp(26px, 3.5vw, 40px)", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
                Predict it today. Know it tonight.
              </h2>
              <p className="mt-5 text-sm leading-7" style={{ color: "rgba(0,0,0,0.55)" }}>
                Q4 turns real-world events into short-term prediction markets. Instead of asking
                "Will Bitcoin reach $150,000?" — a question that may not resolve for months — Q4
                asks "Will Bitcoin be above $118,000 at 11:59 PM today?"
              </p>
              <p className="mt-4 text-sm leading-7" style={{ color: "rgba(0,0,0,0.55)" }}>
                Users choose YES or NO and commit a position. When the deadline arrives, the
                system checks a trusted data source, determines the actual outcome, and
                automatically resolves the market. No waiting. No ambiguity.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["24 Hours",  "Maximum market duration"],
                ["4+",        "Question categories"],
                ["YES / NO",  "Every market, every time"],
                ["Auto",      "Resolved by live data"],
              ].map(([val, label]) => (
                <div
                  key={label}
                  className="rounded-2xl p-6 text-center"
                  style={{ background: "#f5f5f5", border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  <div className="font-bold text-[#080808]" style={{ fontSize: 30, letterSpacing: "-0.03em" }}>{val}</div>
                  <div className="mt-1 text-xs" style={{ color: "rgba(0,0,0,0.45)" }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works — light gray */}
      <section style={{ background: "#f5f5f5" }}>
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)", letterSpacing: "0.14em" }}>The Flow</p>
            <h2 className="font-bold text-[#080808]" style={{ fontSize: "clamp(26px, 3.5vw, 40px)", letterSpacing: "-0.03em" }}>
              Generate → Predict → Wait → Verify → Resolve
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { step: "01", title: "Generate",  body: "Questions are automatically created from templates and live data." },
              { step: "02", title: "Predict",   body: "Users browse active markets and choose YES or NO."                },
              { step: "03", title: "Wait",       body: "Each market has a deadline, usually within 24 hours."            },
              { step: "04", title: "Verify",     body: "The system checks the agreed data source at the deadline."       },
              { step: "05", title: "Resolve",    body: "The market resolves YES or NO and positions are settled."        },
            ].map(({ step, title, body }) => (
              <div
                key={step}
                className="rounded-2xl p-6"
                style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.07)" }}
              >
                <div className="mb-3 text-xs font-bold" style={{ color: "rgba(0,0,0,0.25)", letterSpacing: "0.1em" }}>{step}</div>
                <h3 className="mb-2 text-sm font-semibold text-[#080808]">{title}</h3>
                <p className="text-sm leading-6" style={{ color: "rgba(0,0,0,0.5)" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values — white */}
      <section style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)", letterSpacing: "0.14em" }}>Our Values</p>
            <h2 className="font-bold text-[#080808]" style={{ fontSize: "clamp(26px, 3.5vw, 40px)", letterSpacing: "-0.03em" }}>
              What we stand for.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="feature-card p-6">
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                  <Icon size={18} strokeWidth={1.75} style={{ color: "#080808" }} />
                </div>
                <h3 className="mb-2 text-sm font-semibold text-[#080808]">{title}</h3>
                <p className="text-sm leading-6" style={{ color: "rgba(0,0,0,0.5)" }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — dark */}
      <section style={{ background: "#080808" }}>
        <div className="mx-auto max-w-7xl px-5 py-20 text-center sm:px-8">
          <h2 className="font-bold text-white" style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.04em" }}>
            Start predicting today.
          </h2>
          <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Markets open, close, and resolve within 24 hours.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/signup" className="btn-primary">
              Get Started
              <ArrowRight size={14} strokeWidth={2.4} />
            </Link>
            <Link to="/markets" className="btn-secondary">
              Browse Markets
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
