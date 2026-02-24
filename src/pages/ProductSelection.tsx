import { useState, useMemo, useEffect, useRef } from "react";
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
  Grid3x3,
  X,
  ChevronDown,
  LayoutGrid,
  List,
  Box,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/DatePicker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Types based on API response
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
    id: string;
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
    maxVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  createdAt: string;
  publishedAt: string;
  updatedAt: string;
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
    fullName: string;
  };
}

interface Collection {
  id: string;
  title: string;
  handle: string;
  productsCount: number;
}

interface Category {
  id: string;
  name: string;
  fullName: string;
}

interface FilterState {
  status: string;
  type: string;
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
  endCursor: string;
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

export default function ProductSelection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const service = searchParams.get("service") || "title";
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [applyingFilters, setApplyingFilters] = useState(false);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const [activeCollection, setActiveCollection] = useState<Collection | null>(null);

  const collectionChipRef = useRef<HTMLButtonElement>(null);
  const vendorChipRef = useRef<HTMLButtonElement>(null);
  const collectionDropdownRef = useRef<HTMLDivElement>(null);
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    type: "all",
    collections: [],
    searchField: "title",
    searchQuery: "",
    vendors: [],
    productTypes: [],
    tags: [],
    categories: [],
  });

  const [tagSearch, setTagSearch] = useState("");

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (collectionDropdownRef.current && !collectionDropdownRef.current.contains(event.target as Node) &&
          collectionChipRef.current && !collectionChipRef.current.contains(event.target as Node)) {
        setShowCollectionDropdown(false);
      }
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node) &&
          vendorChipRef.current && !vendorChipRef.current.contains(event.target as Node)) {
        setShowVendorDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchInitialData = async (reset = true) => {
    try {
      setLoading(true);
      
      const productsRes = await getApi(ApiConfig.getProducts, { 
        limit: 20 
      });
      
      const productsData = productsRes.products.map((p: any) => p.node);
      setProducts(productsData);
      setPageInfo(productsRes.pageInfo);
      setCurrentPage(1);

      const collectionsRes = await getApi(ApiConfig.getCollections);
      setCollections(collectionsRes.collections || []);

      const vendorsRes = await getApi(ApiConfig.getVendors);
      setVendors(vendorsRes.vendors || []);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreProducts = async () => {
    if (!pageInfo?.hasNextPage || loadingMore) return;

    try {
      setLoadingMore(true);
      const params: any = {
        limit: 20,
        cursor: pageInfo.endCursor,
      };

      if (filters.status !== 'all') params.status = filters.status;
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.collections.length > 0) params.collections = filters.collections.join(',');
      if (filters.vendors.length > 0) params.vendors = filters.vendors.join(',');
      if (filters.productTypes.length > 0) params.productTypes = filters.productTypes.join(',');
      if (filters.tags.length > 0) params.tags = filters.tags.join(',');
      if (filters.categories.length > 0) params.categories = filters.categories.join(',');
      if (filters.createdAfter) params.createdAfter = filters.createdAfter.toISOString();
      if (filters.publishedAfter) params.publishedAfter = filters.publishedAfter.toISOString();
      if (filters.updatedAfter) params.updatedAfter = filters.updatedAfter.toISOString();
      if (filters.searchQuery) {
        params[filters.searchField] = filters.searchQuery;
      }

      const productsRes = await getApi(ApiConfig.getProducts, params);
      const newProducts = productsRes.products.map((p: any) => p.node);
      
      setProducts(prev => [...prev, ...newProducts]);
      setPageInfo(productsRes.pageInfo);
      setCurrentPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more products:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const applyFilters = async () => {
    try {
      setApplyingFilters(true);
      const params: any = { limit: 20 };

      if (filters.status !== 'all') params.status = filters.status;
      if (filters.type !== 'all') params.type = filters.type;
      if (filters.collections.length > 0) params.collections = filters.collections.join(',');
      if (filters.vendors.length > 0) params.vendors = filters.vendors.join(',');
      if (filters.productTypes.length > 0) params.productTypes = filters.productTypes.join(',');
      if (filters.tags.length > 0) params.tags = filters.tags.join(',');
      if (filters.categories.length > 0) params.categories = filters.categories.join(',');
      if (filters.createdAfter) params.createdAfter = filters.createdAfter.toISOString();
      if (filters.publishedAfter) params.publishedAfter = filters.publishedAfter.toISOString();
      if (filters.updatedAfter) params.updatedAfter = filters.updatedAfter.toISOString();
      if (filters.searchQuery) {
        params[filters.searchField] = filters.searchQuery;
      }

      const filteredRes = await getApi(ApiConfig.getProducts, params);
      const filteredData = filteredRes.products.map((p: any) => p.node);
      setProducts(filteredData);
      setPageInfo(filteredRes.pageInfo);
      setSelectedProducts([]);
      setCurrentPage(1);
      setFilterOpen(false);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setApplyingFilters(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      status: "all",
      type: "all",
      collections: [],
      searchField: "title",
      searchQuery: "",
      vendors: [],
      productTypes: [],
      tags: [],
      categories: [],
    });
    setActiveCollection(null);
    fetchInitialData();
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = filters.searchQuery ? 
        product[filters.searchField as keyof Product]?.toString().toLowerCase().includes(filters.searchQuery.toLowerCase()) : true;
      
      const matchesStatus = filters.status === "all" || 
        product.status.toLowerCase() === filters.status.toLowerCase();
      
      const matchesType = filters.type === "all" || product.productType === filters.type;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [products, filters]);

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    }
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

  const getProductTypes = useMemo(() => {
    const types = new Set(products.map(p => p.productType).filter(Boolean));
    return Array.from(types);
  }, [products]);

  const getAllTags = useMemo(() => {
    const tags = new Set(products.flatMap(p => p.tags).filter(Boolean));
    return Array.from(tags);
  }, [products]);

  const filteredTags = useMemo(() => {
    if (!tagSearch) return getAllTags;
    return getAllTags.filter(tag => 
      tag.toLowerCase().includes(tagSearch.toLowerCase())
    );
  }, [getAllTags, tagSearch]);

  const getCategories = useMemo(() => {
    const cats = new Map<string, Category>();
    products.forEach(p => {
      if (p.category) {
        cats.set(p.category.id, p.category);
      }
    });
    return Array.from(cats.values());
  }, [products]);

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

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.type !== 'all') count++;
    if (filters.collections.length > 0) count++;
    if (filters.vendors.length > 0) count++;
    if (filters.productTypes.length > 0) count++;
    if (filters.tags.length > 0) count++;
    if (filters.categories.length > 0) count++;
    if (filters.createdAfter) count++;
    if (filters.publishedAfter) count++;
    if (filters.updatedAfter) count++;
    if (filters.searchQuery) count++;
    return count;
  };

  const selectCollection = (collection: Collection) => {
    setActiveCollection(collection);
    setFilters(prev => ({ ...prev, collections: [collection.id] }));
    setShowCollectionDropdown(false);
  };

  const selectVendor = (vendor: string) => {
    setFilters(prev => ({ ...prev, vendors: [vendor] }));
    setShowVendorDropdown(false);
  };

  return (
    <AppLayout>
      <div className="min-h-screen font-['DM_Sans']">

        {/* Main Content */}
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
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 mb-4">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilters(prev => ({ ...prev, status: option.value }))}
                  className={cn(
                    "px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all",
                    filters.status === option.value
                      ? "bg-[#1a1917] text-white border-[#1a1917]"
                      : "border border-[#e2e0db] bg-transparent text-[#6b6862] hover:border-[#c8c5be] hover:text-[#1a1917]"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Search and Filter Chips */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 border border-[#e2e0db] rounded-lg px-3 py-2 bg-[#f5f4f1] flex-1 max-w-[340px]">
                <Search className="w-3.5 h-3.5 text-[#9e9b95]" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="bg-transparent border-none outline-none text-[13px] text-[#1a1917] placeholder-[#9e9b95] flex-1"
                />
              </div>

              {/* Vendors Filter Chip */}
              <div className="relative">
                <button
                  ref={vendorChipRef}
                  onClick={() => setShowVendorDropdown(!showVendorDropdown)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[13px] font-medium transition-all",
                    filters.vendors.length > 0
                      ? "border-[#6046ff] text-[#6046ff] bg-[#ede9ff]"
                      : "border-[#e2e0db] text-[#6b6862] hover:border-[#6046ff] hover:text-[#6046ff] hover:bg-[#ede9ff]"
                  )}
                >
                  <Building className="w-3.5 h-3.5" />
                  Vendors
                  <ChevronDown className="w-3 h-3" />
                </button>
                
                {showVendorDropdown && (
                  <div
                    ref={vendorDropdownRef}
                    className="fixed z-50 bg-white border border-[#e2e0db] rounded-xl shadow-lg min-w-[240px] overflow-hidden"
                    style={{
                      top: (vendorChipRef.current?.getBoundingClientRect().bottom || 0) + 6,
                      left: vendorChipRef.current?.getBoundingClientRect().left,
                    }}
                  >
                    <div className="max-h-80 overflow-y-auto">
                      <div
                        onClick={() => selectVendor('')}
                        className="flex items-center justify-between px-4 py-2.5 text-[13.5px] hover:bg-[#ede9ff] cursor-pointer border-b border-[#e2e0db]"
                      >
                        <span className="text-[#6b6862]">No vendor selected</span>
                      </div>
                      {vendors.map((vendor) => (
                        <div
                          key={vendor}
                          onClick={() => selectVendor(vendor)}
                          className="flex items-center justify-between px-4 py-2.5 text-[13.5px] hover:bg-[#ede9ff] cursor-pointer border-b border-[#e2e0db] last:border-b-0"
                        >
                          <span className="font-medium">{vendor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Collections Filter Chip */}
              <div className="relative">
                <button
                  ref={collectionChipRef}
                  onClick={() => setShowCollectionDropdown(!showCollectionDropdown)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[13px] font-medium transition-all",
                    filters.collections.length > 0
                      ? "border-[#6046ff] text-[#6046ff] bg-[#ede9ff]"
                      : "border-[#e2e0db] text-[#6b6862] hover:border-[#6046ff] hover:text-[#6046ff] hover:bg-[#ede9ff]"
                  )}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Collections
                  <ChevronDown className="w-3 h-3" />
                </button>
                
                {showCollectionDropdown && (
                  <div
                    ref={collectionDropdownRef}
                    className="fixed z-50 bg-white border border-[#e2e0db] rounded-xl shadow-lg min-w-[240px] overflow-hidden"
                    style={{
                      top: (collectionChipRef.current?.getBoundingClientRect().bottom || 0) + 6,
                      left: collectionChipRef.current?.getBoundingClientRect().left,
                    }}
                  >
                    <div className="max-h-80 overflow-y-auto">
                      <div
                        onClick={() => {
                          setActiveCollection(null);
                          setFilters(prev => ({ ...prev, collections: [] }));
                          setShowCollectionDropdown(false);
                        }}
                        className="flex items-center justify-between px-4 py-2.5 text-[13.5px] hover:bg-[#ede9ff] cursor-pointer border-b border-[#e2e0db]"
                      >
                        <span className="text-[#6b6862]">No collection selected</span>
                      </div>
                      {collections.map((collection) => (
                        <div
                          key={collection.id}
                          onClick={() => selectCollection(collection)}
                          className="flex items-center justify-between px-4 py-2.5 text-[13.5px] hover:bg-[#ede9ff] cursor-pointer border-b border-[#e2e0db] last:border-b-0"
                        >
                          <span className="font-medium">{collection.title}</span>
                          <span className="text-[11px] bg-[#f0ede8] text-[#6b6862] px-2 py-1 rounded-full font-semibold">
                            {collection.productsCount} products
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Product Type Filter Chip */}
              <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-2 border border-[#e2e0db] rounded-lg text-[13px] font-medium text-[#6b6862] hover:border-[#6046ff] hover:text-[#6046ff] hover:bg-[#ede9ff] transition-all">
                    <Tag className="w-3.5 h-3.5" />
                    Product Type
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DialogTrigger>

                {/* Advanced Filters Dialog */}
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Advanced Filters</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {/* Search Field Selection */}
                    <div className="space-y-3">
                      <Label className="font-medium">Search In</Label>
                      <RadioGroup 
                        value={filters.searchField} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, searchField: value }))}
                        className="grid grid-cols-2 gap-2"
                      >
                        {searchFields.map((field) => (
                          <div key={field.value} className="flex items-center space-x-2">
                            <RadioGroupItem value={field.value} id={`search-${field.value}`} />
                            <Label htmlFor={`search-${field.value}`} className="text-sm cursor-pointer">
                              {field.label}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Product Types */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Product Types</Label>
                        {filters.productTypes.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilters(prev => ({ ...prev, productTypes: [] }))}
                            className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <RadioGroup 
                        value={filters.productTypes[0] || ""} 
                        onValueChange={(value) => {
                          if (value === "") {
                            setFilters(prev => ({ ...prev, productTypes: [] }));
                          } else {
                            setFilters(prev => ({ ...prev, productTypes: [value] }));
                          }
                        }}
                        className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="" id="type-none" />
                          <Label htmlFor="type-none" className="text-sm cursor-pointer text-gray-500">
                            No type selected
                          </Label>
                        </div>
                        {getProductTypes.map((type) => (
                          <div key={type} className="flex items-center space-x-2">
                            <RadioGroupItem value={type} id={`type-${type}`} />
                            <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer">
                              {type}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Categories */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Categories</Label>
                        {filters.categories.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilters(prev => ({ ...prev, categories: [] }))}
                            className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      <RadioGroup 
                        value={filters.categories[0] || ""} 
                        onValueChange={(value) => {
                          if (value === "") {
                            setFilters(prev => ({ ...prev, categories: [] }));
                          } else {
                            setFilters(prev => ({ ...prev, categories: [value] }));
                          }
                        }}
                        className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="" id="category-none" />
                          <Label htmlFor="category-none" className="text-sm cursor-pointer text-gray-500">
                            No category selected
                          </Label>
                        </div>
                        {getCategories.map((category) => (
                          <div key={category.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={category.id} id={`category-${category.id}`} />
                            <Label htmlFor={`category-${category.id}`} className="text-sm cursor-pointer">
                              {category.name}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Tags</Label>
                        {filters.tags.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilters(prev => ({ ...prev, tags: [] }))}
                            className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          placeholder="Search tags..."
                          value={tagSearch}
                          onChange={(e) => setTagSearch(e.target.value)}
                          className="pl-9"
                        />
                        {tagSearch && (
                          <button
                            onClick={() => setTagSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                          >
                            <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                      
                      <RadioGroup 
                        value={filters.tags[0] || ""} 
                        onValueChange={(value) => {
                          if (value === "") {
                            setFilters(prev => ({ ...prev, tags: [] }));
                          } else {
                            setFilters(prev => ({ ...prev, tags: [value] }));
                          }
                        }}
                        className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="" id="tag-none" />
                          <Label htmlFor="tag-none" className="text-sm cursor-pointer text-gray-500">
                            No tag selected
                          </Label>
                        </div>
                        {filteredTags.map((tag) => (
                          <div key={tag} className="flex items-center space-x-2">
                            <RadioGroupItem value={tag} id={`tag-${tag}`} />
                            <Label htmlFor={`tag-${tag}`} className="text-sm cursor-pointer truncate">
                              {tag}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    {/* Date Filters */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Created After
                        </Label>
                        <DatePicker
                          date={filters.createdAfter}
                          onSelect={(date) => setFilters(prev => ({ ...prev, createdAfter: date }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Published After
                        </Label>
                        <DatePicker
                          date={filters.publishedAfter}
                          onSelect={(date) => setFilters(prev => ({ ...prev, publishedAfter: date }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-medium flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Updated After
                        </Label>
                        <DatePicker
                          date={filters.updatedAfter}
                          onSelect={(date) => setFilters(prev => ({ ...prev, updatedAfter: date }))}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                      <Button variant="outline" onClick={resetFilters}>
                        Reset All
                      </Button>
                      <Button 
                        onClick={applyFilters} 
                        disabled={applyingFilters}
                        className="bg-[#6046ff] hover:bg-[#4f38d4] text-white"
                      >
                        {applyingFilters ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          'Apply Filters'
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* View Toggle */}
              <div className="flex border border-[#e2e0db] rounded-lg overflow-hidden ml-auto">
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
          </div>

          {/* Collection Heading (when collection is selected) */}
          {activeCollection && (
            <div className="flex items-center gap-2.5 mb-3 animate-fadeIn">
              <h2 className="text-lg font-bold text-[#1a1917]">
                {activeCollection.title} ({activeCollection.productsCount} products)
              </h2>
              <button
                onClick={() => {
                  setActiveCollection(null);
                  setFilters(prev => ({ ...prev, collections: [] }));
                }}
                className="flex items-center gap-1.5 bg-white border border-[#e2e0db] rounded-lg px-3 py-1.5 text-[13px] font-medium text-[#6b6862] hover:border-[#c8c5be] hover:text-[#1a1917] transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Clear filter
              </button>
            </div>
          )}

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
                {/* Table Meta */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-[#e2e0db]">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                      onCheckedChange={toggleAll}
                      className="h-4 w-4 border-[#c8c5be] data-[state=checked]:bg-[#6046ff] data-[state=checked]:border-[#6046ff]"
                    />
                    <span className="text-[12.5px] text-[#6b6862]">
                      {selectedProducts.length} of {filteredProducts.length} products selected
                    </span>
                    {selectedProducts.length > 0 && (
                      <button
                        onClick={() => setSelectedProducts([])}
                        className="text-[12.5px] text-[#6046ff] font-medium hover:underline"
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                  <span className="text-[12.5px] text-[#6b6862]">
                    Page {currentPage} • {products.length} total
                  </span>
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
                    {filteredProducts.map((product, index) => {
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
                            isSelected && "bg-[#ede9ff] hover:bg-[#ede9ff]",
                            `animate-fadeIn animation-delay-${index * 30}`
                          )}
                          style={{ animationDelay: `${index * 30}ms` }}
                        >
                          <div>
                            <Checkbox 
                              checked={isSelected} 
                              className="h-4 w-4 border-[#c8c5be] data-[state=checked]:bg-[#6046ff] data-[state=checked]:border-[#6046ff]"
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
                  <div className="grid grid-cols-4 gap-4 p-5">
                    {filteredProducts.map((product) => {
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
                              className="h-4 w-4 border-[#c8c5be] data-[state=checked]:bg-[#6046ff] data-[state=checked]:border-[#6046ff]"
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

                {/* Load More */}
                {pageInfo?.hasNextPage && filteredProducts.length > 0 && (
                  <div className="flex justify-center py-4 border-t border-[#e2e0db]">
                    <Button
                      onClick={loadMoreProducts}
                      disabled={loadingMore}
                      variant="outline"
                      className="px-8 text-sm"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Load More Products
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Empty State */}
                {filteredProducts.length === 0 && (
                  <div className="text-center py-16 bg-gradient-to-b from-white to-gray-50">
                    <Package className="w-16 h-16 text-[#9e9b95] mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#1a1917]">No products found</h3>
                    <p className="text-sm text-[#6b6862] mt-2 mb-6 max-w-md mx-auto">
                      {filters.searchQuery || getActiveFilterCount() > 0 
                        ? 'Try adjusting your filters or search query' 
                        : 'No products available in your store'}
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={resetFilters}>
                        Reset Filters
                      </Button>
                      <Button 
                        onClick={() => setFilterOpen(true)}
                        className="bg-[#6046ff] hover:bg-[#4f38d4] text-white"
                      >
                        <Filter className="w-4 h-4 mr-2" />
                        Adjust Filters
                      </Button>
                    </div>
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