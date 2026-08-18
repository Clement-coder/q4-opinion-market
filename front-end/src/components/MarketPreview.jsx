import { useState } from "react";
import { Clock, Info, ArrowRight, ShieldCheck, Zap, CheckCircle2 } from "./icons";

const POOL  = "$10,000";
const CLOSE = "6h 35m";

export default function MarketPreview() {
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleSelect = (side) => { setSelected(side); setConfirmed(false); };
  const handleConfirm = () => { if (selected) setConfirmed(true); };

  return (
    <div
      className="select-none"
      style={{ width: "100%", maxWidth: 440, minWidth: 0 }}
    >
      {/* ── Outer card ── */}
      <div style={{
        background: "#0f0f0f",
        border: "1px solid rgba(255,255,255,0.09)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03)",
        position: "relative",
      }}>
        {/* Top glow line */}
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "60%", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)", pointerEvents: "none" }} />

        {/* ── Header bar ── */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.9)", flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>Crypto</span>
          </div>
          <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            <Clock size={11} strokeWidth={2} /> {CLOSE} remaining
          </span>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "20px 20px 0" }}>
          <p className="market-question" style={{ fontSize: 14, color: "rgba(255,255,255,0.92)", lineHeight: 1.35, letterSpacing: "-0.02em", margin: "0 0 6px" }}>
            Will Bitcoin be above $118,000 at 11:59 PM today?
          </p>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", margin: "0 0 18px" }}>
            Total pool: <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>{POOL}</span>
          </p>

          {/* ── YES / NO bar ── */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11, fontWeight: 600 }}>
              <span style={{ color: "#22c55e" }}>YES 62%</span>
              <span style={{ color: "#ef4444" }}>NO 38%</span>
            </div>
            <div style={{ height: 4, borderRadius: 4, background: "rgba(239,68,68,0.25)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: "62%", borderRadius: 4, background: "#22c55e" }} />
            </div>
          </div>

          {/* ── YES / VS / NO ── */}
          {!confirmed ? (
            <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 6, marginBottom: 16, alignItems: "center" }}>

              {/* YES */}
              <button
                type="button"
                onClick={() => handleSelect("YES")}
                style={{
                  position: "relative",
                  padding: "20px 12px",
                  borderRadius: 14,
                  border: selected === "YES" ? "1.5px solid rgba(34,197,94,0.7)" : "1px solid rgba(34,197,94,0.2)",
                  background: selected === "YES"
                    ? "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(34,197,94,0.08))"
                    : "linear-gradient(135deg, rgba(34,197,94,0.07), rgba(34,197,94,0.03))",
                  cursor: "pointer",
                  overflow: "hidden",
                  transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                  transform: selected === "YES" ? "translateY(-3px) scale(1.02)" : "scale(1)",
                  boxShadow: selected === "YES"
                    ? "0 8px 32px rgba(34,197,94,0.3), 0 0 0 1px rgba(34,197,94,0.2) inset"
                    : "0 2px 8px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={(e) => { if (selected !== "YES") { e.currentTarget.style.borderColor = "rgba(34,197,94,0.4)"; e.currentTarget.style.background = "linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.05))"; }}}
                onMouseLeave={(e) => { if (selected !== "YES") { e.currentTarget.style.borderColor = "rgba(34,197,94,0.2)"; e.currentTarget.style.background = "linear-gradient(135deg, rgba(34,197,94,0.07), rgba(34,197,94,0.03))"; }}}
              >
                {selected === "YES" && <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,0.2)", filter: "blur(20px)", pointerEvents: "none" }} />}
                <div style={{ position: "relative" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#22c55e", margin: "0 0 6px", textTransform: "uppercase", opacity: selected === "YES" ? 1 : 0.7 }}>YES</p>
                  <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(34,197,94,0.65)", margin: 0, lineHeight: 1.3 }}>It will</p>
                </div>
              </button>

              {/* ── VS badge ── */}
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "0 0 0 5px rgba(255,255,255,0.025), 0 6px 20px rgba(0,0,0,0.6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, zIndex: 2, position: "relative",
              }}>
                <div style={{ position: "absolute", inset: 2, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
                <span style={{
                  fontFamily: "'YapariTrial','Yapari Trial','Yapari',sans-serif",
                  fontSize: 14, fontWeight: 900, letterSpacing: "-0.02em",
                  color: "rgba(255,255,255,0.7)", position: "relative", zIndex: 1, lineHeight: 1,
                }}>VS</span>
              </div>

              {/* NO */}
              <button
                type="button"
                onClick={() => handleSelect("NO")}
                style={{
                  position: "relative",
                  padding: "20px 12px",
                  borderRadius: 14,
                  border: selected === "NO" ? "1.5px solid rgba(239,68,68,0.7)" : "1px solid rgba(239,68,68,0.2)",
                  background: selected === "NO"
                    ? "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.08))"
                    : "linear-gradient(135deg, rgba(239,68,68,0.07), rgba(239,68,68,0.03))",
                  cursor: "pointer",
                  overflow: "hidden",
                  transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                  transform: selected === "NO" ? "translateY(-3px) scale(1.02)" : "scale(1)",
                  boxShadow: selected === "NO"
                    ? "0 8px 32px rgba(239,68,68,0.3), 0 0 0 1px rgba(239,68,68,0.2) inset"
                    : "0 2px 8px rgba(0,0,0,0.3)",
                }}
                onMouseEnter={(e) => { if (selected !== "NO") { e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; e.currentTarget.style.background = "linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.05))"; }}}
                onMouseLeave={(e) => { if (selected !== "NO") { e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; e.currentTarget.style.background = "linear-gradient(135deg, rgba(239,68,68,0.07), rgba(239,68,68,0.03))"; }}}
              >
                {selected === "NO" && <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", width: 80, height: 80, borderRadius: "50%", background: "rgba(239,68,68,0.2)", filter: "blur(20px)", pointerEvents: "none" }} />}
                <div style={{ position: "relative" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#ef4444", margin: "0 0 6px", textTransform: "uppercase", opacity: selected === "NO" ? 1 : 0.7 }}>NO</p>
                  <p style={{ fontSize: 11, fontWeight: 500, color: "rgba(239,68,68,0.65)", margin: 0, lineHeight: 1.3 }}>It won't</p>
                </div>
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: 16, padding: "20px", borderRadius: 14, background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.25)", textAlign: "center" }}>
              <p style={{ fontSize: 22, margin: "0 0 4px" }}>✓</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#22c55e", margin: "0 0 4px" }}>Prediction Confirmed — {selected}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", margin: 0 }}>Market resolves at 11:59 PM tonight.</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: "0 20px 20px" }}>
          {!confirmed ? (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selected}
              style={{
                width: "100%", padding: "13px", borderRadius: 10, border: "none",
                background: selected
                  ? selected === "YES"
                    ? "linear-gradient(135deg, #16a34a, #22c55e)"
                    : "linear-gradient(135deg, #dc2626, #ef4444)"
                  : "rgba(255,255,255,0.07)",
                color: selected ? "#ffffff" : "rgba(255,255,255,0.28)",
                fontSize: 13, fontWeight: 700,
                cursor: selected ? "pointer" : "default",
                transition: "all 0.2s",
                letterSpacing: "-0.01em",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: selected
                  ? selected === "YES" ? "0 4px 20px rgba(34,197,94,0.35)" : "0 4px 20px rgba(239,68,68,0.35)"
                  : "none",
              }}
            >
              {selected ? `Predict ${selected}` : "Select YES or NO to predict"}
              {selected && <ArrowRight size={14} strokeWidth={2.5} />}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => { setSelected(null); setConfirmed(false); }}
              style={{ width: "100%", padding: "13px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.45)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              View another market
            </button>
          )}

          <p style={{ marginTop: 10, display: "flex", alignItems: "flex-start", gap: 6, fontSize: 11, lineHeight: 1.6, color: "rgba(255,255,255,0.2)" }}>
            <Info size={11} strokeWidth={1.8} style={{ marginTop: 1, flexShrink: 0 }} />
            Outcome verified automatically by the BTC/USD price feed at 11:59 PM.
          </p>
        </div>
      </div>

      {/* ── Tags / badges ── */}
      <div style={{ marginTop: 14, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
        {[
          { icon: ShieldCheck,   label: "Live Market"         },
          { icon: CheckCircle2,  label: "Auto-Resolved"       },
          { icon: Zap,           label: "Oracle Verified"     },
        ].map(({ icon: Icon, label }) => (
          <span
            key={label}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: 11, fontWeight: 500, letterSpacing: "0.02em",
              color: "rgba(255,255,255,0.38)", padding: "5px 12px",
              borderRadius: 6, border: "1px solid rgba(255,255,255,0.09)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <Icon size={11} strokeWidth={1.8} style={{ flexShrink: 0 }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
