import { useRef, useEffect } from "react";
import { FileText, Zap as ZapIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

function segColor(f: number) {
  const r = f * 100;
  if (r >= 85) return { base: "#ff0033", tip: "#ff4455", bloom: "rgba(255,0,30,0.18)" };
  if (r >= 70) return { base: "#dd0066", tip: "#ff00aa", bloom: "rgba(200,0,70,0.14)" };
  const t = Math.min(r / 60, 1);
  const bl = Math.round(155 + 100 * t);
  const gr = Math.round(55 + 145 * t);
  return {
    base: `rgb(8,${gr},${bl})`,
    tip: `rgb(30,${Math.min(gr + 90, 255)},255)`,
    bloom: `rgba(0,${gr - 10},${bl},0.15)`,
  };
}

function drawNeedle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  angle: number, len: number, tail: number, thick: number
) {
  const a = angle * DEG;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(a);
  ctx.beginPath(); ctx.moveTo(-tail, 0); ctx.lineTo(len, 0);
  ctx.strokeStyle = "rgba(0,180,255,0.18)"; ctx.lineWidth = thick * 4; ctx.lineCap = "round"; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-tail + 2, 2); ctx.lineTo(len + 2, 2);
  ctx.strokeStyle = "rgba(0,0,0,0.8)"; ctx.lineWidth = thick - 1; ctx.stroke();
  const g = ctx.createLinearGradient(-tail, 0, len, 0);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.12, "rgba(100,210,255,0.85)");
  g.addColorStop(0.5, "rgba(255,255,255,1)");
  g.addColorStop(0.9, "rgba(160,235,255,0.9)");
  g.addColorStop(1, "rgba(0,190,255,0.3)");
  ctx.beginPath(); ctx.moveTo(-tail, 0); ctx.lineTo(len, 0);
  ctx.strokeStyle = g; ctx.lineWidth = thick; ctx.stroke();
  ctx.restore();
}

function drawHub(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const og = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r * 1.4);
  og.addColorStop(0, "rgba(0,180,255,0.22)"); og.addColorStop(1, "rgba(0,0,0,0)");
  ctx.beginPath(); ctx.arc(cx, cy, r * 1.4, 0, TAU);
  ctx.fillStyle = og; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1;
  const bg = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, 0, cx, cy, r);
  bg.addColorStop(0, "#0a2032"); bg.addColorStop(0.5, "#041018"); bg.addColorStop(1, "#010608");
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fillStyle = bg; ctx.fill();
  ctx.strokeStyle = "rgba(0,180,255,0.25)"; ctx.lineWidth = 1.5; ctx.stroke();
  const jg = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 0, cx, cy, r * 0.8);
  jg.addColorStop(0, "#90eeff"); jg.addColorStop(0.35, "#00d4ff");
  jg.addColorStop(0.75, "#0088cc"); jg.addColorStop(1, "#003560");
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.55, 0, TAU); ctx.fillStyle = jg; ctx.fill();
  ctx.beginPath(); ctx.arc(cx - r * 0.2, cy - r * 0.2, r * 0.22, 0, TAU);
  ctx.fillStyle = "rgba(210,252,255,0.55)"; ctx.fill();
}

