/**
 * DashboardPage.jsx — Q4 Futuristic Dashboard
 * Dark theme · Glassmorphism · Fixed sidebar + header · Scrollable main
 * Matches landing page aesthetic: #080808 base, dot-grid, white accents
 * URL-driven: /dashboard/:section — each sidebar item is its own route
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  LayoutGrid, HelpCircle, BookMarked, BarChart3, Trophy,
  Gift, Info, Clock, ArrowLeft, Share2, Check, Copy,
  CheckCircle2, RefreshCcw, ChevronRight, ChevronDown, ArrowRight,
  Menu, X, TrendingUp, TrendingDown, WalletCards,
  ShieldCheck, Globe, Award, LogOut, Bell, ArrowLeftRight,
  User, Mail, TwitterX, Telegram,
  Medal, Flame, Lock2, Target, Percent, Lightbulb, Zap, Star, Coins,
  Users, PieChart, Sparkles, ExternalLink, RefreshCw,
} from "../components/icons";
import { Q4Logo, QuaiLogo }   from "../components/icons";
import { useAuth }  from "../context/AuthContext";
import { useWallet } from "../context/WalletContext";
import { useQuaiPrice, useNewsFeed, useBlipLeaderboard } from "../services/useBlipPay";
import { useMarkets, useMarket } from "../hooks/useMarkets";
import { usePositions }          from "../hooks/usePositions";
import { useNotifications }      from "../hooks/useNotifications";
import { useResults }            from "../hooks/useResults";
import { useRewards }            from "../hooks/useRewards";
import { useAdminUsers, useAdminMarkets, useAdminStats, useAdminOracle, useAdminEvents, useAdminPositions } from "../hooks/useAdminData";
import { supabase, getFirebaseUID } from "../lib/supabase";
import { onChainPredict }            from "../lib/contractService";
import { getDemoMode, useDemoModeContext } from "../hooks/useDemoMode";
import { demoStake }                 from "../data/demoStore";
import WalletPage   from "./WalletPage";
import { Sk }       from "../components/Skeleton";

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
   DATA — Static UI config only
   All market/user data comes from the smart contract
   and Supabase via hooks (not yet wired in MVP).
════════════════════════════════════════════════ */

const CATEGORIES = [
  { key: "all",     label: "All Categories", emoji: "🌐" },
  { key: "crypto",  label: "Crypto",         emoji: "₿"  },
  { key: "sports",  label: "Sports",         emoji: "⚽" },
  { key: "weather", label: "Weather",        emoji: "🌤️" },
  { key: "stocks",  label: "Stocks",         emoji: "📈" },
];

const CAT_STYLE = {
  Crypto:  { color: "#fbbf24", bg: "rgba(251,191,36,0.12)"  },
  Sports:  { color: "#fb923c", bg: "rgba(251,146,60,0.12)"  },
  Weather: { color: "#38bdf8", bg: "rgba(56,189,248,0.12)"  },
  Stocks:  { color: "#34d399", bg: "rgba(52,211,153,0.12)"  },
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

/** Time-left formatter for the market detail page */
function formatDetailTime(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60)   return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ${m % 60}m`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

/* ════════════════════════════════════════════════
   NOTIFICATION SIDEBAR
════════════════════════════════════════════════ */

const NOTIF_ICONS = {
  reward:  { icon: Gift,         color: "#22c55e", bg: "rgba(34,197,94,0.12)",   border: "rgba(34,197,94,0.25)"   },
  market:  { icon: Clock,        color: "#fbbf24", bg: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.25)"  },
  switch:  { icon: ArrowLeftRight,color: "#7c6ff7", bg: "rgba(124,111,247,0.12)",border: "rgba(124,111,247,0.25)" },
  system:  { icon: Info,         color: "#38bdf8", bg: "rgba(56,189,248,0.12)",  border: "rgba(56,189,248,0.25)"  },
};

function NotificationSidebar({ open, onClose, notifications, onMarkAllRead, onMarkRead }) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 44,
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Panel */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 360,
          zIndex: 45,
          display: "flex",
          flexDirection: "column",
          background: "rgba(10,10,10,0.97)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderLeft: `1px solid ${T.border}`,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: open ? "-16px 0 64px rgba(0,0,0,0.6)" : "none",
        }}
        aria-label="Notifications"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Bell size={16} strokeWidth={1.8} style={{ color: T.textMuted }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", letterSpacing: "-0.02em" }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                minWidth: 20, height: 20, borderRadius: 999,
                background: T.yes, color: "#000000",
                fontSize: 10, fontWeight: 800, padding: "0 5px",
              }}>
                {unreadCount}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                style={{
                  fontSize: 11, fontWeight: 600, color: T.textDim,
                  background: "none", border: "none", cursor: "pointer",
                  padding: "4px 8px", borderRadius: 4,
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = T.textPrimary; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = T.textDim; }}
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close notifications"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 28, height: 28, borderRadius: 6,
                background: T.glass, border: `1px solid ${T.border}`,
                color: T.textMuted, cursor: "pointer",
                transition: "border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.textPrimary; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {notifications.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "64px 24px", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: T.glass, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bell size={20} strokeWidth={1.4} style={{ color: T.textDim }} />
              </div>
              <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>No notifications yet.</p>
            </div>
          ) : (
            notifications.map((n, i) => {
              const meta = NOTIF_ICONS[n.type] || NOTIF_ICONS.system;
              const NIcon = meta.icon;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => onMarkRead(n.id)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    width: "100%", padding: "14px 20px",
                    background: n.read ? "transparent" : "rgba(255,255,255,0.025)",
                    border: "none",
                    borderBottom: i < notifications.length - 1 ? `1px solid ${T.border}` : "none",
                    cursor: "pointer", textAlign: "left",
                    transition: "background 0.15s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = T.glassHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? "transparent" : "rgba(255,255,255,0.025)"; }}
                >
                  {/* Unread dot */}
                  {!n.read && (
                    <span style={{
                      position: "absolute", top: 18, left: 8,
                      width: 6, height: 6, borderRadius: "50%",
                      background: T.yes, flexShrink: 0,
                    }} />
                  )}

                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: meta.bg, border: `1px solid ${meta.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginTop: 1,
                  }}>
                    <NIcon size={15} strokeWidth={1.8} style={{ color: meta.color }} />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: n.read ? 500 : 700,
                      color: n.read ? T.textMuted : T.textPrimary,
                      margin: "0 0 3px", letterSpacing: "-0.01em",
                    }}>
                      {n.title}
                    </p>
                    <p style={{ fontSize: 12, color: T.textDim, margin: 0, lineHeight: 1.5 }}>
                      {n.body}
                    </p>
                    <p style={{ fontSize: 10, color: T.textDim, margin: "5px 0 0", opacity: 0.7 }}>
                      {n.time}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 20px",
          borderTop: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          <p style={{ fontSize: 11, color: T.textDim, margin: 0, textAlign: "center" }}>
            Notifications are cleared after 30 days.
          </p>
        </div>
      </aside>
    </>
  );
}

/* ════════════════════════════════════════════════
   SIDEBAR
════════════════════════════════════════════════ */

const NAV_ITEMS = [
  { key: "dashboard",  label: "Dashboard",    icon: LayoutGrid,  desc: "Overview & stats"   },
  { key: "questions",  label: "Markets",      icon: HelpCircle,  desc: "Active markets"     },
  { key: "convictions",label: "My Positions", icon: BookMarked,  desc: "Your predictions"   },
  { key: "results",    label: "Results",      icon: BarChart3,   desc: "Market outcomes"    },
  { key: "leaderboard",label: "Leaderboard",  icon: Trophy,      desc: "Top predictors"     },
  { key: "rewards",    label: "Rewards",      icon: Gift,        desc: "Claim earnings"     },
  { key: "how",        label: "How It Works", icon: Info,        desc: "Platform guide"     },
  { key: "wallet",     label: "Wallet",       icon: WalletCards, desc: "Manage your funds"  },
  { key: "profile",    label: "Profile",      icon: User,        desc: "Account settings"   },
];

const ADMIN_NAV_ITEM = { key: "admin", label: "Admin", icon: ShieldCheck, desc: "Admin dashboard" };

