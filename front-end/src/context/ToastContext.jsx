/**
 * ToastContext.jsx
 * ─────────────────────────────────────────────────────────────────
 * Global toast system with liquid-glass design, swipe-to-dismiss,
 * progress bar, and full action coverage across Q4.
 *
 * Usage anywhere in the tree:
 *   const { toast } = useToast();
 *   toast.success("Position confirmed!", { sub: "$20 on YES" });
 *   toast.error("Insufficient balance.");
 *   toast.info("Market closes in 5 min.");
 *   toast.warn("Side is locked to YES.");
 *   toast.loading("Confirming on-chain…");   // returns id
 *   toast.dismiss(id);
 *   toast.update(id, { type:"success", msg:"Done!" });
 * ─────────────────────────────────────────────────────────────────
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

/* ── Design tokens ── */
const COLORS = {
  success: { accent: "#22c55e", bg: "rgba(34,197,94,0.13)",  border: "rgba(34,197,94,0.30)",  icon: "✅" },
  error:   { accent: "#ef4444", bg: "rgba(239,68,68,0.13)",  border: "rgba(239,68,68,0.30)",  icon: "❌" },
  warn:    { accent: "#fbbf24", bg: "rgba(251,191,36,0.13)", border: "rgba(251,191,36,0.30)", icon: "⚠️" },
  info:    { accent: "#38bdf8", bg: "rgba(56,189,248,0.13)", border: "rgba(56,189,248,0.30)", icon: "ℹ️" },
  loading: { accent: "#a78bfa", bg: "rgba(167,139,250,0.13)",border: "rgba(167,139,250,0.30)",icon: "⏳" },
};

const DEFAULT_DURATION = { success: 4000, error: 6000, warn: 5000, info: 4000, loading: 0 };

let _nextId = 1;

