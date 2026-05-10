import { AppLayout } from "@/components/layout/AppLayout";
import { OptimizationCard } from "@/components/dashboard/OptimizationCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import {
  Type,
  FileText,
  Search,
  Image,
  Tag,
  Sparkles,
  Package,
  TrendingUp,
  CheckCircle2,
  Clock,
  Barcode,
  Grid,
  Layers,
  Hash,
  Settings,
  Database,
  Box,
  ShoppingBag,
  Archive,
  Users,
  FolderTree,
  Palette,
  DollarSign,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const optimizationTools = [
  // Core SEO Tools
  {
    icon: Type,
    title: "Title Optimization",
    description: "AI-powered product title optimization for better SEO and conversion rates.",
    path: "/products?service=title",
    category: "seo",
    popular: true,
  },
  {
    icon: FileText,
    title: "Description Optimization",
    description: "Generate compelling product descriptions that convert visitors to buyers.",
    path: "/products?service=description",
    category: "seo",
    popular: true,
  },
  {
    icon: Search,
    title: "Meta Title",
    description: "Optimize meta titles for improved search engine visibility and CTR.",
    path: "/products?service=metaTitle",
    category: "seo",
  },
  {
    icon: Search,
    title: "Meta Description",
    description: "Optimize meta descriptions for improved search engine visibility and CTR.",
    path: "/products?service=metaDescription",
    category: "seo",
  },
  {
    icon: Search,
    title: "Meta Handle",
    description: "Optimize URL handles for better SEO and user experience.",
    path: "/products?service=handle",
    category: "seo",
  },

  {
    icon: DollarSign,
    title: "Price Optimization",
    description: "Optimize price for better user experience.",
    path: "/products?service=pricing",
    category: "seo",
  },
  
  // Image & Media Tools
  {
    icon: Image,
    title: "Image ALT Text",
    description: "Optimize image ALT text for better accessibility and SEO rankings.",
    path: "/products?service=imageALT",
    category: "media",
  },
  {
    icon: Image,
    title: "Image Name Optimization",
    description: "optimize image Name for better SEO Ranking",
    path: "/products?service=imageName",
    category: "media",
  },
  // {
  //   icon: Palette,
  //   title: "Image Title Tags",
  //   description: "Optimize image title tags for improved image search visibility.",
  //   path: "/products?service=imageTitle",
  //   category: "media",
  // },
  
  // Product Data Tools
  {
    icon: Barcode,
    title: "SKU Optimization",
    description: "Standardize and optimize SKU formats for better inventory management.",
    path: "/products?service=sku",
    category: "data",
  },
  {
    icon: Grid,
    title: "Product Type",
    description: "Optimize product categorization for better store navigation.",
    path: "/products?service=productType",
    category: "data",
  },
  {
    icon: Users,
    title: "Vendor Optimization",
    description: "Standardize vendor names and improve brand consistency.",
    path: "/products?service=vendor",
    category: "data",
  },
  {
    icon: Layers,
    title: "Collection Management",
    description: "Optimize product collections for better organization and discovery.",
    path: "/products?service=collection",
    category: "data",
    popular: true,
  },
  {
    icon: Hash,
    title: "Tag Optimization",
    description: "Optimize product tags for improved search and filtering.",
    path: "/products?service=tag",
    category: "data",
  },
  
  // Advanced Tools
  {
    icon: Settings,
    title: "Specification Optimization",
    description: "Standardize and enhance product specifications and attributes.",
    path: "/products?service=specification",
    category: "advanced",
  },
  {
    icon: Database,
    title: "Metafields Management",
    description: "Optimize custom metafields for enhanced product data.",
    path: "/products?service=metafields",
    category: "advanced",
    popular: true,
  },
  // {
  //   icon: Box,
  //   title: "Bulk Product Editor",
  //   description: "Edit multiple products simultaneously with AI assistance.",
  //   path: "/bulk-editor",
  //   category: "advanced",
  // },
  // {
  //   icon: ShoppingBag,
  //   title: "Variant Optimization",
  //   description: "Optimize product variants and options for better UX.",
  //   path: "/products?service=variants",
  //   category: "advanced",
  // },
  // {
  //   icon: FolderTree,
  //   title: "Category Mapping",
  //   description: "Map products to correct categories for better navigation.",
  //   path: "/products?service=category",
  //   category: "data",
  // },
  // {
  //   icon: Archive,
  //   title: "Bulk Archive/Unarchive",
  //   description: "Bulk manage product status across your store.",
  //   path: "/bulk-archive",
  //   category: "advanced",
  // },
  
  // Coming Soon
  {
    icon: Sparkles,
    title: "More AI Tools",
    description: "Access additional AI-powered optimization tools coming soon.",
    path: "/more-tools",
    gradient: true,
    comingSoon: true,
    category: "coming-soon",
  },
];

