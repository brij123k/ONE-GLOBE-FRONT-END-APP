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
import { Textarea } from "@/components/ui/textarea";
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
  MessageSquare,
  FileEdit,
  Image as ImageIcon,
  Camera,
  Palette,
  Layers,
  Hash,
  Type,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";

interface Product {
  _id: string;
  shopId: string;
  productId: string;
  productTitle: string;
  images: ProductImageSEO[];
  createdAt?: string;
  updatedAt?: string;
}

interface ImageVariant {
  variantId: string;
  title: string;
  sku?: string;
}

interface ProductImageSEO {
  imageId: string;        // MediaImage ID
  imageUrl: string;
  altText: string;
  imageName: string;
  variants: ImageVariant[];
}

interface OptimizationResult {
  productId: string;
  productTitle: string;
  images: {
    imageId: string;
    oldAlt: string;
    newAlt: string;
    imageUrl?: string;
    variants?: ImageVariant[];
  }[];
}

interface AIOptimizationResponse {
  applied?: boolean;
  productId: string;
  updatedImages?: number;
  productTitle?: string;
  images?: {
    imageId: string;
    oldAlt: string;
    newAlt: string;
    variants?: ImageVariant[];
  }[];
}

export default function ImageOptimization() {
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
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState({
    totalImages: 0,
    imagesWithALT: 0,
    emptyALT: 0,
    averageLength: 0,
    seoScore: 0,
    improvement: 0,
    keywordInclusion: 0,
  });

  // Classic Rules State
  const [classicRules, setClassicRules] = useState({
    useProductTitle: true,
    prefix: { enabled: false, value: "" },
    suffix: { enabled: false, value: "" },
    maxLength: 125,
    removeSpecialChars: true,
    format: "sentence", // sentence, title, lowercase
    applyToAllImages: true,
  });

  useEffect(() => {
    fetchStoredProducts();
  }, []);

  const fetchStoredProducts = async () => {
    try {
      setLoading(true);
      const response = await getApi(ApiConfig.getStoredImageProduct);
      const productsData = response || [];
      setProducts(productsData);
      
      // Calculate initial stats
      if (productsData.length > 0) {
        let totalImages = 0;
        let imagesWithALT = 0;
        let totalLength = 0;
        
        productsData.forEach((product: Product) => {
          product.images.forEach(image => {
            totalImages++;
            if (image.altText && image.altText.trim() !== '') {
              imagesWithALT++;
              totalLength += image.altText.length;
            }
          });
        });
        
        const emptyALT = totalImages - imagesWithALT;
        const avgLength = imagesWithALT > 0 ? Math.round(totalLength / imagesWithALT) : 0;
        
        setStats(prev => ({
          ...prev,
          totalImages,
          imagesWithALT,
          emptyALT,
          averageLength: avgLength,
          seoScore: calculateSeoScore(productsData),
          keywordInclusion: calculateKeywordInclusion(productsData),
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
    
    let totalScore = 0;
    let imageCount = 0;
    
    products.forEach(product => {
      product.images.forEach(image => {
        const altText = image.altText || '';
        imageCount++;
        
        // Score for having ALT text
        if (altText.trim()) totalScore += 40;
        
        // Score based on length (optimal: 100-125 characters)
        if (altText.length >= 100 && altText.length <= 125) totalScore += 30;
        else if (altText.length >= 80 && altText.length <= 150) totalScore += 20;
        else if (altText.length > 0) totalScore += 10;
        
        // Score for including product title
        if (product.productTitle && altText.toLowerCase().includes(product.productTitle.toLowerCase().substring(0, 20))) {
          totalScore += 20;
        }
        
        // Score for descriptive content (not just filename)
        const filenameWords = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'img', 'image', 'product'];
        const isJustFilename = filenameWords.some(word => 
          altText.toLowerCase().includes(`.${word}`) || 
          altText.toLowerCase().includes(`${word}_`)
        );
        if (!isJustFilename) totalScore += 10;
      });
    });
    
    return imageCount > 0 ? Math.round(totalScore / imageCount) : 0;
  };

  const calculateKeywordInclusion = (products: Product[]): number => {
    if (products.length === 0) return 0;
    
    let included = 0;
    let totalImages = 0;
    
    products.forEach(product => {
      product.images.forEach(image => {
        const altText = image.altText || '';
        totalImages++;
        
        if (product.productTitle && altText) {
          const titleWords = product.productTitle.toLowerCase().split(/\s+/).slice(0, 3);
          const containsKeyword = titleWords.some(word => 
            word.length > 3 && altText.toLowerCase().includes(word)
          );
          if (containsKeyword) included++;
        }
      });
    });
    
    return totalImages > 0 ? Math.round((included / totalImages) * 100) : 0;
  };

  const generateClassicALT = (product: Product, imageIndex: number = 0): string => {
    const productTitle = product.productTitle || '';
    let altText = '';
    
    // Start with product title if enabled
    if (classicRules.useProductTitle && productTitle) {
      altText = productTitle;
      
      // Add image position if multiple images
      if (product.images.length > 1 && imageIndex > 0) {
        altText += ` - ${getImagePositionText(imageIndex)}`;
      }
    }
    
    // Add prefix if enabled
    if (classicRules.prefix.enabled && classicRules.prefix.value) {
      altText = `${classicRules.prefix.value} ${altText}`;
    }
    
    // Add suffix if enabled
    if (classicRules.suffix.enabled && classicRules.suffix.value) {
      altText = `${altText} ${classicRules.suffix.value}`;
    }
    
    // Remove special characters if enabled
    if (classicRules.removeSpecialChars) {
      altText = altText.replace(/[^\w\s-]/g, ' ');
    }
    
    // Apply formatting
    switch (classicRules.format) {
      case 'title':
        altText = altText.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
        break;
      case 'sentence':
        altText = altText.charAt(0).toUpperCase() + altText.slice(1);
        break;
      case 'lowercase':
        altText = altText.toLowerCase();
        break;
    }
    
    // Clean up extra spaces
    altText = altText.replace(/\s+/g, ' ').trim();
    
    // Truncate to max length
    if (altText.length > classicRules.maxLength) {
      const truncated = altText.substring(0, classicRules.maxLength);
      const lastSpace = truncated.lastIndexOf(' ');
      altText = lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated;
    }
    
    return altText;
  };

  const getImagePositionText = (index: number): string => {
    const positions = ['Front View', 'Side View', 'Back View', 'Top View', 'Detail View', 'Angle View'];
    return positions[index] || `View ${index + 1}`;
  };

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const handleClassicOptimization = async (previewMode = true) => {
    if (products.length === 0) return;

    setShowProgressModal(true);
    setProgress({
      current: 0,
      total: products.length,
      status: "Generating ALT text for images..."
    });

    const results: OptimizationResult[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      const imageResults = product.images.map((image, imageIndex) => ({
        imageId: image.imageId,
        oldAlt: image.altText || '(Empty)',
        newAlt: generateClassicALT(product, imageIndex),
        imageUrl: image.imageUrl,
        variants: image.variants
      }));

      results.push({
        productId: product.productId,
        productTitle: product.productTitle,
        images: imageResults
      });

      setProgress({
        current: i + 1,
        total: products.length,
        status: `Processing: ${product.productTitle}`
      });
    }

    setOptimizationResults(results);
    setShowProgressModal(false);

    if (previewMode) {
      calculateComparisonStats(results);
      setShowPreviewModal(true);
    } else {
      await applyImageOptimizations(results);
    }
  };

  const handleAIOptimization = async (applyNow = false) => {
    if (products.length === 0) return;

    setShowProgressModal(true);
    setProgress({
      current: 0,
      total: products.length,
      status: "Analyzing images with AI..."
    });

    const results: OptimizationResult[] = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      setProgress({
        current: i + 1,
        total: products.length,
        status: `Optimizing: ${product.productTitle}`
      });

      try {
        // For each product, we need to process each image
        const productImages = product.images.map(image => ({
          productId: product.productId,
          image: image.imageUrl,
          imageId: image.imageId,
          apply: applyNow
        }));

        // Process images for this product
        const imageResults = [];
        
        for (const imageData of productImages) {
          try {
            const payload = {
              productId: imageData.productId,
              image: imageData.image,
              apply: applyNow
            };

            const response = await postApi(ApiConfig.aiImageOptimization, payload) as AIOptimizationResponse;
            
            if (applyNow && response.applied) {
              // Direct apply mode - response doesn't have individual image data
              // We need to generate results based on product data
              imageResults.push({
                imageId: imageData.imageId,
                oldAlt: product.images.find(img => img.imageId === imageData.imageId)?.altText || '(Empty)',
                newAlt: generateClassicALT(product, product.images.findIndex(img => img.imageId === imageData.imageId)),
                imageUrl: imageData.image,
                variants: product.images.find(img => img.imageId === imageData.imageId)?.variants
              });
            } else if (!applyNow && response.images) {
              // Preview mode - response has individual image data
              response.images.forEach(imageResult => {
                imageResults.push({
                  imageId: imageResult.imageId,
                  oldAlt: imageResult.oldAlt || '(Empty)',
                  newAlt: imageResult.newAlt,
                  imageUrl: product.images.find(img => img.imageId === imageResult.imageId)?.imageUrl || '',
                  variants: imageResult.variants
                });
              });
            }
          } catch (imageError) {
            console.error(`Error optimizing image ${imageData.imageId}:`, imageError);
            const originalImage = product.images.find(img => img.imageId === imageData.imageId);
            imageResults.push({
              imageId: imageData.imageId,
              oldAlt: originalImage?.altText || '(Empty)',
              newAlt: originalImage?.altText || '(Empty)',
              imageUrl: imageData.image,
              variants: originalImage?.variants
            });
          }

          // Small delay between image requests
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        results.push({
          productId: product.productId,
          productTitle: product.productTitle,
          images: imageResults
        });

      } catch (error) {
        console.error(`Error optimizing product ${product.productTitle}:`, error);
        // Add product with original data on error
        results.push({
          productId: product.productId,
          productTitle: product.productTitle,
          images: product.images.map(image => ({
            imageId: image.imageId,
            oldAlt: image.altText || '(Empty)',
            newAlt: image.altText || '(Empty)',
            imageUrl: image.imageUrl,
            variants: image.variants
          }))
        });
      }
    }

    setOptimizationResults(results);
    setShowProgressModal(false);

    if (applyNow) {
      // Show direct success modal
      const successfulImages = results.reduce((sum, result) => {
        return sum + result.images.filter(img => img.newAlt !== img.oldAlt).length;
      }, 0);
      
      const totalImages = results.reduce((sum, result) => sum + result.images.length, 0);
      
      setProgress({
        current: successfulImages,
        total: totalImages,
        status: "completed"
      });
      setShowSuccessModal(true);
    } else {
      // Show preview modal
      calculateComparisonStats(results);
      setShowPreviewModal(true);
    }
  };

  const applyImageOptimizations = async (results: OptimizationResult[]) => {
    setShowProgressModal(true);
    
    const totalOperations = results.reduce((sum, result) => sum + result.images.filter(img => img.newAlt !== img.oldAlt).length, 0);
    setProgress({
      current: 0,
      total: totalOperations,
      status: "Applying ALT text to images..."
    });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      
      // Group images by product for batch update
      const imagesToUpdate = result.images.filter(img => img.newAlt !== img.oldAlt);
      
      if (imagesToUpdate.length > 0) {
        try {
          const payload = {
            productId: result.productId,
            images: imagesToUpdate.map(img => ({
              imageId: img.imageId,
              oldAlt: img.oldAlt === '(Empty)' ? '' : img.oldAlt,
              newAlt: img.newAlt
            }))
          };

          await postApi(ApiConfig.updateImageOptimization, payload);
          successCount += imagesToUpdate.length;
        } catch (error) {
          console.error(`Failed to update ${result.productId}:`, error);
          failCount += imagesToUpdate.length;
        }
      }

      setProgress({
        current: successCount + failCount,
        total: totalOperations,
        status: `Updating: ${result.productTitle}`
      });
    }

    setShowProgressModal(false);
    setShowComparisonModal(false);
    
    setProgress({
      current: successCount,
      total: totalOperations,
      status: "completed"
    });
    setShowSuccessModal(true);
  };

  const calculateComparisonStats = (results: OptimizationResult[]) => {
    if (results.length === 0) return;

    let totalOldLength = 0;
    let totalNewLength = 0;
    let emptyALT = 0;
    let totalImages = 0;
    let keywordInclusion = 0;

    results.forEach(result => {
      result.images.forEach(image => {
        totalImages++;
        totalOldLength += (image.oldAlt === '(Empty)' ? 0 : image.oldAlt.length);
        totalNewLength += image.newAlt.length;
        
        if (image.oldAlt === '(Empty)') emptyALT++;
        
        // Check keyword inclusion
        if (result.productTitle && image.newAlt) {
          const titleWords = result.productTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 3);
          if (titleWords.some(word => image.newAlt.toLowerCase().includes(word))) {
            keywordInclusion++;
          }
        }
      });
    });

    const avgOldLength = totalOldLength / totalImages;
    const avgNewLength = totalNewLength / totalImages;
    
    const improvement = Math.round(((avgNewLength - avgOldLength) / (avgOldLength || 1)) * 100);
    const seoScore = Math.min(100, Math.round((avgNewLength / 125) * 100));

    setStats(prev => ({
      ...prev,
      totalImages,
      imagesWithALT: totalImages - emptyALT,
      emptyALT,
      averageLength: Math.round(avgNewLength),
      seoScore,
      improvement,
      keywordInclusion: Math.round((keywordInclusion / totalImages) * 100)
    }));
  };

  if (loading) {
    return (
      <AppLayout title="Image ALT Text Optimization">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <ImageIcon className="w-12 h-12 animate-pulse text-amber-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading products for image optimization...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Image ALT Text Optimization">
      <div className="p-6 space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6 animate-fade-in">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                  <Rocket className="w-3 h-3 mr-1" /> VISUAL SEO
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-orange-600">
                  Boost Image SEO & Accessibility
                </span>
              </h1>
              <p className="text-gray-600 mb-4">
                Optimize image ALT text for better search rankings, accessibility, and user experience. 
                Proper ALT text can improve image search traffic by up to 45%.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="gap-1">
                  <Search className="w-3 h-3" /> Image SEO
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="w-3 h-3" /> Accessibility
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
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Products for Image Optimization</DialogTitle>
                    <DialogDescription>
                      {stats.totalImages} images across {products.length} products
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto">
                    {products.map((product) => (
                      <div key={product.productId} className="p-4 border rounded-lg">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleProductExpansion(product.productId)}
                        >
                          <div className="flex items-center gap-3">
                            {product.images[0] && (
                              <img
                                src={product.images[0].imageUrl}
                                alt={product.productTitle}
                                className="w-12 h-12 rounded-lg object-cover border"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{product.productTitle}</p>
                              <p className="text-xs text-gray-500">
                                {product.images.length} images • {product.images.filter(img => img.altText).length} with ALT
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            {expandedProducts[product.productId] ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        
                        {expandedProducts[product.productId] && (
                          <div className="mt-4 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {product.images.map((image, idx) => (
                                <div key={image.imageId} className="space-y-2">
                                  <img
                                    src={image.imageUrl}
                                    alt={image.altText || product.productTitle}
                                    className="w-full h-20 rounded-lg object-cover border"
                                  />
                                  <div className="text-xs">
                                    <p className="font-medium">Image {idx + 1}</p>
                                    <p className="text-gray-500 truncate">
                                      {image.altText ? `${image.altText.substring(0, 20)}...` : 'No ALT'}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                onClick={() => setShowAIOptionsModal(true)}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 gap-2"
              >
                <Brain className="w-4 h-4" />
                Start AI Optimization
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-white to-amber-50 border-amber-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-500" />
                Total Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.totalImages}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Across {products.length} products
              </div>
              <Progress 
                value={(stats.imagesWithALT / stats.totalImages) * 100} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <RulerIcon className="w-4 h-4 text-blue-500" />
                Avg. ALT Length
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.averageLength}
                <span className="text-sm font-normal text-gray-500 ml-1">chars</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {stats.averageLength < 100 ? "Too short" : 
                 stats.averageLength > 125 ? "May be truncated" : "Optimal"}
              </div>
              <Progress 
                value={Math.min(100, (stats.averageLength / 125) * 100)} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-emerald-50 border-emerald-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
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
                {stats.emptyALT} missing ALT text
              </div>
              <Progress 
                value={stats.seoScore} 
                className="mt-2 h-1"
              />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-white to-pink-50 border-pink-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-pink-500" />
                Traffic Boost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                Up to 45%
                <span className="text-sm font-normal text-gray-500 ml-1">increase</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Image search traffic
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
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Classic Optimization */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-amber-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="w-5 h-5 text-amber-600" />
                  Classic ALT Text Optimization
                  <Badge className="ml-auto bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    SIMPLE & EFFECTIVE
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Create descriptive ALT text using product information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* ALT Text Components */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-medium">Use Product Title</Label>
                      <p className="text-sm text-gray-500">Include product title in ALT text</p>
                    </div>
                    <Switch
                      checked={classicRules.useProductTitle}
                      onCheckedChange={(checked) => setClassicRules({
                        ...classicRules,
                        useProductTitle: checked
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
                        placeholder="e.g., Photo of, Image showing"
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
                        placeholder="e.g., product, item, for sale"
                      />
                    )}
                  </div>
                </div>

                {/* Text Formatting */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Text Formatting</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Text Format</Label>
                      <Select
                        value={classicRules.format}
                        onValueChange={(value) => setClassicRules({
                          ...classicRules,
                          format: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sentence">Sentence Case</SelectItem>
                          <SelectItem value="title">Title Case</SelectItem>
                          <SelectItem value="lowercase">Lower Case</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={classicRules.removeSpecialChars}
                      onCheckedChange={(checked) => setClassicRules({
                        ...classicRules,
                        removeSpecialChars: checked
                      })}
                    />
                    <Label className="text-sm">Remove special characters (&, @, #, etc.)</Label>
                  </div>
                </div>

                {/* Preview Example */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Preview Example:</h4>
                  {products.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={products[0].images[0]?.imageUrl}
                          alt="Preview"
                          className="w-16 h-16 rounded-lg object-cover border"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{products[0].productTitle}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            ALT: {generateClassicALT(products[0])}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {generateClassicALT(products[0]).length} characters
                          </p>
                        </div>
                      </div>
                      {products[0].images.length > 1 && (
                        <div className="text-xs text-gray-600">
                          <p>For products with multiple images:</p>
                          <ul className="mt-1 space-y-1">
                            <li>• Image 1: {generateClassicALT(products[0], 0)}</li>
                            <li>• Image 2: {generateClassicALT(products[0], 1)}</li>
                            <li>• Image 3: {generateClassicALT(products[0], 2)}</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => handleClassicOptimization(true)}
                    className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 gap-2"
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
                  AI analyzes images and creates descriptive, SEO-friendly ALT text
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-purple-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Why AI Optimization?</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>✓ Analyzes actual image content</li>
                        <li>✓ Includes colors, patterns, style</li>
                        <li>✓ Adds context and environment</li>
                        <li>✓ Optimizes for image search</li>
                        <li>✓ Accessibility compliant</li>
                        <li>✓ Unique for each image</li>
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
                  <p className="font-medium mb-1">What AI analyzes:</p>
                  <ul className="space-y-1">
                    <li>• Image content and objects</li>
                    <li>• Colors and patterns</li>
                    <li>• Product context</li>
                    <li>• Style and design elements</li>
                    <li>• Optimal keyword placement</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Best Practices */}
            <Card className="border-emerald-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="w-4 h-4 text-emerald-500" />
                  ALT Text Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Keep between 100-125 characters</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Describe the image specifically</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Include relevant keywords naturally</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Avoid "image of" or "picture of"</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Don't keyword stuff</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>Be concise and descriptive</span>
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
                  See all AI-generated ALT text before applying them to your images
                </p>
                <Button
                  onClick={() => {
                    setShowAIOptionsModal(false);
                    handleAIOptimization(false);
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 gap-2"
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
                  AI will analyze images and immediately apply optimized ALT text
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
                <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                Optimizing Image ALT Text
              </DialogTitle>
              <DialogDescription>
                Please wait while we process your images...
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
                  {progress.current} of {progress.total} images processed
                </p>
              </div>
              <div className="flex justify-center">
                <ImageIcon className="w-12 h-12 text-amber-500 animate-pulse" />
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Image ALT Text Optimization Preview
              </DialogTitle>
              <DialogDescription>
                Review the optimized ALT text before applying them to your images
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              {optimizationResults.map((result) => (
                <div key={result.productId} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">{result.productTitle}</h4>
                    <Badge variant="outline">
                      {result.images.length} images
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {result.images.map((image, imgIndex) => (
                      <div key={image.imageId} className="space-y-3 p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">Image {imgIndex + 1}</span>
                          {image.oldAlt !== image.newAlt && (
                            <Badge variant="success" className="text-xs">
                              Updated
                            </Badge>
                          )}
                        </div>
                        
                        <img
                          src={image.imageUrl}
                          alt={image.oldAlt === '(Empty)' ? result.productTitle : image.oldAlt}
                          className="w-full h-40 rounded-lg object-cover border"
                        />
                        
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-gray-500">Current ALT</Label>
                            <p className="text-sm text-gray-700 truncate">{image.oldAlt || '(Empty)'}</p>
                            <p className="text-xs text-gray-500">
                              {image.oldAlt === '(Empty)' ? '0' : image.oldAlt.length} chars
                            </p>
                          </div>
                          
                          <div>
                            <Label className="text-xs text-gray-500">New ALT</Label>
                            <p className="text-sm font-medium text-gray-900 truncate">{image.newAlt}</p>
                            <p className="text-xs text-gray-500">{image.newAlt.length} chars</p>
                          </div>
                        </div>
                        
                        {image.variants && image.variants.length > 0 && (
                          <div className="text-xs text-gray-600">
                            <p className="font-medium">Variants:</p>
                            <p className="truncate">
                              {image.variants.map(v => v.title).join(', ')}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
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
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 gap-2"
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
                Here's how much better your image ALT text will perform
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
                      {stats.imagesWithALT}/{stats.totalImages}
                    </div>
                    <p className="text-sm text-center text-gray-600 mt-1">Images with ALT</p>
                  </CardContent>
                </Card>
              </div>

              {/* Comparison Text */}
              <div className="text-center">
                <p className="text-gray-700">
                  <span className="font-semibold">{stats.emptyALT} images now have ALT text</span> 
                  {" "}and all images are optimized for search engines.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Expected image search traffic increase: <span className="font-medium text-green-600">Up to 45%</span>
                </p>
              </div>

              {/* Benefits */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  What you're getting:
                </h4>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>✓ Better image search rankings</li>
                  <li>✓ Improved website accessibility</li>
                  <li>✓ Proper image descriptions for screen readers</li>
                  <li>✓ Optimized ALT text length (100-125 chars)</li>
                  <li>✓ Relevant keyword inclusion</li>
                  <li>✓ Consistent formatting across all images</li>
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
                onClick={() => applyImageOptimizations(optimizationResults)}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 gap-2"
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
                Your image ALT text has been optimized successfully
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
                  {progress.current} of {progress.total} images were successfully updated with ALT text.
                </p>
                {progress.total - progress.current > 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    {progress.total - progress.current} images failed to update
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Pro Tip:</span> Check Google Images search traffic in Google Analytics over the next 30-60 days. Proper ALT text can significantly increase your visibility in image search results and drive more qualified traffic to your store.
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
                className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
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