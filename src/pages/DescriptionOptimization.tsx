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
  FileText,
  List,
  Grid3x3,
  ChevronRight,
  Settings,
  Copy,
  Trash2,
  MoreVertical,
  Package,
  Building,
  ArrowLeft,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

interface Product {
  _id: string;
  productId: string;
  description: string;
  productImage: string;
  handle: string;
  status: string;
  title?: string;
  vendor?: string;
  productType?: string;
  totalInventory?: number;
  categoryName?: string;
}

interface OptimizationResult {
  productId: string;
  oldDescription: string;
  newDescription: string;
  characterCount: number;
  image: string;
}

export type AIBlockType =
  | 'opening'
  | 'story'
  | 'features'
  | 'benefits'
  | 'artisanStory'
  | 'brandStory'
  | 'sustainability'
  | 'useCases'
  | 'technicalDetails'
  | 'careInstructions'
  | 'specifications'
  | 'cta';

export interface AIFormat {
  id: string;
  name: string;
  description: string;
  bestFor: string[];
  toneExamples: string[];
  blocks: {
    type: AIBlockType;
    heading?: string;
    required: boolean;
  }[];
  allowCustom?: boolean;
}

export const defaultAIFormats: AIFormat[] = [
  {
    id: 'story_driven',
    name: 'Story Driven (Emotional)',
    description: 'Creates an emotional connection using storytelling, perfect for premium and handcrafted products.',
    bestFor: ['Handcrafted', 'Home Decor', 'Lifestyle', 'Gifting'],
    toneExamples: ['Warm', 'Elegant', 'Premium', 'Inspirational'],
    blocks: [
      { type: 'opening', required: true },
      { type: 'story', heading: 'Artisan Craft Meets Modern Living', required: true },
      { type: 'features', heading: 'Design Highlights', required: true },
      { type: 'sustainability', heading: 'Crafted With Purpose', required: false },
      { type: 'specifications', heading: 'Specifications', required: true },
    ],
  },
  {
    id: 'benefit_focused',
    name: 'Benefit Focused (High Conversion)',
    description: 'Optimized for conversions by highlighting benefits, use cases, and customer value.',
    bestFor: ['DTC Brands', 'Everyday Products', 'Amazon-style listings'],
    toneExamples: ['Confident', 'Friendly', 'Persuasive'],
    blocks: [
      { type: 'opening', required: true },
      { type: 'benefits', heading: 'Why You\'ll Love It', required: true },
      { type: 'features', heading: 'Key Features', required: true },
      { type: 'useCases', heading: 'Perfect For', required: false },
      { type: 'specifications', heading: 'Product Details', required: true },
      { type: 'cta', required: false },
    ],
  },
  {
    id: 'technical_clean',
    name: 'Technical & Clean',
    description: 'Clear, factual, and structured descriptions designed to build trust and reduce confusion.',
    bestFor: ['Electronics', 'Tools', 'B2B Products', 'Functional Items'],
    toneExamples: ['Professional', 'Neutral', 'Clear'],
    blocks: [
      { type: 'opening', required: true },
      { type: 'features', heading: 'Key Features', required: true },
      { type: 'technicalDetails', heading: 'Technical Details', required: true },
      { type: 'careInstructions', heading: 'Usage & Care', required: false },
      { type: 'specifications', heading: 'Specifications', required: true },
    ],
  },
  {
    id: 'brand_artisan_story',
    name: 'Brand & Artisan Story',
    description: 'Highlights brand values, artisan stories, and ethical craftsmanship.',
    bestFor: ['Sustainable Brands', 'Ethical Products', 'Handmade Goods'],
    toneExamples: ['Authentic', 'Emotional', 'Trust-Building'],
    blocks: [
      { type: 'opening', required: true },
      { type: 'artisanStory', heading: 'The Artisan Story', required: true },
      { type: 'features', heading: 'Design Highlights', required: true },
      { type: 'brandStory', heading: 'From the Heart of Tradition', required: true },
      { type: 'specifications', heading: 'Specifications', required: true },
    ],
  },
  {
    id: 'seo_scannable',
    name: 'SEO & Scannable',
    description: 'SEO-first format designed for search visibility and fast readability.',
    bestFor: ['Large Catalogs', 'SEO Pages', 'Google Shopping'],
    toneExamples: ['Informative', 'Clear', 'Search-Optimized'],
    blocks: [
      { type: 'opening', required: true },
      { type: 'features', heading: 'Product Features', required: true },
      { type: 'benefits', heading: 'Why Choose This Product', required: true },
      { type: 'specifications', heading: 'Specifications', required: true },
    ],
  },
  {
    id: 'custom_builder',
    name: 'Custom Structure (Advanced)',
    description: 'Build your own description structure by choosing and reordering content blocks.',
    bestFor: ['Advanced Users', 'Agencies', 'Brand Teams'],
    toneExamples: ['Any'],
    allowCustom: true,
    blocks: [
      { type: 'opening', required: false },
      { type: 'story', required: false },
      { type: 'features', required: false },
      { type: 'benefits', required: false },
      { type: 'artisanStory', required: false },
      { type: 'brandStory', required: false },
      { type: 'sustainability', required: false },
      { type: 'useCases', required: false },
      { type: 'technicalDetails', required: false },
      { type: 'careInstructions', required: false },
      { type: 'specifications', required: false },
      { type: 'cta', required: false },
    ],
  },
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

const blockTypeLabels: Record<AIBlockType, string> = {
  opening: 'Opening Hook',
  story: 'Story & Inspiration',
  features: 'Product Features',
  benefits: 'Benefits & Value',
  artisanStory: 'Artisan Story',
  brandStory: 'Brand Story',
  sustainability: 'Sustainability',
  useCases: 'Use Cases',
  technicalDetails: 'Technical Details',
  careInstructions: 'Care Instructions',
  specifications: 'Specifications',
  cta: 'Call to Action',
};

export default function DescriptionOptimization() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<AIFormat>(defaultAIFormats[0]);
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
  const [customBlocks, setCustomBlocks] = useState<AIBlockType[]>([]);
  const [selectedTone, setSelectedTone] = useState(tones[0]);
  const [includeKeywords, setIncludeKeywords] = useState("");
  const [excludeKeywords, setExcludeKeywords] = useState("");
  const [targetLength, setTargetLength] = useState(300);

  // Classic Rules State
  const [classicRules, setClassicRules] = useState({
    wordLimit: { enabled: false, value: 10 },
    characterLimit: { enabled: false, value: 500, breakWords: false },
    prefix: { enabled: false, value: "" },
    suffix: { enabled: false, value: "" },
    findReplace: { enabled: false, find: "", replace: "" },
    findRemove: { enabled: false, value: "" },
    capitalization: "keep" as "keep" | "description" | "sentence" | "lower" | "upper",
  });

  useEffect(() => {
    fetchStoredProducts();
  }, []);

  const fetchStoredProducts = async () => {
    try {
      setLoading(true);
      const response = await getApi(ApiConfig.getStoredDesProduct);
      const productsData = response || [];
      setProducts(productsData);
      
      // Calculate initial stats
      if (productsData.length > 0) {
        const avgLength = Math.round(
          productsData.reduce((sum: number, p: Product) => sum + (p.description?.length || 0), 0) / productsData.length
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
        status: `Optimizing: ${product.description?.substring(0, 50)}...`
      });

      try {
        const payload = {
          productId: product.productId,
          formatId: selectedFormat.id,
          formatName: selectedFormat.name,
          blocks: selectedFormat.allowCustom ? customBlocks : selectedFormat.blocks.map(b => b.type),
          tone: selectedTone,
          includeKeywords: includeKeywords.split(',').filter(k => k.trim()).map(k => k.trim()),
          excludeKeywords: excludeKeywords.split(',').filter(k => k.trim()).map(k => k.trim()),
          targetLength,
          apply: applyNow
        };

        const response = await postApi(ApiConfig.aiDescriptionOptimization, payload);
        
        if (applyNow) {
          // Direct apply - just track success
          if (response.applied) {
            results.push({
              productId: product.productId,
              oldDescription: product.description || '',
              newDescription: response.newDescription || product.description || '',
              characterCount: response.newDescription?.length || 0,
              image: product.productImage
            });
          }
        } else {
          // Preview mode
          if (response.newDescription) {
            results.push({
              productId: product.productId,
              oldDescription: product.description || '',
              newDescription: response.newDescription,
              characterCount: response.characterCount || response.newDescription.length,
              image: response.productImage || product.productImage
            });
          }
        }

        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`Error optimizing product ${product.productId}:`, error);
        // Keep old description as new description for failed optimizations
        results.push({
          productId: product.productId,
          oldDescription: product.description || '',
          newDescription: product.description || '',
          characterCount: product.description?.length || 0,
          image: product.productImage
        });
      }
    }

    setOptimizationResults(results);
    setShowProgressModal(false);

    if (applyNow) {
      // Show direct success modal
      const successful = results.filter(r => r.newDescription !== r.oldDescription).length;
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
      let newDescription = product.description || '';

      // Apply classic rules
      if (classicRules.wordLimit.enabled) {
        const words = newDescription.split(' ');
        if (words.length > classicRules.wordLimit.value) {
          newDescription = words.slice(0, classicRules.wordLimit.value).join(' ');
        }
      }

      if (classicRules.characterLimit.enabled) {
        if (newDescription.length > classicRules.characterLimit.value) {
          if (classicRules.characterLimit.breakWords) {
            newDescription = newDescription.substring(0, classicRules.characterLimit.value);
          } else {
            // Find last space before limit
            const truncated = newDescription.substring(0, classicRules.characterLimit.value);
            const lastSpace = truncated.lastIndexOf(' ');
            newDescription = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
          }
        }
      }

      if (classicRules.prefix.enabled && classicRules.prefix.value) {
        newDescription = `${classicRules.prefix.value} ${newDescription}`;
      }

      if (classicRules.suffix.enabled && classicRules.suffix.value) {
        newDescription = `${newDescription} ${classicRules.suffix.value}`;
      }

      if (classicRules.findReplace.enabled && classicRules.findReplace.find) {
        const regex = new RegExp(classicRules.findReplace.find, 'gi');
        newDescription = newDescription.replace(regex, classicRules.findReplace.replace);
      }

      if (classicRules.findRemove.enabled && classicRules.findRemove.value) {
        const regex = new RegExp(classicRules.findRemove.value, 'gi');
        newDescription = newDescription.replace(regex, '');
      }

      // Apply capitalization
      switch (classicRules.capitalization) {
        case 'description':
          newDescription = newDescription.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
          break;
        case 'sentence':
          newDescription = newDescription.charAt(0).toUpperCase() + newDescription.slice(1).toLowerCase();
          break;
        case 'lower':
          newDescription = newDescription.toLowerCase();
          break;
        case 'upper':
          newDescription = newDescription.toUpperCase();
          break;
        // 'keep' does nothing
      }

      // Clean up extra spaces
      newDescription = newDescription.replace(/\s+/g, ' ').trim();

      results.push({
        productId: product.productId,
        oldDescription: product.description || '',
        newDescription,
        characterCount: newDescription.length,
        image: product.productImage
      });

      setProgress({
        current: i + 1,
        total: products.length,
        status: `Processing: ${product.description?.substring(0, 50)}...`
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
      
      if (result.oldDescription !== result.newDescription) {
        try {
          await postApi(ApiConfig.updateShopifyDescription, {
            productId: result.productId,
            oldDescription: result.oldDescription,
            newDescription: result.newDescription
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
        status: `Updating: ${result.oldDescription.substring(0, 50)}...`
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

    const avgOldLength = results.reduce((sum, r) => sum + r.oldDescription.length, 0) / results.length;
    const avgNewLength = results.reduce((sum, r) => sum + r.newDescription.length, 0) / results.length;
    
    // Mock SEO score calculation
    const seoScore = Math.min(100, Math.round((avgNewLength / 800) * 100));
    const keywordDensity = Math.min(100, Math.round((results.filter(r => 
      r.newDescription.toLowerCase().includes(r.oldDescription.toLowerCase().split(' ')[0])
    ).length / results.length) * 100));
    
    const improvement = Math.round(((avgNewLength - avgOldLength) / avgOldLength) * 100);

    setStats({
      averageLength: Math.round(avgNewLength),
      seoScore,
      keywordDensity,
      improvement
    });
  };

  const createCustomFormat = () => {
    const newFormat: AIFormat = {
      id: `custom_${Date.now()}`,
      name: "Custom Format",
      description: "Your custom description format",
      bestFor: ["Custom Use Cases"],
      toneExamples: [selectedTone],
      allowCustom: true,
      blocks: customBlocks.map(blockType => ({
        type: blockType,
        required: true
      }))
    };
    setSelectedFormat(newFormat);
    setShowFormatModal(true);
  };

  const toggleCustomBlock = (blockType: AIBlockType) => {
    setCustomBlocks(prev => 
      prev.includes(blockType) 
        ? prev.filter(b => b !== blockType)
        : [...prev, blockType]
    );
  };

  if (loading) {
    return (
      <AppLayout title="Description Optimization">
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
    <AppLayout title="AI Description Optimization">
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
                  Transform Product Descriptions with AI
                </span>
              </h1>
              <p className="text-gray-600 mb-4">
                Generate compelling, SEO-optimized descriptions that convert. Choose from proven formats or build your own custom structure.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="gap-1">
                  <Target className="w-3 h-3" /> SEO Optimized
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="w-3 h-3" /> Higher Conversions
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Zap className="w-3 h-3" /> Instant Generation
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
                    {products.length} Products Selected
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <DialogTitle className="text-xl font-bold text-gray-900">Selected Products</DialogTitle>
                        <DialogDescription className="text-sm text-gray-600 mt-1">
                          {products.length} product{products.length !== 1 ? 's' : ''} ready for AI optimization
                        </DialogDescription>
                      </div>
                      <Badge variant="outline" className="font-medium">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Ready
                      </Badge>
                    </div>
                  </DialogHeader>
                  
                  <div className="mt-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-xs text-blue-600 font-medium">Total Products</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">{products.length}</p>
                      </div>
                      <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                        <p className="text-xs text-green-600 font-medium">Avg. Length</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                          {Math.round(products.reduce((sum, p) => sum + (p.description?.length || 0), 0) / products.length)}
                          <span className="text-sm font-normal text-gray-500 ml-1">chars</span>
                        </p>
                      </div>
                      <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                        <p className="text-xs text-purple-600 font-medium">Categories</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                          {new Set(products.map(p => p.categoryName)).size}
                        </p>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                        <p className="text-xs text-amber-600 font-medium">Expected Time</p>
                        <p className="text-xl font-bold text-gray-900 mt-1">
                          {Math.ceil(products.length * 1.5)}
                          <span className="text-sm font-normal text-gray-500 ml-1">min</span>
                        </p>
                      </div>
                    </div>

                    {/* Products List */}
                    <div className="space-y-3 max-h-[50vh] overflow-y-auto scrollbar-thin pr-2">
                      {products.map((product) => (
                        <div
                          key={product.productId}
                          className="group bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                        >
                          <div className="flex items-start gap-4">
                            <div className="relative flex-shrink-0">
                              <img
                                src={product.productImage || 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=150&h=150&fit=crop'}
                                alt={product.description}
                                className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                              />
                              {product.status === "DRAFT" && (
                                <Badge className="absolute -top-2 -right-2 text-xs bg-amber-100 text-amber-800 border-0">
                                  Draft
                                </Badge>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                                    {product.description || 'No description'}
                                  </h4>
                                  {product.title && product.title !== product.description && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                      Title: "{product.title}"
                                    </p>
                                  )}
                                  
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {product.categoryName && (
                                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                                        {product.categoryName}
                                      </Badge>
                                    )}
                                    
                                    {product.productType && (
                                      <span className="text-xs text-gray-500">
                                        {product.productType}
                                      </span>
                                    )}
                                    
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <span className="font-medium">{product.description?.length || 0}</span>
                                      <span>chars</span>
                                    </div>
                                    
                                    {product.vendor && (
                                      <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <Building className="w-3 h-3" />
                                        {product.vendor}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                                <div className="flex items-center gap-3">
                                  {product.status === "ACTIVE" ? (
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      <span className="text-xs text-green-700 font-medium">Active</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                      <span className="text-xs text-amber-700 font-medium">Draft</span>
                                    </div>
                                  )}
                                  
                                  {product.totalInventory !== undefined && (
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                      <Package className="w-3 h-3" />
                                      {product.totalInventory} in stock
                                    </div>
                                  )}
                                </div>
                                
                                <div className="text-xs text-gray-500">
                                  ID: {product.productId?.split('/').pop()?.slice(-6) || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {products.length === 0 && (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No products selected</h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                          Go back and select products to optimize with AI
                        </p>
                        <Button
                          variant="outline"
                          className="mt-4"
                          onClick={() => navigate('/product-selection')}
                        >
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Select Products
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter className="mt-6 pt-6 border-t border-gray-200">
                    <Button
                      variant="outline"
                      onClick={() => navigate('/product-selection')}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add More Products
                    </Button>
                    <Button
                      onClick={() => {
                        setShowProductsModal(false);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Start Optimization
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <Button 
                onClick={() => handleAIOptimization(false)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2"
              >
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
                <FileText className="w-4 h-4 text-blue-500" />
                Current Avg. Length
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.averageLength}
                <span className="text-sm font-normal text-gray-500 ml-1">characters</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.averageLength < 100 ? "Too short for SEO" : 
                 stats.averageLength > 1000 ? "Too long for mobile" : "Optimal range"}
              </div>
              <Progress 
                value={Math.min(100, (stats.averageLength / 1000) * 100)} 
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
                Conversion Boost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                Up to 45%
                <span className="text-sm font-normal text-gray-500 ml-1">increase</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Based on AI-optimized description patterns
              </div>
              <div className="flex items-center mt-2">
                <Stars className="w-4 h-4 text-amber-500 mr-1" />
                <Stars className="w-4 h-4 text-amber-500 mr-1" />
                <Stars className="w-4 h-4 text-amber-500 mr-1" />
                <Stars className="w-4 h-4 text-amber-500" />
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
                {products.length * 25} min
              </div>
              <div className="text-xs text-gray-500 mt-1">
                That's {Math.round((products.length * 25) / 60)} hours saved!
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
                  AI Description Formats
                  <Badge className="ml-auto bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    RECOMMENDED
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Choose a proven format or build your own. Each format is optimized for different product types and goals.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Format Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {defaultAIFormats.map((format) => (
                    <div
                      key={format.id}
                      onClick={() => setSelectedFormat(format)}
                      className={`
                        p-4 border rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md
                        ${selectedFormat?.id === format.id 
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100 shadow-sm' 
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{format.name}</h4>
                        {selectedFormat?.id === format.id && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{format.description}</p>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Best For:</p>
                          <div className="flex flex-wrap gap-1">
                            {format.bestFor.slice(0, 3).map((type) => (
                              <Badge key={type} variant="outline" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Tone:</p>
                          <div className="flex flex-wrap gap-1">
                            {format.toneExamples.slice(0, 2).map((tone) => (
                              <span key={tone} className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                {tone}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Sections:</p>
                          <p className="text-xs text-gray-600">
                            {format.blocks.filter(b => b.required).length} required sections
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom Format Builder */}
                {selectedFormat?.allowCustom && (
                  <div className="space-y-6 p-4 border rounded-lg bg-gray-50 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Build Custom Format</h4>
                        <p className="text-sm text-gray-600">Select the content blocks you want to include</p>
                      </div>
                      <Badge variant="outline" className="gap-1">
                        <Settings className="w-3 h-3" />
                        Custom Builder
                      </Badge>
                    </div>

                    {/* Content Blocks */}
                    <div>
                      <Label className="mb-3 block">Content Blocks</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {Object.entries(blockTypeLabels).map(([type, label]) => (
                          <div
                            key={type}
                            onClick={() => toggleCustomBlock(type as AIBlockType)}
                            className={`
                              p-3 border rounded-lg cursor-pointer transition-all duration-200
                              ${customBlocks.includes(type as AIBlockType)
                                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-100'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-white'
                              }
                            `}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`
                                w-5 h-5 rounded border flex items-center justify-center
                                ${customBlocks.includes(type as AIBlockType)
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'bg-white border-gray-300'
                                }
                              `}>
                                {customBlocks.includes(type as AIBlockType) && (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className="text-sm text-gray-700">{label}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customization Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Tone & Style</Label>
                        <Select value={selectedTone} onValueChange={setSelectedTone}>
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

                      <div>
                        <Label>Target Length (characters)</Label>
                        <Input
                          type="number"
                          value={targetLength}
                          onChange={(e) => setTargetLength(parseInt(e.target.value) || 300)}
                          min="50"
                          max="2000"
                        />
                      </div>

                      <div>
                        <Label>Must Include Keywords (comma-separated)</Label>
                        <Input
                          value={includeKeywords}
                          onChange={(e) => setIncludeKeywords(e.target.value)}
                          placeholder="e.g., premium, organic, handmade"
                        />
                      </div>

                      <div>
                        <Label>Exclude Keywords (comma-separated)</Label>
                        <Input
                          value={excludeKeywords}
                          onChange={(e) => setExcludeKeywords(e.target.value)}
                          placeholder="e.g., cheap, discount, low quality"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{customBlocks.length} blocks selected • ~{Math.round(targetLength / 100)} paragraphs</span>
                    </div>
                  </div>
                )}

                {/* Selected Format Preview */}
                {!selectedFormat?.allowCustom && selectedFormat && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50 mb-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">Selected Format: {selectedFormat.name}</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFormatModal(true)}
                        className="gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Customize
                      </Button>
                    </div>
                    
                    <div>
                      <Label className="mb-2 block">Structure Preview</Label>
                      <div className="space-y-2">
                        {selectedFormat.blocks.map((block, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg bg-white">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                              <span className="text-sm font-medium text-gray-700">
                                {block.heading || blockTypeLabels[block.type]}
                              </span>
                            </div>
                            {block.required && (
                              <Badge variant="outline" className="text-xs ml-auto">
                                Required
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => handleAIOptimization(false)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Generate AI Descriptions (Preview)
                  </Button>
                  <Button
                    onClick={() => handleAIOptimization(true)}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Optimize & Apply Directly
                  </Button>
                  <Button
                    onClick={createCustomFormat}
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Custom Format
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
                  Manual description adjustments for precise control
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Word Limit */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Word Limit</Label>
                    <Switch
                      checked={classicRules.wordLimit.enabled}
                      onCheckedChange={(checked) => setClassicRules({
                        ...classicRules,
                        wordLimit: { ...classicRules.wordLimit, enabled: checked }
                      })}
                    />
                  </div>
                  {classicRules.wordLimit.enabled && (
                    <Input
                      type="number"
                      value={classicRules.wordLimit.value}
                      onChange={(e) => setClassicRules({
                        ...classicRules,
                        wordLimit: { ...classicRules.wordLimit, value: parseInt(e.target.value) || 10 }
                      })}
                      min="1"
                      max="500"
                    />
                  )}
                </div>

                {/* Character Limit */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Character Limit</Label>
                    <Switch
                      checked={classicRules.characterLimit.enabled}
                      onCheckedChange={(checked) => setClassicRules({
                        ...classicRules,
                        characterLimit: { ...classicRules.characterLimit, enabled: checked }
                      })}
                    />
                  </div>
                  {classicRules.characterLimit.enabled && (
                    <>
                      <Input
                        type="number"
                        value={classicRules.characterLimit.value}
                        onChange={(e) => setClassicRules({
                          ...classicRules,
                          characterLimit: { ...classicRules.characterLimit, value: parseInt(e.target.value) || 500 }
                        })}
                        min="10"
                        max="2000"
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={classicRules.characterLimit.breakWords}
                          onCheckedChange={(checked) => setClassicRules({
                            ...classicRules,
                            characterLimit: { ...classicRules.characterLimit, breakWords: checked }
                          })}
                        />
                        <Label className="text-sm">Break words if needed</Label>
                      </div>
                    </>
                  )}
                </div>

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
                      capitalization: value as typeof classicRules.capitalization
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keep">Keep Original</SelectItem>
                      <SelectItem value="description">Title Case</SelectItem>
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
                Our AI is analyzing and optimizing your product descriptions...
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
                AI Generated Descriptions Preview
              </DialogTitle>
              <DialogDescription>
                Review the AI-optimized descriptions before applying them to your store
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {optimizationResults.map((result, index) => (
                <div key={result.productId} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-start gap-4">
                    <img
                      src={result.image}
                      alt={result.oldDescription}
                      className="w-16 h-16 rounded-lg object-cover border flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                            Original Description
                            <Badge variant="outline" className="text-xs">
                              {result.oldDescription.length} chars
                            </Badge>
                          </Label>
                          <div className="p-3 border border-gray-200 rounded-lg bg-gray-50 max-h-40 overflow-y-auto">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.oldDescription}</p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                            AI Optimized Description
                            <Badge variant="outline" className="text-xs">
                              {result.newDescription.length} chars
                            </Badge>
                          </Label>
                          <div className="p-3 border border-blue-200 rounded-lg bg-blue-50 max-h-40 overflow-y-auto">
                            <p className="text-sm font-medium text-gray-900 whitespace-pre-wrap">{result.newDescription}</p>
                          </div>
                        </div>
                      </div>
                      {result.oldDescription !== result.newDescription && (
                        <div className="mt-3 flex items-center gap-3">
                          <Badge variant={result.newDescription.length > result.oldDescription.length ? "success" : "secondary"} className="text-xs">
                            {result.newDescription.length > result.oldDescription.length ? "Expanded" : "Condensed"}
                          </Badge>
                          <span className="text-xs text-gray-600">
                            {Math.abs(result.newDescription.length - result.oldDescription.length)} characters {result.newDescription.length > result.oldDescription.length ? 'added' : 'removed'}
                          </span>
                          <span className="text-xs text-gray-500 ml-auto">
                            {Math.round((result.newDescription.length / result.oldDescription.length) * 100)}% of original length
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
                Here's how much better your descriptions will perform
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
                    <p className="text-sm text-center text-gray-600 mt-1">Content Improvement</p>
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
                  <span className="font-semibold">Your new descriptions are {Math.abs(stats.improvement)}% better</span> 
                  {" "}than before and optimized for search engines and conversions.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Expected conversion rate increase: <span className="font-medium text-green-600">Up to 45%</span>
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
                  <li>✓ Higher conversion rates on product pages</li>
                  <li>✓ Consistent brand voice across all products</li>
                  <li>✓ Mobile-friendly description structure</li>
                  <li>✓ Engaging storytelling and benefit-focused content</li>
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
                Your product descriptions have been optimized successfully
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
                  {progress.current} of {progress.total} product descriptions were successfully updated.
                </p>
                {progress.total - progress.current > 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    {progress.total - progress.current} products failed to update
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Pro Tip:</span> Monitor your analytics in the next 7-14 days to see the impact of your optimized descriptions on organic traffic and conversions.
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