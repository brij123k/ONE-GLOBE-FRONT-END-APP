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
  // {
  //   icon: Image,
  //   title: "Image Size Optimization",
  //   description: "Compress and optimize images for faster loading without quality loss.",
  //   path: "/products?service=image",
  //   category: "media",
  //   popular: true,
  // },
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

  const popularTools = optimizationTools.filter(tool => tool.popular && !tool.comingSoon);

  return (
    <AppLayout>
      <div className="min-h-screen font-['DM_Sans'] bg-[#f5f4f1]">
        <div className="p-7">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-[22px] font-bold text-[#95BF46]">
              Welcome back, {storeDetail.owner || 'Store Owner'}
            </h1>
            <p className="text-[13.5px] text-[#6b6862] mt-1">
              Here's an overview of your store's AI optimization status.
            </p>
          </div>

          {/* Stats Grid */}
          {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-[#e2e0db] rounded-xl p-5 hover:border-[#6046ff] transition-all hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-[#ede9ff] rounded-lg">
                    <stat.icon className="w-5 h-5 text-[#6046ff]" />
                  </div>
                  <span className={cn(
                    "text-[12px] font-medium px-2 py-1 rounded-full",
                    stat.changeType === 'positive' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  )}>
                    {stat.change}
                  </span>
                </div>
                <div>
                  <h3 className="text-[22px] font-bold text-[#1a1917]">{stat.value}</h3>
                  <p className="text-[13px] text-[#6b6862] mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div> */}

          {/* Quick Actions / Popular Tools */}
          {/* <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1a1917]">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularTools.slice(0, 4).map((tool) => (
                <div
                  key={tool.title}
                  onClick={() => navigate(tool.path)}
                  className="bg-white border border-[#e2e0db] rounded-xl p-5 cursor-pointer hover:border-[#6046ff] hover:-translate-y-0.5 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-[#ede9ff] rounded-lg group-hover:bg-[#6046ff] transition-colors">
                      <tool.icon className="w-5 h-5 text-[#6046ff] group-hover:text-white" />
                    </div>
                    <span className="text-[11px] font-medium text-[#6046ff] bg-[#ede9ff] px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#1a1917] mb-1">{tool.title}</h3>
                  <p className="text-[12px] text-[#6b6862] line-clamp-2">{tool.description}</p>
                </div>
              ))}
            </div>
          </div> */}

          {/* Search and Filter Bar */}
          <div className="bg-white border border-[#e2e0db] rounded-xl p-5 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 border border-[#e2e0db] rounded-lg px-3 py-2 bg-[#f5f4f1]">
                  <Search className="w-4 h-4 text-[#9e9b95]" />
                  <input
                    type="text"
                    placeholder="Search optimization tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-[13px] text-[#1a1917] placeholder-[#9e9b95] flex-1"
                  />
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium whitespace-nowrap transition-all",
                      selectedCategory === category.id
                        ? "bg-[#95BF46] text-white"
                        : "bg-[#f5f4f1] text-[#6b6862] hover:bg-[#ede9ff] hover:text-[#95BF46]"
                    )}
                  >
                    <category.icon className="w-4 h-4" />
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tools Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1a1917]">
                {selectedCategory === 'all' ? 'All Optimization Tools' : 
                 categories.find(c => c.id === selectedCategory)?.label}
              </h2>
              <span className="text-[13px] text-[#6b6862]">
                {filteredTools.length} tools available
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTools.map((tool) => (
                <OptimizationCard key={tool.title} {...tool} />
              ))}
            </div>
          </div>

          {/* Empty State */}
          {filteredTools.length === 0 && (
            <div className="text-center py-16 bg-white border border-[#e2e0db] rounded-xl">
              <Sparkles className="w-16 h-16 text-[#9e9b95] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#1a1917]">No tools found</h3>
              <p className="text-sm text-[#6b6862] mt-2 mb-6 max-w-md mx-auto">
                Try adjusting your search or filter to find what you're looking for.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                }}
                className="border-[#e2e0db] hover:border-[#95BF46] hover:text-[#95BF46]"
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