/* ── Context ── */
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 380);
  }, []);

  const add = useCallback((type, msg, { sub, duration, action } = {}) => {
    const id = _nextId++;
    const dur = duration ?? DEFAULT_DURATION[type];
    setToasts(prev => [...prev.slice(-4), { id, type, msg, sub, action, exiting: false }]);
    if (dur > 0) setTimeout(() => dismiss(id), dur);
    return id;
  }, [dismiss]);

  const update = useCallback((id, { type, msg, sub, duration } = {}) => {
    setToasts(prev => prev.map(t => {
      if (t.id !== id) return t;
      const updated = { ...t };
      if (type) updated.type = type;
      if (msg)  updated.msg  = msg;
      if (sub !== undefined) updated.sub = sub;
      return updated;
    }));
    const dur = duration ?? DEFAULT_DURATION[type ?? "success"];
    if (dur > 0) setTimeout(() => dismiss(id), dur);
  }, [dismiss]);

  const toast = {
    success: (msg, opts) => add("success", msg, opts),
    error:   (msg, opts) => add("error",   msg, opts),
    warn:    (msg, opts) => add("warn",    msg, opts),
    info:    (msg, opts) => add("info",    msg, opts),
    loading: (msg, opts) => add("loading", msg, { duration: 0, ...opts }),
    dismiss,
    update,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

/* ── Single toast item ── */
function ToastItem({ t, onDismiss }) {
  const c = COLORS[t.type] || COLORS.info;
  const containerRef = useRef(null);

  /* Swipe-to-dismiss */
  const drag = useRef({ startX: 0, dx: 0, dragging: false });

  const onPointerDown = (e) => {
    drag.current = { startX: e.clientX, dx: 0, dragging: true };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current.dragging) return;
    drag.current.dx = e.clientX - drag.current.startX;
    const el = containerRef.current;
    if (!el) return;
    el.style.transform = `translateX(${drag.current.dx}px)`;
    el.style.opacity   = String(Math.max(0, 1 - Math.abs(drag.current.dx) / 180));
  };
  const onPointerUp = () => {
    if (!drag.current.dragging) return;
    drag.current.dragging = false;
    const el = containerRef.current;
    if (!el) return;
    if (Math.abs(drag.current.dx) > 80) {
      const dir = drag.current.dx > 0 ? 1 : -1;
      el.style.transition = "transform 0.25s ease, opacity 0.25s ease";
      el.style.transform  = `translateX(${dir * 400}px)`;
      el.style.opacity    = "0";
      setTimeout(() => onDismiss(t.id), 260);
    } else {
      el.style.transition = "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease";
      el.style.transform  = "translateX(0)";
      el.style.opacity    = "1";
      setTimeout(() => { if (el) { el.style.transition = ""; } }, 320);
    }
  };

  /* Loading spinner */
  const isLoading = t.type === "loading";

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 360,
        borderRadius: 18,
        overflow: "hidden",
        cursor: "grab",
        userSelect: "none",
        touchAction: "pan-y",
        animation: t.exiting
          ? "toast-out 0.32s cubic-bezier(0.4,0,1,1) forwards"
          : "toast-in 0.38s cubic-bezier(0.34,1.56,0.64,1) both",
        willChange: "transform, opacity",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* ── Liquid glass background ── */}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          linear-gradient(135deg,
            rgba(255,255,255,0.07) 0%,
            rgba(255,255,255,0.02) 60%,
            rgba(255,255,255,0.05) 100%
          )
        `,
        backdropFilter: "blur(28px) saturate(180%)",
        WebkitBackdropFilter: "blur(28px) saturate(180%)",
        border: `1px solid ${c.border}`,
        borderRadius: 18,
        boxShadow: `
          0 8px 32px rgba(0,0,0,0.55),
          0 2px 8px rgba(0,0,0,0.3),
          inset 0 1px 0 rgba(255,255,255,0.12),
          inset 0 -1px 0 rgba(0,0,0,0.2)
        `,
      }} />

      {/* ── Accent glow ── */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 18,
        background: `radial-gradient(ellipse 80% 60% at 10% 0%, ${c.bg} 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      {/* ── Content ── */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "14px 16px 14px 14px",
      }}>
        {/* Icon / spinner */}
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: c.bg,
          border: `1px solid ${c.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16,
          boxShadow: `0 0 12px ${c.accent}33`,
        }}>
          {isLoading
            ? <SpinnerRing color={c.accent} />
            : <span style={{ lineHeight: 1 }}>{c.icon}</span>
          }
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
          <p style={{
            fontSize: 13, fontWeight: 700, color: "#f0f0f0",
            margin: 0, letterSpacing: "-0.01em", lineHeight: 1.35,
          }}>
            {t.msg}
          </p>
          {t.sub && (
            <p style={{
              fontSize: 11, color: "rgba(255,255,255,0.5)",
              margin: "3px 0 0", lineHeight: 1.4,
            }}>
              {t.sub}
            </p>
          )}
          {t.action && (
            <button
              type="button"
              onClick={() => { t.action.fn(); onDismiss(t.id); }}
              style={{
                marginTop: 7, fontSize: 11, fontWeight: 700,
                color: c.accent, background: "none", border: "none",
                cursor: "pointer", padding: 0, letterSpacing: "0.02em",
              }}
            >
              {t.action.label} →
            </button>
          )}
        </div>

        {/* Dismiss × */}
        <button
          type="button"
          onClick={() => onDismiss(t.id)}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 6, width: 22, height: 22,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "rgba(255,255,255,0.35)", cursor: "pointer",
            fontSize: 13, lineHeight: 1, flexShrink: 0,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      {/* ── Progress bar (non-loading types) ── */}
      {!isLoading && (
        <ProgressBar
          duration={DEFAULT_DURATION[t.type] || 4000}
          color={c.accent}
          exiting={t.exiting}
        />
      )}
    </div>
  );
}

/* ── Animated progress bar ── */
function ProgressBar({ duration, color, exiting }) {
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      height: 3,
      background: "rgba(255,255,255,0.07)",
      borderRadius: "0 0 18px 18px",
      overflow: "hidden",
    }}>
      <div style={{
        height: "100%",
        background: `linear-gradient(90deg, ${color}, ${color}88)`,
        borderRadius: "0 0 18px 18px",
        animation: exiting ? "none" : `toast-progress ${duration}ms linear forwards`,
        boxShadow: `0 0 8px ${color}66`,
      }} />
    </div>
  );
}

/* ── SVG spinner ── */
function SpinnerRing({ color, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" style={{ animation: "toast-spin 0.9s linear infinite" }}>
      <circle cx="9" cy="9" r="7" fill="none" stroke={`${color}33`} strokeWidth="2.5" />
      <circle cx="9" cy="9" r="7" fill="none" stroke={color} strokeWidth="2.5"
        strokeDasharray="22" strokeDashoffset="8" strokeLinecap="round" />
    </svg>
  );
}

/* ── Container: stacks toasts bottom-right ── */
function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(100%) scale(0.92); }
          to   { opacity: 1; transform: translateX(0)  scale(1);    }
        }
        @keyframes toast-out {
          from { opacity: 1; transform: translateX(0)     scale(1);    max-height: 120px; margin-bottom: 10px; }
          to   { opacity: 0; transform: translateX(120%)  scale(0.88); max-height: 0;     margin-bottom: 0;   }
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%;   }
        }
        @keyframes toast-spin {
          from { transform: rotate(0deg);   }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <div
        aria-live="polite"
        aria-label="Notifications"
        style={{
          position: "fixed",
          bottom: 24,
          right: 20,
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "flex-end",
          width: "calc(100vw - 40px)",
          maxWidth: 360,
          pointerEvents: "none",
        }}
      >
        {toasts.map(t => (
          <div key={t.id} style={{ width: "100%", pointerEvents: "all" }}>
            <ToastItem t={t} onDismiss={onDismiss} />
          </div>
        ))}
      </div>
    </>
  );
}
