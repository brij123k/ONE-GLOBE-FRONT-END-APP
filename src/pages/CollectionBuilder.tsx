import { useState, useEffect, useCallback, useRef } from "react";
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
  ChevronRight,
  Search,
  Sparkles,
  Loader2,
  Check,
  Package,
  Tag,
  FolderPlus,
  RotateCcw,
  X,
  Layers,
  AlertCircle,
  Edit3,
  ChevronDown,
  Plus,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  productsCount: { count: number };
}

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

interface AiResult {
  l1: string;
  l1Icon: string;
  l2: string;
  l2Icon: string;
  confidence: number;
}

interface CollectionNode {
  name: string;
  icon: string;
  handle: string;
  products: Product[];
  children: Record<string, SubCollectionNode>;
  exists: boolean;
  existingId?: string;
}

interface SubCollectionNode {
  name: string;
  icon: string;
  handle: string;
  products: Product[];
  exists: boolean;
  existingId?: string;
}

interface Collections {
  [key: string]: CollectionNode;
}

interface ActiveView {
  type: "l1" | "l2";
  l1key: string;
  l2key?: string;
}

interface CreationItem {
  level: 1 | 2;
  name: string;
  icon: string;
  handle: string;
  exists: boolean;
  existingId?: string;
  count: number;
  parent?: string;
  products: Product[];
  status: "pending" | "creating" | "done-new" | "done-merge" | "error";
  collectionId?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function toHandle(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

const CAT_COLORS: Record<string, string> = {
  Furniture: "#ea580c",
  Lighting: "#ca8a04",
  Beauty: "#db2777",
  Footwear: "#059669",
  "Food & Spices": "#c2410c",
  Clothing: "#7c3aed",
  Jewellery: "#b45309",
  Kitchen: "#0891b2",
  Electronics: "#4f46e5",
  Sports: "#0ea5e9",
  "Winter Sports": "#6366f1",
  Snowboard: "#f97316",
  Accessories: "#8b5cf6",
  Fashion: "#ec4899",
  Default: "#64748b",
};

function getCatColor(name: string) {
  return CAT_COLORS[name] || CAT_COLORS["Default"];
}

// ─── Step Bar ───────────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  const steps = [
    "Select Products",
    "AI Analysis",
    "Review Collections",
    "Create in Shopify",
  ];
  return (
    <div className="bg-white border-b border-gray-200 sticky top-[60px] z-40">
      <div className="flex items-stretch h-[46px] px-6">
        {steps.map((label, i) => {
          const num = i + 1;
          const isDone = num < current;
          const isActive = num === current;
          return (
            <div key={num} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-4 h-full border-b-[3px] transition-all ${
                  isActive
                    ? "border-blue-600"
                    : isDone
                    ? "border-green-500"
                    : "border-transparent"
                }`}
              >
                <div
                  className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[10px] font-bold transition-all flex-shrink-0 ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-300"
                      : isDone
                      ? "bg-green-500 text-white"
                      : "bg-gray-100 text-gray-400 border border-gray-200"
                  }`}
                >
                  {isDone ? "✓" : num}
                </div>
                <span
                  className={`text-[12px] font-bold ${
                    isActive
                      ? "text-blue-800"
                      : isDone
                      ? "text-green-700"
                      : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span className="text-gray-200 text-base px-1">›</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Collection Suggestion Input ────────────────────────────────────────────

interface CollectionInputProps {
  storeCollections: ShopifyCollection[];
  selectedIds: Set<string>;
  products: Product[];
  onSuccess: () => void;
}

function CollectionInput({
  storeCollections,
  selectedIds,
  products,
  onSuccess,
}: CollectionInputProps) {
  const [input, setInput] = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const filtered = storeCollections.filter(
    (c) =>
      input.length === 0 ||
      c.title.toLowerCase().includes(input.toLowerCase()) ||
      c.handle.toLowerCase().includes(input.toLowerCase())
  );

  const exactMatch = storeCollections.find(
    (c) => c.title.toLowerCase() === input.toLowerCase()
  );
  const isNew = input.trim().length > 0 && !exactMatch;

  const targets =
    selectedIds.size > 0
      ? products.filter((p) => selectedIds.has(p.productId))
      : products;

  async function handleApply() {
    if (!input.trim()) return;
    setApplying(true);
    setError(null);
    setSuccess(null);
    try {
      let collectionId = exactMatch?.id;
      if (!collectionId) {
        // Create new collection
        const res = await postApi(ApiConfig.createCollection, {
          title: input.trim(),
        });
        console.log(res,"1")
        if (!res?.collectionId) throw new Error("Failed to create collection");
        collectionId = res.collectionId;
      }
      // Add products
      const productIds = targets.map((p) => p.productId);
      await postApi(ApiConfig.addProductToCollection, {
        collectionId,
        collectionTitle:input.trim(),
        collectionHandle:'new',
        productIds,
      });
      setSuccess(
        `✓ ${isNew ? "Created & added" : "Added"} ${productIds.length} product${
          productIds.length !== 1 ? "s" : ""
        } to "${input.trim()}"`
      );
      setInput("");
      onSuccess();
    } catch (e: any) {
      setError(e?.message || "Failed to apply collection");
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-[14px] p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-10 h-10 rounded-[10px] bg-green-50 border border-green-200 flex items-center justify-center">
          <FolderPlus className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">
            Quick Add
          </p>
          <p className="text-[15px] font-extrabold text-gray-900">
            Add to Collection
          </p>
          <p className="text-[12px] text-gray-500">
            Apply to{" "}
            <strong>
              {selectedIds.size > 0 ? selectedIds.size : products.length}{" "}
              product{(selectedIds.size || products.length) !== 1 ? "s" : ""}
            </strong>{" "}
            ·{" "}
            {selectedIds.size === 0
              ? "Select products above to narrow scope"
              : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full lg:w-auto" ref={dropRef}>
        <div className="relative flex-1 lg:min-w-[280px]">
          <div
            className={`flex items-center border rounded-lg overflow-hidden bg-white transition-all ${
              showDrop ? "border-green-500" : "border-gray-200"
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
              onBlur={() => setTimeout(() => setShowDrop(false), 200)}
              placeholder="Search or enter collection name…"
              className="flex-1 px-2 py-2 outline-none text-[12.5px] font-semibold bg-transparent"
            />
            <ChevronDown
              className={`w-4 h-4 text-gray-400 mr-2 transition-transform ${
                showDrop ? "rotate-180" : ""
              }`}
            />
          </div>

          {showDrop && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-[10px] shadow-xl z-50 overflow-hidden">
              {filtered.length > 0 && (
                <>
                  <div className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">
                    Existing Collections
                  </div>
                  {filtered.slice(0, 6).map((col) => (
                    <div
                      key={col.id}
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-green-50"
                      onMouseDown={() => {
                        setInput(col.title);
                        setShowDrop(false);
                      }}
                    >
                      <div className="w-6 h-6 rounded-md bg-green-50 border border-green-200 flex items-center justify-center">
                        <Tag className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="flex-1 text-[12.5px] text-gray-700">
                        {col.title}
                      </span>
                      <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {col.productsCount.count} products
                      </span>
                    </div>
                  ))}
                </>
              )}

              {isNew && (
                <>
                  {filtered.length > 0 && (
                    <div className="h-px bg-gray-100 my-1" />
                  )}
                  <div
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50"
                    onMouseDown={() => setShowDrop(false)}
                  >
                    <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center">
                      <Plus className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="flex-1 text-[12.5px] font-bold text-blue-700">
                      Create "{input}"
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      New
                    </span>
                  </div>
                </>
              )}

              {filtered.length === 0 && !isNew && (
                <div className="px-3 py-4 text-center text-[12px] text-gray-400">
                  Type to search or create a collection
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleApply}
          disabled={!input.trim() || applying}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white text-[12.5px] font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {applying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
          Apply{isNew ? " & Create" : ""}
        </button>
      </div>

      {(error || success) && (
        <div
          className={`w-full text-[12px] font-semibold px-3 py-2 rounded-lg border ${
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

// ─── Main Component ─────────────────────────────────────────────────────────

export default function CollectionBuilder() {
  const navigate = useNavigate();

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [storeCollections, setStoreCollections] = useState<
    ShopifyCollection[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [aiResults, setAiResults] = useState<Record<string, AiResult>>({});
  const [productCollections, setProductCollections] = useState<
    Record<string, string[]>
  >({});

  // UI state
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCollection, setFilterCollection] = useState("");
  const [collections, setCollections] = useState<Collections>({});
  const [activeView, setActiveView] = useState<ActiveView | null>(null);
  const [aiRunning, setAiRunning] = useState(false);
  const [runningRowId, setRunningRowId] = useState<string | null>(null);
  const [creationItems, setCreationItems] = useState<CreationItem[]>([]);
  const [creationDone, setCreationDone] = useState(false);
  const [editingDetailName, setEditingDetailName] = useState(false);
  const [editNameVal, setEditNameVal] = useState("");

  // Modal
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [prods, cols] = await Promise.all([
        getApi(ApiConfig.getStoredCollectionProduct),
        getApi(ApiConfig.getCollectiononly),
      ]);
      setProducts(prods || []);
      setStoreCollections(cols || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ── Fetch detailed collections for selected products ─────────────────

  async function fetchProductCollections(productIds: string[]) {
    if (productIds.length === 0) return;
    try {
      const res = await postApi(ApiConfig.getSelectedProductCollection, {
        productIds,
      });
      setProductCollections((prev) => ({ ...prev, ...(res || {}) }));
    } catch (e) {
      console.error(e);
    }
  }

  // ── Visible products ───────────────────────────────────────────────────

  function getVisible() {
    return products.filter((p) => {
      const mq =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.vendor || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.productType || "").toLowerCase().includes(searchQuery.toLowerCase());

      const ms =
        !filterStatus ||
        (filterStatus === "analysed" && aiResults[p.productId]) ||
        (filterStatus === "pending" && !aiResults[p.productId]);

      const productCols = p.collections.map((c) => c.handle);
      const mc =
        !filterCollection ||
        (filterCollection === "none"
          ? productCols.length === 0
          : productCols.includes(filterCollection));

      return mq && ms && mc;
    });
  }

  // ── Selection ──────────────────────────────────────────────────────────

  function toggleRow(pid: string) {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(pid)) s.delete(pid);
      else s.add(pid);
      return s;
    });
  }

  function toggleAll() {
    const visible = getVisible().map((p) => p.productId);
    const allSel = visible.every((id) => selected.has(id));
    setSelected((prev) => {
      const s = new Set(prev);
      if (allSel) visible.forEach((id) => s.delete(id));
      else visible.forEach((id) => s.add(id));
      return s;
    });
  }

  // ── Build collections from AI results ─────────────────────────────────

  function buildCollections(results: Record<string, AiResult>) {
    const cols: Collections = {};
    const existingHandles = storeCollections.map((c) => c.handle);

    products.forEach((p) => {
      const g = results[p.productId];
      if (!g) return;
      const { l1, l1Icon, l2, l2Icon } = g;
      const l1h = toHandle(l1);
      const l2h = toHandle(l2);

      if (!cols[l1]) {
        const existing = storeCollections.find((c) => c.handle === l1h);
        cols[l1] = {
          name: l1,
          icon: l1Icon,
          handle: l1h,
          products: [],
          children: {},
          exists: existingHandles.includes(l1h),
          existingId: existing?.id,
        };
      }
      const cat = cols[l1];
      if (!cat.products.find((x) => x.productId === p.productId))
        cat.products.push(p);

      if (!cat.children[l2]) {
        const existing = storeCollections.find((c) => c.handle === l2h);
        cat.children[l2] = {
          name: l2,
          icon: l2Icon,
          handle: l2h,
          products: [],
          exists: existingHandles.includes(l2h),
          existingId: existing?.id,
        };
      }
      const child = cat.children[l2];
      if (!child.products.find((x) => x.productId === p.productId))
        child.products.push(p);
    });

    return cols;
  }

  // ── AI Analysis ────────────────────────────────────────────────────────

  async function runAI() {
    if (aiRunning) return;
    setAiRunning(true);

    const toAnalyse =
      selected.size > 0
        ? products.filter((p) => selected.has(p.productId))
        : products;

    const newResults = { ...aiResults };

    for (const p of toAnalyse) {
      if (newResults[p.productId]) continue; // skip already done
      setRunningRowId(p.productId);
      try {
        const res = await postApi(ApiConfig.aiOptimization, {
          productId: p.productId,
        });
        if (res?.l1) {
          newResults[p.productId] = {
            l1: res.l1,
            l1Icon: res.l1Icon || "📦",
            l2: res.l2 || p.productType || "General",
            l2Icon: res.l2Icon || "🏷️",
            confidence: res.confidence || 0.9,
          };
          setAiResults({ ...newResults });
          const built = buildCollections({ ...newResults });
          setCollections(built);
        }
      } catch (e) {
        console.error("AI error for", p.productId, e);
      }
    }

    setRunningRowId(null);
    setAiRunning(false);
  }

  async function runRowAI(pid: string) {
    if (aiResults[pid] || runningRowId) return;
    setRunningRowId(pid);
    try {
      const res = await postApi(ApiConfig.aiOptimization, {
        productId: pid,
      });
      if (res?.l1) {
        const g: AiResult = {
          l1: res.l1,
          l1Icon: res.l1Icon || "📦",
          l2: res.l2,
          l2Icon: res.l2Icon || "🏷️",
          confidence: res.confidence || 0.9,
        };
        const newResults = { ...aiResults, [pid]: g };
        setAiResults(newResults);
        setCollections(buildCollections(newResults));
      }
    } catch (e) {
      console.error(e);
    }
    setRunningRowId(null);
  }

  // ── Step navigation ────────────────────────────────────────────────────

  function goToReview() {
    const built = buildCollections(aiResults);
    setCollections(built);
    const cats = Object.values(built);
    if (cats.length > 0) {
      setActiveView({ type: "l1", l1key: cats[0].name });
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Rename ─────────────────────────────────────────────────────────────

  function renameL1(oldKey: string, newName: string) {
    newName = newName.trim();
    if (!newName || newName === oldKey) return;
    const cat = collections[oldKey];
    cat.name = newName;
    cat.handle = toHandle(newName);
    const updated = { ...collections };
    updated[newName] = cat;
    delete updated[oldKey];
    setCollections(updated);
    if (activeView?.l1key === oldKey)
      setActiveView({ ...activeView, l1key: newName });
  }

  function renameL2(l1key: string, oldL2: string, newName: string) {
    newName = newName.trim();
    if (!newName || newName === oldL2) return;
    const cat = collections[l1key];
    const sub = cat.children[oldL2];
    sub.name = newName;
    sub.handle = toHandle(newName);
    cat.children[newName] = sub;
    delete cat.children[oldL2];
    setCollections({ ...collections });
    if (activeView?.l2key === oldL2)
      setActiveView({ ...activeView, l2key: newName });
  }

  // ── Step 4 – Create ────────────────────────────────────────────────────

  async function startCreating() {
    setShowConfirm(false);
    setStep(4);
    setCreationDone(false);

    const cats = Object.values(collections);
    const items: CreationItem[] = [];
    cats.forEach((cat) => {
      items.push({
        level: 1,
        name: cat.name,
        icon: cat.icon,
        handle: cat.handle,
        exists: cat.exists,
        existingId: cat.existingId,
        count: cat.products.length,
        products: cat.products,
        status: "pending",
      });
      Object.values(cat.children).forEach((ch) => {
        items.push({
          level: 2,
          name: ch.name,
          icon: ch.icon,
          handle: ch.handle,
          exists: ch.exists,
          existingId: ch.existingId,
          count: ch.products.length,
          parent: cat.name,
          products: ch.products,
          status: "pending",
        });
      });
    });

    setCreationItems(items.map((i) => ({ ...i })));
    window.scrollTo({ top: 0, behavior: "smooth" });

    await sleep(300);

    const updated = [...items];

    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      updated[i] = { ...item, status: "creating" };
      setCreationItems([...updated]);

      try {
        let collectionId = item.existingId;

        if (!item.exists) {
          const res = await postApi(ApiConfig.createCollection, {
            title: item.name,
          });
          collectionId = res?.collectionId;
        }

        if (collectionId && item.products.length > 0) {
          await postApi(ApiConfig.addProductToCollection, {
            collectionId,
            productIds: item.products.map((p) => p.productId),
          });
        }

        updated[i] = {
          ...updated[i],
          status: item.exists ? "done-merge" : "done-new",
          collectionId,
        };
      } catch (e) {
        console.error(e);
        updated[i] = { ...updated[i], status: "error" };
      }

      setCreationItems([...updated]);
      await sleep(200);
    }

    setCreationDone(true);
  }

  // ── Stats ──────────────────────────────────────────────────────────────

  const analysedCount = Object.keys(aiResults).length;
  const totalCols = Object.values(collections).reduce(
    (acc, cat) => acc + 1 + Object.keys(cat.children).length,
    0
  );

  function getCollectionStats() {
    let newN = 0,
      existN = 0;
    Object.values(collections).forEach((c) => {
      if (c.exists) existN++;
      else newN++;
      Object.values(c.children).forEach((ch) => {
        if (ch.exists) existN++;
        else newN++;
      });
    });
    const totalProds = [
      ...new Set(
        Object.values(collections).flatMap((c) =>
          c.products.map((p) => p.productId)
        )
      ),
    ].length;
    return { newN, existN, totalProds };
  }

  // ── Unique collection handles from products ────────────────────────────

  const allProductCollections = [
    ...new Set(
      products.flatMap((p) => p.collections.map((c) => c.handle))
    ),
  ];

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout title="Collection Builder">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Layers className="w-12 h-12 animate-pulse text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 text-sm">Loading products…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const visible = getVisible();
  const allVisibleSel = visible.length > 0 && visible.every((p) => selected.has(p.productId));
  const someVisibleSel = visible.some((p) => selected.has(p.productId));
  const canProceed = analysedCount > 0;
  const { newN, existN, totalProds } = getCollectionStats();

  return (
    <AppLayout title="Smart Collection Builder">
      <div className="flex flex-col min-h-screen bg-[#eef1f8]">
        {/* Top Bar */}
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
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Optimization Suite
            </p>
            <p className="text-[17px] font-extrabold text-gray-900 leading-tight">
              Smart Collection Builder
            </p>
            <p className="text-[11.5px] text-gray-500">
              AI groups products into 2-level collections — broad category +
              specific type
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#0f2878] text-white px-4 py-[7px] rounded-full text-[12.5px] font-bold">
            <Package className="w-3.5 h-3.5" />
            {products.length} Products
          </div>
        </div>

        <StepBar current={step} />

        {/* ══ STEP 1 ══ */}
        {step === 1 && (
          <div className="max-w-[1200px] mx-auto w-full px-5 pb-24">
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-5 mb-4">
              {[
                {
                  label: "Total Products",
                  val: products.length,
                  unit: "in store",
                  note: "Ready to analyse",
                  noteColor: "text-blue-600",
                  fill: 100,
                  barColor: "#1a3faa",
                },
                {
                  label: "Selected",
                  val: selected.size,
                  unit: "products",
                  note:
                    selected.size > 0
                      ? `${selected.size} ready to analyse`
                      : "None selected yet",
                  noteColor: "text-purple-600",
                  fill: Math.round((selected.size / Math.max(products.length, 1)) * 100),
                  barColor: "#7c3aed",
                },
                {
                  label: "AI Analysed",
                  val: analysedCount,
                  unit: "products",
                  note:
                    analysedCount > 0
                      ? `${analysedCount} categories extracted`
                      : "Run AI to extract types",
                  noteColor: "text-green-600",
                  fill: Math.round((analysedCount / Math.max(products.length, 1)) * 100),
                  barColor: "#12b76a",
                },
                {
                  label: "Collections Found",
                  val: totalCols,
                  unit: "collections",
                  note: totalCols > 0 ? `${totalCols} ready to create` : "Awaiting analysis",
                  noteColor: "text-amber-600",
                  fill: Math.min(100, Math.round((totalCols / 10) * 100)),
                  barColor: "#f59e0b",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-[14px] p-4"
                >
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
                    {s.label}
                  </p>
                  <p className="text-[22px] font-extrabold leading-none">
                    {s.val}{" "}
                    <span className="text-[12px] font-medium text-gray-400">
                      {s.unit}
                    </span>
                  </p>
                  <p className={`text-[11px] font-semibold mt-1 ${s.noteColor}`}>
                    {s.note}
                  </p>
                  <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${s.fill}%`, background: s.barColor }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Collection Quick Add */}
            <div className="mb-4">
              <CollectionInput
                storeCollections={storeCollections}
                selectedIds={selected}
                products={products}
                onSuccess={fetchAll}
              />
            </div>

            {/* Section header */}
            <div className="bg-white border border-gray-200 rounded-[14px] p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-[10px] bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                  <Layers className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    Step 1
                  </p>
                  <p className="text-[15px] font-extrabold text-gray-900">
                    Select Products &amp; Run AI Analysis
                  </p>
                  <p className="text-[12px] text-gray-500">
                    Check products to group. Use "AI Extract All" to
                    auto-detect, or run AI per-row.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={runAI}
                  disabled={aiRunning}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-[10px] text-[12.5px] font-bold shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {aiRunning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {aiRunning ? "Analysing…" : "✨ AI Extract All"}
                </button>
                <button
                  onClick={goToReview}
                  disabled={!canProceed}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[10px] text-[13px] font-bold shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                >
                  Review Collections
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-[10px] flex-1 max-w-[280px] focus-within:border-blue-500">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
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
                  className="px-3 py-1.5 border border-gray-200 rounded-[10px] text-[12px] font-semibold text-gray-600 bg-white outline-none"
                >
                  <option value="">All Products</option>
                  <option value="analysed">AI Analysed</option>
                  <option value="pending">Not Analysed</option>
                </select>

                <select
                  value={filterCollection}
                  onChange={(e) => setFilterCollection(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-[10px] text-[12px] font-semibold text-gray-600 bg-white outline-none"
                >
                  <option value="">All Collections</option>
                  {storeCollections.map((c) => (
                    <option key={c.handle} value={c.handle}>
                      {c.title}
                    </option>
                  ))}
                  <option value="none">No Collections</option>
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
                style={{
                  gridTemplateColumns: "40px 48px 1fr 1fr 150px 90px",
                  gap: 8,
                }}
              >
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
                    {allVisibleSel && (
                      <Check className="w-2.5 h-2.5 text-white" />
                    )}
                    {someVisibleSel && !allVisibleSel && (
                      <div className="w-2 h-0.5 bg-white rounded" />
                    )}
                  </div>
                </div>
                <div />
                <div>Product</div>
                <div>Existing Collections</div>
                <div>AI Collection</div>
                <div>Action</div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-100">
                {visible.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Package className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm font-semibold">No products found</p>
                  </div>
                )}
                {visible.map((p) => {
                  const isSel = selected.has(p.productId);
                  const g = aiResults[p.productId];
                  const isLoading = runningRowId === p.productId;

                  return (
                    <div
                      key={p.productId}
                      className={`grid px-4 py-3 items-center transition-colors hover:bg-blue-50/30 ${
                        isSel ? "bg-blue-50" : ""
                      }`}
                      style={{
                        gridTemplateColumns: "40px 48px 1fr 1fr 150px 90px",
                        gap: 8,
                      }}
                    >
                      {/* Checkbox */}
                      <div className="flex items-center justify-center">
                        <div
                          onClick={() => toggleRow(p.productId)}
                          className={`w-4 h-4 rounded border-2 cursor-pointer flex items-center justify-center transition-all ${
                            isSel
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSel && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </div>

                      {/* Thumbnail */}
                      <div className="w-9 h-9 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center text-lg flex-shrink-0">
                        {p.productImage ? (
                          <img
                            src={p.productImage}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          "📦"
                        )}
                      </div>

                      {/* Product info */}
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-gray-900 truncate">
                          {p.title}
                        </p>
                        <p className="text-[10.5px] text-gray-400 font-mono truncate">
                          {p.productId.replace("gid://shopify/Product/", "#")}
                        </p>
                      </div>

                      {/* Existing collections */}
                      <div>
                        {p.collections.length === 0 ? (
                          <span className="text-[11px] text-gray-300 italic">
                            No collections
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {p.collections.map((col) => (
                              <span
                                key={col.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                                style={{
                                  background: "#64748b18",
                                  color: "#475569",
                                  borderColor: "#64748b44",
                                }}
                              >
                                {col.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* AI category */}
                      <div>
                        {isLoading ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-purple-600 font-semibold">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Extracting…
                          </div>
                        ) : g ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 truncate max-w-[140px]">
                              {g.l1Icon} {g.l1}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 truncate max-w-[140px]">
                              {g.l2Icon} {g.l2}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-300 italic">
                            Run AI to extract
                          </span>
                        )}
                      </div>

                      {/* Action */}
                      <div>
                        <button
                          onClick={() => runRowAI(p.productId)}
                          disabled={!!g || !!runningRowId}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                            g
                              ? "border-blue-300 bg-blue-50 text-blue-700 cursor-default"
                              : "border-gray-200 bg-white text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : g ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          {g ? "Done" : "AI"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 text-[12.5px] font-bold text-gray-600">
                  <Package className="w-3.5 h-3.5 text-gray-400" />
                  {products.length} products · {analysedCount} analysed ·{" "}
                  {selected.size} selected
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelected(new Set())}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-[10px] text-[12.5px] font-semibold text-gray-500 hover:border-gray-400 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Clear
                  </button>
                  <button
                    onClick={goToReview}
                    disabled={!canProceed}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[10px] text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all"
                  >
                    Review Collections
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 3 – REVIEW ══ */}
        {step === 3 && (
          <div className="max-w-[1200px] mx-auto w-full px-5 pb-24">
            <div className="flex items-center justify-between gap-3 mt-5 mb-4 flex-wrap">
              <div>
                <p className="text-[17px] font-extrabold text-gray-900">
                  Review Generated Collections
                </p>
                <p className="text-[12px] text-gray-500 mt-1">
                  AI found{" "}
                  <span className="font-bold text-blue-600">{totalCols}</span>{" "}
                  collections across{" "}
                  <span className="font-bold text-blue-600">
                    {Object.keys(collections).length}
                  </span>{" "}
                  categories · Click any to review or rename
                </p>
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-[10px] text-[12.5px] font-semibold text-gray-600 hover:border-gray-400 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-[10px] text-[13px] font-bold shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  Create in Shopify
                </button>
              </div>
            </div>

            {/* Summary row */}
            <div className="bg-white border border-gray-200 rounded-[14px] px-5 py-3 flex items-center gap-5 flex-wrap mb-4">
              {[
                { dot: "#12b76a", label: `${newN} new collections` },
                { dot: "#f59e0b", label: `${existN} existing — will merge` },
                {
                  dot: "#1a3faa",
                  label: `${Object.keys(collections).length} categories`,
                },
                { dot: "#7c3aed", label: `${totalProds} products organised` },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: s.dot }}
                  />
                  <span className="text-[12px] font-bold text-gray-700">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Layout */}
            <div className="flex gap-4 items-start">
              {/* Left tree */}
              <div className="w-[300px] flex-shrink-0 flex flex-col gap-2 sticky top-[130px]">
                {Object.values(collections).map((cat, ci) => {
                  const color = getCatColor(cat.name);
                  const children = Object.values(cat.children);
                  const isActive =
                    activeView?.l1key === cat.name &&
                    activeView?.type === "l1";

                  return (
                    <div
                      key={cat.name}
                      className={`bg-white border-2 rounded-[14px] overflow-hidden transition-all ${
                        activeView?.l1key === cat.name
                          ? "border-blue-500"
                          : "border-gray-200"
                      }`}
                    >
                      <div
                        onClick={() =>
                          setActiveView({ type: "l1", l1key: cat.name })
                        }
                        className={`flex items-center gap-2.5 p-3 cursor-pointer transition-all ${
                          isActive ? "bg-blue-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <div
                          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-base flex-shrink-0"
                          style={{
                            background: color + "22",
                            border: `1.5px solid ${color}55`,
                          }}
                        >
                          {cat.icon}
                        </div>
                        <span className="text-[13px] font-bold flex-1">
                          {cat.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {cat.products.length}
                        </span>
                        {cat.exists ? (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Exists
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                            New
                          </span>
                        )}
                      </div>

                      <div className="px-2 pb-2 flex flex-col gap-1">
                        {children.map((ch) => {
                          const isSubActive =
                            activeView?.l1key === cat.name &&
                            activeView?.l2key === ch.name &&
                            activeView?.type === "l2";
                          return (
                            <div
                              key={ch.name}
                              onClick={() =>
                                setActiveView({
                                  type: "l2",
                                  l1key: cat.name,
                                  l2key: ch.name,
                                })
                              }
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                                isSubActive
                                  ? "bg-indigo-50"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ background: color }}
                              />
                              <span className="text-[11.5px] font-bold flex-1">
                                {ch.icon} {ch.name}
                              </span>
                              <span className="text-[10px] text-gray-400 font-semibold">
                                {ch.products.length}
                              </span>
                              {ch.exists ? (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                  Exists
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                                  New
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right detail */}
              <div className="flex-1 min-w-0">
                {activeView && (() => {
                  const cat = collections[activeView.l1key];
                  if (!cat) return null;
                  const color = getCatColor(cat.name);

                  if (activeView.type === "l1") {
                    const children = Object.values(cat.children);
                    return (
                      <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
                        {/* Head */}
                        <div className="flex items-start gap-4 p-5 border-b border-gray-200">
                          <div
                            className="w-12 h-12 rounded-[12px] flex items-center justify-center text-2xl flex-shrink-0"
                            style={{
                              background: color + "22",
                              border: `1.5px solid ${color}55`,
                            }}
                          >
                            {cat.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <input
                              className="text-[18px] font-extrabold border-b-2 border-dashed border-gray-200 focus:border-blue-500 outline-none bg-transparent w-full transition-colors"
                              defaultValue={cat.name}
                              onBlur={(e) =>
                                renameL1(cat.name, e.target.value)
                              }
                            />
                            <p className="text-[11px] font-mono text-gray-400 mt-1">
                              /{cat.handle} · {cat.products.length} products ·{" "}
                              {children.length} sub-collections
                            </p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {cat.exists ? (
                                <span className="text-[10.5px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                  ⚠ Already exists — will merge products
                                </span>
                              ) : (
                                <span className="text-[10.5px] font-bold px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                                  ✦ New collection
                                </span>
                              )}
                              <span className="text-[10.5px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                📁 Level 1 — Broad Category
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 flex flex-col gap-6">
                          {/* Sub-collections */}
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                              Sub-Collections ({children.length})
                              <span className="flex-1 h-px bg-gray-100" />
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {children.map((ch) => (
                                <div
                                  key={ch.name}
                                  onClick={() =>
                                    setActiveView({
                                      type: "l2",
                                      l1key: cat.name,
                                      l2key: ch.name,
                                    })
                                  }
                                  className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-[10px] cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                                >
                                  <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ background: color }}
                                  />
                                  <span className="text-[12px] font-bold flex-1">
                                    {ch.icon} {ch.name}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {ch.products.length}
                                  </span>
                                  {ch.exists ? (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                      Exists
                                    </span>
                                  ) : (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                                      New
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Products */}
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                              All Products ({cat.products.length})
                              <span className="flex-1 h-px bg-gray-100" />
                            </p>
                            <div className="flex flex-col gap-2">
                              {cat.products.map((p) => (
                                <div
                                  key={p.productId}
                                  className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-200 rounded-[10px]"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-base">
                                    {p.productImage ? (
                                      <img
                                        src={p.productImage}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      "📦"
                                    )}
                                  </div>
                                  <span className="text-[12px] font-semibold flex-1 truncate">
                                    {p.title}
                                  </span>
                                  <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">
                                    #{p.productId.split("/").pop()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // L2 detail
                  const sub = activeView.l2key
                    ? cat.children[activeView.l2key]
                    : null;
                  if (!sub) return null;

                  return (
                    <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
                      <div className="flex items-start gap-4 p-5 border-b border-gray-200">
                        <div
                          className="w-12 h-12 rounded-[12px] flex items-center justify-center text-2xl flex-shrink-0"
                          style={{
                            background: color + "22",
                            border: `1.5px solid ${color}55`,
                          }}
                        >
                          {sub.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            className="text-[18px] font-extrabold border-b-2 border-dashed border-gray-200 focus:border-blue-500 outline-none bg-transparent w-full transition-colors"
                            defaultValue={sub.name}
                            onBlur={(e) =>
                              renameL2(
                                activeView.l1key,
                                sub.name,
                                e.target.value
                              )
                            }
                          />
                          <p className="text-[11px] font-mono text-gray-400 mt-1">
                            /{sub.handle} · Parent: /{cat.handle}
                          </p>
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {sub.exists ? (
                              <span className="text-[10.5px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                ⚠ Already exists — will add products
                              </span>
                            ) : (
                              <span className="text-[10.5px] font-bold px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                                ✦ New collection
                              </span>
                            )}
                            <span className="text-[10.5px] font-bold px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">
                              🏷 Level 2 — Specific Type
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-5 flex flex-col gap-6">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            Products ({sub.products.length})
                            <span className="flex-1 h-px bg-gray-100" />
                          </p>
                          <div className="flex flex-col gap-2">
                            {sub.products.map((p) => (
                              <div
                                key={p.productId}
                                className="flex items-center gap-3 p-2.5 bg-gray-50 border border-gray-200 rounded-[10px]"
                              >
                                <div className="w-8 h-8 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-base">
                                  {p.productImage ? (
                                    <img
                                      src={p.productImage}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    "📦"
                                  )}
                                </div>
                                <span className="text-[12px] font-semibold flex-1 truncate">
                                  {p.title}
                                </span>
                                <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">
                                  #{p.productId.split("/").pop()}
                                </span>
                                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200">
                                  Will add
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            Parent Category
                            <span className="flex-1 h-px bg-gray-100" />
                          </p>
                          <div
                            onClick={() =>
                              setActiveView({
                                type: "l1",
                                l1key: cat.name,
                              })
                            }
                            className="flex items-center gap-3 p-2.5 bg-indigo-50 border border-indigo-200 rounded-[10px] cursor-pointer hover:bg-indigo-100 transition-all"
                          >
                            <span className="text-lg">{cat.icon}</span>
                            <span className="text-[12px] font-semibold text-indigo-700 flex-1">
                              {cat.name}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                              Level 1
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ══ STEP 4 – CREATING ══ */}
        {step === 4 && (
          <div className="max-w-[700px] mx-auto w-full px-5 py-8">
            <div className="text-center mb-8">
              <p className="text-[22px] font-extrabold text-gray-900 mb-1">
                {creationDone
                  ? "All Done! 🎉"
                  : "Creating Collections in Shopify…"}
              </p>
              <p className="text-[13px] text-gray-500">
                {creationDone
                  ? "Your products are now organised into smart collections"
                  : `Processing ${creationItems.length} collections…`}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {creationItems.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-4 rounded-[14px] border transition-all ${
                    item.status === "creating"
                      ? "border-purple-400 bg-purple-50"
                      : item.status === "done-new"
                      ? "border-green-400 bg-green-50"
                      : item.status === "done-merge"
                      ? "border-amber-400 bg-amber-50"
                      : item.status === "error"
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-lg flex-shrink-0 transition-all ${
                      item.status === "creating"
                        ? "bg-purple-100"
                        : item.status === "done-new"
                        ? "bg-green-100"
                        : item.status === "done-merge"
                        ? "bg-amber-100"
                        : "bg-gray-100"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold">{item.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {item.status === "done-new"
                        ? `Created with ${item.count} product${item.count !== 1 ? "s" : ""}`
                        : item.status === "done-merge"
                        ? `Added ${item.count} product${item.count !== 1 ? "s" : ""} to existing collection`
                        : item.status === "error"
                        ? "Failed to create"
                        : item.level === 2
                        ? `Sub-collection of ${item.parent} · ${item.count} products`
                        : `${item.count} product${item.count !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                  <span
                    className={`text-[9.5px] font-bold px-2 py-0.5 rounded flex-shrink-0 ${
                      item.level === 1
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "bg-cyan-50 text-cyan-700 border border-cyan-200"
                    }`}
                  >
                    Level {item.level}
                  </span>
                  <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                    {item.status === "creating" && (
                      <Loader2 className="w-4.5 h-4.5 text-purple-600 animate-spin" />
                    )}
                    {item.status === "done-new" && (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    {item.status === "done-merge" && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs">
                        +
                      </div>
                    )}
                    {item.status === "error" && (
                      <AlertCircle className="w-5 h-5 text-red-500" />
                    )}
                    {item.status === "pending" && (
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-[9px] text-gray-400">—</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {creationDone && (
              <div className="bg-white border border-gray-200 rounded-[18px] p-9 text-center mt-6 shadow-lg">
                <div className="text-[54px] mb-4">🎉</div>
                <p className="text-[22px] font-extrabold mb-2">
                  Collections Created!
                </p>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
                  Your products are now organised into smart collections in
                  Shopify. Each product belongs to both its broad category and
                  specific type collection.
                </p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { val: newN, label: "New Collections", color: "#12b76a" },
                    { val: existN, label: "Merged Existing", color: "#f59e0b" },
                    {
                      val: totalProds,
                      label: "Products Organised",
                      color: "#1a3faa",
                    },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 border border-gray-200 rounded-[10px] p-4 text-center"
                    >
                      <p
                        className="text-[24px] font-extrabold"
                        style={{ color: s.color }}
                      >
                        {s.val}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setSelected(new Set());
                    setAiResults({});
                    setCollections({});
                    setActiveView(null);
                    setCreationItems([]);
                    setCreationDone(false);
                    setStep(1);
                    fetchAll();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[10px] font-bold mx-auto hover:-translate-y-0.5 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Start New Collection Build
                </button>
              </div>
            )}
          </div>
        )}

        {/* Floating bar */}
        {step === 1 && canProceed && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0c1535] rounded-2xl px-5 py-3.5 flex items-center gap-4 shadow-2xl z-40 min-w-[480px]">
            <div className="flex-1">
              <p className="text-[13.5px] font-bold text-white">
                {analysedCount} products analysed — {totalCols} collections
                ready
              </p>
              <p className="text-[11.5px] text-gray-400 mt-0.5">
                Review your collection hierarchy before creating
              </p>
            </div>
            <button
              onClick={goToReview}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-xl text-[12.5px] font-bold hover:bg-blue-50 hover:text-blue-700 transition-all"
            >
              Review &amp; Create Collections
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Confirm Modal */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
          <DialogContent className="max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-[17px] font-extrabold">
                Create Collections in Shopify?
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-2 my-4">
              {[
                { val: newN, label: "New Collections", color: "#12b76a" },
                { val: existN, label: "Merge Existing", color: "#f59e0b" },
                { val: totalProds, label: "Products", color: "#1a3faa" },
              ].map((s, i) => (
                <div
                  key={i}
                  className="text-center bg-gray-50 border border-gray-200 rounded-[10px] p-3"
                >
                  <p
                    className="text-[20px] font-extrabold"
                    style={{ color: s.color }}
                  >
                    {s.val}
                  </p>
                  <p className="text-[10.5px] text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-[10px] p-3 text-[12.5px] text-purple-700 leading-relaxed mb-4">
              Each product will be added to <strong>both</strong> its Level 1
              category and Level 2 type collection. Existing collections will
              have products merged in — no duplicates created.
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={startCreating}
                className="flex-[1.8] bg-gradient-to-r from-green-600 to-teal-600 gap-2"
              >
                <Check className="w-4 h-4" />
                ✓ Create Collections
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}