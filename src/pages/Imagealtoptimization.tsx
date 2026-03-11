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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  Filter,
  Rocket,
  Stars,
  Award,
  Trophy,
  RulerIcon,
  Search,
  MessageSquare,
  FileEdit,
  Image as ImageIcon,
  Camera,
  Type,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getApi, postApi } from "@/services/apiService";
import ApiConfig from "@/services/apiConfig";
import { useToast } from "@/components/ui/use-toast";

interface ImageData {
  _id: string;
  shopId: string;
  productId: string;
  imageId: string;
  imageUrl: string;
  altText: string;
  imageName: string;
  productTitle: string;
  variantId?: string;
  variantTitle?: string;
  inventoryItemId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProductGroup {
  productId: string;
  productTitle: string;
  images: ImageData[];
}

interface AIOptimizationResponse {
  applied?: boolean;
  productId: string;
  imageId: string;
  oldAlt: string;
  newAlt: string;
  characterCount: number;
  result?: {
    message: string;
    updatedCount: number;
    results: Array<{
      imageId: string;
      status: string;
    }>;
  };
}

interface OptimizationUpdate {
  productId: string;
  imageId: string;
  oldAlt: string;
  newAlt: string;
}

interface OptimizationUpdates {
  updates: OptimizationUpdate[];
}

interface UpdateResponse {
  message: string;
  updatedCount: number;
  results: Array<{
    imageId: string;
    status: string;
  }>;
}

export default function ImageOptimization() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [images, setImages] = useState<ImageData[]>([]);
  const [productGroups, setProductGroups] = useState<ProductGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<ProductGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Selection state
  const [selectedImages, setSelectedImages] = useState<Record<string, boolean>>({});
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});
  
  // Panel state
  const [activeProduct, setActiveProduct] = useState<ProductGroup | null>(null);
  
  // Modal states
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showAIOptionsModal, setShowAIOptionsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  
  // Optimization results
  const [optimizationResults, setOptimizationResults] = useState<Record<string, AIOptimizationResponse>>({});
  const [progress, setProgress] = useState({ current: 0, total: 0, status: "" });
  
  // Classic Rules State
  const [classicRules, setClassicRules] = useState({
    useProductTitle: true,
    prefix: { enabled: false, value: "" },
    suffix: { enabled: false, value: "" },
    maxLength: 125,
    removeSpecialChars: true,
    format: "sentence",
    applyToAllImages: true,
  });

  // Stats
  const [stats, setStats] = useState({
    totalImages: 0,
    imagesWithALT: 0,
    emptyALT: 0,
    averageLength: 0,
    seoScore: 0,
    improvement: 0,
    keywordInclusion: 0,
    variantImages: 0,
    altTextsWritten: 0,
  });

  useEffect(() => {
    fetchStoredImages();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [searchQuery, filterStatus, productGroups]);

  useEffect(() => {
    calculateStats();
  }, [images, optimizationResults]);

  const fetchStoredImages = async () => {
    try {
      setLoading(true);
      const response = await getApi(ApiConfig.getStoredImageAltProduct);
      const imagesData: ImageData[] = response || [];
      setImages(imagesData);
      
      // Group images by product
      const groups: Record<string, ProductGroup> = {};
      imagesData.forEach(image => {
        if (!groups[image.productId]) {
          groups[image.productId] = {
            productId: image.productId,
            productTitle: image.productTitle,
            images: []
          };
        }
        groups[image.productId].images.push(image);
      });
      
      const groupedProducts = Object.values(groups);
      setProductGroups(groupedProducts);
      setFilteredGroups(groupedProducts);
      
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: "Error",
        description: "Failed to fetch images",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...productGroups];
    
    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(group => 
        group.productTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.productId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(group => {
        const altCount = group.images.filter(img => 
          optimizationResults[img.imageId]?.newAlt || img.altText
        ).length;
        const totalImages = group.images.length;
        
        if (filterStatus === 'done') return altCount === totalImages && altCount > 0;
        if (filterStatus === 'pending') return altCount === 0;
        if (filterStatus === 'partial') return altCount > 0 && altCount < totalImages;
        return true;
      });
    }
    
    setFilteredGroups(filtered);
  };

  const calculateStats = () => {
    let totalImages = images.length;
    let imagesWithALT = 0;
    let totalLength = 0;
    let variantImages = 0;
    let altTextsWritten = 0;

    images.forEach(image => {
      if (image.variantId) variantImages++;
      
      const altText = optimizationResults[image.imageId]?.newAlt || image.altText || '';
      if (altText.trim()) {
        imagesWithALT++;
        totalLength += altText.length;
        altTextsWritten++;
      }
    });

    const emptyALT = totalImages - imagesWithALT;
    const avgLength = imagesWithALT > 0 ? Math.round(totalLength / imagesWithALT) : 0;
    
    setStats(prev => ({
      ...prev,
      totalImages,
      imagesWithALT,
      emptyALT,
      averageLength: avgLength,
      variantImages,
      altTextsWritten,
      seoScore: calculateSeoScore(imagesWithALT, totalImages, avgLength),
      keywordInclusion: calculateKeywordInclusion(),
    }));
  };

  const calculateSeoScore = (imagesWithAlt: number, totalImages: number, avgLength: number): number => {
    if (totalImages === 0) return 0;
    
    let score = 0;
    
    // Base score for having ALT text
    score += (imagesWithAlt / totalImages) * 40;
    
    // Length score
    if (avgLength >= 80 && avgLength <= 125) {
      score += 30;
    } else if (avgLength > 0) {
      score += 15;
    }
    
    // Keyword inclusion (simplified)
    score += (stats.keywordInclusion / 100) * 30;
    
    return Math.min(100, Math.round(score));
  };

  const calculateKeywordInclusion = (): number => {
    if (images.length === 0) return 0;
    
    let included = 0;
    
    images.forEach(image => {
      const altText = optimizationResults[image.imageId]?.newAlt || image.altText || '';
      if (image.productTitle && altText) {
        const titleWords = image.productTitle.toLowerCase().split(/\s+/).slice(0, 3);
        const containsKeyword = titleWords.some(word => 
          word.length > 3 && altText.toLowerCase().includes(word)
        );
        if (containsKeyword) included++;
      }
    });
    
    return Math.round((included / images.length) * 100);
  };

  const generateClassicALT = (image: ImageData): string => {
    const productTitle = image.productTitle || '';
    let altText = '';
    
    // Start with product title if enabled
    if (classicRules.useProductTitle && productTitle) {
      altText = productTitle;
      
      // Add variant info if available
      if (image.variantTitle) {
        altText += ` - ${image.variantTitle}`;
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
        altText = altText.charAt(0).toUpperCase() + altText.slice(1).toLowerCase();
        break;
      case 'lowercase':
        altText = altText.toLowerCase();
        break;
    }
    
    // Clean up extra spaces
    altText = altText.replace(/\s+/g, ' ').trim();
    
    // Truncate to max length
    if (altText.length > classicRules.maxLength) {
      altText = altText.substring(0, classicRules.maxLength).trim();
    }
    
    return altText;
  };

  const handleCopyTitleToProduct = async (productGroup: ProductGroup) => {
    const updates: OptimizationUpdate[] = [];
    
    productGroup.images.forEach(image => {
      const newAlt = generateClassicALT(image);
      const currentAlt = optimizationResults[image.imageId]?.newAlt || image.altText || '';
      if (newAlt && newAlt !== currentAlt) {
        updates.push({
          productId: image.productId,
          imageId: image.imageId,
          oldAlt: image.altText || '',
          newAlt: newAlt
        });
      }
    });

    if (updates.length === 0) {
      toast({
        title: "No changes",
        description: "All images already have ALT text",
      });
      return;
    }

    await applyUpdates(updates);
  };

  const handleAIOptimization = async (applyNow: boolean = false) => {
    const selectedImageIds = Object.keys(selectedImages).filter(id => selectedImages[id]);
    const selectedImageData = images.filter(img => selectedImageIds.includes(img.imageId));
    
    if (selectedImageData.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select at least one image to optimize",
        variant: "destructive",
      });
      return;
    }

    setShowAIOptionsModal(false);
    setShowProgressModal(true);
    
    setProgress({
      current: 0,
      total: selectedImageData.length,
      status: "Analyzing images with AI..."
    });

    const results: Record<string, AIOptimizationResponse> = {};

    for (let i = 0; i < selectedImageData.length; i++) {
      const image = selectedImageData[i];
      
      setProgress({
        current: i + 1,
        total: selectedImageData.length,
        status: `Optimizing: ${image.productTitle} (${i + 1}/${selectedImageData.length})`
      });

      try {
        const payload = {
          productId: image.productId,
          imageId: image.imageId,
          apply: applyNow
        };
        
        const response = await postApi(
          ApiConfig.aiImageOptimization,
          payload
        );

        results[image.imageId] = response;
        
        // Update local state with the new ALT text
        setOptimizationResults(prev => ({
          ...prev,
          [image.imageId]: response
        }));

      } catch (error) {
        console.error(`Error optimizing image ${image.imageId}:`, error);
        toast({
          title: "Error",
          description: `Failed to optimize ${image.productTitle}`,
          variant: "destructive",
        });
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setOptimizationResults(prev => ({ ...prev, ...results }));
    setShowProgressModal(false);

    if (applyNow) {
      // For direct apply, we need to collect all updates and send them in one batch
      const updates: OptimizationUpdate[] = [];
      
      Object.values(results).forEach(result => {
        if (result.newAlt && result.newAlt !== result.oldAlt) {
          updates.push({
            productId: result.productId,
            imageId: result.imageId,
            oldAlt: result.oldAlt,
            newAlt: result.newAlt
          });
        }
      });

      if (updates.length > 0) {
        await applyUpdates(updates);
      } else {
        setShowSuccessModal(true);
      }
    } else {
      // Show preview with results
      calculateComparisonStats();
      setShowPreviewModal(true);
    }
  };

  const applyUpdates = async (updates: OptimizationUpdate[]) => {
    if (updates.length === 0) return;

    setShowProgressModal(true);
    setProgress({
      current: 0,
      total: updates.length,
      status: "Applying ALT text to images..."
    });

    try {
      // Send all updates in one batch request with the correct structure
      const payload: OptimizationUpdates = {
        updates: updates
      };
      
      const response = await postApi(
        ApiConfig.updateImageOptimization,
        payload
      );

      setProgress({
        current: response.updatedCount,
        total: updates.length,
        status: "completed"
      });

      toast({
        title: "Success",
        description: `Updated ${response.updatedCount} images successfully`,
      });

      // Update local state with applied changes
      updates.forEach(update => {
        setOptimizationResults(prev => ({
          ...prev,
          [update.imageId]: {
            ...prev[update.imageId],
            applied: true,
            newAlt: update.newAlt,
            oldAlt: update.oldAlt
          } as AIOptimizationResponse
        }));
      });

      setShowSuccessModal(true);
      await fetchStoredImages(); // Refresh data
      
    } catch (error) {
      console.error('Error applying updates:', error);
      toast({
        title: "Error",
        description: "Failed to apply updates",
        variant: "destructive",
      });
    } finally {
      setShowProgressModal(false);
      setShowPreviewModal(false);
      setShowComparisonModal(false);
    }
  };

  const handleApplySelected = () => {
    const updates: OptimizationUpdate[] = [];
    
    Object.entries(optimizationResults).forEach(([imageId, result]) => {
      if (result.newAlt && result.newAlt !== result.oldAlt) {
        updates.push({
          productId: result.productId,
          imageId: result.imageId,
          oldAlt: result.oldAlt,
          newAlt: result.newAlt
        });
      }
    });

    if (updates.length > 0) {
      applyUpdates(updates);
    } else {
      toast({
        title: "No changes",
        description: "No changes to apply",
      });
    }
  };

  const calculateComparisonStats = () => {
    let totalOldLength = 0;
    let totalNewLength = 0;
    let emptyALT = 0;
    let totalImages = 0;
    let keywordInclusion = 0;

    Object.values(optimizationResults).forEach(result => {
      totalImages++;
      totalOldLength += result.oldAlt.length;
      totalNewLength += result.newAlt.length;
      
      if (!result.oldAlt) emptyALT++;
      
      // Check keyword inclusion
      const image = images.find(img => img.imageId === result.imageId);
      if (image?.productTitle && result.newAlt) {
        const titleWords = image.productTitle.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 3);
        if (titleWords.some(word => result.newAlt.toLowerCase().includes(word))) {
          keywordInclusion++;
        }
      }
    });

    const avgNewLength = totalNewLength / totalImages;
    const avgOldLength = totalOldLength / totalImages;
    
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

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => ({
      ...prev,
      [imageId]: !prev[imageId]
    }));
  };

  const toggleProductSelection = (productId: string) => {
    const group = productGroups.find(g => g.productId === productId);
    if (!group) return;
    
    const allSelected = group.images.every(img => selectedImages[img.imageId]);
    
    const newSelections = { ...selectedImages };
    group.images.forEach(img => {
      newSelections[img.imageId] = !allSelected;
    });
    
    setSelectedImages(newSelections);
  };

  const toggleAllSelection = () => {
    const allSelected = images.length > 0 && images.every(img => selectedImages[img.imageId]);
    
    const newSelections: Record<string, boolean> = {};
    images.forEach(img => {
      newSelections[img.imageId] = !allSelected;
    });
    
    setSelectedImages(newSelections);
  };

  const getSelectedCount = (): number => {
    return Object.values(selectedImages).filter(v => v).length;
  };

  const toggleProductExpansion = (productId: string) => {
    setExpandedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const getProductStatus = (group: ProductGroup): { type: string; label: string; count: string } => {
    const totalImages = group.images.length;
    const imagesWithAlt = group.images.filter(img => 
      optimizationResults[img.imageId]?.newAlt || img.altText
    ).length;
    
    if (imagesWithAlt === totalImages && totalImages > 0) {
      return { type: 'done', label: 'All written', count: `${imagesWithAlt}/${totalImages}` };
    } else if (imagesWithAlt > 0) {
      return { type: 'partial', label: 'Partial', count: `${imagesWithAlt}/${totalImages}` };
    } else {
      return { type: 'pending', label: 'No alt text', count: '' };
    }
  };

  if (loading) {
    return (
      <AppLayout title="Image ALT Text Optimization">
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
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
                <Button variant="outline" className="gap-2" onClick={() => setShowProductsModal(true)}>
                  <Eye className="w-4 h-4" />
                  {productGroups.length} Products
                </Button>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Products for Image Optimization</DialogTitle>
                    <DialogDescription>
                      {stats.totalImages} images across {productGroups.length} products
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    {productGroups.map((group) => (
                      <div key={group.productId} className="p-4 border rounded-lg">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => toggleProductExpansion(group.productId)}
                        >
                          <div className="flex items-center gap-3">
                            {group.images[0] && (
                              <img
                                src={group.images[0].imageUrl}
                                alt={group.productTitle}
                                className="w-12 h-12 rounded-lg object-cover border"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{group.productTitle}</p>
                              <p className="text-xs text-gray-500">
                                {group.images.length} images • {group.images.filter(img => img.altText).length} with ALT
                                {group.images.some(img => img.variantId) && ' • Has variants'}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            {expandedProducts[group.productId] ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        
                        {expandedProducts[group.productId] && (
                          <div className="mt-4 space-y-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {group.images.map((image, idx) => (
                                <div key={image.imageId} className="space-y-2">
                                  <img
                                    src={image.imageUrl}
                                    alt={image.altText || group.productTitle}
                                    className="w-full h-20 rounded-lg object-cover border"
                                  />
                                  <div className="text-xs">
                                    <p className="font-medium">Image {idx + 1}</p>
                                    {image.variantTitle && (
                                      <p className="text-xs text-purple-600">Variant: {image.variantTitle}</p>
                                    )}
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
                disabled={getSelectedCount() === 0}
              >
                <Brain className="w-4 h-4" />
                Start AI Optimization ({getSelectedCount()})
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
                Across {productGroups.length} products
              </div>
              <Progress 
                value={(stats.imagesWithALT / stats.totalImages) * 100 || 0} 
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

        {/* Selection Toolbar */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={images.length > 0 && images.every(img => selectedImages[img.imageId])}
              onCheckedChange={toggleAllSelection}
            />
            <span className="text-sm font-medium">Select All</span>
          </div>
          <div className="w-px h-6 bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{getSelectedCount()} images selected</span>
          </div>
          <div className="ml-auto flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const selectedGroups = productGroups.filter(group => 
                  group.images.some(img => selectedImages[img.imageId])
                );
                if (selectedGroups.length > 0) {
                  handleCopyTitleToProduct(selectedGroups[0]);
                }
              }}
              disabled={getSelectedCount() === 0}
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Title to Selected
            </Button>
          </div>
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
                  {images.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={images[0].imageUrl}
                          alt="Preview"
                          className="w-16 h-16 rounded-lg object-cover border"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{images[0].productTitle}</p>
                          {images[0].variantTitle && (
                            <p className="text-xs text-purple-600">Variant: {images[0].variantTitle}</p>
                          )}
                          <p className="text-sm text-gray-600 mt-1">
                            ALT: {generateClassicALT(images[0])}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {generateClassicALT(images[0]).length} characters
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      const selectedImageIds = Object.keys(selectedImages).filter(id => selectedImages[id]);
                      const selectedImageData = images.filter(img => selectedImageIds.includes(img.imageId));
                      if (selectedImageData.length > 0) {
                        const updates: OptimizationUpdate[] = selectedImageData.map(img => ({
                          productId: img.productId,
                          imageId: img.imageId,
                          oldAlt: img.altText || '',
                          newAlt: generateClassicALT(img)
                        }));
                        applyUpdates(updates);
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 gap-2"
                    disabled={getSelectedCount() === 0}
                  >
                    <Copy className="w-4 h-4" />
                    Apply Title to Selected
                  </Button>
                  <Button
                    onClick={() => {
                      const updates: OptimizationUpdate[] = images.map(img => ({
                        productId: img.productId,
                        imageId: img.imageId,
                        oldAlt: img.altText || '',
                        newAlt: generateClassicALT(img)
                      }));
                      applyUpdates(updates);
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Apply to All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Product List Table */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Products & Images</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        <SelectItem value="done">Fully Written</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="pending">No ALT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {filteredGroups.map((group) => {
                    const status = getProductStatus(group);
                    const allSelected = group.images.every(img => selectedImages[img.imageId]);
                    
                    return (
                      <div
                        key={group.productId}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          activeProduct?.productId === group.productId ? 'border-purple-500 bg-purple-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveProduct(group)}
                      >
                        <div className="flex items-center gap-3">
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={() => toggleProductSelection(group.productId)}
                            />
                          </div>
                          <div className="w-10 h-10 bg-gray-100 rounded-lg border flex items-center justify-center text-xl flex-shrink-0">
                            {group.images[0]?.imageUrl ? (
                              <img
                                src={group.images[0].imageUrl}
                                alt=""
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <ImageIcon className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{group.productTitle}</p>
                              {group.images.some(img => img.variantId) && (
                                <Badge variant="outline" className="text-xs">Has Variants</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {group.images.length} images • {group.images.filter(img => img.variantId).length} variants
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                              status.type === 'done'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : status.type === 'partial'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-gray-100 text-gray-500 border border-gray-200'
                            }`}>
                              {status.type === 'done' && <CheckCircle className="w-3 h-3" />}
                              {status.type === 'partial' && <Clock className="w-3 h-3" />}
                              {status.type === 'pending' && <AlertCircle className="w-3 h-3" />}
                              {status.count || status.label}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveProduct(group);
                                handleCopyTitleToProduct(group);
                              }}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - AI Optimization & Panel */}
          <div className="space-y-6">
            {/* AI Optimization Card */}
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
                  disabled={getSelectedCount() === 0}
                >
                  <Brain className="w-4 h-4" />
                  Start AI Optimization ({getSelectedCount()})
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

            {/* Active Product Panel */}
            {activeProduct && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Selected Product</span>
                    <Badge variant="outline">{activeProduct.images.length} images</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg border flex-shrink-0 overflow-hidden">
                      {activeProduct.images[0]?.imageUrl && (
                        <img
                          src={activeProduct.images[0].imageUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{activeProduct.productTitle}</p>
                      <p className="text-xs text-gray-500 truncate">{activeProduct.productId}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
                  {activeProduct.images.map((image, idx) => {
                    const result = optimizationResults[image.imageId];
                    const currentAlt = result?.newAlt || image.altText || '';
                    
                    return (
                      <div key={image.imageId} className="flex items-start gap-2 p-2 border rounded-lg hover:bg-gray-50">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedImages[image.imageId] || false}
                            onCheckedChange={() => toggleImageSelection(image.imageId)}
                          />
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded border flex-shrink-0 overflow-hidden">
                          <img
                            src={image.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-medium">Image {idx + 1}</p>
                            {image.variantTitle && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {image.variantTitle}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {currentAlt || 'No ALT text'}
                          </p>
                          {result && (
                            <p className="text-[10px] text-green-600 mt-1">
                              {result.characterCount} chars
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            const updates: OptimizationUpdate[] = [{
                              productId: image.productId,
                              imageId: image.imageId,
                              oldAlt: image.altText || '',
                              newAlt: generateClassicALT(image)
                            }];
                            applyUpdates(updates);
                          }}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

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
                Choose how you want to apply AI optimization to {getSelectedCount()} selected images
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
                  onClick={() => handleAIOptimization(false)}
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
                  onClick={() => handleAIOptimization(true)}
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
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Image ALT Text Optimization Preview
              </DialogTitle>
              <DialogDescription>
                Review the optimized ALT text before applying them to your images
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {Object.values(optimizationResults).map((result) => {
                const image = images.find(img => img.imageId === result.imageId);
                if (!image) return null;
                
                return (
                  <div key={result.imageId} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-4">
                      <img
                        src={image.imageUrl}
                        alt=""
                        className="w-24 h-24 rounded-lg object-cover border"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{image.productTitle}</h4>
                          {image.variantTitle && (
                            <Badge variant="outline">{image.variantTitle}</Badge>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-gray-500">Current ALT</Label>
                            <p className="text-sm text-gray-700">{result.oldAlt || '(Empty)'}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">New ALT</Label>
                            <p className="text-sm font-medium text-purple-700">{result.newAlt}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {result.characterCount} characters
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                  calculateComparisonStats();
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
                onClick={handleApplySelected}
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
                  fetchStoredImages();
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