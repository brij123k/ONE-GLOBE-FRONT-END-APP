import { ReactNode, useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  shop?:any
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
    const [shop,setStoreDetails]=useState({})
  useEffect(()=>{
  const handleStore=()=>{
   const data= JSON.parse(localStorage.getItem("shop"));
   setStoreDetails(data)
  }
  handleStore()
  },[])

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-collapse on mobile
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
          !isMobile && !sidebarCollapsed ? "md:ml-1" : "md:ml-1"
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
            
            {/* Page Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-border bg-white py-4 px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <div>
                © {new Date().getFullYear()} AI Optimizer. All rights reserved.
              </div>
              <div className="flex items-center gap-6">
                <a href="#" className="hover:text-gray-700 transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-gray-700 transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-gray-700 transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

// Helper function
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}