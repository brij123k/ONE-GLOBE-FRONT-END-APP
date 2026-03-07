import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Brain, Zap, Sparkles, TrendingUp, Target, CheckCircle,
  RefreshCw, Save, Play, Plus, Award, Trophy, RulerIcon,
  ArrowRight, ChevronLeft, Info, Package, FileText, Settings,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  _id: string;
  productId: string;
  description: string;
  productImage: string;
  handle: string;
  status: string;
  title?: string;
  vendor?: string;
  productType?: string;
  totalInventory?: number;
  categoryName?: string;
}

interface OptimizationResult {
  productId: string;
  oldDescription: string;
  newDescription: string;
  characterCount: number;
  image: string;
}

export type AIBlockType =
  | "opening" | "story" | "features" | "benefits"
  | "sustainability" | "useCases" | "technicalDetails"
  | "careInstructions" | "specifications" | "cta";

export interface AIFormat {
  id: string;
  name: string;
  description: string;
  bestFor: string[];
  toneExamples: string[];
  blocks: { type: AIBlockType; heading?: string; required: boolean }[];
  allowCustom?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const blockTypeLabels: Record<AIBlockType, string> = {
  opening:          "Opening Hook",
  story:            "Product Story",
  features:         "Product Features",
  benefits:         "Benefits & Value",
  sustainability:   "Sustainability",
  useCases:         "Use Cases",
  technicalDetails: "Technical Details",
  careInstructions: "Care Instructions",
  specifications:   "Specifications",
  cta:              "Call to Action",
};

const blockPlaceholders: Record<AIBlockType, string> = {
  opening:          "e.g. Discover the perfect blend of comfort and style...",
  story:            "e.g. Born from a passion for quality, designed to last a lifetime...",
  features:         "e.g. Made with 100% organic cotton, double-stitched seams, 8 colours...",
  benefits:         "e.g. Keeps you cool in summer, durable, easy to wash...",
  sustainability:   "e.g. Made from recycled materials, carbon-neutral shipping...",
  useCases:         "e.g. Perfect for office wear, casual outings, weekend trips...",
  technicalDetails: "e.g. Voltage: 220V, Power: 60W, Frequency: 50Hz...",
  careInstructions: "e.g. Machine wash cold, do not bleach, tumble dry low...",
  specifications:   "e.g. Weight: 250g, Dimensions: 30x20cm, Material: Cotton...",
  cta:              "e.g. Order now and get free delivery on orders above ₹499...",
};

const ALL_BLOCKS: AIBlockType[] = [
  "opening", "story", "features", "benefits",
  "sustainability", "useCases", "technicalDetails",
  "careInstructions", "specifications", "cta",
];

export const defaultAIFormats: AIFormat[] = [
  {
    id: "story_driven",
    name: "Story Driven",
    description: "Emotional connection via storytelling. Perfect for premium & handcrafted products.",
    bestFor: ["Handcrafted", "Home Decor", "Gifting"],
    toneExamples: ["Warm", "Elegant", "Inspirational"],
    blocks: [
      { type: "opening", required: true },
      { type: "story", heading: "Product Story", required: true },
      { type: "features", heading: "Design Highlights", required: true },
      { type: "sustainability", heading: "Crafted With Purpose", required: false },
      { type: "specifications", heading: "Specifications", required: true },
    ],
  },
  {
    id: "benefit_focused",
    name: "Benefit Focused",
    description: "Optimised for conversions — highlights benefits, use cases & customer value.",
    bestFor: ["DTC Brands", "Everyday Products"],
    toneExamples: ["Confident", "Friendly", "Persuasive"],
    blocks: [
      { type: "opening", required: true },
      { type: "benefits", heading: "Why You'll Love It", required: true },
      { type: "features", heading: "Key Features", required: true },
      { type: "useCases", heading: "Perfect For", required: false },
      { type: "specifications", heading: "Product Details", required: true },
      { type: "cta", required: false },
    ],
  },
  {
    id: "technical_clean",
    name: "Technical & Clean",
    description: "Clear, factual & structured — builds trust and reduces confusion.",
    bestFor: ["Electronics", "Tools", "B2B"],
    toneExamples: ["Professional", "Neutral", "Clear"],
    blocks: [
      { type: "opening", required: true },
      { type: "features", heading: "Key Features", required: true },
      { type: "technicalDetails", heading: "Technical Details", required: true },
      { type: "careInstructions", heading: "Usage & Care", required: false },
      { type: "specifications", heading: "Specifications", required: true },
    ],
  },
  {
    id: "trust_social",
    name: "Trust & Social Proof",
    description: "Builds buyer confidence with use cases, care info & clear specs.",
    bestFor: ["All Categories", "New Listings", "Competitive Niches"],
    toneExamples: ["Friendly", "Trustworthy", "Clear"],
    blocks: [
      { type: "opening", required: true },
      { type: "benefits", heading: "Why Customers Love It", required: true },
      { type: "useCases", heading: "Perfect For", required: true },
      { type: "careInstructions", heading: "Care & Usage", required: false },
      { type: "specifications", heading: "Specifications", required: true },
    ],
  },
  {
    id: "seo_scannable",
    name: "SEO & Scannable",
    description: "SEO-first format designed for search visibility and fast readability.",
    bestFor: ["Large Catalogs", "Google Shopping"],
    toneExamples: ["Informative", "Clear", "Search-Optimized"],
    blocks: [
      { type: "opening", required: true },
      { type: "features", heading: "Product Features", required: true },
      { type: "benefits", heading: "Why Choose This", required: true },
      { type: "specifications", heading: "Specifications", required: true },
    ],
  },
];

const tones = [
  "Professional", "Friendly & Casual", "Luxury & Premium",
  "Technical & Detailed", "Conversational", "Urgent & Action-Oriented",
  "Educational", "Inspirational", "Playful", "Authoritative",
];

const formatIconMap: Record<string, React.ReactNode> = {
  story_driven:    <Sparkles className="w-4 h-4 text-blue-700" />,
  benefit_focused: <Target className="w-4 h-4 text-blue-700" />,
  technical_clean: <Settings className="w-4 h-4 text-blue-700" />,
  trust_social:    <Award className="w-4 h-4 text-blue-700" />,
  seo_scannable:   <TrendingUp className="w-4 h-4 text-blue-700" />,
};

type TabType = "ai" | "existing" | "custom";

// ─── Sub-components ───────────────────────────────────────────────────────────

function CharLengthBar({ length, max = 1500 }: { length: number; max?: number }) {
  const pct = Math.min(100, (length / max) * 100);
  const color = length < 100 ? "#f59e0b" : length > 1200 ? "#ef4444" : "#16a34a";
  return (
    <div className="flex flex-col gap-1 min-w-[90px]">
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold text-gray-400">{length} chars</span>
    </div>
  );
}

function StatusBadge({ length }: { length: number }) {
  if (length < 100)  return <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 whitespace-nowrap">Too Short</span>;
  if (length > 1200) return <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap">Too Long</span>;
  return <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap">Good</span>;
}

// ─── Helper: build final block list from slots + format + checklist ───────────

function buildFinalBlocks(
  slot1: AIBlockType | "none", slot2: AIBlockType | "none",
  slot3: AIBlockType | "none", slot4: AIBlockType | "none",
  formatBlocks: AIBlockType[], extraBlocks: AIBlockType[]
): AIBlockType[] {
  const slotBlocks = ([slot1, slot2, slot3, slot4] as (AIBlockType | "none")[])
    .filter((s): s is AIBlockType => s !== "none");
  const base = slotBlocks.length > 0
    ? [...slotBlocks, ...formatBlocks.filter(b => !slotBlocks.includes(b))]
    : formatBlocks;
  return [...base, ...extraBlocks.filter(b => !base.includes(b))];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DescriptionOptimization() {
  const navigate = useNavigate();

  const [products, setProducts]           = useState<Product[]>([]);
  const [loading, setLoading]             = useState(true);
  const [activeTab, setActiveTab]         = useState<TabType>("ai");
  const [selectedFormat, setSelectedFormat] = useState<AIFormat>(defaultAIFormats[0]);
  const [userFormats, setUserFormats]     = useState<AIFormat[]>([]);
  const [savedBanner, setSavedBanner]     = useState<string | null>(null);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [exampleFormatId, setExampleFormatId]   = useState<string | null>(null);
  const [floatBarVisible, setFloatBarVisible]   = useState(true);

  // Customise strip state (AI tab)
  const [selectedTone, setSelectedTone]       = useState(tones[0]);
  const [includeKeywords, setIncludeKeywords] = useState("");
  const [excludeKeywords, setExcludeKeywords] = useState("");
  const [targetLength, setTargetLength]       = useState(300);

  // Brand context
  const [brandContext, setBrandContext]               = useState("");
  const [brandContextEnabled, setBrandContextEnabled] = useState(false);

  // Section A slots (start empty — user sets them intentionally)
  const [slot1, setSlot1] = useState<AIBlockType | "none">("none");
  const [slot2, setSlot2] = useState<AIBlockType | "none">("none");
  const [slot3, setSlot3] = useState<AIBlockType | "none">("none");
  const [slot4, setSlot4] = useState<AIBlockType | "none">("none");

  // Section B extra checklist blocks
  const [extraBlocks, setExtraBlocks] = useState<AIBlockType[]>([]);

  // Per-block user draft inputs
  const [blockInputs, setBlockInputs]       = useState<Partial<Record<AIBlockType, string>>>({});
  const [expandedBlocks, setExpandedBlocks] = useState<Partial<Record<AIBlockType, boolean>>>({});

  // Custom tab state
  const [customName, setCustomName]               = useState("My Custom Format");
  const [customSlot1, setCustomSlot1]             = useState<AIBlockType | "none">("opening");
  const [customSlot2, setCustomSlot2]             = useState<AIBlockType | "none">("features");
  const [customSlot3, setCustomSlot3]             = useState<AIBlockType | "none">("none");
  const [customSlot4, setCustomSlot4]             = useState<AIBlockType | "none">("none");
  const [customExtraBlocks, setCustomExtraBlocks] = useState<AIBlockType[]>([]);
  const [customTone, setCustomTone]               = useState(tones[0]);
  const [customTargetLength, setCustomTargetLength] = useState(300);
  const [customInclude, setCustomInclude]         = useState("");
  const [customExclude, setCustomExclude]         = useState("");

  // Progress / results
  const [showProgressModal, setShowProgressModal]   = useState(false);
  const [showPreviewModal, setShowPreviewModal]     = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal]     = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  const [stats, setStats]       = useState({ averageLength: 0, seoScore: 0, improvement: 0 });

  // Classic rules
  const [classicRules, setClassicRules] = useState({
    prefix:        { enabled: false, value: "" },
    suffix:        { enabled: false, value: "" },
    findReplace:   { enabled: false, find: "", replace: "" },
    findRemove:    { enabled: false, value: "" },
    capitalization: "keep",
  });

  useEffect(() => { fetchStoredProducts(); }, []);

  const fetchStoredProducts = async () => {
    try {
      setLoading(true);
      const response = await getApi(ApiConfig.getStoredDesProduct);
      const data = response || [];
      setProducts(data);
      if (data.length > 0) {
        const avg = Math.round(data.reduce((s: number, p: Product) => s + (p.description?.length || 0), 0) / data.length);
        setStats(prev => ({ ...prev, averageLength: avg }));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const handleSelectFormat = (fmt: AIFormat) => {
    setSelectedFormat(fmt);
    setSlot1("none"); setSlot2("none"); setSlot3("none"); setSlot4("none");
    setExtraBlocks([]);
    setBlockInputs({});
    setExpandedBlocks({});
    setFloatBarVisible(true);
  };

  const toggleExtraBlock = (b: AIBlockType) =>
    setExtraBlocks(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);

  const toggleCustomExtraBlock = (b: AIBlockType) =>
    setCustomExtraBlocks(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);

  const toggleBlockExpand = (b: AIBlockType) =>
    setExpandedBlocks(prev => ({ ...prev, [b]: !prev[b] }));

  const setBlockInput = (b: AIBlockType, val: string) =>
    setBlockInputs(prev => ({ ...prev, [b]: val }));

  const buildCustomAIFormat = (): AIFormat => {
    const merged = buildFinalBlocks(customSlot1, customSlot2, customSlot3, customSlot4, [], customExtraBlocks);
    return {
      id: `custom_${Date.now()}`,
      name: customName.trim() || "My Custom Format",
      description: "Custom built description format",
      bestFor: ["Custom"],
      toneExamples: [customTone],
      allowCustom: true,
      blocks: merged.map(t => ({ type: t, required: true })),
    };
  };

  const saveAsNewFormat = (source: AIFormat) => {
    if (source.blocks.length === 0) return;
    const saved: AIFormat = { ...source, id: `user_${userFormats.length + 1}_${Date.now()}` };
    setUserFormats(prev => [...prev, saved]);
    setSelectedFormat(saved);
    setActiveTab("ai");
    setFloatBarVisible(true);
    setSavedBanner(`"${saved.name}" added to your formats!`);
    setTimeout(() => setSavedBanner(null), 3000);
  };

  // ── AI Optimization ───────────────────────────────────────────────────────────

  const runAIOptimization = async (
    fmt: AIFormat, tone: string, include: string, exclude: string,
    length: number, applyNow: boolean,
    bInputs: Partial<Record<AIBlockType, string>> = {}
  ) => {
    if (products.length === 0) return;
    setShowProgressModal(true);
    setProgress({ current: 0, total: products.length, status: "Starting AI optimization..." });
    const results: OptimizationResult[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      setProgress({ current: i + 1, total: products.length, status: `Optimizing: ${product.title || product.description?.substring(0, 40)}...` });
      try {
        const payload = {
          productId: product.productId,
          formatId: fmt.id,
          formatName: fmt.name,
          blocks: fmt.blocks.map(b => b.type),
          tone,
          includeKeywords: include.split(",").map(k => k.trim()).filter(Boolean),
          excludeKeywords: exclude.split(",").map(k => k.trim()).filter(Boolean),
          targetLength: length,
          brandContext: brandContextEnabled && brandContext.trim() ? brandContext.trim() : "",
          blockInputs: Object.fromEntries(Object.entries(bInputs).filter(([, v]) => v && v.trim())),
          apply: applyNow,
        };
        const response = await postApi(ApiConfig.aiDescriptionOptimization, payload);
        if (applyNow) {
          if (response.applied) results.push({ productId: product.productId, oldDescription: product.description || "", newDescription: response.newDescription || product.description || "", characterCount: response.newDescription?.length || 0, image: product.productImage });
        } else {
          if (response.newDescription) results.push({ productId: product.productId, oldDescription: product.description || "", newDescription: response.newDescription, characterCount: response.characterCount || response.newDescription.length, image: response.productImage || product.productImage });
        }
        await new Promise(r => setTimeout(r, 500));
      } catch {
        results.push({ productId: product.productId, oldDescription: product.description || "", newDescription: product.description || "", characterCount: product.description?.length || 0, image: product.productImage });
      }
    }

    setOptimizationResults(results);
    setShowProgressModal(false);
    if (applyNow) {
      setProgress({ current: results.filter(r => r.newDescription !== r.oldDescription).length, total: products.length, status: "completed" });
      setShowSuccessModal(true);
    } else {
      calcStats(results);
      setShowPreviewModal(true);
    }
  };

  const handleAITabOptimize = (applyNow = false) => {
    const finalBlocks = buildFinalBlocks(slot1, slot2, slot3, slot4, selectedFormat.blocks.map(b => b.type), extraBlocks);
    const fmt: AIFormat = { ...selectedFormat, blocks: finalBlocks.map(t => ({ type: t, required: true })) };
    runAIOptimization(fmt, selectedTone, includeKeywords, excludeKeywords, targetLength, applyNow, blockInputs);
  };

  const handleCustomTabOptimize = (applyNow = false) => {
    const fmt = buildCustomAIFormat();
    setSelectedFormat(fmt);
    runAIOptimization(fmt, customTone, customInclude, customExclude, customTargetLength, applyNow, blockInputs);
  };

  const handleSingleProductOptimize = async (product: Product) => {
    setShowProgressModal(true);
    setProgress({ current: 0, total: 1, status: `Optimizing: ${product.title || "product"}...` });
    try {
      const payload = {
        productId: product.productId,
        formatId: selectedFormat.id,
        formatName: selectedFormat.name,
        blocks: selectedFormat.blocks.map(b => b.type),
        tone: selectedTone,
        includeKeywords: includeKeywords.split(",").map(k => k.trim()).filter(Boolean),
        excludeKeywords: excludeKeywords.split(",").map(k => k.trim()).filter(Boolean),
        targetLength,
        brandContext: brandContextEnabled && brandContext.trim() ? brandContext.trim() : "",
        blockInputs: Object.fromEntries(Object.entries(blockInputs).filter(([, v]) => v && v.trim())),
        apply: false,
      };
      const response = await postApi(ApiConfig.aiDescriptionOptimization, payload);
      if (response.newDescription) {
        setOptimizationResults([{ productId: product.productId, oldDescription: product.description || "", newDescription: response.newDescription, characterCount: response.newDescription.length, image: response.productImage || product.productImage }]);
        setProgress({ current: 1, total: 1, status: "Done" });
        setShowProgressModal(false);
        setShowPreviewModal(true);
      } else { setShowProgressModal(false); }
    } catch { setShowProgressModal(false); }
  };

  const handleClassicOptimization = async () => {
    setShowProgressModal(true);
    setProgress({ current: 0, total: products.length, status: "Applying classic rules..." });
    const results: OptimizationResult[] = [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      let t = product.description || "";
      if (classicRules.prefix.enabled && classicRules.prefix.value) t = `${classicRules.prefix.value} ${t}`;
      if (classicRules.suffix.enabled && classicRules.suffix.value) t = `${t} ${classicRules.suffix.value}`;
      if (classicRules.findReplace.enabled && classicRules.findReplace.find) t = t.replace(new RegExp(classicRules.findReplace.find, "gi"), classicRules.findReplace.replace);
      if (classicRules.findRemove.enabled && classicRules.findRemove.value) t = t.replace(new RegExp(classicRules.findRemove.value, "gi"), "");
      switch (classicRules.capitalization) {
        case "title":    t = t.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()); break;
        case "sentence": t = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase(); break;
        case "lower":    t = t.toLowerCase(); break;
        case "upper":    t = t.toUpperCase(); break;
      }
      t = t.replace(/\s+/g, " ").trim();
      results.push({ productId: product.productId, oldDescription: product.description || "", newDescription: t, characterCount: t.length, image: product.productImage });
      setProgress({ current: i + 1, total: products.length, status: `Processing: ${product.title || "product"}...` });
    }
    setOptimizationResults(results);
    setShowProgressModal(false);
    setShowPreviewModal(true);
  };

  const applyOptimizations = async () => {
    setShowProgressModal(true);
    setProgress({ current: 0, total: optimizationResults.length, status: "Applying to Shopify..." });
    let ok = 0;
    for (let i = 0; i < optimizationResults.length; i++) {
      const r = optimizationResults[i];
      if (r.oldDescription !== r.newDescription) {
        try { await postApi(ApiConfig.updateShopifyDescription, { productId: r.productId, oldDescription: r.oldDescription, newDescription: r.newDescription }); ok++; } catch {}
      }
      setProgress({ current: i + 1, total: optimizationResults.length, status: "Updating product..." });
    }
    setShowProgressModal(false);
    setShowComparisonModal(false);
    setProgress({ current: ok, total: optimizationResults.length, status: "completed" });
    setShowSuccessModal(true);
  };

  const calcStats = (results: OptimizationResult[]) => {
    if (!results.length) return;
    const avgOld = results.reduce((s, r) => s + r.oldDescription.length, 0) / results.length;
    const avgNew = results.reduce((s, r) => s + r.newDescription.length, 0) / results.length;
    setStats({ averageLength: Math.round(avgNew), seoScore: Math.min(100, Math.round((avgNew / 800) * 100)), improvement: Math.round(((avgNew - avgOld) / (avgOld || 1)) * 100) });
  };

  if (loading) {
    return (
      <AppLayout title="Description Optimization">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Brain className="w-12 h-12 animate-pulse text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading AI optimization engine...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const exampleFmt = exampleFormatId ? [...defaultAIFormats, ...userFormats].find(f => f.id === exampleFormatId) : null;

  // ── Customise strip: build current final block list ───────────────────────
  const currentFinalBlocks = buildFinalBlocks(slot1, slot2, slot3, slot4, selectedFormat.blocks.map(b => b.type), extraBlocks);
  const currentSlotBlocks  = ([slot1, slot2, slot3, slot4] as (AIBlockType | "none")[]).filter((s): s is AIBlockType => s !== "none");
  const currentFormatBlocks = selectedFormat.blocks.map(b => b.type);

  return (
    <AppLayout title="AI Description Optimization">
      <div className="p-5 space-y-5">

        {/* ── Step Header ── */}
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-3.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-sm font-semibold text-gray-500 hover:border-blue-400 hover:text-blue-700 transition-all">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest">Step 1 of 2</p>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">Configure Description Optimization</h1>
            <p className="text-xs text-gray-500">Choose a format and settings for your selected products</p>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-800 text-white px-4 py-1.5 rounded-full text-[12.5px] font-bold shadow-md shadow-blue-900/25">
            <Package className="w-3.5 h-3.5" /> {products.length} Products
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Current Avg. Length",  value: `${stats.averageLength}`, unit: "chars", sub: stats.averageLength < 100 ? "Too short for SEO" : stats.averageLength > 1200 ? "Too long" : "Optimal range", pct: Math.min(100, (stats.averageLength / 1500) * 100), color: "bg-yellow-400" },
            { label: "Projected SEO Score",  value: `${stats.seoScore}`,      unit: "%",     sub: `AI can boost this by ${Math.round((100 - stats.seoScore) * 0.7)}%`, pct: stats.seoScore, color: "bg-blue-500" },
            { label: "Conversion Boost",     value: "45",                     unit: "%",     sub: "Based on AI-optimized patterns", pct: 45, color: "bg-emerald-500" },
            { label: "Time Saved",           value: `${products.length * 25}`,unit: "min",   sub: `That's ${Math.round((products.length * 25) / 60)} hours saved!`, pct: 100, color: "bg-purple-400" },
          ].map((s, i) => (
            <div key={i} className="bg-white border-[1.5px] border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
              <div className="text-2xl font-extrabold text-gray-900 leading-none">{s.value} <span className="text-sm font-medium text-gray-400">{s.unit}</span></div>
              <p className="text-[11px] font-bold text-gray-400 mt-0.5">{s.sub}</p>
              <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full ${s.color} transition-all`} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Main Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">

          {/* ── Left Card ── */}
          <div className="bg-white border-[1.5px] border-gray-200 rounded-xl shadow-sm overflow-hidden">

            {/* Tabs */}
            <div className="flex border-b-[1.5px] border-gray-200 px-4 bg-white">
              {(["ai", "existing", "custom"] as TabType[]).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3.5 text-[13px] font-semibold border-b-[2.5px] -mb-[1.5px] transition-all whitespace-nowrap ${activeTab === tab ? "text-blue-800 border-blue-800 font-bold" : "text-gray-400 border-transparent hover:text-blue-700"}`}>
                  {tab === "ai" ? "AI Format Templates" : tab === "existing" ? "Existing Description" : "Custom Formula"}
                </button>
              ))}
            </div>

            {/* ══════════════ AI TAB ══════════════ */}
            {activeTab === "ai" && (
              <>
                <div className="px-4 py-2.5 text-xs text-gray-500 border-b-[1.5px] border-gray-200 bg-blue-50">
                  Choose a format below, then customise the blocks, order, and content in the section below the cards.
                </div>

                {savedBanner && (
                  <div className="mx-4 mt-3 flex items-center gap-2 bg-green-50 border-[1.5px] border-green-300 rounded-lg px-3 py-2">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-[12.5px] font-bold text-green-700">{savedBanner}</span>
                  </div>
                )}

                {/* Format Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 p-4">
                  {[...defaultAIFormats, ...userFormats].map(fmt => {
                    const isOn   = selectedFormat.id === fmt.id;
                    const isUser = fmt.id.startsWith("user_");
                    const icon   = formatIconMap[fmt.id] ?? <FileText className="w-4 h-4 text-blue-700" />;
                    return (
                      <div key={fmt.id} onClick={() => handleSelectFormat(fmt)}
                        className={`relative border-[1.5px] rounded-xl p-4 cursor-pointer transition-all duration-200 flex flex-col gap-2.5 overflow-hidden ${isOn ? "border-blue-700 bg-blue-50 shadow-md shadow-blue-100" : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5"}`}>
                        <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-blue-800 transition-opacity ${isOn ? "opacity-100" : "opacity-0"}`} />
                        {isOn && <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-blue-700 rounded-full flex items-center justify-center"><CheckCircle className="w-3 h-3 text-white" /></div>}
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isOn ? "bg-blue-100" : "bg-blue-50"}`}>{icon}</div>
                          <span className={`text-sm font-extrabold ${isOn ? "text-blue-800" : "text-gray-900"}`}>{fmt.name}</span>
                        </div>
                        <p className="text-[11.5px] text-gray-500 leading-relaxed">{fmt.description}</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          {fmt.blocks.filter(b => b.required).slice(0, 3).map((b, i, arr) => (
                            <span key={b.type} className="contents">
                              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${isOn ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-blue-50 text-blue-700 border-blue-100"}`}>{blockTypeLabels[b.type]}</span>
                              {i < Math.min(arr.length - 1, 2) && <span className="text-[12px] font-bold text-gray-400">+</span>}
                            </span>
                          ))}
                          {fmt.blocks.filter(b => b.required).length > 3 && <span className="text-[11px] text-gray-400 font-semibold">+{fmt.blocks.filter(b => b.required).length - 3} more</span>}
                        </div>
                        <div className={`text-[11.5px] text-gray-600 rounded-lg px-3 py-2 border-l-[3px] border-blue-500 ${isOn ? "bg-blue-50/60" : "bg-gray-50"}`}>
                          <span className="font-bold text-blue-700">Best for: </span>{fmt.bestFor.join(", ")}
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border ${isOn ? "bg-blue-100/70 border-blue-200 text-blue-700" : "bg-gray-100 border-gray-200 text-gray-500"}`}>
                              {fmt.blocks.length} blocks · {fmt.toneExamples[0]}
                            </span>
                            {isUser && <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">✦ My Format</span>}
                          </div>
                          {isUser ? (
                            <button className="text-[11px] font-bold text-red-400 hover:text-red-600 cursor-pointer transition-colors"
                              onClick={e => { e.stopPropagation(); setUserFormats(prev => prev.filter(f => f.id !== fmt.id)); if (selectedFormat.id === fmt.id) handleSelectFormat(defaultAIFormats[0]); }}>
                              ✕ Remove
                            </button>
                          ) : (
                            <button className="text-[11.5px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
                              onClick={e => { e.stopPropagation(); setExampleFormatId(fmt.id); setShowExampleModal(true); }}>
                              <Info className="w-3 h-3" /> See Blocks
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Save as New Format card */}
                  <div onClick={() => saveAsNewFormat(selectedFormat)}
                    className="border-2 border-dashed border-blue-300 rounded-xl flex flex-col items-center justify-center gap-2 min-h-[140px] text-sm font-semibold cursor-pointer hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 text-blue-500 transition-all">
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center"><Plus className="w-5 h-5" /></div>
                    <span>Save as New Format</span>
                    <span className="text-[10.5px] font-normal text-center px-3 opacity-70">Saves your currently selected format</span>
                  </div>
                </div>

                {/* ── Customise This Format ── */}
                <div className="px-4 py-3.5 border-t-[1.5px] border-gray-200 bg-gray-50/60 space-y-4">
                  <span className="text-[13.5px] font-extrabold text-gray-800">Customise This Format</span>

                  {/* Block Tags Row */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {currentFinalBlocks.map((b, i, arr) => (
                      <span key={b} className="contents">
                        <span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 ${blockInputs[b]?.trim() ? "bg-green-100 text-green-700 border-green-300" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                          {blockInputs[b]?.trim() && <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />}
                          {blockTypeLabels[b]}
                        </span>
                        {i < arr.length - 1 && <span className="text-gray-300 font-bold">→</span>}
                      </span>
                    ))}
                    {currentFinalBlocks.length === 0 && <span className="text-[12px] text-gray-400 italic">No blocks selected</span>}
                  </div>

                  {/* Per-Block: dropdown + textarea + save */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Block Content</span>
                      <span className="text-[10.5px] text-gray-400">Empty → AI auto-generates · Filled → AI rewrites your draft</span>
                    </div>

                    {currentFinalBlocks.map((b, idx) => {
                      const isExpanded  = !!expandedBlocks[b];
                      const hasContent  = !!(blockInputs[b]?.trim());
                      const isSlot      = currentSlotBlocks.includes(b);
                      const isDefault   = currentFormatBlocks.includes(b) && !isSlot;
                      return (
                        <div key={b} className={`border-[1.5px] rounded-xl overflow-hidden transition-all duration-200 ${isExpanded ? "border-blue-400 shadow-sm shadow-blue-100" : hasContent ? "border-green-300" : "border-gray-200"}`}>
                          {/* Header */}
                          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white">
                            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                            {/* Dropdown to change block type */}
                            <select value={b}
                              onChange={e => {
                                const newBlock = e.target.value as AIBlockType;
                                const oldVal = blockInputs[b] || "";
                                setBlockInputs(prev => { const u = { ...prev }; delete u[b]; if (oldVal) u[newBlock] = oldVal; return u; });
                                setExpandedBlocks(prev => { const u = { ...prev }; const wasOpen = u[b]; delete u[b]; if (wasOpen) u[newBlock] = true; return u; });
                                setExtraBlocks(prev => prev.includes(b) ? prev.map(x => x === b ? newBlock : x) : prev);
                              }}
                              className="flex-1 px-2.5 py-1 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] font-semibold text-gray-800 outline-none focus:border-blue-500 transition-colors">
                              {ALL_BLOCKS.map(opt => <option key={opt} value={opt}>{blockTypeLabels[opt]}</option>)}
                            </select>
                            {hasContent && <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">✦ Draft</span>}
                            {isSlot    && <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 border border-blue-200">Slot</span>}
                            {isDefault && !isSlot && <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">Default</span>}
                            <button onClick={() => toggleBlockExpand(b)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${isExpanded ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-600"}`}>
                              <span className={`text-xs transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                            </button>
                          </div>

                          {/* Expandable textarea */}
                          {isExpanded && (
                            <div className="px-3 pb-3 pt-1 bg-blue-50/30 border-t border-gray-100 space-y-2">
                              <p className="text-[11px] text-gray-500 mt-1">
                                Write your draft for <span className="font-bold text-blue-700">{blockTypeLabels[b]}</span> — AI will improve it.{" "}
                                <span className="text-gray-400">Leave empty to let AI auto-generate.</span>
                              </p>
                              <textarea
                                value={blockInputs[b] || ""}
                                onChange={e => setBlockInput(b, e.target.value)}
                                rows={3}
                                placeholder={blockPlaceholders[b]}
                                className="w-full px-3 py-2.5 border-[1.5px] border-blue-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors resize-none leading-relaxed"
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-gray-400">{hasContent ? "✓ AI will use this as reference & rewrite" : "⟳ AI will auto-generate this block"}</span>
                                <div className="flex items-center gap-2">
                                  {hasContent && <button onClick={() => setBlockInput(b, "")} className="text-[11px] font-bold text-red-400 hover:text-red-600 transition-colors">Clear</button>}
                                  <button onClick={() => toggleBlockExpand(b)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-800 text-white text-[11.5px] font-bold rounded-lg transition-all">
                                    <CheckCircle className="w-3 h-3" /> Save & Close
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Section A — Ordered Slots */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Section A — Ordered Slots</span>
                      <span className="text-[10px] text-gray-400 font-normal normal-case">(override the block order)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {([
                        { label: "1st Block", val: slot1, set: setSlot1 },
                        { label: "2nd Block", val: slot2, set: setSlot2 },
                        { label: "3rd Block (optional)", val: slot3, set: setSlot3 },
                        { label: "4th Block (optional)", val: slot4, set: setSlot4 },
                      ] as { label: string; val: AIBlockType | "none"; set: (v: AIBlockType | "none") => void }[]).map(({ label, val, set }) => (
                        <div key={label} className="flex flex-col gap-1">
                          <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
                          <select value={val} onChange={e => set(e.target.value as AIBlockType | "none")}
                            className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${val !== "none" ? "border-blue-400 bg-blue-50 font-bold text-blue-800" : "border-gray-200 focus:border-blue-500"}`}>
                            <option value="none">— None —</option>
                            {ALL_BLOCKS.map(b => <option key={b} value={b}>{blockTypeLabels[b]}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider px-2">Section B — Extra Blocks</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Section B — Checklist */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_BLOCKS.map(b => {
                      const inSlots   = currentSlotBlocks.includes(b);
                      const inFormat  = currentFormatBlocks.includes(b);
                      const inExtra   = extraBlocks.includes(b);
                      const isActive  = inSlots || inFormat || inExtra;
                      return (
                        <div key={b} onClick={() => { if (!inSlots && !inFormat) toggleExtraBlock(b); }}
                          className={`flex items-center gap-2 px-3 py-2.5 border-[1.5px] rounded-lg text-[12.5px] font-semibold select-none transition-all
                            ${(inSlots || inFormat) ? "border-blue-200 bg-blue-50/60 text-blue-400 cursor-not-allowed opacity-70"
                              : inExtra ? "border-blue-600 bg-blue-50 text-blue-800 cursor-pointer"
                              : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer"}`}>
                          <div className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 transition-colors ${(inSlots || inFormat) ? "bg-blue-200 border-blue-200" : inExtra ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"}`}>
                            {isActive && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <span>{blockTypeLabels[b]}</span>
                          {inSlots  && <span className="ml-auto text-[9.5px] font-bold text-blue-400 bg-blue-100 px-1.5 py-0.5 rounded-full">Slot</span>}
                          {inFormat && !inSlots && <span className="ml-auto text-[9.5px] font-bold text-blue-400 bg-blue-100 px-1.5 py-0.5 rounded-full">Default</span>}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[10.5px] text-gray-400">Default blocks come from the selected format. Slot blocks are set via Section A. Click any unlocked block to add/remove.</p>

                  {/* Brand Context */}
                  <div className="rounded-xl border-[1.5px] border-gray-200 overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2.5 bg-white">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <Brain className="w-3.5 h-3.5 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-[13px] font-bold text-gray-800">Brand Context</p>
                          <p className="text-[10.5px] text-gray-400">Tell AI about your brand — it will weave it into descriptions</p>
                        </div>
                      </div>
                      <button onClick={() => setBrandContextEnabled(p => !p)}
                        className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${brandContextEnabled ? "bg-purple-600" : "bg-gray-300"}`}>
                        <span className={`absolute w-3.5 h-3.5 bg-white rounded-full top-[3px] shadow-sm transition-transform ${brandContextEnabled ? "translate-x-4" : "translate-x-[3px]"}`} />
                      </button>
                    </div>
                    {brandContextEnabled && (
                      <div className="px-3 pb-3 bg-purple-50/40 border-t border-gray-100">
                        <textarea
                          value={brandContext}
                          onChange={e => setBrandContext(e.target.value)}
                          rows={4}
                          maxLength={600}
                          placeholder="e.g. We are a sustainable fashion brand founded in 2018, focused on eco-friendly materials and slow fashion values. Our tone is warm, conscious and empowering. We ship worldwide and all products are ethically made in India."
                          className="w-full mt-2.5 px-3 py-2.5 border-[1.5px] border-purple-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-purple-400 transition-colors resize-none leading-relaxed"
                        />
                        <div className="flex items-center justify-between mt-1.5">
                          <p className="text-[10.5px] text-gray-400">Included in every AI generation as context.</p>
                          <span className={`text-[10.5px] font-bold ${brandContext.length > 550 ? "text-red-500" : "text-gray-400"}`}>{brandContext.length}/600</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tone / Length / Keywords */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Tone</label>
                      <select value={selectedTone} onChange={e => setSelectedTone(e.target.value)}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors">
                        {tones.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Target Length (chars)</label>
                      <input type="number" value={targetLength} onChange={e => setTargetLength(parseInt(e.target.value) || 300)}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Must Include Keywords</label>
                      <input value={includeKeywords} onChange={e => setIncludeKeywords(e.target.value)} placeholder="e.g. organic, premium"
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Exclude Keywords</label>
                      <input value={excludeKeywords} onChange={e => setExcludeKeywords(e.target.value)} placeholder="e.g. cheap, discount"
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 px-4 py-3 border-t-[1.5px] border-gray-200 bg-white items-center">
                  <button onClick={() => handleAITabOptimize(false)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-800 text-white text-[13px] font-bold transition-all shadow-sm hover:-translate-y-px">
                    <Play className="w-3.5 h-3.5" /> Generate AI Descriptions
                  </button>
                  <button onClick={() => handleAITabOptimize(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[13px] font-bold transition-all shadow-sm hover:-translate-y-px">
                    <ArrowRight className="w-3.5 h-3.5" /> Optimise & Apply Directly
                  </button>
                  <button onClick={() => saveAsNewFormat(selectedFormat)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-[1.5px] border-blue-300 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-500 text-[13px] font-bold transition-all">
                    <Plus className="w-3.5 h-3.5" /> Save as New Format
                  </button>
                </div>
              </>
            )}

            {/* ══════════════ EXISTING TAB ══════════════ */}
            {activeTab === "existing" && (
              <div className="p-4">
                {products.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Package className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-[13px] font-semibold text-gray-400">No products loaded yet</p>
                    <p className="text-[12px] text-gray-400 mt-1">Go back and select products to optimise</p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-2.5 px-1 pb-2 border-b-[1.5px] border-gray-200 mb-1" style={{ gridTemplateColumns: "44px 1fr 110px 70px 80px" }}>
                      <div />
                      <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Product</div>
                      <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Char Length</div>
                      <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Status</div>
                      <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Action</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {products.map(product => (
                        <div key={product.productId} className="grid gap-2.5 py-2.5 px-1 items-center hover:bg-gray-50 transition-colors" style={{ gridTemplateColumns: "44px 1fr 110px 70px 80px" }}>
                          <img src={product.productImage} alt={product.title || "product"} className="w-9 h-9 rounded-lg object-cover border border-gray-200 flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 truncate">{product.title || "Untitled"}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{product.description?.substring(0, 60)}...</p>
                          </div>
                          <CharLengthBar length={product.description?.length || 0} max={1500} />
                          <StatusBadge length={product.description?.length || 0} />
                          <button onClick={() => handleSingleProductOptimize(product)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-800 text-white text-[11px] font-bold transition-all whitespace-nowrap">
                            <ArrowRight className="w-2.5 h-2.5" /> Optimise
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ══════════════ CUSTOM TAB ══════════════ */}
            {activeTab === "custom" && (
              <>
                <div className="px-4 py-2.5 text-xs text-gray-500 border-b-[1.5px] border-gray-200 bg-blue-50">
                  Build your own description format from scratch — choose blocks, order, tone and content.
                </div>
                <div className="px-4 py-3.5 space-y-4">

                  <div className="flex flex-col gap-1">
                    <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Format Name</label>
                    <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g. My Brand Formula"
                      className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[13px] text-gray-800 font-semibold outline-none focus:border-blue-500 transition-colors" />
                  </div>

                  {/* Section A */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Section A — Ordered Slots</span>
                      <span className="text-[10px] text-gray-400 font-normal normal-case">(defines the order of your top blocks)</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      {([
                        { label: "1st Block", val: customSlot1, set: setCustomSlot1 },
                        { label: "2nd Block", val: customSlot2, set: setCustomSlot2 },
                        { label: "3rd Block (optional)", val: customSlot3, set: setCustomSlot3 },
                        { label: "4th Block (optional)", val: customSlot4, set: setCustomSlot4 },
                      ] as { label: string; val: AIBlockType | "none"; set: (v: AIBlockType | "none") => void }[]).map(({ label, val, set }) => (
                        <div key={label} className="flex flex-col gap-1">
                          <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">{label}</label>
                          <select value={val} onChange={e => set(e.target.value as AIBlockType | "none")}
                            className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${val !== "none" ? "border-blue-400 bg-blue-50 font-bold text-blue-800" : "border-gray-200 focus:border-blue-500"}`}>
                            <option value="none">— None —</option>
                            {ALL_BLOCKS.map(b => <option key={b} value={b}>{blockTypeLabels[b]}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider px-2">Section B — Additional Blocks</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* Section B */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {ALL_BLOCKS.map(b => {
                      const customSlots = ([customSlot1, customSlot2, customSlot3, customSlot4] as (AIBlockType | "none")[]);
                      const inSlots = customSlots.includes(b);
                      const inExtra = customExtraBlocks.includes(b);
                      return (
                        <div key={b} onClick={() => !inSlots && toggleCustomExtraBlock(b)}
                          className={`flex items-center gap-2 px-3 py-2.5 border-[1.5px] rounded-lg text-[12.5px] font-semibold select-none transition-all
                            ${inSlots ? "border-blue-200 bg-blue-50/60 text-blue-400 cursor-not-allowed opacity-60"
                              : inExtra ? "border-blue-600 bg-blue-50 text-blue-800 cursor-pointer"
                              : "border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50/40 cursor-pointer"}`}>
                          <div className={`w-4 h-4 rounded border-[1.5px] flex items-center justify-center flex-shrink-0 ${inSlots ? "bg-blue-200 border-blue-200" : inExtra ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"}`}>
                            {(inSlots || inExtra) && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <span>{blockTypeLabels[b]}</span>
                          {inSlots && <span className="ml-auto text-[9.5px] font-bold text-blue-400 bg-blue-100 px-1.5 py-0.5 rounded-full">Slot</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Tone / Length / Keywords */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Tone</label>
                      <select value={customTone} onChange={e => setCustomTone(e.target.value)}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors">
                        {tones.map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Target Length (chars)</label>
                      <input type="number" value={customTargetLength} onChange={e => setCustomTargetLength(parseInt(e.target.value) || 300)}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Must Include Keywords</label>
                      <input value={customInclude} onChange={e => setCustomInclude(e.target.value)} placeholder="e.g. organic, premium"
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Exclude Keywords</label>
                      <input value={customExclude} onChange={e => setCustomExclude(e.target.value)} placeholder="e.g. cheap, discount"
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 px-4 py-3 border-t-[1.5px] border-gray-200 bg-white items-center">
                  <button onClick={() => handleCustomTabOptimize(false)} disabled={buildFinalBlocks(customSlot1, customSlot2, customSlot3, customSlot4, [], customExtraBlocks).length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-800 text-white text-[13px] font-bold transition-all shadow-sm hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed">
                    <Play className="w-3.5 h-3.5" /> Generate AI Descriptions
                  </button>
                  <button onClick={() => handleCustomTabOptimize(true)} disabled={buildFinalBlocks(customSlot1, customSlot2, customSlot3, customSlot4, [], customExtraBlocks).length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[13px] font-bold transition-all shadow-sm hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed">
                    <ArrowRight className="w-3.5 h-3.5" /> Optimise & Apply Directly
                  </button>
                  <button onClick={() => saveAsNewFormat(buildCustomAIFormat())} disabled={buildFinalBlocks(customSlot1, customSlot2, customSlot3, customSlot4, [], customExtraBlocks).length === 0}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-[1.5px] border-blue-300 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-500 text-[13px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                    <Plus className="w-3.5 h-3.5" /> Save as New Format
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Right: Classic Rules ── */}
          <div className="bg-white border-[1.5px] border-gray-200 rounded-xl shadow-sm p-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 font-extrabold text-gray-900 text-[14px] mb-1">
                <RulerIcon className="w-4 h-4 text-gray-600" /> Classic Rules
              </div>
              <p className="text-xs text-gray-400">Manual description adjustments</p>
            </div>
            <div className="grid grid-cols-2 gap-px bg-gray-200 border-[1.5px] border-gray-200 rounded-lg overflow-hidden">
              {(["prefix", "suffix"] as const).map(key => (
                <div key={key} className="bg-white px-3 py-2.5 flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-gray-800 capitalize">{key}</span>
                  <button onClick={() => setClassicRules({ ...classicRules, [key]: { ...classicRules[key], enabled: !classicRules[key].enabled } })}
                    className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${classicRules[key].enabled ? "bg-blue-600" : "bg-gray-300"}`}>
                    <span className={`absolute w-3.5 h-3.5 bg-white rounded-full top-[3px] shadow-sm transition-transform ${classicRules[key].enabled ? "translate-x-4" : "translate-x-[3px]"}`} />
                  </button>
                </div>
              ))}
            </div>
            {classicRules.prefix.enabled && <input value={classicRules.prefix.value} onChange={e => setClassicRules({ ...classicRules, prefix: { ...classicRules.prefix, value: e.target.value } })} placeholder="e.g., Introducing:" className="w-full px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12.5px] outline-none focus:border-blue-500" />}
            {classicRules.suffix.enabled && <input value={classicRules.suffix.value} onChange={e => setClassicRules({ ...classicRules, suffix: { ...classicRules.suffix, value: e.target.value } })} placeholder="e.g., - Shop Now" className="w-full px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12.5px] outline-none focus:border-blue-500" />}
            <div>
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-[13px] font-semibold text-gray-800">Find &amp; Replace</span>
                <button onClick={() => setClassicRules({ ...classicRules, findReplace: { ...classicRules.findReplace, enabled: !classicRules.findReplace.enabled } })}
                  className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${classicRules.findReplace.enabled ? "bg-blue-600" : "bg-gray-300"}`}>
                  <span className={`absolute w-3.5 h-3.5 bg-white rounded-full top-[3px] shadow-sm transition-transform ${classicRules.findReplace.enabled ? "translate-x-4" : "translate-x-[3px]"}`} />
                </button>
              </div>
              {classicRules.findReplace.enabled && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input value={classicRules.findReplace.find} onChange={e => setClassicRules({ ...classicRules, findReplace: { ...classicRules.findReplace, find: e.target.value } })} placeholder="Find" className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12.5px] outline-none focus:border-blue-500" />
                  <input value={classicRules.findReplace.replace} onChange={e => setClassicRules({ ...classicRules, findReplace: { ...classicRules.findReplace, replace: e.target.value } })} placeholder="Replace with" className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12.5px] outline-none focus:border-blue-500" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-[13px] font-semibold text-gray-800">Find &amp; Remove</span>
                <button onClick={() => setClassicRules({ ...classicRules, findRemove: { ...classicRules.findRemove, enabled: !classicRules.findRemove.enabled } })}
                  className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${classicRules.findRemove.enabled ? "bg-blue-600" : "bg-gray-300"}`}>
                  <span className={`absolute w-3.5 h-3.5 bg-white rounded-full top-[3px] shadow-sm transition-transform ${classicRules.findRemove.enabled ? "translate-x-4" : "translate-x-[3px]"}`} />
                </button>
              </div>
              {classicRules.findRemove.enabled && <input value={classicRules.findRemove.value} onChange={e => setClassicRules({ ...classicRules, findRemove: { ...classicRules.findRemove, value: e.target.value } })} placeholder="Text to remove" className="w-full mt-2 px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12.5px] outline-none focus:border-blue-500" />}
            </div>
            <div>
              <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Capitalization</p>
              <select value={classicRules.capitalization} onChange={e => setClassicRules({ ...classicRules, capitalization: e.target.value })}
                className="w-full px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors">
                <option value="keep">Keep Original</option>
                <option value="title">Title Case</option>
                <option value="upper">ALL CAPS</option>
                <option value="lower">lowercase</option>
                <option value="sentence">Sentence case</option>
              </select>
            </div>
            <button onClick={handleClassicOptimization}
              className="w-full py-2.5 bg-gray-900 hover:bg-blue-800 text-white rounded-xl font-extrabold text-[13.5px] flex items-center justify-center gap-2 transition-all shadow-md hover:-translate-y-0.5">
              <Zap className="w-3.5 h-3.5" /> Apply Classic Rules
            </button>
          </div>
        </div>
      </div>

      {/* ── FLOATING BAR ── */}
      {/* <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1a2e] rounded-2xl px-5 py-3.5 flex items-center gap-4 shadow-2xl z-50 transition-all duration-500 whitespace-nowrap min-w-[500px] ${floatBarVisible ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-20 pointer-events-none"}`}
        style={{ transform: `translateX(-50%) translateY(${floatBarVisible ? "0" : "80px"})` }}>
        <div className="text-white text-[14px] font-bold">
          <span className="text-white/50 font-medium text-[13.5px]">{selectedFormat.name}</span> selected
          <span className="text-white/50 font-normal"> · Ready for Description Optimisation</span>
        </div>
        <button onClick={() => handleAITabOptimize(false)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-5 py-2.5 font-extrabold text-[14px] shadow-lg shadow-purple-700/40 transition-all hover:-translate-y-px ml-auto">
          Continue to Optimisation <ArrowRight className="w-4 h-4" />
        </button>
        <button onClick={() => setFloatBarVisible(false)} className="text-white/40 hover:text-white/80 text-[13px] font-semibold cursor-pointer transition-colors">Clear</button>
      </div> */}

      {/* ── EXAMPLE MODAL ── */}
      {showExampleModal && exampleFmt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={() => setShowExampleModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-[480px] w-[92%] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-extrabold text-gray-900">{exampleFmt.name} — Content Blocks</h3>
              <button onClick={() => setShowExampleModal(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>
            <p className="text-[12px] text-gray-500 mb-3">{exampleFmt.description}</p>
            <div className="space-y-2 mb-4">
              {exampleFmt.blocks.map((b, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-[13px] font-semibold text-gray-700">{b.heading || blockTypeLabels[b.type]}</span>
                  {b.required && <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Required</span>}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowExampleModal(false)} className="flex-1 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-[13px] font-bold text-gray-500">Close</button>
              <button onClick={() => { handleSelectFormat(exampleFmt); setShowExampleModal(false); }} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-800 text-white rounded-lg text-[13px] font-bold transition-colors">Use This Format</button>
            </div>
          </div>
        </div>
      )}

      {/* ── PROGRESS MODAL ── */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin text-blue-500" /> AI is Working Its Magic</DialogTitle>
            <DialogDescription>Analysing and optimising your product descriptions...</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Progress value={(progress.current / progress.total) * 100} className="h-2" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">{progress.status}</p>
              <p className="text-xs text-gray-500 mt-1">{progress.current} of {progress.total} products processed</p>
            </div>
            <div className="flex justify-center"><Brain className="w-12 h-12 text-blue-500 animate-pulse" /></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── PREVIEW MODAL ── */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" /> AI Generated Descriptions Preview</DialogTitle>
            <DialogDescription>Review the AI-optimised descriptions before applying them to your store</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {optimizationResults.map(result => (
              <div key={result.productId} className="p-4 border rounded-lg bg-white">
                <div className="flex items-start gap-4">
                  <img src={result.image} alt="" className="w-16 h-16 rounded-lg object-cover border flex-shrink-0" />
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 flex items-center gap-2">Original <Badge variant="outline" className="text-xs">{result.oldDescription.length} chars</Badge></Label>
                        <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 max-h-40 overflow-y-auto">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.oldDescription}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 mb-1 flex items-center gap-2">AI Optimised <Badge variant="outline" className="text-xs">{result.newDescription.length} chars</Badge></Label>
                        <div className="p-3 border border-blue-200 rounded-lg bg-blue-50 max-h-40 overflow-y-auto">
                          <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{result.newDescription}</p>
                        </div>
                      </div>
                    </div>
                    {result.oldDescription !== result.newDescription && (
                      <div className="mt-3 flex items-center gap-3">
                        <Badge variant="default" className="text-xs">{result.newDescription.length > result.oldDescription.length ? "Expanded" : "Condensed"}</Badge>
                        <span className="text-xs text-gray-600">{Math.abs(result.newDescription.length - result.oldDescription.length)} chars {result.newDescription.length > result.oldDescription.length ? "added" : "removed"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPreviewModal(false)}>Cancel</Button>
            <Button onClick={() => { setShowPreviewModal(false); calcStats(optimizationResults); setShowComparisonModal(true); }} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2">
              <TrendingUp className="w-4 h-4" /> See Improvements & Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── COMPARISON MODAL ── */}
      <Dialog open={showComparisonModal} onOpenChange={setShowComparisonModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" /> Optimisation Results</DialogTitle>
            <DialogDescription>Here's how much better your descriptions will perform</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="border rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-900">{stats.improvement > 0 ? "+" : ""}{stats.improvement}%</div>
                <p className="text-sm text-gray-600 mt-1">SEO Improvement</p>
              </div>
              <div className="border rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-gray-900">{stats.averageLength}</div>
                <p className="text-sm text-gray-600 mt-1">Avg. Character Length</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-gray-700"><span className="font-semibold">Your new descriptions are {Math.abs(stats.improvement)}% better</span> and optimised for search & conversions.</p>
              <p className="text-sm text-gray-500 mt-2">Expected conversion rate increase: <span className="font-medium text-green-600">Up to 45%</span></p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" />What you're getting:</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>✓ SEO-optimised for better search rankings</li>
                <li>✓ Higher conversion rates on product pages</li>
                <li>✓ Consistent brand voice across all products</li>
                <li>✓ Mobile-friendly description structure</li>
                <li>✓ Engaging storytelling and benefit-focused content</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowComparisonModal(false)}>Cancel</Button>
            <Button onClick={applyOptimizations} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2">
              <Save className="w-4 h-4" /> Apply All Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── SUCCESS MODAL ── */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-green-500" />Success!</DialogTitle>
            <DialogDescription>Your product descriptions have been optimised successfully</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Optimisation Complete!</h3>
              <p className="text-gray-600">{progress.current} of {progress.total} product descriptions were successfully updated.</p>
              {progress.total - progress.current > 0 && <p className="text-sm text-amber-600 mt-2">{progress.total - progress.current} products failed to update</p>}
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-4">
              <p className="text-sm text-gray-700"><span className="font-semibold">Pro Tip:</span> Monitor your analytics in the next 7–14 days to see the impact on organic traffic and conversions.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => navigate("/")} className="flex-1">Go to Dashboard</Button>
            <Button onClick={() => { setShowSuccessModal(false); fetchStoredProducts(); }} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">Optimise More Products</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
} 