import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, Q4Logo } from "./icons";

const NAV_ITEMS = [
  { label: "Home",         to: "/" },
  { label: "How It Works", to: "/how-it-works" },
  { label: "Questions",    to: "/questions" },
  { label: "About",        to: "/about" },
  { label: "FAQ",          to: "/faq" },
];

export default function Navbar() {
  const [open,     setOpen]    = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        transition: "background 0.2s, border-color 0.2s",
        background: scrolled ? "rgba(8,8,8,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(18px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(18px)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.07)"
          : "1px solid transparent",
        /* needed so the absolute mobile menu positions against this */
        isolation: "isolate",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 32px",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* ── Logo ── */}
        <Link
          to="/"
          style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}
          aria-label="Q4 Home"
        >
          <Q4Logo size={38} />
        </Link>

        {/* ── Desktop nav ── */}
        <nav
          className="hidden md:flex"
          style={{ alignItems: "center", gap: 2 }}
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map(({ label, to }) => (
            <NavLink
              key={label}
              to={to}
              end={to === "/"}
              style={({ isActive }) => ({
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 13.5,
                fontWeight: isActive ? 500 : 400,
                color: isActive ? "#ffffff" : "rgba(255,255,255,0.5)",
                textDecoration: "none",
                transition: "color 0.15s, background 0.15s",
                background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                letterSpacing: "-0.01em",
              })}
              onMouseEnter={(e) => {
                if (!e.currentTarget.dataset.active) {
                  e.currentTarget.style.color = "rgba(255,255,255,0.85)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                }
              }}
              onMouseLeave={(e) => {
                const isActive = e.currentTarget.getAttribute("aria-current") === "page";
                e.currentTarget.style.color = isActive ? "#ffffff" : "rgba(255,255,255,0.5)";
                e.currentTarget.style.background = isActive ? "rgba(255,255,255,0.07)" : "transparent";
              }}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* ── Desktop auth ── */}
        <div className="hidden md:flex" style={{ alignItems: "center", gap: 8 }}>
          <Link
            to="/login"
            style={{
              padding: "7px 16px",
              borderRadius: 6,
              fontSize: 13.5,
              fontWeight: 500,
              color: "rgba(255,255,255,0.65)",
              textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.13)",
              background: "transparent",
              transition: "color 0.15s, border-color 0.15s, background 0.15s",
              letterSpacing: "-0.01em",
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
              padding: "7px 16px",
              borderRadius: 6,
              fontSize: 13.5,
              fontWeight: 600,
              color: "#080808",
              textDecoration: "none",
              background: "#ffffff",
              transition: "background 0.15s",
              letterSpacing: "-0.01em",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#ebebeb"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
          >
            Sign Up
          </Link>
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex md:hidden"
          style={{
            alignItems: "center",
            justifyContent: "center",
            padding: 7,
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.11)",
            background: "transparent",
            color: "rgba(255,255,255,0.6)",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={17} strokeWidth={2} /> : <Menu size={17} strokeWidth={2} />}
        </button>
      </div>

      {/* ── Mobile menu — absolute overlay, never shifts content ── */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 49,
            background: "rgba(8,8,8,0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(255,255,255,0.07)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            padding: "12px 20px 16px",
          }}
          className="md:hidden"
        >
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {NAV_ITEMS.map(({ label, to }) => (
              <NavLink
                key={label}
                to={to}
                end={to === "/"}
                onClick={() => setOpen(false)}
                style={({ isActive }) => ({
                  padding: "10px 14px",
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? "#ffffff" : "rgba(255,255,255,0.55)",
                  textDecoration: "none",
                  background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                })}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Link
              to="/login"
              onClick={() => setOpen(false)}
              style={{
                padding: "10px",
                textAlign: "center",
                borderRadius: 6,
                fontSize: 13.5,
                fontWeight: 500,
                color: "rgba(255,255,255,0.7)",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              Log In
            </Link>
            <Link
              to="/signup"
              onClick={() => setOpen(false)}
              style={{
                padding: "10px",
                textAlign: "center",
                borderRadius: 6,
                fontSize: 13.5,
                fontWeight: 600,
                color: "#080808",
                textDecoration: "none",
                background: "#ffffff",
              }}
            >
              Sign Up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
