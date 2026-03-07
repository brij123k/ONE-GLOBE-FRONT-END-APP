import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Package, ChevronLeft, Save, Plus, Award, CheckCircle,
  RefreshCw, AlertTriangle, Zap, Hash, Sparkles,
  ArrowRight,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

// ─── Types based on your actual data structure ───────────────────────────────

interface ProductVariant {
  _id: string;
  shopId: string;
  productId: string; // This is the parent product GID
  inventoryItemId:string;
  title: string;
  variantId: string; // This is the variant GID
  sku: string;
  handle: string;
  vender: string;
  productType: string;
  productImage: string;
  createdAt: string;
  updatedAt: string;
}

interface SKUUpdatePayload {
  productId: string;
  inventoryItemId:string;
  variantId: string;
  oldSku: string;
  newSku: string;
}

interface SKUGenerationResult {
  variantId: string;
  variantTitle: string;
  productTitle: string;
  oldSKU: string;
  newSKU: string;
  image: string;
}

interface UpdateResult {
  variantId: string;
  oldSku: string;
  newSku: string;
  status: 'updated' | 'skipped' | 'failed' | 'error';
}

// ─── Store prefixes for quick selection ──────────────────────────────────────

interface StorePrefix {
  name: string;
  code: string;
  variantCount: number;
}

// ─── Format options ──────────────────────────────────────────────────────────

interface FormatOption {
  id: string;
  name: string;
  description: string;
  pattern: string;
  example: string;
}

const formatOptions: FormatOption[] = [
  { id: "sequential", name: "Sequential", description: "Prefix + sequential number", pattern: "PREFIX-0001", example: "HOA-0001" },
  { id: "dash", name: "With Dash", description: "Prefix with dash separator", pattern: "PREFIX-0001", example: "HOA-0001" },
  { id: "underscore", name: "With Underscore", description: "Prefix with underscore", pattern: "PREFIX_0001", example: "HOA_0001" },
  { id: "nodash", name: "No Separator", description: "Prefix directly with number", pattern: "PREFIX0001", example: "HOA0001" },
];

