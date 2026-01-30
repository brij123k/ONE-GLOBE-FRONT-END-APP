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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
  Plus,
  Filter,
  Crown,
  Rocket,
  Stars,
  Award,
  Trophy,
  RulerIcon,
  Gem,
  Tag,
  FileText,
  Search,
  Globe,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

interface Product {
  _id: string;
  productId: string;
  title: string;
  metaTitle: string;
  productImage: string;
  handle: string;
  status: string;
}

interface OptimizationResult {
  productId: string;
  oldMetaTitle: string;
  newMetaTitle: string;
  characterCount: number;
  image?: string;
}

export default function MetaTitleOptimization() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showAIOptionsModal, setShowAIOptionsModal] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  const [stats, setStats] = useState({
    averageLength: 0,
    seoScore: 0,
    improvement: 0,
    emptyTitles: 0,
  });

  // Classic Rules State
  const [classicRules, setClassicRules] = useState({
    copyTitleToMeta: false,
    prefix: { enabled: false, value: "" },
    suffix: { enabled: false, value: "" },
    findReplace: { enabled: false, find: "", replace: "" },
    findRemove: { enabled: false, value: "" },
    truncate: { enabled: false, maxLength: 60, preserveWords: true },
  });

  useEffect(() => {
    fetchStoredProducts();
  }, []);

  const fetchStoredProducts = async () => {
    try {
      setLoading(true);
      const response = await getApi(ApiConfig.getStoredMetaTitileProduct);
      const productsData = response || [];
      setProducts(productsData);
      
      // Calculate initial stats
      if (productsData.length > 0) {
        const avgLength = Math.round(
          productsData.reduce((sum: number, p: Product) => sum + (p.metaTitle?.length || 0), 0) / productsData.length
        );
        const emptyTitles = productsData.filter(p => !p.metaTitle || p.metaTitle.trim() === '').length;
        
        setStats(prev => ({
          ...prev,
          averageLength: avgLength,
          emptyTitles: emptyTitles,
          seoScore: calculateSeoScore(productsData),
        }));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSeoScore = (products: Product[]): number => {
    if (products.length === 0) return 0;
    
    let score = 0;
    products.forEach(product => {
      const metaTitle = product.metaTitle || '';
      const title = product.title || '';
      
      // Score based on length (optimal: 50-60 characters)
      if (metaTitle.length >= 50 && metaTitle.length <= 60) score += 30;
      else if (metaTitle.length >= 40 && metaTitle.length <= 70) score += 20;
      else score += 10;
      
      // Score for having meta title
      if (metaTitle.trim()) score += 30;
      
      // Score for including product title
      if (title && metaTitle.toLowerCase().includes(title.toLowerCase().substring(0, 20))) {
        score += 20;
      }
      
      // Score for no keyword stuffing
      const words = metaTitle.split(' ');
      const uniqueWords = new Set(words.map(w => w.toLowerCase()));
      if (words.length / uniqueWords.size < 1.5) score += 20;
    });
    
    return Math.round(score / products.length);
  };

  const handleClassicOptimization = async (previewMode = true) => {
    if (products.length === 0) return;

    setShowProgressModal(true);
    setProgress({
      current: 0,
      total: products.length,
      status: "Applying classic optimization rules..."
    });

    const results: OptimizationResult[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      let newMetaTitle = product.metaTitle || '';

      // Copy title to meta title if enabled
      if (classicRules.copyTitleToMeta) {
        newMetaTitle = product.title;
      }

      // Apply prefix
      if (classicRules.prefix.enabled && classicRules.prefix.value) {
        newMetaTitle = `${classicRules.prefix.value} ${newMetaTitle}`;
      }

      // Apply suffix
      if (classicRules.suffix.enabled && classicRules.suffix.value) {
        newMetaTitle = `${newMetaTitle} ${classicRules.suffix.value}`;
      }

      // Apply find & replace
      if (classicRules.findReplace.enabled && classicRules.findReplace.find) {
        const regex = new RegExp(classicRules.findReplace.find, 'gi');
        newMetaTitle = newMetaTitle.replace(regex, classicRules.findReplace.replace);
      }

      // Apply find & remove
      if (classicRules.findRemove.enabled && classicRules.findRemove.value) {
        const regex = new RegExp(classicRules.findRemove.value, 'gi');
        newMetaTitle = newMetaTitle.replace(regex, '');
      }

      // Apply truncation
      if (classicRules.truncate.enabled && newMetaTitle.length > classicRules.truncate.maxLength) {
        if (classicRules.truncate.preserveWords) {
          // Find last space before limit
          const truncated = newMetaTitle.substring(0, classicRules.truncate.maxLength);
          const lastSpace = truncated.lastIndexOf(' ');
          newMetaTitle = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
        } else {
          newMetaTitle = newMetaTitle.substring(0, classicRules.truncate.maxLength);
        }
      }

      // Clean up extra spaces
      newMetaTitle = newMetaTitle.replace(/\s+/g, ' ').trim();

      results.push({
        productId: product.productId,
        oldMetaTitle: product.metaTitle || '(Empty)',
        newMetaTitle,
        characterCount: newMetaTitle.length,
        image: product.productImage
      });

      setProgress({
        current: i + 1,
        total: products.length,
        status: `Processing: ${product.title}`
      });
    }

    setOptimizationResults(results);
    setShowProgressModal(false);

    if (previewMode) {
      calculateComparisonStats(results);
      setShowPreviewModal(true);
    } else {
      await applyMetaTitleOptimizations(results);
    }
  };

  const handleAIOptimization = async (applyNow = false) => {
    if (products.length === 0) return;

    setShowProgressModal(true);
    setProgress({
      current: 0,
      total: products.length,
      status: "Starting AI optimization..."
    });

    const results: OptimizationResult[] = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      setProgress({
        current: i + 1,
        total: products.length,
        status: `Optimizing: ${product.title}`
      });

      try {
        const payload = {
          productId: product.productId,
          productTitle: product.title,
          apply: applyNow
        };

        const response = await postApi(ApiConfig.aiMetaTitleOptimization, payload);
        
        if (applyNow && response.applied) {
          // Direct apply mode
          results.push({
            productId: product.productId,
            oldMetaTitle: response.oldMetaTitle || '(Empty)',
            newMetaTitle: response.newMetaTitle,
            characterCount: response.characterCount || 0,
            image: product.productImage
          });
        } else if (!applyNow && response.newMetaTitle) {
          // Preview mode
          results.push({
            productId: product.productId,
            oldMetaTitle: response.oldMetaTitle || '(Empty)',
            newMetaTitle: response.newMetaTitle,
            characterCount: response.characterCount || response.newMetaTitle.length,
            image: product.productImage
          });
        }

        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 300));

      } catch (error) {
        console.error(`Error optimizing ${product.title}:`, error);
        results.push({
          productId: product.productId,
          oldMetaTitle: product.metaTitle || '(Empty)',
          newMetaTitle: product.metaTitle || '(Empty)',
          characterCount: (product.metaTitle || '').length,
          image: product.productImage
        });
      }
    }

    setOptimizationResults(results);
    setShowProgressModal(false);

    if (applyNow) {
      // Show direct success modal
      const successful = results.filter(r => r.newMetaTitle !== r.oldMetaTitle).length;
      setProgress({
        current: successful,
        total: products.length,
        status: "completed"
      });
      setShowSuccessModal(true);
    } else {
      // Show preview modal
      calculateComparisonStats(results);
      setShowPreviewModal(true);
    }
  };

  const applyMetaTitleOptimizations = async (results: OptimizationResult[]) => {
    setShowProgressModal(true);
    setProgress({
      current: 0,
      total: results.length,
      status: "Applying optimizations to Shopify..."
    });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      
      if (result.oldMetaTitle !== result.newMetaTitle) {
        try {
          await postApi(ApiConfig.updateMetaTitleOptimization, {
            productId: result.productId,
            oldMetaTitle: result.oldMetaTitle,
            newMetaTitle: result.newMetaTitle
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to update ${result.productId}:`, error);
          failCount++;
        }
      }

      setProgress({
        current: i + 1,
        total: results.length,
        status: `Updating: ${result.productId}`
      });
    }

    setShowProgressModal(false);
    setShowComparisonModal(false);
    
    setProgress({
      current: successCount,
      total: results.length,
      status: "completed"
    });
    setShowSuccessModal(true);
  };

  const calculateComparisonStats = (results: OptimizationResult[]) => {
    if (results.length === 0) return;

    const avgOldLength = results.reduce((sum, r) => sum + (r.oldMetaTitle === '(Empty)' ? 0 : r.oldMetaTitle.length), 0) / results.length;
    const avgNewLength = results.reduce((sum, r) => sum + r.newMetaTitle.length, 0) / results.length;
    
    const improvement = Math.round(((avgNewLength - avgOldLength) / (avgOldLength || 1)) * 100);
    const seoScore = Math.min(100, Math.round((avgNewLength / 60) * 100));

    setStats({
      averageLength: Math.round(avgNewLength),
      seoScore,
      improvement,
      emptyTitles: results.filter(r => r.oldMetaTitle === '(Empty)').length
    });
  };

  if (loading) {
    return (
      <AppLayout title="Meta Title Optimization">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Search className="w-12 h-12 animate-pulse text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading products for meta title optimization...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Meta Title Optimization">
      <div className="p-6 space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6 animate-fade-in">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  <Rocket className="w-3 h-3 mr-1" /> SEO OPTIMIZED
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                  Boost Your Search Engine Rankings
                </span>
              </h1>
              <p className="text-gray-600 mb-4">
                Optimize your meta titles for better search visibility and higher click-through rates. 
                Perfect meta titles can increase organic traffic by up to 40%.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="gap-1">
                  <Globe className="w-3 h-3" /> Search Rankings
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="w-3 h-3" /> Higher CTR
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Zap className="w-3 h-3" /> Quick Setup
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Brain className="w-3 h-3" /> AI-Powered
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Dialog open={showProductsModal} onOpenChange={setShowProductsModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Eye className="w-4 h-4" />
                    {products.length} Products
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Products for Meta Title Optimization</DialogTitle>
                    <DialogDescription>
                      {products.length} products that need meta title optimization
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto">
                    {products.map((product) => (
                      <div key={product.productId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={product.productImage}
                          alt={product.title}
                          className="w-12 h-12 rounded-lg object-cover border"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.title}</p>
                          <p className="text-xs text-gray-500 truncate">
                            Meta Title: {product.metaTitle || 'Not set'}
                          </p>
                        </div>
                        {!product.metaTitle || product.metaTitle.trim() === '' ? (
                          <Badge variant="destructive" className="text-xs">
                            Empty
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            {product.metaTitle.length} chars
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                onClick={() => setShowAIOptionsModal(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
              >
                <Brain className="w-4 h-4" />
                Start AI Optimization
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-white to-green-50 border-green-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <RulerIcon className="w-4 h-4 text-green-500" />
                Current Avg. Length
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.averageLength}
                <span className="text-sm font-normal text-gray-500 ml-1">characters</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.averageLength < 50 ? "Too short for SEO" : 
                 stats.averageLength > 60 ? "May get truncated" : "Optimal range"}
              </div>
              <Progress 
                value={Math.min(100, (stats.averageLength / 60) * 100)} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-amber-50 border-amber-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                SEO Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.seoScore}%
                <span className="text-sm font-normal text-gray-500 ml-1">
                  {stats.seoScore > 80 ? "Excellent" : stats.seoScore > 60 ? "Good" : "Needs work"}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.emptyTitles} empty meta titles
              </div>
              <Progress 
                value={stats.seoScore} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Traffic Boost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                Up to 40%
                <span className="text-sm font-normal text-gray-500 ml-1">increase</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Better meta titles = More clicks
              </div>
              <div className="flex items-center mt-2">
                <Stars className="w-4 h-4 text-amber-500 mr-1" />
                <Stars className="w-4 h-4 text-amber-500 mr-1" />
                <Stars className="w-4 h-4 text-amber-500 mr-1" />
                <Stars className="w-4 h-4 text-amber-500 mr-1" />
                <Stars className="w-4 h-4 text-gray-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                Time to Optimize
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {products.length * 2} min
              </div>
              <div className="text-xs text-gray-500 mt-1">
                AI completes in minutes
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Zap className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-600">Instant optimization</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Classic Optimization */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-green-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RulerIcon className="w-5 h-5 text-green-600" />
                  Classic Meta Title Optimization
                  <Badge className="ml-auto bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    QUICK SETUP
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Apply simple rules to optimize all your meta titles at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Copy Title to Meta Title */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Copy Product Title to Meta Title</Label>
                      <p className="text-sm text-gray-500">
                        Use your product titles as meta titles (recommended for empty meta titles)
                      </p>
                    </div>
                    <Switch
                      checked={classicRules.copyTitleToMeta}
                      onCheckedChange={(checked) => setClassicRules({
                        ...classicRules,
                        copyTitleToMeta: checked
                      })}
                    />
                  </div>
                </div>

                {/* Prefix & Suffix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Add Prefix</Label>
                      <Switch
                        checked={classicRules.prefix.enabled}
                        onCheckedChange={(checked) => setClassicRules({
                          ...classicRules,
                          prefix: { ...classicRules.prefix, enabled: checked }
                        })}
                      />
                    </div>
                    {classicRules.prefix.enabled && (
                      <Input
                        value={classicRules.prefix.value}
                        onChange={(e) => setClassicRules({
                          ...classicRules,
                          prefix: { ...classicRules.prefix, value: e.target.value }
                        })}
                        placeholder="e.g., Buy, Best, Shop"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Add Suffix</Label>
                      <Switch
                        checked={classicRules.suffix.enabled}
                        onCheckedChange={(checked) => setClassicRules({
                          ...classicRules,
                          suffix: { ...classicRules.suffix, enabled: checked }
                        })}
                      />
                    </div>
                    {classicRules.suffix.enabled && (
                      <Input
                        value={classicRules.suffix.value}
                        onChange={(e) => setClassicRules({
                          ...classicRules,
                          suffix: { ...classicRules.suffix, value: e.target.value }
                        })}
                        placeholder="e.g., | Your Store Name"
                      />
                    )}
                  </div>
                </div>

                {/* Find & Replace */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Find & Replace Text</Label>
                    <Switch
                      checked={classicRules.findReplace.enabled}
                      onCheckedChange={(checked) => setClassicRules({
                        ...classicRules,
                        findReplace: { ...classicRules.findReplace, enabled: checked }
                      })}
                    />
                  </div>
                  {classicRules.findReplace.enabled && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Input
                          value={classicRules.findReplace.find}
                          onChange={(e) => setClassicRules({
                            ...classicRules,
                            findReplace: { ...classicRules.findReplace, find: e.target.value }
                          })}
                          placeholder="Find text"
                        />
                      </div>
                      <div>
                        <Input
                          value={classicRules.findReplace.replace}
                          onChange={(e) => setClassicRules({
                            ...classicRules,
                            findReplace: { ...classicRules.findReplace, replace: e.target.value }
                          })}
                          placeholder="Replace with"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Find & Remove */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Find & Remove Text</Label>
                    <Switch
                      checked={classicRules.findRemove.enabled}
                      onCheckedChange={(checked) => setClassicRules({
                        ...classicRules,
                        findRemove: { ...classicRules.findRemove, enabled: checked }
                      })}
                    />
                  </div>
                  {classicRules.findRemove.enabled && (
                    <Input
                      value={classicRules.findRemove.value}
                      onChange={(e) => setClassicRules({
                        ...classicRules,
                        findRemove: { ...classicRules.findRemove, value: e.target.value }
                      })}
                      placeholder="Text to remove"
                    />
                  )}
                </div>

                {/* Truncate */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm">Truncate Long Titles</Label>
                      <p className="text-xs text-gray-500">Recommended max: 60 characters</p>
                    </div>
                    <Switch
                      checked={classicRules.truncate.enabled}
                      onCheckedChange={(checked) => setClassicRules({
                        ...classicRules,
                        truncate: { ...classicRules.truncate, enabled: checked }
                      })}
                    />
                  </div>
                  {classicRules.truncate.enabled && (
                    <div className="space-y-3">
                      <div>
                        <Label>Maximum Length (characters)</Label>
                        <Input
                          type="number"
                          value={classicRules.truncate.maxLength}
                          onChange={(e) => setClassicRules({
                            ...classicRules,
                            truncate: { ...classicRules.truncate, maxLength: parseInt(e.target.value) || 60 }
                          })}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={classicRules.truncate.preserveWords}
                          onCheckedChange={(checked) => setClassicRules({
                            ...classicRules,
                            truncate: { ...classicRules.truncate, preserveWords: checked }
                          })}
                        />
                        <Label className="text-sm">Preserve word boundaries (don't cut words)</Label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => handleClassicOptimization(true)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Preview Changes
                  </Button>
                  <Button
                    onClick={() => handleClassicOptimization(false)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Apply Directly
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - AI Optimization */}
          <div className="space-y-6">
            <Card className="border-purple-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                  AI-Powered Optimization
                  <Badge className="ml-auto bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    RECOMMENDED
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Let AI analyze and create perfect meta titles for search engines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Why AI Optimization?</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>✓ SEO-optimized for search rankings</li>
                        <li>✓ Includes high-intent keywords</li>
                        <li>✓ Optimal length (50-60 characters)</li>
                        <li>✓ Unique for each product</li>
                        <li>✓ Includes brand and benefits</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setShowAIOptionsModal(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2"
                >
                  <Brain className="w-4 h-4" />
                  Start AI Optimization
                </Button>

                <div className="text-xs text-gray-500 pt-2 border-t">
                  <p className="font-medium mb-1">What AI does:</p>
                  <ul className="space-y-1">
                    <li>• Analyzes your product titles</li>
                    <li>• Researches relevant keywords</li>
                    <li>• Creates compelling meta titles</li>
                    <li>• Ensures SEO best practices</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
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
                Choose how you want to apply AI optimization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Preview First
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  See all AI-generated meta titles before applying them to your store
                </p>
                <Button
                  onClick={() => {
                    setShowAIOptionsModal(false);
                    handleAIOptimization(false);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
                >
                  <Play className="w-4 h-4" />
                  Optimize & Preview
                </Button>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Apply Directly
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  AI will optimize and immediately apply the best meta titles to your Shopify store
                </p>
                <Button
                  onClick={() => {
                    setShowAIOptionsModal(false);
                    handleAIOptimization(true);
                  }}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
                >
                  <Save className="w-4 h-4" />
                  Optimize & Apply Now
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
                <RefreshCw className="w-5 h-5 animate-spin text-green-500" />
                Optimizing Meta Titles
              </DialogTitle>
              <DialogDescription>
                Please wait while we process your products...
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
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
                <Brain className="w-12 h-12 text-green-500 animate-pulse" />
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
                Meta Title Optimization Preview
              </DialogTitle>
              <DialogDescription>
                Review the optimized meta titles before applying them to your store
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {optimizationResults.map((result, index) => (
                <div key={result.productId} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-4">
                    <img
                      src={result.image}
                      alt={result.oldMetaTitle}
                      className="w-16 h-16 rounded-lg object-cover border"
                    />
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-500 mb-1">Original Meta Title</Label>
                          <p className="text-sm text-gray-700">{result.oldMetaTitle}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {result.oldMetaTitle === '(Empty)' ? '0' : result.oldMetaTitle.length} chars
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500 mb-1">Optimized Meta Title</Label>
                          <p className="text-sm font-medium text-gray-900">{result.newMetaTitle}</p>
                          <p className="text-xs text-gray-500 mt-1">{result.newMetaTitle.length} chars</p>
                        </div>
                      </div>
                      {result.oldMetaTitle !== result.newMetaTitle && (
                        <div className="mt-3">
                          <Badge variant={result.newMetaTitle.length > (result.oldMetaTitle === '(Empty)' ? 0 : result.oldMetaTitle.length) ? "success" : "secondary"} className="text-xs">
                            {result.oldMetaTitle === '(Empty)' ? 'Added' : 'Improved'}
                          </Badge>
                          <span className="text-xs text-gray-600 ml-2">
                            {Math.abs(result.newMetaTitle.length - (result.oldMetaTitle === '(Empty)' ? 0 : result.oldMetaTitle.length))} characters {result.newMetaTitle.length > (result.oldMetaTitle === '(Empty)' ? 0 : result.oldMetaTitle.length) ? 'added' : 'removed'}
                          </span>
                        </div>
                      )}
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
                onClick={() => {
                  setShowPreviewModal(false);
                  calculateComparisonStats(optimizationResults);
                  setShowComparisonModal(true);
                }}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                See Improvements & Apply
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Comparison Modal */}
        <Dialog open={showComparisonModal} onOpenChange={setShowComparisonModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Optimization Results
              </DialogTitle>
              <DialogDescription>
                Here's how much better your meta titles will perform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-center text-gray-900">
                      {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
                    </div>
                    <p className="text-sm text-center text-gray-600 mt-1">SEO Improvement</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-center text-gray-900">
                      {stats.averageLength}
                    </div>
                    <p className="text-sm text-center text-gray-600 mt-1">Avg. Character Length</p>
                  </CardContent>
                </Card>
              </div>

              {/* Comparison Text */}
              <div className="text-center">
                <p className="text-gray-700">
                  <span className="font-semibold">Your new meta titles are {Math.abs(stats.improvement)}% better</span> 
                  {" "}optimized for search engines.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Expected organic traffic increase: <span className="font-medium text-green-600">Up to 40%</span>
                </p>
              </div>

              {/* Benefits */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  What you're getting:
                </h4>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>✓ SEO-optimized for better search rankings</li>
                  <li>✓ Higher click-through rates from search results</li>
                  <li>✓ Perfect length (50-60 characters)</li>
                  <li>✓ Include primary keywords</li>
                  <li>✓ Unique for each product page</li>
                </ul>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowComparisonModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => applyMetaTitleOptimizations(optimizationResults)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
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
                Success!
              </DialogTitle>
              <DialogDescription>
                Your meta titles have been optimized successfully
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Optimization Complete!
                </h3>
                <p className="text-gray-600">
                  {progress.current} of {progress.total} meta titles were successfully updated.
                </p>
                {progress.total - progress.current > 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    {progress.total - progress.current} meta titles failed to update
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Pro Tip:</span> Monitor your Google Search Console in the next 14-28 days to see the impact of your optimized meta titles on search rankings and organic traffic.
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
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                Optimize More Products
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}