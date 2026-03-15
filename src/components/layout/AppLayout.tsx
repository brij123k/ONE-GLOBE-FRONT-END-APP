import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Type,
  FileText,
  Search as SearchIcon,
  Image,
  Tag,
  Sparkles,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bell,
  ChevronDown,
  Barcode,
  Grid,
  Layers,
  Hash,
  Database,
  Box,
  Users,
  FolderTree,
  Palette,
  ShoppingBag,
  Archive,
  Gauge,
  Mic,
  Globe,
  Link as LinkIcon,
  Shield,
  BarChart,
  Cloud,
  Smartphone,
  Code,
  Zap,
  Award,
  Rocket,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Helper function
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Navigation sections with all services
const navSections = [
  {
    title: "Dashboard",
    items: [
      { icon: LayoutDashboard, label: "Overview", path: "/", end: true },
      // { icon: BarChart, label: "Analytics", path: "/analytics" },
      // { icon: Gauge, label: "Performance", path: "/performance" },
    ]
  },
  {
    title: "SEO Optimization",
    items: [
      { icon: Type, label: "Title Optimization", path: "/products?service=title", popular: true },
      { icon: FileText, label: "Description", path: "/products?service=description", popular: true },
      { icon: SearchIcon, label: "Meta Title", path: "/products?service=metaTitle" },
      { icon: SearchIcon, label: "Meta Description", path: "/products?service=metaDescription" },
      { icon: SearchIcon, label: "Meta Handle", path: "/products?service=handle" },
      // { icon: Globe, label: "URL Optimization", path: "/products?service=url" },
      // { icon: LinkIcon, label: "Canonical URLs", path: "/products?service=canonical" },
    ]
  },
  {
    title: "Pricing & Inventory",
    items: [
      { icon: DollarSign, label: "Price Optimization", path: "/products?service=pricing", popular: true },
    ]
  },
  {
    title: "Image & Media",
    items: [
      { icon: Image, label: "Image ALT Text", path: "/products?service=imageALT" },
      { icon: Image, label: "Image Name", path: "/products?service=imageName" },
      // { icon: Image, label: "Image Size Optimization", path: "/products?service=image", popular: true },
      // { icon: Palette, label: "Image Colors", path: "/products?service=imageColors" },
      // { icon: Cloud, label: "CDN Optimization", path: "/cdn-optimization" },
    ]
  },
  {
    title: "Product Data",
    items: [
      { icon: Barcode, label: "SKU Optimization", path: "/products?service=sku" },
      { icon: Grid, label: "Product Type", path: "/products?service=productType" },
      { icon: Users, label: "Vendor Optimization", path: "/products?service=vendor" },
      { icon: Layers, label: "Collection Management", path: "/products?service=collection", popular: true },
      { icon: Hash, label: "Tag Optimization", path: "/products?service=tag" },
      // { icon: FolderTree, label: "Category Mapping", path: "/products?service=category" },
      // { icon: Box, label: "Variant Optimization", path: "/products?service=variants" },
      // { icon: Archive, label: "Bulk Archive", path: "/bulk-archive" },
    ]
  },

  {
    title: "Advanced Tools",
    items: [
      { icon: Settings, label: "Specifications", path: "/products?service=specification" },
      // { icon: Database, label: "Metafields", path: "/products?service=metafields", popular: true },
      // { icon: Code, label: "JSON-LD Schema", path: "/schema-optimization" },
      // { icon: Zap, label: "Bulk Editor", path: "/bulk-editor" },
      // { icon: Rocket, label: "Bulk Publishing", path: "/bulk-publish" },
      // { icon: Shield, label: "SEO Audit", path: "/seo-audit" },
      // { icon: Smartphone, label: "Mobile Optimization", path: "/mobile-optimization" },
    ]
  },
  // {
  //   title: "AI Features",
  //   items: [
  //     { icon: Mic, label: "Voice Search", path: "/voice-search" },
  //     { icon: Award, label: "Competitor Analysis", path: "/competitor-analysis" },
  //     { icon: Sparkles, label: "AI Content Gen", path: "/ai-content" },
  //     { icon: Sparkles, label: "More AI Tools", path: "/more-tools", comingSoon: true },
  //   ]
  // }
];

const bottomNavItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: HelpCircle, label: "Help & Support", path: "/help" },
];

// Sidebar Component
interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
  shop: any;
}

