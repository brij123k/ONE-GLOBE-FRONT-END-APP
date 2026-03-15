import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";
import {
  ChevronLeft,
  Search,
  Sparkles,
  Loader2,
  Check,
  Package,
  Pencil,
  ChevronRight,
  X,
  Plus,
  Tag,
  ShoppingCart,
  Link2,
  Settings2,
  AlertCircle,
  ZapIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MFProduct {
  _id: string;
  shopId: string;
  productId: string;
  title: string;
  productType?: string;
  vendor?: string;
  productImage: string | null;
  metafields?: ExistingMetafields;
}

interface ExistingMetafields {
  search_boost_keywords?: {
    short?: string[];
    long?: string[];
    synonyms?: string[];
  };
  complementary_products?: string[];   // product IDs
  related_products?: string[];         // product IDs
}

// AI response shapes
interface AIKeywordsResult {
  short: string[];
  long: string[];
  synonyms: string[];
}

interface AIProductSuggestionsResult {
  complementary: string[];  // productIds
  related: string[];        // productIds
}

// Local editable state
interface KeywordData {
  short: string[];
  long: string[];
  syn: string[];
}

interface ProductListData {
  mode: "manual" | "ai";
  prods: string[]; // productIds
}

interface ProductMFState {
  kw?: KeywordData;
  comp?: ProductListData;
  rel?: ProductListData;
}

type PanelTab = "boost" | "comp" | "related";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hasBoost(s?: ProductMFState) {
  if (!s?.kw) return false;
  return (s.kw.short?.length || 0) + (s.kw.long?.length || 0) + (s.kw.syn?.length || 0) > 0;
}
function hasComp(s?: ProductMFState) { return (s?.comp?.prods?.length || 0) > 0; }
function hasRel(s?: ProductMFState) { return (s?.rel?.prods?.length || 0) > 0; }
function isFull(s?: ProductMFState) { return hasBoost(s) && hasComp(s) && hasRel(s); }
function kwTotal(s?: ProductMFState) {
  if (!s?.kw) return 0;
  return (s.kw.short?.length || 0) + (s.kw.long?.length || 0) + (s.kw.syn?.length || 0);
}

// ─── Keyword Tag ─────────────────────────────────────────────────────────────

function KwTag({
  tag, variant, onRemove,
}: { tag: string; variant: "short" | "long" | "syn"; onRemove: () => void }) {
  const styles = {
    short: "bg-orange-50 text-orange-700 border border-orange-200",
    long: "bg-purple-50 text-purple-700 border border-purple-200",
    syn: "bg-green-50 text-green-700 border border-green-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${styles[variant]}`}>
      {tag}
      <button onClick={onRemove} className="hover:opacity-60 transition-opacity flex items-center">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

// ─── Keyword Area ─────────────────────────────────────────────────────────────

function KeywordArea({
  label, arrKey, variant, placeholder, tags,
  onAdd, onRemove,
}: {
  label: string; arrKey: "short" | "long" | "syn"; variant: "short" | "long" | "syn";
  placeholder: string; tags: string[];
  onAdd: (k: "short" | "long" | "syn", v: string) => void;
  onRemove: (k: "short" | "long" | "syn", v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const areaStyles = tags.length > 0 ? "border-indigo-200 bg-indigo-50/50" : "border-gray-200 bg-white";

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-gray-600">{label}</span>
        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {tags.length} added
        </span>
      </div>
      <div
        className={`flex flex-wrap gap-1.5 p-2 border rounded-[8px] min-h-[44px] cursor-text transition-colors focus-within:border-blue-500 focus-within:bg-blue-50/30 ${areaStyles}`}
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((t) => (
          <KwTag key={t} tag={t} variant={variant} onRemove={() => onRemove(arrKey, t)} />
        ))}
        <input
          ref={inputRef}
          className="border-none outline-none text-[12px] font-medium bg-transparent min-w-[140px] flex-1 placeholder:text-gray-300"
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              const v = (e.target as HTMLInputElement).value.trim().replace(/,$/, "");
              if (v) { onAdd(arrKey, v); (e.target as HTMLInputElement).value = ""; }
            }
          }}
        />
      </div>
    </div>
  );
}

// ─── Product Picker Item ─────────────────────────────────────────────────────

