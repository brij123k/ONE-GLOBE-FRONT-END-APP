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
  Barcode,
  Grid,
  Layers,
  Hash,
  Database,
  Box,
  ShoppingBag,
  Users,
  FolderTree,
  Palette,
  Archive,
  Globe,
  FileJson,
  Code,
  PenTool,
  Megaphone,
  Star,
  TrendingUp,
  Zap,
  Shield,
  Gift,
  Truck,
  Clock,
  DollarSign,
  Percent,
  Scale,
  Ruler,
  Weight,
  Droplet,
  Wind,
  Flame,
  Gauge,
  Camera,
  Video,
  Music,
  Link as LinkIcon,
  MapPin,
  Phone,
  Mail,
  Building,
  Briefcase,
  Award,
  Heart,
  ThumbsUp,
  Share2,
  Bookmark,
  Flag,
  Bell,
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  CreditCard,
  Wallet,
  BarChart,
  PieChart,
  Activity,
  Target,
  Compass,
  Map,
  Navigation,
  Plane,
  Car,
  Bike,
  Bus,
  Train,
  Ship,
  Coffee,
  Pizza,
  Utensils,
  Wine,
  Beer,
  Cake,
  Candy,
  Apple,
  Carrot,
  Fish,
  Beef,
  Egg,
  Milk,
  Home,
  Building2,
  Factory,
  Store,
  Warehouse,
  Trees,
  Flower,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudSun,
  Umbrella,
  Thermometer,
  Droplets,
  Waves,
  Mountain,
  TreePine,
  Leaf,
  Sprout,
  Seed,
  Flower2,
  SunDim,
  SunMedium,
  SunSnow,
  Sunset,
  Sunrise,
  Sparkle,
  Sparkles as SparklesIcon,
  Stars,
  MoonStar,
  CloudMoon,
  CloudSunRain,
  CloudHail,
  Cloudy,
  Tornado,
  Hurricane,
  Wind as WindIcon,
  Compass as CompassIcon,
  Navigation as NavigationIcon,
  Anchor,
  Sailboat,
  SailboatIcon,
  Ship as ShipIcon,
  Truck as TruckIcon,
  Bus as BusIcon,
  Car as CarIcon,
  Bike as BikeIcon,
  Train as TrainIcon,
  Plane as PlaneIcon,
  Rocket,
  Satellite,
  Space,
  Planet,
  Globe2,
  Earth,
  World,
  Map as MapIcon,
  MapPin as MapPinIcon,
  Flag as FlagIcon,
  Landmark,
  Monument,
  Church,
  Mosque,
  Temple,
  Synagogue,
  Building as BuildingIcon,
  Building2 as Building2Icon,
  Hotel,
  Hospital,
  School,
  University,
  Store as StoreIcon,
  Warehouse as WarehouseIcon,
  Factory as FactoryIcon,
  Coffee as CoffeeIcon,
  Pizza as PizzaIcon,
  Utensils as UtensilsIcon,
  Wine as WineIcon,
  Beer as BeerIcon,
  Cake as CakeIcon,
  Candy as CandyIcon,
  Apple as AppleIcon,
  Carrot as CarrotIcon,
  Fish as FishIcon,
  Beef as BeefIcon,
  Egg as EggIcon,
  Milk as MilkIcon,
  Home as HomeIcon,
  Heart as HeartIcon,
  Star as StarIcon,
  ThumbsUp as ThumbsUpIcon,
  Share2 as Share2Icon,
  Bookmark as BookmarkIcon,
  Bell as BellIcon,
  Shield as ShieldIcon,
  ShieldCheck as ShieldCheckIcon,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  Key as KeyIcon,
  CreditCard as CreditCardIcon,
  Wallet as WalletIcon,
  DollarSign as DollarSignIcon,
  Percent as PercentIcon,
  Scale as ScaleIcon,
  Ruler as RulerIcon,
  Weight as WeightIcon,
  Droplet as DropletIcon,
  Wind as WindIcon2,
  Flame as FlameIcon,
  Gauge as GaugeIcon,
  Camera as CameraIcon,
  Video as VideoIcon,
  Music as MusicIcon,
  Link as LinkIcon2,
  MapPin as MapPinIcon2,
  Phone as PhoneIcon,
  Mail as MailIcon,
  Building as BuildingIcon3,
  Briefcase as BriefcaseIcon,
  Award as AwardIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const navSections = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    items: [
      { icon: LayoutDashboard, label: "Overview", path: "/", exact: true },
      { icon: TrendingUp, label: "Analytics", path: "/analytics" },
      { icon: Activity, label: "Performance", path: "/performance" },
      { icon: Target, label: "Goals", path: "/goals" },
    ],
  },
  {
    title: "SEO Optimization",
    icon: Search,
    items: [
      { icon: Type, label: "Title Optimization", path: "/products?service=title", popular: true },
      { icon: FileText, label: "Description", path: "/products?service=description", popular: true },
      { icon: Search, label: "Meta Title", path: "/products?service=metaTitle" },
      { icon: Search, label: "Meta Description", path: "/products?service=metaDescription" },
      { icon: Globe, label: "Meta Handle (URL)", path: "/products?service=handle" },
      { icon: Code, label: "Meta Tags", path: "/products?service=metaTags" },
      { icon: FileJson, label: "JSON-LD Schema", path: "/products?service=schema" },
      { icon: LinkIcon, label: "Canonical URLs", path: "/products?service=canonical" },
      { icon: Flag, label: "Hreflang Tags", path: "/products?service=hreflang" },
      { icon: FileText, label: "Rich Snippets", path: "/products?service=richSnippets" },
    ],
  },
  {
    title: "Image & Media",
    icon: Image,
    items: [
      { icon: Image, label: "Image ALT Text", path: "/products?service=imageALT", popular: true },
      { icon: Image, label: "Image Title Tags", path: "/products?service=imageTitle" },
      { icon: Image, label: "Image Size Optimization", path: "/products?service=image", popular: true },
      { icon: Camera, label: "Image Compression", path: "/products?service=imageCompression" },
      { icon: Camera, label: "Image Format Conversion", path: "/products?service=imageFormat" },
      { icon: Camera, label: "Lazy Loading Setup", path: "/products?service=lazyLoading" },
      { icon: Video, label: "Video Optimization", path: "/products?service=video" },
      { icon: Music, label: "Audio Optimization", path: "/products?service=audio" },
    ],
  },
  {
    title: "Product Data",
    icon: Package,
    items: [
      { icon: Barcode, label: "SKU Optimization", path: "/products?service=sku" },
      { icon: Grid, label: "Product Type", path: "/products?service=productType" },
      { icon: Users, label: "Vendor Optimization", path: "/products?service=vendor" },
      { icon: Layers, label: "Collection Management", path: "/products?service=collection", popular: true },
      { icon: Hash, label: "Tag Optimization", path: "/products?service=tag" },
      { icon: FolderTree, label: "Category Mapping", path: "/products?service=category" },
      { icon: ShoppingBag, label: "Variant Optimization", path: "/products?service=variants" },
      { icon: Box, label: "Bulk Product Editor", path: "/bulk-editor" },
      { icon: Archive, label: "Bulk Archive/Unarchive", path: "/bulk-archive" },
    ],
  },
  {
    title: "Advanced Fields",
    icon: Database,
    items: [
      { icon: Settings, label: "Specification Optimization", path: "/products?service=specification" },
      { icon: Database, label: "Metafields Management", path: "/products?service=metafields", popular: true },
      { icon: FileJson, label: "Custom Fields", path: "/products?service=customFields" },
      { icon: Code, label: "Custom Attributes", path: "/products?service=attributes" },
      { icon: Ruler, label: "Dimensions & Weight", path: "/products?service=dimensions" },
      { icon: Weight, label: "Shipping Properties", path: "/products?service=shipping" },
    ],
  },
  {
    title: "Pricing & Inventory",
    icon: DollarSign,
    items: [
      { icon: Search, label: "Price Optimization", path: "/products?service=pricing", popular: true },
      { icon: Percent, label: "Compare at Price", path: "/products?service=comparePrice" },
      { icon: DollarSign, label: "Cost per Item", path: "/products?service=cost" },
      { icon: CreditCard, label: "Tax Configuration", path: "/products?service=tax" },
      { icon: Scale, label: "Bulk Pricing Rules", path: "/products?service=bulkPricing" },
      { icon: Truck, label: "Inventory Management", path: "/products?service=inventory" },
      { icon: Clock, label: "Pre-order Setup", path: "/products?service=preorder" },
    ],
  },
  {
    title: "Marketing & Sales",
    icon: Megaphone,
    items: [
      { icon: Tag, label: "Sale & Discounts", path: "/products?service=sale" },
      { icon: Gift, label: "Gift Cards", path: "/products?service=giftCards" },
      { icon: Star, label: "Featured Products", path: "/products?service=featured" },
      { icon: ThumbsUp, label: "Product Recommendations", path: "/products?service=recommendations" },
      { icon: Share2, label: "Social Media Tags", path: "/products?service=socialTags" },
      { icon: Megaphone, label: "Promotion Manager", path: "/promotions" },
    ],
  },
  {
    title: "Reviews & Ratings",
    icon: Star,
    items: [
      { icon: Star, label: "Review Management", path: "/products?service=reviews" },
      { icon: Heart, label: "Customer Ratings", path: "/products?service=ratings" },
      { icon: Award, label: "Product Badges", path: "/products?service=badges" },
      { icon: Shield, label: "Trust Badges", path: "/products?service=trustBadges" },
    ],
  },
  {
    title: "Store Settings",
    icon: Settings,
    items: [
      { icon: Settings, label: "General Settings", path: "/settings" },
      { icon: Building, label: "Store Details", path: "/settings/store" },
      { icon: Mail, label: "Email Templates", path: "/settings/email" },
      { icon: Phone, label: "Contact Info", path: "/settings/contact" },
      { icon: MapPin, label: "Locations", path: "/settings/locations" },
      { icon: ShieldCheck, label: "Security", path: "/settings/security" },
    ],
  },
  {
    title: "Help & Support",
    icon: HelpCircle,
    items: [
      { icon: HelpCircle, label: "Help Center", path: "/help" },
      { icon: Bookmark, label: "Documentation", path: "/docs" },
      { icon: Bell, label: "Announcements", path: "/announcements" },
      { icon: Mail, label: "Contact Support", path: "/support" },
    ],
  },
];

