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
  RefreshCw, Save, Play, Plus, Crown, Award, Trophy,
  RulerIcon, ArrowRight, ChevronLeft, Info, Package,
  Search, Globe, BarChart3, FileText, Layers, Eye,
  ArrowLeft,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  _id: string;
  productId: string;
  title: string;
  metaTitle: string;
  productImage: string;
  handle: string;
  status: string;
  optimized: boolean;
}

interface OptimizationResult {
  productId: string;
  oldMetaTitle: string;
  newMetaTitle: string;
  characterCount: number;
  image?: string;
}

interface MetaFormat {
  id: number;
  categoryName: string;
  primaryElement: string;
  secondaryElement: string;
  thirdElement: string;
  fourthElement: string;
  tone: string;
  brandFocused: boolean;
  minCharacters: number;
  maxCharacters: number;
  mustIncludeKeywords: string[];
  excludeKeywords: string[];
}

interface OptimizationContextChoice {
  image: boolean;
  title: boolean;
  existingMeta: boolean;
}

type PendingOptimization =
  | { type: "bulk"; format: MetaFormat; applyNow: boolean }
  | { type: "single"; format: MetaFormat; product: Product };

type TabType = "ai" | "existing" | "custom";

// ─── Meta-Title specific elements — much richer than product title slots ──────
// These match real SEO meta title patterns used by e-commerce pros

const allMetaSlotElements = [
  "Product Name",
  "Primary Keyword",
  "Secondary Keyword",
  "Long-tail Keyword",
  "Brand Name",
  "Store Name",
  "Call to Action",
  "Key Benefit",
  "USP (Unique Selling Point)",
  "Price Signal",
  "Trust Signal",
  "Target Audience",
  "Product Category",
  "Material / Type",
  "Use Case",
  "Location / Origin",
  "Urgency Signal",
  "Seasonal Hook",
  "Question Hook",
  "Comparison Advantage",
  "Shipping Signal",
  "Award / Badge",
  "Year / Edition",
  "Quantity / Pack Size",
];

// For meta titles, Product Name OR Primary Keyword must appear
const hasRequiredMetaElement = (fmt: MetaFormat): boolean =>
  ["Product Name", "Primary Keyword"].some(req =>
    fmt.primaryElement === req || fmt.secondaryElement === req ||
    fmt.thirdElement === req || fmt.fourthElement === req
  );

const tones = [
  "Professional", "Friendly & Casual", "Luxury & Premium", "Technical & Detailed",
  "Conversational", "Urgent & Action-Oriented", "Educational", "Inspirational",
  "Playful", "Authoritative",
];

// ─── Template config (icon + formulaTags + example) ───────────────────────────

const templateConfig: Record<number, { icon: React.ReactNode; formulaTags: string[]; example: string }> = {
  1: {
    icon: <Globe className="w-4 h-4 text-green-700" />,
    formulaTags: ["Primary Keyword", "Product Name", "Brand Name"],
    example: "Buy Handmade Wooden Chair | Premium Furniture Store",
  },
  2: {
    icon: <Target className="w-4 h-4 text-green-700" />,
    formulaTags: ["Call to Action", "Product Name", "Key Benefit"],
    example: "Shop Oak Dining Table — Free Delivery Included",
  },
  3: {
    icon: <Search className="w-4 h-4 text-green-700" />,
    formulaTags: ["Product Name", "Material / Type", "Use Case", "Brand Name"],
    example: "Solid Oak Coffee Table | Rustic Style | Living Room | Artisan Co",
  },
  4: {
    icon: <Crown className="w-4 h-4 text-green-700" />,
    formulaTags: ["Trust Signal", "Product Name", "USP (Unique Selling Point)", "Brand Name"],
    example: "Award-Winning Bamboo Basket | Ethically Sourced — Kenya Artisans",
  },
  5: {
    icon: <Sparkles className="w-4 h-4 text-green-700" />,
    formulaTags: ["Product Name", "Primary Keyword", "Target Audience", "Urgency Signal"],
    example: "Boho Wool Rug | Handmade Rugs For Home | Limited Stock",
  },
};

