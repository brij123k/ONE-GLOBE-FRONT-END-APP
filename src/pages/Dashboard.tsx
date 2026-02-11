import { AppLayout } from "@/components/layout/AppLayout";
import { OptimizationCard } from "@/components/dashboard/OptimizationCard";
import { StatsCard } from "@/components/dashboard/StatsCard";
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
} from "lucide-react";
import { useEffect, useState } from "react";
import { Description } from "@radix-ui/react-toast";

const optimizationTools = [
  {
    icon: Type,
    title: "Title Optimization",
    description: "AI-powered product title optimization for better SEO and conversion rates.",
    path: "/products?service=title",
  },
  {
    icon: FileText,
    title: "Description Optimization",
    description: "Generate compelling product descriptions that convert visitors to buyers.",
    path: "/products?service=description",
  },
  {
    icon: Search,
    title: "Meta Title",
    description: "Optimize meta Titles for improved search engine visibility and CTR.",
    path: "/products?service=metaTitle",
  },
  {
    icon: Search,
    title: "Meta Description",
    description: "Optimize meta Descriptions for improved search engine visibility and CTR.",
    path: "/products?service=metaDescription",
  },
  {
    icon: Search,
    title: "Meta Handle",
    description: "Optimize meta Handler for improved search engine visibility and CTR.",
    path: "/products?service=handle",
  },
  // {
  //   icon:Image,
  //   title:"Image ALT & Title Optimization",
  //   description:"",
  //   path:"/products?service=imageALT"
  // },
  {
    icon: Image,
    title: "Image Size Optimization",
    description: "Compress and optimize images for SEO and faster loading without quality loss.",
    path: "/products?service=image",
  },
  {
    icon: Tag,
    title: "SEO Keywords",
    description: "Discover and integrate high-performing keywords into your products.",
    path: "/products?service=keywords",
  },
  {
    icon: Sparkles,
    title: "More AI Tools",
    description: "Access additional AI-powered optimization tools coming soon.",
    path: "/more-tools",
    gradient: true,
    comingSoon: true,
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

export default function Dashboard() {
  const [storeDetail,setStoreDetails]=useState({})
  useEffect(()=>{
  const handleStore=()=>{
   const data= JSON.parse(localStorage.getItem("shop"));
   setStoreDetails(data)
  }
  handleStore()
  },[])
  return (
    <AppLayout title="Dashboard">
      <div className="p-6 space-y-8">
        {/* Welcome Section */}
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground">Welcome {storeDetail.owner}</h2>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your store's AI optimization status.
          </p>
        </div>

        {/* Stats Grid */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {stats.map((stat) => (
            <StatsCard key={stat.label} {...stat} />
          ))}
        </div> */}

        {/* Optimization Tools */}
        <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">AI Optimization Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {optimizationTools.map((tool) => (
              <OptimizationCard key={tool.title} {...tool} />
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
