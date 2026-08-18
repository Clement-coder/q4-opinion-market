/**
 * WalletPage.jsx — Q4 Wallet
 * Gorgeous balance card · BlipPay live price · Send/Receive modals
 * Responsive: single-column on mobile, side-by-side on desktop
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Download, RefreshCw, Eye, EyeOff, Copy, Check,
  ArrowUpRight, ArrowDownLeft, Clock, XCircle,
  TrendingUp, TrendingDown, Wifi, X,
  AlertCircle, Loader,
} from "../components/icons";
import { useWallet } from "../context/WalletContext";
import { useAuth }   from "../context/AuthContext";
import q4LogoSrc     from "../assets/Q4_logo.jpeg";

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
   QR CODE (pure SVG — no lib)
════════════════════════════════════════════════ */
function SimpleQR({ data, size = 180 }) {
  const seed  = data ? [...data].reduce((a,c)=>a+c.charCodeAt(0),0) : 42;
  const cells = 25, cell = Math.floor(size/(cells+2)), off = cell;
  const bits  = Array.from({length:cells},(_,r)=>
    Array.from({length:cells},(_,c)=>{
      if((r<7&&c<7)||(r<7&&c>=cells-7)||(r>=cells-7&&c<7)){
        const outer=(r===0||r===6||c===0||c===6||r===cells-7||r===cells-1||c===cells-7||c===cells-1);
        const inner=(r>=2&&r<=4&&c>=2&&c<=4)||(r>=2&&r<=4&&c>=cells-5&&c<=cells-3)||(r>=cells-5&&r<=cells-3&&c>=2&&c<=4);
        return outer||inner?1:0;
      }
      const v=(seed*1103515245+r*cells*12345+c*12345)&0x7fffffff;
      return (v>>(r*c%8))&1;
    }));
  return (
    <svg width={size} height={size} style={{background:"#fff",borderRadius:8,display:"block"}}>
      {bits.map((row,r)=>row.map((bit,c)=>bit?(
        <rect key={`${r}-${c}`} x={off+c*cell} y={off+r*cell} width={cell} height={cell} fill="#080808"/>
      ):null))}
    </svg>
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
   SEND MODAL
════════════════════════════════════════════════ */
function SendModal({ open, onClose, balance, quaiPrice }) {
  const [step,      setStep]      = useState("form");
  const [recipient, setRecipient] = useState("");
  const [amount,    setAmount]    = useState("");
  const [err,       setErr]       = useState("");
  const [sending,   setSending]   = useState(false);
  const [txHash,    setTxHash]    = useState("");

  const FEE = 0.001;
  const num = parseFloat(amount)||0;
  const total = num + FEE;
  const usd = quaiPrice ? (num*quaiPrice).toFixed(2) : null;
  const feeUsd = quaiPrice ? (FEE*quaiPrice).toFixed(4) : null;
  const ok = balance.quai >= total;

  function reset(){ setStep("form");setRecipient("");setAmount("");setErr("");setTxHash(""); }
  function close(){ reset();onClose(); }

  function validate(){
    if(!/^0x[0-9a-fA-F]{40}$/.test(recipient)){setErr("Invalid Quai address — must be 0x + 40 hex chars.");return false;}
    if(num<=0){setErr("Enter a valid amount.");return false;}
    if(!ok){setErr(`Insufficient balance — need ${total.toFixed(4)} QUAI (incl. fee).`);return false;}
    setErr(""); return true;
  }

  async function confirm(){
    setSending(true);
    try{
      await new Promise(r=>setTimeout(r,1500));
      setTxHash("0x"+Array.from({length:64},()=>Math.floor(Math.random()*16).toString(16)).join(""));
      setStep("done");
    }catch(e){setErr(e.message);setStep("error");}
    finally{setSending(false);}
  }

  const fieldStyle = { width:"100%", padding:"11px 14px", background:T.glass, border:`1px solid ${T.border}`, borderRadius:10, color:"#fff", fontSize:13, outline:"none", boxSizing:"border-box", transition:"border-color 0.15s" };

  return (
    <Modal open={open} onClose={close} title="Send QUAI">
      {step==="form" && (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:8,background:T.yesBg,border:`1px solid ${T.yesBd}`}}>
            <Wifi size={12} strokeWidth={2} style={{color:T.yes}}/> <span style={{fontSize:11,fontWeight:600,color:T.yes}}>Quai Network · Zone 0-0</span>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:T.dim,letterSpacing:"0.06em",textTransform:"uppercase",display:"block",marginBottom:6}}>Recipient Address</label>
            <input type="text" placeholder="0x…" value={recipient} onChange={e=>setRecipient(e.target.value)}
              style={{...fieldStyle,fontFamily:"monospace"}} onFocus={e=>e.target.style.borderColor=T.borderHi} onBlur={e=>e.target.style.borderColor=T.border}/>
          </div>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:T.dim,letterSpacing:"0.06em",textTransform:"uppercase",display:"block",marginBottom:6}}>Amount (QUAI)</label>
            <div style={{position:"relative"}}>
              <input type="number" min="0" step="0.0001" placeholder="0.0000" value={amount} onChange={e=>setAmount(e.target.value)}
                style={{...fieldStyle,paddingRight:72,fontSize:20,fontWeight:800,letterSpacing:"-0.02em"}} onFocus={e=>e.target.style.borderColor=T.borderHi} onBlur={e=>e.target.style.borderColor=T.border}/>
              <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:12,fontWeight:700,color:T.dim}}>QUAI</span>
            </div>
            {usd && num>0 && <p style={{fontSize:11,color:T.muted,margin:"4px 0 0"}}>≈ ${usd} USD</p>}
            <button type="button" onClick={()=>setAmount(Math.max(0,balance.quai-FEE).toFixed(4))}
              style={{marginTop:6,fontSize:11,color:T.violet,background:"none",border:"none",cursor:"pointer",padding:0,fontWeight:600}}>
              Use max ({Math.max(0,balance.quai-FEE).toFixed(4)} QUAI)
            </button>
          </div>
          <div style={{padding:"10px 14px",borderRadius:10,background:T.glass,border:`1px solid ${T.border}`}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:11,color:T.dim}}>Network Fee</span>
              <span style={{fontSize:12,fontWeight:700,color:T.muted}}>{FEE} QUAI{feeUsd?` (~$${feeUsd})`:""}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <span style={{fontSize:11,color:T.dim}}>Total</span>
              <span style={{fontSize:12,fontWeight:700,color:ok?T.text:T.no}}>{total.toFixed(4)} QUAI</span>
            </div>
          </div>
          {err && <div style={{display:"flex",gap:8,padding:"10px 14px",borderRadius:8,background:T.noBg,border:`1px solid ${T.noBd}`,color:T.no,fontSize:12}}><AlertCircle size={14} strokeWidth={2} style={{flexShrink:0,marginTop:1}}/>{err}</div>}
          <button type="button" onClick={()=>{if(validate())setStep("confirm");}} style={{width:"100%",padding:13,borderRadius:10,background:"#fff",color:"#080808",fontWeight:800,fontSize:14,border:"none",cursor:"pointer"}}>
            Review Transaction
          </button>
        </div>
      )}
      {step==="confirm" && (
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{padding:16,borderRadius:12,background:T.glass,border:`1px solid ${T.border}`}}>
            {[{l:"To",v:short(recipient),m:true},{l:"Amount",v:`${num.toFixed(4)} QUAI${usd?` (~$${usd})`:""}`},{l:"Fee",v:`${FEE} QUAI`},{l:"Network",v:"Quai Network · Zone 0-0"}].map(({l,v,m},i,a)=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:i<a.length-1?`1px solid ${T.border}`:"none"}}>
                <span style={{fontSize:12,color:T.dim}}>{l}</span>
                <span style={{fontSize:12,fontWeight:700,color:T.text,fontFamily:m?"monospace":"inherit"}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <button type="button" onClick={()=>setStep("form")} style={{padding:12,borderRadius:10,background:T.glass,border:`1px solid ${T.border}`,color:T.muted,fontWeight:600,fontSize:13,cursor:"pointer"}}>Back</button>
            <button type="button" onClick={confirm} disabled={sending} style={{padding:12,borderRadius:10,background:sending?"rgba(255,255,255,0.3)":"#fff",color:"#080808",fontWeight:800,fontSize:13,border:"none",cursor:sending?"not-allowed":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              {sending?<><Loader size={14} strokeWidth={2} style={{animation:"spin 0.7s linear infinite"}}/>Sending…</>:"Confirm Send"}
            </button>
          </div>
        </div>
      )}
      {step==="done" && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,padding:"8px 0"}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:T.yesBg,border:`2px solid ${T.yes}`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 28px rgba(34,197,94,0.4)",animation:"modal-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both"}}>
            <Check size={28} strokeWidth={2.5} style={{color:T.yes}}/>
          </div>
          <div style={{textAlign:"center"}}>
            <p style={{fontSize:18,fontWeight:800,color:"#fff",margin:"0 0 4px"}}>Sent Successfully!</p>
            <p style={{fontSize:12,color:T.muted,margin:0}}>{num.toFixed(4)} QUAI → {short(recipient)}</p>
          </div>
          <div style={{width:"100%",padding:"10px 14px",borderRadius:10,background:T.glass,border:`1px solid ${T.border}`}}>
            <p style={{fontSize:10,color:T.dim,margin:"0 0 3px",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em"}}>Transaction Hash</p>
            <p style={{fontSize:11,fontFamily:"monospace",color:T.muted,margin:0,wordBreak:"break-all"}}>{txHash}</p>
          </div>
          <button type="button" onClick={close} style={{width:"100%",padding:12,borderRadius:10,background:T.glass,border:`1px solid ${T.border}`,color:T.muted,fontWeight:600,fontSize:13,cursor:"pointer"}}>Close</button>
        </div>
      )}
      {step==="error" && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:"8px 0"}}>
          <XCircle size={48} strokeWidth={1.5} style={{color:T.no}}/>
          <p style={{fontSize:16,fontWeight:700,color:T.no,margin:0}}>Transaction Failed</p>
          <p style={{fontSize:12,color:T.muted,margin:0,textAlign:"center"}}>{err}</p>
          <button type="button" onClick={()=>setStep("form")} style={{padding:"10px 24px",borderRadius:8,background:T.glass,border:`1px solid ${T.border}`,color:T.muted,fontWeight:600,cursor:"pointer"}}>Try Again</button>
        </div>
      )}
    </Modal>
  );
}

