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
  status: string;
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
  priceMin?: number;
  priceMax?: number;
  stockMin?: number;
  stockMax?: number;
}

interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
}

interface FilterChip {
  id: string;
  type: 'vendor' | 'collection' | 'tag' | 'productType' | 'category' | 'date' | 'price' | 'stock';
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
  handle:"Handle Optimization",
  pricing:"Price Optimization",
  imageALT: "Image ALT Optimization",
  image: "Image Optimization",
  keywords: "Keywords Optimization",
  sku: "SKU Optimization",
  productType: "Product Type Optimization",
  vendor: "Vendor Optimization",
  collection: "Collections Optimization",
  tag: "Tags Optimization",
  specification: "Spacification Optimization",
  metafields: "Meta Fields Optimization",
};

const searchFields = [
  { value: "title", label: "Title" },
  { value: "handle", label: "Handle" },
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

const ITEMS_PER_PAGE = 50;

export default function ProductSelection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const service = searchParams.get("service") || "title";

  // View state
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectAllOnPage, setSelectAllOnPage] = useState(false);
  const [selectAllFiltered, setSelectAllFiltered] = useState(false);
  const [priceRangeMin, setPriceRangeMin] = useState<string>('');
const [priceRangeMax, setPriceRangeMax] = useState<string>('');
const [stockRangeMin, setStockRangeMin] = useState<string>('');
const [stockRangeMax, setStockRangeMax] = useState<string>('');
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<{ id: string, title: string }[]>([]);
  const [showSelectionDropdown, setShowSelectionDropdown] = useState(false);
  const [customNumberRange, setCustomNumberRange] = useState<[number, number]>([1, 100]);
  const [isProcessingSelection, setIsProcessingSelection] = useState(false);
  const selectionDropdownRef = useRef<HTMLDivElement>(null);
  // Loading states
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalFilteredCount, setTotalFilteredCount] = useState<number>(0);
  const [selectionType, setSelectionType] = useState<'page' | 'filtered' | 'all' | 'custom' | null>(null);
  // Pagination
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [cursors, setCursors] = useState<string[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(0)
  const [allSelection, setAllSelection] = useState(false)
  // Filter state
  const [priceMin, setPriceMin] = useState<string>('');
  const [priceMax, setPriceMax] = useState<string>('');
  const [stockMin, setStockMin] = useState<string>('');
  const [stockMax, setStockMax] = useState<string>('');
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
    price: boolean;
    stock: boolean;
  }>({
    productTypes: false,
    categories: false,
    dates: false,
    price: false,
    stock: false,
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
  const moreFiltersButtonRef = useRef<HTMLButtonElement>(null);
  const moreFiltersPopoverRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside all dropdowns
      let isOutsideAll = true;
      dropdownRefs.current.forEach((ref) => {
        if (ref.contains(event.target as Node)) {
          isOutsideAll = false;
        }
      });

      // Check if click is outside more filters popover
      if (moreFiltersPopoverRef.current?.contains(event.target as Node) ||
        moreFiltersButtonRef.current?.contains(event.target as Node)) {
        isOutsideAll = false;
      }
      if (selectionDropdownRef.current && !selectionDropdownRef.current.contains(event.target as Node)) {
        setShowSelectionDropdown(false);
      }

      if (isOutsideAll) {
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

  // Update selected products when selectAllFiltered changes
  useEffect(() => {
    if (selectAllFiltered) {
      // This would need a backend endpoint to get all filtered product IDs
      // For now, we'll just select all on current page
      setSelectedProducts(products.map(p => p.id));
      setSelectAllOnPage(true);
    }
  }, [selectAllFiltered, products]);

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

      // Add all active filters - FIXED: Always send status, send "all" as empty
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status;
      }

      if (filters.collections.length > 0) params.collections = filters.collections.join(',');
      if (filters.vendors.length > 0) params.vendors = filters.vendors.join(',');
      if (filters.productTypes.length > 0) params.productTypes = filters.productTypes.join(',');
      if (filters.tags.length > 0) params.tags = filters.tags.join(',');
      if (filters.categories.length > 0) params.categories = filters.categories.join(',');
      if (filters.createdAfter) params.createdAfter = filters.createdAfter.toISOString();
      if (filters.publishedAfter) params.publishedAfter = filters.publishedAfter.toISOString();
      if (filters.updatedAfter) params.updatedAfter = filters.updatedAfter.toISOString();
      if (filters.searchQuery) params[filters.searchField] = filters.searchQuery;
if (filters.priceMin !== undefined) params.priceMin = filters.priceMin;
if (filters.priceMax !== undefined) params.priceMax = filters.priceMax;
if (filters.stockMin !== undefined) params.stockMin = filters.stockMin;
if (filters.stockMax !== undefined) params.stockMax = filters.stockMax;
      console.log('Fetching products with params:', params);
      const response = await getApi(ApiConfig.getProducts, params);

      setProducts(response.products.map((p: any) => p.node));
      setPageInfo(response.pageInfo);
      setTotalPages(response.totalPages)
      setTotalFilteredCount(response.totalCount || 0);
      // You might want to get total count from response if available
      // setTotalFilteredCount(response.totalCount || response.products.length);

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

      // Don't clear selections when loading more pages
      if (!cursor) {
        setSelectedProducts([]);
        setSelectAllOnPage(false);
        setSelectAllFiltered(false);
      }
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
  // Add this with your other API functions
  const applyPriceFilter = () => {
    const min = priceMin ? parseFloat(priceMin) : undefined;
    const max = priceMax ? parseFloat(priceMax) : undefined;

    if (min !== undefined || max !== undefined) {
      setFilters(prev => ({
        ...prev,
        priceMin: min,
        priceMax: max,
      }));
      setAvailableFilterTypes(prev => ({ ...prev, price: false }));
      setPriceMin('');
      setPriceMax('');
      setTimeout(() => fetchProducts(), 0);
    }
  };

  const applyStockFilter = () => {
    const min = stockMin ? parseInt(stockMin) : undefined;
    const max = stockMax ? parseInt(stockMax) : undefined;

    if (min !== undefined || max !== undefined) {
      setFilters(prev => ({
        ...prev,
        stockMin: min,
        stockMax: max,
      }));
      setAvailableFilterTypes(prev => ({ ...prev, stock: false }));
      setStockMin('');
      setStockMax('');
      setTimeout(() => fetchProducts(), 0);
    }
  };
  const handleCustomProductSelection = (type: 'filtered' | 'all' | 'custom') => {
    try {

      setIsProcessingSelection(true);

      let productIds: string[] = [];

      if (type === 'filtered') {
        // For filtered products, we don't have all IDs, so we just show a message
        // The actual selection will happen on the backend when continuing
        setSelectionType('filtered');
        // Show visual feedback that all filtered products are selected
        setSelectedProducts([]); // Clear individual selections
        setSelectAllFiltered(true);
        setSelectAllOnPage(false);
      }
      else if (type === 'all') {
        // Select all products in the store
        setSelectionType('all');
        setSelectedProducts([]); // Clear individual selections
        setSelectAllFiltered(true);
        setSelectAllOnPage(false);
      }
      else if (type === 'custom') {
        // For custom range, we select from the current page only
        // (since we don't have all products loaded)
        const [start, end] = customNumberRange;
        const validStart = Math.max(1, start);
        const validEnd = Math.min(totalFilteredCount, end);

        if (validStart <= validEnd) {
          // Select from current page products within range
          // Note: This only selects from current page, not all pages
          const pageProductIds = products.map(p => p.id);
          const selectedFromPage = pageProductIds.slice(validStart - 1, validEnd);
          setSelectedProducts(selectedFromPage);
          setSelectionType('custom');
          setSelectAllFiltered(false);
          setSelectAllOnPage(selectedFromPage.length === products.length);
        }
      }

      setShowSelectionDropdown(false);
    } catch (error) {
      console.error('Error selecting products:', error);
    } finally {
      setIsProcessingSelection(false);
    }
  };
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
    // Add price range chips
    if (filters.priceMin !== undefined && filters.priceMax !== undefined) {
      chips.push({
        id: 'price-range',
        type: 'price',
        label: `Price: $${filters.priceMin} - $${filters.priceMax}`,
        value: { min: filters.priceMin, max: filters.priceMax },
        field: 'priceMin' // Using priceMin as reference, we'll handle both in remove
      });
    } else if (filters.priceMin !== undefined) {
      chips.push({
        id: 'price-min',
        type: 'price',
        label: `Price: Min $${filters.priceMin}`,
        value: filters.priceMin,
        field: 'priceMin'
      });
    } else if (filters.priceMax !== undefined) {
      chips.push({
        id: 'price-max',
        type: 'price',
        label: `Price: Max $${filters.priceMax}`,
        value: filters.priceMax,
        field: 'priceMax'
      });
    }

    // Add stock range chips
    if (filters.stockMin !== undefined && filters.stockMax !== undefined) {
      chips.push({
        id: 'stock-range',
        type: 'stock',
        label: `Stock: ${filters.stockMin} - ${filters.stockMax}`,
        value: { min: filters.stockMin, max: filters.stockMax },
        field: 'stockMin'
      });
    } else if (filters.stockMin !== undefined) {
      chips.push({
        id: 'stock-min',
        type: 'stock',
        label: `Stock: Min ${filters.stockMin}`,
        value: filters.stockMin,
        field: 'stockMin'
      });
    } else if (filters.stockMax !== undefined) {
      chips.push({
        id: 'stock-max',
        type: 'stock',
        label: `Stock: Max ${filters.stockMax}`,
        value: filters.stockMax,
        field: 'stockMax'
      });
    }

    setActiveFilterChips(chips);
  }, [filters, collections, categories]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Fetch products with initial filters
      await fetchProducts();

      // Fetch filter options in parallel
      const [collectionsRes, vendorsRes, typesRes, tagsRes,
        //  categoriesRes
      ] = await Promise.all([
        getApi(ApiConfig.getCollections),
        getApi(ApiConfig.getVendors),
        getApi(ApiConfig.getProductType),
        getApi(ApiConfig.getTags),
        // getApi(ApiConfig.getCategories),
      ]);

      setCollections(collectionsRes.collections || []);
      setVendors(vendorsRes.vendors || []);
      setProductTypes(typesRes.productTypes || []);
      setTags(tagsRes.tags || []);
      // setCategories(categoriesRes.categories || []);

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

  const handleLastPage = () => {
    // This would need the last cursor from somewhere
    // For now, just go to next page until end
    if (pageInfo?.hasNextPage) {
      handleNextPage();
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
      } else if (chip.field === 'priceMin' || chip.field === 'priceMax') {
        newFilters.priceMin = undefined;
        newFilters.priceMax = undefined;
      } else if (chip.field === 'stockMin' || chip.field === 'stockMax') {
        newFilters.stockMin = undefined;
        newFilters.stockMax = undefined;
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
      priceMin: undefined,
      priceMax: undefined,
      stockMin: undefined,
      stockMax: undefined,
    });
    setAvailableFilterTypes({
      productTypes: false,
      categories: false,
      dates: false,
      price: false,
      stock: false
    });
    fetchProducts();
  };

  const addFilterType = (type: 'productTypes' | 'categories' | 'dates' | 'price' | 'stock') => {
    setAvailableFilterTypes(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
    setOpenDropdown(null);
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) => {
      const newSelection = prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev, id];

      // Update select all states
      setSelectAllOnPage(products.every(p => newSelection.includes(p.id)));
      setSelectAllFiltered(false);

      return newSelection;
    });
  };

  const toggleAllOnPage = () => {
    const pageProductIds = products.map(p => p.id);
    setAllSelection(false)
    if (selectAllOnPage) {
      setSelectedProducts(prev =>
        prev.filter(id => !pageProductIds.includes(id))
      );
      setSelectAllOnPage(false);
    } else {
      setSelectedProducts(prev => {
        const newSelection = [...new Set([...prev, ...pageProductIds])];
        return newSelection;
      });
      setSelectAllOnPage(true);
    }
    setSelectAllFiltered(false);
  };

  const handleSelectAllFiltered = async () => {
    try {
      setSelectAllFiltered(true);

      // Fetch all product IDs with current filters
      const params: any = {
        limit: 250, // Maximum allowed by Shopify
        fields: 'id' // Only fetch IDs
      };

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
      if (filters.priceMin !== undefined) params.priceMin = filters.priceMin;
if (filters.priceMax !== undefined) params.priceMax = filters.priceMax;
if (filters.stockMin !== undefined) params.stockMin = filters.stockMin;
if (filters.stockMax !== undefined) params.stockMax = filters.stockMax;
      // You would need a separate endpoint to get all IDs
      // For now, we'll just select all on current page
      const allIds = products.map(p => p.id);
      setSelectedProducts(allIds);
      setSelectAllOnPage(true);

    } catch (error) {
      console.error('Error selecting all filtered products:', error);
    }
  };

  const handleContinue = async () => {
    try {
      setIsProcessingSelection(true);

      let payload: any = {
        serviceName: service,
      };

      // If using filtered or all selection
      if (selectAllFiltered) {
        if (selectionType === 'filtered') {
          // Send filters for backend to apply
          payload.filters = {
            status: filters.status !== 'all' ? filters.status : undefined,
            collections: filters.collections.length > 0 ? filters.collections : undefined,
            vendors: filters.vendors.length > 0 ? filters.vendors : undefined,
            productTypes: filters.productTypes.length > 0 ? filters.productTypes : undefined,
            tags: filters.tags.length > 0 ? filters.tags : undefined,
            categories: filters.categories.length > 0 ? filters.categories : undefined,
            createdAfter: filters.createdAfter,
            publishedAfter: filters.publishedAfter,
            updatedAfter: filters.updatedAfter,
            searchField: filters.searchQuery ? filters.searchField : undefined,
            searchQuery: filters.searchQuery || undefined,

            priceMin: filters.priceMin,
            priceMax: filters.priceMax,
            stockMin: filters.stockMin,
            stockMax: filters.stockMax,
          };
          // Remove undefined values
          Object.keys(payload.filters).forEach(key =>
            payload.filters[key] === undefined && delete payload.filters[key]
          );
        } else if (selectionType === 'all') {
          payload.filters = {}; // Empty filters for all products
        }
      }
      // If using custom range selection
      else if (selectionType === 'custom') {
        payload.customNumbers = customNumberRange;
        payload.productIds = selectedProducts; // Send specific IDs
      }
      else {
        payload.productIds = selectedProducts;
      }

      await postApi(ApiConfig.storeProduct, payload);
      navigate(`/${service}-optimization`);

    } catch (error) {
      console.error('Error storing products:', error);
    } finally {
      setIsProcessingSelection(false);
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
  return (
    <AppLayout>
      <div className="min-h-screen font-['DM_Sans'] bg-[#f5f4f1]">
        <div className="p-7">
          {/* Page Header */}
            <h1 className="text-[32px] font-bold text-[#4f38d4]">{serviceTitles[service]}</h1>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-[22px] font-bold text-[#1a1917]">Select Products</h1>
              <p className="text-[13.5px] text-[#6b6862] mt-1">
                Choose products to optimize with {serviceTitles[service] || "AI"}
              </p>
            </div>
            <Button
              onClick={handleContinue}
              disabled={selectedProducts.length === 0 || isProcessingSelection}
              className="bg-[#6046ff] hover:bg-[#4f38d4] text-white rounded-lg px-5 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all hover:-translate-y-0.5"
            >
              {isProcessingSelection ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue to Optimization
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          <div className="bg-white border border-[#e2e0db] rounded-xl p-5 mb-4">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilters(prev => ({ ...prev, status: option.value }))}
                  className={cn(
                    "px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all whitespace-nowrap",
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

              <div className="flex flex-wrap items-center gap-2 pb-2">
                {/* Collections Filter */}
                <div className="relative" ref={el => el && dropdownRefs.current.set('collections', el)}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'collections' ? null : 'collections')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
                      filters.collections.length > 0
                        ? "border-[#6046ff] text-[#6046ff] bg-[#ede9ff]"
                        : "border-[#e2e0db] text-[#6b6862] hover:border-[#6046ff] hover:text-[#6046ff] hover:bg-[#ede9ff]"
                    )}
                  >
                    <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate max-w-[100px] sm:max-w-none">
                      Collections {filters.collections.length > 0 && `(${filters.collections.length})`}
                    </span>
                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                  </button>

                  {openDropdown === 'collections' && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#e2e0db] rounded-xl shadow-lg min-w-[280px] max-h-96 overflow-hidden">
                      <div className="p-2 border-b border-[#e2e0db] sticky top-0 bg-white">
                        <div className="flex items-center gap-2 px-2 py-1 bg-[#f5f4f1] rounded-lg">
                          <Search className="w-3.5 h-3.5 text-[#9e9b95] flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="Search collections..."
                            value={collectionSearch}
                            onChange={(e) => setCollectionSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-[13px] text-[#1a1917] placeholder-[#9e9b95] flex-1 min-w-0"
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
                              className="h-4 w-4 border-[#c8c5be] data-[state=checked]:bg-[#6046ff] flex-shrink-0"
                            />
                            <span className="flex-1 text-[13px] font-medium truncate">{collection.title}</span>
                            <span className="text-[11px] bg-[#f0ede8] text-[#6b6862] px-2 py-1 rounded-full flex-shrink-0">
                              {collection.productsCount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Vendors Filter */}
                <div className="relative" ref={el => el && dropdownRefs.current.set('vendors', el)}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'vendors' ? null : 'vendors')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
                      filters.vendors.length > 0
                        ? "border-[#6046ff] text-[#6046ff] bg-[#ede9ff]"
                        : "border-[#e2e0db] text-[#6b6862] hover:border-[#6046ff] hover:text-[#6046ff] hover:bg-[#ede9ff]"
                    )}
                  >
                    <Building className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate max-w-[100px] sm:max-w-none">
                      Vendors {filters.vendors.length > 0 && `(${filters.vendors.length})`}
                    </span>
                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                  </button>

                  {openDropdown === 'vendors' && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#e2e0db] rounded-xl shadow-lg min-w-[240px] max-h-96 overflow-hidden">
                      <div className="p-2 border-b border-[#e2e0db] sticky top-0 bg-white">
                        <div className="flex items-center gap-2 px-2 py-1 bg-[#f5f4f1] rounded-lg">
                          <Search className="w-3.5 h-3.5 text-[#9e9b95] flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="Search vendors..."
                            value={vendorSearch}
                            onChange={(e) => setVendorSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-[13px] text-[#1a1917] placeholder-[#9e9b95] flex-1 min-w-0"
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
                              className="h-4 w-4 border-[#c8c5be] data-[state=checked]:bg-[#6046ff] flex-shrink-0"
                            />
                            <span className="text-[13px] font-medium truncate">{vendor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags Filter */}
                <div className="relative" ref={el => el && dropdownRefs.current.set('tags', el)}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === 'tags' ? null : 'tags')}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
                      filters.tags.length > 0
                        ? "border-[#6046ff] text-[#6046ff] bg-[#ede9ff]"
                        : "border-[#e2e0db] text-[#6b6862] hover:border-[#6046ff] hover:text-[#6046ff] hover:bg-[#ede9ff]"
                    )}
                  >
                    <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate max-w-[100px] sm:max-w-none">
                      Tags {filters.tags.length > 0 && `(${filters.tags.length})`}
                    </span>
                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                  </button>

                  {openDropdown === 'tags' && (
                    <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#e2e0db] rounded-xl shadow-lg min-w-[240px] max-h-96 overflow-hidden">
                      <div className="p-2 border-b border-[#e2e0db] sticky top-0 bg-white">
                        <div className="flex items-center gap-2 px-2 py-1 bg-[#f5f4f1] rounded-lg">
                          <Search className="w-3.5 h-3.5 text-[#9e9b95] flex-shrink-0" />
                          <input
                            type="text"
                            placeholder="Search tags..."
                            value={tagSearch}
                            onChange={(e) => setTagSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-[13px] text-[#1a1917] placeholder-[#9e9b95] flex-1 min-w-0"
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
                              className="h-4 w-4 border-[#c8c5be] data-[state=checked]:bg-[#6046ff] flex-shrink-0"
                            />
                            <span className="text-[13px] font-medium truncate">{tag}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Types Filter (conditional) */}
                {availableFilterTypes.productTypes && (
                  <div className="relative" ref={el => el && dropdownRefs.current.set('productTypes', el)}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === 'productTypes' ? null : 'productTypes')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
                        filters.productTypes.length > 0
                          ? "border-[#6046ff] text-[#6046ff] bg-[#ede9ff]"
                          : "border-[#e2e0db] text-[#6b6862] hover:border-[#6046ff] hover:text-[#6046ff] hover:bg-[#ede9ff]"
                      )}
                    >
                      <Tag className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate max-w-[100px] sm:max-w-none">
                        Product Types {filters.productTypes.length > 0 && `(${filters.productTypes.length})`}
                      </span>
                      <ChevronDown className="w-3 h-3 flex-shrink-0" />
                    </button>

                    {openDropdown === 'productTypes' && (
                      <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#e2e0db] rounded-xl shadow-lg min-w-[240px] max-h-96 overflow-hidden">
                        <div className="p-2 border-b border-[#e2e0db] sticky top-0 bg-white">
                          <div className="flex items-center gap-2 px-2 py-1 bg-[#f5f4f1] rounded-lg">
                            <Search className="w-3.5 h-3.5 text-[#9e9b95] flex-shrink-0" />
                            <input
                              type="text"
                              placeholder="Search product types..."
                              value={productTypeSearch}
                              onChange={(e) => setProductTypeSearch(e.target.value)}
                              className="bg-transparent border-none outline-none text-[13px] text-[#1a1917] placeholder-[#9e9b95] flex-1 min-w-0"
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
                                className="h-4 w-4 border-[#c8c5be] data-[state=checked]:bg-[#6046ff] flex-shrink-0"
                              />
                              <span className="text-[13px] font-medium truncate">{type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Categories Filter (conditional) */}
                {/* {availableFilterTypes.categories && (
                  <div className="relative" ref={el => el && dropdownRefs.current.set('categories', el)}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === 'categories' ? null : 'categories')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
                        filters.categories.length > 0
                          ? "border-[#6046ff] text-[#6046ff] bg-[#ede9ff]"
                          : "border-[#e2e0db] text-[#6b6862] hover:border-[#6046ff] hover:text-[#6046ff] hover:bg-[#ede9ff]"
                      )}
                    >
                      <Layers className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate max-w-[100px] sm:max-w-none">
                        Categories {filters.categories.length > 0 && `(${filters.categories.length})`}
                      </span>
                      <ChevronDown className="w-3 h-3 flex-shrink-0" />
                    </button>

                    {openDropdown === 'categories' && (
                      <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#e2e0db] rounded-xl shadow-lg min-w-[240px] max-h-96 overflow-hidden">
                        <div className="p-2 border-b border-[#e2e0db] sticky top-0 bg-white">
                          <div className="flex items-center gap-2 px-2 py-1 bg-[#f5f4f1] rounded-lg">
                            <Search className="w-3.5 h-3.5 text-[#9e9b95] flex-shrink-0" />
                            <input
                              type="text"
                              placeholder="Search categories..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              className="bg-transparent border-none outline-none text-[13px] text-[#1a1917] placeholder-[#9e9b95] flex-1 min-w-0"
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
                                className="h-4 w-4 border-[#c8c5be] data-[state=checked]:bg-[#6046ff] flex-shrink-0"
                              />
                              <span className="text-[13px] font-medium truncate">{category.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )} */}

                {/* Price Range Filter (standalone) */}
{availableFilterTypes.price && (
  <div className="relative" ref={el => el && dropdownRefs.current.set('price', el)}>
    <button
      onClick={() => setOpenDropdown(openDropdown === 'price' ? null : 'price')}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
        filters.priceMin !== undefined || filters.priceMax !== undefined
          ? "border-[#6046ff] text-[#6046ff] bg-[#ede9ff]"
          : "border-[#e2e0db] text-[#6b6862] hover:border-[#6046ff] hover:text-[#6046ff] hover:bg-[#ede9ff]"
      )}
    >
      <Tag className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate max-w-[100px] sm:max-w-none">
        Price Range
        {(filters.priceMin !== undefined || filters.priceMax !== undefined) && (
          <span className="ml-1">
            ({filters.priceMin !== undefined ? `$${filters.priceMin}` : 'Any'} - {filters.priceMax !== undefined ? `$${filters.priceMax}` : 'Any'})
          </span>
        )}
      </span>
      <ChevronDown className="w-3 h-3 flex-shrink-0" />
    </button>

    {openDropdown === 'price' && (
      <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#e2e0db] rounded-xl shadow-lg min-w-[280px] overflow-hidden p-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Min $"
              value={priceRangeMin}
              onChange={(e) => setPriceRangeMin(e.target.value)}
              className="h-8 text-[12px]"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-[#9e9b95]">-</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Max $"
              value={priceRangeMax}
              onChange={(e) => setPriceRangeMax(e.target.value)}
              className="h-8 text-[12px]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                const min = priceRangeMin ? parseFloat(priceRangeMin) : undefined;
                const max = priceRangeMax ? parseFloat(priceRangeMax) : undefined;
                if (min !== undefined || max !== undefined) {
                  setFilters(prev => ({
                    ...prev,
                    priceMin: min,
                    priceMax: max,
                  }));
                  setOpenDropdown(null);
                  setPriceRangeMin('');
                  setPriceRangeMax('');
                  setTimeout(() => fetchProducts(), 0);
                }
              }}
              size="sm"
              className="flex-1 bg-[#6046ff] hover:bg-[#4f38d4] text-white text-[12px] h-8"
              disabled={!priceRangeMin && !priceRangeMax}
            >
              Apply
            </Button>
            {(filters.priceMin !== undefined || filters.priceMax !== undefined) && (
              <Button
                onClick={() => {
                  setFilters(prev => ({
                    ...prev,
                    priceMin: undefined,
                    priceMax: undefined,
                  }));
                  setOpenDropdown(null);
                  setPriceRangeMin('');
                  setPriceRangeMax('');
                  setTimeout(() => fetchProducts(), 0);
                }}
                size="sm"
                variant="outline"
                className="flex-1 text-[12px] h-8"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
)}

{/* Stock Range Filter (standalone) */}
{availableFilterTypes.stock && (
  <div className="relative" ref={el => el && dropdownRefs.current.set('stock', el)}>
    <button
      onClick={() => setOpenDropdown(openDropdown === 'stock' ? null : 'stock')}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2 border rounded-lg text-[13px] font-medium transition-all whitespace-nowrap",
        filters.stockMin !== undefined || filters.stockMax !== undefined
          ? "border-[#6046ff] text-[#6046ff] bg-[#ede9ff]"
          : "border-[#e2e0db] text-[#6b6862] hover:border-[#6046ff] hover:text-[#6046ff] hover:bg-[#ede9ff]"
      )}
    >
      <Package className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="truncate max-w-[100px] sm:max-w-none">
        Stock Range
        {(filters.stockMin !== undefined || filters.stockMax !== undefined) && (
          <span className="ml-1">
            ({filters.stockMin !== undefined ? filters.stockMin : 'Any'} - {filters.stockMax !== undefined ? filters.stockMax : 'Any'})
          </span>
        )}
      </span>
      <ChevronDown className="w-3 h-3 flex-shrink-0" />
    </button>

    {openDropdown === 'stock' && (
      <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#e2e0db] rounded-xl shadow-lg min-w-[280px] overflow-hidden p-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="Min"
              value={stockRangeMin}
              onChange={(e) => setStockRangeMin(e.target.value)}
              className="h-8 text-[12px]"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-[#9e9b95]">-</span>
            <Input
              type="number"
              min="0"
              step="1"
              placeholder="Max"
              value={stockRangeMax}
              onChange={(e) => setStockRangeMax(e.target.value)}
              className="h-8 text-[12px]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                const min = stockRangeMin ? parseInt(stockRangeMin) : undefined;
                const max = stockRangeMax ? parseInt(stockRangeMax) : undefined;
                if (min !== undefined || max !== undefined) {
                  setFilters(prev => ({
                    ...prev,
                    stockMin: min,
                    stockMax: max,
                  }));
                  setOpenDropdown(null);
                  setStockRangeMin('');
                  setStockRangeMax('');
                  setTimeout(() => fetchProducts(), 0);
                }
              }}
              size="sm"
              className="flex-1 bg-[#6046ff] hover:bg-[#4f38d4] text-white text-[12px] h-8"
              disabled={!stockRangeMin && !stockRangeMax}
            >
              Apply
            </Button>
            {(filters.stockMin !== undefined || filters.stockMax !== undefined) && (
              <Button
                onClick={() => {
                  setFilters(prev => ({
                    ...prev,
                    stockMin: undefined,
                    stockMax: undefined,
                  }));
                  setOpenDropdown(null);
                  setStockRangeMin('');
                  setStockRangeMax('');
                  setTimeout(() => fetchProducts(), 0);
                }}
                size="sm"
                variant="outline"
                className="flex-1 text-[12px] h-8"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>
    )}
  </div>
)}

                {/* Date Filters (conditional) */}
                {availableFilterTypes.dates && (
                  <>
                    {dateFilters.map((dateFilter) => (
                      <div key={dateFilter.field} className="relative">
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
                              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate max-w-[100px] sm:max-w-none">
                                {dateFilter.label}
                              </span>
                              {filters[dateFilter.field] && (
                                <span className="ml-1 text-[11px] hidden sm:inline">
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
                <div className="relative">
                  <Popover
                    open={openDropdown === 'more'}
                    onOpenChange={(open) => {
                      setOpenDropdown(open ? 'more' : null);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        ref={moreFiltersButtonRef}
                        className="flex items-center gap-1.5 px-3 py-2 border border-[#e2e0db] rounded-lg text-[13px] font-medium text-[#6b6862] hover:border-[#6046ff] hover:text-[#6046ff] hover:bg-[#ede9ff] transition-all whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate max-w-[80px] sm:max-w-none">More Filters</span>
                        {(availableFilterTypes.productTypes || availableFilterTypes.categories ||
                          availableFilterTypes.dates || availableFilterTypes.price || availableFilterTypes.stock) && (
                            <span className="ml-1 px-1.5 py-0.5 bg-[#6046ff] text-white text-[10px] rounded-full flex-shrink-0">
                              {Object.values(availableFilterTypes).filter(Boolean).length}
                            </span>
                          )}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
  ref={moreFiltersPopoverRef}
  className="w-64 p-2"
  align="start"
  sideOffset={5}
>
  <div className="space-y-1">
    {/* Product Types */}
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addFilterType('productTypes');
        setOpenDropdown(null);
      }}
      className={cn(
        "w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors flex items-center justify-between",
        availableFilterTypes.productTypes
          ? "bg-[#ede9ff] text-[#6046ff]"
          : "hover:bg-[#ede9ff] hover:text-[#6046ff]"
      )}
    >
      <span>Product Types</span>
      {availableFilterTypes.productTypes && (
        <Checkbox checked className="h-4 w-4" />
      )}
    </button>

    {/* Price Range Toggle */}
    <div className="border-t border-[#e2e0db] my-1"></div>
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addFilterType('price');
        setOpenDropdown(null);
      }}
      className={cn(
        "w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors flex items-center justify-between",
        availableFilterTypes.price
          ? "bg-[#ede9ff] text-[#6046ff]"
          : "hover:bg-[#ede9ff] hover:text-[#6046ff]"
      )}
    >
      <span>Price Range</span>
      {availableFilterTypes.price && (
        <Checkbox checked className="h-4 w-4" />
      )}
    </button>

    {/* Stock Range Toggle */}
    <div className="border-t border-[#e2e0db] my-1"></div>
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addFilterType('stock');
        setOpenDropdown(null);
      }}
      className={cn(
        "w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors flex items-center justify-between",
        availableFilterTypes.stock
          ? "bg-[#ede9ff] text-[#6046ff]"
          : "hover:bg-[#ede9ff] hover:text-[#6046ff]"
      )}
    >
      <span>Stock Range</span>
      {availableFilterTypes.stock && (
        <Checkbox checked className="h-4 w-4" />
      )}
    </button>

    {/* Date Filters */}
    <div className="border-t border-[#e2e0db] my-1"></div>
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        addFilterType('dates');
        setOpenDropdown(null);
      }}
      className={cn(
        "w-full text-left px-3 py-2 text-[13px] rounded-lg transition-colors flex items-center justify-between",
        availableFilterTypes.dates
          ? "bg-[#ede9ff] text-[#6046ff]"
          : "hover:bg-[#ede9ff] hover:text-[#6046ff]"
      )}
    >
      <span>Date Filters</span>
      {availableFilterTypes.dates && (
        <Checkbox checked className="h-4 w-4" />
      )}
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

                    {/* Selection Dropdown */}
                    <div className="relative" ref={selectionDropdownRef}>
                      <button
                        onClick={() => setShowSelectionDropdown(!showSelectionDropdown)}
                        disabled={isProcessingSelection}
                        className="flex items-center gap-1.5 text-[12.5px] text-[#6046ff] font-medium hover:underline disabled:opacity-50"
                      >
                        {isProcessingSelection ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            {selectAllFiltered ? 'All products selected' : 'Select options'}
                            <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>

                      {showSelectionDropdown && !isProcessingSelection && !selectAllFiltered && (
                        <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#e2e0db] rounded-xl shadow-lg min-w-[280px] overflow-hidden">
                          <div className="p-2">
                            {/* Filtered option - only show if filters are applied */}
                            {activeFilterChips.length > 0 ? (
                              <button
                                onClick={() => {
                                  setAllSelection(true)
                                  handleCustomProductSelection('filtered')
                                }
                                }
                                className="w-full text-left px-3 py-2.5 text-[13px] rounded-lg hover:bg-[#ede9ff] hover:text-[#6046ff] transition-colors"
                              >
                                <div className="font-medium">Select all filtered products</div>
                                <div className="text-[11px] text-[#9e9b95] mt-0.5">
                                  Based on your current filters ({totalFilteredCount.toLocaleString()} products)
                                </div>
                              </button>
                            ) : (<button
                              onClick={() => {
                                setAllSelection(true)
                                handleCustomProductSelection('all')
                              }
                              }
                              className="w-full text-left px-3 py-2.5 text-[13px] rounded-lg hover:bg-[#ede9ff] hover:text-[#6046ff] transition-colors"
                            >
                              <div className="font-medium">Select all store products</div>
                              <div className="text-[11px] text-[#9e9b95] mt-0.5">
                                All products in your store ({totalFilteredCount.toLocaleString()}+ total)
                              </div>
                            </button>)
                            }

                            {/* All store products option */}


                            {/* Custom range option */}
                            {/* <div className="border-t border-[#e2e0db] my-2"></div> */}
                            {/* <div className="px-3 py-2">
          <div className="font-medium text-[13px] mb-2">Custom range (from current page)</div>
          <div className="flex items-center gap-2 mb-3">
            <Input
              type="number"
              min="1"
              max={products.length}
              value={customNumberRange[0]}
              onChange={(e) => setCustomNumberRange([parseInt(e.target.value) || 1, customNumberRange[1]])}
              className="w-20 h-8 text-[12px]"
              placeholder="From"
            />
            <span className="text-[#9e9b95]">to</span>
            <Input
              type="number"
              min={customNumberRange[0]}
              max={products.length}
              value={customNumberRange[1]}
              onChange={(e) => setCustomNumberRange([customNumberRange[0], parseInt(e.target.value) || customNumberRange[0]])}
              className="w-20 h-8 text-[12px]"
              placeholder="To"
            />
          </div>
          <Button
            onClick={() => handleCustomProductSelection('custom')}
            size="sm"
            className="w-full bg-[#6046ff] hover:bg-[#4f38d4] text-white text-[12px] h-8"
          >
            Select products {customNumberRange[0]} to {customNumberRange[1]}
          </Button>
        </div> */}
                          </div>
                        </div>
                      )}
                    </div>

                    {selectedProducts.length > 0 && (
                      <>
                        <span className="text-[12.5px] text-[#6b6862]">
                          {allSelection ? (
                            <>
                              {totalFilteredCount.toLocaleString()}+ selected
                            </>
                          ) : (
                            <>
                              {selectedProducts.length} selected
                            </>
                          )}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedProducts([]);
                            setSelectAllOnPage(false);
                            setSelectAllFiltered(false);
                            setAllSelection(false)
                          }}
                          className="text-[12.5px] text-[#6046ff] font-medium hover:underline"
                        >
                          Clear
                        </button>
                      </>
                    )}
                  </div>

                  {/* Pagination Controls (keep existing) */}
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
                        onClick={handleLastPage}
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
                  <div className="grid grid-cols-[40px_56px_1fr_100px_110px] items-center px-5 py-2.5 bg-[#f5f4f1] border-b border-[#e2e0db] text-[12px] font-semibold text-[#9e9b95] uppercase tracking-wider">
                    <div></div>
                    <div>Image</div>
                    <div>Product</div>
                    {/* <div>Price</div> */}
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
                      const imageUrl = product.featuredMedia?.preview?.image?.url ||
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
                            "grid grid-cols-[40px_56px_1fr_100px_110px] items-center px-5 py-3 cursor-pointer transition-all hover:bg-[#f5f4f1]",
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
                          {/* <div className="font-mono font-semibold text-[13.5px]">
                            {price}
                          </div> */}
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
                      const imageUrl = product.featuredMedia?.preview?.image?.url ||
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
          <span className="text-sm font-semibold">
          {allSelection ? (
                            <>
                              {totalFilteredCount.toLocaleString()}+ selected
                            </>
                          ) : (
                            <>
                              {selectedProducts.length} selected
                            </>
                          )}
                          </span>
          
          <span className="text-sm text-white/60"> • Ready for {serviceTitles[service]}</span>
        </div>
        <button
          onClick={handleContinue}
          disabled={isProcessingSelection}
          className="flex items-center gap-1.5 bg-[#6046ff] hover:bg-[#4f38d4] rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {isProcessingSelection ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Continue to Optimization
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
        <button
          onClick={() => {
            setSelectedProducts([]);
            setSelectAllOnPage(false);
            setSelectAllFiltered(false);
            setAllSelection(false)
          }}
          className="text-sm text-white/50 hover:text-white transition-colors"
        >
          Clear
        </button>
      </div>
    </AppLayout>
  );
}