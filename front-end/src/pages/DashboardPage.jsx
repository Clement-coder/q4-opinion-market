/**
 * DashboardPage.jsx — Q4 Futuristic Dashboard
 * Dark theme · Glassmorphism · Fixed sidebar + header · Scrollable main
 * Matches landing page aesthetic: #080808 base, dot-grid, white accents
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  LayoutGrid, HelpCircle, BookMarked, BarChart3, Trophy,
  Gift, Info, Clock, ArrowLeft, Share2,
  CheckCircle2, RefreshCcw, ChevronRight, ChevronDown, ArrowRight,
  Menu, X, TrendingUp, TrendingDown, WalletCards,
  ShieldCheck, Globe, Award, LogOut, Bell, ArrowLeftRight,
  User, Mail,
} from "../components/icons";
import { Q4Logo } from "../components/icons";
import { useAuth } from "../context/AuthContext";

/* ════════════════════════════════════════════════
   DESIGN TOKENS  (mirror landing page palette)
════════════════════════════════════════════════ */
const T = {
  bg:           "#080808",
  surface:      "#111111",
  surfaceHover: "#161616",
  border:       "rgba(255,255,255,0.08)",
  borderHover:  "rgba(255,255,255,0.15)",
  glass:        "rgba(255,255,255,0.04)",
  glassHover:   "rgba(255,255,255,0.07)",
  textPrimary:  "#f0f0f0",
  textMuted:    "rgba(255,255,255,0.45)",
  textDim:      "rgba(255,255,255,0.25)",
  yes:          "#22c55e",
  yesBg:        "rgba(34,197,94,0.1)",
  yesBorder:    "rgba(34,197,94,0.25)",
  no:           "#ef4444",
  noBg:         "rgba(239,68,68,0.1)",
  noBorder:     "rgba(239,68,68,0.25)",
  accent:       "#ffffff",
  accentDim:    "rgba(255,255,255,0.12)",
  violet:       "#7c6ff7",
  violetBg:     "rgba(124,111,247,0.12)",
};

/* ════════════════════════════════════════════════
   DATA
════════════════════════════════════════════════ */
// USER is now sourced from Firebase auth — see useAuth() in components below
const FALLBACK_USER = { name: "You", fullName: "Q4 User", level: 1, balance: 0, wallet: "—" };

const STATS = {
  todayAnswered: 7, todayTotal: 10,
  totalStaked: 85.4, potentialRewards: 24.8,
  accuracy: 68, marketsWon: 32, marketsTotal: 47,
  weeklyPnl: +18.6, allTimeEarned: 246.2,
};

const PORTFOLIO_BARS = [42, 68, 55, 80, 47, 91, 74]; // last 7 markets % yes pool share

const QUESTIONS = [
  { id: "us-election-2024",  category: "Politics",         question: "Will the United States hold presidential elections in 2024?", closes: "1h 24m", yes: 70, no: 30, yesPool: 7000,  noPool: 3000,  totalPool: 10000, yourPosition: "YES", yourStake: 1.5, resolves: 'Resolves "Yes" if US presidential election occurs in 2024.', resolution: "Based on official US election authority announcements." },
  { id: "global-recession",  category: "Politics",         question: "Will a global recession begin in 2025?",                     closes: "1h 30m", yes: 65, no: 35, yesPool: 4030,  noPool: 2170,  totalPool: 6200  },
  { id: "element-o",         category: "General Knowledge",question: "Which element has the chemical symbol 'O'?",                  closes: "6h 45m", yes: 84, no: 16, yesPool: 2352,  noPool: 448,   totalPool: 2800  },
  { id: "is-97-prime",       category: "Math",             question: "Is 97 a prime number?",                                       closes: "6h 20m", yes: 92, no:  8, yesPool: 1702,  noPool: 148,   totalPool: 1850  },
  { id: "first-impressions", category: "Psychology",       question: "Do first impressions shape our long-term perception?",        closes: "1d 2h",  yes: 58, no: 42, yesPool: 2088,  noPool: 1512,  totalPool: 3600  },
  { id: "ethereum-10k",      category: "Crypto",           question: "Will Ethereum reach $10,000 before 2026?",                    closes: "1d 8h",  yes: 71, no: 29, yesPool: 6390,  noPool: 2610,  totalPool: 9000  },
];

const TODAYS_Q = [
  { id: "largest-planet", category: "General Knowledge", question: "What is the largest planet in our solar system?", closes: "4h 45m", yes: 62, no: 38, totalPool: 2450 },
  { id: "bitcoin-150k",   category: "Crypto",            question: "Will Bitcoin reach $150,000 before Dec 2026?",    closes: "1d 18h", yes: 68, no: 32, totalPool: 8250 },
  { id: "sum-of-angles",  category: "Math",              question: "Is 97 a prime number?",                           closes: "6h 20m", yes: 92, no:  8, totalPool: 1850 },
];

const ACTIVITY = [
  { id: 1, type: "reward",  label: "Reward claimed",           detail: "US Elections 2024",              amount: "+$84.20", time: "2h ago",  pos: true  },
  { id: 2, type: "stake",   label: "Position: YES on BTC",     detail: "Bitcoin $150K market",           amount: "-$2.00",  time: "5h ago",  pos: false },
  { id: 3, type: "switch",  label: "Switched to NO",           detail: "AI replace jobs by 2035",        amount: "—",       time: "8h ago",  pos: false },
  { id: 4, type: "reward",  label: "Reward claimed",           detail: "Interior angles of triangle",    amount: "+$42.00", time: "1d ago",  pos: true  },
  { id: 5, type: "stake",   label: "Position: YES on Ethereum","detail": "ETH $10K market",              amount: "-$1.50",  time: "2d ago",  pos: false },
  { id: 6, type: "reward",  label: "Reward claimed",           detail: "US Elections market",            amount: "+$120.00",time: "4d ago",  pos: true  },
];

const CONVICTIONS = [
  { question: "Will the United States hold presidential elections in 2024?", category: "Politics",         answer: "YES", staked: 1.5, side: 70, totalPool: 10000, switched: "No",           status: "Open"   },
  { question: "Will Bitcoin reach $150,000 before Dec 2026?",               category: "Crypto",           answer: "YES", staked: 2.0, side: 68, totalPool: 8250,  switched: "YES → NO",     status: "Open"   },
  { question: "What is the largest planet in our solar system?",             category: "General Knowledge",answer: "YES", staked: 0.6, side: 62, totalPool: 2450,  switched: "No",           status: "Open"   },
  { question: "Do first impressions shape our long-term perception?",        category: "Psychology",       answer: "YES", staked: 1.2, side: 58, totalPool: 3600,  switched: "No",           status: "Open"   },
  { question: "Is 97 a prime number?",                                       category: "Math",             answer: "YES", staked: 0.5, side: 92, totalPool: 1850,  switched: "No",           status: "Open"   },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Answer Questions",          desc: "Answer daily questions across politics, general knowledge, math, psychology, crypto and more." },
  { step: "02", title: "Pick YES or NO",            desc: "Choose the outcome you believe is more likely to happen." },
  { step: "03", title: "Stake Your Conviction",     desc: "Commit a small amount of Quai to back your answer." },
  { step: "04", title: "Market Reflects Conviction",desc: "YES / NO percentages show total capital on each side." },
  { step: "05", title: "Earn Rewards",              desc: "Correct predictions earn rewards when markets resolve." },
];

