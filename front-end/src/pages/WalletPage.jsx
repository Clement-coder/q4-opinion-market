/**
 * WalletPage.jsx — Q4 Wallet
 * Gorgeous balance card · BlipPay live price · Send/Receive modals
 * Responsive: single-column on mobile, side-by-side on desktop
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Download, RefreshCw, Eye, EyeOff, Copy, Check,
  ArrowUpRight, ArrowDownLeft, XCircle,
  TrendingUp, TrendingDown, X,
  AlertCircle, Loader, ArrowRight, ExternalLink, Plus,
} from "../components/icons";
import { useWallet } from "../context/WalletContext";
import { useAuth }   from "../context/AuthContext";
import { useDemoModeContext } from "../context/DemoModeContext";
import { useToast }  from "../context/ToastContext";
import { QuaiLogo }  from "../components/icons";
import q4LogoSrc     from "../assets/Q4_logo.jpeg";
import { Sk }        from "../components/Skeleton";
import { sendQuai, createCheckout } from "../services/blippay";
import { useBlipPayRegistration } from "../services/useBlipPay";
import { supabase } from "../lib/supabase";
import CustomSelect from "../components/CustomSelect";
import QRCode from "qrcode";

/* ════════════════════════════════════════════════
   DESIGN TOKENS
════════════════════════════════════════════════ */
const T = {
  bg:          "#080808",
  surface:     "#111111",
  border:      "rgba(255,255,255,0.08)",
  borderHi:    "rgba(255,255,255,0.18)",
  glass:       "rgba(255,255,255,0.04)",
  glassHi:     "rgba(255,255,255,0.08)",
  text:        "#f0f0f0",
  muted:       "rgba(255,255,255,0.45)",
  dim:         "rgba(255,255,255,0.22)",
  yes:         "#22c55e",
  yesBg:       "rgba(34,197,94,0.10)",
  yesBd:       "rgba(34,197,94,0.28)",
  no:          "#ef4444",
  noBg:        "rgba(239,68,68,0.10)",
  noBd:        "rgba(239,68,68,0.28)",
  violet:      "#7c6ff7",
  accentDim:   "rgba(255,255,255,0.10)",
};

