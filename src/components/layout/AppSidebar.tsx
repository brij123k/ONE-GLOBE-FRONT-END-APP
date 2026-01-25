import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Type,
  FileText,
  Search,
  Image,
  Tag,
  Sparkles,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Type, label: "Title Optimization", path: "/products?service=title" },
  { icon: FileText, label: "Description", path: "/products?service=description" },
  { icon: Search, label: "Meta SEO", path: "/meta-optimization" },
  { icon: Image, label: "Image Optimization", path: "/image-optimization" },
  { icon: Tag, label: "Keywords", path: "/keywords-optimization" },
  { icon: Sparkles, label: "More AI Tools", path: "/more-tools", comingSoon: true },
];

const bottomNavItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: HelpCircle, label: "Help & Support", path: "/help" },
];

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
}

export function AppSidebar({ collapsed, setCollapsed, isMobile }: AppSidebarProps) {
  const location = useLocation();

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    if (isMobile && !collapsed) {
      const handleClickOutside = () => {
        setCollapsed(true);
      };
      
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
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