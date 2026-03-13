import { useState, useEffect, useRef } from "react";
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
  Tag,
  RotateCcw,
  ChevronRight,
  X,
  Plus,
  ChevronDown,
  AlertCircle,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProductCollection {
  id: string;
  title: string;
  handle: string;
}

interface Product {
  _id: string;
  shopId: string;
  productId: string;
  title: string;
  vendor: string;
  productType: string;
  tags: string[];
  productImage: string | null;
  collections: ProductCollection[];
}

interface TagsApiResponse {
  count: number;
  tags: string[];
}

interface AiTagResult {
  tags: string[];
}

// ─── Tag Pill ────────────────────────────────────────────────────────────────

function TagPill({
  tag,
  variant = "current",
  onRemove,
}: {
  tag: string;
  variant?: "current" | "ai" | "pending";
  onRemove?: () => void;
}) {
  const styles: Record<string, string> = {
    current: "bg-gray-100 text-gray-600 border border-gray-200",
    ai: "bg-purple-50 text-purple-700 border border-purple-200",
    pending: "bg-blue-50 text-blue-700 border border-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold whitespace-nowrap leading-relaxed ${styles[variant]}`}
    >
      {tag}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="hover:opacity-60 transition-opacity flex items-center"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}

// ─── Quick Tag Input ─────────────────────────────────────────────────────────

function QuickTagInput({
  storeTags,
  selectedIds,
  products,
  onSuccess,
}: {
  storeTags: string[];
  selectedIds: Set<string>;
  products: Product[];
  onSuccess: () => void;
}) {
  const [input, setInput] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filtered = storeTags.filter(
    (t) =>
      !pendingTags.includes(t) &&
      (input.length === 0 || t.toLowerCase().includes(input.toLowerCase()))
  );

  const trimmedInput = input.trim();
  const isNew =
    trimmedInput.length > 0 &&
    !storeTags.some((t) => t.toLowerCase() === trimmedInput.toLowerCase()) &&
    !pendingTags.includes(trimmedInput);

  const alreadyInPending = trimmedInput.length > 0 && pendingTags.includes(trimmedInput);

  function addTag(tag: string) {
    const t = tag.trim();
    if (!t || pendingTags.includes(t)) return;
    setPendingTags((p) => [...p, t]);
    setInput("");
    setError(null);
    setSuccess(null);
  }

  function removeTag(tag: string) {
    setPendingTags((p) => p.filter((x) => x !== tag));
  }

  const targets =
    selectedIds.size > 0
      ? products.filter((p) => selectedIds.has(p.productId))
      : products;

  async function handleApply() {
    if (pendingTags.length === 0) return;
    setApplying(true);
    setError(null);
    setSuccess(null);
    try {
      const productIds = targets.map((p) => p.productId);
      const res = await postApi(ApiConfig.addtagsProducts, {
        tags: pendingTags,
        productIds,
      });
      if (!res?.success) throw new Error("Failed to apply tags");
      setSuccess(
        `✓ Added ${pendingTags.length} tag${pendingTags.length !== 1 ? "s" : ""} to ${productIds.length} product${productIds.length !== 1 ? "s" : ""}`
      );
      setPendingTags([]);
      onSuccess();
    } catch (e: any) {
      setError(e?.message || "Failed to apply tags");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-[14px] p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-purple-50 border border-purple-200 flex items-center justify-center flex-shrink-0">
          <Tag className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
            Quick Add Tags
          </p>
          <p className="text-[15px] font-extrabold text-gray-900">
            Apply Tags to Products
          </p>
          <p className="text-[12px] text-gray-500">
            Pick from store tags or type new ones · Applies to{" "}
            <strong>
              {selectedIds.size > 0 ? selectedIds.size : products.length} product
              {(selectedIds.size > 0 ? selectedIds.size : products.length) !== 1
                ? "s"
                : ""}
            </strong>
            {selectedIds.size === 0 ? " (select products above to narrow)" : ""}
          </p>
        </div>
      </div>

      {/* Input row */}
      <div className="flex flex-col lg:flex-row gap-2">
        <div className="relative flex-1">
          <div
            className={`flex items-center border rounded-lg overflow-visible bg-white transition-all ${
              showDrop ? "border-purple-500 ring-1 ring-purple-200" : "border-gray-200"
            }`}
          >
            <Tag className="w-4 h-4 text-gray-400 ml-3 flex-shrink-0" />
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setShowDrop(true);
                setError(null);
                setSuccess(null);
              }}
              onFocus={() => setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 160)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && trimmedInput) {
                  e.preventDefault();
                  addTag(trimmedInput);
                  setShowDrop(false);
                }
              }}
              placeholder="Search store tags or type a new one, press Enter…"
              className="flex-1 px-2 py-2 outline-none text-[12.5px] font-semibold bg-transparent"
            />
            <ChevronDown
              className={`w-4 h-4 text-gray-400 mr-2 transition-transform flex-shrink-0 ${showDrop ? "rotate-180" : ""}`}
            />
          </div>

          {showDrop && (filtered.length > 0 || isNew || alreadyInPending) && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[10px] shadow-xl z-50 overflow-hidden">
              {filtered.length > 0 && (
                <>
                  <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">
                    Store Tags
                  </div>
                  {filtered.slice(0, 7).map((tag) => (
                    <div
                      key={tag}
                      className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-purple-50 transition-colors"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addTag(tag);
                        setShowDrop(false);
                      }}
                    >
                      <div className="w-5 h-5 rounded bg-purple-50 border border-purple-200 flex items-center justify-center flex-shrink-0">
                        <Tag className="w-2.5 h-2.5 text-purple-500" />
                      </div>
                      <span className="flex-1 text-[12.5px] text-gray-700">{tag}</span>
                    </div>
                  ))}
                </>
              )}

              {isNew && (
                <>
                  {filtered.length > 0 && <div className="h-px bg-gray-100 my-1" />}
                  <div
                    className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-blue-50 transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addTag(trimmedInput);
                      setShowDrop(false);
                    }}
                  >
                    <div className="w-5 h-5 rounded bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                      <Plus className="w-2.5 h-2.5 text-blue-600" />
                    </div>
                    <span className="flex-1 text-[12.5px] font-bold text-blue-700">
                      Create "{trimmedInput}"
                    </span>
                    <span className="text-[9.5px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-200">
                      New
                    </span>
                  </div>
                </>
              )}

              {alreadyInPending && (
                <div className="px-3 py-2 text-[11px] text-amber-600 font-semibold bg-amber-50">
                  "{trimmedInput}" is already in your pending list
                </div>
              )}

              <div className="px-3 py-1.5 text-[10.5px] text-gray-400 border-t border-gray-100 bg-gray-50 flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />
                Press Enter to add a custom tag
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleApply}
          disabled={pendingTags.length === 0 || applying}
          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-[12.5px] font-bold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
        >
          {applying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Apply{pendingTags.length > 0 ? ` (${pendingTags.length})` : " Tags"}
        </button>
      </div>

      {/* Pending tags preview */}
      {pendingTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-[10.5px] font-bold text-gray-400 self-center mr-1">
            Will add:
          </span>
          {pendingTags.map((tag) => (
            <TagPill key={tag} tag={tag} variant="pending" onRemove={() => removeTag(tag)} />
          ))}
        </div>
      )}

      {/* Feedback */}
      {(error || success) && (
        <div
          className={`text-[12px] font-semibold px-3 py-2 rounded-lg border ${
            error
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-green-50 border-green-200 text-green-700"
          }`}
        >
          {error || success}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function TagOptimization() {
  const navigate = useNavigate();

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [storeTags, setStoreTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiResults, setAiResults] = useState<Record<string, string[]>>({});

  // UI state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [aiRunning, setAiRunning] = useState(false);
  const [runningRowId, setRunningRowId] = useState<string | null>(null);

  // Apply flow
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyProgress, setApplyProgress] = useState({ current: 0, total: 0 });
  const [applyError, setApplyError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successStats, setSuccessStats] = useState({ count: 0, tags: 0 });

  // ── Fetch ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [prods, tagsRes] = await Promise.all([
        getApi(ApiConfig.getStoredTagsProduct),
        getApi(ApiConfig.getTags),
      ]);
      setProducts(prods || []);
      const tagsData: TagsApiResponse = tagsRes;
      setStoreTags(tagsData?.tags || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ── Visible ────────────────────────────────────────────────────────────

  function getVisible() {
    return products.filter((p) => {
      const mq =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.vendor || "").toLowerCase().includes(searchQuery.toLowerCase());

      const ms =
        !filterStatus ||
        (filterStatus === "ai" && !!aiResults[p.productId]) ||
        (filterStatus === "pending" && !aiResults[p.productId]);

      return mq && ms;
    });
  }

  // ── Selection ──────────────────────────────────────────────────────────

  function toggleRow(pid: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      s.has(pid) ? s.delete(pid) : s.add(pid);
      return s;
    });
  }

  function toggleAll() {
    const visible = getVisible().map((p) => p.productId);
    const allSel = visible.every((id) => selected.has(id));
    setSelected((prev) => {
      const s = new Set(prev);
      allSel
        ? visible.forEach((id) => s.delete(id))
        : visible.forEach((id) => s.add(id));
      return s;
    });
  }

  // ── AI single row ──────────────────────────────────────────────────────

  async function runRowAI(pid: string) {
    if (aiResults[pid] || runningRowId) return;
    setRunningRowId(pid);
    try {
      const res: AiTagResult = await postApi(ApiConfig.aitagOptimization, {
        productId: pid,
      });
      if (res?.tags?.length) {
        setAiResults((prev) => ({ ...prev, [pid]: res.tags }));
      }
    } catch (e) {
      console.error(e);
    }
    setRunningRowId(null);
  }

  // ── AI all ─────────────────────────────────────────────────────────────

  async function runAIAll() {
    if (aiRunning) return;
    setAiRunning(true);

    const toAnalyse =
      selected.size > 0
        ? products.filter((p) => selected.has(p.productId) && !aiResults[p.productId])
        : products.filter((p) => !aiResults[p.productId]);

    for (const p of toAnalyse) {
      setRunningRowId(p.productId);
      try {
        const res: AiTagResult = await postApi(ApiConfig.aitagOptimization, {
          productId: p.productId,
        });
        if (res?.tags?.length) {
          setAiResults((prev) => ({ ...prev, [p.productId]: res.tags }));
        }
      } catch (e) {
        console.error(e);
      }
    }

    setRunningRowId(null);
    setAiRunning(false);
  }

  // ── Apply AI tags ──────────────────────────────────────────────────────

  async function handleApply() {
    const toUpdate = products.filter((p) => aiResults[p.productId]);
    if (!toUpdate.length) return;

    setApplying(true);
    setApplyError(null);
    setApplyProgress({ current: 0, total: toUpdate.length });

    let successCount = 0;
    let totalTagsApplied = 0;

    for (let i = 0; i < toUpdate.length; i++) {
      const p = toUpdate[i];
      const tags = aiResults[p.productId];
      setApplyProgress({ current: i + 1, total: toUpdate.length });
      try {
        const res = await postApi(ApiConfig.addtagsProducts, {
          tags,
          productIds: [p.productId],
        });
        if (res?.success) {
          successCount++;
          totalTagsApplied += tags.length;
        }
      } catch (e) {
        console.error(e);
      }
    }

    setApplying(false);
    setApplyProgress({ current: 0, total: 0 });
    setShowApplyModal(false);

    if (successCount > 0) {
      setSuccessStats({ count: successCount, tags: totalTagsApplied });
      setShowSuccessModal(true);
      await fetchAll();
    } else {
      setApplyError("Failed to apply tags. Please try again.");
    }
  }

  // ── Computed values ────────────────────────────────────────────────────

  const aiCount = Object.keys(aiResults).length;
  const totalTagsGenerated = Object.values(aiResults).reduce((a, t) => a + t.length, 0);
  const visible = getVisible();
  const allVisibleSel = visible.length > 0 && visible.every((p) => selected.has(p.productId));
  const someVisibleSel = visible.some((p) => selected.has(p.productId));
  const productsWithAI = products.filter((p) => aiResults[p.productId]);
  const totalCurrentTagsInAI = productsWithAI.reduce((a, p) => a + p.tags.length, 0);

  // ── Loading ────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout title="Tag Optimization">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Tag className="w-12 h-12 animate-pulse text-purple-500 mx-auto mb-4" />
            <p className="text-gray-600 text-sm">Loading products…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Tag Optimization">
      <div className="flex flex-col min-h-screen bg-[#eef1f8]">

        {/* ── TOP BAR ── */}
        <div
          className="flex-shrink-0 flex items-center gap-3 px-6 bg-white border-b border-gray-200 sticky top-0 z-50"
          style={{ height: 60 }}
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-[10px] text-[12.5px] font-semibold text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
              Optimization Suite
            </p>
            <p className="text-[17px] font-extrabold text-gray-900 leading-tight mt-px">
              Tag Optimization
            </p>
            <p className="text-[11.5px] text-gray-500 mt-px">
              AI generates SEO-rich tags for every product — current tags vs AI suggestions side by side
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0f2878] text-white px-4 py-[7px] rounded-full text-[12.5px] font-bold whitespace-nowrap">
            <Tag className="w-3.5 h-3.5" />
            {products.length} Products
          </div>
        </div>

        {/* ── PAGE CONTENT ── */}
        <div className="flex-1 overflow-y-auto p-5 pb-32">
          <div className="max-w-[1280px] mx-auto space-y-4">

            {/* ── STATS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  label: "Total Products",
                  val: products.length,
                  unit: "products",
                  note: "In your store",
                  noteColor: "text-blue-600",
                  fill: 100,
                  bar: "#1a3faa",
                },
                {
                  label: "AI Tags Generated",
                  val: aiCount,
                  unit: `/ ${products.length}`,
                  note: aiCount > 0 ? `${aiCount} products analysed` : "Run AI to generate",
                  noteColor: "text-purple-600",
                  fill: Math.round((aiCount / Math.max(products.length, 1)) * 100),
                  bar: "#7c3aed",
                },
                {
                  label: "Total Tags Generated",
                  val: totalTagsGenerated,
                  unit: "tags",
                  note: totalTagsGenerated > 0 ? `${totalTagsGenerated} new tags` : "Across all products",
                  noteColor: "text-green-600",
                  fill: Math.min(100, Math.round((totalTagsGenerated / 120) * 100)),
                  bar: "#12b76a",
                },
                {
                  label: "Ready to Apply",
                  val: aiCount,
                  unit: "products",
                  note: aiCount > 0 ? `${aiCount} ready to apply` : "Waiting for AI",
                  noteColor: "text-amber-600",
                  fill: Math.round((aiCount / Math.max(products.length, 1)) * 100),
                  bar: "#f59e0b",
                },
              ].map((s, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-[14px] p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {s.label}
                  </p>
                  <p className="text-[22px] font-extrabold leading-none">
                    {s.val}{" "}
                    <span className="text-[12px] font-medium text-gray-400">{s.unit}</span>
                  </p>
                  <p className={`text-[11px] font-semibold mt-1 ${s.noteColor}`}>{s.note}</p>
                  <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${s.fill}%`, background: s.bar }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* ── QUICK TAG INPUT ── */}
            <QuickTagInput
              storeTags={storeTags}
              selectedIds={selected}
              products={products}
              onSuccess={fetchAll}
            />

            {/* ── SECTION HEADER ── */}
            <div className="bg-white border border-gray-200 rounded-[14px] p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-purple-50 border border-purple-200 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                    AI Tag Generator
                  </p>
                  <p className="text-[15px] font-extrabold text-gray-900">
                    Current Tags vs AI-Suggested Tags
                  </p>
                  <p className="text-[12px] text-gray-500">
                    Current tags shown in grey · AI suggestions in purple — review then apply to Shopify
                  </p>
                </div>
              </div>

              <button
                onClick={runAIAll}
                disabled={aiRunning}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-[10px] text-[13px] font-bold shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
              >
                {aiRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {aiRunning ? "Generating…" : "✨ AI Generate All"}
              </button>
            </div>

            {/* ── MAIN TABLE ── */}
            <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">

              {/* Toolbar */}
              <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-[10px] flex-1 max-w-[300px] focus-within:border-purple-500 transition-colors">
                  <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products…"
                    className="flex-1 bg-transparent outline-none text-[12px] placeholder:text-gray-300"
                  />
                </div>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-[10px] text-[12px] font-semibold text-gray-600 bg-white outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="">All Products</option>
                  <option value="ai">AI Generated</option>
                  <option value="pending">No AI Tags Yet</option>
                </select>

                <div className="ml-auto flex items-center gap-2">
                  {selected.size > 0 && (
                    <span className="text-[12px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                      {selected.size} selected
                    </span>
                  )}
                  <span className="text-[12px] font-semibold text-gray-500 bg-white border border-gray-200 px-3 py-1 rounded-full">
                    {visible.length} of {products.length}
                  </span>
                </div>
              </div>

              {/* Table Head */}
              <div
                className="grid px-4 py-2.5 bg-gray-50 border-b border-gray-200 text-[10.5px] font-bold text-gray-400 uppercase tracking-wider"
                style={{ gridTemplateColumns: "40px 44px 1fr 1fr 1fr 120px 80px", gap: 8 }}
              >
                {/* Checkbox all */}
                <div className="flex items-center justify-center">
                  <div
                    onClick={toggleAll}
                    className={`w-4 h-4 rounded border-2 cursor-pointer flex items-center justify-center transition-all ${
                      allVisibleSel
                        ? "bg-blue-600 border-blue-600"
                        : someVisibleSel
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {allVisibleSel && <Check className="w-2.5 h-2.5 text-white" />}
                    {someVisibleSel && !allVisibleSel && (
                      <div className="w-2 h-0.5 bg-white rounded" />
                    )}
                  </div>
                </div>
                <div />
                <div>Product</div>
                <div className="flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" /> Current Tags
                </div>
                <div className="flex items-center gap-1" style={{ color: "#5b21b6" }}>
                  <Sparkles className="w-2.5 h-2.5" /> AI Suggested Tags
                </div>
                <div>Status</div>
                <div>Action</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100">
                {visible.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Tag className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm font-semibold">No products found</p>
                  </div>
                )}

                {visible.map((p) => {
                  const isSel = selected.has(p.productId);
                  const aiTags = aiResults[p.productId];
                  const isLoading = runningRowId === p.productId;

                  return (
                    <div
                      key={p.productId}
                      className={`grid px-4 py-3 items-start transition-colors ${
                        isSel ? "bg-blue-50" : aiTags ? "hover:bg-purple-50/20" : "hover:bg-gray-50/60"
                      }`}
                      style={{ gridTemplateColumns: "40px 44px 1fr 1fr 1fr 120px 80px", gap: 8 }}
                    >
                      {/* Checkbox */}
                      <div className="flex items-start justify-center pt-1">
                        <div
                          onClick={() => toggleRow(p.productId)}
                          className={`w-4 h-4 rounded border-2 cursor-pointer flex items-center justify-center transition-all mt-0.5 ${
                            isSel ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSel && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </div>

                      {/* Thumbnail */}
                      <div className="pt-0.5">
                        <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-lg flex-shrink-0">
                          {p.productImage ? (
                            <img
                              src={p.productImage}
                              alt=""
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            "📦"
                          )}
                        </div>
                      </div>

                      {/* Product info */}
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[12.5px] font-semibold text-gray-900 leading-snug line-clamp-2">
                          {p.title}
                        </p>
                        <p className="text-[10.5px] text-gray-400 font-mono mt-0.5">
                          #{p.productId.split("/").pop()}
                        </p>
                        {p.vendor && (
                          <p className="text-[10.5px] text-gray-400 mt-0.5">{p.vendor}</p>
                        )}
                      </div>

                      {/* Current tags */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {p.tags.length === 0 ? (
                          <span className="text-[11px] text-gray-300 italic">No current tags</span>
                        ) : (
                          p.tags.map((t) => <TagPill key={t} tag={t} variant="current" />)
                        )}
                      </div>

                      {/* AI tags */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {isLoading ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-purple-600 font-semibold">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Generating tags…
                          </div>
                        ) : aiTags ? (
                          aiTags.map((t) => <TagPill key={t} tag={t} variant="ai" />)
                        ) : (
                          <span className="text-[11px] text-gray-300 italic">
                            Run AI to generate
                          </span>
                        )}
                      </div>

                      {/* Status */}
                      <div className="pt-0.5">
                        {aiTags ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
                            🤖 AI · {aiTags.length} tags
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-gray-100 text-gray-400 border border-gray-200 whitespace-nowrap">
                            ◌ Pending
                          </span>
                        )}
                      </div>

                      {/* Action */}
                      <div className="pt-0.5">
                        <button
                          onClick={() => runRowAI(p.productId)}
                          disabled={!!aiTags || !!runningRowId}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                            aiTags
                              ? "bg-green-50 border border-green-300 text-green-700 cursor-default"
                              : "bg-gradient-to-r from-purple-600 to-blue-600 text-white border border-transparent hover:shadow-md hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : aiTags ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          {aiTags ? "Done" : "AI"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 flex-wrap gap-2">
                <div className="flex items-center gap-2 text-[12.5px] font-bold text-gray-600">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  {products.length} products · {aiCount} with AI tags · {selected.size} selected
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => {
                      setAiResults({});
                      setSelected(new Set());
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-[10px] text-[12.5px] font-semibold text-gray-500 hover:border-red-400 hover:text-red-500 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset All
                  </button>
                  <button
                    onClick={() => {
                      setApplyError(null);
                      setShowApplyModal(true);
                    }}
                    disabled={aiCount === 0}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-[10px] text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Apply Tag Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── FLOATING BAR ── */}
        {aiCount > 0 && !applying && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0c1535] rounded-2xl px-5 py-3.5 flex items-center gap-4 shadow-2xl z-40 min-w-[460px]">
            <div className="flex-1">
              <p className="text-[13.5px] font-bold text-white">
                {aiCount} product{aiCount !== 1 ? "s" : ""} ready — {totalTagsGenerated} tags generated
              </p>
              <p className="text-[11.5px] text-gray-400 mt-0.5">
                Push all AI-suggested tags to Shopify
              </p>
            </div>
            <button
              onClick={() => {
                setApplyError(null);
                setShowApplyModal(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-xl text-[12.5px] font-bold hover:bg-purple-50 hover:text-purple-700 transition-all whitespace-nowrap"
            >
              Apply Tag Changes
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── APPLY MODAL ── */}
        <Dialog open={showApplyModal} onOpenChange={(open) => !applying && setShowApplyModal(open)}>
          <DialogContent className="max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[17px] font-extrabold">
                <Tag className="w-5 h-5 text-purple-500" />
                Apply Tag Changes to Shopify
              </DialogTitle>
              <p className="text-[12px] text-gray-500">Review before pushing to your store</p>
            </DialogHeader>

            <div className="space-y-4 mt-1">
              {/* Summary stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { val: aiCount, label: "Products Updated", color: "#7c3aed" },
                  { val: totalTagsGenerated, label: "New Tags", color: "#12b76a" },
                  { val: totalCurrentTagsInAI, label: "Current Tags", color: "#94a3b8" },
                  {
                    val: Math.max(0, totalTagsGenerated - totalCurrentTagsInAI),
                    label: "Net New Added",
                    color: "#1a3faa",
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="text-center bg-gray-50 border border-gray-200 rounded-[10px] p-3"
                  >
                    <p className="text-[22px] font-extrabold" style={{ color: s.color }}>
                      {s.val}
                    </p>
                    <p className="text-[10.5px] text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Note */}
              <div className="bg-purple-50 border border-purple-200 rounded-[10px] p-3 text-[12px] text-purple-700 leading-relaxed">
                <strong>🤖 AI suggestions</strong> are shown in purple. Tags will be{" "}
                <strong>added</strong> to each product's existing tags — nothing is removed. Only
                products with AI tags will be updated.
              </div>

              {/* Product list */}
              <div>
                <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Current Tags → AI Tags Added
                </p>
                <div className="max-h-[240px] overflow-y-auto flex flex-col gap-2 pr-1">
                  {productsWithAI.map((p) => {
                    const aiTags = aiResults[p.productId]!;
                    return (
                      <div
                        key={p.productId}
                        className="p-3 bg-purple-50 border border-purple-200 rounded-[10px]"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-sm flex-shrink-0">
                            {p.productImage ? (
                              <img src={p.productImage} alt="" className="w-full h-full object-cover" />
                            ) : "📦"}
                          </div>
                          <p className="text-[12px] font-bold truncate flex-1">{p.title}</p>
                          <span className="text-[9.5px] font-mono text-gray-400 flex-shrink-0">
                            #{p.productId.split("/").pop()}
                          </span>
                        </div>

                        {p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {p.tags.map((t) => <TagPill key={t} tag={t} variant="current" />)}
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 my-1.5">
                          <ChevronRight className="w-3 h-3" />
                          AI adds {aiTags.length} tag{aiTags.length !== 1 ? "s" : ""}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {aiTags.map((t) => <TagPill key={t} tag={t} variant="ai" />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Error */}
              {applyError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[12px] text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {applyError}
                </div>
              )}

              {/* Progress */}
              {applying && (
                <div className="bg-blue-50 border border-blue-200 rounded-[10px] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-semibold text-blue-700">Applying tags…</span>
                    <span className="text-[12px] font-bold text-blue-700">
                      {applyProgress.current}/{applyProgress.total}
                    </span>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full transition-all duration-300"
                      style={{
                        width: `${(applyProgress.current / Math.max(applyProgress.total, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 mt-2">
              <Button
                variant="outline"
                onClick={() => setShowApplyModal(false)}
                disabled={applying}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                disabled={applying || aiCount === 0}
                className="flex-[2] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
              >
                {applying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Applying…
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    ✓ Apply to Shopify
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── SUCCESS MODAL ── */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="max-w-[480px]">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
                🎉
              </div>
              <h3 className="text-[20px] font-extrabold text-gray-900 mb-2">Tags Applied!</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed mb-5">
                <strong>{successStats.tags} tags</strong> across{" "}
                <strong>{successStats.count} products</strong> have been saved to your Shopify store.
                <br />
                Your products are now better optimised for search.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 border border-gray-200 rounded-[10px] p-4">
                  <p className="text-[28px] font-extrabold text-purple-600">{successStats.tags}</p>
                  <p className="text-[11px] text-gray-500 mt-1">Tags Added</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-[10px] p-4">
                  <p className="text-[28px] font-extrabold text-blue-600">{successStats.count}</p>
                  <p className="text-[11px] text-gray-500 mt-1">Products Updated</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-[10px] p-3 text-left mb-5">
                <p className="text-[12px] text-blue-700 leading-relaxed">
                  <strong>💡 Tip:</strong> Tags improve product discoverability in collections,
                  search, and storefront filters. Changes reflect immediately on your store.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSuccessModal(false)}
                  className="flex-1"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setAiResults({});
                    setSelected(new Set());
                    fetchAll();
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  Done →
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}