import { useState, useEffect, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Brain,
  Zap,
  Sparkles,
  TrendingUp,
  Target,
  CheckCircle,
  RefreshCw,
  Save,
  Play,
  Plus,
  Crown,
  Award,
  Trophy,
  RulerIcon,
  Search,
  ArrowRight,
  ChevronLeft,
  Info,
  Package,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

interface Product {
  _id: string;
  productId: string;
  title: string;
  productImage: string;
  handle: string;
  status: string;
}

interface AIFormat {
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

interface OptimizationResult {
  productId: string;
  oldTitle: string;
  newTitle: string;
  characterCount: number;
  image: string;
}

const defaultAIFormats: AIFormat[] = [
  {
    id: 1,
    categoryName: "Keyword + Feature + Type",
    primaryElement: "Product Name",
    secondaryElement: "Key Features",
    thirdElement: "Product Type",
    fourthElement: "none",
    tone: "Professional",
    brandFocused: false,
    minCharacters: 40,
    maxCharacters: 65,
    mustIncludeKeywords: [],
    excludeKeywords: [],
  },
  {
    id: 2,
    categoryName: "Brand + Keyword + USP",
    primaryElement: "Product Name",
    secondaryElement: "Brand Name",
    thirdElement: "USP (Unique Selling Proposition)",
    fourthElement: "none",
    tone: "Authoritative",
    brandFocused: true,
    minCharacters: 45,
    maxCharacters: 70,
    mustIncludeKeywords: [],
    excludeKeywords: [],
  },
  {
    id: 3,
    categoryName: "Audience + Problem + Product",
    primaryElement: "Product Name",
    secondaryElement: "Target Audience",
    thirdElement: "Problem Solution",
    fourthElement: "none",
    tone: "Conversational",
    brandFocused: false,
    minCharacters: 45,
    maxCharacters: 70,
    mustIncludeKeywords: [],
    excludeKeywords: [],
  },
  {
    id: 4,
    categoryName: "Product Name First ⭐",
    primaryElement: "Product Name",
    secondaryElement: "Key Features",
    thirdElement: "Target Audience",
    fourthElement: "none",
    tone: "Friendly & Casual",
    brandFocused: false,
    minCharacters: 45,
    maxCharacters: 70,
    mustIncludeKeywords: [],
    excludeKeywords: [],
  },
  {
    id: 5,
    categoryName: "Material + Name + Use Case",
    primaryElement: "Product Name",
    secondaryElement: "Material/Composition",
    thirdElement: "Use Case",
    fourthElement: "none",
    tone: "Technical & Detailed",
    brandFocused: false,
    minCharacters: 45,
    maxCharacters: 70,
    mustIncludeKeywords: [],
    excludeKeywords: [],
  },
];

// All 15 formula options for the Custom Formula dropdown
const allFormulaOptions = [
  { id: 1,  label: "1. Keyword + Key Feature + Product Type",                    pattern: "{Primary Keyword} {Key Feature} {Product Type}",                           example: "Waterproof Lightweight Men's Running Shoes" },
  { id: 2,  label: "2. Brand + Primary Keyword + USP",                           pattern: "{Brand Name} {Primary Keyword} – {USP}",                                   example: "Nike Men's Training Shoes – Anti-Slip & Breathable" },
  { id: 3,  label: "3. Primary Keyword + Size/Quantity + Product Type",          pattern: "{Primary Keyword} {Size/Quantity} {Product Type}",                         example: "100% Organic Cotton King Size Bed Sheet Set" },
  { id: 4,  label: "4. Target Audience + Problem Solved + Product",              pattern: "For {Target Audience} – {Problem Solved} {Product Name}",                  example: "For Diabetics – Sugar-Free Dark Chocolate Bars" },
  { id: 5,  label: "5. Material + Product Name + Use Case",                      pattern: "{Material} {Product Name} for {Use Case}",                                 example: "Stainless Steel Water Bottle for Gym & Outdoor Travel" },
  { id: 6,  label: "6. Number/Quantity + Keyword + Benefit",                     pattern: "Pack of {Quantity} {Primary Keyword} for {Benefit}",                       example: "Pack of 12 Vitamin C Tablets for Immune Boost" },
  { id: 7,  label: "7. Adjective + Keyword + Feature + Category",                pattern: "{Adjective} {Primary Keyword} {Key Feature} {Category}",                   example: "Premium Wireless Noise-Cancelling Bluetooth Headphones" },
  { id: 8,  label: "8. Primary Keyword + Color/Size Variant + Brand",            pattern: "{Primary Keyword} {Color/Size} – By {Brand Name}",                         example: "Leather Crossbody Bag Black Medium – By Fossil" },
  { id: 9,  label: "9. Use Case + Product + Key Specification",                  pattern: "{Use Case} {Product Name} {Key Specification}",                            example: "Office Desk Chair Ergonomic with Lumbar Support 360° Swivel" },
  { id: 10, label: "10. Trending Keyword + Product + Unique Selling Point",      pattern: "{Trending Keyword} {Product Name} with {USP}",                             example: "Aesthetic Minimalist Desk Lamp with USB Charging Port" },
  { id: 11, label: "11. Product Name First + Key Feature + Audience ⭐ Popular", pattern: "{Product Name} – {Key Feature} for {Target Audience}",                    example: "Air Jordan Sneakers – Lightweight & Cushioned for Men" },
  { id: 12, label: "12. Product Name + Material + Best Use",                     pattern: "{Product Name} – {Material} for {Best Use}",                              example: "Yoga Mat – Non-Slip Natural Rubber for Home & Gym" },
  { id: 13, label: "13. Product Name + Size/Variant + Benefit",                  pattern: "{Product Name} {Size/Variant} – {Benefit}",                               example: "Face Serum 30ml – Brightening & Anti-Aging Formula" },
  { id: 14, label: "14. Product Name + Who It's For + Key Specification",        pattern: "{Product Name} for {Target Audience} – {Key Specification}",              example: "Backpack for College Students – 40L Waterproof with USB Port" },
  { id: 15, label: "15. Product Name + Occasion + Unique Feature",               pattern: "{Product Name} for {Occasion} – {Unique Feature}",                        example: "Silk Dress for Wedding – Elegant Floral Print with Pockets" },
];

const templateConfig: Record<
  number,
  { icon: React.ReactNode; example: string; formulaTags: string[]; formulaPattern: string }
> = {
  1: {
    icon: <Search className="w-4 h-4 text-blue-700" />,
    formulaTags: ["Primary Keyword", "Key Feature", "Product Type"],
    formulaPattern: "{Primary Keyword} {Key Feature} {Product Type}",
    example: "Waterproof Lightweight Men's Running Shoes",
  },
  2: {
    icon: <Crown className="w-4 h-4 text-blue-700" />,
    formulaTags: ["Brand Name", "Primary Keyword", "USP"],
    formulaPattern: "{Brand Name} {Primary Keyword} – {USP}",
    example: "Nike Men's Training Shoes – Anti-Slip & Breathable",
  },
  3: {
    icon: <Target className="w-4 h-4 text-blue-700" />,
    formulaTags: ["Target Audience", "Problem Solved", "Product"],
    formulaPattern: "For {Target Audience} – {Problem Solved} {Product Name}",
    example: "For Diabetics – Sugar-Free Dark Chocolate Bars",
  },
  4: {
    icon: <Sparkles className="w-4 h-4 text-blue-700" />,
    formulaTags: ["Product Name", "Key Feature", "Target Audience"],
    formulaPattern: "{Product Name} – {Key Feature} for {Target Audience}",
    example: "Air Jordan Sneakers – Lightweight & Cushioned for Men",
  },
  5: {
    icon: <Package className="w-4 h-4 text-blue-700" />,
    formulaTags: ["Material", "Product Name", "Use Case"],
    formulaPattern: "{Material} {Product Name} for {Use Case}",
    example: "Stainless Steel Water Bottle for Gym & Outdoor Travel",
  },
};

const secondaryElements = [
  "Key Features",
  "Brand Name",
  "Material/Composition",
  "Specifications",
  "Target Audience",
  "USP (Unique Selling Proposition)",
  "Problem Solution",
  "Social Proof",
  "Value Proposition",
  "Use Case",
  "Color/Size Variant",
  "Occasion",
  "Quantity/Pack Size",
];

// Unified list for all 4 slots — every slot can be anything
const allSlotElements = [
  "Product Name",
  "Brand Name",
  "Primary Keyword",
  "Key Features",
  "Target Audience",
  "Material/Composition",
  "Specifications",
  "USP (Unique Selling Proposition)",
  "Problem Solution",
  "Social Proof",
  "Value Proposition",
  "Use Case",
  "Color/Size Variant",
  "Occasion",
  "Quantity/Pack Size",
  "Quality Indicator",
  "Differentiator",
  "Benefit",
  "Main Benefit",
  "Emotional Trigger",
  "Trending Keyword",
  "Seasonal Theme",
];

// Returns true only if Product Name is in at least one of the 4 slots
const hasProductName = (fmt: AIFormat): boolean =>
  fmt.primaryElement === "Product Name" ||
  fmt.secondaryElement === "Product Name" ||
  fmt.thirdElement === "Product Name" ||
  fmt.fourthElement === "Product Name";

const tones = [
  "Professional", "Friendly & Casual", "Luxury & Premium", "Technical & Detailed",
  "Conversational", "Urgent & Action-Oriented", "Educational", "Inspirational",
  "Playful", "Authoritative",
];

type TabType = "ai" | "existing" | "custom";

interface OptimizationContextChoice {
  image: boolean;
  title: boolean;
}

type PendingOptimization =
  | { type: "bulk"; format: AIFormat; applyNow: boolean }
  | { type: "single"; format: AIFormat; product: Product };

function CharLengthBar({ length, max = 100 }: { length: number; max?: number }) {
  const pct = Math.min(100, (length / max) * 100);
  const color = length < 35 ? "#f59e0b" : length > 85 ? "#ef4444" : "#16a34a";
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
  if (length < 35) return <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 whitespace-nowrap">Too Short</span>;
  if (length > 85) return <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 whitespace-nowrap">Too Long</span>;
  return <span className="text-[10.5px] font-extrabold px-2 py-0.5 rounded-full bg-green-100 text-green-700 whitespace-nowrap">Good</span>;
}

export default function TitleOptimization() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("ai");
  const [selectedFormat, setSelectedFormat] = useState<AIFormat>(defaultAIFormats[0]);
  const [showExampleModal, setShowExampleModal] = useState(false);
  const [exampleFormatId, setExampleFormatId] = useState<number | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [pendingOptimization, setPendingOptimization] = useState<PendingOptimization | null>(null);
  const [contextChoice, setContextChoice] = useState<OptimizationContextChoice>({ image: true, title: true });
  const [shareExampleTitles, setShareExampleTitles] = useState(false);
  const [exampleTitleInput, setExampleTitleInput] = useState("");
  const [exampleTitles, setExampleTitles] = useState<string[]>([]);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  const [stats, setStats] = useState({ averageLength: 0, seoScore: 0, keywordDensity: 0, improvement: 0 });
  const [floatBarVisible, setFloatBarVisible] = useState(true);
  const [savedTemplateBanner, setSavedTemplateBanner] = useState<string | null>(null);

  // User-created templates (added via "New Template" button)
  const [userTemplates, setUserTemplates] = useState<AIFormat[]>([]);

  // Custom Formula tab has its own independent builder state
  const [customFormula, setCustomFormula] = useState<AIFormat>({
    id: 9000,
    categoryName: "My Custom Formula",
    primaryElement: "Product Name",
    secondaryElement: "Key Features",
    thirdElement: "none",
    fourthElement: "none",
    tone: "Professional",
    brandFocused: false,
    minCharacters: 50,
    maxCharacters: 70,
    mustIncludeKeywords: [],
    excludeKeywords: [],
  });

  // Build a live formula pattern string from the 4 selected elements
  const buildFormulaPattern = (fmt: AIFormat): string => {
    const parts = [
      `{${fmt.primaryElement}}`,
      `{${fmt.secondaryElement}}`,
      fmt.thirdElement && fmt.thirdElement !== "none" ? `{${fmt.thirdElement}}` : null,
      fmt.fourthElement && fmt.fourthElement !== "none" ? `{${fmt.fourthElement}}` : null,
    ].filter(Boolean);
    return parts.join(" + ");
  };

  const addExampleTitle = (title: string) => {
    const cleanedTitle = title.trim();
    if (!cleanedTitle) return;
    setExampleTitles((prev) => (prev.includes(cleanedTitle) ? prev : [...prev, cleanedTitle]));
  };

  const removeExampleTitle = (title: string) => {
    setExampleTitles((prev) => prev.filter((item) => item !== title));
  };

  const handleExampleTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addExampleTitle(exampleTitleInput);
    setExampleTitleInput("");
  };

  const buildExampleTitlePayload = () =>
    shareExampleTitles && exampleTitles.length > 0
      ? { exampleButton: true, examples: exampleTitles }
      : { exampleButton: false as const };

  // Save current formula (from either AI tab or Custom tab) as a new user template card
  const saveAsNewTemplate = (source: AIFormat) => {
    if (!hasProductName(source)) return;
    const newId = 9000 + userTemplates.length + 1;
    const name = source.categoryName.trim() || `My Template ${userTemplates.length + 1}`;
    const saved: AIFormat = { ...source, id: newId, categoryName: name };
    setUserTemplates((prev) => [...prev, saved]);
    // Auto-select it and switch to AI tab so user can see it
    setSelectedFormat(saved);
    setActiveTab("ai");
    setFloatBarVisible(true);
    setSavedTemplateBanner(`"${name}" added to your templates!`);
    setTimeout(() => setSavedTemplateBanner(null), 3000);
  };

  const [classicRules, setClassicRules] = useState({
    prefix: { enabled: false, value: "" },
    suffix: { enabled: false, value: "" },
    findReplace: { enabled: false, find: "", replace: "" },
    findRemove: { enabled: false, value: "" },
    capitalization: "keep",
  });

  useEffect(() => {
    fetchStoredProducts();
  }, []);

  const fetchStoredProducts = async () => {
    try {
      setLoading(true);
      const response = await getApi(ApiConfig.getStoredProduct);
      const productsData = response || [];
      setProducts(productsData);
      if (productsData.length > 0) {
        const avgLength = Math.round(
          productsData.reduce((sum: number, p: Product) => sum + p.title.length, 0) / productsData.length
        );
        setStats((prev) => ({ ...prev, averageLength: avgLength }));
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const requestAIOptimization = (format: AIFormat, applyNow = false) => {
    if (!format || products.length === 0) return;
    setPendingOptimization({ type: "bulk", format, applyNow });
    setContextChoice({ image: true, title: true });
    setShowContextModal(true);
  };

  const requestSingleProductOptimize = (product: Product) => {
    if (!selectedFormat) return;
    setPendingOptimization({ type: "single", format: selectedFormat, product });
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
      handleAIOptimization(optimization.format, optimization.applyNow, selectedContext);
      return;
    }

    handleSingleProductOptimize(optimization.product, optimization.format, selectedContext);
  };

  const handleAIOptimization = async (
    format: AIFormat,
    applyNow = false,
    selectedContext: OptimizationContextChoice = { image: true, title: true }
  ) => {
    if (!format || products.length === 0) return;
    setShowProgressModal(true);
    setProgress({ current: 0, total: products.length, status: "Starting AI optimization..." });
    const results: OptimizationResult[] = [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      setProgress({ current: i + 1, total: products.length, status: `Optimizing: ${product.title}` });
      try {
        const payload = {
          productId: product.productId,
          categoryName: format.categoryName,
          minCharacters: format.minCharacters,
          maxCharacters: format.maxCharacters,
          primaryElement: format.primaryElement,
          secondaryElement: format.secondaryElement,
          thirdElement: format.thirdElement !== "none" ? format.thirdElement : "",
          fourthElement: format.fourthElement !== "none" ? format.fourthElement : "",
          formulaPattern: buildFormulaPattern(format),
          brandFocused: format.brandFocused,
          tone: format.tone,
          mustIncludeKeywords: format.mustIncludeKeywords.join(","),
          excludeKeywords: format.excludeKeywords.join(","),
          image: selectedContext.image,
          title: selectedContext.title,
          apply: applyNow,
          ...buildExampleTitlePayload(),
        };
        const response = await postApi(ApiConfig.aiTitleOptimization, payload);
        if (applyNow) {
          if (response.applied) {
            results.push({ productId: product.productId, oldTitle: product.title, newTitle: response.newTitle || product.title, characterCount: response.newTitle?.length || 0, image: product.productImage });
          }
        } else {
          if (response.newTitle) {
            results.push({ productId: product.productId, oldTitle: product.title, newTitle: response.newTitle, characterCount: response.characterCount || response.newTitle.length, image: response.productImage || product.productImage });
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch {
        results.push({ productId: product.productId, oldTitle: product.title, newTitle: product.title, characterCount: product.title.length, image: product.productImage });
      }
    }
    setOptimizationResults(results);
    setShowProgressModal(false);
    if (applyNow) {
      const successful = results.filter((r) => r.newTitle !== r.oldTitle).length;
      setProgress({ current: successful, total: products.length, status: "completed" });
      setShowSuccessModal(true);
    } else {
      calculateComparisonStats(results);
      setShowPreviewModal(true);
    }
  };

  const handleClassicOptimization = async () => {
    setShowProgressModal(true);
    setProgress({ current: 0, total: products.length, status: "Applying classic optimization rules..." });
    const results: OptimizationResult[] = [];
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      let newTitle = product.title;
      if (classicRules.prefix.enabled && classicRules.prefix.value) newTitle = `${classicRules.prefix.value} ${newTitle}`;
      if (classicRules.suffix.enabled && classicRules.suffix.value) newTitle = `${newTitle} ${classicRules.suffix.value}`;
      if (classicRules.findReplace.enabled && classicRules.findReplace.find) {
        const regex = new RegExp(classicRules.findReplace.find, "gi");
        newTitle = newTitle.replace(regex, classicRules.findReplace.replace);
      }
      if (classicRules.findRemove.enabled && classicRules.findRemove.value) {
        const regex = new RegExp(classicRules.findRemove.value, "gi");
        newTitle = newTitle.replace(regex, "");
      }
      switch (classicRules.capitalization) {
        case "title": newTitle = newTitle.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()); break;
        case "sentence": newTitle = newTitle.charAt(0).toUpperCase() + newTitle.slice(1).toLowerCase(); break;
        case "lower": newTitle = newTitle.toLowerCase(); break;
        case "upper": newTitle = newTitle.toUpperCase(); break;
      }
      newTitle = newTitle.replace(/\s+/g, " ").trim();
      results.push({ productId: product.productId, oldTitle: product.title, newTitle, characterCount: newTitle.length, image: product.productImage });
      setProgress({ current: i + 1, total: products.length, status: `Processing: ${product.title}` });
    }
    setOptimizationResults(results);
    setShowProgressModal(false);
    setShowPreviewModal(true);
  };

  const applyOptimizations = async () => {
    setShowProgressModal(true);
    setProgress({ current: 0, total: optimizationResults.length, status: "Applying optimizations to Shopify..." });
    let successCount = 0;
    for (let i = 0; i < optimizationResults.length; i++) {
      const result = optimizationResults[i];
      if (result.oldTitle !== result.newTitle) {
        try {
          await postApi(ApiConfig.updateShopifyTitle, { productId: result.productId, oldTitle: result.oldTitle, newTitle: result.newTitle });
          successCount++;
        } catch { /* ignore */ }
      }
      setProgress({ current: i + 1, total: optimizationResults.length, status: `Updating: ${result.oldTitle}` });
    }
    setShowProgressModal(false);
    setShowComparisonModal(false);
    setProgress({ current: successCount, total: optimizationResults.length, status: "completed" });
    setShowSuccessModal(true);
  };

  const handleSingleProductOptimize = async (
    product: Product,
    format: AIFormat,
    selectedContext: OptimizationContextChoice = { image: true, title: true }
  ) => {
    if (!format) return;
    setShowProgressModal(true);
    setProgress({ current: 0, total: 1, status: `Optimizing: ${product.title}` });
    try {
        const payload = {
          productId: product.productId,
          categoryName: format.categoryName,
        minCharacters: format.minCharacters,
        maxCharacters: format.maxCharacters,
        primaryElement: format.primaryElement,
        secondaryElement: format.secondaryElement,
        thirdElement: format.thirdElement !== "none" ? format.thirdElement : "",
        fourthElement: format.fourthElement !== "none" ? format.fourthElement : "",
        formulaPattern: buildFormulaPattern(format),
        brandFocused: format.brandFocused,
        tone: format.tone,
          mustIncludeKeywords: format.mustIncludeKeywords.join(","),
          excludeKeywords: format.excludeKeywords.join(","),
          image: selectedContext.image,
          title: selectedContext.title,
          apply: false,
          ...buildExampleTitlePayload(),
        };
      const response = await postApi(ApiConfig.aiTitleOptimization, payload);
      if (response.newTitle) {
        setOptimizationResults([{
          productId: product.productId,
          oldTitle: product.title,
          newTitle: response.newTitle,
          characterCount: response.characterCount || response.newTitle.length,
          image: response.productImage || product.productImage,
        }]);
        setProgress({ current: 1, total: 1, status: "Done" });
        setShowProgressModal(false);
        setShowPreviewModal(true);
      } else {
        setShowProgressModal(false);
      }
    } catch (error) {
      console.error("Error optimizing product:", error);
      setShowProgressModal(false);
    }
  };

  const getPositiveImprovement = (oldValue: number, newValue: number) => {
    if (oldValue <= 0) return 0;
    return Math.abs(Math.round(((newValue - oldValue) / oldValue) * 100));
  };

  const calculateComparisonStats = (results: OptimizationResult[]) => {
    if (results.length === 0) return;
    const avgOldLength = results.reduce((sum, r) => sum + r.oldTitle.length, 0) / results.length;
    const avgNewLength = results.reduce((sum, r) => sum + r.newTitle.length, 0) / results.length;
    const seoScore = Math.min(100, Math.round((avgNewLength / 80) * 100));
    const keywordDensity = Math.min(100, Math.round((results.filter((r) => r.newTitle.toLowerCase().includes(r.oldTitle.toLowerCase().split(" ")[0])).length / results.length) * 100));
    const improvement = getPositiveImprovement(avgOldLength, avgNewLength);
    setStats({ averageLength: Math.round(avgNewLength), seoScore, keywordDensity, improvement });
  };

  if (loading) {
    return (
      <AppLayout title="Title Optimization">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Brain className="w-12 h-12 animate-pulse text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading AI optimization engine...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const exampleFormat = exampleFormatId ? templateConfig[exampleFormatId] : null;
  const exampleFormatData = exampleFormatId ? defaultAIFormats.find((f) => f.id === exampleFormatId) : null;

  return (
    <AppLayout title="AI Title Optimization">
      <div className="p-5 space-y-5">

        {/* Step Header */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-sm font-semibold text-gray-500 hover:border-blue-400 hover:text-blue-700 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest">Step 1 of 2</p>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">Configure Optimization</h1>
            <p className="text-xs text-gray-500">Choose a template and settings for your selected products</p>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-800 text-white px-4 py-1.5 rounded-full text-[12.5px] font-bold shadow-md shadow-blue-900/25">
            <Package className="w-3.5 h-3.5" /> {products.length} Products
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border-[1.5px] border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current Avg. Length</p>
            <div className="text-2xl font-extrabold text-gray-900 leading-none">
              {stats.averageLength} <span className="text-sm font-medium text-gray-400">chars</span>
            </div>
            <p className="text-[11px] font-bold text-yellow-600 mt-0.5">{stats.averageLength < 50 ? "Too short for SEO" : stats.averageLength > 80 ? "Too long for mobile" : "Optimal range"}</p>
            <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full rounded-full bg-yellow-400 transition-all" style={{ width: `${Math.min(100, (stats.averageLength / 100) * 100)}%` }} />
            </div>
          </div>
          <div className="bg-white border-[1.5px] border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Projected SEO Score</p>
            <div className="text-2xl font-extrabold text-gray-900 leading-none">
              {stats.seoScore}<span className="text-sm font-medium text-gray-400">%</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">AI can boost this by {Math.round((100 - stats.seoScore) * 0.7)}%</p>
            <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${stats.seoScore}%` }} />
            </div>
          </div>
          <div className="bg-white border-[1.5px] border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Click-Through Boost</p>
            <div className="text-2xl font-extrabold text-gray-900 leading-none">
              73<span className="text-sm font-medium text-gray-400">%</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Based on AI-optimized patterns</p>
            <div className="flex mt-1.5 gap-0.5">
              {[1,2,3,4].map(i => <span key={i} className="text-amber-400 text-sm">★</span>)}
              <span className="text-gray-200 text-sm">★</span>
            </div>
          </div>
          <div className="bg-white border-[1.5px] border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">Time Saved</p>
            <div className="text-2xl font-extrabold text-gray-900 leading-none">
              {products.length * 15} <span className="text-sm font-medium text-gray-400">min</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">That's {Math.round((products.length * 15) / 60)} hours saved!</p>
            <p className="text-[11px] font-bold text-blue-600 mt-1">⚡ AI works 24/7</p>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">

          {/* Left Card */}
          <div className="bg-white border-[1.5px] border-gray-200 rounded-xl shadow-sm overflow-hidden">

            {/* Tabs */}
            <div className="flex border-b-[1.5px] border-gray-200 px-4 bg-white">
              {(["ai", "existing", "custom"] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3.5 text-[13px] font-semibold border-b-[2.5px] -mb-[1.5px] transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? "text-blue-800 border-blue-800 font-bold"
                      : "text-gray-400 border-transparent hover:text-blue-700"
                  }`}
                >
                  {tab === "ai" ? "AI Optimization Templates" : tab === "existing" ? "Existing Title" : "Custom Formula"}
                </button>
              ))}
            </div>

            {/* ── AI TAB ── */}
            {activeTab === "ai" && (
              <>
                <div className="px-4 py-2.5 text-xs text-gray-500 border-b-[1.5px] border-gray-200 bg-blue-50">
                  These are SEO-based title formulas. Choose one to optimize your selected products.
                </div>

                {/* Success banner when template is saved */}
                {savedTemplateBanner && (
                  <div className="mx-4 mt-3 flex items-center gap-2 bg-green-50 border-[1.5px] border-green-300 rounded-lg px-3 py-2 animate-pulse">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-[12.5px] font-bold text-green-700">{savedTemplateBanner}</span>
                  </div>
                )}

                {/* Template Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 p-4">
                  {[...defaultAIFormats, ...userTemplates].map((format) => {
                    const tpl = templateConfig[format.id] ?? {
                      icon: <Sparkles className="w-4 h-4 text-blue-700" />,
                      formulaTags: [format.primaryElement, format.secondaryElement, ...(format.thirdElement !== "none" ? [format.thirdElement] : []), ...(format.fourthElement !== "none" ? [format.fourthElement] : [])],
                      formulaPattern: buildFormulaPattern(format),
                      example: buildFormulaPattern(format),
                    };
                    const isOn = selectedFormat.id === format.id;
                    return (
                      <div
                        key={format.id}
                        onClick={() => { setSelectedFormat(format); setFloatBarVisible(true); }}
                        className={`relative border-[1.5px] rounded-xl p-4 cursor-pointer transition-all duration-200 flex flex-col gap-2.5 overflow-hidden
                          ${isOn ? "border-blue-700 bg-blue-50 shadow-md shadow-blue-100" : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5"}
                        `}
                      >
                        {/* Top accent line */}
                        <div className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 to-blue-800 transition-opacity ${isOn ? "opacity-100" : "opacity-0"}`} />

                        {/* Checkmark */}
                        {isOn && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-blue-700 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}

                        {/* Header */}
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isOn ? "bg-blue-100" : "bg-blue-50"}`}>
                            {tpl.icon}
                          </div>
                          <span className={`text-sm font-extrabold ${isOn ? "text-blue-800" : "text-gray-900"}`}>{format.categoryName}</span>
                        </div>

                        {/* Formula Tags */}
                        <div className="flex items-center gap-1 flex-wrap">
                          {tpl.formulaTags.map((tag, i) => (
                            <span key={tag} className="contents">
                              <span className={`text-[11.5px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1
                                ${isOn ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-blue-50 text-blue-700 border-blue-100"}`}>
                                {tag}
                              </span>
                              {i < tpl.formulaTags.length - 1 && (
                                <span className="text-[12px] font-bold text-gray-400">+</span>
                              )}
                            </span>
                          ))}
                        </div>

                        {/* Example */}
                        <div className={`text-[11.5px] text-gray-600 leading-relaxed rounded-lg px-3 py-2 border-l-[3px] border-blue-500
                          ${isOn ? "bg-blue-50/60" : "bg-gray-50"}`}>
                          <span className="font-bold text-blue-700">Ex: </span>
                          {tpl.example.split(/(\*.*?\*)/).map((part, i) =>
                            part.startsWith("*") ? <em key={i} className="not-italic font-bold text-blue-700">{part.replace(/\*/g, "")}</em> : part
                          )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between mt-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1
                              ${isOn ? "bg-blue-100/70 border-blue-200 text-blue-700" : "bg-gray-100 border-gray-200 text-gray-500"}`}>
                              Length: <span className="text-blue-600 font-extrabold">{format.minCharacters}–{format.maxCharacters}</span> chars
                            </span>
                            {format.id >= 9000 && (
                              <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                                ✦ My Template
                              </span>
                            )}
                          </div>
                          {format.id >= 9000 ? (
                            <button
                              className="text-[11px] font-bold text-red-400 hover:text-red-600 flex items-center gap-1 bg-transparent border-none cursor-pointer transition-colors hover:underline"
                              onClick={(e) => { e.stopPropagation(); setUserTemplates((prev) => prev.filter((t) => t.id !== format.id)); if (selectedFormat.id === format.id) setSelectedFormat(defaultAIFormats[0]); }}
                            >
                              ✕ Remove
                            </button>
                          ) : (
                            <button
                              className="text-[11.5px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-transparent border-none cursor-pointer transition-colors hover:underline"
                              onClick={(e) => { e.stopPropagation(); setExampleFormatId(format.id); setShowExampleModal(true); }}
                            >
                              <Info className="w-3 h-3" /> See Example
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* New Template Card — click to save current customized formula */}
                  <div
                    onClick={() => saveAsNewTemplate(selectedFormat)}
                    title={!hasProductName(selectedFormat) ? "Add Product Name to a slot first" : "Save current formula as new template"}
                    className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 min-h-[140px] text-sm font-semibold transition-all cursor-pointer
                      ${hasProductName(selectedFormat)
                        ? "border-blue-300 text-blue-500 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
                        : "border-gray-200 text-gray-300 cursor-not-allowed opacity-50"
                      }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span>Save as New Template</span>
                    <span className="text-[10.5px] font-normal text-center px-3 opacity-70">Saves your current customized formula</span>
                  </div>
                </div>

                {/* Customize section */}
                <div className="px-4 py-3.5 border-t-[1.5px] border-gray-200 bg-gray-50/60">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13.5px] font-extrabold text-gray-800">Customize This Template</span>
                    <span className="text-[10.5px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2"><circle cx="8" cy="8" r="6"/><path d="M8 5v4M8 11v.5"/></svg>
                      Product Name must appear in one slot
                    </span>
                  </div>

                  {/* Live Formula Preview */}
                  <div className={`mb-3 rounded-xl px-3 py-2.5 border-[1.5px] transition-colors ${
                    !hasProductName(selectedFormat)
                      ? "bg-red-50 border-red-200"
                      : "bg-blue-50 border-blue-200"
                  }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${!hasProductName(selectedFormat) ? "text-red-500" : "text-blue-500"}`}>
                      Live Formula Pattern
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        selectedFormat.primaryElement,
                        selectedFormat.secondaryElement !== "none" ? selectedFormat.secondaryElement : null,,
                        selectedFormat.thirdElement !== "none" ? selectedFormat.thirdElement : null,
                        selectedFormat.fourthElement !== "none" ? selectedFormat.fourthElement : null,
                      ].filter(Boolean).map((el, i, arr) => (
                        <span key={i} className="contents">
                          <span className={`font-mono text-[12px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 ${
                            el === "Product Name"
                              ? "text-white bg-blue-700 border border-blue-800"
                              : "text-blue-800 bg-blue-100 border border-blue-200"
                          }`}>
                            {el === "Product Name" && <CheckCircle className="w-3 h-3 text-blue-300 flex-shrink-0" />}
                            {`{${el}}`}
                          </span>
                          {i < arr.length - 1 && <span className="text-blue-400 font-bold text-sm">+</span>}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10.5px] text-gray-500 mt-2 pt-2 border-t border-blue-100">
                      <span className="font-bold text-blue-600">Sent to AI: </span>
                      <span className="font-mono">{buildFormulaPattern(selectedFormat)}</span>
                    </p>
                  </div>

                  {/* Inline warning if Product Name is missing */}
                  {!hasProductName(selectedFormat) && (
                    <div className="mb-3 flex items-center gap-2 bg-red-50 border-[1.5px] border-red-300 rounded-lg px-3 py-2">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2.2">
                        <path d="M8 2L1 14h14L8 2z"/><path d="M8 7v3M8 12v.5"/>
                      </svg>
                      <span className="text-[12px] font-bold text-red-600">
                        "Product Name" is compulsory — please add it to any one slot below.
                      </span>
                      <button
                        onClick={() => setSelectedFormat({ ...selectedFormat, primaryElement: "Product Name" })}
                        className="ml-auto text-[11px] font-extrabold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap flex-shrink-0"
                      >
                        Fix it →
                      </button>
                    </div>
                  )}

                  {/* 4 Element dropdowns — all free to choose */}
                  <div className="grid grid-cols-2 gap-2.5 mb-2.5">

                    {/* 1st Element */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">
                        1st Element
                      </label>
                      <select
                        value={selectedFormat.primaryElement}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = { ...selectedFormat, primaryElement: val };
                          // If user moved Product Name away from slot 1 and slot 2 is also not Product Name, auto-suggest it in slot 2
                          if (val !== "Product Name" && updated.secondaryElement !== "Product Name") {
                            updated.secondaryElement = "Product Name";
                          }
                          setSelectedFormat(updated);
                        }}
                        className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${
                          selectedFormat.primaryElement === "Product Name" ? "border-blue-400 bg-blue-50 font-bold text-blue-800" : "border-gray-200 focus:border-blue-500"
                        }`}
                      >
                        {allSlotElements.map((el) => <option key={el}>{el}</option>)}
                      </select>
                    </div>

                    {/* 2nd Element */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">
                        2nd Element
                      </label>
                      <select
                        value={selectedFormat.secondaryElement}
                        onChange={(e) => setSelectedFormat({ ...selectedFormat, secondaryElement: e.target.value })}
                        className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${
                          selectedFormat.secondaryElement === "Product Name" ? "border-blue-400 bg-blue-50 font-bold text-blue-800" : "border-gray-200 focus:border-blue-500"
                        }`}
                      >
                        <option value="none">— None —</option>
                        {allSlotElements.map((el) => <option key={el}>{el}</option>)}
                      </select>
                    </div>

                    {/* 3rd Element */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">
                        3rd Element <span className="text-gray-300 font-normal normal-case">(optional)</span>
                      </label>
                      <select
                        value={selectedFormat.thirdElement}
                        onChange={(e) => setSelectedFormat({ ...selectedFormat, thirdElement: e.target.value })}
                        className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${
                          selectedFormat.thirdElement === "Product Name" ? "border-blue-400 bg-blue-50 font-bold text-blue-800" : "border-gray-200 focus:border-blue-500"
                        }`}
                      >
                        <option value="none">— None —</option>
                        {allSlotElements.map((el) => <option key={el}>{el}</option>)}
                      </select>
                    </div>

                    {/* 4th Element */}
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">
                        4th Element <span className="text-gray-300 font-normal normal-case">(optional)</span>
                      </label>
                      <select
                        value={selectedFormat.fourthElement}
                        onChange={(e) => setSelectedFormat({ ...selectedFormat, fourthElement: e.target.value })}
                        className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${
                          selectedFormat.fourthElement === "Product Name" ? "border-blue-400 bg-blue-50 font-bold text-blue-800" : "border-gray-200 focus:border-blue-500"
                        }`}
                      >
                        <option value="none">— None —</option>
                        {allSlotElements.map((el) => <option key={el}>{el}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Tone + Brand Focused */}
                  <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Tone</label>
                      <select
                        value={selectedFormat.tone}
                        onChange={(e) => setSelectedFormat({ ...selectedFormat, tone: e.target.value })}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors"
                      >
                        {tones.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Brand Focused</label>
                      <select
                        value={selectedFormat.brandFocused ? "On" : "Off"}
                        onChange={(e) => setSelectedFormat({ ...selectedFormat, brandFocused: e.target.value === "On" })}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors"
                      >
                        <option>Off</option>
                        <option>On</option>
                      </select>
                    </div>
                  </div>

                  {/* Min / Max chars */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Min Characters</label>
                      <input
                        type="number"
                        value={selectedFormat.minCharacters}
                        onChange={(e) => setSelectedFormat({ ...selectedFormat, minCharacters: parseInt(e.target.value) || 50 })}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Max Characters</label>
                      <input
                        type="number"
                        value={selectedFormat.maxCharacters}
                        onChange={(e) => setSelectedFormat({ ...selectedFormat, maxCharacters: parseInt(e.target.value) || 70 })}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 px-4 py-3 border-t-[1.5px] border-gray-200 bg-white items-center">
                  <button
                    onClick={() => requestAIOptimization(selectedFormat, false)}
                    disabled={!hasProductName(selectedFormat)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-800 text-white text-[13px] font-bold transition-all shadow-sm hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    <Play className="w-3.5 h-3.5" /> Generate AI Titles
                  </button>
                  <button
                    onClick={() => requestAIOptimization(selectedFormat, true)}
                    disabled={!hasProductName(selectedFormat)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[13px] font-bold transition-all shadow-sm hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    <ArrowRight className="w-3.5 h-3.5" /> Optimize & Apply Directly
                  </button>
                  <button
                    onClick={() => saveAsNewTemplate(selectedFormat)}
                    disabled={!hasProductName(selectedFormat)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-[1.5px] border-blue-300 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-500 text-[13px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
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
                    <p className="text-[12px] text-gray-400 mt-1">Go back and select products to optimize</p>
                  </div>
                ) : (
                  <>
                    {/* Table Header */}
                    <div className="grid gap-2.5 px-1 pb-2 border-b-[1.5px] border-gray-200 mb-1"
                      style={{ gridTemplateColumns: "44px 1fr 100px 70px 80px" }}>
                      <div />
                      <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Product Title</div>
                      <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Char Length</div>
                      <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Status</div>
                      <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Action</div>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {products.map((product) => (
                        <div key={product.productId}
                          className="grid gap-2.5 py-2.5 px-1 items-center hover:bg-gray-50 transition-colors"
                          style={{ gridTemplateColumns: "44px 1fr 100px 70px 80px" }}>
                          <img
                            src={product.productImage}
                            alt={product.title}
                            className="w-9 h-9 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-gray-900 truncate">{product.title}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{product.productId}</p>
                          </div>
                          <CharLengthBar length={product.title.length} max={100} />
                          <StatusBadge length={product.title.length} />
                          <button
                            onClick={() => requestSingleProductOptimize(product)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-800 text-white text-[11px] font-bold transition-all whitespace-nowrap"
                          >
                            <ArrowRight className="w-2.5 h-2.5" /> Optimize
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── CUSTOM TAB ── */}
            {activeTab === "custom" && (
              <>
                <div className="px-4 py-2.5 text-xs text-gray-500 border-b-[1.5px] border-gray-200 bg-blue-50">
                  Build your own formula from scratch — choose any 4 elements and set your preferences.
                </div>

                <div className="px-4 py-3.5 space-y-3">

                  {/* Template Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Template Name</label>
                    <input
                      type="text"
                      value={customFormula.categoryName}
                      onChange={(e) => setCustomFormula({ ...customFormula, categoryName: e.target.value })}
                      placeholder="e.g. My Brand Formula"
                      className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[13px] text-gray-800 font-semibold outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Live Formula Preview */}
                  <div className={`rounded-xl px-3 py-2.5 border-[1.5px] transition-colors ${
                    !hasProductName(customFormula) ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
                  }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 ${!hasProductName(customFormula) ? "text-red-500" : "text-blue-500"}`}>
                      Live Formula Pattern
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        customFormula.primaryElement,
                        customFormula.secondaryElement !== "none" ? customFormula.secondaryElement : null,,
                        customFormula.thirdElement !== "none" ? customFormula.thirdElement : null,
                        customFormula.fourthElement !== "none" ? customFormula.fourthElement : null,
                      ].filter(Boolean).map((el, i, arr) => (
                        <span key={i} className="contents">
                          <span className={`font-mono text-[12px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 ${
                            el === "Product Name"
                              ? "text-white bg-blue-700 border border-blue-800"
                              : "text-blue-800 bg-blue-100 border border-blue-200"
                          }`}>
                            {el === "Product Name" && <CheckCircle className="w-3 h-3 text-blue-300 flex-shrink-0" />}
                            {`{${el}}`}
                          </span>
                          {i < arr.length - 1 && <span className="text-blue-400 font-bold text-sm">+</span>}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10.5px] text-gray-500 mt-2 pt-2 border-t border-blue-100">
                      <span className="font-bold text-blue-600">Sent to AI: </span>
                      <span className="font-mono">{buildFormulaPattern(customFormula)}</span>
                    </p>
                  </div>

                  {/* Inline warning if Product Name missing */}
                  {!hasProductName(customFormula) && (
                    <div className="flex items-center gap-2 bg-red-50 border-[1.5px] border-red-300 rounded-lg px-3 py-2">
                      <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth="2.2">
                        <path d="M8 2L1 14h14L8 2z"/><path d="M8 7v3M8 12v.5"/>
                      </svg>
                      <span className="text-[12px] font-bold text-red-600">
                        "Product Name" is compulsory — add it to any slot.
                      </span>
                      <button
                        onClick={() => setCustomFormula({ ...customFormula, primaryElement: "Product Name" })}
                        className="ml-auto text-[11px] font-extrabold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap flex-shrink-0"
                      >
                        Fix it →
                      </button>
                    </div>
                  )}

                  {/* 4 Element Dropdowns */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">1st Element</label>
                      <select
                        value={customFormula.primaryElement}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = { ...customFormula, primaryElement: val };
                          if (val !== "Product Name" && updated.secondaryElement !== "Product Name") {
                            updated.secondaryElement = "Product Name";
                          }
                          setCustomFormula(updated);
                        }}
                        className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${
                          customFormula.primaryElement === "Product Name" ? "border-blue-400 bg-blue-50 font-bold text-blue-800" : "border-gray-200 focus:border-blue-500"
                        }`}
                      >
                        {allSlotElements.map((el) => <option key={el}>{el}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">2nd Element</label>
                      <select
                        value={customFormula.secondaryElement}
                        onChange={(e) => setCustomFormula({ ...customFormula, secondaryElement: e.target.value })}
                        className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${
                          customFormula.secondaryElement === "Product Name" ? "border-blue-400 bg-blue-50 font-bold text-blue-800" : "border-gray-200 focus:border-blue-500"
                        }`}
                      >
                        {allSlotElements.map((el) => <option key={el}>{el}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">3rd Element <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                      <select
                        value={customFormula.thirdElement}
                        onChange={(e) => setCustomFormula({ ...customFormula, thirdElement: e.target.value })}
                        className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${
                          customFormula.thirdElement === "Product Name" ? "border-blue-400 bg-blue-50 font-bold text-blue-800" : "border-gray-200 focus:border-blue-500"
                        }`}
                      >
                        <option value="none">— None —</option>
                        {allSlotElements.map((el) => <option key={el}>{el}</option>)}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">4th Element <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                      <select
                        value={customFormula.fourthElement}
                        onChange={(e) => setCustomFormula({ ...customFormula, fourthElement: e.target.value })}
                        className={`px-2.5 py-1.5 border-[1.5px] rounded-lg bg-white text-[12.5px] text-gray-800 outline-none transition-colors ${
                          customFormula.fourthElement === "Product Name" ? "border-blue-400 bg-blue-50 font-bold text-blue-800" : "border-gray-200 focus:border-blue-500"
                        }`}
                      >
                        <option value="none">— None —</option>
                        {allSlotElements.map((el) => <option key={el}>{el}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Tone + Brand Focused + Min/Max */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Tone</label>
                      <select
                        value={customFormula.tone}
                        onChange={(e) => setCustomFormula({ ...customFormula, tone: e.target.value })}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors"
                      >
                        {tones.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Brand Focused</label>
                      <select
                        value={customFormula.brandFocused ? "On" : "Off"}
                        onChange={(e) => setCustomFormula({ ...customFormula, brandFocused: e.target.value === "On" })}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors"
                      >
                        <option>Off</option>
                        <option>On</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Min Characters</label>
                      <input
                        type="number"
                        value={customFormula.minCharacters}
                        onChange={(e) => setCustomFormula({ ...customFormula, minCharacters: parseInt(e.target.value) || 50 })}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Max Characters</label>
                      <input
                        type="number"
                        value={customFormula.maxCharacters}
                        onChange={(e) => setCustomFormula({ ...customFormula, maxCharacters: parseInt(e.target.value) || 70 })}
                        className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 px-4 py-3 border-t-[1.5px] border-gray-200 bg-white items-center">
                  <button
                    onClick={() => { setSelectedFormat(customFormula); requestAIOptimization(customFormula, false); }}
                    disabled={!hasProductName(customFormula)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-800 text-white text-[13px] font-bold transition-all shadow-sm hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Play className="w-3.5 h-3.5" /> Generate AI Titles
                  </button>
                  <button
                    onClick={() => { setSelectedFormat(customFormula); requestAIOptimization(customFormula, true); }}
                    disabled={!hasProductName(customFormula)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[13px] font-bold transition-all shadow-sm hover:-translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowRight className="w-3.5 h-3.5" /> Optimize & Apply Directly
                  </button>
                  <button
                    onClick={() => saveAsNewTemplate(customFormula)}
                    disabled={!hasProductName(customFormula)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-[1.5px] border-blue-300 bg-white text-blue-600 hover:bg-blue-50 hover:border-blue-500 text-[13px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" /> Save as New Template
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right: Classic Rules */}
          <div className="bg-white border-[1.5px] border-gray-200 rounded-xl shadow-sm p-4 space-y-4">
            <div>
              <div className="flex items-center gap-2 font-extrabold text-gray-900 text-[14px] mb-1">
                <RulerIcon className="w-4 h-4 text-gray-600" /> Classic Rules
              </div>
              <p className="text-xs text-gray-400">Manual title adjustments for precise control</p>
            </div>

            {/* Prefix / Suffix grid */}
            <div className="grid grid-cols-2 gap-px bg-gray-200 border-[1.5px] border-gray-200 rounded-lg overflow-hidden">
              {["Prefix", "Suffix"].map((label) => {
                const key = label.toLowerCase() as "prefix" | "suffix";
                return (
                  <div key={label} className="bg-white px-3 py-2.5 flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-gray-800">{label}</span>
                    <button
                      onClick={() => setClassicRules({ ...classicRules, [key]: { ...classicRules[key], enabled: !classicRules[key].enabled } })}
                      className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${classicRules[key].enabled ? "bg-blue-600" : "bg-gray-300"}`}
                    >
                      <span className={`absolute w-3.5 h-3.5 bg-white rounded-full top-[3px] shadow-sm transition-transform ${classicRules[key].enabled ? "translate-x-4" : "translate-x-[3px]"}`} />
                    </button>
                  </div>
                );
              })}
            </div>

            {classicRules.prefix.enabled && (
              <input value={classicRules.prefix.value} onChange={(e) => setClassicRules({ ...classicRules, prefix: { ...classicRules.prefix, value: e.target.value } })}
                placeholder="e.g., Best Seller:" className="w-full px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12.5px] outline-none focus:border-blue-500" />
            )}
            {classicRules.suffix.enabled && (
              <input value={classicRules.suffix.value} onChange={(e) => setClassicRules({ ...classicRules, suffix: { ...classicRules.suffix, value: e.target.value } })}
                placeholder="e.g., - Premium Quality" className="w-full px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12.5px] outline-none focus:border-blue-500" />
            )}

            {/* Find & Replace */}
            <div>
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-[13px] font-semibold text-gray-800">Find & Replace</span>
                <button onClick={() => setClassicRules({ ...classicRules, findReplace: { ...classicRules.findReplace, enabled: !classicRules.findReplace.enabled } })}
                  className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${classicRules.findReplace.enabled ? "bg-blue-600" : "bg-gray-300"}`}>
                  <span className={`absolute w-3.5 h-3.5 bg-white rounded-full top-[3px] shadow-sm transition-transform ${classicRules.findReplace.enabled ? "translate-x-4" : "translate-x-[3px]"}`} />
                </button>
              </div>
              {classicRules.findReplace.enabled && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input value={classicRules.findReplace.find} onChange={(e) => setClassicRules({ ...classicRules, findReplace: { ...classicRules.findReplace, find: e.target.value } })}
                    placeholder="Find" className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12.5px] outline-none focus:border-blue-500" />
                  <input value={classicRules.findReplace.replace} onChange={(e) => setClassicRules({ ...classicRules, findReplace: { ...classicRules.findReplace, replace: e.target.value } })}
                    placeholder="Replace with" className="px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12.5px] outline-none focus:border-blue-500" />
                </div>
              )}
            </div>

            {/* Find & Remove */}
            <div>
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100">
                <span className="text-[13px] font-semibold text-gray-800">Find & Remove</span>
                <button onClick={() => setClassicRules({ ...classicRules, findRemove: { ...classicRules.findRemove, enabled: !classicRules.findRemove.enabled } })}
                  className={`w-9 h-5 rounded-full relative transition-colors flex-shrink-0 ${classicRules.findRemove.enabled ? "bg-blue-600" : "bg-gray-300"}`}>
                  <span className={`absolute w-3.5 h-3.5 bg-white rounded-full top-[3px] shadow-sm transition-transform ${classicRules.findRemove.enabled ? "translate-x-4" : "translate-x-[3px]"}`} />
                </button>
              </div>
              {classicRules.findRemove.enabled && (
                <input value={classicRules.findRemove.value} onChange={(e) => setClassicRules({ ...classicRules, findRemove: { ...classicRules.findRemove, value: e.target.value } })}
                  placeholder="Text to remove" className="w-full mt-2 px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg text-[12.5px] outline-none focus:border-blue-500" />
              )}
            </div>

            {/* Capitalization */}
            <div>
              <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Capitalization</p>
              <select
                value={classicRules.capitalization}
                onChange={(e) => setClassicRules({ ...classicRules, capitalization: e.target.value })}
                className="w-full px-2.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-[12.5px] text-gray-800 outline-none focus:border-blue-500 transition-colors"
              >
                <option value="keep">Keep Original</option>
                <option value="title">Title Case</option>
                <option value="upper">ALL CAPS</option>
                <option value="lower">lowercase</option>
                <option value="sentence">Sentence case</option>
              </select>
            </div>

            <button
              onClick={handleClassicOptimization}
              className="w-full py-2.5 bg-gray-900 hover:bg-blue-800 text-white rounded-xl font-extrabold text-[13.5px] flex items-center justify-center gap-2 transition-all shadow-md shadow-gray-900/20 hover:-translate-y-0.5"
            >
              <Zap className="w-3.5 h-3.5" /> Apply Classic Rules
            </button>
          </div>
        </div>
      </div>


      {/* ── EXAMPLE MODAL ── */}
      {showExampleModal && exampleFormat && exampleFormatData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center" onClick={() => setShowExampleModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-[480px] w-[92%] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-extrabold text-gray-900">{exampleFormatData.categoryName} — Example</h3>
              <button onClick={() => setShowExampleModal(false)} className="text-gray-400 hover:text-gray-700 text-2xl leading-none bg-transparent border-none cursor-pointer">×</button>
            </div>
            <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Formula Pattern</p>
            <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-[12.5px] text-gray-600 mb-3 font-mono leading-relaxed">
              {exampleFormat.formulaPattern}
            </div>
            <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Example Output</p>
            <div className="bg-blue-50 border-[1.5px] border-blue-100 rounded-lg px-3 py-2.5 text-[13px] text-gray-800 font-semibold mb-4 leading-relaxed border-l-[3px] border-l-blue-500">
              {exampleFormat.example}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowExampleModal(false)} className="flex-1 py-2.5 border-[1.5px] border-gray-200 rounded-lg text-[13px] font-bold text-gray-500 hover:border-gray-300 transition-colors">Close</button>
              <button onClick={() => { setSelectedFormat(exampleFormatData); setShowExampleModal(false); }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-800 text-white rounded-lg text-[13px] font-bold transition-colors">
                Use This Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Context Choice Modal */}
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
              <Brain className="w-5 h-5 text-blue-500" />
              Choose AI Input
            </DialogTitle>
            <DialogDescription>
              Select what the AI should use before optimizing your product title.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setContextChoice({ image: true, title: false })}
              className={`text-left rounded-lg border-[1.5px] p-3 transition-all ${
                contextChoice.image && !contextChoice.title
                  ? "border-blue-600 bg-blue-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Package className="w-4 h-4 text-blue-600" />
                {contextChoice.image && !contextChoice.title && <CheckCircle className="w-4 h-4 text-blue-600" />}
              </div>
              <p className="text-[13px] font-extrabold text-gray-900">Use Image</p>
              <p className="text-[11.5px] text-gray-500 mt-1">Create titles from product visuals.</p>
            </button>

            <button
              type="button"
              onClick={() => setContextChoice({ image: false, title: true })}
              className={`text-left rounded-lg border-[1.5px] p-3 transition-all ${
                !contextChoice.image && contextChoice.title
                  ? "border-blue-600 bg-blue-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Search className="w-4 h-4 text-blue-600" />
                {!contextChoice.image && contextChoice.title && <CheckCircle className="w-4 h-4 text-blue-600" />}
              </div>
              <p className="text-[13px] font-extrabold text-gray-900">Use Title Only</p>
              <p className="text-[11.5px] text-gray-500 mt-1">Improve the existing product title.</p>
            </button>

            <button
              type="button"
              onClick={() => setContextChoice({ image: true, title: true })}
              className={`text-left rounded-lg border-[1.5px] p-3 transition-all ${
                contextChoice.image && contextChoice.title
                  ? "border-blue-600 bg-blue-50 shadow-sm"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                {contextChoice.image && contextChoice.title && <CheckCircle className="w-4 h-4 text-blue-600" />}
              </div>
              <p className="text-[13px] font-extrabold text-gray-900">Use Both</p>
              <p className="text-[11.5px] text-gray-500 mt-1">Blend visual context with the old title.</p>
            </button>
          </div>

          <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
            <p className="text-[11.5px] font-semibold text-gray-600">
              Backend payload: image: {String(contextChoice.image)}, title: {String(contextChoice.title)}
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white px-3 py-3 space-y-3">
            <button
              type="button"
              onClick={() => setShareExampleTitles((prev) => !prev)}
              className={`w-full flex items-center justify-between rounded-lg px-3 py-2 border-[1.5px] transition-colors ${
                shareExampleTitles ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-blue-300"
              }`}
            >
              <span className="text-[13px] font-semibold text-gray-900">Share example titles</span>
              <span
                className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${
                  shareExampleTitles ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute w-4 h-4 bg-white rounded-full top-[4px] shadow-sm transition-transform ${
                    shareExampleTitles ? "translate-x-5" : "translate-x-[3px]"
                  }`}
                />
              </span>
            </button>

            {shareExampleTitles && (
              <div className="space-y-2">
                <input
                  value={exampleTitleInput}
                  onChange={(event) => setExampleTitleInput(event.target.value)}
                  onKeyDown={handleExampleTitleKeyDown}
                  placeholder="Type a title and press Enter"
                  className="w-full px-3 py-2 border-[1.5px] border-gray-200 rounded-lg text-[13px] outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-gray-500">Add multiple examples one by one, then run optimization.</p>
                <div className="flex flex-wrap gap-2">
                  {exampleTitles.map((title) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => removeExampleTitle(title)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[12px] font-medium text-blue-700 hover:bg-blue-100"
                      title="Remove example"
                    >
                      {title}
                      <span className="text-blue-500 font-bold">×</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowContextModal(false); setPendingOptimization(null); }}>
              Cancel
            </Button>
            <Button onClick={confirmOptimizationContext} className="bg-blue-600 hover:bg-blue-800 gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Modal */}
      <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
              AI is Working Its Magic
            </DialogTitle>
            <DialogDescription>Our AI is analyzing and optimizing your product titles...</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Progress value={(progress.current / progress.total) * 100} className="h-2" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">{progress.status}</p>
              <p className="text-xs text-gray-500 mt-1">{progress.current} of {progress.total} products processed</p>
            </div>
            <div className="flex justify-center">
              <Brain className="w-12 h-12 text-blue-500 animate-pulse" />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              AI Generated Titles Preview
            </DialogTitle>
            <DialogDescription>Review the AI-optimized titles before applying them to your store</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {optimizationResults.map((result) => (
              <div key={result.productId} className="p-4 border rounded-lg">
                <div className="flex items-start gap-4">
                  <img src={result.image} alt={result.oldTitle} className="w-16 h-16 rounded-lg object-cover border" />
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500 mb-1">Original Title</Label>
                        <p className="text-sm text-gray-700">{result.oldTitle}</p>
                        <p className="text-xs text-gray-500 mt-1">{result.oldTitle.length} chars</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 mb-1">AI Optimized Title</Label>
                        <p className="text-sm font-medium text-gray-900">{result.newTitle}</p>
                        <p className="text-xs text-gray-500 mt-1">{result.newTitle.length} chars</p>
                      </div>
                    </div>
                    {result.oldTitle !== result.newTitle && (
                      <div className="mt-3">
                        <Badge variant={result.newTitle.length > result.oldTitle.length ? "default" : "secondary"} className="text-xs">
                          {result.newTitle.length > result.oldTitle.length ? "Improved" : "Optimized"}
                        </Badge>
                        <span className="text-xs text-gray-600 ml-2">
                          {Math.abs(result.newTitle.length - result.oldTitle.length)} characters {result.newTitle.length > result.oldTitle.length ? "added" : "removed"}
                        </span>
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
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2">
              <TrendingUp className="w-4 h-4" /> See Improvements & Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comparison Modal */}
      <Dialog open={showComparisonModal} onOpenChange={setShowComparisonModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Optimization Results
            </DialogTitle>
            <DialogDescription>Here's how much better your titles will perform</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card><CardContent className="pt-6">
                <div className="text-3xl font-bold text-center text-gray-900">+{stats.improvement}%</div>
                <p className="text-sm text-center text-gray-600 mt-1">SEO Improvement</p>
              </CardContent></Card>
              <Card><CardContent className="pt-6">
                <div className="text-3xl font-bold text-center text-gray-900">{stats.averageLength}</div>
                <p className="text-sm text-center text-gray-600 mt-1">Avg. Character Length</p>
              </CardContent></Card>
            </div>
            <div className="text-center">
              <p className="text-gray-700"><span className="font-semibold">Your new titles are {stats.improvement}% better</span> than before and optimized for search engines.</p>
              <p className="text-sm text-gray-500 mt-2">Expected click-through rate increase: <span className="font-medium text-green-600">Up to 73%</span></p>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" />What you're getting:</h4>
              <ul className="space-y-1 text-sm text-green-700">
                <li>✓ SEO-optimized for better search rankings</li>
                <li>✓ Higher click-through rates on product listings</li>
                <li>✓ Consistent brand voice across all products</li>
                <li>✓ Mobile-friendly title lengths</li>
                <li>✓ Keyword-rich without being spammy</li>
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

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-green-500" />Success!</DialogTitle>
            <DialogDescription>Your product titles have been optimized successfully</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Optimization Complete!</h3>
              <p className="text-gray-600">{progress.current} of {progress.total} product titles were successfully updated.</p>
              {progress.total - progress.current > 0 && (
                <p className="text-sm text-amber-600 mt-2">{progress.total - progress.current} products failed to update</p>
              )}
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-4">
              <p className="text-sm text-gray-700"><span className="font-semibold">Pro Tip:</span> Monitor your analytics in the next 7–14 days to see the impact of your optimized titles.</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => navigate("/")} className="flex-1">Go to Dashboard</Button>
            <Button onClick={() => { setShowSuccessModal(false); fetchStoredProducts(); }}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              Optimize More Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
