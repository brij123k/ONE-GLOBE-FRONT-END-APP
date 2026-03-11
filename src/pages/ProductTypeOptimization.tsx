import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronLeft,
  Package,
  Search,
  Sparkles,
  Save,
  RotateCcw,
  X,
  Check,
  AlertCircle,
  Loader2,
  Tag,
  ChevronDown,
  Edit3,
  ChevronRight,
  Brain,
  Wand2,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  _id: string;
  shopId: string;
  productId: string;
  productType: string;
  title: string;
  productImage: string;
  optimized: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TypeChange {
  productId: string;
  oldType: string;
  newType: string;
  source: 'ai' | 'manual';
}

interface AIResponse {
  productId: string;
  oldProductType: string;
  newProductType: string;
}

interface UpdateResponse {
  message?: string;
  updatedCount?: number;
  results?: Array<{
    productId: string;
    status: string;
  }>;
}

// ─── StatusBadge Component ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'changed' | 'ai' | 'pending' | 'same' }) {
  const badges = {
    changed: (
      <span className="inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-[10.5px] font-bold bg-green-50 text-green-800 border border-green-200 whitespace-nowrap">
        <Check className="w-3 h-3" /> Changed
      </span>
    ),
    ai: (
      <span className="inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-[10.5px] font-bold bg-purple-50 text-purple-800 border border-purple-200 whitespace-nowrap">
        <Sparkles className="w-3 h-3" /> AI
      </span>
    ),
    pending: (
      <span className="inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-[10.5px] font-bold bg-gray-100 text-gray-400 border border-gray-200 whitespace-nowrap">
        ◌ Pending
      </span>
    ),
    same: (
      <span className="inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-[10.5px] font-bold bg-gray-100 text-gray-400 border border-gray-200 whitespace-nowrap">
        — Same
      </span>
    )
  };
  return badges[status] || badges.pending;
}

// ─── ComboBox Component ────────────────────────────────────────────────────

interface ComboBoxProps {
  value: string;
  onChange: (value: string, source: 'ai' | 'manual') => void;
  onFocus: () => void;
  onBlur: () => void;
  isOpen: boolean;
  suggestions: string[];
  aiSuggestion?: string;
  productId: string;
  placeholder?: string;
}

