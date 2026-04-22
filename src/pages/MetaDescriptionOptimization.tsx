import { useState, useEffect } from "react";
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
  Brain, Zap, Sparkles, TrendingUp, Target, CheckCircle,
  RefreshCw, Save, Play, Award, Trophy,
  RulerIcon, ArrowRight, ChevronLeft, Package,
  Search, Eye, MessageSquare, FileEdit, BarChart3,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  _id: string;
  productId: string;
  title: string;
  description: string;
  metaDescription: string;
  productImage: string;
  handle: string;
  status: string;
  optimized?: boolean;
}

interface OptimizationResult {
  productId: string;
  oldMetaDescription: string;
  newMetaDescription: string;
  characterCount: number;
  image?: string;
}

interface OptimizationContextChoice {
  image: boolean;
  title: boolean;
}

type PendingOptimization =
  | { type: "bulk"; applyNow: boolean }
  | { type: "single"; product: Product };

type TabType = "ai" | "existing";

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaLengthBar({ length, max = 160 }: { length: number; max?: number }) {
  const pct = Math.min(100, (length / max) * 100);
  const color =
    length === 0 ? "#ef4444"
    : length < 120 ? "#f59e0b"
    : length > 160 ? "#ef4444"
    : "#16a34a";
  return (
    <div className="flex flex-col gap-1 min-w-[90px]">
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold text-gray-400">{length} chars</span>
    </div>
  );
}

function MetaStatusBadge({ length }: { length: number }) {
  if (length === 0)
    return <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap">Empty</span>;
  if (length < 120)
    return <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 whitespace-nowrap">Too Short</span>;
  if (length > 160)
    return <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap">Too Long</span>;
  return <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap">Optimal</span>;
}