const defaultMetaFormats: MetaFormat[] = [
  {
    id: 1, categoryName: "SEO Standard",
    primaryElement: "Primary Keyword", secondaryElement: "Product Name",
    thirdElement: "Brand Name", fourthElement: "none",
    tone: "Professional", brandFocused: true,
    minCharacters: 50, maxCharacters: 60,
    mustIncludeKeywords: [], excludeKeywords: [],
  },
  {
    id: 2, categoryName: "Benefit + CTR Boost",
    primaryElement: "Call to Action", secondaryElement: "Product Name",
    thirdElement: "Key Benefit", fourthElement: "none",
    tone: "Friendly & Casual", brandFocused: false,
    minCharacters: 45, maxCharacters: 60,
    mustIncludeKeywords: [], excludeKeywords: [],
  },
  {
    id: 3, categoryName: "Keyword Rich",
    primaryElement: "Product Name", secondaryElement: "Material / Type",
    thirdElement: "Use Case", fourthElement: "Brand Name",
    tone: "Professional", brandFocused: true,
    minCharacters: 50, maxCharacters: 60,
    mustIncludeKeywords: [], excludeKeywords: [],
  },
  {
    id: 4, categoryName: "Trust & Authority",
    primaryElement: "Trust Signal", secondaryElement: "Product Name",
    thirdElement: "USP (Unique Selling Point)", fourthElement: "Brand Name",
    tone: "Authoritative", brandFocused: true,
    minCharacters: 50, maxCharacters: 60,
    mustIncludeKeywords: [], excludeKeywords: [],
  },
  {
    id: 5, categoryName: "Audience Targeted",
    primaryElement: "Product Name", secondaryElement: "Primary Keyword",
    thirdElement: "Target Audience", fourthElement: "Urgency Signal",
    tone: "Conversational", brandFocused: false,
    minCharacters: 45, maxCharacters: 60,
    mustIncludeKeywords: [], excludeKeywords: [],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function MetaLengthBar({ length, max = 60 }: { length: number; max?: number }) {
  const pct = Math.min(100, (length / max) * 100);
  const color = length === 0 ? "#ef4444" : length < 30 ? "#f59e0b" : length > 60 ? "#ef4444" : "#16a34a";
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
  if (length === 0) return <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap">Empty</span>;
  if (length < 30) return <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 whitespace-nowrap">Too Short</span>;
  if (length > 60) return <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap">Too Long</span>;
  return <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap">Optimal</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MetaTitleOptimization() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("ai");
  const [selectedFormat, setSelectedFormat] = useState<MetaFormat>(defaultMetaFormats[0]);
  const [floatBarVisible, setFloatBarVisible] = useState(true);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [exampleFormatId, setExampleFormatId] = useState<number | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  const [stats, setStats] = useState({ averageLength: 0, seoScore: 0, improvement: 0, emptyTitles: 0 });
  const [savedTemplateBanner, setSavedTemplateBanner] = useState<string | null>(null);
  const [userTemplates, setUserTemplates] = useState<MetaFormat[]>([]);

  // Context modal state
  const [showContextModal, setShowContextModal] = useState(false);
  const [pendingOptimization, setPendingOptimization] = useState<PendingOptimization | null>(null);
  const [contextChoice, setContextChoice] = useState<OptimizationContextChoice>({ image: true, title: true, existingMeta: true });

  // Custom Formula tab — own independent state (same as TitleOptimization pattern)
  const [customFormula, setCustomFormula] = useState<MetaFormat>({
    id: 9000,
    categoryName: "My Custom Meta Formula",
    primaryElement: "Product Name",
    secondaryElement: "Primary Keyword",
    thirdElement: "none",
    fourthElement: "none",
    tone: "Professional",
    brandFocused: false,
    minCharacters: 45,
    maxCharacters: 60,
    mustIncludeKeywords: [],
    excludeKeywords: [],
  });

  // Classic rules — ALL original functionality
  const [classicRules, setClassicRules] = useState({
    copyTitleToMeta: false,
    prefix: { enabled: false, value: "" },
    suffix: { enabled: false, value: "" },
    findReplace: { enabled: false, find: "", replace: "" },
    findRemove: { enabled: false, value: "" },
    truncate: { enabled: false, maxLength: 60, preserveWords: true },
  });

  // Build formula string from the 4 element slots — sent directly to API
  const buildFormulaPattern = (fmt: MetaFormat): string => {
    const parts = [
      `{${fmt.primaryElement}}`,
      `{${fmt.secondaryElement}}`,
      fmt.thirdElement && fmt.thirdElement !== "none" ? `{${fmt.thirdElement}}` : null,
      fmt.fourthElement && fmt.fourthElement !== "none" ? `{${fmt.fourthElement}}` : null,
    ].filter(Boolean);
    return parts.join(" + ");
  };

  const saveAsNewTemplate = (source: MetaFormat) => {
    if (!hasRequiredMetaElement(source)) return;
    const newId = 9000 + userTemplates.length + 1;
    const name = source.categoryName.trim() || `My Template ${userTemplates.length + 1}`;
    const saved: MetaFormat = { ...source, id: newId, categoryName: name };
    setUserTemplates(prev => [...prev, saved]);
    setSelectedFormat(saved);
    setActiveTab("ai");
    setFloatBarVisible(true);
    setSavedTemplateBanner(`"${name}" added to your templates!`);
    setTimeout(() => setSavedTemplateBanner(null), 3000);
  };

  useEffect(() => { fetchStoredProducts(); }, []);

  const fetchStoredProducts = async () => {
    try {
      setLoading(true);
      const data = (await getApi(ApiConfig.getStoredMetaTitileProduct)) || [];
      setProducts(data);
      if (data.length > 0) {
        const avg = Math.round(data.reduce((s: number, p: Product) => s + (p.metaTitle?.length || 0), 0) / data.length);
        const empty = data.filter((p: Product) => !p.metaTitle || p.metaTitle.trim() === "").length;
        setStats(prev => ({ ...prev, averageLength: avg, emptyTitles: empty, seoScore: calcSeoScore(data) }));
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const calcSeoScore = (prods: Product[]): number => {
    if (!prods.length) return 0;
    let score = 0;
    prods.forEach(p => {
      const mt = p.metaTitle || "";
      if (mt.length >= 50 && mt.length <= 60) score += 30;
      else if (mt.length >= 40 && mt.length <= 70) score += 20;
      else score += 10;
      if (mt.trim()) score += 30;
      if (p.title && mt.toLowerCase().includes(p.title.toLowerCase().substring(0, 20))) score += 20;
      const words = mt.split(" ");
      const unique = new Set(words.map(w => w.toLowerCase()));
      if (words.length / (unique.size || 1) < 1.5) score += 20;
    });
    return Math.round(score / prods.length);
  };

  const getPositiveImprovement = (oldValue: number, newValue: number) => {
    if (oldValue <= 0) return Math.abs(newValue) * 2; // If empty, give a boost
    return Math.abs(Math.round(((newValue - oldValue) / oldValue) * 100));
  };

  const buildPayload = (fmt: MetaFormat, productId: string, productTitle: string, apply: boolean, selectedContext: OptimizationContextChoice) => ({
    productId,
    categoryName: fmt.categoryName,
    primaryElement: fmt.primaryElement,
    secondaryElement: fmt.secondaryElement,
    thirdElement: fmt.thirdElement !== "none" ? fmt.thirdElement : "",
    fourthElement: fmt.fourthElement !== "none" ? fmt.fourthElement : "",
    formulaPattern: buildFormulaPattern(fmt),
    tone: fmt.tone,
    brandFocused: fmt.brandFocused,
    minCharacters: fmt.minCharacters,
    maxCharacters: fmt.maxCharacters,
    mustIncludeKeywords: fmt.mustIncludeKeywords.join(","),
    excludeKeywords: fmt.excludeKeywords.join(","),
    apply,
    image: selectedContext.image,
    title: selectedContext.title,
    existingMeta: selectedContext.existingMeta,
  });

  // ── Context Modal Handlers ───────────────────────────────────────────────────

  const requestAIOptimization = (format: MetaFormat, applyNow = false) => {
    if (!format || products.length === 0) return;
    setPendingOptimization({ type: "bulk", format, applyNow });
    setContextChoice({ image: true, title: true, existingMeta: true });
    setShowContextModal(true);
  };

  const requestSingleProductOptimize = (product: Product) => {
    if (!selectedFormat) return;
    setPendingOptimization({ type: "single", format: selectedFormat, product });
    setContextChoice({ image: true, title: true, existingMeta: true });
    setShowContextModal(true);
  };

  const confirmOptimizationContext = () => {
    if (!pendingOptimization || (!contextChoice.image && !contextChoice.title && !contextChoice.existingMeta)) return;
    const optimization = pendingOptimization;
    const selectedContext = { ...contextChoice };
    setShowContextModal(false);
    setPendingOptimization(null);

    if (optimization.type === "bulk") {
      handleAIOptimization(optimization.format, optimization.applyNow, selectedContext);
    } else {
      handleSingleOptimize(optimization.product, optimization.format, selectedContext);
    }
  };

  const handleAIOptimization = async (fmt: MetaFormat, applyNow = false, selectedContext: OptimizationContextChoice = { image: true, title: true, existingMeta: true }) => {
    if (!fmt || products.length === 0) return;
    setShowProgressModal(true);
    setProgress({ current: 0, total: products.length, status: "Starting AI optimization..." });
    const results: OptimizationResult[] = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      setProgress({ current: i + 1, total: products.length, status: `Optimizing: ${p.title}` });
      try {
        const res = await postApi(ApiConfig.aiMetaTitleOptimization, buildPayload(fmt, p.productId, p.title, applyNow, selectedContext));
        if (applyNow && res.applied) {
          results.push({ productId: p.productId, oldMetaTitle: res.oldMetaTitle || "(Empty)", newMetaTitle: res.newMetaTitle, characterCount: res.characterCount || 0, image: p.productImage });
        } else if (!applyNow && res.newMetaTitle) {
          results.push({ productId: p.productId, oldMetaTitle: res.oldMetaTitle || "(Empty)", newMetaTitle: res.newMetaTitle, characterCount: res.characterCount || res.newMetaTitle.length, image: p.productImage });
        }
        await new Promise(r => setTimeout(r, 500));
      } catch {
        results.push({ productId: p.productId, oldMetaTitle: p.metaTitle || "(Empty)", newMetaTitle: p.metaTitle || "(Empty)", characterCount: (p.metaTitle || "").length, image: p.productImage });
      }
    }
    setOptimizationResults(results);
    setShowProgressModal(false);
    if (applyNow) {
      const ok = results.filter(r => r.newMetaTitle !== r.oldMetaTitle).length;
      setProgress({ current: ok, total: products.length, status: "completed" });
      setShowSuccessModal(true);
    } else {
      calcComparisonStats(results);
      setShowPreviewModal(true);
    }
  };

  const handleSingleOptimize = async (product: Product, format: MetaFormat = selectedFormat, selectedContext: OptimizationContextChoice = { image: true, title: true, existingMeta: true }) => {
    setShowProgressModal(true);
    setProgress({ current: 0, total: 1, status: `Optimizing: ${product.title}` });
    try {
      const res = await postApi(ApiConfig.aiMetaTitleOptimization, buildPayload(format, product.productId, product.title, false, selectedContext));
      if (res.newMetaTitle) {
        setOptimizationResults([{ productId: product.productId, oldMetaTitle: product.metaTitle || "(Empty)", newMetaTitle: res.newMetaTitle, characterCount: res.newMetaTitle.length, image: product.productImage }]);
        setProgress({ current: 1, total: 1, status: "Done" });
        setShowProgressModal(false);
        calcComparisonStats([{ productId: product.productId, oldMetaTitle: product.metaTitle || "(Empty)", newMetaTitle: res.newMetaTitle, characterCount: res.newMetaTitle.length, image: product.productImage }]);
        setShowPreviewModal(true);
      } else { setShowProgressModal(false); }
    } catch { setShowProgressModal(false); }
  };

  const handleClassicOptimization = async (previewMode = true) => {
    if (products.length === 0) return;
    setShowProgressModal(true);
    setProgress({ current: 0, total: products.length, status: "Applying classic rules..." });
    const results: OptimizationResult[] = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      let newMeta = p.metaTitle || "";
      if (classicRules.copyTitleToMeta) newMeta = p.title;
      if (classicRules.prefix.enabled && classicRules.prefix.value) newMeta = `${classicRules.prefix.value} ${newMeta}`;
      if (classicRules.suffix.enabled && classicRules.suffix.value) newMeta = `${newMeta} ${classicRules.suffix.value}`;
      if (classicRules.findReplace.enabled && classicRules.findReplace.find) newMeta = newMeta.replace(new RegExp(classicRules.findReplace.find, "gi"), classicRules.findReplace.replace);
      if (classicRules.findRemove.enabled && classicRules.findRemove.value) newMeta = newMeta.replace(new RegExp(classicRules.findRemove.value, "gi"), "");
      if (classicRules.truncate.enabled && newMeta.length > classicRules.truncate.maxLength) {
        if (classicRules.truncate.preserveWords) {
          const truncated = newMeta.substring(0, classicRules.truncate.maxLength);
          const lastSpace = truncated.lastIndexOf(" ");
          newMeta = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
        } else { newMeta = newMeta.substring(0, classicRules.truncate.maxLength); }
      }
      newMeta = newMeta.replace(/\s+/g, " ").trim();
      results.push({ productId: p.productId, oldMetaTitle: p.metaTitle || "(Empty)", newMetaTitle: newMeta, characterCount: newMeta.length, image: p.productImage });
      setProgress({ current: i + 1, total: products.length, status: `Processing: ${p.title}` });
    }
    setOptimizationResults(results);
    setShowProgressModal(false);
    if (previewMode) { calcComparisonStats(results); setShowPreviewModal(true); }
    else await applyOptimizations(results);
  };

  const applyOptimizations = async (results: OptimizationResult[]) => {
    setShowProgressModal(true);
    setProgress({ current: 0, total: results.length, status: "Applying to Shopify..." });
    let ok = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.oldMetaTitle !== r.newMetaTitle) {
        try { await postApi(ApiConfig.updateMetaTitleOptimization, { productId: r.productId, oldMetaTitle: r.oldMetaTitle, newMetaTitle: r.newMetaTitle }); ok++; } catch { /**/ }
      }
      setProgress({ current: i + 1, total: results.length, status: `Updating...` });
    }
    setShowProgressModal(false);
    setShowComparisonModal(false);
    setProgress({ current: ok, total: results.length, status: "completed" });
    setShowSuccessModal(true);
  };

  const calcComparisonStats = (results: OptimizationResult[]) => {
    if (!results.length) return;
    const avgOld = results.reduce((s, r) => s + (r.oldMetaTitle === "(Empty)" ? 0 : r.oldMetaTitle.length), 0) / results.length;
    const avgNew = results.reduce((s, r) => s + r.newMetaTitle.length, 0) / results.length;
    const improvement = getPositiveImprovement(avgOld, avgNew);
    setStats({
      averageLength: Math.round(avgNew),
      seoScore: Math.min(100, Math.round((avgNew / 60) * 100)),
      improvement: improvement,
      emptyTitles: results.filter(r => r.oldMetaTitle === "(Empty)").length,
    });
  };

  const avgMetaLength = products.length > 0 ? Math.round(products.reduce((s, p) => s + (p.metaTitle?.length || 0), 0) / products.length) : 0;
  const emptyCount = products.filter(p => !p.metaTitle || p.metaTitle.trim() === "").length;
  const exampleFormatData = exampleFormatId ? [...defaultMetaFormats, ...userTemplates].find(f => f.id === exampleFormatId) : null;
  const exampleTpl = exampleFormatId ? templateConfig[exampleFormatId] : null;

  if (loading) {
    return (
      <AppLayout title="Meta Title Optimization">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Search className="w-12 h-12 animate-pulse text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading products for meta title optimization...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Meta Title Optimization">
      <div className="p-5 space-y-5">

        {/* Step Header */}
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-3.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-sm font-semibold text-gray-500 hover:border-green-400 hover:text-green-700 transition-all">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest">Step 1 of 2</p>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">Meta Title Optimization</h1>
            <p className="text-xs text-gray-500">Build your meta title formula and optimize for search engines</p>
          </div>
          <div className="flex items-center gap-1.5 bg-green-800 text-white px-4 py-1.5 rounded-full text-[12.5px] font-bold shadow-md shadow-green-900/25">
            <Package className="w-3.5 h-3.5" /> {products.length} Products
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Avg Meta Length", value: `${avgMetaLength}`, unit: "chars", hint: avgMetaLength < 50 ? "Too short for SEO" : avgMetaLength > 60 ? "May get truncated" : "Optimal range", pct: Math.min(100, (avgMetaLength / 60) * 100), color: "bg-green-400" },
            { label: "SEO Score", value: `${stats.seoScore}`, unit: "%", hint: `${emptyCount} empty meta titles`, pct: stats.seoScore, color: "bg-amber-400" },
            { label: "Traffic Boost", value: "40", unit: "%+", hint: "Better meta = more clicks", pct: 40, color: "bg-blue-400" },
            { label: "Time Saved", value: `${products.length * 2}`, unit: "min", hint: "AI works 24/7", pct: 100, color: "bg-purple-400" },
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
              {(["ai", "existing", "custom"] as TabType[]).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3.5 text-[13px] font-semibold border-b-[2.5px] -mb-[1.5px] transition-all whitespace-nowrap ${activeTab === tab ? "text-green-800 border-green-800 font-bold" : "text-gray-400 border-transparent hover:text-green-700"
                    }`}>
                  {tab === "ai" ? "AI Optimization Templates" : tab === "existing" ? "Existing Meta Titles" : "Custom Formula"}
                </button>
              ))}
            </div>

            {/* ── AI TAB ── */}
            {activeTab === "ai" && (
              <>
                <div className="px-4 py-2.5 text-xs text-gray-500 border-b-[1.5px] border-gray-200 bg-green-50">
                  These are proven SEO meta title formulas. Choose one, customize the 4 elements, then generate.
                </div>

                {savedTemplateBanner && (
                  <div className="mx-4 mt-3 flex items-center gap-2 bg-green-50 border-[1.5px] border-green-300 rounded-lg px-3 py-2 animate-pulse">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-[12.5px] font-bold text-green-700">{savedTemplateBanner}</span>
                  </div>
                )}

                {/* Template Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 p-4">
                  {[...defaultMetaFormats, ...userTemplates].map(format => {
                    const tpl = templateConfig[format.id] ?? {
                      icon: <Sparkles className="w-4 h-4 text-green-700" />,
                      formulaTags: [format.primaryElement, format.secondaryElement, ...(format.thirdElement !== "none" ? [format.thirdElement] : []), ...(format.fourthElement !== "none" ? [format.fourthElement] : [])],
                      example: buildFormulaPattern(format),
                    };
                    const isOn = selectedFormat.id === format.id;
                    return (
                      <div key={format.id}
                        onClick={() => { setSelectedFormat(format); setFloatBarVisible(true); }}
                        className={`relative border-[1.5px] rounded-xl p-4 cursor-pointer transition-all duration-200 flex flex-col gap-2.5 overflow-hidden
                          ${isOn ? "border-green-700 bg-green-50 shadow-md shadow-green-100" : "border-gray-200 bg-white hover:border-green-300 hover:shadow-md hover:-translate-y-0.5"}`}
                      >
                        <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-green-500 to-green-800 transition-opacity ${isOn ? "opacity-100" : "opacity-0"}`} />
                        {isOn && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-green-700 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isOn ? "bg-green-100" : "bg-green-50"}`}>{tpl.icon}</div>
                          <span className={`text-sm font-extrabold ${isOn ? "text-green-800" : "text-gray-900"}`}>{format.categoryName}</span>
                        </div>
                        {/* Formula Element Tags */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {tpl.formulaTags.map((tag, i) => (
                            <span key={tag} className="contents">
                              <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1
                                ${isOn ? "bg-green-100 text-green-700 border-green-200" : "bg-green-50 text-green-700 border-green-100"}`}>
                                {tag}
                              </span>
                              {i < tpl.formulaTags.length - 1 && <span className="text-[12px] font-bold text-gray-400">+</span>}
                            </span>
                          ))}
                        </div>
                        <div className={`text-[11.5px] text-gray-600 leading-relaxed rounded-lg px-3 py-2 border-l-[3px] border-green-500 ${isOn ? "bg-green-50/60" : "bg-gray-50"}`}>
                          <span className="font-bold text-green-700">Ex: </span>{tpl.example}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1
                              ${isOn ? "bg-green-100/70 border-green-200 text-green-700" : "bg-gray-100 border-gray-200 text-gray-500"}`}>
                              Length: <span className="font-extrabold">{format.minCharacters}–{format.maxCharacters}</span> chars
                            </span>
                            {format.id >= 9000 && (
                              <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">✦ My Template</span>
                            )}
                          </div>
                          {format.id >= 9000 ? (
                            <button className="text-[11px] font-bold text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer hover:underline"
                              onClick={(e) => { e.stopPropagation(); setUserTemplates(prev => prev.filter(t => t.id !== format.id)); if (selectedFormat.id === format.id) setSelectedFormat(defaultMetaFormats[0]); }}>
                              ✕ Remove
                            </button>
                          ) : (
                            <button className="text-[11.5px] font-bold text-green-600 hover:text-green-800 flex items-center gap-1 bg-transparent border-none cursor-pointer hover:underline"
                              onClick={(e) => { e.stopPropagation(); setExampleFormatId(format.id); setShowExampleModal(true); }}>
                              <Info className="w-3 h-3" /> See Example
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Save as New Template card */}
                  <div onClick={() => saveAsNewTemplate(selectedFormat)}
                    title={!hasRequiredMetaElement(selectedFormat) ? "Add Product Name or Primary Keyword to a slot first" : "Save current formula as new template"}
                    className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 min-h-[140px] text-sm font-semibold transition-all cursor-pointer
                      ${hasRequiredMetaElement(selectedFormat) ? "border-green-300 text-green-500 hover:border-green-500 hover:bg-green-50 hover:text-green-700" : "border-gray-200 text-gray-300 cursor-not-allowed opacity-50"}`}>
                    <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center"><Plus className="w-5 h-5" /></div>
                    <span>Save as New Template</span>
                    <span className="text-[10.5px] font-normal text-center px-3 opacity-70">Saves your current customized formula</span>
                  </div>
                </div>

                {/* Customize section */}
                <div className="px-4 py-3.5 border-t-[1.5px] border-gray-200 bg-gray-50/60">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13.5px] font-extrabold text-gray-800">Customize This Template</span>
                    <span className="text-[10.5px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6" /><path d="M8 5v4M8 11v.5" /></svg>
                      Product Name or Primary Keyword required
                    </span>
                  </div>

                  {/* Live Formula Preview */}
                  <div className={`mb-3 rounded-xl px-3 py-2.5 border-[1.5px] transition-colors ${!hasRequiredMetaElement(selectedFormat) ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${!hasRequiredMetaElement(selectedFormat) ? "text-red-500" : "text-green-500"}`}>
                      Live Formula Pattern
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        selectedFormat.primaryElement,
                        selectedFormat.secondaryElement,
                        selectedFormat.thirdElement !== "none" ? selectedFormat.thirdElement : null,
                        selectedFormat.fourthElement !== "none" ? selectedFormat.fourthElement : null,
                      ].filter(Boolean).map((el, i, arr) => (
                        <span key={i} className="contents">
                          <span className={`font-mono text-[12px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 ${["Product Name", "Primary Keyword"].includes(el!)
                              ? "text-white bg-green-700 border border-green-800"
                              : "text-green-800 bg-green-100 border border-green-200"
                            }`}>
                            {["Product Name", "Primary Keyword"].includes(el!) && <CheckCircle className="w-3 h-3 text-green-300 flex-shrink-0" />}
                            {`{${el}}`}
                          </span>
                          {i < arr.length - 1 && <span className="text-green-400 font-bold text-sm">+</span>}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10.5px] text-gray-500 mt-2 pt-2 border-t border-green-100">
                      <span className="font-bold text-green-600">Sent to AI: </span>
                      <span className="font-mono">{buildFormulaPattern(selectedFormat)}</span>
                    </p>
                  </div>

                  {!hasRequiredMetaElement(selectedFormat) && (
                    <div className="mb-3 flex items-center gap-2 bg-red-50 border-[1.5px] border-red-300 rounded-lg px-3 py-2">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2.2">
                        <path d="M8 2L1 14h14L8 2z" /><path d="M8 7v3M8 12v.5" />
                      </svg>
                      <span className="text-[12px] font-bold text-red-600">"Product Name" or "Primary Keyword" is required in at least one slot.</span>
                      <button onClick={() => setSelectedFormat({ ...selectedFormat, primaryElement: "Product Name" })}
                        className="ml-auto text-[11px] font-extrabold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap flex-shrink-0">
                        Fix it →
                      </button>
                    </div>
                  )}

                  {/* 4 Element Dropdowns */}
                  <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">1st Element</label>
                      <select value={selectedFormat.primaryElement}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = { ...selectedFormat, primaryElement: val };
                          if (!["Product Name", "Primary Keyword"].includes(val) && !["Product Name", "Primary Keyword"].includes(updated.secondaryElement)) {
                            updated.secondaryElement = "Product Name";
                          }
                          setSelectedFormat(updated);
                        }}
                        className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${["Product Name", "Primary Keyword"].includes(selectedFormat.primaryElement) ? "border-green-500 bg-green-50 font-bold text-green-800" : "border-gray-200 focus:border-green-500"
                          }`}>
                        {allMetaSlotElements.map(el => <option key={el}>{el}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">2nd Element</label>
                      <select value={selectedFormat.secondaryElement}
                        onChange={(e) => setSelectedFormat({ ...selectedFormat, secondaryElement: e.target.value })}
                        className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${["Product Name", "Primary Keyword"].includes(selectedFormat.secondaryElement) ? "border-green-500 bg-green-50 font-bold text-green-800" : "border-gray-200 focus:border-green-500"
                          }`}>
                        {allMetaSlotElements.map(el => <option key={el}>{el}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">3rd Element <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                      <select value={selectedFormat.thirdElement}
                        onChange={(e) => setSelectedFormat({ ...selectedFormat, thirdElement: e.target.value })}
                        className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${["Product Name", "Primary Keyword"].includes(selectedFormat.thirdElement) ? "border-green-500 bg-green-50 font-bold text-green-800" : "border-gray-200 focus:border-green-500"
                          }`}>
                        <option value="none">— None —</option>
                        {allMetaSlotElements.map(el => <option key={el}>{el}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">4th Element <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                      <select value={selectedFormat.fourthElement}
                        onChange={(e) => setSelectedFormat({ ...selectedFormat, fourthElement: e.target.value })}
                        className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${["Product Name", "Primary Keyword"].includes(selectedFormat.fourthElement) ? "border-green-500 bg-green-50 font-bold text-green-800" : "border-gray-200 focus:border-green-500"
                          }`}>
                        <option value="none">— None —</option>
                        {allMetaSlotElements.map(el => <option key={el}>{el}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Tone + Brand + Min/Max */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Tone</label>
                      <select value={selectedFormat.tone} onChange={(e) => setSelectedFormat({ ...selectedFormat, tone: e.target.value })}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-green-500">
                        {tones.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Brand Focused</label>
                      <select value={selectedFormat.brandFocused ? "On" : "Off"} onChange={(e) => setSelectedFormat({ ...selectedFormat, brandFocused: e.target.value === "On" })}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-green-500">
                        <option>Off</option><option>On</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Min Characters</label>
                      <input type="number" value={selectedFormat.minCharacters} onChange={(e) => setSelectedFormat({ ...selectedFormat, minCharacters: parseInt(e.target.value) || 45 })}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-green-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Max Characters</label>
                      <input type="number" value={selectedFormat.maxCharacters} onChange={(e) => setSelectedFormat({ ...selectedFormat, maxCharacters: parseInt(e.target.value) || 60 })}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-green-500" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 px-4 py-3 border-t-[1.5px] border-gray-200 bg-white items-center">
                  <button onClick={() => requestAIOptimization(selectedFormat, false)} disabled={!hasRequiredMetaElement(selectedFormat)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-800 text-white text-[13px] font-bold transition-all shadow-sm hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed">
                    <Play className="w-3.5 h-3.5" /> Generate AI Meta Titles
                  </button>
                  <button onClick={() => requestAIOptimization(selectedFormat, true)} disabled={!hasRequiredMetaElement(selectedFormat)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[13px] font-bold transition-all shadow-sm hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed">
                    <ArrowRight className="w-3.5 h-3.5" /> Optimize & Apply Directly
                  </button>
                  <button onClick={() => saveAsNewTemplate(selectedFormat)} disabled={!hasRequiredMetaElement(selectedFormat)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-[1.5px] border-green-300 bg-white text-green-600 hover:bg-green-50 hover:border-green-500 text-[13px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    <Plus className="w-3.5 h-3.5" /> Save as New Template
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
                      <div /><div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Product / Meta Title</div>
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
                            <p className="text-[11px] text-gray-400 mt-0.5 truncate font-mono">{product.metaTitle || <span className="text-red-400 font-sans italic">No meta title</span>}</p>
                          </div>
                          <MetaLengthBar length={product.metaTitle?.length || 0} max={60} />
                          <MetaStatusBadge length={product.metaTitle?.length || 0} />
                          {product?.optimized ? (
                            <button className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600 hover:bg-red-800 text-white text-[11px] font-bold whitespace-nowrap">
                              <ArrowLeft className="w-2.5 h-2.5" /> Optimized
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

            {/* ── CUSTOM FORMULA TAB ── */}
            {activeTab === "custom" && (
              <>
                <div className="px-4 py-2.5 text-xs text-gray-500 border-b-[1.5px] border-gray-200 bg-green-50">
                  Build your own meta title formula — pick any 4 elements from the SEO element library and the full formula is sent directly to AI.
                </div>
                <div className="px-4 py-3.5 space-y-3">

                  <div className="flex flex-col gap-1">
                    <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Template Name</label>
                    <input type="text" value={customFormula.categoryName} onChange={(e) => setCustomFormula({ ...customFormula, categoryName: e.target.value })}
                      placeholder="e.g. My SEO Meta Formula"
                      className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[13px] text-gray-800 font-semibold outline-none focus:border-green-500" />
                  </div>

                  {/* Live Formula Preview */}
                  <div className={`rounded-xl px-3 py-2.5 border-[1.5px] transition-colors ${!hasRequiredMetaElement(customFormula) ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${!hasRequiredMetaElement(customFormula) ? "text-red-500" : "text-green-500"}`}>
                      Live Formula Pattern
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[customFormula.primaryElement, customFormula.secondaryElement,
                      customFormula.thirdElement !== "none" ? customFormula.thirdElement : null,
                      customFormula.fourthElement !== "none" ? customFormula.fourthElement : null,
                      ].filter(Boolean).map((el, i, arr) => (
                        <span key={i} className="contents">
                          <span className={`font-mono text-[12px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 ${["Product Name", "Primary Keyword"].includes(el!)
                              ? "text-white bg-green-700 border border-green-800"
                              : "text-green-800 bg-green-100 border border-green-200"
                            }`}>
                            {["Product Name", "Primary Keyword"].includes(el!) && <CheckCircle className="w-3 h-3 text-green-300 flex-shrink-0" />}
                            {`{${el}}`}
                          </span>
                          {i < arr.length - 1 && <span className="text-green-400 font-bold text-sm">+</span>}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10.5px] text-gray-500 mt-2 pt-2 border-t border-green-100">
                      <span className="font-bold text-green-600">Sent to AI: </span>
                      <span className="font-mono">{buildFormulaPattern(customFormula)}</span>
                    </p>
                  </div>

                  {!hasRequiredMetaElement(customFormula) && (
                    <div className="flex items-center gap-2 bg-red-50 border-[1.5px] border-red-300 rounded-lg px-3 py-2">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2.2">
                        <path d="M8 2L1 14h14L8 2z" /><path d="M8 7v3M8 12v.5" />
                      </svg>
                      <span className="text-[12px] font-bold text-red-600">"Product Name" or "Primary Keyword" is required in at least one slot.</span>
                      <button onClick={() => setCustomFormula({ ...customFormula, primaryElement: "Product Name" })}
                        className="ml-auto text-[11px] font-extrabold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-md whitespace-nowrap flex-shrink-0">
                        Fix it →
                      </button>
                    </div>
                  )}

                  {/* 4 Dropdowns */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">1st Element</label>
                      <select value={customFormula.primaryElement}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = { ...customFormula, primaryElement: val };
                          if (!["Product Name", "Primary Keyword"].includes(val) && !["Product Name", "Primary Keyword"].includes(updated.secondaryElement)) updated.secondaryElement = "Product Name";
                          setCustomFormula(updated);
                        }}
                        className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${["Product Name", "Primary Keyword"].includes(customFormula.primaryElement) ? "border-green-500 bg-green-50 font-bold text-green-800" : "border-gray-200 focus:border-green-500"}`}>
                        {allMetaSlotElements.map(el => <option key={el}>{el}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">2nd Element</label>
                      <select value={customFormula.secondaryElement} onChange={(e) => setCustomFormula({ ...customFormula, secondaryElement: e.target.value })}
                        className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${["Product Name", "Primary Keyword"].includes(customFormula.secondaryElement) ? "border-green-500 bg-green-50 font-bold text-green-800" : "border-gray-200 focus:border-green-500"}`}>
                        {allMetaSlotElements.map(el => <option key={el}>{el}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">3rd Element <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                      <select value={customFormula.thirdElement} onChange={(e) => setCustomFormula({ ...customFormula, thirdElement: e.target.value })}
                        className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${["Product Name", "Primary Keyword"].includes(customFormula.thirdElement) ? "border-green-500 bg-green-50 font-bold text-green-800" : "border-gray-200 focus:border-green-500"}`}>
                        <option value="none">— None —</option>
                        {allMetaSlotElements.map(el => <option key={el}>{el}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">4th Element <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                      <select value={customFormula.fourthElement} onChange={(e) => setCustomFormula({ ...customFormula, fourthElement: e.target.value })}
                        className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${["Product Name", "Primary Keyword"].includes(customFormula.fourthElement) ? "border-green-500 bg-green-50 font-bold text-green-800" : "border-gray-200 focus:border-green-500"}`}>
                        <option value="none">— None —</option>
                        {allMetaSlotElements.map(el => <option key={el}>{el}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Tone</label>
                      <select value={customFormula.tone} onChange={(e) => setCustomFormula({ ...customFormula, tone: e.target.value })}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-green-500">
                        {tones.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Brand Focused</label>
                      <select value={customFormula.brandFocused ? "On" : "Off"} onChange={(e) => setCustomFormula({ ...customFormula, brandFocused: e.target.value === "On" })}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-green-500">
                        <option>Off</option><option>On</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Min Characters</label>
                      <input type="number" value={customFormula.minCharacters} onChange={(e) => setCustomFormula({ ...customFormula, minCharacters: parseInt(e.target.value) || 45 })}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-green-500" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Max Characters</label>
                      <input type="number" value={customFormula.maxCharacters} onChange={(e) => setCustomFormula({ ...customFormula, maxCharacters: parseInt(e.target.value) || 60 })}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-green-500" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 px-4 py-3 border-t-[1.5px] border-gray-200 bg-white items-center">
                  <button onClick={() => { setSelectedFormat(customFormula); requestAIOptimization(customFormula, false); }} disabled={!hasRequiredMetaElement(customFormula)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-800 text-white text-[13px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    <Play className="w-3.5 h-3.5" /> Generate AI Meta Titles
                  </button>
                  <button onClick={() => { setSelectedFormat(customFormula); requestAIOptimization(customFormula, true); }} disabled={!hasRequiredMetaElement(customFormula)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[13px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    <ArrowRight className="w-3.5 h-3.5" /> Optimize & Apply Directly
                  </button>
                  <button onClick={() => saveAsNewTemplate(customFormula)} disabled={!hasRequiredMetaElement(customFormula)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-[1.5px] border-green-300 bg-white text-green-600 hover:bg-green-50 text-[13px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    <Plus className="w-3.5 h-3.5" /> Save as New Template
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right: Classic Rules */}
          <div className="bg-white border-[1.5px] border-gray-200 rounded-xl shadow-sm p-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 font-extrabold text-gray-900 text-[14px] mb-1"><RulerIcon className="w-4 h-4 text-gray-600" /> Classic Rules</div>
              <p className="text-xs text-gray-400">Manual meta title adjustments</p>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg border border-green-200">
              <div><p className="text-[11.5px] font-bold text-gray-700">Copy Product Title</p><p className="text-[10px] text-gray-400">Use product title as meta title</p></div>
              <button onClick={() => setClassicRules(p => ({ ...p, copyTitleToMeta: !p.copyTitleToMeta }))}
                className={`w-9 h-5 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors ${classicRules.copyTitleToMeta ? "bg-green-600" : "bg-gray-200"}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${classicRules.copyTitleToMeta ? "translate-x-4" : ""}`} />
              </button>
            </div>

            {[
              { key: "prefix", label: "Prefix", ph: "e.g., Buy, Best, Shop" },
              { key: "suffix", label: "Suffix", ph: "e.g., | Store Name" },
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
                  <input value={(classicRules as any)[key].value} onChange={(e) => setClassicRules(p => ({ ...p, [key]: { ...(p as any)[key], value: e.target.value } }))}
                    placeholder={ph} className="w-full px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12px] outline-none focus:border-green-500" />
                )}
              </div>
            ))}

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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div><span className="text-[11px] font-bold text-gray-600">Truncate Titles</span><p className="text-[9.5px] text-gray-400">Max recommended: 60 chars</p></div>
                <button onClick={() => setClassicRules(p => ({ ...p, truncate: { ...p.truncate, enabled: !p.truncate.enabled } }))}
                  className={`w-9 h-5 rounded-full flex items-center px-0.5 flex-shrink-0 transition-colors ${classicRules.truncate.enabled ? "bg-green-600" : "bg-gray-200"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${classicRules.truncate.enabled ? "translate-x-4" : ""}`} />
                </button>
              </div>
              {classicRules.truncate.enabled && (
                <div className="space-y-2">
                  <input type="number" value={classicRules.truncate.maxLength} onChange={(e) => setClassicRules(p => ({ ...p, truncate: { ...p.truncate, maxLength: parseInt(e.target.value) || 60 } }))}
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

        {/* ── CONTEXT MODAL (Image/Title/Existing Meta) ── */}
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
                Choose AI Input Sources
              </DialogTitle>
              <DialogDescription>
                Select what the AI should use when generating meta titles.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setContextChoice({ image: true, title: false, existingMeta: false })}
                className={`text-left rounded-lg border-[1.5px] p-3 transition-all ${
                  contextChoice.image && !contextChoice.title && !contextChoice.existingMeta
                    ? "border-green-600 bg-green-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Package className="w-4 h-4 text-green-600" />
                  {contextChoice.image && !contextChoice.title && !contextChoice.existingMeta && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <p className="text-[13px] font-extrabold text-gray-900">Use Image Only</p>
                <p className="text-[11.5px] text-gray-500 mt-1">Generate meta titles from product visuals only.</p>
              </button>

              <button
                type="button"
                onClick={() => setContextChoice({ image: false, title: true, existingMeta: false })}
                className={`text-left rounded-lg border-[1.5px] p-3 transition-all ${
                  !contextChoice.image && contextChoice.title && !contextChoice.existingMeta
                    ? "border-green-600 bg-green-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  {!contextChoice.image && contextChoice.title && !contextChoice.existingMeta && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <p className="text-[13px] font-extrabold text-gray-900">Use Product Title Only</p>
                <p className="text-[11.5px] text-gray-500 mt-1">Generate meta titles from product titles only.</p>
              </button>

              {/* <button
                type="button"
                onClick={() => setContextChoice({ image: false, title: false, existingMeta: true })}
                className={`text-left rounded-lg border-[1.5px] p-3 transition-all ${
                  !contextChoice.image && !contextChoice.title && contextChoice.existingMeta
                    ? "border-green-600 bg-green-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Search className="w-4 h-4 text-green-600" />
                  {!contextChoice.image && !contextChoice.title && contextChoice.existingMeta && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <p className="text-[13px] font-extrabold text-gray-900">Use Existing Meta Only</p>
                <p className="text-[11.5px] text-gray-500 mt-1">Improve the current meta title.</p>
              </button> */}

              <button
                type="button"
                onClick={() => setContextChoice({ image: true, title: true, existingMeta: false })}
                className={`text-left rounded-lg border-[1.5px] p-3 transition-all ${
                  contextChoice.image && contextChoice.title && !contextChoice.existingMeta
                    ? "border-green-600 bg-green-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Sparkles className="w-4 h-4 text-green-600" />
                  {contextChoice.image && contextChoice.title && !contextChoice.existingMeta && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <p className="text-[13px] font-extrabold text-gray-900">Use Both</p>
                <p className="text-[11.5px] text-gray-500 mt-1">Blend visuals with product titles.</p>
              </button>

              {/* <button
                type="button"
                onClick={() => setContextChoice({ image: true, title: false, existingMeta: true })}
                className={`text-left rounded-lg border-[1.5px] p-3 transition-all ${
                  contextChoice.image && !contextChoice.title && contextChoice.existingMeta
                    ? "border-green-600 bg-green-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Layers className="w-4 h-4 text-green-600" />
                  {contextChoice.image && !contextChoice.title && contextChoice.existingMeta && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <p className="text-[13px] font-extrabold text-gray-900">Image + Existing Meta</p>
                <p className="text-[11.5px] text-gray-500 mt-1">Enhance current meta with visual context.</p>
              </button> */}
{/* 
              <button
                type="button"
                onClick={() => setContextChoice({ image: false, title: true, existingMeta: true })}
                className={`text-left rounded-lg border-[1.5px] p-3 transition-all ${
                  !contextChoice.image && contextChoice.title && contextChoice.existingMeta
                    ? "border-green-600 bg-green-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  {!contextChoice.image && contextChoice.title && contextChoice.existingMeta && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <p className="text-[13px] font-extrabold text-gray-900">Title + Existing Meta</p>
                <p className="text-[11.5px] text-gray-500 mt-1">Combine product title with current meta.</p>
              </button>

              <button
                type="button"
                onClick={() => setContextChoice({ image: true, title: true, existingMeta: true })}
                className={`text-left rounded-lg border-[1.5px] p-3 transition-all col-span-full ${
                  contextChoice.image && contextChoice.title && contextChoice.existingMeta
                    ? "border-green-600 bg-green-50 shadow-sm"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Brain className="w-4 h-4 text-green-600" />
                  {contextChoice.image && contextChoice.title && contextChoice.existingMeta && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <p className="text-[13px] font-extrabold text-gray-900">Use All Three (Best Results)</p>
                <p className="text-[11.5px] text-gray-500 mt-1">Combine image, product title, and existing meta for maximum context.</p>
              </button> */}
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

        {/* Example Modal */}
        {showExampleModal && exampleFormatData && exampleTpl && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={() => setShowExampleModal(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-[500px] w-[92%] shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[15px] font-extrabold text-gray-900">{exampleFormatData.categoryName} — Example</h3>
                <button onClick={() => setShowExampleModal(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none cursor-pointer">×</button>
              </div>
              <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Formula Elements</p>
              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                {exampleTpl.formulaTags.map((tag, i, arr) => (
                  <span key={tag} className="contents">
                    <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-md border ${["Product Name", "Primary Keyword"].includes(tag) ? "bg-green-700 text-white border-green-800" : "bg-green-50 text-green-700 border-green-100"}`}>{tag}</span>
                    {i < arr.length - 1 && <span className="text-gray-400 font-bold">+</span>}
                  </span>
                ))}
              </div>
              <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Formula sent to AI</p>
              <p className="font-mono text-[12px] bg-green-50 text-green-800 border border-green-200 rounded-lg px-3 py-2 mb-3">{buildFormulaPattern(exampleFormatData)}</p>
              <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Example Output</p>
              <p className="text-[13px] text-gray-800 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200 mb-4">{exampleTpl.example}</p>
              <div className="flex gap-2">
                <button onClick={() => setShowExampleModal(false)} className="flex-1 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-[13px] font-bold text-gray-500">Close</button>
                <button onClick={() => { setSelectedFormat(exampleFormatData); setShowExampleModal(false); setActiveTab("ai"); }}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-800 text-white rounded-lg text-[13px] font-bold">Use This Formula</button>
              </div>
            </div>
          </div>
        )}

        {/* Progress Modal */}
        <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin text-green-500" /> Optimizing Meta Titles</DialogTitle>
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
              <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" /> Meta Title Preview</DialogTitle>
              <DialogDescription>Review optimized meta titles before applying to your store</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {optimizationResults.map(result => (
                <div key={result.productId} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-start gap-4">
                    <img src={result.image} alt="" className="w-14 h-14 rounded-lg object-cover border flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <div className="flex-1 min-w-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-[10.5px] font-bold text-gray-400 uppercase mb-1">Original ({result.oldMetaTitle === "(Empty)" ? 0 : result.oldMetaTitle.length} chars)</p>
                          <div className="p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-[12.5px] text-gray-600 font-mono">{result.oldMetaTitle}</div>
                        </div>
                        <div>
                          <p className="text-[10.5px] font-bold text-green-500 uppercase mb-1">Optimized ({result.newMetaTitle.length} chars)</p>
                          <div className={`p-2.5 border rounded-lg text-[12.5px] font-mono font-medium ${result.newMetaTitle.length > 60 ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-gray-800"}`}>{result.newMetaTitle}</div>
                          {result.newMetaTitle.length > 60 && <p className="text-[10px] text-red-500 font-bold mt-1">⚠ Over 60 chars — may truncate in search</p>}
                        </div>
                      </div>
                      {result.oldMetaTitle !== result.newMetaTitle && (
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant={result.oldMetaTitle === "(Empty)" ? "default" : "secondary"} className="text-xs">{result.oldMetaTitle === "(Empty)" ? "Added" : "Improved"}</Badge>
                          <span className="text-xs text-gray-500">{Math.abs(result.newMetaTitle.length - (result.oldMetaTitle === "(Empty)" ? 0 : result.oldMetaTitle.length))} chars {result.newMetaTitle.length > (result.oldMetaTitle === "(Empty)" ? 0 : result.oldMetaTitle.length) ? "added" : "removed"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>Cancel</Button>
              <Button onClick={() => { setShowPreviewModal(false); calcComparisonStats(optimizationResults); setShowComparisonModal(true); }}
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
              <DialogDescription>How much better your meta titles will perform</DialogDescription>
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
                  <li>✓ SEO-optimized for better search rankings</li><li>✓ Higher click-through rates</li>
                  <li>✓ Perfect length (50–60 characters)</li><li>✓ Your exact formula applied to every product</li>
                  <li>✓ {stats.improvement}% improvement over original titles</li>
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
              <DialogDescription>Your meta titles have been optimized successfully</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"><CheckCircle className="w-8 h-8 text-green-600" /></div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Optimization Complete!</h3>
                <p className="text-gray-600">{progress.current} of {progress.total} meta titles updated.</p>
                <p className="text-sm text-green-600 mt-1 font-bold">+{stats.improvement}% SEO improvement achieved!</p>
              </div>
              <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-left">
                <p className="text-sm text-gray-700"><span className="font-semibold">Pro Tip:</span> Monitor Google Search Console in 14–28 days to track your improved rankings.</p>
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