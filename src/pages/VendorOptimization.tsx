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
  User,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  _id: string;
  shopId: string;
  productId: string;
  vendor: string;
  title: string;
  productImage: string;
  optimized: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VendorChange {
  productId: string;
  oldVendor: string;
  newVendor: string;
}

interface UpdateResponse {
  message?: string;
  updatedCount?: number;
  results?: Array<{
    productId: string;
    status: string;
  }>;
}

interface VendorsResponse {
  count: number;
  vendors: string[];
}

// ─── StatusBadge Component ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'changed' | 'pending' | 'same' }) {
  const badges = {
    changed: (
      <span className="inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-[10.5px] font-bold bg-green-50 text-green-800 border border-green-200 whitespace-nowrap">
        <Check className="w-3 h-3" /> Changed
      </span>
    ),
    pending: (
      <span className="inline-flex items-center gap-1 px-[9px] py-[3px] rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
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
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  isOpen: boolean;
  suggestions: string[];
  productCounts?: Record<string, number>;
  placeholder?: string;
}

function ComboBox({
  value,
  onChange,
  onFocus,
  onBlur,
  isOpen,
  suggestions,
  productCounts = {},
  placeholder = "Choose or type vendor…"
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
        s.toLowerCase().includes(query)
      );
      setFilteredSuggestions(filtered.slice(0, 8));
    } else {
      setFilteredSuggestions(suggestions.slice(0, 8));
    }
  }, [inputValue, suggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
  };

  const handleSelect = (vendor: string) => {
    setInputValue(vendor);
    onChange(vendor);
    inputRef.current?.blur();
  };

  return (
    <div className="vcombo relative w-full" ref={comboRef}>
      <div className={`vcombo-input-wrap flex items-center border-[1.5px] rounded-[8px] bg-white transition-all overflow-hidden ${
        value ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
      }`}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`vendor-new flex-1 px-[10px] py-[6px] border-none outline-none text-[12.5px] font-semibold bg-transparent min-w-0 ${
            value ? 'text-blue-700' : 'text-gray-700'
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
          {/* Regular Suggestions */}
          {filteredSuggestions.length > 0 && (
            <>
              <div className="vcombo-drop-label text-[9.5px] font-bold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">
                Existing Vendors
              </div>
              {filteredSuggestions.map((vendor, idx) => (
                <div
                  key={idx}
                  className="vcombo-option flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-blue-50"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(vendor);
                  }}
                >
                  <div className="vcombo-option-icon w-6 h-6 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-sm">
                    <User className="w-3 h-3 text-blue-600" />
                  </div>
                  <span className="vcombo-option-name flex-1 text-[12.5px] text-gray-700">
                    {vendor}
                  </span>
                  {productCounts[vendor] > 0 && (
                    <span className="vcombo-option-count text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      {productCounts[vendor]} products
                    </span>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Custom Type Option */}
          {inputValue && !suggestions.some(s => s.toLowerCase() === inputValue.toLowerCase()) && (
            <>
              {filteredSuggestions.length > 0 && <div className="vcombo-divider h-px bg-gray-100 my-1" />}
              <div
                className="vcombo-option flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-green-50"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(inputValue);
                }}
              >
                <div className="vcombo-option-icon w-6 h-6 rounded-md bg-green-50 border border-green-200 flex items-center justify-center text-sm">
                  <Edit3 className="w-3 h-3 text-green-600" />
                </div>
                <span className="vcombo-option-name flex-1 text-[12.5px] font-bold text-green-700">
                  Use "<strong>{inputValue}</strong>"
                </span>
                <span className="vcombo-option-count text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  New
                </span>
              </div>
            </>
          )}

          {/* Hint */}
          <div className="vcombo-type-hint flex items-center gap-2 px-3 py-2 text-[11.5px] text-gray-500 border-t border-gray-100 bg-gray-50">
            <Edit3 className="w-3 h-3 text-gray-400" />
            Or keep typing to enter a custom vendor name
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function VendorOptimization() {
  const navigate = useNavigate();

  // Data
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVendors, setNewVendors] = useState<Record<string, string>>({});
  const [originalVendors, setOriginalVendors] = useState<Record<string, string>>({});
  const [allVendors, setAllVendors] = useState<string[]>([]);

  // UI
  const [searchQuery, setSearchQuery] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const [openComboId, setOpenComboId] = useState<string | null>(null);
  const [bulkVendorInput, setBulkVendorInput] = useState("");

  // Update states
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState({ current: 0, total: 0 });

  // Modals
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [applyError, setApplyError] = useState<string | null>(null);

  // ── Fetch Data ───────────────────────────────────────────────────────────

  useEffect(() => {
    fetchProducts();
    fetchAllVendors();
  }, []);

  useEffect(() => {
    // Update select all state
    const visibleIds = getVisibleProductIds();
    const selectedCount = Array.from(selected).filter(id => visibleIds.includes(id)).length;
    setSelectAll(selectedCount === visibleIds.length && visibleIds.length > 0);
    setIndeterminate(selectedCount > 0 && selectedCount < visibleIds.length);
  }, [selected, searchQuery, vendorFilter, statusFilter, products]);

  async function fetchProducts() {
    try {
      setLoading(true);
      // Update this endpoint to match your API for fetching products with vendor data
      const response = await getApi(ApiConfig.getStoredVendor);
      const data: Product[] = response || [];
      setProducts(data);
      
      // Initialize maps - set newVendors to empty, not pre-filled with original values
      setNewVendors({});
      setOriginalVendors(data.reduce((acc, p) => ({ ...acc, [p.productId]: p.vendor || '' }), {}));
      
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllVendors() {
    try {
      const response: VendorsResponse = await getApi(ApiConfig.getVendors);
      if (response?.vendors) {
        setAllVendors(response.vendors.sort());
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  }

  // ── Helper Functions ─────────────────────────────────────────────────────

  function getVisibleProductIds(): string[] {
    return products
      .filter(p => {
        const matchesSearch = !searchQuery || 
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.vendor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (newVendors[p.productId] || '').toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesVendor = !vendorFilter || 
          p.vendor === vendorFilter || 
          (vendorFilter === '—' && !p.vendor);
        
        const status = getProductStatus(p.productId);
        const matchesStatus = !statusFilter || status === statusFilter;
        
        return matchesSearch && matchesVendor && matchesStatus;
      })
      .map(p => p.productId);
  }

  function getProductStatus(productId: string): 'changed' | 'pending' | 'same' {
    const newVendor = newVendors[productId]?.trim() || '';
    const oldVendor = originalVendors[productId] || '';
    
    if (!newVendor) return 'pending';
    if (newVendor === oldVendor) return 'same';
    return 'changed';
  }

  function getChangedCount(): number {
    return products.filter(p => {
      const newVendor = newVendors[p.productId]?.trim() || '';
      const oldVendor = originalVendors[p.productId] || '';
      return newVendor && newVendor !== oldVendor;
    }).length;
  }

  function getMissingCount(): number {
    return products.filter(p => !p.vendor).length;
  }

  function getUniqueVendors(): string[] {
    // Use allVendors from API instead of deriving from products
    return allVendors;
  }

  function getVendorCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    products.forEach(p => {
      if (p.vendor) {
        counts[p.vendor] = (counts[p.vendor] || 0) + 1;
      }
    });
    return counts;
  }

  function getTimeSaved(): number {
    // Estimate: 2 minutes per product * number of changed products
    return Math.round(getChangedCount() * 2);
  }

  // ── Event Handlers ──────────────────────────────────────────────────────

  function handleVendorChange(productId: string, value: string) {
    setNewVendors(prev => ({ ...prev, [productId]: value }));
  }

  function clearRow(productId: string) {
    setNewVendors(prev => {
      const newMap = { ...prev };
      delete newMap[productId];
      return newMap;
    });
    setSelected(prev => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  }

  function resetAll() {
    setNewVendors({});
    setSelected(new Set());
    setBulkVendorInput("");
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

  // ── Bulk Apply ──────────────────────────────────────────────────────────

  function applyBulkVendor() {
    if (!bulkVendorInput.trim()) return;
    
    const targets = selected.size > 0 ? Array.from(selected) : products.map(p => p.productId);
    targets.forEach(productId => {
      handleVendorChange(productId, bulkVendorInput);
    });
    
    // Clear bulk input after applying
    setBulkVendorInput("");
  }

  // ── Apply Updates (One by One) ──────────────────────────────────────────

  async function applyVendorUpdates(changes: VendorChange[]) {
    if (changes.length === 0) return;

    try {
      setApplyError(null);
      setUpdating(true);
      setUpdateProgress({ current: 0, total: changes.length });

      let successCount = 0;

      // Apply updates one by one
      for (let i = 0; i < changes.length; i++) {
        const change = changes[i];
        setUpdateProgress({ current: i + 1, total: changes.length });

        try {
          // Send individual update for each product
          const payload = {
            productId: change.productId,
            oldVendor: change.oldVendor,
            newVendor: change.newVendor
          };

          const response: UpdateResponse = await postApi(ApiConfig.updateVendor, payload);
          
          if (response.updatedCount) {
            successCount++;
          }

          // Small delay between updates
          await new Promise(resolve => setTimeout(resolve, 150));
        } catch (error) {
          console.error(`Error updating product ${change.productId}:`, error);
        }
      }

      // Update original vendors to reflect saved state
      setOriginalVendors(prev => {
        const newMap = { ...prev };
        changes.forEach(c => {
          newMap[c.productId] = c.newVendor;
        });
        return newMap;
      });

      // Clear new vendors and selection after successful update
      setNewVendors({});
      setSelected(new Set());

      setSuccessMsg(`${successCount} product vendor name${successCount > 1 ? 's have' : ' has'} been successfully updated in your Shopify store.`);
      setShowSuccessModal(true);
      setShowApplyModal(false);
      
      // Refresh vendors list
      await fetchAllVendors();
      
    } catch (error) {
      console.error('Error applying updates:', error);
      setApplyError('Failed to apply updates. Please try again.');
    } finally {
      setUpdating(false);
      setUpdateProgress({ current: 0, total: 0 });
    }
  }

  async function handleApplyChanges() {
    const changes: VendorChange[] = products
      .filter(p => {
        const newVendor = newVendors[p.productId]?.trim() || '';
        const oldVendor = originalVendors[p.productId] || '';
        return newVendor && newVendor !== oldVendor;
      })
      .map(p => ({
        productId: p.productId,
        oldVendor: originalVendors[p.productId] || '',
        newVendor: newVendors[p.productId]!.trim()
      }));

    if (changes.length > 0) {
      await applyVendorUpdates(changes);
    }
  }

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = {
    missing: getMissingCount(),
    unique: allVendors.length,
    changed: getChangedCount(),
    timeSaved: getTimeSaved(),
    total: products.length
  };

  const vendorCounts = getVendorCounts();

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout title="Vendor Optimization">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <User className="w-12 h-12 animate-pulse text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600 text-sm">Loading products for vendor optimization…</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Vendor Optimization">
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
              Vendor Optimization
            </p>
            <p className="text-[11.5px] text-gray-500 mt-px">
              Bulk update and manage product vendor names across your store
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
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Products Without Vendor</p>
                <p className="text-[22px] font-extrabold text-gray-900 leading-none">
                  {stats.missing} <span className="text-[12px] font-medium text-gray-400">/ {stats.total}</span>
                </p>
                <p className="text-[11px] font-semibold mt-1" style={{ color: stats.missing > 0 ? '#f59e0b' : '#12b76a' }}>
                  {stats.missing > 0 ? `⚠ ${stats.missing} missing vendor name` : '✓ All have vendors'}
                </p>
                <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(stats.missing / stats.total) * 100}%`, background: '#f59e0b' }} />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-[14px] p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Store Vendors</p>
                <p className="text-[22px] font-extrabold text-gray-900 leading-none">
                  {stats.unique} <span className="text-[12px] font-medium text-gray-400">vendors</span>
                </p>
                <p className="text-[11px] font-semibold mt-1 text-blue-600">Across all products</p>
                <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, stats.unique * 10)}%`, background: '#1a3faa' }} />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-[14px] p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Ready to Update</p>
                <p className="text-[22px] font-extrabold text-gray-900 leading-none">
                  {stats.changed} <span className="text-[12px] font-medium text-gray-400">products</span>
                </p>
                <p className="text-[11px] font-semibold mt-1 text-green-600">
                  {stats.changed > 0 ? `✓ ${stats.changed} new vendor set` : 'Set vendors to update'}
                </p>
                <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${(stats.changed / stats.total) * 100}%`, background: '#12b76a' }} />
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-[14px] p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Time Saved</p>
                <p className="text-[22px] font-extrabold text-gray-900 leading-none">
                  {stats.timeSaved} <span className="text-[12px] font-medium text-gray-400">min</span>
                </p>
                <p className="text-[11px] font-semibold mt-1 text-purple-600">⚡ Bulk update mode</p>
                <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, stats.timeSaved)}%`, background: '#7c3aed' }} />
                </div>
              </div>
            </div>

            {/* Section Header with Bulk Vendor Input */}
            <div className="bg-white border border-gray-200 rounded-[14px] p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Vendor Optimization</p>
                  <p className="text-[16px] font-extrabold text-gray-900">Change Vendor Name</p>
                  <p className="text-[12px] text-gray-500">
                    Type a new vendor name below to bulk-apply to all selected products, or set per-product using the table.
                  </p>
                </div>
              </div>
              
              {/* Bulk Vendor Input */}
              <div className="bulk-vendor-wrap flex items-center w-full lg:w-auto border border-gray-200 rounded-lg overflow-hidden bg-white focus-within:border-blue-500 transition-all">
                <div className="pl-3 pr-1">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={bulkVendorInput}
                  onChange={(e) => setBulkVendorInput(e.target.value)}
                  placeholder="Enter new vendor name for all selected…"
                  className="bulk-vendor-input flex-1 py-2 px-2 outline-none text-sm font-semibold min-w-[200px]"
                  list="vendor-suggestions"
                />
                <datalist id="vendor-suggestions">
                  {allVendors.map(vendor => (
                    <option key={vendor} value={vendor} />
                  ))}
                </datalist>
                <button
                  onClick={applyBulkVendor}
                  disabled={!bulkVendorInput.trim()}
                  className="btn-bulk-apply flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  Apply to All Selected
                </button>
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
                    placeholder="Search product title or vendor…"
                    className="flex-1 bg-transparent outline-none text-[12.5px] text-gray-900 placeholder:text-gray-300"
                  />
                </div>
                
                <select
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-[10px] text-[12.5px] font-semibold text-gray-600 bg-white outline-none focus:border-blue-500"
                >
                  <option value="">All Vendors</option>
                  {allVendors.map(vendor => (
                    <option key={vendor} value={vendor}>{vendor}</option>
                  ))}
                  <option value="—">— No Vendor</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-[10px] text-[12.5px] font-semibold text-gray-600 bg-white outline-none focus:border-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="changed">Changed</option>
                  <option value="pending">Pending</option>
                  <option value="same">Unchanged</option>
                </select>

                <div className="ml-auto">
                  <span className="text-[12px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                    {getVisibleProductIds().length} of {products.length}
                  </span>
                </div>
              </div>

              {/* Table Header */}
              <div className="grid px-4 py-2 bg-gray-50 border-b border-gray-200 text-[10.5px] font-bold text-gray-400 uppercase tracking-wider" style={{ gridTemplateColumns: "40px 40px 1fr 180px 200px 110px 80px", gap: 8 }}>
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
                <div>Current Vendor</div>
                <div>New Vendor</div>
                <div>Status</div>
                <div>Action</div>
              </div>

              {/* Table Body */}
              <div className="max-h-[400px] overflow-y-auto">
                {getVisibleProductIds().length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <User className="w-12 h-12 text-gray-200 mb-3" />
                    <p className="text-[13px] font-semibold text-gray-400">No products found</p>
                  </div>
                ) : (
                  getVisibleProductIds().map((productId, index) => {
                    const product = products.find(p => p.productId === productId)!;
                    const status = getProductStatus(productId);
                    const isSelected = selected.has(productId);
                    const currentVendor = product.vendor || 'No vendor';
                    const newVendor = newVendors[productId] || '';

                    return (
                      <div
                        key={productId}
                        className={`grid px-4 py-2.5 border-b border-gray-100 items-center hover:bg-blue-50/30 transition-colors last:border-b-0 ${
                          isSelected ? 'bg-blue-50' : ''
                        }`}
                        style={{ gridTemplateColumns: "40px 40px 1fr 180px 200px 110px 80px", gap: 8 }}
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

                        {/* Current Vendor */}
                        <div>
                          <div className="vendor-current inline-flex items-center gap-1 text-[11.5px] font-semibold px-3 py-1.5 rounded-[7px] bg-gray-100 text-gray-600 border border-gray-200 max-w-[170px] truncate">
                            <User className="w-3 h-3 flex-shrink-0 text-gray-400" />
                            <span className={!product.vendor ? 'text-gray-400 italic' : ''}>
                              {product.vendor || 'No vendor'}
                            </span>
                          </div>
                        </div>

                        {/* New Vendor ComboBox */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <ComboBox
                            value={newVendor}
                            onChange={(val) => handleVendorChange(productId, val)}
                            onFocus={() => setOpenComboId(productId)}
                            onBlur={() => setOpenComboId(null)}
                            isOpen={openComboId === productId}
                            suggestions={allVendors}
                            productCounts={vendorCounts}
                            placeholder="Choose or type vendor…"
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

                  {/* Apply Vendor Changes Button */}
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
                        Apply Vendor Changes
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
          <div className="floatbar fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[#0c1535] rounded-2xl px-5 py-3 flex items-center gap-4 shadow-2xl z-40 min-w-[500px]">
            <div className="fb-info flex-1">
              <div className="fb-title text-[13.5px] font-bold text-white">
                {getChangedCount()} vendor change{getChangedCount() > 1 ? 's' : ''} ready
              </div>
              <div className="fb-sub text-[11.5px] text-gray-400 mt-0.5">
                {getChangedCount()} product{getChangedCount() > 1 ? 's' : ''} will be updated in Shopify
              </div>
            </div>
            <button
              onClick={() => setShowApplyModal(true)}
              className="btn-fb flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-[13px] font-bold hover:-translate-y-0.5 transition-transform shadow-lg"
            >
              Apply Vendor Changes
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const fb = document.querySelector('.floatbar');
                fb?.classList.add('hidden');
              }}
              className="btn-fb-dismiss text-gray-400 text-[12px] font-semibold hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Apply Modal */}
        <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
          <DialogContent className="max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[17px]">
                <User className="w-5 h-5 text-blue-500" />
                Confirm Vendor Changes
              </DialogTitle>
              <DialogDescription className="text-[12px] text-gray-500">
                Review before applying to your Shopify store
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Will Update', value: getChangedCount(), color: '#12b76a' },
                  { label: 'Unchanged', value: products.length - getChangedCount(), color: '#94a3b8' },
                  { label: 'Total Products', value: products.length, color: '#1a3faa' }
                ].map((stat, idx) => (
                  <div key={idx} className="text-center bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="text-[24px] font-extrabold" style={{ color: stat.color }}>{stat.value}</div>
                    <p className="text-[10.5px] text-gray-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Changes List */}
              <div>
                <p className="text-[10.5px] font-bold text-gray-400 uppercase mb-2">Current Vendor → New Vendor</p>
                <div className="max-h-[230px] overflow-y-auto space-y-1.5">
                  {products
                    .filter(p => {
                      const newVendor = newVendors[p.productId]?.trim() || '';
                      const oldVendor = originalVendors[p.productId] || '';
                      return newVendor && newVendor !== oldVendor;
                    })
                    .map(p => {
                      const newVendor = newVendors[p.productId]!;
                      return (
                        <div
                          key={p.productId}
                          className="grid grid-cols-[1fr_22px_1fr] gap-2 items-center p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[11.5px]"
                        >
                          <div className="text-gray-600 font-semibold truncate">{p.vendor || 'No vendor'}</div>
                          <div className="text-blue-600 text-center">→</div>
                          <div className="text-green-700 font-bold truncate">{newVendor}</div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Note */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-[12px] text-green-700 leading-relaxed">
                <strong>ℹ️ Note:</strong> Only products where you've set a new vendor name will be updated. Products without changes will remain untouched.
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
                    Apply Vendor Changes
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
                ✅
              </div>
              <h3 className="text-[20px] font-extrabold text-gray-900 mb-2">Vendor Names Updated!</h3>
              <p className="text-[13px] text-gray-500 leading-relaxed">{successMsg}</p>
              <div className="success-tip mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-left">
                <p className="text-[12px] text-blue-700 leading-relaxed">
                  <strong>💡 Tip:</strong> Vendor names affect product filtering, collections, and storefront navigation. Changes reflect immediately on your store.
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
                    fetchAllVendors();
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