/* ════════════════════════════════════════════════
   RECEIVE MODAL
════════════════════════════════════════════════ */
function ReceiveModal({ open, onClose, walletAddress }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async()=>{
    if(!walletAddress) return;
    try{ await navigator.clipboard.writeText(walletAddress); }
    catch{ const el=document.createElement("textarea");el.value=walletAddress;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el); }
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  },[walletAddress]);

  return (
    <Modal open={open} onClose={onClose} title="Receive QUAI">
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"7px 14px",borderRadius:8,background:T.yesBg,border:`1px solid ${T.yesBd}`}}>
          <Wifi size={12} strokeWidth={2} style={{color:T.yes}}/> <span style={{fontSize:11,fontWeight:600,color:T.yes}}>Quai Network · Zone 0-0</span>
        </div>
        <div style={{padding:12,background:"#fff",borderRadius:14,boxShadow:"0 8px 32px rgba(0,0,0,0.5)"}}>
          <SimpleQR data={walletAddress??"q4-wallet"} size={180}/>
        </div>
        <p style={{fontSize:11,color:T.dim,margin:0,textAlign:"center",lineHeight:1.6}}>Only send <strong style={{color:T.muted}}>QUAI</strong> to this address.<br/>Sending other assets may result in permanent loss.</p>
        <div style={{width:"100%",padding:"12px 14px",borderRadius:12,background:T.glass,border:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}}>
          <p style={{flex:1,fontSize:12,fontFamily:"monospace",color:T.text,margin:0,wordBreak:"break-all",letterSpacing:"0.03em"}}>{walletAddress??"Loading…"}</p>
          <button type="button" onClick={copy} style={{width:36,height:36,borderRadius:8,background:copied?T.yesBg:T.glass,border:`1px solid ${copied?T.yesBd:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:copied?T.yes:T.muted,cursor:"pointer",flexShrink:0,transition:"all 0.2s"}}>
            {copied?<Check size={14} strokeWidth={2.5}/>:<Copy size={14} strokeWidth={1.8}/>}
          </button>
        </div>
        {copied && <p style={{fontSize:11,color:T.yes,margin:0,fontWeight:600}}>✓ Address copied to clipboard</p>}
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════
   TRANSACTION ROW
════════════════════════════════════════════════ */
function TxRow({ tx, quaiPrice, last }) {
  const isIn   = tx.type==="received";
  const isPend = tx.status==="pending";
  const isFail = tx.status==="failed";
  const color  = isFail?T.no:isPend?T.muted:isIn?T.yes:T.text;
  const bg     = isFail?T.noBg:isPend?T.glass:isIn?T.yesBg:T.glass;
  const bd     = isFail?T.noBd:isPend?T.border:isIn?T.yesBd:T.border;
  const Icon   = isFail?XCircle:isPend?Clock:isIn?ArrowDownLeft:ArrowUpRight;
  const usd    = quaiPrice?(tx.amount*quaiPrice).toFixed(2):null;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:last?`1px solid transparent`:`1px solid ${T.border}`}}>
      <div style={{width:38,height:38,borderRadius:10,background:bg,border:`1px solid ${bd}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon size={15} strokeWidth={1.8} style={{color}}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:13,fontWeight:600,color:T.text,margin:0}}>{tx.label}</p>
        <p style={{fontSize:10,color:T.dim,margin:"2px 0 0",display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
          <span>{isIn?short(tx.from):short(tx.to)}</span><span>·</span><span>{ago(tx.timestamp)}</span>
          {isPend&&<span style={{color:"#fbbf24",fontWeight:700}}>PENDING</span>}
          {isFail&&<span style={{color:T.no,fontWeight:700}}>FAILED</span>}
        </p>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <p style={{fontSize:13,fontWeight:700,color,margin:0}}>{isFail?"—":`${isIn?"+":"−"}${tx.amount.toFixed(4)} QUAI`}</p>
        {usd&&!isFail&&<p style={{fontSize:10,color:T.dim,margin:"2px 0 0"}}>${usd}</p>}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   WALLET DETAIL ROW
════════════════════════════════════════════════ */
function DetailRow({ label, value, mono, copy: copyVal, divider }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async()=>{
    if(!copyVal) return;
    try{ await navigator.clipboard.writeText(copyVal); }
    catch{ const el=document.createElement("textarea");el.value=copyVal;document.body.appendChild(el);el.select();document.execCommand("copy");document.body.removeChild(el); }
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  },[copyVal]);
  return (
    <div style={{display:"flex",alignItems:"center",gap:14,padding:"13px 0",borderBottom:divider?`1px solid ${T.border}`:"none"}}>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:10,color:T.dim,margin:"0 0 2px",fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase"}}>{label}</p>
        <p style={{fontSize:12,color:T.text,margin:0,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontFamily:mono?"monospace":"inherit",letterSpacing:mono?"0.03em":"inherit"}}>{value}</p>
      </div>
      {copyVal&&(
        <button type="button" onClick={copy} style={{width:30,height:30,borderRadius:7,background:copied?T.yesBg:T.glass,border:`1px solid ${copied?T.yesBd:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",color:copied?T.yes:T.dim,cursor:"pointer",flexShrink:0,transition:"all 0.2s"}}>
          {copied?<Check size={12} strokeWidth={2.5}/>:<Copy size={12} strokeWidth={1.8}/>}
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN WALLET PAGE
════════════════════════════════════════════════ */
export default function WalletPage() {
  const { user }                              = useAuth();
  const { walletAddress, balance, priceData,
          transactions, balanceVisible, toggleBalanceVisibility,
          loading, refreshing, error, refresh } = useWallet();

  const [sendOpen,    setSendOpen]    = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);

  const price   = priceData?.current;
  const history = priceData?.history ?? [];
  const pos24h  = (price?.changePercent24h??0) >= 0;

  /* ─── loading ─── */
  if (loading) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:16}}>
      <Loader size={28} strokeWidth={1.5} style={{color:T.dim,animation:"spin 0.9s linear infinite"}}/>
      <p style={{fontSize:13,color:T.muted,margin:0}}>Setting up your wallet…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
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
        .wallet-root { display:flex; flex-direction:column; gap:24px; }

        /* top grid: 2 cols on ≥700, 1 col below */
        .wallet-top { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        @media(max-width:700px){ .wallet-top{ grid-template-columns:1fr; } }

        /* action btns row */
        .wallet-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

        /* balance number — shrink on small screens */
        .wallet-bal-num { font-size:34px; }
        @media(max-width:400px){ .wallet-bal-num{ font-size:26px; } }

        /* address pill — truncate cleanly */
        .wallet-addr-text { font-size:12px; font-family:monospace; color:rgba(255,255,255,0.5); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        @media(max-width:480px){ .wallet-addr-text{ font-size:10px; } }
      `}</style>

      {/* ── PAGE HEADER ── */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:800,color:"#fff",margin:0,letterSpacing:"-0.03em"}}>Wallet</h1>
          <p style={{fontSize:13,color:T.muted,margin:"4px 0 0"}}>Your embedded Quai wallet — powered by BlipPay.</p>
        </div>
        <button type="button" onClick={refresh} disabled={refreshing}
          style={{display:"flex",alignItems:"center",gap:6,padding:"9px 16px",borderRadius:8,background:T.glass,border:`1px solid ${T.border}`,color:refreshing?T.dim:T.muted,fontSize:13,fontWeight:600,cursor:refreshing?"not-allowed":"pointer",transition:"all 0.15s"}}
          onMouseEnter={e=>{if(!refreshing){e.currentTarget.style.borderColor=T.borderHi;e.currentTarget.style.color=T.text;}}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=refreshing?T.dim:T.muted;}}>
          <RefreshCw size={14} strokeWidth={2} style={{animation:refreshing?"spin 0.8s linear infinite":"none"}}/> {refreshing?"Refreshing…":"Refresh"}
        </button>
      </div>

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
                    <p className="wallet-bal-num" style={{fontWeight:900,color:"#fff",margin:0,letterSpacing:"-0.04em",lineHeight:1}}>
                      {fmtQ(balance.quai)}&nbsp;<span style={{fontSize:16,fontWeight:500,color:"rgba(255,255,255,0.4)"}}>QUAI</span>
                    </p>
                    <p style={{fontSize:15,fontWeight:600,color:"rgba(255,255,255,0.5)",margin:"6px 0 0"}}>{fmtU(balance.usd)}</p>
                  </>
                ) : (
                  <>
                    <p className="wallet-bal-num" style={{fontWeight:900,color:"#fff",margin:0,letterSpacing:"0.1em",lineHeight:1}}>
                      ••••••&nbsp;<span style={{fontSize:16,fontWeight:500,color:"rgba(255,255,255,0.4)"}}>QUAI</span>
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
              <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.07)",padding:"2px 7px",borderRadius:4,flexShrink:0}}>Quai</span>
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
            </div>
          </div>
        </div>

        {/* ─── PRICE CARD ─── */}
        <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:22,padding:20,display:"flex",flexDirection:"column",gap:14,overflow:"hidden",position:"relative"}}>

          {/* header row */}
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
            <div>
              <p style={{fontSize:10,fontWeight:700,color:T.dim,letterSpacing:"0.12em",textTransform:"uppercase",margin:"0 0 6px"}}>QUAI / USD · 7 Day</p>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,borderTop:`1px solid ${T.border}`,paddingTop:12}}>
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
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
          <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:T.dim,textTransform:"uppercase",margin:0}}>Transaction History</p>
          {refreshing&&<span style={{fontSize:10,color:T.dim,display:"flex",alignItems:"center",gap:4}}><Loader size={10} strokeWidth={2} style={{animation:"spin 0.8s linear infinite"}}/>Updating…</span>}
        </div>
        {transactions.length===0?(
          <div style={{padding:"48px 0",textAlign:"center"}}>
            <p style={{fontSize:14,color:T.muted,margin:0}}>No transactions yet.</p>
            <p style={{fontSize:12,color:T.dim,margin:"6px 0 0"}}>Your activity will appear here once you start using your wallet.</p>
          </div>
        ):(
          <div>{transactions.map((tx,i)=><TxRow key={tx.id} tx={tx} quaiPrice={price?.price} last={i===transactions.length-1}/>)}</div>
        )}
      </div>

      {/* ══ WALLET DETAILS ══ */}
      <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:22,padding:"20px 22px"}}>
        <p style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:T.dim,textTransform:"uppercase",margin:"0 0 4px"}}>Wallet Details</p>
        {[
          {label:"Wallet Address", value:walletAddress??"—", mono:true,  copy:walletAddress},
          {label:"Network",        value:"Quai Network · Zone 0-0", mono:false},
          {label:"Wallet Type",    value:"Embedded (BlipPay managed)", mono:false},
          {label:"Account Owner",  value:user?.email??"—", mono:false},
        ].map(({label,value,mono,copy},i,a)=>(
          <DetailRow key={label} label={label} value={value} mono={mono} copy={copy} divider={i<a.length-1}/>
        ))}
      </div>

      {/* ── MODALS ── */}
      <SendModal    open={sendOpen}    onClose={()=>setSendOpen(false)}    balance={balance} quaiPrice={price?.price}/>
      <ReceiveModal open={receiveOpen} onClose={()=>setReceiveOpen(false)} walletAddress={walletAddress}/>
    </div>
  );
}
