import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ProductSelection from "./pages/ProductSelection";
import TitleOptimization from "./pages/TitleOptimization";
import DescriptionOptimization from "./pages/DescriptionOptimization";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { getShopFromUrl } from "./utils/auth";
import { loginShop } from "./services/authService";
import MetaTitleOptimization from "./pages/MetaTitleOptimization";
import MetaDescriptionOptimization from "./pages/MetaDescriptionOptimization";
import ImageOptimization from "./pages/ImageOptimization";
import MetaHandleOptimization from "./pages/MetaHandleOptimization";
import PriceOptimization from "./pages/PriceOptimization";
import SKUOptimization from "./pages/skuOptimizations";
import ImageAltOptimization from "./pages/Imagealtoptimization";
import ImageNameOptimization from "./pages/ImageNameOptimization";
import ProductTypeOptimization from "./pages/ProductTypeOptimization";
import VendorOptimization from "./pages/VendorOptimization";
import SmartCollectionBuilder from "./pages/CollectionBuilder";
import TagOptimization from "./pages/tagOptimization";
import SpecificationOptimization from "./pages/SpecificationOptimization";

const queryClient = new QueryClient();

const App = () => {

  useEffect(() => {
    async function authenticateShop() {
      const shop = getShopFromUrl();

      if (!shop) {
        console.error("Shop not found in URL");
        return;
      }

      // Skip if already authenticated
      // const token = localStorage.getItem("auth_token");
      // if (token) return;

      try {
        const data = await loginShop(shop);
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("shop", JSON.stringify(data.shop));

        console.log("Authenticated shop:", data.shop);
      } catch (error) {
        console.error("Auth failed", error);
      }
    }

    authenticateShop();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<ProductSelection />} />
            <Route path="/title-optimization" element={<TitleOptimization />} />
            <Route path="/description-optimization" element={<DescriptionOptimization />} />
            <Route path="/metaTitle-optimization" element={<MetaTitleOptimization />} />
            <Route path="/metaDescription-optimization" element={<MetaDescriptionOptimization />} />
            <Route path="/handle-optimization" element={<MetaHandleOptimization />} />
            <Route path="/image-optimization" element={<ImageOptimization />} />
            <Route path="/pricing-optimization" element={<PriceOptimization />} />
            <Route path="/sku-optimization" element={<SKUOptimization />} />
            <Route path="/imageALT-optimization" element={<ImageAltOptimization />} />
            <Route path="/imageName-optimization" element={<ImageNameOptimization />} />
            <Route path="/productType-optimization" element={<ProductTypeOptimization />} />
            <Route path="/vendor-optimization" element={<VendorOptimization />} />
            <Route path="/collection-optimization" element={<SmartCollectionBuilder />} />
            <Route path="/tag-optimization" element={<TagOptimization />} />
            <Route path="/specification-optimization" element={<SpecificationOptimization />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