function ComboBox({
  value,
  onChange,
  onFocus,
  onBlur,
  isOpen,
  suggestions,
  aiSuggestion,
  productId,
  placeholder = "Choose or type product type…"
}: ComboBoxProps) {
  const [inputValue, setInputValue] = useState(value);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const comboRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (inputValue) {
      const query = inputValue.toLowerCase();
      const filtered = suggestions.filter(s => 
        s.toLowerCase().includes(query) && s !== aiSuggestion
      );
      setFilteredSuggestions(filtered.slice(0, 8));
    } else {
      setFilteredSuggestions(suggestions.filter(s => s !== aiSuggestion).slice(0, 8));
    }
  }, [inputValue, suggestions, aiSuggestion]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val, 'manual');
  };

  const handleSelect = (type: string, source: 'ai' | 'manual') => {
    setInputValue(type);
    onChange(type, source);
    inputRef.current?.blur();
  };

  const hasAiSuggestion = aiSuggestion && (!inputValue || aiSuggestion.toLowerCase().includes(inputValue.toLowerCase()));

  return (
    <div className="vcombo relative w-full" ref={comboRef}>
      <div className={`vcombo-input-wrap flex items-center border-[1.5px] rounded-[8px] bg-white transition-all overflow-hidden ${
        value ? (value === aiSuggestion ? 'border-purple-200 bg-purple-50' : 'border-blue-200 bg-blue-50') : 'border-gray-200'
      }`}>
        {value === aiSuggestion && value && (
          <span className="ai-chip text-[9px] font-extrabold text-purple-800 bg-purple-100 rounded-[4px] px-1 ml-2">✦ AI</span>
        )}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`vnew flex-1 px-[10px] py-[6px] border-none outline-none text-[12.5px] font-semibold bg-transparent min-w-0 ${
            value === aiSuggestion ? 'text-purple-700' : 'text-blue-700'
          }`}
        />
        <div
          className={`vcombo-arrow px-2 cursor-pointer text-gray-400 flex items-center border-l border-gray-200 hover:text-blue-600 hover:bg-blue-50 self-stretch transition-all ${
            isOpen ? 'open' : ''
          }`}
          onClick={() => inputRef.current?.focus()}
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="vcombo-drop absolute top-full left-0 right-0 mt-1 bg-white border-[1.5px] border-gray-200 rounded-[10px] shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* AI Suggestion Section */}
          {hasAiSuggestion && (
            <>
              <div className="drop-label text-[9.5px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">
                ✦ AI Suggestion
              </div>
              <div
                className="drop-opt flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-purple-50 bg-purple-50/50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(aiSuggestion!, 'ai');
                }}
              >
                <div className="drop-icon w-6 h-6 rounded-md bg-purple-100 border border-purple-200 flex items-center justify-center text-sm">
                  🧠
                </div>
                <span className="flex-1 text-[12.5px] font-bold text-purple-700">
                  {aiSuggestion}
                </span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                  Suggested
                </span>
              </div>
              <div className="drop-divider h-px bg-gray-100 my-1" />
            </>
          )}

          {/* Regular Suggestions */}
          {filteredSuggestions.length > 0 && (
            <>
              <div className="drop-label text-[9.5px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">
                Product Types
              </div>
              {filteredSuggestions.map((type, idx) => (
                <div
                  key={idx}
                  className="drop-opt flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(type, 'manual');
                  }}
                >
                  <div className="drop-icon w-6 h-6 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-sm">
                    🏷️
                  </div>
                  <span className="flex-1 text-[12.5px] text-gray-700">{type}</span>
                </div>
              ))}
            </>
          )}

          {/* Custom Type Option */}
          {inputValue && !suggestions.some(s => s.toLowerCase() === inputValue.toLowerCase()) && (
            <>
              {filteredSuggestions.length > 0 && <div className="drop-divider h-px bg-gray-100 my-1" />}
              <div
                className="drop-opt flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-green-50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(inputValue, 'manual');
                }}
              >
                <div className="drop-icon w-6 h-6 rounded-md bg-green-50 border border-green-200 flex items-center justify-center text-sm">
                  ✏️
                </div>
                <span className="flex-1 text-[12.5px] font-bold text-green-700">
                  Use "<strong>{inputValue}</strong>"
                </span>
                <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full">
                  Custom
                </span>
              </div>
            </>
          )}

          {/* Hint */}
          <div className="drop-hint flex items-center gap-2 px-3 py-2 text-[11.5px] text-gray-500 border-t border-gray-100 bg-gray-50">
            <Edit3 className="w-3 h-3 text-gray-400" />
            Or keep typing to enter a custom type
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function ProductTypeOptimization() {
  const navigate = useNavigate();

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTypes, setNewTypes] = useState<Record<string, string>>({});
  const [sources, setSources] = useState<Record<string, 'ai' | 'manual'>>({});
  const [originalTypes, setOriginalTypes] = useState<Record<string, string>>({});

  // UI
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const [openComboId, setOpenComboId] = useState<string | null>(null);
  const [commonTypes, setCommonTypes] = useState<string[]>([]);
  
  // AI states
  const [aiRunning, setAiRunning] = useState(false);
  const [aiProgress, setAiProgress] = useState({ current: 0, total: 0 });
  const [aiResults, setAiResults] = useState<TypeChange[]>([]);

  // Update states
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0 });

  // Modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [applyError, setApplyError] = useState<string | null>(null);

  // AI Suggestions
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>({});

  // ── Fetch Products ───────────────────────────────────────────────────────

  useEffect(() => {
    fetchProducts();
    fetchProductTypes();
  }, []);

  useEffect(() => {
    // Update select all state
    const visibleIds = getVisibleProductIds();
    const selectedCount = Array.from(selected).filter(id => visibleIds.includes(id)).length;
    setSelectAll(selectedCount === visibleIds.length && visibleIds.length > 0);
    setIndeterminate(selectedCount > 0 && selectedCount < visibleIds.length);
  }, [selected, searchQuery, statusFilter, products]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const response = await getApi(ApiConfig.getStoredProductType);
      const data: Product[] = response || [];
      setProducts(data);
      
      // Initialize maps
      const initialTypes: Record<string, string> = {};
      data.forEach(p => {
        initialTypes[p.productId] = p.productType || '';
      });
      setNewTypes(initialTypes);
      setOriginalTypes(initialTypes);
      
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  const fetchProductTypes = async () => {
    try {
      const response = await getApi(ApiConfig.getProductType);
      if (response?.productTypes) {
        setCommonTypes(response.productTypes);
      }
    } catch (error) {
      console.error('Error fetching product types:', error);
    }
  }

  // ── Helper Functions ─────────────────────────────────────────────────────

  function getVisibleProductIds(): string[] {
    return products
      .filter(p => {
        const matchesSearch = !searchQuery || 
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (newTypes[p.productId] || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.productType || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        const status = getProductStatus(p.productId);
        const matchesFilter = !statusFilter || 
          (statusFilter === 'changed' && (status === 'changed' || status === 'ai')) ||
          status === statusFilter;
        
        return matchesSearch && matchesFilter;
      })
      .map(p => p.productId);
  }

  function getSelectedProducts(): Product[] {
    return products.filter(p => selected.has(p.productId));
  }

  function getProductStatus(productId: string): 'changed' | 'ai' | 'pending' | 'same' {
    const newType = newTypes[productId]?.trim() || '';
    const oldType = originalTypes[productId] || '';
    
    if (!newType) return 'pending';
    if (newType === oldType) return 'same';
    if (sources[productId] === 'ai') return 'ai';
    return 'changed';
  }

  function getChangedCount(): number {
    return products.filter(p => {
      const newType = newTypes[p.productId]?.trim() || '';
      const oldType = originalTypes[p.productId] || '';
      return newType && newType !== oldType;
    }).length;
  }

  function getUniqueTypesCount(): number {
    const types = new Set(Object.values(newTypes).filter(Boolean));
    return types.size;
  }

  function getMissingCount(): number {
    return products.filter(p => !p.productType).length;
  }

  function getAiFilledCount(): number {
    return Object.values(sources).filter(s => s === 'ai').length;
  }

  // ── Event Handlers ──────────────────────────────────────────────────────

  function handleTypeChange(productId: string, value: string, source: 'ai' | 'manual') {
    setNewTypes(prev => ({ ...prev, [productId]: value }));
    if (value) {
      setSources(prev => ({ ...prev, [productId]: source }));
    } else {
      setSources(prev => {
        const newSources = { ...prev };
        delete newSources[productId];
        return newSources;
      });
    }
  }

  function clearRow(productId: string) {
    setNewTypes(prev => {
      const newMap = { ...prev };
      delete newMap[productId];
      return newMap;
    });
    setSources(prev => {
      const newSources = { ...prev };
      delete newSources[productId];
      return newSources;
    });
    setSelected(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  }

  function resetAll() {
    setNewTypes({ ...originalTypes });
    setSources({});
    setSelected(new Set());
  }

  function toggleRow(productId: string) {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }

  function toggleAll() {
    const visibleIds = getVisibleProductIds();
    const allSelected = visibleIds.every(id => selected.has(id));
    
    setSelected(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        visibleIds.forEach(id => newSet.delete(id));
      } else {
        visibleIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  }

  // ── AI Functions ─────────────────────────────────────────────────────────

  async function runAIOptimization(apply: boolean = false) {
    if (aiRunning) return;
    
    const productsToOptimize = apply ? getSelectedProducts() : products;
    if (productsToOptimize.length === 0) return;
    
    setAiRunning(true);
    setAiProgress({ current: 0, total: productsToOptimize.length });
    
    const results: TypeChange[] = [];

    for (let i = 0; i < productsToOptimize.length; i++) {
      const product = productsToOptimize[i];
      setAiProgress({ current: i + 1, total: productsToOptimize.length });

      try {
        // Call AI optimization API for each product
        const payload = {
          productId: product.productId,
          apply: apply
        };

        const response: AIResponse = await postApi(ApiConfig.aiproductTypeOptimization, payload);
        
        if (response.newProductType) {
          results.push({
            productId: response.productId,
            oldType: response.oldProductType || '',
            newType: response.newProductType,
            source: 'ai'
          });

          if (!apply) {
            // Preview mode: update UI with AI suggestion
            handleTypeChange(response.productId, response.newProductType, 'ai');
            
            // Store AI suggestion for dropdown
            setAiSuggestions(prev => ({
              ...prev,
              [response.productId]: response.newProductType
            }));
          }
        }

        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error optimizing product ${product.productId}:`, error);
      }
    }

    setAiResults(results);

    if (apply && results.length > 0) {
      // Apply directly to Shopify
      await applyTypeUpdates(results);
    } else if (results.length > 0 && !apply) {
      // Show preview modal with AI results
      setShowPreviewModal(true);
    }

    setAiRunning(false);
    setAiProgress({ current: 0, total: 0 });
  }

  // ── Apply Updates (One by One) ──────────────────────────────────────────

  async function applyTypeUpdates(changes: TypeChange[]) {
    if (changes.length === 0) return;

    try {
      setApplyError(null);
      setUpdating(true);
      setUpdateProgress({ current: 0, total: changes.length });

      let successCount = 0;
      const results = [];

      // Apply updates one by one
      for (let i = 0; i < changes.length; i++) {
        const change = changes[i];
        setUpdateProgress({ current: i + 1, total: changes.length });

        try {
          // Send individual update for each product
          const payload = {
            productId: change.productId,
            oldProductType: change.oldType,
            newProductType: change.newType
          };

          const response: UpdateResponse = await postApi(ApiConfig.updateProductType, payload);
          
          if (response.updatedCount) {
            successCount++;
            results.push(response);
          }

          // Small delay between updates
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) {
          console.error(`Error updating product ${change.productId}:`, error);
        }
      }

      // Update original types to reflect saved state
      setOriginalTypes(prev => {
        const newMap = { ...prev };
        changes.forEach(c => {
          newMap[c.productId] = c.newType;
        });
        return newMap;
      });

      // Clear sources for applied changes
      setSources(prev => {
        const newSources = { ...prev };
        changes.forEach(c => {
          delete newSources[c.productId];
        });
        return newSources;
      });

      // Clear selection after successful update
      setSelected(new Set());

      setSuccessMsg(`${successCount} product type${successCount > 1 ? 's have' : ' has'} been successfully applied to your Shopify store.`);
      setShowSuccessModal(true);
      setShowApplyModal(false);
      setShowPreviewModal(false);
      
    } catch (error) {
      console.error('Error applying updates:', error);
      setApplyError('Failed to apply updates. Please try again.');
    } finally {
      setUpdating(false);
      setUpdateProgress({ current: 0, total: 0 });
    }
  }

  async function handleApplyChanges() {
    const changes: TypeChange[] = products
      .filter(p => {
        const newType = newTypes[p.productId]?.trim() || '';
        const oldType = originalTypes[p.productId] || '';
        return newType && newType !== oldType;
      })
      .map(p => ({
        productId: p.productId,
        oldType: originalTypes[p.productId] || '',
        newType: newTypes[p.productId]!,
        source: sources[p.productId] || 'manual'
      }));

    if (changes.length > 0) {
      await applyTypeUpdates(changes);
    }
  }

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = {
    missing: getMissingCount(),
    aiFilled: getAiFilledCount(),
    changed: getChangedCount(),
    unique: getUniqueTypesCount(),
    total: products.length
  };

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout title="Product Type Optimization">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Tag className="w-12 h-12 animate-pulse text-purple-500 mx-auto mb-4" />
            <p className="text-gray-600 text-sm">Loading products for type optimization…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Product Type Optimization">
      <div className="flex flex-col" style={{ height: "calc(100vh - 64px)" }}>
        {/* Top Bar */}
        <div className="flex-shrink-0 flex items-center gap-3 px-6 bg-white border-b border-gray-200 z-10" style={{ height: 60 }}>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 px-[14px] py-[7px] border-[1.5px] border-gray-200 rounded-[10px] text-[12.5px] font-semibold text-gray-500 bg-white hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
          >
            <ChevronLeft className="w-[14px] h-[14px]" /> Back
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
              Optimization Suite
            </p>
            <p className="text-[17px] font-extrabold text-gray-900 leading-tight mt-px">
              Product Type Optimization
            </p>
            <p className="text-[11.5px] text-gray-500 mt-px">
              Set or update the Shopify product type for each product
            </p>
          </div>

          <div className="flex items-center gap-2">
            {getChangedCount() > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 gap-1 mr-2">
                <AlertCircle className="w-3 h-3" />
                {getChangedCount()} unsaved
              </Badge>
            )}
            <div className="flex items-center gap-1.5 bg-[#0f2878] text-white px-4 py-[7px] rounded-full text-[12.5px] font-bold whitespace-nowrap">
              <Package className="w-[14px] h-[14px]" />
              {selected.size} Selected
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-[#eef1f8] p-[18px]">
          <div className="max-w-[1180px] mx-auto space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white border border-gray-200 rounded-[14px] p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Missing Product Type</p>
                <p className="text-[22px] font-extrabold text-gray-900 leading-none">
                  {stats.missing} <span className="text-[12px] font-medium text-gray-400">/ {stats.total}</span>
                </p>
                <p className="text-[11px] font-semibold mt-1" style={{ color: stats.missing > 0 ? '#f59e0b' : '#12b76a' }}>
                  {stats.missing > 0 ? `⚠ ${stats.missing} no type assigned` : '✓ All have types'}
                </p>
                <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(stats.missing / stats.total) * 100}%`, background: '#f59e0b' }} />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-[14px] p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">AI Suggestions</p>
                <p className="text-[22px] font-extrabold text-gray-900 leading-none">
                  {stats.aiFilled} <span className="text-[12px] font-medium text-gray-400">filled</span>
                </p>
                <p className="text-[11px] font-semibold mt-1 text-purple-600">
                  {stats.aiFilled > 0 ? `✦ ${stats.aiFilled} products auto-filled` : 'Select products and click AI Optimize'}
                </p>
                <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(stats.aiFilled / stats.total) * 100}%`, background: '#7c3aed' }} />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-[14px] p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Ready to Apply</p>
                <p className="text-[22px] font-extrabold text-gray-900 leading-none">
                  {stats.changed} <span className="text-[12px] font-medium text-gray-400">changes</span>
                </p>
                <p className="text-[11px] font-semibold mt-1 text-green-600">
                  {stats.changed > 0 ? `${stats.changed} ready to apply` : 'Set types to apply'}
                </p>
                <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(stats.changed / stats.total) * 100}%`, background: '#12b76a' }} />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-[14px] p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Unique Types</p>
                <p className="text-[22px] font-extrabold text-gray-900 leading-none">
                  {stats.unique > 0 ? stats.unique : '—'} <span className="text-[12px] font-medium text-gray-400">types</span>
                </p>
                <p className="text-[11px] font-semibold mt-1 text-blue-600">Across all products</p>
                <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, stats.unique * 8)}%`, background: '#1a3faa' }} />
                </div>
              </div>
            </div>

            {/* Section Header */}
            <div className="bg-white border border-gray-200 rounded-[14px] p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Product Type Optimization</p>
                <p className="text-[16px] font-extrabold text-gray-900">Change Product Type</p>
                <p className="text-[12px] text-gray-500">
                  Select products using checkboxes, then use AI buttons to generate suggestions or directly apply changes.
                </p>
              </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white border border-gray-200 rounded-[14px] overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center gap-2 p-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-[10px] flex-1 max-w-[320px] focus-within:border-blue-500">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search product title or type…"
                    className="flex-1 bg-transparent outline-none text-[12.5px] text-gray-900 placeholder:text-gray-300"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-[10px] text-[12.5px] font-semibold text-gray-600 bg-white outline-none focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="changed">Changed</option>
                  <option value="ai">AI Suggested</option>
                  <option value="pending">Pending</option>
                  <option value="same">Same</option>
                </select>
                <div className="ml-auto">
                  <span className="text-[12px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                    {getVisibleProductIds().length} of {products.length}
                  </span>
                </div>
              </div>

              {/* Table Header */}
              <div className="grid px-4 py-2 bg-gray-50 border-b border-gray-200 text-[10.5px] font-bold text-gray-400 uppercase tracking-wider" style={{ gridTemplateColumns: "40px 40px 1fr 170px 230px 110px 80px", gap: 8 }}>
                <div className="flex items-center justify-center">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={toggleAll}
                    className={indeterminate ? "data-[state=checked]:bg-blue-600" : ""}
                    ref={(ref) => {
                      if (ref) {
                        ref.indeterminate = indeterminate;
                      }
                    }}
                  />
                </div>
                <div>#</div>
                <div>Product Title</div>
                <div>Current Type</div>
                <div>New Product Type</div>
                <div>Status</div>
                <div>Action</div>
              </div>

              {/* Table Body */}
              <div className="max-h-[400px] overflow-y-auto">
                {getVisibleProductIds().length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Tag className="w-12 h-12 text-gray-200 mb-3" />
                    <p className="text-[13px] font-semibold text-gray-400">No products found</p>
                  </div>
                ) : (
                  getVisibleProductIds().map((productId, index) => {
                    const product = products.find(p => p.productId === productId)!;
                    const status = getProductStatus(productId);
                    const isSelected = selected.has(productId);
                    const currentType = product.productType || 'No type set';
                    const newType = newTypes[productId] || '';
                    const source = sources[productId];
                    const aiSuggestion = aiSuggestions[productId];

                    return (
                      <div
                        key={productId}
                        className={`grid px-4 py-2.5 border-b border-gray-100 items-center hover:bg-blue-50/30 transition-colors last:border-b-0 ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                        style={{ gridTemplateColumns: "40px 40px 1fr 170px 230px 110px 80px", gap: 8 }}
                      >
                        {/* Checkbox */}
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRow(productId)}
                          />
                        </div>

                        {/* Index */}
                        <div className="text-[11px] font-bold text-gray-400">{index + 1}</div>

                        {/* Product Info */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-md bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-lg">
                            {product.productImage ? (
                              <img src={product.productImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              "📦"
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12.5px] font-semibold text-gray-900 truncate">{product.title}</p>
                            <p className="text-[10.5px] text-gray-400 font-mono truncate">{product.productId}</p>
                          </div>
                        </div>

                        {/* Current Type */}
                        <div>
                          <span className={`inline-block text-[11.5px] font-semibold px-3 py-1.5 rounded-[7px] ${
                            !product.productType 
                              ? 'bg-gray-100 text-gray-400 border border-dashed border-gray-300' 
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {product.productType || 'No type set'}
                          </span>
                        </div>

                        {/* New Type ComboBox */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <ComboBox
                            value={newType}
                            onChange={(val, src) => handleTypeChange(productId, val, src)}
                            onFocus={() => setOpenComboId(productId)}
                            onBlur={() => setOpenComboId(null)}
                            isOpen={openComboId === productId}
                            suggestions={commonTypes}
                            aiSuggestion={aiSuggestion}
                            productId={productId}
                            placeholder="Choose or type product type…"
                          />
                        </div>

                        {/* Status */}
                        <div>
                          <StatusBadge status={status} />
                        </div>

                        {/* Action */}
                        <div>
                          <button
                            onClick={() => clearRow(productId)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md text-[11px] font-bold hover:bg-red-100 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Clear
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Table Footer */}
              <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-[8px] px-3 py-1.5">
                  <Package className="w-3.5 h-3.5 text-gray-500" />
                  <span className="text-[12.5px] font-bold text-gray-700">
                    {products.length} products · {getChangedCount()} with changes · {selected.size} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  {getChangedCount() > 0 && (
                    <button
                      onClick={resetAll}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-[10px] text-[12.5px] font-bold text-gray-600 hover:border-red-400 hover:text-red-500 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset All
                    </button>
                  )}
                  
                  {/* AI Optimize Button (Preview) */}
                  <button
                    onClick={() => runAIOptimization(false)}
                    disabled={aiRunning || updating || selected.size === 0}
                    className={`flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-[10px] text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all ${
                      aiRunning ? 'scanning relative overflow-hidden' : ''
                    }`}
                    title={selected.size === 0 ? "Select products first" : "Generate AI suggestions for selected products"}
                  >
                    {aiRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        AI Running {aiProgress.current}/{aiProgress.total}
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4" />
                        AI Optimize {selected.size > 0 ? `(${selected.size})` : ''}
                      </>
                    )}
                  </button>

                  {/* Optimize & Save Button (Direct Apply) */}
                  <button
                    onClick={() => runAIOptimization(true)}
                    disabled={aiRunning || updating || selected.size === 0}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-[10px] text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                    title={selected.size === 0 ? "Select products first" : "AI optimize and directly save to Shopify"}
                  >
                    {aiRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Optimize & Save {selected.size > 0 ? `(${selected.size})` : ''}
                      </>
                    )}
                  </button>

                  {/* Apply Type Changes Button */}
                  <button
                    onClick={() => setShowApplyModal(true)}
                    disabled={getChangedCount() === 0 || updating}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-[10px] text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                  >
                    {updating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating {updateProgress.current}/{updateProgress.total}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Apply Type Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Bar */}
        {getChangedCount() > 0 && !updating && (
          <div className="floatbar fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#0c1535] rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl z-40 min-w-[460px]">
            <div className="fb-info flex-1">
              <div className="fb-title text-[13.5px] font-bold text-white">
                {getChangedCount()} type change{getChangedCount() > 1 ? 's' : ''} ready
              </div>
              <div className="fb-sub text-[11.5px] text-gray-400 mt-0.5">
                {getChangedCount()} product{getChangedCount() > 1 ? 's' : ''} will be updated in Shopify
              </div>
            </div>
            <button
              onClick={() => setShowApplyModal(true)}
              className="btn-fb flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-[13px] font-bold hover:-translate-y-0.5 transition-transform shadow-lg"
            >
              Apply to Shopify
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {}}
              className="btn-fb-dismiss text-gray-400 text-[12px] font-semibold hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[17px]">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI Suggestions Preview
              </DialogTitle>
              <DialogDescription className="text-[12px] text-gray-500">
                Review AI-generated product types before applying
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {aiResults.map((result, idx) => (
                <div key={idx} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-md bg-purple-100 border border-purple-200 flex items-center justify-center text-xl">
                      🧠
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 mb-2 truncate">
                        {products.find(p => p.productId === result.productId)?.title}
                      </p>
                      <div className="space-y-2">
                        <div>
                          <p className="text-[10px] text-gray-500">Current Type</p>
                          <p className="text-[12px] font-mono text-gray-600 bg-white px-2 py-1 rounded border border-gray-200">
                            {result.oldType || 'No type set'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-500">AI Suggested</p>
                          <p className="text-[12px] font-mono text-purple-700 bg-white px-2 py-1 rounded border border-purple-200">
                            {result.newType}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowPreviewModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowPreviewModal(false);
                  setShowApplyModal(true);
                }}
                className="flex-[1.8] bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
              >
                <Save className="w-4 h-4" />
                Apply Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Apply Modal */}
        <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
          <DialogContent className="max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[17px]">
                <Tag className="w-5 h-5 text-blue-500" />
                Apply Product Type Changes
              </DialogTitle>
              <DialogDescription className="text-[12px] text-gray-500">
                Review before pushing to your Shopify store
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Will Update', value: getChangedCount(), color: '#12b76a' },
                  { label: 'AI Suggested', value: getAiFilledCount(), color: '#7c3aed' },
                  { label: 'Manual Edit', value: getChangedCount() - getAiFilledCount(), color: '#1a3faa' }
                ].map((stat, idx) => (
                  <div key={idx} className="text-center bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="text-[24px] font-extrabold" style={{ color: stat.color }}>{stat.value}</div>
                    <p className="text-[10.5px] text-gray-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Changes List */}
              <div>
                <p className="text-[10.5px] font-bold text-gray-400 uppercase mb-2">Current Type → New Type</p>
                <div className="max-h-[230px] overflow-y-auto space-y-1.5">
                  {products
                    .filter(p => {
                      const newType = newTypes[p.productId]?.trim() || '';
                      const oldType = originalTypes[p.productId] || '';
                      return newType && newType !== oldType;
                    })
                    .map(p => {
                      const newType = newTypes[p.productId]!;
                      const source = sources[p.productId];
                      return (
                        <div
                          key={p.productId}
                          className={`grid grid-cols-[1fr_22px_1fr_auto] gap-2 items-center p-2.5 bg-gray-50 border rounded-lg text-[11.5px] ${
                            source === 'ai' ? 'border-purple-200 bg-purple-50' : 'border-blue-200 bg-blue-50'
                          }`}
                        >
                          <div className="text-gray-600 font-semibold truncate">{p.productType || 'No type'}</div>
                          <div className="text-blue-600 text-center">→</div>
                          <div className="text-blue-800 font-bold truncate">{newType}</div>
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                            source === 'ai' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {source === 'ai' ? '✦ AI' : 'Manual'}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Note */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-[12px] text-purple-700 leading-relaxed">
                <strong>✦ AI suggestions</strong> are purple. Your manual edits are blue. Only products with a new type set will be updated.
              </div>

              {applyError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-[12px] text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {applyError}
                </div>
              )}

              {updating && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-semibold text-blue-700">Updating products...</span>
                    <span className="text-[12px] font-bold text-blue-700">{updateProgress.current}/{updateProgress.total}</span>
                  </div>
                  <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${(updateProgress.current / updateProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowApplyModal(false)} 
                className="flex-1"
                disabled={updating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApplyChanges}
                disabled={updating || getChangedCount() === 0}
                className="flex-[1.8] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Apply to Shopify
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent>
            <div className="text-center py-2">
              <div className="success-icon-wrap w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center mx-auto mb-4 text-3xl">
                🎉
              </div>
              <h3 className="text-[20px] font-extrabold text-gray-900 mb-2">Product Types Updated!</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">{successMsg}</p>
              <div className="success-tip mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg text-left">
                <p className="text-[12px] text-purple-700 leading-relaxed">
                  <strong>💡 Tip:</strong> Product types power Shopify collections, filtering, and reports. Your store is now better organized.
                </p>
              </div>
              <div className="flex gap-2 mt-5">
                <Button variant="outline" onClick={() => setShowSuccessModal(false)} className="flex-1">
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowSuccessModal(false);
                    fetchProducts();
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600"
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