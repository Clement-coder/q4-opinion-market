/**
 * CustomSelect.jsx
 * A fully styled, accessible dropdown that replaces every native <select>.
 * Matches the Q4 dark design language — no external dependencies.
 *
 * Props:
 *   value        {string}        — currently selected value
 *   onChange     {fn(value)}     — called with the new value string
 *   options      {Array}         — array of { value, label } OR plain strings
 *   placeholder  {string}        — shown when value is empty / null
 *   label        {string}        — optional label shown above
 *   disabled     {boolean}
 *   error        {string}        — optional error message shown below
 *   style        {object}        — extra style for the wrapper div
 *   menuMaxH     {number}        — max-height of the dropdown menu (px, default 220)
 *
 * Usage:
 *   <CustomSelect
 *     value={cat}
 *     onChange={setCat}
 *     options={["Crypto","Sports","Weather","Stocks"]}
 *   />
 *
 *   <CustomSelect
 *     value={q}
 *     onChange={setQ}
 *     options={[{ value:"btc", label:"Bitcoin" }, { value:"eth", label:"Ethereum" }]}
 *     placeholder="Pick a coin…"
 *   />
 */

import { useState, useEffect, useRef, useCallback } from "react";

/* ── design tokens (keeps component self-contained) ── */
const DT = {
  bg:        "#0d0d0d",
  surface:   "#111111",
  border:    "rgba(255,255,255,0.08)",
  borderHi:  "rgba(255,255,255,0.20)",
  borderErr: "rgba(239,68,68,0.55)",
  glass:     "rgba(255,255,255,0.04)",
  glassHi:   "rgba(255,255,255,0.08)",
  text:      "#f0f0f0",
  muted:     "rgba(255,255,255,0.38)",
  dim:       "rgba(255,255,255,0.22)",
  accent:    "#7c6ff7",
  accentBg:  "rgba(124,111,247,0.12)",
  accentBd:  "rgba(124,111,247,0.35)",
  hover:     "rgba(255,255,255,0.06)",
};

/* Inject animation + scrollbar styles once */
let _injected = false;
function injectStyles() {
  if (_injected || typeof document === "undefined") return;
  _injected = true;
  const el = document.createElement("style");
  el.id = "custom-select-styles";
  el.textContent = `
    @keyframes cs-open {
      from { opacity: 0; transform: translateY(-6px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0)   scale(1);    }
    }
    .cs-menu {
      animation: cs-open 0.14s cubic-bezier(0.22,1,0.36,1) both;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.12) transparent;
    }
    .cs-menu::-webkit-scrollbar { width: 4px; }
    .cs-menu::-webkit-scrollbar-track { background: transparent; }
    .cs-menu::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }
    .cs-option { transition: background 0.1s, color 0.1s; }
    .cs-option:hover { background: rgba(255,255,255,0.07) !important; }
    .cs-trigger { transition: border-color 0.15s, box-shadow 0.15s, background 0.15s; }
    .cs-trigger:focus-visible { outline: 2px solid rgba(124,111,247,0.6); outline-offset: 2px; }
  `;
  document.head.appendChild(el);
}

/* Normalise options to { value, label } */
function normalise(opts) {
  if (!opts || !opts.length) return [];
  return opts.map(o =>
    typeof o === "string" ? { value: o, label: o } : o
  );
}

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = "Select…",
  label,
  disabled = false,
  error,
  style,
  menuMaxH = 220,
}) {
  injectStyles();

  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapRef  = useRef(null);
  const menuRef  = useRef(null);
  const items    = normalise(options);
  const selected = items.find(o => o.value === value) ?? null;

  /* close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* keyboard nav */
  const handleKeyDown = useCallback((e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(v => !v);
    }
    if (e.key === "Escape") setOpen(false);
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && open) {
      e.preventDefault();
      const cur = items.findIndex(o => o.value === value);
      const next = e.key === "ArrowDown"
        ? Math.min(cur + 1, items.length - 1)
        : Math.max(cur - 1, 0);
      onChange(items[next].value);
    }
  }, [disabled, open, items, value, onChange]);

  const pick = useCallback((val) => {
    onChange(val);
    setOpen(false);
  }, [onChange]);

  /* ── chevron icon ── */
  const Chevron = () => (
    <svg
      width="14" height="14" viewBox="0 0 14 14" fill="none"
      style={{
        flexShrink: 0,
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s cubic-bezier(0.22,1,0.36,1)",
        color: focused || open ? DT.text : DT.muted,
      }}
    >
      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  /* ── check mark ── */
  const Check = () => (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M2.5 6.5l3 3 5-5" stroke={DT.accent} strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const triggerBorder = error
    ? DT.borderErr
    : open || focused
      ? DT.borderHi
      : DT.border;

  const triggerBg = open
    ? "rgba(255,255,255,0.06)"
    : DT.glass;

  const lbl = {
    fontSize: 11, fontWeight: 700,
    color: DT.dim,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    display: "block",
    marginBottom: 5,
    userSelect: "none",
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", ...style }}>

      {/* ── optional label ── */}
      {label && <span style={lbl}>{label}</span>}

      {/* ── trigger button ── */}
      <button
        type="button"
        className="cs-trigger"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "10px 13px",
          borderRadius: 9,
          border: `1px solid ${triggerBorder}`,
          background: triggerBg,
          color: selected ? DT.text : DT.muted,
          fontSize: 13,
          fontWeight: selected ? 500 : 400,
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
          textAlign: "left",
          letterSpacing: "-0.01em",
          opacity: disabled ? 0.45 : 1,
          boxSizing: "border-box",
        }}
      >
        {/* selected label or placeholder */}
        <span style={{
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}>
          {selected ? selected.label : placeholder}
        </span>

        <Chevron />
      </button>

      {/* ── dropdown menu ── */}
      {open && (
        <div
          ref={menuRef}
          className="cs-menu"
          role="listbox"
          aria-label={label ?? "Options"}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 9999,
            background: "#141414",
            border: `1px solid rgba(255,255,255,0.12)`,
            borderRadius: 11,
            boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
            overflow: "hidden auto",
            maxHeight: menuMaxH,
            padding: "5px",
          }}
        >
          {items.length === 0 ? (
            <div style={{ padding: "14px 12px", fontSize: 12, color: DT.muted, textAlign: "center" }}>
              No options
            </div>
          ) : items.map((opt, idx) => {
            const isActive = opt.value === value;
            return (
              <div
                key={opt.value}
                role="option"
                aria-selected={isActive}
                className="cs-option"
                onMouseDown={(e) => { e.preventDefault(); pick(opt.value); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  padding: "9px 11px",
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                  background: isActive ? DT.accentBg : "transparent",
                  cursor: "pointer",
                  userSelect: "none",
                  letterSpacing: "-0.01em",
                  /* subtle separator between items */
                  borderBottom: idx < items.length - 1
                    ? "1px solid rgba(255,255,255,0.04)"
                    : "none",
                }}
              >
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {opt.label}
                </span>
                {isActive && <Check />}
              </div>
            );
          })}
        </div>
      )}

      {/* ── error message ── */}
      {error && (
        <p style={{
          fontSize: 11, color: "rgba(239,68,68,0.85)",
          margin: "5px 0 0", lineHeight: 1.4,
        }}>
          {error}
        </p>
      )}
    </div>
  );
}