function Sidebar({ active, onNavigate, onLogout }) {
  // Read isAdmin directly so it always reflects the current auth state
  const { isAdmin } = useAuth();
  const { isDemoMode, toggleMode } = useDemoModeContext();
  return (
    <aside style={{
      width: 240,
      minWidth: 240,
      height: "100%",
      minHeight: "100vh",
      position: "fixed",
      top: 0,
      left: 0,
      bottom: 0,
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

        {/* Admin — only visible to admins */}
        {isAdmin && (() => {
          const { key, label, icon: Icon, desc } = ADMIN_NAV_ITEM;
          const isActive = active === key;
          return (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(251,191,36,0.5)", letterSpacing: "0.1em", padding: "0 10px 6px", textTransform: "uppercase" }}>Admin</p>
              <button
                type="button"
                onClick={() => onNavigate(key)}
                style={{
                  display: "flex", alignItems: "center", gap: 11, width: "100%",
                  padding: "9px 10px", borderRadius: 8,
                  background: isActive ? "rgba(251,191,36,0.15)" : "transparent",
                  color: isActive ? "#fbbf24" : "rgba(251,191,36,0.7)",
                  border: isActive ? "1px solid rgba(251,191,36,0.3)" : "1px solid transparent",
                  cursor: "pointer", transition: "background 0.15s, color 0.15s, border-color 0.15s",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(251,191,36,0.08)"; e.currentTarget.style.color = "#fbbf24"; }}}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(251,191,36,0.7)"; }}}
              >
                <Icon size={16} strokeWidth={isActive ? 2.4 : 1.8} style={{ flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, margin: 0, letterSpacing: "-0.01em" }}>{label}</p>
                  <p style={{ fontSize: 10, margin: 0, opacity: 0.6 }}>{desc}</p>
                </div>
              </button>
            </div>
          );
        })()}
      </nav>

      {/* Bottom */}
      <div style={{ padding: "12px 10px 20px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        {/* ── Demo / Live mode switcher ── */}
        <div style={{ marginBottom: 8, padding: "10px 10px 10px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}` }}>
          <p style={{ margin: "0 0 8px", fontSize: 10, color: T.textDim, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>Account Mode</p>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 3, gap: 3 }}>
            <button
              type="button"
              onClick={() => { if (!isDemoMode) toggleMode(); }}
              style={{
                flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: isDemoMode ? "default" : "pointer",
                background: isDemoMode ? "rgba(255,255,255,0.12)" : "transparent",
                color: isDemoMode ? "#ffffff" : T.textMuted,
                transition: "all 0.18s",
              }}
            >
              Demo
            </button>
            <button
              type="button"
              onClick={() => { if (isDemoMode) toggleMode(); }}
              style={{
                flex: 1, padding: "6px 0", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "none", cursor: isDemoMode ? "pointer" : "default",
                background: !isDemoMode ? "rgba(34,197,94,0.18)" : "transparent",
                color: !isDemoMode ? "#22c55e" : T.textMuted,
                transition: "all 0.18s",
              }}
            >
              Live
            </button>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 10, color: T.textDim, lineHeight: 1.4 }}>
            {isDemoMode ? "Using local demo data — no real funds." : "Connected to blockchain & real data."}
          </p>
        </div>
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

function TopHeader({ pageLabel, onOpenMobileSidebar, onNavigate, user, onOpenNotifications, unreadCount }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const now = new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const firstName = user?.displayName?.split(" ")[0] ?? "there";
  const initials  = user?.displayName
    ? user.displayName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : "Q4";
  const { isDemoMode, toggleMode } = useDemoModeContext();

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

        {/* Demo / Live mode badge */}
        <button
          type="button"
          onClick={toggleMode}
          title={isDemoMode ? "Switch to Live mode" : "Switch to Demo mode"}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            border: "none", cursor: "pointer", letterSpacing: "0.04em",
            background: isDemoMode ? "rgba(234,179,8,0.15)" : "rgba(34,197,94,0.15)",
            color: isDemoMode ? "#eab308" : "#22c55e",
            transition: "all 0.18s",
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: isDemoMode ? "#eab308" : "#22c55e", flexShrink: 0 }} />
          {isDemoMode ? "DEMO" : "LIVE"}
        </button>

        {/* Notification bell */}
        <button
          type="button"
          onClick={onOpenNotifications}
          aria-label="Notifications"
          style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, background: T.glass, border: `1px solid ${T.border}`, borderRadius: 6, color: T.textMuted, cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.textPrimary; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
        >
          <Bell size={15} strokeWidth={1.8} />
          {unreadCount > 0 && (
            <span style={{ position: "absolute", top: 5, right: 5, minWidth: 8, height: 8, borderRadius: 999, background: T.yes, border: "1.5px solid #080808", fontSize: 8, fontWeight: 800, color: "#000", display: "flex", alignItems: "center", justifyContent: "center", padding: unreadCount > 9 ? "0 2px" : 0 }}>
              {unreadCount > 9 ? "9+" : ""}
            </span>
          )}
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

/* ─── shared empty-state atom ─────────────────── */
function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 24px", gap: 12, textAlign: "center" }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: T.glass, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={22} strokeWidth={1.4} style={{ color: T.textDim }} />
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: T.textMuted, margin: 0 }}>{title}</p>
      {body && <p style={{ fontSize: 12, color: T.textDim, margin: 0, maxWidth: 320, lineHeight: 1.6 }}>{body}</p>}
      {action}
    </div>
  );
}

/* ════════════════════════════════════════════════
   PAGE: DASHBOARD
════════════════════════════════════════════════ */

function PageDashboard({ onNavigate }) {
  const { balance, priceData, loading: walletLoading } = useWallet();
  const quaiPrice   = priceData?.current?.price ?? null;
  const priceChange = priceData?.current?.changePercent24h ?? null;
  const high24h     = priceData?.current?.high24h ?? null;
  const low24h      = priceData?.current?.low24h ?? null;
  const history     = priceData?.history ?? [];

  // Live markets + positions + rewards for breakdown charts
  const { markets, loading: mktsLoading }   = useMarkets({});
  const { positions, loading: posLoading }  = usePositions();
  const { rewards }                         = useRewards();

  const dataLoading = walletLoading || mktsLoading || posLoading;

  // Derived stats from demo data
  const openPositions    = positions.filter(p => p.status === "active" || p.status === "closed").length;
  const resolvedPos      = positions.filter(p => p.status === "resolved");
  const wins             = resolvedPos.filter(p => p.won === true).length;
  const losses           = resolvedPos.filter(p => p.won === false).length;
  const totalStakedUsdt  = positions.reduce((s, p) => s + p.amount, 0);
  const winRate          = resolvedPos.length > 0 ? Math.round((wins / resolvedPos.length) * 100) : null;
  const pendingRewards   = rewards.filter(r => !r.claimed).reduce((s, r) => s + r.reward, 0);

  if (dataLoading) return <Sk.DashboardHome />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── KPI ROW ── */}
      <div className="dash-kpi-grid-3">

        {/* Wallet balance */}
        <GCard style={{ padding: "20px 22px" }}>
          <p style={{ fontSize: 11, color: T.textDim, margin: "0 0 8px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Wallet Balance</p>
          <p style={{ fontSize: 30, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.04em", display: "flex", alignItems: "center", gap: 6 }}>
            {balance.quai.toFixed(4)}<QuaiLogo size={20} style={{ marginLeft: 4, opacity: 0.9 }} />
          </p>
          <p style={{ fontSize: 12, color: T.textDim, margin: "5px 0 0" }}>
            {balance.usd > 0 ? `≈ $${balance.usd.toFixed(2)} USDT` : quaiPrice ? "—" : "Loading…"}
          </p>
        </GCard>

        {/* Live QUAI price */}
        <GCard style={{ padding: "20px 22px" }}>
          <p style={{ fontSize: 11, color: T.textDim, margin: "0 0 8px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 5 }}>
            <QuaiLogo size={14} /> QUAI Price
          </p>
          {quaiPrice ? (
            <>
              <p style={{ fontSize: 30, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.04em" }}>
                ${quaiPrice.toFixed(5)}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: priceChange >= 0 ? T.yes : T.no }}>
                  {priceChange >= 0 ? "▲" : "▼"} {Math.abs(priceChange).toFixed(2)}% 24h
                </span>
                {high24h && <span style={{ fontSize: 11, color: T.textDim }}>H: ${high24h.toFixed(5)}</span>}
                {low24h  && <span style={{ fontSize: 11, color: T.textDim }}>L: ${low24h.toFixed(5)}</span>}
              </div>
            </>
          ) : (
            <p style={{ fontSize: 13, color: T.textDim, margin: 0 }}>Loading price…</p>
          )}
        </GCard>

        {/* Quick actions */}
        <GCard style={{ padding: "20px 22px" }}>
          <p style={{ fontSize: 11, color: T.textDim, margin: "0 0 12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Quick Actions</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Browse Markets",  icon: HelpCircle, key: "questions"   },
              { label: "My Positions",    icon: BookMarked, key: "convictions" },
              { label: "Claim Rewards",   icon: Gift,       key: "rewards"     },
            ].map(({ label, icon: Icon, key }) => (
              <button key={key} type="button" onClick={() => onNavigate(key)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: T.glass, border: `1px solid ${T.border}`, cursor: "pointer", textAlign: "left", transition: "border-color 0.15s, background 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.background = T.glassHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.glass; }}
              >
                <Icon size={14} strokeWidth={1.8} style={{ color: T.textMuted, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary }}>{label}</span>
                <ChevronRight size={12} style={{ color: T.textDim, marginLeft: "auto", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </GCard>
      </div>

      {/* ── INTERACTIVE PRICE CHART ── */}
      {history.length > 1 && (
        <InteractivePriceChart history={history} priceChange={priceChange} quaiPrice={quaiPrice} />
      )}

      {/* ── MY STATS ROW ── */}
      {positions.length > 0 && (
        <div className="dash-kpi-grid-5">
          {[
            { label: "Open Positions",   value: openPositions,                                   color: "#38bdf8", icon: BookMarked },
            { label: "Total Staked",     value: `$${totalStakedUsdt.toFixed(2)} USDT`,           color: "#fbbf24", icon: Coins     },
            { label: "Wins / Losses",    value: `${wins} / ${losses}`,                           color: T.yes,     icon: Trophy    },
            { label: "Win Rate",         value: winRate != null ? `${winRate}%` : "—",           color: T.violet,  icon: Target    },
            { label: "Pending Rewards",  value: pendingRewards > 0 ? `$${pendingRewards.toFixed(2)}` : "—", color: "#34d399", icon: Gift },
          ].map(({ label, value, color, icon: Icon }) => (
            <GCard key={label} style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>{label}</p>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={12} strokeWidth={2} style={{ color }} />
                </div>
              </div>
              <p style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>{value}</p>
            </GCard>
          ))}
        </div>
      )}

      {/* ── PLATFORM BREAKDOWN CHARTS ── */}
      <UserDashboardCharts markets={markets} positions={positions} wins={wins} losses={losses} />

      {/* ── PLATFORM INFO ── */}
      <div className="dash-sec-grid">
        {[
          { icon: ShieldCheck, label: "Non-Custodial",      sub: "You control your funds" },
          { icon: Globe,       label: "On-Chain Settlement",  sub: "Verified on-chain"      },
          { icon: Zap,         label: "Oracle-Verified",      sub: "Real-world data"        },
        ].map(({ icon: Icon, label, sub }) => (
          <GCard key={label} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={16} strokeWidth={1.8} style={{ color: T.textMuted }} />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, margin: 0 }}>{label}</p>
              <p style={{ fontSize: 11, color: T.textDim, margin: 0 }}>{sub}</p>
            </div>
          </GCard>
        ))}
      </div>

      {/* ── ACTIVITY FEED — live from Supabase positions ── */}
      <ActivityFeed onNavigate={onNavigate} />
    </div>
  );
}

/* ── Interactive price chart with hover tooltip ── */
function InteractivePriceChart({ history, priceChange, quaiPrice }) {
  const [hovered, setHovered] = useState(null); // { x, y, price, ts }
  const svgRef = useRef(null);
  const W = 900, H = 120, pad = { t: 10, b: 28, l: 8, r: 8 };
  const positive = (priceChange ?? 0) >= 0;
  const col = positive ? T.yes : T.no;

  const prices = history.map(p => p.price);
  const times  = history.map(p => p.timestamp);
  const minP = Math.min(...prices), maxP = Math.max(...prices), rangeP = maxP - minP || 1;
  const minT = Math.min(...times),  maxT = Math.max(...times),  rangeT = maxT - minT || 1;
  const innerW = W - pad.l - pad.r, innerH = H - pad.t - pad.b;

  const px = (i) => pad.l + (i / (prices.length - 1)) * innerW;
  const py = (v) => pad.t + innerH - ((v - minP) / rangeP) * innerH;
  const pts = prices.map((v, i) => `${px(i)},${py(v)}`).join(" ");
  const area = `${pad.l},${H - pad.b} ${pts} ${pad.l + innerW},${H - pad.b}`;

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xRel = (e.clientX - rect.left) / rect.width;
    const idx  = Math.round(xRel * (prices.length - 1));
    const clamped = Math.max(0, Math.min(prices.length - 1, idx));
    setHovered({ idx: clamped, x: px(clamped), y: py(prices[clamped]), price: prices[clamped], ts: times[clamped] });
  };

  const fmtTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " +
           d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  // Y-axis labels
  const yLabels = [minP, (minP + maxP) / 2, maxP].map(v => ({
    y: py(v),
    label: "$" + v.toFixed(5),
  }));
  // X-axis labels (first, mid, last)
  const xLabels = [0, Math.floor((prices.length - 1) / 2), prices.length - 1].map(i => ({
    x: px(i),
    label: new Date(times[i]).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  return (
    <GCard style={{ padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0, display: "flex", alignItems: "center", gap: 5 }}>
            <QuaiLogo size={14} /> QUAI / USDT — 7 Day
          </p>
          {hovered && (
            <span style={{ fontSize: 12, color: "#ffffff", fontWeight: 700 }}>${hovered.price.toFixed(6)}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {quaiPrice && <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>${quaiPrice.toFixed(6)}</span>}
          {priceChange != null && <Pill positive={positive}>{positive ? "+" : ""}{priceChange.toFixed(2)}%</Pill>}
        </div>
      </div>

      <div style={{ position: "relative", userSelect: "none" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: 120, display: "block", cursor: "crosshair" }}
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id="ipg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={col} stopOpacity="0.22" />
              <stop offset="100%" stopColor={col} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yLabels.map((yl, i) => (
            <line key={i} x1={pad.l} y1={yl.y} x2={pad.l + innerW} y2={yl.y}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          ))}

          {/* Area fill */}
          <polygon points={area} fill="url(#ipg)" />

          {/* Price line */}
          <polyline points={pts} fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Hover vertical line */}
          {hovered && (
            <>
              <line x1={hovered.x} y1={pad.t} x2={hovered.x} y2={H - pad.b}
                stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx={hovered.x} cy={hovered.y} r="4" fill={col} stroke="#080808" strokeWidth="2" />
            </>
          )}

          {/* Y-axis labels */}
          {yLabels.map((yl, i) => (
            <text key={i} x={pad.l} y={yl.y - 3} fontSize="8" fill="rgba(255,255,255,0.3)" fontFamily="monospace">
              {yl.label}
            </text>
          ))}

          {/* X-axis labels */}
          {xLabels.map((xl, i) => (
            <text key={i} x={xl.x} y={H - 2} fontSize="8" fill="rgba(255,255,255,0.3)"
              textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"} fontFamily="sans-serif">
              {xl.label}
            </text>
          ))}
        </svg>

        {/* Hover tooltip */}
        {hovered && (
          <div style={{
            position: "absolute",
            top: 4,
            left: `clamp(8px, calc(${(hovered.x / W) * 100}% - 60px), calc(100% - 128px))`,
            background: "rgba(20,20,20,0.95)",
            border: `1px solid ${col}40`,
            borderRadius: 8,
            padding: "6px 10px",
            pointerEvents: "none",
            zIndex: 10,
          }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: col, margin: 0 }}>${hovered.price.toFixed(6)}</p>
            <p style={{ fontSize: 10, color: T.textDim, margin: "2px 0 0", whiteSpace: "nowrap" }}>{fmtTime(hovered.ts)}</p>
          </div>
        )}
      </div>
    </GCard>
  );
}

/* ── Activity Feed — shows the user's recent positions live from Supabase ── */
function ActivityFeed({ onNavigate }) {
  const { positions, loading } = usePositions();
  const recent = positions.slice(0, 5);

  return (
    <GCard style={{ padding: "16px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>Activity Feed</p>
        {positions.length > 0 && (
          <button type="button" onClick={() => onNavigate("convictions")}
            style={{ fontSize: 11, fontWeight: 600, color: T.textDim, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = T.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.textDim; }}
          >
            View all <ChevronRight size={12} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1, 2, 3].map(i => <Sk.Box key={i} w="100%" h={44} r={8} />)}
        </div>
      )}

      {!loading && recent.length === 0 && (
        <EmptyState
          icon={BarChart3}
          title="No activity yet"
          body="Your predictions will appear here once you start participating in markets."
          action={
            <button type="button" onClick={() => onNavigate("questions")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, background: "#ffffff", color: "#080808", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer" }}>
              Browse Markets <ArrowRight size={13} strokeWidth={2.5} />
            </button>
          }
        />
      )}

      {!loading && recent.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {recent.map((p, i) => {
            const isYes = p.side === "YES";
            const col   = isYes ? T.yes : T.no;
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < recent.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: isYes ? T.yesBg : T.noBg, border: `1px solid ${isYes ? T.yesBorder : T.noBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: col }}>{p.side}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.question}</p>
                  <p style={{ fontSize: 11, color: T.textDim, margin: "1px 0 0", display: "flex", alignItems: "center", gap: 3 }}>
                    {p.category} · <span style={{ color: col, fontWeight: 600 }}>{p.side}</span> · {p.amount.toFixed(2)} <QuaiLogo size={11} />
                  </p>
                </div>
                <span style={{ padding: "2px 7px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: T.glass, border: `1px solid ${T.border}`, color: T.textDim, flexShrink: 0 }}>
                  {p.status}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </GCard>
  );
}

/* ── inline price sparkline (no dep) ── */
function PriceSparkline({ history, positive, height = 80 }) {
  const prices = history.map(p => p.price);
  const min = Math.min(...prices), max = Math.max(...prices), range = max - min || 1;
  const w = 800, pad = 4, H = height - pad * 2, step = w / (prices.length - 1);
  const pts = prices.map((p, i) => `${i * step},${pad + H - ((p - min) / range) * H}`).join(" ");
  const area = `0,${height} ${pts} ${w},${height}`;
  const col = positive ? T.yes : T.no;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: "100%", height, display: "block" }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={col} stopOpacity="0.25" />
          <stop offset="100%" stopColor={col} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sg)" />
      <polyline points={pts} fill="none" stroke={col} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ════════════════════════════════════════════════
   PAGE: QUESTIONS
════════════════════════════════════════════════ */

function PageQuestions({ onOpenQuestion }) {
  const [active,   setActive]   = useState("all");
  const [dropOpen, setDropOpen] = useState(false);

  const activeLabel = CATEGORIES.find(c => c.key === active)?.label ?? "All Categories";
  const activeEmoji = CATEGORIES.find(c => c.key === active)?.emoji ?? "🌐";

  // ── Live data from Supabase ──
  const categoryFilter = active === "all" ? null : activeLabel;
  const { markets, loading, error, refresh } = useMarkets({ category: categoryFilter, status: "active" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Header ── */}
      <div className="dash-page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>Markets</h1>
          <p style={{ fontSize: 13, color: T.textMuted, margin: "4px 0 0" }}>
            {loading ? "Loading markets…" : `${markets.length} open market${markets.length !== 1 ? "s" : ""} · Pick a side and earn rewards.`}
          </p>
        </div>

        <div className="dash-page-actions">
          {/* Refresh */}
          <button type="button" onClick={refresh}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
          >
            <RefreshCw size={12} strokeWidth={2} /> Refresh
          </button>

          {/* ── Category dropdown ── */}
          <div style={{ position: "relative" }}>
            <button type="button" onClick={() => setDropOpen(v => !v)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: dropOpen ? T.glassHover : T.glass, border: `1px solid ${dropOpen ? T.borderHover : T.border}`, color: "#ffffff", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap", minWidth: 0, maxWidth: "100%" }}>
              <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{activeEmoji}</span>
              <span style={{ flex: 1, textAlign: "left" }}>{activeLabel}</span>
              <ChevronDown size={14} strokeWidth={2.5} style={{ color: T.textDim, flexShrink: 0, transform: dropOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>

            {dropOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 99, background: "#111111", border: `1px solid ${T.borderHover}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,0.7)", minWidth: 200 }}>
                {CATEGORIES.map((c, i) => {
                  const isAct = active === c.key;
                  return (
                    <button key={c.key} type="button"
                      onClick={() => { setActive(c.key); setDropOpen(false); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: isAct ? "rgba(255,255,255,0.07)" : "transparent", border: "none", borderBottom: i < CATEGORIES.length - 1 ? `1px solid ${T.border}` : "none", color: isAct ? "#ffffff" : T.textMuted, fontSize: 13, fontWeight: isAct ? 700 : 400, cursor: "pointer", textAlign: "left", transition: "background 0.12s" }}
                      onMouseEnter={(e) => { if (!isAct) e.currentTarget.style.background = T.glass; }}
                      onMouseLeave={(e) => { if (!isAct) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: 15, lineHeight: 1, width: 20, textAlign: "center", flexShrink: 0 }}>{c.emoji}</span>
                      <span style={{ flex: 1 }}>{c.label}</span>
                      {isAct && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffffff", flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444" }}>
          Could not load markets: {error}
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && <Sk.MarketsGrid count={6} />}

      {/* ── Market grid ── */}
      {!loading && markets.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {markets.map(q => <QuestionCard key={q.id} q={q} onOpen={onOpenQuestion} />)}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && markets.length === 0 && !error && (
        <EmptyState
          icon={HelpCircle}
          title="No open markets yet"
          body="Prediction markets will appear here once they go live. Check back soon."
          action={
            <button type="button" onClick={refresh}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, background: T.glass, border: `1px solid ${T.border}`, color: T.textPrimary, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              <RefreshCw size={13} strokeWidth={2.5} /> Check again
            </button>
          }
        />
      )}
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
        <p className="market-question" style={{ fontSize: 14, color: "#ffffff", margin: "0 0 10px", lineHeight: 1.3 }}>{q.question}</p>
        <p style={{ fontSize: 11, color: T.textDim, margin: 0 }}>
          Pool: <span style={{ color: T.textMuted, fontWeight: 600 }}>${q.totalPool.toLocaleString()}</span>
        </p>
      </div>

      {/* Galaxy YES / VS / NO buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", borderTop: `1px solid ${T.border}`, alignItems: "stretch" }}>
        <GalaxyBtn side="YES" onClick={() => onOpen(q.id)} />
        {/* VS badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 2px", background: "#0d0d0d", borderLeft: `1px solid ${T.border}`, borderRight: `1px solid ${T.border}` }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.04)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 0 0 5px rgba(255,255,255,0.025), 0 6px 20px rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
            <div style={{ position: "absolute", inset: 2, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)" }} />
            <span style={{ fontFamily: "'YapariTrial','Yapari Trial','Yapari',sans-serif", fontSize: 14, fontWeight: 900, letterSpacing: "-0.02em", color: "rgba(255,255,255,0.7)", position: "relative", zIndex: 1, lineHeight: 1 }}>VS</span>
          </div>
        </div>
        <GalaxyBtn side="NO" onClick={() => onOpen(q.id)} />
      </div>
    </div>
  );
}
function GalaxyBtn({ side, onClick }) {
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
        cursor: "pointer",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        background: `${colA}0.05)`,
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = `${colA}0.14)`; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = `${colA}0.05)`; }}
    >
      <div className={`${animCls}-nebula`} style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5 }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 0, boxShadow: `inset 0 0 0 1px ${colA}0.25)`, pointerEvents: "none" }} />
      <span style={{ fontFamily: "'YapariTrial','Yapari Trial','Yapari',sans-serif", fontSize: 16, fontWeight: 900, color: col, letterSpacing: "-0.01em", position: "relative", zIndex: 1, textShadow: `0 0 12px ${colA}0.8)` }}>{side}</span>
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
   SHARE MODAL
════════════════════════════════════════════════ */

function ShareModal({ open, onClose, question }) {
  const [copied, setCopied] = useState(false);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const url  = `${window.location.origin}/dashboard/question-detail/${question?.id ?? ""}`;
  const text = question?.question ?? "Check out this poll on Q4";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch { /* ignore */ }
  };

  const twitterHref  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;

  return (
    /* Outer — full-viewport flex center, same pattern as WalletPage Modal */
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.78)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }} />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Share poll"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          background: "#141414",
          border: `1px solid ${T.borderHover}`,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 32px 80px rgba(0,0,0,0.85)",
          animation: "modal-in 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Share2 size={15} strokeWidth={1.8} style={{ color: T.textMuted }} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.02em" }}>Share Market</p>
              <p style={{ fontSize: 11, color: T.textDim, margin: 0 }}>Share this prediction market</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ width: 32, height: 32, borderRadius: "50%", background: T.glass, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted, cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = "#ffffff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 22px 24px", display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Question preview */}
          <div style={{ padding: "12px 14px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}` }}>
            <p className="market-question" style={{ fontSize: 13, color: T.textMuted, margin: 0, lineHeight: 1.3 }}>
              "{question?.question}"
            </p>
          </div>

          {/* Copy link */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>
              Market link
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, overflow: "hidden", display: "flex", alignItems: "center" }}>
                <p style={{ fontSize: 12, color: T.textDim, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>
                  {url}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopy}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "10px 16px", borderRadius: 10, flexShrink: 0,
                  background: copied ? "rgba(34,197,94,0.15)" : T.glass,
                  border: `1px solid ${copied ? "rgba(34,197,94,0.4)" : T.border}`,
                  color: copied ? T.yes : T.textMuted,
                  fontSize: 12, fontWeight: 700,
                  cursor: "pointer", transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = "#ffffff"; } }}
                onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; } }}
              >
                {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Share via */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>
              Share via
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <a
                href={twitterHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 14px", borderRadius: 10, textDecoration: "none", background: T.glass, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 13, fontWeight: 600, transition: "border-color 0.15s, color 0.15s, background 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.background = T.glassHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = T.glass; }}
              >
                <TwitterX size={15} /> X / Twitter
              </a>
              <a
                href={telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "11px 14px", borderRadius: 10, textDecoration: "none", background: T.glass, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 13, fontWeight: 600, transition: "border-color 0.15s, color 0.15s, background 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = "#ffffff"; e.currentTarget.style.background = T.glassHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = T.glass; }}
              >
                <Telegram size={15} /> Telegram
              </a>
            </div>
          </div>
        </div>

        <style>{`@keyframes modal-in{from{opacity:0;transform:scale(0.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   PAGE: QUESTION DETAIL
════════════════════════════════════════════════ */

const PROTOCOL_FEE_PCT = 5;   // 5% platform fee
const MIN_STAKE        = 2;   // $2 minimum

/** Live countdown — re-renders every second */
function Countdown({ deadline }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    const tick = () => {
      const ms = new Date(deadline) - Date.now();
      if (ms <= 0) { setLabel("Market closed"); return; }
      const s = Math.floor(ms / 1000);
      const m = Math.floor(s / 60);
      const h = Math.floor(m / 60);
      const d = Math.floor(h / 24);
      if (d > 0)      setLabel(`${d}d ${h % 24}h ${m % 60}m`);
      else if (h > 0) setLabel(`${h}h ${m % 60}m ${s % 60}s`);
      else            setLabel(`${m}m ${s % 60}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return <span>{label}</span>;
}

function PageQuestionDetail({ questionId, onBack, onConfetti }) {
  const [tab, setTab]               = useState("How It Works");
  const [selected, setSelected]     = useState(null);
  /*
   * lockedSide — set permanently after the user's FIRST confirmed stake.
   * Once set, the user cannot tap the other side button at all.
   * They can keep adding new positions on the locked side indefinitely.
   */
  const [lockedSide, setLockedSide] = useState(null);
  const [amount, setAmount]         = useState("");
  const [confirmed, setConfirmed]   = useState(false);
  const [shareOpen, setShareOpen]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const { profile, user }               = useAuth();
  const { balance, priceData }          = useWallet();
  const { market, loading: mktLoading } = useMarket(questionId);
  const { isDemoMode }                  = useDemoModeContext();

  /* ── derived market values ── */
  const totalPool        = market?.totalPool ?? 0;
  const deadline         = market?.deadline ? new Date(market.deadline) : null;
  const msLeft           = deadline ? deadline - Date.now() : null;
  const isOpen           = market?.status === "active" && msLeft != null && msLeft > 0;
  const totalParticipants = (market?.yesCount ?? 0) + (market?.noCount ?? 0);

  /* ── USDT balance — using QUAI price to derive USD equivalent ── */
  const quaiPrice = priceData?.current?.price ?? null;
  const rate      = quaiPrice && quaiPrice > 0 ? parseFloat((1 / quaiPrice).toFixed(6)) : null;
  const amtNum    = parseFloat(amount) || 0;
  const quaiEquiv = amtNum > 0 && rate ? (amtNum * rate).toFixed(4) : null;

  /* ── wallet balance check (USDT equivalent) ── */
  const walletUsd = quaiPrice ? balance.quai * quaiPrice : null;
  // In demo mode the balance is always sufficient (seeded at $100).
  // In live mode we check the real wallet USD value.
  const balanceOk = isDemoMode ? true : (walletUsd !== null ? walletUsd >= amtNum : true);

  /* ── proportional payout preview ──
   * Winner receives: stake_back + proportional_share_of_net_losing_pool
   * net_losing_pool = losing_pool × (1 - fee)
   * user_share      = (user_stake / total_winning_pool_after_stake) × net_losing_pool
   */
  const feeDecimal      = PROTOCOL_FEE_PCT / 100;
  const yesPool         = market?.yesPool ?? 0;
  const noPool          = market?.noPool  ?? 0;
  const losePool        = selected === "YES" ? noPool  : yesPool;
  const winPool         = selected === "YES" ? yesPool : noPool;
  const newWinPool      = winPool + amtNum;
  const netLosing       = losePool * (1 - feeDecimal);
  const myShare         = newWinPool > 0 ? (amtNum / newWinPool) * netLosing : 0;
  const estimatedPayout = amtNum + myShare;

  /* ── YES / NO selection — always free to toggle ── */
  const handleSelect = (side) => {
    if (!isOpen) return;
    setSelected(side);
    setAmount("");
    setConfirmed(false);
    setSubmitError(null);
  };

  /* ── Stake confirmation ── */
  const handleConfirm = async () => {
    // Client-side validations
    if (!amount || amtNum < MIN_STAKE) {
      setSubmitError(`Minimum stake is $${MIN_STAKE} USDT.`);
      return;
    }
    if (amtNum <= 0) {
      setSubmitError("Please enter a valid stake amount.");
      return;
    }

    // ── Demo mode: persist stake to store, skip DB / contract ───────────
    if (isDemoMode) {
      setSubmitting(true);
      setSubmitError(null);
      await new Promise(r => setTimeout(r, 900));
      demoStake({ market, side: selected, amtNum });
      setLockedSide(selected);
      setConfirmed(true);
      if (onConfetti) onConfetti();
      setSubmitting(false);
      return;
    }
    // ────────────────────────────────────────────────────────────────────

    if (!profile?.id) {
      setSubmitError("You must be signed in to place a position.");
      return;
    }
    // Live mode: enforce real wallet balance
    if (!balanceOk) {
      const have = walletUsd !== null ? `$${walletUsd.toFixed(2)}` : "unknown";
      setSubmitError(`Insufficient balance. You need $${amtNum.toFixed(2)} USDT but your wallet has ${have}.`);
      return;
    }
    // Guard: ensure the Firebase UID header is set before hitting Supabase RLS
    if (!getFirebaseUID()) {
      setSubmitError("Authentication is still loading. Please wait a moment and try again.");
      return;
    }
    if (!market?.id || !isOpen) {
      setSubmitError("This market is not accepting positions right now.");
      return;
    }
    if (!selected) {
      setSubmitError("Please choose YES or NO first.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    let stakeTxHash = null;

    try {
      // ── Step 1: On-chain predict() — send QUAI stake to the contract ──────
      if (market.contractAddress) {
        // Convert QUAI balance → QUAI amount for the stake.
        // amtNum is in USDT; convert to QUAI using the live price.
        const quaiAmount = rate ? amtNum * rate : 0;
        if (quaiAmount <= 0) {
          throw new Error("Could not determine QUAI equivalent of your stake. Please try again.");
        }

        try {
          const result = await onChainPredict({
            uid:                   user.uid,
            marketContractAddress: market.contractAddress,
            isYes:                 selected === "YES",
            amountQuai:            quaiAmount,
          });
          stakeTxHash = result.hash;
          console.log(`[handleConfirm] predict() tx: ${stakeTxHash}`);
        } catch (chainErr) {
          throw new Error(`On-chain stake failed: ${chainErr.message ?? chainErr}`);
        }
      }

      // ── Step 2: Insert position row in Supabase ───────────────────────────
      /*
       * Multiple rows per user per market are allowed.
       * RLS policy: user_id must equal the signed-in user's Supabase id.
       */
      const positionRow = {
        user_id:   profile.id,
        market_id: market.id,
        side:      selected,
        amount:    amtNum,
        switched:  false,
      };
      if (stakeTxHash) positionRow.stake_tx_hash = stakeTxHash;

      const { error: insertErr } = await supabase
        .from("user_positions")
        .insert(positionRow);
      if (insertErr) throw insertErr;

      // ── Step 3: Atomically update pool amounts in Supabase ────────────────
      /*
       * Uses a SECURITY DEFINER RPC to bypass RLS on market_outcomes.
       */
      const { error: poolErr } = await supabase.rpc("increment_pool", {
        p_market_id: market.id,
        p_outcome:   selected,
        p_amount:    amtNum,
      });
      if (poolErr) throw poolErr;

      // Log the event (best-effort — don't block on failure)
      supabase.from("market_events").insert({
        market_id:        market.id,
        event_type:       "position_placed",
        user_id:          profile.id,
        transaction_hash: stakeTxHash ?? null,
        metadata:         { side: selected, amount: amtNum, txHash: stakeTxHash },
      }).then(() => {});

      /* Lock the side permanently after the first confirmed stake */
      setLockedSide(selected);
      setConfirmed(true);
      if (onConfetti) onConfetti();
    } catch (err) {
      console.error("[PageQuestionDetail] stake error:", err);
      setSubmitError(
        err.message ?? "Failed to save your position. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* Stake another position — resets amount/confirmed but keeps side locked */
  const handleStakeAnother = () => {
    setSelected(lockedSide); // preserve the locked side
    setAmount("");
    setConfirmed(false);
    setSubmitError(null);
  };

  if (mktLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Sk.MarketCard />
        <Sk.MarketCard />
      </div>
    );
  }
  if (!market) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── back + share header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button type="button" onClick={onBack}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: T.textMuted, background: "none", border: "none", cursor: "pointer" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = T.textPrimary; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; }}
        >
          <ArrowLeft size={15} strokeWidth={2} /> Back to Markets
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CategoryBadge category={market.category} />
          <button type="button" onClick={() => setShareOpen(true)} aria-label="Share"
            style={{ width: 32, height: 32, borderRadius: 6, background: T.glass, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted, cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
          >
            <Share2 size={13} strokeWidth={1.8} />
          </button>
        </div>
      </div>

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} question={{ id: market.id, question: market.question, category: market.category }} />

      <div className="dash-detail-grid">

        {/* ═══ LEFT COLUMN ═══ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── Question + market stats card ── */}
          <GCard style={{ padding: "28px 28px 24px" }}>
            <h1 className="market-question" style={{ fontSize: 22, color: "#ffffff", margin: "0 0 20px", lineHeight: 1.2 }}>
              {market.question}
            </h1>

            {/* Market status badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: isOpen ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.06)", border: `1px solid ${isOpen ? "rgba(34,197,94,0.3)" : T.border}`, marginBottom: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: isOpen ? T.yes : T.textDim, flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: isOpen ? T.yes : T.textMuted, letterSpacing: "0.05em" }}>
                {isOpen ? "MARKET OPEN" : market.status === "resolved" ? `RESOLVED: ${market.resolved_outcome}` : "MARKET CLOSED"}
              </span>
            </div>

            {/* ── 4 stat cards — TOTAL only, no YES/NO split ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 4 }}>
              {[
                {
                  icon: <Users size={13} strokeWidth={2} />,
                  label: "Participants",
                  value: totalParticipants.toLocaleString(),
                },
                {
                  icon: <Coins size={13} strokeWidth={2} />,
                  label: "Total Staked",
                  value: `$${totalPool.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`,
                },
                {
                  icon: <Clock size={13} strokeWidth={2} />,
                  label: "Ends",
                  value: deadline
                    ? deadline.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "—",
                },
                {
                  icon: <Zap size={13} strokeWidth={2} />,
                  label: "Time Left",
                  value: deadline ? <Countdown deadline={deadline} /> : "—",
                },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}` }}>
                  <span style={{ color: T.textDim, marginTop: 1, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>{label}</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, margin: 0 }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </GCard>

          {/* ── Info tabs: How It Works · Payout · Rules ── */}
          <GCard style={{ padding: 0 }}>
            <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, padding: "0 20px" }}>
              {["How It Works", "Payout", "Rules"].map(t => (
                <button key={t} type="button" onClick={() => setTab(t)}
                  style={{ padding: "14px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: tab === t ? "#ffffff" : T.textMuted, borderBottom: tab === t ? "2px solid #ffffff" : "2px solid transparent", marginBottom: -1, transition: "color 0.15s" }}>
                  {t}
                </button>
              ))}
            </div>

            <div style={{ padding: "20px 22px" }}>

              {tab === "How It Works" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    {
                      n: "1",
                      title: "Pick YES or NO",
                      body: "Choose YES if you think the event will happen, NO if it won't. You can switch sides any time before confirming your stake.",
                    },
                    {
                      n: "2",
                      title: "Enter your stake",
                      body: `Minimum $${MIN_STAKE} USDT per position. Your available USDT balance is shown and checked before every stake. You can open as many positions as you like while the market is open.`,
                    },
                    {
                      n: "3",
                      title: "Wait for resolution",
                      body: "At the deadline an approved oracle fetches the verified real-world result. The market is resolved YES or NO automatically.",
                    },
                    {
                      n: "4",
                      title: "Payout",
                      body: `Losing stakes are forfeited. Q4 takes a ${PROTOCOL_FEE_PCT}% fee from the losing pool. The remaining ${100 - PROTOCOL_FEE_PCT}% is split proportionally among all winning positions based on each winner's share of the total winning pool. Winners also receive their original stake back.`,
                    },
                  ].map(({ n, title, body }) => (
                    <div key={n} style={{ display: "flex", gap: 14 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.08)", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 800, color: T.textMuted }}>{n}</div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, margin: "0 0 3px" }}>{title}</p>
                        <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.6 }}>{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === "Payout" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(34,197,94,0.07)", border: `1px solid ${T.yesBorder}` }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.yes, margin: "0 0 8px" }}>💸 Proportional Payout Formula</p>
                    <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.8 }}>
                      • Losers forfeit their entire stake.<br/>
                      • <strong style={{ color: T.textPrimary }}>{PROTOCOL_FEE_PCT}% fee</strong> is taken from the losing pool.<br/>
                      • The remaining <strong style={{ color: T.textPrimary }}>{100 - PROTOCOL_FEE_PCT}%</strong> is shared <strong style={{ color: T.textPrimary }}>proportionally</strong> among winners based on each winner's share of the total winning pool.<br/>
                      • Winners also <strong style={{ color: T.textPrimary }}>get their original stake back</strong>.
                    </p>
                  </div>

                  <div style={{ padding: "14px 16px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}` }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary, margin: "0 0 12px" }}>📊 Example</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {[
                        ["Total market pool",              "$100 USDT"],
                        ["Winning pool (e.g. YES side)",   "$60"],
                        ["Losing pool (NO side)",          "$40"],
                        [`Platform fee (${PROTOCOL_FEE_PCT}% of $40)`, "-$2"],
                        ["Net losing pool distributed",    "$38"],
                        ["", ""],
                        ["Winner A staked",   "$30 → 30/60 = 50% → +$19.00"],
                        ["Winner B staked",   "$20 → 20/60 = 33% → +$12.67"],
                        ["Winner C staked",   "$10 → 10/60 = 17% → +$6.33"],
                      ].map(([l, v], i) => l === "" ? (
                        <div key={i} style={{ height: 1, background: T.border, margin: "4px 0" }} />
                      ) : (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                          <span style={{ color: T.textMuted }}>{l}</span>
                          <span style={{ fontWeight: 700, color: T.textPrimary }}>{v}</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: T.textDim, margin: "10px 0 0", lineHeight: 1.5 }}>
                      Each winner receives their original stake back <em>plus</em> their proportional share of $38.
                    </p>
                  </div>

                  <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.07)", border: `1px solid ${T.noBorder}` }}>
                    <p style={{ fontSize: 12, color: T.no, margin: 0 }}>
                      ⚠️ Losers forfeit their entire stake. No partial refunds unless the market is cancelled.
                    </p>
                  </div>
                </div>
              )}

              {tab === "Rules" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                  {/* Position Rules */}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Position Rules</p>
                    {[
                      `Minimum stake per position: $${MIN_STAKE} USDT.`,
                      "You must have enough USDT balance to stake — checked on every position.",
                      "You can freely choose or switch YES or NO before confirming each stake.",
                      "Each confirmed position is final and cannot be cancelled or withdrawn.",
                    ].map((rule, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: T.textDim, flexShrink: 0, marginTop: 1 }}>·</span>
                        <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.6 }}>{rule}</p>
                      </div>
                    ))}
                  </div>

                  {/* Resolution Rules */}
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px" }}>Resolution Rules</p>
                    {[
                      "The market closes automatically at the specified deadline.",
                      "An approved oracle fetches the verified real-world outcome.",
                      "The market resolves as YES or NO — no draws.",
                      "Losing positions are not refunded.",
                      "Winners receive their original stake back.",
                      `Q4 takes a ${PROTOCOL_FEE_PCT}% platform fee from the losing pool.`,
                      `The remaining ${100 - PROTOCOL_FEE_PCT}% of the losing pool is distributed proportionally among all winning positions, based on each winner's share of the total winning pool.`,
                      "If the market is cancelled, all stakers receive a full refund.",
                      `Data source: ${market.data_source ?? "verified oracle"}.`,
                    ].map((rule, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: T.textDim, flexShrink: 0, marginTop: 1 }}>·</span>
                        <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.6 }}>{rule}</p>
                      </div>
                    ))}
                  </div>

                </div>
              )}

            </div>
          </GCard>
        </div>

        {/* ═══ RIGHT COLUMN — staking card ═══ */}
        <div style={{ position: "sticky", top: 80 }}>
          <GCard style={{ padding: "24px" }}>

            {!confirmed ? (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>
                  {isOpen ? "Place Your Stake" : "Market Closed"}
                </p>

                {!isOpen && (
                  <div style={{ padding: "14px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, textAlign: "center" }}>
                    <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>
                      {market.status === "resolved"
                        ? `Market resolved: ${market.resolved_outcome}`
                        : "This market is no longer accepting predictions."}
                    </p>
                  </div>
                )}

                {isOpen && (
                  <>
                    {/* ── YES / VS / NO buttons ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 6, marginBottom: 14, alignItems: "center" }}>
                      {["YES", "VS", "NO"].map(side => {
                        if (side === "VS") return (
                          <div key="vs" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.14)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <span style={{ fontFamily: "'YapariTrial','Yapari Trial','Yapari',sans-serif", fontSize: 13, fontWeight: 900, color: "rgba(255,255,255,0.6)" }}>VS</span>
                            </div>
                          </div>
                        );
                        const isActive  = selected === side;
                        const isYes     = side === "YES";
                        const col  = isYes ? "#22c55e" : "#ef4444";
                        const colB = isYes ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)";
                        const glow = isYes ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)";
                        return (
                          <button key={side} type="button"
                            onClick={() => handleSelect(side)}
                            style={{
                              padding: "20px 8px", borderRadius: 12,
                              border: isActive
                                ? `2px solid ${col}`
                                : `1px solid ${isYes ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                              background: isActive
                                ? colB
                                : isYes ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)",
                              cursor: "pointer",
                              opacity: 1,
                              transition: "all 0.2s cubic-bezier(0.34,1.56,0.64,1)",
                              boxShadow: isActive ? `0 0 24px ${glow}` : "none",
                              transform: isActive ? "translateY(-2px) scale(1.03)" : "scale(1)",
                              display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                            }}>
                            <span style={{ fontFamily: "'YapariTrial','Yapari Trial','Yapari',sans-serif", fontSize: 22, fontWeight: 900, color: col, lineHeight: 1 }}>{side}</span>
                            <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 500 }}>{isYes ? "It will" : "It won't"}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Stake input — slides in after a side is selected */}
                    <div style={{ overflow: "hidden", maxHeight: selected ? 500 : 0, opacity: selected ? 1 : 0, transition: "max-height 0.35s ease, opacity 0.25s ease" }}>
                      <div style={{ paddingTop: 4, display: "flex", flexDirection: "column", gap: 10 }}>

                        {/* Amount input */}
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 600, color: T.textDim, margin: "0 0 6px", letterSpacing: "0.04em" }}>
                            STAKE AMOUNT <span style={{ fontWeight: 400 }}>(min ${MIN_STAKE} USDT)</span>
                          </p>
                          <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: T.textMuted }}>$</span>
                            <input
                              type="number" min={MIN_STAKE} step="0.01"
                              placeholder={`${MIN_STAKE}.00`}
                              value={amount}
                              onChange={(e) => { setAmount(e.target.value); setSubmitError(null); }}
                              style={{
                                width: "100%", padding: "12px 68px 12px 28px",
                                background: T.glass,
                                border: `1px solid ${T.border}`,
                                borderRadius: 10, color: "#fff", fontSize: 20, fontWeight: 800,
                                outline: "none", boxSizing: "border-box",
                                letterSpacing: "-0.02em", transition: "border-color 0.15s",
                              }}
                              onFocus={(e) => { e.target.style.borderColor = T.borderHover; }}
                              onBlur={(e)  => { e.target.style.borderColor = T.border; }}
                            />
                            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 11, fontWeight: 700, color: T.textDim }}>USDT</span>
                          </div>
                        </div>

                        {/* USDT balance — always visible so user knows what they have */}
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "9px 12px", borderRadius: 8,
                          background: T.glass,
                          border: `1px solid ${T.border}`,
                        }}>
                          <span style={{ fontSize: 11, color: T.textDim, display: "flex", alignItems: "center", gap: 5 }}>
                            <WalletCards size={12} strokeWidth={2} /> Available balance
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>
                            {walletUsd != null ? `≈$${walletUsd.toFixed(2)} USDT` : `${balance.quai.toFixed(4)} QUAI`}
                          </span>
                        </div>

                        {/* QUAI equiv */}
                        {quaiEquiv && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: T.glass, border: `1px solid ${T.border}` }}>
                            <span style={{ fontSize: 11, color: T.textDim }}>≈ Quai equivalent</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 4 }}>
                              {quaiEquiv} <QuaiLogo size={13} />
                            </span>
                          </div>
                        )}

                        {/* Payout preview — only when valid amount entered */}
                        {amtNum >= MIN_STAKE && balanceOk && (
                          <div style={{ padding: "12px 14px", borderRadius: 10, background: selected === "YES" ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)", border: `1px solid ${selected === "YES" ? T.yesBorder : T.noBorder}` }}>
                            <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, margin: "0 0 8px", letterSpacing: "0.06em", textTransform: "uppercase" }}>Est. payout if {selected} wins</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                <span style={{ color: T.textDim }}>Your stake returned</span>
                                <span style={{ color: T.textPrimary, fontWeight: 600 }}>${amtNum.toFixed(2)}</span>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                <span style={{ color: T.textDim }}>Your share of losing pool</span>
                                <span style={{ color: T.textPrimary, fontWeight: 600 }}>+${myShare.toFixed(2)}</span>
                              </div>
                              <div style={{ height: 1, background: T.border, margin: "4px 0" }} />
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                                <span style={{ fontWeight: 700, color: selected === "YES" ? T.yes : T.no }}>Estimated total</span>
                                <span style={{ fontWeight: 800, color: selected === "YES" ? T.yes : T.no }}>${estimatedPayout.toFixed(2)}</span>
                              </div>
                              <p style={{ fontSize: 10, color: T.textDim, margin: "4px 0 0", lineHeight: 1.5 }}>
                                Based on current pool. Final payout depends on all positions at close. {PROTOCOL_FEE_PCT}% fee applies.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Confirm button */}
                        <button
                          type="button" onClick={handleConfirm}
                          disabled={!amount || amtNum < MIN_STAKE || !balanceOk || submitting}
                          style={{
                            width: "100%", padding: "13px", borderRadius: 10, border: "none",
                            background: selected === "YES"
                              ? (amtNum >= MIN_STAKE && balanceOk ? T.yes : "rgba(34,197,94,0.3)")
                              : (amtNum >= MIN_STAKE && balanceOk ? T.no  : "rgba(239,68,68,0.3)"),
                            color: "#fff", fontSize: 14, fontWeight: 800,
                            cursor: amtNum >= MIN_STAKE && balanceOk && !submitting ? "pointer" : "not-allowed",
                            transition: "background 0.2s", opacity: submitting ? 0.7 : 1,
                          }}
                        >
                          {submitting ? "Confirming…" : `Stake $${amount || "0.00"} on ${selected}`}
                        </button>

                        {submitError && (
                          <p style={{ fontSize: 11, color: T.no, textAlign: "center", margin: 0, lineHeight: 1.5 }}>{submitError}</p>
                        )}

                        <p style={{ fontSize: 10, color: T.textDim, textAlign: "center", margin: 0, lineHeight: 1.5 }}>
                          Positions are final · {PROTOCOL_FEE_PCT}% platform fee · Min ${MIN_STAKE} USDT
                        </p>
                      </div>
                    </div>

                    {!selected && (
                      <p style={{ fontSize: 13, color: T.textDim, textAlign: "center", margin: "4px 0 0", lineHeight: 1.6 }}>
                        Choose YES or NO to open a position.
                      </p>
                    )}
                  </>
                )}
              </>
            ) : (
              /* ── Confirmed / celebration state ── */
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "8px 0" }}>
                <div style={{
                  width: 68, height: 68, borderRadius: "50%",
                  background: `radial-gradient(circle, ${selected === "YES" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"} 0%, transparent 70%)`,
                  border: `2px solid ${selected === "YES" ? T.yes : T.no}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 0 28px ${selected === "YES" ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
                  animation: "pop-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
                }}>
                  <CheckCircle2 size={32} strokeWidth={2} style={{ color: selected === "YES" ? T.yes : T.no }} />
                </div>

                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 18, fontWeight: 900, color: "#fff", margin: "0 0 4px", letterSpacing: "-0.03em" }}>🎉 Position Confirmed!</p>
                  <p style={{ fontSize: 12, color: T.textMuted, margin: "0 0 2px" }}>
                    <span style={{ color: "#fff", fontWeight: 700 }}>${amount} USDT</span> staked on{" "}
                    <span style={{ color: selected === "YES" ? T.yes : T.no, fontWeight: 800 }}>{selected}</span>
                  </p>
                  {quaiEquiv && (
                    <p style={{ fontSize: 11, color: T.textDim, margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                      {quaiEquiv} <QuaiLogo size={12} /> QUAI
                    </p>
                  )}
                </div>

                {/* Payout estimate */}
                <div style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 11, color: T.textDim, margin: "0 0 6px", fontWeight: 600 }}>Est. payout if {selected} wins</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: selected === "YES" ? T.yes : T.no, margin: 0 }}>${estimatedPayout.toFixed(2)}</p>
                  <p style={{ fontSize: 10, color: T.textDim, margin: "3px 0 0" }}>Based on current pool. Final payout may vary.</p>
                </div>

                <button type="button" onClick={handleStakeAnother}
                  style={{ width: "100%", padding: "11px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.textPrimary; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
                >
                  + Add Another Position
                </button>
              </div>
            )}

          </GCard>
        </div>

      </div>
    </div>
  );
}




/* ════════════════════════════════════════════════
   PAGE: MY CONVICTIONS
════════════════════════════════════════════════ */

const CONV_TABS = ["Open", "Resolved", "Cancelled"];

function ConvictionCard({ c, onWithdrawRefund, withdrawing }) {
  const isYes     = c.answer === "YES";
  const col       = isYes ? T.yes  : T.no;
  const colBg     = isYes ? T.yesBg : T.noBg;
  const colBorder = isYes ? T.yesBorder : T.noBorder;

  const isCancelled   = c.status === "cancelled" || c.status === "paused";
  const hasRefundTx   = Boolean(c.refundTxHash);
  const isWithdrawing = withdrawing === c.id;

  return (
    <GCard style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Top row: category + status */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <CategoryBadge category={c.category} />
        <span style={{ padding: "2px 8px", borderRadius: 999, background: T.glass, border: `1px solid ${T.border}`, color: T.textDim, fontSize: 10, fontWeight: 600 }}>
          {c.status}
        </span>
      </div>

      {/* Question */}
      <p className="market-question" style={{ fontSize: 13, color: T.textPrimary, margin: 0, lineHeight: 1.3 }}>
        {c.question}
      </p>

      {/* Stats row */}
      <div style={{ display: "grid", gap: 8 }} className="positions-stats-grid">
        {/* Your side */}
        <div style={{ padding: "10px 12px", borderRadius: 10, background: colBg, border: `1px solid ${colBorder}`, display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: col, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.8 }}>Your Side</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: col, letterSpacing: "-0.02em" }}>{c.answer}</span>
        </div>
        {/* Staked */}
        <div style={{ padding: "10px 12px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: T.textDim, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Staked</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.02em", display: "inline-flex", alignItems: "center", gap: 3 }}>${c.staked.toFixed(2)}</span>
        </div>
        {/* Pool */}
        <div style={{ padding: "10px 12px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: T.textDim, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Pool</span>
          <span style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary, letterSpacing: "-0.02em" }}>
            {c.totalPool >= 1000
              ? `$${(c.totalPool / 1000).toFixed(1)}K`
              : `$${c.totalPool.toFixed(2)}`}
          </span>
        </div>
      </div>

      {/* Closes / resolved info */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.textDim }}>
        <Clock size={11} strokeWidth={2} style={{ flexShrink: 0 }} />
        <span>{c.status === "resolved" ? `Resolved: ${c.closes}` : `Closes: ${c.closes}`}</span>
      </div>

      {/* Stake tx link */}
      {c.stakeTxHash && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: T.textDim }}>
          <ExternalLink size={11} strokeWidth={2} style={{ flexShrink: 0 }} />
          <a
            href={`https://quaiscan.io/tx/${c.stakeTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: T.violet, textDecoration: "none", fontWeight: 600 }}
          >
            View stake tx
          </a>
        </div>
      )}

      {/* Withdraw Refund — only for cancelled markets with a contract address */}
      {isCancelled && c.contractAddress && (
        <div style={{ marginTop: 2 }}>
          {hasRefundTx ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#22c55e" }}>
              <CheckCircle2 size={13} strokeWidth={2} />
              <span style={{ fontWeight: 600 }}>Refund withdrawn</span>
              <a
                href={`https://quaiscan.io/tx/${c.refundTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: T.textDim, textDecoration: "none", marginLeft: 4 }}
              >
                <ExternalLink size={11} strokeWidth={2} />
              </a>
            </div>
          ) : (
            <button
              type="button"
              disabled={isWithdrawing}
              onClick={() => onWithdrawRefund && onWithdrawRefund(c.id)}
              style={{
                width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid rgba(239,68,68,0.35)",
                background: "rgba(239,68,68,0.08)", color: "#ef4444", fontSize: 13, fontWeight: 700,
                cursor: isWithdrawing ? "not-allowed" : "pointer", opacity: isWithdrawing ? 0.6 : 1,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { if (!isWithdrawing) e.currentTarget.style.background = "rgba(239,68,68,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)"; }}
            >
              {isWithdrawing ? "Withdrawing…" : `Withdraw Refund ($${c.staked.toFixed(2)})`}
            </button>
          )}
        </div>
      )}
    </GCard>
  );
}

function PageMyConvictions() {
  const [tab, setTab]         = useState("Open");
  const [refundError, setRefundError] = useState(null);
  const { positions, loading, error, refresh, withdrawing, withdrawRefund } = usePositions();

  const filtered = positions.filter(p => {
    if (tab === "Open")      return p.status === "active" || p.status === "closed";
    if (tab === "Resolved")  return p.status === "resolved";
    if (tab === "Cancelled") return p.status === "cancelled" || p.status === "paused";
    return true;
  });

  // Map position shape → ConvictionCard shape (keep full position props for contract integration)
  const toCardShape = (p) => ({
    id:              p.id,
    question:        p.question,
    category:        p.category,
    status:          p.status,
    answer:          p.side,
    staked:          p.amount,
    totalPool:       p.totalPool,
    closes:          p.closesLabel,
    stakeTxHash:     p.stakeTxHash,
    refundTxHash:    p.refundTxHash,
    contractAddress: p.contractAddress,
  });

  const handleWithdrawRefund = async (positionId) => {
    setRefundError(null);
    try {
      await withdrawRefund(positionId);
    } catch (err) {
      setRefundError(err.message ?? "Refund failed. Please try again.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="dash-page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>My Positions</h1>
          <p style={{ fontSize: 13, color: T.textMuted, margin: "4px 0 0" }}>Track your open predictions, switches, and performance.</p>
        </div>
        <div className="dash-page-actions">
          <button type="button" onClick={refresh}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: T.glass, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
          >
            <RefreshCw size={12} strokeWidth={2} /> Refresh
          </button>
          <div style={{ display: "flex", gap: 4, padding: 4, background: T.glass, border: `1px solid ${T.border}`, borderRadius: 8 }}>
            {CONV_TABS.map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                style={{ padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: tab === t ? "#ffffff" : "transparent", color: tab === t ? "#080808" : T.textMuted, transition: "all 0.15s" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444" }}>
          Could not load positions: {error}
        </div>
      )}

      {refundError && (
        <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444" }}>
          {refundError}
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3,4].map(i => <Sk.PositionCard key={i} />)}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(p => (
            <ConvictionCard
              key={p.id}
              c={toCardShape(p)}
              onWithdrawRefund={handleWithdrawRefund}
              withdrawing={withdrawing}
            />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <GCard style={{ padding: 0 }}>
          <EmptyState
            icon={BookMarked}
            title="No positions yet"
            body="Your active predictions will appear here. Make your first prediction to get started."
          />
        </GCard>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderRadius: 8, background: T.glass, border: `1px solid ${T.border}`, fontSize: 12, color: T.textMuted }}>
        <Info size={13} strokeWidth={1.8} style={{ flexShrink: 0, color: T.violet }} />
        Switch once per market only — at least 5 minutes must remain before market close.
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   PAGE: HOW IT WORKS
════════════════════════════════════════════════ */

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
   PAGE: RESULTS
════════════════════════════════════════════════ */

const RESULT_TABS = ["All", "Won", "Lost"];

function ResultCard({ r }) {
  const wonColor   = r.won ? T.yes  : T.no;
  const wonBg      = r.won ? T.yesBg : T.noBg;
  const wonBorder  = r.won ? T.yesBorder : T.noBorder;

  return (
    <GCard style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <CategoryBadge category={r.category} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: T.textDim, fontWeight: 500 }}>{r.settledAt}</span>
          <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: wonBg, border: `1px solid ${wonBorder}`, color: wonColor }}>
            {r.won ? "✓ Won" : "✗ Lost"}
          </span>
        </div>
      </div>

      {/* Question */}
      <p style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, margin: 0, lineHeight: 1.45, letterSpacing: "-0.01em" }}>
        {r.question}
      </p>

      {/* Consensus bar */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: T.textDim, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>Consensus outcome</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: r.outcome === "YES" ? T.yes : T.no }}>{r.outcome} · {r.consensus}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <div style={{ width: `${r.consensus}%`, height: "100%", borderRadius: 3, background: r.outcome === "YES" ? T.yes : T.no }} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gap: 8 }} className="results-stats-grid">
        {[
          { label: "Your Side",   value: r.yourSide,                  color: r.yourSide === "YES" ? T.yes : T.no },
          { label: "Staked",      value: `${r.yourStake.toFixed(2)} QUAI`, color: T.textPrimary },
          { label: "Pool",        value: `$${(r.totalPool/1000).toFixed(1)}K`, color: T.textPrimary },
          { label: "Reward",      value: r.won ? `+${r.reward.toFixed(2)} QUAI` : "—", color: r.won ? T.yes : T.textDim },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ padding: "8px 10px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, textAlign: "center" }}>
            <p style={{ fontSize: 9, color: T.textDim, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>{label}</p>
            <p style={{ fontSize: 13, fontWeight: 800, color, margin: 0, letterSpacing: "-0.01em" }}>{value}</p>
          </div>
        ))}
      </div>
    </GCard>
  );
}

function PageResults() {
  const [tab, setTab] = useState("All");
  const { results, loading, error, refresh } = useResults();

  const filtered = results.filter(r => {
    if (tab === "Won")  return r.won;
    if (tab === "Lost") return !r.won;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="dash-page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>Results</h1>
          <p style={{ fontSize: 13, color: T.textMuted, margin: "4px 0 0" }}>Settled market outcomes and your performance history.</p>
        </div>
        <div className="dash-page-actions">
          <button type="button" onClick={refresh}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: T.glass, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
          >
            <RefreshCw size={12} strokeWidth={2} /> Refresh
          </button>
          <div style={{ display: "flex", gap: 4, padding: 4, background: T.glass, border: `1px solid ${T.border}`, borderRadius: 8 }}>
            {RESULT_TABS.map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                style={{ padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: tab === t ? "#ffffff" : "transparent", color: tab === t ? "#080808" : T.textMuted, transition: "all 0.15s" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444" }}>
          Could not load results: {error}
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3,4].map(i => <Sk.ResultCard key={i} />)}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(r => <ResultCard key={r.id} r={r} />)}
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <GCard style={{ padding: 0 }}>
          <EmptyState
            icon={BarChart3}
            title="No settled markets yet"
            body="Once markets you participated in are settled on-chain, your results and earnings will appear here."
          />
        </GCard>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   PAGE: LEADERBOARD
════════════════════════════════════════════════ */

const LB_TABS = ["All Time", "This Week", "This Month"];

function LeaderboardRow({ entry }) {
  const isTop3 = entry.rank <= 3;
  const rankColors = { 1: "#fbbf24", 2: "#94a3b8", 3: "#fb923c" };
  const rankColor = rankColors[entry.rank] || T.textDim;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      padding: "14px 20px",
      background: "transparent",
      borderBottom: `1px solid ${T.border}`,
      borderLeft: "3px solid transparent",
      transition: "background 0.15s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = T.glassHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
    >
      <div style={{ width: 32, textAlign: "center", flexShrink: 0 }}>
        {entry.badge
          ? <span style={{ fontSize: 18 }}>{entry.badge}</span>
          : <span style={{ fontSize: 14, fontWeight: 800, color: rankColor }}>{entry.rank}</span>
        }
      </div>

      <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: isTop3 ? "rgba(255,255,255,0.1)" : T.glass, border: `2px solid ${isTop3 ? rankColor : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {entry.avatarDataUrl
          ? <img src={entry.avatarDataUrl} alt={entry.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
          : <span style={{ fontSize: 12, fontWeight: 800, color: isTop3 ? rankColor : T.textMuted }}>{entry.initials}</span>
        }
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, margin: 0, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {entry.name}
        </p>
        <p style={{ fontSize: 10, color: T.textDim, margin: "2px 0 0" }}>
          {entry.country && `${entry.country} · `}{entry.activatedReferrals} referrals
        </p>
      </div>

      <div style={{ display: "flex", gap: 20, flexShrink: 0, alignItems: "center" }}>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: T.yes, margin: 0, display: "flex", alignItems: "center", gap: 3 }}>
            {entry.rewardsQuai != null ? <>{entry.rewardsQuai.toFixed(2)} <QuaiLogo size={13} /></> : "—"}
          </p>
          <p style={{ fontSize: 10, color: T.textDim, margin: 0 }}>Rewards</p>
        </div>
        {entry.profileUrl && (
          <a href={entry.profileUrl} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", color: T.textDim, transition: "color 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = T.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.textDim; }}
          >
            <ExternalLink size={12} strokeWidth={2} />
          </a>
        )}
      </div>
    </div>
  );
}

