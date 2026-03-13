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
  RotateCcw,
  ChevronRight,
  AlertCircle,
  Edit3,
  Plus,
  Save,
  X,
  Layers,
  AlertTriangle,
  Monitor,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SpecProduct {
  _id: string;
  shopId: string;
  productId: string;
  title: string;
  productImage: string | null;
  optimized: boolean;
  specifications?: Record<string, string | null>;
}

interface AiSpecResult {
  title?: string;
  description?: string;
  color?: string | null;
  material?: string | null;
  size_fit?: string | null;
  finish_pattern?: string | null;
  dimensions?: string | null;
  unit?: string | null;
  weight?: string | null;
  capacity_volume?: string | null;
  compatible_with?: string | null;
}

interface SpecFields {
  color: string;
  material: string;
  size_fit: string;
  finish_pattern: string;
  dimensions: string;
  unit: string;
  weight: string;
  capacity_volume: string;
  compatible_with: string;
  [key: string]: string;
}

interface MetafieldDef {
  id: string;
  name: string;
  namespace: string;
  key: string;
  type: { name: string };
}

type SpecSource = "manual" | "ai" | null;

const SPEC_FIELD_LABELS: Record<string, string> = {
  color: "Color",
  material: "Material",
  size_fit: "Size / Fit",
  finish_pattern: "Finish / Pattern",
  dimensions: "Dimensions",
  unit: "Unit",
  weight: "Weight",
  capacity_volume: "Capacity / Volume",
  compatible_with: "Compatible With",
};

const CORE_FIELDS: (keyof SpecFields)[] = [
  "color",
  "material",
  "size_fit",
  "finish_pattern",
  "dimensions",
  "unit",
  "weight",
  "capacity_volume",
  "compatible_with",
];

function emptySpec(): SpecFields {
  return {
    color: "",
    material: "",
    size_fit: "",
    finish_pattern: "",
    dimensions: "",
    unit: "",
    weight: "",
    capacity_volume: "",
    compatible_with: "",
  };
}

function getCompletion(fields: Partial<SpecFields>) {
  const countable: (keyof SpecFields)[] = [
    "color",
    "material",
    "size_fit",
    "finish_pattern",
    "dimensions",
    "weight",
    "capacity_volume",
    "compatible_with",
  ];
  const filled = countable.filter((k) => (fields[k] || "").trim().length > 0).length;
  return { filled, total: countable.length, pct: Math.round((filled / countable.length) * 100) };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Radial Progress Ring ────────────────────────────────────────────────────

function ProgressRing({ pct, size = 44 }: { pct: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * pct) / 100;
  const color =
    pct === 100
      ? "#12b76a"
      : pct > 50
      ? "#1a3faa"
      : pct > 0
      ? "#7c3aed"
      : "#e2e8f0";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="4"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.3s ease" }}
      />
    </svg>
  );
}

// ─── Spec Input Field ────────────────────────────────────────────────────────

