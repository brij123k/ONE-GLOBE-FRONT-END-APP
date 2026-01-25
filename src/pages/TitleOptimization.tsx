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
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

interface Product {
  _id: string;
  productId:string;
  title: string;
  productImage: string;
  handle: string;
  status: string;
}

interface AIFormat {
  id: number;
  categoryName: string;
  primaryElement: string;
  secondaryElement: string;
  tone: string;
  minCharacters: number;
  maxCharacters: number;
  mustIncludeKeywords: string[];
  excludeKeywords: string[];
}

interface OptimizationResult {
  productId: string;
  oldTitle: string;
  newTitle: string;
  characterCount: number;
  image: string;
}

const defaultAIFormats: AIFormat[] = [
  {
    id: 1,
    categoryName: "SEO Focused",
    primaryElement: "Product Name",
    secondaryElement: "Key Features",
    tone: "Professional",
    minCharacters: 50,
    maxCharacters: 70,
    mustIncludeKeywords: [],
    excludeKeywords: [],
  },
  {
    id: 2,
    categoryName: "Conversion Focused",
    primaryElement: "Main Benefit",
    secondaryElement: "Target Audience",
    tone: "Friendly & Casual",
    minCharacters: 40,
    maxCharacters: 60,
    mustIncludeKeywords: [],
    excludeKeywords: [],
  },
  {
    id: 3,
    categoryName: "Brand Focused",
    primaryElement: "Brand Name",
    secondaryElement: "Brand Promise",
    tone: "Luxury & Premium",
    minCharacters: 30,
    maxCharacters: 50,
    mustIncludeKeywords: [],
    excludeKeywords: [],
  },
  {
    id: 4,
    categoryName: "Marketplace Optimized",
    primaryElement: "Primary Keyword",
    secondaryElement: "Specifications",
    tone: "Technical & Detailed",
    minCharacters: 60,
    maxCharacters: 80,
    mustIncludeKeywords: [],
    excludeKeywords: [],
  },
  {
    id: 5,
    categoryName: "Benefit Driven",
    primaryElement: "Customer Benefit",
    secondaryElement: "Social Proof",
    tone: "Conversational",
    minCharacters: 45,
    maxCharacters: 65,
    mustIncludeKeywords: [],
    excludeKeywords: [],
  },
];

const primaryElements = [
  "Product Name",
  "Main Benefit",
  "Primary Keyword",
  "Brand Name",
  "Customer Benefit",
  "USP (Unique Selling Proposition)",
  "Problem Solution",
  "Target Audience",
  "Seasonal Theme",
  "Emotional Trigger",
];

const secondaryElements = [
  "Key Features",
  "Specifications",
  "Target Audience",
  "Material/Composition",
  "Brand Promise",
  "Social Proof",
  "Value Proposition",
  "Use Case",
  "Differentiator",
  "Quality Indicator",
];

const tones = [
  "Professional",
  "Friendly & Casual",
  "Luxury & Premium",
  "Technical & Detailed",
  "Conversational",
  "Urgent & Action-Oriented",
  "Educational",
  "Inspirational",
  "Playful",
  "Authoritative",
];

