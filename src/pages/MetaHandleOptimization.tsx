import { useState, useEffect, useRef } from "react";
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
  Brain, Zap, Sparkles, CheckCircle, RefreshCw, Save,
  Play, Award, ArrowRight, ChevronLeft, Package,
  Link2, Hash, Eye, Search, FileText, AlertCircle,
  RotateCcw, X, Target,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  _id: string;
  productId: string;
  title: string;
  metaHandle: string;
  productImage: string;
  handle: string;
  shopId: string;
}

interface OptimizationResult {
  productId: string;
  oldMetaHandle: string;
  newMetaHandle: string;
  characterCount: number;
  image?: string;
  title: string;
}

type HandleSource = "ai" | "classic" | "manual" | null;

interface HandleState {
  [productId: string]: { value: string; source: HandleSource };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function HandleStatusBadge({ source, hasChange }: { source: HandleSource; hasChange: boolean }) {
  if (!hasChange) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200 whitespace-nowrap">— Same</span>;
  if (source === "ai") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 whitespace-nowrap">✦ AI</span>;
  if (source === "classic") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200 whitespace-nowrap">⇄ Sync</span>;
  if (source === "manual") return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">✎ Manual</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200 whitespace-nowrap">◌ Pending</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MetaHandleOptimization() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [handleStates, setHandleStates] = useState<HandleState>({});
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  const [aiRunning, setAiRunning] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [syncPreviewVisible, setSyncPreviewVisible] = useState(false);
  const [syncPreviewRows, setSyncPreviewRows] = useState<{ id: string; old: string; new: string; changed: boolean }[]>([]);
  const [applyCount, setApplyCount] = useState(0);

  useEffect(() => { fetchStoredProducts(); }, []);

  const fetchStoredProducts = async () => {
    try {
      setLoading(true);
      const data = (await getApi(ApiConfig.getStoredMetaHandleProduct)) || [];
      setProducts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Derived stats ──
  const changedCount = products.filter(p => {
    const hs = handleStates[p.productId];
    return hs?.value && hs.value !== (p.metaHandle || "");
  }).length;
  const aiCount = Object.values(handleStates).filter(h => h.source === "ai").length;
  const emptyCount = products.filter(p => !p.metaHandle || p.metaHandle.trim() === "").length;
  const filteredProducts = products.filter(p =>
    !searchQ || p.title.toLowerCase().includes(searchQ.toLowerCase()) ||
    (p.metaHandle || "").includes(searchQ) ||
    (handleStates[p.productId]?.value || "").includes(searchQ)
  );

  // ── Section 1: Bulk Sync (metaHandle → slug) ──
  const handlePreviewSync = () => {
    const rows = products.map(p => ({
      id: p.productId,
      old: p.metaHandle || "(empty)",
      new: slugify(p.handle || p.title),
      changed: slugify(p.handle || p.title) !== (p.metaHandle || ""),
    }));
    setSyncPreviewRows(rows);
    setSyncPreviewVisible(true);
  };

  const handleApplySync = () => {
    const updated: HandleState = { ...handleStates };
    products.forEach(p => {
      updated[p.productId] = { value: slugify(p.handle || p.title), source: "classic" };
    });
    setHandleStates(updated);
    setSyncPreviewVisible(false);
  };

  // ── Section 2: AI Optimization ──
  const handleAIOptimize = async () => {
    if (aiRunning || products.length === 0) return;
    setAiRunning(true);
    setShowProgressModal(true);
    setProgress({ current: 0, total: products.length, status: "AI is analyzing product handles…" });

    const updated: HandleState = { ...handleStates };
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      setProgress({ current: i + 1, total: products.length, status: `AI optimizing: ${p.title.substring(0, 35)}…` });
      try {
        const res = await postApi(ApiConfig.aiMetaHandleOptimization, { productId: p.productId, productHandle: p.metaHandle, apply: false });
        if (res.newMetaHandle) {
          updated[p.productId] = { value: res.newMetaHandle, source: "ai" };
        }
        await new Promise(r => setTimeout(r, 300));
      } catch {
        updated[p.productId] = { value: slugify(p.title), source: "classic" };
      }
      setHandleStates({ ...updated });
    }
    setShowProgressModal(false);
    setAiRunning(false);
  };

  // ── Classic AI Optimization (preview → apply) ──
  const handleClassicPreview = async (applyNow = false) => {
    if (!products.length) return;
    setShowProgressModal(true);
    setProgress({ current: 0, total: products.length, status: "Generating handles from product titles…" });
    const results: OptimizationResult[] = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const newH = slugify(p.handle || p.title);
      results.push({ productId: p.productId, oldMetaHandle: p.metaHandle || "(Empty)", newMetaHandle: newH, characterCount: newH.length, image: p.productImage, title: p.title });
      setProgress({ current: i + 1, total: products.length, status: `Processing: ${p.title.substring(0, 30)}…` });
    }
    setOptimizationResults(results);
    setShowProgressModal(false);
    if (applyNow) await applyOptimizations(results);
    else setShowPreviewModal(true);
  };

  const handleAIFullOptimize = async (applyNow = false) => {
    if (!products.length) return;
    setShowProgressModal(true);
    setProgress({ current: 0, total: products.length, status: "AI is optimizing your product handles…" });
    const results: OptimizationResult[] = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      setProgress({ current: i + 1, total: products.length, status: `AI optimizing: ${p.title.substring(0, 30)}…` });
      try {
        const res = await postApi(ApiConfig.aiMetaHandleOptimization, { productId: p.productId, productHandle: p.metaHandle, apply: applyNow });
        if (res.newMetaHandle) {
          results.push({ productId: p.productId, oldMetaHandle: p.metaHandle || "(Empty)", newMetaHandle: res.newMetaHandle, characterCount: res.characterCount || res.newMetaHandle.length, image: p.productImage, title: p.title });
        }
        await new Promise(r => setTimeout(r, 300));
      } catch {
        const fb = slugify(p.title);
        results.push({ productId: p.productId, oldMetaHandle: p.metaHandle || "(Empty)", newMetaHandle: fb, characterCount: fb.length, image: p.productImage, title: p.title });
      }
    }
    setOptimizationResults(results);
    setShowProgressModal(false);
    if (applyNow) await applyOptimizations(results);
    else setShowPreviewModal(true);
  };

