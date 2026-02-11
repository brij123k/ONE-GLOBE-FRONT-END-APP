import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Brain,
  Eye,
  Zap,
  Sparkles,
  TrendingUp,
  Target,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Save,
  Play,
  Crown,
  Rocket,
  Stars,
  Award,
  Trophy,
  Link2,
  Search,
  Globe,
  Hash,
  Shield,
  AlertCircle,
  FileText,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

interface Product {
  _id: string;
  productId: string;
  title: string;
  metaHandle: string;
  productImage: string;
  handle: string;
  shopId: string;
}

interface OptimizationResult {
  productId: string;
  oldMetaHandle: string;
  newMetaHandle: string;
  characterCount: number;
  image?: string;
  title: string;
}

export default function MetaHandleOptimization() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAIOptionsModal, setShowAIOptionsModal] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  const [stats, setStats] = useState({
    totalProducts: 0,
    emptyHandles: 0,
    optimizedCount: 0,
  });

  useEffect(() => {
    fetchStoredProducts();
  }, []);

  const fetchStoredProducts = async () => {
    try {
      setLoading(true);
      const response = await getApi(ApiConfig.getStoredMetaHandleProduct);
      const productsData = response || [];
      setProducts(productsData);
      
      // Calculate initial stats
      if (productsData.length > 0) {
        const emptyHandles = productsData.filter(p => !p.metaHandle || p.metaHandle.trim() === '').length;
        const optimizedCount = productsData.filter(p => 
          p.metaHandle && p.metaHandle === generateHandleFromTitle(p.title)
        ).length;
        
        setStats({
          totalProducts: productsData.length,
          emptyHandles: emptyHandles,
          optimizedCount: optimizedCount,
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateHandleFromTitle = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // Classic OPTIMIZATION: Use product title for handle
  const handleClassicOptimization = async (previewMode = true) => {
    if (products.length === 0) return;

    setShowProgressModal(true);
    setProgress({
      current: 0,
      total: products.length,
      status: "Generating handles from product titles..."
    });

    const results: OptimizationResult[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const newMetaHandle = generateHandleFromTitle(product.title);

      results.push({
        productId: product.productId,
        oldMetaHandle: product.metaHandle || '(Empty)',
        newMetaHandle,
        characterCount: newMetaHandle.length,
        image: product.productImage,
        title: product.title
      });

      setProgress({
        current: i + 1,
        total: products.length,
        status: `Processing: ${product.title.substring(0, 30)}...`
      });
    }

    setOptimizationResults(results);
    setShowProgressModal(false);

    if (previewMode) {
      setShowPreviewModal(true);
    } else {
      await applyMetaHandleOptimizations(results);
    }
  };

  // AI OPTIMIZATION: Use AI to generate optimized handle
  const handleAIOptimization = async (applyNow = false) => {
    if (products.length === 0) return;

    setShowProgressModal(true);
    setProgress({
      current: 0,
      total: products.length,
      status: "AI is optimizing your product handles..."
    });

    const results: OptimizationResult[] = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      setProgress({
        current: i + 1,
        total: products.length,
        status: `AI optimizing: ${product.title.substring(0, 30)}...`
      });

      try {
        const payload = {
          productId: product.productId,
          productHandle: product.metaHandle, // Using product title for AI to generate handle
          apply: applyNow
        };

        const response = await postApi(ApiConfig.aiMetaHandleOptimization, payload);
        console.log(response)
        if (response.newMetaHandle) {
          results.push({
            productId: product.productId,
            oldMetaHandle: product.metaHandle || '(Empty)',
            newMetaHandle: response.newMetaHandle,
            characterCount: response.characterCount,
            image: product.productImage,
            title: product.title
          });
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`Error optimizing handle for ${product.title}:`, error);
        // Fallback to Classic optimization if AI fails
        const fallbackHandle = generateHandleFromTitle(product.title);
        results.push({
          productId: product.productId,
          oldMetaHandle: product.metaHandle || '(Empty)',
          newMetaHandle: fallbackHandle,
          characterCount: fallbackHandle.length,
          image: product.productImage,
          title: product.title
        });
      }
    }
    console.log(results,"2")
    setOptimizationResults(results);
    setShowProgressModal(false);

    if (applyNow) {
      await applyMetaHandleOptimizations(results);
    } else {
      setShowPreviewModal(true);
    }
  };

  const applyMetaHandleOptimizations = async (results: OptimizationResult[]) => {
    setShowProgressModal(true);
    setProgress({
      current: 0,
      total: results.length,
      status: "Saving optimized handles to Shopify..."
    });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      
      if (result.oldMetaHandle !== result.newMetaHandle) {
        try {
          await postApi(ApiConfig.updateMetaHandleOptimization, {
            productId: result.productId,
            oldMetaHandle: result.oldMetaHandle === '(Empty)' ? '' : result.oldMetaHandle,
            newMetaHandle: result.newMetaHandle
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to update handle for ${result.productId}:`, error);
          failCount++;
        }
      }

      setProgress({
        current: i + 1,
        total: results.length,
        status: `Updating: ${result.title.substring(0, 30)}...`
      });
    }

    setShowProgressModal(false);
    setShowPreviewModal(false);
    
    setProgress({
      current: successCount,
      total: results.length,
      status: "completed"
    });
    setShowSuccessModal(true);
    
    // Refresh products after successful update
    await fetchStoredProducts();
  };

  if (loading) {
    return (
      <AppLayout title="Meta Handle Optimization">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Link2 className="w-12 h-12 animate-pulse text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading products for handle optimization...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Meta Handle Optimization">
      <div className="p-6 space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                  <Link2 className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  <Rocket className="w-3 h-3 mr-1" /> URL HANDLE OPTIMIZATION
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  Optimize Your Product URL Handles
                </span>
              </h1>
              <p className="text-gray-600 mb-4">
                Clean, keyword-rich URLs improve SEO rankings and click-through rates. 
                Choose between Classic optimization (using product titles) or AI-powered optimization for better results.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="gap-1">
                  <FileText className="w-3 h-3" /> Title to Handle
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Brain className="w-3 h-3" /> AI Optimized
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Hash className="w-3 h-3" /> SEO Friendly
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Dialog open={showProductsModal} onOpenChange={setShowProductsModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Eye className="w-4 h-4" />
                    View Products ({products.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Products Needing Handle Optimization</DialogTitle>
                    <DialogDescription>
                      {stats.emptyHandles} products with empty handles, {stats.optimizedCount} already optimized
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto">
                    {products.slice(0, 10).map((product) => (
                      <div key={product.productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={product.productImage}
                          alt={product.title}
                          className="w-12 h-12 rounded-lg object-cover border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                          <p className="text-xs text-gray-500 truncate">
                            Current: {product.metaHandle || 'Not set'}
                          </p>
                        </div>
                        {!product.metaHandle ? (
                          <Badge variant="destructive" className="text-xs">Empty</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {product.metaHandle.length} chars
                          </Badge>
                        )}
                      </div>
                    ))}
                    {products.length > 10 && (
                      <p className="text-xs text-center text-gray-500">
                        +{products.length - 10} more products
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
                Total Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalProducts}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Ready for optimization
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-amber-50 border-amber-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Empty Handles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.emptyHandles}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Need immediate attention
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-green-50 border-green-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Already Optimized
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {stats.optimizedCount}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Using title as handle
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Two Optimization Options */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Option 1: Classic Optimization - Title to Handle */}
          <Card className="border-blue-200 hover:border-blue-300 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle>Classic Optimization</CardTitle>
                </div>
                <Badge variant="outline" className="bg-blue-50">SIMPLE & EFFECTIVE</Badge>
              </div>
              <CardDescription>
                Convert product titles to URL-friendly handles automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50/50 rounded-lg p-4">
                <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  How it works:
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Convert to lowercase</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Replace spaces with hyphens</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Remove special characters</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>Remove duplicate hyphens</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Example:</Label>
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p className="text-gray-700 mb-1">
                    <span className="font-medium">Title:</span> Snowboard Vendor Gift Card
                  </p>
                  <p className="text-blue-600 font-mono">
                    <span className="font-medium">Handle:</span> snowboard-vendor-gift-card
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={() => handleClassicOptimization(true)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
                <Button
                  onClick={() => handleClassicOptimization(false)}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
                >
                  <Save className="w-4 h-4" />
                  Apply Directly
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Option 2: AI Optimization */}
          <Card className="border-purple-200 hover:border-purple-300 transition-all bg-gradient-to-br from-white to-purple-50/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <CardTitle>AI-Powered Optimization</CardTitle>
                </div>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  RECOMMENDED
                </Badge>
              </div>
              <CardDescription>
                Let AI create SEO-optimized, keyword-rich handles for better rankings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-4">
                <h4 className="font-medium text-purple-700 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Benefits:
                </h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <Stars className="w-4 h-4 text-purple-500 mt-0.5" />
                    <span><span className="font-medium">Smart keyword extraction</span> - Identifies important keywords</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Stars className="w-4 h-4 text-purple-500 mt-0.5" />
                    <span><span className="font-medium">Remove stop words</span> - Removes "a", "an", "the", "and", "or"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Stars className="w-4 h-4 text-purple-500 mt-0.5" />
                    <span><span className="font-medium">Optimal length</span> - Creates concise 30-60 character handles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Stars className="w-4 h-4 text-purple-500 mt-0.5" />
                    <span><span className="font-medium">SEO focused</span> - Includes high-value search terms</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-gray-500">AI vs Classic Example:</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <p className="text-gray-500 text-xs mb-1">Original Title</p>
                    <p className="text-gray-700">Premium Wireless Bluetooth Headphones with Noise Cancellation</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg text-sm">
                    <p className="text-purple-600 text-xs mb-1">Classic Handle</p>
                    <p className="text-gray-700 font-mono text-xs">premium-wireless-bluetooth-headphones-with-noise-cancellation</p>
                    <p className="text-purple-600 text-xs mt-1 font-medium">AI Handle</p>
                    <p className="text-purple-700 font-mono text-xs">wireless-noise-cancelling-headphones</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setShowAIOptionsModal(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2 h-12 text-base"
              >
                <Brain className="w-5 h-5" />
                Start AI Optimization
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI Options Modal */}
        <Dialog open={showAIOptionsModal} onOpenChange={setShowAIOptionsModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                AI Optimization Options
              </DialogTitle>
              <DialogDescription>
                Choose how you want to apply AI-powered handle optimization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview First
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  See all AI-generated handles before applying them to your store
                </p>
                <Button
                  onClick={() => {
                    setShowAIOptionsModal(false);
                    handleAIOptimization(false);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
                >
                  <Play className="w-4 h-4" />
                  Generate & Preview
                </Button>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Apply Directly
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  AI will optimize and immediately apply handles to your Shopify store
                </p>
                <Button
                  onClick={() => {
                    setShowAIOptionsModal(false);
                    handleAIOptimization(true);
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
                >
                  <Save className="w-4 h-4" />
                  Generate & Apply Now
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAIOptionsModal(false)}
                className="w-full"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Progress Modal */}
        <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                {progress.status}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Progress 
                value={(progress.current / progress.total) * 100} 
                className="h-2"
              />
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900">
                  {progress.status}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {progress.current} of {progress.total} products processed
                </p>
              </div>
              <div className="flex justify-center">
                {progress.status.includes('AI') ? (
                  <Brain className="w-12 h-12 text-purple-500 animate-pulse" />
                ) : (
                  <Link2 className="w-12 h-12 text-blue-500 animate-pulse" />
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Handle Optimization Preview
              </DialogTitle>
              <DialogDescription>
                Review the optimized handles before applying them to your store
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {optimizationResults.map((result) => (
                <div key={result.productId} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-4">
                    <img
                      src={result.image}
                      alt={result.title}
                      className="w-16 h-16 rounded-lg object-cover border"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-2">{result.title}</p>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-xs text-gray-500">Current Handle</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded">
                              {result.oldMetaHandle === '(Empty)' ? '(Not set)' : result.oldMetaHandle}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            /products/{result.oldMetaHandle === '(Empty)' ? '[not-optimized]' : result.oldMetaHandle}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Optimized Handle</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-mono font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                              {result.newMetaHandle}
                            </span>
                            <Badge variant="success" className="text-xs">
                              {result.characterCount} chars
                            </Badge>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            /products/{result.newMetaHandle}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPreviewModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => applyMetaHandleOptimizations(optimizationResults)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2"
              >
                <Save className="w-4 h-4" />
                Apply All Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-green-500" />
                Optimization Complete!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Successfully Updated!
                </h3>
                <p className="text-gray-600">
                  {progress.current} of {progress.total} product handles were updated.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Note:</span> Shopify automatically creates 301 redirects from old URLs to new ones, so you won't lose any traffic.
                </p>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Go to Dashboard
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessModal(false);
                  fetchStoredProducts();
                }}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                Optimize More
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}