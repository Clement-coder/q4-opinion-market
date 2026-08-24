import { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Q4Logo } from "./icons";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { label: "Home",         to: "/" },
  { label: "Markets",      to: "/markets" },
  { label: "How It Works", to: "/how-it-works" },
  { label: "About",        to: "/about" },
  { label: "FAQ",          to: "/faq" },
];

/* Inject once — all responsive logic lives here, no Tailwind class dependency */
const CSS = `
  .hdr-root {
    position: sticky;
    top: 0;
    z-index: 50;
    isolation: isolate;
  }
  .hdr-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 24px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  /* Desktop nav — visible ≥ 768px */
  .hdr-desktop-nav  { display: flex; align-items: center; gap: 2px; }
  .hdr-desktop-auth { display: flex; align-items: center; gap: 8px; }
  .hdr-hamburger    { display: none; }

  /* Mobile drawer */
  .hdr-drawer {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 49;
    background: rgba(8,8,8,0.97);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255,255,255,0.07);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    padding: 12px 16px 16px;
    /* animate open */
    animation: hdr-slide-down 0.18s ease;
  }
  @keyframes hdr-slide-down {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Tablet / Mobile: ≤ 767px ── */
  @media (max-width: 767px) {
    .hdr-inner         { padding: 0 16px; }
    .hdr-desktop-nav   { display: none; }
    .hdr-desktop-auth  { display: none; }
    .hdr-hamburger     { display: flex; }
  }
`;

let cssInjected = false;
function injectCSS() {
  if (cssInjected || typeof document === "undefined") return;
  cssInjected = true;
  const el = document.createElement("style");
  el.id = "hdr-styles";
  el.textContent = CSS;
  document.head.appendChild(el);
}

export default function Navbar() {
  const [open,     setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const drawerRef = useRef(null);

  injectCSS();

  /* Scroll detection */
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* Close drawer on outside click */
  useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  /* Close drawer on resize to desktop */
  useEffect(() => {
    const fn = () => { if (window.innerWidth > 767) setOpen(false); };
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
  }, []);

  const headerStyle = {
    transition: "background 0.2s, border-color 0.2s",
    background: scrolled ? "rgba(8,8,8,0.92)" : "transparent",
    backdropFilter: scrolled ? "blur(18px)" : "none",
    WebkitBackdropFilter: scrolled ? "blur(18px)" : "none",
    borderBottom: scrolled
      ? "1px solid rgba(255,255,255,0.07)"
      : "1px solid transparent",
  };

  const navLinkStyle = ({ isActive }) => ({
    padding: "6px 13px",
    borderRadius: 6,
    fontSize: 13.5,
    fontWeight: isActive ? 500 : 400,
    color: isActive ? "#ffffff" : "rgba(255,255,255,0.5)",
    textDecoration: "none",
    transition: "color 0.15s, background 0.15s",
    background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
    letterSpacing: "-0.01em",
    whiteSpace: "nowrap",
  });

  const mobileNavLinkStyle = ({ isActive }) => ({
    display: "block",
    padding: "11px 14px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: isActive ? 600 : 400,
    color: isActive ? "#ffffff" : "rgba(255,255,255,0.6)",
    textDecoration: "none",
    background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
    transition: "background 0.15s, color 0.15s",
  });

  return (
    <header className="hdr-root" style={headerStyle}>
      <div className="hdr-inner">

        {/* ── Logo ── */}
        <Link
          to="/"
          style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}
          aria-label="Q4 Home"
        >
          <Q4Logo size={36} />
        </Link>

        {/* ── Desktop nav links ── */}
        <nav className="hdr-desktop-nav" aria-label="Main navigation" style={{ flex: 1, justifyContent: "center" }}>
          {NAV_ITEMS.map(({ label, to }) => (
            <NavLink
              key={label}
              to={to}
              end={to === "/"}
              style={navLinkStyle}
              onMouseEnter={(e) => {
                const active = e.currentTarget.getAttribute("aria-current") === "page";
                if (!active) {
                  e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                const active = e.currentTarget.getAttribute("aria-current") === "page";
                e.currentTarget.style.color = active ? "#ffffff" : "rgba(255,255,255,0.5)";
                e.currentTarget.style.background = active ? "rgba(255,255,255,0.07)" : "transparent";
              }}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ── Desktop auth buttons ── */}
        <div className="hdr-desktop-auth">
          {user ? (
            <Link
              to="/dashboard"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "7px 16px", borderRadius: 6,
                fontSize: 13.5, fontWeight: 600,
                color: "#080808", textDecoration: "none",
                background: "#ffffff", transition: "background 0.15s",
                letterSpacing: "-0.01em", whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#ebebeb"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
            >
              {user.photoURL && (
                <img
                  src={user.photoURL} alt=""
                  referrerPolicy="no-referrer"
                  style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                />
              )}
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                style={{
                  padding: "7px 16px", borderRadius: 6,
                  fontSize: 13.5, fontWeight: 500,
                  color: "rgba(255,255,255,0.65)", textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.13)",
                  background: "transparent",
                  transition: "color 0.15s, border-color 0.15s, background 0.15s",
                  letterSpacing: "-0.01em", whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.9)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.13)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                style={{
                  padding: "7px 16px", borderRadius: 6,
                  fontSize: 13.5, fontWeight: 600,
                  color: "#080808", textDecoration: "none",
                  background: "#ffffff", transition: "background 0.15s",
                  letterSpacing: "-0.01em", whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#ebebeb"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* ── Hamburger (mobile only) ── */}
        <button
          type="button"
          className="hdr-hamburger"
          onClick={() => setOpen((v) => !v)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 8, borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.12)",
            background: open ? "rgba(255,255,255,0.07)" : "transparent",
            color: "rgba(255,255,255,0.7)",
            cursor: "pointer", transition: "background 0.15s",
            flexShrink: 0,
          }}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open
            ? <X    size={18} strokeWidth={2} />
            : <Menu size={18} strokeWidth={2} />
          }
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {open && (
        <div className="hdr-drawer" ref={drawerRef}>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV_ITEMS.map(({ label, to }) => (
              <NavLink
                key={label}
                to={to}
                end={to === "/"}
                onClick={() => setOpen(false)}
                style={mobileNavLinkStyle}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "12px 0" }} />

          {/* Auth buttons */}
          <div style={{ display: "grid", gridTemplateColumns: user ? "1fr" : "1fr 1fr", gap: 8 }}>
            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  padding: "11px", borderRadius: 8,
                  fontSize: 14, fontWeight: 600,
                  color: "#080808", textDecoration: "none",
                  background: "#ffffff", textAlign: "center",
                }}
              >
                {user.photoURL && (
                  <img
                    src={user.photoURL} alt=""
                    referrerPolicy="no-referrer"
                    style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                  />
                )}
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  style={{
                    padding: "11px", borderRadius: 8, textAlign: "center",
                    fontSize: 14, fontWeight: 500,
                    color: "rgba(255,255,255,0.75)", textDecoration: "none",
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "transparent",
                  }}
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setOpen(false)}
                  style={{
                    padding: "11px", borderRadius: 8, textAlign: "center",
                    fontSize: 14, fontWeight: 600,
                    color: "#080808", textDecoration: "none",
                    background: "#ffffff",
                  }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
