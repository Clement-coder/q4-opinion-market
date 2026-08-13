import { Link } from "react-router-dom";
import { ShieldCheck, Globe, Zap, Users, ArrowRight } from "../components/icons";

const VALUES = [
  { icon: ShieldCheck, title: "Transparency First",    text: "Every rule, every settlement, every fee is published and verifiable on-chain."   },
  { icon: Zap,         title: "Conviction Over Votes", text: "Economic weight replaces popularity. Your belief is measured by what you stake." },
  { icon: Globe,       title: "Truly Decentralised",   text: "Smart contracts and oracles on Quai Network settle every market automatically."  },
  { icon: Users,       title: "Built for Everyone",    text: "Simple enough for newcomers, deep enough for experienced participants."           },
];

const TEAM = [
  { name: "Adaeze Okonkwo",   role: "Co-founder & CEO",     initials: "AO" },
  { name: "Marcus Trentadue", role: "Co-founder & CTO",     initials: "MT" },
  { name: "Yuki Hashimoto",   role: "Head of Product",      initials: "YH" },
  { name: "Leila Rahimian",   role: "Lead Smart Contracts", initials: "LR" },
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
            Redefining how beliefs are measured.
          </h1>
          <p className="mt-5 text-base leading-7" style={{ color: "rgba(255,255,255,0.45)" }}>
            Q4 was founded on a simple idea: when people put real value behind their beliefs,
            the signal is cleaner, the outcomes are fairer, and the rewards are meaningful.
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
                Economic conviction, not popularity.
              </h2>
              <p className="mt-5 text-sm leading-7" style={{ color: "rgba(0,0,0,0.55)" }}>
                Traditional polls count heads. Q4 counts conviction. When you commit Q4 tokens
                to a prediction, you signal how strongly you believe — and the percentage shown
                reflects the total capital behind each side, not the number of people.
              </p>
              <p className="mt-4 text-sm leading-7" style={{ color: "rgba(0,0,0,0.55)" }}>
                This creates a richer, more honest signal. Weak beliefs stay quiet. Strong
                beliefs move markets. And when you're right, you earn.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["$4.2M+", "Total capital committed"],
                ["38,000+","Registered users"],
                ["9,800+", "Resolved markets"],
                ["99.97%", "On-chain uptime"],
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

      {/* Values — light gray */}
      <section style={{ background: "#f5f5f5" }}>
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

      {/* Team — white */}
      <section style={{ background: "#ffffff" }}>
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(0,0,0,0.35)", letterSpacing: "0.14em" }}>The Team</p>
            <h2 className="font-bold text-[#080808]" style={{ fontSize: "clamp(26px, 3.5vw, 40px)", letterSpacing: "-0.03em" }}>
              Built by believers.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map(({ name, role, initials }) => (
              <div
                key={name}
                className="rounded-2xl p-6 text-center transition"
                style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#f9f9f9" }}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: "#080808" }}>
                  {initials}
                </div>
                <div className="font-semibold text-[#080808] text-sm">{name}</div>
                <div className="mt-1 text-xs" style={{ color: "rgba(0,0,0,0.45)" }}>{role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — dark */}
      <section style={{ background: "#080808" }}>
        <div className="mx-auto max-w-7xl px-5 py-20 text-center sm:px-8">
          <h2 className="font-bold text-white" style={{ fontSize: "clamp(28px, 4vw, 48px)", letterSpacing: "-0.04em" }}>
            Join the conviction economy.
          </h2>
          <p className="mt-4 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Start answering, start staking, start earning.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/signup" className="btn-primary">
              Get Started
              <ArrowRight size={14} strokeWidth={2.4} />
            </Link>
            <Link to="/questions" className="btn-secondary">
              Browse Questions
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