// ─── GENERIC SCALABLE GAUGE ───────────────────────────────────────────────────
// S = canvas size in px; all geometry derived from it
function GaugeCanvas({
  score,
  size,
  showLabel,
  labelText,
  isCenter,
}: {
  score: number;
  size: number;
  showLabel?: boolean;
  labelText?: string;
  isCenter?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const curRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const S = size;
    canvas.width = S;
    canvas.height = S;

    const CX = S / 2;
    const CY = S * 0.543;
    const AR = S * 0.4;
    const AW = S * 0.05;
    const TO = AR - AW * 0.3;
    const TIM = TO - AW * 0.85;
    const NR = TIM - AW * 1.1;
    const SA = 145, EA = 395, TA = EA - SA;
    const SEGS = isCenter ? 360 : 180;

    function draw(val: number) {
      ctx.clearRect(0, 0, S, S);
      const fr = Math.min(val / 100, 1);

      // outer glow rings
      for (let i = isCenter ? 4 : 3; i >= 1; i--) {
        ctx.beginPath(); ctx.arc(CX, CY, AR + (S * 0.065) + i * (S * 0.018), SA * DEG, EA * DEG);
        ctx.strokeStyle = `rgba(0,0,0,${0.45 * i})`; ctx.lineWidth = isCenter ? 7 : 4; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(CX, CY, AR, SA * DEG, EA * DEG);
      ctx.strokeStyle = "#010c16"; ctx.lineWidth = AW + (isCenter ? 4 : 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(CX, CY, AR, SA * DEG, EA * DEG);
      ctx.strokeStyle = "#020e1a"; ctx.lineWidth = AW; ctx.stroke();

      // inactive segs
      for (let i = 0; i < SEGS; i++) {
        const f = i / SEGS;
        if (f < fr) continue;
        const a1 = (SA + TA * f) * DEG, a2 = (SA + TA * (f + 1 / SEGS)) * DEG + 0.003;
        ctx.beginPath(); ctx.arc(CX, CY, AR, a1, a2);
        ctx.strokeStyle = i % 4 === 0 ? "#020f1a" : "#010c14"; ctx.lineWidth = AW; ctx.stroke();
      }
      // active segs
      for (let i = 0; i < SEGS; i++) {
        const f = i / SEGS;
        if (f >= fr) break;
        const a1 = (SA + TA * f) * DEG, a2 = (SA + TA * (i + 1) / SEGS) * DEG + 0.003;
        const col = segColor(f);
        ctx.beginPath(); ctx.arc(CX, CY, AR, a1, a2);
        ctx.strokeStyle = col.base; ctx.lineWidth = AW; ctx.stroke();
        ctx.beginPath(); ctx.arc(CX, CY, AR - AW * 0.15, a1, a2);
        ctx.strokeStyle = col.tip; ctx.lineWidth = AW * 0.33; ctx.globalAlpha = 0.65; ctx.stroke(); ctx.globalAlpha = 1;
        ctx.beginPath(); ctx.arc(CX, CY, AR, a1, a2);
        ctx.strokeStyle = col.bloom; ctx.lineWidth = AW * 2.8; ctx.globalAlpha = 0.88; ctx.stroke(); ctx.globalAlpha = 1;
      }

      ctx.beginPath(); ctx.arc(CX, CY, AR + AW * 0.8, SA * DEG, EA * DEG);
      ctx.strokeStyle = "rgba(0,0,0,0.8)"; ctx.lineWidth = isCenter ? 5 : 3; ctx.stroke();

      // tick marks
      for (let n = 0; n <= 100; n += 10) {
        const f = n / 100, ang = (SA + TA * f) * DEG;
        const ca = Math.cos(ang), sa2 = Math.sin(ang);
        const lit = f <= fr, red = n >= 85;
        if (isCenter) {
          ctx.beginPath();
          ctx.moveTo(CX + (TIM - 1) * ca + 1, CY + (TIM - 1) * sa2 + 1);
          ctx.lineTo(CX + (TO + 1) * ca + 1, CY + (TO + 1) * sa2 + 1);
          ctx.strokeStyle = "rgba(0,0,0,0.92)"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(CX + TIM * ca, CY + TIM * sa2); ctx.lineTo(CX + TO * ca, CY + TO * sa2);
        ctx.strokeStyle = red ? (lit ? "#ff2244" : "#3a0010") : (lit ? "#00d4ff" : "#041620");
        ctx.lineWidth = red ? (isCenter ? 4 : 2) : (isCenter ? 3 : 2); ctx.stroke();
        if (lit) {
          ctx.beginPath(); ctx.moveTo(CX + TIM * ca, CY + TIM * sa2); ctx.lineTo(CX + TO * ca, CY + TO * sa2);
          ctx.strokeStyle = red ? "rgba(255,0,40,0.35)" : "rgba(0,212,255,0.35)";
          ctx.lineWidth = isCenter ? 11 : 6; ctx.globalAlpha = 0.7; ctx.stroke(); ctx.globalAlpha = 1;
        }
        const showNum = isCenter ? n > 0 : (n > 0 && n % 20 === 0);
        if (showNum) {
          ctx.save();
          const fs = isCenter ? 13 : S * 0.055;
          ctx.font = `bold ${fs}px 'Orbitron',monospace`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          if (isCenter) {
            ctx.fillStyle = "rgba(0,0,0,0.96)";
            ctx.fillText(n.toString(), CX + NR * ca + 1, CY + NR * sa2 + 1.5);
          }
          if (red) { ctx.fillStyle = lit ? "#ff2244" : "#3a0012"; if (lit) { ctx.shadowColor = "rgba(255,20,60,0.85)"; ctx.shadowBlur = 14; } }
          else if (lit) { ctx.fillStyle = "#00d4ff"; ctx.shadowColor = "rgba(0,212,255,0.85)"; ctx.shadowBlur = 14; }
          else ctx.fillStyle = "#031520";
          ctx.fillText(n.toString(), CX + NR * ca, CY + NR * sa2);
          ctx.restore();
        }
      }

      // minor ticks
      const minorStep = isCenter ? 2 : 5;
      for (let n = minorStep; n <= 100; n += minorStep) {
        if (n % 10 === 0) continue;
        const f = n / 100, ang = (SA + TA * f) * DEG;
        const ca = Math.cos(ang), sa2 = Math.sin(ang);
        const inner = isCenter
          ? (n % 5 === 0 ? TO - 7 : TO - 4)
          : (TO - AW * 0.25);
        ctx.beginPath();
        ctx.moveTo(CX + inner * ca, CY + inner * sa2); ctx.lineTo(CX + TO * ca, CY + TO * sa2);
        ctx.strokeStyle = f <= fr ? "rgba(0,180,255,0.4)" : "#041620";
        ctx.lineWidth = isCenter ? (n % 5 === 0 ? 1.5 : 1) : 1; ctx.stroke();
      }

      const hubR = isCenter ? 26 : S * 0.092;
      const needleLen = TO - (isCenter ? 4 : 2);
      const needleTail = isCenter ? 26 : S * 0.05;
      const needleThick = isCenter ? 4.5 : S * 0.016;
      drawNeedle(ctx, CX, CY, SA + TA * fr, needleLen, needleTail, needleThick);
      drawHub(ctx, CX, CY, hubR);

      // center score text
      const scoreFontSize = isCenter ? 32 : S * 0.115;
      ctx.save();
      ctx.font = `bold ${scoreFontSize}px 'Orbitron',monospace`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const scoreY = isCenter ? CY + 44 : CY + S * 0.145;
      if (isCenter) {
        ctx.fillStyle = "rgba(0,212,255,0.15)";
        ctx.fillText(Math.round(val).toString(), CX + 1.5, scoreY + 1.5);
      }
      ctx.fillStyle = val >= 85 ? "#ff2244" : val >= 70 ? "#ff00aa" : "#00d4ff";
      ctx.shadowColor = val >= 85 ? "rgba(255,20,60,0.9)" : val >= 70 ? "rgba(210,0,100,0.9)" : "rgba(0,212,255,0.9)";
      ctx.shadowBlur = isCenter ? 20 : 14;
      ctx.fillText(Math.round(val).toString(), CX, scoreY);
      ctx.restore();

      if (isCenter) {
        ctx.save();
        ctx.font = "bold 8px 'Orbitron',monospace";
        ctx.fillStyle = "rgba(0,170,220,0.6)"; ctx.textAlign = "center";
        ctx.fillText("SEO SCORE", CX, CY + 58);
        ctx.restore();
      }
    }

    let t0: number | null = null;
    const from = curRef.current, to = score, dur = isCenter ? 1600 : 1400;
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min(1, (ts - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      curRef.current = from + (to - from) * e;
      draw(curRef.current);
      if (p < 1) animRef.current = requestAnimationFrame(tick);
    };
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [score, size, isCenter]);

  const ringScale = isCenter ? 1.09 : 1.11;
  const borderScale = isCenter ? 1.055 : 1.075;

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        filter: isCenter
          ? "drop-shadow(0 0 28px rgba(0,180,255,0.42)) drop-shadow(0 8px 24px rgba(0,0,0,0.85))"
          : "drop-shadow(0 0 12px rgba(0,160,220,0.3)) drop-shadow(0 3px 8px rgba(0,0,0,0.7))",
        flexShrink: 0,
      }}
    >
      <div className="absolute inset-0 rounded-full" style={{
        background: isCenter
          ? "conic-gradient(from 145deg,#0a1a2a 0%,#0d2540 8%,#0a3a5a 20%,#0d2540 32%,#0a1a2a 50%,#051018 100%)"
          : "conic-gradient(from 145deg,#08151f 0%,#0a2238 15%,#0d3050 28%,#0a2238 42%,#08151f 55%,#040c12 100%)",
        transform: `scale(${ringScale})`,
        borderRadius: "50%",
        boxShadow: isCenter
          ? "inset 0 2px 8px rgba(0,180,255,0.15),inset 0 -2px 8px rgba(0,0,0,0.6),0 0 40px rgba(0,150,220,0.2)"
          : "inset 0 1px 4px rgba(0,150,200,0.12),inset 0 -1px 4px rgba(0,0,0,0.5)",
      }} />
      <div className="absolute inset-0 rounded-full" style={{
        transform: `scale(${borderScale})`,
        borderRadius: "50%",
        border: isCenter ? "2px solid rgba(0,180,255,0.55)" : "1.5px solid rgba(0,180,255,0.4)",
        boxShadow: isCenter
          ? "0 0 22px rgba(0,180,255,0.45),inset 0 0 20px rgba(0,50,80,0.3)"
          : "0 0 10px rgba(0,180,255,0.25),inset 0 0 8px rgba(0,40,60,0.2)",
      }} />
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="relative z-10 rounded-full"
        style={{ width: size, height: size }}
      />
      {showLabel && labelText && (
        <p className="absolute -bottom-5 left-0 right-0 text-[7.5px] font-bold text-cyan-400/70 uppercase tracking-[1.5px] text-center font-mono leading-tight">
          {labelText}
        </p>
      )}
    </div>
  );
}

// ─── MINI BAR ─────────────────────────────────────────────────────────────────
function MiniBar({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? "#00d4ff" : score >= 50 ? "#f5a623" : "#ff2244";
  const glow = score >= 70 ? "rgba(0,212,255,0.6)" : score >= 50 ? "rgba(245,166,35,0.6)" : "rgba(255,34,68,0.6)";
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-[26px]">
      <span className="text-[7px] font-bold font-mono" style={{ color }}>{score}</span>
      <div className="w-6 h-1.5 bg-[#020e18] rounded-full overflow-hidden border border-[#031520]">
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${score}%`, background: color, boxShadow: `0 0 4px ${glow}` }} />
      </div>
      <span className="text-[6px] text-gray-600 font-mono uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ─── PERSPECTIVE CLUSTER PANEL ─────────────────────────────────────────────────
// Gauges: [outer-L] [mid-L] [inner-L] [CENTER] [inner-R] [mid-R] [outer-R]
// Sizes decrease symmetrically from center outward
function ClusterPanel({
  overallScore, technicalSEO, onPageSEO, homepageSEO,
  productPageSEO, collectionSEO, conversionSEO,
}: {
  overallScore: number; technicalSEO: number; onPageSEO: number;
  homepageSEO: number; productPageSEO: number; collectionSEO: number; conversionSEO: number;
}) {
  // 7 gauges — sizes: outer=100, mid=126, inner=152, center=280
  const gauges = [
    { score: technicalSEO,  label: "Technical SEO", bar: "Tech",  size: 100 },
    { score: onPageSEO,     label: "On-Page SEO",   bar: "On-Pg", size: 126 },
    { score: homepageSEO,   label: "Homepage SEO",  bar: "Home",  size: 152 },
    { score: overallScore,  label: "Overall SEO",   bar: "SEO",   size: 280, isCenter: true },
    { score: productPageSEO,label: "Product Pages", bar: "Prod",  size: 152 },
    { score: collectionSEO, label: "Collections",   bar: "Coll",  size: 126 },
    { score: conversionSEO, label: "Conversion",    bar: "Conv",  size: 100 },
  ];

  // label offset below each gauge (accounting for the label absolutely positioned)
  const labelOffset = 24;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 95% 75% at 50% 0%,#0d1f38 0%,#060d18 50%,#03080f 100%)",
        boxShadow: "inset 0 1px 0 rgba(0,180,255,0.1),0 20px 60px rgba(0,0,0,0.8)",
      }}
    >
      {/* Top glowing edge */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px]" style={{
        background: "linear-gradient(90deg,transparent 0%,rgba(0,180,255,0.25) 20%,rgba(0,220,255,0.6) 50%,rgba(0,180,255,0.25) 80%,transparent 100%)"
      }} />

      {/* Grid texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "repeating-linear-gradient(0deg,#00d4ff 0,#00d4ff 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,#00d4ff 0,#00d4ff 1px,transparent 1px,transparent 48px)",
        opacity: 0.022
      }} />

      {/* Warning indicator dots */}
      <div className="flex justify-center gap-4 pt-3 pb-1">
        {[
          { color: "#f5a623", label: "Technical",  blink: "1.4s" },
          { color: "#00d4ff", label: "SEO Cluster", blink: "" },
          { color: "#10b981", label: "On-Page",    blink: "2s" },
          { color: "#a855f7", label: "Pages",      blink: "1.7s" },
          { color: "#ef4444", label: "Audit",      blink: "1.2s" },
        ].map((dot) => (
          <div key={dot.label} className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{
              background: dot.color,
              boxShadow: `0 0 5px ${dot.color}`,
              animation: dot.blink ? `pulse ${dot.blink} ease-in-out infinite` : undefined,
            }} />
            <span className="text-[7px] font-bold uppercase tracking-widest font-mono text-gray-600">{dot.label}</span>
          </div>
        ))}
      </div>

      {/* ── PERSPECTIVE ROW ── */}
      <div
        className="flex items-end justify-center"
        style={{
          gap: "4px",
          paddingBottom: `${labelOffset + 16}px`,
          paddingTop: "12px",
          paddingLeft: "8px",
          paddingRight: "8px",
          overflowX: "auto",
          overflowY: "visible",
        }}
      >
        {gauges.map((g, idx) => (
          <div
            key={g.label}
            className="flex flex-col items-center flex-shrink-0"
            style={{ position: "relative" }}
          >
            {/* connector line between gauges (not after last) */}
            {idx < gauges.length - 1 && (
              <div style={{
                position: "absolute",
                right: -(4),
                top: "50%",
                width: 4,
                height: 1,
                background: "rgba(0,180,255,0.3)",
                zIndex: 0,
              }} />
            )}

            {/* Center bracket decoration */}
            {g.isCenter && (
              <div className="flex items-center mb-1.5" style={{ width: g.size * 0.46 }}>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(0,180,255,0.5))" }} />
                <div className="w-1.5 h-1.5 rounded-full mx-1 flex-shrink-0" style={{ background: "#00d4ff", boxShadow: "0 0 7px #00d4ff" }} />
                <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,rgba(0,180,255,0.5),transparent)" }} />
              </div>
            )}

            <GaugeCanvas
              score={g.score}
              size={g.size}
              isCenter={g.isCenter}
            />

            {/* label + mini bar below */}
            <div
              className="flex flex-col items-center gap-0.5 mt-1"
              style={{ position: "absolute", top: g.size + (g.isCenter ? 6 : 2), left: 0, right: 0 }}
            >
              <p
                className="font-bold text-cyan-400/70 uppercase tracking-[1.5px] text-center font-mono leading-tight px-1"
                style={{
                  fontSize: g.isCenter ? "7.5px" : `${Math.max(5.5, 5.5 + (g.size - 100) * 0.018)}px`,
                  maxWidth: g.size,
                }}
              >
                {g.label}
              </p>
              <MiniBar score={g.score} label={g.bar} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom trim */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px]" style={{
        background: "linear-gradient(90deg,transparent 0%,rgba(0,180,255,0.2) 20%,rgba(0,180,255,0.45) 50%,rgba(0,180,255,0.2) 80%,transparent 100%)"
      }} />
    </div>
  );
}

// ─── EXPORTED SECTION ─────────────────────────────────────────────────────────
interface DashboardClusterSectionProps {
  seoAudit: {
    overallSeoScore: number;
    TechnicalSEO?: number;
    "On-PageSEO"?: number;
    HomepageSEO?: number;
    ProductPageSEO?: number;
    CollectionSEO?: number;
    ConversionSEO?: number;
    quickWins: string[];
  };
  scoreInfo: { label: string; color: string; icon: React.ReactNode };
  onViewReport: () => void;
}

export function DashboardClusterSection({ seoAudit, scoreInfo, onViewReport }: DashboardClusterSectionProps) {
  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{
        background: "linear-gradient(135deg,#0a0f18 0%,#050a12 100%)",
        boxShadow: "-3px -3px 2px rgba(255,255,255,0.04),5px 5px 10px rgba(0,0,0,0.6),20px 20px 30px rgba(0,0,0,0.3)"
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-cyan-950/40 to-cyan-950/20 border-b border-cyan-500/20">
        <div className="w-5 h-5 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-md flex items-center justify-center flex-shrink-0 shadow-[0_2px_5px_rgba(0,180,255,0.3)]">
          <span className="text-[10px] font-extrabold text-black">1</span>
        </div>
        <span className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-widest">SEO Performance Audit</span>
        <div className="ml-auto">
          <Badge className={`${scoreInfo.color} border gap-1 px-2.5 py-1 text-[10px] font-bold`}>
            {scoreInfo.icon} {scoreInfo.label}
          </Badge>
        </div>
      </div>

      {/* ALL 7 GAUGES — perspective row */}
      <ClusterPanel
        overallScore={seoAudit.overallSeoScore}
        technicalSEO={seoAudit.TechnicalSEO ?? 0}
        onPageSEO={seoAudit["On-PageSEO"] ?? 0}
        homepageSEO={seoAudit.HomepageSEO ?? 0}
        productPageSEO={seoAudit.ProductPageSEO ?? 0}
        collectionSEO={seoAudit.CollectionSEO ?? 0}
        conversionSEO={seoAudit.ConversionSEO ?? 0}
      />

      {/* CTA + Quick Wins */}
      <div className="p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <p className="text-[13px] text-gray-300 max-w-md">
            {seoAudit.overallSeoScore >= 70
              ? "Solid SEO foundations. Keep optimizing to stay ahead of competitors."
              : seoAudit.overallSeoScore >= 50
              ? "Moderate improvements needed to rank better in search results."
              : "Critical issues detected. Immediate action required."}
          </p>
          <button
            onClick={onViewReport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all duration-150"
            style={{ background: "hsl(186deg 100% 32%)", boxShadow: "0 6px 0 hsl(186deg 100% 20%),0 8px 16px rgba(0,0,0,0.4)" }}
            onMouseDown={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 0 hsl(186deg 100% 20%),0 4px 8px rgba(0,0,0,0.4)"; }}
            onMouseUp={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 0 hsl(186deg 100% 20%),0 8px 16px rgba(0,0,0,0.4)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 0 hsl(186deg 100% 20%),0 8px 16px rgba(0,0,0,0.4)"; }}
          >
            <FileText className="w-4 h-4" /> View Full SEO Report
          </button>
        </div>

        <div
          className="bg-gradient-to-r from-cyan-950/30 to-transparent border border-cyan-500/20 rounded-xl p-4"
          style={{ boxShadow: "inset -3px -3px 2px rgba(255,255,255,0.04),inset 5px 5px 8px rgba(0,0,0,0.3)" }}
        >
          <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <ZapIcon className="w-3.5 h-3.5" /> Quick Wins (Easy Fixes)
          </p>
          <div className="flex flex-wrap gap-2">
            {seoAudit.quickWins.map(win => (
              <span key={win}
                className="text-[11px] px-2.5 py-1 bg-[#0a0f18] border border-cyan-500/20 rounded-full text-cyan-400 cursor-pointer transition-all duration-200 hover:border-cyan-400/50 hover:shadow-[0_0_8px_rgba(0,180,255,0.3)]"
                style={{ boxShadow: "-2px -2px 2px rgba(255,255,255,0.04),2px 2px 5px rgba(0,0,0,0.4)" }}
              >
                {win}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}