/* ════════════════════════════════════════════════
   UTILS
════════════════════════════════════════════════ */
const fmtQ  = (n) => n == null ? "—" : parseFloat(n).toLocaleString("en-US",{minimumFractionDigits:4,maximumFractionDigits:4});
const fmtU  = (n) => !n ? "$0.00" : parseFloat(n).toLocaleString("en-US",{style:"currency",currency:"USD",minimumFractionDigits:2});
const fmtP  = (n) => !n ? "$—" : "$"+parseFloat(n).toFixed(6);
const short = (a) => !a||a.length<10 ? a??"—" : `${a.slice(0,6)}…${a.slice(-4)}`;
const ago   = (d) => {
  if (!d) return "—";
  const s = Math.floor((Date.now()-new Date(d))/1000);
  if (s<60)    return `${s}s ago`;
  if (s<3600)  return `${Math.floor(s/60)}m ago`;
  if (s<86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

/* ════════════════════════════════════════════════
   INTERACTIVE PRICE CHART — full hover, crosshair, tooltip
════════════════════════════════════════════════ */
function PriceChart({ history, positive, height = 140 }) {
  const containerRef = useRef(null);
  const svgRef       = useRef(null);
  const [w,       setW]       = useState(600);
  const [hovered, setHovered] = useState(null); // { idx, x, y, price, ts }

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((e) => setW(e[0].contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  if (!history || history.length < 2) {
    return <div ref={containerRef} style={{ height, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ fontSize:11, color:"rgba(255,255,255,0.2)" }}>Loading chart…</span>
    </div>;
  }

  const prices = history.map((p) => p.price);
  const times  = history.map((p) => p.timestamp);
  const minP   = Math.min(...prices), maxP = Math.max(...prices), rangeP = maxP - minP || 1;
  const pad    = { t: 8, b: 24, l: 4, r: 4 };
  const innerW = w - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const color  = positive ? T.yes : T.no;

  const px = (i) => pad.l + (i / (prices.length - 1)) * innerW;
  const py = (v) => pad.t + innerH - ((v - minP) / rangeP) * innerH;
  const pts  = prices.map((v, i) => `${px(i).toFixed(2)},${py(v).toFixed(2)}`).join(" ");
  const area = `${pad.l},${height - pad.b} ${pts} ${pad.l + innerW},${height - pad.b}`;

  const xLabels = [0, Math.floor((prices.length - 1) / 3), Math.floor((prices.length - 1) * 2 / 3), prices.length - 1].map(i => ({
    x: px(i),
    label: new Date(times[i]).toLocaleDateString("en-US", { month:"short", day:"numeric" }),
  }));

  const handleMouseMove = (e) => {
    if (!svgRef.current) return;
    const rect   = svgRef.current.getBoundingClientRect();
    const xRel   = (e.clientX - rect.left) / rect.width;
    const idx    = Math.max(0, Math.min(prices.length - 1, Math.round(xRel * (prices.length - 1))));
    setHovered({ idx, x: px(idx), y: py(prices[idx]), price: prices[idx], ts: times[idx] });
  };

  const fmtTime = (ts) => new Date(ts).toLocaleDateString("en-US", { month:"short", day:"numeric" }) +
    " " + new Date(ts).toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", hour12:false });

  const tooltipX = hovered
    ? Math.max(4, Math.min((hovered.x / w) * 100, 72))
    : 0;

  return (
    <div ref={containerRef} style={{ position:"relative", userSelect:"none" }}>
      <svg
        ref={svgRef}
        width={w}
        height={height}
        viewBox={`0 0 ${w} ${height}`}
        style={{ display:"block", cursor:"crosshair", overflow:"visible" }}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="wpc-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </linearGradient>
          <clipPath id="wpc-clip">
            <rect x={pad.l} y={pad.t} width={innerW} height={innerH} />
          </clipPath>
        </defs>

        {/* horizontal grid */}
        {[0, 0.33, 0.66, 1].map((f, i) => (
          <line key={i}
            x1={pad.l} y1={pad.t + f * innerH}
            x2={pad.l + innerW} y2={pad.t + f * innerH}
            stroke="rgba(255,255,255,0.05)" strokeWidth="1"
          />
        ))}

        {/* area fill */}
        <polygon points={area} fill="url(#wpc-grad)" clipPath="url(#wpc-clip)" />

        {/* price line */}
        <polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          clipPath="url(#wpc-clip)"
        />

        {/* hover crosshair */}
        {hovered && (
          <>
            <line
              x1={hovered.x} y1={pad.t}
              x2={hovered.x} y2={height - pad.b}
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1"
              strokeDasharray="3,3"
            />
            <circle
              cx={hovered.x} cy={hovered.y} r="4"
              fill={color} stroke="#080808" strokeWidth="2"
            />
            <circle
              cx={hovered.x} cy={hovered.y} r="8"
              fill={color} fillOpacity="0.18"
            />
          </>
        )}

        {/* x-axis labels */}
        {xLabels.map((xl, i) => (
          <text
            key={i}
            x={xl.x}
            y={height - 4}
            fontSize="9"
            fill="rgba(255,255,255,0.3)"
            textAnchor={i === 0 ? "start" : i === xLabels.length - 1 ? "end" : "middle"}
            fontFamily="sans-serif"
          >
            {xl.label}
          </text>
        ))}
      </svg>

      {/* floating tooltip */}
      {hovered && (
        <div style={{
          position:        "absolute",
          top:             0,
          left:            `${tooltipX}%`,
          transform:       "translateX(-50%)",
          pointerEvents:   "none",
          background:      "rgba(14,14,14,0.97)",
          border:          `1px solid ${color}40`,
          borderRadius:    8,
          padding:         "6px 10px",
          backdropFilter:  "blur(12px)",
          boxShadow:       `0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px ${color}20`,
          zIndex:          10,
          minWidth:        110,
        }}>
          <p style={{ fontSize:13, fontWeight:800, color, margin:0, letterSpacing:"-0.01em" }}>
            ${hovered.price.toFixed(6)}
          </p>
          <p style={{ fontSize:10, color:"rgba(255,255,255,0.35)", margin:"3px 0 0", whiteSpace:"nowrap" }}>
            {fmtTime(hovered.ts)}
          </p>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   QR CODE — real scannable QR via `qrcode` lib (static import)
   Encodes:  quai:<address>
   Uses SVG output — rendered as a data URL in a plain <img> tag.
════════════════════════════════════════════════ */
function WalletQR({ address, size = 200 }) {
  const [imgSrc,  setImgSrc]  = useState(null);
  const [qrError, setQrError] = useState(false);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setImgSrc(null);
    setQrError(false);

    // quai:<address> — standard Quai payment URI.
    const uri = `quai:${address}`;

    QRCode.toString(uri, {
      type:                 "svg",
      errorCorrectionLevel: "M",
      margin:               2,
      color: { dark: "#000000", light: "#ffffff" },
    })
      .then(svgString => {
        if (cancelled) return;
        // Encode as data URL for a plain <img> — no dangerouslySetInnerHTML needed.
        const encoded = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
        setImgSrc(encoded);
      })
      .catch(e => {
        if (!cancelled) {
          console.error("QR generation failed:", e);
          setQrError(true);
        }
      });

    return () => { cancelled = true; };
  }, [address]);

  if (qrError) {
    return (
      <div style={{ width:size, height:size, background:"#fff", borderRadius:10,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
        <p style={{ fontSize:10, color:"#999", textAlign:"center", padding:8, margin:0 }}>QR unavailable</p>
      </div>
    );
  }

  if (!imgSrc) {
    return (
      <div style={{ width:size, height:size, background:"#f2f2f2", borderRadius:10,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:22, height:22, border:"3px solid #ccc", borderTopColor:"#333",
                      borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
      </div>
    );
  }

  return (
    <div style={{ background:"#fff", borderRadius:12, padding:10, display:"inline-block",
                  lineHeight:0, boxShadow:"0 6px 28px rgba(0,0,0,0.35)" }}>
      <img
        src={imgSrc}
        alt={`Quai wallet QR – ${address}`}
        width={size}
        height={size}
        style={{ display:"block", borderRadius:4 }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════
   MODAL SHELL
════════════════════════════════════════════════ */
function Modal({ open, onClose, title, children, maxWidth=460 }) {
  useEffect(()=>{
    if(!open) return;
    const prev=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{document.body.style.overflow=prev;};
  },[open]);
  if (!open) return null;
  return (
    <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.78)",backdropFilter:"blur(10px)"}}/>
      <div style={{position:"relative",width:"100%",maxWidth,background:"#141414",border:`1px solid ${T.borderHi}`,borderRadius:20,overflow:"hidden",boxShadow:"0 32px 80px rgba(0,0,0,0.85)",animation:"modal-in 0.22s cubic-bezier(0.34,1.56,0.64,1) both"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 22px 0"}}>
          <p style={{fontSize:16,fontWeight:800,color:"#fff",margin:0,letterSpacing:"-0.02em"}}>{title}</p>
          <button type="button" onClick={onClose} style={{width:32,height:32,borderRadius:"50%",background:T.glass,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:T.muted,cursor:"pointer"}}>
            <X size={14} strokeWidth={2.5}/>
          </button>
        </div>
        <div style={{padding:"16px 22px 22px"}}>{children}</div>
      </div>
      <style>{`@keyframes modal-in{from{opacity:0;transform:scale(0.92) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════
   SEND MODAL — real on-chain transaction via HKDF-derived wallet
   The private key is derived in-memory from the user's Firebase UID.
   It is never stored, shown, or sent over the network unless the user
   explicitly opens "Export Key" from Wallet Details.
════════════════════════════════════════════════ */
function SendModal({ open, onClose, balance, quaiPrice, walletAddress, uid, isDemo }) {
  const [step,      setStep]      = useState("form");
  const [recipient, setRecipient] = useState("");
  const [amount,    setAmount]    = useState("");
  const [err,       setErr]       = useState("");
  const [sending,   setSending]   = useState(false);
  const [txHash,    setTxHash]    = useState("");
  const { toast } = useToast();

  const FEE    = 0.001;
  const num    = parseFloat(amount) || 0;
  const total  = num + FEE;
  const usd    = quaiPrice ? (num * quaiPrice).toFixed(2) : null;
  const feeUsd = quaiPrice ? (FEE * quaiPrice).toFixed(4) : null;
  const ok     = balance.quai >= total;

  function reset() { setStep("form"); setRecipient(""); setAmount(""); setErr(""); setTxHash(""); }
  function close() { reset(); onClose(); }

  function validate() {
    if (!/^0x[0-9a-fA-F]{40}$/.test(recipient)) {
      setErr("Invalid Quai address — must be 0x + 40 hex chars."); return false;
    }
    if (num <= 0) { setErr("Enter a valid amount."); return false; }
    if (!ok)      { setErr(`Insufficient balance — need ${total.toFixed(4)} QUAI (incl. fee).`); return false; }
    setErr(""); return true;
  }

  async function confirm() {
    setSending(true);
    const tid = toast.loading("Sending QUAI…", { sub: `${num.toFixed(4)} QUAI → ${recipient.slice(0,8)}…` });
    try {
      if (isDemo) {
        await new Promise(r => setTimeout(r, 1400));
        const hash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
        setTxHash(hash);
        setStep("done");
        toast.update(tid, { type: "success", msg: "Transaction sent! (demo)", sub: `${num.toFixed(4)} QUAI` });
        return;
      }
      const { hash } = await sendQuai({ uid, to: recipient, amountQuai: num });
      setTxHash(hash);
      setStep("done");
      toast.update(tid, { type: "success", msg: "Transaction sent! 🚀", sub: `${num.toFixed(4)} QUAI — tx: ${hash.slice(0,10)}…` });
    } catch (e) {
      setErr(e.message);
      setStep("error");
      toast.update(tid, { type: "error", msg: "Transaction failed", sub: e.message });
    } finally {
      setSending(false);
    }
  }

  const fieldStyle = {
    width: "100%", padding: "11px 14px",
    background: T.glass, border: `1px solid ${T.border}`,
    borderRadius: 10, color: "#fff", fontSize: 13, outline: "none",
    boxSizing: "border-box", transition: "border-color 0.15s",
  };

  return (
    <Modal open={open} onClose={close} title="Send QUAI">
      {isDemo && (
        <div style={{ display:"flex", gap:8, padding:"10px 14px", borderRadius:10, background:"rgba(234,179,8,0.08)", border:"1px solid rgba(234,179,8,0.25)", color:"#eab308", fontSize:12, marginBottom:4, lineHeight:1.5 }}>
          🧪 <span><strong>Demo mode:</strong> This transaction is simulated. No real QUAI will be sent.</span>
        </div>
      )}

      {/* ── form ── */}
      {step === "form" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", borderRadius:8, background:T.yesBg, border:`1px solid ${T.yesBd}` }}>
            <QuaiLogo size={14}/>
            <span style={{ fontSize:11, fontWeight:600, color:T.yes }}>Quai Network · Zone 0-0</span>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:T.dim, letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:6 }}>
              From
            </label>
            <p style={{ fontSize:11, fontFamily:"monospace", color:T.muted, margin:0, padding:"9px 12px", background:T.glass, border:`1px solid ${T.border}`, borderRadius:8 }}>
              {walletAddress ?? "—"}
            </p>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:T.dim, letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:6 }}>
              Recipient Address
            </label>
            <input
              type="text"
              placeholder="0x…"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              style={{ ...fieldStyle, fontFamily:"monospace" }}
              onFocus={e => e.target.style.borderColor = T.borderHi}
              onBlur={e => e.target.style.borderColor = T.border}
            />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:T.dim, letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:6 }}>
              Amount (QUAI)
            </label>
            <div style={{ position:"relative" }}>
              <input
                type="number"
                min="0"
                step="0.0001"
                placeholder="0.0000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={{ ...fieldStyle, paddingRight:72, fontSize:20, fontWeight:800, letterSpacing:"-0.02em" }}
                onFocus={e => e.target.style.borderColor = T.borderHi}
                onBlur={e => e.target.style.borderColor = T.border}
              />
              <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:12, fontWeight:700, color:T.dim }}>QUAI</span>
            </div>
            {usd && num > 0 && <p style={{ fontSize:11, color:T.muted, margin:"4px 0 0" }}>≈ ${usd} USD</p>}
            <button
              type="button"
              onClick={() => setAmount(Math.max(0, balance.quai - FEE).toFixed(4))}
              style={{ marginTop:6, fontSize:11, color:T.violet, background:"none", border:"none", cursor:"pointer", padding:0, fontWeight:600 }}
            >
              Use max ({Math.max(0, balance.quai - FEE).toFixed(4)} QUAI)
            </button>
          </div>
          <div style={{ padding:"10px 14px", borderRadius:10, background:T.glass, border:`1px solid ${T.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
              <span style={{ fontSize:11, color:T.dim }}>Est. Network Fee</span>
              <span style={{ fontSize:12, fontWeight:700, color:T.muted }}>{FEE} QUAI{feeUsd ? ` (~$${feeUsd})` : ""}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:11, color:T.dim }}>Total</span>
              <span style={{ fontSize:12, fontWeight:700, color: ok ? T.text : T.no }}>{total.toFixed(4)} QUAI</span>
            </div>
          </div>
          {err && (
            <div style={{ display:"flex", gap:8, padding:"10px 14px", borderRadius:8, background:T.noBg, border:`1px solid ${T.noBd}`, color:T.no, fontSize:12 }}>
              <AlertCircle size={14} strokeWidth={2} style={{ flexShrink:0, marginTop:1 }}/>{err}
            </div>
          )}
          <button
            type="button"
            onClick={() => { if (validate()) setStep("confirm"); }}
            style={{ width:"100%", padding:13, borderRadius:10, background:"#fff", color:"#080808", fontWeight:800, fontSize:14, border:"none", cursor:"pointer" }}
          >
            Review Transaction
          </button>
        </div>
      )}

      {/* ── confirm ── */}
      {step === "confirm" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ padding:16, borderRadius:12, background:T.glass, border:`1px solid ${T.border}` }}>
            {[
              { l:"From",    v: short(walletAddress), m:true },
              { l:"To",      v: short(recipient),     m:true },
              { l:"Amount",  v: `${num.toFixed(4)} QUAI${usd ? ` (~$${usd})` : ""}` },
              { l:"Fee",     v: `${FEE} QUAI` },
              { l:"Network", v: "Quai Network · Zone 0-0" },
            ].map(({ l, v, m }, i, a) => (
              <div key={l} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom: i < a.length - 1 ? `1px solid ${T.border}` : "none" }}>
                <span style={{ fontSize:12, color:T.dim }}>{l}</span>
                <span style={{ fontSize:12, fontWeight:700, color:T.text, fontFamily: m ? "monospace" : "inherit" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <button type="button" onClick={() => setStep("form")}
              style={{ padding:12, borderRadius:10, background:T.glass, border:`1px solid ${T.border}`, color:T.muted, fontWeight:600, fontSize:13, cursor:"pointer" }}>
              Back
            </button>
            <button type="button" onClick={confirm} disabled={sending}
              style={{ padding:12, borderRadius:10, background: sending ? "rgba(255,255,255,0.3)" : "#fff", color:"#080808", fontWeight:800, fontSize:13, border:"none", cursor: sending ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {sending
                ? <><Loader size={14} strokeWidth={2} style={{ animation:"spin 0.7s linear infinite" }}/>Sending…</>
                : "Confirm Send"}
            </button>
          </div>
        </div>
      )}

      {/* ── done ── */}
      {step === "done" && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, padding:"8px 0" }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:T.yesBg, border:`2px solid ${T.yes}`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 28px rgba(34,197,94,0.4)", animation:"modal-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both" }}>
            <Check size={28} strokeWidth={2.5} style={{ color:T.yes }}/>
          </div>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:18, fontWeight:800, color:"#fff", margin:"0 0 4px" }}>Sent!</p>
            <p style={{ fontSize:12, color:T.muted, margin:0 }}>{num.toFixed(4)} QUAI → {short(recipient)}</p>
          </div>
          <div style={{ width:"100%", padding:"10px 14px", borderRadius:10, background:T.glass, border:`1px solid ${T.border}` }}>
            <p style={{ fontSize:10, color:T.dim, margin:"0 0 3px", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>Transaction Hash</p>
            <p style={{ fontSize:11, fontFamily:"monospace", color:T.muted, margin:0, wordBreak:"break-all" }}>{txHash}</p>
          </div>
          <a href={`https://quaiscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
            style={{ fontSize:12, color:T.violet, fontWeight:600, textDecoration:"none" }}>
            View on Quaiscan ↗
          </a>
          <button type="button" onClick={close}
            style={{ width:"100%", padding:12, borderRadius:10, background:T.glass, border:`1px solid ${T.border}`, color:T.muted, fontWeight:600, fontSize:13, cursor:"pointer" }}>
            Close
          </button>
        </div>
      )}

      {/* ── error ── */}
      {step === "error" && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14, padding:"8px 0" }}>
          <XCircle size={48} strokeWidth={1.5} style={{ color:T.no }}/>
          <p style={{ fontSize:16, fontWeight:700, color:T.no, margin:0 }}>Transaction Failed</p>
          <p style={{ fontSize:12, color:T.muted, margin:0, textAlign:"center", maxWidth:300, lineHeight:1.6 }}>{err}</p>
          <button type="button" onClick={() => setStep("form")}
            style={{ padding:"10px 24px", borderRadius:8, background:T.glass, border:`1px solid ${T.border}`, color:T.muted, fontWeight:600, cursor:"pointer" }}>
            Try Again
          </button>
        </div>
      )}
    </Modal>
  );
}

/* ════════════════════════════════════════════════
   SECURITY QUESTIONS — preset bank
════════════════════════════════════════════════ */
const QUESTION_BANK = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your primary school?",
  "What was the make of your first car?",
  "What is the name of the street you grew up on?",
  "What was your childhood nickname?",
  "What is the middle name of your oldest sibling?",
  "In what city did your parents meet?",
  "What was the name of your first employer?",
];

/* Tiny shared field style */
const SQ_FIELD = {
  width: "100%",
  padding: "10px 13px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 9,
  color: "#f0f0f0",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

/* ════════════════════════════════════════════════
   EXPORT KEY MODAL — security-question gated
   Flow:
     "check"   → fetches whether questions are set
     "setup"   → first-time: user picks 3 Q+A pairs
     "verify"  → returning: user answers their 3 questions
     "warn"    → final warning before key reveal
     "reveal"  → shows the private key
     "error"   → something went wrong
════════════════════════════════════════════════ */
function ExportKeyModal({ open, onClose, uid, supabaseUserId, isDemo }) {
  /* step machine */
  const [step,      setStep]      = useState("idle"); // idle → check → setup | verify → warn → reveal | error
  const [key,       setKey]       = useState("");
  const [loading,   setLoading]   = useState(false);
  const [err,       setErr]       = useState("");
  const [copied,    setCopied]    = useState(false);
  const { toast } = useToast();

  /*
   * SECURITY GATE — this flag MUST be true before reveal() will derive
   * the private key. It is only set to true after:
   *   a) user successfully saves their security questions (first-time), OR
   *   b) user correctly answers all three questions (returning).
   * It is never set by fallback/offline paths. Resets to false on close.
   */
  const [securityCleared, setSecurityCleared] = useState(false);

  /* ── setup state (first-time) ── */
  const [setup, setSetup] = useState({
    q1: QUESTION_BANK[0], a1: "",
    q2: QUESTION_BANK[1], a2: "",
    q3: QUESTION_BANK[2], a3: "",
  });

  /* ── verify state (returning) ── */
  const [questions,  setQuestions]  = useState({ q1:"", q2:"", q3:"" });
  const [answers,    setAnswers]    = useState({ a1:"", a2:"", a3:"" });
  const [verifyErr,  setVerifyErr]  = useState("");

  /* ── reset everything when modal closes ── */
  function reset() {
    setStep("idle");
    setKey(""); setErr(""); setCopied(false); setLoading(false);
    setSecurityCleared(false);
    setSetup({ q1: QUESTION_BANK[0], a1:"", q2: QUESTION_BANK[1], a2:"", q3: QUESTION_BANK[2], a3:"" });
    setAnswers({ a1:"", a2:"", a3:"" }); setVerifyErr("");
  }
  function close() { reset(); onClose(); }

  /* ── on open: check if questions already exist ── */
  useEffect(() => {
    if (!open) return;

    /* Demo mode — bypass security gate */
    if (isDemo) { setSecurityCleared(true); setStep("warn"); return; }

    /* No internet — hard block, cannot verify server-side */
    if (!navigator.onLine) {
      setErr("You must be online to export your private key. Security questions require a server connection.");
      setStep("error");
      return;
    }

    /* Supabase user ID not resolved yet — can happen if the users table
       query also failed offline. Hard block — never skip the gate. */
    if (!supabaseUserId) {
      setErr("Could not verify your identity. Please ensure you are online and try again.");
      setStep("error");
      return;
    }

    setStep("check");
    (async () => {
      try {
        const { data, error } = await supabase
          .from("user_security_questions")
          .select("q1,q2,q3")
          .eq("user_id", supabaseUserId)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          /* First time — show setup */
          setStep("setup");
        } else {
          /* Questions exist — shuffle order and ask user to answer */
          const shuffled = [
            { q: data.q1, field: "a1" },
            { q: data.q2, field: "a2" },
            { q: data.q3, field: "a3" },
          ].sort(() => Math.random() - 0.5);
          setQuestions({
            q1: shuffled[0].q,
            q2: shuffled[1].q,
            q3: shuffled[2].q,
            _map: { a1: shuffled[0].field, a2: shuffled[1].field, a3: shuffled[2].field },
          });
          setStep("verify");
        }
      } catch (e) {
        /* Network or Supabase error — hard block */
        setErr(
          navigator.onLine
            ? `Security check failed: ${e.message}`
            : "You must be online to export your private key."
        );
        setStep("error");
      }
    })();
  }, [open, supabaseUserId, isDemo]);

  /* ── save security questions (setup step) ── */
  async function saveQuestions() {
    const { q1,a1,q2,a2,q3,a3 } = setup;
    if (!a1.trim()||!a2.trim()||!a3.trim()) {
      setErr("Please answer all three questions."); return;
    }
    if (q1===q2||q1===q3||q2===q3) {
      setErr("Please choose three different questions."); return;
    }
    if (!navigator.onLine) {
      setErr("You must be online to save security questions."); return;
    }
    setErr(""); setLoading(true);
    try {
      const { error } = await supabase.rpc("upsert_security_questions", {
        p_user_id: supabaseUserId,
        p_q1: q1, p_a1: a1.trim(),
        p_q2: q2, p_a2: a2.trim(),
        p_q3: q3, p_a3: a3.trim(),
      });
      if (error) throw error;
      toast.success("Security questions saved!");
      setSecurityCleared(true);
      setStep("warn");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  /* ── verify answers (returning step) ── */
  async function verifyAnswers() {
    const { a1, a2, a3 } = answers;
    if (!a1.trim()||!a2.trim()||!a3.trim()) {
      setVerifyErr("Please answer all three questions."); return;
    }
    if (!navigator.onLine) {
      setVerifyErr("You must be online to verify your answers."); return;
    }
    setVerifyErr(""); setLoading(true);
    try {
      /* Re-map answers back to DB order using _map */
      const map = questions._map || { a1:"a1", a2:"a2", a3:"a3" };
      const ordered = { a1:"", a2:"", a3:"" };
      ordered[map.a1] = a1.trim();
      ordered[map.a2] = a2.trim();
      ordered[map.a3] = a3.trim();

      const { data, error } = await supabase.rpc("verify_security_answers", {
        p_user_id: supabaseUserId,
        p_a1: ordered.a1,
        p_a2: ordered.a2,
        p_a3: ordered.a3,
      });
      if (error) throw error;
      if (!data) {
        setVerifyErr("One or more answers are incorrect. Please try again.");
        setAnswers({ a1:"", a2:"", a3:"" });
        setLoading(false);
        return;
      }
      setSecurityCleared(true);
      setStep("warn");
    } catch (e) {
      setVerifyErr(
        navigator.onLine
          ? e.message
          : "You must be online to verify your answers."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ── derive and show private key ── */
  async function reveal() {
    /* Double-check the gate — this can never be bypassed */
    if (!isDemo && !securityCleared) {
      setErr("Security verification was not completed. Please close and try again.");
      setStep("error");
      return;
    }
    if (isDemo) { setKey("0x" + "demo".repeat(16)); setStep("reveal"); return; }
    setLoading(true);
    try {
      const { getOrCreateWallet } = await import("../services/blippay");
      const { privateKey } = await getOrCreateWallet(uid);
      setKey(privateKey);
      setStep("reveal");
    } catch (e) {
      setErr(e.message);
      setStep("error");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(key); }
    catch { const el=document.createElement("textarea");el.value=key;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el); }
    setCopied(true);
    toast.info("Private key copied", { sub: "Store it somewhere safe — never share it." });
    setTimeout(()=>setCopied(false), 2500);
  }

  /* ── shared label style ── */
  const lbl = { fontSize:11, fontWeight:700, color:T.dim, letterSpacing:"0.06em",
                textTransform:"uppercase", display:"block", marginBottom:5 };

  return (
    <Modal open={open} onClose={close} title="Export Private Key" maxWidth={500}>

      {/* ── LOADING CHECK ── */}
      {step === "check" && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14, padding:"24px 0" }}>
          <Loader size={28} strokeWidth={1.5} style={{ color:T.muted, animation:"spin 0.8s linear infinite" }}/>
          <p style={{ fontSize:13, color:T.muted, margin:0 }}>Checking security setup…</p>
        </div>
      )}

      {/* ── FIRST-TIME SETUP ── */}
      {step === "setup" && (
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          <div style={{ padding:"12px 16px", borderRadius:11, background:"rgba(124,111,247,0.07)", border:"1px solid rgba(124,111,247,0.25)" }}>
            <p style={{ fontSize:13, fontWeight:700, color:T.violet, margin:"0 0 4px" }}>🔐 Set Your Security Questions</p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", margin:0, lineHeight:1.6 }}>
              Before you can export your private key, you must set three security questions.
              You'll need to answer them correctly every time you request the key.
            </p>
          </div>

          {[1,2,3].map(n => {
            const qKey = `q${n}`, aKey = `a${n}`;
            /* available questions — not chosen by the other two slots */
            const others = [1,2,3].filter(x=>x!==n).map(x=>setup[`q${x}`]);
            const available = QUESTION_BANK.filter(q => !others.includes(q));
            return (
              <div key={n} style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <label style={lbl}>Question {n}</label>
                <CustomSelect
                  value={setup[qKey]}
                  onChange={val => setSetup(p => ({ ...p, [qKey]: val }))}
                  options={available}
                  menuMaxH={260}
                />
                <input
                  type="text"
                  placeholder="Your answer…"
                  value={setup[aKey]}
                  onChange={e => setSetup(p => ({ ...p, [aKey]: e.target.value }))}
                  autoComplete="off"
                  style={SQ_FIELD}
                  onFocus={e => e.target.style.borderColor = T.borderHi}
                  onBlur={e  => e.target.style.borderColor = T.border}
                />
              </div>
            );
          })}

          {err && (
            <div style={{ display:"flex", gap:8, padding:"10px 13px", borderRadius:8,
              background:T.noBg, border:`1px solid ${T.noBd}`, color:T.no, fontSize:12 }}>
              <AlertCircle size={14} strokeWidth={2} style={{ flexShrink:0, marginTop:1 }}/>{err}
            </div>
          )}

          <p style={{ fontSize:11, color:T.dim, margin:0, lineHeight:1.6 }}>
            Answers are case-insensitive and stored securely (bcrypt hash). Q4 cannot see or recover them.
          </p>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <button type="button" onClick={close}
              style={{ padding:12, borderRadius:10, background:T.glass,
                border:`1px solid ${T.border}`, color:T.muted, fontWeight:600, fontSize:13, cursor:"pointer" }}>
              Cancel
            </button>
            <button type="button" onClick={saveQuestions} disabled={loading}
              style={{ padding:12, borderRadius:10, background: loading ? "rgba(255,255,255,0.15)" : "#fff",
                color:"#080808", fontWeight:800, fontSize:13, border:"none",
                cursor: loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {loading
                ? <><Loader size={13} strokeWidth={2} style={{ animation:"spin 0.7s linear infinite" }}/>Saving…</>
                : "Save & Continue →"}
            </button>
          </div>
        </div>
      )}

      {/* ── VERIFY ANSWERS ── */}
      {step === "verify" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div style={{ padding:"12px 16px", borderRadius:11, background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.22)" }}>
            <p style={{ fontSize:13, fontWeight:700, color:T.no, margin:"0 0 4px" }}>🔑 Security Verification Required</p>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", margin:0, lineHeight:1.6 }}>
              Answer your three security questions to access your private key.
              Questions are shown in a random order each time.
            </p>
          </div>

          {[1,2,3].map(n => (
            <div key={n} style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={lbl}>{questions[`q${n}`]}</label>
              <input
                type="text"
                placeholder="Your answer…"
                value={answers[`a${n}`]}
                onChange={e => setAnswers(p => ({ ...p, [`a${n}`]: e.target.value }))}
                onKeyDown={e => { if (e.key==="Enter" && n===3) verifyAnswers(); }}
                autoComplete="off"
                style={SQ_FIELD}
                onFocus={e => e.target.style.borderColor = T.borderHi}
                onBlur={e  => e.target.style.borderColor = T.border}
              />
            </div>
          ))}

          {verifyErr && (
            <div style={{ display:"flex", gap:8, padding:"10px 13px", borderRadius:8,
              background:T.noBg, border:`1px solid ${T.noBd}`, color:T.no, fontSize:12 }}>
              <AlertCircle size={14} strokeWidth={2} style={{ flexShrink:0, marginTop:1 }}/>{verifyErr}
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <button type="button" onClick={close}
              style={{ padding:12, borderRadius:10, background:T.glass,
                border:`1px solid ${T.border}`, color:T.muted, fontWeight:600, fontSize:13, cursor:"pointer" }}>
              Cancel
            </button>
            <button type="button" onClick={verifyAnswers} disabled={loading}
              style={{ padding:12, borderRadius:10, background: loading?"rgba(255,255,255,0.15)":"#fff",
                color:"#080808", fontWeight:800, fontSize:13, border:"none",
                cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {loading
                ? <><Loader size={13} strokeWidth={2} style={{ animation:"spin 0.7s linear infinite" }}/>Verifying…</>
                : "Verify →"}
            </button>
          </div>
        </div>
      )}

      {/* ── FINAL WARNING ── */}
      {step === "warn" && (
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {isDemo && (
            <div style={{ padding:"8px 12px", borderRadius:8, background:"rgba(234,179,8,0.08)",
              border:"1px solid rgba(234,179,8,0.25)", color:"#eab308", fontSize:11 }}>
              🧪 Demo mode — this is a placeholder key, not real.
            </div>
          )}
          <div style={{ padding:"14px 16px", borderRadius:12, background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.25)" }}>
            <p style={{ fontSize:13, fontWeight:700, color:T.no, margin:"0 0 8px" }}>⚠ Never share your private key</p>
            <ul style={{ fontSize:12, color:"rgba(255,255,255,0.6)", margin:0, paddingLeft:18, lineHeight:1.8 }}>
              <li>Anyone with this key controls your wallet completely.</li>
              <li>Q4 staff will <strong style={{ color:"rgba(255,255,255,0.8)" }}>never</strong> ask for it.</li>
              <li>Store it offline in a secure location.</li>
              <li>This key is derived from your account — it is the same every time you export it.</li>
            </ul>
          </div>
          <p style={{ fontSize:12, color:T.muted, margin:0, lineHeight:1.6 }}>
            Use this to import your wallet into <strong style={{ color:T.text }}>Pelagus</strong>,{" "}
            <strong style={{ color:T.text }}>MetaMask</strong>, or any Quai-compatible wallet.
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <button type="button" onClick={close}
              style={{ padding:12, borderRadius:10, background:T.glass,
                border:`1px solid ${T.border}`, color:T.muted, fontWeight:600, fontSize:13, cursor:"pointer" }}>
              Cancel
            </button>
            <button type="button" onClick={reveal} disabled={loading}
              style={{ padding:12, borderRadius:10, background:"rgba(239,68,68,0.15)",
                border:"1px solid rgba(239,68,68,0.4)", color:T.no, fontWeight:700, fontSize:13,
                cursor:loading?"not-allowed":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
              {loading
                ? <><Loader size={13} strokeWidth={2} style={{ animation:"spin 0.7s linear infinite" }}/>Deriving…</>
                : "Show Key →"}
            </button>
          </div>
        </div>
      )}

      {/* ── REVEAL KEY ── */}
      {step === "reveal" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {isDemo && (
            <div style={{ padding:"8px 12px", borderRadius:8, background:"rgba(234,179,8,0.08)",
              border:"1px solid rgba(234,179,8,0.25)", color:"#eab308", fontSize:11 }}>
              🧪 Demo mode — this is a placeholder key, not real.
            </div>
          )}
          <div style={{ padding:"14px 16px", borderRadius:12, background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.2)" }}>
            <p style={{ fontSize:10, color:"rgba(239,68,68,0.7)", fontWeight:700,
              textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 10px" }}>
              Private Key — Keep Secret
            </p>
            <p style={{ fontSize:12, fontFamily:"monospace", color:"#f0f0f0", margin:0,
              wordBreak:"break-all", lineHeight:1.7 }}>{key}</p>
          </div>
          <button type="button" onClick={copy}
            style={{ width:"100%", padding:12, borderRadius:10,
              background: copied ? T.yesBg : T.glass,
              border:`1px solid ${copied ? T.yesBd : T.border}`,
              color: copied ? T.yes : T.muted,
              fontWeight:700, fontSize:13, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:6, transition:"all 0.2s" }}>
            {copied
              ? <><Check size={14} strokeWidth={2.5}/>Copied!</>
              : <><Copy  size={14} strokeWidth={1.8}/>Copy to Clipboard</>}
          </button>
          <p style={{ fontSize:11, color:T.dim, margin:0, textAlign:"center", lineHeight:1.6 }}>
            Close this window when done. The key is not stored anywhere on our servers.
          </p>
          <button type="button" onClick={close}
            style={{ padding:"9px 0", borderRadius:9, background:T.glass,
              border:`1px solid ${T.border}`, color:T.muted, fontWeight:600, fontSize:12, cursor:"pointer" }}>
            Close
          </button>
        </div>
      )}

      {/* ── ERROR ── */}
      {step === "error" && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:14, padding:"8px 0" }}>
          {/* offline vs generic error icon */}
          {err.toLowerCase().includes("online") || err.toLowerCase().includes("offline") || err.toLowerCase().includes("connection") ? (
            <div style={{ width:56, height:56, borderRadius:16,
              background:"rgba(251,191,36,0.08)", border:"1px solid rgba(251,191,36,0.25)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:26 }}>📡</span>
            </div>
          ) : (
            <XCircle size={40} strokeWidth={1.5} style={{ color:T.no }}/>
          )}
          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:14, fontWeight:700,
              color: err.toLowerCase().includes("online") || err.toLowerCase().includes("offline") || err.toLowerCase().includes("connection")
                ? "#fbbf24" : T.no,
              margin:"0 0 6px" }}>
              {err.toLowerCase().includes("online") || err.toLowerCase().includes("offline") || err.toLowerCase().includes("connection")
                ? "You're Offline"
                : "Cannot Export Key"}
            </p>
            <p style={{ fontSize:12, color:T.muted, margin:0, lineHeight:1.6, maxWidth:300 }}>{err}</p>
          </div>
          <button type="button" onClick={close}
            style={{ padding:"9px 20px", borderRadius:8, background:T.glass,
              border:`1px solid ${T.border}`, color:T.muted, fontWeight:600, cursor:"pointer" }}>
            Close
          </button>
        </div>
      )}
    </Modal>
  );
}

/* ════════════════════════════════════════════════
   TOP UP MODAL — BlipPay managed-QUAI ramp
════════════════════════════════════════════════ */
function TopUpModal({ open, onClose, walletAddress, userEmail }) {
  const [step,    setStep]    = useState("amount"); // amount → checkout → done | error
  const [amountUsd, setAmountUsd] = useState("");
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");

  function reset() { setStep("amount"); setAmountUsd(""); setErr(""); }
  function close() { reset(); onClose(); }

  async function launch() {
    setErr("");
    const dollars = parseFloat(amountUsd);
    if (!dollars || dollars < 5) { setErr("Minimum top-up is $5."); return; }
    if (!walletAddress) { setErr("Wallet address not loaded yet."); return; }
    setLoading(true);
    try {
      const cents  = Math.round(dollars * 100);
      const result = await createCheckout(walletAddress, cents, userEmail ?? undefined);
      // BlipPay returns checkout_url (not url)
      const checkoutUrl = result.checkout_url ?? result.url;
      if (!checkoutUrl) throw new Error("No checkout URL returned from BlipPay.");
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      setStep("done");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  const fieldStyle = {
    width:"100%", padding:"11px 14px",
    background:T.glass, border:`1px solid ${T.border}`,
    borderRadius:10, color:"#fff", fontSize:20, fontWeight:800,
    outline:"none", boxSizing:"border-box",
    letterSpacing:"-0.02em", transition:"border-color 0.15s",
  };

  return (
    <Modal open={open} onClose={close} title="Top Up with USDT">
      {step === "amount" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div style={{ padding:"12px 14px", borderRadius:10, background:"rgba(99,102,241,0.07)", border:"1px solid rgba(99,102,241,0.22)", display:"flex", gap:10 }}>
            <QuaiLogo size={14} style={{ flexShrink:0, marginTop:1 }}/>
            <p style={{ fontSize:12, color:"rgba(255,255,255,0.65)", margin:0, lineHeight:1.6 }}>
              Pay with <strong style={{ color:"rgba(255,255,255,0.85)" }}>USDT</strong> via Stripe.
              QUAI is delivered to your wallet automatically — powered by BlipPay.
            </p>
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:T.dim, letterSpacing:"0.06em", textTransform:"uppercase", display:"block", marginBottom:6 }}>
              Amount (USD)
            </label>
            <div style={{ position:"relative" }}>
              <input
                type="number"
                min="5"
                step="1"
                placeholder="25"
                value={amountUsd}
                onChange={e => setAmountUsd(e.target.value)}
                onKeyDown={e => e.key === "Enter" && launch()}
                style={{ ...fieldStyle, paddingLeft:28, paddingRight:50 }}
                onFocus={e => e.target.style.borderColor = T.borderHi}
                onBlur={e => e.target.style.borderColor = T.border}
              />
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:18, fontWeight:800, color:T.dim }}>$</span>
              <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:12, fontWeight:700, color:T.dim }}>USD</span>
            </div>
          </div>
          {/* preset amounts */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 }}>
            {[10, 25, 50, 100].map(v => (
              <button key={v} type="button" onClick={() => setAmountUsd(String(v))}
                style={{ padding:"8px 0", borderRadius:8, background: parseFloat(amountUsd) === v ? "rgba(124,111,247,0.18)" : T.glass, border:`1px solid ${parseFloat(amountUsd) === v ? "rgba(124,111,247,0.45)" : T.border}`, color: parseFloat(amountUsd) === v ? T.violet : T.muted, fontSize:12, fontWeight:700, cursor:"pointer", transition:"all 0.15s" }}>
                ${v}
              </button>
            ))}
          </div>
          <div style={{ padding:"10px 14px", borderRadius:10, background:T.glass, border:`1px solid ${T.border}` }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:11, color:T.dim }}>Delivery wallet</span>
              <span style={{ fontSize:11, fontFamily:"monospace", color:T.muted }}>{short(walletAddress)}</span>
            </div>
          </div>
          {err && (
            <div style={{ display:"flex", gap:8, padding:"10px 14px", borderRadius:8, background:T.noBg, border:`1px solid ${T.noBd}`, color:T.no, fontSize:12 }}>
              <AlertCircle size={14} strokeWidth={2} style={{ flexShrink:0, marginTop:1 }}/>{err}
            </div>
          )}
          <button type="button" onClick={launch} disabled={loading}
            style={{ width:"100%", padding:13, borderRadius:10, background: loading ? "rgba(255,255,255,0.3)" : "#fff", color:"#080808", fontWeight:800, fontSize:14, border:"none", cursor: loading ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            {loading
              ? <><Loader size={14} strokeWidth={2} style={{ animation:"spin 0.7s linear infinite" }}/>Opening checkout…</>
              : <>Continue to Stripe <ExternalLink size={14} strokeWidth={2.5}/></>}
          </button>
        </div>
      )}
      {step === "done" && (
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16, padding:"8px 0" }}>
          <div style={{ width:64, height:64, borderRadius:"50%", background:T.yesBg, border:`2px solid ${T.yes}`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 28px rgba(34,197,94,0.4)" }}>
            <Check size={28} strokeWidth={2.5} style={{ color:T.yes }}/>
          </div>
          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:17, fontWeight:800, color:"#fff", margin:"0 0 6px" }}>Checkout Opened</p>
            <p style={{ fontSize:12, color:T.muted, margin:0, lineHeight:1.7 }}>
              Complete payment in the new tab.<br/>
              QUAI will arrive in your wallet within a few minutes after confirmation.
            </p>
          </div>
          <button type="button" onClick={close}
            style={{ width:"100%", padding:12, borderRadius:10, background:T.glass, border:`1px solid ${T.border}`, color:T.muted, fontWeight:600, fontSize:13, cursor:"pointer" }}>
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}

/* ════════════════════════════════════════════════
   RECEIVE MODAL
════════════════════════════════════════════════ */
function ReceiveModal({ open, onClose, walletAddress }) {
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedUri,  setCopiedUri]  = useState(false);
  const { toast } = useToast();

  const uri = walletAddress ? `quai:${walletAddress}` : null;

  const copyAddr = useCallback(async () => {
    if (!walletAddress) return;
    try { await navigator.clipboard.writeText(walletAddress); }
    catch { const el = document.createElement("textarea"); el.value = walletAddress; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
    setCopiedAddr(true);
    toast.success("Address copied!", { sub: walletAddress.slice(0,12) + "…" });
    setTimeout(() => setCopiedAddr(false), 2000);
  }, [walletAddress, toast]);

  const copyUri = useCallback(async () => {
    if (!uri) return;
    try { await navigator.clipboard.writeText(uri); }
    catch { const el = document.createElement("textarea"); el.value = uri; document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el); }
    setCopiedUri(true);
    toast.success("Payment URI copied!");
    setTimeout(() => setCopiedUri(false), 2000);
  }, [uri, toast]);

  return (
    <Modal open={open} onClose={onClose} title="Receive QUAI" maxWidth={420}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>

        {/* network badge */}
        <div style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:8, background:T.yesBg, border:`1px solid ${T.yesBd}` }}>
          <QuaiLogo size={14}/>
          <span style={{ fontSize:11, fontWeight:600, color:T.yes }}>Quai Network · Zone 0-0</span>
        </div>

        {/* QR code — encodes  quai:<address> */}
        <WalletQR address={walletAddress} size={200} />

        {/* URI label */}
        <p style={{ fontSize:10, color:T.dim, margin:0, letterSpacing:"0.04em" }}>
          Encodes: <span style={{ fontFamily:"monospace", color:T.muted }}>quai:{walletAddress ? walletAddress.slice(0,10) + "…" : "…"}</span>
        </p>

        {/* address copy row */}
        <div style={{ width:"100%", padding:"11px 14px", borderRadius:11, background:T.glass, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:9, fontWeight:700, color:T.dim, textTransform:"uppercase", letterSpacing:"0.07em", margin:"0 0 3px" }}>Wallet Address</p>
            <p style={{ fontSize:12, fontFamily:"monospace", color:T.text, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {walletAddress ?? "Loading…"}
            </p>
          </div>
          <button type="button" onClick={copyAddr}
            style={{ width:34, height:34, borderRadius:8, background: copiedAddr ? T.yesBg : T.glass, border:`1px solid ${copiedAddr ? T.yesBd : T.border}`, display:"flex", alignItems:"center", justifyContent:"center", color: copiedAddr ? T.yes : T.muted, cursor:"pointer", flexShrink:0, transition:"all 0.2s" }}>
            {copiedAddr ? <Check size={13} strokeWidth={2.5}/> : <Copy size={13} strokeWidth={1.8}/>}
          </button>
        </div>

        <p style={{ fontSize:11, color:T.dim, margin:0, textAlign:"center", lineHeight:1.7 }}>
          Scan with <strong style={{ color:T.muted }}>BlipPay</strong> or any Quai-compatible wallet.<br/>
          Only send <strong style={{ color:T.muted }}>QUAI</strong> to this address.
        </p>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════
   TRANSACTION ROW
════════════════════════════════════════════════ */
function TxRow({ tx, quaiPrice, last }) {
  const isIn  = tx.type === "received";
  const color = isIn ? T.yes : T.text;
  const bg    = isIn ? T.yesBg : T.glass;
  const bd    = isIn ? T.yesBd : T.border;
  const Icon  = isIn ? ArrowDownLeft : ArrowUpRight;
  const usd   = quaiPrice ? (tx.amount * quaiPrice).toFixed(2) : null;
  return (
    <div className="wallet-tx-row" style={{ borderBottom: last ? "1px solid transparent" : `1px solid ${T.border}` }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: bg, border: `1px solid ${bd}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={15} strokeWidth={1.8} style={{ color }} />
      </div>
      <div className="wallet-tx-info">
        <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.label}</p>
        <p className="wallet-tx-addr">
          {isIn ? short(tx.from) : short(tx.to)} · {ago(tx.timestamp)}
        </p>
      </div>
      <div className="wallet-tx-amount">
        <p style={{ fontSize: 13, fontWeight: 700, color, margin: 0, whiteSpace: "nowrap" }}>
          {isIn ? "+" : "−"}{tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span style={{ fontSize: 11, opacity: 0.7 }}>QUAI</span>
        </p>
        {usd && <p style={{ fontSize: 10, color: T.dim, margin: "2px 0 0" }}>≈ ${usd} USDT</p>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   WALLET DETAIL ROW
════════════════════════════════════════════════ */
function DetailRow({ label, value, mono, copy: copyVal, divider, icon }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async()=>{
    if(!copyVal) return;
    try{ await navigator.clipboard.writeText(copyVal); }
    catch{ const el=document.createElement("textarea");el.value=copyVal;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el); }
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  },[copyVal]);
  return (
    <div style={{display:"flex",alignItems:"flex-start",gap:14,padding:"13px 0",borderBottom:divider?`1px solid ${T.border}`:"none"}}>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:10,color:T.dim,margin:"0 0 4px",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>{label}</p>
        <p className={`wallet-detail-val${mono?" mono":""}`} style={{margin:0,display:"flex",alignItems:"center",gap:6}}>
          {icon && <QuaiLogo size={14}/>}{value}
        </p>
      </div>
      {copyVal&&(
        <button type="button" onClick={copy} style={{width:30,height:30,borderRadius:7,background:copied?T.yesBg:T.glass,border:`1px solid ${copied?T.yesBd:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:copied?T.yes:T.dim,cursor:"pointer",flexShrink:0,marginTop:18,transition:"all 0.2s"}}>
          {copied?<Check size={12} strokeWidth={2.5}/>:<Copy size={12} strokeWidth={1.8}/>}
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   DEMO BANNER
════════════════════════════════════════════════ */
function DemoBanner({ onSwitch }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      padding: "14px 18px",
      borderRadius: 14,
      background: "rgba(234,179,8,0.08)",
      border: "1px solid rgba(234,179,8,0.25)",
    }}>
      <span style={{
        fontSize: 20, flexShrink: 0, marginTop: 1,
        filter: "drop-shadow(0 0 6px rgba(234,179,8,0.5))",
      }}>🧪</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#eab308", margin: "0 0 4px" }}>
          Demo Wallet — No Real Funds
        </p>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0, lineHeight: 1.6 }}>
          You're viewing a simulated wallet with <strong style={{ color: "rgba(255,255,255,0.7)" }}>hardcoded demo data</strong>.
          Sending, receiving, and all transactions shown here are <strong style={{ color: "rgba(255,255,255,0.7)" }}>completely fake</strong> — nothing is sent to any blockchain.
          Switch to <strong style={{ color: "#eab308" }}>Live mode</strong> in the sidebar to connect your real wallet.
        </p>
      </div>
      <button
        type="button"
        onClick={onSwitch}
        style={{
          flexShrink: 0, padding: "6px 14px", borderRadius: 8,
          background: "rgba(234,179,8,0.15)", border: "1px solid rgba(234,179,8,0.4)",
          color: "#eab308", fontSize: 11, fontWeight: 700, cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Go Live →
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN WALLET PAGE
════════════════════════════════════════════════ */
export default function WalletPage() {
  const { user }                              = useAuth();
  const { isDemoMode, toggleMode }            = useDemoModeContext();
  const { walletAddress, balance, priceData,
          transactions, balanceVisible, toggleBalanceVisibility,
          loading, refreshing, error, refresh,
          qiCode } = useWallet();

  // BlipPay registration — links the Q4 embedded wallet to a BlipPay profile
  const { profile: blipProfile, registering: blipRegistering,
          error: blipError, register: blipRegister,
          refresh: blipRefresh } = useBlipPayRegistration(walletAddress);

  const [sendOpen,    setSendOpen]    = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [topUpOpen,   setTopUpOpen]   = useState(false);
  const [exportOpen,  setExportOpen]  = useState(false);
  const [txFilter,    setTxFilter]    = useState("All"); // "All" | "Received" | "Sent"

  /* Resolve Supabase UUID from firebase_uid — needed for security questions */
  const [supabaseUserId, setSupabaseUserId] = useState(null);
  useEffect(() => {
    if (!user?.uid) return;
    supabase
      .from("users")
      .select("id")
      .eq("firebase_uid", user.uid)
      .maybeSingle()
      .then(({ data }) => { if (data?.id) setSupabaseUserId(data.id); });
  }, [user?.uid]);

  const price   = priceData?.current;
  const history = priceData?.history ?? [];
  const pos24h  = (price?.changePercent24h??0) >= 0;

  // Filter transactions — no pending, apply type filter
  const filteredTxs = transactions
    .filter(tx => tx.status !== "pending")
    .filter(tx => {
      if (txFilter === "Received") return tx.type === "received";
      if (txFilter === "Sent")     return tx.type === "sent";
      return true;
    });

  const authResolving = user === undefined;

  /* ─── skeleton: show while auth resolving OR wallet loading ─── */
  if (authResolving || loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Sk.Box w={80} h={22} r={6} />
        <Sk.Box w={90} h={34} r={8} />
      </div>
      {/* top cards — responsive: 2-col desktop, 1-col mobile via inline media */}
      <div className="wallet-top-grid" style={{ display: "grid", gap: 16 }}>
        <Sk.WalletBalance />
        <Sk.WalletPriceCard />
      </div>
      {/* transactions */}
      <Sk.WalletTxList count={4} />
      {/* wallet details */}
      <div style={{ background: "#111111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 22, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
        <Sk.Box w={110} h={10} r={4} />
        {[0,1,2,3].map(i => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
            <Sk.Box w={90} h={10} r={4} />
            <Sk.Box w={160} h={12} r={4} />
          </div>
        ))}
      </div>
    </div>
  );

  /* ─── not signed in ─── */
  if (!user) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:16}}>
      <div style={{width:56,height:56,borderRadius:16,background:T.glass,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <AlertCircle size={24} strokeWidth={1.4} style={{color:T.muted}} />
      </div>
      <p style={{fontSize:16,fontWeight:700,color:T.text,margin:0}}>Sign in to view your wallet</p>
      <p style={{fontSize:13,color:T.muted,margin:0}}>Your embedded QUAI wallet is tied to your account.</p>
    </div>
  );

  /* ─── error state — only show if we have no address at all ─── */
  if (error && !walletAddress) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:16}}>
      <div style={{width:56,height:56,borderRadius:16,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <AlertCircle size={24} strokeWidth={1.4} style={{color:"#ef4444"}} />
      </div>
      <p style={{fontSize:16,fontWeight:700,color:T.no,margin:0}}>Wallet Error</p>
      <p style={{fontSize:13,color:T.muted,margin:0,textAlign:"center",maxWidth:320}}>{error}</p>
      <button type="button" onClick={refresh}
        style={{padding:"8px 16px",borderRadius:8,background:T.glass,border:`1px solid ${T.border}`,color:T.muted,fontSize:12,fontWeight:600,cursor:"pointer"}}>
        Try Again
      </button>
    </div>
  );

  return (
    <div className="wallet-root">
      <style>{`
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes pulse-dot   { 0%,100%{opacity:1}50%{opacity:0.3} }
        @keyframes card-shimmer{
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes float-logo  { 0%,100%{transform:translate(-50%,-50%) scale(1) rotate(-8deg)}50%{transform:translate(-50%,-50%) scale(1.04) rotate(-8deg) translateY(-4px)} }

        /* ── layout ── */
        .wallet-root { display:flex; flex-direction:column; gap:24px; overflow-x:hidden; }

        /* top grid: 2 cols on ≥700, 1 col below */
        .wallet-top { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        @media(max-width:700px){ .wallet-top{ grid-template-columns:1fr; } }

        /* action btns row */
        .wallet-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

        /* balance number — shrink on small screens */
        .wallet-bal-num { font-size:34px; }
        @media(max-width:400px){ .wallet-bal-num{ font-size:26px; } }

        /* address pill — truncate cleanly */
        .wallet-addr-text { font-size:12px; font-family:monospace; color:rgba(255,255,255,0.5); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0; }
        @media(max-width:480px){ .wallet-addr-text{ font-size:10px; } }

        /* price stats row — 4 cols desktop, 2 cols mobile */
        .wallet-stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
        @media(max-width:480px){ .wallet-stats-grid{ grid-template-columns:repeat(2,1fr); } }

        /* tx row — prevent overflow */
        .wallet-tx-row { display:flex; align-items:center; gap:12px; padding:12px 0; min-width:0; overflow:hidden; }
        .wallet-tx-info { flex:1; min-width:0; overflow:hidden; }
        .wallet-tx-addr { font-size:12px; font-family:monospace; color:rgba(255,255,255,0.4); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .wallet-tx-amount { flex-shrink:0; text-align:right; }

        /* detail row value — wrap long strings */
        .wallet-detail-val { font-size:13px; color:#f0f0f0; font-weight:500; word-break:break-all; overflow-wrap:anywhere; }
        .wallet-detail-val.mono { font-family:monospace; font-size:12px; }

        /* modal — full width on tiny screens */
        @media(max-width:480px){
          .wallet-root { gap:16px; }
          .wallet-actions { grid-template-columns:1fr 1fr; }
        }
      `}</style>

      {/* ── PAGE HEADER ── */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:"#fff",margin:0,letterSpacing:"-0.03em"}}>Wallet</h1>
          <p style={{fontSize:13,color:T.muted,margin:"4px 0 0"}}>
            {isDemoMode ? "Demo wallet — simulated data only." : "Your embedded Quai wallet — powered by BlipPay."}
          </p>
        </div>
        <button type="button" onClick={refresh} disabled={refreshing}
          style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:8,background:T.glass,border:`1px solid ${T.border}`,color:refreshing?T.dim:T.muted,fontSize:13,fontWeight:600,cursor:refreshing?"not-allowed":"pointer",transition:"all 0.15s"}}
          onMouseEnter={e=>{if(!refreshing){e.currentTarget.style.borderColor=T.borderHi;e.currentTarget.style.color=T.text;}}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=refreshing?T.dim:T.muted;}}>
          <RefreshCw size={14} strokeWidth={2} style={{animation:refreshing?"spin 0.8s linear infinite":"none"}}/> {refreshing?"Refreshing…":"Refresh"}
        </button>
      </div>

      {/* ── DEMO BANNER ── */}
      {isDemoMode && <DemoBanner onSwitch={toggleMode} />}

      {/* ── ERROR BANNER ── */}
      {error&&(
        <div style={{display:"flex",gap:10,padding:"12px 16px",borderRadius:10,background:T.noBg,border:`1px solid ${T.noBd}`,color:T.no,fontSize:12}}>
          <AlertCircle size={14} strokeWidth={2} style={{flexShrink:0,marginTop:1}}/><span>Some data could not be loaded: {error}</span>
        </div>
      )}

      {/* ══ TOP GRID ══ */}
      <div className="wallet-top">

        {/* ─── GORGEOUS BALANCE CARD ─── */}
        <div style={{position:"relative",borderRadius:22,overflow:"hidden",border:`1px solid rgba(255,255,255,0.14)`,boxShadow:"0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05) inset"}}>

          {/* multi-layer background */}
          <div style={{
            position:"absolute",inset:0,
            backgroundColor:"#0a0a0a",
            backgroundImage:`
              radial-gradient(ellipse 120% 90% at 80% -10%, rgba(255,255,255,0.07) 0%, transparent 55%),
              radial-gradient(ellipse 80% 80% at -10% 110%, rgba(255,255,255,0.04) 0%, transparent 55%),
              radial-gradient(ellipse 60% 60% at 50% 50%, rgba(255,255,255,0.025) 0%, transparent 70%),
              radial-gradient(circle, rgba(255,255,255,0.22) 1px, transparent 1px)
            `,
            backgroundSize:"auto, auto, auto, 28px 28px",
            backgroundPosition:"top right, bottom left, center, 0 0",
          }}/>

          {/* shimmer sweep */}
          <div style={{
            position:"absolute",inset:0,
            background:"linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.035) 50%, transparent 60%)",
            backgroundSize:"200% 100%",
            animation:"card-shimmer 5s linear infinite",
          }}/>

          {/* top-right glow orb */}
          <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)",pointerEvents:"none"}}/>
          {/* bottom-left orb */}
          <div style={{position:"absolute",bottom:-30,left:-30,width:140,height:140,borderRadius:"50%",background:"radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)",pointerEvents:"none"}}/>

          {/* Q4 logo watermark */}
          <img src={q4LogoSrc} alt="" aria-hidden="true" style={{
            position:"absolute",top:"50%",left:"50%",
            transform:"translate(-50%,-50%) scale(1) rotate(-8deg)",
            width:200,height:200,objectFit:"contain",
            opacity:0.04,filter:"grayscale(100%) brightness(3)",
            pointerEvents:"none",userSelect:"none",
            animation:"float-logo 8s ease-in-out infinite",
          }}/>

          {/* card content */}
          <div style={{position:"relative",zIndex:1,padding:"24px 24px 20px",display:"flex",flexDirection:"column",gap:20}}>

            {/* header row */}
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:11,fontWeight:700,color:"rgba(255,255,255,0.4)",letterSpacing:"0.12em",textTransform:"uppercase",margin:"0 0 10px"}}>Total Balance</p>
                {balanceVisible ? (
                  <>
                    <p className="wallet-bal-num" style={{fontWeight:900,color:"#fff",margin:0,letterSpacing:"-0.04em",lineHeight:1,display:"flex",alignItems:"center",gap:8}}>
                      {fmtQ(balance.quai)}&nbsp;<QuaiLogo size={22} />
                    </p>
                    <p style={{fontSize:15,fontWeight:600,color:"rgba(255,255,255,0.5)",margin:"6px 0 0"}}>{fmtU(balance.usd)}</p>
                  </>
                ) : (
                  <>
                    <p className="wallet-bal-num" style={{fontWeight:900,color:"#fff",margin:0,letterSpacing:"0.1em",lineHeight:1,display:"flex",alignItems:"center",gap:8}}>
                      ••••••&nbsp;<QuaiLogo size={22} />
                    </p>
                    <p style={{fontSize:15,fontWeight:600,color:"rgba(255,255,255,0.35)",margin:"6px 0 0"}}>••••••</p>
                  </>
                )}
              </div>
              {/* eye toggle */}
              <button type="button" onClick={toggleBalanceVisibility} title={balanceVisible?"Hide balance":"Show balance"}
                style={{width:36,height:36,borderRadius:9,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.5)",cursor:"pointer",flexShrink:0,transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.12)";e.currentTarget.style.color="#fff";}}
                onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="rgba(255,255,255,0.5)";}}>
                {balanceVisible?<EyeOff size={14} strokeWidth={1.8}/>:<Eye size={14} strokeWidth={1.8}/>}
              </button>
            </div>

            {/* divider */}
            <div style={{height:1,background:"rgba(255,255,255,0.07)"}}/>

            {/* address pill */}
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:T.yes,flexShrink:0,animation:"pulse-dot 2s ease-in-out infinite"}}/>
              <span className="wallet-addr-text">{walletAddress??"—"}</span>
              <span style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.55)",background:"rgba(255,255,255,0.07)",padding:"2px 7px",borderRadius:4,flexShrink:0}}><QuaiLogo size={12}/>Quai</span>
            </div>

            {/* action buttons */}
            <div className="wallet-actions">
              <button type="button" onClick={()=>setSendOpen(true)}
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"12px",borderRadius:11,background:"#ffffff",color:"#080808",fontWeight:800,fontSize:13,border:"none",cursor:"pointer",transition:"opacity 0.15s",boxShadow:"0 4px 16px rgba(255,255,255,0.12)"}}
                onMouseEnter={e=>e.currentTarget.style.opacity="0.88"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
                <Send size={14} strokeWidth={2.5}/> Send
              </button>
              <button type="button" onClick={()=>setReceiveOpen(true)}
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"12px",borderRadius:11,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.18)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",transition:"background 0.15s"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.13)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.07)"}>
                <Download size={14} strokeWidth={2}/> Receive
              </button>
              <button type="button" onClick={()=>setTopUpOpen(true)}
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"12px",borderRadius:11,background:"rgba(124,111,247,0.12)",border:"1px solid rgba(124,111,247,0.35)",color:T.violet,fontWeight:700,fontSize:13,cursor:"pointer",transition:"background 0.15s",gridColumn:"1 / -1"}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(124,111,247,0.22)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(124,111,247,0.12)"}>
                <Plus size={14} strokeWidth={2.5}/> Top Up with USDT
              </button>
            </div>
          </div>
        </div>

        {/* ─── PRICE CARD ─── */}
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:22,padding:20,display:"flex",flexDirection:"column",gap:14,overflow:"hidden",position:"relative"}}>

          {/* header row */}
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
            <div>
              <p style={{fontSize:10,fontWeight:700,color:T.dim,letterSpacing:"0.12em",textTransform:"uppercase",margin:"0 0 6px",display:"flex",alignItems:"center",gap:5}}><QuaiLogo size={13}/>QUAI / USD · 7 Day</p>
              <div style={{display:"flex",alignItems:"baseline",gap:10}}>
                <p style={{fontSize:28,fontWeight:900,color:"#fff",margin:0,letterSpacing:"-0.04em",lineHeight:1}}>
                  {price ? fmtP(price.price) : "—"}
                </p>
                {price && (
                  <div style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",borderRadius:7,background:pos24h?T.yesBg:T.noBg,border:`1px solid ${pos24h?T.yesBd:T.noBd}`}}>
                    {pos24h
                      ? <TrendingUp  size={11} strokeWidth={2.5} style={{color:T.yes}}/>
                      : <TrendingDown size={11} strokeWidth={2.5} style={{color:T.no}} />}
                    <span style={{fontSize:12,fontWeight:800,color:pos24h?T.yes:T.no}}>
                      {pos24h ? "+" : ""}{(price.changePercent24h??0).toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
            {/* live dot */}
            <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 10px",borderRadius:7,background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:T.yes,boxShadow:`0 0 6px ${T.yes}`,flexShrink:0,animation:"pulse-dot 2s ease-in-out infinite"}}/>
              <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.4)"}}>LIVE</span>
            </div>
          </div>

          {/* interactive chart */}
          <div style={{margin:"0 -4px"}}>
            <PriceChart history={history} positive={pos24h} height={148} />
          </div>

          {/* stats row */}
          {price && (
            <div className="wallet-stats-grid" style={{borderTop:`1px solid ${T.border}`,paddingTop:12}}>
              {[
                ["High 24h",  fmtP(price.high24h)],
                ["Low 24h",   fmtP(price.low24h)],
                ["Vol 24h",   price.volume24h ? `$${(price.volume24h/1000).toFixed(0)}K` : "—"],
                ["Mkt Cap",   price.marketCap  ? `$${(price.marketCap/1e6).toFixed(1)}M`  : "—"],
              ].map(([l,v]) => (
                <div key={l} style={{textAlign:"center",padding:"8px 0",borderRadius:8,background:"rgba(255,255,255,0.02)"}}>
                  <p style={{fontSize:9,fontWeight:700,color:T.dim,margin:"0 0 3px",letterSpacing:"0.07em",textTransform:"uppercase"}}>{l}</p>
                  <p style={{fontSize:12,fontWeight:700,color:T.muted,margin:0}}>{v}</p>
                </div>
              ))}
            </div>
          )}

          <p style={{fontSize:9,color:T.dim,margin:0,textAlign:"right"}}>
            via BlipPay · {price?.lastUpdated ? new Date(price.lastUpdated).toLocaleTimeString() : "—"}
          </p>
        </div>
      </div>

      {/* ══ TRANSACTIONS ══ */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:22,padding:"20px 22px"}}>
        {/* Header + filter tabs */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:T.dim,textTransform:"uppercase",margin:0}}>Transaction History</p>
          {refreshing&&<span style={{fontSize:10,color:T.dim,display:"flex",alignItems:"center",gap:4}}><Loader size={10} strokeWidth={2} style={{animation:"spin 0.8s linear infinite"}}/>Updating…</span>}
        </div>
        {/* Filter pills */}
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {["All","Received","Sent"].map(f=>{
            const active = txFilter===f;
            const col = f==="Received"?"#22c55e":f==="Sent"?"#ef4444":"#7c6ff7";
            return (
              <button key={f} type="button" onClick={()=>setTxFilter(f)}
                style={{
                  padding:"5px 14px",borderRadius:999,fontSize:11,fontWeight:700,cursor:"pointer",
                  border:`1px solid ${active?col+"60":T.border}`,
                  background:active?`${col}18`:"transparent",
                  color:active?col:T.muted,
                  transition:"all 0.15s",
                }}>
                {f}
              </button>
            );
          })}
          <span style={{marginLeft:"auto",fontSize:11,color:T.dim,alignSelf:"center"}}>
            {filteredTxs.length} transaction{filteredTxs.length!==1?"s":""}
          </span>
        </div>

        {filteredTxs.length===0?(
          <div style={{padding:"28px 0",textAlign:"center"}}>
            <p style={{fontSize:14,color:T.muted,margin:0}}>No {txFilter!=="All"?txFilter.toLowerCase()+" ":""} transactions found.</p>
          </div>
        ):(
          <div>
            {filteredTxs.map((tx,i)=><TxRow key={tx.id} tx={tx} quaiPrice={price?.price} last={i===filteredTxs.length-1}/>)}
            {walletAddress && (
              <div style={{paddingTop:12,textAlign:"center"}}>
                <a
                  href={`https://quaiscan.io/address/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{fontSize:11,color:T.dim,fontWeight:600,textDecoration:"none"}}
                >
                  View full history on Quaiscan ↗
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══ BLIPPAY CONNECT ══ */}
      {!isDemoMode && walletAddress && (() => {
        const isRegistered = blipProfile != null;
        const isPending    = blipProfile === undefined; // still fetching

        if (isPending) return null; // don't flash UI while loading

        return (
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 22, padding: "20px 22px",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* BlipPay logo placeholder */}
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: isRegistered ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${isRegistered ? "rgba(34,197,94,0.3)" : T.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>
                  {isRegistered ? "✓" : "⚡"}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", margin: 0 }}>
                    {isRegistered ? "Connected to BlipPay" : "Connect to BlipPay"}
                  </p>
                  <p style={{ fontSize: 11, color: T.muted, margin: "2px 0 0" }}>
                    {isRegistered
                      ? `@${blipProfile.shortCode ?? blipProfile.displayName ?? "profile"} · wallet identified on Quai network`
                      : "Register your wallet so BlipPay recognises it as a Quai address"}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {isRegistered && blipProfile.shortUrl && (
                  <a href={blipProfile.shortUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                      background: "transparent", border: `1px solid ${T.border}`,
                      color: T.muted, textDecoration: "none", cursor: "pointer",
                      transition: "border-color 0.15s, color 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.yes; e.currentTarget.style.color = T.yes; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                  >
                    View Profile
                  </a>
                )}
                <button
                  type="button"
                  disabled={blipRegistering}
                  onClick={async () => {
                    try {
                      await blipRegister(user.uid, user.displayName ?? user.email ?? "Q4 Predictor");
                      // Refresh WalletContext qiCode now that address is registered
                      refresh();
                    } catch { /* error already set in hook */ }
                  }}
                  style={{
                    padding: "7px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                    cursor: blipRegistering ? "not-allowed" : "pointer", border: "none",
                    background: isRegistered ? "rgba(34,197,94,0.12)" : "rgba(34,197,94,0.9)",
                    color: isRegistered ? "rgba(34,197,94,0.8)" : "#000000",
                    opacity: blipRegistering ? 0.6 : 1,
                    transition: "opacity 0.15s, background 0.15s",
                  }}
                >
                  {blipRegistering ? "Connecting…" : isRegistered ? "Re-sync" : "Connect"}
                </button>
              </div>
            </div>

            {/* QI payment code row — shown once registered */}
            {isRegistered && blipProfile.contactQiPaymentCode && (
              <div style={{
                marginTop: 14, paddingTop: 14, borderTop: `1px solid ${T.border}`,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
              }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: T.dim, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 3px" }}>
                    QI Payment Code
                  </p>
                  <p style={{ fontSize: 11, color: "#f0f0f0", fontFamily: "monospace", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {blipProfile.contactQiPaymentCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(blipProfile.contactQiPaymentCode)}
                  style={{
                    flexShrink: 0, padding: "5px 12px", borderRadius: 6, fontSize: 11,
                    fontWeight: 600, cursor: "pointer", background: "transparent",
                    border: `1px solid ${T.border}`, color: T.muted, transition: "border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.yes; e.currentTarget.style.color = T.yes; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                >
                  Copy
                </button>
              </div>
            )}

            {/* Error */}
            {blipError && (
              <p style={{ fontSize: 11, color: "#ef4444", margin: "10px 0 0" }}>
                {blipError}
              </p>
            )}
          </div>
        );
      })()}

      {/* ══ WALLET DETAILS ══ */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:22,padding:"20px 22px"}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:T.dim,textTransform:"uppercase",margin:"0 0 4px"}}>Wallet Details</p>
        {[
          {label:"Wallet Address", value:walletAddress??"—", mono:true,  copy:walletAddress, icon:false},
          {label:"Network",        value:"Quai Network · Zone 0-0", mono:false, icon:true},
          {label:"Wallet Type",    value:"Embedded (HKDF-derived, non-custodial)", mono:false, icon:false},
          {label:"Account Owner",  value:user?.email??"—", mono:false, icon:false},
        ].map(({label,value,mono,copy,icon},i,a)=>(
          <DetailRow key={label} label={label} value={value} mono={mono} copy={copy} icon={icon} divider={i<a.length-1}/>
        ))}

        {/* Export key row */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:14, borderTop:`1px solid ${T.border}`, marginTop:4 }}>
          <div>
            <p style={{ fontSize:10, fontWeight:700, color:T.dim, letterSpacing:"0.06em", textTransform:"uppercase", margin:"0 0 3px" }}>Private Key</p>
            <p style={{ fontSize:12, color:T.muted, margin:0 }}>Export to import into Pelagus or any Quai wallet</p>
          </div>
          <button type="button" onClick={() => setExportOpen(true)}
            style={{ flexShrink:0, padding:"7px 14px", borderRadius:8, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.22)", color:"rgba(239,68,68,0.8)", fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>
            Export Key
          </button>
        </div>
      </div>

      {/* ── MODALS ── */}
      <SendModal    open={sendOpen}    onClose={()=>setSendOpen(false)}    balance={balance} quaiPrice={price?.price} walletAddress={walletAddress} uid={user?.uid} isDemo={isDemoMode}/>
      <ReceiveModal open={receiveOpen} onClose={()=>setReceiveOpen(false)} walletAddress={walletAddress}/>
      <TopUpModal   open={topUpOpen}   onClose={()=>setTopUpOpen(false)}   walletAddress={walletAddress} userEmail={user?.email}/>
      <ExportKeyModal open={exportOpen} onClose={()=>setExportOpen(false)} uid={user?.uid} supabaseUserId={supabaseUserId} isDemo={isDemoMode}/>
    </div>
  );
}