function ProdPickerItem({
  product, selected, isAISug, onClick,
}: {
  product: MFProduct; selected: boolean; isAISug: boolean; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 px-3 py-2 border-b border-gray-100 last:border-b-0 cursor-pointer transition-colors ${
        selected ? "bg-green-50" : isAISug ? "bg-purple-50/60" : "hover:bg-blue-50/40"
      }`}
    >
      <div
        className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
          selected ? "bg-green-500 border-green-500" : "border-gray-300 bg-white"
        }`}
      >
        {selected && <Check className="w-2 h-2 text-white" />}
      </div>
      <div className="w-7 h-7 rounded-[6px] bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-sm flex-shrink-0">
        {product.productImage ? (
          <img src={product.productImage} alt="" className="w-full h-full object-cover" />
        ) : "📦"}
      </div>
      <span className="flex-1 text-[11.5px] font-semibold text-gray-800 truncate">{product.title}</span>
      {isAISug && !selected && (
        <span className="text-[9px] font-extrabold text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
          ✦ AI
        </span>
      )}
      {selected && (
        <span className="text-[9px] font-extrabold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
          ✓
        </span>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function MetafieldsManager() {
  const navigate = useNavigate();

  // Data
  const [products, setProducts] = useState<MFProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Local state: pid → ProductMFState
  const [mfMap, setMfMap] = useState<Record<string, ProductMFState>>({});

  // Panel
  const [activePid, setActivePid] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<PanelTab>("boost");

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // AI per-product keyword gen
  const [aiKwRunning, setAiKwRunning] = useState(false);
  const [aiKwStep, setAiKwStep] = useState("");

  // AI suggestions per-product (comp/rel)
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, AIProductSuggestionsResult>>({});

  // Bulk AI
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkCancelled, setBulkCancelled] = useState(false);
  const bulkCancelRef = useRef(false);
  const [bulkItems, setBulkItems] = useState<
    { pid: string; status: "waiting" | "processing" | "done"; statusText: string; kw: number; comp: number; rel: number }[]
  >([]);
  const [bulkDone, setBulkDone] = useState(false);
  const [showBulkOverlay, setShowBulkOverlay] = useState(false);

  // Panel save
  const [savingPanel, setSavingPanel] = useState(false);
  const [panelSaveSuccess, setPanelSaveSuccess] = useState(false);

  // Apply modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyProgress, setApplyProgress] = useState({ current: 0, total: 0 });
  const [applyError, setApplyError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  // ── Fetch ──────────────────────────────────────────────────────────────

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const data: MFProduct[] = await getApi(ApiConfig.getMetafieldsProducts);
      setProducts(data || []);
      // Pre-populate from existing metafields
      const init: Record<string, ProductMFState> = {};
      (data || []).forEach((p) => {
        if (!p.metafields) return;
        const mf = p.metafields;
        const state: ProductMFState = {};
        if (mf.search_boost_keywords) {
          state.kw = {
            short: mf.search_boost_keywords.short || [],
            long: mf.search_boost_keywords.long || [],
            syn: mf.search_boost_keywords.synonyms || [],
          };
        }
        if (mf.complementary_products?.length) {
          state.comp = { mode: "manual", prods: mf.complementary_products };
        }
        if (mf.related_products?.length) {
          state.rel = { mode: "manual", prods: mf.related_products };
        }
        if (Object.keys(state).length) init[p.productId] = state;
      });
      setMfMap(init);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ── Derived ──────────────────────────────────────────────────────────────

  function getMF(pid: string): ProductMFState { return mfMap[pid] || {}; }
  function setMF(pid: string, update: (prev: ProductMFState) => ProductMFState) {
    setMfMap((prev) => ({ ...prev, [pid]: update(prev[pid] || {}) }));
  }

  function getVisible() {
    return products.filter((p) => {
      const mq = !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productId.toLowerCase().includes(searchQuery.toLowerCase());
      const s = getMF(p.productId);
      const ms = !filterStatus ||
        (filterStatus === "boost" && hasBoost(s)) ||
        (filterStatus === "comp" && hasComp(s)) ||
        (filterStatus === "related" && hasRel(s)) ||
        (filterStatus === "empty" && !hasBoost(s) && !hasComp(s) && !hasRel(s)) ||
        (filterStatus === "full" && isFull(s));
      return mq && ms;
    });
  }

  const visible = getVisible();
  const allVisibleSel = visible.length > 0 && visible.every((p) => selected.has(p.productId));
  const someVisibleSel = visible.some((p) => selected.has(p.productId));
  const activeProduct = activePid ? products.find((p) => p.productId === activePid) : null;
  const activeMF = activePid ? getMF(activePid) : undefined;
  const activeAISug = activePid ? aiSuggestions[activePid] : undefined;

  const totalBoost = products.filter((p) => hasBoost(getMF(p.productId))).length;
  const totalComp = products.filter((p) => hasComp(getMF(p.productId))).length;
  const totalRel = products.filter((p) => hasRel(getMF(p.productId))).length;
  const totalFull = products.filter((p) => isFull(getMF(p.productId))).length;
  const configured = products.filter((p) => {
    const s = getMF(p.productId); return hasBoost(s) || hasComp(s) || hasRel(s);
  });

  // ── Selection ──────────────────────────────────────────────────────────

  function toggleSel(pid: string) {
    setSelected((prev) => { const s = new Set(prev); s.has(pid) ? s.delete(pid) : s.add(pid); return s; });
  }
  function toggleAll() {
    const ids = visible.map((p) => p.productId);
    const allSel = ids.every((id) => selected.has(id));
    setSelected((prev) => {
      const s = new Set(prev);
      allSel ? ids.forEach((id) => s.delete(id)) : ids.forEach((id) => s.add(id));
      return s;
    });
  }

  // ── Keyword actions ────────────────────────────────────────────────────

  function kwAdd(pid: string, arr: "short" | "long" | "syn", val: string) {
    if (!val.trim()) return;
    setMF(pid, (prev) => {
      const kw = prev.kw || { short: [], long: [], syn: [] };
      const list = kw[arr] || [];
      if (list.includes(val)) return prev;
      return { ...prev, kw: { ...kw, [arr]: [...list, val] } };
    });
  }
  function kwRemove(pid: string, arr: "short" | "long" | "syn", val: string) {
    setMF(pid, (prev) => {
      const kw = prev.kw || { short: [], long: [], syn: [] };
      return { ...prev, kw: { ...kw, [arr]: (kw[arr] || []).filter((x) => x !== val) } };
    });
  }

  // ── AI Keywords (single product) ───────────────────────────────────────

  async function runAIKeywords(pid: string) {
    if (aiKwRunning) return;
    setAiKwRunning(true);
    const steps = [
      "🖼️ Reading product image…",
      "📖 Scanning product title…",
      "🔍 Extracting short keywords…",
      "💬 Building long-tail phrases…",
      "🔄 Generating synonyms…",
      "✅ Keywords ready!",
    ];
    for (const step of steps) {
      setAiKwStep(step);
      await delay(280 + Math.random() * 200);
    }
    try {
      const res: AIKeywordsResult = await postApi(ApiConfig.aiGenerateKeywords, {
        productId: pid,
      });
      if (res?.short || res?.long || res?.synonyms) {
        setMF(pid, (prev) => ({
          ...prev,
          kw: {
            short: res.short || [],
            long: res.long || [],
            syn: res.synonyms || [],
          },
        }));
      }
    } catch (e) {
      console.error(e);
    }
    setAiKwRunning(false);
    setAiKwStep("");
  }

  // ── AI Product Suggestions (comp + rel) ───────────────────────────────

  async function fetchAISuggestions(pid: string) {
    if (aiSuggestions[pid]) return; // already fetched
    try {
      const res: AIProductSuggestionsResult = await postApi(ApiConfig.aiProductSuggestions, {
        productId: pid,
      });
      if (res) setAiSuggestions((prev) => ({ ...prev, [pid]: res }));
    } catch (e) {
      console.error(e);
    }
  }

  // ── Product picker ─────────────────────────────────────────────────────

  function setMode(pid: string, type: "comp" | "rel", mode: "manual" | "ai") {
    setMF(pid, (prev) => ({
      ...prev,
      [type]: { mode, prods: prev[type]?.prods || [] },
    }));
    if (mode === "ai") fetchAISuggestions(pid);
  }

  function applyAISuggestions(pid: string, type: "comp" | "rel") {
    const sug = aiSuggestions[pid];
    const prods = type === "comp" ? sug?.complementary || [] : sug?.related || [];
    setMF(pid, (prev) => ({
      ...prev,
      [type]: { mode: "ai", prods },
    }));
  }

  function toggleProd(pid: string, type: "comp" | "rel", targetPid: string) {
    setMF(pid, (prev) => {
      const cur = prev[type] || { mode: "manual", prods: [] };
      const prods = cur.prods.includes(targetPid)
        ? cur.prods.filter((x) => x !== targetPid)
        : [...cur.prods, targetPid];
      return { ...prev, [type]: { ...cur, prods } };
    });
  }

  function clearTab(pid: string, tab: PanelTab) {
    setMF(pid, (prev) => {
      const n = { ...prev };
      if (tab === "boost") delete n.kw;
      else if (tab === "comp") delete n.comp;
      else if (tab === "related") delete n.rel;
      return n;
    });
  }

  // ── Bulk AI ────────────────────────────────────────────────────────────

  async function runBulkAI() {
    const pids = [...selected];
    if (!pids.length) return;
    bulkCancelRef.current = false;
    setBulkDone(false);
    setBulkItems(pids.map((pid) => ({
      pid, status: "waiting", statusText: "Waiting…", kw: 0, comp: 0, rel: 0,
    })));
    setShowBulkOverlay(true);
    setBulkRunning(true);

    for (let i = 0; i < pids.length; i++) {
      if (bulkCancelRef.current) break;
      const pid = pids[i];

      // processing
      setBulkItems((prev) => prev.map((x) =>
        x.pid === pid ? { ...x, status: "processing", statusText: "🔍 Generating keywords…" } : x
      ));

      let kwCount = 0, compCount = 0, relCount = 0;

      // Keywords
      try {
        const res: AIKeywordsResult = await postApi(ApiConfig.aiGenerateKeywords, { productId: pid });
        if (res) {
          setMF(pid, (prev) => ({
            ...prev,
            kw: { short: res.short || [], long: res.long || [], syn: res.synonyms || [] },
          }));
          kwCount = (res.short?.length || 0) + (res.long?.length || 0) + (res.synonyms?.length || 0);
        }
      } catch (e) { console.error(e); }

      if (bulkCancelRef.current) break;
      setBulkItems((prev) => prev.map((x) =>
        x.pid === pid ? { ...x, statusText: "🛍️ Finding complementary…", kw: kwCount } : x
      ));

      // Suggestions
      try {
        const res: AIProductSuggestionsResult = await postApi(ApiConfig.aiProductSuggestions, { productId: pid });
        if (res) {
          setAiSuggestions((prev) => ({ ...prev, [pid]: res }));
          const comp = res.complementary || [];
          const rel = res.related || [];
          setMF(pid, (prev) => ({
            ...prev,
            comp: { mode: "ai", prods: comp },
            rel: { mode: "ai", prods: rel },
          }));
          compCount = comp.length;
          relCount = rel.length;
        }
      } catch (e) { console.error(e); }

      setBulkItems((prev) => prev.map((x) =>
        x.pid === pid
          ? { ...x, status: "done", statusText: "✅ All metafields generated", kw: kwCount, comp: compCount, rel: relCount }
          : x
      ));
      await delay(100);
    }

    setBulkRunning(false);
    setBulkDone(true);
  }

  // ── Panel save ─────────────────────────────────────────────────────────

  async function savePanel() {
    if (!activePid || !activeMF) return;
    setSavingPanel(true);
    try {
      const body: Record<string, unknown> = { productId: activePid };
      if (activeMF.kw) {
        body.search_boost_keywords = {
          short: activeMF.kw.short,
          long: activeMF.kw.long,
          synonyms: activeMF.kw.syn,
        };
      }
      if (activeMF.comp) body.complementary_products = activeMF.comp.prods;
      if (activeMF.rel) body.related_products = activeMF.rel.prods;
      await postApi(ApiConfig.updateMetafields, body);
      setPanelSaveSuccess(true);
      setTimeout(() => setPanelSaveSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    }
    setSavingPanel(false);
  }

  // ── Apply all ──────────────────────────────────────────────────────────

  async function handleApplyAll() {
    setApplying(true);
    setApplyError(null);
    setApplyProgress({ current: 0, total: configured.length });
    let count = 0;
    for (let i = 0; i < configured.length; i++) {
      const p = configured[i];
      setApplyProgress({ current: i + 1, total: configured.length });
      const mf = getMF(p.productId);
      try {
        const body: Record<string, unknown> = { productId: p.productId };
        if (mf.kw) body.search_boost_keywords = { short: mf.kw.short, long: mf.kw.long, synonyms: mf.kw.syn };
        if (mf.comp) body.complementary_products = mf.comp.prods;
        if (mf.rel) body.related_products = mf.rel.prods;
        const res = await postApi(ApiConfig.updateMetafields, body);
        if (res?.success) count++;
      } catch (e) { console.error(e); }
    }
    setApplying(false);
    setApplyProgress({ current: 0, total: 0 });
    setShowApplyModal(false);
    if (count > 0) {
      setSuccessCount(count);
      setShowSuccessModal(true);
      await fetchData();
    } else {
      setApplyError("No products were updated. Please try again.");
    }
  }

  function delay(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

  // ── Loading ──────────────────────────────────────────────────────────────

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

  const TabIcon = { boost: "🔍", comp: "🛍️", related: "🔗" };
  const tabHas = {
    boost: activePid ? hasBoost(getMF(activePid)) : false,
    comp: activePid ? hasComp(getMF(activePid)) : false,
    related: activePid ? hasRel(getMF(activePid)) : false,
  };

  const otherProducts = products.filter((p) => p.productId !== activePid);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <AppLayout title="Metafields Manager">
      <div className="flex flex-col h-screen bg-[#eef1f8] overflow-hidden">

        {/* ── TOP BAR ── */}
        <div className="flex-shrink-0 flex items-center gap-3 px-6 bg-white border-b border-gray-200 h-[60px] z-50 shadow-sm">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-[10px] text-[12.5px] font-semibold text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Optimization Suite</p>
            <p className="text-[17px] font-extrabold text-gray-900 leading-tight mt-px">Metafields Manager</p>
            <p className="text-[11.5px] text-gray-500 mt-px">
              Search boost keywords · Complementary products · Related products · Per-product settings
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-[#0f2878] text-white px-4 py-[7px] rounded-full text-[12.5px] font-bold whitespace-nowrap">
            <Package className="w-3.5 h-3.5" />
            {products.length} Products
          </div>
        </div>

        {/* ── BODY ROW ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── LEFT COL ── */}
          <div className="flex-1 min-w-0 overflow-y-auto p-4 flex flex-col gap-3">

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
              {[
                { label: "Search Keywords", val: totalBoost, unit: `/ ${products.length}`, note: totalBoost > 0 ? `${totalBoost} products with keywords` : "Synonyms & phrases", noteColor: "text-orange-600", fill: (totalBoost / Math.max(products.length, 1)) * 100, bar: "#ea580c" },
                { label: "Complementary Set", val: totalComp, unit: `/ ${products.length}`, note: totalComp > 0 ? `${totalComp} products set` : '"Customers also bought"', noteColor: "text-teal-600", fill: (totalComp / Math.max(products.length, 1)) * 100, bar: "#0891b2" },
                { label: "Related Products Set", val: totalRel, unit: `/ ${products.length}`, note: totalRel > 0 ? `${totalRel} products set` : '"You may also like"', noteColor: "text-blue-600", fill: (totalRel / Math.max(products.length, 1)) * 100, bar: "#1a3faa" },
                { label: "Fully Configured", val: totalFull, unit: `/ ${products.length}`, note: totalFull > 0 ? `${totalFull} fully configured` : "All metafields set", noteColor: "text-green-600", fill: (totalFull / Math.max(products.length, 1)) * 100, bar: "#12b76a" },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-[14px] p-3.5">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className="text-[20px] font-extrabold leading-none">
                    {s.val} <span className="text-[12px] font-medium text-gray-400">{s.unit}</span>
                  </p>
                  <p className={`text-[11px] font-semibold mt-1 ${s.noteColor}`}>{s.note}</p>
                  <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.fill}%`, background: s.bar }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Section header */}
            <div className="flex-shrink-0 bg-white border border-gray-200 rounded-[14px] p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-[9px] bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <Tag className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Per-Product Metafields</p>
                <p className="text-[14px] font-extrabold text-gray-900">Product Metafield Editor</p>
                <p className="text-[11.5px] text-gray-500">
                  Click any product → edit in the right panel. AI generates keywords and suggests related/complementary products.
                </p>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-shrink-0 px-3 py-1.5 border border-gray-200 rounded-[10px] text-[12px] font-semibold text-gray-600 bg-white outline-none"
              >
                <option value="">All Products</option>
                <option value="boost">Has Keywords</option>
                <option value="comp">Has Complementary</option>
                <option value="related">Has Related</option>
                <option value="empty">Not Configured</option>
                <option value="full">Fully Configured</option>
              </select>
            </div>

            {/* ── TABLE ── */}
            <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-[14px] overflow-hidden flex flex-col">

              {/* Toolbar */}
              <div className="flex-shrink-0 flex items-center gap-2 p-2.5 border-b border-gray-200 bg-gray-50 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-[10px] flex-1 max-w-[280px] focus-within:border-blue-500 transition-colors">
                  <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text" value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products…"
                    className="flex-1 bg-transparent outline-none text-[12px] placeholder:text-gray-300"
                  />
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {selected.size > 0 && (
                    <span className="text-[12px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                      {selected.size} selected
                    </span>
                  )}
                  <button
                    onClick={runBulkAI}
                    disabled={selected.size === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-[10px] text-[12px] font-bold hover:shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    ✨ AI Generate All
                  </button>
                </div>
              </div>

              {/* Table head */}
              <div
                className="flex-shrink-0 grid px-4 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider"
                style={{ gridTemplateColumns: "36px 40px 1fr 120px 130px 100px 70px", gap: 6 }}
              >
                <div className="flex items-center justify-center">
                  <div onClick={toggleAll}
                    className={`w-4 h-4 rounded border-2 cursor-pointer flex items-center justify-center transition-all ${allVisibleSel ? "bg-blue-600 border-blue-600" : someVisibleSel ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"}`}
                  >
                    {allVisibleSel && <Check className="w-2.5 h-2.5 text-white" />}
                    {someVisibleSel && !allVisibleSel && <div className="w-2 h-0.5 bg-white rounded" />}
                  </div>
                </div>
                <div />
                <div>Product Title</div>
                <div>Search Keywords</div>
                <div>Complementary</div>
                <div>Related</div>
                <div>Action</div>
              </div>

              {/* Table body */}
              <div className="flex-1 overflow-y-auto">
                {visible.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Package className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm font-semibold">No products found</p>
                  </div>
                )}
                {visible.map((p) => {
                  const s = getMF(p.productId);
                  const isSel = selected.has(p.productId);
                  const isAct = activePid === p.productId;
                  const kc = kwTotal(s);
                  const cc = s.comp?.prods?.length || 0;
                  const rc = s.rel?.prods?.length || 0;
                  const full = isFull(s);
                  const cMode = s.comp?.mode || "manual";
                  const rMode = s.rel?.mode || "manual";

                  return (
                    <div
                      key={p.productId}
                      onClick={() => setActivePid(p.productId)}
                      className={`grid px-4 py-2.5 border-b border-gray-100 items-center transition-all cursor-pointer last:border-b-0 ${isAct ? "bg-purple-50 border-l-2 border-l-purple-500" : isSel ? "bg-blue-50" : "hover:bg-gray-50/60"}`}
                      style={{ gridTemplateColumns: "36px 40px 1fr 120px 130px 100px 70px", gap: 6 }}
                    >
                      <div className="flex items-center justify-center" onClick={(e) => { e.stopPropagation(); toggleSel(p.productId); }}>
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer ${isSel ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"}`}>
                          {isSel && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </div>
                      <div className="relative">
                        <div className="w-8 h-8 rounded-[7px] bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-base flex-shrink-0">
                          {p.productImage ? <img src={p.productImage} alt="" className="w-full h-full object-cover" /> : "📦"}
                        </div>
                        {full && (
                          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                            <Check className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-gray-900 truncate">{p.title}</p>
                        <p className="text-[10px] text-gray-400 font-mono truncate">#{p.productId.split("/").pop()}{p.productType ? ` · ${p.productType}` : ""}</p>
                      </div>
                      <div>
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-[5px] ${kc ? "bg-orange-50 text-orange-700 border border-orange-200" : "bg-gray-50 text-gray-300 border border-dashed border-gray-200 italic"}`}>
                          {kc ? `${kc} keywords` : "— add keywords"}
                        </span>
                      </div>
                      <div>
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-[5px] ${cc ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-gray-50 text-gray-300 border border-dashed border-gray-200 italic"}`}>
                          {cc ? `${cc} products${cMode === "ai" ? " ✦AI" : ""}` : "— not set"}
                        </span>
                      </div>
                      <div>
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-[5px] ${rc ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-gray-50 text-gray-300 border border-dashed border-gray-200 italic"}`}>
                          {rc ? `${rc} products${rMode === "ai" ? " ✦AI" : ""}` : "— not set"}
                        </span>
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActivePid(p.productId)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-gray-200 rounded-[7px] text-[11px] font-bold text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-gray-50 flex-wrap gap-2">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-[7px] px-3 py-1.5 text-[12px] font-bold text-gray-700">
                  <Package className="w-3.5 h-3.5 text-gray-400" />
                  {products.length} products · {configured.length} configured
                </div>
                <button
                  onClick={() => { setApplyError(null); setShowApplyModal(true); }}
                  disabled={configured.length === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-[10px] text-[12px] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  Push Metafields to Shopify
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="w-[460px] min-w-[460px] flex-shrink-0 bg-white border-l-2 border-gray-200 flex flex-col overflow-hidden shadow-[-4px_0_16px_rgba(15,23,42,0.07)]">

            {/* Panel head */}
            <div className="flex-shrink-0 px-4 py-3.5 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-[10px] bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-2xl flex-shrink-0">
                  {activeProduct?.productImage ? (
                    <img src={activeProduct.productImage} alt="" className="w-full h-full object-cover" />
                  ) : "👆"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-extrabold text-gray-900 truncate">
                    {activeProduct?.title || "Select a product"}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {activePid ? `#${activePid.split("/").pop()} · click row to switch` : "Click any row to edit metafields"}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 flex border-b border-gray-200 bg-gray-50">
              {(["boost", "comp", "related"] as PanelTab[]).map((tab) => {
                const labels = { boost: "Search Boost", comp: "Complementary", related: "Related" };
                const isActive = activeTab === tab;
                const hasDot = tabHas[tab];
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition-all border-b-2 ${isActive ? "text-blue-800 border-blue-600 bg-white" : "text-gray-400 border-transparent hover:text-gray-600"}`}
                  >
                    <span className="text-base">{TabIcon[tab]}</span>
                    {labels[tab]}
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors ${hasDot ? "bg-green-500" : "bg-gray-200"}`} />
                  </button>
                );
              })}
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-4">
              {!activePid ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-3">
                  <div className="text-5xl">👆</div>
                  <p className="text-[13px] font-semibold text-center">Click a product row to edit its metafields</p>
                </div>
              ) : activeTab === "boost" ? (
                /* ── BOOST TAB ── */
                <div>
                  {/* NS badge */}
                  <div className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-[6px] px-2 py-1 text-[10px] font-bold font-mono mb-3">
                    <span className="text-purple-600">custom</span>
                    <span className="text-gray-300">.</span>
                    <span className="text-blue-600">search_boost_keywords</span>
                  </div>

                  {/* Info */}
                  <div className="bg-orange-50 border border-orange-200 rounded-[8px] p-3 text-[11.5px] text-orange-800 leading-relaxed mb-3">
                    <strong>🔍 How Search Boost works:</strong> AI reads the product <strong>title + image</strong> and generates:
                    <br />🟠 <strong>Short keywords</strong> — e.g. "office chair"
                    <br />🟣 <strong>Long-tail phrases</strong> — e.g. "ergonomic chair for back pain"
                    <br />🟢 <strong>Synonyms</strong> — e.g. "task chair", "computer seat"
                  </div>

                  {/* AI gen button */}
                  <button
                    onClick={() => activePid && runAIKeywords(activePid)}
                    disabled={aiKwRunning || !activePid}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-[9px] text-[12.5px] font-bold mb-2 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {aiKwRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    ✨ Generate Keywords from Title + Image
                  </button>

                  {aiKwRunning && aiKwStep && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-[7px] mb-3 text-[11px] font-semibold text-purple-700">
                      <Loader2 className="w-3 h-3 animate-spin text-purple-500 flex-shrink-0" />
                      {aiKwStep}
                    </div>
                  )}

                  {/* Legend */}
                  <div className="flex gap-3 flex-wrap mb-3 text-[10.5px] font-semibold text-gray-500">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500" />Short keywords</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-600" />Long-tail phrases</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" />Synonyms</span>
                    <span className="ml-auto text-gray-400">Press Enter to add</span>
                  </div>

                  <KeywordArea
                    label="Short Keywords" arrKey="short" variant="short"
                    placeholder="e.g. office chair…"
                    tags={activeMF?.kw?.short || []}
                    onAdd={(k, v) => kwAdd(activePid, k, v)}
                    onRemove={(k, v) => kwRemove(activePid, k, v)}
                  />
                  <KeywordArea
                    label="Long-Tail Phrases" arrKey="long" variant="long"
                    placeholder="e.g. ergonomic chair for back pain…"
                    tags={activeMF?.kw?.long || []}
                    onAdd={(k, v) => kwAdd(activePid, k, v)}
                    onRemove={(k, v) => kwRemove(activePid, k, v)}
                  />
                  <KeywordArea
                    label="Synonyms" arrKey="syn" variant="syn"
                    placeholder="e.g. task chair, computer seat…"
                    tags={activeMF?.kw?.syn || []}
                    onAdd={(k, v) => kwAdd(activePid, k, v)}
                    onRemove={(k, v) => kwRemove(activePid, k, v)}
                  />
                </div>
              ) : (
                /* ── PICKER TAB (comp / related) ── */
                <PickerTab
                  type={activeTab === "comp" ? "comp" : "rel"}
                  pid={activePid}
                  products={otherProducts}
                  mfState={activeMF}
                  aiSuggestions={activeAISug}
                  onFetchSuggestions={() => activePid && fetchAISuggestions(activePid)}
                  onSetMode={(m) => setMode(activePid, activeTab === "comp" ? "comp" : "rel", m)}
                  onApplyAI={() => applyAISuggestions(activePid, activeTab === "comp" ? "comp" : "rel")}
                  onToggleProd={(targetPid) => toggleProd(activePid, activeTab === "comp" ? "comp" : "rel", targetPid)}
                />
              )}
            </div>

            {/* Panel footer */}
            <div className="flex-shrink-0 flex gap-2 p-3.5 border-t border-gray-200 bg-white">
              <button
                onClick={() => activePid && clearTab(activePid, activeTab)}
                disabled={!activePid}
                className="flex-1 py-2.5 bg-white border border-gray-200 rounded-[9px] text-[12.5px] font-semibold text-gray-600 hover:border-red-400 hover:text-red-500 transition-all disabled:opacity-40"
              >
                Clear Tab
              </button>
              <button
                onClick={savePanel}
                disabled={!activePid || savingPanel}
                className={`flex-[1.5] flex items-center justify-center gap-2 py-2.5 rounded-[9px] text-[12.5px] font-bold transition-all disabled:opacity-40 ${panelSaveSuccess ? "bg-green-500 text-white" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:-translate-y-0.5"}`}
              >
                {savingPanel ? <Loader2 className="w-4 h-4 animate-spin" /> : panelSaveSuccess ? <><Check className="w-4 h-4" /> Saved!</> : "✓ Save Metafields"}
              </button>
            </div>
          </div>
        </div>

        {/* ── BULK AI OVERLAY ── */}
        <Dialog open={showBulkOverlay} onOpenChange={(o) => { if (!bulkRunning || bulkDone) setShowBulkOverlay(o); }}>
          <DialogContent className="max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-[15px] font-extrabold">
                <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 flex items-center justify-center text-xl flex-shrink-0">🤖</div>
                <div>
                  AI Generating Metafields
                  <p className="text-[11.5px] font-normal text-gray-500 mt-0.5">
                    {bulkDone ? `✅ ${bulkItems.length} product${bulkItems.length > 1 ? "s" : ""} fully configured!` : `Processing ${bulkItems.length} product${bulkItems.length > 1 ? "s" : ""}…`}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {/* Overall progress */}
              {!bulkDone && (
                <div>
                  <div className="flex justify-between text-[11px] font-bold text-gray-600 mb-1.5">
                    <span>{bulkItems.filter((x) => x.status === "done").length} of {bulkItems.length} done</span>
                    <span>{Math.round((bulkItems.filter((x) => x.status === "done").length / Math.max(bulkItems.length, 1)) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-400"
                      style={{ width: `${(bulkItems.filter((x) => x.status === "done").length / Math.max(bulkItems.length, 1)) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Product list */}
              <div className="max-h-[280px] overflow-y-auto flex flex-col gap-2">
                {bulkItems.map((item) => {
                  const p = products.find((x) => x.productId === item.pid);
                  return (
                    <div
                      key={item.pid}
                      className={`flex items-center gap-3 p-3 border rounded-[9px] transition-all ${
                        item.status === "processing" ? "border-purple-200 bg-purple-50"
                          : item.status === "done" ? "border-green-200 bg-green-50"
                          : "border-gray-200 opacity-50"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-[7px] bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-base flex-shrink-0">
                        {p?.productImage ? <img src={p.productImage} alt="" className="w-full h-full object-cover" /> : "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11.5px] font-bold text-gray-900 truncate">{p?.title || item.pid}</p>
                        <p className="text-[10.5px] font-semibold text-gray-500 mt-0.5">{item.statusText}</p>
                        {item.status === "done" && (
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            {item.kw > 0 && <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">{item.kw} keywords</span>}
                            {item.comp > 0 && <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">{item.comp} complementary</span>}
                            {item.rel > 0 && <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{item.rel} related</span>}
                          </div>
                        )}
                        {item.status === "processing" && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                            <span className="text-[10px] text-purple-600 font-semibold">Processing…</span>
                          </div>
                        )}
                      </div>
                      <div className="text-lg flex-shrink-0">
                        {item.status === "done" ? "✅" : item.status === "processing" ? "⚙️" : "⏳"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="gap-2">
              {!bulkDone ? (
                <Button
                  variant="outline"
                  onClick={() => { bulkCancelRef.current = true; setBulkRunning(false); setShowBulkOverlay(false); }}
                  className="flex-1"
                >
                  ✕ Cancel
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setShowBulkOverlay(false)} className="flex-1">Close</Button>
                  <Button
                    onClick={() => {
                      setShowBulkOverlay(false);
                      if (selected.size > 0) setActivePid([...selected][0]);
                    }}
                    className="flex-[2] bg-gradient-to-r from-green-600 to-emerald-600"
                  >
                    ✓ Done — View Results
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── APPLY MODAL ── */}
        <Dialog open={showApplyModal} onOpenChange={(o) => !applying && setShowApplyModal(o)}>
          <DialogContent className="max-w-[540px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[16px] font-extrabold">
                <Tag className="w-5 h-5 text-blue-500" />
                Push Metafields to Shopify
              </DialogTitle>
              <p className="text-[12px] text-gray-500">Review before saving to your store</p>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-2">
                {[
                  { val: configured.length, label: "Will Update", color: "#12b76a" },
                  { val: totalBoost, label: "With Keywords", color: "#ea580c" },
                  { val: totalComp, label: "Complementary", color: "#0891b2" },
                  { val: totalRel, label: "Related", color: "#1a3faa" },
                ].map((s, i) => (
                  <div key={i} className="text-center bg-gray-50 border border-gray-200 rounded-[10px] p-3">
                    <p className="text-[20px] font-extrabold" style={{ color: s.color }}>{s.val}</p>
                    <p className="text-[10px] text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="max-h-[220px] overflow-y-auto flex flex-col gap-2">
                {products.map((p) => {
                  const s = getMF(p.productId);
                  const hasAny = hasBoost(s) || hasComp(s) || hasRel(s);
                  return (
                    <div key={p.productId} className={`flex items-start gap-2.5 p-3 rounded-[8px] border ${hasAny ? "border-blue-200 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
                      <div className="w-6 h-6 rounded bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                        {p.productImage ? <img src={p.productImage} alt="" className="w-full h-full object-cover" /> : "📦"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11.5px] font-bold truncate">{p.title}</p>
                        <div className="flex gap-1.5 flex-wrap mt-1">
                          {hasBoost(s) && <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">{kwTotal(s)} keywords</span>}
                          {hasComp(s) && <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">{s.comp?.prods?.length} complementary</span>}
                          {hasRel(s) && <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{s.rel?.prods?.length} related</span>}
                          {!hasAny && <span className="text-[9.5px] text-gray-300 italic">No metafields configured</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-[8px] p-3 text-[12px] text-blue-800 leading-relaxed">
                <strong>📦 All configured metafields</strong> will be saved to their Shopify metafield namespaces. Products with no metafields are untouched.
              </div>

              {applyError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[12px] text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" /> {applyError}
                </div>
              )}

              {applying && (
                <div className="bg-blue-50 border border-blue-200 rounded-[10px] p-3">
                  <div className="flex justify-between mb-2">
                    <span className="text-[12px] font-semibold text-blue-700">Pushing metafields…</span>
                    <span className="text-[12px] font-bold text-blue-700">{applyProgress.current}/{applyProgress.total}</span>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300"
                      style={{ width: `${(applyProgress.current / Math.max(applyProgress.total, 1)) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowApplyModal(false)} disabled={applying} className="flex-1">Cancel</Button>
              <Button onClick={handleApplyAll} disabled={applying || configured.length === 0} className="flex-[2] bg-gradient-to-r from-blue-600 to-purple-600 gap-2">
                {applying ? <><Loader2 className="w-4 h-4 animate-spin" />Pushing…</> : <><Check className="w-4 h-4" />✓ Push to Shopify</>}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── SUCCESS MODAL ── */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="max-w-[440px]">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4 text-3xl">🎉</div>
              <h3 className="text-[20px] font-extrabold text-gray-900 mb-2">Metafields Saved!</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed mb-5">
                Metafields for <strong>{successCount} product{successCount !== 1 ? "s" : ""}</strong> pushed to Shopify successfully.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSuccessModal(false)} className="flex-1">Close</Button>
                <Button onClick={() => { setShowSuccessModal(false); setMfMap({}); fetchData(); }} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">Done →</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  );
}

// ─── Picker Tab sub-component ────────────────────────────────────────────────

function PickerTab({
  type, pid, products, mfState, aiSuggestions,
  onFetchSuggestions, onSetMode, onApplyAI, onToggleProd,
}: {
  type: "comp" | "rel";
  pid: string;
  products: MFProduct[];
  mfState?: ProductMFState;
  aiSuggestions?: AIProductSuggestionsResult;
  onFetchSuggestions: () => void;
  onSetMode: (m: "manual" | "ai") => void;
  onApplyAI: () => void;
  onToggleProd: (targetPid: string) => void;
}) {
  const isComp = type === "comp";
  const data = isComp ? mfState?.comp : mfState?.rel;
  const mode = data?.mode || "manual";
  const selProds = data?.prods || [];
  const aiPids = isComp ? aiSuggestions?.complementary || [] : aiSuggestions?.related || [];
  const nsKey = isComp ? "complementary_products" : "related_products";

  return (
    <div>
      {/* NS badge */}
      <div className="inline-flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-[6px] px-2 py-1 text-[10px] font-bold font-mono mb-3">
        <span className="text-purple-600">custom</span>
        <span className="text-gray-300">.</span>
        <span className="text-blue-600">{nsKey}</span>
      </div>

      {/* Info */}
      {isComp ? (
        <div className="bg-teal-50 border border-teal-200 rounded-[8px] p-3 text-[11.5px] text-teal-800 leading-relaxed mb-3">
          <strong>🛍️ Complementary Products</strong> — Products from a <strong>different category</strong> that pair well. Shown as <strong>"Customers also bought"</strong>.
          <br /><em className="text-teal-600">Example: Chair → Desk Lamp, Coffee Maker → Saffron</em>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-[8px] p-3 text-[11.5px] text-blue-800 leading-relaxed mb-3">
          <strong>🔗 Related Products</strong> — Products from the <strong>same or similar category</strong>. Shown as <strong>"You may also like"</strong>.
          <br /><em className="text-blue-600">Example: Running Shoes → Trail Shoes</em>
        </div>
      )}

      {/* Mode selector */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[11px] font-bold text-gray-600 flex-shrink-0">Mode:</span>
        <select
          value={mode}
          onChange={(e) => { onSetMode(e.target.value as "manual" | "ai"); }}
          className={`flex-1 px-3 py-2 border rounded-[7px] text-[12px] font-bold outline-none cursor-pointer transition-all ${mode === "ai" ? "border-purple-200 bg-purple-50 text-purple-700" : "border-gray-200 bg-white text-gray-700"}`}
        >
          <option value="manual">✋ Manual — hand-pick products</option>
          <option value="ai">🤖 AI — auto-suggest by {isComp ? "category pairing" : "same category"}</option>
        </select>
      </div>

      {mode === "ai" && (
        <button
          onClick={onApplyAI}
          className="w-full flex items-center justify-center gap-2 py-2 bg-purple-50 border border-purple-200 rounded-[8px] text-[12px] font-bold text-purple-700 hover:bg-purple-100 transition-all mb-3"
        >
          <Sparkles className="w-3.5 h-3.5" />
          ✨ Auto-select all AI suggestions ({aiPids.length} products)
        </button>
      )}

      {/* Picker list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-gray-600">
            {isComp ? "Complementary" : "Related"} Products
          </span>
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {selProds.length} selected
          </span>
        </div>
        <div className="border border-gray-200 rounded-[8px] overflow-hidden">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-500">{selProds.length} product{selProds.length !== 1 ? "s" : ""} selected</span>
            <span className="text-[10px] text-gray-400">"{isComp ? "Customers also bought" : "You may also like"}"</span>
          </div>
          {mode === "ai" && aiPids.length > 0 && (
            <div className="px-3 py-1.5 bg-purple-50 border-b border-purple-100 text-[10.5px] font-bold text-purple-700 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              AI Suggested — {isComp ? "different category products that complement" : "same category/type products"}
            </div>
          )}
          <div className="max-h-[300px] overflow-y-auto">
            {[...products]
              .sort((a, b) => {
                const aAI = aiPids.includes(a.productId);
                const bAI = aiPids.includes(b.productId);
                return (bAI ? 1 : 0) - (aAI ? 1 : 0);
              })
              .map((prod) => (
                <ProdPickerItem
                  key={prod.productId}
                  product={prod}
                  selected={selProds.includes(prod.productId)}
                  isAISug={mode === "ai" && aiPids.includes(prod.productId)}
                  onClick={() => onToggleProd(prod.productId)}
                />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}