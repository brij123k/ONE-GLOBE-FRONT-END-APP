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
  Store, Sparkles, Target, FileText, Link2, Search, Zap, Hash,
  Gauge, Shield, Cpu, Zap as ZapIcon
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

// ─── Electric Gauge Component ─────────────────────────────────────────────────

function ElectricGauge({ score, size = 280 }: { score: number; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const currentScoreRef = useRef(0);
  
  const MAX_SCORE = 100;
  const SA = Math.PI * 0.68;   // start angle (bottom-left)
  const EA = Math.PI * 2.32;   // end angle (bottom-right)
  const TA = EA - SA;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = size, H = size;
    const CX = W / 2, CY = H / 2 + (size === 280 ? 14 : 8);
    const AR = size === 280 ? 118 : 88;   // arc radius
    const AW = size === 280 ? 14 : 10;    // arc width
    const TO = size === 280 ? 112 : 82;   // tick outer
    const TIM = size === 280 ? 96 : 72;   // tick inner major
    const TIm = size === 280 ? 104 : 78;  // tick inner minor
    const NR = size === 280 ? 84 : 62;    // number radius

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

      // Recess shadow rings
      for (let i = 4; i >= 1; i--) {
        ctx.beginPath();
        ctx.arc(CX, CY, AR + 18 + i * 4, SA, EA);
        ctx.strokeStyle = `rgba(0,0,0,${0.4 * i})`;
        ctx.lineWidth = 6;
        ctx.stroke();
      }

      // Unlit base
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

      // Unlit segments
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

      // Lit segments – 3-layer
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

      // Arc outer shadow
      ctx.beginPath();
      ctx.arc(CX, CY, AR + 11, SA, EA);
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Ticks + Numbers
      for (let n = 0; n <= MAX_SCORE; n += 10) {
        const f = n / MAX_SCORE;
        const ang = SA + TA * f;
        const ca = Math.cos(ang);
        const sa2 = Math.sin(ang);
        const lit = f <= fr;
        const red = n >= 85;

        // Tick shadow
        ctx.beginPath();
        ctx.moveTo(CX + (TIM - 1) * ca + 1, CY + (TIM - 1) * sa2 + 1);
        ctx.lineTo(CX + (TO + 1) * ca + 1, CY + (TO + 1) * sa2 + 1);
        ctx.strokeStyle = 'rgba(0,0,0,0.92)';
        ctx.lineWidth = size === 280 ? 5 : 3;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Tick body
        ctx.beginPath();
        ctx.moveTo(CX + TIM * ca, CY + TIM * sa2);
        ctx.lineTo(CX + TO * ca, CY + TO * sa2);
        ctx.strokeStyle = red ? (lit ? '#ff2244' : '#3a0010') : (lit ? '#00d4ff' : '#041620');
        ctx.lineWidth = red ? (size === 280 ? 3.5 : 2.5) : (size === 280 ? 3 : 2);
        ctx.stroke();

        // Tick glow
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

        // Number
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

      // Needle
      const na = SA + TA * fr;
      const nLen = TO - 4;
      const tail = size === 280 ? 26 : 18;

      ctx.save();
      ctx.translate(CX, CY);
      ctx.rotate(na);

      // Wide glow
      ctx.beginPath();
      ctx.moveTo(-tail, 0);
      ctx.lineTo(nLen, 0);
      ctx.strokeStyle = 'rgba(0,180,255,0.22)';
      ctx.lineWidth = size === 280 ? 18 : 12;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Mid glow
      ctx.beginPath();
      ctx.moveTo(-tail, 0);
      ctx.lineTo(nLen, 0);
      ctx.strokeStyle = 'rgba(0,210,255,0.35)';
      ctx.lineWidth = size === 280 ? 9 : 6;
      ctx.stroke();

      // Shadow
      ctx.beginPath();
      ctx.moveTo(-tail + 2, 2);
      ctx.lineTo(nLen + 2, 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.8)';
      ctx.lineWidth = size === 280 ? 5 : 3;
      ctx.stroke();

      // Body gradient
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

      // Top specular
      ctx.beginPath();
      ctx.moveTo(-tail + 12, -0.6);
      ctx.lineTo(nLen - 14, -0.6);
      ctx.strokeStyle = 'rgba(200,248,255,0.55)';
      ctx.lineWidth = size === 280 ? 1.2 : 0.8;
      ctx.stroke();

      ctx.restore();

      // Center Boss
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
    <div className="relative" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} width={size} height={size} className="w-full h-full" />
      <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 text-center">
        <div className="text-3xl font-bold text-cyan-400 font-['Orbitron'] tracking-wider">
          {Math.round(currentScoreRef.current)}
        </div>
        <div className="text-[8px] font-bold text-cyan-500/70 tracking-[3px] uppercase mt-0.5">
          SCORE
        </div>
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, link }: { icon: any; label: string; value: string; link?: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#0a0f18] rounded-lg border border-[#0a1a2a]">
      <div className="w-8 h-8 bg-[#060b12] rounded-lg flex items-center justify-center border border-[#0a1a2a]">
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
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-[#0a1628] border-cyan-500/30 text-cyan-400",
    purple: "bg-[#0a0a20] border-purple-500/30 text-purple-400",
    green: "bg-[#0a1a18] border-emerald-500/30 text-emerald-400",
    orange: "bg-[#1a0e08] border-orange-500/30 text-orange-400",
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${colorClasses[color]}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-[#060b12] border ${colorClasses[color]}`}>
        <Icon className={`w-5 h-5 ${colorClasses[color].split(" ")[2]}`} />
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-extrabold text-gray-100">{value}</p>
      </div>
    </div>
  );
}

function SectionHeader({ number, title, icon: Icon }: { number: number; title: string; icon: any }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-cyan-950/40 to-cyan-950/20 border-b border-cyan-500/20">
      <div className="w-5 h-5 bg-cyan-500 rounded-md flex items-center justify-center flex-shrink-0">
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
            <div className="w-16 h-16 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading your store overview...</p>
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
            <Button onClick={() => navigate("/")} className="bg-cyan-600 hover:bg-cyan-700">
              Go to Dashboard
            </Button>
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
      <div className="p-5 space-y-5 bg-gradient-to-br from-black via-[#03050a] to-[#050a12] min-h-screen">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-3.5 py-1.5 border border-cyan-500/30 rounded-lg bg-[#0a0f18] text-sm font-semibold text-gray-400 hover:border-cyan-400 hover:text-cyan-400 transition-all">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg> Back
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-bold text-cyan-400 uppercase tracking-widest">⚡ Store Intelligence</p>
            <h1 className="text-xl font-extrabold text-white leading-tight">Store Overview</h1>
            <p className="text-xs text-gray-400">Complete insights about your Shopify store</p>
          </div>
          <Button onClick={fetchOverviewData} variant="outline" className="gap-2 border-cyan-500/30 text-gray-300 hover:border-cyan-400 hover:text-cyan-400">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>

        {/* ── SEO Audit Section with Electric Gauge ── */}
        <div className="bg-[#050a12] border border-cyan-500/20 rounded-xl shadow-[0_0_30px_rgba(0,180,255,0.1)] overflow-hidden">
          <SectionHeader number={1} title="SEO Performance Audit" icon={Gauge} />
          
          <div className="p-5">
            {/* Score Overview with Gauge */}
            <div className="flex flex-col lg:flex-row items-center gap-6 mb-6">
              <div className="relative">
                <ElectricGauge score={seoAudit.overallSeoScore} size={280} />
              </div>
              <div className="flex-1 text-center lg:text-left">
                <div className="flex items-center gap-3 justify-center lg:justify-start mb-3">
                  <Badge className={`${scoreInfo.color} border gap-1 px-3 py-1.5 text-[11px] font-bold`}>
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
                <Button onClick={() => setShowSeoModal(true)} className="mt-4 bg-cyan-600 hover:bg-cyan-700 gap-2">
                  <FileText className="w-4 h-4" /> View Full SEO Report
                </Button>
              </div>
            </div>

            {/* Sub-scores Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
              {[
                { label: "Technical SEO", score: getSeoScore("TechnicalSEO") },
                { label: "On-Page SEO", score: getSeoScore("On-PageSEO") },
                { label: "Product Pages", score: getSeoScore("ProductPageSEO") },
                { label: "Collections", score: getSeoScore("CollectionSEO") },
                { label: "Homepage", score: getSeoScore("HomepageSEO") },
                { label: "Conversion", score: getSeoScore("ConversionSEO") },
              ].map(item => (
                <div key={item.label} className="text-center p-2 bg-[#0a0f18] rounded-lg border border-cyan-500/10">
                  <p className="text-[9px] font-bold text-gray-500 uppercase">{item.label}</p>
                  <p className={`text-lg font-extrabold ${
                    item.score >= 70 ? "text-emerald-400" : item.score >= 50 ? "text-yellow-400" : "text-red-400"
                  }`}>{item.score || 0}</p>
                  <Progress value={item.score || 0} className="h-1 mt-1 bg-gray-800" indicatorClassName={item.score >= 70 ? "bg-emerald-500" : item.score >= 50 ? "bg-yellow-500" : "bg-red-500"} />
                </div>
              ))}
            </div>

            {/* Quick Wins */}
            <div className="bg-gradient-to-r from-cyan-950/30 to-transparent border border-cyan-500/20 rounded-xl p-4">
              <p className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <ZapIcon className="w-3.5 h-3.5" /> Quick Wins (Easy Fixes)
              </p>
              <div className="flex flex-wrap gap-2">
                {seoAudit.quickWins.map(win => (
                  <span key={win} className="text-[11px] px-2.5 py-1 bg-[#0a0f18] border border-cyan-500/20 rounded-full text-cyan-400">
                    {win}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Store Info Section ── */}
        <div className="bg-[#050a12] border border-cyan-500/20 rounded-xl shadow-[0_0_30px_rgba(0,180,255,0.05)] overflow-hidden">
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon={Package} label="Total Products" value={storeContext.productsCount} color="blue" />
              <StatCard icon={Layers} label="Collections" value={storeContext.collectionsCount} color="purple" />
              <StatCard icon={Tags} label="Vendors" value={storeContext.vendorsCount} color="green" />
              <StatCard icon={Award} label="Plan" value={shop.plan} color="orange" />
            </div>
          </div>
        </div>

        {/* ── Store Context Section ── */}
        <div className="bg-[#050a12] border border-cyan-500/20 rounded-xl shadow-[0_0_30px_rgba(0,180,255,0.05)] overflow-hidden">
          <SectionHeader number={3} title="Store Context & Analytics" icon={LayoutDashboard} />
          
          <div className="p-5 space-y-5">
            {/* Business Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-cyan-950/40 to-transparent rounded-xl p-4 border border-cyan-500/20">
                <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-1">Business Type</p>
                <p className="text-[15px] font-extrabold text-white">{storeContext.businessType}</p>
              </div>
              <div className="bg-gradient-to-br from-orange-950/40 to-transparent rounded-xl p-4 border border-orange-500/20">
                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">Target Market</p>
                <p className="text-[15px] font-extrabold text-white">{storeContext.targetMarket}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-950/40 to-transparent rounded-xl p-4 border border-purple-500/20">
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Product Types</p>
                <p className="text-[13px] font-semibold text-gray-300">{storeContext.productTypes.slice(0, 4).join(", ")}</p>
                {storeContext.productTypes.length > 4 && (
                  <p className="text-[10px] text-gray-500 mt-1">+{storeContext.productTypes.length - 4} more</p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 mb-2 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5" /> Popular Tags
              </p>
              <div className="flex flex-wrap gap-1.5">
                {storeContext.tags.slice(0, 12).map(tag => (
                  <span key={tag} className="text-[10px] font-medium px-2 py-1 bg-[#0a0f18] rounded-full text-gray-400 border border-gray-800">
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

            {/* Main Products Preview */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Featured Products
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {storeContext.mainProducts.slice(0, 4).map(product => (
                  <div key={product} className="flex items-center gap-2 p-2 bg-[#0a0f18] rounded-lg border border-gray-800">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                    <span className="text-[12px] text-gray-300 truncate">{product}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Competitor Research ── */}
        <div className="bg-[#050a12] border border-cyan-500/20 rounded-xl shadow-[0_0_30px_rgba(0,180,255,0.05)] overflow-hidden">
          <SectionHeader number={4} title="Competitor Research" icon={Target} />
          
          <div className="p-5">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <p className="text-[13px] font-semibold text-gray-200">Top competitors in the <span className="text-cyan-400">{competitorResearch.businessType}</span> space</p>
                <p className="text-[11px] text-gray-500">Analyzing {competitorResearch.competitors.length} direct competitors</p>
              </div>
              <Button variant="outline" onClick={() => setShowCompetitorModal(true)} className="gap-2 border-cyan-500/30 text-gray-300 hover:border-cyan-400 hover:text-cyan-400">
                <Search className="w-3.5 h-3.5" /> View Competitor Analysis
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {competitorResearch.competitors.map(comp => (
                <div key={comp.name} className="p-3 rounded-xl border border-gray-800 hover:border-cyan-500/40 hover:bg-cyan-950/20 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[13px] font-extrabold text-white">{comp.name}</p>
                    <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:text-cyan-400">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-[10.5px] text-gray-400 leading-relaxed">{comp.whyRelevant}</p>
                </div>
              ))}
            </div>

            {/* Gap Analysis */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-[11px] font-bold text-gray-400 mb-2">Competitor Gap Analysis</p>
              <div className="flex flex-wrap gap-2">
                {seoAudit.competitorGapAnalysis.map(gap => (
                  <span key={gap} className="text-[11px] px-2.5 py-1 bg-orange-950/30 border border-orange-500/30 rounded-full text-orange-400">
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Action Plan ── */}
        <div className="bg-[#050a12] border border-cyan-500/20 rounded-xl shadow-[0_0_30px_rgba(0,180,255,0.05)] overflow-hidden">
          <SectionHeader number={5} title="30/60/90 Day Action Plan" icon={ZapIcon} />
          
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { days: "30 Days", items: seoAudit.actionPlan30_60_90?.day30 || [], color: "cyan", icon: "🚀" },
                { days: "60 Days", items: seoAudit.actionPlan30_60_90?.day60 || [], color: "purple", icon: "⚡" },
                { days: "90 Days", items: seoAudit.actionPlan30_60_90?.day90 || [], color: "emerald", icon: "🎯" },
              ].map(plan => (
                <div key={plan.days} className={`rounded-xl p-4 border border-${plan.color}-500/20 bg-${plan.color}-950/20`}>
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
                </div>
              ))}
            </div>

            {/* Keyword Opportunities */}
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-[11px] font-bold text-gray-400 mb-2 flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-cyan-400" /> Keyword Opportunities
              </p>
              <div className="flex flex-wrap gap-2">
                {seoAudit.keywordOpportunities.map(kw => (
                  <span key={kw} className="text-[11px] px-2.5 py-1 bg-cyan-950/30 border border-cyan-500/30 rounded-full text-cyan-400">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SEO Full Report Modal ── */}
        <Dialog open={showSeoModal} onOpenChange={setShowSeoModal}>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-[#050a12] border-cyan-500/30 text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5 text-cyan-400" /> Full SEO Audit Report
              </DialogTitle>
              <DialogDescription className="text-gray-400">Detailed analysis of your store's SEO performance</DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {/* Overall Score */}
              <div className="flex items-center justify-between p-4 bg-[#0a0f18] rounded-xl border border-cyan-500/20">
                <div>
                  <p className="text-[12px] font-bold text-gray-400">Overall SEO Score</p>
                  <p className="text-3xl font-extrabold text-cyan-400">{seoAudit.overallSeoScore}/100</p>
                </div>
                <Badge className={`${scoreInfo.color} text-[13px] px-3 py-1.5 gap-1.5`}>
                  {scoreInfo.icon} {scoreInfo.label}
                </Badge>
              </div>

              {/* Technical SEO */}
              <AuditSection 
                title="Technical SEO" 
                audit={seoAudit.seoAudit?.technicalSeoAudit} 
                priority="High"
                icon={<Globe className="w-4 h-4" />}
              />
              
              {/* On-Page SEO */}
              <AuditSection 
                title="On-Page SEO" 
                audit={seoAudit.seoAudit?.onPageSeoAudit} 
                priority="High"
                icon={<FileText className="w-4 h-4" />}
              />
              
              {/* Homepage */}
              <AuditSection 
                title="Homepage Analysis" 
                audit={seoAudit.seoAudit?.homepageSeoAnalysis} 
                priority="Medium"
                icon={<LayoutDashboard className="w-4 h-4" />}
              />
              
              {/* Product Pages */}
              <AuditSection 
                title="Product Pages Audit" 
                audit={seoAudit.seoAudit?.productPageAudit} 
                priority="Medium"
                icon={<Package className="w-4 h-4" />}
              />
              
              {/* Collections */}
              <AuditSection 
                title="Collection Pages Audit" 
                audit={seoAudit.seoAudit?.collectionCategoryPageAudit} 
                priority="Medium"
                icon={<Layers className="w-4 h-4" />}
              />
              
              {/* Conversion SEO */}
              <AuditSection 
                title="Conversion SEO" 
                audit={seoAudit.seoAudit?.conversionSeoAudit} 
                priority="High"
                icon={<Target className="w-4 h-4" />}
              />

              {/* Keyword Opportunities */}
              <div className="p-4 bg-cyan-950/20 rounded-xl border border-cyan-500/20">
                <p className="text-[12px] font-extrabold text-cyan-400 mb-2">🎯 Keyword Opportunities</p>
                <div className="flex flex-wrap gap-2">
                  {seoAudit.keywordOpportunities.map(kw => (
                    <span key={kw} className="text-[11px] px-2.5 py-1 bg-[#0a0f18] rounded-full text-cyan-400 border border-cyan-500/20">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Content Suggestions */}
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
              <Button variant="outline" onClick={() => setShowSeoModal(false)} className="border-gray-700 text-gray-300 hover:bg-gray-800">Close</Button>
              <Button onClick={() => navigate("/seo-audit")} className="bg-cyan-600 hover:bg-cyan-700">
                Go to Full SEO Tool
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Competitor Modal ── */}
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
                    <span key={product} className="text-[11px] px-3 py-1.5 bg-purple-950/30 border border-purple-500/30 rounded-full text-purple-400">
                      {product}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[12px] font-bold text-gray-300 mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400" /> Direct Competitors
                </p>
                <div className="space-y-3">
                  {competitorResearch.competitors.map(comp => (
                    <div key={comp.name} className="p-3 rounded-xl border border-gray-800 bg-[#0a0f18]">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[14px] font-extrabold text-white">{comp.name}</p>
                        <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 text-[11px] flex items-center gap-1">
                          Visit <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-[11.5px] text-gray-400">{comp.whyRelevant}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-orange-950/20 p-3 rounded-xl border border-orange-500/30">
                <p className="text-[11px] font-bold text-orange-400 mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Gap Analysis
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {seoAudit.competitorGapAnalysis.map(gap => (
                    <span key={gap} className="text-[10px] px-2 py-0.5 bg-[#0a0f18] rounded-full text-orange-400 border border-orange-500/20">
                      {gap}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCompetitorModal(false)} className="border-gray-700 text-gray-300 hover:bg-gray-800">Close</Button>
              <Button className="bg-purple-600 hover:bg-purple-700 gap-2">
                <TrendingUp className="w-4 h-4" /> Start Competitor Analysis
              </Button>
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
    <div className="border border-gray-800 rounded-xl overflow-hidden">
      <div className={`flex items-center justify-between px-4 py-2.5 ${getPriorityColor(priority)} border-b`}>
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-[12px] font-extrabold">{title}</p>
        </div>
        <Badge className={`${getPriorityColor(priority)} text-[9px] font-bold px-2 py-0.5`}>
          Priority: {priority}
        </Badge>
      </div>
      
      <div className="p-4 space-y-3 bg-[#0a0f18]">
        {audit.strengths?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-emerald-400 uppercase mb-1.5">✓ Strengths</p>
            <ul className="space-y-1">
              {audit.strengths.map((s: string, i: number) => (
                <li key={i} className="text-[11px] text-gray-300 flex items-start gap-1.5">
                  <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {audit.weaknesses?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-orange-400 uppercase mb-1.5">⚠ Weaknesses</p>
            <ul className="space-y-1">
              {audit.weaknesses.map((w: string, i: number) => (
                <li key={i} className="text-[11px] text-gray-300 flex items-start gap-1.5">
                  <AlertCircle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {audit.criticalIssues?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-red-400 uppercase mb-1.5">❗ Critical Issues</p>
            <ul className="space-y-1">
              {audit.criticalIssues.map((c: string, i: number) => (
                <li key={i} className="text-[11px] text-gray-300 flex items-start gap-1.5">
                  <XCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {audit.actionableFixes?.length > 0 && (
          <div className="bg-cyan-950/30 p-2.5 rounded-lg border border-cyan-500/20">
            <p className="text-[10px] font-bold text-cyan-400 uppercase mb-1.5">🔧 Actionable Fixes</p>
            <ul className="space-y-1">
              {audit.actionableFixes.map((f: string, i: number) => (
                <li key={i} className="text-[11px] text-cyan-300 flex items-start gap-1.5">
                  <ZapIcon className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}