function SpecInput({
  label,
  value,
  onChange,
  placeholder,
  isAi,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isAi?: boolean;
  required?: boolean;
}) {
  const hasVal = value.trim().length > 0;

  return (
    <div className="mb-3">
      <div className="flex items-center gap-1.5 mb-1">
        {isAi && hasVal && (
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
        )}
        <span className="text-[11px] font-bold text-gray-600">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </span>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || `Enter ${label.toLowerCase()}…`}
        className={`w-full px-3 py-[7px] border rounded-[8px] text-[12.5px] font-semibold outline-none transition-all ${
          isAi && hasVal
            ? "border-purple-300 bg-purple-50 text-purple-800 focus:border-purple-500"
            : hasVal
            ? "border-blue-200 bg-blue-50/60 text-gray-900 focus:border-blue-500"
            : "border-gray-200 bg-white text-gray-900 focus:border-blue-500 focus:bg-blue-50/30"
        }`}
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SpecificationOptimization() {
  const navigate = useNavigate();

  // Data
  const [products, setProducts] = useState<SpecProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [metafields, setMetafields] = useState<MetafieldDef[]>([]);
  const [specMetafieldExists, setSpecMetafieldExists] = useState(false);

  // Per-product specs (local state, keyed by productId)
  const [specsMap, setSpecsMap] = useState<Record<string, SpecFields>>({});
  const [sourcesMap, setSourcesMap] = useState<Record<string, SpecSource>>({});

  // UI
  const [activePid, setActivePid] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // AI state
  const [bulkRunning, setBulkRunning] = useState(false);
  const [aiRunningPid, setAiRunningPid] = useState<string | null>(null);
  const [aiStatusText, setAiStatusText] = useState("");

  // Panel save state
  const [panelSaving, setPanelSaving] = useState(false);
  const [panelSaveSuccess, setPanelSaveSuccess] = useState(false);

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyProgress, setApplyProgress] = useState({ current: 0, total: 0 });
  const [applyError, setApplyError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  // Metafield creation modal
  const [showCreateMetaModal, setShowCreateMetaModal] = useState(false);
  const [creatingMeta, setCreatingMeta] = useState(false);
  const [metaCreateError, setMetaCreateError] = useState<string | null>(null);

  // Custom fields per product
  const [customFields, setCustomFields] = useState<Record<string, { key: string; val: string }[]>>({});

  const panelBodyRef = useRef<HTMLDivElement>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [prods, mfields] = await Promise.all([
        getApi(ApiConfig.getStoredSpecificationProduct),
        getApi(ApiConfig.isSpecificationExsist).catch(() => []),
      ]);

      const prodList: SpecProduct[] = prods || [];
      setProducts(prodList);

      const mf: MetafieldDef[] = mfields || [];
      setMetafields(mf);
      const hasSpec = mf.some(
        (m) => m.key === "specification" && m.namespace === "custom"
      );
      setSpecMetafieldExists(hasSpec);

      // Pre-fill specs from existing data
      const initSpecs: Record<string, SpecFields> = {};
      const initSources: Record<string, SpecSource> = {};
      prodList.forEach((p) => {
        if (p.specifications && Object.keys(p.specifications).length > 0) {
          const s = emptySpec();
          Object.keys(p.specifications).forEach((k) => {
            if (k in s) {
              (s as any)[k] = p.specifications![k] || "";
            }
          });
          initSpecs[p.productId] = s;
          initSources[p.productId] = "manual";
        }
      });
      setSpecsMap(initSpecs);
      setSourcesMap(initSources);

      // Open first product by default
      if (prodList.length > 0) {
        setActivePid(prodList[0].productId);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  function getSpec(pid: string): SpecFields {
    return specsMap[pid] || emptySpec();
  }

  function getSource(pid: string): SpecSource {
    return sourcesMap[pid] || null;
  }

  function setFieldValue(pid: string, key: string, val: string) {
    setSpecsMap((prev) => ({
      ...prev,
      [pid]: { ...(prev[pid] || emptySpec()), [key]: val },
    }));
    // If AI-filled and user edits, mark as manual
    if (sourcesMap[pid] === "ai") {
      setSourcesMap((prev) => ({ ...prev, [pid]: "manual" }));
    }
  }

  // ── Visibility ───────────────────────────────────────────────────────────

  function getVisible() {
    return products.filter((p) => {
      const mq =
        !searchQuery ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.productId.toLowerCase().includes(searchQuery.toLowerCase());

      const comp = getCompletion(getSpec(p.productId));
      const src = getSource(p.productId);
      let ms = true;
      if (filterStatus === "complete") ms = comp.pct === 100;
      else if (filterStatus === "partial") ms = comp.pct > 0 && comp.pct < 100;
      else if (filterStatus === "empty") ms = comp.pct === 0;
      else if (filterStatus === "ai") ms = src === "ai";

      return mq && ms;
    });
  }

  // ── Selection ────────────────────────────────────────────────────────────

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

  // ── AI Single ────────────────────────────────────────────────────────────

  async function runAIForProduct(pid: string) {
    if (aiRunningPid) return;
    const product = products.find((p) => p.productId === pid);
    if (!product?.productImage) return;

    setAiRunningPid(pid);
    const steps = [
      "🔍 Reading product image…",
      "📐 Detecting dimensions…",
      "🎨 Identifying color & finish…",
      "🧪 Analyzing material…",
      "✅ Building specification…",
    ];

    for (const step of steps) {
      setAiStatusText(step);
      await sleep(300);
    }

    try {
      const res: AiSpecResult = await postApi(ApiConfig.aispecification, {
        imageUrl: product.productImage,
      });

      if (res) {
        const newSpec: SpecFields = {
          color: res.color || "",
          material: res.material || "",
          size_fit: res.size_fit || "",
          finish_pattern: res.finish_pattern || "",
          dimensions: res.dimensions || "",
          unit: res.unit || "",
          weight: res.weight || "",
          capacity_volume: res.capacity_volume || "",
          compatible_with: res.compatible_with || "",
        };
        setSpecsMap((prev) => ({ ...prev, [pid]: newSpec }));
        setSourcesMap((prev) => ({ ...prev, [pid]: "ai" }));

        // Scroll panel to top
        if (panelBodyRef.current) panelBodyRef.current.scrollTop = 0;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiRunningPid(null);
      setAiStatusText("");
    }
  }

  // ── AI Bulk ──────────────────────────────────────────────────────────────

  async function runBulkAI() {
    if (bulkRunning) return;
    setBulkRunning(true);

    const toProcess = products.filter((p) => p.productImage);

    for (const p of toProcess) {
      setAiRunningPid(p.productId);
      setAiStatusText(`Analyzing ${p.title.slice(0, 30)}…`);

      try {
        const res: AiSpecResult = await postApi(ApiConfig.aispecification, {
          imageUrl: p.productImage,
        });

        if (res) {
          const newSpec: SpecFields = {
            color: res.color || "",
            material: res.material || "",
            size_fit: res.size_fit || "",
            finish_pattern: res.finish_pattern || "",
            dimensions: res.dimensions || "",
            unit: res.unit || "",
            weight: res.weight || "",
            capacity_volume: res.capacity_volume || "",
            compatible_with: res.compatible_with || "",
          };
          setSpecsMap((prev) => ({ ...prev, [p.productId]: newSpec }));
          setSourcesMap((prev) => ({ ...prev, [p.productId]: "ai" }));
        }
      } catch (e) {
        console.error(e);
      }
    }

    setAiRunningPid(null);
    setAiStatusText("");
    setBulkRunning(false);
  }

  // ── Save single panel ────────────────────────────────────────────────────

  async function savePanelSpecs() {
    if (!activePid) return;
    setPanelSaving(true);
    setPanelSaveSuccess(false);

    const spec = getSpec(activePid);
    const custom = customFields[activePid] || [];

    // Build specifications object — exclude empty strings
    const specifications: Record<string, string> = {};
    Object.keys(spec).forEach((k) => {
      if (spec[k]?.trim()) specifications[k] = spec[k];
    });
    custom.forEach((c) => {
      if (c.key.trim() && c.val.trim()) specifications[c.key] = c.val;
    });

    try {
      await postApi(ApiConfig.updateSpeficiationProduct, {
        productId: activePid,
        specifications,
      });
      setPanelSaveSuccess(true);
      // Update local product optimized status
      setProducts((prev) =>
        prev.map((p) =>
          p.productId === activePid ? { ...p, optimized: true } : p
        )
      );
      setTimeout(() => setPanelSaveSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setPanelSaving(false);
    }
  }

  // ── Apply All ────────────────────────────────────────────────────────────

  async function handleApplyAll() {
    const toApply = products.filter((p) => {
      const comp = getCompletion(getSpec(p.productId));
      return comp.filled > 0;
    });

    if (toApply.length === 0) return;

    // Check metafield first
    if (!specMetafieldExists) {
      setShowCreateMetaModal(true);
      return;
    }

    setApplying(true);
    setApplyError(null);
    setApplyProgress({ current: 0, total: toApply.length });

    let successCount = 0;

    for (let i = 0; i < toApply.length; i++) {
      const p = toApply[i];
      setApplyProgress({ current: i + 1, total: toApply.length });

      const spec = getSpec(p.productId);
      const custom = customFields[p.productId] || [];
      const specifications: Record<string, string> = {};
      Object.keys(spec).forEach((k) => {
        if (spec[k]?.trim()) specifications[k] = spec[k];
      });
      custom.forEach((c) => {
        if (c.key.trim() && c.val.trim()) specifications[c.key] = c.val;
      });

      if (Object.keys(specifications).length === 0) continue;

      try {
        const res = await postApi(ApiConfig.updateSpeficiationProduct, {
          productId: p.productId,
          specifications,
        });
        if (res?.success) successCount++;
      } catch (e) {
        console.error(e);
      }
    }

    setApplying(false);
    setApplyProgress({ current: 0, total: 0 });
    setShowApplyModal(false);

    if (successCount > 0) {
      setSuccessCount(successCount);
      setShowSuccessModal(true);
      await fetchAll();
    } else {
      setApplyError("Failed to apply specifications. Please try again.");
    }
  }

  // ── Create Metafield ─────────────────────────────────────────────────────

  async function handleCreateMetafield() {
    setCreatingMeta(true);
    setMetaCreateError(null);
    try {
      const res = await postApi(ApiConfig.createMetaFields, {
        name: "specification",
        namespace: "custom",
        key: "specification",
        type: "json",
      });
      if (res?.createdDefinition) {
        setSpecMetafieldExists(true);
        setShowCreateMetaModal(false);
        // Re-fetch metafields
        const mf = await getApi(ApiConfig.isSpecificationExsist).catch(() => []);
        setMetafields(mf || []);
      } else {
        throw new Error("Failed to create metafield");
      }
    } catch (e: any) {
      setMetaCreateError(e?.message || "Failed to create metafield");
    } finally {
      setCreatingMeta(false);
    }
  }

  // ── Custom fields ────────────────────────────────────────────────────────

  function addCustomField(pid: string) {
    setCustomFields((prev) => ({
      ...prev,
      [pid]: [...(prev[pid] || []), { key: "", val: "" }],
    }));
  }

  function updateCustomField(
    pid: string,
    idx: number,
    field: "key" | "val",
    value: string
  ) {
    setCustomFields((prev) => {
      const arr = [...(prev[pid] || [])];
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, [pid]: arr };
    });
  }

  function removeCustomField(pid: string, idx: number) {
    setCustomFields((prev) => {
      const arr = [...(prev[pid] || [])];
      arr.splice(idx, 1);
      return { ...prev, [pid]: arr };
    });
  }

  // ── Stats ────────────────────────────────────────────────────────────────

  const completedCount = products.filter(
    (p) => getCompletion(getSpec(p.productId)).pct === 100
  ).length;
  const aiCount = products.filter((p) => getSource(p.productId) === "ai").length;
  const avgPct =
    products.length > 0
      ? Math.round(
          products.reduce(
            (sum, p) => sum + getCompletion(getSpec(p.productId)).pct,
            0
          ) / products.length
        )
      : 0;
  const totalFields = products.length * 8;
  const filledFields = products.reduce(
    (sum, p) => sum + getCompletion(getSpec(p.productId)).filled,
    0
  );
  const missingFields = totalFields - filledFields;
  const productsWithSpecs = products.filter(
    (p) => getCompletion(getSpec(p.productId)).filled > 0
  );

  const visible = getVisible();
  const allVisibleSel =
    visible.length > 0 && visible.every((p) => selected.has(p.productId));
  const someVisibleSel = visible.some((p) => selected.has(p.productId));

  const activeProduct = activePid
    ? products.find((p) => p.productId === activePid)
    : null;
  const activeSpec = activePid ? getSpec(activePid) : emptySpec();
  const activeCompletion = getCompletion(activeSpec);
  const activeSource = activePid ? getSource(activePid) : null;
  const activeCustom = activePid ? customFields[activePid] || [] : [];

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout title="Specification Optimization">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Monitor className="w-12 h-12 animate-pulse text-purple-500 mx-auto mb-4" />
            <p className="text-gray-600 text-sm">Loading specifications…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <AppLayout title="Specification Optimization">
      <div
        className="flex flex-col bg-[#eef1f8]"
        style={{ height: "calc(100vh - 64px)" }}
      >
        {/* ── TOP BAR ── */}
        <div
          className="flex-shrink-0 flex items-center gap-3 px-6 bg-white border-b border-gray-200 z-50"
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
              Specification Optimization
            </p>
            <p className="text-[11.5px] text-gray-500 mt-px">
              Fill specifications manually or let AI analyze product images automatically
            </p>
          </div>

          {/* Metafield warning banner */}
          {!specMetafieldExists && (
            <button
              onClick={() => setShowCreateMetaModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-300 rounded-[10px] text-[12px] font-bold text-amber-700 hover:bg-amber-100 transition-all whitespace-nowrap"
            >
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              Setup Required: Create Spec Metafield
            </button>
          )}

          <div className="flex items-center gap-1.5 bg-[#0f2878] text-white px-4 py-[7px] rounded-full text-[12.5px] font-bold whitespace-nowrap">
            <Package className="w-3.5 h-3.5" />
            {products.length} Products
          </div>
        </div>

        {/* ── BODY ROW: Left + Right Panel ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 min-w-0 overflow-y-auto p-4 flex flex-col gap-3">

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                {
                  label: "Specs Completed",
                  val: completedCount,
                  unit: `/ ${products.length}`,
                  note:
                    completedCount > 0
                      ? `${completedCount} fully specified`
                      : "Fill specs to track",
                  noteColor: "text-green-600",
                  fill: Math.round((completedCount / Math.max(products.length, 1)) * 100),
                  bar: "#12b76a",
                },
                {
                  label: "AI Analyzed",
                  val: aiCount,
                  unit: "products",
                  note:
                    aiCount > 0 ? `${aiCount} AI-analyzed` : "Use AI to auto-fill",
                  noteColor: "text-purple-600",
                  fill: Math.round((aiCount / Math.max(products.length, 1)) * 100),
                  bar: "#7c3aed",
                },
                {
                  label: "Avg. Completion",
                  val: avgPct,
                  unit: "%",
                  note:
                    avgPct > 0 ? `${avgPct}% avg completion` : "Across all products",
                  noteColor: "text-blue-600",
                  fill: avgPct,
                  bar: "#1a3faa",
                },
                {
                  label: "Fields Missing",
                  val: missingFields,
                  unit: "fields",
                  note: "⚠ Need attention",
                  noteColor: "text-amber-600",
                  fill: Math.round((missingFields / Math.max(totalFields, 1)) * 100),
                  bar: "#f59e0b",
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-white border border-gray-200 rounded-[14px] p-4"
                >
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                    {s.label}
                  </p>
                  <p className="text-[20px] font-extrabold leading-none">
                    {s.val}
                    <span className="text-[12px] font-medium text-gray-400 ml-1">
                      {s.unit}
                    </span>
                  </p>
                  <p className={`text-[11px] font-semibold mt-1 ${s.noteColor}`}>
                    {s.note}
                  </p>
                  <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${s.fill}%`, background: s.bar }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Section Header */}
            <div className="bg-white border border-gray-200 rounded-[14px] p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-[9px] bg-purple-50 border border-purple-200 flex items-center justify-center flex-shrink-0">
                <Monitor className="w-4.5 h-4.5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                  Specification Optimization
                </p>
                <p className="text-[14px] font-extrabold text-gray-900">Product Specifications</p>
                <p className="text-[11.5px] text-gray-500">
                  Click any product row → edit specs in the panel. Or use{" "}
                  <strong>AI Analyze All</strong> to auto-fill from images.
                </p>
              </div>
              <button
                onClick={runBulkAI}
                disabled={bulkRunning}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-[10px] text-[12.5px] font-bold shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap flex-shrink-0"
              >
                {bulkRunning ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {bulkRunning ? aiStatusText || "Analyzing…" : "✨ AI Analyze All"}
              </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden flex flex-col flex-1 min-h-0">
              {/* Toolbar */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-[10px] flex-1 max-w-[260px] focus-within:border-blue-500 transition-colors">
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
                  className="px-3 py-1.5 border border-gray-200 rounded-[10px] text-[12px] font-semibold text-gray-600 bg-white outline-none"
                >
                  <option value="">All Products</option>
                  <option value="complete">Fully Specified</option>
                  <option value="partial">Partial</option>
                  <option value="empty">Not Started</option>
                  <option value="ai">AI Analyzed</option>
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
                className="grid px-4 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex-shrink-0"
                style={{
                  gridTemplateColumns: "36px 40px 1fr 110px 110px 100px 90px",
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
                    {allVisibleSel && <Check className="w-2.5 h-2.5 text-white" />}
                    {someVisibleSel && !allVisibleSel && (
                      <div className="w-2 h-0.5 bg-white rounded" />
                    )}
                  </div>
                </div>
                <div />
                <div>Product</div>
                <div>Color</div>
                <div>Material</div>
                <div>Completion</div>
                <div>Actions</div>
              </div>

              {/* Table Body */}
              <div className="overflow-y-auto flex-1">
                {visible.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Package className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm font-semibold">No products found</p>
                  </div>
                )}

                {visible.map((p) => {
                  const isSel = selected.has(p.productId);
                  const isActive = activePid === p.productId;
                  const spec = getSpec(p.productId);
                  const comp = getCompletion(spec);
                  const src = getSource(p.productId);
                  const isAiRunning = aiRunningPid === p.productId;

                  const pctColor =
                    comp.pct === 100
                      ? "#12b76a"
                      : comp.pct > 0
                      ? "#1a3faa"
                      : "#cbd5e1";

                  return (
                    <div
                      key={p.productId}
                      onClick={() => setActivePid(p.productId)}
                      className={`grid px-4 py-2.5 items-center border-b border-gray-100 cursor-pointer transition-all last:border-b-0 ${
                        isActive
                          ? "bg-purple-50/60 border-l-[3px] border-l-purple-500"
                          : isSel
                          ? "bg-blue-50"
                          : "hover:bg-gray-50/80"
                      }`}
                      style={{
                        gridTemplateColumns: "36px 40px 1fr 110px 110px 100px 90px",
                        gap: 8,
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        className="flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(p.productId);
                        }}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 cursor-pointer flex items-center justify-center transition-all ${
                            isSel ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSel && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </div>

                      {/* Thumbnail */}
                      <div className="relative">
                        <div className="w-9 h-9 rounded-[8px] bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {p.productImage ? (
                            <img
                              src={p.productImage}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        {comp.pct === 100 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>

                      {/* Product info */}
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-gray-900 truncate">
                          {p.title}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          #{p.productId.split("/").pop()}
                        </p>
                      </div>

                      {/* Color */}
                      <div>
                        <span
                          className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-[5px] border truncate block max-w-[105px] ${
                            spec.color
                              ? src === "ai"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-gray-50 text-gray-300 border-dashed border-gray-200 italic"
                          }`}
                        >
                          {spec.color || "—"}
                        </span>
                      </div>

                      {/* Material */}
                      <div>
                        <span
                          className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-[5px] border truncate block max-w-[105px] ${
                            spec.material
                              ? src === "ai"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-gray-50 text-gray-300 border-dashed border-gray-200 italic"
                          }`}
                        >
                          {spec.material || "—"}
                        </span>
                      </div>

                      {/* Completion */}
                      <div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${comp.pct}%`, background: pctColor }}
                          />
                        </div>
                        <p
                          className="text-[10px] font-bold"
                          style={{ color: pctColor }}
                        >
                          {comp.pct}% · {comp.filled}/{comp.total}
                        </p>
                      </div>

                      {/* Actions */}
                      <div
                        className="flex items-center gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => runAIForProduct(p.productId)}
                          disabled={!!aiRunningPid || !p.productImage}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-[10.5px] font-bold transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                          title={!p.productImage ? "No product image" : "Analyze with AI"}
                        >
                          {isAiRunning ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-2.5 h-2.5" />
                          )}
                          AI
                        </button>
                        <button
                          onClick={() => setActivePid(p.productId)}
                          className={`flex items-center justify-center w-7 h-7 rounded-lg border transition-all ${
                            isActive
                              ? "border-purple-400 bg-purple-50 text-purple-600"
                              : "border-gray-200 bg-white text-gray-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
                          }`}
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-[8px] px-3 py-1.5">
                  <Package className="w-3 h-3 text-gray-400" />
                  <span className="text-[12px] font-bold text-gray-700">
                    {products.length} products · {productsWithSpecs.length} with specs
                  </span>
                </div>
                <button
                  onClick={() => {
                    setApplyError(null);
                    setShowApplyModal(true);
                  }}
                  disabled={productsWithSpecs.length === 0}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-[10px] text-[12.5px] font-bold shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply Specs to Shopify
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div
            className="flex-shrink-0 bg-white border-l-2 border-gray-200 flex flex-col overflow-hidden"
            style={{ width: 400, boxShadow: "-4px 0 16px rgba(15,23,42,.07)" }}
          >
            {/* Panel Head */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200">
              {activeProduct ? (
                <>
                  {/* Product info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-[10px] bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {activeProduct.productImage ? (
                        <img
                          src={activeProduct.productImage}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-extrabold text-gray-900 leading-snug truncate">
                        {activeProduct.title}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                        #{activePid?.split("/").pop()} · Click row to switch
                      </p>
                    </div>
                  </div>

                  {/* AI Button */}
                  <button
                    onClick={() => activePid && runAIForProduct(activePid)}
                    disabled={!!aiRunningPid || !activeProduct.productImage}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-[9px] text-[12.5px] font-bold shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    title={!activeProduct.productImage ? "No product image available" : ""}
                  >
                    {aiRunningPid === activePid ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {aiRunningPid === activePid
                      ? aiStatusText || "Analyzing…"
                      : "🔍 Analyze Image with AI"}
                  </button>

                  {/* AI status */}
                  {aiRunningPid === activePid && (
                    <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-[8px]">
                      <Loader2 className="w-3 h-3 text-purple-600 animate-spin flex-shrink-0" />
                      <span className="text-[11px] font-semibold text-purple-700">
                        {aiStatusText}
                      </span>
                    </div>
                  )}

                  {/* Progress */}
                  <div className="flex items-center gap-3 mt-3">
                    <ProgressRing pct={activeCompletion.pct} size={48} />
                    <div>
                      <p className="text-[18px] font-extrabold text-gray-900 leading-none">
                        {activeCompletion.pct}%
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {activeCompletion.filled} of {activeCompletion.total} fields filled
                      </p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                          activeCompletion.pct === 100
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : activeSource === "ai"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : activeCompletion.pct > 0
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-gray-100 text-gray-400 border border-gray-200"
                        }`}
                      >
                        {activeCompletion.pct === 100
                          ? "✓ Complete"
                          : activeSource === "ai"
                          ? "🤖 AI Filled"
                          : activeCompletion.pct > 0
                          ? "✎ In Progress"
                          : "Not started"}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <div className="text-4xl mb-3">👆</div>
                  <p className="text-[13px] font-semibold">
                    Click a product row to edit specifications
                  </p>
                </div>
              )}
            </div>

            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-4" ref={panelBodyRef}>
              {activePid && activeProduct ? (
                <>
                  {/* Core Specs */}
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      Core Specifications
                      <span className="flex-1 h-px bg-gray-100" />
                    </p>

                    <SpecInput
                      label="Color"
                      value={activeSpec.color}
                      onChange={(v) => setFieldValue(activePid, "color", v)}
                      placeholder="e.g. Midnight Black"
                      isAi={activeSource === "ai"}
                      required
                    />
                    <SpecInput
                      label="Material"
                      value={activeSpec.material}
                      onChange={(v) => setFieldValue(activePid, "material", v)}
                      placeholder="e.g. Stainless Steel, 100% Cotton"
                      isAi={activeSource === "ai"}
                      required
                    />
                    <SpecInput
                      label="Size / Fit"
                      value={activeSpec.size_fit}
                      onChange={(v) => setFieldValue(activePid, "size_fit", v)}
                      placeholder="e.g. S / M / L / XL, One Size"
                      isAi={activeSource === "ai"}
                    />
                    <SpecInput
                      label="Finish / Pattern"
                      value={activeSpec.finish_pattern}
                      onChange={(v) => setFieldValue(activePid, "finish_pattern", v)}
                      placeholder="e.g. Matte, Glossy, Polished"
                      isAi={activeSource === "ai"}
                    />
                  </div>

                  {/* Dimensions */}
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      Dimensions & Weight
                      <span className="flex-1 h-px bg-gray-100" />
                    </p>

                    <SpecInput
                      label="Dimensions"
                      value={activeSpec.dimensions}
                      onChange={(v) => setFieldValue(activePid, "dimensions", v)}
                      placeholder="e.g. 32.5cm x 20cm x 13.5cm"
                      isAi={activeSource === "ai"}
                    />

                    <div className="mb-3">
                      <label className="text-[11px] font-bold text-gray-600 mb-1 block">
                        Unit
                      </label>
                      <select
                        value={activeSpec.unit}
                        onChange={(e) => setFieldValue(activePid, "unit", e.target.value)}
                        className={`w-full px-3 py-[7px] border rounded-[8px] text-[12.5px] font-semibold outline-none transition-all ${
                          activeSpec.unit
                            ? activeSource === "ai"
                              ? "border-purple-300 bg-purple-50 text-purple-800"
                              : "border-blue-200 bg-blue-50/60 text-gray-900"
                            : "border-gray-200 bg-white text-gray-900"
                        }`}
                      >
                        <option value="">Select unit…</option>
                        <option value="cm">cm</option>
                        <option value="mm">mm</option>
                        <option value="m">m</option>
                        <option value="inch">inch</option>
                        <option value="cm/in">cm/in</option>
                      </select>
                    </div>

                    <SpecInput
                      label="Weight"
                      value={activeSpec.weight}
                      onChange={(v) => setFieldValue(activePid, "weight", v)}
                      placeholder="e.g. 1.5 kg, 320g"
                      isAi={activeSource === "ai"}
                    />
                  </div>

                  {/* Capacity & Compatibility */}
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      Additional Details
                      <span className="flex-1 h-px bg-gray-100" />
                    </p>

                    <SpecInput
                      label="Capacity / Volume"
                      value={activeSpec.capacity_volume}
                      onChange={(v) => setFieldValue(activePid, "capacity_volume", v)}
                      placeholder="e.g. 600ml, 2g, 30ml"
                      isAi={activeSource === "ai"}
                    />
                    <SpecInput
                      label="Compatible With"
                      value={activeSpec.compatible_with}
                      onChange={(v) => setFieldValue(activePid, "compatible_with", v)}
                      placeholder="e.g. Bluetooth 5.0, All Skin Types"
                      isAi={activeSource === "ai"}
                    />
                  </div>

                  {/* Custom Fields */}
                  {activeCustom.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        Custom Fields
                        <span className="flex-1 h-px bg-gray-100" />
                      </p>
                      {activeCustom.map((cf, idx) => (
                        <div key={idx} className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-[10px]">
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              value={cf.key}
                              onChange={(e) =>
                                updateCustomField(activePid, idx, "key", e.target.value)
                              }
                              placeholder="Field name (e.g. Warranty)"
                              className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-[7px] text-[12px] font-semibold outline-none focus:border-blue-400 bg-white"
                            />
                            <button
                              onClick={() => removeCustomField(activePid, idx)}
                              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={cf.val}
                            onChange={(e) =>
                              updateCustomField(activePid, idx, "val", e.target.value)
                            }
                            placeholder="Value"
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-[7px] text-[12px] font-semibold outline-none focus:border-blue-400 bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Custom Field */}
                  <button
                    onClick={() => addCustomField(activePid)}
                    className="flex items-center gap-2 w-full px-3 py-2.5 bg-gray-50 border border-dashed border-gray-300 rounded-[8px] text-[12px] font-semibold text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Custom Spec Field
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-300 py-16">
                  <div className="text-5xl mb-4">📋</div>
                  <p className="text-[13px] font-semibold text-center">
                    Select a product to edit its specifications
                  </p>
                </div>
              )}
            </div>

            {/* Panel Footer */}
            {activePid && (
              <div className="flex-shrink-0 flex gap-2 p-3 border-t border-gray-200 bg-white">
                <button
                  onClick={() => {
                    if (!activePid) return;
                    setSpecsMap((prev) => {
                      const n = { ...prev };
                      delete n[activePid];
                      return n;
                    });
                    setSourcesMap((prev) => {
                      const n = { ...prev };
                      delete n[activePid];
                      return n;
                    });
                    setCustomFields((prev) => {
                      const n = { ...prev };
                      delete n[activePid];
                      return n;
                    });
                  }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-[9px] text-[12.5px] font-semibold text-gray-600 hover:border-red-400 hover:text-red-500 transition-all"
                >
                  Clear All
                </button>
                <button
                  onClick={savePanelSpecs}
                  disabled={panelSaving}
                  className={`flex-[1.5] py-2.5 rounded-[9px] text-[12.5px] font-bold text-white transition-all flex items-center justify-center gap-2 ${
                    panelSaveSuccess
                      ? "bg-green-500"
                      : "bg-gradient-to-r from-blue-600 to-purple-600 hover:-translate-y-0.5 hover:shadow-md"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {panelSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : panelSaveSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />✓ Save Specifications
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── APPLY MODAL ── */}
        <Dialog open={showApplyModal} onOpenChange={(o) => !applying && setShowApplyModal(o)}>
          <DialogContent className="max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-[17px] font-extrabold">
                Apply Specifications to Shopify
              </DialogTitle>
              <p className="text-[12px] text-gray-500">Review before pushing to your store</p>
            </DialogHeader>

            <div className="space-y-4 mt-1">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: productsWithSpecs.length, label: "Will Update", color: "#12b76a" },
                  { val: aiCount, label: "AI Analyzed", color: "#7c3aed" },
                  { val: productsWithSpecs.length - aiCount, label: "Manual", color: "#1a3faa" },
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
                <strong>🤖 AI-filled and manually entered specs</strong> will both be saved to
                Shopify metafields. Only products with at least one filled field will be updated.
              </div>

              {/* Metafield warning */}
              {!specMetafieldExists && (
                <div className="bg-amber-50 border border-amber-300 rounded-[10px] p-3 text-[12px] text-amber-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Specification metafield not found.</strong> It will be created
                    automatically before applying specs.
                  </div>
                </div>
              )}

              {applyError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[12px] text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {applyError}
                </div>
              )}

              {applying && (
                <div className="bg-blue-50 border border-blue-200 rounded-[10px] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-semibold text-blue-700">
                      Applying specifications…
                    </span>
                    <span className="text-[12px] font-bold text-blue-700">
                      {applyProgress.current}/{applyProgress.total}
                    </span>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300"
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
                onClick={handleApplyAll}
                disabled={applying || productsWithSpecs.length === 0}
                className="flex-[1.8] bg-gradient-to-r from-blue-600 to-purple-600 gap-2"
              >
                {applying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Applying…
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />✓ Apply to Shopify
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── SUCCESS MODAL ── */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="max-w-[440px]">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mx-auto mb-4 text-3xl">
                🎉
              </div>
              <h3 className="text-[20px] font-extrabold text-gray-900 mb-2">
                Specifications Applied!
              </h3>
              <p className="text-[13px] text-gray-500 leading-relaxed mb-5">
                Specifications for <strong>{successCount} product{successCount !== 1 ? "s have" : " has"}</strong> been
                saved to your Shopify store as metafields.
              </p>
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

        {/* ── CREATE METAFIELD MODAL ── */}
        <Dialog
          open={showCreateMetaModal}
          onOpenChange={(o) => !creatingMeta && setShowCreateMetaModal(o)}
        >
          <DialogContent className="max-w-[480px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[17px] font-extrabold">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Setup Required: Specification Metafield
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-1">
              <p className="text-[13px] text-gray-600 leading-relaxed">
                A <strong>specification</strong> metafield (
                <code className="text-[12px] font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                  custom.specification
                </code>
                ) is required to save product specs to Shopify. It doesn't exist yet in your store.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-[10px] p-4">
                <p className="text-[12px] font-bold text-amber-700 mb-2">
                  Will create:
                </p>
                <div className="space-y-1.5">
                  {[
                    ["Name", "specification"],
                    ["Namespace", "custom"],
                    ["Key", "specification"],
                    ["Type", "JSON"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-amber-600 w-20">{k}:</span>
                      <code className="text-[11px] font-mono bg-white border border-amber-200 px-2 py-0.5 rounded text-gray-700">
                        {v}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {metaCreateError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[12px] text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {metaCreateError}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 mt-2">
              <Button
                variant="outline"
                onClick={() => setShowCreateMetaModal(false)}
                disabled={creatingMeta}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateMetafield}
                disabled={creatingMeta}
                className="flex-[1.5] bg-gradient-to-r from-amber-500 to-orange-500 gap-2"
              >
                {creatingMeta ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Create Metafield
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}