function AppSidebar({ collapsed, setCollapsed, isMobile, shop }: AppSidebarProps) {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<string[]>(navSections.map(s => s.title));
  const searchParams = new URLSearchParams(location.search);
  const currentService = searchParams.get("service");

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const sidebar = document.querySelector('aside');

      if (isMobile && !collapsed && sidebar && !sidebar.contains(target)) {
        setCollapsed(true);
      }
    };

    if (isMobile && !collapsed) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobile, collapsed, setCollapsed]);
  const getInitials = (name?: string) => {
    if (!name) return '';

    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) {
      return (
        parts[0][0].toUpperCase() +
        parts[1][0].toUpperCase()
      );
    }

    // If only one name, take first two letters
    return parts[0].substring(0, 2).toUpperCase();
  };
  const toggleSection = (sectionTitle: string) => {
    setOpenSections(prev =>
      prev.includes(sectionTitle)
        ? prev.filter(t => t !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#e2e0db] bg-white">
        {!collapsed ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#95BF46] flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[#1a1917] truncate text-sm">AI Optimizer</span>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-[#95BF46] flex items-center justify-center mx-auto flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
        )}

        {/* Desktop collapse button */}
        {!isMobile && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#9e9b95] hover:text-[#1a1917] flex-shrink-0"
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Bar - Only when expanded */}
      {/* {!collapsed && (
        <div className="p-3 border-b border-[#e2e0db] bg-white">
          <div className="flex items-center gap-2 px-2 py-1.5 bg-[#f5f4f1] rounded-lg">
            <SearchIcon className="w-3.5 h-3.5 text-[#9e9b95]" />
            <input
              type="text"
              placeholder="Search tools..."
              className="bg-transparent border-none outline-none text-[12px] text-[#1a1917] placeholder-[#9e9b95] w-full"
            />
          </div>
        </div>
      )} */}

      {/* Main Navigation */}
      <ScrollArea className="flex-1 bg-white">
        <nav className="p-3 space-y-4">
          {navSections.map((section) => (
            <Collapsible
              key={section.title}
              open={openSections.includes(section.title)}
              onOpenChange={() => toggleSection(section.title)}
            >
              {!collapsed && (
                <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-[11px] font-semibold text-[#9e9b95] uppercase tracking-wider hover:text-[#95BF46]">
                  <span>{section.title}</span>
                  <ChevronDown className={cn(
                    "w-3 h-3 transition-transform",
                    openSections.includes(section.title) ? "rotate-180" : ""
                  )} />
                </CollapsibleTrigger>
              )}
              <CollapsibleContent className="space-y-0.5">
                {section.items.map((item) => {
                  const itemService = new URLSearchParams(item.path.split("?")[1]).get("service");

                  const isActive = item.end
                    ? location.pathname === item.path
                    : itemService
                      ? location.pathname === "/products" && currentService === itemService
                      : location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.comingSoon ? "#" : item.path}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group relative",
                        isActive
                          ? "bg-[#ede9ff] text-[#95BF46]"
                          : "text-[#6b6862] hover:bg-[#f5f4f1] hover:text-[#1a1917]",
                        item.comingSoon && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={(e) => {
                        if (item.comingSoon) {
                          e.preventDefault();
                        }
                        if (isMobile) {
                          setCollapsed(true);
                        }
                      }}
                    >
                      <item.icon className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isActive ? "text-[#95BF46]" : "text-[#9e9b95]"
                      )} />
                      {!collapsed && (
                        <>
                          <span className="font-medium text-[12.5px] truncate">{item.label}</span>
                          {item.popular && (
                            <span className="ml-auto text-[9px] font-medium bg-[#ede9ff] text-[#95BF46] px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Popular
                            </span>
                          )}
                          {item.comingSoon && (
                            <span className="ml-auto text-[9px] font-medium bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Soon
                            </span>
                          )}
                        </>
                      )}
                      {collapsed && item.popular && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#6046ff] rounded-full" />
                      )}
                      {collapsed && item.comingSoon && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-[#e2e0db] space-y-1 bg-white">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-[#ede9ff] text-[#95BF46]"
                  : "text-[#6b6862] hover:bg-[#f5f4f1] hover:text-[#1a1917]"
              )}
              onClick={() => isMobile && setCollapsed(true)}
            >
              <item.icon className={cn(
                "w-4 h-4 flex-shrink-0",
                isActive ? "text-[#95BF46]" : "text-[#9e9b95]"
              )} />
              {!collapsed && (
                <span className="font-medium text-[12.5px] truncate">{item.label}</span>
              )}
            </Link>
          );
        })}

        {/* User Profile - Only when expanded */}
        {!collapsed && (
          <div className="mt-4 pt-4 border-t border-[#e2e0db]">
            <div className="flex items-center gap-3 px-3 py-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-[#95BF46] text-white text-xs">
                  {getInitials(shop.owner)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-medium text-[#1a1917] truncate">{shop.owner}</p>
                <p className="text-[11px] text-[#9e9b95] truncate">plan: {shop.plan}</p>
              </div>
            </div>
          </div>
        )}

        {/* Desktop collapse button when collapsed */}
        {!isMobile && collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-10 text-[#9e9b95] hover:text-[#1a1917] mt-2"
            onClick={() => setCollapsed(false)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        {/* Mobile sidebar overlay */}
        <div
          className={cn(
            "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
            collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
          )}
          onClick={() => setCollapsed(true)}
        />

        {/* Mobile sidebar */}
        <aside
          className={cn(
            "fixed top-0 left-0 h-full bg-white border-r border-[#e2e0db] flex flex-col z-50 transition-all duration-300 ease-out",
            collapsed ? "-translate-x-full" : "translate-x-0",
            "w-72"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {sidebarContent}
        </aside>
      </>
    );
  }

  return (
    <aside
      className={cn(
        "h-screen bg-white border-r border-[#e2e0db] flex flex-col transition-all duration-300 ease-out sticky top-0",
        collapsed ? "w-16" : "w-72"
      )}
    >
      {sidebarContent}
    </aside>
  );
}

// Header Component (keep existing AppHeader component)
interface AppHeaderProps {
  title?: string;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
  shop: any;
}

function AppHeader({ title, sidebarCollapsed, setSidebarCollapsed, isMobile, shop }: AppHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const getInitials = (name?: string) => {
    if (!name) return '';

    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) {
      return (
        parts[0][0].toUpperCase() +
        parts[1][0].toUpperCase()
      );
    }

    // If only one name, take first two letters
    return parts[0].substring(0, 2).toUpperCase();
  };
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 h-16 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-[#e2e0db] flex items-center px-4 sm:px-6 z-30 transition-all duration-200",
        scrolled && "shadow-sm"
      )}
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="text-[#9e9b95] hover:text-[#1a1917]"
            onClick={() => {
              setSidebarCollapsed(!sidebarCollapsed);
            }}
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </Button>
        )}

        {/* Desktop collapse button when collapsed */}
        {!isMobile && sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="text-[#9e9b95] hover:text-[#1a1917]"
            onClick={() => setSidebarCollapsed(false)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}

        {/* Title */}
        {title && (
          <h1 className="text-lg sm:text-xl font-semibold text-[#1a1917] truncate max-w-[200px] sm:max-w-none">
            {title}
          </h1>
        )}
      </div>

      {/* Center section - Search */}
      <div className="flex-1 flex justify-center"></div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-[#9e9b95] hover:text-[#1a1917]"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#95BF46] rounded-full animate-pulse" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              <div className="p-3">
                <p className="text-sm text-[#9e9b95] text-center">
                  No new notifications
                </p>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-2 text-[#9e9b95] hover:text-[#1a1917] px-2"
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-[#95BF46] text-white text-sm">
                  {getInitials(shop.owner)}
                </AvatarFallback>
              </Avatar>
              {!isMobile && (
                <>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium truncate">{shop?.owner || "User"}</p>
                    <p className="text-xs text-[#9e9b95] truncate">Plan: {shop?.plan || "Free"}</p>
                  </div>
                  <ChevronDown className="hidden sm:block w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-2">
              <p className="text-sm font-semibold">{shop?.owner || "Not Set"}</p>
              <p className="text-xs text-[#9e9b95]">{shop?.email || "user@example.com"}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Help & Support</DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// Main AppLayout Component
interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  shop?: any;
}

export function AppLayout({ children, title, shop: initialShop }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (mobile) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get shop data from localStorage
  const [shop, setShop] = useState(initialShop || {});

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("shop") || "{}");
    setShop(data);
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f4f1] font-['DM_Sans']">
      <div className="flex">
        {/* Sidebar */}
        <AppSidebar
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          isMobile={isMobile}
          shop={shop}
        />

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
        )}>
          <AppHeader
            title={title}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            isMobile={isMobile}
            shop={shop}
          />

          {/* Content Area */}
          <main className="flex-1 overflow-y-auto">
            <div className="w-full max-w-full">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-[#e2e0db] bg-white py-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#9e9b95]">
              <div className="text-center sm:text-left">
                © {new Date().getFullYear()} AI Optimizer. All rights reserved.
              </div>
              <div className="flex items-center gap-6">
                <Link to="/privacy" className="hover:text-[#95BF46] transition-colors">Privacy</Link>
                <Link to="/terms" className="hover:text-[#95BF46] transition-colors">Terms</Link>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}