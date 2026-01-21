import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mock product data
const mockProducts = [
  { id: "1", title: "Premium Wireless Headphones", sku: "WH-001", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop", status: "active", type: "Electronics", vendor: "TechBrand" },
  { id: "2", title: "Organic Cotton T-Shirt", sku: "TS-002", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop", status: "active", type: "Apparel", vendor: "EcoWear" },
  { id: "3", title: "Stainless Steel Water Bottle", sku: "WB-003", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=100&h=100&fit=crop", status: "draft", type: "Accessories", vendor: "HydrateLife" },
  { id: "4", title: "Leather Crossbody Bag", sku: "LB-004", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop", status: "active", type: "Accessories", vendor: "LuxBags" },
  { id: "5", title: "Bluetooth Smart Watch", sku: "SW-005", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop", status: "active", type: "Electronics", vendor: "TechBrand" },
  { id: "6", title: "Yoga Mat Premium", sku: "YM-006", image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=100&h=100&fit=crop", status: "active", type: "Fitness", vendor: "FitGear" },
  { id: "7", title: "Ceramic Coffee Mug Set", sku: "CM-007", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=100&h=100&fit=crop", status: "draft", type: "Home", vendor: "CozyHome" },
  { id: "8", title: "Running Shoes Pro", sku: "RS-008", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop", status: "active", type: "Footwear", vendor: "SprintX" },
];

const serviceTitles: Record<string, string> = {
  title: "Title Optimization",
  description: "Description Optimization",
  meta: "Meta SEO Optimization",
  image: "Image Optimization",
  keywords: "Keywords Optimization",
};

export default function ProductSelection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const service = searchParams.get("service") || "title";
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      const matchesType = typeFilter === "all" || product.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [searchQuery, statusFilter, typeFilter]);

  const productTypes = [...new Set(mockProducts.map((p) => p.type))];

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

  const handleContinue = () => {
    if (selectedProducts.length > 0) {
      navigate(`/${service}-optimization?products=${selectedProducts.join(",")}`);
    }
  };

  return (
    <AppLayout title={serviceTitles[service] || "Product Selection"}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Select Products</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Choose products to optimize with AI
            </p>
          </div>
          <Button
            onClick={handleContinue}
            disabled={selectedProducts.length === 0}
            className="bg-gradient-ai hover:opacity-90 text-primary-foreground gap-2"
          >
            Continue to Optimization
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {productTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-none", viewMode === "list" && "bg-secondary")}
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-none", viewMode === "grid" && "bg-secondary")}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Selection Info */}
        <div className="flex items-center justify-between py-3 px-4 bg-secondary/50 rounded-lg animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
              onCheckedChange={toggleAll}
            />
            <span className="text-sm text-muted-foreground">
              {selectedProducts.length} of {filteredProducts.length} products selected
            </span>
          </div>
          {selectedProducts.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedProducts([])}>
              Clear selection
            </Button>
          )}
        </div>

        {/* Product List/Grid */}
        <div
          className={cn(
            "animate-fade-in",
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-2"
          )}
          style={{ animationDelay: "0.2s" }}
        >
          {filteredProducts.map((product) => {
            const isSelected = selectedProducts.includes(product.id);
            
            if (viewMode === "grid") {
              return (
                <div
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={cn(
                    "bg-card border rounded-xl p-4 cursor-pointer transition-smooth",
                    isSelected
                      ? "border-primary shadow-card-hover ring-2 ring-primary/20"
                      : "border-border hover:border-primary/30 hover:shadow-card"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox checked={isSelected} className="mt-1" />
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  </div>
                  <h4 className="font-medium text-foreground mt-3 line-clamp-2">{product.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{product.sku}</p>
                  <Badge
                    variant={product.status === "active" ? "default" : "secondary"}
                    className={cn(
                      "mt-2 text-xs",
                      product.status === "active" ? "bg-success/10 text-success hover:bg-success/20" : ""
                    )}
                  >
                    {product.status}
                  </Badge>
                </div>
              );
            }

            return (
              <div
                key={product.id}
                onClick={() => toggleProduct(product.id)}
                className={cn(
                  "bg-card border rounded-xl p-4 flex items-center gap-4 cursor-pointer transition-smooth",
                  isSelected
                    ? "border-primary shadow-card-hover ring-2 ring-primary/20"
                    : "border-border hover:border-primary/30 hover:shadow-card"
                )}
              >
                <Checkbox checked={isSelected} />
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-14 h-14 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">{product.title}</h4>
                  <p className="text-sm text-muted-foreground">{product.sku}</p>
                </div>
                <div className="hidden sm:block text-sm text-muted-foreground">{product.type}</div>
                <div className="hidden md:block text-sm text-muted-foreground">{product.vendor}</div>
                <Badge
                  variant={product.status === "active" ? "default" : "secondary"}
                  className={cn(
                    "text-xs",
                    product.status === "active" ? "bg-success/10 text-success hover:bg-success/20" : ""
                  )}
                >
                  {product.status}
                </Badge>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No products found</h3>
            <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
