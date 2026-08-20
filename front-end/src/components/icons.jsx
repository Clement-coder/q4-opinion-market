/* Single base SVG wrapper */
const Icon = ({ children, size = 20, strokeWidth = 1.75, className = "", style }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={style}
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const Coins = (p) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="4" />
    <circle cx="16" cy="16" r="4" />
    <path d="M5 11v2a4 4 0 0 0 4 4h2M13 7h2a4 4 0 0 1 4 4v2" />
  </Icon>
);


export const ArrowLeftRight = (p) => (
  <Icon {...p}>
    <path d="M3 8h13l-3-3m3 3-3 3M21 16H8l3-3m-3 3 3 3" />
  </Icon>
);

export const ArrowLeft = (p) => (
  <Icon {...p}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </Icon>
);

export const Clock = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);

// alias
export const Clock3 = Clock;

export const ShieldCheck = (p) => (
  <Icon {...p}>
    <path d="M12 3 19 6v5c0 5-3.2 8-7 10-3.8-2-7-5-7-10V6l7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

export const Gift = (p) => (
  <Icon {...p}>
    <rect x="3" y="8" width="18" height="12" rx="2" />
    <path d="M12 8v12M3 12h18M12 8H8.5a2.5 2.5 0 1 1 2.5-2.5V8ZM12 8h3.5A2.5 2.5 0 1 0 13 5.5V8Z" />
  </Icon>
);

export const ClipboardList = (p) => (
  <Icon {...p}>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4V3h6v1M9 9h6M9 13h6M9 17h4" />
  </Icon>
);

export const WalletCards = (p) => (
  <Icon {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 9h18M15 13h4" />
  </Icon>
);

export const PieChart = (p) => (
  <Icon {...p}>
    <path d="M12 3v9h9" />
    <path d="M19.5 15A8.5 8.5 0 1 1 9 4.5" />
  </Icon>
);

export const CheckCircle2 = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12 2.2 2.2 4.8-5" />
  </Icon>
);

export const Menu = (p) => (
  <Icon {...p}>
    <line x1="4" y1="7"  x2="20" y2="7"  />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="17" x2="20" y2="17" />
  </Icon>
);

export const X = (p) => (
  <Icon {...p}>
    <line x1="18" y1="6"  x2="6"  y2="18" />
    <line x1="6"  y1="6"  x2="18" y2="18" />
  </Icon>
);

export const TrendingUp = (p) => (
  <Icon {...p}>
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
    <polyline points="16 7 22 7 22 13" />
  </Icon>
);

export const TrendingDown = (p) => (
  <Icon {...p}>
    <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
    <polyline points="16 17 22 17 22 11" />
  </Icon>
);

export const User = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="7" r="4" />
    <path d="M3 21v-2a7 7 0 0 1 14 0v2" />
  </Icon>
);

export const LogOut = (p) => (
  <Icon {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </Icon>
);

export const BarChart2 = (p) => (
  <Icon {...p}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4"  />
    <line x1="6"  y1="20" x2="6"  y2="14" />
  </Icon>
);

export const Bell = (p) => (
  <Icon {...p}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </Icon>
);

export const Star = (p) => (
  <Icon {...p}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </Icon>
);

export const Eye = (p) => (
  <Icon {...p}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

export const EyeOff = (p) => (
  <Icon {...p}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </Icon>
);

export const Mail = (p) => (
  <Icon {...p}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </Icon>
);

export const Lock = (p) => (
  <Icon {...p}>
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </Icon>
);

export const Zap = (p) => (
  <Icon {...p}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </Icon>
);

export const Globe = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </Icon>
);

export const Award = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="6" />
    <path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
  </Icon>
);

export const ChevronRight = (p) => (
  <Icon {...p}>
    <polyline points="9 18 15 12 9 6" />
  </Icon>
);

export const ChevronDown = (p) => (
  <Icon {...p}>
    <polyline points="6 9 12 15 18 9" />
  </Icon>
);

export const ArrowRight = (p) => (
  <Icon {...p}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </Icon>
);

export const Users = (p) => (
  <Icon {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </Icon>
);

export const Home = (p) => (
  <Icon {...p}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </Icon>
);

export const HelpCircle = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </Icon>
);

export const Info = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </Icon>
);

export const LayoutGrid = (p) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Icon>
);

export const BookMarked = (p) => (
  <Icon {...p}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <polyline points="10 2 10 9 13 6.5 16 9 16 2" />
  </Icon>
);

export const BarChart3 = (p) => (
  <Icon {...p}>
    <line x1="18" y1="20" x2="18" y2="4"  />
    <line x1="12" y1="20" x2="12" y2="8"  />
    <line x1="6"  y1="20" x2="6"  y2="14" />
  </Icon>
);

export const Trophy = (p) => (
  <Icon {...p}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </Icon>
);

export const Sparkles = (p) => (
  <Icon {...p}>
    <path d="M12 3 9.5 9.5 3 12l6.5 2.5L12 21l2.5-6.5L21 12l-6.5-2.5L12 3Z" />
    <path d="M5 3v4M3 5h4M19 17v4M17 19h4" />
  </Icon>
);

export const Share2 = (p) => (
  <Icon {...p}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </Icon>
);

export const RefreshCcw = (p) => (
  <Icon {...p}>
    <path d="M21 2v6h-6" />
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M3 22v-6h6" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
  </Icon>
);

export const Send = (p) => (
  <Icon {...p}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </Icon>
);