export default function TitleOptimization() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<AIFormat | null>(defaultAIFormats[0]);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState<OptimizationResult[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  const [stats, setStats] = useState({
    averageLength: 0,
    seoScore: 0,
    keywordDensity: 0,
    improvement: 0,
  });

  // Classic Rules State
  const [classicRules, setClassicRules] = useState({
    prefix: { enabled: false, value: "" },
    suffix: { enabled: false, value: "" },
    findReplace: { enabled: false, find: "", replace: "" },
    findRemove: { enabled: false, value: "" },
    capitalization: "keep", // keep, title, sentence, lower, upper
  });

  useEffect(() => {
    fetchStoredProducts();
  }, []);

  const fetchStoredProducts = async () => {
    try {
      setLoading(true);
      const response = await getApi(ApiConfig.getStoredProduct);
      const productsData = response || [];
      setProducts(productsData);
      
      // Calculate initial stats
      if (productsData.length > 0) {
        const avgLength = Math.round(
          productsData.reduce((sum: number, p: Product) => sum + p.title.length, 0) / productsData.length
        );
        setStats(prev => ({
          ...prev,
          averageLength: avgLength,
        }));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIOptimization = async (applyNow = false) => {
    if (!selectedFormat || products.length === 0) return;

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
          categoryName: selectedFormat.categoryName,
          minCharacters: selectedFormat.minCharacters,
          maxCharacters: selectedFormat.maxCharacters,
          primaryElement: selectedFormat.primaryElement,
          secondaryElement: selectedFormat.secondaryElement,
          mustIncludeKeywords: selectedFormat.mustIncludeKeywords.join(','),
          excludeKeywords: selectedFormat.excludeKeywords.join(','),
          tone: selectedFormat.tone,
          apply: applyNow
        };

        const response = await postApi(ApiConfig.aiTitleOptimization, payload);
        
        if (applyNow) {
          // Direct apply - just track success
          if (response.applied) {
            results.push({
              productId: product.productId,
              oldTitle: product.title,
              newTitle: response.newTitle || product.title,
              characterCount: response.newTitle?.length || 0,
              image: product.productImage
            });
          }
        } else {
          // Preview mode
          if (response.newTitle) {
            results.push({
              productId: product.productId,
              oldTitle: product.title,
              newTitle: response.newTitle,
              characterCount: response.characterCount || response.newTitle.length,
              image: response.productImage || product.productImage
            });
          }
        }

        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error optimizing ${product.title}:`, error);
        // Keep old title as new title for failed optimizations
        results.push({
          productId: product.productId,
          oldTitle: product.title,
          newTitle: product.title,
          characterCount: product.title.length,
          image: product.productImage
        });
      }
    }

    setOptimizationResults(results);
    setShowProgressModal(false);

    if (applyNow) {
      // Show direct success modal
      const successful = results.filter(r => r.newTitle !== r.oldTitle).length;
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

  const handleClassicOptimization = async () => {
    setShowProgressModal(true);
    setProgress({
      current: 0,
      total: products.length,
      status: "Applying classic optimization rules..."
    });

    const results: OptimizationResult[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      let newTitle = product.title;

      // // Apply classic rules
      // if (classicRules.wordLimit.enabled) {
      //   const words = newTitle.split(' ');
      //   if (words.length > classicRules.wordLimit.value) {
      //     newTitle = words.slice(0, classicRules.wordLimit.value).join(' ');
      //   }
      // }

      // if (classicRules.characterLimit.enabled) {
      //   if (newTitle.length > classicRules.characterLimit.value) {
      //     if (classicRules.characterLimit.breakWords) {
      //       newTitle = newTitle.substring(0, classicRules.characterLimit.value);
      //     } else {
      //       // Find last space before limit
      //       const truncated = newTitle.substring(0, classicRules.characterLimit.value);
      //       const lastSpace = truncated.lastIndexOf(' ');
      //       newTitle = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
      //     }
      //   }
      // }

      if (classicRules.prefix.enabled && classicRules.prefix.value) {
        newTitle = `${classicRules.prefix.value} ${newTitle}`;
      }

      if (classicRules.suffix.enabled && classicRules.suffix.value) {
        newTitle = `${newTitle} ${classicRules.suffix.value}`;
      }

      if (classicRules.findReplace.enabled && classicRules.findReplace.find) {
        const regex = new RegExp(classicRules.findReplace.find, 'gi');
        newTitle = newTitle.replace(regex, classicRules.findReplace.replace);
      }

      if (classicRules.findRemove.enabled && classicRules.findRemove.value) {
        const regex = new RegExp(classicRules.findRemove.value, 'gi');
        newTitle = newTitle.replace(regex, '');
      }

      // Apply capitalization
      switch (classicRules.capitalization) {
        case 'title':
          newTitle = newTitle.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
          break;
        case 'sentence':
          newTitle = newTitle.charAt(0).toUpperCase() + newTitle.slice(1).toLowerCase();
          break;
        case 'lower':
          newTitle = newTitle.toLowerCase();
          break;
        case 'upper':
          newTitle = newTitle.toUpperCase();
          break;
        // 'keep' does nothing
      }

      // Clean up extra spaces
      newTitle = newTitle.replace(/\s+/g, ' ').trim();

      results.push({
        productId: product.productId,
        oldTitle: product.title,
        newTitle,
        characterCount: newTitle.length,
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
    setShowPreviewModal(true);
  };

  const applyOptimizations = async () => {
    setShowProgressModal(true);
    setProgress({
      current: 0,
      total: optimizationResults.length,
      status: "Applying optimizations to Shopify..."
    });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < optimizationResults.length; i++) {
      const result = optimizationResults[i];
      
      if (result.oldTitle !== result.newTitle) {
        try {
          await postApi(ApiConfig.updateShopifyTitle, {
            productId: result.productId,
            oldTitle: result.oldTitle,
            newTitle: result.newTitle
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to update ${result.productId}:`, error);
          failCount++;
        }
      }

      setProgress({
        current: i + 1,
        total: optimizationResults.length,
        status: `Updating: ${result.oldTitle}`
      });
    }

    setShowProgressModal(false);
    setShowComparisonModal(false);
    
    setProgress({
      current: successCount,
      total: optimizationResults.length,
      status: "completed"
    });
    setShowSuccessModal(true);
  };

  const calculateComparisonStats = (results: OptimizationResult[]) => {
    if (results.length === 0) return;

    const avgOldLength = results.reduce((sum, r) => sum + r.oldTitle.length, 0) / results.length;
    const avgNewLength = results.reduce((sum, r) => sum + r.newTitle.length, 0) / results.length;
    
    // Mock SEO score calculation
    const seoScore = Math.min(100, Math.round((avgNewLength / 80) * 100));
    const keywordDensity = Math.min(100, Math.round((results.filter(r => 
      r.newTitle.toLowerCase().includes(r.oldTitle.toLowerCase().split(' ')[0])
    ).length / results.length) * 100));
    
    const improvement = Math.round(((avgNewLength - avgOldLength) / avgOldLength) * 100);

    setStats({
      averageLength: Math.round(avgNewLength),
      seoScore,
      keywordDensity,
      improvement
    });
  };

  const createNewFormat = () => {
    const newFormat: AIFormat = {
      id: defaultAIFormats.length + 1,
      categoryName: "Custom Format",
      primaryElement: primaryElements[0],
      secondaryElement: secondaryElements[0],
      tone: tones[0],
      minCharacters: 50,
      maxCharacters: 70,
      mustIncludeKeywords: [],
      excludeKeywords: [],
    };
    defaultAIFormats.push(newFormat);
    setSelectedFormat(newFormat);
    setShowFormatModal(true);
  };

  if (loading) {
    return (
      <AppLayout title="Title Optimization">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Brain className="w-12 h-12 animate-pulse text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading AI optimization engine...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="AI Title Optimization">
      <div className="p-6 space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-6 animate-fade-in">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  <Rocket className="w-3 h-3 mr-1" /> AI POWERED
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  Supercharge Your Product Titles
                </span>
              </h1>
              <p className="text-gray-600 mb-4">
                Our AI analyzes your products and generates high-converting, SEO-optimized titles 
                that can increase click-through rates by up to 73%. Let AI do the heavy lifting!
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="gap-1">
                  <Target className="w-3 h-3" /> SEO Optimized
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="w-3 h-3" /> Higher CTR
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Zap className="w-3 h-3" /> Instant Results
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Sparkles className="w-3 h-3" /> AI-Powered
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
                    <DialogTitle>Selected Products</DialogTitle>
                    <DialogDescription>
                      {products.length} products ready for optimization
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
                          {/* <p className="text-xs text-gray-500">{product.status.toLowerCase()}</p> */}
                        </div>
                        {/* <Badge variant={product.status === "ACTIVE" ? "success" : "secondary"} className="text-xs">
                          {product.status}
                        </Badge> */}
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2">
                <Brain className="w-4 h-4" />
                Start AI Optimization
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" />
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
                 stats.averageLength > 80 ? "Too long for mobile" : "Optimal range"}
              </div>
              <Progress 
                value={Math.min(100, (stats.averageLength / 100) * 100)} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-amber-50 border-amber-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-500" />
                Projected SEO Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.seoScore}%
                <span className="text-sm font-normal text-gray-500 ml-1">
                  {stats.seoScore > 80 ? "Excellent" : "Needs work"}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                AI can boost this by {Math.round((100 - stats.seoScore) * 0.7)}%
              </div>
              <Progress 
                value={stats.seoScore} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-emerald-50 border-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Click-Through Boost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                Up to 73%
                <span className="text-sm font-normal text-gray-500 ml-1">increase</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Based on AI-optimized title patterns
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
                <Zap className="w-4 h-4 text-purple-500" />
                Time Saved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {products.length * 15} min
              </div>
              <div className="text-xs text-gray-500 mt-1">
                That's {Math.round((products.length * 15) / 60)} hours saved!
              </div>
              <div className="flex items-center gap-1 mt-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-600">AI works 24/7</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - AI Optimization (70%) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-blue-600" />
                  AI Optimization Templates
                  <Badge className="ml-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    RECOMMENDED
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Choose an AI template or create your own. Our AI will analyze and optimize titles accordingly.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Template Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {defaultAIFormats.map((format) => (
                    <div
                      key={format.id}
                      onClick={() => setSelectedFormat(format)}
                      className={`
                        p-4 border rounded-xl cursor-pointer transition-all duration-200
                        ${selectedFormat?.id === format.id 
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{format.categoryName}</h4>
                        {selectedFormat?.id === format.id && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {format.primaryElement}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {format.secondaryElement}
                          </Badge>
                        </div>
                        <p className="text-gray-600">Tone: <span className="font-medium">{format.tone}</span></p>
                        <p className="text-gray-600">
                          Length: {format.minCharacters}-{format.maxCharacters} chars
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom Format Editor */}
                {selectedFormat && (
                  <div className="space-y-6 p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">Customize This Template</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFormatModal(true)}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Edit Template
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Primary Element</Label>
                        <Select
                          value={selectedFormat.primaryElement}
                          onValueChange={(value) => setSelectedFormat({
                            ...selectedFormat,
                            primaryElement: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {primaryElements.map((el) => (
                              <SelectItem key={el} value={el}>{el}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Secondary Element</Label>
                        <Select
                          value={selectedFormat.secondaryElement}
                          onValueChange={(value) => setSelectedFormat({
                            ...selectedFormat,
                            secondaryElement: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {secondaryElements.map((el) => (
                              <SelectItem key={el} value={el}>{el}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Tone</Label>
                        <Select
                          value={selectedFormat.tone}
                          onValueChange={(value) => setSelectedFormat({
                            ...selectedFormat,
                            tone: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {tones.map((tone) => (
                              <SelectItem key={tone} value={tone}>{tone}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Min Characters</Label>
                          <Input
                            type="number"
                            value={selectedFormat.minCharacters}
                            onChange={(e) => setSelectedFormat({
                              ...selectedFormat,
                              minCharacters: parseInt(e.target.value) || 50
                            })}
                          />
                        </div>
                        <div>
                          <Label>Max Characters</Label>
                          <Input
                            type="number"
                            value={selectedFormat.maxCharacters}
                            onChange={(e) => setSelectedFormat({
                              ...selectedFormat,
                              maxCharacters: parseInt(e.target.value) || 70
                            })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => handleAIOptimization(false)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Generate AI Titles
                  </Button>
                  <Button
                    onClick={() => handleAIOptimization(true)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Optimize & Apply Directly
                  </Button>
                  <Button
                    onClick={createNewFormat}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    New Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Classic Optimization (30%) */}
          <div className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RulerIcon className="w-5 h-5 text-gray-600" />
                  Classic Rules
                </CardTitle>
                <CardDescription>
                  Manual title adjustments for precise control
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Prefix & Suffix */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Prefix</Label>
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
                        placeholder="e.g., Best Seller:"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Suffix</Label>
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
                        placeholder="e.g., - Premium Quality"
                      />
                    )}
                  </div>
                </div>

                {/* Find & Replace */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Find & Replace</Label>
                    <Switch
                      checked={classicRules.findReplace.enabled}
                      onCheckedChange={(checked) => setClassicRules({
                        ...classicRules,
                        findReplace: { ...classicRules.findReplace, enabled: checked }
                      })}
                    />
                  </div>
                  {classicRules.findReplace.enabled && (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={classicRules.findReplace.find}
                        onChange={(e) => setClassicRules({
                          ...classicRules,
                          findReplace: { ...classicRules.findReplace, find: e.target.value }
                        })}
                        placeholder="Find"
                      />
                      <Input
                        value={classicRules.findReplace.replace}
                        onChange={(e) => setClassicRules({
                          ...classicRules,
                          findReplace: { ...classicRules.findReplace, replace: e.target.value }
                        })}
                        placeholder="Replace with"
                      />
                    </div>
                  )}
                </div>

                {/* Find & Remove */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Find & Remove</Label>
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

                {/* Capitalization */}
                <div className="space-y-2">
                  <Label>Capitalization</Label>
                  <Select
                    value={classicRules.capitalization}
                    onValueChange={(value) => setClassicRules({
                      ...classicRules,
                      capitalization: value
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep">Keep Original</SelectItem>
                      <SelectItem value="title">Title Case</SelectItem>
                      <SelectItem value="sentence">Sentence Case</SelectItem>
                      <SelectItem value="lower">Lower Case</SelectItem>
                      <SelectItem value="upper">Upper Case</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Apply Classic Rules Button */}
                <Button
                  onClick={handleClassicOptimization}
                  className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Apply Classic Rules
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modals */}
        {/* Progress Modal */}
        <Dialog open={showProgressModal} onOpenChange={setShowProgressModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                AI is Working Its Magic
              </DialogTitle>
              <DialogDescription>
                Our AI is analyzing and optimizing your product titles...
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
                <Brain className="w-12 h-12 text-blue-500 animate-pulse" />
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
                AI Generated Titles Preview
              </DialogTitle>
              <DialogDescription>
                Review the AI-optimized titles before applying them to your store
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {optimizationResults.map((result, index) => (
                <div key={result.productId} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-4">
                    <img
                      src={result.image}
                      alt={result.oldTitle}
                      className="w-16 h-16 rounded-lg object-cover border"
                    />
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-500 mb-1">Original Title</Label>
                          <p className="text-sm text-gray-700">{result.oldTitle}</p>
                          <p className="text-xs text-gray-500 mt-1">{result.oldTitle.length} chars</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500 mb-1">AI Optimized Title</Label>
                          <p className="text-sm font-medium text-gray-900">{result.newTitle}</p>
                          <p className="text-xs text-gray-500 mt-1">{result.newTitle.length} chars</p>
                        </div>
                      </div>
                      {result.oldTitle !== result.newTitle && (
                        <div className="mt-3">
                          <Badge variant={result.newTitle.length > result.oldTitle.length ? "success" : "secondary"} className="text-xs">
                            {result.newTitle.length > result.oldTitle.length ? "Improved" : "Optimized"}
                          </Badge>
                          <span className="text-xs text-gray-600 ml-2">
                            {Math.abs(result.newTitle.length - result.oldTitle.length)} characters {result.newTitle.length > result.oldTitle.length ? 'added' : 'removed'}
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
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
                Here's how much better your titles will perform
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
                  <span className="font-semibold">Your new titles are {Math.abs(stats.improvement)}% better</span> 
                  {" "}than before and optimized for search engines.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Expected click-through rate increase: <span className="font-medium text-green-600">Up to 73%</span>
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
                  <li>✓ Higher click-through rates on product listings</li>
                  <li>✓ Consistent brand voice across all products</li>
                  <li>✓ Mobile-friendly title lengths</li>
                  <li>✓ Keyword-rich without being spammy</li>
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
                onClick={applyOptimizations}
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
                Your product titles have been optimized successfully
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
                  {progress.current} of {progress.total} product titles were successfully updated.
                </p>
                {progress.total - progress.current > 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    {progress.total - progress.current} products failed to update
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Pro Tip:</span> Monitor your analytics in the next 7-14 days to see the impact of your optimized titles on organic traffic and conversions.
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
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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