  const applyOptimizations = async (results: OptimizationResult[]) => {
    setShowProgressModal(true);
    setProgress({ current: 0, total: results.length, status: "Saving handles to Shopify…" });
    let ok = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.oldMetaHandle !== r.newMetaHandle) {
        try {
          await postApi(ApiConfig.updateMetaHandleOptimization, { productId: r.productId, oldMetaHandle: r.oldMetaHandle === "(Empty)" ? "" : r.oldMetaHandle, newMetaHandle: r.newMetaHandle });
          ok++;
        } catch { /**/ }
      }
      setProgress({ current: i + 1, total: results.length, status: `Updating: ${r.title.substring(0, 30)}…` });
    }
    setShowProgressModal(false);
    setShowPreviewModal(false);
    setApplyCount(ok);
    setProgress({ current: ok, total: results.length, status: "completed" });
    setShowSuccessModal(true);
    await fetchStoredProducts();
  };

  // ── Apply table changes ──
  const applyTableChanges = async () => {
    const toApply = products.filter(p => {
      const hs = handleStates[p.productId];
      return hs?.value && hs.value !== (p.metaHandle || "");
    });
    if (!toApply.length) return;
    setShowApplyModal(false);
    setShowProgressModal(true);
    setProgress({ current: 0, total: toApply.length, status: "Applying to Shopify…" });
    let ok = 0;
    for (let i = 0; i < toApply.length; i++) {
      const p = toApply[i];
      const hs = handleStates[p.productId];
      try {
        await postApi(ApiConfig.updateMetaHandleOptimization, { productId: p.productId, oldMetaHandle: p.metaHandle || "", newMetaHandle: hs!.value });
        ok++;
      } catch { /**/ }
      setProgress({ current: i + 1, total: toApply.length, status: `Updating ${p.title.substring(0, 30)}…` });
    }
    setShowProgressModal(false);
    setApplyCount(ok);
    setShowSuccessModal(true);
    await fetchStoredProducts();
    setHandleStates({});
  };

  if (loading) {
    return (
      <AppLayout title="URL Handle Optimization">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Link2 className="w-12 h-12 animate-pulse text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading products for handle optimization…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="URL Handle Optimization">
      <div className="p-5 space-y-5">

        {/* ── Step Header ── */}
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-3.5 py-1.5 border-[1.5px] border-gray-200 rounded-lg bg-white text-sm font-semibold text-gray-500 hover:border-green-400 hover:text-green-700 transition-all">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest">Optimization Suite</p>
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">URL Handle Optimization</h1>
            <p className="text-xs text-gray-500">Manage, clean and auto-generate Shopify URL handles for all products</p>
          </div>
          <div className="flex items-center gap-1.5 bg-green-800 text-white px-4 py-1.5 rounded-full text-[12.5px] font-bold shadow-md shadow-green-900/25">
            <Package className="w-3.5 h-3.5" /> {products.length} Products
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Handles Changed", value: `${changedCount}`, unit: `/ ${products.length}`, hint: changedCount > 0 ? `${changedCount} ready to apply` : "No changes yet", pct: products.length ? (changedCount / products.length) * 100 : 0, color: "bg-green-400" },
            { label: "AI Generated",    value: `${aiCount}`,      unit: "handles",               hint: aiCount > 0 ? `${aiCount} AI-generated` : "Click ✦ to auto-generate", pct: products.length ? (aiCount / products.length) * 100 : 0, color: "bg-purple-400" },
            { label: "Empty Handles",   value: `${emptyCount}`,   unit: "products",               hint: emptyCount > 0 ? "Need immediate attention" : "All handles set", pct: products.length ? (emptyCount / products.length) * 100 : 0, color: "bg-amber-400" },
            { label: "Ready to Apply",  value: `${changedCount}`, unit: "changes",               hint: changedCount > 0 ? "Set handles to apply" : "No pending changes", pct: products.length ? (changedCount / products.length) * 100 : 0, color: "bg-blue-400" },
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

        {/* ── Guide Cards ── */}
        <div className="bg-white border-[1.5px] border-gray-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">What can you do on this page?</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex gap-3 p-3.5 bg-blue-50 border-[1.5px] border-blue-200 rounded-xl">
              <div className="w-9 h-9 bg-white border-[1.5px] border-blue-200 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">🔄</div>
              <div>
                <p className="text-[12.5px] font-extrabold text-blue-900 mb-1">Section 1 — Bulk Handle Sync</p>
                <p className="text-[11.5px] text-blue-700 leading-relaxed">Automatically replace all handles using each product's current handle — converted to a clean URL slug. One click, all products done.</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <code className="text-[10.5px] bg-white border border-blue-200 rounded px-1.5 py-0.5 font-mono text-blue-800">Blue Shoes – Men's</code>
                  <span className="text-gray-400 text-xs">→</span>
                  <code className="text-[10.5px] bg-white border border-blue-200 rounded px-1.5 py-0.5 font-mono text-blue-800">blue-shoes-mens</code>
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-3.5 bg-purple-50 border-[1.5px] border-purple-200 rounded-xl">
              <div className="w-9 h-9 bg-white border-[1.5px] border-purple-200 rounded-lg flex items-center justify-center flex-shrink-0 text-lg">✦</div>
              <div>
                <p className="text-[12.5px] font-extrabold text-purple-900 mb-1">Section 2 — AI Handle Generator</p>
                <p className="text-[11.5px] text-purple-700 leading-relaxed">Manually edit any handle inline in the product table, or use AI to generate clean, SEO-friendly handles for all products automatically.</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[10.5px] bg-white border border-purple-200 rounded-full px-2.5 py-0.5 font-bold text-purple-800">✎ Edit manually</span>
                  <span className="text-gray-400 text-xs">or</span>
                  <span className="text-[10.5px] bg-white border border-purple-200 rounded-full px-2.5 py-0.5 font-bold text-purple-800">✦ AI auto-generate</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: Bulk Handle Sync ── */}
        <div className="bg-white border-[1.5px] border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Numbered label bar */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-blue-50 to-blue-50/40 border-b-[1.5px] border-blue-200">
            <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-extrabold text-white">1</span>
            </div>
            <span className="text-[11px] font-extrabold text-blue-800 uppercase tracking-widest">Bulk Handle Sync — Replace Handles with Product Titles</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            {/* Left info */}
            <div className="p-5">
              <p className="text-[13.5px] font-extrabold text-gray-900 mb-2">What does this do?</p>
              <p className="text-[12.5px] text-gray-600 leading-relaxed mb-4">
                Each product in Shopify has a <strong>URL handle</strong> — the part after <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[11px]">/products/</code> in the URL. This tool <strong>reads each product's existing handle</strong> and replaces it with a clean, SEO-friendly slug version — all in one click.
              </p>
              {/* Step flow */}
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { icon: "📝", label: "Current Handle", val: "Blue Shoes – Men's", color: "bg-gray-50 border-gray-200 text-gray-700" },
                  { icon: "⚙️", label: "Slugified", val: "lowercase + dashes", color: "bg-gray-50 border-gray-200 text-gray-700" },
                  { icon: "🔗", label: "New Handle", val: "blue-shoes-mens", color: "bg-green-50 border-green-200 text-green-800" },
                ].map((step, i, arr) => (
                  <div key={step.label} className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-2 ${step.color} border-[1.5px] rounded-lg`}>
                      <span className="text-sm">{step.icon}</span>
                      <div>
                        <p className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider">{step.label}</p>
                        <p className="text-[11.5px] font-bold font-mono">{step.val}</p>
                      </div>
                    </div>
                    {i < arr.length - 1 && <span className="text-gray-300 text-lg">→</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Right action */}
            <div className="p-5 flex flex-col items-center justify-center gap-3 min-w-[220px] bg-gray-50/60">
              <div className="text-center mb-1">
                <div className="text-3xl mb-1.5">🔄</div>
                <p className="text-[12.5px] font-bold text-gray-700">{products.length} products ready</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Handles replaced from product titles</p>
              </div>
              <button onClick={handlePreviewSync}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-50 border-[1.5px] border-blue-200 rounded-lg text-[13px] font-bold text-blue-800 hover:bg-blue-100 hover:border-blue-400 transition-all">
                <Eye className="w-3.5 h-3.5" /> Preview Changes
              </button>
              <button onClick={handleApplySync}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[13px] font-bold shadow-sm transition-all">
                <CheckCircle className="w-3.5 h-3.5" /> Apply to All Products
              </button>
              <p className="text-[10px] text-gray-400 text-center leading-relaxed">⚠ Old handles should be<br/>redirected in Shopify</p>
            </div>
          </div>

          {/* Preview Diff */}
          {syncPreviewVisible && (
            <div className="border-t-[1.5px] border-gray-200 bg-gray-50/60 p-4">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <p className="text-[10.5px] font-bold text-gray-400 uppercase tracking-wider">Preview — Current Handle → New URL Handle</p>
                <span className="text-[10.5px] font-bold px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700">
                  📄 {syncPreviewRows.filter(r => r.changed).length} of {syncPreviewRows.length} handles will change
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {syncPreviewRows.map(row => (
                  <div key={row.id} className={`grid grid-cols-[1fr_20px_1fr] gap-2 items-center px-3 py-2 rounded-lg border-[1.5px] text-[11.5px] font-mono ${row.changed ? "border-blue-200 bg-blue-50/60" : "border-gray-200 bg-white"}`}>
                    <span className="text-gray-500 truncate">{row.old}</span>
                    <span className="text-blue-400 text-center font-sans">{row.changed ? "→" : "="}</span>
                    <span className={row.changed ? "text-blue-800 font-bold truncate" : "text-gray-300 italic font-sans text-[11px]"}>
                      {row.changed ? row.new : "No change"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION 2: AI Handle Generator + Table ── */}
        <div className="bg-white border-[1.5px] border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Numbered label bar */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-purple-50/40 border-b-[1.5px] border-purple-200">
            <div className="w-5 h-5 bg-purple-600 rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-extrabold text-white">2</span>
            </div>
            <span className="text-[11px] font-extrabold text-purple-800 uppercase tracking-widest">AI Handle Generator — Edit or Auto-Generate URL Handles</span>
          </div>

          {/* Section desc */}
          <div className="flex items-center gap-3 px-4 py-3 border-b-[1.5px] border-gray-100 bg-purple-50/30">
            <div className="w-8 h-8 bg-purple-100 border-[1.5px] border-purple-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-extrabold text-gray-900">Edit or AI-Generate URL Handles</p>
              <p className="text-[11.5px] text-gray-500">Manually edit any handle inline below, or click <strong className="text-purple-700">✦ AI Optimize All</strong> to auto-generate clean, SEO-friendly handles for every product at once.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <button onClick={() => handleClassicPreview(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-[1.5px] border-gray-200 rounded-lg text-[12px] font-bold text-gray-600 hover:border-green-400 hover:text-green-700 transition-all whitespace-nowrap">
                <Eye className="w-3 h-3" /> Classic Preview
              </button>
              <button onClick={handleAIOptimize} disabled={aiRunning}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg text-[12.5px] font-bold shadow-sm transition-all disabled:opacity-50 whitespace-nowrap">
                {aiRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {aiRunning ? "Optimizing…" : "✦ AI Optimize All"}
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gray-50/60 border-b-[1.5px] border-gray-200 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border-[1.5px] border-gray-200 rounded-lg flex-1 min-w-[180px] max-w-xs focus-within:border-green-500 transition-colors">
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search product title or handle…" className="flex-1 text-[12.5px] bg-transparent outline-none text-gray-900 placeholder:text-gray-300" />
            </div>
            <span className="text-[11.5px] font-bold text-gray-500 ml-auto">{filteredProducts.length} products</span>
          </div>

          {/* Table Header */}
          <div className="grid gap-2.5 px-4 py-2 border-b-[1.5px] border-gray-200 bg-gray-50/80" style={{ gridTemplateColumns: "40px 1fr 180px 200px 80px 70px" }}>
            {["#", "Product Title", "Current Handle", "New Handle", "Status", "Action"].map(h => (
              <div key={h} className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center">{h}</div>
            ))}
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-100">
            {filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Package className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-[13px] font-semibold text-gray-400">No products found</p>
              </div>
            ) : filteredProducts.map((product, idx) => {
              const hs = handleStates[product.productId];
              const newVal = hs?.value || "";
              const hasChange = !!newVal && newVal !== (product.metaHandle || "");
              const isAI = hs?.source === "ai";
              return (
                <div key={product.productId}
                  className={`grid gap-2.5 px-4 py-2.5 items-center transition-colors ${hasChange ? (isAI ? "bg-purple-50/40 hover:bg-purple-50/60" : "bg-blue-50/30 hover:bg-blue-50/50") : "hover:bg-gray-50/60"}`}
                  style={{ gridTemplateColumns: "40px 1fr 180px 200px 80px 70px" }}>
                  <span className="text-[11px] font-bold text-gray-300">{idx + 1}</span>
                  <div className="min-w-0 flex items-center gap-2">
                    <img src={product.productImage} alt={product.title} className="w-8 h-8 rounded-lg object-cover border border-gray-200 flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-gray-900 truncate">{product.title}</p>
                      <p className="text-[10.5px] text-gray-400 font-mono truncate">{product.productId}</p>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <code className={`text-[11px] font-mono px-2 py-1 rounded-md border block truncate ${!product.metaHandle ? "text-gray-300 border-dashed border-gray-200 italic" : "text-gray-600 bg-gray-100 border-gray-200"}`}>
                      {product.metaHandle || "none"}
                    </code>
                  </div>
                  <div className="relative">
                    <input
                      value={newVal}
                      onChange={e => {
                        const raw = e.target.value.toLowerCase().replace(/[^a-z0-9\s-]/g, "");
                        setHandleStates(prev => ({ ...prev, [product.productId]: { value: raw, source: "manual" } }));
                      }}
                      onBlur={e => {
                        const slugged = slugify(e.target.value);
                        setHandleStates(prev => ({ ...prev, [product.productId]: { value: slugged, source: handleStates[product.productId]?.source || "manual" } }));
                      }}
                      placeholder="Enter or generate handle…"
                      className={`w-full text-[11.5px] font-mono px-2.5 py-1.5 rounded-lg border-[1.5px] outline-none transition-colors ${
                        isAI ? "border-purple-200 bg-purple-50/60 text-purple-800 focus:border-purple-400" :
                        hasChange ? "border-blue-200 bg-blue-50/60 text-blue-800 focus:border-blue-400" :
                        "border-gray-200 bg-white text-gray-700 focus:border-green-400"
                      }`}
                    />
                    {isAI && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8.5px] font-extrabold text-purple-500 bg-purple-100 px-1 py-0.5 rounded pointer-events-none">✦ AI</span>}
                  </div>
                  <HandleStatusBadge source={hs?.source || null} hasChange={hasChange} />
                  <button onClick={() => setHandleStates(prev => { const n = { ...prev }; delete n[product.productId]; return n; })}
                    className="flex items-center gap-1 px-2 py-1.5 bg-white border-[1.5px] border-gray-200 rounded-lg text-[11px] font-bold text-gray-400 hover:border-red-300 hover:text-red-500 transition-all">
                    <X className="w-2.5 h-2.5" /> Clear
                  </button>
                </div>
              );
            })}
          </div>

          {/* Table Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t-[1.5px] border-gray-200 bg-gray-50/60 flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-white border-[1.5px] border-gray-200 rounded-lg px-3 py-1.5">
              <Package className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-[12.5px] font-bold text-gray-700">{products.length} products · {changedCount} with changes</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setHandleStates({})}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-[1.5px] border-gray-200 rounded-lg text-[12px] font-bold text-gray-500 hover:border-red-300 hover:text-red-500 transition-all">
                <RotateCcw className="w-3 h-3" /> Reset All
              </button>
              <button onClick={() => setShowApplyModal(true)} disabled={changedCount === 0}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-[12.5px] font-bold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                <CheckCircle className="w-3.5 h-3.5" /> Apply Handle Changes
              </button>
            </div>
          </div>
        </div>

        {/* ── Floating Apply Bar ── */}
        {changedCount > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0c1535] rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl min-w-[420px]">
            <div className="flex-1">
              <p className="text-[13.5px] font-bold text-white">{changedCount} handle change{changedCount > 1 ? "s" : ""} ready</p>
              <p className="text-[11.5px] text-white/40 mt-0.5">{changedCount} product{changedCount > 1 ? "s" : ""} will be updated in Shopify</p>
            </div>
            <button onClick={() => setShowApplyModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-[13px] font-bold shadow-lg hover:-translate-y-0.5 transition-transform">
              Apply to Shopify <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setHandleStates({})} className="text-white/30 hover:text-white/60 text-[12px] font-semibold transition-colors">Dismiss</button>
          </div>
        )}

        {/* ── Progress Modal ── */}
        <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-green-500" /> Optimizing URL Handles
              </DialogTitle>
              <DialogDescription>Please wait while we process your products…</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Progress value={(progress.current / Math.max(progress.total, 1)) * 100} className="h-2" />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">{progress.status}</p>
                <p className="text-xs text-gray-500 mt-1">{progress.current} of {progress.total} products processed</p>
              </div>
              <div className="flex justify-center">
                {progress.status.includes("AI") ? <Brain className="w-12 h-12 text-purple-500 animate-pulse" /> : <Link2 className="w-12 h-12 text-green-500 animate-pulse" />}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Preview Modal ── */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-500" /> Handle Optimization Preview</DialogTitle>
              <DialogDescription>Review optimized handles before applying to your store</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {optimizationResults.map(result => (
                <div key={result.productId} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-start gap-3">
                    <img src={result.image} alt="" className="w-12 h-12 rounded-lg object-cover border flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 mb-2">{result.title}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Current Handle</p>
                          <code className="text-[11.5px] font-mono bg-gray-100 border border-gray-200 rounded-md px-2.5 py-1 block text-gray-600">{result.oldMetaHandle}</code>
                          <p className="text-[10px] text-gray-400 mt-1">/products/{result.oldMetaHandle === "(Empty)" ? "[not-set]" : result.oldMetaHandle}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-green-500 uppercase mb-1">Optimized Handle</p>
                          <code className="text-[11.5px] font-mono bg-green-50 border border-green-200 rounded-md px-2.5 py-1 block text-green-800 font-bold">{result.newMetaHandle}</code>
                          <p className="text-[10px] text-green-600 mt-1">/products/{result.newMetaHandle}</p>
                        </div>
                      </div>
                      {result.oldMetaHandle !== result.newMetaHandle && (
                        <Badge variant="secondary" className="mt-2 text-xs">{result.characterCount} chars</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>Cancel</Button>
              <Button onClick={() => applyOptimizations(optimizationResults)} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2">
                <Save className="w-4 h-4" /> Apply All Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Apply Confirmation Modal ── */}
        <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Link2 className="w-5 h-5 text-green-500" /> Apply URL Handle Changes</DialogTitle>
              <DialogDescription>Review before pushing to your Shopify store</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Will Update", value: changedCount, color: "text-green-600" },
                  { label: "AI Generated", value: aiCount, color: "text-purple-600" },
                  { label: "Manual Edits", value: Object.values(handleStates).filter(h => h.source === "manual").length, color: "text-blue-600" },
                ].map(s => (
                  <div key={s.label} className="text-center bg-gray-50 rounded-xl p-3 border border-gray-200">
                    <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
                    <p className="text-[11px] text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {products.filter(p => {
                  const hs = handleStates[p.productId];
                  return hs?.value && hs.value !== (p.metaHandle || "");
                }).map(p => {
                  const hs = handleStates[p.productId];
                  return (
                    <div key={p.productId} className={`grid grid-cols-[1fr_18px_1fr_auto] gap-2 items-center px-3 py-2 rounded-lg border-[1.5px] text-[11px] font-mono ${hs?.source === "ai" ? "border-purple-200 bg-purple-50" : "border-blue-200 bg-blue-50"}`}>
                      <span className="text-gray-500 truncate">{p.metaHandle || "(empty)"}</span>
                      <span className="text-blue-400 text-center font-sans">→</span>
                      <span className="text-blue-900 font-bold truncate">{hs?.value}</span>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded font-sans whitespace-nowrap ${hs?.source === "ai" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                        {hs?.source === "ai" ? "✦ AI" : hs?.source === "classic" ? "⇄ Sync" : "✎ Manual"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="bg-amber-50 border-[1.5px] border-amber-200 rounded-lg px-3 py-2.5 text-[12px] text-amber-700">
                <strong>⚠ Important:</strong> Changing URL handles updates product URLs. Old URLs will return 404 unless redirects are configured in Shopify.
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowApplyModal(false)}>Cancel</Button>
              <Button onClick={applyTableChanges} className="bg-gradient-to-r from-green-600 to-emerald-600 gap-2">
                <CheckCircle className="w-4 h-4" /> Apply to Shopify
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Success Modal ── */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-green-500" /> URL Handles Updated!</DialogTitle>
              <DialogDescription>Your product URL handles have been optimized successfully</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">🔗</div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Successfully Updated!</h3>
                <p className="text-gray-600">{applyCount} URL handle{applyCount !== 1 ? "s" : ""} applied to your Shopify store.</p>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-left">
                <p className="text-sm text-purple-800"><strong>💡 Tip:</strong> Set up 301 redirects in Shopify (Online Store → Navigation → URL Redirects) for any changed handles to preserve SEO rankings.</p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => navigate("/")} className="flex-1">Go to Dashboard</Button>
              {/* <Button onClick={() => { setShowSuccessModal(false); fetchStoredProducts(); setHandleStates({}); }} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600">Optimize More</Button> */}

              <Button onClick={() => navigate("/products?service=handle")} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600">Optimize More</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}