/* Social icons (filled) */
export const TwitterX = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const Discord = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

export const Telegram = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

export default Icon;

/* ─── Q4 App Logo ─── */
import q4LogoSrc from "../assets/Q4_logo.jpeg";

export const Q4Logo = ({ size = 32, className = "", style }) => (
  <img
    src={q4LogoSrc}
    alt="Q4"
    width={size}
    height={size}
    className={className}
    style={{ display: "block", objectFit: "contain", borderRadius: 4, ...style }}
  />
);

/* ─── Quai Network Logo — official SVG from qu.ai ─── */
/**
 * QuaiLogo — the official Quai Network mark (red Q symbol).
 * Inline SVG: no extra file, scales perfectly at any size.
 * @param {number}  size      — width & height in px (default 16)
 * @param {string}  className
 * @param {object}  style     — additional inline styles
 */
export const QuaiLogo = ({ size = 16, className = "", style }) => (
  <svg
    viewBox="0 0 46 46"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    className={className}
    aria-label="QUAI"
    style={{
      display: "inline-block",
      verticalAlign: "middle",
      flexShrink: 0,
      ...style,
    }}
  >
    <path
      d="M29.9415 23C29.9394 21.1596 29.2075 19.3952 27.9061 18.0939C26.6048 16.7926 24.8404 16.0606 23.0001 16.0586C22.3607 16.0588 21.7245 16.1476 21.1095 16.3223C19.6357 16.7435 18.3421 17.6393 17.4295 18.8707C16.5386 20.0631 16.0572 21.5116 16.0571 23C16.0592 24.8408 16.7913 26.6055 18.0929 27.9071C19.3945 29.2088 21.1593 29.9409 23.0001 29.9429C23.589 29.9411 24.1754 29.8643 24.745 29.7145L27.3394 33.5616C28.7345 32.9883 30.0024 32.1446 31.07 31.0791L28.4848 27.2458C29.43 26.0324 29.9427 24.5381 29.9415 23Z"
      fill="#E20101"
    />
    <path
      d="M23 0C16.9 0 11.0499 2.42321 6.73654 6.73654C2.4232 11.0499 0 16.9 0 23C0 29.1 2.4232 34.9501 6.73654 39.2635C8.87229 41.3992 11.4078 43.0934 14.1983 44.2492C16.9888 45.4051 19.9796 46 23 46C29.1 46 34.9501 43.5768 39.2635 39.2635C43.5768 34.9501 46 29.1 46 23C46 16.9 43.5768 11.0499 39.2635 6.73654C34.9501 2.42321 29.1 0 23 0ZM33.6245 34.8711L29.9107 37.3765L27.3363 33.5616C25.9605 34.1266 24.4873 34.4168 23 34.4157C19.9718 34.4157 17.0676 33.2131 14.9257 31.0725C12.7839 28.9318 11.5798 26.0282 11.5782 23C11.5754 20.019 12.7426 17.156 14.8289 15.0267C15.8816 13.9465 17.1374 13.0851 18.5242 12.4921C19.9393 11.8893 21.4619 11.5795 23 11.5813C26.0287 11.5813 28.9334 12.7842 31.0754 14.9256C33.2173 17.0669 34.421 19.9713 34.4218 23C34.4239 24.5024 34.1285 25.9904 33.5527 27.3781C32.9769 28.7657 32.132 30.0257 31.0669 31.0853L33.6245 34.8711Z"
      fill="#E20101"
    />
  </svg>
);

export const ExternalLink = (p) => (
  <Icon {...p}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </Icon>
);

/* ─── Wallet-page additions ─── */

export const Wifi = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
    <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
    <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
    <circle cx="12" cy="20" r="1" fill="currentColor"/>
  </svg>
);

export const Loader = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <line x1="12" y1="2"  x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93"   x2="7.76" y2="7.76"/>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2"  y1="12" x2="6"  y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93"  y1="19.07" x2="7.76"  y2="16.24"/>
    <line x1="16.24" y1="7.76"  x2="19.07" y2="4.93"/>
  </svg>
);

export const AlertCircle = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8"  x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

export const RefreshCw = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);

export const Download = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

export const XCircle = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9"  x2="9"  y2="15"/>
    <line x1="9"  y1="9"  x2="15" y2="15"/>
  </svg>
);

export const ArrowUpRight = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <line x1="7" y1="17" x2="17" y2="7"/>
    <polyline points="7 7 17 7 17 17"/>
  </svg>
);

export const ArrowDownLeft = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <line x1="17" y1="7" x2="7" y2="17"/>
    <polyline points="17 17 7 17 7 7"/>
  </svg>
);

export const Copy = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

export const Check = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

export const Medal = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/>
    <path d="M11 12 5.12 2.2"/>
    <path d="m13 12 5.88-9.8"/>
    <path d="M8 7h8"/>
    <circle cx="12" cy="17" r="5"/>
    <path d="M12 18v-2h-.5"/>
  </svg>
);

export const Flame = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);

export const Lock2 = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export const Target = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

export const Percent = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <line x1="19" y1="5" x2="5" y2="19"/>
    <circle cx="6.5" cy="6.5" r="2.5"/>
    <circle cx="17.5" cy="17.5" r="2.5"/>
  </svg>
);

export const Lightbulb = (p) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={p.size||16} height={p.size||16} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth={p.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" style={p.style}>
    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
    <path d="M9 18h6"/>
    <path d="M10 22h4"/>
  </svg>
);