const CATEGORIES = [
  { key: "all",        label: "All Categories",   emoji: "🌐" },
  { key: "politics",   label: "Politics",          emoji: "🏛️" },
  { key: "general",    label: "General Knowledge", emoji: "💡" },
  { key: "math",       label: "Math",              emoji: "🔢" },
  { key: "psychology", label: "Psychology",        emoji: "🧠" },
  { key: "crypto",     label: "Crypto",            emoji: "₿"  },
  { key: "science",    label: "Science",           emoji: "🔬" },
  { key: "sports",     label: "Sports",            emoji: "⚽" },
];

const CAT_STYLE = {
  Politics:          { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  Crypto:            { color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  "General Knowledge":{ color: "#38bdf8", bg: "rgba(56,189,248,0.12)" },
  Math:              { color: "#f472b6", bg: "rgba(244,114,182,0.12)" },
  Psychology:        { color: "#fb7185", bg: "rgba(251,113,133,0.12)" },
  Science:           { color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
  Sports:            { color: "#fb923c", bg: "rgba(251,146,60,0.12)"  },
};

/* ════════════════════════════════════════════════
   SHARED ATOMS
════════════════════════════════════════════════ */

function CategoryBadge({ category }) {
  const s = CAT_STYLE[category] || { color: "#a78bfa", bg: "rgba(167,139,250,0.12)" };
  return (
    <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600, color: s.color, background: s.bg, letterSpacing: "0.01em" }}>
      {category}
    </span>
  );
}

/** Glass card wrapper */
function GCard({ children, style, className = "", onClick }) {
  const base = {
    background: T.surface,
    border: `1px solid ${T.border}`,
    borderRadius: 16,
    ...style,
  };
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} style={{ ...base, textAlign: "left", cursor: "pointer", width: "100%", display: "block", transition: "border-color 0.15s, box-shadow 0.15s" }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.boxShadow = "0 0 0 1px rgba(255,255,255,0.06), 0 16px 40px rgba(0,0,0,0.4)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
      >{children}</button>
    );
  }
  return <div className={className} style={base}>{children}</div>;
}

/** Mini stat pill */
function Pill({ positive, children }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 999, fontSize: 11, fontWeight: 600, background: positive ? T.yesBg : T.noBg, color: positive ? T.yes : T.no }}>
      {positive ? <TrendingUp size={10} strokeWidth={2.5} /> : <TrendingDown size={10} strokeWidth={2.5} />}
      {children}
    </span>
  );
}

/** Leading-conviction bar — shows only the dominant side, no vote split */
function ConvictionBar({ yes, no }) {
  const leading = yes >= no ? "yes" : "no";
  const leadPct  = yes >= no ? yes : no;
  return (
    <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
      <div style={{
        width: `${leadPct}%`,
        height: "100%",
        borderRadius: 2,
        background: leading === "yes" ? T.yes : T.no,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

/** Radial progress ring (SVG) */
function RingProgress({ value, max, size = 52, stroke = 3, color = "#ffffff" }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (value / max) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.6s ease" }} />
    </svg>
  );
}

/** Simple sparkline bar chart */
function SparkBars({ data, color = T.yes }) {
  const max = Math.max(...data);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 36 }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, borderRadius: 2, background: color, opacity: 0.55 + (v / max) * 0.45, height: `${(v / max) * 100}%`, minHeight: 3 }} />
      ))}
    </div>
  );
}

/** Section header */
function SectionHeading({ children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: T.textDim, textTransform: "uppercase" }}>{children}</p>
      {action}
    </div>
  );
}

/* ════════════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { key: "dashboard",   label: "Dashboard",     icon: LayoutGrid,  desc: "Overview & stats"    },
  { key: "questions",   label: "Questions",     icon: HelpCircle,  desc: "Daily markets"       },
  { key: "convictions", label: "Convictions",   icon: BookMarked,  desc: "Your positions"      },
  { key: "results",     label: "Results",       icon: BarChart3,   desc: "Market outcomes"     },
  { key: "leaderboard", label: "Leaderboard",   icon: Trophy,      desc: "Top predictors"      },
  { key: "rewards",     label: "Rewards",       icon: Gift,        desc: "Claim earnings"      },
  { key: "how",         label: "How It Works",  icon: Info,        desc: "Platform guide"      },
  { key: "wallet",      label: "Wallet",        icon: WalletCards, desc: "Manage your funds"   },
  { key: "profile",     label: "Profile",       icon: User,        desc: "Account settings"    },
];

function Sidebar({ active, onNavigate, onLogout }) {
  return (
    <aside style={{
      width: 240,
      minWidth: 240,
      height: "100vh",
      position: "fixed",
      top: 0,
      left: 0,
      display: "flex",
      flexDirection: "column",
      background: "rgba(8,8,8,0.92)",
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      borderRight: `1px solid ${T.border}`,
      zIndex: 40,
      overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ padding: "18px 20px 16px", display: "flex", alignItems: "center", justifyContent: "center", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <Q4Logo size={36} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "10px 10px 6px" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.1em", padding: "8px 10px 6px", textTransform: "uppercase" }}>Navigation</p>
        {NAV_ITEMS.slice(0, 7).map(({ key, label, icon: Icon, desc }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key)}
              style={{
                display: "flex", alignItems: "center", gap: 11, width: "100%",
                padding: "9px 10px", borderRadius: 8, marginBottom: 2,
                background: isActive ? "#ffffff" : "transparent",
                color: isActive ? "#080808" : T.textMuted,
                border: "none", cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = T.glassHover; e.currentTarget.style.color = T.textPrimary; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textMuted; } }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.4 : 1.8} style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, margin: 0, letterSpacing: "-0.01em" }}>{label}</p>
                <p style={{ fontSize: 10, margin: 0, opacity: 0.6 }}>{desc}</p>
              </div>
            </button>
          );
        })}

        {/* Account section */}
        <p style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.1em", padding: "14px 10px 6px", textTransform: "uppercase" }}>Account</p>
        {NAV_ITEMS.slice(7).map(({ key, label, icon: Icon, desc }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onNavigate(key)}
              style={{
                display: "flex", alignItems: "center", gap: 11, width: "100%",
                padding: "9px 10px", borderRadius: 8, marginBottom: 2,
                background: isActive ? "#ffffff" : "transparent",
                color: isActive ? "#080808" : T.textMuted,
                border: "none", cursor: "pointer",
                transition: "background 0.15s, color 0.15s",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = T.glassHover; e.currentTarget.style.color = T.textPrimary; } }}
              onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textMuted; } }}
            >
              <Icon size={16} strokeWidth={isActive ? 2.4 : 1.8} style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, margin: 0, letterSpacing: "-0.01em" }}>{label}</p>
                <p style={{ fontSize: 10, margin: 0, opacity: 0.6 }}>{desc}</p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "12px 10px 20px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        <Link
          to="/"
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, color: T.textMuted, textDecoration: "none", fontSize: 13, fontWeight: 500, transition: "background 0.15s, color 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = T.glassHover; e.currentTarget.style.color = T.textPrimary; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = T.textMuted; }}
        >
          <Globe size={16} strokeWidth={1.8} /> Landing Page
        </Link>
        <button
          type="button"
          onClick={onLogout}
          style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, color: "rgba(239,68,68,0.6)", background: "transparent", border: "none", cursor: "pointer", width: "100%", fontSize: 13, fontWeight: 500, transition: "background 0.15s, color 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; e.currentTarget.style.color = "#ef4444"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(239,68,68,0.6)"; }}
        >
          <LogOut size={16} strokeWidth={1.8} /> Log Out
        </button>
      </div>
    </aside>
  );
}

