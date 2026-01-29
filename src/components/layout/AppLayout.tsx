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

// Helper function
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Navigation items
const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Type, label: "Title Optimization", path: "/products?service=title" },
  { icon: FileText, label: "Description", path: "/products?service=description" },
  { icon: SearchIcon, label: "Meta SEO", path: "/meta-optimization" },
  { icon: Image, label: "Image Optimization", path: "/image-optimization" },
  { icon: Tag, label: "Keywords", path: "/keywords-optimization" },
  { icon: Sparkles, label: "More AI Tools", path: "/more-tools", comingSoon: true },
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
}

function AppSidebar({ collapsed, setCollapsed, isMobile }: AppSidebarProps) {
  const location = useLocation();

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

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground truncate">AI Optimizer</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mx-auto flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}
        
        {/* Desktop collapse button */}
        {!isMobile && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-1">
          {mainNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.comingSoon ? "#" : item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  isActive
                    ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
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
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-blue-600" : "text-muted-foreground"
                )} />
                {!collapsed && (
                  <>
                    <span className="font-medium text-sm truncate">{item.label}</span>
                    {item.comingSoon && (
                      <span className="ml-auto text-[10px] font-medium bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded flex-shrink-0">
                        Soon
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.comingSoon && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="p-3 border-t border-border space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
              onClick={() => isMobile && setCollapsed(true)}
            >
              <item.icon className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive ? "text-blue-600" : "text-muted-foreground"
              )} />
              {!collapsed && (
                <span className="font-medium text-sm truncate">{item.label}</span>
              )}
            </Link>
          );
        })}

        {/* Desktop collapse button when collapsed */}
        {!isMobile && collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-10 text-muted-foreground hover:text-foreground mt-2"
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
            "fixed top-0 left-0 h-full bg-card border-r border-border flex flex-col z-50 transition-all duration-300 ease-out",
            collapsed ? "-translate-x-full" : "translate-x-0",
            "w-64"
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
        "h-screen bg-card border-r border-border flex flex-col transition-all duration-300 ease-out sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {sidebarContent}
    </aside>
  );
}

// Header Component
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
        "sticky top-0 h-16 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border flex items-center px-4 sm:px-6 z-30 transition-all duration-200",
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
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              console.log("Mobile menu clicked, current state:", sidebarCollapsed);
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
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarCollapsed(false)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        )}

        {/* Title */}
        {title && (
          <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate max-w-[200px] sm:max-w-none">
            {title}
          </h1>
        )}
      </div>

      {/* Center section - Search */}
      <div className="flex-1 flex justify-center">
        <div className={cn(
          "relative transition-all duration-300",
          searchOpen ? "w-full max-w-2xl" : "w-0 opacity-0 pointer-events-none",
          "sm:w-64 sm:opacity-100 sm:pointer-events-auto"
        )}>
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="w-full pl-9 bg-secondary/50 border-border focus:bg-background"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Mobile search button */}
        {isMobile && !searchOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <SearchIcon className="w-5 h-5" />
          </Button>
        )}

        {/* Mobile search close button */}
        {isMobile && searchOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setSearchOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        )}

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-foreground"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto scrollbar-thin">
              <div className="p-3">
                <p className="text-sm text-muted-foreground text-center">
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
              className="gap-2 text-muted-foreground hover:text-foreground px-2"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src="/api/placeholder/32/32" alt="User" />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm">
                  JD
                </AvatarFallback>
              </Avatar>
              {!isMobile && (
                <>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium truncate">{shop?.owner || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">Plan: {shop?.plan || "Free"}</p>
                  </div>
                  <ChevronDown className="hidden sm:block w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="p-2">
              <p className="text-sm font-semibold">{shop?.owner || "Not Set"}</p>
              <p className="text-xs text-muted-foreground">{shop?.email || "user@example.com"}</p>
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed by default
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const handleStore = () => {
      const data = JSON.parse(localStorage.getItem("shop") || "{}");
      return data;
    };
    handleStore();
  }, []);

  // Handle responsive behavior - FIXED LOGIC
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // IMPORTANT FIX: On mobile, sidebar should start collapsed (hidden)
      // On desktop, it should start expanded (visible)
      if (mobile) {
        // On mobile: sidebar is collapsed (hidden off-screen)
        setSidebarCollapsed(true);
      } else {
        // On desktop: sidebar is expanded (visible)
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
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <AppSidebar 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed}
          isMobile={isMobile}
        />

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col min-h-screen transition-all duration-300",
          // FIXED: On mobile, we don't add margin because sidebar is fixed overlay
          // On desktop, add margin based on sidebar state
          !isMobile && !sidebarCollapsed ? "md:ml-0" : "md:ml-0"
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
            {/* Responsive content padding */}
            <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-border bg-white py-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <div className="text-center sm:text-left">
                © {new Date().getFullYear()} AI Optimizer. All rights reserved.
              </div>
              <div className="flex items-center gap-6">
                {/* Optional links can be added here */}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}