const padOptions = [
  { value: 3, label: "3-digit pad", example: "001" },
  { value: 4, label: "4-digit pad", example: "0001" },
  { value: 5, label: "5-digit pad", example: "00001" },
  { value: 6, label: "6-digit pad", example: "000001" },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SKUStatusBadge({ status }: { status: "pending" | "new" | "existing" | "conflict" }) {
  const config = {
    pending: { bg: "bg-gray-100", text: "text-gray-600", label: "— Pending", icon: null },
    new: { bg: "bg-green-100", text: "text-green-700", label: "✓ New SKU", icon: <CheckCircle className="w-3 h-3" /> },
    existing: { bg: "bg-amber-100", text: "text-amber-700", label: "⟲ Replace SKU", icon: null },
    conflict: { bg: "bg-red-100", text: "text-red-700", label: "⚠ Conflict", icon: <AlertTriangle className="w-3 h-3" /> },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-extrabold px-2.5 py-1 rounded-full ${c.bg} ${c.text} whitespace-nowrap`}>
      {c.icon} {c.label}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SKUOptimization() {
  const navigate = useNavigate();
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [floatBarVisible, setFloatBarVisible] = useState(true);
  
  // SKU Generation Settings
  const [prefix, setPrefix] = useState("HOA");
  const [startNumber, setStartNumber] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState<FormatOption>(formatOptions[0]);
  const [padLength, setPadLength] = useState(4);
  const [generatedSKUs, setGeneratedSKUs] = useState<Record<string, string>>({}); // Key: variantId
  
  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  
  // Results
  const [optimizationResults, setOptimizationResults] = useState<SKUGenerationResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  
  // Stats
  const [stats, setStats] = useState({
    withoutSKU: 0,
    duplicates: 0,
    readyToApply: 0,
    totalVariants: 0,
  });

  const [shop, setShop] = useState({ shopName: "Store" });

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("shop") || "{}");
    setShop(data);
    fetchVariants();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [variants, generatedSKUs]);

  const storePrefixes: StorePrefix[] = [
    { name: shop.shopName || "My Store", code: shop.shopName?.substring(0, 3).toUpperCase() || "HOA", variantCount: variants.length },
    { name: "HOA Sindhida", code: "HOS", variantCount: 9 },
    { name: "Fruits Store", code: "FRT", variantCount: 9 },
    { name: "Electronics", code: "ELC", variantCount: 8 },
    { name: "Apparel", code: "APP", variantCount: 15 },
  ];

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const data = (await getApi(ApiConfig.getStoredskuProducts)) || [];
      setVariants(data);
      calculateStats(data);
    } catch (e) {
      console.error("Error fetching variants:", e);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (vars: ProductVariant[] = variants) => {
    if (!vars.length) return;
    
    const totalVariants = vars.length;
    
    // Count variants without SKU
    const withoutSKU = vars.filter(v => !v.sku || v.sku.trim() === "" || v.sku === "No SKU Found").length;
    
    // Count duplicates in existing SKUs
    const skuMap = new Map();
    vars.forEach(v => {
      if (v.sku && v.sku !== "No SKU Found") {
        skuMap.set(v.sku, (skuMap.get(v.sku) || 0) + 1);
      }
    });
    const duplicates = Array.from(skuMap.values()).filter(count => count > 1).length;
    
    // Count ready to apply (variants with generated SKUs)
    const readyToApply = Object.keys(generatedSKUs).length;
    
    setStats({ withoutSKU, duplicates, readyToApply, totalVariants });
  };

  // Generate SKU based on current settings
  const generateSKU = (index: number): string => {
    const num = startNumber + index;
    const paddedNum = String(num).padStart(padLength, '0');
    
    let separator = "-";
    if (selectedFormat.id === "underscore") separator = "_";
    else if (selectedFormat.id === "nodash") separator = "";
    
    return `${prefix}${separator}${paddedNum}`;
  };

  const generateAllSKUs = () => {
    const newSKUs: Record<string, string> = {};
    
    variants.forEach((variant, index) => {
      newSKUs[variant.variantId] = generateSKU(index);
    });
    
    setGeneratedSKUs(newSKUs);
    setFloatBarVisible(true);
  };

  const generateSingleSKU = (variantId: string, index: number) => {
    setGeneratedSKUs(prev => ({
      ...prev,
      [variantId]: generateSKU(index)
    }));
  };

  const handleManualSKUEdit = (variantId: string, value: string) => {
    setGeneratedSKUs(prev => ({
      ...prev,
      [variantId]: value
    }));
  };

  const getVariantStatus = (variant: ProductVariant): "pending" | "new" | "existing" | "conflict" => {
    const hasGeneratedSKU = generatedSKUs[variant.variantId];
    if (!hasGeneratedSKU) return "pending";
    
    const hasOldSKU = variant.sku && variant.sku.trim() !== "" && variant.sku !== "No SKU Found";
    
    // Check for conflicts with other variants
    const conflict = Object.entries(generatedSKUs).some(([vid, sku]) => 
      vid !== variant.variantId && sku === hasGeneratedSKU && sku !== ""
    );
    
    if (conflict) return "conflict";
    if (hasOldSKU) return "existing";
    return "new";
  };

  const handleApplySKUs = async () => {
    setShowApplyModal(false);
    setShowProgressModal(true);
    
    // Prepare batch update payload
    const updates: SKUUpdatePayload[] = [];
    const results: SKUGenerationResult[] = [];
    
    variants.forEach(variant => {
      const newSKU = generatedSKUs[variant.variantId];
      if (newSKU && newSKU !== variant.sku) {
        updates.push({
          productId: variant.productId,
          inventoryItemId:variant.inventoryItemId,
          variantId: variant.variantId,
          oldSku: variant.sku || "",
          newSku: newSKU
        });
        
        results.push({
          variantId: variant.variantId,
          variantTitle: variant.title,
          productTitle: variant.title,
          oldSKU: variant.sku || "(Empty)",
          newSKU: newSKU,
          image: variant.productImage,
        });
      }
    });
    
    setProgress({ current: 0, total: updates.length, status: "Starting SKU update..." });
    
    try {
      // Send batch update
      const response = await postApi(ApiConfig.updateSku, { updates });
      
      // Check if response has results with errors
      if (response && response.results) {
        const failedCount = response.results.filter((r: UpdateResult) => r.status === 'error' || r.status === 'failed').length;
        if (failedCount > 0) {
          setProgress({ 
            current: updates.length - failedCount, 
            total: updates.length, 
            status: `${failedCount} updates failed` 
          });
        } else {
          setProgress({ current: updates.length, total: updates.length, status: "Completed" });
        }
      } else {
        setProgress({ current: updates.length, total: updates.length, status: "Completed" });
      }
      
      setOptimizationResults(results);
      setShowProgressModal(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Failed to update SKUs:", error);
      setProgress({ current: 0, total: updates.length, status: "Failed" });
      setShowProgressModal(false);
    }
  };

  const openApplyModal = () => {
    const results: SKUGenerationResult[] = [];
    
    variants.forEach(variant => {
      const newSKU = generatedSKUs[variant.variantId];
      if (newSKU) {
        results.push({
          variantId: variant.variantId,
          variantTitle: variant.title,
          productTitle: variant.title,
          oldSKU: variant.sku || "(Empty)",
          newSKU: newSKU,
          image: variant.productImage,
        });
      }
    });
    
    setOptimizationResults(results);
    setShowApplyModal(true);
  };

  // Preview SKUs for the first 3 variants
  const getPreviewSKUs = () => {
    const previews = [];
    for (let i = 0; i < 3; i++) {
      const num = startNumber + i;
      const paddedNum = String(num).padStart(padLength, '0');
      let separator = selectedFormat.id === "underscore" ? "_" : selectedFormat.id === "nodash" ? "" : "-";
      previews.push(`${prefix}${separator}${paddedNum}`);
    }
    return previews;
  };

  const previewSKUs = getPreviewSKUs();

  const variantsWithGenerated = Object.keys(generatedSKUs).length;
  const totalVariants = stats.totalVariants;

  // Group variants by productId for display purposes only
  const groupedVariants = variants.reduce((acc, variant) => {
    if (!acc[variant.productId]) {
      acc[variant.productId] = [];
    }
    acc[variant.productId].push(variant);
    return acc;
  }, {} as Record<string, ProductVariant[]>);

  if (loading) {
    return (
      <AppLayout title="SKU Optimization">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Package className="w-12 h-12 animate-pulse text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading variants for SKU optimization...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="SKU Optimization">
      <div className="p-5 space-y-5">

        {/* Step Header */}
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-3.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-sm font-semibold text-gray-500 hover:border-blue-400 hover:text-blue-700 transition-all">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest">Step 1 of 2</p>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">SKU Optimization</h1>
            <p className="text-xs text-gray-500">Set, generate, and map SKUs for all variants</p>
          </div>
          <div className="flex items-center gap-1.5 bg-blue-800 text-white px-4 py-1.5 rounded-full text-[12.5px] font-bold shadow-md shadow-blue-900/25">
            <Package className="w-3.5 h-3.5" /> {totalVariants} Variants
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { 
              label: "Variants Without SKU", 
              value: stats.withoutSKU, 
              unit: `/ ${totalVariants}`,
              hint: "Missing SKUs", 
              pct: totalVariants ? (stats.withoutSKU / totalVariants) * 100 : 0, 
              color: "bg-amber-400",
              textColor: "text-amber-600"
            },
            { 
              label: "Duplicate SKUs Found", 
              value: stats.duplicates, 
              unit: "conflicts",
              hint: "Needs resolution", 
              pct: totalVariants ? (stats.duplicates / totalVariants) * 100 : 0, 
              color: "bg-red-400",
              textColor: "text-red-600"
            },
            { 
              label: "Ready to Apply", 
              value: stats.readyToApply, 
              unit: "SKUs",
              hint: "No conflicts", 
              pct: totalVariants ? (stats.readyToApply / totalVariants) * 100 : 0, 
              color: "bg-green-400",
              textColor: "text-green-600"
            },
            { 
              label: "Unique Products", 
              value: Object.keys(groupedVariants).length, 
              unit: "total",
              hint: "With variants", 
              pct: 100, 
              color: "bg-purple-400",
              textColor: "text-purple-600"
            },
          ].map(s => (
            <div key={s.label} className="bg-white border-[1.5px] border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
              <div className="text-2xl font-extrabold text-gray-900 leading-none">{s.value}<span className="text-sm font-medium text-gray-400 ml-1">{s.unit}</span></div>
              <p className={`text-[11px] ${s.textColor} font-semibold mt-0.5`}>{s.hint}</p>
              <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${s.color}`} style={{ width: `${Math.min(100, s.pct)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 items-start">

          {/* Left Card */}
          <div className="bg-white border-[1.5px] border-gray-200 rounded-xl shadow-sm overflow-hidden">

            {/* Tabs */}
            <div className="flex border-b-[1.5px] border-gray-200 px-4 bg-white">
              <button className="px-4 py-3.5 text-[13px] font-semibold border-b-[2.5px] -mb-[1.5px] text-blue-800 border-blue-800 font-bold">
                Variant Optimization
              </button>
            </div>

            {/* VENDOR TAB */}
            <>
              <div className="px-4 py-2.5 text-xs text-gray-500 border-b-[1.5px] border-gray-200 bg-blue-50">
                Set new SKU format for each variant. Each variant gets its own unique SKU.
              </div>

              {/* Info Banner */}
              <div className="mx-4 mt-3 bg-amber-50 border-[1.5px] border-amber-300 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-[12px] text-amber-800">
                  <span className="font-bold">How it works:</span> New SKUs are generated per variant using your prefix + sequential number. 
                  Each variant gets its own unique SKU. Old SKUs will be replaced.
                </div>
              </div>

              {/* Prefix Configuration */}
              <div className="p-4 border-b-[1.5px] border-gray-200">
                <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-3">SKU Prefix Configuration</p>
                
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Store Prefix</label>
                    <input 
                      type="text" 
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                      placeholder="e.g. HOA, SKU, PROD"
                      className="px-3 py-2 border-[1.5px] border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Starting Number</label>
                    <input 
                      type="number" 
                      value={startNumber}
                      onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
                      min="1"
                      className="px-3 py-2 border-[1.5px] border-gray-200 rounded-lg text-[13px] font-medium outline-none focus:border-blue-500"
                    />
                  </div>
                  <button 
                    onClick={generateAllSKUs}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-800 text-white text-[13px] font-bold rounded-lg transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate All SKUs
                  </button>
                </div>

                {/* Preview */}
                <div className="mt-3 p-3 bg-blue-50 border-[1.5px] border-blue-200 rounded-lg flex items-center gap-3 flex-wrap">
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Preview:</span>
                  {previewSKUs.map((sku, i) => (
                    <span key={i} className="font-mono text-[13px] font-bold text-blue-800 bg-white border border-blue-200 px-3 py-1 rounded-md">
                      {sku}
                    </span>
                  ))}
                  <span className="text-[11.5px] text-blue-600 font-semibold">… and so on (per variant)</span>
                </div>
              </div>

              {/* Format Options */}
              <div className="px-4 py-3 bg-gray-50 border-b-[1.5px] border-gray-200">
                <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-2">Format Options</p>
                <div className="flex flex-wrap gap-2">
                  {formatOptions.map(format => (
                    <button
                      key={format.id}
                      onClick={() => setSelectedFormat(format)}
                      className={`px-3 py-1.5 text-[12px] font-semibold rounded-full border transition-all ${
                        selectedFormat.id === format.id
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                      }`}
                    >
                      {format.name}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {padOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setPadLength(opt.value)}
                      className={`px-3 py-1.5 text-[12px] font-semibold rounded-full border transition-all ${
                        padLength === opt.value
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-400"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variants Table - Simple flat list */}
              <div className="overflow-x-auto">
                <div className="grid grid-cols-[1fr_140px_140px_90px_80px] gap-2 px-4 py-2 border-b-[1.5px] border-gray-200 bg-gray-50">
                  <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Variant</div>
                  <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Current SKU</div>
                  <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">New SKU</div>
                  <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Status</div>
                  <div className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Action</div>
                </div>

                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                  {variants.map((variant, index) => {
                    const status = getVariantStatus(variant);
                    return (
                      <div 
                        key={variant._id} 
                        className="grid grid-cols-[1fr_140px_140px_90px_80px] gap-2 px-4 py-3 items-center hover:bg-blue-50/30 border-b border-gray-100"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <img 
                            src={variant.productImage} 
                            alt={variant.title} 
                            className="w-8 h-8 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium text-gray-900 truncate">{variant.title}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate">ID: {variant.variantId.split('/').pop()}</p>
                          </div>
                        </div>
                        <div className="font-mono text-[11px] bg-gray-100 border border-gray-200 rounded-lg px-2 py-1.5 truncate">
                          {variant.sku && variant.sku !== "No SKU Found" ? variant.sku : "—"}
                        </div>
                        <input
                          type="text"
                          value={generatedSKUs[variant.variantId] || ""}
                          onChange={(e) => handleManualSKUEdit(variant.variantId, e.target.value)}
                          placeholder="Generate or type…"
                          className={`px-2 py-1.5 border-[1.5px] rounded-lg text-[11px] font-mono font-medium outline-none w-full ${
                            generatedSKUs[variant.variantId] 
                              ? "border-green-300 bg-green-50 text-green-800" 
                              : "border-gray-200 focus:border-blue-500"
                          }`}
                        />
                        <SKUStatusBadge status={status} />
                        <button
                          onClick={() => generateSingleSKU(variant.variantId, index)}
                          className="flex items-center justify-center gap-1 px-2 py-1.5 bg-blue-600 hover:bg-blue-800 text-white text-[10px] font-bold rounded-lg whitespace-nowrap"
                        >
                          <Zap className="w-2.5 h-2.5" />
                          Gen
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Table Footer */}
              <div className="px-4 py-3 border-t-[1.5px] border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span className="text-[13px] font-semibold text-gray-700">
                    {totalVariants} variants · {Object.keys(groupedVariants).length} unique products
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={generateAllSKUs}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-[1.5px] border-blue-600 text-blue-600 hover:bg-blue-50 text-[13px] font-bold rounded-lg transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Regenerate All
                  </button>
                  <button
                    onClick={openApplyModal}
                    disabled={variantsWithGenerated === 0}
                    className={`flex items-center gap-2 px-5 py-2 ${
                      variantsWithGenerated > 0 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" 
                        : "bg-gray-400 cursor-not-allowed"
                    } text-white text-[13px] font-bold rounded-lg shadow-md shadow-blue-600/25`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    Apply SKUs to Store
                  </button>
                </div>
              </div>
            </>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">

            {/* Store Prefixes Panel */}
            <div className="bg-white border-[1.5px] border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b-[1.5px] border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-[14px] font-extrabold text-gray-900">Store Prefixes</h3>
                  <p className="text-[11px] text-gray-500">Click to use a prefix</p>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {storePrefixes.map(store => (
                  <button
                    key={store.code}
                    onClick={() => setPrefix(store.code)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${
                      prefix === store.code
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-left">
                      <div className="text-[13px] font-bold text-gray-900">{store.name}</div>
                      <div className="text-[10.5px] text-gray-500 mt-0.5">{store.variantCount} variants</div>
                    </div>
                    <div className="text-[12px] font-mono font-bold bg-white border border-gray-200 rounded-md px-2.5 py-1">
                      {store.code}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-[1.5px] border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <h4 className="text-[13px] font-extrabold text-blue-900 mb-1">SKU Format Tips</h4>
                  <ul className="text-[11px] text-blue-800 space-y-1">
                    <li>• Use consistent prefixes per vendor/category</li>
                    <li>• Keep SKUs under 20 characters for compatibility</li>
                    <li>• Avoid special characters except dash or underscore</li>
                    <li>• Pad numbers for easier sorting (0001 vs 1)</li>
                    <li>• Each variant gets its own unique SKU</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Bar */}
        {floatBarVisible && variantsWithGenerated > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 rounded-xl shadow-2xl p-4 flex items-center gap-6 min-w-[500px] animate-slideUp z-50">
            <div className="flex-1">
              <p className="text-white text-[14px] font-bold">
                {prefix} Prefix · {variantsWithGenerated} SKUs Ready
              </p>
              <p className="text-gray-400 text-[12px] mt-0.5">
                {totalVariants} variants · {stats.withoutSKU} need SKUs · {stats.duplicates} conflicts
              </p>
            </div>
            <button
              onClick={openApplyModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-[13px] font-bold rounded-lg shadow-lg"
            >
              Apply SKUs to Store
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFloatBarVisible(false)}
              className="text-gray-500 hover:text-white text-[13px] font-semibold"
            >
              Clear
            </button>
          </div>
        )}

        {/* Apply Modal */}
        <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Save className="w-5 h-5 text-blue-500" />
                Confirm SKU Application
              </DialogTitle>
              <DialogDescription>
                Review the changes before applying to your Shopify store
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-extrabold text-green-600">
                  {optimizationResults.filter(r => r.oldSKU === "(Empty)" || r.oldSKU === "No SKU Found").length}
                </p>
                <p className="text-xs text-green-700 font-medium mt-1">New SKUs to Set</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                <p className="text-2xl font-extrabold text-amber-600">
                  {optimizationResults.filter(r => r.oldSKU !== "(Empty)" && r.oldSKU !== "No SKU Found").length}
                </p>
                <p className="text-xs text-amber-700 font-medium mt-1">SKUs to Replace</p>
              </div>
            </div>

            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">SKU Mapping Preview</p>
            <div className="max-h-[300px] overflow-y-auto space-y-2 mb-4">
              {optimizationResults.map(result => (
                <div key={result.variantId} className="grid grid-cols-[1fr_24px_1fr] gap-3 items-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div>
                    <div className="text-[11px] text-gray-400 truncate">{result.variantTitle}</div>
                    <div className="text-[11px] font-mono text-gray-500 truncate">{result.oldSKU === "No SKU Found" ? "(Empty)" : result.oldSKU}</div>
                  </div>
                  <div className="text-blue-500 text-sm text-center">→</div>
                  <div>
                    <div className="text-[11px] text-gray-400 truncate">New SKU</div>
                    <div className="text-[11px] font-mono font-bold text-green-600 truncate">{result.newSKU}</div>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowApplyModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleApplySKUs} className="bg-gradient-to-r from-green-600 to-emerald-600 gap-2">
                <CheckCircle className="w-4 h-4" />
                Apply All SKUs ({optimizationResults.length} changes)
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
                Updating SKUs
              </DialogTitle>
              <DialogDescription>
                Please wait while we update your variant SKUs...
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Progress value={(progress.current / Math.max(progress.total, 1)) * 100} className="h-2" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">{progress.status}</p>
                <p className="text-xs text-gray-500 mt-1">{progress.current} of {progress.total} variants processed</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-green-500" />
                SKUs Applied!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Successfully Updated!</h3>
                <p className="text-gray-600">
                  {optimizationResults.length} variant SKUs have been updated in your Shopify store.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowSuccessModal(false)}>
                Done
              </Button>
              <Button onClick={() => {
                setShowSuccessModal(false);
                fetchVariants();
              }} className="bg-gradient-to-r from-blue-600 to-indigo-600">
                Optimize More
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>

      {/* Add animation style */}
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1);
        }
      `}</style>
    </AppLayout>
  );
}