/* ════════════════════════════════════════════════
   FIXED TOP HEADER
════════════════════════════════════════════════ */

function TopHeader({ pageLabel, onOpenMobileSidebar, onNavigate, user }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const now = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const firstName = user?.displayName?.split(" ")[0] ?? "there";
  const initials  = user?.displayName
    ? user.displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "Q4";

  return (
    <header style={{
      height: 60,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      background: "rgba(8,8,8,0.88)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: `1px solid ${T.border}`,
      position: "sticky",
      top: 0,
      zIndex: 30,
      flexShrink: 0,
    }}>
      {/* Left — hamburger (mobile) + logo (mobile) + page label */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>

        {/* Mobile hamburger + logo row — shown on mobile via CSS */}
        <div className="dash-mobile-left" style={{ display: "none", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="dash-mobile-menu"
            aria-label="Open menu"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 6, padding: 7, color: T.textMuted, cursor: "pointer", flexShrink: 0 }}
          >
            <Menu size={16} strokeWidth={2} />
          </button>
          <Q4Logo size={32} />
        </div>

        {/* Page label */}
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", margin: 0, letterSpacing: "-0.02em" }}>{pageLabel}</p>
          <p style={{ fontSize: 11, color: T.textDim, margin: 0 }}>{greeting}, {firstName} · {now}</p>
        </div>
      </div>

      {/* Right — notifications + avatar only */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

        {/* Notification bell */}
        <button
          type="button"
          aria-label="Notifications"
          style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, background: T.glass, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textMuted, cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.textPrimary; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
        >
          <Bell size={15} strokeWidth={1.8} />
          <span style={{ position: "absolute", top: 6, right: 6, width: 6, height: 6, borderRadius: "50%", background: T.yes, border: "1.5px solid #080808" }} />
        </button>

        {/* User avatar — opens profile page */}
        <button
          type="button"
          onClick={() => onNavigate("profile")}
          aria-label="Profile"
          style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", border: "2px solid rgba(255,255,255,0.15)", flexShrink: 0, transition: "border-color 0.15s", padding: 0, background: "transparent" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
          title={user?.displayName ?? "Profile"}
        >
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName ?? "avatar"} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} referrerPolicy="no-referrer" />
          ) : (
            <span style={{ width: "100%", height: "100%", borderRadius: "50%", background: "linear-gradient(135deg,#ffffff,rgba(255,255,255,0.45))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#080808" }}>
              {initials}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
/* ════════════════════════════════════════════════
   PAGE: DASHBOARD (main overview tab)
════════════════════════════════════════════════ */

function PageDashboard({ onOpenQuestion, onNavigate }) {
  const featured = QUESTIONS[0];
  const progressPct = (STATS.todayAnswered / STATS.todayTotal) * 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── KPI ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }} className="dash-kpi-grid">

        {/* Today's Progress */}
        <GCard style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: 11, color: T.textDim, margin: "0 0 8px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Today's Progress</p>
              <p style={{ fontSize: 26, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.04em" }}>
                {STATS.todayAnswered}<span style={{ color: T.textMuted, fontSize: 18 }}>/{STATS.todayTotal}</span>
              </p>
              <p style={{ fontSize: 11, color: T.textDim, margin: "4px 0 0" }}>Questions answered</p>
            </div>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <RingProgress value={STATS.todayAnswered} max={STATS.todayTotal} size={52} stroke={3.5} color="#ffffff" />
              <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 11, fontWeight: 800, color: "#ffffff" }}>
                {Math.round(progressPct)}%
              </span>
            </div>
          </div>
          <div style={{ marginTop: 12, height: 3, borderRadius: 2, background: T.border }}>
            <div style={{ width: `${progressPct}%`, height: "100%", borderRadius: 2, background: "#ffffff", transition: "width 0.6s ease" }} />
          </div>
        </GCard>

        {/* Total Staked */}
        <GCard style={{ padding: "18px 20px" }}>
          <p style={{ fontSize: 11, color: T.textDim, margin: "0 0 8px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Total Staked</p>
          <p style={{ fontSize: 26, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.04em" }}>{STATS.totalStaked.toFixed(1)}<span style={{ color: T.textMuted, fontSize: 14, fontWeight: 500, marginLeft: 4 }}>Quai</span></p>
          <p style={{ fontSize: 11, color: T.textDim, margin: "4px 0 12px" }}>Across all open markets</p>
          <SparkBars data={[30, 45, 38, 60, 52, 85, 70]} color="rgba(255,255,255,0.7)" />
        </GCard>

        {/* Potential Rewards */}
        <GCard style={{ padding: "18px 20px" }}>
          <p style={{ fontSize: 11, color: T.textDim, margin: "0 0 8px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Potential Rewards</p>
          <p style={{ fontSize: 26, fontWeight: 800, color: T.yes, margin: 0, letterSpacing: "-0.04em" }}>{STATS.potentialRewards.toFixed(1)}<span style={{ color: T.textMuted, fontSize: 14, fontWeight: 500, marginLeft: 4 }}>Quai</span></p>
          <p style={{ fontSize: 11, color: T.textDim, margin: "4px 0 10px" }}>Estimated if correct</p>
          <Pill positive>+{((STATS.potentialRewards / STATS.totalStaked) * 100).toFixed(0)}% ROI est.</Pill>
        </GCard>

        {/* Accuracy */}
        <GCard style={{ padding: "18px 20px" }}>
          <p style={{ fontSize: 11, color: T.textDim, margin: "0 0 8px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Accuracy Rate</p>
          <p style={{ fontSize: 26, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.04em" }}>{STATS.accuracy}<span style={{ color: T.textMuted, fontSize: 18 }}>%</span></p>
          <p style={{ fontSize: 11, color: T.textDim, margin: "4px 0 10px" }}>{STATS.marketsWon} correct / {STATS.marketsTotal} total</p>
          <div style={{ height: 4, borderRadius: 2, background: T.border }}>
            <div style={{ width: `${STATS.accuracy}%`, height: "100%", borderRadius: 2, background: `linear-gradient(90deg, ${T.yes}, rgba(34,197,94,0.6))` }} />
          </div>
        </GCard>
      </div>

      {/* ── SECONDARY STATS ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }} className="dash-sec-grid">

        {/* Weekly P&L */}
        <GCard style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: STATS.weeklyPnl >= 0 ? T.yesBg : T.noBg, border: `1px solid ${STATS.weeklyPnl >= 0 ? T.yesBorder : T.noBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {STATS.weeklyPnl >= 0 ? <TrendingUp size={18} strokeWidth={2} style={{ color: T.yes }} /> : <TrendingDown size={18} strokeWidth={2} style={{ color: T.no }} />}
          </div>
          <div>
            <p style={{ fontSize: 10, color: T.textDim, margin: "0 0 2px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Weekly P&amp;L</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: STATS.weeklyPnl >= 0 ? T.yes : T.no, margin: 0, letterSpacing: "-0.03em" }}>{STATS.weeklyPnl >= 0 ? "+" : ""}{STATS.weeklyPnl} Quai</p>
          </div>
        </GCard>

        {/* All-time earned */}
        <GCard style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Gift size={18} strokeWidth={1.8} style={{ color: T.textPrimary }} />
          </div>
          <div>
            <p style={{ fontSize: 10, color: T.textDim, margin: "0 0 2px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>All-Time Earned</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>{STATS.allTimeEarned.toFixed(1)} Quai</p>
          </div>
        </GCard>

        {/* Switch once reminder */}
        <GCard style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ArrowLeftRight size={18} strokeWidth={1.8} style={{ color: T.textPrimary }} />
          </div>
          <div>
            <p style={{ fontSize: 10, color: T.textDim, margin: "0 0 2px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Switch Remaining</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>1 available</p>
          </div>
        </GCard>
      </div>

      {/* ── MAIN 2-COL ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }} className="dash-main-grid">

        {/* LEFT: featured market + today's questions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Featured market */}
          <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 18,
            overflow: "hidden",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.5)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
          >
            {/* Featured label row */}
            <div style={{ padding: "10px 18px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.yes, boxShadow: `0 0 6px ${T.yes}`, flexShrink: 0 }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: T.textDim, textTransform: "uppercase" }}>Featured Market</span>
              </div>
              <span style={{ fontSize: 11, color: T.textDim, display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={10} strokeWidth={2} /> {featured.closes}
              </span>
            </div>

            {/* Card info */}
            <div style={{ padding: "12px 18px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <CategoryBadge category={featured.category} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.45 }}>{featured.question}</p>
              <p style={{ fontSize: 11, color: T.textDim, margin: 0 }}>
                Pool: <span style={{ color: T.textMuted, fontWeight: 600 }}>${featured.totalPool.toLocaleString()}</span>
              </p>
            </div>

            {/* Galaxy YES / NO */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: `1px solid ${T.border}` }}>
              <GalaxyBtn side="YES" onClick={() => onOpenQuestion(featured.id)} />
              <GalaxyBtn side="NO"  onClick={() => onOpenQuestion(featured.id)} hasBorderLeft />
            </div>
          </div>

          {/* Performance chart */}
          <GCard style={{ padding: "18px 20px" }}>
            <SectionHeading>Performance — Last 7 Markets</SectionHeading>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, marginBottom: 8 }}>
              {PORTFOLIO_BARS.map((v, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: "100%", borderRadius: 4, height: `${v}%`, background: v >= 70 ? `linear-gradient(180deg, ${T.yes}, rgba(34,197,94,0.4))` : `linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.15))` }} />
                  <span style={{ fontSize: 9, color: T.textDim }}>{["M1","M2","M3","M4","M5","M6","M7"][i]}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontSize: 11, color: T.textDim, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: T.yes, display: "inline-block" }} /> Win (≥70%)
              </span>
              <span style={{ fontSize: 11, color: T.textDim, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: "rgba(255,255,255,0.4)", display: "inline-block" }} /> Loss (&lt;70%)
              </span>
            </div>
          </GCard>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Quick actions */}
          <GCard style={{ padding: "16px" }}>
            <SectionHeading>Quick Actions</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Browse Markets",    icon: HelpCircle,  key: "questions",   desc: "Answer today's questions" },
                { label: "My Convictions",    icon: BookMarked,  key: "convictions", desc: "Track open positions"     },
                { label: "Claim Rewards",     icon: Gift,        key: "rewards",     desc: `${STATS.potentialRewards.toFixed(1)} Quai pending` },
                { label: "Leaderboard",       icon: Trophy,      key: "leaderboard", desc: "See top predictors"       },
              ].map(({ label, icon: Icon, key, desc }) => (
                <button key={key} type="button" onClick={() => onNavigate(key)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: T.glass, border: `1px solid ${T.border}`, cursor: "pointer", textAlign: "left", transition: "border-color 0.15s, background 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.background = T.glassHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.glass; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: T.accentDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={14} strokeWidth={1.8} style={{ color: T.textPrimary }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, margin: 0, letterSpacing: "-0.01em" }}>{label}</p>
                    <p style={{ fontSize: 10, color: T.textDim, margin: 0 }}>{desc}</p>
                  </div>
                  <ChevronRight size={13} style={{ color: T.textDim, marginLeft: "auto", flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </GCard>

          {/* Activity feed */}
          <GCard style={{ padding: "16px" }}>
            <SectionHeading>Activity Feed</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {ACTIVITY.map((a, i) => {
                const isReward = a.type === "reward";
                const isSwitch = a.type === "switch";
                return (
                  <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 0", borderBottom: i < ACTIVITY.length - 1 ? `1px solid ${T.border}` : "none" }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: isReward ? T.yesBg : isSwitch ? T.violetBg : T.glass, border: `1px solid ${isReward ? T.yesBorder : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      {isReward ? <Gift size={13} strokeWidth={1.8} style={{ color: T.yes }} />
                        : isSwitch ? <ArrowLeftRight size={13} strokeWidth={1.8} style={{ color: T.violet }} />
                        : <WalletCards size={13} strokeWidth={1.8} style={{ color: T.textMuted }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary, margin: 0, letterSpacing: "-0.01em" }}>{a.label}</p>
                      <p style={{ fontSize: 10, color: T.textDim, margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.detail}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: isReward ? T.yes : T.textMuted, margin: 0 }}>{a.amount}</p>
                      <p style={{ fontSize: 10, color: T.textDim, margin: "1px 0 0" }}>{a.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </GCard>

          {/* Trust / platform stats */}
          <GCard style={{ padding: "16px" }}>
            <SectionHeading>Platform</SectionHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { icon: ShieldCheck, label: "Fair & Transparent", sub: "Decentralised resolution" },
                { icon: Globe,       label: "Quai Network",       sub: "On-chain settlement"      },
                { icon: Award,       label: "Top 3 Predictor",    sub: "This week's leaderboard"  },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon size={14} strokeWidth={1.8} style={{ color: T.textMuted, flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary, margin: 0 }}>{label}</p>
                    <p style={{ fontSize: 10, color: T.textDim, margin: 0 }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </GCard>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   PAGE: QUESTIONS
════════════════════════════════════════════════ */

function PageQuestions({ onOpenQuestion }) {
  const [active, setActive]       = useState("all");
  const [dropOpen, setDropOpen]   = useState(false);

  const filtered = active === "all"
    ? QUESTIONS
    : QUESTIONS.filter(q => q.category.toLowerCase().includes(active));

  const activeLabel = CATEGORIES.find(c => c.key === active)?.label ?? "All Categories";
  const activeEmoji = CATEGORIES.find(c => c.key === active)?.emoji ?? "🌐";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>Questions</h1>
          <p style={{ fontSize: 13, color: T.textMuted, margin: "4px 0 0" }}>Pick a side. Stake your conviction. Earn rewards.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>

          {/* Progress stat chip */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}` }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <CheckCircle2 size={16} strokeWidth={2} style={{ color: T.yes }} />
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {STATS.todayAnswered}<span style={{ color: T.textDim, fontSize: 13, fontWeight: 500 }}>/{STATS.todayTotal}</span>
              </p>
              <p style={{ fontSize: 10, color: T.textDim, margin: "2px 0 0", letterSpacing: "0.04em", textTransform: "uppercase" }}>Answered Today</p>
            </div>
          </div>

          {/* ── Category dropdown ── */}
          <div style={{ position: "relative" }}>
            <button type="button" onClick={() => setDropOpen(v => !v)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 14px", borderRadius: 10,
                background: dropOpen ? T.glassHover : T.glass,
                border: `1px solid ${dropOpen ? T.borderHover : T.border}`,
                color: "#ffffff", fontSize: 13, fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                minWidth: 170,
              }}
            >
              <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{activeEmoji}</span>
              <span style={{ flex: 1, textAlign: "left" }}>{activeLabel}</span>
              <ChevronDown size={14} strokeWidth={2.5} style={{ color: T.textDim, flexShrink: 0, transform: dropOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>

            {dropOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 99,
                background: "#111111", border: `1px solid ${T.borderHover}`,
                borderRadius: 12, overflow: "hidden",
                boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
                minWidth: 200,
              }}>
                {CATEGORIES.map((c, i) => {
                  const isActive = active === c.key;
                  return (
                    <button key={c.key} type="button"
                      onClick={() => { setActive(c.key); setDropOpen(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "10px 14px",
                        background: isActive ? "rgba(255,255,255,0.07)" : "transparent",
                        border: "none",
                        borderBottom: i < CATEGORIES.length - 1 ? `1px solid ${T.border}` : "none",
                        color: isActive ? "#ffffff" : T.textMuted,
                        fontSize: 13, fontWeight: isActive ? 700 : 400,
                        cursor: "pointer", textAlign: "left",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = T.glass; }}
                      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: 15, lineHeight: 1, width: 20, textAlign: "center", flexShrink: 0 }}>{c.emoji}</span>
                      <span style={{ flex: 1 }}>{c.label}</span>
                      {isActive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffffff", flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Question grid: 3 col large / 2 medium / 1 small ── */}
      <div>
        <div className="q-grid">
          {filtered.map(q => (
            <QuestionCard key={q.id} q={q} onOpen={onOpenQuestion} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Single question card with galaxy YES/NO buttons ── */
function QuestionCard({ q, onOpen }) {
  return (
    <div style={{
      backgroundColor: "#0d0d0d",
      backgroundImage: "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 70%), radial-gradient(circle, rgba(255,255,255,0.26) 1px, transparent 1px)",
      backgroundSize: "auto, 32px 32px",
      backgroundPosition: "center top, 0 0",
      border: `1px solid ${T.border}`,
      borderRadius: 18,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      transition: "border-color 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.5)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border;      e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* Card info */}
      <div style={{ padding: "18px 18px 14px", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <CategoryBadge category={q.category} />
          <span style={{ fontSize: 11, color: T.textDim, display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={10} strokeWidth={2} />{q.closes}
          </span>
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.45 }}>{q.question}</p>
        <p style={{ fontSize: 11, color: T.textDim, margin: 0 }}>
          Pool: <span style={{ color: T.textMuted, fontWeight: 600 }}>${q.totalPool.toLocaleString()}</span>
        </p>
      </div>

      {/* Galaxy YES / NO buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: `1px solid ${T.border}` }}>
        <GalaxyBtn side="YES" onClick={() => onOpen(q.id)} />
        <GalaxyBtn side="NO"  onClick={() => onOpen(q.id)} hasBorderLeft />
      </div>
    </div>
  );
}
function GalaxyBtn({ side, onClick, hasBorderLeft }) {
  const isYes  = side === "YES";
  const col    = isYes ? "#22c55e" : "#ef4444";
  const colA   = isYes ? "rgba(34,197,94," : "rgba(239,68,68,";
  const animCls= isYes ? "galaxy-yes" : "galaxy-no";

  return (
    <button type="button" onClick={onClick}
      className={animCls}
      style={{
        position: "relative",
        padding: "18px 10px",
        border: "none",
        borderLeft: hasBorderLeft ? `1px solid ${T.border}` : "none",
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        background: isYes ? `${colA}0.05)` : `${colA}0.05)`,
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = `${colA}0.14)`; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = `${colA}0.05)`; }}
    >
      {/* Animated nebula bg */}
      <div className={`${animCls}-nebula`} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5 }} />

      {/* Pulsing ring */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 0,
        boxShadow: `inset 0 0 0 1px ${colA}0.25)`,
        pointerEvents: "none",
      }} />

      {/* Label */}
      <span style={{ fontSize: 16, fontWeight: 900, color: col, letterSpacing: "0.06em", position: "relative", zIndex: 1, textShadow: `0 0 12px ${colA}0.8)` }}>{side}</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: `${colA}0.6)`, position: "relative", zIndex: 1 }}>
        {isYes ? "Believe it" : "Doubt it"}
      </span>
    </button>
  );
}

/* ════════════════════════════════════════════════
   CONFETTI CELEBRATION
════════════════════════════════════════════════ */

const CONFETTI_COLORS = [
  "#22c55e","#16a34a","#ef4444","#dc2626",
  "#ffffff","#a3e635","#facc15","#38bdf8",
  "#f472b6","#c084fc","#fb923c","#ff6eb4","#ffd700",
];

/* Petal SVG shapes — inline base64-encoded so no external deps needed */
const PETAL_SHAPES = ["50%", "50% 0 50% 50%", "0 50% 50% 50%", "50% 50% 0 50%", "2px", "4px 0 4px 0"];

function Confetti({ active, containerRef }) {
  if (!active) return null;

  const particles = Array.from({ length: 72 }, (_, i) => ({
    id: i,
    left:    `${Math.random() * 100}%`,
    width:   5 + Math.random() * 9,
    height:  (Math.random() > 0.4 ? 1 : 0.55) * (5 + Math.random() * 9),
    color:   CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay:   `${Math.random() * 1.4}s`,
    dur:     `${2.4 + Math.random() * 1.2}s`,
    rot:     Math.random() > 0.5 ? "540deg" : "-540deg",
    shape:   PETAL_SHAPES[Math.floor(Math.random() * PETAL_SHAPES.length)],
    drift:   `${(Math.random() - 0.5) * 140}px`,
    opacity: 0.75 + Math.random() * 0.25,
  }));

  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0, right: 0,
      height: "100%",
      pointerEvents: "none",
      zIndex: 9999,
      overflow: "hidden",
    }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute",
          top: "-20px",
          left: p.left,
          width:  p.width,
          height: p.height,
          borderRadius: p.shape,
          background: p.color,
          opacity: 0,
          animation: `confetti-fall ${p.dur} ${p.delay} ease-in forwards`,
          "--drift": p.drift,
          "--rot":   p.rot,
        }} />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════
   PAGE: QUESTION DETAIL
════════════════════════════════════════════════ */

const DETAIL_TABS = ["About", "How It Resolves", "Rules"];

function PageQuestionDetail({ questionId, onBack, onConfetti }) {
  const [tab, setTab]           = useState("About");
  const [selected, setSelected] = useState(null);
  const [usdcAmount, setUsdcAmount] = useState("");
  const [confirmed, setConfirmed]   = useState(false);

  const q = QUESTIONS.find(item => item.id === questionId) ?? QUESTIONS[0];

  const RATE = 0.82;
  const quaiEquiv = usdcAmount ? (parseFloat(usdcAmount) * RATE).toFixed(4) : null;

  const handleSelect = (side) => {
    setSelected(side);
    setUsdcAmount("");
    setConfirmed(false);
  };

  const handleConfirm = () => {
    if (!usdcAmount || parseFloat(usdcAmount) <= 0) return;
    setConfirmed(true);
    if (onConfetti) onConfetti();
  };

  const handleReset = () => {
    setSelected(null);
    setUsdcAmount("");
    setConfirmed(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button type="button" onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: T.textMuted, background: "none", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = T.textPrimary; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; }}
        >
          <ArrowLeft size={15} strokeWidth={2} /> Back to Questions
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CategoryBadge category={q.category} />
          <button type="button" style={{ width: 32, height: 32, borderRadius: 6, background: T.glass, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted, cursor: "pointer" }}>
            <Share2 size={13} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 16, alignItems: "start" }} className="dash-detail-grid">

        {/* ── LEFT: question info + tabs ── */}
        <GCard style={{ padding: "28px" }}>
          {/* Question */}
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", margin: "0 0 10px", letterSpacing: "-0.03em", lineHeight: 1.35 }}>{q.question}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: T.textDim, marginBottom: 24 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} strokeWidth={1.8} /> Closes in {q.closes}</span>
            <span style={{ width: 1, height: 12, background: T.border }} />
            <span>Total Pool: <span style={{ color: T.textMuted, fontWeight: 600 }}>${q.totalPool.toLocaleString()}</span></span>
          </div>

          {/* Switch policy */}
          <div style={{ padding: "14px 16px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, marginBottom: 20 }}>
            <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: T.textPrimary, margin: "0 0 8px" }}>
              <CheckCircle2 size={13} strokeWidth={2} style={{ color: T.textMuted }} /> Switch Policy
            </p>
            {["You may switch your position once.", "Switch only if ≥ 5 minutes remain.", "Your stake moves to the new side.", "No further switches after that."].map(r => (
              <p key={r} style={{ fontSize: 12, color: T.textMuted, margin: "3px 0 0" }}>· {r}</p>
            ))}
          </div>

          {/* Info tabs */}
          <div style={{ display: "flex", gap: 2, borderBottom: `1px solid ${T.border}` }}>
            {DETAIL_TABS.map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                style={{ padding: "8px 14px 10px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: tab === t ? "#ffffff" : T.textMuted, borderBottom: tab === t ? "2px solid #ffffff" : "2px solid transparent", marginBottom: -1 }}>
                {t}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12, padding: "12px 14px", borderRadius: 8, background: T.glass, fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>
            {tab === "About"          && <p style={{ margin: 0 }}>{q.resolves   || "This market resolves based on the real-world outcome of the stated question."}</p>}
            {tab === "How It Resolves"&& <p style={{ margin: 0 }}>{q.resolution || "Resolution will be based on official announcements from verified sources."}</p>}
            {tab === "Rules"          && <p style={{ margin: 0 }}>Standard Q4 market rules apply. Stakes are final once the market closes and cannot be withdrawn.</p>}
          </div>
        </GCard>

        {/* ── RIGHT: staking card ── */}
        <GCard style={{ padding: "28px", position: "sticky", top: 80 }}>

          {!confirmed ? (
            <>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" }}>Your Conviction</p>

              {/* YES / NO buttons */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
                {["YES", "NO"].map(side => {
                  const isActive = selected === side;
                  const isYes = side === "YES";
                  const col  = isYes ? "#22c55e" : "#ef4444";
                  const colB = isYes ? "rgba(34,197,94,0.18)"  : "rgba(239,68,68,0.18)";
                  const colD = isYes ? "rgba(34,197,94,0.45)"  : "rgba(239,68,68,0.45)";
                  const glow = isYes ? "rgba(34,197,94,0.35)"  : "rgba(239,68,68,0.35)";
                  return (
                    <button
                      key={side}
                      type="button"
                      onClick={() => handleSelect(side)}
                      className={isActive ? `stake-btn-active-${side.toLowerCase()}` : ""}
                      style={{
                        padding: "20px 10px",
                        borderRadius: 14,
                        border: isActive ? `2px solid ${col}` : `1px solid ${isYes ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                        background: isActive ? colB : isYes ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
                        color: col,
                        fontSize: 22,
                        fontWeight: 900,
                        letterSpacing: "0.04em",
                        cursor: "pointer",
                        transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                        boxShadow: isActive ? `0 0 28px ${glow}, 0 0 0 1px ${colD} inset` : "none",
                        transform: isActive ? "translateY(-3px) scale(1.03)" : "scale(1)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 22, fontWeight: 900, lineHeight: 1 }}>{side}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.65, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        {isYes ? "Believe it" : "Doubt it"}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Stake input — slides in when a side is selected */}
              <div style={{
                overflow: "hidden",
                maxHeight: selected ? 240 : 0,
                opacity: selected ? 1 : 0,
                transition: "max-height 0.35s ease, opacity 0.25s ease",
              }}>
                <div style={{ paddingTop: 4 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: T.textDim, margin: "0 0 8px", letterSpacing: "0.04em" }}>STAKE AMOUNT</p>

                  {/* USDC input */}
                  <div style={{ position: "relative", marginBottom: 10 }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, fontWeight: 700, color: T.textMuted }}>$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={usdcAmount}
                      onChange={(e) => setUsdcAmount(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "13px 14px 13px 26px",
                        background: T.glass,
                        border: `1px solid ${T.border}`,
                        borderRadius: 10,
                        color: "#ffffff",
                        fontSize: 20,
                        fontWeight: 800,
                        outline: "none",
                        boxSizing: "border-box",
                        letterSpacing: "-0.02em",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = T.borderHover; }}
                      onBlur={(e)  => { e.target.style.borderColor = T.border; }}
                    />
                    <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 700, color: T.textDim }}>USDC</span>
                  </div>

                  {/* Quai equivalent */}
                  <div style={{ padding: "10px 14px", borderRadius: 8, background: T.glass, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontSize: 12, color: T.textDim }}>≈ Quai equivalent</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: quaiEquiv ? "#ffffff" : T.textDim, letterSpacing: "-0.02em" }}>
                      {quaiEquiv ?? "—"} <span style={{ fontSize: 11, fontWeight: 500, color: T.textDim }}>QUAI</span>
                    </span>
                  </div>

                  {/* Confirm button */}
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!usdcAmount || parseFloat(usdcAmount) <= 0}
                    style={{
                      width: "100%",
                      padding: "13px",
                      borderRadius: 10,
                      border: "none",
                      background: selected === "YES"
                        ? (usdcAmount && parseFloat(usdcAmount) > 0 ? T.yes : "rgba(34,197,94,0.3)")
                        : (usdcAmount && parseFloat(usdcAmount) > 0 ? T.no  : "rgba(239,68,68,0.3)"),
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: usdcAmount && parseFloat(usdcAmount) > 0 ? "pointer" : "not-allowed",
                      letterSpacing: "-0.01em",
                      transition: "background 0.2s",
                    }}
                  >
                    Confirm {selected} · ${usdcAmount || "0.00"} USDC
                  </button>

                  <p style={{ fontSize: 10, color: T.textDim, textAlign: "center", margin: "10px 0 0", lineHeight: 1.5 }}>
                    Rate: 1 USDC = {RATE} QUAI · Stake is final on confirmation
                  </p>
                </div>
              </div>

              {/* Prompt when nothing selected yet */}
              {!selected && (
                <p style={{ fontSize: 13, color: T.textDim, textAlign: "center", margin: "4px 0 0", lineHeight: 1.6 }}>
                  Choose YES or NO to stake your conviction.
                </p>
              )}
            </>
          ) : (
            /* ── Confirmed / celebration state ── */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, padding: "16px 0" }}>
              {/* Big animated check */}
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: `radial-gradient(circle, ${selected === "YES" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"} 0%, transparent 70%)`,
                border: `2px solid ${selected === "YES" ? T.yes : T.no}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 32px ${selected === "YES" ? "rgba(34,197,94,0.45)" : "rgba(239,68,68,0.45)"}`,
                animation: "pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
              }}>
                <CheckCircle2 size={36} strokeWidth={2} style={{ color: selected === "YES" ? T.yes : T.no }} />
              </div>

              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", margin: "0 0 6px", letterSpacing: "-0.03em" }}>
                  🎉 Position Confirmed!
                </p>
                <p style={{ fontSize: 13, color: T.textMuted, margin: "0 0 4px" }}>
                  You staked <span style={{ color: "#ffffff", fontWeight: 700 }}>${usdcAmount} USDC</span> on{" "}
                  <span style={{ color: selected === "YES" ? T.yes : T.no, fontWeight: 800 }}>{selected}</span>
                </p>
                <p style={{ fontSize: 12, color: T.textDim, margin: 0 }}>{quaiEquiv} QUAI locked in</p>
              </div>

              {/* Summary row */}
              <div style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ padding: "10px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, textAlign: "center" }}>
                  <p style={{ fontSize: 10, color: T.textDim, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Side</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: selected === "YES" ? T.yes : T.no, margin: 0 }}>{selected}</p>
                </div>
                <div style={{ padding: "10px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, textAlign: "center" }}>
                  <p style={{ fontSize: 10, color: T.textDim, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Staked</p>
                  <p style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", margin: 0 }}>${usdcAmount}</p>
                </div>
              </div>

              <button type="button" onClick={handleReset}
                style={{ width: "100%", padding: "12px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.textPrimary; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
              >
                View Another Market
              </button>
            </div>
          )}
        </GCard>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   PAGE: MY CONVICTIONS
════════════════════════════════════════════════ */

const CONV_TABS = ["Open", "Resolved", "Cancelled"];

function PageMyConvictions() {
  const [tab, setTab] = useState("Open");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>My Convictions</h1>
        <p style={{ fontSize: 13, color: T.textMuted, margin: "4px 0 0" }}>Track your answers, switches, and performance.</p>
      </div>

      <div style={{ display: "flex", gap: 4, padding: 4, background: T.glass, border: `1px solid ${T.border}`, borderRadius: 8, width: "fit-content" }}>
        {CONV_TABS.map(t => (
          <button key={t} type="button" onClick={() => setTab(t)}
            style={{ padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: tab === t ? "#ffffff" : "transparent", color: tab === t ? "#080808" : T.textMuted, transition: "all 0.15s" }}>
            {t}
          </button>
        ))}
      </div>

      <GCard style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 720, borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {["Question","Category","Answer","Staked","Side %","Pool","Switched","Status"].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: T.textDim, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tab === "Open" ? CONVICTIONS.map((c, i) => (
                <tr key={i} style={{ borderBottom: i < CONVICTIONS.length - 1 ? `1px solid ${T.border}` : "none" }}>
                  <td style={{ padding: "13px 16px", maxWidth: 220, color: T.textPrimary, fontWeight: 500, lineHeight: 1.3 }}>{c.question}</td>
                  <td style={{ padding: "13px 16px", whiteSpace: "nowrap" }}><CategoryBadge category={c.category} /></td>
                  <td style={{ padding: "13px 16px" }}><span style={{ padding: "3px 9px", borderRadius: 4, background: T.yesBg, color: T.yes, fontSize: 11, fontWeight: 700 }}>{c.answer}</span></td>
                  <td style={{ padding: "13px 16px", fontWeight: 600, color: T.textPrimary, whiteSpace: "nowrap" }}>{c.staked.toFixed(2)} Quai</td>
                  <td style={{ padding: "13px 16px", fontWeight: 700, color: T.yes }}>{c.side}%</td>
                  <td style={{ padding: "13px 16px", color: T.textMuted, whiteSpace: "nowrap" }}>${c.totalPool.toLocaleString()}</td>
                  <td style={{ padding: "13px 16px", color: T.textMuted, fontSize: 12 }}>{c.switched}</td>
                  <td style={{ padding: "13px 16px" }}><span style={{ padding: "3px 10px", borderRadius: 999, background: T.glass, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 11, fontWeight: 600 }}>{c.status}</span></td>
                </tr>
              )) : (
                <tr><td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", color: T.textDim, fontSize: 13 }}>No {tab.toLowerCase()} convictions yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10 }} className="dash-conv-grid">
        {[
          { label: "Total Markets",      value: 47 },
          { label: "Correct",            value: 32,   accent: T.yes },
          { label: "Accuracy",           value: "68%",accent: T.yes },
          { label: "Total Staked",       value: "85.4 Quai" },
          { label: "Potential Rewards",  value: "24.8 Quai", accent: T.yes },
        ].map(({ label, value, accent }) => (
          <GCard key={label} style={{ padding: "14px 16px", textAlign: "center" }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: accent || T.textPrimary, margin: "0 0 4px", letterSpacing: "-0.03em" }}>{value}</p>
            <p style={{ fontSize: 10, color: T.textDim, margin: 0, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</p>
          </GCard>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderRadius: 8, background: T.glass, border: `1px solid ${T.border}`, fontSize: 12, color: T.textMuted }}>
        <Info size={13} strokeWidth={1.8} style={{ flexShrink: 0 }} />
        Switch once per game only — minimum 5 minutes must remain before market close.
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   PAGE: HOW IT WORKS
════════════════════════════════════════════════ */

function PageHowItWorks({ onNavigate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>How Q4 Works</h1>
        <p style={{ fontSize: 13, color: T.textMuted, margin: "4px 0 0" }}>A simple process built on economic conviction.</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }} className="dash-how-grid">
        {HOW_IT_WORKS.map(s => (
          <GCard key={s.step} style={{ padding: 18 }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 8, background: T.accentDim, fontSize: 11, fontWeight: 800, color: "#ffffff", marginBottom: 12 }}>{s.step}</span>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", margin: "0 0 6px", letterSpacing: "-0.01em" }}>{s.title}</h3>
            <p style={{ fontSize: 11, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
          </GCard>
        ))}
      </div>
      <GCard style={{ padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trophy size={20} strokeWidth={1.8} style={{ color: "#fbbf24" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", margin: 0, letterSpacing: "-0.02em" }}>Q4 measures economic conviction, not popularity.</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: "2px 0 0" }}>Your belief has power. Make it count.</p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate("questions")}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 6, background: "#ffffff", color: "#080808", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", flexShrink: 0 }}>
          Start Predicting <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      </GCard>
    </div>
  );
}

/* ════════════════════════════════════════════════
   PAGE: PROFILE
════════════════════════════════════════════════ */

function PageProfile({ user, onLogout }) {
  const joinDate = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";
  const initials = user?.displayName
    ? user.displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "Q4";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 600 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>Profile</h1>
        <p style={{ fontSize: 13, color: T.textMuted, margin: "4px 0 0" }}>Your account details.</p>
      </div>

      {/* Avatar + name card */}
      <GCard style={{ padding: "28px 24px", display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "2px solid rgba(255,255,255,0.15)" }}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt={user.displayName ?? "avatar"} style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#ffffff,rgba(255,255,255,0.4))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#080808" }}>
              {initials}
            </div>
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>
            {user?.displayName ?? "Q4 User"}
          </p>
          <p style={{ fontSize: 13, color: T.textMuted, margin: "3px 0 0" }}>{user?.email ?? "—"}</p>
          <p style={{ fontSize: 11, color: T.textDim, margin: "6px 0 0" }}>Member since {joinDate}</p>
        </div>
      </GCard>

      {/* Account info rows */}
      <GCard style={{ padding: "0 24px" }}>
        {[
          { label: "Display Name", value: user?.displayName ?? "—",  icon: User  },
          { label: "Email",        value: user?.email ?? "—",         icon: Mail  },
          { label: "Provider",     value: "Google",                   icon: ShieldCheck },
          { label: "Account ID",   value: user?.uid ? `${user.uid.slice(0, 16)}…` : "—", icon: Info },
        ].map(({ label, value, icon: Icon }, i, arr) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: T.glass, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={14} strokeWidth={1.8} style={{ color: T.textMuted }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, color: T.textDim, margin: 0, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</p>
              <p style={{ fontSize: 13, color: T.textPrimary, margin: "2px 0 0", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</p>
            </div>
          </div>
        ))}
      </GCard>

      {/* Sign out */}
      <button
        type="button"
        onClick={onLogout}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 18px", borderRadius: 10, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "background 0.15s, border-color 0.15s", width: "fit-content" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.14)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.07)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)"; }}
      >
        <LogOut size={15} strokeWidth={2} /> Sign Out
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════
   PAGE: COMING SOON
════════════════════════════════════════════════ */

function ComingSoon({ page }) {
  const meta = {
    results:     { title: "Results",     icon: BarChart3   },
    leaderboard: { title: "Leaderboard", icon: Trophy      },
    rewards:     { title: "Rewards",     icon: Gift        },
    wallet:      { title: "Wallet",      icon: WalletCards },
    profile:     { title: "Profile",     icon: User        },
  };
  const { title, icon: Icon } = meta[page] || { title: page, icon: BarChart3 };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, textAlign: "center" }}>
      <div style={{ width: 64, height: 64, borderRadius: 18, background: T.glass, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={28} strokeWidth={1.3} style={{ color: T.textDim }} />
      </div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>{title}</h1>
      <p style={{ fontSize: 13, color: T.textMuted, margin: 0, maxWidth: 340 }}>This section is coming soon. Check back after your next conviction.</p>
    </div>
  );
}

/* ════════════════════════════════════════════════
   ROOT — DashboardPage
════════════════════════════════════════════════ */

export default function DashboardPage() {
  const [page, setPage] = useState("dashboard");
  const [selectedQ, setSelectedQ] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleNavigate = (key) => { setSelectedQ(null); setPage(key); setMobileSidebarOpen(false); };
  const handleOpenQ    = (id)  => { setSelectedQ(id); setPage("question-detail"); setMobileSidebarOpen(false); };
  const handleLogout   = async () => { await logout(); navigate("/"); };
  const handleConfettiTrigger = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3500);
  };

  const activeNav = page === "question-detail" ? "questions" : page;
  const pageLabelMap = {
    dashboard: "Dashboard", questions: "Questions", "question-detail": "Market Detail",
    convictions: "My Convictions", results: "Results", leaderboard: "Leaderboard",
    rewards: "Rewards", how: "How It Works", wallet: "Wallet", profile: "Profile",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg, color: T.textPrimary, fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif" }}>

      {/* ── Fixed sidebar desktop ── */}
      <div className="dash-sidebar-desktop">
        <Sidebar active={activeNav} onNavigate={handleNavigate} onLogout={handleLogout} />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebarOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50 }} className="dash-mobile-only">
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)" }} onClick={() => setMobileSidebarOpen(false)} />
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 240, zIndex: 51 }}>
            <Sidebar active={activeNav} onNavigate={handleNavigate} onLogout={handleLogout} />
            <button type="button" onClick={() => setMobileSidebarOpen(false)}
              style={{ position: "absolute", top: 12, right: 12, background: "transparent", border: "none", color: T.textMuted, cursor: "pointer" }}>
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", marginLeft: 240, minHeight: "100vh" }} className="dash-main-area">
        <TopHeader pageLabel={pageLabelMap[page] || page} onOpenMobileSidebar={() => setMobileSidebarOpen(true)} onNavigate={handleNavigate} user={user} />

        <main style={{ flex: 1, overflowY: "auto", padding: "28px 28px 48px", position: "relative" }}>
          <Confetti active={showConfetti} />
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            {page === "dashboard"       && <PageDashboard onOpenQuestion={handleOpenQ} onNavigate={handleNavigate} />}
            {page === "questions"       && <PageQuestions onOpenQuestion={handleOpenQ} />}
            {page === "question-detail" && <PageQuestionDetail questionId={selectedQ} onBack={() => handleNavigate("questions")} onConfetti={handleConfettiTrigger} />}
            {page === "convictions"     && <PageMyConvictions />}
            {page === "how"             && <PageHowItWorks onNavigate={handleNavigate} />}
            {page === "wallet"          && <ComingSoon page="wallet" />}
            {page === "profile"         && <PageProfile user={user} onLogout={handleLogout} />}
            {(page === "results" || page === "leaderboard" || page === "rewards") && <ComingSoon page={page} />}
          </div>
        </main>
      </div>
    </div>
  );
}