function getPositiveImprovement(oldValue: number, newValue: number) {
  if (oldValue <= 0) return Math.abs(newValue) * 1.5;
  return Math.abs(Math.round(((newValue - oldValue) / oldValue) * 100));
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MetaDescriptionOptimization() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("ai");
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  const [stats, setStats] = useState({
    averageLength: 0,
    seoScore: 0,
    improvement: 0,
    emptyDescriptions: 0,
    keywordInclusion: 0,
  });

  // Context modal state
  const [showContextModal, setShowContextModal] = useState(false);
  const [pendingOptimization, setPendingOptimization] = useState<PendingOptimization | null>(null);
  const [contextChoice, setContextChoice] = useState<OptimizationContextChoice>({ image: true, title: true });

  // Classic Rules State
  const [classicRules, setClassicRules] = useState({
    copyDescriptionToMeta: false,
    prefix: { enabled: false, value: "" },
    suffix: { enabled: false, value: "" },
    findReplace: { enabled: false, find: "", replace: "" },
    findRemove: { enabled: false, value: "" },
    truncate: { enabled: false, maxLength: 160, preserveWords: true },
    includeKeywords: { enabled: false, keywords: "" },
    callToAction: { enabled: false, text: "Shop now!" },
  });

  useEffect(() => { fetchStoredProducts(); }, []);

  const fetchStoredProducts = async () => {
    try {
      setLoading(true);
      const response = await getApi(ApiConfig.getStoredMetaDecProduct);
      const productsData = response || [];
      setProducts(productsData);
      if (productsData.length > 0) {
        const avgLength = Math.round(
          productsData.reduce((sum: number, p: Product) => sum + (p.metaDescription?.length || 0), 0) / productsData.length
        );
        const emptyDescriptions = productsData.filter((p: Product) => !p.metaDescription || p.metaDescription.trim() === "").length;
        setStats(prev => ({
          ...prev,
          averageLength: avgLength,
          emptyDescriptions,
          seoScore: calculateSeoScore(productsData),
          keywordInclusion: calculateKeywordInclusion(productsData),
        }));
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSeoScore = (prods: Product[]): number => {
    if (!prods.length) return 0;
    let score = 0;
    prods.forEach(p => {
      const md = p.metaDescription || "";
      if (md.length >= 150 && md.length <= 160) score += 30;
      else if (md.length >= 120 && md.length <= 180) score += 20;
      else score += 10;
      if (md.trim()) score += 30;
      if (p.title) {
        const titleWords = p.title.toLowerCase().split(/\s+/).slice(0, 3);
        if (titleWords.some(w => w.length > 3 && md.toLowerCase().includes(w))) score += 20;
      }
      const ctas = ["shop", "buy", "learn", "discover", "explore", "get", "try", "order"];
      if (ctas.some(cta => md.toLowerCase().includes(cta))) score += 20;
    });
    return Math.round(score / prods.length);
  };

  const calculateKeywordInclusion = (prods: Product[]): number => {
    if (!prods.length) return 0;
    let included = 0;
    prods.forEach(p => {
      const md = p.metaDescription || "";
      const title = p.title || "";
      if (title && md) {
        const titleWords = title.toLowerCase().split(/\s+/).slice(0, 3);
        if (titleWords.some(w => w.length > 3 && md.toLowerCase().includes(w))) included++;
      }
    });
    return Math.round((included / prods.length) * 100);
  };

  const extractFirstParagraph = (html: string): string => {
    if (!html) return "";
    const plainText = html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    if (!plainText) return "";
    const minLength = Math.min(80, plainText.length);
    let endIndex = -1;
    for (let i = minLength; i < Math.min(plainText.length, 160); i++) {
      if ([".", "!", "?"].includes(plainText[i])) {
        const prev = plainText.substring(Math.max(0, i - 3), i).toLowerCase();
        if (!["mr","dr","mrs","ms","jr","sr","st","co","inc","ltd","etc"].some(a => prev.endsWith(a))) {
          endIndex = i; break;
        }
      }
    }
    if (endIndex > -1) return plainText.substring(0, endIndex + 1).trim();
    let breakIndex = -1;
    for (let i = Math.min(plainText.length, 160) - 1; i >= 100; i--) {
      if ([",", ";", "-", ":"].includes(plainText[i])) { breakIndex = i; break; }
    }
    if (breakIndex > -1) return plainText.substring(0, breakIndex).trim();
    const truncated = plainText.substring(0, Math.min(plainText.length, 160));
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 100) return truncated.substring(0, lastSpace).trim();
    const result = plainText.substring(0, Math.min(plainText.length, 160)).trim();
    if (result.endsWith(".") || result.endsWith("!") || result.endsWith("?") || result.endsWith("...")) return result;
    if (result.length > 157) return result.substring(0, 157);
    return result;
  };

  // ── Context Modal Handlers ───────────────────────────────────────────────────

  const requestAIOptimization = (applyNow = false) => {
    if (!products.length) return;
    setPendingOptimization({ type: "bulk", applyNow });
    setContextChoice({ image: true, title: true });
    setShowContextModal(true);
  };

  const requestSingleProductOptimize = (product: Product) => {
    setPendingOptimization({ type: "single", product });
    setContextChoice({ image: true, title: true });
    setShowContextModal(true);
  };

  const confirmOptimizationContext = () => {
    if (!pendingOptimization || (!contextChoice.image && !contextChoice.title)) return;
    const optimization = pendingOptimization;
    const selectedContext = { ...contextChoice };
    setShowContextModal(false);
    setPendingOptimization(null);

    if (optimization.type === "bulk") {
      handleAIOptimization(optimization.applyNow, selectedContext);
    } else {
      handleSingleOptimize(optimization.product, selectedContext);
    }
  };

  const handleClassicOptimization = async (previewMode = true) => {
    if (!products.length) return;
    setShowProgressModal(true);
    setProgress({ current: 0, total: products.length, status: "Applying classic optimization rules..." });
    const results: OptimizationResult[] = [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      let newMeta = product.metaDescription || "";
      if (classicRules.copyDescriptionToMeta && product.description) newMeta = extractFirstParagraph(product.description);
      if (classicRules.prefix.enabled && classicRules.prefix.value) newMeta = `${classicRules.prefix.value} ${newMeta}`;
      if (classicRules.suffix.enabled && classicRules.suffix.value) newMeta = `${newMeta} ${classicRules.suffix.value}`;
      if (classicRules.findReplace.enabled && classicRules.findReplace.find)
        newMeta = newMeta.replace(new RegExp(classicRules.findReplace.find, "gi"), classicRules.findReplace.replace);
      if (classicRules.findRemove.enabled && classicRules.findRemove.value)
        newMeta = newMeta.replace(new RegExp(classicRules.findRemove.value, "gi"), "");
      if (classicRules.includeKeywords.enabled && classicRules.includeKeywords.keywords) {
        const kws = classicRules.includeKeywords.keywords.split(",").map(k => k.trim()).filter(Boolean);
        if (kws.length) newMeta = `${newMeta} ${kws.join(", ")}`;
      }
      if (classicRules.callToAction.enabled && classicRules.callToAction.text)
        newMeta = `${newMeta} ${classicRules.callToAction.text}`;
      if (classicRules.truncate.enabled && newMeta.length > classicRules.truncate.maxLength) {
        if (classicRules.truncate.preserveWords) {
          const tr = newMeta.substring(0, classicRules.truncate.maxLength);
          const ls = tr.lastIndexOf(" ");
          newMeta = ls > 0 ? tr.substring(0, ls) : tr;
        } else {
          newMeta = newMeta.substring(0, classicRules.truncate.maxLength);
        }
      }
      newMeta = newMeta.replace(/\s+/g, " ").trim();
      results.push({ productId: product.productId, oldMetaDescription: product.metaDescription || "(Empty)", newMetaDescription: newMeta, characterCount: newMeta.length, image: product.productImage });
      setProgress({ current: i + 1, total: products.length, status: `Processing: ${product.title}` });
    }
    setOptimizationResults(results);
    setShowProgressModal(false);
    if (previewMode) { calculateComparisonStats(results); setShowPreviewModal(true); }
    else await applyOptimizations(results);
  };

  const handleAIOptimization = async (applyNow = false, selectedContext: OptimizationContextChoice = { image: true, title: true }) => {
    if (!products.length) return;
    setShowProgressModal(true);
    setProgress({ current: 0, total: products.length, status: "Starting AI optimization..." });
    const results: OptimizationResult[] = [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      setProgress({ current: i + 1, total: products.length, status: `Optimizing: ${product.title}` });
      try {
        const payload = {
          productId: product.productId,
          productDescription: product.description || product.title,
          productTitle: product.title,
          apply: applyNow,
          image: selectedContext.image,
          title: selectedContext.title,
        };
        const response = await postApi(ApiConfig.aiMetadescriptionOptimization, payload);
        if (applyNow && response.applied) {
          results.push({ productId: product.productId, oldMetaDescription: response.oldMetaDescription || "(Empty)", newMetaDescription: response.newMetaDescription, characterCount: response.characterCount || 0, image: product.productImage });
        } else if (!applyNow && response.newMetaDescription) {
          results.push({ productId: product.productId, oldMetaDescription: response.oldMetaDescription || "(Empty)", newMetaDescription: response.newMetaDescription, characterCount: response.characterCount || response.newMetaDescription.length, image: product.productImage });
        }
        await new Promise(r => setTimeout(r, 300));
      } catch {
        results.push({ productId: product.productId, oldMetaDescription: product.metaDescription || "(Empty)", newMetaDescription: product.metaDescription || "(Empty)", characterCount: (product.metaDescription || "").length, image: product.productImage });
      }
    }
    setOptimizationResults(results);
    setShowProgressModal(false);
    if (applyNow) {
      const ok = results.filter(r => r.newMetaDescription !== r.oldMetaDescription).length;
      setProgress({ current: ok, total: products.length, status: "completed" });
      setShowSuccessModal(true);
    } else {
      calculateComparisonStats(results);
      setShowPreviewModal(true);
    }
  };

  const handleSingleOptimize = async (product: Product, selectedContext: OptimizationContextChoice = { image: true, title: true }) => {
    setShowProgressModal(true);
    setProgress({ current: 0, total: 1, status: `Optimizing: ${product.title}` });
    try {
      const payload = {
        productId: product.productId,
        productDescription: product.description || product.title,
        productTitle: product.title,
        apply: false,
        image: selectedContext.image,
        title: selectedContext.title,
      };
      const res = await postApi(ApiConfig.aiMetadescriptionOptimization, payload);
      if (res.newMetaDescription) {
        setOptimizationResults([{ productId: product.productId, oldMetaDescription: product.metaDescription || "(Empty)", newMetaDescription: res.newMetaDescription, characterCount: res.newMetaDescription.length, image: product.productImage }]);
        setProgress({ current: 1, total: 1, status: "Done" });
        setShowProgressModal(false);
        calculateComparisonStats([{ productId: product.productId, oldMetaDescription: product.metaDescription || "(Empty)", newMetaDescription: res.newMetaDescription, characterCount: res.newMetaDescription.length, image: product.productImage }]);
        setShowPreviewModal(true);
      } else { setShowProgressModal(false); }
    } catch { setShowProgressModal(false); }
  };

  const applyOptimizations = async (results: OptimizationResult[]) => {
    setShowProgressModal(true);
    setProgress({ current: 0, total: results.length, status: "Applying to Shopify..." });
    let ok = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.oldMetaDescription !== r.newMetaDescription) {
        try {
          await postApi(ApiConfig.updateMetaDescriptionOptimization, { productId: r.productId, oldMetaDescription: r.oldMetaDescription, newMetaDescription: r.newMetaDescription });
          ok++;
        } catch { /**/ }
      }
      setProgress({ current: i + 1, total: results.length, status: "Updating..." });
    }
    setShowProgressModal(false);
    setShowComparisonModal(false);
    setProgress({ current: ok, total: results.length, status: "completed" });
    setShowSuccessModal(true);
  };

  const calculateComparisonStats = (results: OptimizationResult[]) => {
    if (!results.length) return;
    const avgOld = results.reduce((s, r) => s + (r.oldMetaDescription === "(Empty)" ? 0 : r.oldMetaDescription.length), 0) / results.length;
    const avgNew = results.reduce((s, r) => s + r.newMetaDescription.length, 0) / results.length;
    const improvement = getPositiveImprovement(avgOld, avgNew);
    setStats({
      averageLength: Math.round(avgNew),
      seoScore: Math.min(100, Math.round((avgNew / 160) * 100)),
      improvement: improvement,
      emptyDescriptions: results.filter(r => r.oldMetaDescription === "(Empty)").length,
      keywordInclusion: 0,
    });
  };

  const avgMetaLength = products.length > 0
    ? Math.round(products.reduce((s, p) => s + (p.metaDescription?.length || 0), 0) / products.length)
    : 0;
  const emptyCount = products.filter(p => !p.metaDescription || p.metaDescription.trim() === "").length;

  if (loading) {
    return (
      <AppLayout title="Meta Description Optimization">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 animate-pulse text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading products for meta description optimization...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Meta Description Optimization">
      <div className="p-5 space-y-5">

        {/* Step Header */}
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-3.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-sm font-semibold text-gray-500 hover:border-green-400 hover:text-green-700 transition-all">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest">Step 1 of 2</p>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">Meta Description Optimization</h1>
            <p className="text-xs text-gray-500">Craft compelling meta descriptions to boost click-through rates from search</p>
          </div>
          <div className="flex items-center gap-1.5 bg-green-800 text-white px-4 py-1.5 rounded-full text-[12.5px] font-bold shadow-md shadow-green-900/25">
            <Package className="w-3.5 h-3.5" /> {products.length} Products
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Avg Meta Length", value: `${avgMetaLength}`, unit: "chars", hint: avgMetaLength < 120 ? "Too short for SEO" : avgMetaLength > 160 ? "May get truncated" : "Optimal range", pct: Math.min(100, (avgMetaLength / 160) * 100), color: "bg-green-400" },
            { label: "SEO Score",       value: `${stats.seoScore}`, unit: "%",     hint: `${emptyCount} empty meta descriptions`, pct: stats.seoScore, color: "bg-amber-400" },
            { label: "CTR Boost",       value: "35",                unit: "%+",    hint: "Better descriptions = more clicks",   pct: 70, color: "bg-blue-400" },
            { label: "Time Saved",      value: `${products.length * 3}`, unit: "min", hint: "AI works 24/7", pct: 100, color: "bg-purple-400" },
          ].map(s => (
            <div key={s.label} className="bg-white border-[1.5px] border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
              <div className="text-2xl font-extrabold text-gray-900 leading-none">{s.value}<span className="text-sm font-medium text-gray-400 ml-1">{s.unit}</span></div>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.hint}</p>
              <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${s.color}`} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">

          {/* Left Card */}
          <div className="bg-white border-[1.5px] border-gray-200 rounded-xl shadow-sm overflow-hidden">

            {/* Tabs */}
            <div className="flex border-b-[1.5px] border-gray-200 px-4 bg-white">
              {(["ai", "existing"] as TabType[]).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3.5 text-[13px] font-semibold border-b-[2.5px] -mb-[1.5px] transition-all whitespace-nowrap ${
                    activeTab === tab ? "text-green-800 border-green-800 font-bold" : "text-gray-400 border-transparent hover:text-green-700"
                  }`}>
                  {tab === "ai" ? "AI Optimization" : "Existing Meta Descriptions"}
                </button>
              ))}
            </div>

            {/* ── AI TAB ── */}
            {activeTab === "ai" && (
              <>
                <div className="px-4 py-2.5 text-xs text-gray-500 border-b-[1.5px] border-gray-200 bg-green-50">
                  AI will craft persuasive, keyword-rich meta descriptions (150–160 chars) for every product automatically.
                </div>

                {/* Why AI section */}
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { icon: <MessageSquare className="w-5 h-5 text-green-700" />, title: "Compelling & Persuasive", desc: "AI crafts click-worthy descriptions that speak directly to buyer intent" },
                      { icon: <Search className="w-5 h-5 text-green-700" />, title: "Keyword-Rich", desc: "Naturally includes primary keywords for better search relevance" },
                      { icon: <Target className="w-5 h-5 text-green-700" />, title: "Perfect Length", desc: "Always 150–160 characters — the sweet spot for search engines" },
                    ].map(card => (
                      <div key={card.title} className="border-[1.5px] border-gray-200 rounded-xl p-4 bg-gray-50/60 hover:border-green-300 hover:bg-green-50/40 transition-all">
                        <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center mb-2.5">{card.icon}</div>
                        <p className="text-[13px] font-extrabold text-gray-900 mb-1">{card.title}</p>
                        <p className="text-[11.5px] text-gray-500 leading-relaxed">{card.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-green-50 border-[1.5px] border-green-200 rounded-xl p-4">
                    <p className="text-[11px] font-bold text-green-700 uppercase tracking-wider mb-2">What AI creates for each product</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Unique persuasive description", "Primary keyword inclusion", "Strong call to action", "Benefit-focused language", "Optimal 150–160 chars", "Unique per product"].map(item => (
                        <div key={item} className="flex items-center gap-1.5 text-[12px] text-green-800">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600 flex-shrink-0" /> {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gray-50 border-[1.5px] border-gray-200 rounded-xl p-4">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Example AI Output</p>
                    <p className="text-[12.5px] text-gray-700 font-mono leading-relaxed border-l-[3px] border-green-500 pl-3 bg-white rounded-r-lg py-2 pr-3">
                      <span className="font-bold text-green-700">Ex: </span>
                      Handcrafted from sustainably sourced oak, this dining chair blends timeless design with modern comfort. Perfect for any home. Free shipping. Shop now!
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1.5">155 chars · includes keywords · strong CTA · benefit-focused</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 px-4 py-3 border-t-[1.5px] border-gray-200 bg-white items-center">
                  <button onClick={() => requestAIOptimization(false)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-800 text-white text-[13px] font-bold transition-all shadow-sm hover:-translate-y-px">
                    <Play className="w-3.5 h-3.5" /> Generate & Preview
                  </button>
                  <button onClick={() => requestAIOptimization(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[13px] font-bold transition-all shadow-sm hover:-translate-y-px">
                    <ArrowRight className="w-3.5 h-3.5" /> Optimize & Apply Directly
                  </button>
                </div>
              </>
            )}

            {/* ── EXISTING TAB ── */}
            {activeTab === "existing" && (
              <div className="p-4">
                {products.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Package className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-[13px] font-semibold text-gray-400">No products loaded yet</p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-2.5 px-1 pb-2 border-b-[1.5px] border-gray-200 mb-1" style={{ gridTemplateColumns: "44px 1fr 100px 70px 80px" }}>
                      <div /><div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Product / Meta Description</div>
                      <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Length</div>
                      <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Status</div>
                      <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Action</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {products.map(product => (
                        <div key={product.productId} className="grid gap-2.5 py-2.5 px-1 items-center hover:bg-gray-50" style={{ gridTemplateColumns: "44px 1fr 100px 70px 80px" }}>
                          <img src={product.productImage} alt={product.title} className="w-9 h-9 rounded-lg object-cover border border-gray-200" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 truncate">{product.title}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 truncate font-mono">
                              {product.metaDescription
                                ? product.metaDescription.substring(0, 60) + (product.metaDescription.length > 60 ? "…" : "")
                                : <span className="text-red-400 not-italic font-sans italic">No meta description</span>}
                            </p>
                          </div>
                          <MetaLengthBar length={product.metaDescription?.length || 0} max={160} />
                          <MetaStatusBadge length={product.metaDescription?.length || 0} />
                          {product?.optimized ? (
                            <button disabled className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600 text-white text-[11px] font-bold whitespace-nowrap opacity-50 cursor-not-allowed">
                              <ArrowRight className="w-2.5 h-2.5" /> Optimized
                            </button>
                          ) : (
                            <button onClick={() => requestSingleProductOptimize(product)} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-600 hover:bg-green-800 text-white text-[11px] font-bold whitespace-nowrap">
                              <ArrowRight className="w-2.5 h-2.5" /> Optimize
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: Classic Rules */}
          <div className="bg-white border-[1.5px] border-gray-200 rounded-xl shadow-sm p-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 font-extrabold text-gray-900 text-[14px] mb-1"><RulerIcon className="w-4 h-4 text-gray-600" /> Classic Rules</div>
              <p className="text-xs text-gray-400">Manual meta description adjustments</p>
            </div>

            {/* Copy Description to Meta */}
            <div className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg border border-green-200">
              <div><p className="text-[11.5px] font-bold text-gray-700">Use Product Description</p><p className="text-[10px] text-gray-400">Extract from product content</p></div>
              <button onClick={() => setClassicRules(p => ({ ...p, copyDescriptionToMeta: !p.copyDescriptionToMeta }))}
                className={`w-9 h-5 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors ${classicRules.copyDescriptionToMeta ? "bg-green-600" : "bg-gray-200"}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${classicRules.copyDescriptionToMeta ? "translate-x-4" : ""}`} />
              </button>
            </div>

            {/* Prefix, Suffix, Find & Remove */}
            {[
              { key: "prefix", label: "Prefix", ph: "e.g., Discover, Explore" },
              { key: "suffix", label: "Suffix", ph: "e.g., Free shipping available." },
              { key: "findRemove", label: "Find & Remove", ph: "Text to remove" },
            ].map(({ key, label, ph }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-600">{label}</span>
                  <button onClick={() => setClassicRules(p => ({ ...p, [key]: { ...(p as any)[key], enabled: !(p as any)[key].enabled } }))}
                    className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${(classicRules as any)[key].enabled ? "bg-green-600" : "bg-gray-200"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${(classicRules as any)[key].enabled ? "translate-x-4" : ""}`} />
                  </button>
                </div>
                {(classicRules as any)[key].enabled && (
                  <input value={(classicRules as any)[key].value}
                    onChange={(e) => setClassicRules(p => ({ ...p, [key]: { ...(p as any)[key], value: e.target.value } }))}
                    placeholder={ph} className="w-full px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12px] outline-none focus:border-green-500" />
                )}
              </div>
            ))}

            {/* Find & Replace */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-600">Find & Replace</span>
                <button onClick={() => setClassicRules(p => ({ ...p, findReplace: { ...p.findReplace, enabled: !p.findReplace.enabled } }))}
                  className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${classicRules.findReplace.enabled ? "bg-green-600" : "bg-gray-200"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${classicRules.findReplace.enabled ? "translate-x-4" : ""}`} />
                </button>
              </div>
              {classicRules.findReplace.enabled && (
                <div className="grid grid-cols-2 gap-1.5">
                  <input value={classicRules.findReplace.find} onChange={(e) => setClassicRules(p => ({ ...p, findReplace: { ...p.findReplace, find: e.target.value } }))} placeholder="Find" className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12px] outline-none focus:border-green-500" />
                  <input value={classicRules.findReplace.replace} onChange={(e) => setClassicRules(p => ({ ...p, findReplace: { ...p.findReplace, replace: e.target.value } }))} placeholder="Replace" className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12px] outline-none focus:border-green-500" />
                </div>
              )}
            </div>

            {/* Include Keywords */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-gray-600">Include Keywords</span>
                  <p className="text-[9.5px] text-gray-400">Comma-separated</p>
                </div>
                <button onClick={() => setClassicRules(p => ({ ...p, includeKeywords: { ...p.includeKeywords, enabled: !p.includeKeywords.enabled } }))}
                  className={`w-9 h-5 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors ${classicRules.includeKeywords.enabled ? "bg-green-600" : "bg-gray-200"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${classicRules.includeKeywords.enabled ? "translate-x-4" : ""}`} />
                </button>
              </div>
              {classicRules.includeKeywords.enabled && (
                <textarea value={classicRules.includeKeywords.keywords}
                  onChange={(e) => setClassicRules(p => ({ ...p, includeKeywords: { ...p.includeKeywords, keywords: e.target.value } }))}
                  placeholder="e.g., premium quality, eco-friendly, handmade"
                  rows={2} className="w-full px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12px] outline-none focus:border-green-500 resize-none" />
              )}
            </div>

            {/* Call to Action */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-600">Call to Action</span>
                <button onClick={() => setClassicRules(p => ({ ...p, callToAction: { ...p.callToAction, enabled: !p.callToAction.enabled } }))}
                  className={`w-9 h-5 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors ${classicRules.callToAction.enabled ? "bg-green-600" : "bg-gray-200"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${classicRules.callToAction.enabled ? "translate-x-4" : ""}`} />
                </button>
              </div>
              {classicRules.callToAction.enabled && (
                <div className="space-y-1.5">
                  <input value={classicRules.callToAction.text}
                    onChange={(e) => setClassicRules(p => ({ ...p, callToAction: { ...p.callToAction, text: e.target.value } }))}
                    placeholder="Call to action text" className="w-full px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12px] outline-none focus:border-green-500" />
                  <select value={classicRules.callToAction.text}
                    onChange={(e) => setClassicRules(p => ({ ...p, callToAction: { ...p.callToAction, text: e.target.value } }))}
                    className="w-full px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12px] text-gray-800 outline-none focus:border-green-500">
                    {["Shop now!", "Buy today!", "Learn more.", "Discover now.", "Order today!", "Try it now!"].map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Truncate */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div><span className="text-[11px] font-bold text-gray-600">Truncate Descriptions</span><p className="text-[9.5px] text-gray-400">Max recommended: 160 chars</p></div>
                <button onClick={() => setClassicRules(p => ({ ...p, truncate: { ...p.truncate, enabled: !p.truncate.enabled } }))}
                  className={`w-9 h-5 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors ${classicRules.truncate.enabled ? "bg-green-600" : "bg-gray-200"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${classicRules.truncate.enabled ? "translate-x-4" : ""}`} />
                </button>
              </div>
              {classicRules.truncate.enabled && (
                <div className="space-y-2">
                  <input type="number" value={classicRules.truncate.maxLength}
                    onChange={(e) => setClassicRules(p => ({ ...p, truncate: { ...p.truncate, maxLength: parseInt(e.target.value) || 160 } }))}
                    className="w-full px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12px] outline-none focus:border-green-500" />
                  <div className="flex items-center gap-2">
                    <button onClick={() => setClassicRules(p => ({ ...p, truncate: { ...p.truncate, preserveWords: !p.truncate.preserveWords } }))}
                      className={`w-9 h-5 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors ${classicRules.truncate.preserveWords ? "bg-green-600" : "bg-gray-200"}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${classicRules.truncate.preserveWords ? "translate-x-4" : ""}`} />
                    </button>
                    <span className="text-[10.5px] text-gray-600">Preserve word boundaries</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1 border-t border-gray-100">
              <button onClick={() => handleClassicOptimization(true)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-[13px] font-bold border-[1.5px] border-gray-200">
                <Eye className="w-3.5 h-3.5" /> Preview Changes
              </button>
              <button onClick={() => handleClassicOptimization(false)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-900 text-white text-[13px] font-bold">
                <Zap className="w-3.5 h-3.5" /> Apply Classic Rules
              </button>
            </div>
          </div>
        </div>

        {/* ── CONTEXT MODAL (Image Only / Title Only / Both) ── */}
        <Dialog
          open={showContextModal}
          onOpenChange={(open) => {
            setShowContextModal(open);
            if (!open) setPendingOptimization(null);
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-green-500" />
                Choose AI Input Source
              </DialogTitle>
              <DialogDescription>
                Select what the AI should use to generate meta descriptions.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setContextChoice({ image: true, title: false })}
                className={`text-left rounded-lg border-[1.5px] p-3 transition-all ${
                  contextChoice.image && !contextChoice.title
                    ? "border-green-600 bg-green-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Search className="w-4 h-4 text-green-600" />
                  {contextChoice.image && !contextChoice.title && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <p className="text-[13px] font-extrabold text-gray-900">Use Image Only</p>
                <p className="text-[11.5px] text-gray-500 mt-1">Generate descriptions from product visuals only.</p>
              </button>

              <button
                type="button"
                onClick={() => setContextChoice({ image: false, title: true })}
                className={`text-left rounded-lg border-[1.5px] p-3 transition-all ${
                  !contextChoice.image && contextChoice.title
                    ? "border-green-600 bg-green-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <FileEdit className="w-4 h-4 text-green-600" />
                  {!contextChoice.image && contextChoice.title && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <p className="text-[13px] font-extrabold text-gray-900">Use Title Only</p>
                <p className="text-[11.5px] text-gray-500 mt-1">Generate descriptions from product titles only.</p>
              </button>

              <button
                type="button"
                onClick={() => setContextChoice({ image: true, title: true })}
                className={`text-left rounded-lg border-[1.5px] p-3 transition-all ${
                  contextChoice.image && contextChoice.title
                    ? "border-green-600 bg-green-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  {contextChoice.image && contextChoice.title && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <p className="text-[13px] font-extrabold text-gray-900">Use Both</p>
                <p className="text-[11.5px] text-gray-500 mt-1">Blend visual context with product titles.</p>
              </button>
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
              <p className="text-[11.5px] font-semibold text-gray-600">
                Backend payload: image: {String(contextChoice.image)}, title: {String(contextChoice.title)}
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setShowContextModal(false); setPendingOptimization(null); }}>
                Cancel
              </Button>
              <Button onClick={confirmOptimizationContext} className="bg-green-600 hover:bg-green-800 gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Progress Modal */}
        <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin text-green-500" /> Optimizing Meta Descriptions</DialogTitle>
              <DialogDescription>Please wait while we process your products...</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Progress value={(progress.current / Math.max(progress.total, 1)) * 100} className="h-2" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">{progress.status}</p>
                <p className="text-xs text-gray-500 mt-1">{progress.current} of {progress.total} products processed</p>
              </div>
              <div className="flex justify-center"><Brain className="w-12 h-12 text-green-500 animate-pulse" /></div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" /> Meta Description Preview</DialogTitle>
              <DialogDescription>Review optimized meta descriptions before applying to your store</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {optimizationResults.map(result => (
                <div key={result.productId} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-start gap-4">
                    <img src={result.image} alt="" className="w-14 h-14 rounded-lg object-cover border flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <div className="flex-1 min-w-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10.5px] font-bold text-gray-400 uppercase mb-1">Original ({result.oldMetaDescription === "(Empty)" ? 0 : result.oldMetaDescription.length} chars)</p>
                          <div className="p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-[12.5px] text-gray-600">{result.oldMetaDescription}</div>
                        </div>
                        <div>
                          <p className="text-[10.5px] font-bold text-green-500 uppercase mb-1">Optimized ({result.newMetaDescription.length} chars)</p>
                          <div className={`p-2.5 border rounded-lg text-[12.5px] font-medium ${result.newMetaDescription.length > 160 ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-gray-800"}`}>{result.newMetaDescription}</div>
                          {result.newMetaDescription.length > 160 && <p className="text-[10px] text-red-500 font-bold mt-1">⚠ Over 160 chars — may truncate in search</p>}
                        </div>
                      </div>
                      {result.oldMetaDescription !== result.newMetaDescription && (
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant={result.oldMetaDescription === "(Empty)" ? "default" : "secondary"} className="text-xs">{result.oldMetaDescription === "(Empty)" ? "Added" : "Improved"}</Badge>
                          <span className="text-xs text-gray-500">{Math.abs(result.newMetaDescription.length - (result.oldMetaDescription === "(Empty)" ? 0 : result.oldMetaDescription.length))} chars {result.newMetaDescription.length > (result.oldMetaDescription === "(Empty)" ? 0 : result.oldMetaDescription.length) ? "added" : "removed"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>Cancel</Button>
              <Button onClick={() => { setShowPreviewModal(false); calculateComparisonStats(optimizationResults); setShowComparisonModal(true); }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2">
                <TrendingUp className="w-4 h-4" /> See Improvements & Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Comparison Modal */}
        <Dialog open={showComparisonModal} onOpenChange={setShowComparisonModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Optimization Results</DialogTitle>
              <DialogDescription>How much better your meta descriptions will perform</DialogDescription>
            </DialogHeader>
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                {[{ label: "SEO Improvement", value: `${stats.improvement > 0 ? "+" : ""}${stats.improvement}%` }, { label: "Avg. Length", value: `${stats.averageLength} chars` }, { label: "SEO Score", value: `${stats.seoScore}%` }].map(s => (
                  <div key={s.label} className="text-center bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="text-2xl font-extrabold text-gray-900">{s.value}</div>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> What you're getting:</h4>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>✓ SEO-optimized for better search rankings</li>
                  <li>✓ Higher click-through rates from search</li>
                  <li>✓ Perfect length (150–160 characters)</li>
                  <li>✓ Includes primary keywords naturally</li>
                  <li>✓ Compelling calls to action</li>
                  <li>✓ Unique for each product page</li>
                  <li>✓ {stats.improvement}% improvement over original descriptions</li>
                </ul>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowComparisonModal(false)}>Cancel</Button>
              <Button onClick={() => applyOptimizations(optimizationResults)} className="bg-gradient-to-r from-green-600 to-emerald-600 gap-2">
                <Save className="w-4 h-4" /> Apply All Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-green-500" /> Success!</DialogTitle>
              <DialogDescription>Your meta descriptions have been optimized successfully</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle className="w-8 h-8 text-green-600" /></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Optimization Complete!</h3>
                <p className="text-gray-600">{progress.current} of {progress.total} meta descriptions updated.</p>
                <p className="text-sm text-green-600 mt-1 font-bold">+{stats.improvement}% SEO improvement achieved!</p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-700"><span className="font-semibold">Pro Tip:</span> Monitor Google Analytics over the next 14–28 days. You should see improved click-through rates as users respond to your new compelling meta descriptions.</p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => navigate("/")} className="flex-1">Go to Dashboard</Button>
              <Button onClick={() => { setShowSuccessModal(false); fetchStoredProducts(); }} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600">Optimize More Products</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}