function PageLeaderboard() {
  const [tab, setTab] = useState("All Time");
  const { entries: liveEntries, loading: lbLoading, error: lbError, refresh: lbRefresh } = useBlipLeaderboard(50);

  // Map BlipPay leaderboard entries to display shape
  const board = liveEntries.map((e, i) => ({
    rank:              i + 1,
    name:              e.displayName || `${(e.shortCode ?? "unknown")}`,
    initials:          (e.displayName || e.shortCode || "??").split(/[\s-_]+/).map(w => w[0] || "").join("").slice(0, 2).toUpperCase(),
    activatedReferrals: e.activatedReferrals ?? 0,
    rewardsQuai:       e.totalRewardsWei
                         ? parseFloat((BigInt(e.totalRewardsWei) * BigInt(1000000) / BigInt("1000000000000000000")).toString()) / 1000000
                         : null,
    badge:             i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : null,
    avatarDataUrl:     e.avatarDataUrl ?? null,
    profileUrl:        e.shortUrl ?? null,
    country:           e.countryName ?? null,
  }));

  const top3 = board.slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>Leaderboard</h1>
          <p style={{ fontSize: 13, color: T.textMuted, margin: "4px 0 0" }}>
            Top BlipPay referral network participants · live rankings.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" onClick={lbRefresh}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: T.glass, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
          >
            <RefreshCw size={12} strokeWidth={2} /> Refresh
          </button>
          <div style={{ display: "flex", gap: 4, padding: 4, background: T.glass, border: `1px solid ${T.border}`, borderRadius: 8 }}>
            {LB_TABS.map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                style={{ padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: tab === t ? "#ffffff" : "transparent", color: tab === t ? "#080808" : T.textMuted, transition: "all 0.15s" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live badge */}
      {board.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: T.yesBg, border: `1px solid ${T.yesBorder}`, fontSize: 12, color: T.yes, fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.yes, boxShadow: `0 0 6px ${T.yes}`, flexShrink: 0 }} />
          Live · BlipPay referral network · {liveEntries.length} participants
          <a href="https://blippay.me/leaderboard" target="_blank" rel="noopener noreferrer"
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, color: T.yes, textDecoration: "none", fontSize: 11 }}>
            View full leaderboard <ExternalLink size={11} strokeWidth={2} />
          </a>
        </div>
      )}

      {lbLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[1,2,3,4,5].map(i => <Sk.LeaderboardRow key={i} last={i===5} />)}
        </div>
      )}

      {lbError && !lbLoading && (
        <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444" }}>
          Could not load leaderboard: {lbError}
        </div>
      )}

      {!lbLoading && board.length === 0 && !lbError && (
        <GCard style={{ padding: 0 }}>
          <EmptyState icon={Trophy} title="No rankings yet" body="Leaderboard data will appear once the referral network has participants." />
        </GCard>
      )}

      {/* Top 3 podium */}
      {!lbLoading && top3.length >= 3 && (
        <div style={{ display: "grid", gap: 12 }} className="dash-kpi-grid">
          {[top3[1], top3[0], top3[2]].map((entry, i) => {
            const colors = ["#94a3b8", "#fbbf24", "#fb923c"];
            const heights = ["80px", "96px", "72px"];
            return (
              <GCard key={entry.rank} style={{ padding: "20px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10, borderColor: i === 1 ? "rgba(251,191,36,0.3)" : T.border, paddingTop: heights[i] === "96px" ? "24px" : "20px" }}>
                <div style={{ fontSize: 28 }}>{entry.badge}</div>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: `2px solid ${colors[i]}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {entry.avatarDataUrl
                    ? <img src={entry.avatarDataUrl} alt={entry.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                    : <span style={{ fontSize: 14, fontWeight: 800, color: colors[i] }}>{entry.initials}</span>
                  }
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{entry.name}</p>
                  {entry.rewardsQuai != null && (
                    <p style={{ fontSize: 11, color: colors[i], margin: "2px 0 0", fontWeight: 700, display: "flex", alignItems: "center", gap: 2 }}>{entry.rewardsQuai.toFixed(4)} <QuaiLogo size={10} /></p>
                  )}
                  <p style={{ fontSize: 10, color: T.textDim, margin: "2px 0 0" }}>{entry.activatedReferrals} referrals</p>
                </div>
              </GCard>
            );
          })}
        </div>
      )}

      {/* Full table */}
      {!lbLoading && board.length > 0 && (
        <GCard style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 20px", borderBottom: `1px solid ${T.border}`, background: T.glass }}>
            <div style={{ width: 32 }}><span style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>#</span></div>
            <div style={{ width: 38 }} />
            <div style={{ flex: 1 }}><span style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>Participant</span></div>
            <div style={{ textAlign: "right" }}><span style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase" }}>Rewards</span></div>
          </div>
          {board.map((entry) => <LeaderboardRow key={entry.rank} entry={entry} />)}
        </GCard>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   PAGE: REWARDS
════════════════════════════════════════════════ */

const REWARD_TABS = ["Unclaimed", "Claimed"];

function RewardCard({ r, onClaim, claiming, claimError, setClaimError }) {
  const isClaiming = claiming === r.id;

  const handleClaim = async () => {
    if (setClaimError) setClaimError(null);
    try {
      await onClaim(r.id);
    } catch (err) {
      if (setClaimError) setClaimError(err.message ?? "Claim failed. Please try again.");
    }
  };

  return (
    <GCard style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14, borderColor: !r.claimed ? "rgba(34,197,94,0.2)" : T.border }}>
      {/* Top */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <CategoryBadge category={r.category} />
        <span style={{ fontSize: 10, color: T.textDim }}>{r.settledAt}</span>
      </div>

      {/* Question */}
      <p style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, margin: 0, lineHeight: 1.45, letterSpacing: "-0.01em" }}>
        {r.question}
      </p>

      {/* Outcome + your side */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: r.outcome === "YES" ? T.yesBg : T.noBg, border: `1px solid ${r.outcome === "YES" ? T.yesBorder : T.noBorder}`, color: r.outcome === "YES" ? T.yes : T.no }}>
          Outcome: {r.outcome}
        </span>
        <span style={{ fontSize: 11, color: T.textDim }}>·</span>
        <span style={{ fontSize: 11, color: T.textMuted }}>Market outcome: <span style={{ fontWeight: 700, color: r.outcome === "YES" ? T.yes : T.no }}>{r.outcome}</span></span>
      </div>

      {/* Reward row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
        <div style={{ padding: "10px 12px", borderRadius: 10, background: !r.claimed ? T.yesBg : T.glass, border: `1px solid ${!r.claimed ? T.yesBorder : T.border}` }}>
          <p style={{ fontSize: 9, color: !r.claimed ? T.yes : T.textDim, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>Reward</p>
          <p style={{ fontSize: 18, fontWeight: 800, color: !r.claimed ? T.yes : T.textMuted, margin: 0, display: "flex", alignItems: "center", gap: 5 }}>+{r.reward.toFixed(2)} <QuaiLogo size={15} /></p>
        </div>
      </div>

      {/* Claim button / claimed state */}
      {!r.claimed ? (
        <button
          type="button"
          onClick={handleClaim}
          disabled={isClaiming}
          style={{ width: "100%", padding: "12px", borderRadius: 10, border: "none", background: isClaiming ? "rgba(34,197,94,0.4)" : T.yes, color: "#000000", fontSize: 13, fontWeight: 800, cursor: isClaiming ? "not-allowed" : "pointer", transition: "background 0.15s", letterSpacing: "-0.01em" }}
        >
          {isClaiming ? "Confirming on-chain…" : `Claim ${r.reward.toFixed(2)} QUAI`}
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}` }}>
            <CheckCircle2 size={14} strokeWidth={2} style={{ color: T.textDim }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: T.textDim }}>Claimed</span>
          </div>
          {r.txHash && (
            <a
              href={`https://quaiscan.io/tx/${r.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 11, color: T.violet, textDecoration: "none", fontWeight: 600 }}
            >
              <ExternalLink size={11} strokeWidth={2} /> View on Quaiscan
            </a>
          )}
        </div>
      )}
    </GCard>
  );
}

function PageRewards() {
  const [tab, setTab]           = useState("Unclaimed");
  const [claimError, setClaimError] = useState(null);
  const { rewards, loading, error, claiming, claimReward, refresh } = useRewards();

  const filtered = rewards.filter(r => tab === "Unclaimed" ? !r.claimed : r.claimed);

  const pendingTotal  = rewards.filter(r => !r.claimed).reduce((s, r) => s + r.reward, 0);
  const claimedTotal  = rewards.filter(r =>  r.claimed).reduce((s, r) => s + r.reward, 0);
  const allTimeTotal  = rewards.reduce((s, r) => s + r.reward, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="dash-page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>Rewards</h1>
          <p style={{ fontSize: 13, color: T.textMuted, margin: "4px 0 0" }}>Claim your earnings from settled markets.</p>
        </div>
        <div className="dash-page-actions">
          <button type="button" onClick={refresh}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, background: T.glass, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "border-color 0.15s, color 0.15s" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.textPrimary; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
          >
            <RefreshCw size={12} strokeWidth={2} /> Refresh
          </button>
          <div style={{ display: "flex", gap: 4, padding: 4, background: T.glass, border: `1px solid ${T.border}`, borderRadius: 8 }}>
            {REWARD_TABS.map(t => (
              <button key={t} type="button" onClick={() => setTab(t)}
                style={{ padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", border: "none", background: tab === t ? "#ffffff" : "transparent", color: tab === t ? "#080808" : T.textMuted, transition: "all 0.15s" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary cards — live totals */}
      <div className="dash-kpi-grid-3" style={{ gap: 12 }}>
        {[
          { label: "Pending",  icon: Gift,         color: pendingTotal > 0 ? T.yes : T.textMuted, bg: pendingTotal > 0 ? T.yesBg : T.glass, border: pendingTotal > 0 ? T.yesBorder : T.border, value: pendingTotal },
          { label: "Claimed",  icon: CheckCircle2, color: T.textMuted, bg: T.glass,  border: T.border, value: claimedTotal },
          { label: "All Time", icon: Coins,        color: T.textMuted, bg: T.glass,  border: T.border, value: allTimeTotal },
        ].map(({ label, icon: Icon, color, bg, border, value }) => (
          <GCard key={label} style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon size={18} strokeWidth={1.8} style={{ color }} />
            </div>
            <div>
              <p style={{ fontSize: 10, color: T.textDim, margin: "0 0 2px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</p>
              <p style={{ fontSize: 20, fontWeight: 800, color: T.textPrimary, margin: 0, letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: 5 }}>
                {loading ? "—" : value.toFixed(2)} <QuaiLogo size={16} />
              </p>
            </div>
          </GCard>
        ))}
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444" }}>
          Could not load rewards: {error}
        </div>
      )}

      {claimError && (
        <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444" }}>
          {claimError}
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1,2,3,4].map(i => <Sk.RewardRow key={i} last={i===3} />)}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: "grid", gap: 12 }} className="q-grid">
          {filtered.map(r => (
            <RewardCard
              key={r.id}
              r={r}
              onClaim={claimReward}
              claiming={claiming}
              claimError={claimError}
              setClaimError={setClaimError}
            />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && !error && (
        <GCard style={{ padding: 0 }}>
          <EmptyState
            icon={Gift}
            title={tab === "Unclaimed" ? "No rewards to claim" : "No claimed rewards yet"}
            body={tab === "Unclaimed"
              ? "Rewards become claimable after markets you predicted on are resolved. Predict correctly to earn rewards."
              : "Once you claim rewards they will appear here."}
          />
        </GCard>
      )}

      {/* How rewards work — static explainer */}
      <GCard style={{ padding: "18px 22px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 14px" }}>How rewards work</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }} className="reward-how-grid">
          {[
            { icon: Target, label: "Predict correctly",  desc: "Pick the winning side and commit your prediction." },
            { icon: Lock2,  label: "Market resolves",    desc: "Once the deadline passes, the oracle verifies the real-world result." },
            { icon: Gift,   label: "Claim your share",   desc: "Correct predictions split the opposing pool proportional to their position." },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: T.glass, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <Icon size={14} strokeWidth={1.8} style={{ color: T.textMuted }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary, margin: 0 }}>{label}</p>
                <p style={{ fontSize: 11, color: T.textDim, margin: "3px 0 0", lineHeight: 1.5 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </GCard>
    </div>
  );
}

/* ════════════════════════════════════════════════
   PAGE: HOW IT WORKS  (full rebuild)
════════════════════════════════════════════════ */

const HOW_STEPS = [
  { step: "01", icon: HelpCircle,    title: "Generate Questions",        desc: "Markets are automatically generated from templates and live data. New markets open every day.", color: "#38bdf8"  },
  { step: "02", icon: Target,        title: "Browse Markets",            desc: "Explore active prediction markets across Crypto, Sports, Weather, and Stocks categories.",        color: "#a78bfa"  },
  { step: "03", icon: Coins,         title: "Predict YES or NO",         desc: "Choose your side for each question. Commit a position on the outcome you believe will happen.",   color: "#fbbf24"  },
  { step: "04", icon: PieChart,      title: "Market Shows the Split",    desc: "The YES/NO percentage reflects total capital on each side — a live signal of where predictions sit.", color: "#22c55e"  },
  { step: "05", icon: ArrowLeftRight,title: "Switch Once If Needed",     desc: "Changed your mind? You get one position switch per market, as long as 5+ minutes remain.",       color: "#fb923c"  },
  { step: "06", icon: ShieldCheck,   title: "Oracle Verifies",           desc: "When the deadline arrives, the system checks the agreed data source and determines the result.",  color: "#f472b6"  },
  { step: "07", icon: Gift,          title: "Claim Your Rewards",        desc: "Correct predictions earn a share of the opposing pool as rewards. Claim from the contract.",      color: "#22c55e"  },
];

const FAQ_ITEMS = [
  { q: "How is the outcome determined?",        a: "The system fetches the verified real-world result from the agreed data source at the market deadline. The result is determined automatically by the oracle — no human or admin decides the outcome." },
  { q: "Can I change my prediction?",           a: "You may switch your position once per market, as long as at least 5 minutes remain before the deadline. Once the market closes, no changes are accepted." },
  { q: "What is the switch rule?",              a: "Each participant gets exactly one position switch per market. The switch is only valid if at least 5 minutes remain before market close. Your position moves to the new side." },
  { q: "How are rewards calculated?",           a: "Winners split the entire opposing pool proportional to their share of the winning side. For example, if you hold 10% of the YES pool and YES wins, you receive 10% of the NO pool plus your original position." },
  { q: "What data sources does Q4 use?",        a: "Q4 uses external oracle data sources appropriate to each category. Crypto markets use verified price feeds, sports markets use match statistics APIs, weather markets use weather data APIs, and stocks use closing price data." },
  { q: "When do markets resolve?",              a: "Markets resolve automatically when the deadline is reached. The oracle verifies the outcome and the market settles without any manual input. Rewards are claimable from your dashboard shortly after." },
];

function FAQItem({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${T.border}` }}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: open ? "#ffffff" : T.textMuted, letterSpacing: "-0.01em", transition: "color 0.15s" }}>{item.q}</span>
        <ChevronDown size={15} strokeWidth={2.2} style={{ color: T.textDim, flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>
      <div style={{ overflow: "hidden", maxHeight: open ? 200 : 0, opacity: open ? 1 : 0, transition: "max-height 0.3s ease, opacity 0.2s ease" }}>
        <p style={{ fontSize: 13, color: T.textMuted, margin: "0 0 16px", lineHeight: 1.6 }}>{item.a}</p>
      </div>
    </div>
  );
}

function PageHowItWorks({ onNavigate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>How Q4 Works</h1>
        <p style={{ fontSize: 13, color: T.textMuted, margin: "4px 0 0" }}>Generate → Predict → Wait → Verify → Resolve.</p>
      </div>

      {/* Core concept banner */}
      <div style={{ padding: "22px 24px", borderRadius: 16, background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 100%)", border: `1px solid ${T.borderHover}`, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(124,111,247,0.15)", border: "1px solid rgba(124,111,247,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Sparkles size={22} strokeWidth={1.8} style={{ color: T.violet }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#ffffff", margin: "0 0 4px", letterSpacing: "-0.02em" }}>Short-term. Verifiable. Automatic.</p>
          <p style={{ fontSize: 13, color: T.textMuted, margin: 0, lineHeight: 1.6 }}>
            Q4 markets open today, close at the deadline, and resolve automatically using <strong style={{ color: T.textPrimary }}>verified real-world data</strong>. No admin decides the outcome — the oracle does.
          </p>
        </div>
      </div>

      {/* Step-by-step */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>Step by step</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {HOW_STEPS.map((s, i) => (
            <div key={s.step} style={{ display: "flex", gap: 0, position: "relative" }}>
              {/* Connector line */}
              {i < HOW_STEPS.length - 1 && (
                <div style={{ position: "absolute", left: 17, top: 44, width: 2, height: "calc(100% - 16px)", background: `linear-gradient(180deg, ${s.color}40, transparent)`, zIndex: 0 }} />
              )}
              {/* Step icon */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: 16, flexShrink: 0, zIndex: 1 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}18`, border: `1px solid ${s.color}40`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <s.icon size={16} strokeWidth={1.8} style={{ color: s.color }} />
                </div>
              </div>
              {/* Content */}
              <div style={{ flex: 1, paddingBottom: i < HOW_STEPS.length - 1 ? 20 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: s.color, letterSpacing: "0.1em" }}>{s.step}</span>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", margin: 0, letterSpacing: "-0.01em" }}>{s.title}</h3>
                </div>
                <p style={{ fontSize: 13, color: T.textMuted, margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Market lifecycle */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 14px" }}>Market lifecycle</p>
        <div style={{ display: "grid", gap: 10 }} className="dash-how-grid">
          {[
            { status: "Created",  color: "#38bdf8", desc: "Deployed with a question, YES/NO outcomes, deadline, and oracle data source." },
            { status: "Active",   color: T.yes,    desc: "Users browse and commit YES or NO predictions before the deadline." },
            { status: "Closed",   color: "#fbbf24", desc: "Deadline reached. No further predictions accepted." },
            { status: "Resolved", color: T.violet, desc: "Oracle verifies result. Market resolves YES or NO. Rewards become claimable." },
          ].map(({ status, color, desc }) => (
            <GCard key={status} style={{ padding: "16px 18px" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: `${color}18`, border: `1px solid ${color}35`, color, marginBottom: 10 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />{status}
              </span>
              <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.55 }}>{desc}</p>
            </GCard>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>Frequently asked questions</p>
        <GCard style={{ padding: "0 22px" }}>
          {FAQ_ITEMS.map(item => <FAQItem key={item.q} item={item} />)}
        </GCard>
      </div>

      {/* CTA */}
      <GCard style={{ padding: "22px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trophy size={20} strokeWidth={1.8} style={{ color: "#fbbf24" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", margin: 0, letterSpacing: "-0.02em" }}>Predict today. Know the result tonight.</p>
            <p style={{ fontSize: 12, color: T.textMuted, margin: "2px 0 0" }}>Markets open, close, and resolve within 24 hours.</p>
          </div>
        </div>
        <button type="button" onClick={() => onNavigate("questions")}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 8, background: "#ffffff", color: "#080808", fontSize: 13, fontWeight: 700, border: "none", cursor: "pointer", flexShrink: 0 }}>
          Browse Markets <ArrowRight size={14} strokeWidth={2.5} />
        </button>
      </GCard>
    </div>
  );
}

/* ════════════════════════════════════════════════
   ADMIN CHART COMPONENTS
   Pure SVG — no external charting lib required
════════════════════════════════════════════════ */

/**
 * SVG Donut chart.
 * slices: Array<{ label, value, color }>
 * total: number shown in centre
 */
function AdminDonutChart({ slices, total, centerLabel = "Total" }) {
  const [hovered, setHovered] = useState(null);
  const cx = 80, cy = 80, R = 60, r = 38;
  const sum = slices.reduce((a, s) => a + s.value, 0) || 1;

  // Build arc paths
  let cursor = -Math.PI / 2; // start at 12 o'clock
  const paths = slices.map((s) => {
    const sweep = (s.value / sum) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(cursor);
    const y1 = cy + R * Math.sin(cursor);
    cursor += sweep;
    const x2 = cx + R * Math.cos(cursor);
    const y2 = cy + R * Math.sin(cursor);
    const largeArc = sweep > Math.PI ? 1 : 0;
    // inner arc
    const ix1 = cx + r * Math.cos(cursor);
    const iy1 = cy + r * Math.sin(cursor);
    const ix2 = cx + r * Math.cos(cursor - sweep);
    const iy2 = cy + r * Math.sin(cursor - sweep);
    const d = [
      `M ${x1} ${y1}`,
      `A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${r} ${r} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      "Z",
    ].join(" ");
    return { ...s, d, pct: Math.round((s.value / sum) * 100) };
  });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
      <svg width={160} height={160} style={{ flexShrink: 0, overflow: "visible" }}>
        {paths.map((p, i) => (
          <path
            key={p.label}
            d={p.d}
            fill={hovered === i ? p.color : p.color + "cc"}
            stroke="#111111"
            strokeWidth={hovered === i ? 2 : 1}
            style={{ cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        {/* Centre hole */}
        <circle cx={cx} cy={cy} r={r - 2} fill="#111111" />
        {/* Centre label */}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="22" fontWeight="800" fill="#ffffff" fontFamily="sans-serif">
          {hovered !== null ? paths[hovered]?.value : total}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)" fontFamily="sans-serif">
          {hovered !== null ? paths[hovered]?.label : centerLabel}
        </text>
        {hovered !== null && (
          <text x={cx} y={cy + 24} textAnchor="middle" fontSize="11" fill={paths[hovered]?.color} fontFamily="sans-serif" fontWeight="700">
            {paths[hovered]?.pct}%
          </text>
        )}
      </svg>
      {/* Legend */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 0 }}>
        {paths.map((p, i) => (
          <div
            key={p.label}
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", opacity: hovered !== null && hovered !== i ? 0.4 : 1, transition: "opacity 0.15s" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: T.textMuted, flex: 1 }}>{p.label}</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#ffffff" }}>{p.value}</span>
            <span style={{ fontSize: 10, color: T.textDim, minWidth: 34, textAlign: "right" }}>{p.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Bar chart — volume grouped by category.
 * markets: array from useAdminMarkets
 */
function AdminBarChart({ markets }) {
  const [hovered, setHovered] = useState(null);

  const CAT_COLORS = {
    Crypto:  "#fbbf24",
    Sports:  "#fb923c",
    Weather: "#38bdf8",
    Stocks:  "#34d399",
  };

  // Aggregate total pool per category
  const cats = ["Crypto", "Sports", "Weather", "Stocks"];
  const data = cats.map((cat) => ({
    label: cat,
    value: markets
      .filter((m) => m.category === cat)
      .reduce((s, m) => s + m.totalPool, 0),
    color: CAT_COLORS[cat] || "#a78bfa",
    count: markets.filter((m) => m.category === cat).length,
  }));

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const barH = 120;

  if (markets.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 140, color: T.textDim, fontSize: 13 }}>
        No market data yet
      </div>
    );
  }

  return (
    <div>
      {/* Bar chart */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: barH + 32, paddingBottom: 28, position: "relative" }}>
        {/* Y-axis gridlines */}
        {[0, 25, 50, 75, 100].map((pct) => (
          <div key={pct} style={{
            position: "absolute", left: 0, right: 0,
            bottom: 28 + (pct / 100) * barH,
            borderTop: `1px dashed rgba(255,255,255,0.06)`,
            pointerEvents: "none",
          }} />
        ))}

        {data.map((d, i) => {
          const barHeightPx = maxVal > 0 ? Math.max(4, (d.value / maxVal) * barH) : 4;
          const isHov = hovered === i;
          return (
            <div
              key={d.label}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, position: "relative", cursor: "pointer" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tooltip */}
              {isHov && (
                <div style={{
                  position: "absolute", bottom: barHeightPx + 36, left: "50%", transform: "translateX(-50%)",
                  background: "rgba(16,16,16,0.97)", border: `1px solid ${d.color}40`,
                  borderRadius: 8, padding: "6px 10px", whiteSpace: "nowrap", zIndex: 10, pointerEvents: "none",
                }}>
                  <p style={{ fontSize: 12, fontWeight: 800, color: d.color, margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>{d.value.toFixed(2)} <QuaiLogo size={11} /></p>
                  <p style={{ fontSize: 10, color: T.textDim, margin: "2px 0 0" }}>{d.count} market{d.count !== 1 ? "s" : ""}</p>
                </div>
              )}
              {/* Bar */}
              <div style={{
                width: "100%", height: barHeightPx,
                borderRadius: "4px 4px 0 0",
                background: isHov ? d.color : d.color + "99",
                transition: "height 0.4s ease, background 0.15s",
                alignSelf: "flex-end",
                boxShadow: isHov ? `0 0 16px ${d.color}55` : "none",
              }} />
              {/* X label */}
              <span style={{
                position: "absolute", bottom: 4,
                fontSize: 10, fontWeight: 700, color: isHov ? d.color : T.textDim,
                textAlign: "center", transition: "color 0.15s",
              }}>
                {d.label.slice(0, 6)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Value labels below bars */}
      <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
        {data.map((d) => (
          <div key={d.label} style={{ flex: 1, textAlign: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: d.color, display: "inline-flex", alignItems: "center", gap: 2 }}>
              {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}K` : d.value.toFixed(0)} <QuaiLogo size={10} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * User-facing dashboard platform breakdown charts.
 * Shows: category distribution donut + market status bars + YES/NO pool split.
 */
function UserDashboardCharts({ markets, positions, wins = 0, losses = 0 }) {
  const [hovCat, setHovCat] = useState(null);
  const [hovStatus, setHovStatus] = useState(null);

  // — Category donut —
  const CAT_COLORS = { Crypto: "#fbbf24", Sports: "#fb923c", Weather: "#38bdf8", Stocks: "#34d399" };
  const catCounts = {};
  markets.forEach((m) => { catCounts[m.category] = (catCounts[m.category] || 0) + 1; });
  const catSlices = Object.entries(catCounts).map(([label, value]) => ({
    label, value, color: CAT_COLORS[label] || "#a78bfa",
  })).sort((a, b) => b.value - a.value);

  // — Market status bars —
  const statuses = ["active", "closed", "resolved", "paused"];
  const statusColors = { active: "#22c55e", closed: "#fbbf24", resolved: "#7c6ff7", paused: "#94a3b8" };
  const statusCounts = statuses.map((s) => ({
    label: s.charAt(0).toUpperCase() + s.slice(1),
    value: markets.filter((m) => m.status === s).length,
    color: statusColors[s],
  }));
  const maxStatus = Math.max(...statusCounts.map((s) => s.value), 1);

  // — Position side breakdown (all positions, not just open) —
  const yesPositions = positions.filter((p) => p.side === "YES").length;
  const noPositions  = positions.filter((p) => p.side === "NO").length;
  const totalPos     = yesPositions + noPositions || 1;

  // — Win / Loss breakdown (resolved positions only) —
  const totalResolved = wins + losses;

  if (markets.length === 0 && positions.length === 0) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="dash-kpi-grid">

      {/* Category distribution donut */}
      <GCard style={{ padding: "18px 22px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>
          Markets by Category
        </p>
        {catSlices.length === 0 ? (
          <p style={{ fontSize: 13, color: T.textDim }}>No market data yet.</p>
        ) : (
          <AdminDonutChart slices={catSlices} total={markets.length} centerLabel="Markets" />
        )}
      </GCard>

      {/* Right panel: market status + my positions breakdown */}
      <GCard style={{ padding: "18px 22px" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 14px" }}>
          Market Status Breakdown
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          {statusCounts.map((s, i) => (
            <div key={s.label}
              style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovStatus(i)}
              onMouseLeave={() => setHovStatus(null)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: hovStatus === i ? s.color : T.textMuted, fontWeight: 600, transition: "color 0.15s" }}>{s.label}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: s.color }}>{s.value}</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{
                  width: `${(s.value / maxStatus) * 100}%`,
                  height: "100%", borderRadius: 3,
                  background: s.color,
                  opacity: hovStatus === i ? 1 : 0.7,
                  transition: "width 0.5s ease, opacity 0.15s",
                  boxShadow: hovStatus === i ? `0 0 8px ${s.color}88` : "none",
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* My positions: YES/NO split */}
        {positions.length > 0 && (
          <>
            <p style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>
              My Positions — YES / NO
            </p>
            <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <div style={{ flex: yesPositions || 1, padding: "10px", borderRadius: 8, background: T.yesBg, border: `1px solid ${T.yesBorder}`, textAlign: "center" }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: T.yes, margin: 0 }}>{yesPositions}</p>
                <p style={{ fontSize: 10, color: T.yes, margin: "2px 0 0", opacity: 0.7 }}>YES</p>
              </div>
              <div style={{ flex: noPositions || 1, padding: "10px", borderRadius: 8, background: T.noBg, border: `1px solid ${T.noBorder}`, textAlign: "center" }}>
                <p style={{ fontSize: 18, fontWeight: 800, color: T.no, margin: 0 }}>{noPositions}</p>
                <p style={{ fontSize: 10, color: T.no, margin: "2px 0 0", opacity: 0.7 }}>NO</p>
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: T.noBg, overflow: "hidden", border: `1px solid ${T.noBorder}` }}>
              <div style={{ width: `${(yesPositions / totalPos) * 100}%`, height: "100%", background: T.yes, borderRadius: 3, transition: "width 0.5s ease" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, marginBottom: 14 }}>
              <span style={{ fontSize: 10, color: T.yes, fontWeight: 700 }}>{Math.round((yesPositions / totalPos) * 100)}% YES</span>
              <span style={{ fontSize: 10, color: T.no,  fontWeight: 700 }}>{Math.round((noPositions  / totalPos) * 100)}% NO</span>
            </div>

            {/* Resolved: Wins / Losses */}
            {totalResolved > 0 && (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 10px" }}>
                  Resolved — Wins / Losses
                </p>
                <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <div style={{ flex: wins || 1, padding: "10px", borderRadius: 8, background: T.yesBg, border: `1px solid ${T.yesBorder}`, textAlign: "center" }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: T.yes, margin: 0 }}>{wins}</p>
                    <p style={{ fontSize: 10, color: T.yes, margin: "2px 0 0", opacity: 0.7 }}>Won</p>
                  </div>
                  <div style={{ flex: losses || 1, padding: "10px", borderRadius: 8, background: T.noBg, border: `1px solid ${T.noBorder}`, textAlign: "center" }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: T.no, margin: 0 }}>{losses}</p>
                    <p style={{ fontSize: 10, color: T.no, margin: "2px 0 0", opacity: 0.7 }}>Lost</p>
                  </div>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: T.noBg, overflow: "hidden", border: `1px solid ${T.noBorder}` }}>
                  <div style={{ width: `${(wins / totalResolved) * 100}%`, height: "100%", background: T.yes, borderRadius: 3, transition: "width 0.5s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: T.yes, fontWeight: 700 }}>{Math.round((wins   / totalResolved) * 100)}% Win</span>
                  <span style={{ fontSize: 10, color: T.no,  fontWeight: 700 }}>{Math.round((losses / totalResolved) * 100)}% Loss</span>
                </div>
              </>
            )}
          </>
        )}
      </GCard>
    </div>
  );
}

/* ════════════════════════════════════════════════
   PAGE: ADMIN DASHBOARD
════════════════════════════════════════════════ */

const STATUS_COLORS = {
  active:    { color: "#22c55e", bg: "rgba(34,197,94,0.1)",    border: "rgba(34,197,94,0.25)"    },
  closed:    { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.25)"   },
  resolved:  { color: "#7c6ff7", bg: "rgba(124,111,247,0.1)",  border: "rgba(124,111,247,0.25)"  },
  paused:    { color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.25)"  },
  cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.25)"    },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.cancelled;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

const ADMIN_TABS = [
  { key: "overview",   label: "Overview"    },
  { key: "markets",    label: "Markets"     },
  { key: "users",      label: "Users"       },
  { key: "positions",  label: "Positions"   },
  { key: "oracle",     label: "Oracle"      },
  { key: "events",     label: "Events"      },
  { key: "create",     label: "+ New Market"},
];

/* ── shared tab bar ── */
function AdminTabBar({ tab, setTab }) {
  return (
    <div className="admin-tab-bar">
      {ADMIN_TABS.map(t => (
        <button key={t.key} type="button" onClick={() => setTab(t.key)}
          style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: "pointer", border: "none",
            background: tab === t.key ? (t.key === "create" ? "#22c55e" : "#ffffff") : "transparent",
            color: tab === t.key ? (t.key === "create" ? "#000" : "#080808") : T.textMuted,
            transition: "all 0.15s",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ── admin header row (shared) ── */
function AdminHeader({ tab, setTab, onRefresh }) {
  return (
    <div className="admin-header">
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.03em" }}>Admin Dashboard</h1>
          <span style={{ padding: "2px 10px", borderRadius: 999, fontSize: 10, fontWeight: 800, background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24" }}>ADMIN</span>
        </div>
        <p style={{ fontSize: 13, color: T.textMuted, margin: 0 }}>Full platform control — markets, users, positions, oracle & events.</p>
      </div>
      <button type="button" onClick={onRefresh}
        style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "border-color 0.15s, color 0.15s", flexShrink: 0 }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.textPrimary; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
      >
        <RefreshCw size={13} strokeWidth={2} /> Refresh
      </button>
    </div>
  );
}

function PageAdmin() {
  const [tab, setTab] = useState("overview");

  // All admin hooks — always called (hooks can't be conditional)
  const { stats,     loading: statsLoading,    refresh: refreshStats    } = useAdminStats();
  const { markets,   loading: marketsLoading,  error: marketsError,
          refresh: refreshMarkets, pauseMarket, activateMarket,
          closeMarket, resolveMarket, deleteMarket, createMarket         } = useAdminMarkets();
  const { users,     loading: usersLoading,    error: usersError,
          refresh: refreshUsers,   setUserRole, deleteUser               } = useAdminUsers();
  const { positions, loading: positionsLoading, error: positionsError,
          refresh: refreshPositions                                       } = useAdminPositions();
  const { results: oracleResults, loading: oracleLoading,
          refresh: refreshOracle                                          } = useAdminOracle();
  const { events,    loading: eventsLoading,   refresh: refreshEvents    } = useAdminEvents();

  // Per-tab UI state
  const [roleUpdating,   setRoleUpdating]   = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [resolveTarget,  setResolveTarget]  = useState(null); // { market }
  const [resolveOutcome, setResolveOutcome] = useState("YES");
  const [deleteTarget,   setDeleteTarget]   = useState(null); // { id, question, type: 'market'|'user' }
  const [confirmRole,    setConfirmRole]    = useState(null);
  const [marketFilter,   setMarketFilter]   = useState("all");
  const [userSearch,     setUserSearch]     = useState("");
  const [posSearch,      setPosSearch]      = useState("");

  // Create market form
  const [createForm, setCreateForm] = useState({ question: "", category: "Crypto", deadline: "", data_source: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError,   setCreateError]   = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);

  // Per-tab refresh
  const tabRefreshMap = {
    overview:  () => { refreshStats(); refreshMarkets(); refreshUsers(); },
    markets:   refreshMarkets,
    users:     refreshUsers,
    positions: refreshPositions,
    oracle:    refreshOracle,
    events:    refreshEvents,
    create:    () => {},
  };
  const handleRefresh = () => { const fn = tabRefreshMap[tab]; if (fn) fn(); };

  const handleToggleMarket = async (market) => {
    setStatusUpdating(market.id);
    if (market.status === "active")  await pauseMarket(market.id);
    else if (market.status === "paused") await activateMarket(market.id);
    else if (market.status === "closed") await activateMarket(market.id);
    setStatusUpdating(null);
  };

  const handleResolve = async () => {
    if (!resolveTarget) return;
    setStatusUpdating(resolveTarget.market.id);
    await resolveMarket(resolveTarget.market.id, resolveOutcome);
    setStatusUpdating(null);
    setResolveTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "market") await deleteMarket(deleteTarget.id);
    if (deleteTarget.type === "user")   await deleteUser(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleRoleChange = async () => {
    if (!confirmRole) return;
    setRoleUpdating(confirmRole.userId);
    await setUserRole(confirmRole.userId, confirmRole.newRole);
    setRoleUpdating(null);
    setConfirmRole(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);
    const { ok, error: err } = await createMarket(createForm);
    if (ok) {
      setCreateSuccess("Market created successfully!");
      setCreateForm({ question: "", category: "Crypto", deadline: "", data_source: "" });
    } else {
      setCreateError(err ?? "Failed to create market.");
    }
    setCreateLoading(false);
  };

  const visibleMarkets  = markets.filter(m  => marketFilter === "all" || m.status === marketFilter);
  const visibleUsers    = users.filter(u    => !userSearch  || (u.display_name ?? "").toLowerCase().includes(userSearch.toLowerCase()) || (u.email ?? "").toLowerCase().includes(userSearch.toLowerCase()));
  const visiblePositions = positions.filter(p => !posSearch || (p.users?.display_name ?? "").toLowerCase().includes(posSearch.toLowerCase()) || (p.markets?.question ?? "").toLowerCase().includes(posSearch.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Header + Refresh ── */}
      <AdminHeader tab={tab} setTab={setTab} onRefresh={handleRefresh} />

      {/* ── Tab bar ── */}
      <AdminTabBar tab={tab} setTab={setTab} />

      {/* ════ OVERVIEW TAB ════ */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

          {/* Stats KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14 }}>
            {[
              { label: "Total Users",       value: stats?.totalUsers      ?? "—", icon: Users,       color: "#38bdf8" },
              { label: "Total Markets",     value: stats?.totalMarkets    ?? "—", icon: BarChart3,   color: "#a78bfa" },
              { label: "Active Markets",    value: stats?.activeMarkets   ?? "—", icon: Zap,         color: "#22c55e" },
              { label: "Resolved Markets",  value: stats?.resolvedMarkets ?? "—", icon: CheckCircle2,color: "#7c6ff7" },
              { label: "Total Positions",   value: stats?.totalPositions  ?? "—", icon: BookMarked,  color: "#fb923c" },
              { label: "Volume (Q)",        value: stats?.totalVolume != null ? stats.totalVolume.toFixed(2) : "—", icon: Coins, color: "#fbbf24" },
            ].map(({ label, value, icon: Icon, color }) => (
              <GCard key={label} style={{ padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>{label}</p>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={14} strokeWidth={1.8} style={{ color }} />
                  </div>
                </div>
                <p style={{ fontSize: 28, fontWeight: 800, color: "#ffffff", margin: 0, letterSpacing: "-0.04em" }}>
                  {statsLoading ? <span style={{ fontSize: 14, color: T.textDim }}>Loading…</span> : value}
                </p>
              </GCard>
            ))}
          </div>

          {/* ── CHARTS ROW ── */}
          {!statsLoading && stats && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="dash-kpi-grid">

              {/* Market Status Donut */}
              <GCard style={{ padding: "18px 22px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>Market Status Breakdown</p>
                <AdminDonutChart
                  slices={[
                    { label: "Active",   value: stats.activeMarkets,                                               color: "#22c55e" },
                    { label: "Resolved", value: stats.resolvedMarkets,                                             color: "#7c6ff7" },
                    { label: "Other",    value: Math.max(0, stats.totalMarkets - stats.activeMarkets - stats.resolvedMarkets), color: "#fbbf24" },
                  ].filter(s => s.value > 0)}
                  total={stats.totalMarkets}
                  centerLabel="Markets"
                />
              </GCard>

              {/* Category Volume Bars */}
              <GCard style={{ padding: "18px 22px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 16px" }}>Volume by Category</p>
                <AdminBarChart markets={markets} />
              </GCard>
            </div>
          )}

          {/* Pool Distribution */}
          {!marketsLoading && markets.length > 0 && (
            <GCard style={{ padding: "18px 22px" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 14px" }}>YES / NO Pool Split by Market</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {markets.slice(0, 6).map(m => {
                  const total = m.yesPool + m.noPool;
                  if (total === 0) return null;
                  const yesPct = Math.round((m.yesPool / total) * 100);
                  return (
                    <div key={m.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <p style={{ fontSize: 11, color: T.textMuted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{m.question}</p>
                        <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: T.yes }}>{yesPct}% YES</span>
                          <span style={{ fontSize: 10, fontWeight: 700, color: T.no }}>{100 - yesPct}% NO</span>
                        </div>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: T.noBg, overflow: "hidden", border: `1px solid ${T.noBorder}` }}>
                        <div style={{ width: `${yesPct}%`, height: "100%", background: T.yes, borderRadius: 3, transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </GCard>
          )}

          {/* Recent markets summary */}
          <GCard style={{ padding: "18px 22px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 14px" }}>Recent Markets</p>
            {marketsLoading ? (
              <p style={{ fontSize: 13, color: T.textDim, margin: 0 }}>Loading…</p>
            ) : markets.length === 0 ? (
              <p style={{ fontSize: 13, color: T.textDim, margin: 0 }}>No markets yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {markets.slice(0, 5).map((m, i) => (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < Math.min(markets.length, 5) - 1 ? `1px solid ${T.border}` : "none" }}>
                    <StatusBadge status={m.status} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.question}</p>
                      <p style={{ fontSize: 11, color: T.textDim, margin: "2px 0 0" }}>{m.category} · Pool: {m.totalPool.toFixed(2)} QUAI</p>
                    </div>
                    <CategoryBadge category={m.category} />
                  </div>
                ))}
              </div>
            )}
            {markets.length > 5 && (
              <button type="button" onClick={() => setTab("markets")} style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: T.textDim, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                View all {markets.length} markets →
              </button>
            )}
          </GCard>

          {/* Recent users */}
          <GCard style={{ padding: "18px 22px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 14px" }}>Recent Users</p>
            {usersLoading ? (
              <p style={{ fontSize: 13, color: T.textDim, margin: 0 }}>Loading…</p>
            ) : users.length === 0 ? (
              <p style={{ fontSize: 13, color: T.textDim, margin: 0 }}>No users yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {users.slice(0, 5).map((u, i) => {
                  const initials = (u.display_name ?? u.email ?? "?").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
                  return (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < Math.min(users.length, 5) - 1 ? `1px solid ${T.border}` : "none" }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.glass, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt={u.display_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                          : <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>{initials}</span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, margin: 0 }}>{u.display_name ?? "—"}</p>
                        <p style={{ fontSize: 11, color: T.textDim, margin: "1px 0 0" }}>{u.email ?? "—"}</p>
                      </div>
                      <span style={{
                        padding: "2px 8px", borderRadius: 999, fontSize: 10, fontWeight: 700,
                        background: u.role === "admin" ? "rgba(251,191,36,0.15)" : T.glass,
                        border: `1px solid ${u.role === "admin" ? "rgba(251,191,36,0.35)" : T.border}`,
                        color: u.role === "admin" ? "#fbbf24" : T.textMuted,
                      }}>
                        {u.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {users.length > 5 && (
              <button type="button" onClick={() => setTab("users")} style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: T.textDim, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                View all {users.length} users →
              </button>
            )}
          </GCard>
        </div>
      )}

      {/* ════ MARKETS TAB ════ */}
      {tab === "markets" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Filter bar */}
          <div style={{ display: "flex", gap: 4, padding: 4, background: T.glass, border: `1px solid ${T.border}`, borderRadius: 8, width: "fit-content", flexWrap: "wrap" }}>
            {["all", "active", "paused", "closed", "resolved", "cancelled"].map(s => (
              <button key={s} type="button" onClick={() => setMarketFilter(s)}
                style={{ padding: "5px 14px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none", background: marketFilter === s ? "#ffffff" : "transparent", color: marketFilter === s ? "#080808" : T.textMuted, transition: "all 0.15s", textTransform: "capitalize" }}>
                {s === "all" ? `All (${markets.length})` : `${s} (${markets.filter(m=>m.status===s).length})`}
              </button>
            ))}
          </div>

          {marketsError && (
            <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444" }}>{marketsError}</div>
          )}

          {marketsLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1,2,3].map(i => <Sk.Box key={i} w="100%" h={80} r={12} style={{marginBottom:8}} />)}
            </div>
          )}

          {!marketsLoading && visibleMarkets.length === 0 && (
            <GCard style={{ padding: 0 }}>
              <EmptyState icon={BarChart3} title="No markets" body="No markets match the current filter." />
            </GCard>
          )}

          {!marketsLoading && visibleMarkets.length > 0 && (
            <GCard style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 110px 90px 100px 160px", gap: 10, padding: "10px 20px", background: T.glass, borderBottom: `1px solid ${T.border}` }}>
                {["Question", "Category", "Status", "Pool (Q)", "Deadline", "Actions"].map(h => (
                  <p key={h} style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>{h}</p>
                ))}
              </div>
              {visibleMarkets.map((m, i) => {
                const isUpdating = statusUpdating === m.id;
                const deadline = m.deadline ? new Date(m.deadline) : null;
                const deadlineStr = deadline ? deadline.toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
                const canToggle = m.status === "active" || m.status === "paused" || m.status === "closed";
                const canResolve = m.status === "active" || m.status === "closed";
                const toggleLabel = m.status === "active" ? "Pause" : m.status === "paused" ? "Activate" : m.status === "closed" ? "Activate" : null;
                const toggleColor = m.status === "active" ? "#fbbf24" : "#22c55e";

                return (
                  <div key={m.id}
                    style={{ display: "grid", gridTemplateColumns: "1fr 100px 110px 90px 100px 160px", gap: 10, padding: "12px 20px", alignItems: "center", borderBottom: i < visibleMarkets.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = T.glassHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <p style={{ fontSize: 12, fontWeight: 600, color: T.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={m.question}>{m.question}</p>
                    <CategoryBadge category={m.category} />
                    <StatusBadge status={m.status} />
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary, margin: 0 }}>{m.totalPool.toFixed(2)}</p>
                    <p style={{ fontSize: 11, color: T.textDim, margin: 0 }}>{deadlineStr}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {canToggle && (
                        <button type="button" onClick={() => handleToggleMarket(m)} disabled={isUpdating}
                          style={{ padding: "4px 9px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: isUpdating ? "not-allowed" : "pointer", border: "none", background: `${toggleColor}22`, color: toggleColor, opacity: isUpdating ? 0.5 : 1, transition: "opacity 0.15s" }}>
                          {isUpdating ? "…" : toggleLabel}
                        </button>
                      )}
                      {canResolve && (
                        <button type="button" onClick={() => { setResolveTarget({ market: m }); setResolveOutcome("YES"); }} disabled={isUpdating}
                          style={{ padding: "4px 9px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", border: "none", background: "rgba(124,111,247,0.2)", color: "#a78bfa", transition: "opacity 0.15s" }}>
                          Resolve
                        </button>
                      )}
                      <button type="button" onClick={() => setDeleteTarget({ id: m.id, question: m.question, type: "market" })}
                        style={{ padding: "4px 9px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", border: "none", background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </GCard>
          )}
        </div>
      )}

      {/* ════ USERS TAB ════ */}
      {tab === "users" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Search */}
          <div style={{ position: "relative", maxWidth: 360 }}>
            <Users size={13} strokeWidth={1.8} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textDim, pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 14px 10px 34px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 10, color: T.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
              onFocus={(e) => { e.target.style.borderColor = T.borderHover; }}
              onBlur={(e) => { e.target.style.borderColor = T.border; }}
            />
          </div>

          {usersError && (
            <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444" }}>
              {usersError}
            </div>
          )}

          {usersLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1,2,3,4].map(i => <Sk.Box key={i} w="100%" h={72} r={12} style={{marginBottom:8}} />)}
            </div>
          )}

          {!usersLoading && visibleUsers.length === 0 && (
            <GCard style={{ padding: 0 }}>
              <EmptyState icon={Users} title="No users found" body="No users match your search." />
            </GCard>
          )}

          {!usersLoading && visibleUsers.length > 0 && (
            <GCard style={{ padding: 0, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "36px 1fr 180px 90px 100px 70px", gap: 14, padding: "10px 20px", background: T.glass, borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
                {["", "User", "Email", "Role", "Joined", ""].map((h, i) => (
                  <p key={i} style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>{h}</p>
                ))}
              </div>
              {visibleUsers.map((u, i) => {
                const initials = (u.display_name ?? u.email ?? "?").split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
                const isUpdating = roleUpdating === u.id;
                const joined = u.created_at
                  ? new Date(u.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })
                  : "—";

                return (
                  <div key={u.id} style={{ display: "grid", gridTemplateColumns: "36px 1fr 180px 90px 100px 70px", gap: 14, padding: "12px 20px", alignItems: "center", borderBottom: i < visibleUsers.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.15s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = T.glassHover; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Avatar */}
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: T.glass, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
                        : <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted }}>{initials}</span>
                      }
                    </div>

                    {/* Name */}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.display_name ?? "—"}</p>
                    </div>

                    {/* Email */}
                    <p style={{ fontSize: 12, color: T.textMuted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.email ?? "—"}</p>

                    {/* Role badge + toggle */}
                    <div>
                      <button type="button"
                        onClick={() => setConfirmRole({ userId: u.id, newRole: u.role === "admin" ? "user" : "admin", displayName: u.display_name ?? u.email ?? u.id })}
                        disabled={isUpdating}
                        title={`Click to change role to ${u.role === "admin" ? "user" : "admin"}`}
                        style={{
                          padding: "3px 10px", borderRadius: 999, fontSize: 10, fontWeight: 700, cursor: isUpdating ? "not-allowed" : "pointer", border: "none",
                          background: u.role === "admin" ? "rgba(251,191,36,0.15)" : T.glass,
                          color: u.role === "admin" ? "#fbbf24" : T.textMuted,
                          transition: "opacity 0.15s, background 0.15s",
                          opacity: isUpdating ? 0.5 : 1,
                        }}
                        onMouseEnter={(e) => { if (!isUpdating) e.currentTarget.style.background = u.role === "admin" ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.12)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = u.role === "admin" ? "rgba(251,191,36,0.15)" : T.glass; }}
                      >
                        {isUpdating ? "…" : u.role}
                      </button>
                    </div>

                    {/* Joined */}
                    <p style={{ fontSize: 11, color: T.textDim, margin: 0 }}>{joined}</p>

                    {/* Delete */}
                    <button type="button"
                      onClick={() => setDeleteTarget({ id: u.id, question: u.display_name ?? u.email ?? "this user", type: "user" })}
                      style={{ padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", border: "none", background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                    >Del</button>
                  </div>
                );
              })}
            </GCard>
          )}
        </div>
      )}

      {/* ════ POSITIONS TAB ════ */}
      {tab === "positions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ position: "relative", maxWidth: 380 }}>
            <Users size={13} strokeWidth={1.8} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.textDim, pointerEvents: "none" }} />
            <input type="text" placeholder="Search by user or market question…" value={posSearch} onChange={e => setPosSearch(e.target.value)}
              style={{ width: "100%", padding: "10px 14px 10px 34px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 10, color: T.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box" }}
              onFocus={e => { e.target.style.borderColor = T.borderHover; }} onBlur={e => { e.target.style.borderColor = T.border; }} />
          </div>
          {positionsLoading && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[1,2,3].map(i=><Sk.Box key={i} w="100%" h={60} r={10} />)}</div>}
          {positionsError && <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, color: "#ef4444" }}>{positionsError}</div>}
          {!positionsLoading && visiblePositions.length === 0 && <GCard style={{ padding: 0 }}><EmptyState icon={BookMarked} title="No positions" body="No user positions found." /></GCard>}
          {!positionsLoading && visiblePositions.length > 0 && (
            <GCard style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 80px 80px 100px", gap: 10, padding: "10px 20px", background: T.glass, borderBottom: `1px solid ${T.border}` }}>
                {["User", "Market", "Side", "Amount (Q)", "Status", "Placed"].map(h => (
                  <p key={h} style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>{h}</p>
                ))}
              </div>
              {visiblePositions.map((p, i) => {
                const isYes = p.side === "YES";
                const placed = p.created_at ? new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—";
                return (
                  <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 80px 80px 100px", gap: 10, padding: "11px 20px", alignItems: "center", borderBottom: i < visiblePositions.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.glassHover; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <p style={{ fontSize: 12, color: T.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.users?.display_name ?? "—"}</p>
                    <p style={{ fontSize: 11, color: T.textMuted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={p.markets?.question}>{p.markets?.question ?? "—"}</p>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800, background: isYes ? T.yesBg : T.noBg, color: isYes ? T.yes : T.no, border: `1px solid ${isYes ? T.yesBorder : T.noBorder}` }}>{p.side}</span>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary, margin: 0 }}>{Number(p.amount ?? 0).toFixed(2)}</p>
                    <StatusBadge status={p.markets?.status ?? "—"} />
                    <p style={{ fontSize: 11, color: T.textDim, margin: 0 }}>{placed}</p>
                  </div>
                );
              })}
            </GCard>
          )}
        </div>
      )}

      {/* ════ ORACLE TAB ════ */}
      {tab === "oracle" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {oracleLoading && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[1,2,3].map(i=><Sk.Box key={i} w="100%" h={64} r={10} />)}</div>}
          {!oracleLoading && oracleResults.length === 0 && <GCard style={{ padding: 0 }}><EmptyState icon={ShieldCheck} title="No oracle results" body="Oracle resolution records will appear here after markets resolve." /></GCard>}
          {!oracleLoading && oracleResults.length > 0 && (
            <GCard style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 130px 140px", gap: 10, padding: "10px 20px", background: T.glass, borderBottom: `1px solid ${T.border}` }}>
                {["Market", "Category", "Result", "Data Source", "Resolved At"].map(h => (
                  <p key={h} style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>{h}</p>
                ))}
              </div>
              {oracleResults.map((r, i) => {
                const isYes = r.result_value === "YES";
                const resolvedAt = r.resolved_at ? new Date(r.resolved_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
                return (
                  <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 130px 140px", gap: 10, padding: "12px 20px", alignItems: "center", borderBottom: i < oracleResults.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.glassHover; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <p style={{ fontSize: 12, color: T.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.markets?.question}>{r.markets?.question ?? r.market_id}</p>
                    <CategoryBadge category={r.markets?.category ?? "—"} />
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800, background: isYes ? T.yesBg : T.noBg, color: isYes ? T.yes : T.no, border: `1px solid ${isYes ? T.yesBorder : T.noBorder}` }}>{r.result_value}</span>
                    <p style={{ fontSize: 11, color: T.textMuted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.data_source ?? "—"}</p>
                    <p style={{ fontSize: 11, color: T.textDim, margin: 0 }}>{resolvedAt}</p>
                  </div>
                );
              })}
            </GCard>
          )}
        </div>
      )}

      {/* ════ EVENTS TAB ════ */}
      {tab === "events" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {eventsLoading && <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{[1,2,3].map(i=><Sk.Box key={i} w="100%" h={56} r={10} />)}</div>}
          {!eventsLoading && events.length === 0 && <GCard style={{ padding: 0 }}><EmptyState icon={Zap} title="No events" body="Market events will appear here as activity happens." /></GCard>}
          {!eventsLoading && events.length > 0 && (
            <GCard style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 140px 120px 130px", gap: 10, padding: "10px 20px", background: T.glass, borderBottom: `1px solid ${T.border}` }}>
                {["Market", "Event", "User", "Timestamp"].map(h => (
                  <p key={h} style={{ fontSize: 10, fontWeight: 700, color: T.textDim, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0 }}>{h}</p>
                ))}
              </div>
              {events.map((ev, i) => {
                const ts = ev.created_at ? new Date(ev.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
                const evColors = { created: "#38bdf8", position_placed: "#22c55e", resolved: "#7c6ff7", reward_claimed: "#fbbf24" };
                const evColor = evColors[ev.event_type] || T.textMuted;
                return (
                  <div key={ev.id} style={{ display: "grid", gridTemplateColumns: "1fr 140px 120px 130px", gap: 10, padding: "11px 20px", alignItems: "center", borderBottom: i < events.length - 1 ? `1px solid ${T.border}` : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.glassHover; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <p style={{ fontSize: 12, color: T.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={ev.markets?.question}>{ev.markets?.question ?? ev.market_id}</p>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700, background: `${evColor}18`, color: evColor, border: `1px solid ${evColor}30` }}>{ev.event_type.replace("_", " ")}</span>
                    <p style={{ fontSize: 11, color: T.textMuted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.users?.display_name ?? "system"}</p>
                    <p style={{ fontSize: 11, color: T.textDim, margin: 0 }}>{ts}</p>
                  </div>
                );
              })}
            </GCard>
          )}
        </div>
      )}

      {/* ════ CREATE MARKET TAB ════ */}
      {tab === "create" && (
        <div style={{ maxWidth: 600 }}>
          <GCard style={{ padding: "28px 28px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 20px" }}>Create New Market</p>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Question *</label>
                <input type="text" required placeholder="Will Bitcoin be above $120,000 at 11:59 PM today?" value={createForm.question}
                  onChange={e => setCreateForm(f => ({ ...f, question: e.target.value }))}
                  style={{ width: "100%", padding: "12px 14px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 10, color: T.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => { e.target.style.borderColor = T.borderHover; }} onBlur={e => { e.target.style.borderColor = T.border; }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Category *</label>
                  <select required value={createForm.category} onChange={e => setCreateForm(f => ({ ...f, category: e.target.value }))}
                    style={{ width: "100%", padding: "12px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.textPrimary, fontSize: 13, outline: "none", cursor: "pointer" }}>
                    {["Crypto", "Sports", "Weather", "Stocks"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Deadline *</label>
                  <input type="datetime-local" required value={createForm.deadline}
                    onChange={e => setCreateForm(f => ({ ...f, deadline: e.target.value }))}
                    style={{ width: "100%", padding: "12px 14px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 10, color: T.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                    onFocus={e => { e.target.style.borderColor = T.borderHover; }} onBlur={e => { e.target.style.borderColor = T.border; }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Data Source</label>
                <input type="text" placeholder="e.g. CoinGecko BTC/USD price feed" value={createForm.data_source}
                  onChange={e => setCreateForm(f => ({ ...f, data_source: e.target.value }))}
                  style={{ width: "100%", padding: "12px 14px", background: T.glass, border: `1px solid ${T.border}`, borderRadius: 10, color: T.textPrimary, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => { e.target.style.borderColor = T.borderHover; }} onBlur={e => { e.target.style.borderColor = T.border; }} />
              </div>

              {createError && <p style={{ fontSize: 12, color: "#ef4444", margin: 0, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>{createError}</p>}
              {createSuccess && <p style={{ fontSize: 12, color: T.yes, margin: 0, padding: "10px 14px", borderRadius: 8, background: T.yesBg, border: `1px solid ${T.yesBorder}` }}>{createSuccess}</p>}

              <button type="submit" disabled={createLoading}
                style={{ padding: "13px", borderRadius: 10, border: "none", background: createLoading ? "rgba(34,197,94,0.4)" : "#22c55e", color: "#000", fontSize: 14, fontWeight: 800, cursor: createLoading ? "not-allowed" : "pointer", letterSpacing: "-0.01em", transition: "background 0.15s" }}>
                {createLoading ? "Creating…" : "Create Market"}
              </button>
            </form>
          </GCard>
        </div>
      )}

      {/* ── Resolve market modal ── */}
      {resolveTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setResolveTarget(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />
          <div role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}
            style={{ position: "relative", width: "100%", maxWidth: 400, background: "#141414", border: `1px solid ${T.borderHover}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.8)", animation: "modal-in 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }}>
            <div style={{ padding: "24px" }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", margin: "0 0 6px" }}>Resolve Market</p>
              <p style={{ fontSize: 12, color: T.textMuted, margin: "0 0 18px", lineHeight: 1.5, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis" }}>{resolveTarget.market.question}</p>
              <p style={{ fontSize: 11, fontWeight: 700, color: T.textDim, letterSpacing: "0.06em", textTransform: "uppercase", margin: "0 0 10px" }}>Outcome</p>
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                {["YES", "NO"].map(o => (
                  <button key={o} type="button" onClick={() => setResolveOutcome(o)}
                    style={{ flex: 1, padding: "12px", borderRadius: 10, border: resolveOutcome === o ? `2px solid ${o === "YES" ? T.yes : T.no}` : `1px solid ${T.border}`, background: resolveOutcome === o ? (o === "YES" ? T.yesBg : T.noBg) : "transparent", color: o === "YES" ? T.yes : T.no, fontSize: 16, fontWeight: 900, cursor: "pointer" }}>
                    {o}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setResolveTarget(null)} style={{ flex: 1, padding: "11px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="button" onClick={handleResolve} style={{ flex: 1, padding: "11px", borderRadius: 10, background: resolveOutcome === "YES" ? T.yes : T.no, border: "none", color: "#000", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Resolve {resolveOutcome}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ── */}
      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setDeleteTarget(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />
          <div role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}
            style={{ position: "relative", width: "100%", maxWidth: 380, background: "#141414", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.8)", animation: "modal-in 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }}>
            <div style={{ padding: "24px" }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#ef4444", margin: "0 0 8px" }}>Delete {deleteTarget.type}?</p>
              <p style={{ fontSize: 13, color: T.textMuted, margin: "0 0 20px", lineHeight: 1.5 }}>
                This will permanently delete <strong style={{ color: "#ffffff" }}>{deleteTarget.question}</strong>. This cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: "11px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
                <button type="button" onClick={handleDelete} style={{ flex: 1, padding: "11px", borderRadius: 10, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Role change confirm modal ── */}
      {confirmRole && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setConfirmRole(null)}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }} />
          <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}
            style={{ position: "relative", width: "100%", maxWidth: 380, background: "#141414", border: `1px solid ${T.borderHover}`, borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.8)", animation: "modal-in 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }}>
            <div style={{ padding: "24px 24px 20px" }}>
              <p style={{ fontSize: 16, fontWeight: 800, color: "#ffffff", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Change role?</p>
              <p style={{ fontSize: 13, color: T.textMuted, margin: "0 0 20px", lineHeight: 1.6 }}>
                Set <strong style={{ color: "#ffffff" }}>{confirmRole.displayName}</strong> to{" "}
                <strong style={{ color: confirmRole.newRole === "admin" ? "#fbbf24" : T.textPrimary }}>{confirmRole.newRole}</strong>?
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button type="button" onClick={() => setConfirmRole(null)}
                  style={{ flex: 1, padding: "11px", borderRadius: 10, background: T.glass, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="button" onClick={handleRoleChange}
                  style={{ flex: 1, padding: "11px", borderRadius: 10, background: confirmRole.newRole === "admin" ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.1)", border: `1px solid ${confirmRole.newRole === "admin" ? "rgba(251,191,36,0.4)" : T.borderHover}`, color: confirmRole.newRole === "admin" ? "#fbbf24" : "#ffffff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   ROOT — DashboardPage
════════════════════════════════════════════════ */

export default function DashboardPage() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showConfetti,      setShowConfetti]      = useState(false);
  const [notifOpen,         setNotifOpen]         = useState(false);
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { section = "home", questionId: urlQuestionId } = useParams();

  // ── Supabase-backed notifications ──
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications();

  const handleMarkAllRead = markAllRead;
  const handleMarkRead    = markRead;

  // Derive page from URL param; map "home" → "dashboard"
  const urlPage = section === "home" ? "dashboard" : section;

  // selectedQ driven by URL
  const [selectedQ, setSelectedQ] = useState(urlQuestionId ?? null);
  useEffect(() => { setSelectedQ(urlQuestionId ?? null); }, [urlQuestionId]);

  const handleNavigate = (key) => {
    setSelectedQ(null);
    setMobileSidebarOpen(false);
    navigate(`/dashboard/${key === "dashboard" ? "home" : key}`);
  };
  const handleOpenQ = (id) => {
    setSelectedQ(id);
    setMobileSidebarOpen(false);
    navigate(`/dashboard/question-detail/${id}`);
  };
  const handleLogout = async () => { await logout(); navigate("/login"); };
  const handleConfettiTrigger = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3500);
  };

  const page      = urlPage;
  const activeNav = page === "question-detail" ? "questions" : page;
  const pageLabelMap = {
    dashboard: "Dashboard", questions: "Markets", "question-detail": "Market Detail",
    convictions: "My Positions", results: "Results", leaderboard: "Leaderboard",
    rewards: "Rewards", how: "How It Works", wallet: "Wallet", profile: "Profile",
    admin: "Admin Dashboard",
  };

  return (
    <>
      {/* ── Global mobile responsive styles ── */}
      <style>{`
        /* ── Dashboard Responsive Layout ── */
        *, *::before, *::after { box-sizing: border-box; }

        .dash-sidebar-desktop {
          width: 240px;
          flex-shrink: 0;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 40;
        }

        .dash-main-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          margin-left: 240px;
          min-height: 100vh;
          min-width: 0;
          overflow-x: hidden;
        }

        .dash-mobile-only { display: none; }
        .dash-mobile-left { display: none; align-items: center; gap: 10px; }

        /* ── page header action rows ── */
        .dash-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
        }
        .dash-page-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        /* ── KPI grids — default desktop ── */
        .dash-kpi-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .dash-kpi-grid-5 {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
        }
        .dash-sec-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .dash-kpi-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .dash-detail-grid {
          display: grid;
          grid-template-columns: 1fr 400px;
          gap: 16px;
          align-items: start;
        }
        .q-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .dash-how-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
        }
        .reward-how-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .results-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }
        .positions-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        /* ── Admin ── */
        .admin-tab-bar {
          display: flex;
          gap: 2px;
          padding: 4px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          flex-wrap: wrap;
          width: 100%;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .admin-tab-bar::-webkit-scrollbar { display: none; }
        .admin-tab-bar button { flex-shrink: 0; white-space: nowrap; }
        .admin-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 20px;
        }
        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .admin-table-container {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          width: 100%;
        }
        .admin-table { width: 100%; min-width: 560px; border-collapse: collapse; }
        .admin-table th, .admin-table td {
          text-align: left;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 180px;
        }
        .admin-table th {
          background: rgba(255,255,255,0.02);
          font-weight: 700;
          font-size: 11px;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .admin-form-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }

        /* ════════════════════════
           TABLET  ≤ 1024px
        ════════════════════════ */
        @media (max-width: 1024px) {
          .dash-sidebar-desktop { display: none; }
          .dash-main-area { margin-left: 0; }
          .dash-mobile-only { display: block; }
          .dash-mobile-left { display: flex; }

          main { padding: 20px 16px 32px !important; }

          .dash-kpi-grid-3  { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .dash-kpi-grid-5  { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .dash-sec-grid    { grid-template-columns: 1fr; gap: 10px; }
          .dash-kpi-grid    { grid-template-columns: 1fr; gap: 10px; }
          .dash-detail-grid { grid-template-columns: 1fr; }
          .q-grid           { grid-template-columns: 1fr; }
          .dash-how-grid    { grid-template-columns: repeat(2, 1fr); }
          .reward-how-grid  { grid-template-columns: 1fr; gap: 10px; }
          .results-stats-grid   { grid-template-columns: repeat(2, 1fr); }
          .positions-stats-grid { grid-template-columns: repeat(2, 1fr); }

          .admin-header     { flex-direction: column; align-items: stretch; }
          .admin-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .admin-form-grid  { grid-template-columns: 1fr; }
        }

        /* ════════════════════════
           MOBILE  ≤ 640px
        ════════════════════════ */
        @media (max-width: 640px) {
          main { padding: 16px 12px 28px !important; }

          .dash-kpi-grid-3  { grid-template-columns: 1fr; gap: 10px; }
          .dash-kpi-grid-5  { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .dash-kpi-grid    { grid-template-columns: 1fr; gap: 10px; }
          .dash-sec-grid    { grid-template-columns: 1fr; gap: 10px; }
          .dash-how-grid    { grid-template-columns: 1fr; gap: 10px; }
          .reward-how-grid  { grid-template-columns: 1fr; gap: 10px; }
          .results-stats-grid   { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .positions-stats-grid { grid-template-columns: 1fr; gap: 8px; }
          .q-grid           { grid-template-columns: 1fr; gap: 10px; }

          .market-question  { font-size: 13px !important; }

          .admin-stats-grid { grid-template-columns: 1fr; gap: 10px; }
          .admin-table th, .admin-table td {
            padding: 8px 10px;
            font-size: 11px;
            max-width: 130px;
          }
          .admin-tab-bar { gap: 1px; padding: 3px; }
          .admin-tab-bar button { padding: 6px 10px !important; font-size: 11px !important; }
          .admin-table-container {
            margin: 0 -12px;
            border-radius: 0;
            border-left: none;
            border-right: none;
          }
        }

        /* ════════════════════════
           SMALL MOBILE  ≤ 400px
        ════════════════════════ */
        @media (max-width: 400px) {
          main { padding: 12px 10px 24px !important; }
          .dash-kpi-grid-5  { grid-template-columns: 1fr; gap: 8px; }
          .results-stats-grid { grid-template-columns: 1fr; gap: 6px; }
        }
      `}</style>
      
      <div style={{ display: "flex", minHeight: "100vh", background: T.bg, color: T.textPrimary, overflowX: "hidden", position: "relative" }}>

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
        <div className="dash-main-area" style={{ overflowX: "hidden" }}>
          <TopHeader pageLabel={pageLabelMap[page] || page} onOpenMobileSidebar={() => setMobileSidebarOpen(true)} onNavigate={handleNavigate} user={user} onOpenNotifications={() => setNotifOpen(true)} unreadCount={unreadCount} />

          <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "28px 28px 48px", position: "relative" }}>
            <Confetti active={showConfetti} />
            <div style={{ maxWidth: 1160, margin: "0 auto", width: "100%" }}>
              {page === "dashboard"       && <PageDashboard onNavigate={handleNavigate} />}
              {page === "questions"       && <PageQuestions onOpenQuestion={handleOpenQ} />}
              {page === "question-detail" && <PageQuestionDetail questionId={selectedQ} onBack={() => handleNavigate("questions")} onConfetti={handleConfettiTrigger} />}
              {page === "convictions"     && <PageMyConvictions />}
              {page === "results"         && <PageResults />}
              {page === "leaderboard"     && <PageLeaderboard />}
              {page === "rewards"         && <PageRewards />}
              {page === "how"             && <PageHowItWorks onNavigate={handleNavigate} />}
              {page === "wallet"          && <WalletPage />}
              {page === "profile"         && <PageProfile user={user} onLogout={handleLogout} />}
              {page === "admin"           && isAdmin && <PageAdmin />}
              {page === "admin"           && !isAdmin && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", gap: 16, textAlign: "center" }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ShieldCheck size={24} strokeWidth={1.4} style={{ color: "#ef4444" }} />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 700, color: T.textMuted, margin: 0 }}>Access Denied</p>
                  <p style={{ fontSize: 13, color: T.textDim, margin: 0, maxWidth: 320 }}>You need admin privileges to access this page.</p>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* ── Notification sidebar ── */}
        <NotificationSidebar
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
          notifications={notifications}
          onMarkAllRead={handleMarkAllRead}
          onMarkRead={handleMarkRead}
        />
      </div>
    </>
  );
}
