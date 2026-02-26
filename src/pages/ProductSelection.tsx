import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";
import {
  Search,
  ArrowRight,
  Package,
  Filter,
  Loader2,
  Calendar,
  Tag,
  Building,
  X,
  ChevronDown,
  LayoutGrid,
  List,
  Layers,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

// Types
interface Product {
  id: string;
  title: string;
  handle: string;
  status: string;
  vendor: string;
  productType: string;
  tags: string[];
  description: string;
  featuredMedia?: {
    preview: {
      image: {
        url: string;
      };
    };
  };
  priceRangeV2: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  totalInventory: number;
  variants: {
    edges: Array<{
      node: {
        sku: string | null;
      };
    }>;
  };
  category?: {
    id: string;
    name: string;
  };
}

interface Collection {
  id: string;
  title: string;
  productsCount: number;
}

interface FilterState {
  status?: string;
  collections: string[];
  searchField: string;
  searchQuery: string;
  vendors: string[];
  productTypes: string[];
  tags: string[];
  categories: string[];
  createdAfter?: Date;
  publishedAfter?: Date;
  updatedAfter?: Date;
}

interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
}

interface FilterChip {
  id: string;
  type: 'vendor' | 'collection' | 'tag' | 'productType' | 'category' | 'date';
  label: string;
  value: any;
  field: keyof FilterState;
}

interface DateFilterType {
  field: 'createdAfter' | 'publishedAfter' | 'updatedAfter';
  label: string;
}

const serviceTitles: Record<string, string> = {
  title: "Title Optimization",
  description: "Description Optimization",
  metaTitle: "Meta SEO Optimization",
  metaDescription: "Meta SEO Optimization",
  image: "Image Optimization",
  keywords: "Keywords Optimization",
};

const searchFields = [
  { value: "title", label: "Title" },
  { value: "handle", label: "Handle" },
  { value: "description", label: "Description" },
  { value: "vendor", label: "Vendor" },
  { value: "productType", label: "Type" },
  { value: "sku", label: "SKU" },
];

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
];

const dateFilters: DateFilterType[] = [
  { field: 'createdAfter', label: 'Created After' },
  { field: 'publishedAfter', label: 'Published After' },
  { field: 'updatedAfter', label: 'Updated After' },
];

const ITEMS_PER_PAGE = 40;