const stats = [
  {
    icon: Package,
    label: "Total Products",
    value: "1,247",
    change: "+12%",
    changeType: "positive" as const,
  },
  {
    icon: TrendingUp,
    label: "Optimized This Month",
    value: "384",
    change: "+28%",
    changeType: "positive" as const,
  },
  {
    icon: CheckCircle2,
    label: "Avg. SEO Score",
    value: "87%",
    change: "+5%",
    changeType: "positive" as const,
  },
  {
    icon: Clock,
    label: "Pending Review",
    value: "23",
    change: "-8%",
    changeType: "negative" as const,
  },
];

const categories = [
  { id: "all", label: "All Tools", icon: Sparkles },
  { id: "seo", label: "SEO Tools", icon: Search },
  { id: "media", label: "Image & Media", icon: Image },
  { id: "data", label: "Product Data", icon: Package },
  { id: "advanced", label: "Advanced", icon: Settings },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [storeDetail, setStoreDetails] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleStore = () => {
      const data = JSON.parse(localStorage.getItem("shop") || "{}");
      setStoreDetails(data);
    };
    handleStore();
  }, []);

  const filteredTools = optimizationTools.filter(tool => {
    const matchesCategory = selectedCategory === "all" || tool.category === selectedCategory;
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <AppLayout>
      <div className="min-h-screen bg-transparent font-['DM_Sans']">
        <div className="p-5 md:p-7 space-y-6">
          <div className="neon-card p-6 md:p-7 overflow-hidden">
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.3em] text-cyan-300/80 mb-2">
                  Store Intelligence
                </p>
                <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight">
                  Welcome back, {storeDetail.owner || "Store Owner"}
                </h1>
                <p className="text-sm md:text-base text-slate-400 mt-3 max-w-xl">
                  Here’s a live view of your store’s optimization stack, curated in the same neon 3D style as Overview.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => navigate("/")}>Overview</Button>
                <Button onClick={() => navigate("/products")}>Open Product Tools</Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <StatsCard key={stat.label} {...stat} />
            ))}
          </div>

          <div className="neon-card p-4 md:p-5">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 rounded-xl border border-cyan-500/15 bg-[#09111d] px-3 py-2.5">
                  <Search className="w-4 h-4 text-cyan-300" />
                  <input
                    type="text"
                    placeholder="Search optimization tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm text-slate-100 placeholder:text-slate-500 flex-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border",
                      selectedCategory === category.id
                        ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                        : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-100 hover:border-cyan-500/15"
                    )}
                  >
                    <category.icon className="w-4 h-4" />
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  {selectedCategory === "all"
                    ? "All Optimization Tools"
                    : categories.find((c) => c.id === selectedCategory)?.label}
                </h2>
                <p className="text-sm text-slate-500">
                  {filteredTools.length} tools available
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredTools.map((tool) => (
                <OptimizationCard key={tool.title} {...tool} />
              ))}
            </div>
          </div>

          {filteredTools.length === 0 && (
            <div className="neon-card text-center py-16 px-6">
              <Sparkles className="w-16 h-16 text-cyan-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white">No tools found</h3>
              <p className="text-sm text-slate-400 mt-2 mb-6 max-w-md mx-auto">
                Try adjusting your search or filter to find what you&apos;re looking for.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
