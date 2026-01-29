import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { getApi, postApi } from "@/services/apiService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  LayoutGrid,
  List,
  ArrowRight,
  Package,
  Filter,
  ChevronDown,
  Loader2,
  Calendar,
  Tag,
  Building,
  Grid3x3,
  ChevronLeft,
  ChevronRight,
  X,
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
import ApiConfig from "@/services/apiConfig";

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

  const fetchInitialData = async (reset = true) => {
    try {
      setLoading(true);
      
      // Fetch products with pagination
      const productsRes = await getApi(ApiConfig.getProducts, { 
        limit: 20 
      });
      
      const productsData = productsRes.products.map((p: any) => p.node);
      setProducts(productsData);
      setPageInfo(productsRes.pageInfo);
      setCurrentPage(1);

      // Fetch collections
      const collectionsRes = await getApi(ApiConfig.getCollections);
      setCollections(collectionsRes.collections || []);

      // Fetch vendors
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

      // Apply current filters
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
      setSelectedProducts([]); // Clear selection when filters change
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'success';
      case 'draft': return 'secondary';
      case 'archived': return 'destructive';
      default: return 'outline';
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

return (
    <AppLayout 
      title={serviceTitles[service] || "Product Selection"}
      subtitle="Select products to optimize with AI"
    >
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="w-full sm:w-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Select Products</h2>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1">
              Choose products to optimize with {serviceTitles[service] || "AI"}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
              {selectedProducts.length} selected
            </Badge>
            <Button
              onClick={handleContinue}
              disabled={selectedProducts.length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white gap-1 sm:gap-2 shadow-lg hover:shadow-xl transition-all text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 flex-1 sm:flex-none"
            >
              Continue to Optimization
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in">
          {/* Status Tabs */}
          <div className="flex-1">
            <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilters(prev => ({ ...prev, status: option.value }))}
                  className={cn(
                    "px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all flex-1 sm:flex-none min-w-[70px] sm:min-w-0",
                    filters.status === option.value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div className="w-full sm:w-48">
            <Select 
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="w-full bg-white text-xs sm:text-sm">
                <SelectValue>
                  {filters.type === 'all' ? 'All Types' : filters.type}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {getProductTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-fade-in">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-8 sm:pl-9 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 text-xs sm:text-sm h-9 sm:h-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select 
              value={filters.searchField}
              onValueChange={(value) => setFilters(prev => ({ ...prev, searchField: value }))}
            >
              <SelectTrigger className="w-28 sm:w-36 bg-white text-xs sm:text-sm h-9 sm:h-10">
                <SelectValue>
                  <span className="flex items-center gap-1 sm:gap-2">
                    <Grid3x3 className="w-3 h-3" />
                    <span className="truncate hidden sm:inline">
                      {searchFields.find(f => f.value === filters.searchField)?.label || 'Title'}
                    </span>
                    <span className="sm:hidden">
                      {searchFields.find(f => f.value === filters.searchField)?.label?.substring(0, 3) || 'Title'}
                    </span>
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {searchFields.map((field) => (
                  <SelectItem key={field.value} value={field.value} className="text-xs sm:text-sm">
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10 px-2 sm:px-3">
                  <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Advanced Filters</span>
                  <span className="sm:hidden">Filters</span>
                  {getActiveFilterCount() > 0 && (
                    <Badge variant="secondary" className="ml-1 h-4 w-4 sm:h-5 sm:w-5 p-0 flex items-center justify-center text-[10px] sm:text-xs">
                      {getActiveFilterCount()}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl font-bold">Advanced Filters</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
                  {/* Search Field Selection - Radio Group */}
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="font-medium text-sm sm:text-base">Search In</Label>
                    <RadioGroup 
                      value={filters.searchField} 
                      onValueChange={(value) => setFilters(prev => ({ ...prev, searchField: value }))}
                      className="grid grid-cols-2 sm:grid-cols-2 gap-2"
                    >
                      {searchFields.map((field) => (
                        <div key={field.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={field.value} id={`search-${field.value}`} />
                          <Label htmlFor={`search-${field.value}`} className="text-xs sm:text-sm cursor-pointer">
                            {field.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Collections Filter - Radio Button */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-sm sm:text-base flex items-center gap-2">
                        <Tag className="w-3 h-3 sm:w-4 sm:h-4" />
                        Collections
                      </Label>
                      {filters.collections.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFilters(prev => ({ ...prev, collections: [] }))}
                          className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <RadioGroup 
                      value={filters.collections[0] || ""} 
                      onValueChange={(value) => {
                        if (value === "") {
                          setFilters(prev => ({ ...prev, collections: [] }));
                        } else {
                          setFilters(prev => ({ ...prev, collections: [value] }));
                        }
                      }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md"
                    >
                      <div key="none" className="flex items-center space-x-2">
                        <RadioGroupItem value="" id="collection-none" />
                        <Label htmlFor="collection-none" className="text-xs sm:text-sm cursor-pointer text-gray-500">
                          No collection selected
                        </Label>
                      </div>
                      {collections.map((collection) => (
                        <div key={collection.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={collection.id} id={`collection-${collection.id}`} />
                          <Label htmlFor={`collection-${collection.id}`} className="text-xs sm:text-sm cursor-pointer">
                            {collection.title} ({collection.productsCount})
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Vendors Filter - Radio Button */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-sm sm:text-base flex items-center gap-2">
                        <Building className="w-3 h-3 sm:w-4 sm:h-4" />
                        Vendors
                      </Label>
                      {filters.vendors.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFilters(prev => ({ ...prev, vendors: [] }))}
                          className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <RadioGroup 
                      value={filters.vendors[0] || ""} 
                      onValueChange={(value) => {
                        if (value === "") {
                          setFilters(prev => ({ ...prev, vendors: [] }));
                        } else {
                          setFilters(prev => ({ ...prev, vendors: [value] }));
                        }
                      }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md"
                    >
                      <div key="none" className="flex items-center space-x-2">
                        <RadioGroupItem value="" id="vendor-none" />
                        <Label htmlFor="vendor-none" className="text-xs sm:text-sm cursor-pointer text-gray-500">
                          No vendor selected
                        </Label>
                      </div>
                      {vendors.map((vendor) => (
                        <div key={vendor} className="flex items-center space-x-2">
                          <RadioGroupItem value={vendor} id={`vendor-${vendor}`} />
                          <Label htmlFor={`vendor-${vendor}`} className="text-xs sm:text-sm cursor-pointer">
                            {vendor}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Product Types Filter - Radio Button */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-sm sm:text-base">Product Types</Label>
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
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md"
                    >
                      <div key="none" className="flex items-center space-x-2">
                        <RadioGroupItem value="" id="type-none" />
                        <Label htmlFor="type-none" className="text-xs sm:text-sm cursor-pointer text-gray-500">
                          No type selected
                        </Label>
                      </div>
                      {getProductTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <RadioGroupItem value={type} id={`type-${type}`} />
                          <Label htmlFor={`type-${type}`} className="text-xs sm:text-sm cursor-pointer">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Categories Filter - Radio Button */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-sm sm:text-base">Categories</Label>
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
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md"
                    >
                      <div key="none" className="flex items-center space-x-2">
                        <RadioGroupItem value="" id="category-none" />
                        <Label htmlFor="category-none" className="text-xs sm:text-sm cursor-pointer text-gray-500">
                          No category selected
                        </Label>
                      </div>
                      {getCategories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={category.id} id={`category-${category.id}`} />
                          <Label htmlFor={`category-${category.id}`} className="text-xs sm:text-sm cursor-pointer">
                            {category.name}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Tags Filter - Radio Button with Search */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium text-sm sm:text-base">Tags</Label>
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
                    
                    {/* Tag Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <Input
                        placeholder="Search tags..."
                        value={tagSearch}
                        onChange={(e) => setTagSearch(e.target.value)}
                        className="pl-8 sm:pl-9 text-xs sm:text-sm"
                      />
                      {tagSearch && (
                        <button
                          onClick={() => setTagSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>
                    
                    {/* Tags Radio Group */}
                    <div className="relative">
                      <RadioGroup 
                        value={filters.tags[0] || ""} 
                        onValueChange={(value) => {
                          if (value === "") {
                            setFilters(prev => ({ ...prev, tags: [] }));
                          } else {
                            setFilters(prev => ({ ...prev, tags: [value] }));
                          }
                        }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md"
                      >
                        <div key="none" className="flex items-center space-x-2">
                          <RadioGroupItem value="" id="tag-none" />
                          <Label htmlFor="tag-none" className="text-xs sm:text-sm cursor-pointer text-gray-500">
                            No tag selected
                          </Label>
                        </div>
                        {filteredTags.length > 0 ? (
                          filteredTags.map((tag) => (
                            <div key={tag} className="flex items-center space-x-2">
                              <RadioGroupItem value={tag} id={`tag-${tag}`} />
                              <Label htmlFor={`tag-${tag}`} className="text-xs sm:text-sm cursor-pointer truncate">
                                {tag}
                              </Label>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 text-center py-4 text-xs sm:text-sm text-gray-500">
                            No tags found matching "{tagSearch}"
                          </div>
                        )}
                      </RadioGroup>
                    </div>
                  </div>

                  {/* Date Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label className="font-medium text-xs sm:text-sm flex items-center gap-2">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        Created After
                      </Label>
                      <DatePicker
                        date={filters.createdAfter}
                        onSelect={(date) => setFilters(prev => ({ ...prev, createdAfter: date }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium text-xs sm:text-sm flex items-center gap-2">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        Published After
                      </Label>
                      <DatePicker
                        date={filters.publishedAfter}
                        onSelect={(date) => setFilters(prev => ({ ...prev, publishedAfter: date }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-medium text-xs sm:text-sm flex items-center gap-2">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        Updated After
                      </Label>
                      <DatePicker
                        date={filters.updatedAfter}
                        onSelect={(date) => setFilters(prev => ({ ...prev, updatedAfter: date }))}
                      />
                    </div>
                  </div>

                  {/* Active Filters Summary */}
                  {getActiveFilterCount() > 0 && (
                    <div className="pt-3 sm:pt-4 border-t">
                      <Label className="font-medium text-sm sm:text-base mb-2">Active Filters:</Label>
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {filters.status !== 'all' && (
                          <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                            Status: {statusOptions.find(s => s.value === filters.status)?.label}
                            <X 
                              className="w-2 h-2 sm:w-3 sm:h-3 cursor-pointer" 
                              onClick={() => setFilters(prev => ({ ...prev, status: 'all' }))}
                            />
                          </Badge>
                        )}
                        {filters.type !== 'all' && (
                          <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                            Type: {filters.type}
                            <X 
                              className="w-2 h-2 sm:w-3 sm:h-3 cursor-pointer" 
                              onClick={() => setFilters(prev => ({ ...prev, type: 'all' }))}
                            />
                          </Badge>
                        )}
                        {filters.collections.length > 0 && (
                          <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                            Collection: {collections.find(c => c.id === filters.collections[0])?.title?.substring(0, 15)}
                            {collections.find(c => c.id === filters.collections[0])?.title?.length > 15 && '...'}
                            <X 
                              className="w-2 h-2 sm:w-3 sm:h-3 cursor-pointer" 
                              onClick={() => setFilters(prev => ({ ...prev, collections: [] }))}
                            />
                          </Badge>
                        )}
                        {filters.vendors.length > 0 && (
                          <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                            Vendor: {filters.vendors[0]?.substring(0, 12)}
                            {filters.vendors[0]?.length > 12 && '...'}
                            <X 
                              className="w-2 h-2 sm:w-3 sm:h-3 cursor-pointer" 
                              onClick={() => setFilters(prev => ({ ...prev, vendors: [] }))}
                            />
                          </Badge>
                        )}
                        {filters.productTypes.length > 0 && (
                          <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                            Type: {filters.productTypes[0]?.substring(0, 12)}
                            {filters.productTypes[0]?.length > 12 && '...'}
                            <X 
                              className="w-2 h-2 sm:w-3 sm:h-3 cursor-pointer" 
                              onClick={() => setFilters(prev => ({ ...prev, productTypes: [] }))}
                            />
                          </Badge>
                        )}
                        {filters.categories.length > 0 && (
                          <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                            Category: {getCategories.find(c => c.id === filters.categories[0])?.name?.substring(0, 12)}
                            {getCategories.find(c => c.id === filters.categories[0])?.name?.length > 12 && '...'}
                            <X 
                              className="w-2 h-2 sm:w-3 sm:h-3 cursor-pointer" 
                              onClick={() => setFilters(prev => ({ ...prev, categories: [] }))}
                            />
                          </Badge>
                        )}
                        {filters.tags.length > 0 && (
                          <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                            Tag: {filters.tags[0]?.substring(0, 12)}
                            {filters.tags[0]?.length > 12 && '...'}
                            <X 
                              className="w-2 h-2 sm:w-3 sm:h-3 cursor-pointer" 
                              onClick={() => setFilters(prev => ({ ...prev, tags: [] }))}
                            />
                          </Badge>
                        )}
                        {filters.createdAfter && (
                          <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                            Created: {filters.createdAfter.toLocaleDateString()}
                            <X 
                              className="w-2 h-2 sm:w-3 sm:h-3 cursor-pointer" 
                              onClick={() => setFilters(prev => ({ ...prev, createdAfter: undefined }))}
                            />
                          </Badge>
                        )}
                        {filters.publishedAfter && (
                          <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                            Published: {filters.publishedAfter.toLocaleDateString()}
                            <X 
                              className="w-2 h-2 sm:w-3 sm:h-3 cursor-pointer" 
                              onClick={() => setFilters(prev => ({ ...prev, publishedAfter: undefined }))}
                            />
                          </Badge>
                        )}
                        {filters.updatedAfter && (
                          <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                            Updated: {filters.updatedAfter.toLocaleDateString()}
                            <X 
                              className="w-2 h-2 sm:w-3 sm:h-3 cursor-pointer" 
                              onClick={() => setFilters(prev => ({ ...prev, updatedAfter: undefined }))}
                            />
                          </Badge>
                        )}
                        {filters.searchQuery && (
                          <Badge variant="secondary" className="gap-1 text-xs py-0.5">
                            Search: {filters.searchQuery.substring(0, 12)}
                            {filters.searchQuery.length > 12 && '...'}
                            <X 
                              className="w-2 h-2 sm:w-3 sm:h-3 cursor-pointer" 
                              onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                            />
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={resetFilters}
                      className="text-xs sm:text-sm"
                    >
                      Reset All
                    </Button>
                    <Button 
                      onClick={applyFilters} 
                      disabled={applyingFilters}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                    >
                      {applyingFilters ? (
                        <>
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
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

            <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white">
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-none border-r border-gray-300 h-9 w-9 sm:h-10 sm:w-10", viewMode === "list" && "bg-gray-100")}
                onClick={() => setViewMode("list")}
              >
                <List className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-none h-9 w-9 sm:h-10 sm:w-10", viewMode === "grid" && "bg-gray-100")}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Selection Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 px-3 sm:px-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="flex items-center gap-3 w-full sm:w-auto mb-2 sm:mb-0">
            <Checkbox
              checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
              onCheckedChange={toggleAll}
              className="h-4 w-4 sm:h-5 sm:w-5 border-gray-400 data-[state=checked]:bg-blue-600"
            />
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              {selectedProducts.length} of {filteredProducts.length} products selected
            </span>
          </div>
          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            <span className="text-xs text-gray-500">
              Page {currentPage} • {products.length} total
            </span>
            {selectedProducts.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedProducts([])}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs h-7 px-2"
              >
                Clear selection
              </Button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-20">
            <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 animate-spin text-blue-600 mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-700">Loading products...</h3>
            <p className="text-xs sm:text-gray-500 mt-1">Fetching your Shopify store data</p>
          </div>
        ) : (
          <>
            {/* Product Grid/List */}
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"
                  : "space-y-2 sm:space-y-3"
              )}
            >
              {filteredProducts.map((product) => {
                const isSelected = selectedProducts.includes(product.id);
                const variant = product.variants.edges[0]?.node;
                const sku = variant?.sku || 'No SKU';
                const imageUrl = product.featuredMedia?.preview.image.url || 
                  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop';
                const price = formatPrice(
                  product.priceRangeV2.minVariantPrice.amount,
                  product.priceRangeV2.minVariantPrice.currencyCode
                );

                if (viewMode === "grid") {
                  return (
                    <div
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={cn(
                        "bg-white border rounded-lg sm:rounded-xl p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:shadow-md sm:hover:shadow-lg",
                        isSelected
                          ? "border-blue-600 shadow-md sm:shadow-lg ring-1 sm:ring-2 ring-blue-100"
                          : "border-gray-200 hover:border-blue-300"
                      )}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Checkbox 
                          checked={isSelected} 
                          className="mt-0.5 h-4 w-4 sm:h-5 sm:w-5 border-gray-400 data-[state=checked]:bg-blue-600"
                        />
                        <img
                          src={imageUrl}
                          alt={product.title}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover border border-gray-200"
                        />
                      </div>
                      <h4 className="font-semibold text-gray-900 mt-2 sm:mt-3 line-clamp-2 text-xs sm:text-sm">
                        {product.title}
                      </h4>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-1 truncate">{sku}</p>
                      <div className="flex items-center justify-between mt-2 sm:mt-3">
                        <span className="font-bold text-gray-900 text-xs sm:text-sm">{price}</span>
                        <Badge
                          variant={getStatusBadgeVariant(product.status)}
                          className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                        >
                          {product.status.toLowerCase()}
                        </Badge>
                      </div>
                      <div className="mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2">
                        <span className="text-[10px] sm:text-xs text-gray-500 truncate">{product.vendor}</span>
                        <span className="text-[10px] sm:text-xs text-gray-500">•</span>
                        <span className="text-[10px] sm:text-xs text-gray-500 truncate">{product.productType}</span>
                      </div>
                      {product.category && (
                        <div className="mt-1 sm:mt-2">
                          <Badge variant="outline" className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                            {product.category.name}
                          </Badge>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={cn(
                      "bg-white border rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center gap-2 sm:gap-4 cursor-pointer transition-all duration-200 hover:shadow-md sm:hover:shadow-lg",
                      isSelected
                        ? "border-blue-600 shadow-md sm:shadow-lg ring-1 sm:ring-2 ring-blue-100"
                        : "border-gray-200 hover:border-blue-300"
                    )}
                  >
                    <Checkbox 
                      checked={isSelected} 
                      className="h-4 w-4 sm:h-5 sm:w-5 border-gray-400 data-[state=checked]:bg-blue-600 flex-shrink-0"
                    />
                    <img
                      src={imageUrl}
                      alt={product.title}
                      className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate text-xs sm:text-sm">{product.title}</h4>
                      <div className="flex items-center gap-1 sm:gap-2 mt-0.5 sm:mt-1 flex-wrap">
                        <p className="text-[10px] sm:text-xs text-gray-600 truncate">{sku}</p>
                        <span className="text-gray-400 text-[10px] sm:text-xs hidden xs:inline">•</span>
                        <p className="text-[10px] sm:text-xs text-gray-600 truncate hidden xs:inline">{product.vendor}</p>
                        <span className="text-gray-400 text-[10px] sm:text-xs">•</span>
                        <p className="text-[10px] sm:text-xs text-gray-600 truncate">{product.productType}</p>
                      </div>
                      {product.category && (
                        <Badge variant="outline" className="mt-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
                          {product.category.name}
                        </Badge>
                      )}
                    </div>
                    <div className="hidden lg:block flex-shrink-0">
                      <span className="font-bold text-gray-900 text-xs sm:text-sm">{price}</span>
                    </div>
                    <div className="hidden md:block text-[10px] sm:text-xs text-gray-600 flex-shrink-0 whitespace-nowrap">
                      {product.totalInventory} in stock
                    </div>
                    <Badge
                      variant={getStatusBadgeVariant(product.status)}
                      className="text-[10px] sm:text-xs min-w-[60px] sm:min-w-[80px] justify-center px-1.5 sm:px-2 py-0.5 flex-shrink-0"
                    >
                      {product.status.toLowerCase()}
                    </Badge>
                  </div>
                );
              })}
            </div>

            {/* Pagination/Load More */}
            {pageInfo?.hasNextPage && filteredProducts.length > 0 && (
              <div className="flex justify-center pt-4 sm:pt-6">
                <Button
                  onClick={loadMoreProducts}
                  disabled={loadingMore}
                  variant="outline"
                  className="px-4 sm:px-8 text-xs sm:text-sm h-8 sm:h-10"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Load More Products
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Pagination Info */}
            {products.length > 0 && (
              <div className="flex items-center justify-center text-xs sm:text-sm text-gray-500 text-center px-2">
                Showing {filteredProducts.length} of {products.length} products
                {pageInfo?.hasNextPage && " • Scroll down to load more"}
              </div>
            )}

            {/* Empty State */}
            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-8 sm:py-16 bg-gradient-to-b from-white to-gray-50 rounded-xl sm:rounded-2xl border border-gray-200 px-4">
                <Package className="w-10 h-10 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-xl font-semibold text-gray-900">No products found</h3>
                <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-2 mb-4 sm:mb-6 max-w-md mx-auto">
                  {filters.searchQuery || Object.keys(filters).some(k => 
                    k !== 'searchField' && filters[k as keyof FilterState] !== undefined && 
                    filters[k as keyof FilterState] !== 'all'
                  ) ? 'Try adjusting your filters or search query' : 'No products available in your store'}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                  <Button 
                    variant="outline" 
                    onClick={resetFilters}
                    className="border-gray-300 hover:bg-gray-50 text-xs sm:text-sm h-8 sm:h-10"
                  >
                    Reset Filters
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => setFilterOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm h-8 sm:h-10"
                  >
                    <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Adjust Filters
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer Action Bar */}
        {selectedProducts.length > 0 && (
          <div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-auto bg-white border border-gray-300 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl px-4 py-2 sm:px-6 sm:py-3 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-6 animate-slide-up z-50 max-w-[calc(100vw-2rem)]">
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
              <Badge variant="secondary" className="px-2 sm:px-3 py-0.5 text-xs">
                {selectedProducts.length} selected
              </Badge>
              <span className="text-xs text-gray-600 truncate flex-1 sm:flex-none text-center sm:text-left">
                Ready for {serviceTitles[service] || "AI optimization"}
              </span>
            </div>
            <Button
              onClick={handleContinue}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white gap-1 sm:gap-2 shadow-lg text-xs sm:text-sm w-full sm:w-auto h-8 sm:h-10"
            >
              Continue to Optimization
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}