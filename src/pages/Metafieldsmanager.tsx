import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";
import {
  ChevronLeft, Search, Sparkles, Loader2, Check, Package,
  X, Plus, AlertTriangle, ChevronRight, Pencil, DatabaseZap,
  ShoppingBag, Link2, Hash,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StoreProduct {
  id: string;
  title: string;
  image: string | null;
  _id?: string;
}

interface MetaProduct {
  _id: string;
  shopId: string;
  productId: string;
  title: string;
  productType?: string;
  vendor?: string;
  productImage: string | null;
  optimized: boolean;
  metafields?: {
    search_boost_keywords?: { short: string[]; long: string[]; synonyms: string[] };
    complementary_products?: StoreProduct[];
    related_products?: StoreProduct[];
  };
  related_products?: StoreProduct[]; // store's own product pool
  createdAt: string;
  updatedAt: string;
}

interface LocalMF {
  keywords: string[];         // flat list – search_product_boosts
  complementary: StoreProduct[];
  related: StoreProduct[];
}

type TabKey = "boost" | "comp" | "related";

interface MetafieldStatus {
  search_product_boosts: boolean;
  complementary_products: boolean;
  related_products: boolean;
}

// ─── Metafield definitions to create ─────────────────────────────────────────

const MF_DEFS = [
  { name: "Search product boosts", namespace: "custom", key: "search_product_boosts", type: "list.single_line_text_field" },
  { name: "Complementary products", namespace: "custom", key: "complementary_products", type: "list.product_reference" },
  { name: "Related products",       namespace: "custom", key: "related_products",       type: "list.product_reference" },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyLocal(): LocalMF {
  return { keywords: [], complementary: [], related: [] };
}

function hasKeywords(lm: LocalMF | undefined) { return (lm?.keywords?.length ?? 0) > 0; }
function hasComp(lm: LocalMF | undefined)     { return (lm?.complementary?.length ?? 0) > 0; }
function hasRel(lm: LocalMF | undefined)       { return (lm?.related?.length ?? 0) > 0; }
function isFull(lm: LocalMF | undefined)       { return hasKeywords(lm) && hasComp(lm) && hasRel(lm); }

// ─── Keyword Pill ─────────────────────────────────────────────────────────────

function KwPill({ tag, onRemove }: { tag: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200 whitespace-nowrap">
      {tag}
      <button onClick={onRemove} className="hover:opacity-60 transition-opacity">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

// ─── Product Picker Item ──────────────────────────────────────────────────────

function ProductPickerItem({
  product, selected, onToggle,
}: { product: StoreProduct; selected: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-2.5 px-3 py-2 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
        selected ? "bg-green-50" : "hover:bg-blue-50"
      }`}
    >
      <div
        className={`w-3.5 h-3.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
          selected ? "bg-green-500 border-green-500" : "border-gray-300 bg-white"
        }`}
      >
        {selected && <Check className="w-2 h-2 text-white" />}
      </div>
      <div className="w-7 h-7 rounded-[5px] bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
        {product.image ? (
          <img src={product.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm">📦</span>
        )}
      </div>
      <span className="flex-1 text-[11.5px] font-semibold text-gray-800 truncate">{product.title}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MetafieldsManager() {
  const navigate = useNavigate();

  // Data
  const [products, setProducts]   = useState<MetaProduct[]>([]);
  const [loading, setLoading]     = useState(true);

  // Local edits per productId
  const [localMap, setLocalMap]   = useState<Record<string, LocalMF>>({});

  // Panel / tab
  const [activePid, setActivePid] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("boost");

  // Selection
  const [selected, setSelected]   = useState<Set<string>>(new Set());

  // Filters
  const [searchQ, setSearchQ]     = useState("");
  const [filterStatus, setFilter] = useState("");

  // Keyword input
  const [kwInput, setKwInput]     = useState("");

  // AI keyword
  const [aiKwRunning, setAiKwRunning] = useState(false);
  const [aiKwStep, setAiKwStep]       = useState("");

  // Bulk AI
  const [bulkOpen, setBulkOpen]     = useState(false);
  const [bulkItems, setBulkItems]   = useState<Array<{pid:string;status:"waiting"|"processing"|"done";statusText:string}>>([]);
  const [bulkProgress, setBulkProgress] = useState(0);
  const bulkCancelRef = useRef(false);

  // Panel save
  const [savingPanel, setSavingPanel]     = useState(false);
  const [panelSaved, setPanelSaved]       = useState(false);

  // Metafield check
  const [mfStatus, setMfStatus]           = useState<MetafieldStatus | null>(null);
  const [checkingMF, setCheckingMF]       = useState(true);
  const [creatingMF, setCreatingMF]       = useState(false);
  const [mfCreateError, setMfCreateError] = useState<string | null>(null);

  // Apply modal
  const [showApply, setShowApply]           = useState(false);
  const [applying, setApplying]             = useState(false);
  const [applyProg, setApplyProg]           = useState({ cur: 0, total: 0 });
  const [applyError, setApplyError]         = useState<string | null>(null);
  const [showSuccess, setShowSuccess]       = useState(false);
  const [successCount, setSuccessCount]     = useState(0);

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchData();
    checkAllMetafields();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const data: MetaProduct[] = await getApi(ApiConfig.getMetafieldsProducts);
      setProducts(data || []);

      // Pre-populate localMap from existing metafields
      const init: Record<string, LocalMF> = {};
      (data || []).forEach((p) => {
        const mf = p.metafields;
        if (!mf) return;
        const kws = [
          ...(mf.search_boost_keywords?.short ?? []),
          ...(mf.search_boost_keywords?.long ?? []),
          ...(mf.search_boost_keywords?.synonyms ?? []),
        ];
        init[p.productId] = {
          keywords: kws,
          complementary: mf.complementary_products ?? [],
          related: mf.related_products ?? [],
        };
      });
      setLocalMap(init);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function checkAllMetafields() {
    setCheckingMF(true);
    const status: MetafieldStatus = {
      search_product_boosts: false,
      complementary_products: false,
      related_products: false,
    };
    for (const key of Object.keys(status) as (keyof MetafieldStatus)[]) {
      try {
        const res = await postApi(ApiConfig.checkMetafields, { metaFieldName: key });
        status[key] = !!(res?.id);
      } catch { status[key] = false; }
    }
    setMfStatus(status);
    setCheckingMF(false);
  }

  const allMFCreated = mfStatus
    ? Object.values(mfStatus).every(Boolean)
    : false;

  async function createMissingMetafields() {
    if (!mfStatus) return;
    setCreatingMF(true);
    setMfCreateError(null);
    try {
      for (const def of MF_DEFS) {
        if (mfStatus[def.key as keyof MetafieldStatus]) continue;
        await postApi(ApiConfig.createMetaFields, {
          name: def.name,
          namespace: def.namespace,
          key: def.key,
          type: def.type,
        });
      }
      await checkAllMetafields();
    } catch (e: any) {
      setMfCreateError(e?.message || "Failed to create metafields");
    }
    setCreatingMF(false);
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  function getLM(pid: string): LocalMF { return localMap[pid] || emptyLocal(); }

  function getVisible() {
    return products.filter((p) => {
      const mq = !searchQ ||
        p.title.toLowerCase().includes(searchQ.toLowerCase()) ||
        p.productId.toLowerCase().includes(searchQ.toLowerCase());
      const lm = getLM(p.productId);
      const ms =
        !filterStatus ||
        (filterStatus === "boost"   && hasKeywords(lm)) ||
        (filterStatus === "comp"    && hasComp(lm)) ||
        (filterStatus === "related" && hasRel(lm)) ||
        (filterStatus === "empty"   && !hasKeywords(lm) && !hasComp(lm) && !hasRel(lm)) ||
        (filterStatus === "full"    && isFull(lm));
      return mq && ms;
    });
  }

  const visible = getVisible();
  const allVisSel  = visible.length > 0 && visible.every((p) => selected.has(p.productId));
  const someVisSel = visible.some((p) => selected.has(p.productId));

  const activeProduct = activePid ? products.find((p) => p.productId === activePid) : null;
  const activeLM      = activePid ? getLM(activePid) : emptyLocal();

  // Pool of store products for the active product (excluding itself)
  const storePool: StoreProduct[] = activePid
    ? (activeProduct?.related_products ?? []).filter((sp) => sp.id !== activePid)
    : [];

  const totalBoost = products.filter((p) => hasKeywords(getLM(p.productId))).length;
  const totalComp  = products.filter((p) => hasComp(getLM(p.productId))).length;
  const totalRel   = products.filter((p) => hasRel(getLM(p.productId))).length;
  const totalFull  = products.filter((p) => isFull(getLM(p.productId))).length;
  const configuredCount = products.filter((p) => {
    const lm = getLM(p.productId);
    return hasKeywords(lm) || hasComp(lm) || hasRel(lm);
  }).length;

  // ── Mutations ─────────────────────────────────────────────────────────────

  function setLM(pid: string, fn: (prev: LocalMF) => LocalMF) {
    setLocalMap((prev) => ({ ...prev, [pid]: fn(prev[pid] || emptyLocal()) }));
  }

  function addKeyword(pid: string, kw: string) {
    const trimmed = kw.trim();
    if (!trimmed) return;
    setLM(pid, (prev) => ({
      ...prev,
      keywords: prev.keywords.includes(trimmed) ? prev.keywords : [...prev.keywords, trimmed],
    }));
  }

  function removeKeyword(pid: string, kw: string) {
    setLM(pid, (prev) => ({ ...prev, keywords: prev.keywords.filter((k) => k !== kw) }));
  }

  function toggleStoreProduct(pid: string, type: "complementary" | "related", sp: StoreProduct) {
    setLM(pid, (prev) => {
      const arr = prev[type];
      const exists = arr.some((x) => x.id === sp.id);
      return {
        ...prev,
        [type]: exists ? arr.filter((x) => x.id !== sp.id) : [...arr, sp],
      };
    });
  }

  // ── AI keywords ──────────────────────────────────────────────────────────

  async function runAIKeywords() {
    if (!activePid || !activeProduct || aiKwRunning) return;
    setAiKwRunning(true);
    const steps = [
      "🖼️ Reading product image…",
      "📖 Scanning product title…",
      "🔍 Extracting keywords…",
      "✅ Keywords ready!",
    ];
    for (const step of steps) {
      setAiKwStep(step);
      await delay(320 + Math.random() * 200);
    }
    try {
      const res = await postApi(ApiConfig.aikeywordAnalyzer, {
        title: activeProduct.title,
        imageUrl: activeProduct.productImage,
      });
      const kws: string[] = res?.primary_keywords ?? [];
      setLM(activePid, (prev) => ({
        ...prev,
        keywords: [...new Set([...prev.keywords, ...kws])],
      }));
    } catch (e) { console.error(e); }
    setAiKwRunning(false);
    setAiKwStep("");
  }

  // ── Bulk AI ───────────────────────────────────────────────────────────────

  async function runBulkAI() {
    const pids = [...selected];
    if (!pids.length) return;
    bulkCancelRef.current = false;
    setBulkItems(pids.map((pid) => ({ pid, status: "waiting", statusText: "Waiting…" })));
    setBulkProgress(0);
    setBulkOpen(true);

    for (let i = 0; i < pids.length; i++) {
      if (bulkCancelRef.current) break;
      const pid = pids[i];
      const p = products.find((x) => x.productId === pid);

      // Processing state
      setBulkItems((prev) => prev.map((item) =>
        item.pid === pid ? { ...item, status: "processing", statusText: "Generating keywords…" } : item
      ));

      try {
        if (p?.title || p?.productImage) {
          const res = await postApi(ApiConfig.aikeywordAnalyzer, {
            title: p!.title,
            imageUrl: p!.productImage,
          });
          const kws: string[] = res?.primary_keywords ?? [];
          setLM(pid, (prev) => ({
            ...prev,
            keywords: [...new Set([...prev.keywords, ...kws])],
          }));
        }
      } catch (e) { console.error(e); }

      setBulkItems((prev) => prev.map((item) =>
        item.pid === pid ? { ...item, status: "done", statusText: "✅ Keywords generated" } : item
      ));
      setBulkProgress(Math.round(((i + 1) / pids.length) * 100));
      await delay(120);
    }
  }

  // ── Panel save ────────────────────────────────────────────────────────────

  async function savePanel() {
    if (!activePid) return;
    setSavingPanel(true);
    const lm = getLM(activePid);
    try {
      // keywords
      if (lm.keywords.length > 0) {
        await postApi(ApiConfig.addProductsValue, {
          productId: activePid,
          namespace: "custom",
          key: "search_product_boosts",
          type: "list.single_line_text_field",
          value: JSON.stringify(lm.keywords),
        });
      }
      // complementary
      if (lm.complementary.length > 0) {
        await postApi(ApiConfig.addProductsValue, {
          productId: activePid,
          namespace: "custom",
          key: "complementary_products",
          type: "list.product_reference",
          value: JSON.stringify(lm.complementary.map((p) => p.id)),
        });
      }
      // related
      if (lm.related.length > 0) {
        await postApi(ApiConfig.addProductsValue, {
          productId: activePid,
          namespace: "custom",
          key: "related_products",
          type: "list.product_reference",
          value: JSON.stringify(lm.related.map((p) => p.id)),
        });
      }
      setPanelSaved(true);
      setTimeout(() => setPanelSaved(false), 2000);
    } catch (e) { console.error(e); }
    setSavingPanel(false);
  }

  // ── Apply all ─────────────────────────────────────────────────────────────

  async function handleApplyAll() {
    const toApply = products.filter((p) => {
      const lm = getLM(p.productId);
      return hasKeywords(lm) || hasComp(lm) || hasRel(lm);
    });
    if (!toApply.length) return;

    // Create missing metafields first if needed
    if (!allMFCreated) await createMissingMetafields();

    setApplying(true);
    setApplyError(null);
    setApplyProg({ cur: 0, total: toApply.length });

    let count = 0;
    for (let i = 0; i < toApply.length; i++) {
      const p = toApply[i];
      const lm = getLM(p.productId);
      setApplyProg({ cur: i + 1, total: toApply.length });
      try {
        if (lm.keywords.length > 0) {
          await postApi(ApiConfig.addProductsValue, {
            productId: p.productId,
            namespace: "custom",
            key: "search_product_boosts",
            type: "list.single_line_text_field",
            value: JSON.stringify(lm.keywords),
          });
        }
        if (lm.complementary.length > 0) {
          await postApi(ApiConfig.addProductsValue, {
            productId: p.productId,
            namespace: "custom",
            key: "complementary_products",
            type: "list.product_reference",
            value: JSON.stringify(lm.complementary.map((x) => x.id)),
          });
        }
        if (lm.related.length > 0) {
          await postApi(ApiConfig.addProductsValue, {
            productId: p.productId,
            namespace: "custom",
            key: "related_products",
            type: "list.product_reference",
            value: JSON.stringify(lm.related.map((x) => x.id)),
          });
        }
        count++;
      } catch (e) { console.error(e); }
    }

    setApplying(false);
    setApplyProg({ cur: 0, total: 0 });
    setShowApply(false);
    if (count > 0) {
      setSuccessCount(count);
      setShowSuccess(true);
      await fetchData();
    } else {
      setApplyError("No products updated. Please try again.");
    }
  }

  function delay(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout title="Metafields Manager">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Package className="w-12 h-12 animate-pulse text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 text-sm">Loading products…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Metafields Manager">
      <div className="flex flex-col h-screen bg-[#eef1f8] overflow-hidden">

        {/* ── TOP BAR ── */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 lg:px-6 bg-white border-b border-gray-200 h-[60px] z-50 shadow-sm">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-[10px] text-[12px] font-semibold text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all flex-shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none hidden sm:block">
              Optimization Suite
            </p>
            <p className="text-[15px] lg:text-[17px] font-extrabold text-gray-900 leading-tight">
              Metafields Manager
            </p>
            <p className="text-[10.5px] text-gray-500 hidden md:block">
              Search boost keywords · Complementary products · Related products
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#0f2878] text-white px-3 lg:px-4 py-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap flex-shrink-0">
            <Package className="w-3.5 h-3.5" />
            {products.length} Products
          </div>
        </div>

        {/* ── METAFIELD BANNER ── */}
        {!checkingMF && !allMFCreated && (
          <div className="flex-shrink-0 flex items-start lg:items-center gap-3 px-4 py-3 bg-amber-50 border-b border-amber-200 flex-wrap">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5 lg:mt-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-amber-700">Required metafields missing</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {MF_DEFS.map((def) => {
                  const exists = mfStatus?.[def.key as keyof MetafieldStatus];
                  return (
                    <span key={def.key}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        exists ? "bg-green-50 border-green-300 text-green-700" : "bg-red-50 border-red-300 text-red-700"
                      }`}
                    >
                      {exists ? "✓" : "✗"} {def.key}
                    </span>
                  );
                })}
              </div>
            </div>
            <button
              onClick={createMissingMetafields}
              disabled={creatingMF}
              className="flex items-center gap-2 px-3 py-2 bg-amber-600 text-white rounded-[9px] text-[12px] font-bold hover:bg-amber-700 transition-all disabled:opacity-50 flex-shrink-0"
            >
              {creatingMF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DatabaseZap className="w-3.5 h-3.5" />}
              {creatingMF ? "Creating…" : "Create Missing"}
            </button>
            {mfCreateError && <p className="text-[11px] text-red-600 font-semibold w-full">{mfCreateError}</p>}
          </div>
        )}
        {!checkingMF && allMFCreated && (
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 bg-green-50 border-b border-green-200">
            <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
            <p className="text-[11px] font-semibold text-green-700">
              All 3 metafields ready · custom.search_product_boosts · custom.complementary_products · custom.related_products
            </p>
          </div>
        )}

        {/* ── BODY ROW ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── LEFT COL ── */}
          <div className="flex-1 min-w-0 overflow-y-auto p-3 lg:p-4 flex flex-col gap-3">

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 flex-shrink-0">
              {[
                { label: "Search Keywords", val: totalBoost, unit: `/ ${products.length}`, note: `${totalBoost} products with keywords`, noteColor: "text-orange-600", fill: (totalBoost / Math.max(products.length,1))*100, bar: "#ea580c" },
                { label: "Complementary Set", val: totalComp,  unit: `/ ${products.length}`, note: '"Customers also bought"', noteColor: "text-teal-600",   fill: (totalComp / Math.max(products.length,1))*100,  bar: "#0891b2" },
                { label: "Related Products",  val: totalRel,   unit: `/ ${products.length}`, note: '"You may also like"',     noteColor: "text-blue-600",   fill: (totalRel / Math.max(products.length,1))*100,   bar: "#1a3faa" },
                { label: "Fully Configured",  val: totalFull,  unit: `/ ${products.length}`, note: "All metafields set",      noteColor: "text-green-600",  fill: (totalFull / Math.max(products.length,1))*100,  bar: "#12b76a" },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-[13px] p-3">
                  <p className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-[18px] lg:text-[20px] font-extrabold leading-none">
                    {s.val} <span className="text-[11px] font-medium text-gray-400">{s.unit}</span>
                  </p>
                  <p className={`text-[10px] font-semibold mt-1 ${s.noteColor}`}>{s.note}</p>
                  <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.fill}%`, background: s.bar }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Section header */}
            <div className="flex-shrink-0 bg-white border border-gray-200 rounded-[13px] p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-[9px] bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <Hash className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Per-Product Metafields</p>
                <p className="text-[13px] lg:text-[14px] font-extrabold text-gray-900">Product Metafield Editor</p>
                <p className="text-[11px] text-gray-500 hidden sm:block">
                  Click any product → edit in the panel. AI generates keywords from title + image.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilter(e.target.value)}
                  className="flex-1 sm:flex-none px-2.5 py-1.5 border border-gray-200 rounded-[9px] text-[12px] font-semibold text-gray-600 bg-white outline-none"
                >
                  <option value="">All Products</option>
                  <option value="boost">Has Keywords</option>
                  <option value="comp">Has Complementary</option>
                  <option value="related">Has Related</option>
                  <option value="empty">Not Configured</option>
                  <option value="full">Fully Configured</option>
                </select>
              </div>
            </div>

            {/* ── TABLE ── */}
            <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-[13px] overflow-hidden flex flex-col">

              {/* Toolbar */}
              <div className="flex-shrink-0 flex items-center gap-2 p-2.5 border-b border-gray-200 bg-gray-50 flex-wrap">
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white border border-gray-200 rounded-[9px] flex-1 max-w-[260px] focus-within:border-blue-500 transition-colors">
                  <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <input
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Search products…"
                    className="flex-1 bg-transparent outline-none text-[12px] placeholder:text-gray-300"
                  />
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {selected.size > 0 && (
                    <span className="text-[11.5px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full">
                      {selected.size} selected
                    </span>
                  )}
                  <button
                    onClick={runBulkAI}
                    disabled={selected.size === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-[9px] text-[11.5px] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all whitespace-nowrap"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span className="hidden sm:inline">✨ AI Generate</span>
                    <span className="sm:hidden">AI</span>
                  </button>
                </div>
              </div>

              {/* Table Head */}
              <div
                className="flex-shrink-0 grid px-3 lg:px-4 py-2 bg-gray-50 border-b border-gray-200 text-[9.5px] font-bold text-gray-400 uppercase tracking-wider"
                style={{ gridTemplateColumns: "32px 36px 1fr 90px 100px 80px 60px", gap: 5 }}
              >
                <div className="flex items-center justify-center">
                  <div
                    onClick={() => {
                      const ids = visible.map((p) => p.productId);
                      const allSel = ids.every((id) => selected.has(id));
                      setSelected((prev) => {
                        const s = new Set(prev);
                        allSel ? ids.forEach((id) => s.delete(id)) : ids.forEach((id) => s.add(id));
                        return s;
                      });
                    }}
                    className={`w-3.5 h-3.5 rounded border-2 cursor-pointer flex items-center justify-center transition-all ${
                      allVisSel ? "bg-blue-600 border-blue-600" : someVisSel ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                    }`}
                  >
                    {allVisSel && <Check className="w-2 h-2 text-white" />}
                    {someVisSel && !allVisSel && <div className="w-1.5 h-0.5 bg-white rounded" />}
                  </div>
                </div>
                <div />
                <div>Product</div>
                <div className="hidden sm:flex">Keywords</div>
                <div className="hidden md:flex">Complementary</div>
                <div className="hidden lg:flex">Related</div>
                <div>Action</div>
              </div>

              {/* Table Body */}
              <div className="flex-1 overflow-y-auto">
                {visible.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-14 text-gray-400">
                    <Package className="w-9 h-9 mb-2 opacity-20" />
                    <p className="text-sm font-semibold">No products found</p>
                  </div>
                )}
                {visible.map((p) => {
                  const lm      = getLM(p.productId);
                  const isSel   = selected.has(p.productId);
                  const isAct   = activePid === p.productId;
                  const full    = isFull(lm);
                  const kwCount = lm.keywords.length;
                  const cCount  = lm.complementary.length;
                  const rCount  = lm.related.length;

                  return (
                    <div
                      key={p.productId}
                      onClick={() => setActivePid(p.productId)}
                      className={`grid px-3 lg:px-4 py-2.5 border-b border-gray-100 last:border-b-0 items-center cursor-pointer transition-all ${
                        isAct ? "bg-purple-50 border-l-2 border-l-purple-500"
                          : isSel ? "bg-blue-50" : "hover:bg-gray-50/60"
                      }`}
                      style={{ gridTemplateColumns: "32px 36px 1fr 90px 100px 80px 60px", gap: 5 }}
                    >
                      {/* checkbox */}
                      <div className="flex items-center justify-center" onClick={(e) => {
                        e.stopPropagation();
                        setSelected((prev) => { const s = new Set(prev); s.has(p.productId) ? s.delete(p.productId) : s.add(p.productId); return s; });
                      }}>
                        <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all ${isSel ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"}`}>
                          {isSel && <Check className="w-2 h-2 text-white" />}
                        </div>
                      </div>

                      {/* thumb */}
                      <div className="relative">
                        <div className="w-8 h-8 rounded-[6px] bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                          {p.productImage ? <img src={p.productImage} alt="" className="w-full h-full object-cover" /> : <span className="text-sm">📦</span>}
                        </div>
                        {full && <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white flex items-center justify-center"><Check className="w-1.5 h-1.5 text-white" /></div>}
                      </div>

                      {/* title */}
                      <div className="min-w-0">
                        <p className="text-[11.5px] font-semibold text-gray-900 truncate">{p.title}</p>
                        <p className="text-[9.5px] text-gray-400 font-mono truncate">#{p.productId.split("/").pop()}</p>
                      </div>

                      {/* keywords */}
                      <div className="hidden sm:block">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-[5px] ${kwCount ? "bg-orange-50 text-orange-700 border border-orange-200" : "bg-gray-50 text-gray-300 border border-dashed border-gray-200 italic"}`}>
                          {kwCount ? `${kwCount} kw` : "— none"}
                        </span>
                      </div>

                      {/* complementary */}
                      <div className="hidden md:block">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-[5px] ${cCount ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-gray-50 text-gray-300 border border-dashed border-gray-200 italic"}`}>
                          {cCount ? `${cCount} products` : "— not set"}
                        </span>
                      </div>

                      {/* related */}
                      <div className="hidden lg:block">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-[5px] ${rCount ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-gray-50 text-gray-300 border border-dashed border-gray-200 italic"}`}>
                          {rCount ? `${rCount} products` : "— not set"}
                        </span>
                      </div>

                      {/* action */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActivePid(p.productId)}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-[6px] text-[10.5px] font-bold text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 flex items-center justify-between px-3 lg:px-4 py-2.5 border-t border-gray-200 bg-gray-50 flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-[7px] px-3 py-1.5 text-[12px] font-bold text-gray-700">
                  <Package className="w-3.5 h-3.5 text-gray-400" />
                  {products.length} products · {configuredCount} configured
                </div>
                <button
                  onClick={() => { setApplyError(null); setShowApply(true); }}
                  disabled={configuredCount === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-[9px] text-[12px] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  Push to Shopify
                </button>
              </div>
            </div>
          </div>
          {/* /left-col */}

          {/* ── RIGHT PANEL ── */}
          <div className="w-[340px] sm:w-[380px] lg:w-[460px] min-w-0 flex-shrink-0 bg-white border-l-2 border-gray-200 flex flex-col overflow-hidden shadow-[-4px_0_16px_rgba(15,23,42,.07)]">

            {/* Panel head */}
            <div className="flex-shrink-0 p-3.5 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-[9px] bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {activeProduct?.productImage ? (
                    <img src={activeProduct.productImage} alt="" className="w-full h-full object-cover" />
                  ) : <span className="text-xl">📦</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-extrabold text-gray-900 truncate">
                    {activeProduct?.title || "Select a product"}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono truncate">
                    {activePid ? `#${activePid.split("/").pop()} · ${activeProduct?.productType || ""}` : "Click any row to edit"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 flex border-b border-gray-200 bg-gray-50">
              {[
                { key: "boost",   icon: "🔍", label: "Search Boost",  dot: activePid ? hasKeywords(activeLM) : false },
                { key: "comp",    icon: "🛍️", label: "Complementary", dot: activePid ? hasComp(activeLM)     : false },
                { key: "related", icon: "🔗", label: "Related",        dot: activePid ? hasRel(activeLM)      : false },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key as TabKey)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[9.5px] sm:text-[10px] font-bold border-b-2 transition-all ${
                    activeTab === t.key
                      ? "text-blue-800 border-blue-600 bg-white"
                      : "text-gray-400 border-transparent hover:text-gray-600"
                  }`}
                >
                  <span className="text-sm">{t.icon}</span>
                  <span className="hidden sm:block">{t.label}</span>
                  <div className={`w-1.5 h-1.5 rounded-full transition-all ${t.dot ? "bg-green-500" : "bg-gray-200"}`} />
                </button>
              ))}
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-4">
              {!activePid ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
                  <div className="text-5xl">👆</div>
                  <p className="text-[13px] font-semibold text-center">Click a product row to edit its metafields</p>
                </div>
              ) : (
                <>
                  {/* ── BOOST TAB ── */}
                  {activeTab === "boost" && (
                    <div className="space-y-4">
                      <div className="font-mono text-[10px] bg-gray-50 border border-gray-200 rounded-[7px] px-3 py-1.5 flex items-center gap-1">
                        <span className="text-purple-600">custom</span>
                        <span className="text-gray-400">.</span>
                        <span className="text-blue-600">search_product_boosts</span>
                      </div>

                      <div className="bg-orange-50 border border-orange-200 rounded-[9px] p-3 text-[11.5px] text-orange-700 leading-relaxed">
                        <strong>🔍 Search Boost</strong> — AI reads the product title + image and generates primary keywords
                        that boost your product in storefront search.
                      </div>

                      {/* AI button */}
                      <button
                        onClick={runAIKeywords}
                        disabled={aiKwRunning || !activeProduct?.productImage}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-[9px] text-[12.5px] font-bold shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {aiKwRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {aiKwRunning ? aiKwStep || "Generating…" : "✨ Generate from Title + Image"}
                      </button>

                      {/* Keyword input */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-gray-600">Keywords</label>
                          <span className="text-[10px] font-semibold text-gray-400">{activeLM.keywords.length} added · Press Enter to add</span>
                        </div>
                        <div
                          className={`border rounded-[8px] p-2 min-h-[48px] flex flex-wrap gap-1.5 cursor-text transition-all ${
                            activeLM.keywords.length ? "border-blue-200 bg-blue-50/50" : "border-gray-200 bg-white focus-within:border-blue-500"
                          }`}
                          onClick={() => document.getElementById("kw-input")?.focus()}
                        >
                          {activeLM.keywords.map((kw) => (
                            <KwPill key={kw} tag={kw} onRemove={() => removeKeyword(activePid!, kw)} />
                          ))}
                          <input
                            id="kw-input"
                            value={kwInput}
                            onChange={(e) => setKwInput(e.target.value)}
                            onKeyDown={(e) => {
                              if ((e.key === "Enter" || e.key === ",") && kwInput.trim()) {
                                e.preventDefault();
                                addKeyword(activePid!, kwInput.replace(/,$/, "").trim());
                                setKwInput("");
                              }
                            }}
                            placeholder={activeLM.keywords.length ? "Add more…" : "e.g. office chair…"}
                            className="border-none outline-none bg-transparent text-[12px] font-semibold min-w-[120px] text-gray-900 placeholder:text-gray-300"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── COMP / RELATED TABS ── */}
                  {(activeTab === "comp" || activeTab === "related") && (() => {
                    const isComp = activeTab === "comp";
                    const field  = isComp ? "complementary" : "related" as const;
                    const selectedProds = activeLM[field];
                    const selectedIds   = new Set(selectedProds.map((x) => x.id));

                    // pool = store products not already selected at top, then rest
                    const poolFiltered = storePool.filter((sp) => !selectedIds.has(sp.id));

                    return (
                      <div className="space-y-3">
                        <div className="font-mono text-[10px] bg-gray-50 border border-gray-200 rounded-[7px] px-3 py-1.5 flex items-center gap-1">
                          <span className="text-purple-600">custom</span>
                          <span className="text-gray-400">.</span>
                          <span className="text-blue-600">{isComp ? "complementary_products" : "related_products"}</span>
                        </div>

                        <div className={`rounded-[9px] p-3 text-[11.5px] leading-relaxed ${
                          isComp ? "bg-teal-50 border border-teal-200 text-teal-700" : "bg-blue-50 border border-blue-200 text-blue-700"
                        }`}>
                          {isComp
                            ? <><strong>🛍️ Complementary Products</strong> — Paired with products from a different category. Shown as "Customers also bought".</>
                            : <><strong>🔗 Related Products</strong> — Similar products the customer may prefer. Shown as "You may also like".</>
                          }
                        </div>

                        {/* Selected products preview */}
                        {selectedProds.length > 0 && (
                          <div>
                            <p className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                              Selected ({selectedProds.length})
                            </p>
                            <div className="border border-gray-200 rounded-[9px] overflow-hidden divide-y divide-gray-100 max-h-[160px] overflow-y-auto">
                              {selectedProds.map((sp) => (
                                <div key={sp.id} className="flex items-center gap-2.5 px-3 py-2 bg-green-50">
                                  <div className="w-7 h-7 rounded-[5px] bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                    {sp.image ? <img src={sp.image} alt="" className="w-full h-full object-cover" /> : <span className="text-xs">📦</span>}
                                  </div>
                                  <span className="flex-1 text-[11px] font-semibold text-gray-800 truncate">{sp.title}</span>
                                  <button
                                    onClick={() => toggleStoreProduct(activePid!, field, sp)}
                                    className="w-5 h-5 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-200 transition-all flex-shrink-0"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Product pool to pick from */}
                        {poolFiltered.length > 0 && (
                          <div>
                            <p className="text-[10.5px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                              Add from store ({poolFiltered.length} available)
                            </p>
                            <div className="border border-gray-200 rounded-[9px] overflow-hidden max-h-[220px] overflow-y-auto">
                              {poolFiltered.map((sp) => (
                                <ProductPickerItem
                                  key={sp.id}
                                  product={sp}
                                  selected={selectedIds.has(sp.id)}
                                  onToggle={() => toggleStoreProduct(activePid!, field, sp)}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {storePool.length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p className="text-[12px] font-semibold">No store products available</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {/* Panel footer */}
            <div className="flex-shrink-0 flex gap-2 p-3.5 border-t border-gray-200 bg-white">
              <button
                disabled={!activePid}
                onClick={() => {
                  if (!activePid) return;
                  setLM(activePid, (prev) => {
                    if (activeTab === "boost")   return { ...prev, keywords: [] };
                    if (activeTab === "comp")     return { ...prev, complementary: [] };
                    return { ...prev, related: [] };
                  });
                }}
                className="flex-1 py-2.5 bg-white border border-gray-200 rounded-[9px] text-[12.5px] font-semibold text-gray-600 hover:border-red-400 hover:text-red-500 transition-all disabled:opacity-40"
              >
                Clear Tab
              </button>
              <button
                disabled={!activePid || savingPanel}
                onClick={savePanel}
                className={`flex-[1.5] flex items-center justify-center gap-2 py-2.5 rounded-[9px] text-[12.5px] font-bold transition-all disabled:opacity-40 ${
                  panelSaved ? "bg-green-500 text-white" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:-translate-y-0.5"
                }`}
              >
                {savingPanel ? <Loader2 className="w-4 h-4 animate-spin" /> : panelSaved ? <><Check className="w-4 h-4" /> Saved!</> : "✓ Save Metafields"}
              </button>
            </div>
          </div>
          {/* /right-panel */}

        </div>
        {/* /body-row */}

        {/* ── BULK AI OVERLAY ── */}
        <Dialog open={bulkOpen} onOpenChange={(o) => { if (!o) { bulkCancelRef.current = true; setBulkOpen(false); } }}>
          <DialogContent className="max-w-[520px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[15px] font-extrabold">
                <span className="text-2xl">🤖</span> AI Generating Keywords
              </DialogTitle>
              <p className="text-[12px] text-gray-500">Processing {bulkItems.length} selected product{bulkItems.length !== 1 ? "s" : ""}…</p>
            </DialogHeader>

            <div className="space-y-4 mt-1">
              {/* Overall progress */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-gray-600">Overall Progress</span>
                  <span className="text-[11px] font-bold text-gray-600">{bulkProgress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-400" style={{ width: `${bulkProgress}%` }} />
                </div>
              </div>

              {/* Per-product list */}
              <div className="max-h-[260px] overflow-y-auto flex flex-col gap-2">
                {bulkItems.map((item) => {
                  const p = products.find((x) => x.productId === item.pid);
                  return (
                    <div key={item.pid} className={`flex items-center gap-3 p-3 border rounded-[9px] transition-all ${
                      item.status === "processing" ? "border-purple-200 bg-purple-50"
                        : item.status === "done" ? "border-green-200 bg-green-50"
                        : "border-gray-200 bg-white opacity-50"
                    }`}>
                      <div className="w-8 h-8 rounded-[6px] bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {p?.productImage ? <img src={p.productImage} alt="" className="w-full h-full object-cover" /> : <span>📦</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11.5px] font-bold truncate">{p?.title}</p>
                        <p className={`text-[10.5px] font-semibold mt-0.5 ${
                          item.status === "done" ? "text-green-600" : item.status === "processing" ? "text-purple-600" : "text-gray-400"
                        }`}>{item.statusText}</p>
                      </div>
                      <div className="flex-shrink-0 text-lg">
                        {item.status === "done" ? "✅" : item.status === "processing" ? <Loader2 className="w-4 h-4 animate-spin text-purple-500" /> : "⏳"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { bulkCancelRef.current = true; setBulkOpen(false); }} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => { setBulkOpen(false); if (selected.size > 0) setActivePid([...selected][0]); }}
                disabled={bulkProgress < 100}
                className="flex-[2] bg-gradient-to-r from-green-500 to-emerald-600"
              >
                {bulkProgress < 100 ? "Processing…" : "✓ Done — View Results"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── APPLY MODAL ── */}
        <Dialog open={showApply} onOpenChange={(o) => !applying && setShowApply(o)}>
          <DialogContent className="max-w-[540px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[16px] font-extrabold">
                <Hash className="w-5 h-5 text-blue-500" />
                Push Metafields to Shopify
              </DialogTitle>
              <p className="text-[12px] text-gray-500">Review before saving to your store</p>
            </DialogHeader>

            <div className="space-y-4 mt-1">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { val: configuredCount, label: "Will Update",  color: "#12b76a" },
                  { val: totalBoost,      label: "With Keywords", color: "#ea580c" },
                  { val: totalComp,       label: "Complementary", color: "#0891b2" },
                  { val: totalRel,        label: "Related",        color: "#1a3faa" },
                ].map((s, i) => (
                  <div key={i} className="text-center bg-gray-50 border border-gray-200 rounded-[9px] p-2.5">
                    <p className="text-[20px] font-extrabold" style={{ color: s.color }}>{s.val}</p>
                    <p className="text-[9.5px] text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {!allMFCreated && (
                <div className="bg-amber-50 border border-amber-200 rounded-[9px] p-3 text-[12px] text-amber-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  Missing metafields will be created automatically before pushing.
                </div>
              )}

              {/* Product list preview */}
              <div className="max-h-[220px] overflow-y-auto flex flex-col gap-1.5">
                {products.map((p) => {
                  const lm  = getLM(p.productId);
                  const has = hasKeywords(lm) || hasComp(lm) || hasRel(lm);
                  const chips = [
                    hasKeywords(lm) && { label: `${lm.keywords.length} keywords`, color: "bg-orange-50 text-orange-700 border-orange-200" },
                    hasComp(lm)     && { label: `${lm.complementary.length} comp.`, color: "bg-teal-50 text-teal-700 border-teal-200" },
                    hasRel(lm)      && { label: `${lm.related.length} related`,     color: "bg-blue-50 text-blue-700 border-blue-200" },
                  ].filter(Boolean) as { label: string; color: string }[];
                  return (
                    <div key={p.productId} className={`flex items-start gap-2.5 px-3 py-2.5 border rounded-[9px] ${has ? "border-blue-200 bg-blue-50" : "border-gray-100 bg-gray-50 opacity-50"}`}>
                      <div className="w-7 h-7 rounded-[5px] bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {p.productImage ? <img src={p.productImage} alt="" className="w-full h-full object-cover" /> : <span>📦</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11.5px] font-bold truncate">{p.title}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {chips.length > 0 ? chips.map((c, i) => (
                            <span key={i} className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border ${c.color}`}>{c.label}</span>
                          )) : <span className="text-[10px] text-gray-300 italic">No metafields</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-[9px] p-3 text-[12px] text-blue-700">
                <strong>📦 All configured metafields</strong> will be saved to their Shopify metafield namespaces. Products with no metafields are untouched.
              </div>

              {applyError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[12px] text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {applyError}
                </div>
              )}

              {applying && (
                <div className="bg-blue-50 border border-blue-200 rounded-[9px] p-3">
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[12px] font-semibold text-blue-700">Pushing metafields…</span>
                    <span className="text-[12px] font-bold text-blue-700">{applyProg.cur}/{applyProg.total}</span>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300"
                      style={{ width: `${(applyProg.cur / Math.max(applyProg.total, 1)) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 mt-2">
              <Button variant="outline" onClick={() => setShowApply(false)} disabled={applying} className="flex-1">Cancel</Button>
              <Button onClick={handleApplyAll} disabled={applying || configuredCount === 0}
                className="flex-[2] bg-gradient-to-r from-blue-600 to-purple-600 gap-2">
                {applying ? <><Loader2 className="w-4 h-4 animate-spin" />Pushing…</> : <><Check className="w-4 h-4" />✓ Push to Shopify</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── SUCCESS MODAL ── */}
        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="max-w-[440px]">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4 text-3xl">🎉</div>
              <h3 className="text-[20px] font-extrabold text-gray-900 mb-2">Metafields Saved!</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed mb-5">
                Metafields for <strong>{successCount} product{successCount !== 1 ? "s" : ""}</strong> pushed to Shopify successfully.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSuccess(false)} className="flex-1">Close</Button>
                <Button onClick={() => { setShowSuccess(false); setLocalMap({}); fetchData(); }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">Done →</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}