export default function ProductSelection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const service = searchParams.get("service") || "title";
  
  // View state
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAllOnPage, setSelectAllOnPage] = useState(false);
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<{id: string, title: string}[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Pagination
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [cursors, setCursors] = useState<string[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    collections: [],
    searchField: "title",
    searchQuery: "",
    vendors: [],
    productTypes: [],
    tags: [],
    categories: [],
  });

  // Active filter chips
  const [activeFilterChips, setActiveFilterChips] = useState<FilterChip[]>([]);
  
  // Available filter types for "More Filters"
  const [availableFilterTypes, setAvailableFilterTypes] = useState<{
    productTypes: boolean;
    categories: boolean;
    dates: boolean;
  }>({
    productTypes: false,
    categories: false,
    dates: false,
  });

  // Search states for dropdowns
  const [collectionSearch, setCollectionSearch] = useState("");
  const [vendorSearch, setVendorSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [productTypeSearch, setProductTypeSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Date picker states
  const [datePickerOpen, setDatePickerOpen] = useState<{
    createdAfter: boolean;
    publishedAfter: boolean;
    updatedAfter: boolean;
  }>({
    createdAfter: false,
    publishedAfter: false,
    updatedAfter: false,
  });

  // Refs for click outside
  const dropdownRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      let shouldClose = true;
      dropdownRefs.current.forEach((ref) => {
        if (ref.contains(event.target as Node)) {
          shouldClose = false;
        }
      });
      if (shouldClose) {
        setOpenDropdown(null);
        setCollectionSearch("");
        setVendorSearch("");
        setTagSearch("");
        setProductTypeSearch("");
        setCategorySearch("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch products with current filters
  const fetchProducts = useCallback(async (cursor?: string, direction: 'next' | 'prev' = 'next') => {
    try {
      setLoadingMore(true);
      const params: any = { 
        limit: ITEMS_PER_PAGE,
      };

      if (cursor) {
        if (direction === 'next') {
          params.after = cursor;
        } else {
          params.before = cursor;
        }
      }

      // Add all active filters
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.collections.length > 0) params.collections = filters.collections.join(',');
      if (filters.vendors.length > 0) params.vendors = filters.vendors.join(',');
      if (filters.productTypes.length > 0) params.productTypes = filters.productTypes.join(',');
      if (filters.tags.length > 0) params.tags = filters.tags.join(',');
      if (filters.categories.length > 0) params.categories = filters.categories.join(',');
      if (filters.createdAfter) params.createdAfter = filters.createdAfter.toISOString();
      if (filters.publishedAfter) params.publishedAfter = filters.publishedAfter.toISOString();
      if (filters.updatedAfter) params.updatedAfter = filters.updatedAfter.toISOString();
      if (filters.searchQuery) params[filters.searchField] = filters.searchQuery;

      const response = await getApi(ApiConfig.getProducts, params);
      
      setProducts(response.products.map((p: any) => p.node));
      setPageInfo(response.pageInfo);
      
      // Update cursors for pagination
      if (direction === 'next' && cursor) {
        setCursors(prev => [...prev, cursor]);
        setCurrentPageIndex(prev => prev + 1);
      } else if (direction === 'prev' && cursor) {
        setCursors(prev => prev.slice(0, -1));
        setCurrentPageIndex(prev => prev - 1);
      } else if (!cursor) {
        setCursors([]);
        setCurrentPageIndex(0);
      }
      
      setSelectedProducts([]);
      setSelectAllOnPage(false);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingMore(false);
      setLoading(false);
    }
  }, [filters]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        fetchProducts();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters.searchQuery, filters.searchField, filters.status, fetchProducts, loading]);

  // Update active filter chips when filters change
  useEffect(() => {
    const chips: FilterChip[] = [];
    
    filters.vendors.forEach(v => chips.push({ 
      id: `vendor-${v}`, 
      type: 'vendor', 
      label: v, 
      value: v,
      field: 'vendors' 
    }));
    
    filters.collections.forEach(c => {
      const collection = collections.find(col => col.id === c);
      if (collection) chips.push({ 
        id: `collection-${c}`, 
        type: 'collection', 
        label: collection.title, 
        value: c,
        field: 'collections' 
      });
    });
    
    filters.tags.forEach(t => chips.push({ 
      id: `tag-${t}`, 
      type: 'tag', 
      label: t, 
      value: t,
      field: 'tags' 
    }));
    
    filters.productTypes.forEach(p => chips.push({ 
      id: `productType-${p}`, 
      type: 'productType', 
      label: p, 
      value: p,
      field: 'productTypes' 
    }));
    
    filters.categories.forEach(c => {
      const category = categories.find(cat => cat.id === c);
      if (category) chips.push({ 
        id: `category-${c}`, 
        type: 'category', 
        label: category.title, 
        value: c,
        field: 'categories' 
      });
    });
    
    if (filters.createdAfter) chips.push({ 
      id: 'createdAfter', 
      type: 'date', 
      label: `Created: ${format(filters.createdAfter, 'MM/dd/yyyy')}`, 
      value: 'createdAfter',
      field: 'createdAfter' 
    });
    
    if (filters.publishedAfter) chips.push({ 
      id: 'publishedAfter', 
      type: 'date', 
      label: `Published: ${format(filters.publishedAfter, 'MM/dd/yyyy')}`, 
      value: 'publishedAfter',
      field: 'publishedAfter' 
    });
    
    if (filters.updatedAfter) chips.push({ 
      id: 'updatedAfter', 
      type: 'date', 
      label: `Updated: ${format(filters.updatedAfter, 'MM/dd/yyyy')}`, 
      value: 'updatedAfter',
      field: 'updatedAfter' 
    });
    
    setActiveFilterChips(chips);
  }, [filters, collections, categories]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Fetch products with initial filters
      await fetchProducts();

      // Fetch filter options in parallel
      const [collectionsRes, vendorsRes, typesRes, tagsRes, categoriesRes] = await Promise.all([
        getApi(ApiConfig.getCollections),
        getApi(ApiConfig.getVendors),
        getApi(ApiConfig.getProductType),
        getApi(ApiConfig.getTags),
        getApi(ApiConfig.getCategories),
      ]);

      setCollections(collectionsRes.collections || []);
      setVendors(vendorsRes.vendors || []);
      setProductTypes(typesRes.productTypes || []);
      setTags(tagsRes.tags || []);
      setCategories(categoriesRes.categories || []);

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (pageInfo?.hasNextPage && pageInfo.endCursor) {
      fetchProducts(pageInfo.endCursor, 'next');
    }
  };

  const handlePrevPage = () => {
    const prevCursor = cursors[currentPageIndex - 1];
    if (prevCursor) {
      fetchProducts(prevCursor, 'prev');
    }
  };

  const handleFirstPage = () => {
    if (currentPageIndex > 0) {
      setCursors([]);
      setCurrentPageIndex(0);
      fetchProducts();
    }
  };

  const toggleFilterSelection = (type: keyof FilterState, value: string, currentValues: string[]) => {
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    setFilters(prev => ({ ...prev, [type]: newValues }));
    
    // Trigger product fetch immediately
    setTimeout(() => {
      fetchProducts();
    }, 0);
  };

  const removeFilterChip = (chip: FilterChip) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (chip.field === 'vendors' || chip.field === 'collections' || 
          chip.field === 'tags' || chip.field === 'productTypes' || 
          chip.field === 'categories') {
        newFilters[chip.field] = (prev[chip.field] as string[]).filter(v => v !== chip.value);
      } else if (chip.field === 'createdAfter' || chip.field === 'publishedAfter' || 
                 chip.field === 'updatedAfter') {
        newFilters[chip.field] = undefined;
      }
      
      return newFilters;
    });
    
    // Trigger product fetch immediately
    setTimeout(() => {
      fetchProducts();
    }, 0);
  };

  const clearAllFilters = () => {
    setFilters({
      status: "all",
      collections: [],
      searchField: "title",
      searchQuery: "",
      vendors: [],
      productTypes: [],
      tags: [],
      categories: [],
    });
    fetchProducts();
  };

  const addFilterType = (type: 'productTypes' | 'categories' | 'dates') => {
    setAvailableFilterTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
    setOpenDropdown(null);
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleAllOnPage = () => {
    if (selectAllOnPage) {
      setSelectedProducts(prev => 
        prev.filter(id => !products.map(p => p.id).includes(id))
      );
    } else {
      const pageProductIds = products.map(p => p.id);
      setSelectedProducts(prev => [...new Set([...prev, ...pageProductIds])]);
    }
    setSelectAllOnPage(!selectAllOnPage);
  };

  const selectAllFiltered = () => {
    // This would need a backend endpoint to get all filtered product IDs
    // For now, we'll just select all on current page
    toggleAllOnPage();
  };

  const handleContinue = async () => {
    if (selectedProducts.length > 0) {
      try {
        await postApi(ApiConfig.storeProduct, {
          serviceName: service,
          productIds: selectedProducts
        });
        navigate(`/${service}-optimization?products=${selectedProducts.join(",")}`);
      } catch (error) {
        console.error('Error storing products:', error);
      }
    }
  };

  const formatPrice = (amount: string, currencyCode: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(parseFloat(amount));
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'draft': return 'bg-amber-100 text-amber-700';
      case 'archived': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredCollections = useMemo(() => {
    return collections.filter(c => 
      c.title.toLowerCase().includes(collectionSearch.toLowerCase())
    );
  }, [collections, collectionSearch]);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => 
      v.toLowerCase().includes(vendorSearch.toLowerCase())
    );
  }, [vendors, vendorSearch]);

  const filteredTagsList = useMemo(() => {
    return tags.filter(t => 
      t.toLowerCase().includes(tagSearch.toLowerCase())
    );
  }, [tags, tagSearch]);

  const filteredProductTypes = useMemo(() => {
    return productTypes.filter(t => 
      t.toLowerCase().includes(productTypeSearch.toLowerCase())
    );
  }, [productTypes, productTypeSearch]);

  const filteredCategories = useMemo(() => {
    return categories.filter(c => 
      c.title.toLowerCase().includes(categorySearch.toLowerCase())
    );
  }, [categories, categorySearch]);

  const totalPages = Math.ceil((products.length || 1) / ITEMS_PER_PAGE);

  return (
    <AppLayout>
      <div className="min-h-screen font-['DM_Sans'] bg-[#f5f4f1]">
        <div className="p-7">
          {/* Page Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-[22px] font-bold text-[#1a1917]">Select Products</h1>
              <p className="text-[13.5px] text-[#6b6862] mt-1">
                Choose products to optimize with {serviceTitles[service] || "AI"}
              </p>
            </div>
            <Button
              onClick={handleContinue}
              disabled={selectedProducts.length === 0}
              className="bg-[#6046ff] hover:bg-[#4f38d4] text-white rounded-lg px-5 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all hover:-translate-y-0.5"
            >
              Continue to Optimization
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Filter Panel */}
          <div className="bg-white border border-[#e2e0db] rounded-xl p-5 mb-4">
            {/* Search and Filter Chips */}
            <div className="space-y-3">
              {/* Search Row */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 border border-[#e2e0db] rounded-lg px-3 py-2 bg-[#f5f4f1] flex-1">
                  <Search className="w-3.5 h-3.5 text-[#9e9b95]" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={filters.searchQuery}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                    className="bg-transparent border-none outline-none text-[13px] text-[#1a1917] placeholder-[#9e9b95] flex-1"
                  />
                </div>
                
                <select
                  value={filters.searchField}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchField: e.target.value }))}
                  className="border border-[#e2e0db] rounded-lg px-3 py-2 text-[13px] bg-white outline-none"
                >
                  {searchFields.map(field => (
                    <option key={field.value} value={field.value}>{field.label}</option>
                  ))}
                </select>

                {/* View Toggle */}
                <div className="flex border border-[#e2e0db] rounded-lg overflow-hidden">
                  <button
                    className={cn(
                      "p-2 border-r border-[#e2e0db] transition-colors",
                      viewMode === "list" ? "bg-[#1a1917] text-white" : "bg-white text-[#9e9b95] hover:bg-[#f5f4f1]"
                    )}
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    className={cn(
                      "p-2 transition-colors",
                      viewMode === "grid" ? "bg-[#1a1917] text-white" : "bg-white text-[#9e9b95] hover:bg-[#f5f4f1]"
                    )}
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Filter Chips Row - Scrollable */}
              <div className="flex items-center gap-2 pb-2 scrollbar-thin scrollbar-thumb-[#e2e0db]">
                {/* Collections Filter */}
                <div className="relative flex-shrink-0" ref={el => el && dropdownRefs.current.set('collections', el)}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'collections' ? null : 'collections')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
                      filters.collections.length > 0
                        ? "border-[#6046ff] text-[#6046ff] bg-[#ede9ff]"
                        : "border-[#e2e0db] text-[#6b6862] hover:border-[#6046ff] hover:text-[#6046ff] hover:bg-[#ede9ff]"
                    )}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Collections {filters.collections.length > 0 && `(${filters.collections.length})`}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  
                  {openDropdown === 'collections' && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#e2e0db] rounded-xl shadow-lg min-w-[280px] max-h-96 overflow-hidden">
                      <div className="p-2 border-b border-[#e2e0db] sticky top-0 bg-white">
                        <div className="flex items-center gap-2 px-2 py-1 bg-[#f5f4f1] rounded-lg">
                          <Search className="w-3.5 h-3.5 text-[#9e9b95]" />
                          <input
                            type="text"
                            placeholder="Search collections..."
                            value={collectionSearch}
                            onChange={(e) => setCollectionSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-[13px] text-[#1a1917] placeholder-[#9e9b95] flex-1"
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2">
                        {filteredCollections.map((collection) => (
                          <div
                            key={collection.id}
                            onClick={() => toggleFilterSelection('collections', collection.id, filters.collections)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#ede9ff] cursor-pointer"
                          >
                            <Checkbox
                              checked={filters.collections.includes(collection.id)}
                              className="h-4 w-4 border-[#c8c5be] data-[state=checked]:bg-[#6046ff]"
                            />
                            <span className="flex-1 text-[13px] font-medium">{collection.title}</span>
                            <span className="text-[11px] bg-[#f0ede8] text-[#6b6862] px-2 py-1 rounded-full">
                              {collection.productsCount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Vendors Filter */}
                <div className="relative flex-shrink-0" ref={el => el && dropdownRefs.current.set('vendors', el)}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'vendors' ? null : 'vendors')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
                      filters.vendors.length > 0
                        ? "border-[#6046ff] text-[#6046ff] bg-[#ede9ff]"
                        : "border-[#e2e0db] text-[#6b6862] hover:border-[#6046ff] hover:text-[#6046ff] hover:bg-[#ede9ff]"
                    )}
                  >
                    <Building className="w-3.5 h-3.5" />
                    Vendors {filters.vendors.length > 0 && `(${filters.vendors.length})`}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  
                  {openDropdown === 'vendors' && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#e2e0db] rounded-xl shadow-lg min-w-[240px] max-h-96 overflow-hidden">
                      <div className="p-2 border-b border-[#e2e0db] sticky top-0 bg-white">
                        <div className="flex items-center gap-2 px-2 py-1 bg-[#f5f4f1] rounded-lg">
                          <Search className="w-3.5 h-3.5 text-[#9e9b95]" />
                          <input
                            type="text"
                            placeholder="Search vendors..."
                            value={vendorSearch}
                            onChange={(e) => setVendorSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-[13px] text-[#1a1917] placeholder-[#9e9b95] flex-1"
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2">
                        {filteredVendors.map((vendor) => (
                          <div
                            key={vendor}
                            onClick={() => toggleFilterSelection('vendors', vendor, filters.vendors)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#ede9ff] cursor-pointer"
                          >
                            <Checkbox
                              checked={filters.vendors.includes(vendor)}
                              className="h-4 w-4 border-[#c8c5be] data-[state=checked]:bg-[#6046ff]"
                            />
                            <span className="text-[13px] font-medium">{vendor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags Filter */}
                <div className="relative flex-shrink-0" ref={el => el && dropdownRefs.current.set('tags', el)}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'tags' ? null : 'tags')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
                      filters.tags.length > 0
                        ? "border-[#6046ff] text-[#6046ff] bg-[#ede9ff]"
                        : "border-[#e2e0db] text-[#6b6862] hover:border-[#6046ff] hover:text-[#6046ff] hover:bg-[#ede9ff]"
                    )}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    Tags {filters.tags.length > 0 && `(${filters.tags.length})`}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  
                  {openDropdown === 'tags' && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#e2e0db] rounded-xl shadow-lg min-w-[240px] max-h-96 overflow-hidden">
                      <div className="p-2 border-b border-[#e2e0db] sticky top-0 bg-white">
                        <div className="flex items-center gap-2 px-2 py-1 bg-[#f5f4f1] rounded-lg">
                          <Search className="w-3.5 h-3.5 text-[#9e9b95]" />
                          <input
                            type="text"
                            placeholder="Search tags..."
                            value={tagSearch}
                            onChange={(e) => setTagSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-[13px] text-[#1a1917] placeholder-[#9e9b95] flex-1"
                          />
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto p-2">
                        {filteredTagsList.map((tag) => (
                          <div
                            key={tag}
                            onClick={() => toggleFilterSelection('tags', tag, filters.tags)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#ede9ff] cursor-pointer"
                          >
                            <Checkbox
                              checked={filters.tags.includes(tag)}
                              className="h-4 w-4 border-[#c8c5be] data-[state=checked]:bg-[#6046ff]"
                            />
                            <span className="text-[13px] font-medium">{tag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Types Filter (conditional) */}
                {availableFilterTypes.productTypes && (
                  <div className="relative flex-shrink-0" ref={el => el && dropdownRefs.current.set('productTypes', el)}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === 'productTypes' ? null : 'productTypes')}
                      className="flex items-center gap-1.5 px-3 py-2 border border-[#6046ff] rounded-lg text-[13px] font-medium text-[#6046ff] bg-[#ede9ff] whitespace-nowrap"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      Product Types {filters.productTypes.length > 0 && `(${filters.productTypes.length})`}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    
                    {openDropdown === 'productTypes' && (
                      <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#e2e0db] rounded-xl shadow-lg min-w-[240px] max-h-96 overflow-hidden">
                        <div className="p-2 border-b border-[#e2e0db] sticky top-0 bg-white">
                          <div className="flex items-center gap-2 px-2 py-1 bg-[#f5f4f1] rounded-lg">
                            <Search className="w-3.5 h-3.5 text-[#9e9b95]" />
                            <input
                              type="text"
                              placeholder="Search product types..."
                              value={productTypeSearch}
                              onChange={(e) => setProductTypeSearch(e.target.value)}
                              className="bg-transparent border-none outline-none text-[13px] text-[#1a1917] placeholder-[#9e9b95] flex-1"
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-2">
                          {filteredProductTypes.map((type) => (
                            <div
                              key={type}
                              onClick={() => toggleFilterSelection('productTypes', type, filters.productTypes)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#ede9ff] cursor-pointer"
                            >
                              <Checkbox
                                checked={filters.productTypes.includes(type)}
                                className="h-4 w-4 border-[#c8c5be] data-[state=checked]:bg-[#6046ff]"
                              />
                              <span className="text-[13px] font-medium">{type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Categories Filter (conditional) */}
                {availableFilterTypes.categories && (
                  <div className="relative flex-shrink-0" ref={el => el && dropdownRefs.current.set('categories', el)}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === 'categories' ? null : 'categories')}
                      className="flex items-center gap-1.5 px-3 py-2 border border-[#6046ff] rounded-lg text-[13px] font-medium text-[#6046ff] bg-[#ede9ff] whitespace-nowrap"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Categories {filters.categories.length > 0 && `(${filters.categories.length})`}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    
                    {openDropdown === 'categories' && (
                      <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#e2e0db] rounded-xl shadow-lg min-w-[240px] max-h-96 overflow-hidden">
                        <div className="p-2 border-b border-[#e2e0db] sticky top-0 bg-white">
                          <div className="flex items-center gap-2 px-2 py-1 bg-[#f5f4f1] rounded-lg">
                            <Search className="w-3.5 h-3.5 text-[#9e9b95]" />
                            <input
                              type="text"
                              placeholder="Search categories..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              className="bg-transparent border-none outline-none text-[13px] text-[#1a1917] placeholder-[#9e9b95] flex-1"
                            />
                          </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-2">
                          {filteredCategories.map((category) => (
                            <div
                              key={category.id}
                              onClick={() => toggleFilterSelection('categories', category.id, filters.categories)}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#ede9ff] cursor-pointer"
                            >
                              <Checkbox
                                checked={filters.categories.includes(category.id)}
                                className="h-4 w-4 border-[#c8c5be] data-[state=checked]:bg-[#6046ff]"
                              />
                              <span className="text-[13px] font-medium">{category.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Date Filters (conditional) */}
                {availableFilterTypes.dates && (
                  <>
                    {dateFilters.map((dateFilter) => (
                      <div key={dateFilter.field} className="relative flex-shrink-0">
                        <Popover open={datePickerOpen[dateFilter.field]} onOpenChange={(open) => 
                          setDatePickerOpen(prev => ({ ...prev, [dateFilter.field]: open }))
                        }>
                          <PopoverTrigger asChild>
                            <button
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
                                filters[dateFilter.field]
                                  ? "border-[#6046ff] text-[#6046ff] bg-[#ede9ff]"
                                  : "border-[#e2e0db] text-[#6b6862] hover:border-[#6046ff] hover:text-[#6046ff] hover:bg-[#ede9ff]"
                              )}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              {dateFilter.label}
                              {filters[dateFilter.field] && (
                                <span className="ml-1">
                                  ({format(filters[dateFilter.field]!, 'MM/dd/yyyy')})
                                </span>
                              )}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={filters[dateFilter.field]}
                              onSelect={(date) => {
                                setFilters(prev => ({ ...prev, [dateFilter.field]: date }));
                                setDatePickerOpen(prev => ({ ...prev, [dateFilter.field]: false }));
                                setTimeout(() => fetchProducts(), 0);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    ))}
                  </>
                )}

                {/* More Filters Button */}
                <div className="relative flex-shrink-0">
                  <Popover open={openDropdown === 'more'} onOpenChange={(open) => setOpenDropdown(open ? 'more' : null)}>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-1.5 px-3 py-2 border border-[#e2e0db] rounded-lg text-[13px] font-medium text-[#6b6862] hover:border-[#6046ff] hover:text-[#6046ff] hover:bg-[#ede9ff] transition-all whitespace-nowrap">
                        <Plus className="w-3.5 h-3.5" />
                        More Filters
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2" align="start">
                      <div className="space-y-1">
                        <button
                          onClick={() => addFilterType('productTypes')}
                          className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#ede9ff] rounded-lg transition-colors"
                        >
                          Product Types
                        </button>
                        <button
                          onClick={() => addFilterType('categories')}
                          className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#ede9ff] rounded-lg transition-colors"
                        >
                          Categories
                        </button>
                        <button
                          onClick={() => addFilterType('dates')}
                          className="w-full text-left px-3 py-2 text-[13px] hover:bg-[#ede9ff] rounded-lg transition-colors"
                        >
                          Date Filters
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Active Filter Chips */}
              {activeFilterChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#e2e0db]">
                  {activeFilterChips.map((chip) => (
                    <div
                      key={chip.id}
                      className="flex items-center gap-1.5 px-2 py-1 bg-[#ede9ff] text-[#6046ff] rounded-lg text-[12px] font-medium"
                    >
                      <span>{chip.label}</span>
                      <button
                        onClick={() => removeFilterChip(chip)}
                        className="hover:text-[#4f38d4]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {activeFilterChips.length > 0 && (
                    <button
                      onClick={clearAllFilters}
                      className="text-[12px] text-[#6b6862] hover:text-[#1a1917] underline"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#e2e0db] rounded-xl">
              <Loader2 className="w-12 h-12 animate-spin text-[#6046ff] mb-4" />
              <h3 className="text-lg font-medium text-[#1a1917]">Loading products...</h3>
              <p className="text-sm text-[#6b6862] mt-1">Fetching your Shopify store data</p>
            </div>
          ) : (
            <>
              {/* Product Table/Grid */}
              <div className="bg-white border border-[#e2e0db] rounded-xl overflow-hidden">
                {/* Table Meta with Pagination */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#e2e0db]">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectAllOnPage}
                        onCheckedChange={toggleAllOnPage}
                        className="h-4 w-4 border-[#c8c5be] data-[state=checked]:bg-[#6046ff]"
                      />
                      <span className="text-[12.5px] text-[#6b6862]">
                        Select all on page ({products.length})
                      </span>
                    </div>
                    <button
                      onClick={selectAllFiltered}
                      className="text-[12.5px] text-[#6046ff] font-medium hover:underline"
                    >
                      Select all filtered
                    </button>
                    {selectedProducts.length > 0 && (
                      <>
                        <span className="text-[12.5px] text-[#6b6862]">
                          {selectedProducts.length} selected
                        </span>
                        <button
                          onClick={() => setSelectedProducts([])}
                          className="text-[12.5px] text-[#6046ff] font-medium hover:underline"
                        >
                          Clear
                        </button>
                      </>
                    )}
                  </div>
                  
                  {/* Pagination Controls */}
                  <div className="flex items-center gap-3">
                    <span className="text-[12.5px] text-[#6b6862]">
                      Page {currentPageIndex + 1} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleFirstPage}
                        disabled={currentPageIndex === 0 || loadingMore}
                        className="p-1.5 rounded border border-[#e2e0db] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f5f4f1]"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPageIndex === 0 || loadingMore}
                        className="p-1.5 rounded border border-[#e2e0db] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f5f4f1]"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={!pageInfo?.hasNextPage || loadingMore}
                        className="p-1.5 rounded border border-[#e2e0db] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f5f4f1]"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={!pageInfo?.hasNextPage || loadingMore}
                        className="p-1.5 rounded border border-[#e2e0db] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f5f4f1]"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                    {loadingMore && <Loader2 className="w-4 h-4 animate-spin text-[#6046ff]" />}
                  </div>
                </div>

                {/* Table Header (List View) */}
                {viewMode === "list" && (
                  <div className="grid grid-cols-[40px_56px_1fr_100px_110px_80px_70px] items-center px-5 py-2.5 bg-[#f5f4f1] border-b border-[#e2e0db] text-[12px] font-semibold text-[#9e9b95] uppercase tracking-wider">
                    <div></div>
                    <div>Image</div>
                    <div>Product</div>
                    <div>Price</div>
                    <div>Collection</div>
                    <div>Stock</div>
                    <div>Status</div>
                  </div>
                )}

                {/* Products */}
                {viewMode === "list" ? (
                  <div className="divide-y divide-[#e2e0db]">
                    {products.map((product, index) => {
                      const isSelected = selectedProducts.includes(product.id);
                      const variant = product.variants.edges[0]?.node;
                      const sku = variant?.sku || 'No SKU';
                      const imageUrl = product.featuredMedia?.preview.image.url || 
                        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop';
                      const price = formatPrice(
                        product.priceRangeV2.minVariantPrice.amount,
                        product.priceRangeV2.minVariantPrice.currencyCode
                      );
                      const collection = collections.find(c => c.id === product.category?.id);

                      return (
                        <div
                          key={product.id}
                          onClick={() => toggleProduct(product.id)}
                          className={cn(
                            "grid grid-cols-[40px_56px_1fr_100px_110px_80px_70px] items-center px-5 py-3 cursor-pointer transition-all hover:bg-[#f5f4f1]",
                            isSelected && "bg-[#ede9ff] hover:bg-[#ede9ff]"
                          )}
                        >
                          <div>
                            <Checkbox 
                              checked={isSelected} 
                              className="h-4 w-4 border-[#c8c5be] data-[state=checked]:bg-[#6046ff]"
                            />
                          </div>
                          <div>
                            <img
                              src={imageUrl}
                              alt={product.title}
                              className="w-10 h-10 rounded-lg object-cover bg-[#f0ede8]"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13.5px] font-medium text-[#1a1917] truncate max-w-[380px]">
                              {product.title}
                            </div>
                            <div className="text-[12px] text-[#9e9b95] mt-0.5">
                              {sku} • {product.productType}
                            </div>
                            {collection && (
                              <span className="inline-block bg-[#f0ede8] text-[#6b6862] text-[11px] font-medium px-2 py-0.5 rounded mt-1">
                                {collection.title}
                              </span>
                            )}
                          </div>
                          <div className="font-mono font-semibold text-[13.5px]">
                            {price}
                          </div>
                          <div className="text-[13px] text-[#6b6862]">
                            {collection?.title || '-'}
                          </div>
                          <div className="text-[13px] text-[#6b6862]">
                            {product.totalInventory} in stock
                          </div>
                          <div>
                            <span className={cn(
                              "inline-block px-2.5 py-1 rounded-full text-[11.5px] font-semibold",
                              getStatusBadgeClass(product.status)
                            )}>
                              {product.status.toLowerCase()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5">
                    {products.map((product) => {
                      const isSelected = selectedProducts.includes(product.id);
                      const imageUrl = product.featuredMedia?.preview.image.url || 
                        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop';
                      const price = formatPrice(
                        product.priceRangeV2.minVariantPrice.amount,
                        product.priceRangeV2.minVariantPrice.currencyCode
                      );

                      return (
                        <div
                          key={product.id}
                          onClick={() => toggleProduct(product.id)}
                          className={cn(
                            "border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
                            isSelected
                              ? "border-[#6046ff] bg-[#ede9ff]"
                              : "border-[#e2e0db] hover:border-[#6046ff]"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox 
                              checked={isSelected} 
                              className="h-4 w-4 border-[#c8c5be] data-[state=checked]:bg-[#6046ff]"
                            />
                            <img
                              src={imageUrl}
                              alt={product.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          </div>
                          <h4 className="font-medium text-[#1a1917] mt-3 line-clamp-2 text-sm">
                            {product.title}
                          </h4>
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-bold text-[#1a1917]">{price}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-semibold",
                              getStatusBadgeClass(product.status)
                            )}>
                              {product.status.toLowerCase()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty State */}
                {products.length === 0 && (
                  <div className="text-center py-16">
                    <Package className="w-16 h-16 text-[#9e9b95] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#1a1917]">No products found</h3>
                    <p className="text-sm text-[#6b6862] mt-2 mb-6 max-w-md mx-auto">
                      Try adjusting your filters or search query
                    </p>
                    <Button variant="outline" onClick={clearAllFilters}>
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Selection Bar */}
      <div
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1a1917] text-white rounded-xl px-5 py-3.5 flex items-center gap-5 shadow-2xl transition-all duration-300 z-50",
          selectedProducts.length > 0 ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-5 pointer-events-none"
        )}
      >
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold">{selectedProducts.length} selected</span>
          <span className="text-sm text-white/60"> • Ready for {serviceTitles[service]}</span>
        </div>
        <button
          onClick={handleContinue}
          className="flex items-center gap-1.5 bg-[#6046ff] hover:bg-[#4f38d4] rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
        >
          Continue to Optimization
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => setSelectedProducts([])}
          className="text-sm text-white/50 hover:text-white transition-colors"
        >
          Clear
        </button>
      </div>
    </AppLayout>
  );
}