interface AppSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isMobile: boolean;
}

export function AppSidebar({ collapsed, setCollapsed, isMobile }: AppSidebarProps) {
  const location = useLocation();
  const [openSections, setOpenSections] = useState<string[]>(["Dashboard", "SEO Optimization"]);

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

  const isActivePath = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname === path || location.pathname + location.search === path;
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#e2e0db] bg-white">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6046ff] to-[#4f38d4] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[#1a1917] truncate">AI Optimizer</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6046ff] to-[#4f38d4] flex items-center justify-center mx-auto flex-shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        )}
        
        {/* Desktop collapse button */}
        {!isMobile && !collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#9e9b95] hover:text-[#1a1917] hover:bg-[#f5f4f1] flex-shrink-0"
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Main Navigation */}
      <ScrollArea className="flex-1 bg-white">
        <div className="p-3">
          {collapsed ? (
            // Simple icons for collapsed mode
            <nav className="space-y-2">
              {navSections.map((section) => (
                <div key={section.title} className="space-y-1">
                  <div className="px-2 py-1.5">
                    <section.icon className="w-5 h-5 text-[#9e9b95] mx-auto" />
                  </div>
                  {section.items.slice(0, 1).map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center justify-center px-2 py-2 rounded-lg transition-all duration-200 relative group",
                        isActivePath(item.path, item.exact)
                          ? "bg-[#ede9ff] text-[#6046ff]"
                          : "text-[#6b6862] hover:bg-[#f5f4f1] hover:text-[#1a1917]"
                      )}
                      onClick={() => isMobile && setCollapsed(true)}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.popular && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#6046ff] rounded-full" />
                      )}
                      {/* Tooltip */}
                      <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1917] text-white text-[11px] rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                        {item.label}
                      </div>
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          ) : (
            // Accordion for expanded mode
            <Accordion
              type="multiple"
              value={openSections}
              onValueChange={setOpenSections}
              className="space-y-2"
            >
              {navSections.map((section) => (
                <AccordionItem key={section.title} value={section.title} className="border-none">
                  <AccordionTrigger className="py-2 px-2 hover:no-underline hover:bg-[#f5f4f1] rounded-lg group">
                    <div className="flex items-center gap-2 text-sm font-medium text-[#1a1917]">
                      <section.icon className="w-4 h-4 text-[#6b6862] group-hover:text-[#6046ff]" />
                      <span>{section.title}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <nav className="space-y-1 mt-1">
                      {section.items.map((item) => {
                        const isActive = isActivePath(item.path, item.exact);
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-sm group relative ml-6",
                              isActive
                                ? "bg-[#ede9ff] text-[#6046ff] font-medium"
                                : "text-[#6b6862] hover:bg-[#f5f4f1] hover:text-[#1a1917]"
                            )}
                            onClick={() => isMobile && setCollapsed(true)}
                          >
                            <item.icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1 truncate">{item.label}</span>
                            {item.popular && !isActive && (
                              <span className="text-[10px] font-medium bg-[#ede9ff] text-[#6046ff] px-1.5 py-0.5 rounded">
                                Popular
                              </span>
                            )}
                            {isActive && (
                              <span className="w-1 h-1 bg-[#6046ff] rounded-full ml-auto" />
                            )}
                          </Link>
                        );
                      })}
                    </nav>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Navigation - Only in expanded mode */}
      {!collapsed && (
        <div className="p-3 border-t border-[#e2e0db] bg-white">
          <div className="space-y-1">
            <Link
              to="/settings"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                location.pathname === "/settings"
                  ? "bg-[#ede9ff] text-[#6046ff] border border-[#e2e0db]"
                  : "text-[#6b6862] hover:bg-[#f5f4f1] hover:text-[#1a1917]"
              )}
            >
              <Settings className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm truncate">Settings</span>
            </Link>
            <Link
              to="/help"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                location.pathname === "/help"
                  ? "bg-[#ede9ff] text-[#6046ff] border border-[#e2e0db]"
                  : "text-[#6b6862] hover:bg-[#f5f4f1] hover:text-[#1a1917]"
              )}
            >
              <HelpCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm truncate">Help & Support</span>
            </Link>
          </div>
        </div>
      )}

      {/* Desktop collapse button when collapsed */}
      {!isMobile && collapsed && (
        <div className="p-3 border-t border-[#e2e0db] bg-white">
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-10 text-[#9e9b95] hover:text-[#1a1917] hover:bg-[#f5f4f1]"
            onClick={() => setCollapsed(false)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
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
        collapsed ? "w-16" : "w-64"
      )}
    >
      {sidebarContent}
    </aside>
  );
}