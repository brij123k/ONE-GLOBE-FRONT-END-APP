import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2, Mail, User, Globe, DollarSign, MapPin,
  LayoutDashboard, Package, Tags, Layers, Award, TrendingUp,
  AlertCircle, CheckCircle, XCircle, ExternalLink, RefreshCw,
  Store, Sparkles, Target, FileText, Search, Zap, Hash,
  Gauge, Zap as ZapIcon
} from "lucide-react";
import { getApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

interface StoreData {
  id: string;
  shopName: string;
  shopDomain: string;
  websiteUrl: string;
  country: string;
  currency: string;
  plan: string;
  owner?: string;
  email?: string;
}

interface StoreContext {
  websiteUrl: string;
  brandName: string;
  businessType: string;
  targetMarket: string;
  mainProducts: string[];
  productsCount: number;
  collectionsCount: number;
  vendorsCount: number;
  productTypes: string[];
  tags: string[];
  categories: { id: string; title: string; handle: string; productsCount: number }[];
  sampleProducts: { title: string; handle: string; vendor: string; productType: string; status: string }[];
  collections: { id: string; title: string; handle: string; productsCount: number }[];
  vendors: string[];
}

interface Competitor {
  name: string;
  url: string;
  whyRelevant: string;
}

interface CompetitorResearch {
  brandName: string;
  websiteUrl: string;
  businessType: string;
  targetMarket: string;
  mainProducts: string[];
  competitors: Competitor[];
}

interface SeoAuditData {
  overallSeoScore: number;
  TechnicalSEO?: number;
  "On-PageSEO"?: number;
  HomepageSEO?: number;
  ProductPageSEO?: number;
  CollectionSEO?: number;
  ConversionSEO?: number;
  quickWins: string[];
  actionPlan30_60_90: {
    day30: string[];
    day60: string[];
    day90: string[];
  };
  competitorGapAnalysis: string[];
  keywordOpportunities: string[];
  contentCalendarSuggestions: string[];
  seoAudit: {
    technicalSeoAudit: { strengths: string[]; weaknesses: string[]; criticalIssues: string[]; actionableFixes: string[]; priorityLevel: string };
    onPageSeoAudit: { strengths: string[]; weaknesses: string[]; criticalIssues: string[]; actionableFixes: string[]; priorityLevel: string };
    homepageSeoAnalysis: { strengths: string[]; weaknesses: string[]; criticalIssues: string[]; actionableFixes: string[]; priorityLevel: string };
    collectionCategoryPageAudit: { strengths: string[]; weaknesses: string[]; criticalIssues: string[]; actionableFixes: string[]; priorityLevel: string };
    productPageAudit: { strengths: string[]; weaknesses: string[]; criticalIssues: string[]; actionableFixes: string[]; priorityLevel: string };
    conversionSeoAudit: { strengths: string[]; weaknesses: string[]; criticalIssues: string[]; actionableFixes: string[]; priorityLevel: string };
  };
}

interface ApiResponse {
  shop: StoreData;
  storeContext: StoreContext;
  competitorResearch: CompetitorResearch;
  seoAudit: SeoAuditData;
}

// ─── 3D Button Component ─────────────────────────────────────────────────────

function CircleButton3D ({ onClick, variant = "primary", className = "", icon, text }: { 
  onClick?: () => void; 
  variant?: "primary" | "secondary" | "danger" | "neumorph";
  className?: string;
  icon?: React.ReactNode;
  text?: string;
}) {
  const variants = {
    primary: {
      background: "hsl(186deg 100% 32%)",
      front: "hsl(186deg 100% 47%)"
    },
    secondary: {
      background: "hsl(271deg 100% 32%)",
      front: "hsl(271deg 100% 47%)"
    },
    danger: {
      background: "hsl(0deg 100% 32%)",
      front: "hsl(0deg 100% 47%)"
    },
    neumorph: {
      background: "#0a1a2a",
      front: "#0f212f"
    }
  };

  const textColors = {
    primary: "text-white",
    secondary: "text-white",
    danger: "text-white",
    neumorph: "text-cyan-400"
  };

  const currentVariant = variants[variant];

  return (
    <button
      onClick={onClick}
      className={`pushable touch-manipulation outline-none cursor-pointer inline-flex items-center justify-center ${className}`}
      style={{ background: currentVariant.background }}
    >
      <span 
        className={`front inline-flex w-full items-center justify-center gap-3 text-center ${textColors[variant]}`}
        style={{ 
          background: variant === "neumorph" 
            ? "linear-gradient(135deg, #0f212f, #0a1a2a)" 
            : currentVariant.front,
          transform: "translateY(-6px)",
          transition: "transform 150ms ease-in-out"
        }}
      >
        {icon && (
          <span className="inline-flex">
            {icon}
          </span>
        )}
        {text && (
          <span className="font-bold">
            {text}
          </span>
        )}
      </span>

      <style>{`
        .pushable {
          border-radius: 12px;
          border: none;
          padding: 0;
          outline-offset: 4px;
        }
        .front {
          display: flex;
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 1rem;
          color: white;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .pushable:active .front {
          transform: translateY(-2px) !important;
        }
      `}</style>
    </button>
  );
}
// ─── 3D Card Component ──────────────────────────────────────────────────────

function Card3D({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative 
      bg-gradient-to-br from-[#0a0f18] to-[#050a12] 
      rounded-xl
    shadow-[-3px_-3px_2px_rgba(255,255,255,0.3),5px_5px_5px_rgba(0,0,0,0.2),15px_15px_15px_rgba(0,0,0,0.1)] 
    transition-all duration-300 ${className}`}>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/5 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}

// ─── 3D Circle Card Component ────────────────────────────────────────────────

function CircleCard3D({ icon: Icon, label, value, color, onClick }: { 
  icon: any; 
  label: string; 
  value: number | string; 
  color: string;
  onClick?: () => void;
}) {
  const colorClasses = {
    blue: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400 shadow-cyan-500/20",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400 shadow-purple-500/20",
    green: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/20",
    orange: "from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400 shadow-orange-500/20",
  };

  return (
    <div 
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm shadow-[0_8px_20px_-4px_rgba(0,0,0,0.4),0_0_15px_${color === 'blue' ? 'rgba(0,180,255,0.1)' : color === 'purple' ? 'rgba(168,85,247,0.1)' : color === 'green' ? 'rgba(16,185,129,0.1)' : 'rgba(249,115,22,0.1)'}]
       transition-all duration-300 hover:-translate-y-2  cursor-pointer group`}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-900 to-gray-950 flex items-center justify-center border border-current shadow-inner">
          <Icon className="w-7 h-7" />
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="text-2xl font-extrabold text-white tracking-tight">{value}</div>
        <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ─── Electric Gauge Component ─────────────────────────────────────────────────

function ElectricGauge({ score, size = 280 }: { score: number; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const currentScoreRef = useRef(0);
  
  const MAX_SCORE = 100;
  const SA = Math.PI * 0.68;
  const EA = Math.PI * 2.32;
  const TA = EA - SA;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = size, H = size;
    const CX = W / 2, CY = H / 2 + (size === 280 ? 14 : 8);
    const AR = size === 280 ? 118 : 88;
    const AW = size === 280 ? 14 : 10;
    const TO = size === 280 ? 112 : 82;
    const TIM = size === 280 ? 96 : 72;
    const NR = size === 280 ? 84 : 62;

    canvas.width = W;
    canvas.height = H;

    function segCol(f: number) {
      const r = f * MAX_SCORE;
      if (r >= 85) return { b: '#ff0033', t: '#ff4455', g: 'rgba(255,0,40,0.75)', bl: 'rgba(255,0,30,0.2)' };
      if (r >= 70) return { b: '#dd0066', t: '#ff00aa', g: 'rgba(210,0,90,0.6)', bl: 'rgba(200,0,70,0.14)' };
      const tVal = Math.min(r / 60, 1);
      const bl = Math.round(160 + 95 * tVal);
      const gr = Math.round(60 + 140 * tVal);
      const re = Math.round(0 + 10 * tVal);
      return {
        b: `rgb(${re},${gr},${bl})`,
        t: `rgb(${re + 20},${Math.min(gr + 90, 255)},255)`,
        g: `rgba(${re},${gr},${bl},0.7)`,
        bl: `rgba(0,${gr - 10},${bl},0.16)`
      };
    }

    function draw(rpm: number) {
      ctx.clearRect(0, 0, W, H);
      const fr = Math.min(rpm / MAX_SCORE, 1);
      const SEGS = 360;

      for (let i = 4; i >= 1; i--) {
        ctx.beginPath();
        ctx.arc(CX, CY, AR + 18 + i * 4, SA, EA);
        ctx.strokeStyle = `rgba(0,0,0,${0.4 * i})`;
        ctx.lineWidth = 6;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(CX, CY, AR, SA, EA);
      ctx.strokeStyle = '#000d14';
      ctx.lineWidth = AW + 4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(CX, CY, AR, SA, EA);
      ctx.strokeStyle = '#010c12';
      ctx.lineWidth = AW;
      ctx.stroke();

      for (let i = 0; i < SEGS; i++) {
        const f = i / SEGS;
        if (f >= fr) {
          const a1 = SA + TA * f;
          const a2 = SA + TA * (f + 1 / SEGS) + 0.002;
          ctx.beginPath();
          ctx.arc(CX, CY, AR, a1, a2);
          ctx.strokeStyle = (i % 4 === 0) ? '#020f18' : '#010c16';
          ctx.lineWidth = AW;
          ctx.stroke();
        }
      }

      for (let i = 0; i < SEGS; i++) {
        const f = i / SEGS;
        if (f >= fr) break;
        const f2 = (i + 1) / SEGS;
        const a1 = SA + TA * f;
        const a2 = SA + TA * f2 + 0.002;
        const col = segCol(f);

        ctx.beginPath();
        ctx.arc(CX, CY, AR, a1, a2);
        ctx.strokeStyle = col.b;
        ctx.lineWidth = AW;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(CX, CY, AR - 2, a1, a2);
        ctx.strokeStyle = col.t;
        ctx.lineWidth = size === 280 ? 5 : 3;
        ctx.globalAlpha = 0.65;
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(CX, CY, AR + 8, a1, a2);
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = size === 280 ? 5 : 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(CX, CY, AR, a1, a2);
        ctx.strokeStyle = col.bl;
        ctx.lineWidth = size === 280 ? 38 : 22;
        ctx.globalAlpha = 0.9;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.beginPath();
      ctx.arc(CX, CY, AR + 11, SA, EA);
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.lineWidth = 4;
      ctx.stroke();

      for (let n = 0; n <= MAX_SCORE; n += 10) {
        const f = n / MAX_SCORE;
        const ang = SA + TA * f;
        const ca = Math.cos(ang);
        const sa2 = Math.sin(ang);
        const lit = f <= fr;
        const red = n >= 85;

        ctx.beginPath();
        ctx.moveTo(CX + (TIM - 1) * ca + 1, CY + (TIM - 1) * sa2 + 1);
        ctx.lineTo(CX + (TO + 1) * ca + 1, CY + (TO + 1) * sa2 + 1);
        ctx.strokeStyle = 'rgba(0,0,0,0.92)';
        ctx.lineWidth = size === 280 ? 5 : 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(CX + TIM * ca, CY + TIM * sa2);
        ctx.lineTo(CX + TO * ca, CY + TO * sa2);
        ctx.strokeStyle = red ? (lit ? '#ff2244' : '#3a0010') : (lit ? '#00d4ff' : '#041620');
        ctx.lineWidth = red ? (size === 280 ? 3.5 : 2.5) : (size === 280 ? 3 : 2);
        ctx.stroke();

        if (lit) {
          ctx.beginPath();
          ctx.moveTo(CX + TIM * ca, CY + TIM * sa2);
          ctx.lineTo(CX + TO * ca, CY + TO * sa2);
          ctx.strokeStyle = red ? 'rgba(255,0,40,0.35)' : 'rgba(0,212,255,0.35)';
          ctx.lineWidth = size === 280 ? 9 : 6;
          ctx.globalAlpha = 0.7;
          ctx.stroke();
          ctx.globalAlpha = 1;

          ctx.beginPath();
          ctx.moveTo(CX + (TIM + 3) * ca, CY + (TIM + 3) * sa2);
          ctx.lineTo(CX + (TO - 3) * ca, CY + (TO - 3) * sa2);
          ctx.strokeStyle = red ? 'rgba(255,120,140,0.5)' : 'rgba(140,245,255,0.55)';
          ctx.lineWidth = size === 280 ? 1.5 : 1;
          ctx.stroke();
        }

        if (n > 0) {
          const tx = CX + NR * ca;
          const ty = CY + NR * sa2;
          ctx.save();
          ctx.font = `bold ${size === 280 ? 16 : 12}px Orbitron,monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(0,0,0,0.96)';
          ctx.fillText(n.toString(), tx + 1, ty + 1.5);
          if (red) {
            ctx.fillStyle = lit ? '#ff2244' : '#3a0012';
            if (lit) {
              ctx.shadowColor = 'rgba(255,20,60,0.85)';
              ctx.shadowBlur = size === 280 ? 12 : 8;
            }
          } else if (lit) {
            ctx.fillStyle = '#00d4ff';
            ctx.shadowColor = 'rgba(0,212,255,0.85)';
            ctx.shadowBlur = size === 280 ? 12 : 8;
          } else {
            ctx.fillStyle = '#031520';
          }
          ctx.fillText(n.toString(), tx, ty);
          ctx.restore();
        }
      }

      const na = SA + TA * fr;
      const nLen = TO - 4;
      const tail = size === 280 ? 26 : 18;

      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(na);

      ctx.beginPath();
      ctx.moveTo(-tail, 0);
      ctx.lineTo(nLen, 0);
      ctx.strokeStyle = 'rgba(0,180,255,0.22)';
      ctx.lineWidth = size === 280 ? 18 : 12;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-tail, 0);
      ctx.lineTo(nLen, 0);
      ctx.strokeStyle = 'rgba(0,210,255,0.35)';
      ctx.lineWidth = size === 280 ? 9 : 6;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-tail + 2, 2);
      ctx.lineTo(nLen + 2, 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth = size === 280 ? 5 : 3;
      ctx.stroke();

      const ng = ctx.createLinearGradient(-tail, 0, nLen, 0);
      ng.addColorStop(0, 'rgba(255,255,255,0)');
      ng.addColorStop(0.1, 'rgba(120,220,255,0.8)');
      ng.addColorStop(0.45, 'rgba(255,255,255,1)');
      ng.addColorStop(0.88, 'rgba(180,240,255,0.95)');
      ng.addColorStop(1, 'rgba(0,200,255,0.3)');
      ctx.beginPath();
      ctx.moveTo(-tail, 0);
      ctx.lineTo(nLen, 0);
      ctx.strokeStyle = ng;
      ctx.lineWidth = size === 280 ? 4 : 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-tail + 12, -0.6);
      ctx.lineTo(nLen - 14, -0.6);
      ctx.strokeStyle = 'rgba(200,248,255,0.55)';
      ctx.lineWidth = size === 280 ? 1.2 : 0.8;
      ctx.stroke();

      ctx.restore();

      const bg = ctx.createRadialGradient(CX - 6, CY - 6, 0, CX, CY, size === 280 ? 26 : 18);
      bg.addColorStop(0, '#0a2032');
      bg.addColorStop(0.4, '#041018');
      bg.addColorStop(1, '#010608');
      ctx.beginPath();
      ctx.arc(CX, CY, size === 280 ? 26 : 18, 0, Math.PI * 2);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,180,255,0.22)';
      ctx.lineWidth = size === 280 ? 1.5 : 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(CX, CY, size === 280 ? 26 : 18, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,180,255,0.18)';
      ctx.lineWidth = size === 280 ? 7 : 5;
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;

      const jg = ctx.createRadialGradient(CX - 4, CY - 4, 0, CX, CY, size === 280 ? 13 : 9);
      jg.addColorStop(0, '#90eeff');
      jg.addColorStop(0.3, '#00d4ff');
      jg.addColorStop(0.7, '#0088cc');
      jg.addColorStop(1, '#003560');
      ctx.beginPath();
      ctx.arc(CX, CY, size === 280 ? 13 : 9, 0, Math.PI * 2);
      ctx.fillStyle = jg;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(CX - 4, CY - 4, size === 280 ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(210,252,255,0.6)';
      ctx.fill();
    }

    let startTime: number | null = null;
    const startScore = currentScoreRef.current;
    const targetScore = score;
    const duration = 1500;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentScore = startScore + (targetScore - startScore) * eased;
      currentScoreRef.current = currentScore;
      draw(currentScore);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    startTime = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score, size]);

  return (
    <div 
      className="relative rounded-full transition-all duration-200 cursor-pointer hover:scale-105"
      style={{ 
        width: size, 
        height: size,
        filter: 'drop-shadow(-3px -3px 2px rgba(255,255,255,0.3)) drop-shadow(5px 5px 5px rgba(0,0,0,0.2)) drop-shadow(15px 15px 15px rgba(0,0,0,0.2))'
      }}
    >
      <canvas ref={canvasRef} width={size} height={size} className="w-full h-full rounded-full" />
      <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 text-center">
        <div className="text-3xl font-bold text-cyan-400 font-['Orbitron'] tracking-wider">
          {Math.round(score)}
        </div>
        <div className="text-[8px] font-bold text-cyan-500/70 tracking-[3px] uppercase mt-0.5">
          SCORE
        </div>
      </div>
    </div>
  );
}

// ─── Mini Electric Gauge ─────────────────────────────────────────────────────

function MiniElectricGauge({ score, label }: { score: number; label: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const currentScoreRef = useRef(0);
  
  const MAX_SCORE = 100;
  const SA = Math.PI * 0.68;
  const EA = Math.PI * 2.32;
  const TA = EA - SA;
  const size = 120;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = size, H = size;
    const CX = W / 2, CY = H / 2 + 6;
    const AR = 42;
    const AW = 6;
    const TO = 40;
    const TIM = 34;

    canvas.width = W;
    canvas.height = H;

    function segCol(f: number) {
      const r = f * MAX_SCORE;
      if (r >= 85) return { b: '#ff0033', t: '#ff4455', g: 'rgba(255,0,40,0.75)', bl: 'rgba(255,0,30,0.2)' };
      if (r >= 70) return { b: '#dd0066', t: '#ff00aa', g: 'rgba(210,0,90,0.6)', bl: 'rgba(200,0,70,0.14)' };
      const tVal = Math.min(r / 60, 1);
      const bl = Math.round(160 + 95 * tVal);
      const gr = Math.round(60 + 140 * tVal);
      const re = Math.round(0 + 10 * tVal);
      return {
        b: `rgb(${re},${gr},${bl})`,
        t: `rgb(${re + 20},${Math.min(gr + 90, 255)},255)`,
        g: `rgba(${re},${gr},${bl},0.7)`,
        bl: `rgba(0,${gr - 10},${bl},0.16)`
      };
    }

    function draw(rpm: number) {
      ctx.clearRect(0, 0, W, H);
      const fr = Math.min(rpm / MAX_SCORE, 1);
      const SEGS = 180;

      for (let i = 2; i >= 1; i--) {
        ctx.beginPath();
        ctx.arc(CX, CY, AR + 8 + i * 2, SA, EA);
        ctx.strokeStyle = `rgba(0,0,0,${0.3 * i})`;
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(CX, CY, AR, SA, EA);
      ctx.strokeStyle = '#000d14';
      ctx.lineWidth = AW + 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(CX, CY, AR, SA, EA);
      ctx.strokeStyle = '#010c12';
      ctx.lineWidth = AW;
      ctx.stroke();

      for (let i = 0; i < SEGS; i++) {
        const f = i / SEGS;
        if (f >= fr) {
          const a1 = SA + TA * f;
          const a2 = SA + TA * (f + 1 / SEGS) + 0.002;
          ctx.beginPath();
          ctx.arc(CX, CY, AR, a1, a2);
          ctx.strokeStyle = (i % 4 === 0) ? '#020f18' : '#010c16';
          ctx.lineWidth = AW;
          ctx.stroke();
        }
      }

      for (let i = 0; i < SEGS; i++) {
        const f = i / SEGS;
        if (f >= fr) break;
        const f2 = (i + 1) / SEGS;
        const a1 = SA + TA * f;
        const a2 = SA + TA * f2 + 0.002;
        const col = segCol(f);

        ctx.beginPath();
        ctx.arc(CX, CY, AR, a1, a2);
        ctx.strokeStyle = col.b;
        ctx.lineWidth = AW;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(CX, CY, AR - 1, a1, a2);
        ctx.strokeStyle = col.t;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.65;
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(CX, CY, AR, a1, a2);
        ctx.strokeStyle = col.bl;
        ctx.lineWidth = 16;
        ctx.globalAlpha = 0.9;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      for (let n = 0; n <= MAX_SCORE; n += 20) {
        const f = n / MAX_SCORE;
        const ang = SA + TA * f;
        const ca = Math.cos(ang);
        const sa2 = Math.sin(ang);
        const lit = f <= fr;
        const red = n >= 85;

        ctx.beginPath();
        ctx.moveTo(CX + TIM * ca, CY + TIM * sa2);
        ctx.lineTo(CX + TO * ca, CY + TO * sa2);
        ctx.strokeStyle = red ? (lit ? '#ff2244' : '#3a0010') : (lit ? '#00d4ff' : '#041620');
        ctx.lineWidth = 2;
        ctx.stroke();

        if (lit) {
          ctx.beginPath();
          ctx.moveTo(CX + TIM * ca, CY + TIM * sa2);
          ctx.lineTo(CX + TO * ca, CY + TO * sa2);
          ctx.strokeStyle = red ? 'rgba(255,0,40,0.35)' : 'rgba(0,212,255,0.35)';
          ctx.lineWidth = 5;
          ctx.globalAlpha = 0.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      const na = SA + TA * fr;
      const nLen = TO - 2;
      const tail = 12;

      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(na);

      ctx.beginPath();
      ctx.moveTo(-tail, 0);
      ctx.lineTo(nLen, 0);
      ctx.strokeStyle = 'rgba(0,180,255,0.25)';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-tail + 1, 1);
      ctx.lineTo(nLen + 1, 1);
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const ng = ctx.createLinearGradient(-tail, 0, nLen, 0);
      ng.addColorStop(0, 'rgba(255,255,255,0)');
      ng.addColorStop(0.3, 'rgba(120,220,255,0.9)');
      ng.addColorStop(0.7, 'rgba(255,255,255,1)');
      ng.addColorStop(1, 'rgba(0,200,255,0.4)');
      ctx.beginPath();
      ctx.moveTo(-tail, 0);
      ctx.lineTo(nLen, 0);
      ctx.strokeStyle = ng;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.restore();

      ctx.beginPath();
      ctx.arc(CX, CY, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#0a2032';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,180,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(CX - 2, CY - 2, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#00d4ff';
      ctx.fill();
    }

    let startTime: number | null = null;
    const startScore = currentScoreRef.current;
    const targetScore = score;
    const duration = 1000;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentScore = startScore + (targetScore - startScore) * eased;
      currentScoreRef.current = currentScore;
      draw(currentScore);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    startTime = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 70) return "text-emerald-400";
    if (s >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="relative flex flex-col items-center group cursor-pointer">
      <div 
        className="relative rounded-full transition-all duration-300 group-hover:scale-105"
        style={{
          filter: 'drop-shadow(-3px -3px 2px rgba(255,255,255,0.15)) drop-shadow(5px 5px 5px rgba(0,0,0,0.25)) drop-shadow(10px 10px 12px rgba(0,0,0,0.2))'
        }}
      >
        <canvas ref={canvasRef} width={size} height={size} className="w-full h-full rounded-full" />
        <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 text-center">
          <div className={`text-lg font-bold ${getScoreColor(score)} font-['Orbitron'] transition-all duration-300 group-hover:scale-110`}>
            {Math.round(score)}
          </div>
        </div>
      </div>
      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mt-3 text-center transition-all duration-300 group-hover:text-cyan-400">
        {label}
      </p>
      <div className="w-full mt-2">
        <div className="h-0.5 w-full bg-gray-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${
              currentScoreRef.current >= 70 ? "bg-emerald-500" : 
              currentScoreRef.current >= 50 ? "bg-yellow-500" : "bg-red-500"
            } group-hover:shadow-[0_0_5px_currentColor]`}
            style={{ width: `${currentScoreRef.current}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, link }: { icon: any; label: string; value: string; link?: string }) {
  return (
    <Card3D className="p-3 shadow-[inset_-2px_-2px_2px_rgba(255,255,255,0.3),inset_2px_2px_5px_rgba(0,0,0,0.3)] ">
      <div className="flex items-center gap-3">
        <div className={"w-8 h-8 bg-gradient-to-br from-[#060b12] to-[#030609] rounded-lg flex items-center justify-center border border-cyan-500/30 "}>
          <Icon className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className="text-[13px] font-semibold text-cyan-400 hover:underline flex items-center gap-1 truncate">
              {value} <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          ) : (
            <p className="text-[13px] font-semibold text-gray-200 truncate">{value}</p>
          )}
        </div>
      </div>
    </Card3D>
  );
}

function SectionHeader({ number, title, icon: Icon }: { number: number; title: string; icon: any }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-cyan-950/40 to-cyan-950/20 border-b border-cyan-500/20">
      <div className="w-5 h-5 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-md flex items-center justify-center flex-shrink-0 shadow-[0_2px_5px_rgba(0,180,255,0.3)]">
        <span className="text-[10px] font-extrabold text-black">{number}</span>
      </div>
      <Icon className="w-3.5 h-3.5 text-cyan-400" />
      <span className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-widest">{title}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Overview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSeoModal, setShowSeoModal] = useState(false);
  const [showCompetitorModal, setShowCompetitorModal] = useState(false);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const waitForAuthToken = async (timeoutMs = 10000) => {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const token = localStorage.getItem("auth_token");
      if (token) return token;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    return null;
  };

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await waitForAuthToken();
      if (!token) {
        setError("Authentication is still loading. Please try again in a moment.");
        return;
      }

      const shopStr = localStorage.getItem("shop");
      let shopName = "";

      const shop = shopStr ? JSON.parse(shopStr) : null;
      shopName = shop?.shopName || "";
      if (!shopName) {
        const urlShop = new URLSearchParams(window.location.search).get("shop");
        shopName = urlShop || "";
      }

      if (!shopName) {
        setError("No shop name found. Please log in again.");
        return;
      }

      const response = await getApi(`${ApiConfig.getShopStartup}?shopName=${encodeURIComponent(shopName)}`);
      setData(response);
    } catch (err: any) {
      console.error("Failed to fetch overview data:", err);
      setError(err.message || "Failed to load overview data");
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 70) return { label: "Excellent", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: <CheckCircle className="w-3.5 h-3.5" /> };
    if (score >= 50) return { label: "Average", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: <AlertCircle className="w-3.5 h-3.5" /> };
    return { label: "Critical", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: <XCircle className="w-3.5 h-3.5" /> };
  };

  const getSeoScore = (key: string) => {
    const seoAudit = data?.seoAudit;
    if (!seoAudit) return 0;
    const value = seoAudit[key as keyof SeoAuditData];
    return typeof value === "number" ? value : 0;
  };

  if (loading) {
    return (
      <AppLayout title="Overview">
        <div className="p-6 flex items-center justify-center min-h-[60vh] bg-gradient-to-br from-black via-[#03050a] to-[#050a12]">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping" />
              <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 border-r-cyan-400/60 animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-purple-500 border-l-purple-500/60 animate-[spin_2s_linear_infinite_reverse]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_20px_#00d4ff]" />
              </div>
            </div>
            <p className="text-cyan-400 font-mono text-sm tracking-wider animate-pulse">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout title="Overview">
        <div className="p-6 flex items-center justify-center min-h-[60vh] bg-gradient-to-br from-black via-[#03050a] to-[#050a12]">
          <div className="text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">{error}</p>
            <CircleButton3D  onClick={() => navigate("/")} variant="primary" text="Go to Dashboard"/>
              
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!data) return null;

  const { shop, storeContext, competitorResearch, seoAudit } = data;
  const scoreInfo = getScoreBadge(seoAudit.overallSeoScore);

  return (
    <AppLayout title="Overview">
      <div className="p-5 space-y-5 bg-gradient-to-br from-[#0a0f18] to-[#050a12]  min-h-screen">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1.5 px-4 py-2 border border-cyan-500/30 rounded-lg bg-gradient-to-br from-[#0a0f18] to-[#050a12] text-sm font-semibold text-gray-400 shadow-[0_4px_10px_-2px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_15px_-3px_rgba(0,180,255,0.15)] hover:border-cyan-400 hover:text-cyan-400 transition-all duration-200"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg> Back
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-bold text-cyan-400 uppercase tracking-widest">⚡ Store Intelligence</p>
            <h1 className="text-xl font-extrabold text-white leading-tight">Store Overview</h1>
            <p className="text-xs text-gray-400">Complete insights about your Shopify store</p>
          </div>
          <CircleButton3D 
  variant="neumorph" 
  onClick={fetchOverviewData}
  icon={<RefreshCw/>}
  text="Refresh"
/>
        </div>

        {/* ── SEO Audit Section with Electric Gauge ── */}
        <Card3D className="overflow-hidden">
          <SectionHeader number={1} title="SEO Performance Audit" icon={Gauge} />
          
          <div className="p-5">
            <div className="flex flex-col lg:flex-row items-center gap-6 mb-8">
              <div className="relative">
                <ElectricGauge score={seoAudit.overallSeoScore} size={300} />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center gap-3 justify-center lg:justify-start mb-3">
                  <Badge className={`${scoreInfo.color} border gap-1 px-3 py-1.5 text-[11px] font-bold shadow-md`}>
                    {scoreInfo.icon} {scoreInfo.label}
                  </Badge>
                  <span className="text-[11px] text-gray-400">out of 100</span>
                </div>
                <p className="text-[13px] text-gray-300 max-w-md mx-auto lg:mx-0">
                  {seoAudit.overallSeoScore >= 70 
                    ? "Your store has solid SEO foundations. Keep optimizing to stay ahead of competitors."
                    : seoAudit.overallSeoScore >= 50
                    ? "Your store needs moderate SEO improvements to rank better in search results."
                    : "Critical issues detected. Immediate action required to improve search visibility."}
                </p>
                <CircleButton3D
                  onClick={() => setShowSeoModal(true)} variant="primary" 
                  icon={<FileText/> } 
                  text="View Full SEO Report" 
                  className="mt-4"
                  />
                  
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {[
                { label: "Technical SEO", score: getSeoScore("TechnicalSEO"), key: "tech" },
                { label: "On-Page SEO", score: getSeoScore("On-PageSEO"), key: "onpage" },
                { label: "Product Pages", score: getSeoScore("ProductPageSEO"), key: "products" },
                { label: "Collections", score: getSeoScore("CollectionSEO"), key: "collections" },
                { label: "Homepage", score: getSeoScore("HomepageSEO"), key: "homepage" },
                { label: "Conversion", score: getSeoScore("ConversionSEO"), key: "conversion" },
              ].map(item => (
                <MiniElectricGauge 
                  key={item.key}
                  score={item.score || 0} 
                  label={item.label}
                />
              ))}
            </div>

            <div className="bg-gradient-to-r from-cyan-950/30 to-transparent border border-cyan-500/20 rounded-xl p-4
            shadow-[inset_-3px_-3px_2px_rgba(255,255,255,0.3),inset_5px_5px_5px_rgba(0,0,0,0.2),_15px_15px_15px_rgba(0,0,0,0.1)]
            hover:shadow-[-1px_-1px_1px_rgba(255,255,255,0.2),_2px_2px_3px_rgba(0,0,0,0.15),_8px_8px_10px_rgba(0,0,0,0.08)]"
           
  //  onMouseDown={(e) => {
  //   e.currentTarget.style.transform = 'translateY(2px)';
  //   e.currentTarget.style.boxShadow = '-1px -1px 1px rgba(255,255,255,0.2), 2px 2px 3px rgba(0,0,0,0.15), 8px 8px 10px rgba(0,0,0,0.08)';
  // }}
  // onMouseUp={(e) => {
  //   e.currentTarget.style.transform = 'translateY(0px)';
  //   e.currentTarget.style.boxShadow = '-3px -3px 2px rgba(255,255,255,0.3), 5px 5px 5px rgba(0,0,0,0.2), 15px 15px 15px rgba(0,0,0,0.1)';
  // }}
  // onMouseLeave={(e) => {
  //   e.currentTarget.style.transform = 'translateY(0px)';
  //   e.currentTarget.style.boxShadow = '-3px -3px 2px rgba(255,255,255,0.3), 5px 5px 5px rgba(0,0,0,0.2), 15px 15px 15px rgba(0,0,0,0.1)';
  // }}

  >
    
              <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <ZapIcon className="w-3.5 h-3.5" /> Quick Wins (Easy Fixes)
              </p>
              <div className="flex flex-wrap gap-2">
                {seoAudit.quickWins.map(win => (
                  <span key={win} className="text-[11px] px-2.5 py-1 bg-[#0a0f18] border border-cyan-500/20 rounded-full text-cyan-400
                   shadow-[-2px_-2px_2px_rgba(255,255,255,0.3),2px_2px_5px_rgba(0,0,0,0.3)]
                   hover:shadow-[-1px_-1px_1px_rgba(255,255,255,0.2),2px_2px_3px_rgba(0,0,0,0.15),8px_8px_10px_rgba(0,0,0,0.08)]
                   transition-all duration-200 cursor-pointer"
                  >
                    {win}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card3D>

        {/* ── Store Info Section ── */}
        <Card3D className="overflow-hidden">
          <SectionHeader number={2} title="Store Information" icon={Store} />
          
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              <InfoRow icon={Building2} label="Store Name" value={shop.shopName} />
              <InfoRow icon={User} label="Owner" value={shop.owner || "N/A"} />
              <InfoRow icon={Mail} label="Email" value={shop.email || "N/A"} />
              <InfoRow icon={Globe} label="Domain" value={shop.shopDomain} link={`https://${shop.shopDomain}`} />
              <InfoRow icon={MapPin} label="Country" value={shop.country} />
              <InfoRow icon={DollarSign} label="Currency" value={shop.currency} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <CircleCard3D icon={Package} label="Total Products" value={`${storeContext.productsCount}+`} color="blue" />
              <CircleCard3D icon={Layers} label="Collections" value={`${storeContext.collectionsCount}+`} color="purple" />
              <CircleCard3D icon={Tags} label="Vendors" value={`${storeContext.vendorsCount}+`} color="green" />
              <CircleCard3D icon={Award} label="Plan" value={shop.plan} color="orange" />
            </div>
          </div>
        </Card3D>

        {/* ── Store Context Section ── */}
        <Card3D className="overflow-hidden">
          <SectionHeader number={3} title="Store Context & Analytics" icon={LayoutDashboard} />
          
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card3D className="p-4 bg-gradient-to-br from-cyan-950/40 to-transparent">
                <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">Business Type</p>
                <p className="text-[15px] font-extrabold text-white">{storeContext.businessType}</p>
              </Card3D>
              <Card3D className="p-4 bg-gradient-to-br from-orange-950/40 to-transparent">
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Target Market</p>
                <p className="text-[15px] font-extrabold text-white">{storeContext.targetMarket}</p>
              </Card3D>
              <Card3D className="p-4 bg-gradient-to-br from-purple-950/40 to-transparent">
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Product Types</p>
                <p className="text-[13px] font-semibold text-gray-300">{storeContext.productTypes.slice(0, 4).join(", ")}</p>
                {storeContext.productTypes.length > 4 && (
                  <p className="text-[10px] text-gray-500 mt-1">+{storeContext.productTypes.length - 4} more</p>
                )}
              </Card3D>
            </div>

            <div>
              <p className="text-[11px] font-bold text-gray-400 mb-2 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" /> Popular Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {storeContext.tags.slice(0, 12).map(tag => (
                  <span key={tag} className="text-[10px] font-medium px-2 py-1 bg-[#0a0f18] rounded-full text-gray-400 border border-gray-800 shadow-sm">
                    {tag}
                  </span>
                ))}
                {storeContext.tags.length > 12 && (
                  <span className="text-[10px] font-medium px-2 py-1 bg-[#0a0f18] rounded-full text-gray-500">
                    +{storeContext.tags.length - 12}
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-[11px] font-bold text-gray-400 mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Featured Products
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {storeContext.mainProducts.slice(0, 4).map(product => (
                  <div key={product} className="flex items-center gap-2 p-2 bg-[#0a0f18] rounded-lg border border-gray-800 shadow-sm">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_5px_#00d4ff]" />
                    <span className="text-[12px] text-gray-300 truncate">{product}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card3D>

        {/* ── Competitor Research ── */}
        <Card3D className="overflow-hidden">
          <SectionHeader number={4} title="Competitor Research" icon={Target} />
          
          <div className="p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <p className="text-[13px] font-semibold text-gray-200">Top competitors in the <span className="text-cyan-400">{competitorResearch.businessType}</span> space</p>
                <p className="text-[11px] text-gray-500">Analyzing {competitorResearch.competitors.length} direct competitors</p>
              </div>
              <CircleButton3D  onClick={() => setShowCompetitorModal(true)} variant="secondary" text=" View Competitor Analysis" icon={<Search />} />
                
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {competitorResearch.competitors.map(comp => (
                <Card3D key={comp.name} className="p-3 hover:border-cyan-500/40 transition-all cursor-pointer">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[13px] font-extrabold text-white">{comp.name}</p>
                    <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-[10.5px] text-gray-400 leading-relaxed">{comp.whyRelevant}</p>
                </Card3D>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-[11px] font-bold text-gray-400 mb-2">Competitor Gap Analysis</p>
              <div className="flex flex-wrap gap-2">
                {seoAudit.competitorGapAnalysis.map(gap => (
                  <span key={gap} className="text-[11px] px-2.5 py-1 bg-orange-950/30 border border-orange-500/30 rounded-full text-orange-400 shadow-sm">
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card3D>

        {/* ── Action Plan ── */}
        <Card3D className="overflow-hidden">
          <SectionHeader number={5} title="30/60/90 Day Action Plan" icon={ZapIcon} />
          
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { days: "30 Days", items: seoAudit.actionPlan30_60_90?.day30 || [], color: "cyan", icon: "🚀" },
                { days: "60 Days", items: seoAudit.actionPlan30_60_90?.day60 || [], color: "purple", icon: "⚡" },
                { days: "90 Days", items: seoAudit.actionPlan30_60_90?.day90 || [], color: "emerald", icon: "🎯" },
              ].map(plan => (
                <Card3D key={plan.days} className={`p-4 border border-${plan.color}-500/20 bg-${plan.color}-950/20`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{plan.icon}</span>
                    <p className={`text-[12px] font-extrabold text-${plan.color}-400 uppercase tracking-wider`}>{plan.days}</p>
                  </div>
                  <ul className="space-y-2">
                    {plan.items.map((item, idx) => (
                      <li key={idx} className="text-[11.5px] text-gray-300 flex items-start gap-2">
                        <CheckCircle className={`w-3 h-3 text-${plan.color}-400 mt-0.5 flex-shrink-0`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card3D>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-[11px] font-bold text-gray-400 mb-2 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-cyan-400" /> Keyword Opportunities
              </p>
              <div className="flex flex-wrap gap-2">
                {seoAudit.keywordOpportunities.map(kw => (
                  <span key={kw} className="text-[11px] px-2.5 py-1 bg-cyan-950/30 border border-cyan-500/30 rounded-full text-cyan-400 shadow-sm">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card3D>

        {/* Modals remain the same... */}
        <Dialog open={showSeoModal} onOpenChange={setShowSeoModal}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-[#050a12] border-cyan-500/30 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5 text-cyan-400" /> Full SEO Audit Report
              </DialogTitle>
              <DialogDescription className="text-gray-400">Detailed analysis of your store's SEO performance</DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-[#0a0f18] rounded-xl border border-cyan-500/20">
                <div>
                  <p className="text-[12px] font-bold text-gray-400">Overall SEO Score</p>
                  <p className="text-3xl font-extrabold text-cyan-400">{seoAudit.overallSeoScore}/100</p>
                </div>
                <Badge className={`${scoreInfo.color} text-[13px] px-3 py-1.5 gap-1.5`}>
                  {scoreInfo.icon} {scoreInfo.label}
                </Badge>
              </div>
              <AuditSection title="Technical SEO" audit={seoAudit.seoAudit?.technicalSeoAudit} priority="High" icon={<Globe className="w-4 h-4" />} />
              <AuditSection title="On-Page SEO" audit={seoAudit.seoAudit?.onPageSeoAudit} priority="High" icon={<FileText className="w-4 h-4" />} />
              <AuditSection title="Homepage Analysis" audit={seoAudit.seoAudit?.homepageSeoAnalysis} priority="Medium" icon={<LayoutDashboard className="w-4 h-4" />} />
              <AuditSection title="Product Pages Audit" audit={seoAudit.seoAudit?.productPageAudit} priority="Medium" icon={<Package className="w-4 h-4" />} />
              <AuditSection title="Collection Pages Audit" audit={seoAudit.seoAudit?.collectionCategoryPageAudit} priority="Medium" icon={<Layers className="w-4 h-4" />} />
              <AuditSection title="Conversion SEO" audit={seoAudit.seoAudit?.conversionSeoAudit} priority="High" icon={<Target className="w-4 h-4" />} />
              <div className="p-4 bg-cyan-950/20 rounded-xl border border-cyan-500/20">
                <p className="text-[12px] font-extrabold text-cyan-400 mb-2">🎯 Keyword Opportunities</p>
                <div className="flex flex-wrap gap-2">
                  {seoAudit.keywordOpportunities.map(kw => (
                    <span key={kw} className="text-[11px] px-2.5 py-1 bg-[#0a0f18] rounded-full text-cyan-400 border border-cyan-500/20">{kw}</span>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-purple-950/20 rounded-xl border border-purple-500/20">
                <p className="text-[12px] font-extrabold text-purple-400 mb-2">📝 Content Calendar Suggestions</p>
                <ul className="space-y-1.5">
                  {seoAudit.contentCalendarSuggestions.map(suggestion => (
                    <li key={suggestion} className="text-[12px] text-gray-300 flex items-start gap-2">
                      <Sparkles className="w-3 h-3 text-purple-400 mt-0.5" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <DialogFooter>
              <button onClick={() => setShowSeoModal(false)} className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all">Close</button>
              <CircleButton3D  onClick={() => navigate("/seo-audit")} variant="primary" text="Go to Full SEO Tool"/>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showCompetitorModal} onOpenChange={setShowCompetitorModal}>
          <DialogContent className="max-w-2xl bg-[#050a12] border-cyan-500/30 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Target className="w-5 h-5 text-purple-400" /> Competitor Research
              </DialogTitle>
              <DialogDescription className="text-gray-400">Detailed competitor analysis for {competitorResearch.brandName}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-4 bg-[#0a0f18] rounded-xl border border-gray-800">
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Business Type</p>
                  <p className="text-[13px] font-semibold text-white">{competitorResearch.businessType}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Target Market</p>
                  <p className="text-[13px] font-semibold text-white">{competitorResearch.targetMarket}</p>
                </div>
              </div>
              <div>
                <p className="text-[12px] font-bold text-gray-300 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-cyan-400" /> Main Products
                </p>
                <div className="flex flex-wrap gap-2">
                  {competitorResearch.mainProducts.map(product => (
                    <span key={product} className="text-[11px] px-3 py-1.5 bg-purple-950/30 border border-purple-500/30 rounded-full text-purple-400">{product}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[12px] font-bold text-gray-300 mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" /> Direct Competitors
                </p>
                <div className="space-y-3">
                  {competitorResearch.competitors.map(comp => (
                    <Card3D key={comp.name} className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[14px] font-extrabold text-white">{comp.name}</p>
                        <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-[11px] flex items-center gap-1">Visit <ExternalLink className="w-3 h-3" /></a>
                      </div>
                      <p className="text-[11.5px] text-gray-400">{comp.whyRelevant}</p>
                    </Card3D>
                  ))}
                </div>
              </div>
              <div className="bg-orange-950/20 p-3 rounded-xl border border-orange-500/30">
                <p className="text-[11px] font-bold text-orange-400 mb-1 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Gap Analysis</p>
                <div className="flex flex-wrap gap-1.5">
                  {seoAudit.competitorGapAnalysis.map(gap => (
                    <span key={gap} className="text-[10px] px-2 py-0.5 bg-[#0a0f18] rounded-full text-orange-400 border border-orange-500/20">{gap}</span>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <button onClick={() => setShowCompetitorModal(false)} className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-all">Close</button>
              <CircleButton3D  variant="secondary" text="Start Competitor Analysis"/>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

// ─── Audit Section Component ──────────────────────────────────────────────────

function AuditSection({ title, audit, priority, icon }: { title: string; audit: any; priority: string; icon: React.ReactNode }) {
  if (!audit) return null;

  const getPriorityColor = (p: string) => {
    if (p === "High") return "bg-red-950/30 text-red-400 border-red-500/30";
    if (p === "Medium") return "bg-yellow-950/30 text-yellow-400 border-yellow-500/30";
    return "bg-green-950/30 text-green-400 border-green-500/30";
  };

  return (
    <Card3D className="overflow-hidden">
      <div className={`flex items-center justify-between px-4 py-2.5 ${getPriorityColor(priority)} border-b`}>
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-[12px] font-extrabold">{title}</p>
        </div>
        <Badge className={`${getPriorityColor(priority)} text-[9px] font-bold px-2 py-0.5`}>Priority: {priority}</Badge>
      </div>
      <div className="p-4 space-y-3">
        {audit.strengths?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1.5">✓ Strengths</p>
            <ul className="space-y-1">
              {audit.strengths.map((s: string, i: number) => (
                <li key={i} className="text-[11px] text-gray-300 flex items-start gap-1.5"><CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />{s}</li>
              ))}
            </ul>
          </div>
        )}
        {audit.weaknesses?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-orange-400 uppercase mb-1.5">⚠ Weaknesses</p>
            <ul className="space-y-1">
              {audit.weaknesses.map((w: string, i: number) => (
                <li key={i} className="text-[11px] text-gray-300 flex items-start gap-1.5"><AlertCircle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />{w}</li>
              ))}
            </ul>
          </div>
        )}
        {audit.criticalIssues?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-red-400 uppercase mb-1.5">❗ Critical Issues</p>
            <ul className="space-y-1">
              {audit.criticalIssues.map((c: string, i: number) => (
                <li key={i} className="text-[11px] text-gray-300 flex items-start gap-1.5"><XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />{c}</li>
              ))}
            </ul>
          </div>
        )}
        {audit.actionableFixes?.length > 0 && (
          <div className="bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-500/20">
            <p className="text-[10px] font-bold text-cyan-400 uppercase mb-1.5">🔧 Actionable Fixes</p>
            <ul className="space-y-1">
              {audit.actionableFixes.map((f: string, i: number) => (
                <li key={i} className="text-[11px] text-cyan-300 flex items-start gap-1.5"><ZapIcon className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />{f}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card3D>
  );
}
